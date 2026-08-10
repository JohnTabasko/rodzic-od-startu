import { Platform } from 'react-native';
import { EventItem } from '../store/useAppStore';

const DEFAULT_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

/**
 * Public build-time configuration. Set EXPO_PUBLIC_API_URL for a physical
 * device and for production; never put secrets in Expo environment variables.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 12_000;

export interface SharedEvent extends EventItem {
  updatedAt: string;
  deleted?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = message,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorCode(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    const text = await response.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }

    if (!response.ok) {
      const code = errorCode(body, `HTTP_${response.status}`);
      throw new ApiError(code, response.status, code);
    }
    return (body ?? undefined) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('REQUEST_TIMEOUT', 408, 'REQUEST_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  anonAuth: (role: 'mother' | 'father' | 'other') =>
    request<{ userId: string; token: string; role: string }>('/auth/anon', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  pairCreate: (token: string) =>
    request<{ coupleId: string; code: string; memberCount: number }>(
      '/pair/create',
      { method: 'POST' },
      token,
    ),
  pairJoin: (token: string, code: string) =>
    request<{ coupleId: string; memberCount: number }>(
      '/pair/join',
      { method: 'POST', body: JSON.stringify({ code }) },
      token,
    ),
  pairStatus: (token: string) =>
    request<{
      paired: boolean;
      memberCount: number;
      coupleId?: string;
      code?: string;
      partnerRole?: 'mother' | 'father' | 'other' | null;
    }>('/pair/status', {}, token),
  pairLeave: (token: string) => request<{ ok: boolean }>('/pair/leave', { method: 'POST' }, token),
  deleteAccount: (token: string) =>
    request<{ ok: boolean }>('/account', { method: 'DELETE' }, token),
  pushEvents: (token: string, events: SharedEvent[], deletedIds: string[] = []) =>
    request<{ applied: number }>(
      '/sync/events',
      { method: 'PUT', body: JSON.stringify({ events, deletedIds }) },
      token,
    ),
  pullEvents: (token: string, since?: string) =>
    request<{ events: SharedEvent[] }>(
      `/sync/events${since ? `?since=${encodeURIComponent(since)}` : ''}`,
      {},
      token,
    ),
  pushChecklist: (
    token: string,
    done: Record<string, boolean>,
    updatedAt: Record<string, string>,
  ) =>
    request<{ applied: number }>(
      '/sync/checklist',
      { method: 'PUT', body: JSON.stringify({ done, updatedAt }) },
      token,
    ),
  pullChecklist: (token: string) =>
    request<{ done: Record<string, boolean> }>('/sync/checklist', {}, token),
};

export interface ServerHealth {
  ok: boolean;
  ts: string;
  storage: 'json' | 'postgresql';
}

export function serverHealth(): Promise<ServerHealth> {
  return request<ServerHealth>('/health');
}

export interface ServerAnswer {
  answer: string;
  source: string;
  docId: string | null;
  reviewedAt: string | null;
  isSafety: boolean;
  mode?: 'crisis' | 'extractive' | 'llm' | 'fallback';
  score?: number;
}

export function askAssistant(question: string): Promise<ServerAnswer> {
  return request<ServerAnswer>('/assistant/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export type SocialProvider = 'google' | 'apple';

export function socialAuth(
  provider: SocialProvider,
  idToken: string,
): Promise<{ userId: string; token: string; role: string; isNew: boolean }> {
  return request('/auth/social', {
    method: 'POST',
    body: JSON.stringify({ provider, idToken }),
  });
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
}

export interface CommunityPost {
  id: string;
  authorIdHash: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export const community = {
  groups: (token: string) => request<{ groups: CommunityGroup[] }>('/community/groups', {}, token),
  posts: (token: string, groupId: string) =>
    request<{ posts: CommunityPost[] }>(`/community/groups/${groupId}/posts`, {}, token),
  addPost: (token: string, groupId: string, text: string) =>
    request<{ id: string; status: string; notice?: string }>(
      `/community/groups/${groupId}/posts`,
      { method: 'POST', body: JSON.stringify({ text }) },
      token,
    ),
};
