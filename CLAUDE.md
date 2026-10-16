# Notes for Claude Code sessions

- **Start with `HANDOFF.md`.** It holds where things stand, the owner's decisions and what's next. Read the sections the task needs, not the whole file.
- This is a game for children aged 3 to 5. Nothing about a child ever leaves the device: no identifiers, no free text, no third parties (`TELEMETRY.md`, COPPA). When a change would collect something new, ask the owner first.
- Plain HTML, CSS and JavaScript, no build step. `index.html` is the game; words and spoken lines are in `words.js`.
- One PR per step. Run `NODE_PATH="$(npm root -g)" node tests/touch.cjs` before pushing, and the Worker tests (`cd worker && npm test`) when `worker/` changes. CI runs both.
- **Every release:** bump `VERSION` in `index.html` and in `sw.js`, and update "Where things stand" in `HANDOFF.md`. Once the parent corner has a "What's new" line, update it in the same PR so parents can see what changed.
- If something is ambiguous, ask the owner before building it.
