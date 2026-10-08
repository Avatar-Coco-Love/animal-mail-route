# animal-mail-counts (Cloudflare Worker)

Receives the opt-in, anonymous play counts described in `../TELEMETRY.md` and adds them to daily totals in a D1 database. It stores only `(UTC day, metric, route) -> total`, never reads IP headers, and has request logging turned off.

## Test
```
npm install
npm test
```
The tests run the Worker against SQLite (Node 22 or newer). For a local run with a real local D1: `npx wrangler d1 execute animal-mail-counts --local --file=schema.sql`, then `npx wrangler dev --var ALLOWED_ORIGINS:http://localhost:8080`.

## Deploy (free plan is enough)
1. `npx wrangler login`
2. `npx wrangler d1 create animal-mail-counts` and paste the printed `database_id` into `wrangler.toml`.
3. `npx wrangler d1 execute animal-mail-counts --remote --file=schema.sql`
4. `npx wrangler deploy`. It prints a URL like `https://animal-mail-counts.<your-subdomain>.workers.dev`.
5. In the Cloudflare dashboard, open the Worker > Settings > Observability and confirm Workers Logs is off.
6. In `../index.html`, set `COUNT_URL` to that URL plus `/v1/counts`, then commit. The "Share play counts" setting only appears in the parent corner once `COUNT_URL` is set.

If the game is hosted somewhere other than `https://avatar-coco-love.github.io`, add that origin to `ALLOWED_ORIGINS` in `wrangler.toml` and deploy again.

## Read the totals
```
npx wrangler d1 execute animal-mail-counts --remote --command "SELECT day, metric, route, n FROM counts ORDER BY day DESC, metric, route"
```
Metrics: `opens` (route 0), `started`, `finished`, `misses` (routes 1 to 4).
