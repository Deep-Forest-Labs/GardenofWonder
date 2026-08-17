/* Garden Wonder — the Hollow: the room under the garden where creatures live.

   Draws from hollow.js, which knows nothing about the game, and places real
   creatures into its spots. Reaches the rest of the UI through the `UI` global —
   see docs/02-architecture.md. Design in docs/22-creatures.md. */

(() => {
  const { $, S, el } = UI;

  const DOCK_H = 96;
  let open = false;
  let built = '';          // the sky the current scene was drawn for

  /* The Hollow has different verbs from the garden. A per-place dock is also how
     places stop competing for the five slots the garden dock caps at. */
  const DOCK = [
    { id: 'feed', icon: 'honey', label: 'Feed' },
    { id: 'pet', icon: 'sprout', label: 'Pet' },
    { id: 'loadout', icon: 'star', label: 'Loadout' },
    { id: 'decorate', icon: 'decor', label: 'Decorate' }
  ];

  function skyNow() {
    return Game.isNight() ? 'moon' : 'sun';
  }

  function buildScene() {
    const sky = skyNow();
    if (built === sky && $('.hollow-scene', el.hollow)) return;
    built = sky;
    $('#hollowScene').innerHTML = Hollow.scene({ dockHeight: DOCK_H, sky });
  }

  /** Every creature that has moved in lives down here. A tending one is also up
      in the garden working — the leaf badge is what says which. */
  function renderTenants() {
    const home = Game.crittersHome();
    const wrap = $('#hollowTenants');
    wrap.innerHTML = '';
    home.slice(0, Hollow.SPOTS.length).forEach((def, i) => {
      const spot = Hollow.SPOTS[i];
      const node = document.createElement('button');
      node.className = 'hollow-pet';
      node.type = 'button';
      node.dataset.critter = def.id;
      node.style.left = spot.left + '%';
      node.style.top = spot.top + '%';
      node.setAttribute('aria-label', `${def.name}, a ${def.species}`);
      node.innerHTML = `${Critters.draw(def)}
        <span class="hollow-leaf" ${Game.critterTending(def.id) ? '' : 'hidden'}>${Icons.get('sprout')}</span>
        <span class="hollow-gift" ${Game.keepsakesWaiting(def.id) ? '' : 'hidden'}>${Icons.get('gem')}</span>
        <span class="hollow-name">${def.name}</span>`;
      wrap.appendChild(node);
    });
    const none = $('#hollowEmpty');
    none.hidden = home.length > 0;
    $('#hollowCount').textContent = home.length
      ? `${Game.crittersTending().length} of ${Game.habitatSlots()} tending`
      : '';
  }

  function render() {
    if (!open) return;
    buildScene();
    renderTenants();
  }

  function enter() {
    if (open) return;
    open = true;
    el.game.classList.add('in-hollow');
    el.hollow.hidden = false;
    built = '';
    render();
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
    /* Feed and Decorate are named because the design needs them visible, and are
       honest about not existing rather than doing something token. */
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
        <i></i><span>Swipe up for the garden</span>
      </button>
      <p class="hollow-count" id="hollowCount"></p>
      <p class="hollow-empty" id="hollowEmpty" hidden>Nobody lives here yet.<br>Grow what they like and they will turn up.</p>
      <nav class="hollow-dock" id="hollowDock">${DOCK.map((d) => `
        <button type="button" data-hollow="${d.id}">${Icons.get(d.icon)}<span>${d.label}</span></button>`).join('')}
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
      renderTenants();
    }, { passive: false });

    /* Swipe up to leave. The button above teaches it; this is the fast path for
       anyone who has learned it. */
    let y0 = null;
    el.hollow.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
    el.hollow.addEventListener('pointerup', (e) => {
      if (y0 !== null && y0 - e.clientY > 70) exit();
      y0 = null;
    });
  }

  build();

  UI.enterHollow = enter;
  UI.exitHollow = exit;
  UI.hollowOpen = () => open;
  UI.renderHollow = render;
})();
