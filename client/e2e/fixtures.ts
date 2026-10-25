import { test as base, expect } from '@playwright/test';
import type { Browser, BrowserContext, BrowserContextOptions, Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { DIST, REPO_ROOT, START_SERVER } from './paths';

/** A running TypeDash server (the real app.js on the in-memory database). */
export interface ServerHandle {
  url: string;
  port: number;
  process: ChildProcess;
  /** everything the server printed so far */
  logs(): string;
  alive(): boolean;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

export async function startServer(env: Record<string, string> = {}): Promise<ServerHandle> {
  const port = await freePort();
  const child = spawn(process.execPath, [START_SERVER, 'react', String(port)], {
    cwd: REPO_ROOT,
    env: { ...process.env, DIST, MONGODB_URI: 'mongodb://fake', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout?.on('data', (chunk) => (output += chunk));
  child.stderr?.on('data', (chunk) => (output += chunk));

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not start within 15 s:\n${output}`)), 15_000);
    const onData = () => {
      if (output.includes('Server Started')) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout?.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited with code ${code} before starting:\n${output}`));
    });
  });

  return {
    url: `http://127.0.0.1:${port}`,
    port,
    process: child,
    logs: () => output,
    alive: () => child.exitCode === null && child.signalCode === null,
  };
}

export async function stopServer(server: ServerHandle): Promise<void> {
  if (!server.alive()) return;
  const exited = new Promise((resolve) => server.process.once('exit', resolve));
  server.process.kill('SIGTERM');
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
  if (server.alive()) server.process.kill('SIGKILL');
}

/** Lines the server logged through logError() (app.js), i.e. something went wrong but was caught. */
export function serverErrors(server: ServerHandle): string[] {
  return server
    .logs()
    .split('\n')
    .filter((line) => line.includes('[error]') || /\bTypeError\b|\bReferenceError\b|Uncaught/.test(line));
}

/** Web fonts are the only third-party requests; answer them locally so tests run offline and stay fast. */
const FONT_HOSTS = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|api\.fontshare\.com)\//;

/** Uncaught page errors and console.error calls, per test. */
export type PageProblems = string[];

function watchPage(page: Page, problems: PageProblems, ignore: RegExp[]): void {
  page.on('pageerror', (err) => problems.push(`[${page.url()}] uncaught: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (ignore.some((re) => re.test(text))) return;
    problems.push(`[${page.url()}] console.error: ${text}`);
  });
}

async function prepareContext(
  context: BrowserContext,
  problems: PageProblems,
  ignore: RegExp[],
  realFonts: boolean,
): Promise<void> {
  if (!realFonts) {
    await context.route(FONT_HOSTS, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  }
  context.on('page', (page) => watchPage(page, problems, ignore));
}

export interface PlayerOptions extends BrowserContextOptions {
  /** localStorage entries set before any page script runs, e.g. { 'typedash:theme': 'arcade' } */
  storage?: Record<string, string>;
}

type Fixtures = {
  /** extra environment for the server, e.g. { FAKE_DB_FAIL: '1' } */
  serverEnv: Record<string, string>;
  /** set true in tests that make the server log handled errors on purpose */
  allowServerErrors: boolean;
  /** console.error messages a test expects (e.g. a failed request it provokes) */
  ignoreConsole: RegExp[];
  /** load the real web fonts (layout tests: text width decides whether things fit); needs internet */
  realFonts: boolean;
  server: ServerHandle;
  problems: PageProblems;
  /** a fresh, isolated browser (own cookies and storage), like another person on another device */
  newPlayerPage: (options?: PlayerOptions) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  serverEnv: [{}, { option: true }],
  allowServerErrors: [false, { option: true }],
  ignoreConsole: [[], { option: true }],
  realFonts: [false, { option: true }],

  server: async ({ serverEnv, allowServerErrors }, use, testInfo) => {
    const server = await startServer(serverEnv);
    await use(server);
    // Give in-flight socket handlers a moment to run (and log) before judging the server.
    await new Promise((resolve) => setTimeout(resolve, 150));
    const alive = server.alive();
    const errors = serverErrors(server);
    await stopServer(server);
    await testInfo.attach('server.log', { body: server.logs(), contentType: 'text/plain' });
    expect(alive, `the server crashed during the test:\n${server.logs()}`).toBe(true);
    if (!allowServerErrors) {
      expect(errors, `the server logged errors:\n${server.logs()}`).toEqual([]);
    }
  },

  baseURL: async ({ server }, use) => {
    await use(server.url);
  },

  problems: async ({}, use) => {
    const problems: PageProblems = [];
    await use(problems);
    expect(problems, 'pages logged errors').toEqual([]);
  },

  context: async ({ context, problems, ignoreConsole, realFonts }, use) => {
    await prepareContext(context, problems, ignoreConsole, realFonts);
    await use(context);
  },

  newPlayerPage: async ({ browser, baseURL, problems, ignoreConsole, realFonts, viewport }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (options = {}) => {
      const { storage, ...contextOptions } = options;
      const context = await (browser as Browser).newContext({ baseURL, viewport, ...contextOptions });
      contexts.push(context);
      await prepareContext(context, problems, ignoreConsole, realFonts);
      if (storage) {
        await context.addInitScript((entries) => {
          try {
            for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
          } catch {
            // about:blank has no storage
          }
        }, storage);
      }
      return context.newPage();
    });
    for (const context of contexts) await context.close();
  },
});

export { expect };
