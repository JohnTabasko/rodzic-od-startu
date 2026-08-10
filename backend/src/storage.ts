/**
 * Warstwa persystencji z wymiennym sterownikiem:
 *   - JsonStorage  (dev; data.json)
 *   - PgStorage    (produkcja; aktywowana zmienną DATABASE_URL)
 * Migracja docelowa NestJS: interfejs Storage mapuje się 1:1 na repozytoria.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export type Role = 'mother' | 'father' | 'other';
export interface User { id: string; role: Role; createdAt: string; provider?: 'google' | 'apple'; externalSub?: string; email?: string; }
export interface SharedEvent { id: string; title: string; date: string; type?: string; updatedAt: string; deleted?: boolean; }
export interface Couple { id: string; code: string; memberIds: string[]; }

export interface Storage {
  createUser(u: User, tokenHash: string): Promise<void>;
  findUserByExternal(externalSub: string): Promise<User | null>;
  getUserByTokenHash(h: string): Promise<User | null>;
  deleteUser(id: string): Promise<void>;
  createCouple(c: Couple): Promise<void>;
  findCoupleByCode(code: string): Promise<Couple | null>;
  coupleOfUser(userId: string): Promise<Couple | null>;
  addMember(coupleId: string, userId: string): Promise<void>;
  removeMember(coupleId: string, userId: string): Promise<void>;
  upsertEvents(coupleId: string, events: SharedEvent[]): Promise<number>;
  listEvents(coupleId: string, since?: string): Promise<SharedEvent[]>;
  mergeChecklist(coupleId: string, done: Record<string, boolean>, ts: Record<string, string>): Promise<number>;
  getChecklist(coupleId: string): Promise<Record<string, boolean>>;
}

// ---------------- JSON (dev) ----------------
type Row = Couple & { events: Record<string, SharedEvent>; checklist: Record<string, boolean>; checklistTs: Record<string, string> };
interface JDB { users: Record<string, User & { tokenHash: string }>; couples: Record<string, Row>; }

export class JsonStorage implements Storage {
  private db: JDB = { users: {}, couples: {} };
  private file = path.join(process.cwd(), 'data.json');
  constructor() { try { this.db = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { /* świeży */ } }
  private save() { fs.writeFileSync(this.file, JSON.stringify(this.db, null, 2)); }

  async createUser(u: User, tokenHash: string) { this.db.users[u.id] = { ...u, tokenHash }; this.save(); }
  async findUserByExternal(externalSub: string) {
    const u = Object.values(this.db.users).find(x => x.externalSub === externalSub);
    return u ? { id: u.id, role: u.role, createdAt: u.createdAt, provider: u.provider, externalSub: u.externalSub, email: u.email } : null;
  }
  async getUserByTokenHash(h: string) {
    const u = Object.values(this.db.users).find(x => x.tokenHash === h);
    return u ? { id: u.id, role: u.role, createdAt: u.createdAt } : null;
  }
  async deleteUser(id: string) {
    const c = await this.coupleOfUser(id);
    if (c) await this.removeMember(c.id, id);
    delete this.db.users[id]; this.save();
  }
  async createCouple(c: Couple) { this.db.couples[c.id] = { ...c, events: {}, checklist: {}, checklistTs: {} }; this.save(); }
  async findCoupleByCode(code: string) { const c = Object.values(this.db.couples).find(c => c.code === code); return c ? { id: c.id, code: c.code, memberIds: c.memberIds } : null; }
  async coupleOfUser(userId: string) { const c = Object.values(this.db.couples).find(c => c.memberIds.includes(userId)); return c ? { id: c.id, code: c.code, memberIds: c.memberIds } : null; }
  async addMember(coupleId: string, userId: string) { this.db.couples[coupleId].memberIds.push(userId); this.save(); }
  async removeMember(coupleId: string, userId: string) {
    const c = this.db.couples[coupleId];
    c.memberIds = c.memberIds.filter(id => id !== userId);
    if (c.memberIds.length === 0) delete this.db.couples[coupleId];
    this.save();
  }
  async upsertEvents(coupleId: string, events: SharedEvent[]) {
    const c = this.db.couples[coupleId]; let applied = 0;
    for (const e of events) { const cur = c.events[e.id]; if (!cur || e.updatedAt > cur.updatedAt) { c.events[e.id] = e; applied++; } }
    this.save(); return applied;
  }
  async listEvents(coupleId: string, since = '') { return Object.values(this.db.couples[coupleId].events).filter(e => !since || e.updatedAt > since); }
  async mergeChecklist(coupleId: string, done: Record<string, boolean>, ts: Record<string, string>) {
    const c = this.db.couples[coupleId]; let applied = 0;
    for (const [k, v] of Object.entries(done)) { const at = ts[k] ?? new Date().toISOString(); if (!c.checklistTs[k] || at > c.checklistTs[k]) { c.checklist[k] = c.checklist[k] || v; c.checklistTs[k] = at; applied++; } }
    this.save(); return applied;
  }
  async getChecklist(coupleId: string) { return this.db.couples[coupleId].checklist; }
}

