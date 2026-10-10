// Makes the link preview image (icons/share.png, 1200x630) from the game's own title screen,
// with the first five friends and no corner buttons. Serve the repo first, then from the repo root:
//   NODE_PATH="$(npm root -g)" node icons/share.cjs [url] [lang]      default url: http://localhost:8080/
// With a language other than English (e.g. es), it makes icons/share-<lang>.png from that language's title screen.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const lang = process.argv[3] || 'en';
  await page.goto((process.argv[2] || 'http://localhost:8080/') + (lang === 'en' ? '' : '?lang=' + lang));
  await page.evaluate(async () => {
    await document.fonts.ready;
    // the game's script is private, so borrow the first five friends' art from the parent corner's animal choices
    document.querySelector('#gear').click();   // a keyboard-style click opens the corner at once
    const five = [...document.querySelectorAll('#players [data-ani]')].slice(0, 5).map((b) => b.querySelector('svg').outerHTML);
    document.querySelector('#parent').hidden = true;
    document.querySelector('#cast').innerHTML = five.map((svg) => '<span class="pal">' + svg + '</span>').join('');
    document.querySelectorAll('#s-title .corner, #s-title .corner-l, #lang-btn').forEach((e) => e.remove());
    const s = document.createElement('style');
    s.textContent = '*{animation:none!important}.cast .pal{width:150px}.title h1{font-size:5.4rem}.playbtn{font-size:2.6rem}';
    document.head.appendChild(s);
  });
  await page.waitForTimeout(300);
  const file = lang === 'en' ? 'share.png' : 'share-' + lang + '.png';
  await page.screenshot({ path: path.join(__dirname, file) });
  console.log(file);
  await browser.close();
})();
