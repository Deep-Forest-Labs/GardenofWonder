/* Garden Wonder — the Hollow: the room under the garden where creatures live.

   Draws from hollow.js, which knows nothing about the game, and places real
   creatures into its spots. Reaches the rest of the UI through the `UI` global —
   see docs/02-architecture.md. Design in docs/22-creatures.md. */

(() => {
  const { $, $$, S, el } = UI;

  const DOCK_H = 96;
  let open = false;
  let sceneSky = null;                 // the sky the current scene was drawn for
  let mode = 'pet';                    // 'pet' | 'loadout' — what a tap on a creature means
  const petEls = new Map();            // creature id -> node, built once and kept

  /* The Hollow's own verbs. A per-place dock is also how places stop competing
     for the five slots the garden dock caps at. */
  const DOCK = [
    { id: 'feed', icon: 'honey', label: 'Feed' },
    { id: 'pet', icon: 'sprout', label: 'Pet' },
    { id: 'loadout', icon: 'star', label: 'Loadout' },
    { id: 'decorate', icon: 'decor', label: 'Decorate' }
  ];

  const skyNow = () => (Game.isNight() ? 'moon' : 'sun');

  /** Redraw the room only when the sky actually changes. Rebuilding it on every
      tick restarted every wisp and every drifting mote, which is what made the
      lights cut off harshly instead of fading. */
  function syncScene() {
    const sky = skyNow();
    if (sceneSky === sky) return;
    sceneSky = sky;
    $('#hollowScene').innerHTML = Hollow.scene({ dockHeight: DOCK_H, sky });
  }

  /** Map a point in the scene's own coordinates to a pixel inside the container.
      The scene is drawn with `slice`, so it is cropped on any screen that is not
      exactly its design size — a percentage of the container stops agreeing with
      a position in the art, which is why creatures drifted off their burrows. */
  function place() {
    const svg = $('.hollow-scene', el.hollow);
    if (!svg || !svg.getScreenCTM) return;
    const m = svg.getScreenCTM();
    if (!m) return;
    const box = el.hollow.getBoundingClientRect();
    const size = Hollow.PET_SIZE * m.a;
    let i = 0;
    petEls.forEach((node) => {
      const spot = Hollow.SPOTS[i];
      i += 1;
      if (!spot) return;
      const p = svg.createSVGPoint();
      p.x = spot.x;
      p.y = spot.y;
      const q = p.matrixTransform(m);
      node.style.left = `${q.x - box.left}px`;
      node.style.top = `${q.y - box.top}px`;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
    });
  }

  /** Build a creature's node once. Rebuilt every tick, its float and glow
      animations restarted constantly, which read as a hitch at the end of the
      loop. */
  function syncTenants() {
    const home = Game.crittersHome().slice(0, Hollow.SPOTS.length);
    const wrap = $('#hollowTenants');

    home.forEach((def) => {
      let node = petEls.get(def.id);
      if (!node) {
        node = document.createElement('button');
        node.className = 'hollow-pet';
        node.type = 'button';
        node.dataset.critter = def.id;
        node.setAttribute('aria-label', `${def.name}, a ${def.species}`);
        node.innerHTML = `${Critters.draw(def)}
          <span class="hollow-leaf" hidden>${Icons.get('sprout')}</span>
          <span class="hollow-gift" hidden>${Icons.get('gem')}</span>
          <span class="hollow-fed" hidden>${Icons.get('clover')}</span>
          <span class="hollow-name">${def.name}</span>`;
        wrap.appendChild(node);
        petEls.set(def.id, node);
      }
      // Only the badges change on a tick; touching anything else restarts motion.
      const tending = Game.critterTending(def.id);
      // Only a tender earns, and collecting happens in the garden — so this badge
      // now reads "there is something waiting for you upstairs".
      const gift = Game.keepsakesWaiting(def.id) > 0;
      const fed = Game.critterFed(def.id);
      const asleep = Game.critterAsleep(def.id);
      const leafEl = node.querySelector('.hollow-leaf');
      const giftEl = node.querySelector('.hollow-gift');
      const fedEl = node.querySelector('.hollow-fed');
      if (leafEl.hidden === tending) leafEl.hidden = !tending;
      if (giftEl.hidden === gift) giftEl.hidden = !gift;
      if (fedEl.hidden === fed) fedEl.hidden = !fed;
      if (node.classList.contains('tending') !== tending) node.classList.toggle('tending', tending);
      if (node.classList.contains('asleep') !== asleep) node.classList.toggle('asleep', asleep);
    });

    petEls.forEach((node, id) => {
      if (home.some((d) => d.id === id)) return;
      node.remove();
      petEls.delete(id);
    });

    $('#hollowEmpty').hidden = home.length > 0;
    const count = `${Game.crittersTending().length} of ${Game.habitatSlots()} tending`;
    /* A sleeping creature is the one thing here that wants doing something
       about, so it outranks the tending count for the line. */
    const naps = Game.crittersAsleep().length;
    const line = naps
      ? `${naps === 1 ? 'Someone is' : `${naps} are`} asleep · Feed to wake them`
      : count;
    $('#hollowCount').textContent = home.length
      ? (mode === 'loadout' ? `${count} · tap to swap` : line)
      : '';
  }

  /** What a tap on a creature means. The room is where they live, so it is also
      where the loadout is chosen — reaching for the Almanac to swap the pets
      standing in front of you was the odd part. */
  function setMode(next) {
    if (mode === next) return;
    mode = next;
    el.hollow.classList.toggle('in-loadout', mode === 'loadout');
    $$('[data-hollow]', el.hollow).forEach((b) => {
      b.classList.toggle('on', b.dataset.hollow === mode);
    });
    syncTenants();
  }

  function tendTap(id) {
    const def = Game.critterById(id);
    const on = Game.critterTending(id);
    if (!Game.setTending(id, !on)) {
      UI.toast({
        title: `Every slot is full`,
        body: `Rest someone else first, then ${def.name} can come out.`,
        art: Icons.get('sprout')
      });
      return;
    }
    Sound.play('tap');
    const node = petEls.get(id);
    if (node) {
      const c = FX.centerOf(node);
      if (on) FX.sparks(c.x, c.y, 6, '#cbb69c');
      else { FX.sparks(c.x, c.y, 12, def.art.glow); FX.ring(c.x, c.y, '#8ce99a', 0.4, 60); }
    }
    syncTenants();
    UI.renderCritters();
  }

  function render() {
    if (!open) return;
    syncScene();
    syncTenants();
    place();
  }

  function enter() {
    if (open) return;
    open = true;
    el.game.classList.add('in-hollow');
    el.hollow.hidden = false;
    render();
    requestAnimationFrame(place);     // the container has no size until it is shown
    Sound.play('open');
    UI.hideCoach();
  }

  function exit() {
    if (!open) return;
    open = false;
    setMode('pet');
    el.game.classList.remove('in-hollow');
    el.hollow.hidden = true;
    Sound.play('close');
    UI.renderCritters();
  }

  function dockTap(id) {
    /* Two ways to spend a tap on a creature, so which one is armed is a mode.
       The count line and the dimmed resting creatures say which — a toast for
       entering a mode would be noise, and the cap is two. */
    if (id === 'loadout' || id === 'pet') {
      setMode(mode === id ? 'pet' : id);
      Sound.play('open');
      return;
    }
    if (id === 'feed') { setMode('pet'); UI.openSheet('feed'); return; }
    /* Named because the screen's shape depends on it, and honest about not
       existing rather than doing something token. */
    UI.toast({
      title: 'Decorating is not built yet',
      body: 'The button is here so the shape of the screen is right.',
      art: Icons.get('decor')
    });
  }

  function build() {
    el.hollow.innerHTML = `
      <div id="hollowScene" class="hollow-scene-wrap"></div>
      <div id="hollowTenants" class="hollow-tenants"></div>
      <button class="hollow-exit" id="hollowExit" type="button">
        <i></i><span>Swipe up for the garden</span>
      </button>
      <p class="hollow-count" id="hollowCount"></p>
      <p class="hollow-empty" id="hollowEmpty" hidden>Nobody lives here yet.<br>Grow what they like and they will turn up.</p>
      <nav class="dock hollow-dock" id="hollowDock">${DOCK.map((d) => `
        <button class="dock-btn${d.id === mode ? ' on' : ''}" type="button" data-hollow="${d.id}">
          <span class="dock-ico">${Icons.get(d.icon)}</span>
          <span class="dock-label">${d.label}</span>
        </button>`).join('')}
      </nav>`;

    $('#hollowExit').addEventListener('click', exit);
    $('#hollowDock').addEventListener('click', (e) => {
      const b = e.target.closest('[data-hollow]');
      if (b) dockTap(b.dataset.hollow);
    });
    $('#hollowTenants').addEventListener('pointerdown', (e) => {
      const n = e.target.closest('[data-critter]');
      if (!n) return;
      e.preventDefault();
      /* Down here a creature is at home, not at work. A tap opens everything you
         can do with it rather than spending itself on whichever dock verb was
         armed — collecting stays up in the garden, where the creature actually
         is when it is working. Loadout mode keeps a direct toggle, because
         swapping three in a row should not be three sheets. */
      if (mode === 'loadout') tendTap(n.dataset.critter);
      else UI.openSheet('critter', n.dataset.critter);
    }, { passive: false });

    /* Swipe UP to climb back to the garden. A room's exit is the opposite of the
       swipe that got you here, and since 2026-08-30 the way in is DOWN — the
       Hollow is under the garden, and with the map retired there is no camera to
       pull back. Getting the pair the same way round is what makes the axis
       learnable at all. */
    let y0 = null;
    let x0 = 0;
    el.hollow.addEventListener('pointerdown', (e) => {
      y0 = null;
      /* Creatures and the dock act on the way down, so a drag begun on one has
         already opened a sheet or toggled a slot — leaving would then do two
         things at once. Same rule as the garden's own swipe. */
      if (e.target.closest('[data-critter],.dock,.hollow-exit')) return;
      y0 = e.clientY;
      x0 = e.clientX;
    });
    el.hollow.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = y0 - e.clientY;
      const dx = Math.abs(e.clientX - x0);
      y0 = null;
      if (dy > 70 && dy > dx) exit();
    });

    window.addEventListener('resize', () => { if (open) place(); });
  }

  build();

  UI.enterHollow = enter;
  UI.exitHollow = exit;
  UI.hollowOpen = () => open;
  UI.renderHollow = render;
})();
