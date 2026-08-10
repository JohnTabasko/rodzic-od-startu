/**
 * Retrieval dla asystenta (krok przed pełnym pgvector):
 *  - lokalny wektoryzator n-gramów (dim 384) — działa offline, odporny na literówki/parafrazy
 *  - jeśli OPENAI_API_KEY: prawdziwe embeddingi text-embedding-3-small (z cache w RAM)
 * Interfejs jest zgodny z docelowym SELECT … ORDER BY embedding <=> $1 z pgvector.
 */
import { KB, KbDoc } from './knowledge';

const DIM = 384;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-ząćęłńóśźż0-9\s]/gi, ' ').split(/\s+/).filter(w => w.length > 1);
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function embedLocal(text: string): number[] {
  const v = new Array<number>(DIM).fill(0);
  for (const t of tokenize(text)) {
    v[hash('w:' + t) % DIM] += 1;
    for (let i = 0; i < t.length - 2; i++) v[hash('g:' + t.slice(i, i + 3)) % DIM] += 0.6;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map(x => x / norm);
}
export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Bonus słownikowy: zapytanie trafiło w słowa klucze dokumentu. */
function kwBoost(question: string, d: KbDoc): number {
  const matched = d.keywords.reduce((s, k) => s + (question.includes(k) ? k.length : 0), 0);
  return Math.min(1, matched / 12);
}

// --- Docelowo OpenAI embeddings (opcjonalne, cache'owane) ---
const embCache = new Map<string, number[]>();
async function embedOpenAI(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const hit = embCache.get(text);
  if (hit) return hit;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json() as any;
    const vec: number[] = json?.data?.[0]?.embedding ?? null;
    if (vec) embCache.set(text, vec);
    return vec;
  } catch { return null; }
}

const docText = (d: KbDoc) => `${d.title}. ${d.keywords.join(', ')}. ${d.answer}`;
const localDocEmb = new Map<string, number[]>(KB.map(d => [d.id, embedLocal(docText(d))]));

export interface Retrieved { doc: KbDoc; score: number; engine: 'local' | 'openai'; }

export async function retrieve(question: string): Promise<Retrieved[]> {
  // Najpierw spróbuj OpenAI (jeśli klucz); w razie czego lokalne wektory
  const qOA = await embedOpenAI(question);
  if (qOA) {
    const scored: Retrieved[] = [];
    for (const d of KB) {
      const dOA = await embedOpenAI(docText(d));
      if (!dOA) break;
      scored.push({ doc: d, score: Math.max(cosine(qOA, dOA), 0.6 * cosine(qOA, dOA) + 0.4 * kwBoost(question, d)), engine: 'openai' });
    }
    if (scored.length === KB.length) return scored.sort((a, b) => b.score - a.score);
  }
  const q = embedLocal(question);
  return KB.map(d => {
    const sim = cosine(q, localDocEmb.get(d.id)!);
    const score = Math.max(sim, 0.6 * sim + 0.4 * kwBoost(question, d));
    return { doc: d, score, engine: 'local' as const };
  }).sort((a, b) => b.score - a.score);
}
