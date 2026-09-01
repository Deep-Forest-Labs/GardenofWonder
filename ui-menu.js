/* Garden Wonder — the menu drawer.

   The hamburger in the top-right corner opens a panel off the right edge:
   a round face and the player's name at the top, then a column of rows.
   Monopoly Go's layout, drawn in this house's paper, ink and opaque lip.

   Three things about this file are load-bearing.

   THE ESCAPING LAW. `state.profile.name` is the first player-typed text this
   game has ever held, and the ruling filed in docs/11-known-issues.md is that
   player text NEVER enters a template literal. Every name in here reaches the
   DOM through `.textContent` on a node the template left empty, and the two
   sites are `paintName()` and the edit field. `tools/html-check.js` fails the
   build if anyone writes it the other way — including in this file.

   THE ROWS ARE A TABLE. `ROWS` below is the whole menu. Moving a row in or out,
   or promoting a reserved one, is one line — the owner's ask at the gate, on
   the grounds that this menu will keep changing.

   IT IS NOT A SHEET. The bottom sheet comes up, holds one panel from a mode
   map, and is dismissed downward. This comes in from the right, holds a menu,
   and is dismissed rightward — by the grip, by its own scrim, or by the
   hamburger again. It borrows the sheet's material and its z-order and nothing
   else; in particular `#scrim` is wired straight to `closeSheet()`, so the
   drawer brings its own.

   Reaches the rest of the UI through the `UI` global — see
   docs/02-architecture.md. Anything another UI file attaches is called as
   `UI.something()` at call time, never destructured here. */

