/* Garden Wonder — the sky, staged.

   `game.js` decides what the weather is; this file plays it. The approved motion
   is `tools/sky-spike.html` and the sequences below are its `RainSeq`, `AuroraSeq`
   and `Seq`, with one substitution: the stage held each sky for a slider, and here
   the slot the engine hands out is the hold. Everything here is presentation — it
   writes attributes, particles and sound, and never game state. Reaches the rest
   of the UI through the `UI` global — see docs/02-architecture.md.

   Registered before `ui-events.js` on purpose. Both subscribe to `weather`, and
   the tail of an ending sky has to be standing before that file asks
   `paintWeather()` to hand the attribute over. */

(() => {
  const { el } = UI;

  const WS = () => DATA.weatherStage;
  const sect = (id) => WS()[id] || {};
  const num = (o, k, d) => (o && typeof o[k] === 'number' ? o[k] : d);
  const quietMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const quiet = () => quietMq.matches;

  /* The drops thin over five seconds once a sky stops, and the sky's id is held
     that much longer again: `[data-wx-phase="end"]` paints the parting clouds and
     the fading wash from `data-weather`, so the attribute cannot go to clear on
     the boundary. Nothing else needs the hold — the wet ground and the rays each
     dry on a base rule that outlives it. */
  const THIN = 5;
  const HOLD = { rain: 8000, storm: 8000, aurora: 4500, wonderfall: 3500 };

  let timers = [];
  let seqTimers = [];
  let flashers = [];
  let dropTimer = 0;
  let standing = 'clear';   // the sky the layers are wearing, not the one in the sim
  let phase = 'idle';
  let frontFor = null;
  let frontUntil = 0;
  let gestured = false;

  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  const cancelFlashes = () => { flashers.forEach(clearTimeout); flashers = []; };
  /* The flag is cleared here as well as on its own timer: a sky that changes
     inside the flash window cancels that timer, and an attribute stuck at "1"
     cannot be rewritten to "1" to restart the animation. */
  function cancelTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    cancelFlashes();
    clearTimeout(dropTimer);
    el.game.dataset.wxFlash = '0';
  }
  /* The shape a manual sequence is driving is held apart from the sky's own
     timers, because entering a phase cancels those and would otherwise cancel the
     hand that is turning the pages. */
  const seqLater = (fn, ms) => { seqTimers.push(setTimeout(fn, ms)); };
  function cancelSeq() { seqTimers.forEach(clearTimeout); seqTimers = []; }

  function setPhase(p) {
    phase = p;
    el.game.dataset.wxPhase = p;
  }

  /* `data-wx-night` means the sky is DARK, and it has two writers: the hour, and
     an aurora bending the light rules at whatever hour it likes. `Game.isNight()`
     already answers for both, which is why the sunbreak asks this rather than
     asking whether an aurora happens to be up. */
  function syncNight() {
    /* An aurora IS the dark, whatever the hour — the engine agrees, but only for
       a sky the engine can see. A sequence played straight (the dev holds, and
       `UI.weatherSequence`) has to be able to bend the light too, or the aurora's
       defining channel is the one thing that cannot be driven. */
    const n = (standing === 'aurora' || Game.isNight()) ? '1' : '0';
    if (el.game.dataset.wxNight !== n) el.game.dataset.wxNight = n;
  }

  /* Every tuned number reaches CSS as `--wx-<section>-<key>`, so a layer can be
     pure CSS and still be remote-config'd from `data.js`. Durations carry their
     unit because a bare number is not a valid animation-duration; everything else
     stays a plain number so calc() can use it. */
  const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  const SECONDS = /(seconds|period|duration|linger)$/i;
  function pushVars() {
    const write = (name, key, v) => {
      el.game.style.setProperty(name, SECONDS.test(key) ? v + 's' : String(v));
    };
    Object.keys(WS()).forEach((k) => {
      const v = WS()[k];
      if (typeof v === 'number') { write('--wx-' + kebab(k), k, v); return; }
      if (!v || typeof v !== 'object') return;
      Object.keys(v).forEach((k2) => write(`--wx-${kebab(k)}-${kebab(k2)}`, k2, v[k2]));
    });
  }

  /* ============ sound and touch, both gesture-gated ============ */
  /* Audio may only begin from a gesture and a slot boundary is not one. The same
     gate holds the haptics: Chrome refuses `vibrate()` before a tap and writes a
     console error instead of throwing, which a probe run reads as a broken page. */
  window.addEventListener('pointerdown', () => {
    gestured = true;
    // A sky that landed before the player ever touched the screen still gets its
    // bed, rather than hanging silent until the next one.
    if (standing === 'clear' || phase === 'end' || phase === 'idle') return;
    bed(standing, true);
    arrange(standing);
    if (standing === 'rain' || standing === 'storm') duck(true);
  }, { once: true });

  function audio(fn) {
    if (!gestured) return;
    Sound.resume();
    fn();
  }
  /* `audio.js` knows nothing about the game, so the bed's level is read here and
     passed in — the knob stays in `data.js` where a remote config can reach it. */
  const bed = (id, on) => audio(() => Sound.bed(id, on, num(sect(id), 'bed', undefined)));
  const arrange = (id) => audio(() => Sound.arrange(id));
  const duck = (on) => audio(() => Sound.duck(on));
  const buzz = (pattern) => { if (gestured && !quiet()) FX.haptic(pattern); };

  /* ============ the flash ceiling ============ */
  /* Photosensitivity is not a knob. Whatever the data asks for, never more than
     three flashes in any ten seconds — the gate sits between the storm and the
     screen, and the storm only ever asks. */
  const FLASH_WINDOW = 10;
  const FLASH_MAX = 3;
  let flashLog = [];

  function flashAllowed() {
    const t = Date.now() / 1000;
    flashLog = flashLog.filter((x) => t - x < FLASH_WINDOW);
    if (flashLog.length >= FLASH_MAX) return false;
    flashLog.push(t);
    return true;
  }

  function flash() {
    if (!flashAllowed()) return;
    // A bolt that strikes the same spot twice reads as a decal rather than weather.
    el.game.style.setProperty('--wx-bolt-x', Math.round(12 + Math.random() * 68) + '%');
    el.game.dataset.wxFlash = '1';
    audio(() => Sound.crack(num(sect('storm'), 'flashBright', 0.72)));
    buzz([12, 30, 22]);
    /* The tint pulse that stands in for the flicker under reduced motion is
       slower on purpose, and it needs the flag for as long as it lasts: a
       substitute cut off part-way reverts, and one that never finishes is not a
       substitute. */
    later(() => { el.game.dataset.wxFlash = '0'; }, quiet() ? 720 : 120);
  }

  function askForFlashes() {
    const S = sect('storm');
    const slow = quiet() ? 2.2 : 1;
    const again = () => {
      // The cadence keeps its schedule; only the flash itself is skipped, so a storm
      // that was on screen the whole time and one that was backgrounded look the same
      // when you come back — and a hidden page does not spend its flash allowance.
      if (!document.hidden) flash();
      const gap = (num(S, 'flashMinGap', 3.4) + Math.random() * num(S, 'flashJitter', 4)) * 1000;
      flashers.push(setTimeout(again, Math.max(400, gap * slow)));
    };
    flashers.push(setTimeout(again, 900));
  }

  /* ============ the world under the rain ============ */
  /* A drop lands on a plant, never on bare soil: the squash is the plant's. The
     class goes on the slot rather than the plant itself, because the glisten rule
     already owns the plant's `animation` and would out-rank a bare class. */
  function dropLands() {
    if (quiet()) return;
    // Nothing is on screen and the frame loop is not running, so a drop landed now is a
    // drop that never draws — and the splash it queues would all arrive in one burst on
    // the frame the player comes back to.
    if (document.hidden) return;
    const slots = (UI.plotEls || []).filter((v) => v && v.slot && v.slot.firstElementChild);
    if (!slots.length) return;
    const slot = slots[(Math.random() * slots.length) | 0].slot;
    const r = slot.getBoundingClientRect();
    if (!r.width) return;
    /* The remove/read/add dance is the standard restart-an-animation trick, and here it
       was buying nothing: this runs from a timer at least 2.2s apart and the class is
       taken off again after 340ms, so it is never on when we arrive. The `offsetWidth`
       read was a second forced layout in a function that already has one. */
    if (!slot.classList.contains('wx-splashed')) slot.classList.add('wx-splashed');
    later(() => slot.classList.remove('wx-splashed'), 340);
    const p = FX.gamePoint(r.left + r.width / 2, r.top + r.height * 0.3);
    FX.splashAt(p.x, p.y);
  }

  function rainOnPlants() {
    clearTimeout(dropTimer);
    if (quiet()) return;
    const again = () => {
      dropLands();
      dropTimer = setTimeout(again, (2.2 + Math.random() * 3.4) * 1000);
    };
    dropTimer = setTimeout(again, 1400);
  }


  /* ============ the sequence ============ */
  const FRONT_LINE = {
    rain: 'rainFront', storm: 'stormFront',
    aurora: 'auroraFront', wonderfall: 'wonderfallFront'
  };
  /* Rain and the storm announce with clouds. An aurora and a Wonderfall only ever
     announce with a line, because both of them BEGIN — a bank of grey cloud in
     front of either would spend the surprise the sky itself is. */
  const CLOUD_FRONT = { rain: true, storm: true };

  function openFront(to, seconds) {
    cancelTail();
    const line = FRONT_LINE[to.id];
    // Rarity buys interruption: only the two rarest skies talk over the cooldown.
    if (line) UI.say(line, to.id === 'aurora' || to.id === 'wonderfall');
    if (!CLOUD_FRONT[to.id]) return;
    /* A sky already standing goes out HERE, at the announcement, rather than at
       the arrival. `standing` is about to become the incoming sky, and it is the
       only thing the arrival's teardown branch tests — so a sky torn down there
       would never be torn down at all, and its bed would play on under the next
       one for as long as the page stayed open. */
    if (standing !== 'clear' && standing !== to.id) resetSky();
    el.game.style.setProperty('--wx-front-dur', Math.max(0.4, seconds) + 's');
    el.game.dataset.weather = to.id;
    sunbreakOff();
    standing = to.id;
    setPhase('front');
    syncNight();
  }

  function arrive(w) {
    cancelTail();
    cancelTimers();
    sunbreakOff();
    frontFor = null;
    standing = w.id;
    el.game.dataset.weather = w.id;
    syncNight();
    if (w.id === 'rain' || w.id === 'storm') arriveRain(w.id);
    else if (w.id === 'aurora') arriveAurora();
    else if (w.id === 'wonderfall') arriveWonderfall();
    else { setPhase('idle'); return; }
    /* The slot is the hold. `linger` and `transform` paint almost the same
       picture on purpose — the boundary marks the sky having settled, not a new
       look. */
    const left = Math.max(6, Game.weatherSlotRemaining());
    later(() => { if (phase !== 'end' && phase !== 'idle') setPhase('linger'); }, left * 660);
  }

  function arriveRain(id) {
    const K = sect(id);
    setPhase('transform');
    FX.weather(id, {
      count: num(K, 'drops', 74),
      speed: num(K, 'dropSpeed', 900),
      wind: num(K, 'wind', 0.12)
    });
    bed(id, true);
    arrange(id);
    duck(true);
    rainOnPlants();
    if (id === 'storm') askForFlashes();
  }

  /* No front: an aurora begins. The sky goes down to dusk over `duskSeconds`
     whatever the hour, and the first ribbon arrives while it is still going. */
  function arriveAurora() {
    setPhase('front');
    bed('aurora', true);
    arrange('aurora');
    later(() => setPhase('transform'),
      Math.max(400, num(WS().aurora, 'duskSeconds', 4) * 1000));
  }

  /* Every channel. The banner and the forced line are already the game's, fired
     from `ui-events.js` on the same event; what this adds is the cue, the veil,
     the gold and the singing. */
  function arriveWonderfall() {
    setPhase('front');
    el.game.classList.add('wx-cue');
    buzz([18, 40, 18, 40, 30]);
    bed('wonderfall', true);
    arrange('wonderfall');
    later(() => el.game.classList.remove('wx-cue'), 1200);
    later(() => {
      setPhase('transform');
      FX.weather('gold', { count: num(WS().wonderfall, 'drizzle', 26) });
      sing(0);
    }, 2200);
    later(() => sing(1), 10400);
    later(() => sing(2), 16200);
  }

  // The singing flowers of the Wonder Effect, come home. Three phrases, so a sky
  // that sings four times is not a loop.
  /* Reduced motion is a preference about MOTION. The flower's mouth is held
     still by the stylesheet, and the melody is the half of the singing that was
     never moving — taking the sound away as well would be answering a question
     nobody asked. */
  function sing(which) {
    audio(() => Sound.sing(which));
  }

  /* The end. `next` is the sky that has just replaced this one, and it is what
     decides whether the sun gets to come out: at the moment a sky ends, the slot
     that follows it is the one now standing, so this asks what arrived rather
     than `nextWeather()`, which by then is looking one slot too far. */
  function endSky(next) {
    cancelTimers();
    setPhase('end');
    /* The thinning ramp is a per-frame animation, and rAF does not run while the page
       is hidden — so a sky that ends in the background would keep its whole drop pool
       alive until the player came back and then thin it in front of them. */
    if (document.hidden) FX.weather(null); else FX.weatherOff(THIN);
    if (standing === 'storm') audio(() => Sound.rumble());
    bed(standing, false);
    duck(false);

    const sun = (standing === 'rain' || standing === 'storm')
      && !!next && next.id === 'clear' && !Game.isNight();
    later(() => { if (sun) sunbreak(); else arrange('clear'); }, THIN * 1000);
    later(release, HOLD[standing] || 3500);
  }

  /* Pure presentation: it writes no state, moves no number, and never happens
     after dark — the sun is not behind those clouds at night. Its own timer,
     because the rays outlive the sky that earned them: on the sequence's clock
     they would be cancelled by the handover, and the arrangement they hand back
     would land in the middle of whatever came next. */
  let sunTimer = 0;
  let fadeTimer = 0;
  /* Three states, not two. The layer takes 2.8s to fade out, and the rays' sweep is
     gated on this attribute — so going straight to '0' would freeze four shafts
     mid-journey with the sunbreak still plainly on screen. `fade` is "going, but still
     moving"; it reaches '0' once the fade is over. */
  const FADE = 3000;
  function sunbreakOff() {
    clearTimeout(sunTimer);
    sunTimer = 0;
    clearTimeout(fadeTimer);
    if (el.game.dataset.sunbreak === '1') {
      el.game.dataset.sunbreak = 'fade';
      fadeTimer = setTimeout(() => {
        if (el.game.dataset.sunbreak === 'fade') el.game.dataset.sunbreak = '0';
      }, FADE);
      return;
    }
    el.game.dataset.sunbreak = '0';
  }

  function sunbreak() {
    if (Game.isNight()) { arrange('clear'); return; }
    clearTimeout(fadeTimer);
    el.game.dataset.sunbreak = '1';
    arrange('sunbreak');
    UI.say('sunbreak');
    sunTimer = setTimeout(() => {
      sunbreakOff();
      arrange('clear');
    }, num(WS().sunbreak, 'duration', 30) * 1000);
  }

  // The sky is finished; the attribute goes to whatever the simulation says now.
  function release() {
    standing = 'clear';
    setPhase('idle');
    UI.paintWeather(Game.currentWeather());
    syncNight();
  }

  // A tail interrupted by a real sky hands over at once rather than overlapping.
  function cancelTail() {
    if (phase !== 'end') return;
    cancelTimers();
    sunbreakOff();
    release();
  }

  function resetSky() {
    cancelTimers();
    sunbreakOff();
    FX.weather(null);
    audio(() => Sound.bedsOff(0.6));
    duck(false);
    arrange('clear');
    el.game.dataset.wxFlash = '0';
    el.game.classList.remove('wx-cue');
    document.querySelectorAll('.wx-splashed')
      .forEach((n) => n.classList.remove('wx-splashed'));
  }

  /* The whole shape from one call — front, transform, linger, end — for the
     gauntlet and the probe. The live game never uses it: the engine owns the
     clock, and each piece rides the event that earns it. */
  function weatherSequence(id, opts = {}) {
    cancelSeq();
    if (id === 'sunbreak') { sunbreak(); return; }
    const def = DATA.weather.types.find((t) => t.id === id);
    if (!def) return;
    const front = typeof opts.front === 'number' ? opts.front
      : num(WS(), opts.called ? 'calledFrontSeconds' : 'frontSeconds', 5);
    const hold = typeof opts.hold === 'number' ? opts.hold : DATA.weather.slotSeconds;
    resetSky();
    frontFor = id;
    frontUntil = Date.now() + front * 1000;
    openFront(def, front);
    seqLater(() => arrive(def), front * 1000);
    seqLater(() => endSky({ id: 'clear' }), (front + hold) * 1000);
  }

  /* ============ what the engine says ============ */
  Game.on('front', ({ to, seconds }) => {
    if (!to || to.id === 'clear') return;
    cancelSeq();
    /* A front fires whenever the NEXT slot is a real sky, and that includes the
       sky already standing announcing itself again. Nothing is arriving, so
       nothing is announced. */
    if (to.id === standing) { frontFor = null; return; }
    frontFor = to.id;
    frontUntil = Date.now() + Math.max(0, seconds) * 1000;
    openFront(to, seconds);
  });

  /* The payload carries the SLOT's sky, which is not always the sky: a called
     sky lasts four minutes and a dev hold lasts until it is let go, and both
     outlive a slot boundary that `weatherForSlot()` knows nothing about.
     `currentWeather()` is the one that honours them, and reading it here is what
     stops a bought sky ending sixty seconds after it was paid for. */
  Game.on('weather', () => {
    cancelSeq();
    syncNight();
    const weather = Game.currentWeather();
    if (weather.id === 'clear') {
      // Already going out; a second boundary must not restart the tail.
      if (standing === 'clear' || phase === 'end') return;
      endSky(weather);
      return;
    }
    // The same sky announcing a new slot is not an arrival.
    if (standing === weather.id && (phase === 'transform' || phase === 'linger')) return;
    if (standing !== 'clear' && standing !== weather.id) resetSky();
    /* A called sky and a dev hold both announce and land in the same frame — the
       engine says so and leaves the delay here, because the wait is the arrival
       and the arrival is presentation. */
    const wait = weather.id === frontFor ? frontUntil - Date.now() : 0;
    if (wait > 40) later(() => arrive(weather), wait);
    else arrive(weather);
  });


  /* Called from `boot()` once the rest of `UI` exists, because a sky already
     standing when the page opens has to be put on screen: `processWeather()`
     suppresses the `weather` event for the first slot it sees, and roughly a
     quarter of slots are not clear. No front — the sky is already here. */
  function startWeather() {
    pushVars();
    sunbreakOff();
    el.game.dataset.wxFlash = '0';
    setPhase('idle');
    syncNight();
    const w = Game.currentWeather();
    if (w.id !== 'clear') arrive(w);
  }

  UI.startWeather = startWeather;
  UI.weatherSequence = weatherSequence;
  UI.syncWeatherNight = syncNight;
  /* `paintWeather()` asks this before it writes `data-weather`. While a sky is on
     screen the attribute belongs to the sequence — through the front, which runs
     ahead of the slot, and through the end, which runs behind it. */
  UI.wxHoldsSky = () => standing !== 'clear';
})();
