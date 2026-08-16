/* Garden Wonder — the scope the UI files share.

   The UI used to be one IIFE and everything in it closed over the same locals. Splitting it
   across files with no build step and no modules means that scope has to be passed by hand, so
   it is passed as one global: `UI`. This file defines the part that has no dependencies — the
   DOM lookups, the cached element map and the formatting helpers. Every other UI file attaches
   its own public functions to `UI` as it loads, and every call that crosses a file boundary
   goes through `UI` at call time. See docs/02-architecture.md. */

const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const S = Game.state;

  const el = {
    game: $('#game'),
    ui: $('#ui'),
    garden: $('#garden'),
    critterYard: $('#critterYard'),
    rail: $('#rail'),
    questStrip: $('#questStrip'),
    qPip: $('#qPip'),
    qPipWrap: $('#qPipWrap'),
    qBar: $('#qBar'),
    qText: $('#qText'),
    qCount: $('#qCount'),
    qReward: $('#qReward'),
    credits: $('#credits'),
    gems: $('#gems'),
    walletCredits: $('#walletCredits'),
    walletGems: $('#walletGems'),
    dock: $('#dock'),
    sheet: $('#sheet'),
    sheetBody: $('#sheetBody'),
    sheetTabs: $('#sheetTabs'),
    sheetTitle: $('#sheetTitle'),
    sheetGrip: $('#sheetGrip'),
    scrim: $('#scrim'),
    toasts: $('#toasts'),
    banner: $('#banner'),
    coach: $('#coach'),
    cloudsFar: $('#cloudsFar'),
    cloudsNear: $('#cloudsNear'),
    sky: $('#sky')
  };

  /* ============ formatting ============ */
  const trimZeros = (s) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
  function fmt(n) {
    n = Math.round(n);
    const abs = Math.abs(n);
    if (abs < 100000) return n.toLocaleString();
    if (abs < 1e6) return trimZeros((n / 1e3).toFixed(1)) + 'K';
    if (abs < 1e9) return trimZeros((n / 1e6).toFixed(2)) + 'M';
    if (abs < 1e12) return trimZeros((n / 1e9).toFixed(2)) + 'B';
    return trimZeros((n / 1e12).toFixed(2)) + 'T';
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    if (sec < 60) return sec + 's';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + 'm' + (s ? ' ' + s + 's' : '');
  }
  const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
  const signed = (v, d = 0) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(d)}%`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  /* Rarity mastery goals count that rarity or better; the plus carries that. */
  const MASTERY_TRACK = { total: 'total', rare: 'Rare+', epic: 'Epic+' };

  return { $, $$, S, el, fmt, fmtTime, pct, signed, rnd, MASTERY_TRACK };
})();
