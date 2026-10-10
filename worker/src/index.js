// Receives anonymous play counts from Animal Mail Route and adds them to daily totals.
// See ../TELEMETRY.md. Rules this file keeps:
// - never reads the caller's IP address or any other header except Origin and Content-Length
// - never logs a request
// - stores only (UTC day, metric, route) -> total

const MAX_BODY = 1024;
const CAP = 200;
const METRICS = ['started', 'finished', 'misses'];
const ROUTES = ['1', '2', '3', '4', '5', '6', '7'];
const KEYS = new Set(['v', 'app', 'opens', ...METRICS]);

function isCount(n) {
  return Number.isInteger(n) && n >= 0 && n <= CAP;
}

// Returns [{metric, route, n}] for a valid message, or null. Anything unexpected is rejected.
export function parseCounts(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  for (const k of Object.keys(body)) if (!KEYS.has(k)) return null;
  if (body.v !== 1) return null;
  if (typeof body.app !== 'string' || !/^\d{1,3}\.\d{1,3}(\.\d{1,3})?$/.test(body.app)) return null;
  if (!isCount(body.opens)) return null;
  const rows = [];
  if (body.opens > 0) rows.push({ metric: 'opens', route: 0, n: body.opens });
  for (const m of METRICS) {
    const o = body[m];
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    for (const [route, n] of Object.entries(o)) {
      if (!ROUTES.includes(route) || !isCount(n)) return null;
      if (n > 0) rows.push({ metric: m, route: Number(route), n });
    }
  }
  return rows;
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return origin && list.includes(origin) ? origin : null;
}

function reply(status, origin) {
  const headers = { 'Cache-Control': 'no-store' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
    headers['Vary'] = 'Origin';
  }
  return new Response(null, { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/v1/counts') return reply(404);
    const origin = allowedOrigin(request, env);
    if (!origin) return reply(403);
    if (request.method === 'OPTIONS') return reply(204, origin);
    if (request.method !== 'POST') return reply(405, origin);

    if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY) return reply(413, origin);
    const text = await request.text();
    if (text.length > MAX_BODY) return reply(413, origin);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return reply(400, origin);
    }
    const rows = parseCounts(body);
    if (!rows) return reply(400, origin);
    if (!rows.length) return reply(204, origin);

    const day = new Date().toISOString().slice(0, 10);
    const add = env.DB.prepare(
      'INSERT INTO counts (day, metric, route, n) VALUES (?1, ?2, ?3, ?4) ' +
        'ON CONFLICT (day, metric, route) DO UPDATE SET n = n + excluded.n'
    );
    await env.DB.batch(rows.map((r) => add.bind(day, r.metric, r.route, r.n)));
    return reply(204, origin);
  },
};
