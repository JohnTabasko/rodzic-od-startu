/**
 * Rodzic od Startu — backend v0.5
 * Persystencja: PostgreSQL (DATABASE_URL) / JSON dev. Auth: JWT (HS256 dev → OIDC docelowo).
 * Sync wspólnych danych: merge per-rekord last-write-wins + TOMBSTONE przy usunięciu.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { makeStorage, Storage, User, SharedEvent, Role } from './storage';
import { signToken, verifyToken, hashToken } from './auth';
import { verifySocial, Provider } from './oidc';
import { answer, logAsk } from './assistant';
import { GROUPS, addPost, listPosts, moderationQueue, setStatus } from './community';

const storage: Storage = makeStorage();
const uid = (n = 10) => crypto.randomBytes(n).toString('base64url').slice(0, n).toUpperCase();
const now = () => new Date().toISOString();

const app = express();

// ---- Hardening ----
app.use(helmet()); // nagłówki bezpieczeństwa (XCTO, XFO, Referrer-Policy…)
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '512kb' }));

const jsonErr = (error: string) => ({ error });
app.use('/api', rateLimit({ // limit ogólny API
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  message: jsonErr('RATE_LIMITED'),
}));
const strict = (max: number, windowMs = 60 * 1000) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: jsonErr('RATE_LIMITED') });

async function auth(req: express.Request, res: express.Response): Promise<User | null> {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) { res.status(401).json({ error: 'UNAUTHORIZED' }); return null; }
  const user = await storage.getUserByTokenHash(hashToken(token));
  if (!user) { res.status(401).json({ error: 'UNAUTHORIZED' }); return null; }
  return user;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: now(), storage: process.env.DATABASE_URL ? 'postgresql' : 'json' }));

app.post('/api/auth/anon', strict(10), async (req, res) => {
  const role: Role = ['mother', 'father'].includes(req.body?.role) ? req.body.role : 'other';
  const user: User = { id: uid(12), role, createdAt: now() };
  const token = signToken(user.id, role);
  await storage.createUser(user, hashToken(token)); // w bazie tylko hash tokenu
  res.json({ userId: user.id, token, role: user.role, expiresInDays: 90 });
});

// Apple/Google Sign-In (OIDC): id_token → find-or-create → nasz JWT.
// Świeże konto → onboarding w aplikacji (rola wybierana po stronie klienta).
app.post('/api/auth/social', strict(10), async (req, res) => {
  try {
    const provider = req.body?.provider as Provider;
    const idToken = String(req.body?.idToken ?? '');
    if (!['google', 'apple'].includes(provider) || !idToken) return res.status(400).json({ error: 'BAD_REQUEST' });
    const identity = await verifySocial(provider, idToken);
    let user = await storage.findUserByExternal(identity.sub);
    if (!user) {
      user = { id: uid(12), role: 'other', createdAt: now(), provider, externalSub: identity.sub, email: identity.email };
    }
    const token = signToken(user.id, user.role);
    await storage.createUser(user, hashToken(token)); // dla istniejącego: w JSON nadpisuje (ten sam id)
    res.json({ userId: user.id, token, role: user.role, isNew: !user.externalSub });
  } catch (e) {
    res.status(401).json({ error: 'SOCIAL_AUTH_FAILED' });
  }
});

// ---- Parowanie ----
app.post('/api/pair/create', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  if (await storage.coupleOfUser(user.id)) return res.status(409).json({ error: 'ALREADY_PAIRED' });
  const couple = { id: uid(8), code: uid(6), memberIds: [user.id] };
  await storage.createCouple(couple);
  res.json({ coupleId: couple.id, code: couple.code });
});

app.post('/api/pair/join', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  const code = String(req.body?.code ?? '').toUpperCase().trim();
  const couple = await storage.findCoupleByCode(code);
  if (!couple) return res.status(404).json({ error: 'CODE_NOT_FOUND' });
  if (couple.memberIds.includes(user.id)) return res.json({ coupleId: couple.id });
  if (couple.memberIds.length >= 2) return res.status(409).json({ error: 'COUPLE_FULL' });
  await storage.addMember(couple.id, user.id);
  res.json({ coupleId: couple.id });
});

app.get('/api/pair/status', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  const couple = await storage.coupleOfUser(user.id);
  if (!couple) return res.json({ paired: false });
  const partnerIds = couple.memberIds.filter(id => id !== user.id);
  res.json({ paired: couple.memberIds.length === 2, coupleId: couple.id, code: couple.code, partnerMember: partnerIds.length });
});

app.post('/api/pair/leave', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  const couple = await storage.coupleOfUser(user.id);
  if (couple) await storage.removeMember(couple.id, user.id);
  res.json({ ok: true });
});

// ---- Sync (z tombstone) ----
const withCouple = async (req: express.Request, res: express.Response) => {
  const user = await auth(req, res); if (!user) return null;
  const couple = await storage.coupleOfUser(user.id);
  if (!couple) { res.status(409).json({ error: 'NOT_PAIRED' }); return null; }
  return { user, couple };
};

app.put('/api/sync/events', async (req, res) => {
  const ctx = await withCouple(req, res); if (!ctx) return;
  const incoming: SharedEvent[] = Array.isArray(req.body?.events) ? req.body.events : [];
  const valid = incoming.filter(e => e?.id && e.updatedAt);
  // deleteIds z klienta → tombstone (propagacja usunięcia do partnera)
  const tombs: SharedEvent[] = (Array.isArray(req.body?.deletedIds) ? req.body.deletedIds : [])
    .map((id: string) => ({ id, title: '', date: '', updatedAt: now(), deleted: true }));
  const applied = await storage.upsertEvents(ctx.couple.id, [...valid, ...tombs]);
  res.json({ applied });
});

app.get('/api/sync/events', async (req, res) => {
  const ctx = await withCouple(req, res); if (!ctx) return;
  const since = String(req.query.since ?? '');
  res.json({ events: await storage.listEvents(ctx.couple.id, since || undefined) });
});

app.put('/api/sync/checklist', async (req, res) => {
  const ctx = await withCouple(req, res); if (!ctx) return;
  const applied = await storage.mergeChecklist(ctx.couple.id, req.body?.done ?? {}, req.body?.updatedAt ?? {});
  res.json({ applied });
});

app.get('/api/sync/checklist', async (req, res) => {
  const ctx = await withCouple(req, res); if (!ctx) return;
  res.json({ done: await storage.getChecklist(ctx.couple.id) });
});

// ---- Asystent AI (krok RAG: baza wiedzy + cytaty + log jakości) ----
app.post('/api/assistant/ask', strict(20), async (req, res) => {
  const q = String(req.body?.question ?? '').slice(0, 1000);
  if (!q.trim()) return res.status(400).json({ error: 'EMPTY_QUESTION' });
  const t0 = Date.now();
  const result = await answer(q);
  logAsk(q, result, Date.now() - t0);
  res.json(result);
});

// ---- Społeczność (moderacja hybrydowa) ----
app.get('/api/community/groups', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  res.json({ groups: GROUPS });
});

app.get('/api/community/groups/:id/posts', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  if (!GROUPS.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'GROUP_NOT_FOUND' });
  res.json({ posts: listPosts(req.params.id).map(({ authorIdHash, authorRole, text, createdAt, id }) => ({ id, authorIdHash, authorRole, text, createdAt })) });
});

app.post('/api/community/groups/:id/posts', strict(10), async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  if (!GROUPS.find(g => g.id === req.params.id)) return res.status(404).json({ error: 'GROUP_NOT_FOUND' });
  const text = String(req.body?.text ?? '').trim();
  if (text.length < 3) return res.status(400).json({ error: 'TEXT_TOO_SHORT' });
  const post = addPost(req.params.id, user.id, user.role, text);
  res.status(201).json({
    id: post.id, status: post.status,
    notice: post.status === 'flagged'
      ? 'Twoja wiadomość wygląda na poradę medyczną — trafiła do zespołu. Porady medyczne znajdziesz w zakładce Wiedza lub u lekarza.'
      : undefined,
  });
});

// Kolejka moderacyjna: nagłówek x-admin-token (env ADMIN_TOKEN)
const admin = (req: express.Request, res: express.Response): boolean => {
  const ok = process.env.ADMIN_TOKEN && req.headers['x-admin-token'] === process.env.ADMIN_TOKEN;
  if (!ok) res.status(403).json({ error: 'FORBIDDEN' });
  return !!ok;
};
app.get('/api/moderation/queue', (req, res) => { if (admin(req, res)) res.json({ queue: moderationQueue() }); });
app.post('/api/moderation/:id', (req, res) => {
  if (!admin(req, res)) return;
  const action = req.body?.action;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'BAD_ACTION' });
  const post = setStatus(req.params.id, action === 'approve' ? 'approved' : 'rejected');
  if (!post) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ id: post.id, status: post.status });
});

app.delete('/api/account', async (req, res) => {
  const user = await auth(req, res); if (!user) return;
  await storage.deleteUser(user.id);
  res.json({ ok: true });
});

// Nieznana trasa → spójny JSON, bez leaku stacka
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
// Globalny handler błędów
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'INTERNAL' });
});

const PORT = process.env.PORT ?? 3000;
(async () => {
  if (storage instanceof (require('./storage').PgStorage)) await (storage as any).migrate();
  app.listen(PORT, () => console.log(`API → http://localhost:${PORT}/api/health`));
})();
