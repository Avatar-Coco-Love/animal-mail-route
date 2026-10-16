# Telemetry plan: anonymous play counts

Status: built and tested locally (game client, Worker, privacy page). The Worker is not deployed yet, so `COUNT_URL` in `index.html` is empty and the setting is hidden. Deploy steps: `worker/README.md`.

## Goal
Learn roughly how much the game is played and which routes children finish, without collecting anything about who is playing. This is a children's game, so COPPA and Google Play's Families policy apply.

## Rules
1. **Off by default.** Nothing is counted or sent until a parent turns on "Share play counts" in the parent corner (behind the press-and-hold gate). Turning it off deletes any counts not yet sent.
2. **Count events, never people.** No install ID, cookie, device fingerprint, advertising ID or session ID. COPPA treats a persistent identifier as personal information, so there is none.
3. **No third parties.** No analytics or ad SDKs. Counts go to our own Cloudflare Worker.
4. **No IP addresses kept.** The Worker never reads, logs or stores the client IP. Workers logs and observability stay off.
5. **No timestamps from the device.** The server files counts under the UTC date it receives them. No time of day.
6. **Write down exactly what is collected** (this file, plus the parent-facing note below).

## What is collected
One small message per play session, only when sharing is on:

```json
{"v":1, "app":"2.2", "opens":1, "crashes":0, "novoice":0,
 "started":{"1":3,"2":1}, "finished":{"1":2,"2":1}, "misses":{"1":4}, "hints":{"1":1}}
```

| Field | Meaning |
| --- | --- |
| `v` | message format version |
| `app` | game version |
| `opens` | times the game was opened |
| `crashes` | opens where one of the game's own scripts hit an error (once per open; 2.2) |
| `novoice` | opens where the voice couldn't play: the title showed the "voice can't play" note, as in Messenger's browser (once per open; 2.2) |
| `started` | rounds started, by route (1 to 7) |
| `finished` | rounds finished, by route |
| `misses` | wrong-house drops, by route |
| `hints` | times the wiggling-house help showed, by route (once per mail, after the 2nd wrong house; 2.2) |

The server adds these totals into daily rows: `(date, metric, route) -> count`, and crashes into `(date, game version) -> count`, so a bad release shows up. Nothing else is kept. The owner approved `crashes`, `hints` and `novoice` in the data review of October 16, 2026, under the rule "collect only what's useful".

**Not collected:** names, ages, letters a child got wrong, sticker book contents, device or browser details, location, IP address, any identifier, and no error text: a crash is only counted, never described. Errors from files other than the game's own (for example scripts an app's browser adds to the page) are not counted. An error before the play-count code has loaded (very early in start-up) can't be counted.

## Client (index.html)
- New setting `S.share` (default `false`) and a parent-corner row "Share play counts" with the On/Off toggle used for the other settings.
- Counts are only added up while `S.share` is on: `opens` at boot, `started` in `startLevel`, `finished` in `finishRound`, `misses` in `wrong`, `hints` in `wrong` when the 2nd miss on a mail lights the right house, `crashes` from a window `error` event whose file is the game's own (once per open), `novoice` when the page is first hidden while `voiceMissing()` is true (once per open; voices can arrive after start-up, so it waits until then).
- Stored counts carry the game version; on load, unsent `crashes` from another version are dropped so they aren't filed under the new one.
- Counts not yet sent are kept in `localStorage` under `animal-mail-route-counts` so they survive a closed tab. They are separate from progress, and turning the setting off clears them.
- Send on `visibilitychange` to hidden with `navigator.sendBeacon(ENDPOINT, JSON)`. Clear the stored counts only if `sendBeacon` returns `true`; otherwise they go with the next send. If the counts are empty, send nothing.
- Cap each counter (for example 200) so a broken loop can't send nonsense.

## Server (Cloudflare Worker + D1)
- `POST /v1/counts` only. CORS allows only the GitHub Pages origin (and the future app origin).
- Strict validation: exact keys (every key required; 2.1 and earlier never sent, since `COUNT_URL` was empty), integers 0 to 200, routes 1 to 7, body under 1 KB. Reject everything else with 400 and keep nothing.
- D1 table `counts(day TEXT, metric TEXT, route INTEGER, n INTEGER, PRIMARY KEY(day, metric, route))`, plus `crashes(day TEXT, app TEXT, n INTEGER, PRIMARY KEY(day, app))`. Write with `INSERT ... ON CONFLICT DO UPDATE SET n = n + excluded.n` so concurrent sends add correctly (KV is not atomic, so it doesn't fit).
- Never read the `CF-Connecting-IP` header, and don't `console.log` requests. Turn observability off in `wrangler.toml`.
- Read the numbers with `wrangler d1 execute` (no public read endpoint).
- Abuse: without IPs there is no per-client rate limit. Accept some noise; the per-message caps limit how much one bad sender can skew the totals.

## Parent-facing note (parent corner and privacy page)
> Share play counts (off unless you turn it on): the game sends totals such as "3 rounds played on route 1", how often the help showed, and whether the game crashed or the voice couldn't play, to the game's own server. It sends no name, no device ID, no location and nothing that identifies your child, and the server does not keep IP addresses.

## Before shipping
- Done: the two fonts (Baloo 2, Nunito) are served from `fonts/` instead of Google Fonts, so playing makes no third-party request.
- Done: `privacy.html`, linked from the parent corner.
- Google Play (later): in the Data safety form, declare App activity > App interactions, not linked to the user, not used for tracking, optional.

## Build steps
1. Done: self-host the fonts.
2. Done: Worker + D1 schema + validation (`worker/`, 11 tests: `cd worker && npm test`).
3. Done: client toggle, counters, send on hide.
4. Done: end-to-end check against `wrangler dev` with a local D1 in an emulated phone. With sharing off, no request was made. With it on, one message per hide with the expected totals, and the stored counts were cleared. Turning it off deleted the unsent counts. The only hosts contacted were the game and the Worker.
5. Done: privacy page, linked from the parent corner.
6. To do: deploy the Worker and set `COUNT_URL` (`worker/README.md`).
7. Done (2.2): `crashes`, `hints` and `novoice`, in the game, the Worker, the touch test ("play counts" checks, with a test `COUNT_URL` and a recording `sendBeacon`) and both privacy pages.
