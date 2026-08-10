import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../src/server';
import { JsonStorage } from '../src/storage';

interface JsonResponse {
  status: number;
  body: any;
}

async function request(
  baseUrl: string,
  route: string,
  options: RequestInit = {},
): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  return { status: response.status, body: await response.json() };
}

test('API supports pairing, status and sync validation', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rodzic-api-'));
  const server = createApp(new JsonStorage(path.join(directory, 'data.json'))).listen(
    0,
    '127.0.0.1',
  );
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => {
    server.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const mother = await request(baseUrl, '/auth/anon', {
    method: 'POST',
    body: JSON.stringify({ role: 'mother' }),
  });
  const father = await request(baseUrl, '/auth/anon', {
    method: 'POST',
    body: JSON.stringify({ role: 'father' }),
  });
  assert.equal(mother.status, 201);
  assert.equal(father.status, 201);

  const motherAuth = { Authorization: `Bearer ${mother.body.token}` };
  const fatherAuth = { Authorization: `Bearer ${father.body.token}` };
  const created = await request(baseUrl, '/pair/create', { method: 'POST', headers: motherAuth });
  assert.equal(created.status, 201);
  assert.equal(created.body.memberCount, 1);

  const waiting = await request(baseUrl, '/pair/status', { headers: motherAuth });
  assert.deepEqual(
    { paired: waiting.body.paired, memberCount: waiting.body.memberCount },
    { paired: false, memberCount: 1 },
  );
  const blockedSync = await request(baseUrl, '/sync/events', {
    method: 'PUT',
    headers: motherAuth,
    body: JSON.stringify({ events: [] }),
  });
  assert.equal(blockedSync.status, 409);

  const joined = await request(baseUrl, '/pair/join', {
    method: 'POST',
    headers: fatherAuth,
    body: JSON.stringify({ code: created.body.code }),
  });
  assert.equal(joined.status, 200);

  const invalid = await request(baseUrl, '/sync/events', {
    method: 'PUT',
    headers: motherAuth,
    body: JSON.stringify({
      events: [{ id: 'bad id', title: 'x', date: '2026-02-31', updatedAt: 'bad' }],
    }),
  });
  assert.equal(invalid.status, 400);

  const pushed = await request(baseUrl, '/sync/events', {
    method: 'PUT',
    headers: motherAuth,
    body: JSON.stringify({
      events: [
        {
          id: 'event-1',
          title: 'Wizyta',
          date: '2026-08-15',
          updatedAt: '2026-08-10T10:00:00.000Z',
        },
      ],
    }),
  });
  assert.equal(pushed.status, 200);

  const pulled = await request(baseUrl, '/sync/events', { headers: fatherAuth });
  assert.equal(pulled.status, 200);
  assert.equal(pulled.body.events[0].title, 'Wizyta');

  const deleted = await request(baseUrl, '/account', { method: 'DELETE', headers: motherAuth });
  assert.deepEqual(deleted.body, { ok: true });
  const deletedToken = await request(baseUrl, '/pair/status', { headers: motherAuth });
  assert.equal(deletedToken.status, 401);
});
