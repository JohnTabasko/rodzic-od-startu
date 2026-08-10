/**
 * Moderated community data.
 *
 * The JSON file is a development adapter only. Production should move posts and
 * moderation state to PostgreSQL or a dedicated content service.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { runtimeFile } from './runtime';

export interface Group {
  id: string;
  name: string;
  description: string;
}

export interface Post {
  id: string;
  groupId: string;
  authorIdHash: string;
  authorRole: string;
  text: string;
  status: 'pending' | 'approved' | 'flagged' | 'rejected';
  flags: string[];
  createdAt: string;
}

export const GROUPS: Group[] = [
  {
    id: 'pierwsze-dziecko',
    name: '👶 Pierwsze dziecko',
    description: 'Pytania i wsparcie dla debiutujących rodziców',
  },
  { id: 'tata-strefa', name: '👨 Tata strefa', description: 'Ojcostwo po męsku — bez tabu' },
  {
    id: 'pokarm',
    name: '🍼 Karmienie',
    description: 'Piersią, mieszanką, BLW — doświadczenia, nie porady medyczne',
  },
  { id: 'sen', name: '😴 Sen', description: 'Nocne zmiany i rytuały usypiania' },
];

const file = runtimeFile('community.json');
let posts: Post[] = [];
try {
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  posts = Array.isArray(parsed) ? parsed : [];
} catch {
  // An empty development community is a valid initial state.
}

function save(): void {
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(posts, null, 2) + '\n', 'utf8');
  fs.renameSync(temporaryFile, file);
}

const MEDICAL_PATTERNS = [
  /\d+\s*(mg|ml|tablet)/i,
  /weź|zażyj|podaj\s+lek/i,
  /paracetamol|ibuprofen|antybiotyk/i,
  /nie musisz iść do lekarza/i,
  /zamiast szczepi/i,
];
const ABUSE_PATTERNS = [/idiot|debil|głupia\b|się zabij innym/i];

export function autoModerate(text: string): { status: Post['status']; flags: string[] } {
  const flags: string[] = [];
  if (MEDICAL_PATTERNS.some((pattern) => pattern.test(text))) flags.push('medical_advice');
  if (ABUSE_PATTERNS.some((pattern) => pattern.test(text))) flags.push('abuse');
  return flags.length ? { status: 'flagged', flags } : { status: 'approved', flags };
}

export function addPost(groupId: string, authorId: string, authorRole: string, text: string): Post {
  const { status, flags } = autoModerate(text);
  const post: Post = {
    id: crypto.randomBytes(6).toString('base64url').toUpperCase(),
    groupId,
    authorIdHash: crypto.createHash('sha256').update(authorId).digest('hex').slice(0, 10),
    authorRole,
    text: text.slice(0, 2000),
    status,
    flags,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  save();
  return post;
}

export function listPosts(groupId: string): Post[] {
  return posts
    .filter((post) => post.groupId === groupId && post.status === 'approved')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export function moderationQueue(): Post[] {
  return posts
    .filter((post) => post.status === 'flagged' || post.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function setStatus(id: string, status: Post['status']): Post | null {
  const post = posts.find((item) => item.id === id);
  if (!post) return null;
  post.status = status;
  save();
  return post;
}
