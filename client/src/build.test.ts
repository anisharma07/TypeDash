// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';

/**
 * The legacy stylesheets are reused byte-for-byte, so the production build must not change what they mean.
 * Regression guard for a real bug: Vite's default CSS minifier (lightningcss) dropped the standard
 * `backdrop-filter` whenever the source listed it before `-webkit-backdrop-filter` (no glass blur in
 * Chromium/Firefox, and the key-hint images that use the blurred panels as containing block jumped to the
 * page corner) and rewrote the invalid `gap: 1` into a real `gap: 1px`.
 */
describe('production CSS build', () => {
  const root = resolve(import.meta.dirname, '..');
  let outDir = '';
  let built = '';
  let source = '';

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), 'typedash-css-'));
    await build({ root, logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    const assets = join(outDir, 'assets');
    built = readdirSync(assets)
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(assets, name), 'utf8'))
      .join('\n');
    source = readdirSync(join(root, 'src/styles'))
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(root, 'src/styles', name), 'utf8'))
      .join('\n');
  }, 60_000);

  afterAll(() => rmSync(outDir, { recursive: true, force: true }));

  const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

  it('keeps every standard backdrop-filter declaration next to its -webkit- twin', () => {
    const standard = /(?<![-\w])backdrop-filter\s*:/g;
    const prefixed = /-webkit-backdrop-filter\s*:/g;
    expect(count(source, standard)).toBeGreaterThan(0);
    expect(count(built, standard)).toBe(count(source, standard));
    expect(count(built, prefixed)).toBe(count(source, prefixed));
  });

  it('does not turn the legacy invalid unitless "gap: 1" into a working gap', () => {
    expect(source).toMatch(/gap:\s*1\s*;/);
    expect(built).toMatch(/gap:\s*1\s*;/);
    expect(built).not.toMatch(/gap:\s*1px/);
  });

  it('keeps the external Google Fonts imports', () => {
    expect(count(built, /@import\s+(url\()?["']?https:\/\/fonts\.googleapis\.com/g)).toBeGreaterThan(0);
  });
});
