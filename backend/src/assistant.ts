// Asystent: guardrails (twarde) → retrieval semantyczny → (opcjonalnie LLM) → odpowiedź z cytatem.
// Log jakości JSONL: hash pytania, docId, tryb, score, latency — bez treści pytania (RODO).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SAFETY_KEYWORDS, CRISIS_TEXT, FALLBACK_TEXT } from './knowledge';
import { retrieve } from './retrieval';

export interface AskResult {
  answer: string;
  source: string;
  docId: string | null;
  reviewedAt: string | null;
  isSafety: boolean;
  mode?: 'crisis' | 'extractive' | 'llm' | 'fallback';
  score?: number;
}

const LOG_FILE = path.join(process.cwd(), 'assistant.log');
const THRESHOLD = 0.28; // min. score dopasowania (kalibrowane testem E2E)

function makeExtractive(top: NonNullable<Awaited<ReturnType<typeof retrieve>>[0]>): AskResult {
  return {
    answer: top.doc.answer,
    source: `${top.doc.source} · ${top.doc.title}`,
    docId: top.doc.id, reviewedAt: top.doc.reviewedAt,
    isSafety: false, mode: 'extractive', score: top.score,
  };
}

/** Opcjonalny LLM: wymusza odpowiedź WYŁĄCZNIE z dokumentu + cytat [docId]. */
async function askLLM(question: string, top: NonNullable<Awaited<ReturnType<typeof retrieve>>[0]>): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: 'system', content:
            'Jesteś asystentem rodziców w aplikacji "Rodzic od Startu". ' +
            'Odpowiadaj po polsku, ciepło i zwięźle (max 120 słów), WYŁĄCZNIE na podstawie DOKUMENTU poniżej. ' +
            'Nie diagnozuj, nie podawaj dawek leków. Jeśli dokument nie zawiera odpowiedzi, powiedz wprost i zasugeruj kontakt z lekarzem/położną. ' +
            'Na końcu odpowiedzi ZAWSZE dopisz linię: Źródło: ' + top.doc.id },
          { role: 'user', content: `DOKUMENT (${top.doc.title}, recenzja ${top.doc.reviewedAt}):\n${top.doc.answer}\n\nPYTANIE: ${question}` },
        ],
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json() as any;
    const text: string = json?.choices?.[0]?.message?.content ?? '';
    return text.trim() || null; // wymuszony cytat docId jest częścią promptu
  } catch { return null; }
}

export async function answer(question: string): Promise<AskResult> {
  const q = question.toLowerCase();
  // 1) Guardrails mają zawsze pierwszeństwo
  if (SAFETY_KEYWORDS.some(k => q.includes(k))) {
    return { answer: CRISIS_TEXT, source: 'Protokół bezpieczeństwa', docId: 'kb-crisis', reviewedAt: null, isSafety: true, mode: 'crisis', score: 1 };
  }
  // 2) Retrieval semantyczny
  const [top] = await retrieve(q);
  if (!top || top.score < THRESHOLD) {
    return { answer: FALLBACK_TEXT, source: 'Asystent (brak dopasowania)', docId: null, reviewedAt: null, isSafety: false, mode: 'fallback', score: top?.score };
  }
  // 3) Opcjonalny LLM nad pobranym dokumentem; w razie czego — ekstrakcyjna odpowiedź
  const llm = await askLLM(question, top);
  if (llm) {
    return {
      answer: llm.replace(/Źródło:.*$/s, '').trim(),
      source: `${top.doc.source} · ${top.doc.title} · AI (na bazie zweryfikowanego dokumentu)`,
      docId: top.doc.id, reviewedAt: top.doc.reviewedAt,
      isSafety: false, mode: 'llm', score: top.score,
    };
  }
  return makeExtractive(top);
}

export function logAsk(question: string, result: AskResult, latencyMs: number): void {
  const entry = {
    ts: new Date().toISOString(),
    q_hash: crypto.createHash('sha256').update(question.trim().toLowerCase()).digest('hex').slice(0, 16),
    docId: result.docId, isSafety: result.isSafety,
    mode: result.mode, score: result.score ? Math.round(result.score * 1000) / 1000 : null,
    latencyMs,
  };
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n'); } catch { /* nieblokująco */ }
}
