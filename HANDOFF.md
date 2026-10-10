# Animal Mail Route: handoff

Read this first, then open `index.html`. It is the whole game, as a standalone page.

**Live:** https://avatar-coco-love.github.io/animal-mail-route/ (GitHub Pages, deploys from `main`, root folder, a minute or two after each merge). Repo: `Avatar-Coco-Love/animal-mail-route`.

An older copy also exists as a Claude artifact. It predates the fixes below, so treat this repo as the source of truth.

## Where things stand (October 10, 2026)
- Playable and public. Tested in emulated Android Chrome with real touch input at 5 phone and tablet sizes, on the live site too. All checks pass.
- Not yet played on a real device or by a child.
- Voice is the device's built-in speech; no recordings yet.
- Opt-in play counts are built, but the Worker isn't deployed, so the setting is hidden and nothing is collected.
- Privacy page is live. The game contacts no site except the one it's hosted on.
- Installable to the home screen and playable offline (manifest + service worker). PR #3 merged; the touch test passed all 54 checks against the live site afterwards.
- CI runs the worker tests and the touch test on every pull request.
- Parent corner shows a Progress row per player. Up to 8 player profiles on one device, with a "Who's playing?" picker once there are two (version 0.3, PR #4). The touch test passed all 104 checks against the live site after PR #4 merged.
- Version 0.4 (fourth session): the map path lights up as routes open, and the parent corner can print a one-page summary per child. The touch test passed all 122 checks against the live site afterwards.
- Version 0.5 (fifth session): Lighthouse pass (mobile Performance 79 → 98 on the live site, the rest 100), and "Print all players" (one page per child) in the parent corner. PR #6 merged; the touch test passed all 129 checks against the live site afterwards.
- Version 0.6 (sixth session): Phase 1 of the expansion roadmap, the friend library. A letter can have several animal friends who take turns between rounds; Sally the Seal joins S as the first second friend.
- Version 0.7 (seventh session): Phase 2 of the expansion roadmap, letter sets. Each player has a set of letters, chosen in the parent corner, and routes 1 to 3 use only those. The touch test passes all 160 checks locally.
- Version 0.8 (eighth session): Phase 3 of the expansion roadmap, more animal friends. Every letter but X has a friend, and every letter but Q, U, V, Y and X has two who take turns (46 friends in all). A player's animal can be any friend ("More" in the parent corner). The touch test passes all 174 checks locally.
- Version 0.8.1 (owner feedback before Phase 4): the parent-corner button (bottom right of the title screen) is now a real cog, since the old icon read as a light; while it is held a red ring runs once round it from the top and the corner opens when the ring closes. "All" letters now includes Q and U. The title screen shows 5 random friends (different letters, with their own names) on every load. The touch test passes all 176 checks locally.
- Version 0.9 (ninth session): Phase 4 of the expansion roadmap, map with tracks. Letters (routes 1 to 3) and Numbers (route 4) each have their own unlock chain, so numbers are open from the start. Also from owner feedback: two quick taps on the gear show a "press and hold" tip, and a shared link now shows a preview picture. The touch test passes all 195 checks locally.
- Version 1.0 (tester feedback: "star system vs next node, which way to progress?"): routes show 2 stars, matching the 2 rounds that open the next route (the 3rd star used to be a bonus that opened nothing). The player's animal sits on the map's route to play next, and a route that just opened pulses until it is played. The win card says "Next route" whenever the next route is open and not yet played, not only on the round that opened it. The parent corner and printed summary say that replays add houses and switch animals on purpose. The touch test passes all 201 checks locally.
- Version 1.1 (tenth session, owner request: "add other languages, starting with Spanish"): language groundwork. Every word in the game comes from a language table, each language has its own voice, animal friends and first five letters, and each player keeps separate progress per language. A Mexican Spanish draft is complete but **not offered yet** (`ready:false`): families see no change; it can be tried at `?lang=es`. See "Languages" below. The touch test passes all checks locally.
- Version 1.2 (eleventh session, Languages step 2 without the review): the Spanish address `es/` (Spanish link preview, and installs as "Correo Animal" / "El Correo de los Animales"), a Spanish privacy page, and a Spanish playtest sheet. Spanish is still **not offered** (`ready:false`); no Spanish review notes yet. PR #15 merged; the touch test passed all 246 checks against the live site afterwards.
- Version 1.3 (eleventh session, second PR): new pictures for D (delfín), Ñ (ñandú) and Q (quetzal), and three Spanish friends who use them, Dani el Delfín, Ñico el Ñandú and Quique el Quetzal (36 Spanish friends; only U, W and X have none). Spanish is still hidden. PR #16 merged; the touch test passed all 251 checks against the live site afterwards.
- Version 1.4 (twelfth session, owner decision): **Spanish is offered to everyone** (`ready:true`) without a native-speaker review. The title shows "Español" / "English" beside the gear, the parent corner has the language row, and a Spanish device gets Spanish on a first visit. The Spanish parent corner and `privacy-es.html` say (in Spanish) that the translation is a draft and ask for corrections. Child screens are unchanged. The touch test passes all 261 checks locally. PR #18 merged.
- Version 1.5 (twelfth session, second PR): **Help improve the game** in the parent corner (both languages): "A wrong word or translation", "Report a problem", "Suggest an idea". Each is a `mailto:` link to the contact address with a prefilled subject and body (questions to answer, then the game version, language and screen size). The parent's own email app opens; the game sends nothing, and the email never carries anything about the child. Both privacy pages describe it. The Spanish draft note now points to it.
- **Next:** the twelfth session's plan, in order (one PR each): volunteer voices (voice sets, voice choice, volunteer recording page), then Phase 5 starting with Letter sounds. See "Owner decisions, October 10, 2026". If Spanish review notes or playtest notes arrive, fix those first, in their own PR.

## Owner decisions, October 10, 2026
- The owner doesn't speak Spanish and has no playtesters yet. **Spanish goes live for everyone now, without a native-speaker review.** Families who speak Spanish will help correct it through the in-app feedback.
- **Contact address** for feedback and voice volunteers: `clements.cody.j@gmail.com`. It is visible to anyone who uses the game or reads the repo; the owner chose this.
- **Volunteer voices:** male and female, in English and Spanish.
- Spanish review notes: none yet. Playtest notes: none yet. If either arrives later, fix its findings first, in their own PR.
- Work, one PR per step: 1. turn Spanish on, labelled a draft for parents (1.4); 2. feedback inside the app, parent corner only, as a prefilled email the parent sends themselves, never anything about the child; 3. volunteer voices: voice sets `audio/<lang>/<female|male>/`, a voice choice in the parent corner, and a volunteer recording page (adults only, nothing uploads); 4. Phase 5, starting with Letter sounds, in both languages.

## Repo map
| Path | What |
| --- | --- |
| `index.html` | the whole game (CSS + one script block) |
| `privacy.html`, `privacy-es.html` | privacy page in English and Spanish, linked from the parent corner (each language names its page in `t.privacyPage`) |
| `es/` | the Spanish address: `index.html` (Spanish link preview, then opens `../?lang=es`) and `manifest.webmanifest` (the Spanish installed app) |
| `fonts/` | Baloo 2 and Nunito (latin subsets, SIL OFL), served with the game |
| `audio/` | English voice clips (none yet) and `clips.json`, the list of clips that exist; `audio/es/` the same for Spanish |
| `TELEMETRY.md` | play counts design and rules (COPPA, Google Families) |
| `worker/` | Cloudflare Worker + D1 for play counts, with tests and deploy steps |
| `tests/touch.cjs` | touch smoke test (280 checks), local or live |
| `manifest.webmanifest`, `sw.js` | install and offline play; bump `VERSION` in `sw.js` on every release |
| `icons/` | app icons: `icon.svg` and `icon-maskable.svg` are the sources, `export.cjs` makes the PNGs. `share.png` and `share-es.png` are the link preview pictures, made by `share.cjs` from the title screen (`node icons/share.cjs [url] es` for Spanish) |
| `.github/workflows/test.yml` | CI on pull requests: worker tests and the touch test |
| `PLAYTEST.md` | checklist for the owner's first playtest with a child, and a Spanish sheet (Hoja de prueba) for a Spanish-speaking family |

## What it is
A mail delivery game for preschoolers (about ages 3 to 5). The child drags mail to the matching house and learns letters, animals, and numbers. Five animal friends (idea came from a coworker), plus Sally the Seal, a second S friend added in 0.6. Since 0.8 every letter but X has a friend (the full list is `FRIENDS` in `index.html`, and the table under "Phase 3" below); these five are still the default letters (since 0.8.1 the title cast is 5 random friends on each load):

| Letter | Character |
| --- | --- |
| S | Sammy the Skunk |
| B | Billy the Beaver |
| K | Kelly the Kangaroo |
| C | Cody the Crane |
| P | Pete the Penguin |
| S | Sally the Seal (second S friend, 0.6) |

Target: Android phone and tablet, touch-first. Built as plain HTML, CSS, and JavaScript (no framework, no build step), to be wrapped later (Capacitor) or shipped as an installable web app.

## Current state (all in `index.html`)
- Screens: title, "Who's playing?" (only with 2+ players), route map, delivery, sticker book, parent corner (press and hold the gear at the bottom right of the title screen until the red ring closes, about 1.2 seconds), printable summary (from the parent corner).
- Map tracks (0.9): two tracks, each with its own unlock chain. Letters, labelled "ABC", has routes 1 to 3; Numbers, labelled "123", has route 4. Upright they are two columns side by side; on a sideways phone, two rows. Both have the same number of slots, so the first route of each sits level. Route 4 is open from the start.
- Gear tip (0.9): a press on the gear that lets go before the ring closes counts as a short tap. Two in a row (each within 3 seconds of the last) show a dark bubble above the gear: "Press and hold the gear to open the parent corner." It goes after 5 seconds, on the next press, or when the corner opens. Text only, not spoken.
- Link preview (0.9): Open Graph and Twitter card tags in `index.html` show `icons/share.png` (1200×630) when the address is shared. `og:image` and `og:url` are the only full addresses in the game (previews need them); change them if the game moves.
- Stars and marker (1.0): each route shows `STARS` (2) stars, one per finished round; filling them opens the next route on the track. `nextUp(p)` is the route to play next: on the track of the player's last route (`p.last`), the first open route with fewer than 2 rounds, else the last open one. The player's animal (`.here`) bobs on it. An open route with a route before it and no rounds pulses (`.fresh`), except with Unlock all.
- Map path: a dashed segment joins each route to the next on its track. It is grey until the next route opens (2 rounds of this one, or Unlock all), then yellow on a white band. A segment that lit up since the player last saw the map plays a short animation.
- Friends: each house is one letter's friend. With more than one friend for a letter (every letter but Q, U, V, X and Y), the player's friend for that letter is the one they met least recently, so a house changes between rounds while the letter stays the same.
- Routes: 1 letters (2 houses, growing to 5), 2 animal pictures, 3 mixed letters and pictures, 4 numbers (numeral or stars to count, houses numbered 1 to 5). The next route on a track unlocks after 2 finished rounds of the one before it; the first route of each track is always open. Parent corner can unlock all.
- Round = 5 deliveries, then a sticker. No timers, no losing. Wrong house bounces back; after 2 misses the right house wiggles. Tap-then-tap-house works as well as dragging.
- Adaptive practice (routes 1 to 3): wrong answers raise a letter's score, first-try correct lowers it, weak letters are picked more often. Parent corner shows "Needs practice". Not used on route 4.
- Players: up to 8 on one device, each with an animal (any friend, may repeat; the parent corner shows the first five plus the player's own, and "More" shows all 46) and an optional name (20 characters, typed only in the parent corner). Rounds, stickers and practice letters are per player; voice, sound effects, play counts and Unlock all are per device. With one player nothing changes from before. With two or more, Play opens "Who's playing?" (one big animal button per player, name under it if set) and the map's top bar shows the current player's animal, which returns to the picker.
- Letters: each player has a letter set (default S, B, K, C, P, the game before 0.8). Any letter but X can be chosen; "All" turns on every letter with a friend (Q and U included since 0.8.1, at the owner's request). Routes 1 to 3 use only the set; houses per round are `min(5, set size, growth rule)`. Route 4 (numbers) always uses the five numbered houses.
- Parent corner: settings, Players (name field, animal choice, Erase per player, Add player), Progress and Needs practice (with "Ready for new letters" when it applies) for the selected player, Letters (A to Z grid, "First five", "All", "Use for all players" with 2+ players), Print summary, Print all players (only with 2+ players), and Erase everything.
- Print summary: a plain page with the selected player's name and animal, the date and game version, the Progress lines (routes and stickers), Needs practice (letter and animal name) and a short note on what they mean. It opens the print dialog at once and stays open with Print and Done buttons. When printed, only the summary is on the page. "Print all players" shows the same sheet for every player, in player order, and each one after the first starts a new printed page.
- Animation: truck arrives and hops, animals blink, tap an animal on the title to hear its name, sparkle burst and flag on delivery, idle nudge after 10 seconds.
- Progress saved in `localStorage` under `animal-mail-route-v2`: `{v:2, device:{lang, voice, sfx, share, unlockAll, lettersSame}, current, players:[{id, name, animal, rounds, stickers, weak, seen, letters, setRounds, last, langs}]}`. The progress fields at the top of a player are English, exactly as before 1.1, so an older copy of the game still reads them; `langs` (1.1, additive) holds each other language's progress, e.g. `langs.es = {animal, rounds, stickers, weak, seen, letters, setRounds, last}` (Spanish friend ids). `device.lang` (1.1) is the chosen language; a save without it is English. `last` (1.0, additive) is the route last started, for the map marker; old saves get 1. `seen` (0.6, additive) maps friend id to a running count of when the player last met them. `letters` (0.7, additive) is the player's letter set, `setRounds` the letter-route rounds finished since the set last changed, and `device.lettersSame` is "Use for all players". An old `animal-mail-route-v1` save is turned into player 1 on first load and the v1 key removed.

## Code layout (one script block)
- `FRIENDS` array: `{id, letter, name, animal, color, roof}`, data driven (add an entry and its `ART`). The first five keep their letter as id (`S`, `B`, `K`, `C`, `P`); later ones are `S2`, …. Built from it: `BYID` (friend by id), `BYLETTER` (friends per letter, in `FRIENDS` order), `LETTERS` (letters with a friend). `STARTERS` (`S B K C P`) is the avatar choices, the sticker cycle, the numbers-route houses, and the default letter set. `ART`: inline SVG per friend id.
- Letters vs friends: practice scores (`weak`), house `data-id`, mail items (`item.id`), `NUM` and the `letter-`/`sound-` clips are per letter. Art, names, `name-`/`reward-` clips, avatars and stickers are per friend. A round's `R.friend` maps letter to friend (`pickFriends`, least recently met, which also updates `P.seen`); each queue item carries its friend as `item.f`; houses have `data-friend`.
- Letter sets: `cleanLetters` (valid letters, once each, in `LETTERS` order, at least `MIN_LETTERS` = 2), `roundLetters(n)` (the letters for a round on routes 1 to 3), `readyForMore(p)` (the "Ready for new letters" hint), and in the parent corner `renderLetters` (called from `syncToggles`), `setLetters` (applies to everyone while `S.lettersSame`), the `#lgrid` handler, `#b-first5`, `#b-allletters`, `#t-same`.
- `CLIPS`: every spoken line, keyed by clip name, built from the language's `clips`, `nums`, `sounds` and friends (English: 156 total: 14 prompts and numbers, `letter-`/`sound-` for each of 25 letters, `name-`/`reward-` for each of 46 friends; Spanish: 133, since Spanish H has no `sound-` clip). Text in `CLIPS` is what the built-in voice says when a recording is missing.
- Languages (1.1): `EN_FRIENDS`, `ES_FRIENDS` and `LANGS` near the top of the script. A language is `{name (in itself), speech (voice and date locale, e.g. es-MX), ready, manifest (optional: its install manifest, which replaces the page's manifest link at load), friends, starters, alphabet (the parent corner grid), audio (clips folder), nums, sounds, clips, t}`. `t(key, {x})` returns the page language's string (English if a key is missing); `tn(key, n)` picks `key1` or `keyN`. Fixed words in the HTML carry `data-t` (text) or `data-ta` (aria-label) and are filled by `applyText()` at boot; the English in the HTML is only a fallback. `pickLang()` chooses `LANG` once per page load; `FRIENDS`, `BYID`, `STARTERS`, `CLIPS` and so on are built for that language only. A non-English friend names its picture with `art:` (an `ART` id: an English friend id, or since 1.3 a picture with no English friend, such as `dolphin`, `rhea`, `quetzal`) and takes that English friend's colours unless it gives its own `color` and `roof` (it must, for a picture with no English friend); `art(id)` takes a friend id. `cleanPlayer` checks this language's progress and keeps the others untouched in `p.other`; `stored(d)` writes the save (English at the top, others under `langs`). `setLang` saves and reloads; `renderLangs` (parent corner row) and the title button show only while `offered()` (ready languages plus the current one) has 2 or more.
- `say([keys], fallbackText)`: plays `audio/<key>.mp3` for each key if ALL clips in the line are loaded, otherwise uses the browser's built-in speech.
- Tracks: `TRACKS` (`{id, name, label, routes}`), `trackOf`, `prevIn(l)` and `nextIn(l)` (0 at either end of a track). `unlocked`, `finishRound` (win card target) and `progressLines` all use `prevIn`/`nextIn`, never `l - 1`/`l + 1`. To add a route: an entry in `LEVELS` and `LEVEL_NAME` with a new id (5, 6, …), and its id in a track's `routes`.
- Levels: `unlocked`, `houseCount`, `kindFor`, `buildQueue` (adaptive weighting), `promptFor`, `paperHTML`.
- Parent corner shows how many of the language's clips were found (156 in English).
- Saved progress: `D` is the whole save, `S` is `D.device` (settings), `P` is the current player. `cleanSave`, `cleanPlayer`, `fromV1` validate; `load`, `save`, `useSave` near the top of the script. `unlocked(l, p)` takes an optional player.
- Players: `renderWho` (picker), `renderPlayers` and the `#players` handlers (parent corner; `moreOpen` remembers, in memory only, which cards show every animal), `erasePlayer`, `armed`/`disarm` (the two-tap erase buttons). `progressLines(p)` builds the Progress row text, `weakIds(p)` the Needs practice letters.
- Spanish address (1.2): `es/index.html` is not a copy of the game. It holds the Spanish link-preview tags and links `es/manifest.webmanifest`, then `location.replace('../?lang=es')`. Crawlers read its tags without running the script; a phone lands on the game in Spanish. The game, once in Spanish, points its manifest link at `es/manifest.webmanifest` (`id` and `start_url` are `es/`, `scope` the whole game), so installing from Spanish makes a separate app named in Spanish that opens at `es/`.
- Map: `renderMap` builds one `<div class="track" style="--n:…">` per track (a `.tname` label, then `nodeHTML` per route), then an `<svg class="path">`, and calls `drawPath(true)`, which measures the disc centres and draws one `<g class="seg" data-seg="from">` per pair of neighbouring routes on a track (`from` is the route it leaves; lit when the next one is unlocked). It redraws on resize and once fonts load. `litSeen` (memory only) remembers, per player, which segments were lit, for the animation.
- Gear: `cancelHold`, the `pointerup` handler (counts short taps in `taps`/`lastTap`), `hideTip`; `#gear-tip` sits in the title's `.corner`.
- Summary: `#summary` sits outside `#app`, so print CSS can hide the game (`body.sum-open #app`). `sheetHTML(p, date)` builds one player's `<article class="sheet">` from `progressLines` and `weakIds`; `openSummary(players, title)` fills `#sum-sheets` with one sheet per player, sets the page title, shows it and calls `printSummary()` (a guarded `window.print()`). `#b-print` passes the selected player, `#b-print-all` passes `D.players`. `renderPlayers` hides `#print-all-row` with one player.
- Sound: the `AudioContext` is made on the first tap (`unlock`) or when `clips.json` lists a clip, never at startup: creating it cost a ~1 s main-thread task under Lighthouse's mobile throttling.
- Parent corner ignores a click whose touch began before it opened (`openedAt`, `downAt`): lifting the finger after the press-and-hold otherwise presses whatever is under it.
- Feedback (1.5): `CONTACT` (the owner's address), `feedbackHref(kind)` (kind `word`, `problem` or `idea`: subject `fb<Kind>Subj`, body `fb<Kind>Body` then `fbInfo` with version, language and `innerWidth` x `innerHeight`), `renderFeedback()` (called from `openParent`), and a click handler on `#fb-block` that rebuilds the link as it is pressed, so a turned screen reports its current size. The links are `<a class="pbtn" data-fb>` inside `#parent` only. Nothing about a player goes in.
- Play counts (`COUNT_URL`, `count`, `sendCounts`): opt-in, anonymous, see `TELEMETRY.md`. Hidden until `COUNT_URL` is set.
- Fonts are served from `fonts/` (no Google Fonts request). `privacy.html` is the privacy page.
- Win card: `finishRound` sets `winTarget`. While the next route on the track is open and has no rounds, the big button says "Next route" and starts it (also after going back to the map and replaying, and with "Unlock all" on); otherwise "Play again" replays the route (always after route 3 and route 4).
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
- stars and marker: 2 stars per route; after route 2 opens, the player's animal sits on route 2, which pulses and is on screen; going back to the map and replaying route 1 still offers "Next route", and the marker stays on route 2
- the manifest and its icons, the service worker taking control, then with the network off: the game, fonts and privacy page load and a delivery works
- the Progress row text against the unlock rule, with and without Unlock all
- a v1 save turning into player 1 (seeded with `addInitScript`; `newPage` takes an optional `{key: value}` to seed)
- with one player, no picker; adding a second player, the picker, separate progress, the top bar animal, erasing one player, Erase everything
- "Who's playing?" with 2 and with 8 players on all 5 screen sizes, everything on screen
- map tracks on all 5 sizes: Letters 1 to 3 and Numbers 4, route 4 level with route 1 (beside it upright, below it sideways), route 4 open from the start, labels on screen
- the gear tip: one tap shows nothing, a second in a row shows the tip, on screen, and holding the gear hides it
- link preview tags: title, large card, and the image (1200×630) loads from this copy
- the map path on all 5 sizes: 2 segments (routes 1 to 2 and 2 to 3), each from one disc's centre to the next, on screen, grey at the start; lit after 2 rounds of route 1 (and that one animates), lit to the last open route after a v1 migration, all lit with Unlock all
- lifting the finger after the gear hold presses nothing (on the Pixel size it lands on Print summary)
- Print summary on a sideways phone: shows the selected player's lines, Needs practice with names, opens the print dialog once (stubbed in the test), fits the width, prints only the summary (print media), Done returns to the parent corner, and switching player changes the summary
- Friend library: a 0.5 save (no `seen`) loads unchanged (progress, practice letters, avatar, stickers, also after playing); the clip count is 156; S's two friends take turns over three rounds (Sammy, Sally, Sammy); picture mail for Sally goes to the S house and the banner says "S for Sally the Seal!"
- Letter sets: the A to Z grid (only letters with a friend enabled, the first five on); turning letters off and on, the 2-letter minimum, "All"; a route 3 round with 3 letters has only those houses and mail; route 4 keeps its numbered houses; route 1 grows within the set in its order; a save with too few valid letters gets the default set; "Ready for new letters" shows and clears; the printed summary lists the letters; "Use for all players" copies the set, keeps new players and changes together while on, and stops when off; the parent corner fits a sideways phone
- More animal friends: "More" lists all 46 friends; every friend's art renders, every name and animal starts with the friend's letter, names are unique; the parent corner with "More" open fits a sideways phone; choosing Ollie as an avatar saves, and "Fewer" shows the first five plus Ollie; a set of A, M and Z on routes 3 and 2 uses only those houses and mail, and both friends of each take turns
- Print all players: hidden with one player; with two, one sheet per player in order with each player's lines, the print dialog, fits the width, the second sheet starts a new printed page, Done returns to the parent corner
- Spanish address and privacy (1.2): the English page links the English manifest and privacy page; `es/` has Spanish preview tags and `share-es.png` (1200×630) loads; `es/` opens the game in Spanish with the Spanish manifest (name, short name, `es-MX`, its own id, start at `es/`, scope covering the game, icons load); the Spanish parent corner links `privacy-es.html`, which is in Spanish, fits, links back to `es/` and to the English page; offline, `es/` still opens in Spanish and both privacy pages load
- Help improve the game (1.5), in English (Pixel) and Spanish (sideways phone): only in the parent corner; three choices in the page's language; each a `mailto:` to the contact address with the right subject; the body has the version, language and screen size and nothing about the child (seeded with a named player with progress and practice letters); the corner fits; pressing a link after turning the screen uses the new size; no requests to other sites; both privacy pages describe it
- Languages (1.4, Spanish offered): English by default with an "Español" button (on screen and overlapping nothing at all 5 sizes) and the language row, no draft note; a Spanish device gets Spanish on a first visit, and its parent corner (never the title) shows the draft note asking for corrections; `privacy-es.html` shows the draft note; a save from before languages stays English; at `?lang=es` on all 5 sizes, the Spanish title, Play, and an "English" button on screen that overlaps nothing; a Spanish round (caption, spoken prompt in es-MX, delivery banner and cheer); Spanish map labels and sticker book; no English words on the title, map, round, sticker book or parent corner; 36 Spanish friends with pictures and names starting with their letter; the 27-letter grid (U, W, X without a friend, M P L S T on); a Spanish round with only D, Ñ and Q (houses, pictures, the banner names each friend, the round finishes); the language row; per-language progress (Spanish starts fresh, the name carries over, the save keeps English at the top, Spanish progress under `langs.es`); switching from the parent corner and from the title button reloads in English with English progress and keeps both

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
- Map path that lights up as routes open, printable per-child summary, version 0.4 (fourth session).
- Lighthouse pass and Print all players, version 0.5 (fifth session).
- Roadmap Phase 1, friend library, version 0.6 (sixth session).
- Roadmap Phase 2, letter sets, version 0.7 (seventh session).
- Roadmap Phase 3, more animal friends (A to Z), version 0.8 (eighth session).
- Roadmap Phase 4, map with tracks, plus the gear tip and link preview, version 0.9 (ninth session).

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

## Built in the fourth session: map path and printable summary
Built as written below (step 1, the live check of 0.3, passed before work started). Decisions on what it left open are under "Decisions made by Claude (fourth session)".

Claude's recommendation, written after PR #4. Do it in one PR, run `tests/touch.cjs` after each change, and record calls in "Decisions made by Claude".
1. **Check 0.3 on the live site:** run `tests/touch.cjs` against the live URL once PR #4 has deployed. Fix anything that fails before starting new work.
2. **Map: show that 2 stars open the next route** (from "Ideas for later"). Light the dashed path segment from a route to the next one once that route has 2 rounds (or Unlock all is on). Locked segments stay grey. Keep the 3 stars and padlocks as they are. Test the segment state in `tests/touch.cjs` and keep everything on screen at all 5 sizes, including the sideways layout where the path runs left to right.
3. **Printable per-child summary** (from "Classroom"): a "Print summary" button in the parent corner that opens a plain, print-friendly view of the selected player's progress (the Progress lines, Needs practice, sticker count) and calls `window.print()`. Nothing leaves the device. Add a test that the view shows the selected player's lines.
4. Update this file, open the PR, wait for green CI, merge it if the owner allows, and send the owner one short message.

## Decisions made by Claude (October 8, 2026, fourth session)
Small calls made without the owner; change them if they're wrong.
- **The map path is now segments, not one line.** The old single dashed line ran straight down the middle and didn't touch the zigzagging routes. Each segment now runs from one route's disc centre to the next, so it follows the zigzag upright and the left-to-right row sideways.
- **Path colours:** grey dashes (`#b9c0ce`) when closed; yellow dashes on a white band, like a road, when open. A segment is lit by the same rule as the padlock on the route it leads to, so Unlock all lights every segment.
- **Lighting animation:** the band fades in and the dashes march for about 2 seconds, only for a segment that lit up since that player last saw the map. It is remembered in memory only, so the first map view after opening the game doesn't animate. No sound, so it never talks over the voice.
- **Print summary placement:** a "Paper copy" row with the "Print summary" button, right after Needs practice. It prints the player selected in the Players list, like the Progress rows.
- **Summary content:** the Progress lines exactly as the parent corner shows them (the stickers line included), Needs practice as "K (Kelly the Kangaroo)", the player's name and animal, the date and game version, and two sentences on what the lines mean and that nothing was sent. The name appears on paper because the parent chose to print it; it is still never sent.
- **Summary flow:** the print dialog opens straight away; the summary stays on screen afterwards with Print and Done, so a parent who cancels can still read it or try again. While it is open the page title names the player, so "Save as PDF" suggests a useful file name; Done restores the title.
- **Lift after the gear hold:** found while testing. On a tall phone the click from lifting the finger landed on the new Print summary button. The corner now ignores any click whose touch began before it opened. Keyboard use is unaffected.
- **Release 0.4:** `VERSION` and the "Prototype" note are 0.4, `sw.js` is `amr-v3`, and the privacy page's example game version is 0.4. The privacy text is otherwise unchanged: the summary is built and printed on the device. "Last updated" is still today, October 8, 2026.
- **`PLAYTEST.md`** asks whether the child noticed the path light up, and whether Print summary worked on the device.
- **Merged without a separate go-ahead:** the owner asked for this PR to be merged once CI is green.

## Built in the fifth session: Lighthouse pass and Print all players
Steps 2 and 3 of the fifth-session recommendation (kept below for reference). Step 1 was skipped at the owner's word: 0.4 had already passed all 122 touch checks on the live site. No playtest notes yet, so nothing from `PLAYTEST.md` went in.

Recommendation as it was:
1. Check 0.4 on the live site. (Already done.)
2. **Lighthouse pass:** run Lighthouse (mobile) on the live site for performance, accessibility and best practices, fix what is cheap and safe, and record the scores here.
3. **Print all players (Classroom):** a second button that prints every player's summary, one per page (`page-break-after`), for a teacher with a shared tablet. Same content and rules as Print summary.

### Lighthouse scores (mobile, Lighthouse 12, default throttling)
| | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| 0.4 live, before | 79 | 100 | 100 | 100 |
| 0.5 local, after | 99 | 100 | 100 | 100 |
| 0.5 live, after | 98 | 100 | 100 | 100 |

- **The one real problem:** total blocking time 960 ms, from one ~1 s task at startup. It was `new AudioContext()` in `loadClips`, which ran on every load even though `clips.json` is empty. The context is now made only when there is a clip to decode, or on the first tap (which already happened via `unlock`). Same sound behaviour; Chrome also no longer starts a suspended audio context before any tap.
- **Left as is:** "unminified JavaScript" (3 KiB; minifying needs a build step, which this project avoids on purpose) and "cache lifetime" of the fonts (GitHub Pages sets 10 minutes and can't be changed; the service worker serves them from its cache anyway after the first visit).
- Lighthouse only sees the title screen. The other screens are covered by the touch test, not by Lighthouse.
- To rerun: install `lighthouse@12` in a scratch folder and run it with `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` and `--chrome-flags="--headless=new --no-sandbox"`. Scores from a cloud container vary by a few points between runs.

## Decisions made by Claude (October 8, 2026, fifth session)
Small calls made without the owner; change them if they're wrong.
- **Print all players** has its own row ("Paper copies"), under Print summary, and only shows with 2 or more players: with one player it would print the same page as Print summary.
- **Page breaks** use `break-before: page` (with `page-break-before` for older engines) on every sheet after the first, rather than `page-break-after` on each, so no blank page is printed at the end. Each sheet also avoids breaking inside if it fits on a page.
- **On screen**, the sheets are one scrolling page separated by a dashed line, with one Print and Done at the bottom.
- **Order and content:** players in the order the parent corner lists them; each sheet is exactly what Print summary shows for that player (same date, version, lines and note). The page title is "Animal Mail Route progress, all players", for "Save as PDF".
- **Escaping:** the summary is now built as HTML, so the player's name is escaped (it used `textContent` before). Names never leave the device, as before.
- **Release 0.5:** `VERSION` and the "Prototype" note are 0.5, `sw.js` is `amr-v4`, the privacy page's example game version is 0.5. Its text is otherwise unchanged (printing happens on the device). "Last updated" stays October 8, 2026.
- **`PLAYTEST.md`** asks whether Print all players gave each child their own page.

## Decisions made by Claude (October 8, 2026, sixth session)
Phase 1 of the roadmap. Small calls made without the owner; change them if they're wrong.
- **Sally the Seal (`S2`) added now**, from the Phase 3 table, so rotation is real and tested rather than a code path nothing uses. She is a grey seal on a light aqua house (`--c-S2`), teal roof. Phase 3 adds the rest.
- **What stays on the first five (`STARTERS`):** title cast, avatar choices (Phase 3 adds "More"), the sticker cycle (Phase 6 replaces it), the numbers-route houses 1 to 5, and the letters a round uses until Phase 2. So adding a friend never changes these.
- **Turn-taking is saved per player** as `seen` (friend id → running count), set when a round starts. A friend nobody has met counts as never seen, so a new friend shows up in the player's next round of that letter. Ties go to the first in `FRIENDS`, so a fresh player always starts with the original five. Leaving a round early still counts as meeting them. Route 4 houses rotate too (same houses, different faces).
- **Needs practice and the printed summary** name a letter's first friend ("S (Sammy the Skunk)"), since practice is per letter.
- **Clip count:** 36 (34 + `name-S2` + `reward-S2`). `reward-S2` says "S for Sally the Seal!"; the letter and sound clips are shared per letter.
- **Release 0.6:** `VERSION` and the "Prototype" note are 0.6, `sw.js` is `amr-v5`, the privacy page's example game version is 0.6, and its "Stored on your device" paragraph mentions which friends each player met most recently. "Last updated" stays October 8, 2026.
- **`PLAYTEST.md`** asks whether the child noticed Sally at the S house sometimes.

## Decisions made by Claude (October 9, 2026, seventh session)
Phase 2 of the roadmap. Small calls made without the owner; change them if they're wrong.
- **Set order:** a set is kept in `LETTERS` order (the order of `FRIENDS`), whatever order the parent taps in, and "Letters: …" lists it that way.
- **Which letters a round uses:** a set of 5 or fewer is used in its order, so route 1 still starts with the first two and adds one per round; the default set plays exactly as before. A set bigger than 5 (possible after Phase 3) takes letters that need practice first (score 2 or more), then the ones the player met least recently, so every letter in the set comes round.
- **Route 4 (numbers)** ignores the set and keeps houses 1 to 5 (the first five friends), since its houses are numbers, not letters.
- **"Use for all players"** is an On/Off switch, shown with 2 or more players, stored as `device.lettersSame`. Turning it on copies the selected player's set to everyone; while it is on, a change to any player's letters applies to everyone, and a new player starts with the shared set. Turning it off keeps everyone's letters and makes changes per player again.
- **The 2-letter minimum:** when only two letters are on, both are shown pressed but disabled (slightly faded). Letters with no friend yet are shown dashed and disabled.
- **"Ready for new letters"** shows (under "None yet" in Needs practice, and as a line on the printed summary) when the player has finished 3 letter-route rounds with their current set, no letter in the set has a score of 2 or more, and there are letters left to add. The count (`setRounds`) restarts when the set changes. For saves from 0.6 it starts as the rounds already played on routes 1 to 3. With only five letters today, the default set never shows it.
- **Letters line** is the last Progress line ("Letters: S, B, K, C, P"), after Stickers, so the existing lines keep their places. The summary's note says what it means.
- **Erasing the last player** keeps their letters along with the name and animal, as it is a parent's choice rather than progress.
- **Release 0.7:** `VERSION` and the "Prototype" note are 0.7, `sw.js` is `amr-v6`, the privacy page's example game version is 0.7, its "Stored on your device" paragraph mentions which letters each player's rounds use, and "Last updated" is October 9, 2026.
- **`PLAYTEST.md`** asks whether choosing letters worked and whether the child noticed.

## Decisions made by Claude (October 9, 2026, eighth session)
Phase 3 of the roadmap. Small calls made without the owner; change them if they're wrong.
- **Names:** the table in Phase 3 as written (the owner hasn't changed it). All 40 new friends in one PR: first and second friends together came to about 40 KB.
- **Ids:** a new letter's first friend uses the letter as its id (`A`, `D`, …), second friends add a 2 (`A2`, `B2`, …), like `S2`. `FRIENDS` lists the first six, then the new first friends A to Z, then the second friends A to Z.
- **Letter order:** `LETTERS` is the first five, then the rest A to Z (`S B K C P A D E F G …`), so the default set and route 1 play as before. A set is kept and listed in that order ("Letters: S, B, A, M").
- **Q and U:** can be chosen, but "All" leaves them off (`TRICKY`, `ALL_LETTERS`). "Ready for new letters" counts the letters "All" would add, so it doesn't stay on just because Q and U are off. *Changed in 0.8.1: the owner wants "All" to mean all, so `TRICKY` is gone and `ALL_LETTERS` is every letter with a friend.*
- *0.8.1: the title cast is no longer the first five. `pickCast()` picks 5 random letters and a random friend for each on every load, so names come from `FRIENDS` and two friends of one letter (the zebras) never stand together.*
- **Art:** placeholder SVGs in the same style (round head, big `#1b1b1b` eyes so they blink). Two zebras (Zoe, Ziggy) are told apart by Zoe's pink bow and Ziggy's spiky mane and blue scarf. Bella the Bear wears a pink bow so she doesn't read as Billy the Beaver. Each friend has a pastel `--c-<id>` house colour and a deeper roof; the letter sits on the red sign, so the wall colour doesn't affect its contrast.
- **Sounds:** `sound-<L>` text for the new letters is a short spoken hint for whoever records it (`aa`, `eh`, `ih`, `ah` for short o, `uh`, `kwuh`, …). The built-in voice doesn't say these lines.
- **Avatars:** each player card shows the first five, the player's own animal if it isn't one of them, and a "More" button that lists all 46 ("Fewer" closes it). Open or closed is not saved. A new player still gets one of the first five.
- **What stays on the first five:** as in 0.6: title cast, sticker cycle (until Phase 6), numbers-route houses and the default set. Their second friends (Bella, Kit, Cora, Polly) now rotate in on route 4 too, like Sally.
- **Size:** `index.html` is about 132 KB, under the ~250 KB point where `ART` and `FRIENDS` would move to `friends.js`.
- **Release 0.8:** `VERSION` and the "Prototype" note are 0.8, `sw.js` is `amr-v7`, the privacy page's example game version is 0.8. Its text is otherwise unchanged (no new data). "Last updated" stays October 9, 2026.
- **`PLAYTEST.md`** asks about the new friends and the "More" avatars.

## Decisions made by Claude (October 9, 2026, ninth session)
Phase 4 of the roadmap, and two owner requests. Small calls made without the owner; change them if they're wrong.
- **Two lines, no switcher:** two columns upright and two rows sideways fit at all 5 sizes, so there is no track switcher. Rows are used on short landscape screens (the same rule as before, `max-height:560px`); the tablet held sideways keeps columns, capped at 720 px wide so they don't drift to the edges.
- **No zigzag:** each track is a straight line of discs, so the two tracks read as two separate paths.
- **Labels:** "ABC" and "123" pills, which a child can recognise without reading; screen readers hear "Letters" and "Numbers".
- **Slots line up:** every track has as many slots as the longest track, so a short track's discs sit level with the start of the long one. Phase 5 adds routes to both.
- **Route 4 is open for everyone now**, including saves where it was locked; no rounds or stickers change. Route 3 no longer says "so N more opens Route 4" in Progress, and its win card says "Play again".
- **Gear tip:** shows on the second short press within 3 seconds of the one before (a press let go early counts too, since that person also doesn't know to hold). Written, not spoken, as it is for the parent; a child tapping twice sees a bubble and nothing else happens.
- **Link preview picture:** the title screen with the first five friends and the Play button, made from the game itself by `icons/share.cjs`, so it stays in style. Not added to the service worker's cache, as the game doesn't need it offline.
- **Release 0.9:** `VERSION` and the "Prototype" note are 0.9, `sw.js` is `amr-v9`, the privacy page's example game version is 0.9. Its text is otherwise unchanged (no new data). "Last updated" stays October 9, 2026.
- **`PLAYTEST.md`** asks about the two map lines, the gear tip and the link preview.

## Decisions made by Claude (October 10, 2026, tenth session)
The owner asked how hard other languages would be, starting with Spanish ("Spanish everything, names for animals, etc."), then accepted these recommendations: Mexican Spanish; separate progress per language; the whole app switches (title, settings, everything); language offered on first visit by the device's language, a title-screen button and a parent-corner row.
- **Two PRs.** This one (1.1) is the plumbing plus a complete Spanish draft, hidden from families (`ready:false`), so it can merge without changing the game. Step 2 turns Spanish on after a native speaker has checked it.
- **Reload to switch.** Changing language saves and reloads the page. Everything is built for one language at load, which kept the change small and safe; it is fast and works offline.
- **The title button** sits beside the gear and shows the other language's name in that language ("Español", "English"), with no flag (a Mexican flag leaves out other Spanish speakers, a Spain flag is wrong for most families here). A plain tap switches: a child who taps it loses nothing, and tapping again switches back. The parent-corner row ("Language / Idioma", both words in both languages) is the first row.
- **First visit only:** the device's language picks the game's language only when there is no save. A save from before 1.1 is English (it was played in English), so a family with a Spanish phone who has been playing in English is not switched to an empty Spanish game when step 2 ships.
- **Save shape:** English progress stays where it was, other languages under `langs`. An older cached copy of the game (the service worker serves the old page once after an update) still reads English progress; if it saves, it drops `langs`, which can only matter for Spanish progress made in the minute between the two loads.
- **Erase** (one player) erases that player in every language, as removing them does; "Erase everything" keeps the current language.
- **Spanish friends:** 33 friends on 21 letters (36 on 24 since 1.3), reusing the existing pictures (a frog is Rita la Rana, a whale Bety la Ballena, the skunk Zenón el Zorrillo, the inchworm Olga la Oruga, the newt Sofi la Salamandra, the vole Raúl el Ratón, the elk Víctor el Venado, the moose Álex el Alce, the horse Yola la Yegua). Names are alliterative with el/la. The C friends are hard C (canguro, coneja), not cebra. Llama is left out of L (LL is its own sound). D, Ñ, Q, U, W and X have no friend yet: D, Ñ (ñandú), Q (quetzal) need new pictures; U, W and X have no good animal and stay off like X in English.
- **Spanish first five:** M, P, L, S, T (Memo el Mono, Paco el Pingüino, Leo el León, Sofi la Salamandra, Tita la Tortuga), the consonants Spanish reading usually starts with. They are the default letters, avatars, sticker cycle and numbers-route houses in Spanish.
- **Spanish sounds:** continuous sounds held (mmm, sss, fff, lll, nnn, rrr), stops as syllables (pa, ta, ba, ca, ga, ka, ja, va, ya), vowels as themselves; Z says sss (Latin American). H is silent, so it says only its name ("H de Hugo el Hipopótamo", as Spanish alphabet books do).
- **Spanish title:** "El Correo de los Animales" (a draft; the reviewer can change it). Mexican words: estampa (sticker), engrane (gear), rincón de papás (parent corner), agregar, ¿Quién va a jugar?
- **Voice:** es-MX when the device has it, else any Spanish voice; English prefers en-US as before. Dates on the printed summary use the language's locale (en-US now, before it was the browser's).
- **Not in this PR:** the link preview, the install name (`manifest.webmanifest`) and the privacy page stay English; step 2 handles them. The privacy page now says the language is stored and that the first visit reads the device's language (on the device; nothing sent). Spanish recordings go in `audio/es/` (listed in `audio/es/clips.json`, cached by `sw.js`).
- **Release 1.1:** `VERSION` and the note are 1.1, `sw.js` is `amr-v11`.

## Languages (owner request, October 10, 2026)
### Step 2: turn Spanish on — done in 1.4 without the review (owner decision)
- *Done in 1.2 (no review needed):* the Spanish address `es/` with its own manifest and link preview, the Spanish privacy page, and the Spanish playtest sheet in `PLAYTEST.md`.
- *Done in 1.4:* `ready:true`, the draft checks flipped, and a draft note for parents (`t.draft` in `LANGS.es`, shown at the top of the parent corner; also on `privacy-es.html`). When review notes arrive: apply the reviewer's changes to `LANGS.es` and `ES_FRIENDS` (and to `es/index.html`, `es/manifest.webmanifest`, `privacy-es.html` and the Spanish sheet if the title or words change; rerun `node icons/share.cjs <url> es` if the title changes), and remove `draft` from `LANGS.es.t` and the note from `privacy-es.html` once a native speaker has checked everything.
- The `es/` address to share with Spanish-speaking families: https://avatar-coco-love.github.io/animal-mail-route/es/
### Later
- *Done in 1.3:* new pictures for D (delfín), Ñ (ñandú), Q (quetzal).
- New pictures for a second friend for A (ajolote, very Mexican), E, F, I, J, K, L, N.
- *Feedback (1.5):* parents report wrong words from the parent corner ("Una palabra o traducción equivocada").
- Spanish recordings in `audio/es/` once the wording is settled (133 lines, from `CLIPS` with `?lang=es`).
- Another language: add a pack to `LANGS` (and friends), and its folder to `AUDIO` in `sw.js`.
### Needs the owner
- **A native Spanish speaker** (ideally a Mexican-American parent or preschool teacher) to check the wording, the animal names, the title and the letter sounds. Since 1.4 Spanish is live anyway (owner decision); corrections come in through the in-app feedback.

## Decisions made by Claude (October 10, 2026, eleventh session)
Languages step 2, the parts that don't depend on the Spanish review (none had arrived). Small calls made without the owner; change them if they're wrong.
- **Spanish stays hidden** (`ready:false`): no review notes were given, as the plan says.
- **`es/` forwards instead of copying the game.** A full copy of `index.html` would have to be kept in step with every change. The small page carries what only an address can (its link preview and its manifest) and forwards to `../?lang=es`. The address bar then shows `?lang=es`; a link copied from there previews in English, the one to share is `…/es/`.
- **The installed Spanish app always opens in Spanish** (its start is `es/`, which forwards with `?lang=es`). "English" inside it still switches for that visit. The English app opens in the saved language, as before. Both can be installed side by side (different `id`).
- **Install name:** "El Correo de los Animales", short name "Correo Animal" (fits under a home-screen icon). Draft, for the reviewer.
- **The game swaps its manifest link** to the language's manifest at load (`L10N.manifest`), so installing from the game in Spanish gets the Spanish app too, not only installing from `es/`.
- **Spanish preview picture** (`icons/share-es.png`): the Spanish title screen with the Spanish first five (Memo, Paco, Leo, Sofi, Tita). `share.cjs` now takes the first five from the page, so it works for any language; `share.png` came out identical.
- **Privacy:** `privacy-es.html` is a translation of `privacy.html` (tú, like the game), with a line saying the English page governs if they ever differ. Each page links the other. Its "Volver al juego" goes to `es/`. The example game version in both tables is now 1.2.
- **Spanish playtest sheet:** a separate "Hoja de prueba" at the end of `PLAYTEST.md`, shorter than the English one, with a "Palabras" block that doubles as the native-speaker review (title, letter sounds, animal names, Mexican words). The English sheet's Spanish line now gives the `es/` address.
- **Release 1.2:** `VERSION` and the note are 1.2, `sw.js` is `amr-v12` and caches `es/`, its manifest and `privacy-es.html`.
- **New pictures (1.3):** a dolphin (grey-blue, dorsal fin, light snout and belly, so it doesn't read as the whale or narwhal), a rhea (grey-brown, long neck, small head, yellow legs and beak) and a quetzal (green, crest, red belly, long green tail feathers). Same style as the others (100×100, big `#1b1b1b` eyes so they blink). They are `ART` entries named by animal (`dolphin`, `rhea`, `quetzal`), not English friend ids, since no English friend uses them yet; an English friend could later (Dolly the Dolphin…).
- **Names:** Dani el Delfín, Ñico el Ñandú (Ñico is a nickname for Antonio; few names start with Ñ, and "Ñoño" means dork in Mexico), Quique el Quetzal (Quique, for Enrique, starts with the "que" sound). Drafts, for the reviewer.
- **Sounds:** D says "da", Ñ "ña", Q "que" (as Q appears in Spanish words: que, qui).
- **House colours:** pale blue-grey with a slate roof (delfín), pale sand with a grey-brown roof (ñandú), pale green with a green roof (quetzal).
- **Order:** they sit in `ES_FRIENDS` after C, N and O, so the Spanish grid and "Letters: …" list them in alphabet order. They are off by default (the first five stay M, P, L, S, T); "Todas" now turns on 24 letters.
- **Release 1.3:** `VERSION` and the note are 1.3, `sw.js` is `amr-v13`, and the example game version on both privacy pages is 1.3.

## Decisions made by Claude (October 10, 2026, twelfth session)
Small calls made without the owner; change them if they're wrong.
- **Draft note (1.4):** a pale yellow box at the very top of the Spanish parent corner, in Spanish, before the language row. It is a `t` key (`draft`) that only Spanish has, so any language added later without a review can carry one; English shows nothing. Until the feedback section exists (next PR), it gives the contact address to write to. `privacy-es.html` has the same note under its first line.
- **The title button now shows in English too** ("Español"), as planned in 1.1: a plain tap switches, and tapping "English" switches back, so a child who taps it loses nothing.
- **Release 1.4:** `VERSION` and the note are 1.4, `sw.js` is `amr-v14`, the example game version on both privacy pages is 1.4.
- **Feedback as links, not a form (1.5):** three `mailto:` links styled as buttons, after "Paper copies" and before "Erase everything". A form would need a server to send to, which breaks "nothing leaves the device unless a parent sends it"; a link hands the whole message to the parent's own email app. Links rather than buttons with `location.href`, so a long press can also copy the address.
- **What the email holds:** a subject naming the game and the kind ("Animal Mail Route: a wrong word"), two short questions to answer (one for an idea), a line asking not to add the child's name or personal details, then the game version, language code and name, and the window size in CSS pixels (`412 x 915`). No device model or browser (not asked for, and not needed yet). The game version is the release (1.5), the same as the play counts send.
- **Privacy pages:** a new "Feedback (only if you send it)" / "Comentarios (solo si tú los envías)" section: what the buttons do, what the email holds, that the game sends nothing, and that a reply address is used only to reply. "Questions" now gives the email address before GitHub issues.
- **Release 1.5:** `VERSION` and the note are 1.5, `sw.js` is `amr-v15`, the example game version on both privacy pages is 1.5.

## Next sessions: expansion roadmap
Written at the end of the fifth session, from the owner's questions about variety ("Is there a capacity to choose which letters, or randomized names that are school friendly and fit the lesson? In what ways can we expand?"). The owner asked for all of it to be built, starting in a fresh conversation. This section is the plan.

### How to work through it
- **Playtest first, if it is done.** If the owner pastes a filled-in `PLAYTEST.md`, fix its findings before anything below, in their own PR.
- **One phase per PR, in order.** Phases 1 to 3 change the data model that later phases build on, so don't reorder them. Phases 4 to 8 are independent once 1 to 3 are in; do them in the order listed unless the playtest says otherwise.
- Same routine as before: run `tests/touch.cjs` after each change, commit as you go, open the PR, fix what CI flags, merge once green (the owner has allowed merging green PRs), check the live site with `tests/touch.cjs`, bump `VERSION` (0.6, 0.7, …) and `sw.js` (`amr-v5`, …) per release, update this file and `PLAYTEST.md`, and record calls under a new "Decisions made by Claude (Nth session)".
- Everything below is settled unless it is marked **Owner**. Use your judgement on gaps and write the call down. Batch every **Owner** item into the one short end-of-session message; never block on one, use the default given.
- Keep the game rules that make it suit preschoolers: no timers, no losing, no reading needed by the child, at most 5 houses on screen, every prompt spoken, everything works offline, nothing leaves the device.

### Where variety stands today (0.5)
- 5 fixed letters (S, B, K, C, P), one animal each, in the `CH` array; the letter is also the animal's id everywhere (`BYID`, `weak`, stickers, player avatars, clip keys like `name-S`).
- 4 routes in one unlock chain: 1 letters, 2 animal pictures, 3 mixed, 4 numbers 1 to 5 (numeral or stars).
- Randomness is the mail order (shuffled, no letter twice in a row) and the adaptive weighting of missed letters.
- Prompts are fixed sentences. Stickers cycle through the 5 animals in a fixed order (`CH[P.stickers.length % CH.length]`).
- Nothing can be chosen by a parent beyond Unlock all.

### Phase 1: Friend library (data model) — done in 0.6 (sixth session)
Split "animal friend" from "letter", so a letter can have more than one friend and a friend can be added without code changes.
- **Data:** `FRIENDS` replaces `CH`: `{id, letter, name, animal, color, roof}`, where `id` is unique (`'S'`, `'S2'`, …) and `letter` is the uppercase letter it teaches. The existing 5 keep their ids (`S`, `B`, `K`, `C`, `P`) so saved stickers, avatars and practice scores stay valid with no migration. `ART` stays keyed by friend id.
- **Practice scores stay per letter** (`weak.S`), not per friend: the child is learning the letter.
- **Clips:** `name-<id>` and `reward-<id>` per friend, `letter-<L>` and `sound-<L>` per letter. Generate the `CLIPS` entries from `FRIENDS` as today; update the clip count text and docs to whatever the new total is.
- **Rounds** pick 2 to 5 letters from the player's letter set (Phase 2), then one friend per letter for that round (rotate: the friend this player saw least recently), so the houses vary between rounds while the lesson stays the same.
- **Tests:** a v2 save from 0.5 loads unchanged (stickers, avatar, weak); a round with two friends for one letter rotates them; all existing checks pass.

### Phase 2: Letter sets in the parent corner — done in 0.7 (seventh session)
- **Per player**, saved as `letters:[...]` on each player (default `['S','B','K','C','P']`, which is today's game). Add it in `cleanPlayer` with that default, so the save shape stays `v:2` (additive, no migration). Also store `device.lettersSame` (default false).
- **Parent corner:** a "Letters" block for the selected player: a grid of A to Z toggle buttons (only letters with at least one friend are enabled), presets ("First five" = today's set, "All"), and "Use for all players" (copies this player's set to everyone; one tap, no confirm, since it is easy to undo by choosing again). At least 2 letters must stay on; the last two can't be turned off.
- **Unlocking:** a route's progress rule doesn't change. Changing letters never erases rounds or stickers.
- Routes 1 to 3 draw only from the set. Houses per round = `min(5, set size, growth rule)`.
- **Progress row and printed summary** add "Letters: S, B, K, C, P".
- **Needs practice** suggests the next step: when no letter in the set has a score of 2 or more after 3 rounds, show "Ready for new letters" next to it (text only, no automatic change).
- **Tests:** choose 3 letters, play a round, every house and mail is from the set; the 2-letter minimum; "Use for all players"; letters show in the summary.

### Phase 3: More animal friends (A to Z) — done in 0.8 (eighth session)
Draft list. The rule: the friend's name, the animal and the letter all start with the sound being taught (that is why Charlie became Cody). Vowels use the short sound. No brand characters, nothing scary, and avoid the very commonest children's names. **Owner** may veto or rename any; until then use these.

| Letter | Friend | Second friend (rotation) | Note |
| --- | --- | --- | --- |
| A | Annie the Alligator | Abby the Ant | short a |
| B | Billy the Beaver | Bella the Bear | |
| C | Cody the Crane | Cora the Cow | hard c only |
| D | Dina the Duck | Dex the Dog | |
| E | Eddie the Elephant | Emmett the Elk | short e (not emu, which is a long e) |
| F | Freddy the Frog | Fern the Fox | |
| G | Gus the Goat | Gabby the Goose | hard g only |
| H | Hattie the Hippo | Hank the Horse | |
| I | Iggy the Iguana | Izzy the Inchworm | short i |
| J | Jojo the Jellyfish | Jasper the Jaguar | |
| K | Kelly the Kangaroo | Kit the Koala | |
| L | Lulu the Lion | Lenny the Llama | |
| M | Millie the Monkey | Moe the Moose | |
| N | Ned the Narwhal | Nell the Newt | |
| O | Ollie the Octopus | Otto the Ox | short o |
| P | Pete the Penguin | Polly the Pig | |
| Q | Quinn the Quail | | tricky (kw); off by default |
| R | Rosie the Rabbit | Rex the Raccoon | |
| S | Sammy the Skunk | Sally the Seal | |
| T | Toby the Turtle | Tess the Tiger | |
| U | Upton the Umbrellabird | | tricky (few short-u animals); off by default |
| V | Vera the Vole | | few friendly V animals; no vulture (scary) |
| W | Wally the Walrus | Wendy the Whale | |
| X | | | leave out: no word starts with the x sound a preschooler hears; teach later as an ending sound (fox, box) |
| Y | Yara the Yak | | |
| Z | Zoe the Zebra | Ziggy the Zebra | |

- **Art:** draw each one as an inline SVG in the same simple style and 100×100 viewBox as `ART` today (round body, big eyes, one or two telling features: trunk, stripes, shell). Placeholder quality is fine; finished art is an **Owner** decision later (see Open questions). Pick a `color` and `roof` per friend with enough contrast for the letter on the house; extend the `--c-*` CSS variables.
- **Size:** 50 SVGs add roughly 40 to 60 KB to `index.html`. Fine for now; if the page passes ~250 KB, move `ART` and `FRIENDS` into `friends.js` and add it to `CORE` in `sw.js`.
- Do all 25 letters with the first friend in this phase, then the second friends; a PR per half is fine if it gets long.
- **Avatars:** the player animal choice in the parent corner shows only the original 5 plus a "More" button that opens the full list, so the card doesn't get long.
- **Tests:** every friend's art renders, every friend's name starts with its letter, every letter in the grid has a friend (except X), the parent corner fits on the sideways phone.

### Phase 4: Map with tracks — done in 0.9 (ninth session)
More routes (Phase 5) won't fit in one zigzag of 4, and a parent shouldn't have to finish letters to reach numbers.
- **Two tracks**, each with its own unlock chain and path: **Letters** (the letter routes) and **Numbers** (the number routes). The map shows both as two lines of discs (two columns upright, two rows sideways), or a track switcher at the top if that doesn't fit at the smallest size; check all 5 sizes and decide.
- Existing route numbers keep their saved `rounds` key (1 to 4) so progress carries over; new routes get new keys (5, 6, …).
- The 2-rounds unlock rule, the stars, padlocks, lit path and Unlock all work per track as today.

### Phase 5: New kinds of questions
Each is a new route on the same drag-mail-to-house play, with a spoken prompt and the same 5-delivery round. In this order:
1. **Letter sounds** (Letters track): "Who starts with *buh*?" Mail shows a speaker icon; tapping it repeats the sound. Uses `sound-<L>` clips.
2. **Lowercase** (Letters track): mail shows `b`, houses show `B`. Watch b/d and p/q: never put both on screen in the first rounds.
3. **Beginning sounds from a picture** (Letters track): mail shows an object (ball, cat, dog, sun, …), the child sends it to the house of the matching letter. Needs one simple object SVG per letter in the set (draw them like the friends; list them next to `FRIENDS`).
4. **Numbers to 10** (Numbers track): numerals and dot/star counts 1 to 10, still at most 5 houses at once.
5. **Adding to 5, then 10** (Numbers track): "2 stars and 1 star" shown as two groups; house numbers are the sum.
6. **Colours and shapes** (a third small track, or under Numbers as "Shapes"): houses painted a colour or showing a shape.
7. **Rhymes** (Letters track, last): "What rhymes with cat?" with picture mail. Needs voice to work; built-in speech is fine.
- New prompt clips go in `CLIPS` with their text. Needs practice and the Progress row learn the new routes (by letter for letter routes; numbers are not tracked as weak today, keep it that way).

#### Phase 5 with two languages (written October 10, 2026, after 1.3)
Since 1.1 every word comes from `LANGS`, so each new route needs both languages from the start. English is the one families see; Spanish is hidden but must stay complete (the touch test checks for English words in Spanish).
- **Words:** every new caption, label, prompt and Progress line is a `t` key (or `clips` entry) in both `LANGS.en` and `LANGS.es`. Route names go in each language's `levels` list; `LEVELS`, `LEVEL_NAME` and `TRACKS` take the new ids (5, 6, …), each id in one track's `routes`. Spanish text is a draft for the same reviewer; record it under Decisions.
- **Letter sounds** (first): use each language's `sounds`. Leave out letters with no sound (Spanish H says only its name; English has none today) from that route's rounds. Spanish Q is "que", Ñ "ña", Z "sss" (so S and Z sound the same in Latin American Spanish: never put both on screen in that route).
- **Lowercase:** Ñ/ñ is a letter in Spanish. b/d and p/q apply in both. Check the fonts' latin subset shows ñ (it shows Ñ).
- **Beginning sounds from a picture:** the object must start with the letter in that language (ball is B in English, pelota is P in Spanish), so objects belong to a language (a list per language beside its friends, pictures shared through an id like friends' `art`). Draw objects only once.
- **Numbers to 10 and adding:** `nums` has 1 to 5 per language; extend both to 10.
- **Rhymes:** per language, last, as planned.
- **Progress per language:** new routes' rounds live in the same per-language progress (`rounds` keys 5, 6, …), so nothing new in the save shape; `cleanPlayer` must accept the new keys and default them to 0 for old saves.
- **Tests:** for each new route, a round in English and one at `?lang=es`, on the 5 sizes for the map (the tracks get longer: check both tracks still fit, or decide on the track switcher Phase 4 left open).

### Phase 6: Stickers that grow
- Each route gives its own sticker family (letter routes: the friend of a letter the child got right; number routes: number stickers; shapes: shape stickers), not one fixed cycle.
- The sticker book becomes a scene (a town street) the child decorates by dragging stickers onto it; positions are saved per player.
- Every 5th sticker is a **postcard** from a friend (art plus a spoken line, "Thanks for the mail! Love, Annie"), kept in the book.
- Old stickers (`{c:'S'}`) stay valid and show as before.

### Phase 7: Small story routes
- Occasional themed rounds that change the look, not the rules: a friend's birthday (party hats, a cake at the end), a rainy day (puddles, umbrellas on the houses), snow. Picked at random, at most one in 4 rounds, and only after round 2 of a route.
- Pure art and a new spoken intro line each; no new mechanics.

### Phase 8: Accessibility and polish
- axe-core (served locally in `tests/`, not from a CDN) run in `tests/touch.cjs` on every screen Lighthouse can't see: map, delivery, sticker book, parent corner, picker, summary.
- A "bigger houses" option in the parent corner for small fingers, if the playtest asks for it.

### Needs the owner (batch these; never block on them)
- **Names:** approve or change the table in Phase 3. Default: use it as written.
- **Art direction:** placeholder SVGs or commissioned art. Default: placeholders in the current style.
- **Voices:** record or generate clips once wording has settled after the playtest and Phase 5 (the list grows a lot; regenerate it from `CLIPS`).
- **Older children** (below) and the **game hub** decide the name and address; see Ideas for later.

### After these phases: older children
Short words (send "cat" to Cody's house: first letter, then whole word), CVC word building, sight words, spelling. This is where the game hub idea comes in: likely a second game for ages 5 to 7 sharing the same player profiles, rather than more routes here. Plan it with the owner when Phases 1 to 7 are done.

## Ideas for later
Most earlier ideas are now phases in the roadmap above. These two stay here:
- **Game hub (owner's idea, October 8, 2026):** a new overall name, and a home for several educational games grouped by age or grade, with Animal Mail Route as one of them. Deferred until this game reaches a finished point. Keep it in mind now:
  - Keep player profiles in their own storage key with a plain shape, so a hub could share them across games later.
  - Don't hard-code the `/animal-mail-route/` path. All URLs are relative today; keep it that way.
  - Moving to a new repo name or path changes the URL, which changes the service worker scope and loses installed home-screen copies. Saved progress stays on the same origin (`avatar-coco-love.github.io`), but a custom domain would be a different origin. If the hub happens, choose its final address once, and plan a one-time move of saved progress.
- **Classroom:** shared tablets plus profiles plus "Unlock all" covers basic classroom use with nothing collected. A teacher dashboard across devices needs a server and accounts, which brings COPPA school consent, FERPA and district data agreements. Only do it if a real classroom asks. A middle step, a printable per-child summary on the device, is built (0.4).

## Later steps (need the owner)
1. **Real-device playtest** with a 3 to 5 year old on an Android phone or tablet, using `PLAYTEST.md`. The notes become the next fixes.
2. **Voice clips:** record or generate the 156 lines in `CLIPS`, put them in `audio/`, list them in `audio/clips.json`.
3. **Deploy the play-count Worker** (`worker/README.md`), then set `COUNT_URL` in `index.html`.
4. **Later:** finished art, a final name, per-animal voices, Android packaging (Capacitor or a Trusted Web Activity) for Google Play. Play's Families policy then applies; `TELEMETRY.md` has the Data safety answers.
