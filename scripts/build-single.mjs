// Builds dist/mithai-crush.html — the whole game as one self-contained page
// (inline CSS, inline JS, fonts as data URIs). Suitable for Claude Artifacts,
// which wrap the file in their own <!doctype>/<head>/<body> skeleton and block
// all external requests. Usage:
//   node scripts/build-single.mjs [fontsDir]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = process.argv[2] || root;

const read = (p) => readFileSync(join(root, p), 'utf8');

// ---- fonts -> @font-face data URIs (skipped gracefully if files absent) ----
function face(family, file, weight, range) {
  const path = join(fontsDir, file);
  if (!existsSync(path)) return '';
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range};}\n`;
}
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD';
const DEVA = 'U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF';
const fontCss =
  face('Modak', 'modak-latin.woff2', '400', LATIN) +
  face('Modak', 'modak-deva.woff2', '400', DEVA) +
  face('Baloo 2', 'baloo2-latin.woff2', '400 800', LATIN) +
  face('Baloo 2', 'baloo2-deva.woff2', '400 800', DEVA);

// ---- JS modules -> one shared-scope script ----
const stripModule = (src) => src
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'[^']*';\s*$/gm, '')
  .replace(/^import\s+[^;]*from\s*'[^']*';\s*$/gm, '')
  .replace(/^export\s+(const|function|let|class)\b/gm, '$1');

const js = ['js/board.js', 'js/levels.js', 'js/sweets.js', 'js/audio.js', 'js/main.js']
  .map((p) => `// ===== ${p} =====\n` + stripModule(read(p)))
  .join('\n');

if (/^\s*(import|export)\b/m.test(js)) {
  throw new Error('unstripped import/export remains in bundled JS');
}

// ---- body markup from index.html (drop the module script tag) ----
const html = read('index.html');
const body = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/\s*<script type="module" src="js\/main\.js"><\/script>/, '');

const css = read('css/style.css');

// Artifact pages provide their own doctype/head/body — emit content only.
const out = `<meta charset="UTF-8">
<title>Mithai Crush — Ek Dum Desi Match-3</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
${fontCss}${css}
</style>
${body}
<script type="module">
${js}
</script>
`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/mithai-crush.html'), out);
console.log(`dist/mithai-crush.html written: ${(out.length / 1024).toFixed(0)} KB` +
  (fontCss ? ' (fonts inlined)' : ' (NO fonts — system fallbacks)'));
