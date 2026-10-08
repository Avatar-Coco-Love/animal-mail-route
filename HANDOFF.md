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
- Installable to the home screen and playable offline (manifest + service worker). PR #3 merged; the touch test passed all 54 checks against the live site afterwards.
- CI runs the worker tests and the touch test on every pull request.
- Parent corner shows a Progress row per player. Up to 8 player profiles on one device, with a "Who's playing?" picker once there are two (version 0.3, PR #4).

## Repo map
| Path | What |
| --- | --- |
| `index.html` | the whole game (CSS + one script block) |
| `privacy.html` | privacy page, linked from the parent corner |
| `fonts/` | Baloo 2 and Nunito (latin subsets, SIL OFL), served with the game |
| `audio/` | voice clips (none yet) and `clips.json`, the list of clips that exist |
| `TELEMETRY.md` | play counts design and rules (COPPA, Google Families) |
| `worker/` | Cloudflare Worker + D1 for play counts, with tests and deploy steps |
| `tests/touch.cjs` | touch smoke test (104 checks), local or live |
| `manifest.webmanifest`, `sw.js` | install and offline play; bump `VERSION` in `sw.js` on every release |
| `icons/` | app icons: `icon.svg` and `icon-maskable.svg` are the sources, `export.cjs` makes the PNGs |
| `.github/workflows/test.yml` | CI on pull requests: worker tests and the touch test |
| `PLAYTEST.md` | checklist for the owner's first playtest with a child |

## What it is
A mail delivery game for preschoolers (about ages 3 to 5). The child drags mail to the matching house and learns letters, animals, and numbers. Five animal friends (idea came from a coworker):

| Letter | Character |
| --- | --- |
| S | Sammy the Skunk |
| B | Billy the Beaver |
| K | Kelly the Kangaroo |
| C | Cody the Crane |
| P | Pete the Penguin |

Target: Android phone and tablet, touch-first. Built as plain HTML, CSS, and JavaScript (no framework, no build step), to be wrapped later (Capacitor) or shipped as an installable web app.

## Current state (all in `index.html`)
- Screens: title, "Who's playing?" (only with 2+ players), route map, delivery, sticker book, parent corner (press and hold the gear on the title screen).
- Routes: 1 letters (2 houses, growing to 5), 2 animal pictures, 3 mixed letters and pictures, 4 numbers (numeral or stars to count, houses numbered 1 to 5). Next route unlocks after 2 finished rounds of the previous one. Parent corner can unlock all.
- Round = 5 deliveries, then a sticker. No timers, no losing. Wrong house bounces back; after 2 misses the right house wiggles. Tap-then-tap-house works as well as dragging.
- Adaptive practice (routes 1 to 3): wrong answers raise a letter's score, first-try correct lowers it, weak letters are picked more often. Parent corner shows "Needs practice". Not used on route 4.
- Players: up to 8 on one device, each with an animal (one of the 5, may repeat) and an optional name (20 characters, typed only in the parent corner). Rounds, stickers and practice letters are per player; voice, sound effects, play counts and Unlock all are per device. With one player nothing changes from before. With two or more, Play opens "Who's playing?" (one big animal button per player, name under it if set) and the map's top bar shows the current player's animal, which returns to the picker.
- Parent corner: settings, Players (name field, animal choice, Erase per player, Add player), Progress and Needs practice for the selected player, and Erase everything.
- Animation: truck arrives and hops, animals blink, tap an animal on the title to hear its name, sparkle burst and flag on delivery, idle nudge after 10 seconds.
- Progress saved in `localStorage` under `animal-mail-route-v2`: `{v:2, device:{voice, sfx, share, unlockAll}, current, players:[{id, name, animal, rounds, stickers, weak}]}`. An old `animal-mail-route-v1` save is turned into player 1 on first load and the v1 key removed.

## Code layout (one script block)
- `CH` array: the characters (data driven, add an entry to add an animal). `ART`: inline SVG art per character.
- `CLIPS`: every spoken line, keyed by clip name (34 total). Text in `CLIPS` is what the built-in voice says when a recording is missing.
- `say([keys], fallbackText)`: plays `audio/<key>.mp3` for each key if ALL clips in the line are loaded, otherwise uses the browser's built-in speech.
- Levels: `unlocked`, `houseCount`, `kindFor`, `buildQueue` (adaptive weighting), `promptFor`, `paperHTML`.
- Parent corner shows how many of the 34 clips were found.
- Saved progress: `D` is the whole save, `S` is `D.device` (settings), `P` is the current player. `cleanSave`, `cleanPlayer`, `fromV1` validate; `load`, `save`, `useSave` near the top of the script. `unlocked(l, p)` takes an optional player.
- Players: `renderWho` (picker), `renderPlayers` and the `#players` handlers (parent corner), `erasePlayer`, `armed`/`disarm` (the two-tap erase buttons). `progressLines(p)` builds the Progress row text.
- Play counts (`COUNT_URL`, `count`, `sendCounts`): opt-in, anonymous, see `TELEMETRY.md`. Hidden until `COUNT_URL` is set.
- Fonts are served from `fonts/` (no Google Fonts request). `privacy.html` is the privacy page.
- Win card: `finishRound` sets `winTarget`. If the round just unlocked the next route the big button says "Next route" and starts it; otherwise "Play again" replays the route (also with "Unlock all" on, and after route 4).
- Service worker registration is the last thing in the script, and only over http(s).

## Install and offline
- `manifest.webmanifest`: standalone, sky blue theme, icons at 192 and 512 px plus a maskable 512 (artwork inside the 80% safe zone).
- `sw.js` precaches `index.html`, `privacy.html`, the manifest, fonts, icons and `audio/clips.json`, plus every clip that `clips.json` lists. Same-origin GETs are served stale-while-revalidate: from the cache at once, refreshed from the network behind, so a change shows on the second load. Cross-origin requests and POSTs (play counts) are not touched.
- **On every release, bump `VERSION` in `sw.js`** so installed copies drop the old cache. Add any new file the game needs offline to `CORE`.
- To redraw the icons, edit the SVGs and run `NODE_PATH="$(npm root -g)" node icons/export.cjs`.

## Audio
Recordings go in `audio/` (including `whos-playing.mp3`) named like `letter-S.mp3`, `sound-S.mp3`, `name-S.mp3`, `reward-S.mp3`, `num-3.mp3`, `who-gets-the.mp3`, and so on. The full list with exact wording and delivery notes is in the "Animal Mail Route: Voice Script" doc (a private Claude doc; if it is not reachable, regenerate the list from `CLIPS`). That doc predates the rename, so `name-C` and `reward-C` there may still say Charlie: the right lines are "Cody the Crane" and "C for Cody the Crane!". `CLIPS` is the source of truth. List the clips that exist in `audio/clips.json` (for example `["letter-S","sound-S"]`); the game only loads clips named there, so a missing list means no requests for missing files. The page loads clips with `fetch('audio/<key>.mp3')`, so it must be served over http(s), not opened from a file path.

## Testing
Run after any change to `index.html`:
```
npx http-server -p 8080 -s .      # in one terminal, from the repo root
NODE_PATH="$(npm root -g)" node tests/touch.cjs                 # local
NODE_PATH="$(npm root -g)" node tests/touch.cjs https://avatar-coco-love.github.io/animal-mail-route/   # live
```
It needs Playwright with Chromium; in Claude Code cloud sessions it is installed globally. CI (`.github/workflows/test.yml`) installs Playwright 1.56.1 and runs the same command on every pull request. It checks:
- 5 screen sizes (small phone, Pixel, phone sideways, tablet, tablet sideways): everything on screen, finger drag delivers, dragged mail stays visible, no console errors, no requests to other sites
- a full round with wrong tries, the hint and the win card
- the parent corner's press-and-hold, and swiping to Done on a sideways phone
- the crane is Cody; the win card says "Play again" after round 1 and "Next route" after the round that unlocks route 2, and each button goes where it says
- the manifest and its icons, the service worker taking control, then with the network off: the game, fonts and privacy page load and a delivery works
- the Progress row text against the unlock rule, with and without Unlock all
- a v1 save turning into player 1 (seeded with `addInitScript`; `newPage` takes an optional `{key: value}` to seed)
- with one player, no picker; adding a second player, the picker, separate progress, the top bar animal, erasing one player, Erase everything
- "Who's playing?" with 2 and with 8 players on all 5 screen sizes, everything on screen

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
- **Charlie the Crane becomes Cody the Crane.** "Cody", "C" (as "kuh") and "Crane" all start with the same hard k sound, which is what route 1 teaches. Done.
- **Win card button:** if finishing this round unlocks the next route, the button says "Next route" and starts it. Otherwise it says "Play again" and replays the route. Done.
- **Voice:** keep the built-in speech for now. Record or generate clips only after the real-device playtest, once the wording has settled.
- **Play counts:** leave the Worker undeployed until the owner wants numbers. Deploying needs their Cloudflare login.
- **Progress row and player profiles: build next** (owner asked, October 8). Spec below under "Next session".
- **Game hub idea: later.** The owner floated renaming and turning this into a hub of educational games for different ages and grades. Not now: only after this game reaches a finished point. See "Ideas for later".
- **Owner's time is limited (working a day job).** Prefer work Claude can finish alone. Batch anything that needs the owner (merging a PR, a playtest, a login) and ask for it in one short message.

## Open questions
- Art direction: the animals are simple placeholder SVGs.
- Game name: "Animal Mail Route" is a placeholder.

## Done
- GitHub repo, GitHub Pages hosting (PR #1 merged).
- Device fixes from touch testing, listed under Testing.
- Fonts served with the game, privacy page, clip list, favicon.
- Opt-in play counts: client, Worker, tests, end-to-end check against a local Worker.
- Cody rename, win card button, installable and offline, CI, `PLAYTEST.md` (PR #3).
- Parent-corner Progress row and player profiles (PR #4).

## Decisions made by Claude (October 8, 2026, second session)
Small calls made without the owner; change them if they're wrong.
- Win card keeps one icon (the play triangle) for both labels; only the words change.
- No Apple touch icon: the target is Android, and iOS adds its own corners to a full-bleed icon. Add one if iOS matters.
- Service worker uses stale-while-revalidate rather than cache-first, so a forgotten `VERSION` bump still shows changes on the second load.
- CI runs the worker tests without `npm install`: they use only Node built-ins, and installing wrangler would add a large download for nothing.
- The privacy page now says the browser keeps an offline copy of the game's own files (not information about the child).

## Built in the third session (PR #4): progress row and player profiles
The spec below was built as written; it stays here for reference. Decisions on what it left open are under "Decisions made by Claude (third session)".

Build these in one PR, in order. Run `tests/touch.cjs` locally after each change, commit as you go, open one PR at the end, and wait for CI to be green. Everything below is settled; don't ask the owner about it. Use your judgement on anything not covered, and add what you decided to the "Decisions made by Claude" list.

### Background: what exists today
- Progress the child can see: 3 stars per route on the map (one per finished round, capped at 3), a padlock on locked routes, 5 dots for deliveries in a round, and a sticker count in the sticker book. The next route opens after **2** rounds, so the 3rd star is a bonus. Houses per round also grow from 2 or 3 up to 5 as rounds are finished. None of this is shown to the parent as numbers.
- Reset (before this work): parent corner → Erase → tap again within 4 seconds. It erased everything.
- One save per device: `localStorage['animal-mail-route-v1']` = `{rounds:{1..4}, stickers:[{c}], unlockAll, voice, sfx, share, weak:{id:0..6}}`, handled by `defaults`, `load`, `save` near the top of the script. Play counts live separately under `animal-mail-route-counts`.

### 1. Progress row in the parent corner
- A "Progress" block in the parent corner, for the current player, with one line per route and a stickers line. For example:
  - Route 1, Letters: 3 rounds
  - Route 2, Animals: 1 round, so 1 more opens Route 3
  - Route 3, Letters and animals: locked
  - Route 4, Numbers: locked
  - Stickers: 4
- Use the same rule as `unlocked()`. When "Unlock all" is on, say "open (Unlock all is on)" rather than "locked".
- Keep "Needs practice" next to it; it becomes per player too (step 2).
- Don't change the map stars in this PR.

### 2. Player profiles (several children on one device)
- **Data:** a new key, `animal-mail-route-v2`: `{v:2, device:{voice, sfx, share, unlockAll}, current:<player id>, players:[{id, name, animal, rounds, stickers, weak}]}`. Rounds, stickers and practice letters are per player. Voice, sound effects, play counts and Unlock all stay per device: one setting for everyone, which suits a teacher.
- **Migration:** if v1 exists and v2 doesn't, turn v1 into player 1 (`name:''`, `animal:'S'`), save v2, then remove the v1 key. Validate as strictly as `load()` does today. Add a test that seeds v1 in `addInitScript` and checks the progress carries over.
- **Limits:** up to 8 players. The avatar is one of the 5 animals (`CH`), and two children can share one. A new player gets the first animal not yet used. Names are optional, at most 20 characters, and only a parent enters them, in the parent corner. Pre-readers can't type, so the child picks by animal picture.
- **One player (the default):** the game works exactly as today, with no extra screen. Single-child families see no change.
- **Two or more players:** tapping Play opens a "Who's playing?" screen with one big button per player (animal picture, with the name under it if set). The pick goes to that player's map. The map's top bar shows the current player's animal; tapping it returns to the picker. The voice says "Who's playing?" (add a `CLIPS` entry `whos-playing`, so the clip count becomes 34; update the "of 33" text and the docs).
- **Parent corner:** a Players section listing each player with an animal choice, a name field, and "Erase" for that player (tap again to confirm, like today). Add an "Add player" button, hidden at 8. The existing Erase becomes "Erase everything" (all players and settings, same two-tap confirm). The Progress and Needs practice rows show the selected player.
- **Privacy:** names never leave the device and are never in play counts (counts stay per device and anonymous). Add one sentence to `privacy.html` "Stored on your device", and bump its "Last updated" date.
- **Release:** bump `VERSION` in `sw.js` (`amr-v2`), and change `VERSION` and the "Prototype 0.2" note in `index.html` to 0.3.
- **Tests** (add to `tests/touch.cjs`):
  - v1 migration
  - add a second player in the parent corner, then "Who's playing?" appears and works on the 5 screen sizes, with everything on screen
  - progress stays separate per player
  - the progress row text matches the rule
  - erasing one player leaves the other
  - existing checks still pass with one player (no picker)

### 3. Then
- Update this file (repo map, code layout, current state, test count, decisions), open the PR, wait for green CI, and send the owner one short message: the PR link, and anything that needs them.

## Decisions made by Claude (October 8, 2026, third session)
Small calls made without the owner; change them if they're wrong.
- **Progress wording.** A route with 0 rounds says "0 rounds". The "so N more open(s) Route X" part is shown only while the next route is still closed, so it disappears once 2 rounds are done or Unlock all is on. A route opened only by Unlock all says "open (Unlock all is on)", or "2 rounds (Unlock all is on)" if it has rounds. Route 4 has no next route, so it shows only rounds.
- **Selecting a player in the parent corner:** tap anywhere on a player's card (or focus the name field). The selected card has a blue border and the Progress heading names them ("Progress: Mia", or the animal's name when there's no name). With one player the heading is just "Progress". The selection starts on the current player each time the corner opens.
- **Erasing the last player** clears their progress but keeps the profile (name and animal), since there is always at least one player.
- **Erasing the current player** makes the first remaining player current.
- **Erase everything** resets settings too (voice, sound effects, Unlock all and Share play counts back to their defaults) and deletes unsent play counts, as the spec says "all players and settings". Before, Erase kept voice, sound and sharing.
- **New player's animal:** the first animal nobody has; once all five are used, the least used one (first in `CH` order on a tie).
- **Player ids** are whole numbers, one more than the highest in use, so an erased player's id may be reused. Nothing outside the save refers to them.
- **Names** are trimmed and capped at 20 characters, escaped wherever they're shown, and only appear in the picker (under the animal), the map's top-bar label and the parent corner.
- **The picker appears every time Play is tapped** with 2+ players, and its back button goes to the title. The map's back button still goes to the title.
- **Picker buttons:** animal in a coloured circle, about 72 to 160 px depending on the screen; long names are cut with "…".
- **Parent corner order:** settings, clip count, Players, Progress, Needs practice, Erase everything. The card is longer, so the sideways-phone test may swipe up to 4 times to reach Done.
- **v1 migration** only runs when v2 is missing. If v1 can't be parsed, the game starts fresh and keeps the v1 key untouched (nothing is lost by not migrating junk). An unreadable v2 also starts fresh.
- **`privacy.html`:** the "Stored on your device" paragraph now mentions per-player progress, the animal and optional name, and that names never leave the device and are never part of play counts. The example game version in the play counts table is 0.3. "Last updated" was already October 8, 2026, today's date, so it stays.
- **`PLAYTEST.md`** asks for the Progress lines and the number of players.

## Ideas for later
- **Game hub (owner's idea, October 8, 2026):** a new overall name, and a home for several educational games grouped by age or grade, with Animal Mail Route as one of them. Deferred until this game reaches a finished point. Keep it in mind now:
  - Keep player profiles in their own storage key with a plain shape, so a hub could share them across games later.
  - Don't hard-code the `/animal-mail-route/` path. All URLs are relative today; keep it that way.
  - Moving to a new repo name or path changes the URL, which changes the service worker scope and loses installed home-screen copies. Saved progress stays on the same origin (`avatar-coco-love.github.io`), but a custom domain would be a different origin. If the hub happens, choose its final address once, and plan a one-time move of saved progress.
- **Classroom:** shared tablets plus profiles plus "Unlock all" covers basic classroom use with nothing collected. A teacher dashboard across devices needs a server and accounts, which brings COPPA school consent, FERPA and district data agreements. Only do it if a real classroom asks. A middle step is a printable per-child summary on the device.
- **Map stars:** consider showing that 2 stars open the next route (for example, light up the path to the next node).

## Later steps (need the owner)
1. **Real-device playtest** with a 3 to 5 year old on an Android phone or tablet, using `PLAYTEST.md`. The notes become the next fixes.
2. **Voice clips:** record or generate the 34 lines in `CLIPS`, put them in `audio/`, list them in `audio/clips.json`.
3. **Deploy the play-count Worker** (`worker/README.md`), then set `COUNT_URL` in `index.html`.
4. **Later:** finished art, a final name, per-animal voices, Android packaging (Capacitor or a Trusted Web Activity) for Google Play. Play's Families policy then applies; `TELEMETRY.md` has the Data safety answers.
