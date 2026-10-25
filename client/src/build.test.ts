// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';
import { THEMES } from './theme/theme';

/**
 * The production CSS must ship what the source says: every theme's token block (selected at runtime by
 * data-theme, so nothing in the markup references them and a minifier or purger could drop them), the
 * OKLCH values as written, and the typing area's fixed metrics, which useTypingCaret's scrolling depends on.
 */
describe('production CSS build', () => {
  const root = resolve(import.meta.dirname, '..');
  let outDir = '';
  let built = '';

  beforeAll(async () => {
    outDir = mkdtempSync(join(tmpdir(), 'typedash-css-'));
    await build({ root, logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    const assets = join(outDir, 'assets');
    built = readdirSync(assets)
      .filter((name) => name.endsWith('.css'))
      .map((name) => readFileSync(join(assets, name), 'utf8'))
      .join('\n');
  }, 60_000);

  afterAll(() => rmSync(outDir, { recursive: true, force: true }));

  it('ships a token block for every theme', () => {
    for (const theme of THEMES) {
      expect(built, theme.slug).toMatch(new RegExp(`\\[data-theme=["']?${theme.slug}["']?\\]`));
    }
  });

  it('keeps theme colours as authored', () => {
    expect(built).toContain('--color-paper: oklch(12.5% 0.012 150)'); // terminal
    expect(built).toContain('--color-accent: oklch(81% 0.19 133)'); // dash
  });

  it('keeps the typing metrics the caret relies on', () => {
    expect(built).toMatch(/height:\s*108\.951px/);
    expect(built).toMatch(/line-height:\s*36\.317px/);
  });
});
