# Animal Mail Route: handoff

Read this first, then open `index.html`. It is the whole game, as a standalone page (doctype, viewport, and base reset added so it works when hosted, for example on GitHub Pages). A copy also runs as a Claude artifact without that wrapper.

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

## Audio
Recordings go in `audio/` named like `letter-S.mp3`, `sound-S.mp3`, `name-S.mp3`, `reward-S.mp3`, `num-3.mp3`, `who-gets-the.mp3`, and so on. The full list with exact wording and delivery notes is in the "Animal Mail Route: Voice Script" doc (a private Claude doc; if it is not reachable, regenerate the list from `CLIPS`). The page loads clips with `fetch('audio/<key>.mp3')`, so it must be served over http(s), not opened from a file path.

## Not verified yet
- The game has been syntax-checked and its logic tested on samples, but it has not been played on a real phone or tablet. Check dragging, voice, layout on small and short screens, and the animations first.
- Voice clips are not recorded yet; the built-in speech is the placeholder.

## Open questions
- Charlie the Crane: "Charlie" starts with "ch", but the letter C and "Crane" start with a hard "k" sound. Keep the wording or rename him before recording the C clips.
- Art direction: the animals are simple placeholder SVGs.
- Game name: "Animal Mail Route" is a placeholder.

## Planned next steps
1. New GitHub repository for the game, hosted with GitHub Pages so the link can be shared (`index.html` plus `audio/`).
2. Record or generate the 33 voice clips and add them to `audio/`.
3. Telemetry. This is a children's game, so Google's Families policy and children's privacy rules (COPPA) apply: start with anonymous play counts, no personal data, no third-party ad or analytics trackers, and write down what is collected.
4. Possible later: installable offline web app, Android packaging, finished art, per-animal voices.
