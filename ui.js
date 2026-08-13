/* Garden Wonder — presentation, input and glue. */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const S = Game.state;

  const el = {
    game: $('#game'),
    ui: $('#ui'),
    garden: $('#garden'),
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
  const ico = (name, cls = '') => `<span class="ico ${cls}">${Icons.get(name)}</span>`;
  const rnd = (a, b) => a + Math.random() * (b - a);

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
  const CYCLE = 360; // seconds for a full day
  const DAY_START = 0.46; // every session opens at bright midday
  const bootAt = Date.now() / 1000;

  const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
  };

  function updateSky() {
    const t = ((Date.now() / 1000 - bootAt) / CYCLE + DAY_START) % 1;
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

  /* ============ garden ============ */
  const plotEls = [];
  let flowerBtn = null;
  let speechEl = null;
  let comboRing = null;

  function buildGarden() {
    el.garden.innerHTML = '';
    plotEls.length = 0;
    for (let cell = 0; cell < 9; cell += 1) {
      if (cell === 4) {
        const wrap = document.createElement('div');
        wrap.className = 'flower-cell';
        wrap.innerHTML = `
          <div class="flower-glow"></div>
          <div class="combo-ring"></div>
          <button class="flower-btn" id="flowerBtn" aria-label="Tap the talking flower">${Flora.talkingFlower()}</button>
          <div class="speech" id="speech"></div>`;
        el.garden.appendChild(wrap);
        flowerBtn = $('#flowerBtn', wrap);
        speechEl = $('#speech', wrap);
        comboRing = $('.combo-ring', wrap);
        wireFlower();
        continue;
      }
      const idx = cell < 4 ? cell : cell - 1;
      const b = document.createElement('button');
      b.className = 'plot';
      b.dataset.idx = idx;
      b.dataset.state = 'empty';
      b.innerHTML = `
        <div class="plot-inner"><div class="plant-slot"></div></div>
        <div class="empty-mark">${Icons.get('plantSpot')}</div>
        <div class="lock-badge">${Icons.get('lock')}<div class="lock-cost">${Icons.get('coin')}<span></span></div></div>
        <div class="bar"><i></i></div>
        <div class="ready-pop">!</div>
        <div class="auto-tag">Auto</div>
        <div class="lucky-badge">${Icons.get('ladybug')}</div>`;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); onPlotTap(idx, b); }, { passive: false });
      el.garden.appendChild(b);
      plotEls[idx] = {
        root: b,
        inner: $('.plot-inner', b),
        slot: $('.plant-slot', b),
        bar: $('.bar i', b),
        cost: $('.lock-cost span', b),
        costWrap: $('.lock-cost', b),
        tag: $('.auto-tag', b),
        lucky: $('.lucky-badge', b),
        cache: {}
      };
    }
  }

  /** Keep the board a perfect square that fills whatever the stage row offers. */
  function sizeGarden() {
    const st = $('.stage');
    const r = st.getBoundingClientRect();
    const s = Math.max(150, Math.floor(Math.min(r.width, r.height)));
    el.garden.style.width = s + 'px';
    el.garden.style.height = s + 'px';
  }

  function stageOf(p) {
    if (p < 0.25) return 1;
    if (p < 0.7) return 2;
    return 3;
  }

  function renderPlots() {
    for (let i = 0; i < 8; i += 1) {
      const cell = S.grid[i];
      const v = plotEls[i];
      if (!v) continue;
      const c = v.cache;

      let state;
      if (cell.locked) state = 'locked';
      else if (!cell.seed) state = 'empty';
      else if (cell.ready) state = 'ready';
      else state = 'grow';

      if (c.state !== state) {
        v.root.dataset.state = state;
        c.state = state;
      }
      if (c.aura !== (cell.aura || '')) {
        if (cell.aura) v.root.dataset.aura = cell.aura; else delete v.root.dataset.aura;
        c.aura = cell.aura || '';
      }
      const lucky = Boolean(cell.luckyBug);
      if (c.lucky !== lucky) { v.lucky.classList.toggle('show', lucky); c.lucky = lucky; }

      if (state === 'locked') {
        const gated = !Game.plotAvailable(i);
        if (c.gated !== gated) {
          v.root.dataset.gated = gated ? '1' : '0';
          if (gated) {
            v.costWrap.textContent = `Lv ${Game.plotUnlockLevel(i)}`;
            v.cost = null;
          } else {
            v.costWrap.innerHTML = `${Icons.get('coin')}<span></span>`;
            v.cost = $('span', v.costWrap);
          }
          c.gated = gated;
          c.cost = null;
        }
        if (gated) {
          if (c.afford !== '0') { v.root.dataset.afford = '0'; c.afford = '0'; }
        } else {
          const cost = Game.plotUnlockCost(i);
          if (c.cost !== cost) { if (v.cost) v.cost.textContent = fmt(cost); c.cost = cost; }
          const afford = S.credits >= cost ? '1' : '0';
          if (c.afford !== afford) { v.root.dataset.afford = afford; c.afford = afford; }
        }
        if (c.seed !== null) { v.slot.innerHTML = ''; c.seed = null; c.stage = null; }
        continue;
      }

      if (!cell.seed) {
        if (c.seed !== null) { v.slot.innerHTML = ''; c.seed = null; c.stage = null; }
        continue;
      }

      if (c.seed !== cell.seed) {
        const sdef = Game.seedById(cell.seed);
        v.slot.innerHTML = sdef ? Flora.plant(sdef) : '';
        c.seed = cell.seed;
        c.stage = null;
      }

      const p = Game.progressOf(cell);
      const st = stageOf(p);
      if (c.stage !== st) { v.root.dataset.stage = st; c.stage = st; }
      const w = (p * 100).toFixed(1) + '%';
      if (c.bar !== w) { v.bar.style.width = w; c.bar = w; }
    }
  }

  /* ============ talking flower ============ */
  let speechTimer = null;
  let lastSpeech = 0;
  let idleSince = Date.now() / 1000;

  function say(bucket, force) {
    const now = Date.now() / 1000;
    if (!el.coach.hidden) return; // don't stack a bubble on top of a coach mark
    if (!force && now - lastSpeech < 3.2) return;
    const lines = FLOWER_LINES[bucket] || FLOWER_LINES.idle;
    const text = lines[(Math.random() * lines.length) | 0];
    lastSpeech = now;
    speechEl.textContent = text;
    speechEl.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speechEl.classList.remove('show'), 2400);
  }

  let faceTimer = null;
  function faceReact(mood) {
    flowerBtn.classList.remove('bounce');
    void flowerBtn.offsetWidth;
    flowerBtn.classList.add('bounce');
    flowerBtn.classList.toggle('squint', mood === 'crit');
    flowerBtn.classList.toggle('happy', mood === 'happy');
    const mouth = $('.tf-mouth-path', flowerBtn);
    if (mouth) {
      const shapes = {
        idle: 'M-8,10 Q0,17 8,10',
        open: 'M-7,9 Q0,20 7,9 Q0,14 -7,9',
        crit: 'M-10,8 Q0,23 10,8 Q0,15 -10,8',
        wow: 'M-6,10 Q0,20 6,10 Q0,20 -6,10'
      };
      mouth.setAttribute('d', shapes[mood === 'crit' ? 'crit' : mood === 'wow' ? 'wow' : 'open']);
      clearTimeout(faceTimer);
      faceTimer = setTimeout(() => {
        mouth.setAttribute('d', shapes.idle);
        flowerBtn.classList.remove('squint');
      }, 340);
    }
  }

  function lookAt(clientX, clientY) {
    const eyes = $$('.tf-eye', flowerBtn);
    if (!eyes.length) return;
    const r = flowerBtn.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const dy = Math.max(-1, Math.min(1, (clientY - (r.top + r.height * 0.42)) / (r.height / 2)));
    flowerBtn.style.setProperty('--px', (dx * 2).toFixed(2));
    flowerBtn.style.setProperty('--py', (dy * 1.6).toFixed(2));
  }

  function wireFlower() {
    let holdTimer = null;
    const stopHold = () => {
      if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    };
    flowerBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      Sound.resume();
      lookAt(e.clientX, e.clientY);
      Game.tapFlower();
      if (!S.seen.intro) { S.seen.intro = true; Game.save(); hideCoach(); }
      // Holding repeats the same tap at a fixed cadence for as long as the
      // pointer stays down — Quick Grip shortens that cadence, it never
      // changes what a single tap is worth.
      stopHold();
      holdTimer = setInterval(() => Game.tapFlower(true), S.tap.holdInterval);
    }, { passive: false });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) => {
      flowerBtn.addEventListener(evt, stopHold);
    });
  }

  /* ============ HUD ============ */
  const counters = {
    credits: { disp: 0, node: el.credits, wallet: el.walletCredits, get: () => S.credits },
    gems: { disp: 0, node: el.gems, wallet: el.walletGems, get: () => S.gems }
  };

  function hudTick(dt) {
    Object.values(counters).forEach((c) => {
      const target = c.get();
      if (Math.abs(target - c.disp) < 0.6) {
        if (c.disp !== target) { c.disp = target; c.node.textContent = fmt(target); }
        return;
      }
      c.disp += (target - c.disp) * Math.min(1, dt * 9);
      c.node.textContent = fmt(c.disp);
    });
    renderQuestStrip();
  }

  function renderQuestStrip() {
    if (!el.questStrip) return;
    const q = Game.stripQuest();
    const lv = Game.levelFromRep(S.rep);
    const into = Game.repIntoLevel(S.rep);
    const need = Game.repToNext(lv);
    const repP = need ? Math.max(0, Math.min(1, into / need)) : 1;
    let text = 'More reputation is coming';
    let count = '';
    let ready = false;
    let claimId = '';
    let questP = 0;
    let reward = '';
    const rest = q.kind === 'rest' || !q.def;
    if (!rest) {
      text = q.def.text;
      ready = q.complete;
      questP = q.def.qty ? Math.max(0, Math.min(1, q.inst.progress / q.def.qty)) : 0;
      count = ready ? 'Claim' : `${q.inst.progress} / ${q.def.qty}`;
      claimId = ready ? q.def.id : '';
      reward = `+${q.def.rep}`;
    }
    const sig = [lv, repP.toFixed(3), questP.toFixed(3), text, count, claimId, reward, rest].join('|');
    if (el.questStrip.dataset.sig === sig) return;
    el.questStrip.dataset.sig = sig;
    el.qPip.textContent = lv;
    if (el.qPipWrap) el.qPipWrap.style.setProperty('--p', repP.toFixed(3));
    el.qBar.style.transform = `scaleX(${questP})`;
    el.qText.textContent = text;
    el.qCount.textContent = count;
    if (el.qReward) {
      el.qReward.innerHTML = reward ? `${Icons.get('star')}${reward}` : '';
    }
    el.questStrip.classList.toggle('ready', ready);
    el.questStrip.classList.toggle('rest', rest);
    el.questStrip.dataset.claim = claimId;
  }

  function popWallet(name) {
    const c = counters[name];
    if (!c) return;
    c.wallet.classList.remove('pop');
    void c.wallet.offsetWidth;
    c.wallet.classList.add('pop');
  }

  /* ============ rail chips ============ */
  /* The boost tray: active boosts show a countdown, held idle ones show a
     tappable chip that consumes one. Nothing renders when you hold none. */
  function renderRail() {
    const now = Game.nowSeconds();
    let html = '';
    DATA.boosters.forEach((b) => {
      if (Game.activeBoost(b.id)) {
        const remain = Math.max(0, S.boosters[b.id] - now);
        const p = Math.max(0, Math.min(1, remain / b.dur));
        html += `<div class="chip timed" style="--tint:${b.tint}">
          <span class="ring" style="--p:${p.toFixed(3)}"><i>${Math.ceil(remain) > 99 ? fmtTime(remain) : Math.ceil(remain)}</i></span>
          <span>${b.name}</span></div>`;
      } else {
        const held = (S.boostInv && S.boostInv[b.id]) || 0;
        if (held < 1) return;
        html += `<button class="chip buyable" data-boost="${b.id}" style="--tint:${b.tint}">
          <span class="chip-ico">${Icons.get(b.icon)}</span>
          <span>${b.name}</span>
          <span class="chip-price">×${held}</span></button>`;
      }
    });
    if (Game.wonderActive()) {
      const remain = Math.max(0, S.wonder.until - now);
      html = `<div class="chip timed" style="--tint:#ff6bd6">
        <span class="ring" style="--p:${(remain / WONDER.duration).toFixed(3)}"><i>${Math.ceil(remain)}</i></span>
        <span>WONDER x${WONDER.payoutMult}</span></div>` + html;
    }
    if (el.rail.dataset.sig !== html) {
      el.rail.innerHTML = html;
      el.rail.dataset.sig = html;
    }
  }

  /* ============ toasts ============ */
  function toast({ title, body, art, kind = '', ms = 3000 }) {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = `<div class="t-art">${art || Icons.get('sparkle')}</div>
      <div><div class="t-title">${title}</div>${body ? `<div class="t-body">${body}</div>` : ''}</div>`;
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 2) el.toasts.firstElementChild.remove();
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 320);
    }, ms);
  }

  /* ============ bottom sheet ============ */
  let sheetMode = null;
  let sheetArg = null;
  let seedSort = 'tier';

  const TABS = [
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'apiary', label: 'Apiary' },
    { id: 'craft', label: 'Craft' },
    { id: 'shop', label: 'Shop' }
  ];
  const SHOP_TABS = TABS.map((t) => t.id);

  function openSheet(mode, arg) {
    sheetMode = mode;
    sheetArg = arg;
    renderSheet(true);
    el.sheet.classList.add('open');
    el.sheet.setAttribute('aria-hidden', 'false');
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('show'));
    Sound.resume();
    Sound.play('open');
  }

  function closeSheet() {
    if (!sheetMode) return;
    sheetMode = null;
    el.sheet.classList.remove('open');
    el.sheet.style.transform = '';
    el.sheet.setAttribute('aria-hidden', 'true');
    el.scrim.classList.remove('show');
    setTimeout(() => { if (!sheetMode) el.scrim.hidden = true; }, 300);
    Sound.play('close');
  }

  function renderSheet(resetScroll) {
    if (!sheetMode) return;
    const keep = resetScroll ? 0 : el.sheetBody.scrollTop;
    const titles = {
      upgrades: 'Upgrades', apiary: 'Apiary', craft: 'Apothecary', shop: 'Shop',
      seeds: 'Choose a seed', bonuses: 'Garden Almanac', settings: 'Settings',
      quests: 'Quests'
    };
    el.sheetTitle.textContent = titles[sheetMode] || '';

    if (SHOP_TABS.includes(sheetMode)) {
      el.sheetTabs.innerHTML = TABS.map(
        (t) => `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === sheetMode}">${t.label}</button>`
      ).join('');
    } else if (sheetMode === 'seeds') {
      const opts = [['tier', 'By tier'], ['balanced', 'Balanced'], ['costAsc', 'Cheapest'], ['costDesc', 'Priciest']];
      el.sheetTabs.innerHTML = opts
        .map(([id, label]) => `<button class="tab" role="tab" data-sort="${id}" aria-selected="${id === seedSort}">${label}</button>`)
        .join('');
    } else {
      el.sheetTabs.innerHTML = '';
    }

    const render = {
      upgrades: renderUpgrades, apiary: renderApiary, craft: renderCraft, shop: renderShop,
      seeds: renderSeeds, bonuses: renderBonuses, settings: renderSettings, quests: renderQuests
    }[sheetMode];
    el.sheetBody.innerHTML = render ? render() : '';
    el.sheetBody.scrollTop = keep;
  }

  function priceTag(cost, currency, affordable, maxed) {
    if (maxed) return `<span class="price maxed">${Icons.get('check')}Maxed</span>`;
    const icon = currency === 'gems' ? 'gem' : 'coin';
    return `<span class="price ${affordable ? 'ok' : 'no'}">${Icons.get(icon)}${fmt(cost)}</span>`;
  }

  function pips(level, max = 8) {
    const shown = Math.min(level, max);
    let s = '';
    for (let i = 0; i < max; i += 1) s += `<span class="pip ${i < shown ? '' : 'off'}"></span>`;
    return `<div class="pips">${s}${level > max ? `<span class="lvl-text">+${level - max}</span>` : ''}</div>`;
  }

  const CORE_UPGRADES = [
    'tapPower', 'holdSpeed', 'critChance', 'critMult', 'comboMeter',
    'rainDance', 'beeSwarm', 'ladybug',
    'plotExpansion', 'autoWater', 'autoHarvest'
  ];

  function upgradeCard(key) {
    const def = DATA.upgrades[key];
    const lvl = S.upgrades[key];
    const maxed = Game.upgradeMaxed(key);
    const cost = Game.upgradePrice(key);
    const can = !maxed && S.credits >= cost;
    return `<button class="card ${can ? 'affordable' : ''}" data-buy="upgrade" data-key="${key}" ${maxed ? 'disabled' : ''}>
      <div class="card-top">
        <span class="card-badge">${Icons.get(def.icon || 'badge')}</span>
        <span>
          <span class="card-title">${def.short || def.name}</span>
          <span class="card-sub">Lv ${lvl}</span>
        </span>
      </div>
      ${pips(lvl)}
      <span class="card-desc">${def.desc}</span>
      ${priceTag(cost, 'credits', can, maxed)}
    </button>`;
  }

  function renderUpgrades() {
    const core = CORE_UPGRADES.map(upgradeCard).join('');
    const harvesters = PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked).map(({ key }) => upgradeCard(key)).join('');
    const lockedCount = PLOT_AUTOPLANTERS.filter(({ idx }) => S.grid[idx].locked).length;
    return `
      <p class="sheet-note">Buy upgrades to power up your taps, speed up growth and automate the garden.</p>
      <div class="card-grid">${core}</div>
      <p class="sheet-note" style="margin-top:16px">Harvesters keep a single plot planted for you, choosing the best seed you can afford.</p>
      <div class="card-grid">${harvesters || '<p class="sheet-note">Unlock a plot to hire its harvester.</p>'}</div>
      ${lockedCount ? `<p class="sheet-note" style="margin-top:10px">${lockedCount} more harvester${lockedCount > 1 ? 's' : ''} unlock with new plots.</p>` : ''}`;
  }

  function renderShop() {
    const cards = DATA.decor.map((d) => {
      const owned = Game.decorCount(d.id);
      const pot = d.currency === 'gems' ? S.gems : S.credits;
      const can = pot >= d.cost;
      return `<button class="card ${can ? 'affordable' : ''}" data-buy="decor" data-key="${d.id}">
        <div class="card-top">
          <span class="card-badge">${Icons.get(d.icon)}</span>
          <span>
            <span class="card-title">${d.name}</span>
            <span class="card-sub">${owned ? `Owned x${owned}` : 'Not placed'}</span>
          </span>
        </div>
        <span class="card-desc">${d.desc}</span>
        ${priceTag(d.cost, d.currency, can)}
      </button>`;
    }).join('');
    return `<p class="sheet-note">Purely decorative — dress up your garden however you like. Buy the same piece again for another copy.</p>
      <div class="card-grid">${cards}</div>`;
  }

  /* ---- apiary ---- */
  const honeyIco = (type) => {
    const s = Game.seedById(type);
    return s ? Flora.head(s, 22) : Icons.get('honey');
  };

  function stockRow(icon, name, qty, unit, kind, key) {
    return `<div class="stock">
      <span class="stock-ico">${icon}</span>
      <span class="stock-name">${name}<span class="stock-sub">${Icons.get('coin')}${fmt(unit)} each</span></span>
      <span class="stock-qty">x${qty}</span>
      <button class="mini" data-sell="${kind}" data-key="${key}">Sell all</button>
    </div>`;
  }

  function renderApiary() {
    const hives = S.apiary.hives;
    const waiting = Game.jarsWaiting();

    if (!hives.length) {
      const cost = Game.nextHiveCost();
      const can = S.credits >= cost;
      return `<p class="sheet-note">Bees gather nectar from whatever is blooming right now — plant
        lavender and you get lavender honey. Every hive also pollinates the garden.</p>
        <button class="card wide ${can ? 'affordable' : ''}" data-apiary="buy">
          <div class="card-top">
            <span class="card-badge">${Icons.get('hive')}</span>
            <span>
              <span class="card-title">Set up your first hive</span>
              <span class="card-sub">A jar every ${fmtTime(APIARY.interval)} · +${pct(APIARY.pollination)} garden yield</span>
            </span>
          </div>
          <span class="card-desc">Holds ${APIARY.capacity} jars before the bees knock off. Collect to keep them working.</span>
          ${priceTag(cost, 'credits', can)}
        </button>`;
    }

    const cards = hives.map((h, i) => {
      const full = h.jars.length >= APIARY.capacity;
      const next = full ? 0 : h.at + APIARY.interval;
      const names = h.jars.length
        ? [...new Set(h.jars.map((j) => APIARY.honeyName(j)))].join(', ')
        : 'Empty — the bees are out.';
      return `<div class="hive ${h.jars.length ? 'has' : ''}">
        <div class="hive-top">
          <span class="hive-ico">${Icons.get('hive')}</span>
          <span class="hive-info">
            <span class="card-title">Hive ${i + 1}</span>
            <span class="card-sub">${names}</span>
          </span>
          <span class="hive-count">${h.jars.length}/${APIARY.capacity}</span>
        </div>
        <div class="jars">${
          Array.from({ length: APIARY.capacity }, (_, j) =>
            `<span class="jar ${j < h.jars.length ? 'on' : ''}">${j < h.jars.length ? honeyIco(h.jars[j]) : ''}</span>`
          ).join('')
        }</div>
        <div class="hive-foot">
          <span class="card-sub">${full ? 'Full — collect to restart' : `Next jar in <b data-countdown="${next}">${fmtTime(Math.max(0, next - Game.nowSeconds()))}</b>`}</span>
          <button class="mini go" data-apiary="collect" data-i="${i}" ${h.jars.length ? '' : 'disabled'}>Collect</button>
        </div>
      </div>`;
    }).join('');

    const cost = Game.nextHiveCost();
    const can = S.credits >= cost;
    const buy = Game.hivesFull()
      ? '<p class="sheet-note">Every hive the meadow can hold is yours.</p>'
      : `<button class="card wide ${can ? 'affordable' : ''}" data-apiary="buy">
          <div class="card-top">
            <span class="card-badge">${Icons.get('hive')}</span>
            <span>
              <span class="card-title">Another hive</span>
              <span class="card-sub">+${pct(APIARY.pollination)} garden yield</span>
            </span>
          </div>
          ${priceTag(cost, 'credits', can)}
        </button>`;

    const honeys = Object.keys(S.apiary.honey).sort((a, b) => APIARY.honeyValue(b) - APIARY.honeyValue(a));
    const stock = honeys.map((t) =>
      stockRow(honeyIco(t), APIARY.honeyName(t), S.apiary.honey[t], APIARY.honeyValue(t), 'honey', t)
    ).join('') + (S.apiary.wax ? stockRow(Icons.get('wax'), 'Beeswax', S.apiary.wax, APIARY.waxValue, 'wax', 'wax') : '');

    return `
      <p class="sheet-note">Pollination is giving every harvest <b>+${pct(Game.pollination())}</b>.
        ${waiting ? `<b>${waiting}</b> jar${waiting > 1 ? 's' : ''} waiting.` : ''}</p>
      ${waiting > 1 ? '<button class="wide-btn" data-apiary="all">Collect every hive</button>' : ''}
      ${cards}
      ${buy}
      <p class="sheet-note" style="margin-top:16px">Stores</p>
      ${stock || '<p class="sheet-note">Nothing in the pantry yet.</p>'}`;
  }

  /* ---- apothecary ---- */
  function needLabel(n) {
    if (n.kind === 'wax') return `${n.qty} beeswax`;
    if (n.kind === 'flower') return `${n.qty} flowers`;
    if (n.of) return `${n.qty} ${APIARY.honeyName(n.of).toLowerCase()}`;
    return `${n.qty} honey`;
  }

  function haveLabel(n) {
    if (n.kind === 'wax') return S.apiary.wax;
    if (n.kind === 'flower') return Game.flowerTotal();
    if (n.of) return S.apiary.honey[n.of] || 0;
    return Game.honeyTotal();
  }

  function renderCraft() {
    const busy = S.craft.length;
    const queue = S.craft.map((c) => {
      const r = CRAFT_RECIPES.find((x) => x.id === c.id);
      return `<div class="brew">
        <span class="stock-ico">${Icons.get(r.icon)}</span>
        <span class="stock-name">${r.name}<span class="stock-sub">Ready in <b data-countdown="${c.doneAt}">${fmtTime(Math.max(0, c.doneAt - Game.nowSeconds()))}</b></span></span>
      </div>`;
    }).join('');

    const cards = CRAFT_RECIPES.map((r) => {
      const can = Game.canCraft(r);
      const parts = r.needs.map((n) => {
        const ok = haveLabel(n) >= n.qty;
        return `<span class="need ${ok ? 'ok' : 'no'}">${needLabel(n)} <b>${haveLabel(n)}/${n.qty}</b></span>`;
      }).join('');
      return `<div class="card wide recipe ${can ? 'affordable' : ''}">
        <div class="card-top">
          <span class="card-badge">${Icons.get(r.icon)}</span>
          <span>
            <span class="card-title">${r.name}</span>
            <span class="card-sub">${fmtTime(r.time)} · sells for ${fmt(r.value)}</span>
          </span>
        </div>
        <span class="card-desc">${r.desc}</span>
        <div class="needs">${parts}</div>
        <button class="mini go" data-craft="${r.id}" ${can ? '' : 'disabled'}>
          ${busy >= CRAFT_SLOTS ? 'Bench full' : 'Make'}
        </button>
      </div>`;
    }).join('');

    const goods = Object.keys(S.goods).map((id) => {
      const r = CRAFT_RECIPES.find((x) => x.id === id);
      return stockRow(Icons.get(r.icon), r.name, S.goods[id], r.value, 'good', id);
    }).join('');

    const flowers = Object.keys(S.flowers)
      .sort((a, b) => flowerValue(b) - flowerValue(a))
      .map((id) => {
        const s = Game.seedById(id);
        return `<span class="chip" title="${s ? s.name : id}">${s ? Flora.head(s, 20) : ''}<b>${S.flowers[id]}</b></span>`;
      }).join('');

    return `
      <p class="sheet-note">Every harvest keeps the bloom itself. Combine flowers with honey from the
        Apiary to make something worth far more than its parts.</p>
      <div class="chips">${flowers || '<span class="card-sub">No flowers yet — go harvest something.</span>'}
        ${S.apiary.wax ? `<span class="chip">${Icons.get('wax')}<b>${S.apiary.wax}</b></span>` : ''}</div>
      ${queue ? `<p class="sheet-note" style="margin-top:14px">On the bench (${busy}/${CRAFT_SLOTS})</p>${queue}` : ''}
      <p class="sheet-note" style="margin-top:14px">Recipes</p>
      ${cards}
      ${goods ? `<p class="sheet-note" style="margin-top:16px">Finished goods</p>${goods}` : ''}`;
  }

  function sortedSeeds() {
    const list = [...DATA.seeds];
    if (seedSort === 'costAsc') list.sort((a, b) => a.cost - b.cost);
    else if (seedSort === 'costDesc') list.sort((a, b) => b.cost - a.cost);
    else if (seedSort === 'balanced') {
      // What you could afford to plant in every plot at once, not what you
      // could afford to dump into just this one — surfaces the best tier to
      // spread across the whole garden instead of the single priciest seed.
      const unlocked = S.grid.filter((c) => !c.locked).length || 1;
      const budget = S.credits / unlocked;
      list.sort((a, b) => Math.abs(a.cost - budget) - Math.abs(b.cost - budget));
    }
    return list;
  }

  function renderSeeds() {
    const rows = sortedSeeds().map((s) => {
      const locked = !Game.seedUnlocked(s.id);
      const can = !locked && S.credits >= s.cost;
      const grow = Math.round(s.grow * Game.growModifier());
      const max = Math.round(s.yield * MAX_RARITY_MULT);
      const drops = [];
      if (s.gemChance) drops.push(`<span class="stat gem">${Icons.get('gem')}${pct(s.gemChance, 1)}</span>`);
      if (locked) {
        return `<div class="seed-row gated">
          <span class="seed-art">${Flora.head(s, 40)}</span>
          <span>
            <span class="seed-name">${s.name}</span>
            <span class="seed-stats">
              <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
              <span class="stat">${Icons.get('clock')}${fmtTime(grow)}</span>
              <span class="stat good">${Icons.get('coin')}${fmt(s.yield)}–${fmt(max)}</span>
              ${drops.join('')}
            </span>
            <span class="seed-desc">${s.desc}</span>
          </span>
          <span class="seed-go">Level ${s.unlockLevel}</span>
        </div>`;
      }
      return `<button class="seed-row" data-plant="${s.id}" ${can ? '' : 'disabled'}>
        <span class="seed-art">${Flora.head(s, 40)}</span>
        <span>
          <span class="seed-name">${s.name}</span>
          <span class="seed-stats">
            <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
            <span class="stat">${Icons.get('clock')}${fmtTime(grow)}</span>
            <span class="stat good">${Icons.get('coin')}${fmt(s.yield)}–${fmt(max)}</span>
            ${drops.join('')}
          </span>
          <span class="seed-desc">${s.desc}</span>
        </span>
        <span class="seed-go">${Icons.get(can ? 'sprout' : 'lock')}</span>
      </button>`;
    }).join('');
    return `<p class="sheet-note">Planting into plot ${(sheetArg ?? 0) + 1}. Grow times already include your sprinklers and boosts.</p>${rows}`;
  }

  function questRewardLine(def) {
    const bits = [`+${def.rep} reputation`];
    if (def.reward && def.reward.credits) bits.push(`+${fmt(def.reward.credits)} coins`);
    if (def.reward && def.reward.gems) bits.push(`+${def.reward.gems} gems`);
    if (def.reward && def.reward.boost) {
      const b = DATA.boosters.find((x) => x.id === def.reward.boost);
      if (b) bits.push(b.name);
    }
    return bits.join(' · ');
  }

  function questCard(inst, def, claimable) {
    if (!def) return '';
    const done = inst.progress >= def.qty;
    const tag = done ? 'Claim' : `${inst.progress} / ${def.qty}`;
    const reward = questRewardLine(def);
    if (claimable && done) {
      return `<button class="quest-card ready" type="button" data-claim="${def.id}">
        <span class="q-meta"><span class="seed-name">${def.text}</span>
        <span class="card-sub">${reward}</span></span>
        <span class="q-prog">${tag}</span>
      </button>`;
    }
    return `<div class="quest-card">
      <span class="q-meta"><span class="seed-name">${def.text}</span>
      <span class="card-sub">${reward}</span></span>
      <span class="q-prog">${tag}</span>
    </div>`;
  }

  function renderQuests() {
    const lv = Game.levelFromRep(S.rep);
    const into = Game.repIntoLevel(S.rep);
    const need = Game.repToNext(lv);
    const active = S.quests.active.map((inst) => questCard(inst, Game.questById(inst.id), true)).join('');
    const daily = S.quests.daily;
    const ddef = daily && daily.id ? Game.questById(daily.id) : null;
    const dailyHtml = ddef && !daily.claimed
      ? questCard(daily, ddef, true)
      : `<p class="sheet-note">Today's quest is done. A new one arrives tomorrow.</p>`;
    const left = DATA.quests.length - S.quests.done.length;
    const tail = lv >= 17
      ? 'No new seeds past level 17 until the Market opens. Reputation still fills the bar.'
      : `${left} quest${left === 1 ? '' : 's'} left on the ladder.`;
    return `
      <p class="sheet-note">Level ${lv} · ${fmt(into)} / ${fmt(need)} reputation to the next level.</p>
      <p class="sheet-note" style="margin-top:4px">${tail}</p>
      <p class="sheet-note" style="margin-top:14px">Now</p>
      ${active || '<p class="sheet-note">The ladder is complete.</p>'}
      <p class="sheet-note" style="margin-top:14px">Today</p>
      ${dailyHtml}`;
  }

  function renderBonuses() {
    const tapMult = (1 + Game.boostVal('tapPower')) * (1 + Game.boostVal('globalCredits'));
    const tapEff = S.tap.power * tapMult * Game.wonderMult();
    const critChance = S.tap.critChance + Game.boostVal('critChance');
    const critMult = S.tap.critMult;
    const growBonus = Math.max(0, 1 - Game.growModifier());
    const harvestBonus = Game.boostVal('globalCredits');
    const ah = S.upgrades.autoHarvest;

    const line = (k, v, d) => `<div class="stat-line"><span class="kk"><span class="k">${k}</span>${d ? `<span class="d">${d}</span>` : ''}</span><span class="v">${v}</span></div>`;

    const harvesters = PLOT_AUTOPLANTERS.map(({ key, name, idx }) => {
      const lvl = S.upgrades[key];
      if (!lvl) return null;
      const seed = DATA.seeds[Math.min(lvl - 1, DATA.seeds.length - 1)];
      return line(`${name}`, `Lv ${lvl}`, `Plants up to ${seed.name}${S.grid[idx].locked ? ' (plot locked)' : ''}`);
    }).filter(Boolean).join('');

    return `
      <div class="stat-block">
        <h3>${Icons.get('fist')} Tap Power</h3>
        ${line('Per tap', fmt(tapEff), `Base ${S.tap.power} · ${signed(tapMult - 1)} from boosts`)}
        ${line('Hold-to-tap rate', `${(S.tap.holdInterval / 1000).toFixed(2)}s`, 'Hold the flower for automatic taps')}
        ${line('Crit chance', pct(Math.min(critChance, 0.99), 1), 'Chance for a big bonus tap')}
        ${line('Crit multiplier', `${critMult.toFixed(1)}x`, 'Payout spike when a crit lands')}
        ${line('Combo cap', `${S.tap.comboMax}`, `${Game.comboMult().toFixed(2)}× now · +1% per combo`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sparkle')} Tap Bonuses</h3>
        ${S.upgrades.rainDance
          ? line('Rain Dance', pct(S.upgrades.rainDance * 0.002, 1), 'Chance per tap to instantly water a growing plot')
          : line('Rain Dance', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.beeSwarm
          ? line('Bee Swarm', pct(S.upgrades.beeSwarm * 0.002, 1), 'Chance per tap to fill a jar in an open hive')
          : line('Bee Swarm', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.ladybug
          ? line('Lucky Ladybug', pct(S.upgrades.ladybug * 0.002, 1), 'Chance per tap to boost a growing plot\u2019s rarity odds')
          : line('Lucky Ladybug', 'Locked', 'Buy it in Upgrades to unlock')}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sprout')} Garden Mastery</h3>
        ${line('Growth speed', signed(growBonus), 'Sprinklers and boosts')}
        ${line('Rarity odds', signed(Game.boostVal('rarityWeight')), 'Chance of Rare, Epic and Legendary harvests')}
        ${line('Harvest yield', signed(harvestBonus), 'Extra credits on every harvest')}
        ${line('Wonder bonus', Game.wonderActive() ? `x${WONDER.payoutMult} active` : 'Idle', `Triggers randomly — ${S.stats.wonders || 0} so far`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('drone')} Automation</h3>
        ${ah ? line('Harvest Drone', `Lv ${ah}`, `Collects a ready plot every ${Math.max(0.7, 3 - ah * 0.5).toFixed(1)}s`) : line('Harvest Drone', 'Locked', 'Buy it to auto-collect')}
        ${harvesters || line('Harvesters', 'None hired', 'Hire them in the Upgrades tab')}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('star')} Records</h3>
        ${line('Taps', fmt(S.stats.totalTaps))}
        ${line('Crits', fmt(S.stats.totalCrits))}
        ${line('Harvests', fmt(S.stats.totalHarvests))}
        ${line('Wonder Effects', fmt(S.stats.wonders || 0))}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('book')} Seed Almanac</h3>
        ${DATA.seeds.map((s) => line(
          `<span style="display:inline-flex;align-items:center;gap:6px">${Flora.head(s, 22)}${s.name}</span>`,
          `${fmt(s.yield)}–${fmt(Math.round(s.yield * MAX_RARITY_MULT))}`,
          `${fmt(s.cost)} coins · ${fmtTime(s.grow)} base`
        )).join('')}
      </div>`;
  }

  let resetArmed = false;
  function renderSettings() {
    return `
      <div class="set-row">
        <span class="lbl">${Icons.get('sound')} Sound effects</span>
        <button class="toggle" data-toggle="sfx" aria-pressed="${S.prefs.sfx}"><i></i></button>
      </div>
      <div class="set-row">
        <span class="lbl">${Icons.get('music')} Ambient music</span>
        <button class="toggle" data-toggle="music" aria-pressed="${S.prefs.music}"><i></i></button>
      </div>
      <p class="sheet-note">Your garden saves automatically to this browser.</p>
      <button class="big-btn magic" data-act="cheat">${Icons.get('gem')} Grant 50 Gems</button>
      <button class="big-btn magic" data-act="cheatGold">${Icons.get('coin')} Grant 1,000,000 Gold</button>
      <button class="big-btn" data-act="wonder">${Icons.get('sparkle')} Summon a Wonder Effect</button>
      <button class="big-btn danger" data-act="reset">${Icons.get('trash')} ${resetArmed ? 'Tap again to erase everything' : 'Reset save'}</button>
      <p class="sheet-note" style="margin-top:14px;text-align:center">Garden Wonder · progress carried over from Idle Garden Reborn</p>`;
  }

  /* ---- sheet interactions ---- */
  el.sheetTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    if (tab.dataset.tab) { sheetMode = tab.dataset.tab; renderSheet(true); Sound.play('open'); }
    else if (tab.dataset.sort) { seedSort = tab.dataset.sort; renderSheet(true); }
  });

  el.sheetBody.addEventListener('click', (e) => {
    const claim = e.target.closest('[data-claim]');
    if (claim && claim.dataset.claim) {
      if (Game.claimQuest(claim.dataset.claim)) Sound.resume();
      return;
    }
    const api = e.target.closest('[data-apiary]');
    if (api) {
      const what = api.dataset.apiary;
      if (what === 'buy') {
        if (Game.buyHive()) {
          const c = FX.centerOf(api);
          FX.sparks(c.x, c.y, 14, '#ffc93c');
          FX.ring(c.x, c.y, '#ffe066', 0.5, 80);
          Sound.play('buy');
        } else { Sound.play('deny'); FX.shake(4); }
      } else {
        const got = what === 'all' ? Game.collectAllHives() : [Game.collectHive(Number(api.dataset.i))].filter(Boolean);
        const jars = got.reduce((a, r) => a + r.jars.length, 0);
        const wax = got.reduce((a, r) => a + r.wax, 0);
        if (jars) {
          const c = FX.centerOf(api);
          FX.coins(c.x, c.y, Math.min(12, jars * 2));
          Sound.play('coin');
          toast({
            title: `${jars} jar${jars > 1 ? 's' : ''} collected`,
            body: wax ? `and ${wax} beeswax` : 'straight to the pantry',
            art: Icons.get('honey')
          });
        }
      }
      return;
    }
    const craft = e.target.closest('[data-craft]');
    if (craft) {
      if (Game.startCraft(craft.dataset.craft)) {
        const c = FX.centerOf(craft);
        FX.sparks(c.x, c.y, 10, '#8ce0ff');
        Sound.play('buy');
      } else { Sound.play('deny'); FX.shake(4); }
      return;
    }
    const sellBtn = e.target.closest('[data-sell]');
    if (sellBtn) {
      const total = Game.sell(sellBtn.dataset.sell, sellBtn.dataset.key, true);
      if (total) {
        const c = FX.centerOf(sellBtn);
        FX.coins(c.x, c.y, 8);
        FX.float(c.x, c.y - 6, `+${fmt(total)}`, 'big');
        Sound.play('coin');
      } else { Sound.play('deny'); }
      return;
    }
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const { buy: kind, key } = buy.dataset;
      const ok = kind === 'upgrade' ? Game.buyUpgrade(key) : Game.buyDecor(key);
      if (ok) {
        const c = FX.centerOf(buy);
        FX.sparks(c.x, c.y, 12, '#ffe066');
        FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
      }
      return;
    }
    const plant = e.target.closest('[data-plant]');
    if (plant) {
      const seed = Game.seedById(plant.dataset.plant);
      const idx = sheetArg;
      if (Game.plant(idx, seed)) {
        closeSheet();
      } else {
        Sound.play('deny');
        FX.shake(4);
      }
      return;
    }
    const tog = e.target.closest('[data-toggle]');
    if (tog) {
      const k = tog.dataset.toggle;
      S.prefs[k] = !S.prefs[k];
      tog.setAttribute('aria-pressed', String(S.prefs[k]));
      Sound.resume();
      if (k === 'sfx') Sound.setSfx(S.prefs[k]); else Sound.setMusic(S.prefs[k]);
      Game.save();
      if (S.prefs[k]) Sound.play('buy');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'cheat') {
        S.gems += 50;
        Game.save(); Game.emit('currency'); Game.emit('panels');
        Sound.play('coin');
        toast({ title: 'Pockets filled!', body: '+50 gems', art: Icons.get('gem') });
      } else if (a === 'cheatGold') {
        S.credits += 1000000;
        Game.save(); Game.emit('currency'); Game.emit('panels');
        Sound.play('coin');
        toast({ title: 'Pockets filled!', body: '+1,000,000 gold', art: Icons.get('coin') });
      } else if (a === 'wonder') {
        Game.startWonder();
        closeSheet();
      } else if (a === 'reset') {
        if (!resetArmed) {
          resetArmed = true;
          renderSheet(false);
          setTimeout(() => { if (resetArmed) { resetArmed = false; if (sheetMode === 'settings') renderSheet(false); } }, 4000);
        } else {
          resetArmed = false;
          Game.reset();
          buildGarden();
          renderSheet(true);
          toast({ title: 'Fresh soil', body: 'The garden has been reset', art: Icons.get('sprout') });
        }
      }
    }
  });

  $('#sheetClose').addEventListener('click', closeSheet);
  el.scrim.addEventListener('click', closeSheet);

  el.rail.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-boost]');
    if (!chip) return;
    if (Game.activateBoost(chip.dataset.boost)) {
      const c = FX.centerOf(chip);
      FX.sparks(c.x, c.y, 12, '#ffe066');
      FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
      renderRail();
    }
  });

  el.dock.addEventListener('click', (e) => {
    const b = e.target.closest('.dock-btn');
    if (!b) return;
    if (sheetMode === b.dataset.tab) closeSheet();
    else openSheet(b.dataset.tab);
  });

  $('#btnSettings').addEventListener('click', () => openSheet('settings'));
  $('#btnBonuses').addEventListener('click', () => openSheet('bonuses'));
  el.questStrip.addEventListener('click', () => {
    Sound.resume();
    const id = el.questStrip.dataset.claim;
    if (id) Game.claimQuest(id);
    else openSheet('quests');
  });

  /* drag-to-dismiss */
  (() => {
    let startY = 0, lastY = 0, lastT = 0, dy = 0, dragging = false;
    const onDown = (e) => {
      if (!sheetMode) return;
      dragging = true;
      startY = lastY = e.clientY;
      lastT = performance.now();
      dy = 0;
      el.sheet.classList.add('dragging');
      el.sheetGrip.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      lastY = e.clientY;
      lastT = performance.now();
      el.sheet.style.transform = `translateY(${dy}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.sheet.classList.remove('dragging');
      el.sheet.style.transform = '';
      if (dy > 110) closeSheet();
    };
    el.sheetGrip.addEventListener('pointerdown', onDown);
    el.sheetGrip.addEventListener('pointermove', onMove);
    el.sheetGrip.addEventListener('pointerup', onUp);
    el.sheetGrip.addEventListener('pointercancel', onUp);
  })();

  /* ============ plot input ============ */
  function onPlotTap(idx, node) {
    Sound.resume();
    const cell = S.grid[idx];
    if (cell.locked) {
      if (!Game.plotAvailable(idx)) {
        const c = FX.centerOf(node);
        FX.float(c.x, c.y, `Level ${Game.plotUnlockLevel(idx)}`, '');
        return;
      }
      if (!Game.unlockPlot(idx)) {
        const c = FX.centerOf(node);
        FX.float(c.x, c.y, `Need ${fmt(Game.plotUnlockCost(idx))}`, '');
      }
      return;
    }
    if (!cell.seed) { openSheet('seeds', idx); return; }
    if (cell.ready) { Game.harvest(idx); return; }
    Game.hasten(idx);
    const c = FX.centerOf(node);
    FX.sparks(c.x, c.y + 10, 4, '#8ce99a');
    FX.haptic(6);
  }

  /* ============ coach marks ============ */
  let coachTarget = null;
  function showCoach(target, text) {
    coachTarget = target;
    el.coach.hidden = false;
    el.coach.innerHTML = `<div class="tip">${text}</div><div class="arrow"></div>`;
    placeCoach();
  }
  function placeCoach() {
    if (!coachTarget || el.coach.hidden) return;
    const r = coachTarget.getBoundingClientRect();
    el.coach.style.left = `${r.left + r.width / 2}px`;
    el.coach.style.top = `${Math.max(8, r.top - el.coach.offsetHeight - 6)}px`;
  }
  function hideCoach() {
    coachTarget = null;
    el.coach.hidden = true;
  }
  function refreshCoach() {
    if (sheetMode) { el.coach.hidden = true; return; }
    if (!S.seen.intro) {
      if (coachTarget !== flowerBtn) showCoach(flowerBtn, 'Tap the flower!');
      el.coach.hidden = false;
    } else if (!S.seen.plot) {
      const free = S.grid.findIndex((c) => !c.locked && !c.seed);
      if (free === -1) { hideCoach(); return; }
      const node = plotEls[free] && plotEls[free].root;
      if (node && coachTarget !== node) showCoach(node, 'Plant a seed here');
      el.coach.hidden = false;
    } else {
      hideCoach();
      return;
    }
    placeCoach();
  }

  /* ============ dock attention dots ============ */
  function updateDockDots() {
    const canUpgrade = CORE_UPGRADES.concat(PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked).map((p) => p.key))
      .some((k) => !Game.upgradeMaxed(k) && S.credits >= Game.upgradePrice(k));
    const canDecor = DATA.decor.some((d) => {
      const pot = d.currency === 'gems' ? S.gems : S.credits;
      return pot >= d.cost;
    });
    const canHive = Game.jarsWaiting() > 0 || (!Game.hiveCount() && S.credits >= Game.nextHiveCost());
    const canBrew = Object.keys(S.goods).length > 0 || CRAFT_RECIPES.some((r) => Game.canCraft(r));
    const map = { upgrades: canUpgrade, apiary: canHive, craft: canBrew, shop: canDecor };
    $$('.dock-btn', el.dock).forEach((b) => {
      const dot = $('.dock-dot', b);
      const show = map[b.dataset.tab] && sheetMode !== b.dataset.tab;
      dot.hidden = !show;
    });
  }

  /* ============ wonder ============ */
  function showBanner(title, sub, ms = 2200) {
    el.banner.innerHTML = `<div class="bg"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
    el.banner.classList.remove('out');
    el.banner.classList.add('show');
    setTimeout(() => {
      el.banner.classList.add('out');
      setTimeout(() => el.banner.classList.remove('show', 'out'), 400);
    }, ms);
  }

  Game.on('wonder', ({ active }) => {
    if (active) {
      el.game.classList.add('wonder');
      showBanner('WONDER!', WONDER.lines[(Math.random() * WONDER.lines.length) | 0], 2600);
      Sound.play('wonder');
      FX.shake(10, 0.5);
      FX.haptic([30, 40, 30, 40, 60]);
      const c = FX.centerOf(flowerBtn);
      FX.rainbowBurst(c.x, c.y);
      for (let i = 0; i < 5; i += 1) {
        setTimeout(() => FX.confetti(Math.random() * window.innerWidth, window.innerHeight * 0.35, 20), i * 220);
      }
      faceReact('wow');
      say('wonder', true);
    } else {
      el.game.classList.remove('wonder');
      showBanner('Wonder over', 'Back to the quiet garden', 1500);
    }
  });

  /* ============ tap-triggered garden proc FX ============
     Each of these is rare on purpose (see docs/10-decision-log.md) — the
     animation is what has to carry the "you just won something" feeling,
     since the numbers themselves are small and infrequent. All three rebuild
     their DOM/animation state from scratch on every call rather than
     toggling a persistent class, so a retrigger on the same target (possible
     at high Quick Grip speeds) always restarts cleanly instead of looking
     like a dud. */

  function triggerRainFX(v, shaved) {
    if (!v) return;
    v.root.querySelectorAll('.rain-cloud').forEach((n) => n.remove());
    v.inner.querySelectorAll('.rain-drops').forEach((n) => n.remove());

    const cloud = document.createElement('div');
    cloud.className = 'rain-cloud';
    cloud.innerHTML = '<i></i><i></i><i></i>';
    v.root.appendChild(cloud);
    setTimeout(() => cloud.remove(), 950);

    const drops = document.createElement('div');
    drops.className = 'rain-drops';
    for (let i = 0; i < 12; i += 1) {
      const d = document.createElement('span');
      d.className = 'rain-drop';
      d.style.setProperty('--x', `${rnd(8, 92).toFixed(0)}%`);
      d.style.setProperty('--delay', `${rnd(0.1, 0.45).toFixed(2)}s`);
      d.style.setProperty('--dur', `${rnd(0.4, 0.6).toFixed(2)}s`);
      d.style.setProperty('--fall', `${rnd(80, 100).toFixed(0)}%`);
      drops.appendChild(d);
    }
    v.inner.appendChild(drops);
    setTimeout(() => drops.remove(), 1100);

    Sound.play('rainDance');

    setTimeout(() => {
      v.inner.classList.remove('watered'); void v.inner.offsetWidth; v.inner.classList.add('watered');
      v.bar.classList.remove('flash'); void v.bar.offsetWidth; v.bar.classList.add('flash');
      v.slot.classList.remove('perk'); void v.slot.offsetWidth; v.slot.classList.add('perk');
      const pc = FX.centerOf(v.root);
      FX.sparks(pc.x, pc.y, 6, '#74c0fc');
      FX.floatAt(v.root, `${shaved.toFixed(1)}s faster!`, 'water');
    }, 560);
  }

  function triggerBeeFX() {
    const c = FX.centerOf(flowerBtn);
    const bee = document.createElement('div');
    bee.className = 'bee-fly';
    bee.innerHTML = Icons.get('bee');
    bee.style.setProperty('--cx', `${c.x}px`);
    bee.style.setProperty('--cy', `${c.y}px`);
    bee.style.setProperty('--ex', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--ey', `${rnd(-170, -90).toFixed(0)}px`);
    bee.style.setProperty('--xx', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--xy', `${rnd(90, 170).toFixed(0)}px`);
    document.body.appendChild(bee);
    setTimeout(() => bee.remove(), 1000);

    Sound.play('beeSwarm');

    setTimeout(() => {
      FX.sparks(c.x, c.y - 6, 5, '#ffc93c');
      FX.floatAt(flowerBtn, '+1 Honey', 'bee');
    }, 430);
  }

  function triggerLadybugFX(v) {
    if (!v) return;
    v.lucky.classList.add('show');
    v.lucky.classList.remove('land'); void v.lucky.offsetWidth; v.lucky.classList.add('land');
    setTimeout(() => v.lucky.classList.remove('land'), 650);

    const pc = FX.centerOf(v.root);
    FX.sparks(pc.x, pc.y - 6, 6, '#fa5252');
    FX.floatAt(v.root, 'Lucky spot!', 'lucky');
    Sound.play('ladybug');
  }

  /* ============ game events ============ */
  Game.on('currency', () => {
    if (sheetMode) syncAfford();
  });

  Game.on('quest', () => {
    const c = FX.centerOf(el.questStrip);
    FX.coins(c.x, c.y, 9);
    FX.stars(c.x, c.y, 9, '#4dabf7');
    FX.ring(c.x, c.y, '#4dabf7', 0.5, 120);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    renderQuestStrip();
    renderRail();
  });

  Game.on('levelup', ({ to, grants }) => {
    const c = FX.centerOf(el.questStrip);
    FX.confetti(c.x, c.y, 34);
    FX.shake(9, 0.4);
    FX.haptic([20, 40, 20, 40, 40]);
    Sound.play('levelup');
    const g = grants && grants[grants.length - 1];
    let body = 'The garden is growing.';
    if (g && g.seed) body = `${g.seed.name} seeds are in the picker.`;
    else if (g && g.plot != null) body = `Plot ${g.plot + 1} can be bought with coins.`;
    else if (g && g.hive) body = 'A new hive is waiting in the Apiary.';
    else if (g && g.decor) body = 'A new decoration was added to the garden.';
    else if (g && g.gems) body = `+${g.gems} gems`;
    else if (g && g.boost) {
      const b = DATA.boosters.find((x) => x.id === g.boost);
      body = b ? `${b.name} is waiting on the tray.` : 'A boost is waiting on the tray.';
    }
    toast({ title: `Level ${to}!`, body, art: Icons.get('star') });
    showBanner(`Level ${to}!`, body, 2000);
    renderQuestStrip();
    renderRail();
  });

  Game.on('tap', (p) => {
    const c = FX.centerOf(flowerBtn);
    FX.floatAt(flowerBtn, `+${fmt(p.gain)}`, p.crit ? 'crit' : '');
    FX.coins(c.x, c.y, p.crit ? 16 : 4);
    popWallet('credits');
    faceReact(p.crit ? 'crit' : 'tap');
    idleSince = Date.now() / 1000;
    if (p.crit) {
      FX.shake(7);
      FX.stars(c.x, c.y, 10, '#ffe066');
      FX.ring(c.x, c.y, '#ffe066', 0.5, 130);
      FX.haptic([12, 30, 22]);
      Sound.play('crit');
      say('crit');
    } else {
      FX.haptic(7);
      Sound.play('tap', p.combo);
      if (Math.random() < 0.06) say('tap');
    }
    if (p.gemDrop) {
      FX.floatAt(flowerBtn, '+1 Gem', 'gem');
      popWallet('gems');
    }
    if (p.rainDance) triggerRainFX(plotEls[p.rainDance.idx], p.rainDance.shaved);
    if (p.beeSwarm) triggerBeeFX();
    if (p.ladybug) triggerLadybugFX(plotEls[p.ladybug.idx]);
  });

  Game.on('plant', ({ idx, auto }) => {
    if (!S.seen.plot) {
      S.seen.plot = true;
      Game.save();
      hideCoach();
      el.game.classList.remove('onboard');
    }
    const v = plotEls[idx];
    if (!v) return;
    const c = FX.centerOf(v.root);
    FX.sparks(c.x, c.y + 8, 8, '#c99a6b');
    if (auto) {
      v.tag.classList.add('show');
      setTimeout(() => v.tag.classList.remove('show'), 1100);
    } else {
      Sound.play('plant');
      FX.haptic(10);
    }
    idleSince = Date.now() / 1000;
  });

  Game.on('harvest', (p) => {
    const v = plotEls[p.idx];
    const c = v ? FX.centerOf(v.root) : FX.centerOf(flowerBtn);
    const rk = p.rarity.key;
    FX.coins(c.x, c.y, rk === 'legend' ? 22 : rk === 'epic' ? 14 : rk === 'rare' ? 9 : 6);
    FX.float(c.x, c.y - 6, `+${fmt(p.payout)}`, rk === 'common' ? 'big' : rk);
    popWallet('credits');
    idleSince = Date.now() / 1000;

    if (rk === 'common') {
      Sound.play('harvest');
      FX.haptic(12);
    } else {
      const tint = { rare: '#4dabf7', epic: '#b197fc', legend: '#ffd43b' }[rk];
      FX.stars(c.x, c.y, rk === 'legend' ? 16 : 9, tint);
      FX.ring(c.x, c.y, tint, 0.6, 150);
      if (rk === 'legend') {
        FX.confetti(c.x, c.y, 34);
        FX.shake(9, 0.4);
        FX.haptic([20, 40, 20, 40, 40]);
        Sound.play('legend');
        say('legend', true);
      } else {
        FX.shake(rk === 'epic' ? 5 : 3);
        FX.haptic([10, 20, 14]);
        Sound.play(rk === 'epic' ? 'legend' : 'rare');
      }
      // Rare fires often enough that a toast would be noise; sparkles carry it.
      if (rk !== 'rare') {
        toast({
          title: `${p.rarity.label} ${p.seed.name}!`,
          body: `Worth ${fmt(p.payout)} coins`,
          art: Flora.head(p.seed, 26),
          kind: rk
        });
      }
    }
    if (p.gemDrop) { FX.float(c.x + 26, c.y - 20, '+1 Gem', 'gem'); popWallet('gems'); }
    if (p.repBonus) {
      FX.float(c.x, c.y - 40, `+${p.repBonus} Reputation`, 'big');
      renderQuestStrip();
    }
    if (p.luckyHarvest) {
      FX.sparks(c.x, c.y, 8, '#fa5252');
      FX.float(c.x, c.y + 18, 'Ladybug luck!', 'lucky');
    }
    if (Math.random() < 0.12) say('harvest');
  });

  Game.on('unlock', ({ idx }) => {
    const v = plotEls[idx];
    if (v) {
      const c = FX.centerOf(v.root);
      FX.confetti(c.x, c.y, 22);
      FX.ring(c.x, c.y, '#8ce99a', 0.6, 120);
    }
    Sound.play('unlock');
    FX.haptic([15, 30, 15]);
    say('unlock', true);
    toast({ title: 'Plot unlocked!', body: 'New ground to plant on', art: Icons.get('sprout') });
  });

  Game.on('purchase', ({ kind, def }) => {
    Sound.play(kind === 'booster' ? 'boost' : 'buy');
    FX.haptic(14);
    if (kind === 'booster' && def) {
      toast({ title: `${def.name} active!`, body: def.desc, art: Icons.get(def.icon), ms: 2400 });
    }
  });

  Game.on('deny', () => {
    Sound.play('deny');
    FX.shake(3, 0.16);
    FX.haptic(20);
    say('broke');
  });

  Game.on('grid', () => buildGarden());
  Game.on('panels', () => { if (sheetMode) renderSheet(false); });

  /* Countdowns tick in place; a full re-render would fight the player's taps. */
  function tickSheetTimers() {
    if (!sheetMode) return;
    $$('[data-countdown]', el.sheetBody).forEach((n) => {
      const left = Number(n.dataset.countdown) - Game.nowSeconds();
      n.textContent = left > 0 ? fmtTime(left) : 'a moment';
    });
  }

  /* refresh affordability styling without a full rebuild */
  function syncAfford() {
    $$('[data-buy]', el.sheetBody).forEach((node) => {
      const { buy: kind, key } = node.dataset;
      let can = false;
      if (kind === 'upgrade') can = !Game.upgradeMaxed(key) && S.credits >= Game.upgradePrice(key);
      else if (kind === 'decor') {
        const d = DATA.decor.find((x) => x.id === key);
        const pot = d.currency === 'gems' ? S.gems : S.credits;
        can = pot >= d.cost;
      }
      node.classList.toggle('affordable', can);
      const price = $('.price', node);
      if (price && !price.classList.contains('maxed')) {
        price.classList.toggle('ok', can);
        price.classList.toggle('no', !can);
      }
    });
    $$('[data-plant]', el.sheetBody).forEach((node) => {
      const s = Game.seedById(node.dataset.plant);
      if (!s || !Game.seedUnlocked(s.id)) {
        node.disabled = true;
        return;
      }
      const can = S.credits >= s.cost;
      node.disabled = !can;
      const go = $('.seed-go', node);
      if (go) go.innerHTML = Icons.get(can ? 'sprout' : 'lock');
    });
  }

  /* ============ main loop ============ */
  let last = performance.now();
  let comboAcc = 0;
  let railAcc = 0;
  let slowAcc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    Game.tick(dt);
    renderPlots();
    hudTick(dt);
    FX.step(dt);

    // combo decay, once per second (matches the original cadence)
    comboAcc += dt;
    if (comboAcc >= 1) {
      comboAcc -= 1;
      Game.decayCombo();
      const now2 = Date.now() / 1000;
      if (now2 - idleSince > 26 && !sheetMode) { say('idle'); idleSince = now2; }
    }
    const cp = S.tap.combo / S.tap.comboMax;
    comboRing.style.setProperty('--combo', cp.toFixed(3));
    comboRing.style.setProperty('--combo-op', (0.3 + cp * 0.7).toFixed(2));

    railAcc += dt;
    if (railAcc >= 0.25) { railAcc = 0; renderRail(); tickSheetTimers(); }

    slowAcc += dt;
    if (slowAcc >= 0.6) {
      slowAcc = 0;
      updateDockDots();
      refreshCoach();
      updateSky();
      if (sheetMode === 'settings') syncAfford();
    }

    requestAnimationFrame(frame);
  }

  /* ============ boot ============ */
  function boot() {
    Flora.injectDefs();
    Icons.hydrate(document);
    FX.init();
    FX.setMagnet('coin', el.walletCredits);

    const info = Game.load();
    if (!S.seen.plot && (S.stats.totalHarvests || S.grid.some((c) => c && c.seed))) {
      S.seen.plot = true;
      Game.save();
    }
    if (!S.seen.plot) el.game.classList.add('onboard');
    Sound.prefs.sfx = S.prefs.sfx;
    Sound.prefs.music = S.prefs.music;

    buildClouds();
    updateSky();
    buildGarden();
    sizeGarden();
    if (window.ResizeObserver) new ResizeObserver(sizeGarden).observe($('.stage'));
    renderRail();
    renderQuestStrip();
    Object.values(counters).forEach((c) => { c.disp = c.get(); c.node.textContent = fmt(c.disp); });

    el.game.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && flowerBtn) lookAt(e.clientX, e.clientY);
    });
    window.addEventListener('resize', () => { sizeGarden(); placeCoach(); });
    window.addEventListener('orientationchange', () => setTimeout(sizeGarden, 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden) Game.saveNow(); });
    window.addEventListener('pagehide', () => Game.saveNow());
    // unlock audio on the very first interaction
    const unlock = () => { Sound.init(); Sound.setSfx(S.prefs.sfx); Sound.setMusic(S.prefs.music); Sound.resume(); };
    window.addEventListener('pointerdown', unlock, { once: true });

    setTimeout(() => {
      if (info.migrated) {
        toast({ title: 'Progress restored', body: 'Your old garden came along', art: Icons.get('sprout') });
      }
      say('greet', true);
    }, 700);

    if (info.decorRefund) {
      const r = info.decorRefund;
      const parts = [];
      if (r.credits) parts.push(`${fmt(r.credits)} coins`);
      if (r.gems) parts.push(`${fmt(r.gems)} gems`);
      setTimeout(() => {
        toast({
          title: 'Decor is just for show now',
          body: `Refunded ${parts.join(' and ')} for what you paid.`,
          art: Icons.get('decor'),
          ms: 3600
        });
      }, info.migrated ? 1500 : 700);
    }

    if (info.progressionGrant) {
      const delay = (info.migrated ? 1500 : 700) + (info.decorRefund ? 1600 : 0);
      setTimeout(() => {
        toast({
          title: 'The garden remembers you',
          body: 'Your seeds and plots are still yours. Reputation now tracks how far you\'ve come.',
          art: Icons.get('sprout'),
          ms: 3600
        });
      }, delay);
    }

    if (info.ticketGrant) {
      const delay = (info.migrated ? 1500 : 700)
        + (info.decorRefund ? 1600 : 0)
        + (info.progressionGrant ? 1600 : 0);
      setTimeout(() => {
        toast({
          title: 'Tickets became gems',
          body: `Converted ${fmt(info.ticketGrant.tickets)} tickets into ${fmt(info.ticketGrant.gems)} gems.`,
          art: Icons.get('gem'),
          ms: 3600
        });
      }, delay);
    }

    requestAnimationFrame((t) => { last = t; frame(t); });
  }

  boot();
})();
