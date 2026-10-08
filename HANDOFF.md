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

## Testing status
Tested on 2026-10-08 in an emulated Android Chrome with real touch input (Playwright). Sizes: small phone 360x640, Pixel 412x915, phone sideways 740x360 and 800x360, tablet 800x1280 and 1280x800. Covered: drag to deliver, tap mail then tap house, wrong house then wiggle hint, a full round to the sticker, house count growing, routes 3 and 4 with 5 houses, sticker book, parent corner by press and hold. No script errors. The only console noise is 33 expected 404s for the missing voice clips.

Fixed in that pass:
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

## Planned next steps
1. New GitHub repository for the game, hosted with GitHub Pages so the link can be shared (`index.html` plus `audio/`).
2. Record or generate the 33 voice clips and add them to `audio/`.
3. Telemetry. This is a children's game, so Google's Families policy and children's privacy rules (COPPA) apply: start with anonymous play counts, no personal data, no third-party ad or analytics trackers, and write down what is collected. Plan: `TELEMETRY.md` (off until a parent turns it on, Cloudflare Worker + D1).
4. Possible later: installable offline web app, Android packaging, finished art, per-animal voices.
