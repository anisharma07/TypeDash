/**
 * Test launcher: runs the REAL app.js on an in-memory Racer store and lets you
 * pick which frontend it serves, so the legacy and React builds can be compared
 * against the identical server + socket code.
 *
 *   node e2e/support/start-server.cjs react  2391   # serves client/dist
 *   node e2e/support/start-server.cjs legacy 2392   # serves legacy/public
 *   SEED=7 node e2e/support/start-server.cjs react 2391   # deterministic quotes / ids
 */
const path = require('node:path');
const Module = require('node:module');
require('./fake-mongoose.cjs');

const [, , which = 'react', port = '2391'] = process.argv;
const root = path.resolve(__dirname, '../..');
const dir = which === 'legacy' ? path.join(root, 'legacy', 'public') : path.join(root, 'client', 'dist');

const load = Module._load;
Module._load = function (request, parent, ...rest) {
  const mod = load.call(this, request, parent, ...rest);
  if (request === 'express' && !mod.__patched) {
    const orig = mod.static;
    const patched = function (p, ...a) {
      return orig.call(this, /(^|[\\/])(public|client[\\/]dist)$/.test(String(p)) ? dir : p, ...a);
    };
    Object.assign(patched, orig);
    mod.static = patched;
    mod.__patched = true;
  }
  return mod;
};

// Deterministic randomness (quotes, join ids) when SEED is set, so the legacy and
// React builds can be driven through identical scenarios.
if (process.env.SEED) {
  let a = Number(process.env.SEED) >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

process.env.PORT = port;
process.env.MONGODB_URI ||= 'mongodb://fake';
console.log(`[start-server] serving ${which} from ${dir} on :${port}`);
require(path.join(root, 'app.js'));
