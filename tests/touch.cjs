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

async function newPage(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const errors = [];
  const hosts = new Set();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.addInitScript(() => { try { speechSynthesis.speak = () => {}; } catch (e) {} });
  await page.goto(BASE, { timeout: 60000 });
  await page.waitForTimeout(600);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  return { ctx, page, touch, errors, hosts };
}
const center = (page, sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
const allOnScreen = (page, sel) => page.$$eval(sel, (els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
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
    check(`${name}: all 4 routes on screen`, await allOnScreen(page, '.node'));
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
    await ctx.close();
  }

  // parent corner: press and hold opens it; on a sideways phone a swipe reaches Done
  {
    const { ctx, page, touch } = await newPage(browser, 740, 360);
    const g = await center(page, '#gear');
    await touch('touchStart', ...g);
    await page.waitForTimeout(1400);
    await touch('touchEnd');
    check('parent corner opens with press and hold', await page.$eval('#parent', (e) => !e.hidden));
    check('play counts setting hidden while COUNT_URL is empty', await page.evaluate(() => document.querySelector('#share-row').hidden || /COUNT_URL = '[^']+'/.test(document.documentElement.innerHTML)));
    await touch('touchStart', 370, 320);
    for (let y = 320; y >= 60; y -= 10) { await touch('touchMove', 370, y); await page.waitForTimeout(16); }
    await touch('touchEnd');
    await page.waitForTimeout(500);
    check('parent corner Done reachable by swiping', await allOnScreen(page, '#p-close'));
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
