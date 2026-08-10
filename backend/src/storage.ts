/**
 * Persistence abstraction.
 *
 * JsonStorage is intentionally kept for local development. Production must use
 * PgStorage by providing DATABASE_URL. Both implementations expose the same
 * semantics for account, pairing, event and checklist operations.
 */
import fs from 'node:fs';
import { Pool } from 'pg';
import { runtimeFile } from './runtime';

export type Role = 'mother' | 'father' | 'other';

export interface User {
  id: string;
  role: Role;
  createdAt: string;
  provider?: 'google' | 'apple';
  externalSub?: string;
  email?: string;
}

export interface SharedEvent {
  id: string;
  title: string;
  date: string;
  type?: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface Couple {
  id: string;
  code: string;
  memberIds: string[];
}

export interface Storage {
  saveUser(user: User, tokenHash: string): Promise<void>;
  findUserByExternal(externalSub: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByTokenHash(tokenHash: string): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
  createCouple(couple: Couple): Promise<void>;
  findCoupleByCode(code: string): Promise<Couple | null>;
  coupleOfUser(userId: string): Promise<Couple | null>;
  addMember(coupleId: string, userId: string): Promise<void>;
  removeMember(coupleId: string, userId: string): Promise<void>;
  upsertEvents(coupleId: string, events: SharedEvent[]): Promise<number>;
  listEvents(coupleId: string, since?: string): Promise<SharedEvent[]>;
  mergeChecklist(
    coupleId: string,
    done: Record<string, boolean>,
    updatedAt: Record<string, string>,
  ): Promise<number>;
  getChecklist(coupleId: string): Promise<Record<string, boolean>>;
}

function publicUser(user: User | undefined): User | null {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    createdAt: user.createdAt,
    provider: user.provider,
    externalSub: user.externalSub,
    email: user.email,
  };
}

// ---------------- JSON (development only) ----------------

type JsonUser = User & { tokenHash: string };
type JsonCouple = Couple & {
  events: Record<string, SharedEvent>;
  checklist: Record<string, boolean>;
  checklistTs: Record<string, string>;
};
interface JsonDatabase {
  users: Record<string, JsonUser>;
  couples: Record<string, JsonCouple>;
}

function emptyJsonDatabase(): JsonDatabase {
  return { users: {}, couples: {} };
}

export class JsonStorage implements Storage {
  private db: JsonDatabase = emptyJsonDatabase();
  private readonly file: string;

  constructor(file = runtimeFile('data.json')) {
    this.file = file;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<JsonDatabase>;
      this.db = {
        users: parsed.users ?? {},
        couples: parsed.couples ?? {},
      };
    } catch {
      // A missing or invalid local file starts a fresh development store.
    }
  }

  private save(): void {
    fs.writeFileSync(this.file, JSON.stringify(this.db, null, 2) + '\n', 'utf8');
  }

  async saveUser(user: User, tokenHash: string): Promise<void> {
    this.db.users[user.id] = { ...user, tokenHash };
    this.save();
  }

  async findUserByExternal(externalSub: string): Promise<User | null> {
    const user = Object.values(this.db.users).find((item) => item.externalSub === externalSub);
    return publicUser(user);
  }

  async getUserById(id: string): Promise<User | null> {
    return publicUser(this.db.users[id]);
  }

  async getUserByTokenHash(tokenHash: string): Promise<User | null> {
    const user = Object.values(this.db.users).find((item) => item.tokenHash === tokenHash);
    return publicUser(user);
  }

  async deleteUser(id: string): Promise<void> {
    const couple = await this.coupleOfUser(id);
    if (couple) await this.removeMember(couple.id, id);
    delete this.db.users[id];
    this.save();
  }

  async createCouple(couple: Couple): Promise<void> {
    this.db.couples[couple.id] = {
      ...couple,
      events: {},
      checklist: {},
      checklistTs: {},
    };
    this.save();
  }

  async findCoupleByCode(code: string): Promise<Couple | null> {
    const couple = Object.values(this.db.couples).find((item) => item.code === code);
    return couple ? { id: couple.id, code: couple.code, memberIds: [...couple.memberIds] } : null;
  }

  async coupleOfUser(userId: string): Promise<Couple | null> {
    const couple = Object.values(this.db.couples).find((item) => item.memberIds.includes(userId));
    return couple ? { id: couple.id, code: couple.code, memberIds: [...couple.memberIds] } : null;
  }

  async addMember(coupleId: string, userId: string): Promise<void> {
    const couple = this.db.couples[coupleId];
    if (!couple) throw new Error('COUPLE_NOT_FOUND');
    if (!couple.memberIds.includes(userId)) couple.memberIds.push(userId);
    this.save();
  }

