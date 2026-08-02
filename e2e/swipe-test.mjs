// Real-touch E2E against the LIVE deployed Barfi Blast.
// Uses CDP Input.dispatchTouchEvent — Chrome's genuine touch/gesture pipeline
// (touch-action, scroll-vs-consume, pointercancel), i.e. Android-Chrome semantics.
import puppeteer from 'puppeteer-core';

const URL = (process.env.TEST_URL || 'https://spmohanty.com/barfi-blast/') + '?e2e=' + Date.now();
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function touchSwipe(client, x0, y0, x1, y1, steps, stepDelayMs) {
  const tp = (x, y) => [{ x, y, radiusX: 2.5, radiusY: 2.5, force: 1, id: 1 }];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(x0, y0) });
  for (let i = 1; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x, y) });
    if (stepDelayMs) await sleep(stepDelayMs);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function touchTap(client, x, y) {
  await touchSwipe(client, x, y, x, y, 1, 0);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-first-run', '--disable-gpu'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });
  const client = await page.createCDPSession();

  // Title -> KHELO
  await page.waitForSelector('#btn-play');
  const play = await page.$eval('#btn-play', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await touchTap(client, play.x, play.y);
  await sleep(600);

  // Map -> Mumbai (first unlocked node)
  const node = await page.$eval('#yatra .ynode:not(.locked)', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await touchTap(client, node.x, node.y);
  await sleep(800);

  // Tutorial (fresh profile) -> Chalo Shuru
  const tut = await page.$('#btn-tut-go');
  if (tut) {
    const t = await page.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, tut);
    await touchTap(client, t.x, t.y);
    await sleep(500);
  }

  const grab = () => page.evaluate(() => ({
    score: window.__barfi.state.score,
    moves: window.__barfi.state.movesLeft,
    busy: window.__barfi.state.busy,
    scrollY: window.scrollY,
    selected: window.__barfi.state.selected,
  }));

  async function swipeCase(label, steps, stepDelay) {
    await page.waitForFunction(() => !window.__barfi.state.busy, { timeout: 20000 });
    const info = await page.evaluate(() => {
      const mm = window.__barfi;
      const [a, b] = mm.validMoves()[0];
      const [ar, ac] = mm.rc(a); const [br, bc] = mm.rc(b);
      const r = document.querySelector('#board').getBoundingClientRect();
      const cw = r.width / 8;
      return {
        a, b,
        x0: r.x + (ac + 0.5) * cw, y0: r.y + (ar + 0.5) * cw,
        x1: r.x + (bc + 0.5) * cw, y1: r.y + (br + 0.5) * cw,
      };
    });
    const before = await grab();
    await touchSwipe(client, info.x0, info.y0, info.x1, info.y1, steps, stepDelay);
    await sleep(3200);
    await page.waitForFunction(() => !window.__barfi.state.busy, { timeout: 20000 });
    const after = await grab();
    const swapped = after.moves === before.moves - 1;
    console.log(`${label}: ${swapped ? 'SWAPPED' : 'NO SWAP'} | moves ${before.moves}->${after.moves} | score +${after.score - before.score} | scrollY ${before.scrollY}->${after.scrollY}`);
    return swapped;
  }

  const slow = await swipeCase('slow drag (8 moves, 12ms apart)', 8, 12);
  const flick = await swipeCase('fast flick (1 move, no delay)', 1, 0);
  const vertical = await swipeCase('third swipe (3 moves)', 3, 5);

  // Also confirm the page did not scroll when swiping on the board
  const finalState = await grab();
  console.log('final scrollY:', finalState.scrollY);
  console.log('page errors:', errors.length ? errors : 'none');
  console.log(slow && flick && vertical ? 'ALL TOUCH SWIPES PASS' : 'SOME SWIPES FAILED');
  process.exitCode = slow && flick && vertical ? 0 : 1;
} finally {
  await browser.close();
}
