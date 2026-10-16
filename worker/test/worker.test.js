import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker, { parseCounts } from '../src/index.js';

const ORIGIN = 'https://avatar-coco-love.github.io';

// Minimal stand-in for the D1 binding, backed by SQLite.
function fakeEnv() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const DB = {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return { bind: (...args) => ({ run: () => stmt.run(...args) }) };
    },
    async batch(list) {
      db.exec('BEGIN');
      try {
        list.forEach((s) => s.run());
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  const rows = () => db.prepare('SELECT metric, route, n FROM counts ORDER BY metric, route').all().map((r) => ({ ...r }));
  const crashes = () => db.prepare('SELECT app, n FROM crashes ORDER BY app').all().map((r) => ({ ...r }));
  return { env: { DB, ALLOWED_ORIGINS: ORIGIN }, rows, crashes };
}

function post(body, { origin = ORIGIN, method = 'POST', path = '/v1/counts' } = {}) {
  const headers = { 'Content-Type': 'text/plain' };
  if (origin) headers.Origin = origin;
  return new Request('https://counts.example' + path, {
    method,
    headers,
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

const good = { v: 1, app: '2.2', opens: 1, crashes: 0, novoice: 0, started: { 1: 3, 2: 1 }, finished: { 1: 2 }, misses: { 1: 4 }, hints: { 1: 1 } };

test('valid message is added to the daily totals', async () => {
  const { env, rows } = fakeEnv();
  const res = await worker.fetch(post(good), env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  await worker.fetch(post(good), env);
  assert.deepEqual(rows(), [
    { metric: 'finished', route: 1, n: 4 },
    { metric: 'hints', route: 1, n: 2 },
    { metric: 'misses', route: 1, n: 8 },
    { metric: 'opens', route: 0, n: 2 },
    { metric: 'started', route: 1, n: 6 },
    { metric: 'started', route: 2, n: 2 },
  ]);
});

test('requests from other sites or without an Origin are refused', async () => {
  const { env, rows } = fakeEnv();
  assert.equal((await worker.fetch(post(good, { origin: 'https://evil.example' }), env)).status, 403);
  assert.equal((await worker.fetch(post(good, { origin: null }), env)).status, 403);
  assert.deepEqual(rows(), []);
});

test('wrong path and method', async () => {
  const { env } = fakeEnv();
  assert.equal((await worker.fetch(post(good, { path: '/' }), env)).status, 404);
  assert.equal((await worker.fetch(post(good, { method: 'GET' }), env)).status, 405);
  assert.equal((await worker.fetch(post(good, { method: 'OPTIONS' }), env)).status, 204);
});

test('malformed and oversized bodies are rejected and nothing is stored', async () => {
  const { env, rows } = fakeEnv();
  const bad = [
    'not json',
    '[]',
    { ...good, v: 2 },
    { ...good, app: 'x' },
    { ...good, opens: 201 },
    { ...good, opens: -1 },
    { ...good, opens: 1.5 },
    { ...good, started: { 8: 1 } },
    { ...good, started: { 1: '3' } },
    { ...good, misses: { 1: 999 } },
    { ...good, finished: [1] },
    { ...good, device: 'abc' },
    { ...good, id: 'x' },
    { v: 1, app: '0.2', opens: 1 },
    { ...good, crashes: 201 },
    { ...good, crashes: '1' },
    { ...good, novoice: -1 },
    { ...good, hints: { 8: 1 } },
    { ...good, hints: { 1: 1.5 } },
    { ...good, error: 'TypeError' },
    // 2.1 and earlier never sent; a message without the 2.2 keys is refused
    { v: 1, app: '2.1', opens: 1, started: {}, finished: {}, misses: {} },
    'x'.repeat(2000),
  ];
  for (const b of bad) {
    const res = await worker.fetch(post(b), env);
    assert.ok(res.status === 400 || res.status === 413, `expected rejection for ${JSON.stringify(b).slice(0, 60)}, got ${res.status}`);
  }
  assert.deepEqual(rows(), []);
});

test('all-zero message stores nothing', async () => {
  const { env, rows } = fakeEnv();
  const res = await worker.fetch(post({ v: 1, app: '0.2', opens: 0, crashes: 0, novoice: 0, started: {}, finished: {}, misses: {}, hints: {} }), env);
  assert.equal(res.status, 204);
  assert.deepEqual(rows(), []);
});

test('parseCounts accepts exactly what the game sends', () => {
  assert.deepEqual(parseCounts({ v: 1, app: '0.2', opens: 0, crashes: 0, novoice: 0, started: { 4: 1 }, finished: {}, misses: {}, hints: {} }), [
    { metric: 'started', route: 4, n: 1 },
  ]);
});

test('parseCounts accepts the Letter sounds and Lowercase routes (5, 6)', () => {
  assert.deepEqual(parseCounts({ v: 1, app: '1.9', opens: 0, crashes: 0, novoice: 0, started: { 5: 2, 6: 1 }, finished: { 6: 1 }, misses: {}, hints: {} }), [
    { metric: 'started', route: 5, n: 2 },
    { metric: 'started', route: 6, n: 1 },
    { metric: 'finished', route: 6, n: 1 },
  ]);
});

test('parseCounts accepts the Beginning sounds route (7), not route 8', () => {
  assert.deepEqual(parseCounts({ v: 1, app: '2.1', opens: 0, crashes: 0, novoice: 0, started: { 7: 3 }, finished: { 7: 1 }, misses: { 7: 2 }, hints: {} }), [
    { metric: 'started', route: 7, n: 3 },
    { metric: 'finished', route: 7, n: 1 },
    { metric: 'misses', route: 7, n: 2 },
  ]);
  assert.equal(parseCounts({ v: 1, app: '2.1', opens: 0, crashes: 0, novoice: 0, started: { 8: 1 }, finished: {}, misses: {}, hints: {} }), null);
});

test('crashes are kept by game version, novoice and hints with the other totals (2.2)', async () => {
  const { env, rows, crashes } = fakeEnv();
  const msg = (app, c) => ({ v: 1, app, opens: 1, crashes: c, novoice: 1, started: { 3: 1 }, finished: {}, misses: { 3: 2 }, hints: { 3: 1, 7: 2 } });
  for (const m of [msg('2.2', 1), msg('2.2', 2), msg('2.2.1', 1), msg('2.2', 0)]) assert.equal((await worker.fetch(post(m), env)).status, 204);
  assert.deepEqual(crashes(), [{ app: '2.2', n: 3 }, { app: '2.2.1', n: 1 }]);
  assert.deepEqual(rows(), [
    { metric: 'hints', route: 3, n: 4 },
    { metric: 'hints', route: 7, n: 8 },
    { metric: 'misses', route: 3, n: 8 },
    { metric: 'novoice', route: 0, n: 4 },
    { metric: 'opens', route: 0, n: 4 },
    { metric: 'started', route: 3, n: 4 },
  ]);
});

test('the largest message the game can send fits under the size limit', async () => {
  const all = (n) => Object.fromEntries(['1', '2', '3', '4', '5', '6', '7'].map((r) => [r, n]));
  const big = { v: 1, app: '222.222.222', opens: 200, crashes: 200, novoice: 200, started: all(200), finished: all(200), misses: all(200), hints: all(200) };
  assert.ok(JSON.stringify(big).length < 1024, JSON.stringify(big).length);
  const { env, crashes } = fakeEnv();
  assert.equal((await worker.fetch(post(big), env)).status, 204);
  assert.deepEqual(crashes(), [{ app: '222.222.222', n: 200 }]);
});

test('the Worker source never touches IP headers or logs', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /CF-Connecting-IP|X-Forwarded-For|request\.cf|console\./i);
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /\[observability\]\s*\nenabled = false/);
});
