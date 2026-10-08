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

async function newPage(browser, w, h, init) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
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
  await page.goto(BASE, { timeout: 60000 });
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
// map path: which of the 3 segments are lit, and whether each runs from one disc's centre to the next
const segState = (page) => page.$$eval('#route .seg', (gs) => gs.map((g) => g.classList.contains('lit') ? 1 : 0).join(''));
const segsJoinDiscs = (page) => page.evaluate(() => {
  const route = document.querySelector('#route'), box = route.getBoundingClientRect();
  const c = [...route.querySelectorAll('.disc')].map((d) => { const r = d.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; });
  const lines = [...route.querySelectorAll('.seg .dash')];
  const near = (a, b) => Math.abs(a - b) <= 2;
  return lines.length === 3 && lines.every((l, i) => near(+l.getAttribute('x1'), c[i][0]) && near(+l.getAttribute('y1'), c[i][1]) && near(+l.getAttribute('x2'), c[i + 1][0]) && near(+l.getAttribute('y2'), c[i + 1][1]));
});
const progressText = (page) => page.$$eval('#progress li', (li) => li.map((e) => e.textContent));
const wanted = (page) => page.evaluate(() => document.querySelector('#caption').textContent.slice(-2, -1));

(async () => {
  const browser = await chromium.launch();
  const host = new URL(BASE).host;

  for (const [name, [w, h]] of Object.entries(SIZES)) {
    const { ctx, page, touch, errors, hosts } = await newPage(browser, w, h);
    check(`${name}: title buttons on screen`, await allOnScreen(page, '.playbtn, .title .rbtn'));
    if (name === 'pixel') check('crane is Cody the Crane', !!(await page.$('.pal[aria-label="Hear Cody the Crane"]')) && !/Charlie/.test(await page.content()));
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    if (name === 'pixel') check('one player: Play goes straight to the map, no picker or avatar', await page.$eval('#s-who', (e) => e.hidden) && await page.$eval('#m-who', (e) => e.hidden));
    check(`${name}: all 4 routes on screen`, await allOnScreen(page, '.node'));
    check(`${name}: map path joins the 4 routes, on screen, all grey at the start`, (await segState(page)) === '000' && await segsJoinDiscs(page) && await allOnScreen(page, '#route .seg'));
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
    check('map path: 2 rounds of route 1 light the path to route 2', (await segState(page)) === '100', await segState(page));
    check('map path: the segment that just lit animates once', await page.$$eval('#route .seg.new', (g) => g.map((x) => x.getAttribute('data-seg')).join()) === '1');
    await ctx.close();
  }

  // parent corner: press and hold opens it; on a sideways phone a swipe reaches Done
  {
    const { ctx, page, touch } = await newPage(browser, 740, 360);
    await holdGear(page, touch);
    check('parent corner opens with press and hold', await page.$eval('#parent', (e) => !e.hidden));
    check('play counts setting hidden while COUNT_URL is empty', await page.evaluate(() => document.querySelector('#share-row').hidden || /COUNT_URL = '[^']+'/.test(document.documentElement.innerHTML)));
    // the card is long, so a parent may swipe a few times
    for (let n = 0; n < 4 && !(await allOnScreen(page, '#p-close')); n++) {
      await touch('touchStart', 370, 320);
      for (let y = 320; y >= 60; y -= 10) { await touch('touchMove', 370, y); await page.waitForTimeout(16); }
      await touch('touchEnd');
      await page.waitForTimeout(500);
    }
    check('parent corner Done reachable by swiping', await allOnScreen(page, '#p-close'));
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
    const want = ['Route 1, Letters: 3 rounds', 'Route 2, Animals: 1 round, so 1 more opens Route 3', 'Route 3, Letters and animals: locked', 'Route 4, Numbers: locked', 'Stickers: 4'];
    let got = await progressText(page);
    check('progress row matches the unlock rule', JSON.stringify(got) === JSON.stringify(want), got);
    await page.tap('#t-unlock');
    got = await progressText(page);
    check('progress row with Unlock all on', got[2] === 'Route 3, Letters and animals: open (Unlock all is on)' && got[1] === 'Route 2, Animals: 1 round', got);
    await page.tap('#p-close');
    await page.tap('.playbtn');
    await page.waitForTimeout(300);
    check('map path: Unlock all lights every segment', (await segState(page)) === '111', await segState(page));
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
    check('map path: lit up to the last open route, grey after', (await segState(page)) === '100' && !(await page.$('#route .seg.new')), await segState(page));
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
    check("print summary: shows the selected player's lines", sum.who === 'Player: Mia (Kelly the Kangaroo)' && JSON.stringify(sum.lines) === JSON.stringify(lines) && sum.lines[0] === 'Route 1, Letters: 3 rounds' && sum.lines[2] === 'Route 3, Letters and animals: 1 round, so 1 more opens Route 4' && sum.lines[4] === 'Stickers: 6', sum);
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

  // installable and offline: manifest, service worker, then play a delivery with the network off
  {
    const { ctx, page, touch, errors } = await newPage(browser, 412, 915);
    const man = await page.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); return r.json(); });
    check('manifest: standalone with 192 and 512 px icons and a maskable one', man.display === 'standalone' && ['192x192', '512x512'].every((s) => man.icons.some((i) => i.sizes === s)) && man.icons.some((i) => i.purpose === 'maskable'));
    const icons = await page.evaluate(async (list) => Promise.all(list.map(async (s) => (await fetch(s)).ok)), man.icons.map((i) => i.src));
    check('manifest: every icon loads', icons.every(Boolean), icons);
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
    const priv = await page.evaluate(() => fetch('privacy.html').then((r) => r.ok, () => false));
    check('offline: privacy page available', priv);
    check('offline: no script or console errors', errors.length === 0, errors.length ? errors : undefined);
    await ctx.close();
  }

  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
  process.exit(failed ? 1 : 0);
})();
