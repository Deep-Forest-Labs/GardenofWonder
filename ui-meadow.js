/* Garden Wonder — the Wild Meadow: a board on a hillside nobody mows.

   Draws from meadow.js, which knows nothing about the game. Reaches the rest of
   the UI through the `UI` global — see docs/02-architecture.md. Design in
   docs/25-world-map.md.

   THE RULE THIS FILE EXISTS TO KEEP, from the owner, 2026-08-25: share the
   grammar, never share the verb. The frame is the garden's — a board floating in
   a scene, the talking flower in the middle, eight cells around it, pets at the
   bottom, dock below — so anyone who has played the garden already knows where
   to look and what is tappable. The VERB is different: garden cells are
   temporary (plant, grow, harvest, empty) and meadow cells are permanent (place
   a thing once and it stays). Farming against building, on one board shape.

   The first version of this room was a diorama — objects scattered over a
   hillside, each learned by tapping it — and it read as a different game. */

(() => {
  const { $, $$, S, el, fmt } = UI;

  const DOCK_H = 96;
  let open = false;
  let sceneSky = null;
  let mode = 'visit';                 // 'visit' | 'move'
  let moving = -1;                    // cell picked up in move mode

  const DOCK = [
    { id: 'collect', icon: 'honey', label: 'Collect' },
    { id: 'move', icon: 'hand', label: 'Move' },
    { id: 'keepers', icon: 'sprout', label: 'Keepers' },
    { id: 'shelf', icon: 'book', label: 'Shelf' }
  ];

  const skyNow = () => (Game.isNight() ? 'moon' : 'sun');
  const ico = (n) => Icons.get(n);

  /* A jar takes the colour of the bloom it came from, but has to read as HONEY
     first: Daisy's petals are pure white, and a white jar is indistinguishable
     from an empty shelf slot. The bloom TINTS an amber base. */
  const AMBER = [255, 176, 42];
  function mixAmber(hex, k) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return `rgb(${AMBER.join(',')})`;
    const to = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return `rgb(${to.map((v, i) => Math.round(AMBER[i] * (1 - k) + v * k)).join(',')})`;
  }
  const jarFor = (seedId) => {
    const sd = Game.seedById(seedId);
    return Meadow.jar(
      sd ? mixAmber(sd.art.c1, 0.55) : 'rgb(255,176,42)',
      sd ? mixAmber(sd.art.c2 || sd.art.c1, 0.3) : '#ffe9a8'
    );
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

  /** Keepers stand in scene coordinates, so they need the mapping the Hollow's
      creatures already use — the scene is drawn with `slice`, and a percentage
      of the container stops agreeing with a position in the art. */
  function placeKeepers() {
    const svg = $('.meadow-scene', el.meadow);
    if (!svg || !svg.getScreenCTM) return;
    const m = svg.getScreenCTM();
    if (!m) return;
    const box = el.meadow.getBoundingClientRect();
    $$('[data-keeper-slot]', el.meadow).forEach((node, i) => {
      const pt = Meadow.KEEPERS[i];
      if (!pt) return;
      const w = Meadow.KEEPER_SIZE * m.a;
      node.style.width = `${w}px`;
      node.style.height = `${w}px`;
      node.style.left = `${pt.x * m.a + m.e - box.left - w / 2}px`;
      node.style.top = `${pt.y * m.d + m.f - box.top - w / 2}px`;
    });
  }

  /** A perfect square in whatever the stage row offers — the garden's rule. */
  function sizeBoard() {
    const frame = $('#meadowFrame');
    const board = $('#meadowBoard');
    if (!frame || !board) return;
    const r = frame.getBoundingClientRect();
    const side = Math.max(120, Math.floor(Math.min(r.width, r.height)));
    board.style.width = `${side}px`;
    board.style.height = `${side}px`;
  }

  /* ---------------- the board ---------------- */

  const cellEls = new Map();
  const keeperEls = new Map();

  /* Built ONCE and updated in place. Rebuilding on the slow tick recreated every
     node unsized for a frame, which is what made the pets flash. */
  function buildBoard() {
    cellEls.clear();
    keeperEls.clear();
    const board = $('#meadowBoard');
    board.innerHTML = '';
    for (let i = 0; i < MEADOW.cells; i += 1) {
      // The flower takes the middle of the 3x3, exactly as it does in the garden.
      if (i === 4) {
        const f = document.createElement('button');
        f.type = 'button';
        f.className = 'flower-btn mw-flower';
        f.id = 'meadowFlower';
        f.setAttribute('aria-label', 'Tap the talking flower');
        f.innerHTML = Flora.talkingFlower();
        board.appendChild(f);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mw-cell';
      b.dataset.cell = String(i);
      b.dataset.look = '';
      board.appendChild(b);
      cellEls.set(i, b);
    }
    const bench = $('#meadowKeepers');
    bench.innerHTML = '';
    Meadow.KEEPERS.forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mw-keeper';
      b.dataset.keeperSlot = String(i);
      b.dataset.look = '';
      bench.appendChild(b);
      keeperEls.set(i, b);
    });
    UI.bindFlower($('#meadowFlower'));
  }

  function syncCell(i) {
    const node = cellEls.get(i);
    if (!node) return;
    const c = Game.cellAt(i);
    const look = c ? (c.kind === 'hive' ? 'hive' : `t:${c.type}`) : 'empty';
    if (node.dataset.look !== look) {
      node.dataset.look = look;
      if (!c) node.innerHTML = Meadow.emptyCell();
      else if (c.kind === 'hive') node.innerHTML = `${Meadow.hive()}<span class="mw-jar-badge" hidden></span>`;
      else {
        const t = meadowTender(c.type);
        node.innerHTML = Meadow.tender(c.type, t ? t.tint : '#8ce99a');
      }
    }
    let cls = 'mw-cell';
    if (!c) cls += S.credits >= Game.nextHiveCost() ? ' empty can' : ' empty';
    else if (c.kind === 'hive') {
      const jars = c.jars.length;
      cls += ` hive${jars ? ' ready' : ''}${jars >= Game.hiveCapacity(i) ? ' full' : ''}`;
      const badge = $('.mw-jar-badge', node);
      if (badge) { badge.hidden = !jars; if (jars) badge.textContent = jars; }
    } else cls += ' tender';
    if (mode === 'move') cls += moving === i ? ' picked' : ' movable';
    node.className = cls;

    const t = c && c.kind === 'tender' ? meadowTender(c.type) : null;
    node.setAttribute('aria-label', c
      ? (c.kind === 'hive' ? `Hive, ${c.jars.length} jars` : (t ? t.name : 'Tender'))
      : `Empty plot, ${fmt(Game.nextHiveCost())} coins for a hive`);
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
    if (!cellEls.size) buildBoard();
    for (let i = 0; i < MEADOW.cells; i += 1) syncCell(i);
    Meadow.KEEPERS.forEach((k, i) => syncKeeper(i));

    // Bees exist because hives do. An empty board is a silent meadow.
    const want = Math.min(6, Game.hiveCount() * 2);
    const swarm = $('#meadowBees');
    if (swarm.childElementCount !== want) {
      const starts = [[16, 40], [58, 26], [30, 58], [70, 48], [44, 32], [22, 52]];
      let out = '';
      for (let i = 0; i < want; i += 1) {
        const [x, y] = starts[i % starts.length];
        out += `<i class="mw-bee" style="--i:${i};--x:${x}%;--y:${y}%;--dur:${7 + (i % 4) * 2.4}s">${Meadow.bee()}</i>`;
      }
      swarm.innerHTML = out;
    }

    const waiting = Game.jarsWaiting();
    const note = Game.hiveCount()
      ? `<span>${ico('sprout')}Pollination <b>+${Math.round(Game.pollination() * 100)}%</b></span>
         <span>${ico('honey')}<b>${waiting}</b> waiting</span>`
      : '<span>Put a hive on the bank and the bees will find the garden.</span>';
    const noteEl = $('#meadowNote');
    if (noteEl.dataset.look !== note) { noteEl.dataset.look = note; noteEl.innerHTML = note; }

    $$('[data-dock]', el.meadow).forEach((b) => {
      b.classList.toggle('on', b.dataset.dock === mode);
      const dot = $('.dock-dot', b);
      if (dot) dot.hidden = !(b.dataset.dock === 'collect' && waiting > 0);
    });
    requestAnimationFrame(() => { sizeBoard(); placeKeepers(); });
  }

  /* ---------------- verbs ---------------- */

  function tapCell(i) {
    const c = Game.cellAt(i);

    /* Moving is free, and it is a mode rather than a drag: the same shape the
       Hollow's Loadout uses, and a drag would fight the swipe out to the map. */
    if (mode === 'move') {
      if (moving < 0) {
        if (!c) { Sound.play('deny'); return; }
        moving = i;
        Sound.play('tap');
      } else if (moving === i) {
        moving = -1;
        Sound.play('tap');
      } else if (Game.moveCell(moving, i)) {
        moving = -1;
        Sound.play('buy');
        FX.haptic(8);
      }
      render();
      return;
    }

    if (!c) { UI.openSheet('build', i); return; }

    if (c.kind === 'tender') {
      const t = meadowTender(c.type);
      Sound.play('tap');
      if (t) UI.toast({ title: t.name, body: t.desc, art: ico('sprout') });
      return;
    }

    const got = Game.collectHive(i);
    if (!got) {
      // Nothing to take yet — say what its neighbours are doing for it instead.
      Sound.play('tap');
      const helped = Game.meadowNeighbours(i)
        .map((n) => Game.cellAt(n))
        .filter((x) => x && x.kind === 'tender').length;
      UI.toast({
        title: 'Hive',
        body: helped
          ? `${helped} neighbour${helped > 1 ? 's helping' : ' helping'} — a jar every ${UI.fmtTime(Game.hiveInterval(i))}.`
          : `A jar every ${UI.fmtTime(Game.hiveInterval(i))}. Put something beside it.`,
        art: ico('hive')
      });
      return;
    }
    const node = cellEls.get(i);
    const ctr = FX.centerOf(node);
    FX.coins(ctr.x, ctr.y, Math.min(12, got.jars.length + 2));
    FX.sparks(ctr.x, ctr.y, 12, '#ffc94a');
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
    if (id === 'move') {
      mode = mode === 'move' ? 'visit' : 'move';
      moving = -1;
      Sound.play('open');
      render();
      return;
    }
    if (id === 'collect') {
      const got = Game.collectAllHives();
      if (!got || !got.length) { Sound.play('deny'); return; }
      const ctr = FX.centerOf($('#meadowBoard', el.meadow));
      FX.coins(ctr.x, ctr.y, 14);
      FX.stars(ctr.x, ctr.y, 8, '#ffe066');
      Sound.play('collect');
      FX.haptic(10);
      render();
      return;
    }
    if (id === 'keepers') { UI.openSheet('keepers'); return; }
    if (id === 'shelf') UI.openSheet('shelf');
  }

  /* ---------------- enter / leave ---------------- */

  function enter() {
    if (open) return;
    open = true;
    mode = 'visit';
    moving = -1;
    el.game.classList.add('in-meadow');
    el.meadow.hidden = false;
    buildBoard();
    render();
    requestAnimationFrame(() => { sizeBoard(); placeKeepers(); });
    Sound.play('open');
    UI.hideCoach();
  }

  function leave() {
    if (!open) return;
    open = false;
    mode = 'visit';
    el.game.classList.remove('in-meadow');
    el.meadow.hidden = true;
    UI.bindFlower(null);
  }

  /* ---------------- build ---------------- */

  function build() {
    el.meadow.innerHTML = `
      <div class="meadow-scene-host" id="meadowScene"></div>
      <div class="mw-bees" id="meadowBees" aria-hidden="true"></div>
      <div class="mw-note" id="meadowNote"></div>
      <main class="mw-stage">
        <div class="mw-frame" id="meadowFrame">
          <div class="mw-board" id="meadowBoard" aria-label="The hive bank"></div>
        </div>
      </main>
      <!-- Outside the stage on purpose: keepers are positioned in SCENE
           coordinates against the layer, and nesting them in a padded, offset
           box silently shifted every one of them. -->
      <div class="mw-keeper-bank" id="meadowKeepers" aria-label="Keepers"></div>
      <div class="mw-exit"><i></i><span>Swipe down for the map</span></div>
      <nav class="dock mw-dock">${DOCK.map((d) => `
        <button class="dock-btn" type="button" data-dock="${d.id}">
          <span class="dock-ico">${ico(d.icon)}</span>
          <span class="dock-label">${d.label}</span>
          <span class="dock-dot" hidden></span>
        </button>`).join('')}</nav>`;

    el.meadow.addEventListener('click', (e) => {
      const cell = e.target.closest('[data-cell]');
      if (cell) { tapCell(Number(cell.dataset.cell)); return; }
      const slot = e.target.closest('[data-keeper-slot]');
      if (slot) { tapKeeperSlot(Number(slot.dataset.keeperSlot)); return; }
      const dock = e.target.closest('[data-dock]');
      if (dock) dockTap(dock.dataset.dock);
    });

    /* Swipe down goes back out to the map. Cells, the flower and the dock all
       act on the way down, so a drag begun on one has already spent itself. */
    let y0 = null;
    let x0 = null;
    el.meadow.addEventListener('pointerdown', (e) => {
      y0 = null;
      if (e.target.closest('[data-cell],[data-keeper-slot],.dock,.mw-exit,.flower-btn')) return;
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

    window.addEventListener('resize', () => {
      if (!open) return;
      sizeBoard();
      placeKeepers();
    });
  }

  build();

  UI.enterMeadow = enter;
  UI.leaveMeadow = leave;
  UI.meadowOpen = () => open;
  UI.renderMeadow = render;
  UI.meadowJar = jarFor;
})();
