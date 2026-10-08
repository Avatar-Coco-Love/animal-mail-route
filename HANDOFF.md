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

## Open questions
- Charlie the Crane: "Charlie" starts with "ch", but the letter C and "Crane" start with a hard "k" sound. Keep the wording or rename him before recording the C clips.
- Art direction: the animals are simple placeholder SVGs.
- Game name: "Animal Mail Route" is a placeholder.

## Done
- GitHub repo, GitHub Pages hosting (PR #1 merged).
- Device fixes from touch testing, listed under Testing.
- Fonts served with the game, privacy page, clip list, favicon.
- Opt-in play counts: client, Worker, tests, end-to-end check against a local Worker.

## Next steps, in order
1. **Real-device playtest** (needs a person and an Android phone or tablet). Check the "Still needs a real device" list above, and watch a 3 to 5 year old play: can they drag, do they understand the prompts, where do they get stuck. Bring the notes back as fixes.
2. **Settle Charlie the Crane** before recording (see Open questions).
3. **Voice clips.** Record or generate the 33 clips in `CLIPS`, put them in `audio/`, list them in `audio/clips.json`. The parent corner shows how many were found. This matters most for 3 year olds, who can't read the captions.
4. **Deploy the play-count Worker** when you want numbers: `worker/README.md` (needs the owner's Cloudflare login). Then set `COUNT_URL` in `index.html`, which makes the parent setting appear. Run `tests/touch.cjs` afterwards; the "setting hidden" check passes either way.
5. **Installable offline web app**: a manifest, icons and a service worker caching `index.html`, `fonts/` and `audio/`. Useful in the car, and a step toward Android packaging.
6. **Later:** finished art, a final name, per-animal voices, Android packaging (Capacitor or a Trusted Web Activity) for Google Play. Play's Families policy then applies; `TELEMETRY.md` has the Data safety answers.

Small known oddity: "Next route" on the win card replays the same route (the card calls each round a "route"). Rename it to "Play again", or make it advance once the next route unlocks.
