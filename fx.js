/* Garden Wonder — juice: canvas particles, screen shake, floating text, haptics. */

const FX = (() => {
  let canvas, ctx, dpr = 1, W = 0, H = 0;
  let parts = [];
  let ambient = [];
  let shakeAmt = 0, shakeT = 0;
  let gameEl = null, worldEl = null, textLayer = null;
  let reduced = false;
  let magnetTargets = {};

  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  function init() {
    canvas = document.getElementById('fx');
    gameEl = document.getElementById('game');
    worldEl = document.getElementById('world');
    ctx = canvas.getContext('2d');
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    textLayer = document.createElement('div');
    textLayer.className = 'float-layer';
    gameEl.appendChild(textLayer);
    resize();
    window.addEventListener('resize', resize);
    seedAmbient();
  }

  /* iOS fires `resize` when the URL bar collapses, and it used to re-seed both pools —
     so every raindrop on screen teleported the moment the player scrolled. The backing
     store is re-applied either way; the pools are only rebuilt when the window really
     changed size, which is an orientation change and nothing else. */
  function resize() {
    const nw = window.innerWidth;
    const nh = window.innerHeight;
    const same = nw === W && nh === H;
    W = nw;
    H = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (same) return;
    seedAmbient();
    seedWeather();
  }

  function setMagnet(name, el) {
    magnetTargets[name] = el;
  }

  function targetPoint(name) {
    const el = magnetTargets[name];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ---------- ambient drifting petals ---------- */
  function seedAmbient() {
    const count = reduced ? 0 : Math.round(Math.min(18, W / 34));
    ambient = [];
    for (let i = 0; i < count; i += 1) {
      ambient.push({
        x: rnd(0, W),
        y: rnd(-H, H),
        vy: rnd(12, 30),
        vx: rnd(-10, 10),
        r: rnd(3.5, 7),
        rot: rnd(0, TAU),
        vr: rnd(-1.2, 1.2),
        hue: Math.random() < 0.5 ? '#ffc8dd' : '#fff0b8',
        sway: rnd(0.4, 1.3),
        t: rnd(0, 10)
      });
    }
  }

  /* ---------- the weather layer ----------
     A standing layer in the ambient petals' pattern: the pool is seeded once at
     the size that was asked for and every drop leaving the bottom comes back in
     at the top, so the budget is the count and never a function of how long the
     sky has hung. `thin` is how much of that pool is in play — it ramps up when a
     sky lands and down when one ends, which is what a shower stopping actually
     looks like: the drops still falling reach the ground and are not replaced. */
  const WX_MAX = 96;
  const WX_SKIN = {
    rain: { ink: '#dfeeff', alpha: 0.62 },
    storm: { ink: '#cfe4fb', alpha: 0.74 }
  };
  /* Slower than rain, because this is falling light and not water. */
  const GOLD_FALL = 210;
  let wxKind = null;
  let wxPool = [];
  let wxSplash = [];
  let wxThin = 0;
  let wxThinRate = 0;
  const wxCfg = { count: 0, speed: 900, wind: 0.12 };

  const wxWant = () => (reduced || !wxKind
    ? 0 : Math.max(0, Math.min(WX_MAX, Math.round(wxCfg.count))));

  function seedWeather() {
    const want = wxWant();
    const live = Math.round(want * wxThin);
    wxPool.length = 0;
    for (let i = 0; i < want; i += 1) {
      const p = makeWx(rnd(-H, H));
      p.parked = i >= live;
      wxPool.push(p);
    }
  }

  /* One shape for both kinds. Two pools would mean two wrap rules and two places
     for the budget to drift apart. */
  function makeWx(y) {
    return {
      x: rnd(-40, W + 40),
      y,
      z: rnd(0.5, 1),
      len: rnd(0.022, 0.034),
      sway: rnd(0.3, 0.9),
      t: rnd(0, 10),
      r: rnd(3.2, 6),
      vy: GOLD_FALL * rnd(0.72, 1.3),
      vx: rnd(-14, 14),
      rot: rnd(0, TAU),
      spin: rnd(-5.5, 5.5),
      a: rnd(0.72, 1),
      parked: false
    };
  }

  function weather(kind, opts = {}) {
    if (!kind) { weatherClear(); return; }
    const was = wxKind;
    wxKind = kind;
    if (typeof opts.count === 'number') wxCfg.count = opts.count;
    if (typeof opts.speed === 'number') wxCfg.speed = opts.speed;
    if (typeof opts.wind === 'number') wxCfg.wind = opts.wind;
    if (was !== kind || wxPool.length !== wxWant()) seedWeather();
    wxThinRate = 1 / 1.6;
  }

  function weatherOff(seconds) {
    if (!wxKind) return;
    wxThinRate = -1 / (seconds > 0 ? seconds : 1.6);
  }

  function weatherClear() {
    wxKind = null;
    wxPool.length = 0;
    wxSplash.length = 0;
    wxThin = 0;
    wxThinRate = 0;
  }

  /* A drop landing on a plant. Reduced motion takes the layer to zero and lets
     the wet ground carry the sky, so there is nothing for a drop to land from. */
  function splashAt(x, y) {
    if (reduced) return;
    // A belt for the guards in ui-weather.js: whatever calls this, the pool cannot grow
    // without bound. Four particles per splash, so this is sixteen splashes in flight.
    if (wxSplash.length > 64) return;
    wxSplash.push({ kind: 'ring', x, y, life: 0, max: 0.42, size: 26 });
    for (let i = 0; i < 3; i += 1) {
      const a = rnd(-Math.PI * 0.85, -Math.PI * 0.15);
      const sp = rnd(60, 150);
      wxSplash.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 620,
        r: rnd(1.6, 2.8),
        life: 0,
        max: rnd(0.28, 0.46)
      });
    }
  }

  function stepWeather(dt) {
    if (wxThinRate) {
      const dir = wxThinRate;
      wxThin = Math.max(0, Math.min(1, wxThin + dir * dt));
      // Only a downward ramp that has reached zero has finished — a first frame
      // with dt 0 sits at zero on the way UP and must not read as over.
      if (dir > 0 && wxThin === 1) wxThinRate = 0;
      if (dir < 0 && wxThin === 0) { wxThinRate = 0; weatherClear(); }
    }
    if (wxPool.length) drawWeather(dt);
    if (wxSplash.length) drawSplash(dt);
  }

  function drawWeather(dt) {
    const skin = WX_SKIN[wxKind];
    const live = Math.round(wxPool.length * wxThin);
    const soft = 0.4 + 0.6 * wxThin;
    ctx.lineCap = 'round';
    if (skin) ctx.strokeStyle = skin.ink;
    for (let i = 0; i < wxPool.length; i += 1) {
      const p = wxPool[i];
      if (p.parked) {
        if (i < live) { p.parked = false; p.x = rnd(-40, W + 40); p.y = rnd(-120, -20); }
        continue;
      }
      const vy = skin ? wxCfg.speed * p.z : p.vy;
      const vx = skin ? wxCfg.wind * wxCfg.speed * p.z * 0.55 : p.vx;
      p.t += dt;
      p.y += vy * dt;
      p.x += (vx + Math.sin(p.t * p.sway) * (skin ? 6 : 16)) * dt;
      if (p.y > H + 30) {
        if (i < live) { p.y = rnd(-120, -20); p.x = rnd(-40, W + 40); } else { p.parked = true; }
        continue;
      }
      if (p.x < -60) p.x = W + 40;
      if (p.x > W + 60) p.x = -40;

      if (skin) {
        const lx = vx * p.len;
        const ly = vy * p.len;
        ctx.globalAlpha = skin.alpha * (0.34 + p.z * 0.66) * soft;
        ctx.lineWidth = 0.9 + p.z * 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - lx, p.y - ly);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        continue;
      }

      /* Gold has NO wallet magnet. The magnet is what makes a coin read as
         money, and this is light falling out of the sky. */
      p.rot += p.spin * dt;
      ctx.save();
      ctx.globalAlpha = p.a * soft;
      ctx.translate(p.x, p.y);
      ctx.scale(Math.max(0.18, Math.abs(Math.cos(p.rot))), 1);
      ctx.fillStyle = '#ffc93c';
      ctx.strokeStyle = '#2c1a10';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff3bf';
      ctx.beginPath();
      ctx.arc(-p.r * 0.24, -p.r * 0.24, p.r * 0.34, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawSplash(dt) {
    for (let i = wxSplash.length - 1; i >= 0; i -= 1) {
      const p = wxSplash[i];
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { wxSplash.splice(i, 1); continue; }
      ctx.save();
      if (p.kind === 'ring') {
        ctx.globalAlpha = (1 - k) * 0.7;
        ctx.strokeStyle = '#e8f5ff';
        ctx.lineWidth = 2.4 * (1 - k) + 0.6;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * easeOut(k), p.size * easeOut(k) * 0.42, 0, 0, TAU);
        ctx.stroke();
      } else {
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#e8f5ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- emitters ---------- */
  function coins(x, y, n = 8, opts = {}) {
    if (reduced) n = Math.min(n, 3);
    for (let i = 0; i < n; i += 1) {
      parts.push({
        kind: 'coin',
        x, y,
        vx: rnd(-140, 140),
        vy: rnd(-380, -180),
        g: 900,
        r: rnd(6, 10),
        life: 0,
        max: rnd(0.75, 1.05),
        spin: rnd(-8, 8),
        rot: rnd(0, TAU),
        magnet: opts.magnet !== false ? 'coin' : null,
        color: opts.color || '#ffc93c'
      });
    }
  }

  function sparks(x, y, n = 10, color = '#ffe066') {
    if (reduced) n = Math.min(n, 4);
    for (let i = 0; i < n; i += 1) {
      const a = rnd(0, TAU);
      const sp = rnd(90, 340);
      parts.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 260,
        r: rnd(2, 4.5),
        life: 0,
        max: rnd(0.4, 0.8),
        color
      });
    }
  }

  function stars(x, y, n = 6, color = '#fff3bf') {
    for (let i = 0; i < n; i += 1) {
      const a = rnd(0, TAU);
      const sp = rnd(50, 200);
      parts.push({
        kind: 'star',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        g: 120,
        r: rnd(5, 11),
        life: 0,
        max: rnd(0.6, 1.1),
        rot: rnd(0, TAU),
        spin: rnd(-6, 6),
        color
      });
    }
  }

  function confetti(x, y, n = 26) {
    if (reduced) n = Math.min(n, 8);
    const palette = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ff8fab', '#ffffff'];
    for (let i = 0; i < n; i += 1) {
      const a = rnd(-Math.PI * 0.85, -Math.PI * 0.15);
      const sp = rnd(220, 560);
      parts.push({
        kind: 'confetti',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 780,
        w: rnd(6, 12),
        h: rnd(8, 16),
        life: 0,
        max: rnd(1.1, 1.9),
        rot: rnd(0, TAU),
        spin: rnd(-12, 12),
        drag: 0.985,
        color: palette[(Math.random() * palette.length) | 0]
      });
    }
  }

  function ring(x, y, color = '#ffffff', max = 0.5, size = 90) {
    parts.push({ kind: 'ring', x, y, life: 0, max, size, color });
  }

  function rainbowBurst(x, y) {
    confetti(x, y, 40);
    stars(x, y, 14, '#ffffff');
    ring(x, y, '#ffd6f5', 0.8, 220);
  }

  /* ---------- floating text ---------- */
  function float(x, y, text, kind = '') {
    if (!textLayer) return;
    const el = document.createElement('div');
    el.className = `float ${kind}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dx', `${rnd(-16, 16).toFixed(0)}px`);
    textLayer.appendChild(el);
    setTimeout(() => el.remove(), kind === 'big' ? 1100 : 850);
  }

  function floatAt(el, text, kind = '') {
    if (!el) return;
    const r = el.getBoundingClientRect();
    float(r.left + r.width / 2, r.top + r.height * 0.35, text, kind);
  }

  /* ---------- screen shake ---------- */
  function shake(power = 6, time = 0.28) {
    if (reduced) return;
    shakeAmt = Math.max(shakeAmt, power);
    shakeT = Math.max(shakeT, time);
  }

  function haptic(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* unsupported */ }
    }
  }

  /* ---------- loop ---------- */
  function step(dt) {
    dt = Math.min(dt, 0.05);
    ctx.clearRect(0, 0, W, H);

    // ambient petals
    ctx.globalAlpha = 0.55;
    for (const p of ambient) {
      p.t += dt;
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(p.t * p.sway) * 18) * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 20) { p.y = -20; p.x = rnd(0, W); }
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.hue;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // The sky falls over the drifting petals and under everything the player did.
    if (wxKind || wxSplash.length) stepWeather(dt);

    /* A layout read, and it sat above the loop unconditionally — so every frame in the
       game forced a flush for a magnet that only exists for about a second after a
       harvest. The guard below already handles null. Not cached across frames on
       purpose: the wallet lives inside `.world`, which the shake moves, so a stale
       point would drag the coins off target for the length of a shake. */
    const coinTarget = parts.length ? targetPoint('coin') : null;

    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i];
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }

      if (p.kind === 'ring') {
        const r = p.size * easeOut(k);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5 * (1 - k) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (p.magnet === 'coin' && coinTarget && k > 0.32) {
        const m = Math.min(1, (k - 0.32) / 0.55);
        p.x += (coinTarget.x - p.x) * m * 0.24;
        p.y += (coinTarget.y - p.y) * m * 0.24;
      } else {
        p.vy += (p.g || 0) * dt;
        if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (p.spin) p.rot += p.spin * dt;

      ctx.save();
      ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      ctx.translate(p.x, p.y);

      if (p.kind === 'coin') {
        const squash = Math.abs(Math.cos(p.rot));
        ctx.scale(Math.max(0.18, squash), 1);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#2c1a10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff3bf';
        ctx.beginPath();
        ctx.arc(-p.r * 0.22, -p.r * 0.22, p.r * 0.36, 0, TAU);
        ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * (1 - k * 0.6), 0, TAU);
        ctx.fill();
      } else if (p.kind === 'confetti') {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)));
      } else if (p.kind === 'star') {
        ctx.rotate(p.rot);
        drawStar(ctx, p.r * (1 - k * 0.35), p.color);
      }
      ctx.restore();
    }

    // shake
    if (shakeT > 0) {
      shakeT -= dt;
      const f = Math.max(0, shakeT / 0.28);
      const a = shakeAmt * f;
      /* Written straight onto the element that moves, not as three custom properties
         on `#game`. A custom property changing on an ancestor makes every descendant
         re-resolve its inherited map, and `#game` has the whole game under it — measured
         at 2.5-3.4ms a frame against 0.004ms for the same transform written here, and
         the Sky Pass made it dearer still by adding a subtree that reads ninety-odd
         `var(--wx-*)`. The shake runs for 0.28s on every crit tap, which in a tapper is
         most of the time the thumb is down.
         `style.css`'s `--shake-*` defaults stay exactly where they are: they are the
         resting transform, and the inline value is removed rather than zeroed so the
         stylesheet takes the element back. */
      worldEl.style.transform = `translate3d(${rnd(-a, a).toFixed(2)}px,${
        rnd(-a, a).toFixed(2)}px,0) rotate(${rnd(-a * 0.09, a * 0.09).toFixed(3)}deg)`;
      if (shakeT <= 0) {
        shakeAmt = 0;
        worldEl.style.removeProperty('transform');
      }
    }
  }

  function drawStar(c, r, color) {
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  return {
    init, step, coins, sparks, stars, confetti, ring, rainbowBurst,
    float, floatAt, shake, haptic, setMagnet, centerOf,
    weather, weatherOff, splashAt,
    get reduced() { return reduced; },
    get weatherCount() { return Math.round(wxPool.length * wxThin); },
    /* Two readouts for the frame-rate instrument. Pure reports of this file's own
       state, the shape `weatherCount` already is, so "fx.js knows nothing about the
       game" still holds. */
    get partCount() { return parts.length + ambient.length + wxSplash.length; },
    get canvasInfo() { return { dpr, w: canvas.width, h: canvas.height }; }
  };
})();
