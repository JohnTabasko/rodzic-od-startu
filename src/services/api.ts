// Klient API backendu (tryb pary / sync).
// Adresy: emulator Android → http://10.0.2.2:3000/api
//         iOS symulator    → http://localhost:3000/api
//         telefon fizyczny → http://<IP-komputera>:3000/api
import { EventItem } from '../store/useAppStore';

export const API_URL = 'http://10.0.2.2:3000/api';

export interface SharedEvent extends EventItem { updatedAt: string; deleted?: boolean; }

async function req<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  anonAuth: (role: 'mother' | 'father' | 'other') =>
    req<{ userId: string; token: string; role: string }>('/auth/anon', { method: 'POST', body: JSON.stringify({ role }) }),
  pairCreate: (token: string) =>
    req<{ coupleId: string; code: string }>('/pair/create', { method: 'POST' }, token),
  pairJoin: (token: string, code: string) =>
    req<{ coupleId: string }>('/pair/join', { method: 'POST', body: JSON.stringify({ code }) }, token),
  pairStatus: (token: string) =>
    req<{ paired: boolean; coupleId?: string; code?: string; partnerRole?: 'mother' | 'father' | 'other' | null }>('/pair/status', {}, token),
  pairLeave: (token: string) => req<{ ok: boolean }>('/pair/leave', { method: 'POST' }, token),
  pushEvents: (token: string, events: SharedEvent[], deletedIds: string[] = []) =>
    req<{ applied: number }>('/sync/events', { method: 'PUT', body: JSON.stringify({ events, deletedIds }) }, token),
  pullEvents: (token: string, since?: string) =>
    req<{ events: SharedEvent[] }>(`/sync/events${since ? `?since=${encodeURIComponent(since)}` : ''}`, {}, token),
  pushChecklist: (token: string, done: Record<string, boolean>, updatedAt: Record<string, string>) =>
    req<{ applied: number }>('/sync/checklist', { method: 'PUT', body: JSON.stringify({ done, updatedAt }) }, token),
  pullChecklist: (token: string) => req<{ done: Record<string, boolean> }>('/sync/checklist', {}, token),
};

export async function serverHealth(): Promise<{ ok: boolean; ts: string }> {
  const res = await fetch(`${API_URL}/health`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface ServerAnswer {
  answer: string;
  source: string;
  docId: string | null;
  reviewedAt: string | null;
  isSafety: boolean;
}
export async function askAssistant(question: string): Promise<ServerAnswer> {
  return req<ServerAnswer>('/assistant/ask', { method: 'POST', body: JSON.stringify({ question }) });
}

export type SocialProvider = 'google' | 'apple';
export async function socialAuth(provider: SocialProvider, idToken: string): Promise<{ userId: string; token: string; role: string; isNew: boolean }> {
  return req('/auth/social', { method: 'POST', body: JSON.stringify({ provider, idToken }) });
}

export interface CommunityGroup { id: string; name: string; description: string; }
export interface CommunityPost { id: string; authorIdHash: string; authorRole: string; text: string; createdAt: string; }
export const community = {
  groups: (token: string) => req<{ groups: CommunityGroup[] }>('/community/groups', {}, token),
  posts: (token: string, groupId: string) => req<{ posts: CommunityPost[] }>(`/community/groups/${groupId}/posts`, {}, token),
  addPost: (token: string, groupId: string, text: string) =>
    req<{ id: string; status: string; notice?: string }>(`/community/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify({ text }) }, token),
};
