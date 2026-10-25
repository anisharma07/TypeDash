import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const CLIENT_ROOT = resolve(here, '..');
export const REPO_ROOT = resolve(CLIENT_ROOT, '..');
/** The client build the tests serve (gitignored). */
export const DIST = join(CLIENT_ROOT, '.e2e-dist');
export const START_SERVER = join(REPO_ROOT, 'e2e', 'support', 'start-server.cjs');
