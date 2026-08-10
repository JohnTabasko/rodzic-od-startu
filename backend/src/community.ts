/**
 * Społeczność (dokument §5.10): grupy tematyczne + moderacja hybrydowa.
 * Zasada z dokumentu: „zero porad medycznych od użytkowników" — automoderacja
 * wykrywa treści wyglądające na medyczne i kieruje je do kolejki moderatora.
 * Persystencja demo: community.json (docelowo: tabele w PostgreSQL).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Group { id: string; name: string; description: string; }
export interface Post {
  id: string; groupId: string; authorIdHash: string; authorRole: string;
  text: string; status: 'pending' | 'approved' | 'flagged' | 'rejected';
  flags: string[]; createdAt: string;
}

export const GROUPS: Group[] = [
  { id: 'pierwsze-dziecko', name: '👶 Pierwsze dziecko', description: 'Pytania i wsparcie dla debiutujących rodziców' },
  { id: 'tata-strefa', name: '👨 Tata strefa', description: 'Ojcostwo po męsku — bez tabu' },
  { id: 'pokarm', name: '🍼 Karmienie', description: 'Piersią, mieszanką, BLW — doświadczenia, nie porady medyczne' },
  { id: 'sen', name: '😴 Sen', description: 'Nocne zmiany i rytuały usypiania' },
];

const FILE = path.join(process.cwd(), 'community.json');
let posts: Post[] = [];
try { posts = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* pusto */ }
const save = () => fs.writeFileSync(FILE, JSON.stringify(posts, null, 2));

// Automoderacja: wzorce porad medycznych i treści niedozwolonych
const MEDICAL_PATTERNS = [
  /\d+\s*(mg|ml|tablet)/i, /weź|zażyj|podaj\s+lek/i, /paracetamol|ibuprofen|antybiotyk/i,
  /nie musisz iść do lekarza/i, /zamiast szczepi/i,
];
const ABUSE_PATTERNS = [/idiot|debil|głupia\b|się zabij innym/i];

export function autoModerate(text: string): { status: Post['status']; flags: string[] } {
  const flags: string[] = [];
  if (MEDICAL_PATTERNS.some(p => p.test(text))) flags.push('medical_advice');
  if (ABUSE_PATTERNS.some(p => p.test(text))) flags.push('abuse');
  if (flags.length) return { status: 'flagged', flags };   // do człowieka-moderatora
  return { status: 'approved', flags };                    // automatyczna pre-moderacja
}

export function addPost(groupId: string, authorId: string, authorRole: string, text: string): Post {
  const { status, flags } = autoModerate(text);
  const post: Post = {
    id: crypto.randomBytes(6).toString('base64url').toUpperCase(),
    groupId,
    authorIdHash: crypto.createHash('sha256').update(authorId).digest('hex').slice(0, 10), // pseudonim dla innych użytkowników
    authorRole, text: text.slice(0, 2000), status, flags, createdAt: new Date().toISOString(),
  };
  posts.push(post);
  save();
  return post;
}

export function listPosts(groupId: string): Post[] {
  return posts.filter(p => p.groupId === groupId && p.status === 'approved')
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 50);
}
export function moderationQueue(): Post[] { return posts.filter(p => p.status === 'flagged' || p.status === 'pending'); }
export function setStatus(id: string, status: Post['status']): Post | null {
  const p = posts.find(x => x.id === id);
  if (!p) return null;
  p.status = status;
  save();
  return p;
}