  async removeMember(coupleId: string, userId: string): Promise<void> {
    const couple = this.db.couples[coupleId];
    if (!couple) return;
    couple.memberIds = couple.memberIds.filter((id) => id !== userId);
    if (couple.memberIds.length === 0) delete this.db.couples[coupleId];
    this.save();
  }

  async upsertEvents(coupleId: string, events: SharedEvent[]): Promise<number> {
    const couple = this.db.couples[coupleId];
    if (!couple) throw new Error('COUPLE_NOT_FOUND');

    let applied = 0;
    for (const event of events) {
      const current = couple.events[event.id];
      if (!current || event.updatedAt > current.updatedAt) {
        couple.events[event.id] = event;
        applied += 1;
      }
    }
    this.save();
    return applied;
  }

  async listEvents(coupleId: string, since = ''): Promise<SharedEvent[]> {
    const couple = this.db.couples[coupleId];
    if (!couple) throw new Error('COUPLE_NOT_FOUND');

    return Object.values(couple.events)
      .filter((event) => !since || event.updatedAt > since)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }

  async mergeChecklist(
    coupleId: string,
    done: Record<string, boolean>,
    updatedAt: Record<string, string>,
  ): Promise<number> {
    const couple = this.db.couples[coupleId];
    if (!couple) throw new Error('COUPLE_NOT_FOUND');

    let applied = 0;
    for (const [key, value] of Object.entries(done)) {
      const timestamp = updatedAt[key] ?? new Date().toISOString();
      if (!couple.checklistTs[key] || timestamp > couple.checklistTs[key]) {
        // Checklist items use soft-OR semantics: an item checked by one
        // partner cannot be accidentally unchecked by the other partner.
        couple.checklist[key] = Boolean(couple.checklist[key] || value);
        couple.checklistTs[key] = timestamp;
        applied += 1;
      }
    }
    this.save();
    return applied;
  }

  async getChecklist(coupleId: string): Promise<Record<string, boolean>> {
    const couple = this.db.couples[coupleId];
    if (!couple) throw new Error('COUPLE_NOT_FOUND');
    return { ...couple.checklist };
  }
}

// ---------------- PostgreSQL (production) ----------------

export class PgStorage implements Storage {
  private readonly pool: Pool;

  constructor(url: string) {
    this.pool = new Pool({ connectionString: url });
  }

  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        provider TEXT,
        external_sub TEXT,
        email TEXT
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS external_sub TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_external_sub ON users(external_sub);
      CREATE INDEX IF NOT EXISTS idx_users_token_hash ON users(token_hash);

