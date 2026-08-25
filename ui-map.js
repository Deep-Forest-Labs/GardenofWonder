/* Garden Wonder — the overworld: the map you pull back to.

   Draws from overworld.js, which knows nothing about the game, and places the
   real garden, the burrow and the Stand into its coordinates. Reaches the rest
   of the UI through the `UI` global — see docs/02-architecture.md. Design in
   docs/25-world-map.md.

   The finding that shapes this whole file, from tools/map-spike.html: THE DIVE
   CANNOT LAND ON THE REAL GARDEN BY ZOOMING. A phone is roughly 2.16:1 and a
   garden parcel is square, so no scale both fills the frame and keeps the
   neighbours out — and more decisively, the garden screen is its own composition
   (sky, quest strip, plots as tappable cards, the burrow door, the HUD).
   Rebuilding it inside a world box would mean maintaining the garden twice.

   So the map is a LAYER ABOVE the garden. Diving scales the world toward the
   place you picked and cross-fades to the screen that already exists; the map's
   copy of the garden is a thumbnail that only ever has to read at map distance. */

(() => {
  const { $, S, el } = UI;

  let open = false;
  let sceneSky = null;              // the sky the current scene was drawn for
  let cam = { x: 0, y: 0 };         // top-left of the view, in WORLD units
  let scale = 1;                    // world units -> css pixels at map altitude
  let raf = 0;

  const DIVE_SCALE = 2.8;
  const DIVE_MS = 420;

  const skyNow = () => (Game.isNight() ? 'moon' : 'sun');

  function viewport() {
    const r = el.map.getBoundingClientRect();
    return { w: r.width || window.innerWidth, h: r.height || window.innerHeight };
  }

  /* Fit the world's HEIGHT to the screen and pan its width. A side-on world is
     landscape and a phone is portrait, so this is the axis with something to
     explore — and fitting height means there is never a band of nothing above
     or below. Landmarks then read small against the world, which is the whole
     difference between a map and the garden seen from slightly further away. */
  function fit() {
    scale = viewport().h / Overworld.H;
  }

  /* Never show the edge of the world. If the world is smaller than the view on
     an axis it centres on that axis instead. Worked in world units, so the
     numbers stay comparable with PLACES. */
  function clamp(x, y) {
    const v = viewport();
    const maxX = Overworld.W - v.w / scale;
    const maxY = Overworld.H - v.h / scale;
    return {
      x: maxX <= 0 ? maxX / 2 : Math.min(Math.max(x, 0), maxX),
      y: maxY <= 0 ? maxY / 2 : Math.min(Math.max(y, 0), maxY)
    };
  }

  const centreOn = (place) => clamp(
    place.x + place.w / 2 - viewport().w / scale / 2,
    place.y + place.h / 2 - viewport().h / scale / 2
  );

  /* One camera, written as three CSS variables, with the transform origin pinned
     at 0 0. `translate(-camX*s, -camY*s) scale(s)` puts world point (camX, camY)
     at the top-left of the screen, and that identity only holds from the origin —
     moving transform-origin to the place being dived into breaks the pan, which
     is exactly how this shipped wrong the first time. The dive therefore animates
     the CAMERA rather than the origin. */
  function applyCam() {
    raf = 0;
    const w = $('#owWorld');
    if (!w) return;
    w.style.setProperty('--ow-tx', `${-cam.x * scale}px`);
    w.style.setProperty('--ow-ty', `${-cam.y * scale}px`);
    w.style.setProperty('--ow-s', scale);
  }

  /** The camera that puts `place` in the middle of the screen at scale `s`. */
  function camFor(place, s) {
    const v = viewport();
    return {
      x: place.x + place.w / 2 - v.w / s / 2,
      y: place.y + place.h / 2 - v.h / s / 2
    };
  }

  function animate(on) {
    const w = $('#owWorld');
    if (w) w.classList.toggle('animating', Boolean(on));
  }
  function queueCam() {
    if (raf) return;
    raf = requestAnimationFrame(applyCam);
  }

  function setCam(x, y) {
    cam = clamp(x, y);
    queueCam();
  }

  /* ---------------- building the world ---------------- */

  function syncScene() {
    const sky = skyNow();
    if (sceneSky === sky) return;
    sceneSky = sky;
    $('#owScene').innerHTML = Overworld.scene({ sky });
  }

  const box = (p) => `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;

  /** The garden thumbnail shows what is ACTUALLY planted. Your map is your
      garden, not a picture of a garden. */
  function gardenBlooms() {
    let out = '';
    S.grid.forEach((cell, i) => {
      const c = Overworld.CELLS[i];
      if (!c || !cell || cell.locked || !cell.seed) return;
      const sd = Game.seedById(cell.seed);
      if (!sd) return;
      out += `<div class="ow-bloom${cell.ready ? ' ripe' : ''}" style="left:${c.x}%;top:${c.y}%">
        ${Flora.head(sd, 54)}</div>`;
    });
    return out;
  }

  function build() {
    el.map.innerHTML = `
      <div class="ow-world" id="owWorld" style="width:${Overworld.W}px;height:${Overworld.H}px">
        <div class="ow-scene" id="owScene"></div>
        <div class="ow-place ow-garden" id="owGarden" data-go="garden" style="${box(Overworld.PLACES.garden)}"></div>
        <div class="ow-place ow-hollow" data-go="hollow" style="${box(Overworld.PLACES.hollow)}">
          ${Overworld.burrow()}<span class="ow-tag">The Hollow</span>
        </div>
        <div class="ow-place ow-stand" id="owStand" data-go="stand" style="${box(Overworld.PLACES.stand)}">
          ${Overworld.stand()}<span class="ow-tag">The Stand</span>
        </div>
        ${Overworld.PARCELS.map((p) => `<div class="ow-parcel" data-parcel="${p.id}" style="${box(p)}">
          ${Overworld.parcel(p)}<span class="ow-tag locked">${p.name}</span>
        </div>`).join('')}
      </div>
      <div class="ow-hint"><i></i><span>Drag to look around &middot; tap a place to go in</span></div>`;
  }

  /** Re-draw only what changes: the garden's blooms and the Stand's badge. */
  function render() {
    if (!open) return;
    syncScene();
    $('#owGarden').innerHTML = `${Overworld.gardenBoard()}${gardenBlooms()}
      <span class="ow-tag">The Garden</span>`;

    const ready = Game.standOrders().filter((o) => Game.standCanDeliver(o)).length;
    const stand = $('#owStand');
    let badge = $('.ow-badge', stand);
    if (ready && !badge) {
      badge = document.createElement('span');
      badge.className = 'ow-badge';
      stand.appendChild(badge);
    }
    if (badge) {
      badge.textContent = ready;
      badge.hidden = !ready;
    }
  }

  /* ---------------- enter, dive, leave ---------------- */

  function enter(fromPlace) {
    if (open) return;
    open = true;
    el.game.classList.add('in-map');
    el.map.hidden = false;
    build();
    render();
    UI.hideCoach();
    Sound.play('open');

    /* Pull back FROM the place you were standing in, rather than cutting to a
       map. Start the world scaled up and centred there, then let it settle. */
    const p = Overworld.PLACES[fromPlace] || Overworld.PLACES.garden;
    fit();
    const rest = scale;

    // Start at the size you were standing in, centred on it, with no transition.
    animate(false);
    scale = rest * DIVE_SCALE;
    const near = camFor(p, scale);
    cam = { x: near.x, y: near.y };     // deliberately unclamped: this is mid-dive
    applyCam();

    // Then let it settle out to the whole world.
    requestAnimationFrame(() => {
      animate(true);
      scale = rest;
      const c = centreOn(p);
      cam = c;
      applyCam();
      setTimeout(() => animate(false), DIVE_MS + 40);
    });
  }

  function leave() {
    if (!open) return;
    open = false;
    el.game.classList.remove('in-map');
    el.map.hidden = true;
  }

  /** Dive into a place: scale toward it, then hand off to the real screen. */
  function dive(where) {
    if (!open) return;
    const p = Overworld.PLACES[where] || Overworld.PLACES.garden;
    animate(true);
    scale *= DIVE_SCALE;
    cam = camFor(p, scale);            // unclamped, so the target really centres
    applyCam();
    el.map.classList.add('fading');
    Sound.play('close');
    setTimeout(() => {
      animate(false);
      el.map.classList.remove('fading');
      leave();
      if (where === 'hollow') UI.enterHollow();
      else if (where === 'stand') UI.openSheet('stand');
    }, DIVE_MS);
  }

  /* ---------------- input ---------------- */

  function wire() {
    let drag = null;

    el.map.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.ow-hint')) return;
      drag = {
        id: e.pointerId,
        x: e.clientX, y: e.clientY,
        camX: cam.x, camY: cam.y,
        moved: 0, t: Date.now()
      };
      /* Capture keeps a drag alive when the finger leaves the layer. It throws if
         the pointer is already gone, which must not abort the gesture — panning
         still works without it. */
      try { el.map.setPointerCapture(e.pointerId); } catch (err) { /* no live pointer */ }
    });

    el.map.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      setCam(drag.camX - dx / scale, drag.camY - dy / scale);
    });

    el.map.addEventListener('pointerup', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const moved = drag.moved;
      drag = null;

      /* A drag is a drag. Only a gesture that barely moved counts as a tap, or
         panning across the world would keep opening whatever it finished over. */
      if (moved > 12) {
        /* Swipe UP anywhere goes back down into the garden — the same rule the
           whole vertical ladder uses: down pulls back, up goes in. */
        if (-dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.6) dive('garden');
        return;
      }

      const parcel = e.target.closest('[data-parcel]');
      if (parcel) {
        parcel.classList.remove('nope');
        void parcel.offsetWidth;
        parcel.classList.add('nope');
        Sound.play('deny');
        const def = Overworld.PARCELS.find((p) => p.id === parcel.dataset.parcel);
        UI.toast({
          title: def ? def.name : 'Not yet',
          body: 'Land opens up as the Stand builds your reputation.',
          art: Icons.get('lock')
        });
        return;
      }
      const go = e.target.closest('[data-go]');
      if (go) dive(go.dataset.go);
    });

    el.map.addEventListener('pointercancel', () => { drag = null; });
    window.addEventListener('resize', () => { if (!open) return; fit(); setCam(cam.x, cam.y); });
  }

  wire();

  UI.enterMap = enter;
  UI.leaveMap = leave;
  UI.mapOpen = () => open;
  UI.renderMap = render;
})();
