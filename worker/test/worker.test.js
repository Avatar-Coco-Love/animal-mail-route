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
  return { env: { DB, ALLOWED_ORIGINS: ORIGIN }, rows };
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

const good = { v: 1, app: '0.2', opens: 1, started: { 1: 3, 2: 1 }, finished: { 1: 2 }, misses: { 1: 4 } };

test('valid message is added to the daily totals', async () => {
  const { env, rows } = fakeEnv();
  const res = await worker.fetch(post(good), env);
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  await worker.fetch(post(good), env);
  assert.deepEqual(rows(), [
    { metric: 'finished', route: 1, n: 4 },
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
    { ...good, started: { 5: 1 } },
    { ...good, started: { 1: '3' } },
    { ...good, misses: { 1: 999 } },
    { ...good, finished: [1] },
    { ...good, device: 'abc' },
    { ...good, id: 'x' },
    { v: 1, app: '0.2', opens: 1 },
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
  const res = await worker.fetch(post({ v: 1, app: '0.2', opens: 0, started: {}, finished: {}, misses: {} }), env);
  assert.equal(res.status, 204);
  assert.deepEqual(rows(), []);
});

test('parseCounts accepts exactly what the game sends', () => {
  assert.deepEqual(parseCounts({ v: 1, app: '0.2', opens: 0, started: { 4: 1 }, finished: {}, misses: {} }), [
    { metric: 'started', route: 4, n: 1 },
  ]);
});

test('the Worker source never touches IP headers or logs', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /CF-Connecting-IP|X-Forwarded-For|request\.cf|console\./i);
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /\[observability\]\s*\nenabled = false/);
});
