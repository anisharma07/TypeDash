/* TypeDash Academy — inline SVG icon set (24×24, stroke = currentColor). */
(function (TD) {
  'use strict';
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
    book: '<path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M16 5.5h3v1.5a3 3 0 0 1-3 3"/><path d="M8 5.5H5v1.5a3 3 0 0 0 3 3"/><path d="M12 13v4"/><path d="M8 20h8"/>',
    chart: '<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-6"/><path d="M21 20H3"/>',
    sliders: '<path d="M4 6h9"/><path d="M19 6h1"/><circle cx="16" cy="6" r="2.5"/><path d="M4 12h3"/><path d="M13 12h7"/><circle cx="10" cy="12" r="2.5"/><path d="M4 18h11"/><circle cx="18" cy="18" r="2.5"/>',
    flame: '<path d="M12 3c1.2 3.2 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1-3.7 2.2-4.8.1 2 1 3.1 2.1 3.3-.3-3.1-.6-5.5.7-8.5z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    pause: '<path d="M9 5v14"/><path d="M15 5v14"/>',
    left: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    right: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    retry: '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4 4.5V9h4.5"/>',
    keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/>',
    eyeoff: '<path d="m3 3 18 18"/><path d="M10.6 6.1A9.4 9.4 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-3.1 3.6"/><path d="M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.8 8.8 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    bolt: '<path d="M13 2.5 4.5 14H11l-1 7.5L19.5 10H13z"/>',
    heart: '<path d="M12 20s-7.2-4.4-9-9.2A5 5 0 0 1 12 7.6a5 5 0 0 1 9 3.2C19.2 15.6 12 20 12 20z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    upload: '<path d="M12 20V9"/><path d="m7 14 5-5 5 5"/><path d="M5 4h14"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="m6 7 1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    sparkles: '<path d="m12 3 1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    ghost: '<path d="M5 20v-9a7 7 0 0 1 14 0v9l-2.4-1.8L14.2 20 12 18.2 9.8 20l-2.4-1.8z"/><path d="M9.5 11h.01M14.5 11h.01"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
    printer: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
    skip: '<path d="M5 5v14l10-7z"/><path d="M19 5v14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19.5 8.5l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
    text: '<path d="M4 7V4.5h16V7"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
    hash: '<path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18"/>',
    clipboard: '<rect x="5.5" y="4.5" width="13" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M9 11h6M9 15h4"/>',
    cap: '<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v4.8c3.3 2.3 8.7 2.3 12 0v-4.8"/><path d="M22 9.5V15"/>',
    map: '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    rocket: '<path d="M12 15.5c-1.6-1-2.9-2.3-3.9-3.9C9.6 7.4 13 4 19.5 4.5c.5 6.5-2.9 9.9-7.5 11z"/><path d="M8.5 12.5 5 12l2.5-3.5 3.3.2M11.5 15.5l.5 3.5 3.5-2.5-.2-3.3"/><path d="M5.5 16.5c-1 1-1.5 3-1.5 3.5.5 0 2.5-.5 3.5-1.5"/><circle cx="15" cy="9" r="1.3"/>',
    hand: '<path d="M7 11.5V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 10.5V5a1.5 1.5 0 0 1 3 0v5.5"/><path d="M13 10.5V6a1.5 1.5 0 0 1 3 0v6"/><path d="M16 12V9a1.5 1.5 0 0 1 3 0v4.5a7.5 7.5 0 0 1-7.5 7.5c-2.6 0-4.2-1.2-5.6-3.3L3.6 14a1.6 1.6 0 0 1 2.6-1.8L7 13.3"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14 -1.5 7 5-2.5 5 2.5-1.5-7"/>',
  };

  /** icon('home') → <svg> element. */
  TD.icon = function icon(name, cls) {
    const t = document.createElement('template');
    t.innerHTML = '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || P.info) + '</svg>';
    return t.content.firstElementChild;
  };
  TD.iconHTML = (name, cls) => TD.icon(name, cls).outerHTML;
})(window.TD = window.TD || {});
