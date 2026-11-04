/* TypeDash Academy — tiny hash router (works from file:// too). */
(function (TD) {
  'use strict';
  const routes = [];
  let current = null;
  let beforeEach = null;

  function compile(pattern) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/\/:([\w]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    return { re, keys };
  }

  function parse() {
    const raw = (location.hash || '#/').slice(1) || '/';
    const [path, qs] = raw.split('?');
    const query = {};
    (qs || '').split('&').filter(Boolean).forEach((p) => { const [k, v] = p.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { path: path || '/', query };
  }

  function resolve() {
    const { path, query } = parse();
    for (const r of routes) {
      const m = path.match(r.re);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      if (beforeEach) {
        const redirect = beforeEach(path, params);
        if (redirect && redirect !== path) { go(redirect, true); return; }
      }
      if (current && current.destroy) { try { current.destroy(); } catch (e) { console.error(e); } }
      current = null;
      const view = r.handler(params, query) || {};
      current = view;
      TD.util.bus.emit('route', { path, params, query, name: r.name });
      return;
    }
    go('/', true);
  }

  function go(path, replace) {
    const hash = '#' + path;
    if (location.hash === hash) { resolve(); return; }
    if (replace) { history.replaceState(null, '', hash); resolve(); } else location.hash = hash;
  }

  TD.router = {
    add(name, pattern, handler) { routes.push(Object.assign(compile(pattern), { name, handler })); return this; },
    guard(fn) { beforeEach = fn; },
    start() { window.addEventListener('hashchange', resolve); resolve(); },
    go,
    reload: resolve,
    path: () => parse().path,
  };
})(window.TD = window.TD || {});
