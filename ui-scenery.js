/* Garden Wonder — the sky, the clouds and the weather tint.

   Everything that paints the world behind the interface. Reaches the rest of the UI through the
   `UI` global — see docs/02-architecture.md. */

(() => {
  const { el } = UI;

  /* ============ scenery ============ */
  const SKY_KEYS = [
    { t: 0.00, s1: '#132a52', s2: '#2b4a7a', s3: '#5a7a9e', sun: '#e8f0ff', star: 1, sx: 22, sy: 22 },
    { t: 0.18, s1: '#ff9e6d', s2: '#ffd9a0', s3: '#ffeed2', sun: '#fff0c4', star: 0.15, sx: 8, sy: 62 },
    { t: 0.34, s1: '#5cb8ee', s2: '#a9e2ff', s3: '#e4f7ff', sun: '#fff8d0', star: 0, sx: 30, sy: 22 },
    { t: 0.55, s1: '#7ec8f2', s2: '#bfe9ff', s3: '#e9f8ff', sun: '#fff3bf', star: 0, sx: 62, sy: 12 },
    { t: 0.74, s1: '#ff8f6b', s2: '#ffc48c', s3: '#ffe6c4', sun: '#ffd08a', star: 0.1, sx: 88, sy: 58 },
    { t: 0.86, s1: '#3d2a63', s2: '#7a5a92', s3: '#c98fa4', sun: '#ffd9e8', star: 0.55, sx: 96, sy: 74 },
    { t: 1.00, s1: '#132a52', s2: '#2b4a7a', s3: '#5a7a9e', sun: '#e8f0ff', star: 1, sx: 22, sy: 22 }
  ];


  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
  };

  function updateSky() {
    const t = Game.dayPhase();
    let i = 0;
    while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].t <= t) i += 1;
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    const k = (t - a.t) / (b.t - a.t);
    const r = document.documentElement.style;
    r.setProperty('--sky1', mix(a.s1, b.s1, k));
    r.setProperty('--sky2', mix(a.s2, b.s2, k));
    r.setProperty('--sky3', mix(a.s3, b.s3, k));
    r.setProperty('--sun-c', mix(a.sun, b.sun, k));
    r.setProperty('--star-op', (a.star + (b.star - a.star) * k).toFixed(2));
    r.setProperty('--sun-x', (a.sx + (b.sx - a.sx) * k).toFixed(1) + '%');
    r.setProperty('--sun-y', (a.sy + (b.sy - a.sy) * k).toFixed(1) + '%');
  }

  function buildClouds() {
    const make = (host, n, minW, maxW, minDur, maxDur, op) => {
      for (let i = 0; i < n; i += 1) {
        const c = document.createElement('div');
        c.className = 'cloud';
        const w = minW + Math.random() * (maxW - minW);
        c.style.setProperty('--w', w + 'px');
        c.style.setProperty('--dur', (minDur + Math.random() * (maxDur - minDur)) + 's');
        c.style.setProperty('--delay', (-Math.random() * 90) + 's');
        c.style.setProperty('--o', op);
        c.style.top = (14 + Math.random() * 52) + '%';
        host.appendChild(c);
      }
    };
    make(el.cloudsFar, 3, 58, 92, 130, 200, 0.62);
    make(el.cloudsNear, 2, 92, 140, 80, 120, 0.9);
  }

  /* The sky is the only cue for ordinary weather — a banner four times an hour would be noise.
     Rare weather earns a line from the flower. */
  function paintWeather(w) {
    el.game.dataset.weather = w.id;
    if (w.tint) el.game.style.setProperty('--weather-tint', w.tint);
    else el.game.style.removeProperty('--weather-tint');
  }

  UI.updateSky = updateSky;
  UI.buildClouds = buildClouds;
  UI.paintWeather = paintWeather;
})();