(() => {
  const { $, S, el } = UI;

  const node = $('#menu');
  const scrim = $('#menuScrim');
  const grip = $('#menuGrip');
  const head = $('#menuHead');
  const body = $('#menuBody');
  const btn = $('#btnMenu');
  const dot = $('#menuDot');

  /* Open, and which face the drawer is showing. Module locals rather than
     markup, for the reason `sheetMode` is: a re-render replaces the body
     wholesale and anything held in an attribute goes with it. */
  let open = false;
  let view = 'rows';        // 'rows' | 'picker'
  let editing = false;

  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- the rows ----------------

     `soon` marks a slot that is reserved rather than built: drained paper,
     non-interactive, and a Soon chip where a live row wears its badge. Three of
     them, capped deliberately — past three a menu is advertising more game than
     exists. Friends is the slot docs/15-navigation-and-ia.md has protected
     since 2026-08-25: it is a backend, not a button.

     `tint` is the icon disc's body colour, and it must be SATURATED. The white
     veil over it is `.seed-art`'s recipe, and four pale tints under that veil
     produce four identical white discs — the failure docs/05 names under
     `.set-ring`. The values are the seeds' own `art.c1`, so no new colour
     enters the palette. */
  const ROWS = [
    { id: 'shop', icon: 'decor', tint: '#ff922b', label: 'Shop',
      note: 'Gems, decor and the odd bundle', open: () => UI.openSheet('shop') },
    { id: 'bonuses', icon: 'book', tint: '#5c7cfa', label: 'Almanac',
      note: 'Every flower, every creature', open: () => UI.openSheet('bonuses') },
    { id: 'news', icon: 'bell', tint: '#ffe066', label: "What's New",
      note: 'The latest announcement', dot: () => Boolean(Game.pendingAnnouncement()),
      open: () => UI.openAnnouncement() },
    { id: 'settings', icon: 'gear', tint: '#8b9bb0', label: 'Settings',
      note: 'Sound, music, and your save', open: () => UI.openSheet('settings') },

    { id: 'friends', icon: 'people', tint: '#74c0fc', label: 'Friends',
      note: 'Visit a garden, send a seed', soon: true },
    { id: 'daily', icon: 'gift', tint: '#f783ac', label: 'Daily Gift',
      note: 'Something small, every day', soon: true },
    { id: 'record', icon: 'scroll', tint: '#69db7c', label: 'Garden Record',
      note: 'What your garden has done', soon: true }
  ];

  /* ---------------- the badge dot ----------------

     The dock's attention dot, on a HUD button for the first time. It lights
     when the newest announcement has not been read and goes out when it has.
     Deliberately not a count: one announcement is one thing to look at.

     It is a solid disc in its base style with no animation of its own, because
     a state whose only carrier is movement has no carrier at all with the
     reduced-motion preference on. */
  function updateDot() {
    const want = Boolean(Game.pendingAnnouncement());
    if (dot.hidden === !want) return;
    dot.hidden = !want;
  }

  /* ---------------- the face ----------------

     An avatar id resolves to art the game already owns. Never a stored
     drawing: `flower`, `seed:<id>` or `critter:<id>`, and the engine has
     already refused anything the player has not earned. */
  function faceArt(id, size) {
    if (typeof id === 'string' && id.indexOf('seed:') === 0) {
      const seed = Game.seedById(id.slice(5));
      if (seed) return Flora.head(seed, size);
    }
    if (typeof id === 'string' && id.indexOf('critter:') === 0) {
      const def = Game.critterById(id.slice(8));
      if (def) return Critters.draw(def);
    }
    return Flora.talkingFlower();
  }

  /* The disc's own body colour, so nineteen blooms are nineteen discs rather
     than nineteen identical white ones. Same veil-over-a-saturated-token trick
     as `.seed-art`. */
  function faceTint(id) {
    if (typeof id === 'string' && id.indexOf('seed:') === 0) {
      const seed = Game.seedById(id.slice(5));
      if (seed) return seed.art.c1;
    }
    if (typeof id === 'string' && id.indexOf('critter:') === 0) {
      const def = Game.critterById(id.slice(8));
      if (def) return (def.art && def.art.accent) || '#8fe08a';
    }
    return '#ffd6ea';
  }

  /* THE ONE PLACE A PLAYER'S NAME REACHES THE DOM. Both call sites go through
     here, and it uses textContent, so the name cannot become markup however it
     was typed. Do not inline this into a template. */
  function paintName() {
    const slot = $('[data-pname]', head);
    if (slot) slot.textContent = Game.profileName();
  }

  /* ---------------- the profile header ---------------- */
  function renderHead() {
    const avatar = Game.profile().avatar;
    const face = faceArt(avatar, 46);
    const tint = faceTint(avatar);

    if (editing) {
      /* The first text field in this game, drawn as a house surface rather than
         as a browser input: cream body, ink contour, its own lip. `maxlength`
         is the engine's cap, so the field cannot accept what the save would
         then trim under the player. */
      head.innerHTML = `
        <button class="avatar" data-act="pick" aria-label="Change your face" style="--av:${tint}">${face}</button>
        <div class="name-edit">
          <input class="name-field" id="nameField" type="text" inputmode="text"
                 maxlength="${Game.PROFILE_NAME_MAX}" autocomplete="off" autocapitalize="words"
                 spellcheck="false" aria-label="Your name">
          <button class="save-btn" data-act="savename" aria-label="Save your name">${Icons.get('check')}</button>
        </div>`;
      const field = $('#nameField', head);
      /* .value, not an interpolated attribute — the same rule as textContent,
         for the same reason. A name holding a quote would otherwise close the
         attribute and everything after it becomes markup. */
      field.value = Game.profileName();
      field.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitName(); }
        if (e.key === 'Escape') { e.preventDefault(); editing = false; renderHead(); }
      });
      requestAnimationFrame(() => { field.focus(); field.select(); });
      return;
    }

    const found = Game.discoveredCount();
    const yr = S.year.number;
    head.innerHTML = `
      <button class="avatar" data-act="pick" aria-label="Change your face" style="--av:${tint}">${face}</button>
      <div class="dr-who">
        <span class="dr-name"><b data-pname></b>
          <button class="pencil" data-act="rename" aria-label="Change your name">${Icons.get('pencil')}</button>
        </span>
        <span class="dr-sub">Year ${yr} &middot; ${found} flower${found === 1 ? '' : 's'} found</span>
      </div>`;
    paintName();
  }

  function commitName() {
    const field = $('#nameField', head);
    if (field) Game.setProfileName(field.value);
    editing = false;
    renderHead();
    Sound.play('buy');
  }

  /* ---------------- the rows ---------------- */
  function rowHTML(r) {
    const badge = r.dot && r.dot() ? '<span class="row-dot"></span>' : '';
    if (r.soon) {
      return `<div class="dr-row soon" style="--rt:${r.tint}" aria-disabled="true">
        <span class="dr-ico">${Icons.get(r.icon)}</span>
        <span class="dr-lab"><b>${r.label}</b><i>${r.note}</i></span>
        <span class="dr-end"><span class="soon-chip">Soon</span></span>
      </div>`;
    }
    return `<button class="dr-row" type="button" data-row="${r.id}" style="--rt:${r.tint}">
      <span class="dr-ico">${Icons.get(r.icon)}</span>
      <span class="dr-lab"><b>${r.label}</b><i>${r.note}</i></span>
      <span class="dr-end">${badge}<span class="chev">${Icons.get('chevron')}</span></span>
    </button>`;
  }

  function renderRows() {
    const live = ROWS.filter((r) => !r.soon).map(rowHTML).join('');
    const soon = ROWS.filter((r) => r.soon);
    const reserved = soon.length
      ? `<div class="dr-sep">Coming soon</div>${soon.map(rowHTML).join('')}`
      : '';
    body.innerHTML = `<div class="dr-rows">${live}${reserved}</div>
      <p class="dr-foot">Garden Wonder &middot; your garden saves to this browser</p>`;
  }

  /* ---------------- the avatar picker ----------------

     Your garden is your face. Every portrait is drawn by the game from
     something the player earned — no uploads, no photographs, ever. Two groups
     rather than one grid, because a bloom and a creature are different kinds of
     thing and one grid reads as a bag of stickers. */
  function pickCell(o) {
    const on = o.id === Game.profile().avatar ? ' on' : '';
    if (!o.unlocked) {
      /* Drained and padlocked rather than hidden, exactly as the locked seed
         row is — the cell is an advert for the flower you are saving for. */
      return `<span class="pick-cell locked" aria-hidden="true">${o.art}</span>`;
    }
    return `<button class="pick-cell${on}" type="button" data-face="${o.id}"
      style="--av:${o.tint}" aria-label="${o.label}"${on ? ' aria-current="true"' : ''}>${o.art}</button>`;
  }

  function renderPicker() {
    const c = Game.avatarChoices();
    const blooms = [{
      id: 'flower', unlocked: true, tint: '#ffd6ea',
      label: 'The talking flower', art: Flora.talkingFlower()
    }].concat(c.blooms.map((b) => ({
      id: b.id, unlocked: b.unlocked, tint: b.seed.art.c1,
      label: b.seed.name, art: Flora.head(b.seed, 34)
    })));
    const pets = c.pets.map((p) => ({
      id: p.id, unlocked: true, tint: (p.critter.art && p.critter.art.accent) || '#8fe08a',
      label: p.critter.name, art: Critters.draw(p.critter)
    }));

    body.innerHTML = `
      <div class="dr-rows">
        <p class="pick-group">Your blooms</p>
        <div class="pick-grid">${blooms.map(pickCell).join('')}</div>
        ${pets.length ? `<p class="pick-group">Creatures you have met</p>
          <div class="pick-grid pets">${pets.map(pickCell).join('')}</div>` : ''}
        <p class="dr-foot">Your garden is your face. Grow a flower or meet a creature and it turns up here.</p>
      </div>`;
  }

  function render() {
    renderHead();
    if (view === 'picker') renderPicker(); else renderRows();
  }

  /* ---------------- open and close ----------------

     The scrim's two-property dance is the sheet's: `hidden` off first, `.show`
     on the next frame, and `hidden` back only once the slide has run. Setting
     both in one frame leaves no starting opacity to transition from. */
  function openMenu() {
    if (open) return;
    open = true;
    view = 'rows';
    editing = false;
    render();
    node.hidden = false;
    scrim.hidden = false;
    node.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      node.classList.add('open');
      scrim.classList.add('show');
    });
    Sound.resume();
    Sound.play('open');
  }

  function closeMenu() {
    if (!open) return;
    open = false;
    editing = false;
    node.classList.remove('open');
    node.style.transform = '';
    node.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('show');
    /* Both wait out the slide, and the wait is zero with the preference on —
       a 340ms hold on an instant close leaves an invisible scrim eating taps
       for a third of a second. */
    setTimeout(() => {
      if (open) return;
      node.hidden = true;
      scrim.hidden = true;
    }, calm() ? 0 : 340);
    Sound.play('close');
  }

  function toggle() {
    if (open) closeMenu(); else openMenu();
  }

  /* ---------------- input ---------------- */
  btn.addEventListener('click', toggle);
  scrim.addEventListener('click', closeMenu);

  /* One delegated listener on a container the renders never replace, for the
     reason `el.sheetBody`'s is delegated: a re-render throws away every node
     under it and would take bound handlers with them. */
  body.addEventListener('click', (e) => {
    const face = e.target.closest('[data-face]');
    if (face) {
      if (Game.setProfileAvatar(face.dataset.face)) {
        Sound.play('buy');
        view = 'rows';
        render();
      }
      return;
    }
    const row = e.target.closest('[data-row]');
    if (!row) return;
    const def = ROWS.find((r) => r.id === row.dataset.row);
    if (!def || !def.open) return;
    /* The drawer closes first, so a panel never opens behind a scrim the
       player then has to tap through. */
    closeMenu();
    def.open();
    updateDot();
  });

  head.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="rename"]')) { editing = true; renderHead(); return; }
    if (e.target.closest('[data-act="savename"]')) { commitName(); return; }
    if (e.target.closest('[data-act="pick"]')) {
      /* The picker replaces the rows rather than stacking a second surface —
         the drawer never opens on top of itself, and the way back is the
         same three dismissals plus picking a face. */
      view = view === 'picker' ? 'rows' : 'picker';
      editing = false;
      render();
      Sound.play('open');
    }
  });

  /* Drag right to dismiss. The grip is its own element for the reason the
     sheet's is: all four listeners live on it, so the body can scroll freely
     without the drag fighting it. Pointer capture keeps the moves arriving
     once the finger has left a 22px-wide handle. */
  (() => {
    let startX = 0, dx = 0, dragging = false;
    const onDown = (e) => {
      if (!open) return;
      dragging = true;
      startX = e.clientX;
      dx = 0;
      node.classList.add('dragging');
      grip.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      dx = Math.max(0, e.clientX - startX);
      node.style.transform = `translateX(${dx}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      node.classList.remove('dragging');
      node.style.transform = '';
      if (dx > 90) closeMenu();
    };
    grip.addEventListener('pointerdown', onDown);
    grip.addEventListener('pointermove', onMove);
    grip.addEventListener('pointerup', onUp);
    grip.addEventListener('pointercancel', onUp);
  })();

  /* The dot is recomputed on the slow tick like the dock's, and again whenever
     an announcement is dismissed. */
  Game.on('panels', () => {
    updateDot();
    if (open) render();
  });

  updateDot();

  UI.openMenu = openMenu;
  UI.closeMenu = closeMenu;
  UI.menuOpen = () => open;
  UI.updateMenuDot = updateDot;
})();
