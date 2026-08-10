import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hashToken } from '../src/auth';
import { JsonStorage } from '../src/storage';

test('JSON storage supports pairing, LWW events and soft-OR checklist', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rodzic-storage-'));
  const file = path.join(directory, 'data.json');
  try {
    const storage = new JsonStorage(file);
    await storage.saveUser(
      { id: 'user-a', role: 'mother', createdAt: '2026-08-10T10:00:00.000Z' },
      hashToken('token-a'),
    );
    await storage.saveUser(
      { id: 'user-b', role: 'father', createdAt: '2026-08-10T10:00:00.000Z' },
      hashToken('token-b'),
    );
    await storage.createCouple({ id: 'couple-1', code: 'ABC234', memberIds: ['user-a'] });
    await storage.addMember('couple-1', 'user-b');

    await storage.upsertEvents('couple-1', [
      {
        id: 'event-1',
        title: 'Nowsza wersja',
        date: '2026-08-15',
        updatedAt: '2026-08-10T11:00:00.000Z',
      },
      {
        id: 'event-1',
        title: 'Starsza wersja',
        date: '2026-08-14',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
    ]);
    const events = await storage.listEvents('couple-1');
    assert.equal(events[0]?.title, 'Nowsza wersja');

    await storage.upsertEvents('couple-1', [
      { id: 'event-1', title: '', date: '', updatedAt: '2026-08-10T12:00:00.000Z', deleted: true },
    ]);
    assert.equal((await storage.listEvents('couple-1'))[0]?.deleted, true);

    await storage.mergeChecklist(
      'couple-1',
      { 'bag-1': true },
      { 'bag-1': '2026-08-10T10:00:00.000Z' },
    );
    await storage.mergeChecklist(
      'couple-1',
      { 'bag-1': false },
      { 'bag-1': '2026-08-10T11:00:00.000Z' },
    );
    assert.deepEqual(await storage.getChecklist('couple-1'), { 'bag-1': true });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
