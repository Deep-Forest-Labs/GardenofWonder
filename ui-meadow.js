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
  let sceneSky = null;               // sky + measured size, so a resize redraws
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

  /* The scene is drawn at the room's REAL size, not at the 390x844 the art was
     composed against — sliced into a desktop window that composition scaled by
     four and the grass alone read as a hedge. So the sky has to be rebuilt when
     the window changes shape, and memoised against the size as well as the sky
     or every resize event throws the whole backdrop away. */
  function syncScene() {
    const host = $('#meadowScene');
    if (!host) return;
    const sky = skyNow();
    const r = el.meadow.getBoundingClientRect();
    const w = Math.max(320, Math.round(r.width));
    const h = Math.max(480, Math.round(r.height));
    const dockEl = $('.mw-dock', el.meadow);
    const dock = dockEl ? Math.max(0, Math.round(r.bottom - dockEl.getBoundingClientRect().top)) : DOCK_H;
    const key = `${sky}|${w}|${h}|${dock}`;
    if (sceneSky === key && host.firstChild) return;
    sceneSky = key;
    el.meadow.dataset.sky = sky;
    host.innerHTML = Meadow.scene({ width: w, height: h, dockHeight: dock, sky });
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
    // A keeper is measured against the board, so the two never drift apart.
    const bank = $('#meadowKeepers');
    if (bank) bank.style.setProperty('--keeper-size', `${Math.round(side * 0.2)}px`);
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
      /* The cobbles are the cell's floor and never change; only the thing
         standing on them does. Keeping them in their own child means a hive
         going down does not redraw the ground it lands on. */
      b.innerHTML = `<span class="mw-cell-floor">${Meadow.cobbleFloor(i)}</span>
        <span class="mw-cell-obj"></span>
        <span class="mw-lock">${ico('lock')}<span class="mw-lock-cost"></span></span>
        <span class="mw-jar-badge" hidden></span>`;
      board.appendChild(b);
      cellEls.set(i, b);
    }
    const bench = $('#meadowKeepers');
    bench.innerHTML = '';
    for (let i = 0; i < Game.keeperSlots(); i += 1) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mw-keeper';
      b.dataset.keeperSlot = String(i);
      /* Not '' — an empty slot's id IS '', so the look never differed and the
         sprout that marks a free stand has never once been drawn. */
      b.dataset.look = '?';
      b.innerHTML = `<span class="mw-keeper-ground">${Meadow.keeperSpot()}</span>
        <span class="mw-keeper-obj"></span>`;
      bench.appendChild(b);
      keeperEls.set(i, b);
    }
    UI.bindFlower($('#meadowFlower'));
  }

  function syncCell(i) {
    const node = cellEls.get(i);
    if (!node) return;
    const c = Game.cellAt(i);
    const locked = Game.cellLocked(i);
    const look = locked ? 'locked' : (c ? (c.kind === 'hive' ? 'hive' : `t:${c.type}`) : 'empty');
    if (node.dataset.look !== look) {
      node.dataset.look = look;
      const art = $('.mw-cell-obj', node);
      if (locked) art.innerHTML = '';
      else if (!c) art.innerHTML = Meadow.emptyCell();
      else if (c.kind === 'hive') art.innerHTML = Meadow.hive();
      else {
        const t = meadowTender(c.type);
        art.innerHTML = Meadow.tender(c.type, t ? t.tint : '#8ce99a');
      }
    }
    let cls = 'mw-cell';
    const badge = $('.mw-jar-badge', node);
    /* The garden's two-stage read, restated: below the level it names the level,
       at the level it names the price. */
    if (locked) {
      const gated = !Game.cellAvailable(i);
      const cost = Game.cellUnlockCost(i);
      cls += gated ? ' locked gated' : ' locked';
      if (!gated && S.credits >= cost) cls += ' can';
      const chip = $('.mw-lock-cost', node);
      const label = gated ? `Lv ${Game.cellUnlockLevel(i)}` : `${ico('coin')}<span>${fmt(cost)}</span>`;
      if (chip && chip.dataset.look !== label) { chip.dataset.look = label; chip.innerHTML = label; }
      node.className = cls;
      if (badge) badge.hidden = true;
      node.setAttribute('aria-label', gated
        ? `Locked land, reaches level ${Game.cellUnlockLevel(i)}`
        : `Locked land, ${fmt(cost)} coins`);
      return;
    }
    if (!c) cls += S.credits >= Game.nextHiveCost() ? ' empty can' : ' empty';
    else if (c.kind === 'hive') {
      const jars = c.jars.length;
      cls += ` hive${jars ? ' ready' : ''}${jars >= Game.hiveCapacity(i) ? ' full' : ''}`;
      if (jars) badge.textContent = jars;
      badge.hidden = !jars;
    } else cls += ' tender';
    if (!c || c.kind !== 'hive') badge.hidden = true;
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
      $('.mw-keeper-obj', node).innerHTML = def
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
    for (let i = 0; i < Game.keeperSlots(); i += 1) syncKeeper(i);

    // Bees exist because hives do. An empty board is a silent meadow.
    const want = Math.min(6, Game.hiveCount() * 2);
    const swarm = $('#meadowBees');
    if (swarm.childElementCount !== want) {
      const starts = [[14, 62], [60, 54], [28, 72], [72, 64], [44, 58], [20, 70]];
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
    requestAnimationFrame(sizeBoard);
  }

  /* ---------------- verbs ---------------- */

  function tapCell(i) {
    const c = Game.cellAt(i);

    /* Moving is free, and it is a mode rather than a drag: the same shape the
       Hollow's Loadout uses, and a drag would fight the swipe out to the map. */
    if (Game.cellLocked(i)) {
      if (!Game.cellAvailable(i)) {
        const p = FX.centerOf(cellEls.get(i));
        FX.float(p.x, p.y, `Level ${Game.cellUnlockLevel(i)}`, '');
        Sound.play('deny');
        return;
      }
      if (!Game.unlockCell(i)) {
        const p = FX.centerOf(cellEls.get(i));
        FX.float(p.x, p.y, `Need ${fmt(Game.cellUnlockCost(i))}`, '');
      }
      render();
      return;
    }

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
    requestAnimationFrame(sizeBoard);
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
      <!-- One column, capped and centred exactly as the .ui grid is, because a
           place layer sits outside .ui and inherits none of it. Without this the
           meadow is the only screen in the game that fills a desktop window. -->
      <div class="mw-ui">
        <div class="mw-note" id="meadowNote"></div>
        <main class="mw-stage">
          <div class="mw-frame" id="meadowFrame">
            <div class="mw-board" id="meadowBoard" aria-label="The hive bank"></div>
          </div>
          <!-- The yard the stage reserves, the way the garden reserves one so a
               creature never stands on a plot. -->
          <div class="mw-keeper-bank" id="meadowKeepers" aria-label="Keepers"></div>
        </main>
        <button class="mw-exit" type="button" data-mwexit="1"><i></i><span>Swipe up for the garden</span></button>
        <nav class="dock mw-dock">${DOCK.map((d) => `
        <button class="dock-btn" type="button" data-dock="${d.id}">
          <span class="dock-ico">${ico(d.icon)}</span>
          <span class="dock-label">${d.label}</span>
          <span class="dock-dot" hidden></span>
        </button>`).join('')}</nav>
      </div>`;

    el.meadow.addEventListener('click', (e) => {
      if (dragged) { dragged = false; return; }
      const cell = e.target.closest('[data-cell]');
      if (cell) { tapCell(Number(cell.dataset.cell)); return; }
      const slot = e.target.closest('[data-keeper-slot]');
      if (slot) { tapKeeperSlot(Number(slot.dataset.keeperSlot)); return; }
      const dock = e.target.closest('[data-dock]');
      if (dock) { dockTap(dock.dataset.dock); return; }
      /* The pill is the Hollow's twin and the Hollow's is tappable, so this one
         has to be too — same mark, same meaning. The swipe is still the fast
         path once it is learned. */
      if (e.target.closest('[data-mwexit]')) { leave(); Sound.play('close'); }
    });

    /* Swipe up goes back to the garden.

       Since the owner re-ruled the axis on 2026-08-30 the meadow is entered by
       dragging the world DOWN, so its exit is the opposite swipe — and it is the
       only way out, because the map that used to hold it is gone.

       The board covers nearly the whole room, so excluding cells from the
       gesture left it working only on the slivers of scene either side — which
       is not a gesture, it is a hidden control. Cells and keeper stands act on
       `click`, NOT on pointerdown, so a drag may safely start on one and simply
       withhold the click at the end. The flower, the dock and the exit chip stay
       out: the flower pays on pointerdown and that tap latency is load-bearing.

       See the traps in docs/HANDOFF.md — this is the same distinction that lets
       the garden's swipe start on the background but never on a plot. */
    let y0 = null;
    let x0 = null;
    let pid = null;
    let dragged = false;
    el.meadow.addEventListener('pointercancel', () => { y0 = null; pid = null; });
    el.meadow.addEventListener('pointerdown', (e) => {
      y0 = null;
      pid = null;
      dragged = false;
      if (e.target.closest('.dock,.mw-exit,.flower-btn')) return;
      y0 = e.clientY;
      x0 = e.clientX;
      pid = e.pointerId;
    });
    el.meadow.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      /* Only the finger that started it — the same two-thumb hole the garden's
         swipe closed, and this room is one thumb-tap away from a full board. */
      if (pid !== null && e.pointerId !== pid) return;
      const dy = y0 - e.clientY;
      const dx = Math.abs(e.clientX - x0);
      y0 = null;
      if (dy > 70 && dy > dx) { dragged = true; leave(); return; }
      // Anything that moved is a drag that fell short, never a tap on a cell.
      if (Math.abs(dy) > 14 || dx > 14) dragged = true;
    });

    window.addEventListener('resize', () => {
      if (!open) return;
      sizeBoard();
      syncScene();
    });
  }

  build();

  UI.enterMeadow = enter;
  UI.leaveMeadow = leave;
  UI.meadowOpen = () => open;
  UI.renderMeadow = render;
  UI.meadowJar = jarFor;
  UI.meadowCellEl = (i) => cellEls.get(i) || null;
})();
