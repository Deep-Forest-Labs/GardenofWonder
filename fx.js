/* Garden Wonder — juice: canvas particles, screen shake, floating text, haptics. */

const FX = (() => {
  let canvas, ctx, dpr = 1, W = 0, H = 0;
  let parts = [];
  let ambient = [];
  let shakeAmt = 0, shakeT = 0;
  let gameEl = null, textLayer = null;
  let reduced = false;
  let magnetTargets = {};

  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  function init() {
    canvas = document.getElementById('fx');
    gameEl = document.getElementById('game');
    ctx = canvas.getContext('2d');
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    textLayer = document.createElement('div');
    textLayer.className = 'float-layer';
    gameEl.appendChild(textLayer);
    resize();
    window.addEventListener('resize', resize);
    seedAmbient();
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedAmbient();
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

    const coinTarget = targetPoint('coin');

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
      gameEl.style.setProperty('--shake-x', `${rnd(-a, a).toFixed(2)}px`);
      gameEl.style.setProperty('--shake-y', `${rnd(-a, a).toFixed(2)}px`);
      gameEl.style.setProperty('--shake-r', `${rnd(-a * 0.09, a * 0.09).toFixed(3)}deg`);
      if (shakeT <= 0) {
        shakeAmt = 0;
        gameEl.style.setProperty('--shake-x', '0px');
        gameEl.style.setProperty('--shake-y', '0px');
        gameEl.style.setProperty('--shake-r', '0deg');
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
    get reduced() { return reduced; }
  };
})();
