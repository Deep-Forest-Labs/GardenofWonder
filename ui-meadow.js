/* Garden Wonder — the Wild Meadow: the hive bank you travel into.

   Draws from meadow.js, which knows nothing about the game, and puts the real
   hives, keepers and jars into its spots. Reaches the rest of the UI through the
   `UI` global — see docs/02-architecture.md. Design in docs/25-world-map.md.

   The room's job is to make a producer feel like a PLACE. What does that:
   spots that are visibly empty until you buy them, bees that only exist because
   a hive does, jars that carry the colour of the bloom they came from, and a
   bank at the bottom where your creatures actually stand. */

(() => {
  const { $, $$, S, el, fmt } = UI;

  const DOCK_H = 96;
  let open = false;
  let sceneSky = null;
  let mode = 'visit';                 // 'visit' | 'keepers' — what a tap means

  const DOCK = [
    { id: 'collect', icon: 'honey', label: 'Collect' },
    { id: 'keepers', icon: 'sprout', label: 'Keepers' },
    { id: 'shelf', icon: 'book', label: 'Shelf' },
    { id: 'stores', icon: 'coin', label: 'Stores' }
  ];

  const skyNow = () => (Game.isNight() ? 'moon' : 'sun');
  const ico = (n) => Icons.get(n);

  /* A jar takes the colour of the bloom it came from — the honey-follows-bloom
     rule made visible. But it has to read as HONEY first: Daisy's petals are pure
     white, and a white jar on a pale shelf is indistinguishable from an empty
     slot. So the bloom TINTS an amber base rather than replacing it. */
  const AMBER = [255, 176, 42];
  function mixAmber(hex, k) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return `rgb(${AMBER.join(',')})`;
    const to = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const out = to.map((v, i) => Math.round(AMBER[i] * (1 - k) + v * k));
    return `rgb(${out.join(',')})`;
  }
  function jarColours(seedId) {
    const sd = Game.seedById(seedId);
    if (!sd) return { fill: 'rgb(255,176,42)', glow: '#ffe9a8' };
    return { fill: mixAmber(sd.art.c1, 0.55), glow: mixAmber(sd.art.c2 || sd.art.c1, 0.3) };
  }
  const jarFor = (seedId) => {
    const c = jarColours(seedId);
    return Meadow.jar(c.fill, c.glow);
  };

  /* ---------------- scene ---------------- */

  function syncScene() {
    const sky = skyNow();
    const host = $('#meadowScene');
    if (sceneSky === sky && host.firstChild) return;
    sceneSky = sky;
    host.innerHTML = Meadow.scene({
      width: Meadow.VIEW.width, height: Meadow.VIEW.height, dockHeight: DOCK_H, sky
    });
  }

  /** Map a point in the scene's own coordinates to a pixel in the container.
      The scene is drawn with `slice`, so it is cropped on any screen that is not
      its design size — a percentage of the container stops agreeing with a
      position in the art. Same problem the Hollow already solved. */
  function place() {
    const svg = $('.meadow-scene', el.meadow);
    if (!svg || !svg.getScreenCTM) return;
    const m = svg.getScreenCTM();
    if (!m) return;
    const box = el.meadow.getBoundingClientRect();
    const put = (node, pt, size) => {
      const w = size * m.a;
      node.style.width = `${w}px`;
      node.style.height = `${w}px`;
      node.style.left = `${pt.x * m.a + m.e - box.left - w / 2}px`;
      node.style.top = `${pt.y * m.d + m.f - box.top - w / 2}px`;
    };
    $$('[data-spot]', el.meadow).forEach((node, i) => {
      if (Meadow.SPOTS[i]) put(node, Meadow.SPOTS[i], Meadow.HIVE_SIZE);
    });
    $$('[data-keeper-slot]', el.meadow).forEach((node, i) => {
      if (Meadow.KEEPERS[i]) put(node, Meadow.KEEPERS[i], Meadow.KEEPER_SIZE);
    });
  }

  /* ---------------- the bank ---------------- */

  /* Nodes are built ONCE and then updated in place. Rebuilding them on the slow
     tick meant every hive and every keeper was recreated unsized, drew for one
     frame at its natural size, and only got its real geometry from place() on
     the next frame — which is exactly the "pets flashing in and out every few
     seconds" the owner photographed. Same rule renderPlots() already follows:
     cache what was written and only touch the DOM on a real change. */
  const spotEls = new Map();
  const keeperEls = new Map();

  function buildBank() {
    spotEls.clear();
    keeperEls.clear();
    const bank = $('#meadowBank');
    const bench = $('#meadowKeepers');
    bank.innerHTML = '';
    bench.innerHTML = '';
    MEADOW.spots.forEach((sp) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mw-spot';
      b.dataset.spot = sp.id;
      b.dataset.look = '';
      bank.appendChild(b);
      spotEls.set(sp.id, b);
    });
    Meadow.KEEPERS.forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mw-keeper';
      b.dataset.keeperSlot = String(i);
      b.dataset.look = '';
      bench.appendChild(b);
      keeperEls.set(i, b);
    });
  }

  function syncSpot(sp) {
    const node = spotEls.get(sp.id);
    if (!node) return;
    const hive = Game.hiveAt(sp.id);
    const jars = hive ? hive.jars.length : 0;
    const full = hive && jars >= Game.hiveCapacity(hive);
    const can = S.credits >= Game.nextHiveCost();

    // The art only changes when a spot goes from empty to kept.
    const look = hive ? 'hive' : 'mark';
    if (node.dataset.look !== look) {
      node.dataset.look = look;
      node.innerHTML = (hive ? Meadow.hive(sp.tint) : Meadow.spotMark())
        + `<span class="mw-spot-tag">${sp.name}</span>`
        + '<span class="mw-jar-badge" hidden></span>';
    }
    node.className = hive
      ? `mw-spot has${jars ? ' ready' : ''}${full ? ' full' : ''}`
      : `mw-spot empty${can ? ' affordable' : ''}`;
    node.setAttribute('aria-label', hive
      ? `${sp.name}, ${jars} jars`
      : `${sp.name}, ${fmt(Game.nextHiveCost())} coins`);
    const badge = $('.mw-jar-badge', node);
    if (badge) {
      badge.hidden = !jars;
      if (jars) badge.textContent = jars;
    }
  }

  function syncKeeper(i) {
    const node = keeperEls.get(i);
    if (!node) return;
    const id = Game.keepers()[i] || '';
    const def = id ? Game.critterById(id) : null;
    if (node.dataset.look !== id) {
      node.dataset.look = id;
      node.innerHTML = def
        ? `${Critters.draw(def)}<span class="mw-keeper-tag">${def.name}</span>`
        : ico('sprout');
      if (def) node.dataset.keeper = id; else delete node.dataset.keeper;
    }
    node.className = def
      ? `mw-keeper${Game.critterAsleep(id) ? ' asleep' : ''}`
      : 'mw-keeper empty';
    node.setAttribute('aria-label', def ? def.name : 'Empty keeper spot');
  }

  function render() {
    if (!open) return;
    syncScene();
    if (!spotEls.size) buildBank();
    MEADOW.spots.forEach(syncSpot);
    Meadow.KEEPERS.forEach((k, i) => syncKeeper(i));

    /* Bees exist because hives do. With none kept, the meadow is quiet — which
       is the whole reason buying the first hive feels like something. */
    const want = Math.min(6, Game.hiveCount() * 2);
    const swarm = $('#meadowBees');
    if (swarm.childElementCount !== want) {
      /* Each starts somewhere different. Sharing a start point makes six bees
         fly as one clump, which reads as a bug rather than as a meadow. */
      const starts = [[16, 44], [58, 30], [30, 62], [70, 52], [44, 36], [22, 56]];
      let out = '';
      for (let i = 0; i < want; i += 1) {
        const [x, y] = starts[i % starts.length];
        out += `<i class="mw-bee" style="--i:${i};--x:${x}%;--y:${y}%;--dur:${7 + (i % 4) * 2.4}s">${Meadow.bee()}</i>`;
      }
      swarm.innerHTML = out;
    }

    /* Only the two numbers that say what this place is DOING to the rest of the
       game. The shelf has its own dock button, so its count was noise up here —
       and this strip sits below the HUD now rather than on top of it. */
    const waiting = Game.jarsWaiting();
    const note = Game.hiveCount()
      ? `<span>${ico('sprout')}Pollination <b>+${Math.round(Game.pollination() * 100)}%</b></span>
         <span>${ico('honey')}<b>${waiting}</b> waiting</span>`
      : '<span>Set a hive on the bank and the bees will find the garden.</span>';
    const noteEl = $('#meadowNote');
    if (noteEl.dataset.look !== note) {
      noteEl.dataset.look = note;
      noteEl.innerHTML = note;
    }

    $$('[data-dock]', el.meadow).forEach((b) => {
      b.classList.toggle('on', b.dataset.dock === mode);
      const dot = $('.dock-dot', b);
      if (dot) dot.hidden = !(b.dataset.dock === 'collect' && waiting > 0);
    });
    requestAnimationFrame(place);
  }

  /* ---------------- verbs ---------------- */

  function tapSpot(spotId) {
    const sp = meadowSpot(spotId);
    if (!sp) return;
    const hive = Game.hiveAt(spotId);

    if (!hive) {
      const cost = Game.nextHiveCost();
      if (Game.buyHive(spotId)) {
        const node = $(`[data-spot="${spotId}"]`, el.meadow);
        const c = FX.centerOf(node);
        FX.sparks(c.x, c.y, 16, sp.tint);
        FX.stars(c.x, c.y, 6, '#ffe066');
        Sound.play('quest');
        FX.haptic(12);
        UI.toast({ title: sp.name, body: sp.desc, art: ico('hive') });
        render();
      } else {
        Sound.play('deny');
        UI.toast({
          title: `${sp.name} — ${fmt(cost)}`,
          body: sp.desc,
          art: ico('hive')
        });
      }
      return;
    }

    const got = Game.collectHive(Game.state.apiary.hives.indexOf(hive));
    if (!got) {
      // Nothing to take yet: say what the spot is for instead of refusing silently.
      Sound.play('tap');
      UI.toast({ title: sp.name, body: sp.desc, art: ico('hive') });
      return;
    }
    const node = $(`[data-spot="${spotId}"]`, el.meadow);
    const c = FX.centerOf(node);
    FX.coins(c.x, c.y, Math.min(12, got.jars.length + 2));
    FX.sparks(c.x, c.y, 12, sp.tint);
    Sound.play('collect');
    FX.haptic(8);
    render();
  }

  function tapKeeperSlot(i) {
    const id = Game.keepers()[i];
    if (id) {
      const def = Game.critterById(id);
      Game.setKeeper(id, false);
      Sound.play('tap');
      if (def) UI.toast({ title: `${def.name} steps down`, body: 'Back to the garden.', art: ico('sprout') });
      render();
      return;
    }
    UI.openSheet('keepers');
  }

  function dockTap(id) {
    if (id === 'collect') {
      const got = Game.collectAllHives();
      if (!got || !got.jars) { Sound.play('deny'); return; }
      const c = FX.centerOf($('#meadowBank', el.meadow));
      FX.coins(c.x, c.y, 14);
      FX.stars(c.x, c.y, 8, '#ffe066');
      Sound.play('collect');
      FX.haptic(10);
      render();
      return;
    }
    if (id === 'keepers') { UI.openSheet('keepers'); return; }
    if (id === 'shelf') { UI.openSheet('shelf'); return; }
    if (id === 'stores') { UI.openSheet('stores'); return; }
  }

  /* ---------------- enter / leave ---------------- */

  function enter() {
    if (open) return;
    open = true;
    el.game.classList.add('in-meadow');
    el.meadow.hidden = false;
    buildBank();
    render();
    requestAnimationFrame(place);
    Sound.play('open');
    UI.hideCoach();
  }

  function leave() {
    if (!open) return;
    open = false;
    mode = 'visit';
    el.game.classList.remove('in-meadow');
    el.meadow.hidden = true;
  }

  /* ---------------- build ---------------- */

  function build() {
    el.meadow.innerHTML = `
      <div class="meadow-scene-host" id="meadowScene"></div>
      <div class="mw-bees" id="meadowBees" aria-hidden="true"></div>
      <div class="mw-bank" id="meadowBank"></div>
      <div class="mw-keeper-bank" id="meadowKeepers"></div>
      <div class="mw-note" id="meadowNote"></div>
      <div class="mw-exit"><i></i><span>Swipe down for the map</span></div>
      <nav class="dock mw-dock">${DOCK.map((d) => `
        <button class="dock-btn" type="button" data-dock="${d.id}">
          <span class="dock-ico">${ico(d.icon)}</span>
          <span class="dock-label">${d.label}</span>
          <span class="dock-dot" hidden></span>
        </button>`).join('')}</nav>`;

    el.meadow.addEventListener('click', (e) => {
      const spot = e.target.closest('[data-spot]');
      if (spot) { tapSpot(spot.dataset.spot); return; }
      const slot = e.target.closest('[data-keeper-slot]');
      if (slot) { tapKeeperSlot(Number(slot.dataset.keeperSlot)); return; }
      const dock = e.target.closest('[data-dock]');
      if (dock) dockTap(dock.dataset.dock);
    });

    /* Swipe down goes back out to the map — the same rule the whole ladder
       uses. Hives and the dock act on the way down, so a drag begun on one has
       already spent itself and leaving would do two things at once. */
    let y0 = null;
    let x0 = null;
    el.meadow.addEventListener('pointerdown', (e) => {
      y0 = null;
      if (e.target.closest('[data-spot],[data-keeper-slot],.dock,.mw-exit')) return;
      y0 = e.clientY;
      x0 = e.clientX;
    });
    el.meadow.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      const dx = Math.abs(e.clientX - x0);
      y0 = null;
      if (dy > 70 && dy > dx) { leave(); UI.enterMap('meadow'); }
    });

    window.addEventListener('resize', () => { if (open) place(); });
  }

  build();

  UI.enterMeadow = enter;
  UI.leaveMeadow = leave;
  UI.meadowOpen = () => open;
  UI.renderMeadow = render;
  UI.meadowJar = jarFor;
})();