      CREATE TABLE IF NOT EXISTS couples (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS couple_members (
        couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (couple_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS events (
        couple_id TEXT NOT NULL,
        id TEXT NOT NULL,
        title TEXT NOT NULL,
        date DATE,
        type TEXT,
        updated_at TIMESTAMPTZ NOT NULL,
        deleted BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (couple_id, id)
      );
      CREATE TABLE IF NOT EXISTS checklist (
        couple_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value BOOLEAN NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (couple_id, key)
      );
    `);
  }

  async saveUser(user: User, tokenHash: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO users(id, role, token_hash, created_at, provider, external_sub, email)
       VALUES($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         role = EXCLUDED.role,
         token_hash = EXCLUDED.token_hash,
         provider = COALESCE(EXCLUDED.provider, users.provider),
         external_sub = COALESCE(EXCLUDED.external_sub, users.external_sub),
         email = COALESCE(EXCLUDED.email, users.email)`,
      [
        user.id,
        user.role,
        tokenHash,
        user.createdAt,
        user.provider ?? null,
        user.externalSub ?? null,
        user.email ?? null,
      ],
    );
  }

  async findUserByExternal(externalSub: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, role, created_at, provider, external_sub, email FROM users WHERE external_sub = $1',
      [externalSub],
    );
    if (!result.rows[0]) return null;
    return publicUser({
      id: result.rows[0].id,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at.toISOString(),
      provider: result.rows[0].provider,
      externalSub: result.rows[0].external_sub,
      email: result.rows[0].email,
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, role, created_at, provider, external_sub, email FROM users WHERE id = $1',
      [id],
    );
    if (!result.rows[0]) return null;
    return publicUser({
      id: result.rows[0].id,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at.toISOString(),
      provider: result.rows[0].provider,
      externalSub: result.rows[0].external_sub,
      email: result.rows[0].email,
    });
  }

  async getUserByTokenHash(tokenHash: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, role, created_at FROM users WHERE token_hash = $1',
      [tokenHash],
    );
    if (!result.rows[0]) return null;
    return publicUser({
      id: result.rows[0].id,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at.toISOString(),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    await this.pool.query(
      `DELETE FROM couples c
       WHERE NOT EXISTS (
         SELECT 1 FROM couple_members m WHERE m.couple_id = c.id
       )`,
    );
  }

  async createCouple(couple: Couple): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO couples(id, code) VALUES($1, $2)', [couple.id, couple.code]);
      await client.query('INSERT INTO couple_members(couple_id, user_id) VALUES($1, $2)', [
        couple.id,
        couple.memberIds[0],
      ]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findCoupleByCode(code: string): Promise<Couple | null> {
    const result = await this.pool.query('SELECT id FROM couples WHERE code = $1', [code]);
    return result.rows[0] ? this.loadCouple(result.rows[0].id) : null;
  }

  async coupleOfUser(userId: string): Promise<Couple | null> {
    const result = await this.pool.query(
      'SELECT couple_id FROM couple_members WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    return result.rows[0] ? this.loadCouple(result.rows[0].couple_id) : null;
  }

  private async loadCouple(id: string): Promise<Couple> {
    const [coupleResult, membersResult] = await Promise.all([
      this.pool.query('SELECT code FROM couples WHERE id = $1', [id]),
      this.pool.query('SELECT user_id FROM couple_members WHERE couple_id = $1', [id]),
    ]);
    if (!coupleResult.rows[0]) throw new Error('COUPLE_NOT_FOUND');
    return {
      id,
      code: coupleResult.rows[0].code,
      memberIds: membersResult.rows.map((row) => row.user_id),
    };
  }

  async addMember(coupleId: string, userId: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO couple_members(couple_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING',
      [coupleId, userId],
    );
  }

  async removeMember(coupleId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM couple_members WHERE couple_id = $1 AND user_id = $2', [
        coupleId,
        userId,
      ]);
      const remaining = await client.query(
        'SELECT 1 FROM couple_members WHERE couple_id = $1 LIMIT 1',
        [coupleId],
      );
      if (remaining.rowCount === 0) {
        await client.query('DELETE FROM couples WHERE id = $1', [coupleId]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async upsertEvents(coupleId: string, events: SharedEvent[]): Promise<number> {
    let applied = 0;
    for (const event of events) {
      const result = await this.pool.query(
        `INSERT INTO events(couple_id, id, title, date, type, updated_at, deleted)
         VALUES($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (couple_id, id) DO UPDATE SET
           title = EXCLUDED.title,
           date = EXCLUDED.date,
           type = EXCLUDED.type,
           updated_at = EXCLUDED.updated_at,
           deleted = EXCLUDED.deleted
         WHERE events.updated_at < EXCLUDED.updated_at`,
        [
          coupleId,
          event.id,
          event.deleted ? '' : event.title,
          event.deleted ? null : event.date,
          event.type ?? null,
          event.updatedAt,
          Boolean(event.deleted),
        ],
      );
      applied += result.rowCount ?? 0;
    }
    return applied;
  }

  async listEvents(coupleId: string, since?: string): Promise<SharedEvent[]> {
    const result = await this.pool.query(
      `SELECT id, title, to_char(date, 'YYYY-MM-DD') AS date, type,
              to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",
              deleted
       FROM events
       WHERE couple_id = $1 ${since ? 'AND updated_at > $2' : ''}
       ORDER BY updated_at ASC`,
      since ? [coupleId, since] : [coupleId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.deleted ? '' : row.title,
      date: row.deleted ? '' : (row.date ?? ''),
      type: row.type ?? undefined,
      updatedAt: row.updatedAt,
      deleted: Boolean(row.deleted),
    }));
  }

  async mergeChecklist(
    coupleId: string,
    done: Record<string, boolean>,
    updatedAt: Record<string, string>,
  ): Promise<number> {
    let applied = 0;
    for (const [key, value] of Object.entries(done)) {
      const timestamp = updatedAt[key] ?? new Date().toISOString();
      const result = await this.pool.query(
        `INSERT INTO checklist(couple_id, key, value, updated_at)
         VALUES($1, $2, $3, $4)
         ON CONFLICT (couple_id, key) DO UPDATE SET
           value = checklist.value OR EXCLUDED.value,
           updated_at = EXCLUDED.updated_at
         WHERE checklist.updated_at < EXCLUDED.updated_at`,
        [coupleId, key, value, timestamp],
      );
      applied += result.rowCount ?? 0;
    }
    return applied;
  }

  async getChecklist(coupleId: string): Promise<Record<string, boolean>> {
    const result = await this.pool.query('SELECT key, value FROM checklist WHERE couple_id = $1', [
      coupleId,
    ]);
    return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
  }
}

export function makeStorage(databaseUrl = process.env.DATABASE_URL): Storage {
  if (databaseUrl) {
    console.log('Storage: PostgreSQL');
    return new PgStorage(databaseUrl);
  }
  console.log('Storage: JSON (development only) — set DATABASE_URL for PostgreSQL');
  return new JsonStorage();
}
