// Generates src/theme/themes.css and src/theme/themeList.ts from a checkout of Hallmark
// (https://github.com/Nutlope/hallmark, MIT). Run from client/:
//
//   git clone --depth 1 https://github.com/Nutlope/hallmark /tmp/hallmark
//   node scripts/gen-themes.mjs /tmp/hallmark
//
// Each theme's token block comes from skills/hallmark/references/themes/<slug>.md; its error and
// success colours from site/themes/<slug>/tokens.css (the shared scale, not part of the doc block).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.argv[2];
if (!repo) {
  console.error('usage: node scripts/gen-themes.mjs <hallmark checkout>');
  process.exit(1);
}
const docs = join(repo, 'skills/hallmark/references/themes');
const outDir = new URL('../src/theme/', import.meta.url);

const themes = readdirSync(docs)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .sort()
  .map((file) => {
    const text = readFileSync(join(docs, file), 'utf8');
    const meta = Object.fromEntries(
      text
        .match(/^---\n([\s\S]*?)\n---\n/)[1]
        .split('\n')
        .filter((line) => line.includes(': '))
        .map((line) => [line.slice(0, line.indexOf(': ')), line.slice(line.indexOf(': ') + 2)]),
    );
    const block = text.match(/## Tokens\s*```css\s*:root \{\n([\s\S]*?)\n\}\s*```/)[1];
    const decls = [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]);
    const has = (name) => decls.some(([k]) => k === name);

    const shared = readFileSync(join(repo, 'site/themes', meta.slug, 'tokens.css'), 'utf8');
    for (const name of ['--color-error', '--color-success']) {
      if (!has(name)) decls.push([name, shared.match(new RegExp(`${name}:\\s*([^;]+);`))[1].trim()]);
    }
    // Optional tokens the UI reads: derived from this theme, so the default theme's values never leak in.
    if (!has('--color-rule-2')) {
      decls.push(['--color-rule-2', 'color-mix(in oklch, var(--color-rule), var(--color-ink) 22%)']);
    }
    if (!has('--font-outlier')) decls.push(['--font-outlier', 'var(--font-body)']);

    const [band, lightness] = meta.paper.split(' ');
    const scheme = band === 'dark' || (band === 'mid' && Number(lightness) < 55) ? 'dark' : 'light';
    const fonts = [...text.matchAll(/href="(https:\/\/(?:fonts\.googleapis\.com|api\.fontshare\.com)[^"]+)"/g)].map(
      (m) => m[1],
    );
    return { slug: meta.slug, name: meta.name, genre: meta.genre, scheme, fonts, decls };
  });

const notice = readFileSync(join(repo, 'LICENSE'), 'utf8')
  .trim()
  .split('\n')
  .map((line) => (line ? ` * ${line}` : ' *'))
  .join('\n');

const css = [
  '/*',
  ' * Theme token blocks generated from Hallmark (https://github.com/Nutlope/hallmark),',
  ' * skills/hallmark/references/themes/*.md, by scripts/gen-themes.mjs. Do not edit by hand.',
  ' *',
  notice,
  ' */',
  '',
  ...themes.flatMap((t) => [
    `[data-theme="${t.slug}"] {`,
    `  color-scheme: ${t.scheme};`,
    ...t.decls.map(([k, v]) => `  ${k}: ${v};`),
    '}',
    '',
  ]),
].join('\n');
writeFileSync(new URL('themes.css', outDir), css);

const list = themes.map(({ slug, name, genre, scheme, fonts }) => ({ slug, name, genre, scheme, fonts }));
const ts = [
  '// Generated from Hallmark (https://github.com/Nutlope/hallmark, MIT) by scripts/gen-themes.mjs. Do not edit by hand.',
  '// The token values are in ./themes.css.',
  "import type { ThemeInfo } from './types';",
  '',
  `export const HALLMARK_THEMES: readonly ThemeInfo[] = ${JSON.stringify(list, null, 2)};`,
  '',
].join('\n');
writeFileSync(new URL('themeList.ts', outDir), ts);

const dark = themes.filter((t) => t.scheme === 'dark').length;
console.log(`${themes.length} themes (${dark} dark, ${themes.length - dark} light): ${themes.map((t) => t.slug).join(', ')}`);
