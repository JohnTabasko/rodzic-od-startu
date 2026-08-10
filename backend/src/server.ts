import crypto from 'node:crypto';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { answer, logAsk } from './assistant';
import { signToken, verifyToken, hashToken, bearerToken } from './auth';
import { config } from './config';
import { GROUPS, addPost, listPosts, moderationQueue, setStatus } from './community';
import { verifySocial } from './oidc';
import type { Provider } from './oidc';
import { makeStorage, PgStorage } from './storage';
import type { Role, SharedEvent, Storage, User } from './storage';
import {
  isValidISODateTime,
  validateChecklist,
  validateDeletedIds,
  validatePostText,
  validateSharedEvent,
} from './validation';

const API_PREFIX = '/api';
const PAIR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const defaultStorage = makeStorage(config.databaseUrl);

function now(): string {
  return new Date().toISOString();
}

function id(length = 10): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length).toUpperCase();
}

function pairCode(length = 6): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += PAIR_ALPHABET[crypto.randomInt(PAIR_ALPHABET.length)];
  }
  return code;
}

function jsonError(error: string): { error: string } {
  return { error };
}

function rateLimiter(max: number, windowMs = 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonError('RATE_LIMITED'),
  });
}

function isAdmin(req: Request, res: Response): boolean {
  const expected = config.adminToken;
  const provided = String(req.headers['x-admin-token'] ?? '');
  if (!expected || !provided) {
    res.status(403).json(jsonError('FORBIDDEN'));
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const validLength = expectedBuffer.length === providedBuffer.length;
  const validToken = validLength && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  if (!validToken) res.status(403).json(jsonError('FORBIDDEN'));
  return validToken;
}

async function authenticate(req: Request, res: Response, storage: Storage): Promise<User | null> {
  const token = bearerToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  if (!token || !payload) {
    res.status(401).json(jsonError('UNAUTHORIZED'));
    return null;
  }

  const user = await storage.getUserByTokenHash(hashToken(token));
  if (!user || user.id !== payload.sub) {
    res.status(401).json(jsonError('UNAUTHORIZED'));
    return null;
  }
  return user;
}

async function pairedContext(
  req: Request,
  res: Response,
  storage: Storage,
): Promise<{
  user: User;
  couple: NonNullable<Awaited<ReturnType<Storage['coupleOfUser']>>>;
} | null> {
  const user = await authenticate(req, res, storage);
  if (!user) return null;

  const couple = await storage.coupleOfUser(user.id);
  if (!couple || couple.memberIds.length !== 2) {
    res.status(409).json(jsonError('NOT_PAIRED'));
    return null;
  }
  return { user, couple };
}

export function createApp(storage: Storage = defaultStorage): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.nodeEnv === 'production' ? 1 : 0);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins === '*' ? true : config.corsOrigins,
    }),
  );
  app.use(express.json({ limit: '512kb' }));
  app.use(
    API_PREFIX,
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: jsonError('RATE_LIMITED'),
    }),
  );

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json({
      ok: true,
      ts: now(),
      storage: storage instanceof PgStorage ? 'postgresql' : 'json',
    });
  });

  app.post(`${API_PREFIX}/auth/anon`, rateLimiter(10), async (req, res, next) => {
    try {
      const role: Role = ['mother', 'father'].includes(req.body?.role) ? req.body.role : 'other';
      const user: User = { id: id(12), role, createdAt: now() };
      const token = signToken(user.id, role);
      await storage.saveUser(user, hashToken(token));
      res.status(201).json({ userId: user.id, token, role: user.role, expiresInDays: 90 });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/auth/social`, rateLimiter(10), async (req, res) => {
    try {
      const provider = req.body?.provider as Provider;
      const idToken = String(req.body?.idToken ?? '');
      if (!['google', 'apple'].includes(provider) || !idToken) {
        res.status(400).json(jsonError('BAD_REQUEST'));
        return;
      }

      const identity = await verifySocial(provider, idToken);
      const existing = await storage.findUserByExternal(identity.sub);
      const isNew = !existing;
      const user: User = existing ?? {
        id: id(12),
        role: 'other',
        createdAt: now(),
        provider,
        externalSub: identity.sub,
        email: identity.email,
      };
      const token = signToken(user.id, user.role);
      await storage.saveUser(user, hashToken(token));
      res.json({ userId: user.id, token, role: user.role, isNew });
    } catch (error) {
      // Do not expose provider verification details to clients.
      console.warn('Social authentication failed:', error);
      res.status(401).json(jsonError('SOCIAL_AUTH_FAILED'));
    }
  });

  app.post(`${API_PREFIX}/pair/create`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      if (await storage.coupleOfUser(user.id)) {
        res.status(409).json(jsonError('ALREADY_PAIRED'));
        return;
      }

      let code = pairCode();
      for (let attempt = 0; attempt < 5 && (await storage.findCoupleByCode(code)); attempt += 1) {
        code = pairCode();
      }
      if (await storage.findCoupleByCode(code)) {
        res.status(503).json(jsonError('PAIRING_UNAVAILABLE'));
        return;
      }

      const couple = { id: id(8), code, memberIds: [user.id] };
      await storage.createCouple(couple);
      res.status(201).json({ coupleId: couple.id, code: couple.code, memberCount: 1 });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/pair/join`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      const code = String(req.body?.code ?? '')
        .toUpperCase()
        .trim();
      if (!/^[A-Z2-9]{6}$/.test(code)) {
        res.status(400).json(jsonError('INVALID_PAIR_CODE'));
        return;
      }

      const existingUserCouple = await storage.coupleOfUser(user.id);
      if (existingUserCouple) {
        res.status(409).json(jsonError('ALREADY_PAIRED'));
        return;
      }

      const couple = await storage.findCoupleByCode(code);
      if (!couple) {
        res.status(404).json(jsonError('CODE_NOT_FOUND'));
        return;
      }
      if (couple.memberIds.length >= 2) {
        res.status(409).json(jsonError('COUPLE_FULL'));
        return;
      }

      await storage.addMember(couple.id, user.id);
      const joined = await storage.coupleOfUser(user.id);
      res.json({ coupleId: couple.id, memberCount: joined?.memberIds.length ?? 2 });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/pair/status`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      const couple = await storage.coupleOfUser(user.id);
      if (!couple) {
        res.json({ paired: false, memberCount: 0, partnerRole: null });
        return;
      }

      const partnerId = couple.memberIds.find((memberId) => memberId !== user.id);
      const partner = partnerId ? await storage.getUserById(partnerId) : null;
      res.json({
        paired: couple.memberIds.length === 2,
        memberCount: couple.memberIds.length,
        coupleId: couple.id,
        code: couple.code,
        partnerRole: partner?.role ?? null,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/pair/leave`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      const couple = await storage.coupleOfUser(user.id);
      if (couple) await storage.removeMember(couple.id, user.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.put(`${API_PREFIX}/sync/events`, async (req, res, next) => {
    try {
      const context = await pairedContext(req, res, storage);
      if (!context) return;

      const incoming = req.body?.events;
      const deletedIds = req.body?.deletedIds ?? [];
      if (
        !Array.isArray(incoming) ||
        incoming.length > 100 ||
        !incoming.every((event: unknown) => validateSharedEvent(event)) ||
        !validateDeletedIds(deletedIds)
      ) {
        res.status(400).json(jsonError('INVALID_EVENTS'));
        return;
      }

      const tombstones: SharedEvent[] = deletedIds.map((eventId: string) => ({
        id: eventId,
        title: '',
        date: '',
        updatedAt: now(),
        deleted: true,
      }));
      const applied = await storage.upsertEvents(context.couple.id, [...incoming, ...tombstones]);
      res.json({ applied });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/sync/events`, async (req, res, next) => {
    try {
      const context = await pairedContext(req, res, storage);
      if (!context) return;
      const since = String(req.query.since ?? '');
      if (since && !isValidISODateTime(since)) {
        res.status(400).json(jsonError('INVALID_SINCE'));
        return;
      }
      res.json({ events: await storage.listEvents(context.couple.id, since || undefined) });
    } catch (error) {
      next(error);
    }
  });

  app.put(`${API_PREFIX}/sync/checklist`, async (req, res, next) => {
    try {
      const context = await pairedContext(req, res, storage);
      if (!context) return;
      const done = req.body?.done;
      const updatedAt = req.body?.updatedAt;
      if (
        !validateChecklist(done, updatedAt) ||
        Object.keys(done).length > 200 ||
        Object.keys(updatedAt).length > 200
      ) {
        res.status(400).json(jsonError('INVALID_CHECKLIST'));
        return;
      }
      const applied = await storage.mergeChecklist(context.couple.id, done, updatedAt);
      res.json({ applied });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/sync/checklist`, async (req, res, next) => {
    try {
      const context = await pairedContext(req, res, storage);
      if (!context) return;
      res.json({ done: await storage.getChecklist(context.couple.id) });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/assistant/ask`, rateLimiter(20), async (req, res, next) => {
    try {
      const question = String(req.body?.question ?? '').trim();
      if (!question) {
        res.status(400).json(jsonError('EMPTY_QUESTION'));
        return;
      }
      if (question.length > 1000) {
        res.status(400).json(jsonError('QUESTION_TOO_LONG'));
        return;
      }

      const startedAt = Date.now();
      const result = await answer(question);
      logAsk(question, result, Date.now() - startedAt);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/community/groups`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      res.json({ groups: GROUPS });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/community/groups/:id/posts`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      if (!GROUPS.some((group) => group.id === req.params.id)) {
        res.status(404).json(jsonError('GROUP_NOT_FOUND'));
        return;
      }
      res.json({
        posts: listPosts(req.params.id).map(
          ({ authorIdHash, authorRole, text, createdAt, id }) => ({
            id,
            authorIdHash,
            authorRole,
            text,
            createdAt,
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${API_PREFIX}/community/groups/:id/posts`, rateLimiter(10), async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      if (!GROUPS.some((group) => group.id === req.params.id)) {
        res.status(404).json(jsonError('GROUP_NOT_FOUND'));
        return;
      }
      const text = String(req.body?.text ?? '').trim();
      if (!validatePostText(text)) {
        res.status(400).json(jsonError('INVALID_POST'));
        return;
      }

      const post = addPost(req.params.id, user.id, user.role, text);
      res.status(201).json({
        id: post.id,
        status: post.status,
        notice:
          post.status === 'flagged'
            ? 'Twoja wiadomość wygląda na poradę medyczną — trafiła do zespołu. Porady medyczne znajdziesz w zakładce Wiedza lub u lekarza.'
            : undefined,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get(`${API_PREFIX}/moderation/queue`, (req, res) => {
    if (isAdmin(req, res)) res.json({ queue: moderationQueue() });
  });

  app.post(`${API_PREFIX}/moderation/:id`, (req, res) => {
    if (!isAdmin(req, res)) return;
    const action = req.body?.action;
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json(jsonError('BAD_ACTION'));
      return;
    }
    const post = setStatus(req.params.id, action === 'approve' ? 'approved' : 'rejected');
    if (!post) {
      res.status(404).json(jsonError('NOT_FOUND'));
      return;
    }
    res.json({ id: post.id, status: post.status });
  });

  app.delete(`${API_PREFIX}/account`, async (req, res, next) => {
    try {
      const user = await authenticate(req, res, storage);
      if (!user) return;
      await storage.deleteUser(user.id);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => res.status(404).json(jsonError('NOT_FOUND')));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json(jsonError('INVALID_JSON'));
      return;
    }
    console.error('Unhandled error:', error);
    res.status(500).json(jsonError('INTERNAL'));
  });

  return app;
}

export const app = createApp();

export async function startServer(): Promise<ReturnType<express.Express['listen']>> {
  if (defaultStorage instanceof PgStorage) await defaultStorage.migrate();
  return app.listen(config.port, '0.0.0.0', () => {
    console.log(`API → http://0.0.0.0:${config.port}${API_PREFIX}/health`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start API:', error);
    process.exitCode = 1;
  });
}
