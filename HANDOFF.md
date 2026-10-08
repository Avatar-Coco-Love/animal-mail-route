# Animal Mail Route: handoff

Read this first, then open `index.html`. It is the whole game, as a standalone page.

**Live:** https://avatar-coco-love.github.io/animal-mail-route/ (GitHub Pages, deploys from `main`, root folder, a minute or two after each merge). Repo: `Avatar-Coco-Love/animal-mail-route`.

An older copy also exists as a Claude artifact. It predates the fixes below, so treat this repo as the source of truth.

## Where things stand (October 8, 2026)
- Playable and public. Tested in emulated Android Chrome with real touch input at 5 phone and tablet sizes, on the live site too. All checks pass.
- Not yet played on a real device or by a child.
- Voice is the device's built-in speech; no recordings yet.
- Opt-in play counts are built, but the Worker isn't deployed, so the setting is hidden and nothing is collected.
- Privacy page is live. The game contacts no site except the one it's hosted on.

## Repo map
| Path | What |
| --- | --- |
| `index.html` | the whole game (CSS + one script block) |
| `privacy.html` | privacy page, linked from the parent corner |
| `fonts/` | Baloo 2 and Nunito (latin subsets, SIL OFL), served with the game |
| `audio/` | voice clips (none yet) and `clips.json`, the list of clips that exist |
| `TELEMETRY.md` | play counts design and rules (COPPA, Google Families) |
| `worker/` | Cloudflare Worker + D1 for play counts, with tests and deploy steps |
| `tests/touch.cjs` | touch smoke test (38 checks), local or live |

## What it is
A mail delivery game for preschoolers (about ages 3 to 5). The child drags mail to the matching house and learns letters, animals, and numbers. Five animal friends (idea came from a coworker):

| Letter | Character |
| --- | --- |
| S | Sammy the Skunk |
| B | Billy the Beaver |
| K | Kelly the Kangaroo |
| C | Charlie the Crane |
| P | Pete the Penguin |

Target: Android phone and tablet, touch-first. Built as plain HTML, CSS, and JavaScript (no framework, no build step), to be wrapped later (Capacitor) or shipped as an installable web app.

## Current state (all in `index.html`)
- Screens: title, route map, delivery, sticker book, parent corner (press and hold the gear on the title screen).
- Routes: 1 letters (2 houses, growing to 5), 2 animal pictures, 3 mixed letters and pictures, 4 numbers (numeral or stars to count, houses numbered 1 to 5). Next route unlocks after 2 finished rounds of the previous one. Parent corner can unlock all.
- Round = 5 deliveries, then a sticker. No timers, no losing. Wrong house bounces back; after 2 misses the right house wiggles. Tap-then-tap-house works as well as dragging.
- Adaptive practice (routes 1 to 3): wrong answers raise a letter's score, first-try correct lowers it, weak letters are picked more often. Parent corner shows "Needs practice". Not used on route 4.
- Animation: truck arrives and hops, animals blink, tap an animal on the title to hear its name, sparkle burst and flag on delivery, idle nudge after 10 seconds.
- Progress saved in `localStorage` under `animal-mail-route-v1`.

## Code layout (one script block)
- `CH` array: the characters (data driven, add an entry to add an animal). `ART`: inline SVG art per character.
- `CLIPS`: every spoken line, keyed by clip name (33 total). Text in `CLIPS` is what the built-in voice says when a recording is missing.
- `say([keys], fallbackText)`: plays `audio/<key>.mp3` for each key if ALL clips in the line are loaded, otherwise uses the browser's built-in speech.
- Levels: `unlocked`, `houseCount`, `kindFor`, `buildQueue` (adaptive weighting), `promptFor`, `paperHTML`.
- Parent corner shows how many of the 33 clips were found.
- Play counts (`COUNT_URL`, `count`, `sendCounts`): opt-in, anonymous, see `TELEMETRY.md`. Hidden until `COUNT_URL` is set.
- Fonts are served from `fonts/` (no Google Fonts request). `privacy.html` is the privacy page.

## Audio
Recordings go in `audio/` named like `letter-S.mp3`, `sound-S.mp3`, `name-S.mp3`, `reward-S.mp3`, `num-3.mp3`, `who-gets-the.mp3`, and so on. The full list with exact wording and delivery notes is in the "Animal Mail Route: Voice Script" doc (a private Claude doc; if it is not reachable, regenerate the list from `CLIPS`). List the clips that exist in `audio/clips.json` (for example `["letter-S","sound-S"]`); the game only loads clips named there, so a missing list means no requests for missing files. The page loads clips with `fetch('audio/<key>.mp3')`, so it must be served over http(s), not opened from a file path.

