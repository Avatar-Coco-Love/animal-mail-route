// Touch smoke test in an emulated Android Chrome (Playwright, real CDP touch events).
// Usage:
//   node tests/touch.cjs [url]          default url: http://localhost:8080/
// Serve the repo first for a local run, e.g. `npx http-server -p 8080 -s .`
// Needs Playwright with Chromium. If it is installed globally: NODE_PATH="$(npm root -g)" node tests/touch.cjs
// Exits 1 if any check fails.

const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8080/').replace(/index\.html$/, '');
const SIZES = { 'small phone': [360, 640], pixel: [412, 915], 'phone sideways': [740, 360], 'tablet': [800, 1280], 'tablet sideways': [1280, 800] };
let failed = 0;
function check(name, ok, info) {
  if (!ok) failed++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : ''));
}

// opts: {path} added to the address (e.g. '?lang=es'), {locale} the device's language,
// {setup(ctx)} run before the first load (e.g. routes), {noSW} block the service worker
async function newPage(browser, w, h, init, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, locale: opts.locale || 'en-US', serviceWorkers: opts.noSW ? 'block' : 'allow' });
  if (opts.setup) await opts.setup(ctx);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const errors = [];
  const hosts = new Set();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.addInitScript(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} });
  // init: {key: value} seeded into localStorage once, before the game's first load
  if (init) await page.addInitScript((kv) => { if (!sessionStorage.seeded) { sessionStorage.seeded = 1; for (const k in kv) localStorage.setItem(k, JSON.stringify(kv[k])); } }, init);
  await page.goto(BASE + (opts.path || ''), { timeout: 60000 });
  await page.waitForTimeout(600);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  return { ctx, page, touch, errors, hosts };
}
const center = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
const allOnScreen = (page, sel) => page.$$eval(sel, (els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
const holdGear = async (page, touch) => {
  const g = await center(page, '#gear');
  await touch('touchStart', ...g);
  await page.waitForTimeout(1400);
  await touch('touchEnd');
  await page.waitForTimeout(100);
};
// map path: which of the 2 segments (route 1 to 2, 2 to 3 on the Letters track) are lit, and whether
// each runs from one disc's centre to the next route's on its track (data-seg is the route it leaves)
const segState = (page) => page.$$eval('#route .seg', (gs) => gs.map((g) => g.classList.contains('lit') ? 1 : 0).join(''));
const segsJoinDiscs = (page) => page.evaluate(() => {
  const route = document.querySelector('#route'), box = route.getBoundingClientRect();
  const c = (id) => { const r = route.querySelector(`.node[data-level="${id}"] .disc`).getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; };
  const lines = [...route.querySelectorAll('.seg .dash')];
  const near = (a, b) => Math.abs(a - b) <= 2;
  return lines.length === 2 && lines.every((l) => { const from = +l.closest('.seg').getAttribute('data-seg'), a = c(from), b = c(from + 1); return near(+l.getAttribute('x1'), a[0]) && near(+l.getAttribute('y1'), a[1]) && near(+l.getAttribute('x2'), b[0]) && near(+l.getAttribute('y2'), b[1]); });
});
// segments are straight lines, so one of width or height can be 0
const segsOnScreen = (page) => page.$$eval('#route .seg', (els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.width + r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
const progressText = (page) => page.$$eval('#progress li', (li) => li.map((e) => e.textContent));
const wanted = (page) => page.evaluate(() => document.querySelector('#caption').textContent.slice(-2, -1));

(async () => {
  const browser = await chromium.launch();
  const host = new URL(BASE).host;

  for (const [name, [w, h]] of Object.entries(SIZES)) {
    const { ctx, page, touch, errors, hosts } = await newPage(browser, w, h);
    check(`${name}: title buttons on screen`, await allOnScreen(page, '.playbtn, .title .rbtn, #lang-btn'));
    check(`${name}: the Español button shows and overlaps nothing`, await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect(), lb = box('#lang-btn');
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return !document.querySelector('#lang-btn').hidden && document.querySelector('#lang-btn').textContent === 'Español' && !['#gear', '.playbtn', '.corner-l .rbtn', '#cast', 'h1'].some((s) => hit(lb, box(s)));
    }));
    if (name === 'pixel') {
      // the words and friends live in words.js (shared with the volunteer page)
      const html = await page.evaluate(() => fetch('words.js').then((r) => r.text()));
      check('crane is Cody the Crane', !/Charlie/.test(html) && /id:'C', +letter:'C', name:'Cody the Crane'/.test(html));
      // id -> [letter, name] from the English friends list in the page source
      const friends = {};
      for (const m of html.slice(html.indexOf('var EN_FRIENDS'), html.indexOf('var ES_FRIENDS')).matchAll(/\{id:'(\w+)', +letter:'(\w)', name:'([^']+)'/g)) friends[m[1]] = [m[2], m[3]];
      // the title cast: 5 friends, each a different letter, named as in FRIENDS, and a new pick on each load
      const cast = () => page.$$eval('#cast .pal', (b) => b.map((x) => x.getAttribute('data-id')));
      const casts = [await cast()];
      const labels = await page.$$eval('#cast .pal', (b) => b.map((x) => [x.getAttribute('data-id'), x.getAttribute('aria-label')]));
      const castOk = Object.keys(friends).length === 46 && labels.length === 5 && new Set(labels.map(([id]) => friends[id] && friends[id][0])).size === 5 && labels.every(([id, l]) => friends[id] && l === 'Hear ' + friends[id][1]);
      for (let i = 0; i < 3; i++) { await page.reload(); await page.waitForTimeout(400); casts.push(await cast()); }
      check('title cast: 5 random friends, different letters, their own names', castOk && new Set(casts.map((c) => c.join())).size > 1, casts);
    }
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    if (name === 'pixel') check('one player: Play goes straight to the map, no picker or avatar', await page.$eval('#s-who', (e) => e.hidden) && await page.$eval('#m-who', (e) => e.hidden));
    check(`${name}: all 4 routes on screen`, await allOnScreen(page, '.node'));
    check(`${name}: map path joins routes 1 to 3, on screen, all grey at the start`, (await segState(page)) === '00' && await segsJoinDiscs(page) && await segsOnScreen(page));
    // tracks: Letters (1 to 3) and Numbers (4), side by side upright and one above the other sideways
    const tracks = await page.evaluate(() => {
      const t = [...document.querySelectorAll('#route .track')].map((e) => ({ id: e.getAttribute('data-track'), routes: [...e.querySelectorAll('.node')].map((n) => +n.getAttribute('data-level')) }));
      const r = (id) => document.querySelector(`.node[data-level="${id}"] .disc`).getBoundingClientRect();
      const a = r(1), b = r(4), side = innerWidth > innerHeight && innerHeight <= 560;
      return { t: JSON.stringify(t), level: side ? Math.abs(a.left - b.left) <= 2 && b.top > a.bottom : Math.abs(a.top - b.top) <= 2 && b.left > a.right };
    });
    check(`${name}: two tracks, Letters 1 to 3 and Numbers 4, route 4 next to route 1`, tracks.t === '[{"id":"letters","routes":[1,2,3]},{"id":"numbers","routes":[4]}]' && tracks.level, tracks);
    check(`${name}: route 4 open from the start, route 2 locked`, !(await page.$('.node[data-level="4"].locked')) && !!(await page.$('.node[data-level="2"].locked')));
    check(`${name}: track labels on screen`, await allOnScreen(page, '#route .tname'));
    await page.tap('.node[data-level="1"]');
    await page.waitForTimeout(1700);
    check(`${name}: houses, mail and prompt on screen`, await allOnScreen(page, '.house, #mail, #caption'));

    // drag the mail to the right house with a finger
    const id = await wanted(page);
    const from = await center(page, '#mail');
    const to = await center(page, `.house[data-id="${id}"]`);
    await touch('touchStart', ...from);
    for (let i = 1; i <= 12; i++) { await touch('touchMove', from[0] + (to[0] - from[0]) * i / 12, from[1] + (to[1] - from[1]) * i / 12); await page.waitForTimeout(16); }
    const top = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('#mail'), to);
    check(`${name}: dragged mail visible over the house`, top);
    await touch('touchEnd');
    await page.waitForTimeout(400);
    check(`${name}: drop delivers`, (await page.$$eval('.pip.on', (x) => x.length)) === 1);
    check(`${name}: no script or console errors`, errors.length === 0, errors.length ? errors : undefined);
    check(`${name}: no requests to other sites`, [...hosts].every((x) => x === host), [...hosts]);
    await ctx.close();
  }

  // full round with tap-then-tap, wrong tries and the wiggle hint; then the win card's
  // big button: "Play again" until a round unlocks the next route, then "Next route"
  {
    const { ctx, page } = await newPage(browser, 740, 360);
    const winLabel = () => page.$eval('#win-next-label', (e) => e.textContent);
    await page.tap('.playbtn');
    await page.tap('.node[data-level="1"]');
    let hints = 0;
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1700);
      const id = await wanted(page);
      await page.tap('#mail');
      const wrong = await page.$(`.house:not([data-id="${id}"])`);
      await wrong.tap(); await page.waitForTimeout(500);
      await wrong.tap(); await page.waitForTimeout(500);
      if (await page.$eval(`.house[data-id="${id}"]`, (e) => e.classList.contains('hint'))) hints++;
      await page.tap(`.house[data-id="${id}"]`, { force: true });
      await page.waitForTimeout(2700);
    }
    await page.waitForTimeout(500);
    check('round: hint after 2 misses, every time', hints === 5, hints);
    check('round: win card after 5 deliveries', await page.$eval('#win', (e) => !e.hidden));
    check('round: win buttons on screen (sideways phone)', await allOnScreen(page, '#win .rbtn'));
    check('win card: first round says Play again', (await winLabel()) === 'Play again', await winLabel());
    await page.tap('#win-next');
    await page.waitForTimeout(300);
    check('win card: Play again replays route 1', await page.$eval('#win', (e) => e.hidden) && !(await page.$('.house.has-pal')));
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1700);
      await page.tap('#mail');
      await page.tap(`.house[data-id="${await wanted(page)}"]`, { force: true });
      await page.waitForTimeout(2700);
    }
    await page.waitForTimeout(500);
    check('win card: round that unlocks route 2 says Next route', (await winLabel()) === 'Next route', await winLabel());
    await page.tap('#win-next');
    await page.waitForTimeout(300);
    check('win card: Next route starts route 2', !!(await page.$('.house.has-pal')));
    await page.tap('[data-go="map"]');
    await page.waitForTimeout(300);
    check('map path: 2 rounds of route 1 light the path to route 2', (await segState(page)) === '10', await segState(page));
    check('map path: the segment that just lit animates once', await page.$$eval('#route .seg.new', (g) => g.map((x) => x.getAttribute('data-seg')).join()) === '1');
    // stars match the unlock rule: 2 per route
    check('map: 2 stars per route', (await page.$$eval('.node .stars', (x) => x.map((e) => e.children.length).join())) === '2,2,2,2');
    // "you are here": the player's animal sits on the route to play next, and a new route pulses until played
    const here = () => page.$$eval('.node .here', (x) => x.map((e) => e.closest('.node').getAttribute('data-level')).join());
    const fresh = () => page.$$eval('.node.fresh', (x) => x.map((e) => e.getAttribute('data-level')).join());
    check('map: the marker sits on route 2, the new route', (await here()) === '2', await here());
    check('map: route 2 pulses until played', (await fresh()) === '2', await fresh());
    check('map: the marker is on screen', await allOnScreen(page, '.node .here'));
    // going back to the map instead of Next route, then replaying route 1: the button still offers route 2
    await page.tap('.node[data-level="1"]');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1700);
      await page.tap('#mail');
      await page.tap(`.house[data-id="${await wanted(page)}"]`, { force: true });
      await page.waitForTimeout(2700);
    }
    await page.waitForTimeout(500);
    check('win card: a 3rd round of route 1 still says Next route while route 2 is unplayed', (await winLabel()) === 'Next route', await winLabel());
    await page.tap('#win-map');
    await page.waitForTimeout(300);
    check('map: after replaying route 1 the marker stays on route 2', (await here()) === '2', await here());
    await ctx.close();
  }

  // parent corner: press and hold opens it; on a sideways phone a swipe reaches Done
  {
    const { ctx, page, touch } = await newPage(browser, 740, 360);
    // the ring fills while held; letting go early resets it and opens nothing
    const g = await center(page, '#gear');
    const ring = () => page.$eval('#gear .ring circle', (c) => { const s = getComputedStyle(c); return { off: parseFloat(s.strokeDashoffset), shown: s.opacity === '1' }; });
    const before = await ring();
    await touch('touchStart', ...g);
    await page.waitForTimeout(600);
    const mid = await ring();
    await touch('touchEnd');
    await page.waitForTimeout(800);
    const after = await ring();
    check('gear: the ring runs round while held, and resets when let go early', !before.shown && mid.shown && mid.off > 20 && mid.off < 80 && !after.shown && await page.$eval('#parent', (e) => e.hidden), { before, mid, after });
    // two quick taps in a row show a tip to hold the gear; one tap doesn't, and the hold hides it
    const tap = async () => { await touch('touchStart', ...g); await page.waitForTimeout(80); await touch('touchEnd'); await page.waitForTimeout(250); };
    const tipShown = () => page.$eval('#gear-tip', (e) => !e.hidden);
    await page.waitForTimeout(3200);   // the early let-go above was a short press too
    await tap();
    const one = await tipShown();
    await tap();
    const two = await tipShown();
    check('gear: one tap shows no tip, a second tap in a row shows "press and hold"', !one && two && /hold/i.test(await page.$eval('#gear-tip', (e) => e.textContent)) && await page.$eval('#parent', (e) => e.hidden), { one, two });
    check('gear: the tip is on screen', await allOnScreen(page, '#gear-tip'));
    await holdGear(page, touch);
    check('gear: the tip goes when the gear is held', !(await tipShown()));
    check('parent corner opens with press and hold',await page.$eval('#parent', (e) => !e.hidden));
    check('play counts setting hidden while COUNT_URL is empty', await page.evaluate(() => document.querySelector('#share-row').hidden || /COUNT_URL = '[^']+'/.test(document.documentElement.innerHTML)));
    // the card is long, so a parent may swipe a few times
    let swipes = 0;
    for (let n = 0; n < 6 && !(await allOnScreen(page, '#p-close')); n++) {
      swipes++;
      await touch('touchStart', 370, 320);
      for (let y = 320; y >= 60; y -= 10) { await touch('touchMove', 370, y); await page.waitForTimeout(16); }
      await touch('touchEnd');
      await page.waitForTimeout(500);
    }
    check('parent corner Done reachable by swiping', await allOnScreen(page, '#p-close'), swipes);
    await ctx.close();
  }

  // progress row: one line per route by the unlock rule, plus stickers
  {
    const v1 = { rounds: { 1: 3, 2: 1, 3: 0, 4: 0 }, stickers: [{ c: 'S' }, { c: 'B' }, { c: 'K' }, { c: 'C' }], unlockAll: false, voice: true, sfx: true, share: false, weak: {} };
    const { ctx, page, touch } = await newPage(browser, 412, 915, { 'animal-mail-route-v1': v1 });
    await holdGear(page, touch);
    // on this screen the finger lifts over Print summary; that lift must not press it
    check('parent corner: lifting the finger after the hold presses nothing', await page.$eval('#summary', (e) => e.hidden) && !(await page.$('.pbtn.armed')));
    check('parent corner: no Print all players with one player', await page.$eval('#print-all-row', (e) => e.hidden));
    const want = ['Route 1, Letters: 3 rounds', 'Route 2, Animals: 1 round, so 1 more opens Route 3', 'Route 3, Letters and animals: locked', 'Route 4, Numbers: 0 rounds', 'Stickers: 4', 'Letters: S, B, K, C, P'];
    let got = await progressText(page);
    check('progress row matches the unlock rule', JSON.stringify(got) === JSON.stringify(want), got);
    await page.tap('#t-unlock');
    got = await progressText(page);
    check('progress row with Unlock all on', got[2] === 'Route 3, Letters and animals: open (Unlock all is on)' && got[1] === 'Route 2, Animals: 1 round', got);
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    check('map path: Unlock all lights every segment', (await segState(page)) === '11', await segState(page));
    await ctx.close();
  }

  // v1 save becomes player 1; the old key is removed
  {
    const v1 = { rounds: { 1: 2, 2: 0, 3: 0, 4: 0 }, stickers: [{ c: 'S' }, { c: 'B' }], unlockAll: false, voice: false, sfx: true, share: false, weak: { K: 4 } };
    const { ctx, page, touch } = await newPage(browser, 412, 915, { 'animal-mail-route-v1': v1 });
    const st = await page.evaluate(() => ({ v1: localStorage.getItem('animal-mail-route-v1'), v2: JSON.parse(localStorage.getItem('animal-mail-route-v2')) }));
    const p1 = st.v2 && st.v2.players[0];
    check('v1 save migrates to player 1', !st.v1 && st.v2.v === 2 && st.v2.players.length === 1 && p1.name === '' && p1.animal === 'S' && p1.rounds[1] === 2 && p1.stickers.length === 2 && p1.weak.K === 4 && st.v2.device.voice === false, st);
    await holdGear(page, touch);
    const got = await progressText(page);
    check('v1 progress carries over to the progress row', got[0] === 'Route 1, Letters: 2 rounds' && got[1] === 'Route 2, Animals: 0 rounds, so 2 more open Route 3' && got[4] === 'Stickers: 2', got);
    check('v1 practice letters carry over', (await page.$eval('#weaklist', (e) => e.textContent)) === 'K');
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    check('v1: route 2 open on the map after migration', !(await page.$('.node[data-level="2"].locked')) && !!(await page.$('.node[data-level="3"].locked')));
    check('map path: lit up to the last open route, grey after', (await segState(page)) === '10' && !(await page.$('#route .seg.new')), await segState(page));
    await ctx.close();
  }

  // friend library: a 0.5 save loads unchanged, and a letter's friends take turns between rounds
  {
    const old = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false }, current: 1, players: [{ id: 1, name: 'Ada', animal: 'K', rounds: { 1: 1, 2: 0, 3: 0, 4: 0 }, stickers: [{ c: 'S' }, { c: 'B' }, { c: 'P' }], weak: { C: 3, B: 1 } }] };
    const { ctx, page, touch, errors } = await newPage(browser, 412, 915, { 'animal-mail-route-v2': old });
    await holdGear(page, touch);
    const got = await progressText(page);
    check('0.5 save loads unchanged: progress, practice letters, avatar', got[0] === 'Route 1, Letters: 1 round, so 1 more opens Route 2' && got[4] === 'Stickers: 3' && (await page.$eval('#weaklist', (e) => e.textContent)) === 'C' && (await page.$eval('#players [data-ani][aria-pressed="true"]', (e) => e.getAttribute('data-ani'))) === 'K', got);
    check('clip count covers every friend and letter', (await page.$eval('#clipcount', (e) => e.textContent)) === '0 of 156');
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    const friendOfS = async () => {
      await page.tap('.node[data-level="1"]');
      await page.waitForTimeout(1200);
      return page.$eval('.house[data-id="S"]', (e) => e.getAttribute('data-friend') + '|' + e.getAttribute('aria-label'));
    };
    const turns = [];
    for (let i = 0; i < 3; i++) {
      turns.push(await friendOfS());
      await page.tap('[data-go="map"]');
      await page.waitForTimeout(300);
    }
    check('two friends for S take turns between rounds', turns.map((t) => t.split('|')[0]).join() === 'S,S2,S' && /Sally the Seal/.test(turns[1]), turns);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')).players[0]);
    check('0.5 save keeps stickers, avatar and practice scores after playing', st.animal === 'K' && st.name === 'Ada' && JSON.stringify(st.stickers) === JSON.stringify(old.players[0].stickers) && st.weak.C === 3 && st.weak.B === 1 && st.rounds[1] === 1, st);
    // picture mail names the friend in the house, and the reward line follows them
    await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('animal-mail-route-v2')); d.device.unlockAll = true; localStorage.setItem('animal-mail-route-v2', JSON.stringify(d)); });
    await page.reload();
    await page.waitForTimeout(600);
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    let sally = false;
    for (let i = 0; i < 4 && !sally; i++) {
      await page.tap('.node[data-level="2"]');
      await page.waitForTimeout(1200);
      if (await page.$('.house[data-friend="S2"]')) {
        for (let k = 0; k < 5 && !sally; k++) {
          const cap = await page.$eval('#caption', (e) => e.textContent);
          if (cap === 'This mail is for Sally the Seal!') {
            await page.tap('#mail');
            await page.tap('.house[data-id="S"]', { force: true });
            await page.waitForTimeout(400);
            sally = (await page.$eval('#banner', (e) => e.textContent)) === 'S for Sally the Seal!';
            break;
          }
          await page.tap('#mail');
          await page.tap(`.house[aria-label$="home of ${cap.slice(17, -1)}"]`, { force: true });
          await page.waitForTimeout(2900);
        }
      }
      await page.tap('[data-go="map"]');
      await page.waitForTimeout(300);
    }
    check('picture mail for Sally the Seal goes to the S house', sally);
    check('friend library: no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  // a second player: add in the parent corner, then "Who's playing?" with separate progress
  {
    const { ctx, page, touch, errors } = await newPage(browser, 412, 915);
    await holdGear(page, touch);
    await page.tap('#b-add');
    const pl = await page.$$eval('#players .pl', (els) => els.map((e) => e.querySelector('[aria-pressed="true"]').getAttribute('data-ani')));
    check('add player: second player gets the first unused animal', JSON.stringify(pl) === '["S","B"]', pl);
    await page.fill('#players .pl:nth-child(2) input', 'Mia');
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    check("two players: Play opens Who's playing?", await page.$eval('#s-who', (e) => !e.hidden) && (await page.$$('.kid')).length === 2);
    check("who's playing: name under the picture", (await page.$$eval('.kid .nm', (e) => e.map((x) => x.textContent))).join() === 'Mia');
    await page.tap('.kid[data-pid="2"]');
    await page.waitForTimeout(300);
    check('pick goes to the map, with that player on the top bar', await page.$eval('#s-map', (e) => !e.hidden) && /Mia/.test(await page.$eval('#m-who', (e) => e.getAttribute('aria-label'))));
    // finish one round as Mia
    await page.tap('.node[data-level="1"]');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1700);
      await page.tap('#mail');
      await page.tap(`.house[data-id="${await wanted(page)}"]`, { force: true });
      await page.waitForTimeout(2700);
    }
    await page.waitForTimeout(500);
    await page.tap('#win-map');
    await page.waitForTimeout(300);
    const stars = () => page.$$eval('.node[data-level="1"] .stars .on', (x) => x.length);
    check('Mia has 1 star on route 1', (await stars()) === 1);
    await page.tap('#m-who');
    await page.waitForTimeout(300);
    check('top bar animal returns to the picker', await page.$eval('#s-who', (e) => !e.hidden));
    await page.tap('.kid[data-pid="1"]');
    await page.waitForTimeout(300);
    check('progress stays separate: player 1 has no stars', (await stars()) === 0);
    await page.tap('[data-go="title"]');
    await holdGear(page, touch);
    const p1 = await progressText(page);
    await page.tap('#players .pl:nth-child(2)');
    const p2 = await progressText(page);
    check('progress row follows the selected player', p1[0] === 'Route 1, Letters: 0 rounds, so 2 more open Route 2' && p2[0] === 'Route 1, Letters: 1 round, so 1 more opens Route 2' && p2[4] === 'Stickers: 1' && /Mia/.test(await page.$eval('#prog-head', (e) => e.textContent)), [p1, p2]);
    // erase player 1 (two taps); Mia stays, and with one player the picker goes away
    await page.tap('#players .pl:nth-child(1) [data-erase]');
    check('erase a player needs a second tap', (await page.$$('#players .pl')).length === 2);
    await page.tap('#players .pl:nth-child(1) [data-erase]');
    const left = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('erasing one player leaves the other', left.players.length === 1 && left.players[0].name === 'Mia' && left.players[0].rounds[1] === 1 && left.current === 2, left);
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    check('back to one player: no picker', await page.$eval('#s-map', (e) => !e.hidden) && (await stars()) === 1);
    // erase everything
    await page.tap('[data-go="title"]');
    await holdGear(page, touch);
    await page.tap('#b-add');
    await page.tap('#b-reset'); await page.tap('#b-reset');
    const all = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('erase everything: one fresh player', all.players.length === 1 && all.players[0].rounds[1] === 0 && all.players[0].name === '', all);
    check('players: no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  // "Who's playing?" fits every screen size, with 2 players and with the most (8)
  for (const n of [2, 8]) {
    const players = Array.from({ length: n }, (_, i) => ({ id: i + 1, name: i % 2 ? 'Alexandria-Rose Lee' : '', animal: 'SBKCP'[i % 5], rounds: { 1: 0, 2: 0, 3: 0, 4: 0 }, stickers: [], weak: {} }));
    const v2 = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false }, current: 1, players };
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      const { ctx, page, errors } = await newPage(browser, w, h, { 'animal-mail-route-v2': v2 });
      await page.tap('.playbtn');
      await page.waitForTimeout(400);
      check(`${name}, ${n} players: everyone on screen`, (await page.$$('.kid')).length === n && await allOnScreen(page, '.kid, #s-who .rbtn'));
      await page.tap(`.kid[data-pid="${n}"]`);
      await page.waitForTimeout(300);
      check(`${name}, ${n} players: pick opens the map with the avatar on screen`, await allOnScreen(page, '.node, #m-who'));
      check(`${name}, ${n} players: no errors`, errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
  }

  // printable summary: the selected player's lines on a plain page, then the print dialog
  {
    const mk = (id, name, animal, rounds, n, weak) => ({ id, name, animal, rounds, stickers: Array.from({ length: n }, () => ({ c: 'S' })), weak });
    const v2 = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false }, current: 1, players: [
      mk(1, 'Leo', 'P', { 1: 1, 2: 0, 3: 0, 4: 0 }, 1, {}),
      mk(2, 'Mia', 'K', { 1: 3, 2: 2, 3: 1, 4: 0 }, 6, { K: 3, C: 2, B: 1 }),
    ] };
    const { ctx, page, touch, errors, hosts } = await newPage(browser, 740, 360, { 'animal-mail-route-v2': v2 });
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await holdGear(page, touch);
    await page.tap('#players .pl:nth-child(2)');
    const lines = await progressText(page);
    await page.$eval('#b-print', (b) => b.scrollIntoView());
    await page.tap('#b-print');
    await page.waitForTimeout(200);
    const sum = await page.evaluate(() => ({
      shown: !document.querySelector('#summary').hidden,
      who: document.querySelector('#summary .sum-who').textContent,
      lines: [...document.querySelectorAll('#summary .sum-progress li')].map((e) => e.textContent),
      weak: document.querySelector('#summary .sum-weak').textContent,
      printed: window.__printed,
      fits: document.querySelector('#summary').scrollWidth <= innerWidth,
    }));
    check('print summary: opens the summary and the print dialog', sum.shown && sum.printed === 1, sum);
    check("print summary: shows the selected player's lines", sum.who === 'Player: Mia (Kelly the Kangaroo)' && JSON.stringify(sum.lines) === JSON.stringify(lines) && sum.lines[0] === 'Route 1, Letters: 3 rounds' && sum.lines[2] === 'Route 3, Letters and animals: 1 round' && sum.lines[3] === 'Route 4, Numbers: 0 rounds' && sum.lines[4] === 'Stickers: 6', sum);
    check('print summary: needs practice with names', sum.weak === 'K (Kelly the Kangaroo), C (Cody the Crane)', sum.weak);
    check('print summary: fits the width of a sideways phone', sum.fits);
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => ({ app: getComputedStyle(document.querySelector('#app')).display, acts: getComputedStyle(document.querySelector('.summary .acts')).display, sheet: document.querySelector('#summary .sheet').getBoundingClientRect().height > 0 }));
    check('print summary: printed page has only the summary, no buttons', pr.app === 'none' && pr.acts === 'none' && pr.sheet, pr);
    await page.emulateMedia({ media: 'screen' });
    await page.$eval('#sum-close', (b) => b.scrollIntoView());
    await page.tap('#sum-close');
    check('print summary: Done goes back to the parent corner', await page.$eval('#summary', (e) => e.hidden) && await page.$eval('#parent', (e) => !e.hidden) && (await page.title()) === 'Animal Mail Route');
    await page.tap('#players .pl:nth-child(1)');
    await page.$eval('#b-print', (b) => b.scrollIntoView());
    await page.tap('#b-print');
    const leo = await page.$$eval('#summary .sum-progress li', (li) => li.map((e) => e.textContent));
    check('print summary: follows the selected player', leo[0] === 'Route 1, Letters: 1 round, so 1 more opens Route 2' && leo[4] === 'Stickers: 1' && (await page.$eval('#summary .sum-weak', (e) => e.textContent)) === 'None yet' && (await page.$$('#summary .sheet')).length === 1, leo);
    await page.$eval('#sum-close', (b) => b.scrollIntoView());
    await page.tap('#sum-close');

    // print all players: every player's sheet, in order, one per printed page
    check('print all players: shown with two players', await page.$eval('#print-all-row', (e) => !e.hidden));
    await page.$eval('#b-print-all', (b) => b.scrollIntoView());
    await page.tap('#b-print-all');
    await page.waitForTimeout(200);
    const all = await page.evaluate(() => ({
      shown: !document.querySelector('#summary').hidden,
      sheets: [...document.querySelectorAll('#summary .sheet')].map((s) => ({
        who: s.querySelector('.sum-who').textContent,
        lines: [...s.querySelectorAll('.sum-progress li')].map((e) => e.textContent),
        weak: s.querySelector('.sum-weak').textContent,
      })),
      printed: window.__printed,
      title: document.title,
      fits: document.querySelector('#summary').scrollWidth <= innerWidth,
    }));
    check('print all players: opens the print dialog with one sheet per player', all.shown && all.printed === 3 && all.sheets.length === 2 && all.title === 'Animal Mail Route progress, all players', all);
    check('print all players: each sheet has that player\'s lines, in player order',
      all.sheets[0].who === 'Player: Leo (Pete the Penguin)' && JSON.stringify(all.sheets[0].lines) === JSON.stringify(leo) && all.sheets[0].weak === 'None yet' &&
      all.sheets[1].who === 'Player: Mia (Kelly the Kangaroo)' && JSON.stringify(all.sheets[1].lines) === JSON.stringify(lines) && all.sheets[1].weak === 'K (Kelly the Kangaroo), C (Cody the Crane)', all.sheets);
    check('print all players: fits the width of a sideways phone', all.fits);
    await page.emulateMedia({ media: 'print' });
    const brk = await page.$$eval('#summary .sheet', (s) => s.map((e) => getComputedStyle(e).breakBefore));
    check('print all players: each player starts a new printed page', brk[0] !== 'page' && brk[1] === 'page', brk);
    await page.emulateMedia({ media: 'screen' });
    await page.$eval('#sum-close', (b) => b.scrollIntoView());
    await page.tap('#sum-close');
    check('print all players: Done goes back to the parent corner', await page.$eval('#summary', (e) => e.hidden) && await page.$eval('#parent', (e) => !e.hidden) && (await page.title()) === 'Animal Mail Route');
    check('print summary: no errors, nothing sent elsewhere', errors.length === 0 && [...hosts].every((x) => x === host), { errors, hosts: [...hosts] });
    await ctx.close();
  }

  // letter sets: a grid per player in the parent corner; rounds draw only from the set
  {
    const { ctx, page, touch, errors } = await newPage(browser, 412, 915);
    await holdGear(page, touch);
    const grid = () => page.$$eval('#lgrid button', (b) => b.map((x) => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '+' : '') + (x.disabled ? '!' : '')).join(' '));
    const g0 = await grid();
    check('letters: A to Z, every letter but X can be chosen, the first five are on', (await page.$$('#lgrid button')).length === 26 && (await page.$$('#lgrid button:not([disabled])')).length === 25 && (await page.$eval('#lgrid button[disabled]', (b) => b.textContent)) === 'X' && g0.split(' ').filter((x) => x.includes('+')).map((x) => x[0]).join('') === 'BCKPS', g0);
    check('letters: a new player has the default set', (await progressText(page))[5] === 'Letters: S, B, K, C, P');
    // turn off K and P: S, B, C left
    await page.tap('#lgrid [data-letter="K"]');
    await page.tap('#lgrid [data-letter="P"]');
    let st = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')).players[0]);
    check('letters: turning letters off saves the set, rounds and stickers kept', JSON.stringify(st.letters) === '["S","B","C"]' && st.rounds[1] === 0 && (await progressText(page))[5] === 'Letters: S, B, C', st);
    // the 2-letter minimum
    await page.tap('#lgrid [data-letter="C"]');
    const last2 = await page.$$eval('#lgrid [data-letter][aria-pressed="true"]', (b) => b.map((x) => x.textContent + (x.disabled ? '!' : '')).join());
    check('letters: the last two cannot be turned off', last2 === 'B!,S!', last2);
    await page.tap('#lgrid [data-letter="S"]', { force: true });
    st = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')).players[0]);
    check('letters: tapping one of the last two changes nothing', JSON.stringify(st.letters) === '["S","B"]', st.letters);
    await page.tap('#b-allletters');
    check('letters: "All" turns on every letter with a friend, Q and U too', (await progressText(page))[5] === 'Letters: S, B, K, C, P, A, D, E, F, G, H, I, J, L, M, N, O, Q, R, T, U, V, W, Y, Z', (await progressText(page))[5]);
    await page.tap('#b-first5');
    await page.tap('#lgrid [data-letter="S"]');
    await page.tap('#lgrid [data-letter="C"]');
    check('letters: S off, then C off', (await progressText(page))[5] === 'Letters: B, K, P');
    check('letters: Use for all players hidden with one player', await page.$eval('#same-row', (e) => e.hidden));
    // play route 3 (Unlock all): 3 houses, every house and mail from the set
    await page.tap('#t-unlock');
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    await page.tap('.node[data-level="3"]');
    const houses = [], mails = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1700);
      if (!i) houses.push(...(await page.$$eval('.house', (h) => h.map((x) => x.getAttribute('data-id')))));
      const item = await page.evaluate(() => { const c = document.querySelector('#caption').textContent; const m = /Who gets the (.)\?/.exec(c); return m ? m[1] : c; });
      const id = await page.evaluate((c) => { if (c.length === 1) return c; const h = [...document.querySelectorAll('.house')].find((x) => c.includes(x.getAttribute('aria-label').split('home of ')[1])); return h && h.getAttribute('data-id'); }, item);
      mails.push(id);
      await page.tap('#mail');
      await page.tap(`.house[data-id="${id}"]`, { force: true });
      await page.waitForTimeout(2700);
    }
    check('letters: a round on route 3 has one house per letter in the set', houses.sort().join() === 'B,K,P', houses);
    check('letters: every mail is from the set', mails.length === 5 && mails.every((m) => 'BKP'.includes(m)), mails);
    await page.waitForTimeout(500);
    check('letters: the round finishes with a sticker', await page.$eval('#win', (e) => !e.hidden));
    // route 4 keeps its five numbered houses
    await page.tap('#win-map');
    await page.waitForTimeout(300);
    await page.tap('.node[data-level="4"]');
    await page.waitForTimeout(1200);
    check('letters: the numbers route keeps houses 1 to 3 to start', (await page.$$eval('.house .sign', (s) => s.map((x) => x.textContent).sort().join())) === '1,2,3');
    check('letters: no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  // letter sets: route 1 grows within the set; "Use for all players"; the summary; Ready for new letters
  {
    const mk = (id, name, animal, letters, rounds, weak, extra) => Object.assign({ id, name, animal, rounds, stickers: [], weak, letters }, extra);
    const v2 = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false }, current: 1, players: [
      mk(1, 'Leo', 'P', ['S', 'B', 'C', 'P'], { 1: 1, 2: 0, 3: 0, 4: 0 }, {}),
      mk(2, 'Mia', 'K', ['B', 'K'], { 1: 3, 2: 0, 3: 0, 4: 0 }, { B: 1 }),
      mk(3, '', 'S', ['X', 'S', 'zz'], { 1: 0, 2: 0, 3: 0, 4: 0 }, {}),
    ] };
    const { ctx, page, touch, errors } = await newPage(browser, 740, 360, { 'animal-mail-route-v2': v2 });
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    await page.tap('.kid[data-pid="1"]');
    await page.waitForTimeout(300);
    await page.tap('.node[data-level="1"]');
    await page.waitForTimeout(1200);
    const h1 = await page.$$eval('.house', (h) => h.map((x) => x.getAttribute('data-id')).sort().join());
    check('letters: route 1 grows within the set, in its order (3 houses after 1 round)', h1 === 'B,C,S', h1);
    await page.tap('[data-go="map"]');
    await page.tap('[data-go="title"]');
    await holdGear(page, touch);
    const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('letters: a save with too few valid letters gets the default set; setRounds counted from rounds', JSON.stringify(sv.players[2].letters) === '["S","B","K","C","P"]' && sv.players[1].setRounds === 3 && sv.device.lettersSame === false, sv.players.map((p) => [p.letters, p.setRounds]));
    check('letters: Ready for new letters hidden before 3 rounds (Leo)', await page.$eval('#ready', (e) => e.hidden));
    await page.tap('#players .pl:nth-child(2)');
    check('letters: Ready for new letters after 3 rounds with nothing to practise (Mia)', await page.$eval('#ready', (e) => !e.hidden) && /Mia/.test(await page.$eval('#let-head', (e) => e.textContent)));
    // the summary shows the letters and the hint
    await page.evaluate(() => { window.print = () => {}; });
    await page.$eval('#b-print', (b) => b.scrollIntoView());
    await page.tap('#b-print');
    await page.waitForTimeout(200);
    const sum = await page.evaluate(() => ({ lines: [...document.querySelectorAll('#summary .sum-progress li')].map((e) => e.textContent), ready: !!document.querySelector('#summary .sum-ready') }));
    check('letters: the printed summary lists the letters and Ready for new letters', sum.lines[5] === 'Letters: B, K' && sum.ready, sum);
    await page.$eval('#sum-close', (b) => b.scrollIntoView());
    await page.tap('#sum-close');
    // a change to the set starts its count again, so the hint goes away
    await page.$eval('#lgrid [data-letter="S"]', (b) => b.scrollIntoView());
    await page.tap('#lgrid [data-letter="S"]');
    check('letters: changing the set clears Ready for new letters', await page.$eval('#ready', (e) => e.hidden));
    // Use for all players copies Mia's set to everyone and keeps them together
    check('letters: Use for all players shown with 2+ players, off', await page.$eval('#same-row', (e) => !e.hidden) && (await page.$eval('#t-same', (e) => e.getAttribute('aria-pressed'))) === 'false');
    await page.$eval('#t-same', (b) => b.scrollIntoView());
    await page.tap('#t-same');
    let all = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('letters: Use for all players copies the set to everyone', all.device.lettersSame && all.players.every((p) => p.letters.join() === 'S,B,K'), all.players.map((p) => p.letters));
    await page.$eval('#lgrid [data-letter="P"]', (b) => b.scrollIntoView());
    await page.tap('#lgrid [data-letter="P"]');
    await page.$eval('#b-add', (b) => b.scrollIntoView());
    await page.tap('#b-add');
    all = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('letters: while on, a change and a new player follow the shared set', all.players.length === 4 && all.players.every((p) => p.letters.join() === 'S,B,K,P'), all.players.map((p) => p.letters));
    await page.$eval('#t-same', (b) => b.scrollIntoView());
    await page.tap('#t-same');
    await page.$eval('#lgrid [data-letter="P"]', (b) => b.scrollIntoView());
    await page.tap('#lgrid [data-letter="P"]');
    all = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('letters: turned off, a change is for the selected player only', !all.device.lettersSame && all.players[3].letters.join() === 'S,B,K' && all.players.slice(0, 3).every((p) => p.letters.join() === 'S,B,K,P') && all.players[0].rounds[1] === 1, all.players.map((p) => p.letters));
    check('letters: parent corner fits the width of a sideways phone', await page.evaluate(() => document.querySelector('#parent .card').getBoundingClientRect().right <= innerWidth && document.querySelector('#lgrid').scrollWidth <= document.querySelector('#lgrid').clientWidth));
    check('letters (players): no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  // more animal friends (A to Z): art, names, the letter grid, More avatars, a round with new letters
  {
    const { ctx, page, touch, errors, hosts } = await newPage(browser, 740, 360);
    // every friend's art renders in a house-sized box, and every name starts with its letter
    await holdGear(page, touch);
    await page.tap('#players [data-more]');
    const list = await page.$$eval('#players [data-ani]', (bs) => bs.map((b) => {
      const svg = b.querySelector('svg'), r = svg.getBBox();
      return { id: b.getAttribute('data-ani'), name: b.getAttribute('aria-label'), w: r.width, h: r.height, shapes: svg.children.length };
    }));
    check('friends: More shows all 46 friends', list.length === 46, list.length);
    const badArt = list.filter((f) => !(f.shapes > 3 && f.w > 30 && f.h > 30 && f.w <= 110 && f.h <= 110));
    check('friends: every friend\'s art renders', badArt.length === 0, badArt);
    const badName = list.filter((f) => { const m = /^(\w)\w* the (\w)/.exec(f.name); return !m || m[1] !== f.id[0] || m[2] !== f.id[0]; });
    check('friends: every name and animal starts with the friend\'s letter', badName.length === 0, badName.map((f) => f.name));
    check('friends: names are unique', new Set(list.map((f) => f.name)).size === list.length);
    check('friends: parent corner with More open fits a sideways phone', await page.evaluate(() => document.querySelector('#parent .card').getBoundingClientRect().right <= innerWidth && [...document.querySelectorAll('#players .ani')].every((a) => a.scrollWidth <= a.clientWidth)));
    // choose a new friend as the avatar; Fewer keeps it in the short list
    await page.$eval('#players [data-ani="O"]', (b) => b.scrollIntoView());
    await page.tap('#players [data-ani="O"]');
    await page.$eval('#players [data-more]', (b) => b.scrollIntoView());
    await page.tap('#players [data-more]');
    const short = await page.$$eval('#players [data-ani]', (bs) => bs.map((b) => b.getAttribute('data-ani') + (b.getAttribute('aria-pressed') === 'true' ? '+' : '')).join());
    check('friends: Fewer shows the first five plus the chosen friend', short === 'S,B,K,C,P,O+', short);
    let sv = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
    check('friends: a new friend as avatar is saved', sv.players[0].animal === 'O', sv.players[0].animal);
    // a set of new letters: every house and mail is from it, with its friends
    await page.$eval('#lgrid', (b) => b.scrollIntoView());
    for (const l of ['A', 'M', 'Z']) await page.tap(`#lgrid [data-letter="${l}"]`);
    for (const l of ['S', 'B', 'K', 'C', 'P']) await page.tap(`#lgrid [data-letter="${l}"]`);
    check('friends: a set of new letters', (await progressText(page))[5] === 'Letters: A, M, Z', (await progressText(page))[5]);
    await page.$eval('#t-unlock', (b) => b.scrollIntoView());
    await page.tap('#t-unlock');
    await page.$eval('#p-close', (b) => b.scrollIntoView());
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    const met = new Set();
    for (const level of [3, 2]) {
      for (let round = 0; round < 2; round++) {
        await page.tap(`.node[data-level="${level}"]`);
        const houses = [], mails = [];
        for (let i = 0; i < 5; i++) {
          await page.waitForTimeout(1700);
          if (!i) houses.push(...(await page.$$eval('.house', (h) => h.map((x) => x.getAttribute('data-id') + ':' + x.getAttribute('data-friend')))));
          const id = await page.evaluate(() => { const c = document.querySelector('#caption').textContent; const m = /Who gets the (.)\?/.exec(c); if (m) return m[1]; const h = [...document.querySelectorAll('.house')].find((x) => c.includes(x.getAttribute('aria-label').split('home of ')[1])); return h && h.getAttribute('data-id'); });
          mails.push(id);
          await page.tap('#mail');
          await page.tap(`.house[data-id="${id}"]`, { force: true });
          await page.waitForTimeout(2700);
        }
        houses.forEach((h) => met.add(h));
        check(`friends: route ${level} round ${round + 1} uses only A, M and Z`, houses.map((h) => h[0]).sort().join() === 'A,M,Z' && mails.every((m) => 'AMZ'.includes(m)), { houses, mails });
        await page.waitForTimeout(500);
        await page.tap('#win-map');
        await page.waitForTimeout(300);
      }
    }
    check('friends: both friends of A, M and Z take turns', [...met].sort().join() === 'A:A,A:A2,M:M,M:M2,Z:Z,Z:Z2', [...met]);
    check('friends: no script or console errors, nothing sent elsewhere', errors.length === 0 && [...hosts].every((x) => x === new URL(BASE).host), { errors, hosts: [...hosts] });
    await ctx.close();
  }

  // installable and offline: manifest, service worker, then play a delivery with the network off
  {
    const { ctx, page, touch, errors } = await newPage(browser, 412, 915);
    const man = await page.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); return r.json(); });
    check('manifest: standalone with 192 and 512 px icons and a maskable one', man.display === 'standalone' && ['192x192', '512x512'].every((s) => man.icons.some((i) => i.sizes === s)) && man.icons.some((i) => i.purpose === 'maskable'));
    const icons = await page.evaluate(async (list) => Promise.all(list.map(async (s) => (await fetch(s)).ok)), man.icons.map((i) => i.src));
    check('manifest: every icon loads', icons.every(Boolean), icons);
    // link preview: the image is on the live site (full address), and the same file is in this copy
    const og = await page.evaluate(async () => {
      const m = (k) => (document.querySelector(`meta[property="${k}"], meta[name="${k}"]`) || {}).content;
      const img = m('og:image'), r = await fetch(new URL(img).pathname.replace(/^\/animal-mail-route\//, ''));
      const bmp = r.ok ? await createImageBitmap(await r.blob()) : null;
      return { img, title: m('og:title'), card: m('twitter:card'), size: bmp && [bmp.width, bmp.height], w: m('og:image:width'), h: m('og:image:height') };
    });
    check('link preview: title, large card, and a 1200x630 image that loads', og.title === 'Animal Mail Route' && og.card === 'summary_large_image' && og.img === 'https://avatar-coco-love.github.io/animal-mail-route/icons/share.png' && JSON.stringify(og.size) === '[1200,630]' && og.w === '1200' && og.h === '630', og);
    const sw = await page.evaluate(() => navigator.serviceWorker.ready.then(() => new Promise((res) => {
      if (navigator.serviceWorker.controller) return res(true);
      navigator.serviceWorker.addEventListener('controllerchange', () => res(true));
      setTimeout(() => res(false), 10000);
    })));
    check('service worker installed and controls the page', sw);
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForTimeout(600);
    check('offline: game loads', await allOnScreen(page, '.playbtn'));
    check('offline: fonts load', await page.evaluate(() => document.fonts.ready.then(() => document.fonts.check('800 20px "Baloo 2"') && [...document.fonts].some((f) => f.family.includes('Baloo') && f.status === 'loaded'))));
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    await page.tap('.node[data-level="1"]');
    await page.waitForTimeout(1700);
    const id = await wanted(page);
    const from = await center(page, '#mail');
    const to = await center(page, `.house[data-id="${id}"]`);
    await touch('touchStart', ...from);
    for (let i = 1; i <= 12; i++) { await touch('touchMove', from[0] + (to[0] - from[0]) * i / 12, from[1] + (to[1] - from[1]) * i / 12); await page.waitForTimeout(16); }
    await touch('touchEnd');
    await page.waitForTimeout(400);
    check('offline: drop delivers', (await page.$$eval('.pip.on', (x) => x.length)) === 1);
    const priv = await page.evaluate(() => Promise.all(['privacy.html', 'privacy-es.html'].map((u) => fetch(u).then((r) => r.ok, () => false))));
    check('offline: privacy pages available (English and Spanish)', priv.every(Boolean), priv);
    const sets = await page.evaluate(() => Promise.all(['words.js', 'audio/en/female/clips.json', 'audio/en/male/clips.json', 'audio/es/female/clips.json', 'audio/es/male/clips.json'].map((u) => fetch(u).then((r) => r.ok, () => false))));
    check('offline: words.js and every voice set\'s list available', sets.every(Boolean), sets);
    // the Spanish address works offline too: es/ opens the game in Spanish
    await page.goto(BASE + 'es/');
    await page.waitForURL(/\?lang=es/);
    await page.waitForTimeout(600);
    check('offline: the Spanish address opens the game in Spanish', (await page.evaluate(() => document.documentElement.lang)) === 'es' && await allOnScreen(page, '.playbtn'));
    check('offline: no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  // ---------- Languages ----------
  // Spanish is offered (1.4), labelled a draft for parents: its own words, friends and progress.
  {
    const enSave = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false, lettersSame: false }, current: 1,
      players: [{ id: 1, name: 'Ana', animal: 'K', rounds: { 1: 3, 2: 0, 3: 0, 4: 0 }, stickers: [{ c: 'S' }, { c: 'B' }, { c: 'K' }], weak: { S: 2 }, seen: {}, letters: ['S', 'B', 'K', 'C', 'P'], setRounds: 3, last: 1 }] };
    // English device: English, with an "Español" button and the language row; no draft note in English
    {
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915);
      const st = await page.evaluate(() => ({ lang: document.documentElement.lang, btn: document.querySelector('#lang-btn').hidden, label: document.querySelector('#lang-btn').textContent, title: document.title }));
      await holdGear(page, touch);
      st.row = await page.$eval('#lang-row', (e) => e.hidden);
      st.draft = await page.$eval('#draft-note', (e) => e.hidden);
      check('languages: English by default, with an Español button and the language row, no draft note', st.lang === 'en' && !st.btn && st.label === 'Español' && !st.row && st.draft && st.title === 'Animal Mail Route', st);
      await ctx.close();
      check('languages: no errors in English', errors.length === 0, errors.length ? errors : undefined);
    }
    // Spanish device, first visit: the game opens in Spanish, and the Spanish parent corner says the translation is a draft
    {
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915, null, { locale: 'es-MX' });
      const st = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, btn: document.querySelector('#lang-btn').textContent }));
      check('languages: a Spanish device gets Spanish on a first visit, with an English button', st.lang === 'es' && st.h1 === 'El Correo de los Animales' && st.btn === 'English', st);
      check('languages: no draft note on the Spanish title screen', await page.$eval('#draft-note', (e) => e.offsetParent === null));
      await holdGear(page, touch);
      const d = await page.$eval('#draft-note', (e) => ({ hidden: e.hidden, text: e.textContent, inCorner: !!e.closest('#parent') }));
      check('languages: the Spanish parent corner says the translation is a draft and asks for corrections', !d.hidden && d.inCorner && /borrador/.test(d.text) && /hablante nativo/.test(d.text) && /Ayuda a mejorar el juego/.test(d.text), d);
      await ctx.close();
      check('languages: no errors on a Spanish device', errors.length === 0, errors.length ? errors : undefined);
    }
    // a save from before languages stays English, also on a Spanish device
    {
      const { ctx, page } = await newPage(browser, 412, 915, { 'animal-mail-route-v2': enSave }, { locale: 'es-MX' });
      check('languages: a save from before languages stays English', (await page.evaluate(() => document.documentElement.lang)) === 'en');
      await ctx.close();
    }
    // The Spanish address (es/): a Spanish link preview, then the game in Spanish, installable under a Spanish name
    {
      const { ctx, page, errors } = await newPage(browser, 412, 915);
      const enMan = await page.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'), r = await fetch(l.href), m = await r.json(); return { href: l.getAttribute('href'), id: new URL(m.id, l.href).href }; });
      check('languages: the English page links the English manifest', enMan.href === 'manifest.webmanifest' && enMan.id === new URL(BASE, page.url()).href, enMan);
      check('languages: the English parent corner links the English privacy page', (await page.$eval('#privacy-link', (e) => e.getAttribute('href'))) === 'privacy.html');
      const og = await page.evaluate(async () => {
        const doc = new DOMParser().parseFromString(await (await fetch('es/')).text(), 'text/html');
        const m = (k) => (doc.querySelector(`meta[property="${k}"], meta[name="${k}"]`) || {}).content;
        const img = m('og:image'), r = await fetch(new URL(img).pathname.replace(/^\/animal-mail-route\//, ''));
        const bmp = r.ok ? await createImageBitmap(await r.blob()) : null;
        return { lang: doc.documentElement.lang, title: m('og:title'), url: m('og:url'), img, card: m('twitter:card'), size: bmp && [bmp.width, bmp.height], w: m('og:image:width'), h: m('og:image:height') };
      });
      check('Spanish address: a Spanish link preview with a 1200x630 picture that loads', og.lang === 'es' && og.title === 'El Correo de los Animales' && og.url === 'https://avatar-coco-love.github.io/animal-mail-route/es/' &&
        og.img === 'https://avatar-coco-love.github.io/animal-mail-route/icons/share-es.png' && og.card === 'summary_large_image' && JSON.stringify(og.size) === '[1200,630]' && og.w === '1200' && og.h === '630', og);
      await page.goto(BASE + 'es/');
      await page.waitForURL(/\?lang=es/);
      await page.waitForTimeout(600);
      const st = await page.evaluate(async () => {
        const l = document.querySelector('link[rel=manifest]'), m = await (await fetch(l.href)).json(), abs = (u) => new URL(u, l.href).href;
        const icons = await Promise.all(m.icons.map(async (i) => (await fetch(abs(i.src))).ok));
        return { lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, href: l.getAttribute('href'), name: m.name, short: m.short_name, mlang: m.lang,
          id: abs(m.id), start: abs(m.start_url), scope: abs(m.scope), display: m.display, icons, maskable: m.icons.some((i) => i.purpose === 'maskable') };
      });
      const base = new URL(BASE, page.url()).href;
      check('Spanish address: opens the game in Spanish', st.lang === 'es' && st.h1 === 'El Correo de los Animales', st);
      check('Spanish address: a Spanish manifest, its own app, starting at es/, scope the whole game, icons load',
        st.href === 'es/manifest.webmanifest' && st.name === 'El Correo de los Animales' && st.short === 'Correo Animal' && st.mlang === 'es-MX' && st.id === base + 'es/' && st.start === base + 'es/' &&
        st.scope === base && page.url().startsWith(st.scope) && st.display === 'standalone' && st.maskable && st.icons.every(Boolean), st);
      // the Spanish privacy page, from the Spanish parent corner
      const href = await page.$eval('#privacy-link', (e) => e.getAttribute('href'));
      await page.goto(BASE + href);
      const pr = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, back: document.querySelector('a.back').href, en: !!document.querySelector('a[href="privacy.html"]'), w: document.documentElement.scrollWidth <= innerWidth }));
      check('Spanish privacy page: linked from the Spanish parent corner, in Spanish, back to es/, links to English, fits', href === 'privacy-es.html' && pr.lang === 'es' && pr.h1 === 'El Correo de los Animales: privacidad' && pr.back === base + 'es/' && pr.en && pr.w, pr);
      check('Spanish privacy page: says the translation is a draft and asks for corrections', await page.evaluate(() => { const d = document.querySelector('#draft'); return !!d && /borrador/.test(d.textContent) && /hablante nativo/.test(d.textContent); }));
      await page.goto(BASE + 'privacy.html');
      check('English privacy page links to the Spanish one', await page.evaluate(() => !!document.querySelector('a[href="privacy-es.html"]')));
      check('Spanish address: no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // Spanish preview at every size: the title screen and its language button fit, nothing overlaps
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      const { ctx, page, errors } = await newPage(browser, w, h, null, { path: '?lang=es' });
      const st = await page.evaluate(() => {
        const box = (s) => document.querySelector(s).getBoundingClientRect();
        const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const lb = box('#lang-btn');
        return { lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, play: document.querySelector('.playbtn').textContent.trim(),
          btn: document.querySelector('#lang-btn').textContent, aria: document.querySelector('#lang-btn').getAttribute('aria-label'),
          clear: !['#gear', '.playbtn', '.corner-l .rbtn', '#cast', 'h1'].some((s) => hit(lb, box(s))) };
      });
      check(`${name}: Spanish title screen`, st.lang === 'es' && st.h1 === 'El Correo de los Animales' && st.play === 'Jugar' && st.btn === 'English' && st.aria === 'Play in English' && st.clear, st);
      check(`${name}: Spanish title buttons on screen`, await allOnScreen(page, '.playbtn, .title .rbtn, #lang-btn'));
      check(`${name}: no errors in Spanish`, errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // Spanish: a round, the words on every screen, the friends, the voice
    {
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915, null, { path: '?lang=es' });
      const english = /\b(Play|Sticker|Parent|Route|Letters|Who gets|Back to|Hear|House|Mail with|Progress|Players|Erase|Print|Done|Voice|Sound effects|Unlock|Needs|None yet|More|First five|Paper|Everyone|Privacy|Prototype|stars?)\b/;
      const words = () => page.evaluate(() => [...document.querySelectorAll('#app *')].filter((e) => !e.closest('[hidden]') && !e.closest('#lang-btn') && !e.closest('[data-lang]'))
        .map((e) => [e.getAttribute('aria-label') || '', e.getAttribute('placeholder') || '', [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ')].join(' ')).join(' | '));
      let seen = await words();
      await page.evaluate(() => { window.__said = []; speechSynthesis.speak = (u) => window.__said.push([u.lang, u.text]); });
      await page.tap('.playbtn');
      await page.waitForTimeout(300);
      seen += await words();
      const map = await page.evaluate(() => [...document.querySelectorAll('#route .node')].map((n) => n.getAttribute('aria-label')));
      check('Spanish map: route names', map[0].startsWith('Ruta 1, Letras') && map[3].startsWith('Ruta 4, Números'), map);
      await page.tap('.node[data-level="1"]');
      await page.waitForTimeout(1700);
      const cap = await page.$eval('#caption', (e) => e.textContent);
      const id = await wanted(page);
      check('Spanish round: the caption asks in Spanish, for one of the first five', /^¿Quién recibe la [MP]\?$/.test(cap), cap);
      const said = await page.evaluate(() => window.__said.slice(-1)[0]);
      check('Spanish round: the prompt is spoken in Mexican Spanish', said && said[0] === 'es-MX' && said[1] === '¿Quién recibe la ' + id, said);
      seen += await words();
      const from = await center(page, '#mail');
      const to = await center(page, `.house[data-id="${id}"]`);
      await touch('touchStart', ...from);
      for (let i = 1; i <= 12; i++) { await touch('touchMove', from[0] + (to[0] - from[0]) * i / 12, from[1] + (to[1] - from[1]) * i / 12); await page.waitForTimeout(16); }
      await touch('touchEnd');
      await page.waitForTimeout(400);
      const banner = await page.$eval('#banner', (e) => e.textContent);
      const said2 = await page.evaluate(() => window.__said.slice(-1)[0]);
      check('Spanish round: the delivery cheers in Spanish', (await page.$$eval('.pip.on', (x) => x.length)) === 1 && new RegExp('^¡' + id + ' de (Memo el Mono|Paco el Pingüino)!$').test(banner) && said2[1] === '¡' + id + '! ¡' + banner.slice(1), [banner, said2]);
      seen += await words();
      await page.tap('#s-play [data-go="map"]');
      await page.waitForTimeout(300);
      await page.tap('#s-map [data-go="book"]');
      await page.waitForTimeout(300);
      check('Spanish sticker book', (await page.$eval('#book-count', (e) => e.textContent)) === '0 estampas');
      seen += await words();
      await page.tap('#s-book [data-go="map"]');
      await page.tap('#s-map [data-go="title"]');
      await page.waitForTimeout(300);
      await holdGear(page, touch);
      await page.tap('#players [data-more]');
      await page.waitForTimeout(200);
      seen += await words();
      const leftover = seen.match(english);
      check('Spanish: no English words on the title, map, round, sticker book or parent corner', !leftover, leftover && seen.slice(Math.max(0, leftover.index - 80), leftover.index + 80));
      const fr = await page.evaluate(() => [...document.querySelectorAll('#players [data-ani]')].map((b) => [b.getAttribute('data-ani'), b.getAttribute('aria-label'), b.querySelector('svg').innerHTML.length]));
      const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
      // Ñ is its own letter, so compare it as is; other accents (Á, Ó) are dropped
      const first = (n) => n[0] === 'Ñ' ? 'Ñ' : plain(n)[0];
      check('Spanish friends: 36, each with a picture, a unique name starting with their letter', fr.length === 36 && new Set(fr.map((f) => f[1])).size === 36 && fr.every(([id, n, a]) => a > 50 && first(n) === id[0]), fr.filter(([id, n, a]) => !(a > 50 && first(n) === id[0])));
      const grid = await page.$$eval('#lgrid button', (b) => b.map((x) => [x.textContent, x.disabled && x.classList.contains('none'), x.getAttribute('aria-pressed')]));
      const none = grid.filter((g) => g[1]).map((g) => g[0]).join('');
      const on = grid.filter((g) => g[2] === 'true').map((g) => g[0]).join('');
      check('Spanish letters: A to Z with Ñ; U, W, X have no friend; M, P, L, S, T on', grid.length === 27 && grid[14][0] === 'Ñ' && none === 'UWX' && on === 'LMPST', [none, on]);
      const row = await page.evaluate(() => ({ hidden: document.querySelector('#lang-row').hidden, b: [...document.querySelectorAll('#langs [data-lang]')].map((x) => x.textContent + ':' + x.getAttribute('aria-pressed')) }));
      check('Spanish parent corner: a language row with both, Español chosen', !row.hidden && row.b.join() === 'English:false,Español:true', row);
      check('Spanish parent corner fits the width', await page.evaluate(() => { const c = document.querySelector('#parent .card'); return c.scrollWidth <= c.clientWidth + 1; }));
      check('Spanish: no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // The new Spanish friends: a round with only D, Ñ and Q (Dani el Delfín, Ñico el Ñandú, Quique el Quetzal)
    {
      const dnq = JSON.parse(JSON.stringify(enSave));
      dnq.device.lang = 'es';
      dnq.players[0].langs = { es: { animal: 'Ñ', rounds: { 1: 0, 2: 0, 3: 0, 4: 0 }, stickers: [], weak: {}, seen: {}, letters: ['D', 'Ñ', 'Q'], setRounds: 0, last: 1 } };
      const { ctx, page, errors } = await newPage(browser, 412, 915, { 'animal-mail-route-v2': dnq });
      const NAMES = { D: 'Dani el Delfín', 'Ñ': 'Ñico el Ñandú', Q: 'Quique el Quetzal' };
      await page.tap('.playbtn');
      await page.waitForTimeout(300);
      check('new Spanish friends: Ñico the rhea is the player\'s animal on the map', (await page.$eval('#route .here svg', (e) => e.innerHTML.length)) > 50);
      await page.tap('.node[data-level="1"]');
      await page.waitForTimeout(1700);
      const houses = await page.$$eval('.house', (h) => h.map((x) => [x.getAttribute('data-id'), x.textContent.trim(), x.querySelector('svg') ? x.querySelector('svg').innerHTML.length : 0]));
      const banners = [];
      for (let i = 0; i < 5; i++) {
        const id = await wanted(page);
        await page.tap('#mail');
        await page.tap(`.house[data-id="${id}"]`, { force: true });
        await page.waitForTimeout(400);
        banners.push([id, await page.$eval('#banner', (e) => e.textContent)]);
        await page.waitForTimeout(2300);
      }
      check('new Spanish friends: houses are only D, Ñ and Q, each with a picture', houses.length >= 2 && houses.every(([id, , a]) => 'DÑQ'.includes(id) && a > 50), houses);
      check('new Spanish friends: every delivery cheers with the friend\'s name', banners.every(([id, b]) => b === '¡' + id + ' de ' + NAMES[id] + '!'), banners);
      check('new Spanish friends: the round finishes', !(await page.$eval('#win', (e) => e.hidden)));
      check('new Spanish friends: no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // Progress is per language: Spanish starts fresh, keeps the name, and English progress is untouched
    {
      const both = JSON.parse(JSON.stringify(enSave));
      both.players[0].langs = { es: { animal: 'L', rounds: { 1: 1, 2: 0, 3: 0, 4: 0 }, stickers: [{ c: 'M' }], weak: {}, seen: {}, letters: ['M', 'P'], setRounds: 1, last: 1 } };
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915, { 'animal-mail-route-v2': enSave }, { path: '?lang=es' });
      await page.tap('#s-title [data-go="book"]');
      await page.waitForTimeout(300);
      const es0 = await page.$eval('#book-count', (e) => e.textContent);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')));
      const p0 = saved.players[0], e0 = enSave.players[0];
      check('per language: Spanish starts with no stickers; the save keeps English at the top, as before', es0 === '0 estampas' && saved.device.lang === 'es' &&
        ['animal', 'rounds', 'stickers', 'weak', 'letters', 'setRounds', 'last'].every((k) => JSON.stringify(p0[k]) === JSON.stringify(e0[k])) && p0.langs && p0.langs.es && p0.langs.es.animal === 'M', saved);
      await page.tap('#s-book [data-go="map"]');
      await page.waitForTimeout(300);
      await page.tap('#s-map [data-go="title"]');
      await page.waitForTimeout(300);
      await holdGear(page, touch);
      check('per language: the name carries over', (await page.$eval('#players input', (e) => e.value)) === 'Ana');
      // switching from the parent corner reloads in English, without ?lang=es, with English progress
      await Promise.all([page.waitForNavigation(), page.tap('#langs [data-lang="en"]')]);
      await page.waitForTimeout(500);
      const en = await page.evaluate(() => ({ lang: document.documentElement.lang, url: location.search, saved: JSON.parse(localStorage.getItem('animal-mail-route-v2')) }));
      await page.tap('#s-title [data-go="book"]');
      await page.waitForTimeout(300);
      check('per language: switching to English reloads with English progress', en.lang === 'en' && en.url === '' && en.saved.device.lang === 'en' && (await page.$eval('#book-count', (e) => e.textContent)) === '3 stickers', en);
      await ctx.close();
      // a save with Spanish progress shows it in Spanish, and the title button switches to English
      const b = await newPage(browser, 412, 915, { 'animal-mail-route-v2': both }, { path: '?lang=es' });
      await b.page.tap('#s-title [data-go="book"]');
      await b.page.waitForTimeout(300);
      check('per language: Spanish progress shows in Spanish', (await b.page.$eval('#book-count', (e) => e.textContent)) === '1 estampa');
      await b.page.tap('#s-book [data-go="map"]');
      await b.page.waitForTimeout(300);
      check('per language: Spanish avatar and progress lines', (await b.page.$eval('#route .here svg', (e) => e.innerHTML.length)) > 50 && (await b.page.$eval('.node[data-level="1"]', (e) => e.getAttribute('aria-label'))) === 'Ruta 1, Letras, sigue esta');
      await b.page.tap('#s-map [data-go="title"]');
      await b.page.waitForTimeout(300);
      await Promise.all([b.page.waitForNavigation(), b.page.tap('#lang-btn')]);
      await b.page.waitForTimeout(500);
      const after = await b.page.evaluate(() => ({ lang: document.documentElement.lang, btn: document.querySelector('#lang-btn').textContent, saved: JSON.parse(localStorage.getItem('animal-mail-route-v2')) }));
      check('per language: the title button switches to English (now offering Español) and both languages\' progress stays', after.lang === 'en' && after.btn === 'Español' && JSON.stringify(after.saved.players[0].langs.es) === JSON.stringify(both.players[0].langs.es) && after.saved.players[0].stickers.length === 3, after);
      check('per language: no errors', errors.length === 0 && b.errors.length === 0, errors.concat(b.errors));
      await b.ctx.close();
    }
  }

  // ---------- Voice sets (1.6) ----------
  // audio/<language>/<female|male>/, each with its own clips.json. Recordings are served here by routes
  // (a short silent WAV for every clip), so the test doesn't depend on files in the repo.
  {
    const vm = require('vm');
    const sandbox = { window: {} };
    vm.runInNewContext(await (await fetch(BASE + 'words.js')).text(), sandbox);
    const AMR = sandbox.window.AMR;
    const keys = { en: Object.keys(AMR.clipsFor('en')), es: Object.keys(AMR.clipsFor('es')) };
    const wav = (() => {   // 0.1 s of silence, 8 kHz mono 16-bit
      const n = 800, b = Buffer.alloc(44 + n * 2);
      b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
      b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
      return b;
    })();
    // sets: {'en/female': [keys]} ; any set not named keeps the repo's own (empty) list
    const serve = (sets) => async (ctx) => {
      for (const [dir, list] of Object.entries(sets)) {
        await ctx.route(`**/audio/${dir}/clips.json`, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(list) }));
        await ctx.route(`**/audio/${dir}/*.mp3`, (r) => r.fulfill({ contentType: 'audio/wav', body: wav }));
      }
    };
    const said = (page) => page.evaluate(() => window.__said.length);
    const listen = (page) => page.evaluate(() => { window.__said = []; speechSynthesis.speak = (u) => window.__said.push(u.text); });
    const hear = async (page) => { await listen(page); await page.tap('#cast .pal', { force: true }); await page.waitForTimeout(300); return said(page); };
    const vsets = (page) => page.$$eval('#vsets [data-vset]', (b) => b.map((x) => x.textContent + ':' + x.getAttribute('aria-pressed')).join());
    check('voice sets: words.js gives the game\'s lines (156 English, 133 Spanish)', keys.en.length === 156 && keys.es.length === 133, [keys.en.length, keys.es.length]);
    // the repo's sets are empty: no "Recorded voice" row, the built-in voice speaks, only the two English lists are asked for
    {
      const reqs = [];
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915, null, { noSW: true, setup: (c) => c.on('request', (r) => reqs.push(new URL(r.url()).pathname)) });
      const asked = reqs.filter((u) => /audio\//.test(u)).map((u) => u.replace(/^.*?audio\//, 'audio/')).sort();
      check('voice sets: the game asks only for the English female and male lists', asked.join() === 'audio/en/female/clips.json,audio/en/male/clips.json', asked);
      check('voice sets: with no recordings, the built-in voice speaks', (await hear(page)) === 1);
      await holdGear(page, touch);
      check('voice sets: no "Recorded voice" row until a set has recordings', await page.$eval('#vset-row', (e) => e.hidden) && (await page.$eval('#clipcount', (e) => e.textContent)) === '0 of 156');
      check('voice sets: no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // English: every line in the female set, two in the male set
    {
      const { ctx, page, touch, errors } = await newPage(browser, 412, 915, null, { noSW: true, setup: serve({ 'en/female': keys.en, 'en/male': ['letter-S', 'sound-S'] }) });
      await page.waitForTimeout(800);
      check('voice sets: a fully recorded line plays the recording, not the built-in voice', (await hear(page)) === 0);
      await holdGear(page, touch);
      check('voice sets: the row shows the sets with recordings and the device voice; the fuller set is used', (await vsets(page)) === 'Female:true,Male:false,Device voice:false' && !(await page.$eval('#vset-row', (e) => e.hidden)), await vsets(page));
      check('voice sets: every clip of the female set loads', (await page.$eval('#clipcount', (e) => e.textContent)) === '156 of 156', await page.$eval('#clipcount', (e) => e.textContent));
      await page.tap('#vsets [data-vset="male"]');
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => ({ count: document.querySelector('#clipcount').textContent, saved: JSON.parse(localStorage.getItem('animal-mail-route-v2')).device.voices }));
      check('voice sets: choosing Male uses its 2 clips and saves the choice for English', (await vsets(page)) === 'Female:false,Male:true,Device voice:false' && m.count === '2 of 156' && m.saved.en === 'male', m);
      await page.tap('#p-close');
      check('voice sets: a line the male set lacks falls back to the built-in voice', (await hear(page)) === 1);
      await holdGear(page, touch);
      await page.tap('#vsets [data-vset="device"]');
      await page.waitForTimeout(300);
      check('voice sets: Device voice turns the recordings off', (await page.$eval('#clipcount', (e) => e.textContent)) === '0 of 156' && (await vsets(page)) === 'Female:false,Male:false,Device voice:true');
      await page.reload();
      await page.waitForTimeout(800);
      check('voice sets: Device voice is kept after a reload, and the built-in voice speaks', (await hear(page)) === 1);
      await holdGear(page, touch);
      check('voice sets: the choice shows after a reload', (await vsets(page)) === 'Female:false,Male:false,Device voice:true');
      check('voice sets: the row fits the parent corner', await page.evaluate(() => { const c = document.querySelector('#parent .card'); return c.scrollWidth <= c.clientWidth + 1; }) && await allOnScreen(page, '#vsets [data-vset]'));
      check('voice sets: no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
    // Spanish: its own sets and its own choice (an English choice doesn't carry over)
    {
      const save = { v: 2, device: { lang: 'es', voice: true, sfx: true, share: false, unlockAll: false, lettersSame: false, voices: { en: 'device' } }, current: 1,
        players: [{ id: 1, name: '', animal: 'S', rounds: { 1: 0, 2: 0, 3: 0, 4: 0 }, stickers: [], weak: {}, seen: {}, letters: ['S', 'B', 'K', 'C', 'P'], setRounds: 0, last: 1 }] };
      const { ctx, page, touch, errors } = await newPage(browser, 740, 360, { 'animal-mail-route-v2': save }, { noSW: true, setup: serve({ 'es/male': keys.es, 'en/female': keys.en }) });
      await page.waitForTimeout(800);
      check('voice sets (es): the Spanish male set is used, with every line', (await hear(page)) === 0);
      await holdGear(page, touch);
      check('voice sets (es): Hombre and Voz del dispositivo, Hombre chosen, 133 of 133', (await vsets(page)) === 'Hombre:true,Voz del dispositivo:false' && (await page.$eval('#clipcount', (e) => e.textContent)) === '133 de 133', await vsets(page));
      await page.tap('#vsets [data-vset="device"]');
      const v = await page.evaluate(() => JSON.parse(localStorage.getItem('animal-mail-route-v2')).device.voices);
      check('voice sets (es): each language keeps its own choice', v.es === 'device' && v.en === 'device', v);
      check('voice sets (es): no errors', errors.length === 0, errors.length ? errors : undefined);
      await ctx.close();
    }
  }

  // ---------- Help improve the game (1.5) ----------
  // Parent corner only: three links, each a prefilled email the parent sends themselves, with the game
  // version, language and screen size, and nothing about the child.
  {
    const kid = { v: 2, device: { voice: true, sfx: true, share: false, unlockAll: false, lettersSame: false }, current: 1,
      players: [{ id: 1, name: 'Mia', animal: 'K', rounds: { 1: 3, 2: 1, 3: 0, 4: 0 }, stickers: [{ c: 'S' }, { c: 'B' }, { c: 'K' }, { c: 'C' }], weak: { S: 3, B: 2 }, seen: {}, letters: ['S', 'B', 'K', 'C', 'P'], setRounds: 3, last: 1 }] };
    const mails = (page) => page.$$eval('#fb-block [data-fb]', (as) => as.map((a) => {
      const u = new URL(a.getAttribute('href'));
      return { kind: a.getAttribute('data-fb'), label: a.textContent, to: u.protocol + u.pathname, subject: u.searchParams.get('subject'), body: u.searchParams.get('body') };
    }));
    // nothing the child or the save could give away: name, animal, friends, progress, practice letters
    const childFree = (b) => !/Mia|Kelly|Sammy|Billy|kangaroo|Route|Ruta|sticker|estampa|practice|práctica|Letters:|Letras:|\bS, B\b/i.test(b);
    for (const [lang, path, w, h] of [['en', '', 412, 915], ['es', '?lang=es', 740, 360]]) {
      const save = JSON.parse(JSON.stringify(kid));
      if (lang === 'es') { save.device.lang = 'es'; save.players[0].langs = { es: { animal: 'L', rounds: { 1: 2, 2: 0, 3: 0, 4: 0 }, stickers: [{ c: 'M' }], weak: { M: 3 }, seen: {}, letters: ['M', 'P', 'L'], setRounds: 2, last: 1 } }; }
      const { ctx, page, touch, errors, hosts } = await newPage(browser, w, h, { 'animal-mail-route-v2': save }, { path });
      const outside = await page.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"], [data-fb]')].filter((a) => !a.closest('#parent')).length);
      check(`feedback (${lang}): only in the parent corner`, outside === 0 && await page.$eval('#fb-block', (e) => !!e.closest('#parent')));
      await holdGear(page, touch);
      const m = await mails(page);
      const head = await page.$eval('#fb-block b', (e) => e.textContent);
      const want = lang === 'en'
        ? { head: 'Help improve the game', labels: ['A wrong word or translation', 'Report a problem', 'Suggest an idea'], subj: /^Animal Mail Route: (a wrong word|a problem|an idea)$/, info: ['Game version: 1.6', 'Language: en (English)', `Screen: ${w} x ${h}`] }
        : { head: 'Ayuda a mejorar el juego', labels: ['Una palabra o traducción equivocada', 'Reportar un problema', 'Sugerir una idea'], subj: /^El Correo de los Animales: (una palabra equivocada|un problema|una idea)$/, info: ['Versión del juego: 1.6', 'Idioma: es (Español)', `Pantalla: ${w} x ${h}`] };
      check(`feedback (${lang}): three choices, a wrong word, a problem, an idea, in the page's language`, head === want.head && m.map((x) => x.kind).join() === 'word,problem,idea' && m.map((x) => x.label).join() === want.labels.join(), m.map((x) => x.label));
      check(`feedback (${lang}): each opens a prefilled email to the contact address`, m.every((x) => x.to === 'mailto:clements.cody.j@gmail.com' && want.subj.test(x.subject) && x.body.length > 40), m);
      check(`feedback (${lang}): the email has the game version, language and screen size`, m.every((x) => want.info.every((i) => x.body.includes(i))), m.map((x) => x.body));
      check(`feedback (${lang}): the email has nothing about the child`, m.every((x) => childFree(x.body)), m.map((x) => x.body));
      check(`feedback (${lang}): the parent corner fits the width`, await page.evaluate(() => { const c = document.querySelector('#parent .card'); return c.scrollWidth <= c.clientWidth + 1; }));
      check(`feedback (${lang}): the links are on screen when scrolled to`, await page.evaluate(() => { document.querySelector('#fb-idea').scrollIntoView({ block: 'center' }); return true; }) && await allOnScreen(page, '#fb-block [data-fb]'));
      // turning the screen: the size in the email follows it when a link is pressed (the email app itself is not opened here)
      await page.setViewportSize({ width: h, height: w });
      await page.evaluate(() => { window.addEventListener('click', (e) => e.preventDefault()); document.querySelector('#fb-problem').click(); });
      const turned = (await mails(page)).find((x) => x.kind === 'problem');
      check(`feedback (${lang}): pressing a link uses the current screen size`, turned.body.includes(`${h} x ${w}`), turned.body);
      check(`feedback (${lang}): nothing was sent, no other sites, no errors`, [...hosts].every((x) => x === host) && errors.length === 0, { hosts: [...hosts], errors });
      await ctx.close();
    }
    // the privacy pages describe it
    {
      const { ctx, page } = await newPage(browser, 412, 915);
      const pr = await page.evaluate(() => Promise.all(['privacy.html', 'privacy-es.html'].map((u) => fetch(u).then((r) => r.text()))));
      check('feedback: both privacy pages describe the feedback emails', /Help improve the game/.test(pr[0]) && /never includes anything about a child/.test(pr[0]) && /Ayuda a mejorar el juego/.test(pr[1]) && /Nunca incluye nada sobre un niño/.test(pr[1]) && pr.every((x) => x.includes('mailto:clements.cody.j@gmail.com')));
      await ctx.close();
    }
  }

  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
  process.exit(failed ? 1 : 0);
})();
