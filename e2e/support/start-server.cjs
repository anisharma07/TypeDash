/**
 * Test launcher: runs the REAL app.js on an in-memory Racer store and lets you
 * pick which frontend it serves, so the legacy and React builds can be compared
 * against the identical server + socket code.
 *
 *   node e2e/support/start-server.cjs react  2391   # serves client/dist
 *   node e2e/support/start-server.cjs legacy 2392   # serves legacy/public
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

process.env.PORT = port;
process.env.MONGODB_URI ||= 'mongodb://fake';
console.log(`[start-server] serving ${which} from ${dir} on :${port}`);
require(path.join(root, 'app.js'));
