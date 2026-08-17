/* Garden Wonder — the Hollow: the room under the garden where creatures live.

   Draws from hollow.js, which knows nothing about the game, and places real
   creatures into its spots. Reaches the rest of the UI through the `UI` global —
   see docs/02-architecture.md. Design in docs/22-creatures.md. */

(() => {
  const { $, S, el } = UI;

  const DOCK_H = 96;
  let open = false;
  let sceneSky = null;                 // the sky the current scene was drawn for
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
          <span class="hollow-name">${def.name}</span>`;
        wrap.appendChild(node);
        petEls.set(def.id, node);
      }
      // Only the badges change on a tick; touching anything else restarts motion.
      const tending = Game.critterTending(def.id);
      const gift = Game.keepsakesWaiting(def.id) > 0;
      const leafEl = node.querySelector('.hollow-leaf');
      const giftEl = node.querySelector('.hollow-gift');
      if (leafEl.hidden === tending) leafEl.hidden = !tending;
      if (giftEl.hidden === gift) giftEl.hidden = !gift;
    });

    petEls.forEach((node, id) => {
      if (home.some((d) => d.id === id)) return;
      node.remove();
      petEls.delete(id);
    });

    $('#hollowEmpty').hidden = home.length > 0;
    $('#hollowCount').textContent = home.length
      ? `${Game.crittersTending().length} of ${Game.habitatSlots()} tending`
      : '';
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
    el.game.classList.remove('in-hollow');
    el.hollow.hidden = true;
    Sound.play('close');
    UI.renderCritters();
  }

  function dockTap(id) {
    if (id === 'loadout') { UI.openSheet('bonuses'); return; }
    if (id === 'pet') {
      UI.toast({ title: 'Tap a creature', body: 'Pet it, or collect what it left you.', art: Icons.get('sprout') });
      return;
    }
    /* Named because the screen's shape depends on them, and honest about not
       existing rather than doing something token. */
    UI.toast({
      title: id === 'feed' ? 'Feeding is not built yet' : 'Decorating is not built yet',
      body: 'The button is here so the shape of the screen is right.',
      art: Icons.get(id === 'feed' ? 'honey' : 'decor')
    });
  }

  function build() {
    el.hollow.innerHTML = `
      <div id="hollowScene" class="hollow-scene-wrap"></div>
      <div id="hollowTenants" class="hollow-tenants"></div>
      <button class="hollow-exit" id="hollowExit" type="button">
        <i></i><span>Swipe down for the garden</span>
      </button>
      <p class="hollow-count" id="hollowCount"></p>
      <p class="hollow-empty" id="hollowEmpty" hidden>Nobody lives here yet.<br>Grow what they like and they will turn up.</p>
      <nav class="dock hollow-dock" id="hollowDock">${DOCK.map((d) => `
        <button class="dock-btn" type="button" data-hollow="${d.id}">
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
      UI.tapCritter(n.dataset.critter);
      syncTenants();
    }, { passive: false });

    /* Swipe DOWN to go up to the garden. Dragging down pulls the world down past
       you, which is the same direction any scroll uses — swiping up to rise reads
       backwards once you actually try it. */
    let y0 = null;
    el.hollow.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
    el.hollow.addEventListener('pointerup', (e) => {
      if (y0 !== null && e.clientY - y0 > 70) exit();
      y0 = null;
    });

    window.addEventListener('resize', () => { if (open) place(); });
  }

  build();

  UI.enterHollow = enter;
  UI.exitHollow = exit;
  UI.hollowOpen = () => open;
  UI.renderHollow = render;
})();
