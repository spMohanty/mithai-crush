// Verifies every sfx in js/audio.js produces real signal through the mix bus
// and throws no errors. Runs against the LOCAL server (pre-push code).
import puppeteer from 'puppeteer-core';

const URL = (process.env.TEST_URL || 'http://127.0.0.1:8341/index.html') + '?audiotest=' + Date.now();
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-first-run', '--autoplay-policy=no-user-gesture-required', '--disable-gpu'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

  const results = await page.evaluate(async () => {
    const m = await import('./js/audio.js');
    m.initAudio();
    const { ctx, bus } = m.getAudioGraph();
    if (ctx.state !== 'running') await ctx.resume();
    // wait for sample buffers to decode
    const t0 = performance.now();
    while (m.loadedSamples().length < 15 && performance.now() - t0 < 10000) {
      await new Promise((r) => setTimeout(r, 150));
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    bus.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    async function measure(name, fire, watchMs) {
      fire();
      let peak = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < watchMs) {
        analyser.getFloatTimeDomainData(buf);
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
        await new Promise((r) => setTimeout(r, 30));
      }
      // let the tail decay so the next measurement starts clean
      await new Promise((r) => setTimeout(r, 250));
      return { name, peak: +peak.toFixed(4) };
    }

    const out = [];
    out.push(await measure('select', () => m.sfx.select(), 300));
    out.push(await measure('swapTick', () => m.sfx.swapTick(), 300));
    out.push(await measure('invalid', () => m.sfx.invalid(), 400));
    out.push(await measure('pop(0)', () => m.sfx.pop(0), 400));
    out.push(await measure('pop(6)', () => m.sfx.pop(6), 400));
    out.push(await measure('rocket', () => m.sfx.rocket(), 600));
    out.push(await measure('anaar', () => m.sfx.anaar(), 900));
    out.push(await measure('chakri', () => m.sfx.chakri(), 1100));
    out.push(await measure('dhamaka', () => m.sfx.dhamaka(0), 500));
    out.push(await measure('shuffle', () => m.sfx.shuffle(), 800));
    out.push(await measure('lose', () => m.sfx.lose(), 1300));
    out.push(await measure('win', () => m.sfx.win(), 2200));
    return { ctxState: ctx.state, out, samples: m.loadedSamples().sort() };
  });

  console.log('ctx state:', results.ctxState);
  console.log(`samples loaded (${results.samples.length}):`, results.samples.join(' '));
  let ok = true;
  for (const r of results.out) {
    const pass = r.peak > 0.01;
    if (!pass) ok = false;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(10)} peak=${r.peak}`);
  }
  console.log('page errors:', errors.length ? errors : 'none');
  console.log(ok && errors.length === 0 ? 'ALL SFX PASS' : 'SFX FAILURES');
  process.exitCode = ok && errors.length === 0 ? 0 : 1;
} finally {
  await browser.close();
}
