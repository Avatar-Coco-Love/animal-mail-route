// Exports the SVG icons to the PNG sizes the web app manifest lists.
// Usage, from the repo root: NODE_PATH="$(npm root -g)" node icons/export.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const JOBS = [['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512], ['icon-maskable.svg', 'icon-maskable-512.png', 512]];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [src, out, size] of JOBS) {
    const svg = fs.readFileSync(path.join(__dirname, src), 'utf8');
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: path.join(__dirname, out), omitBackground: true });
    console.log(out);
  }
  await browser.close();
})();