## Testing
Run after any change to `index.html`:
```
npx http-server -p 8080 -s .      # in one terminal, from the repo root
NODE_PATH="$(npm root -g)" node tests/touch.cjs                 # local
NODE_PATH="$(npm root -g)" node tests/touch.cjs https://avatar-coco-love.github.io/animal-mail-route/   # live
```
It needs Playwright with Chromium; in Claude Code cloud sessions it is installed globally. It checks:
- 5 screen sizes (small phone, Pixel, phone sideways, tablet, tablet sideways): everything on screen, finger drag delivers, dragged mail stays visible, no console errors, no requests to other sites
- a full round with wrong tries, the hint and the win card
- the parent corner's press-and-hold, and swiping to Done on a sideways phone

Worker tests: `cd worker && npm install && npm test`.

Bugs found and fixed in the first touch pass (October 8, 2026):
- Dragged mail disappeared as soon as it left the sky area (the mail zone clipped it), so a child could not see what they were dragging. The delivery fly-in was hidden too. Only the clouds are clipped now.
- Phone held sideways: routes 3 and 4 were off the bottom of the map and could not be reached. The map now runs left to right on short landscape screens.
- Phone held sideways: the parent corner's Done and Erase buttons and the win card's buttons were cut off. Overlays now scroll, and cards are more compact on short screens.
- Phone held sideways: the success banner was clipped and the caption overlapped the road. The play screen is tighter on short screens.
- Android Chrome: the page height used 100%, which assumes the URL bar is hidden, so the bottom of the street could sit under the browser chrome. It now uses 100dvh. Safe-area padding moved to the body (it was counted twice for the title corner buttons).
- Gear button ignores browser touch gestures so a small finger wobble does not cancel the press and hold.

Still needs a real device (emulation cannot check these):
- The built-in voice: whether Android speaks the prompts, how it sounds, and whether a line is ever dropped when a new one interrupts it.
- Sound effects volume, and whether audio starts after the first tap.
- How the drag feels to a small child's finger, and the 60 to 76 px houses on a sideways phone.
- The URL bar fix on a real Android Chrome.

## Decisions (made October 8, 2026; the owner accepted these recommendations)
- **Charlie the Crane becomes Cody the Crane.** "Cody", "C" (as "kuh") and "Crane" all start with the same hard k sound, which is what route 1 teaches. Not yet applied in code.
- **Win card button:** if finishing this round unlocks the next route, the button says "Next route" and starts it. Otherwise it says "Play again" and replays the route. Not yet applied in code.
- **Voice:** keep the built-in speech for now. Record or generate clips only after the real-device playtest, once the wording has settled.
- **Play counts:** leave the Worker undeployed until the owner wants numbers. Deploying needs their Cloudflare login.
- **Owner's time is limited (working a day job).** Prefer work Claude can finish alone. Batch anything that needs the owner (merging a PR, a playtest, a login) and ask for it in one short message.

## Open questions
- Art direction: the animals are simple placeholder SVGs.
- Game name: "Animal Mail Route" is a placeholder.

## Done
- GitHub repo, GitHub Pages hosting (PR #1 merged).
- Device fixes from touch testing, listed under Testing.
- Fonts served with the game, privacy page, clip list, favicon.
- Opt-in play counts: client, Worker, tests, end-to-end check against a local Worker.

## Next session: work that needs nothing from the owner
Do these in order. Run `tests/touch.cjs` locally after each change to `index.html`. Open one PR at the end, then ask the owner to merge it.
1. **Rename Charlie to Cody** everywhere: `CH`, aria labels, `CLIPS` (`name-C`, `reward-C`), docs. Check the voice script note under Audio.
2. **Win card button** as decided above. Add a check for it in `tests/touch.cjs`.
3. **Installable and offline:**
   - `manifest.webmanifest` with name, colors and `display: standalone`
   - icons at 192 and 512 px, plus a maskable one, drawn as SVG and exported to PNG
   - a small service worker caching `index.html`, `privacy.html`, `fonts/` and `audio/`, with a version string to bump on each release
   - test offline play in Playwright (`context.setOffline(true)` after the first load)
   - keep it free of third-party requests
4. **CI:** a GitHub Actions workflow on pull requests that runs `worker` tests and `tests/touch.cjs` against a local server. Install Playwright Chromium in the workflow.
5. **Playtest sheet for the owner:** `PLAYTEST.md`, a short phone-friendly checklist for a parent watching a child play (voice heard? can drag? understood the prompts? where stuck?), with space for notes to paste back to Claude.
6. Update this file, then open the PR and give the owner the merge link plus anything else that needs them, in one message.

## Later steps (need the owner)
1. **Real-device playtest** with a 3 to 5 year old on an Android phone or tablet, using `PLAYTEST.md`. The notes become the next fixes.
2. **Voice clips:** record or generate the 33 lines in `CLIPS`, put them in `audio/`, list them in `audio/clips.json`.
3. **Deploy the play-count Worker** (`worker/README.md`), then set `COUNT_URL` in `index.html`.
4. **Later:** finished art, a final name, per-animal voices, Android packaging (Capacitor or a Trusted Web Activity) for Google Play. Play's Families policy then applies; `TELEMETRY.md` has the Data safety answers.