// ---------------- PostgreSQL (produkcja) ----------------
export class PgStorage implements Storage {
  private pool: Pool;
  constructor(url: string) { this.pool = new Pool({ connectionString: url }); }

  async migrate() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, role TEXT NOT NULL, token_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS external_sub TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_ext ON users(external_sub);
      CREATE INDEX IF NOT EXISTS idx_users_token ON users(token_hash);
      CREATE TABLE IF NOT EXISTS couples (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS couple_members (couple_id TEXT REFERENCES couples(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (couple_id, user_id));
      CREATE TABLE IF NOT EXISTS events (couple_id TEXT NOT NULL, id TEXT NOT NULL, title TEXT, date DATE, type TEXT, updated_at TIMESTAMPTZ NOT NULL, deleted BOOLEAN DEFAULT FALSE, PRIMARY KEY (couple_id, id));
      CREATE TABLE IF NOT EXISTS checklist (couple_id TEXT NOT NULL, key TEXT NOT NULL, value BOOLEAN NOT NULL, updated_at TIMESTAMPTZ NOT NULL, PRIMARY KEY (couple_id, key));
    `);
  }

  async createUser(u: User, tokenHash: string) { await this.pool.query('INSERT INTO users(id,role,token_hash,created_at,provider,external_sub,email) VALUES($1,$2,$3,$4,$5,$6,$7)', [u.id, u.role, tokenHash, u.createdAt, u.provider ?? null, u.externalSub ?? null, u.email ?? null]); }
  async findUserByExternal(externalSub: string): Promise<User | null> {
    const r = await this.pool.query('SELECT id,role,created_at,provider,external_sub,email FROM users WHERE external_sub=$1', [externalSub]);
    if (!r.rows[0]) return null;
    const x = r.rows[0];
    return { id: x.id, role: x.role, createdAt: x.created_at.toISOString(), provider: x.provider, externalSub: x.external_sub, email: x.email };
  }
  async getUserByTokenHash(h: string): Promise<User | null> {
    const r = await this.pool.query('SELECT id,role,created_at FROM users WHERE token_hash=$1', [h]);
    return r.rows[0] ? { id: r.rows[0].id, role: r.rows[0].role, createdAt: r.rows[0].created_at.toISOString() } : null;
  }
  async deleteUser(id: string) { await this.pool.query('DELETE FROM users WHERE id=$1', [id]); }
  async createCouple(c: Couple) {
    await this.pool.query('INSERT INTO couples(id,code) VALUES($1,$2)', [c.id, c.code]);
    await this.pool.query('INSERT INTO couple_members(couple_id,user_id) VALUES($1,$2)', [c.id, c.memberIds[0]]);
  }
  async findCoupleByCode(code: string): Promise<Couple | null> { const r = await this.pool.query('SELECT id FROM couples WHERE code=$1', [code]); return r.rows[0] ? this.loadCouple(r.rows[0].id) : null; }
  async coupleOfUser(userId: string): Promise<Couple | null> { const r = await this.pool.query('SELECT couple_id FROM couple_members WHERE user_id=$1 LIMIT 1', [userId]); return r.rows[0] ? this.loadCouple(r.rows[0].couple_id) : null; }
  private async loadCouple(id: string): Promise<Couple> {
    const c = await this.pool.query('SELECT code FROM couples WHERE id=$1', [id]);
    const m = await this.pool.query('SELECT user_id FROM couple_members WHERE couple_id=$1', [id]);
    return { id, code: c.rows[0].code, memberIds: m.rows.map(r => r.user_id) };
  }
  async addMember(coupleId: string, userId: string) { await this.pool.query('INSERT INTO couple_members(couple_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [coupleId, userId]); }
  async removeMember(coupleId: string, userId: string) {
    await this.pool.query('DELETE FROM couple_members WHERE couple_id=$1 AND user_id=$2', [coupleId, userId]);
    const left = await this.pool.query('SELECT 1 FROM couple_members WHERE couple_id=$1 LIMIT 1', [coupleId]);
    if (left.rowCount === 0) await this.pool.query('DELETE FROM couples WHERE id=$1', [coupleId]);
  }
  async upsertEvents(coupleId: string, events: SharedEvent[]) {
    let applied = 0;
    for (const e of events) {
      const r = await this.pool.query(
        `INSERT INTO events(couple_id,id,title,date,type,updated_at,deleted) VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (couple_id,id) DO UPDATE SET title=EXCLUDED.title,date=EXCLUDED.date,type=EXCLUDED.type,updated_at=EXCLUDED.updated_at,deleted=EXCLUDED.deleted
         WHERE events.updated_at < EXCLUDED.updated_at`,
        [coupleId, e.id, e.title, e.date, e.type ?? null, e.updatedAt, !!e.deleted]);
      applied += r.rowCount ?? 0;
    }
    return applied;
  }
  async listEvents(coupleId: string, since?: string) {
    const r = await this.pool.query(
      `SELECT id,title,to_char(date,'YYYY-MM-DD') AS date,type,to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SSZ') AS "updatedAt",deleted FROM events
       WHERE couple_id=$1 ${since ? 'AND updated_at > $2' : ''}`, since ? [coupleId, since] : [coupleId]);
    return r.rows;
  }
  async mergeChecklist(coupleId: string, done: Record<string, boolean>, ts: Record<string, string>) {
    let applied = 0;
    for (const [k, v] of Object.entries(done)) {
      const at = ts[k] ?? new Date().toISOString();
      const r = await this.pool.query(
        `INSERT INTO checklist(couple_id,key,value,updated_at) VALUES($1,$2,$3,$4)
         ON CONFLICT (couple_id,key) DO UPDATE SET value=(checklist.value OR EXCLUDED.value),updated_at=EXCLUDED.updated_at
         WHERE checklist.updated_at < EXCLUDED.updated_at`,
        [coupleId, k, v, at]);
      applied += r.rowCount ?? 0;
    }
    return applied;
  }
  async getChecklist(coupleId: string) {
    const r = await this.pool.query('SELECT key,value FROM checklist WHERE couple_id=$1', [coupleId]);
    return Object.fromEntries(r.rows.map(x => [x.key, x.value]));
  }
}

export function makeStorage(): Storage {
  const url = process.env.DATABASE_URL;
  if (url) { console.log('Storage: PostgreSQL'); return new PgStorage(url); }
  console.log('Storage: JSON (dev) — ustaw DATABASE_URL dla PostgreSQL');
  return new JsonStorage();
}
