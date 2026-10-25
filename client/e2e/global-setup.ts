import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DIST, REPO_ROOT, CLIENT_ROOT } from './paths';

/**
 * Builds the client into its own folder (never client/dist), so the tests always run against the current
 * source. Set E2E_SKIP_BUILD=1 to reuse the last build while iterating on tests.
 */
export default function globalSetup(): void {
  // The server needs its own packages (express, socket.io, dotenv) from the repo root.
  const require = createRequire(`${REPO_ROOT}/app.js`);
  for (const pkg of ['express', 'socket.io', 'dotenv']) {
    try {
      require.resolve(pkg);
    } catch {
      throw new Error(
        `The server package "${pkg}" is not installed. Run \`npm install\` in the repo root first ` +
          '(if node_modules is owned by root after a Docker run: `sudo rm -rf node_modules client/dist`).',
      );
    }
  }

  if (process.env.E2E_SKIP_BUILD === '1' && existsSync(`${DIST}/index.html`)) return;
  execFileSync('npx', ['vite', 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: CLIENT_ROOT,
    stdio: 'inherit',
  });
}
