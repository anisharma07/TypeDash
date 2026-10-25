/**
 * Test-only, in-memory stand-in for `mongoose`, preloaded with
 *   node -r ./e2e/support/fake-mongoose.cjs app.js
 * so the REAL server code (app.js, utils/functions.js) runs end-to-end without a
 * MongoDB. Implements only what TypeDash uses: Schema (nested defaults), model(),
 * new Model(data).save(), find(filter, projection).sort(), updateOne/updateMany
 * with {$lt} filters and {$set} dotted paths, JSON serialisation.
 */
const Module = require('module');

const isLeaf = (d) => d && typeof d === 'object' && typeof d.type === 'function';
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const set = (o, p, v) => {
  const ks = p.split('.');
  let c = o;
  ks.slice(0, -1).forEach((k) => (c = c[k] ??= {}));
  c[ks.at(-1)] = v;
};

class Schema {
  constructor(def) {
    this.def = def;
  }
  leafType(path) {
    let d = this.def;
    for (const k of path.split('.')) {
      d = d && (isLeaf(d) ? undefined : d[k]);
    }
    return isLeaf(d) ? d.type : typeof d === 'function' ? d : undefined;
  }
  defaults(d = this.def) {
    const out = {};
    for (const [k, v] of Object.entries(d)) {
      if (isLeaf(v)) {
        if ('default' in v) out[k] = v.default;
      } else if (v && typeof v === 'object') out[k] = this.defaults(v);
    }
    return out;
  }
}

function model(name, schema) {
  const store = [];
  const cast = (path, v) => {
    const t = schema.leafType(path);
    return t === Number ? Number(v) : t === String ? String(v) : v;
  };
  const matches = (doc, filter) =>
    Object.entries(filter || {}).every(([path, cond]) => {
      const actual = get(doc, path);
      if (cond && typeof cond === 'object' && '$lt' in cond) return actual < cast(path, cond.$lt);
      const want = cast(path, cond);
      if (typeof want === 'number' && Number.isNaN(want)) throw new Error(`CastError: ${path}`);
      return actual === want;
    });

  class Doc {
    constructor(data = {}) {
      const base = JSON.parse(JSON.stringify(schema.defaults()));
      Object.assign(this, base, data);
      this._id = `${store.length + 1}-${Math.random().toString(16).slice(2, 10)}`;
    }
    save() {
      store.push(this);
      return Promise.resolve(this);
    }
    toJSON() {
      return { ...this, __v: 0 };
    }
  }
  const query = (docs) => ({
    sort: () => query(docs),
    then: (res, rej) => Promise.resolve(docs).then(res, rej),
  });
  Doc.find = (filter, projection) => {
    let docs;
    try {
      docs = store.filter((d) => matches(d, filter));
    } catch (e) {
      return { sort: () => query([]), then: (_r, rej) => Promise.reject(e).catch(rej) };
    }
    if (typeof projection === 'string') {
      docs = docs.map((d) => Object.fromEntries(projection.split(' ').map((k) => [k, d[k]])));
    }
    return query(docs);
  };
  const update = (many) => async (filter, upd) => {
    let n = 0;
    for (const d of store) {
      if (!matches(d, filter)) continue;
      for (const [p, v] of Object.entries(upd.$set || {})) set(d, p, v);
      n++;
      if (!many) break;
    }
    return { matchedCount: n, modifiedCount: n };
  };
  Doc.updateOne = update(false);
  Doc.updateMany = update(true);
  Doc.__store = store;
  return Doc;
}

const fake = { Schema, model, connect: async () => fake, connection: { on() {} } };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'mongoose') return fake;
  return origLoad.call(this, request, ...rest);
};
console.log('[fake-mongoose] in-memory Racer store active');
