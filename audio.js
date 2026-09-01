/* Garden Wonder — WebAudio synth. Every sound is generated, nothing to download. */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let sfxFilter = null;
  let musicBus = null;
  let ambBus = null;
  let stinger = null;
  let ready = false;
  /* Three channels, each a level and a mute. The boolean is the mute and the
     number is the slider, and they are kept apart on purpose: a slider at zero
     is a channel turned down, a mute is a channel switched off, and only the
     second one is allowed to stop a scheduler. */
  const prefs = {
    sfx: true, amb: true, music: false,
    sfxVol: 1, ambVol: 1, musicVol: 1
  };

  /* The house levels. These three are calibrated against each other and against
     every recipe's own gain, with BED_TRIM and the stinger makeup sitting
     downstream of the ambient one. A slider MULTIPLIES the number beside it and
     never replaces it — written as a raw bus gain it would throw the whole
     calibration away, and every measurement taken against it with it. */
  const HOUSE = { sfx: 0.65, amb: 0.36, music: 0.16 };
  /* 0.36 is the height the ambience has actually been playing at: the old
     ambient level of 0.5 times the 0.72 it was trimmed by whenever music was
     off, which is the default and is how the game is played. Naming it once
     keeps the sky exactly as loud as it was on the day the third channel
     arrived, so a slider left alone changes nothing. */
  const DUCK_HZ = 950;
  const OPEN_HZ = 18000;

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  /* A channel is worth its house level times its slider, or nothing at all. */
  const chLevel = (ch) => (prefs[ch] ? HOUSE[ch] * clamp(prefs[ch + 'Vol'], 0, 1) : 0);

  function init() {
    if (ready) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    /* The duck lives on the bus rather than in each recipe, so a sound written
       a year from now sits under the rain without knowing the rain exists. */
    sfxFilter = ctx.createBiquadFilter();
    sfxFilter.type = 'lowpass';
    sfxFilter.frequency.value = OPEN_HZ;
    sfxFilter.Q.value = 0.4;
    sfxFilter.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = chLevel('sfx');
    sfxBus.connect(sfxFilter);
    musicBus = ctx.createGain();
    musicBus.gain.value = chLevel('music');
    musicBus.connect(master);
    ambBus = ctx.createGain();
    ambBus.gain.value = 0;
    ambBus.connect(master);
    /* A bed sits low by design, and a crack routed straight into it comes out
       quieter than a coin. This is the makeup that lets the thunder be written
       at house scale — a 0.2 one-shot here lands where a 0.2 one-shot lands on
       the effects bus — without lifting the bed underneath it. */
    stinger = ctx.createGain();
    stinger.gain.value = 1.45;
    stinger.connect(ambBus);
    ready = true;
    if (prefs.music) startMusic();
    return true;
  }

  /* Browsers refuse to start a context without a gesture, so every entry point
     that makes a noise goes through here first. */
  function wake() {
    if (!ready && !init()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function resume() {
    wake();
  }

  function setSfx(on) {
    prefs.sfx = !!on;
    if (!ready) return;
    sfxBus.gain.setTargetAtTime(chLevel('sfx'), ctx.currentTime, 0.02);
  }

  /* The sky's own channel — every bed, the thunder through the stinger, and the
     flower's hummed song. Muting it is the one thing that cancels the duck. */
  function setAmb(on) {
    prefs.amb = !!on;
    if (!ready) return;
    rampAmb(0.3);
    duck(ducked);
  }

  function setMusic(on) {
    prefs.music = !!on;
    if (!ready) return;
    // Muting used to take the bus to zero and leave the scheduler running, so a
    // muted game kept building oscillator nodes every 3.2s forever. Notes already
    // scheduled are unaffected and fade out with the bus.
    if (on) startMusic(); else stopMusic();
    musicBus.gain.setTargetAtTime(chLevel('music'), ctx.currentTime, 0.4);
  }

  /* The slider, and it is deliberately not the mute. Dragging music to zero
     leaves the scheduler running, because a level is a level: the player is
     turning something down, not switching it off, and a channel that quietly
     tore itself down at zero could not be dragged back up again. */
  function setLevel(ch, v) {
    if (!(ch + 'Vol' in prefs)) return false;
    const n = Number(v);
    prefs[ch + 'Vol'] = clamp(isFinite(n) ? n : 1, 0, 1);
    if (!ready) return true;
    if (ch === 'sfx') sfxBus.gain.setTargetAtTime(chLevel('sfx'), ctx.currentTime, 0.02);
    else if (ch === 'music') musicBus.gain.setTargetAtTime(chLevel('music'), ctx.currentTime, 0.06);
    else rampAmb(0.06);
    return true;
  }

  /* --- tiny synth voices --- */
  function tone({ freq = 440, type = 'triangle', dur = 0.16, gain = 0.3, at = 0, slide = 0, bus = sfxBus }) {
    if (!ready) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise({ dur = 0.2, gain = 0.2, at = 0, hp = 800, lp = 0, bus = sfxBus }) {
    if (!ready) return;
    const t = ctx.currentTime + at;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    if (lp) {
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = lp;
      filt.connect(low);
      low.connect(g);
    } else {
      filt.connect(g);
    }
    g.connect(bus);
    src.start(t);
  }

  /* A closed mouth, not a mallet: slow in, slow out, and dark on top. */
  function hum({ freq = 330, dur = 0.5, gain = 0.09, at = 0, bus = null }) {
    if (!ready) return;
    const t = ctx.currentTime + at;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.09);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.55, dur * 0.22);
    [1, 1.005].forEach((mul, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mul, t);
      const vg = ctx.createGain();
      /* The pair sums to about one so `gain` still means what it says on every
         other voice in the file. */
      vg.gain.value = i ? 0.34 : 0.7;
      osc.connect(vg);
      vg.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.4);
    });
    lp.connect(g);
    g.connect(bus || ambBus);
  }

  function biquad(type, freq, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    return f;
  }

  function lfo(rate, depth, target) {
    const osc = ctx.createOscillator();
    const amt = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = rate;
    amt.gain.value = depth;
    osc.connect(amt);
    amt.connect(target);
    return osc;
  }

  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const note = (semi, base = 261.63) => base * Math.pow(2, semi / 12);

  const RECIPES = {
    tap: (step = 0) => {
      const s = SCALE[Math.min(SCALE.length - 1, step % SCALE.length)];
      tone({ freq: note(s + 12), type: 'triangle', dur: 0.11, gain: 0.22 });
      tone({ freq: note(s + 19), type: 'sine', dur: 0.08, gain: 0.1, at: 0.01 });
    },
    crit: () => {
      [0, 4, 7, 12].forEach((s, i) => tone({ freq: note(s + 12), type: 'square', dur: 0.13, gain: 0.14, at: i * 0.045 }));
      noise({ dur: 0.25, gain: 0.1, hp: 2400 });
    },
    coin: () => {
      tone({ freq: note(16 + 12), type: 'square', dur: 0.07, gain: 0.16 });
      tone({ freq: note(21 + 12), type: 'square', dur: 0.14, gain: 0.14, at: 0.06 });
    },
    harvest: () => {
      [0, 7, 12, 16].forEach((s, i) => tone({ freq: note(s + 12), type: 'triangle', dur: 0.2, gain: 0.16, at: i * 0.05 }));
    },
    plant: () => {
      tone({ freq: note(4), type: 'sine', dur: 0.18, gain: 0.2, slide: 1.6 });
      noise({ dur: 0.12, gain: 0.08, hp: 500 });
    },
    unlock: () => {
      [0, 5, 9, 12, 17].forEach((s, i) => tone({ freq: note(s), type: 'triangle', dur: 0.22, gain: 0.16, at: i * 0.06 }));
    },
    buy: () => {
      tone({ freq: note(7), type: 'triangle', dur: 0.12, gain: 0.2 });
      tone({ freq: note(14), type: 'triangle', dur: 0.16, gain: 0.16, at: 0.07 });
    },
    deny: () => {
      tone({ freq: 190, type: 'sawtooth', dur: 0.14, gain: 0.12, slide: 0.7 });
    },
    boost: () => {
      tone({ freq: note(0), type: 'sawtooth', dur: 0.5, gain: 0.12, slide: 3 });
      noise({ dur: 0.4, gain: 0.07, hp: 1200 });
    },
    open: () => tone({ freq: note(12), type: 'sine', dur: 0.12, gain: 0.14, slide: 1.3 }),
    close: () => tone({ freq: note(12), type: 'sine', dur: 0.12, gain: 0.12, slide: 0.75 }),
    rainDance: () => {
      [0, 0.07, 0.13, 0.21].forEach((at, i) => noise({ dur: 0.09, gain: 0.08, hp: 3000 + i * 500, at }));
      tone({ freq: note(9), type: 'sine', dur: 0.3, gain: 0.1, slide: 0.5, at: 0.05 });
    },
    beeSwarm: () => {
      [0, 0.05, 0.1, 0.15, 0.2].forEach((at, i) => tone({ freq: note(2 + (i % 2) * 3 + 12), type: 'sawtooth', dur: 0.08, gain: 0.06, at }));
      tone({ freq: note(16 + 12), type: 'triangle', dur: 0.18, gain: 0.16, at: 0.26 });
    },
    ladybug: () => {
      [0, 4, 7, 12].forEach((s, i) => tone({ freq: note(s + 12), type: 'sine', dur: 0.14, gain: 0.13, at: i * 0.045 }));
    },
    quest: () => {
      [0, 7, 12].forEach((s, i) => tone({ freq: note(s + 12), type: 'sine', dur: 0.28, gain: 0.13, at: i * 0.07 }));
    },
    levelup: () => {
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) =>
        tone({ freq: note(s + 7), type: 'triangle', dur: 0.35, gain: 0.15, at: i * 0.07 })
      );
      noise({ dur: 0.7, gain: 0.07, hp: 1800, at: 0.1 });
    },
    rare: () => {
      [0, 7, 12].forEach((s, i) => tone({ freq: note(s + 12), type: 'sine', dur: 0.3, gain: 0.13, at: i * 0.07 }));
    },
    legend: () => {
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) =>
        tone({ freq: note(s + 7), type: 'triangle', dur: 0.35, gain: 0.15, at: i * 0.07 })
      );
      noise({ dur: 0.7, gain: 0.07, hp: 1800, at: 0.1 });
    },
    wonder: () => {
      [0, 2, 4, 7, 9, 12, 14, 16, 19, 24].forEach((s, i) =>
        tone({ freq: note(s), type: 'square', dur: 0.4, gain: 0.11, at: i * 0.055 })
      );
      [0, 12, 19].forEach((s, i) => tone({ freq: note(s - 12), type: 'sawtooth', dur: 1.4, gain: 0.07, at: 0.1 + i * 0.02 }));
    }
  };

  function play(name, arg) {
    if (!ready || !prefs.sfx) return;
    const fn = RECIPES[name];
    if (fn) fn(arg);
  }

  /* --- ambient music: slow pentatonic pad with a light arpeggio --- */
  let musicTimer = null;
  let bar = 0;
  const PROG = [
    [0, 4, 7],
    [-3, 2, 5],
    [-5, 0, 4],
    [-1, 2, 7]
  ];

  /* Same tune, different clothes — the sky rearranges the pad rather than
     replacing it. `hold` is how many bars a chord stays put, which is how a sky
     slows down without touching the clock every other sky is counting on. */
  const ARRANGE = {
    clear: { hold: 1, lp: 16000, pad: 'sine', padGain: 0.09, arp: 6, arpType: 'triangle', arpGain: 0.045, arpOct: 12, arpGap: 0.42, arpDur: 0.5, level: 1 },
    rain: { hold: 1, lp: 900, pad: 'sine', padGain: 0.085, arp: 3, arpType: 'sine', arpGain: 0.042, arpOct: 12, arpGap: 0.84, arpDur: 0.6, level: 0.92 },
    storm: { hold: 1, lp: 620, pad: 'sine', padGain: 0.09, arp: 2, arpType: 'sine', arpGain: 0.038, arpOct: 0, arpGap: 1.2, arpDur: 0.7, level: 0.86 },
    aurora: { hold: 2, lp: 16000, pad: 'sine', padGain: 0.06, arp: 4, arpType: 'sine', arpGain: 0.062, arpOct: 24, arpGap: 1.4, arpDur: 1.6, level: 1 },
    sunbreak: { hold: 1, lp: 16000, pad: 'triangle', padGain: 0.08, arp: 6, arpType: 'triangle', arpGain: 0.05, arpOct: 19, arpGap: 0.42, arpDur: 0.6, level: 1.05 },
    wonderfall: { hold: 1, lp: 16000, pad: 'triangle', padGain: 0.06, arp: 8, arpType: 'square', arpGain: 0.03, arpOct: 12, arpGap: 0.34, arpDur: 0.4, level: 0.9 }
  };

  const chains = {};
  let dress = 'clear';

  /* One chain per arrangement, kept alive once built: cross-fading two live
     chains is what makes this a change of clothes rather than a cut. */
  function chain(id) {
    if (chains[id]) return chains[id];
    const a = ARRANGE[id];
    const f = biquad('lowpass', a.lp, 0.6);
    const g = ctx.createGain();
    g.gain.value = id === dress ? a.level : 0.0001;
    f.connect(g);
    g.connect(musicBus);
    chains[id] = { filt: f, out: g };
    return chains[id];
  }

  function layPad(id, chord, dur) {
    const a = ARRANGE[id];
    const bus = chain(id).filt;
    chord.forEach((s, i) =>
      tone({ freq: note(s - 12), type: a.pad, dur, gain: a.padGain, at: i * 0.02, bus })
    );
  }

  function startMusic() {
    if (musicTimer || !ready) return;
    const step = () => {
      const a = ARRANGE[dress];
      const chord = PROG[Math.floor(bar / a.hold) % PROG.length];
      const bus = chain(dress).filt;
      if (bar % a.hold === 0) layPad(dress, chord, 3.4 * a.hold);
      for (let i = 0; i < a.arp; i += 1) {
        const s = chord[i % chord.length] + (i > 2 ? 12 : 0);
        tone({ freq: note(s + a.arpOct), type: a.arpType, dur: a.arpDur, gain: a.arpGain, at: 0.35 + i * a.arpGap, bus });
      }
      bar += 1;
    };
    step();
    musicTimer = setInterval(step, 3200);
  }

  function stopMusic() {
    if (!musicTimer) return;
    clearInterval(musicTimer);
    musicTimer = null;
  }

  function arrange(id) {
    if (!ARRANGE[id] || !wake()) return false;
    if (id === dress) return true;
    const from = chains[dress];
    const to = chain(id);
    const t = ctx.currentTime;
    if (from) from.out.gain.setTargetAtTime(0.0001, t, 0.5);
    to.out.gain.setTargetAtTime(ARRANGE[id].level, t, 0.5);
    dress = id;
    /* Pick the current chord up in the new dress straight away, otherwise the
       handover falls into the gap before the next downbeat. */
    if (prefs.music) {
      const a = ARRANGE[id];
      layPad(id, PROG[Math.floor(Math.max(0, bar - 1) / a.hold) % PROG.length], 2.6);
    }
    return true;
  }

  /* --- the ambience beds --- */
  /* Levels arrive from the caller, because this file knows nothing about the
     game. The spec's starting points stand in so a missing one is never a bed
     that plays silently. */
  const BED_DEFAULT = { rain: 0.3, storm: 0.34, aurora: 0.26, wonderfall: 0.34 };
  /* Filtered noise and a stack of sines are wildly different loudnesses for the
     same number, so the knob stays a feel value and the calibration lives here:
     each trim lands its bed near a peak of 0.10 at the speaker with the default,
     which is under the 0.22 of the game's loudest one-shot and about half again
     the ambient pad. The two tonal beds carry a little less, because a held sine
     is heard as louder than a hiss at the same height.

     The storm's trim fell from 1.9 to 1.2 on 2026-08-31: 1.9 was calibrated for
     a graph with nothing above 620Hz, and the moment the rain went back into it
     the bed jumped half again. Re-derived by measurement rather than by ear —
     `node tools/bedbench.js` renders these and prints them. NOTE that the trim
     is NOT what the thunder rides: `rel()` reads the caller's knob, so this
     number can be retuned without touching `crack()` or `rumble()`. Moving
     `DATA.weatherStage.storm.bed` is what would move them. */
  const BED_TRIM = { rain: 1.35, storm: 1.2, aurora: 1.55, wonderfall: 1.15 };
  /* The ceiling is not a tuning value, it is the point past which a level
     dragged to its end stops being something anyone would hold a phone to. */
  const BED_CEILING = 0.85;

  const levels = {};
  const live = {};

  const knob = (id) => clamp(typeof levels[id] === 'number' ? levels[id] : BED_DEFAULT[id], 0, 1);
  const bedGain = (id) => Math.min(knob(id) * BED_TRIM[id], BED_CEILING);
  const rel = (id) => clamp(knob(id) / BED_DEFAULT[id], 0.35, 1.4);

  /* One buffer, reused. Filling four seconds of random samples per bed start is
     a visible hitch on a phone and nobody can hear the difference. The seam is
     cross-faded and the loop stops short of it, because heavy lowpassing turns
     a one-sample jump into a tick you hear once a loop. */
  const LOOP_SECONDS = 4;
  const SEAM_SECONDS = 0.06;
  let loopBuf = null;
  let loopEnd = 0;

  function loopNoise() {
    if (loopBuf) return loopBuf;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * LOOP_SECONDS);
    const seam = Math.floor(rate * SEAM_SECONDS);
    loopBuf = ctx.createBuffer(1, len, rate);
    const d = loopBuf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
    for (let i = 0; i < seam; i += 1) {
      const k = i / seam;
      d[i] = d[i] * k + d[len - seam + i] * (1 - k);
    }
    loopEnd = (len - seam) / rate;
    return loopBuf;
  }

  function loopSource() {
    const src = ctx.createBufferSource();
    src.buffer = loopNoise();
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = loopEnd;
    return src;
  }

  /* Each builder wires itself into `out` and hands back the nodes to start and
     the timers to clear, so a bed that is not playing costs nothing. */
  const BUILD = {};

  BUILD.rain = (out) => {
    const src = loopSource();
    const body = biquad('lowpass', 1250, 0.5);
    const air = biquad('highpass', 220, 0.4);
    /* A minute is a long time to sit inside an unmoving hiss; a sky that
       breathes never gets to be fatiguing. */
    const breath = lfo(0.07, 380, body.frequency);
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.9;
    /* A narrow tap off the same source is the patter — enough to read as drops,
       kept below 2.5k and low in the mix because this is a sound a player sits
       inside for a minute, and the ear tires there first. */
    const patter = biquad('bandpass', 2200, 0.9);
    const patterG = ctx.createGain();
    patterG.gain.value = 0.16;
    src.connect(air);
    air.connect(body);
    body.connect(bodyG);
    bodyG.connect(out);
    air.connect(patter);
    patter.connect(patterG);
    patterG.connect(out);
    return { nodes: [src, breath], timers: [], rise: 2.2, fall: 2.4 };
  };

  /* A storm is rain PLUS thunder, and this one used to be thunder minus rain:
     two low bands and nothing at all above 620Hz — no patter, no hiss, no drops,
     just a band-limited roar. It is built from the rain graph now, darker and
     with the patter held back, so it reads as heavier weather rather than as a
     louder shower. The roll band stays underneath at about half its old height:
     a storm still has to carry some weight or it stops being different from a
     rain, but it is no longer the whole bed. */
  BUILD.storm = (out) => {
    const src = loopSource();
    const air = biquad('highpass', 200, 0.4);
    const body = biquad('lowpass', 1050, 0.5);
    /* Rain's breath, a little narrower. A minute is a long time to sit inside an
       unmoving hiss, and this is the half a phone can hear moving. */
    const breath = lfo(0.07, 340, body.frequency);
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.85;
    const patter = biquad('bandpass', 2200, 0.9);
    const patterG = ctx.createGain();
    patterG.gain.value = 0.1;
    /* THE SWELL RIDES THIS BAND NOW, not the sub. It used to modulate the
       sub-190Hz band, which a phone speaker cannot reproduce at all — so on the
       only device anyone plays this on the storm was pinned at a flat 0.6 for
       the whole minute, and "constant, steady" was a measurement rather than an
       impression. */
    const roll = biquad('lowpass', 620, 0.7);
    const rollHp = biquad('highpass', 160, 0.6);
    const rollG = ctx.createGain();
    rollG.gain.value = 0.3;
    const swell = lfo(0.05, 0.12, rollG.gain);
    /* Kept, and quiet. Nobody hears this on a handset, but on headphones it is
       the difference between weather and a hiss, and at this height it no longer
       spends the bed's headroom on a band the speaker throws away. */
    const deep = biquad('lowpass', 190, 1.2);
    const deepG = ctx.createGain();
    deepG.gain.value = 0.45;
    src.connect(air);
    air.connect(body);
    body.connect(bodyG);
    bodyG.connect(out);
    air.connect(patter);
    patter.connect(patterG);
    patterG.connect(out);
    src.connect(rollHp);
    rollHp.connect(roll);
    roll.connect(rollG);
    rollG.connect(out);
    src.connect(deep);
    deep.connect(deepG);
    deepG.connect(out);
    return { nodes: [src, breath, swell], timers: [], rise: 2.6, fall: 3 };
  };

  BUILD.aurora = (out) => {
    /* The pad slowed until it stops being a chord change and becomes a light.
       Voiced wide and high with one low anchor rather than stacked down where
       the game's pad lives: a phone speaker gives back almost nothing under
       400Hz, and a sky described as brightened cannot spend itself down there.
       Every voice shimmers at its own rate so the pattern never comes round. */
    const chord = [-12, 4, 12, 19];
    const gains = [0.2, 0.22, 0.26, 0.18];
    const rates = [0.09, 0.13, 0.11, 0.07];
    const nodes = [];
    chord.forEach((s, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = note(s) * (i % 2 ? 1.003 : 1);
      const g = ctx.createGain();
      g.gain.value = gains[i] / chord.length;
      const shimmer = lfo(rates[i], g.gain.value * 0.75, g.gain);
      osc.connect(g);
      g.connect(out);
      nodes.push(osc, shimmer);
    });
    /* Chimes on top, sprinkled rather than played: the prettiest sound in the
       game should not sound like it is counting. They ride the bed's own gain
       so one knob moves the whole sky, and the makeup for sitting behind that
       knob is a node rather than tone() gains written out of house scale. */
    const chimeBus = ctx.createGain();
    chimeBus.gain.value = 2.4;
    chimeBus.connect(out);
    const chime = () => {
      const s = SCALE[Math.floor(Math.random() * SCALE.length)];
      const f = note(s + 24);
      tone({ freq: f, type: 'sine', dur: 1.8, gain: 0.11, bus: chimeBus });
      tone({ freq: f * 1.004, type: 'sine', dur: 2.2, gain: 0.07, at: 0.03, bus: chimeBus });
      tone({ freq: note(s + 12), type: 'triangle', dur: 1.2, gain: 0.05, at: 0.08, bus: chimeBus });
    };
    const timer = setInterval(() => {
      if (Math.random() < 0.72) chime();
    }, 1500);
    /* The opening chime is tracked like the interval is: a sky cancelled inside
       its first second must not ring after it has gone. */
    const first = setTimeout(chime, 600);
    return { nodes, timers: [timer, first], rise: 3.4, fall: 3.4 };
  };

  BUILD.wonderfall = (out) => {
    /* The takeover: a wider chord than the garden ever uses, plus a low drone
       borrowed from the Wonder fanfare, so the sky reads as the rare thing it
       is before the first note of melody. */
    const chord = [4, 9, 16, 21];
    const gains = [0.26, 0.22, 0.16, 0.11];
    const nodes = [];
    chord.forEach((s, i) => {
      const osc = ctx.createOscillator();
      osc.type = i > 1 ? 'triangle' : 'sine';
      osc.frequency.value = note(s);
      const g = ctx.createGain();
      g.gain.value = gains[i] / chord.length;
      const shimmer = lfo(0.12 + i * 0.03, g.gain.value * 0.6, g.gain);
      osc.connect(g);
      g.connect(out);
      nodes.push(osc, shimmer);
    });
    /* The whole low end of the sky in one voice, an octave above where the
       fanfare puts it, because two octaves down is a frequency a phone owns
       none of. */
    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.value = note(-12);
    const droneLp = biquad('lowpass', 260, 0.7);
    const droneG = ctx.createGain();
    droneG.gain.value = 0.055;
    drone.connect(droneLp);
    droneLp.connect(droneG);
    droneG.connect(out);
    nodes.push(drone);
    /* Gold you can hear falling — the drizzle's audible half, kept quiet
       enough that the flower's melody still sits on top of it. */
    const drizzle = ctx.createGain();
    drizzle.gain.value = 2;
    drizzle.connect(out);
    let step = 0;
    const timer = setInterval(() => {
      const s = SCALE[(step * 3) % SCALE.length];
      tone({ freq: note(s + 24), type: 'triangle', dur: 0.5, gain: 0.035, bus: drizzle });
      step += 1;
    }, 420);
    return { nodes, timers: [timer], rise: 1.6, fall: 2 };
  };

  /* --- the ambience bus --- */
  let holdUntil = 0;
  let holdTimer = null;

  function ambLevel() {
    return chLevel('amb');
  }

  function ambTarget() {
    const busy = Object.keys(live).length > 0 || ctx.currentTime < holdUntil;
    return busy ? ambLevel() : 0;
  }

  function rampAmb(tau) {
    if (!ready) return;
    ambBus.gain.setTargetAtTime(ambTarget(), ctx.currentTime, tau || 0.4);
  }

  /* A crack or a closing rumble can outlive its bed, so the bus opens for the
     length of the sound and closes again behind it. */
  function openAmb(seconds) {
    holdUntil = Math.max(holdUntil, ctx.currentTime + seconds);
    ambBus.gain.setTargetAtTime(ambLevel(), ctx.currentTime, 0.04);
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      holdTimer = null;
      rampAmb(0.5);
    }, (seconds + 0.25) * 1000);
  }

  function startBed(id) {
    if (!wake()) return false;
    /* Restarting a bed that is already playing follows the level rather than
       resetting it, so a sequence that calls bed() on every phase change does
       not throw away a sky already in progress. */
    if (live[id]) {
      live[id].gain.gain.setTargetAtTime(bedGain(id), ctx.currentTime, 0.08);
      return true;
    }
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(ambBus);
    const rec = BUILD[id](g);
    rec.gain = g;
    live[id] = rec;
    rec.nodes.forEach((n) => n.start(t));
    g.gain.setTargetAtTime(bedGain(id), t, (rec.rise || 1.6) / 3);
    rampAmb(0.3);
    return true;
  }

  function stopBed(id, fade) {
    const rec = live[id];
    if (!rec) return false;
    const f = typeof fade === 'number' ? fade : (rec.fall || 2);
    const t = ctx.currentTime;
    rec.timers.forEach(clearInterval);
    rec.gain.gain.setTargetAtTime(0.0001, t, f / 4);
    rec.nodes.forEach((n) => n.stop(t + f));
    delete live[id];
    setTimeout(() => rec.gain.disconnect(), (f + 0.4) * 1000);
    rampAmb(f / 3);
    return true;
  }

  /* `level` is the caller's feel value for this sky, 0–1; it is remembered, so
     the storm's one-shots keep moving with a bed that was set once. */
  function bed(id, on, level) {
    if (!BUILD[id]) return false;
    if (typeof level === 'number' && isFinite(level)) levels[id] = clamp(level, 0, 1);
    return on ? startBed(id) : stopBed(id);
  }

  /* An interrupted sky has to be able to hand a clean bus to the next one. */
  function bedsOff(fade) {
    if (!ready) return;
    Object.keys(live).forEach((id) => stopBed(id, typeof fade === 'number' ? fade : 0.8));
    holdUntil = 0;
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    ambBus.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  }

  /* --- the storm's two one-shots --- */
  /* The split first, then a tail that rolls away in overlapping decays; a
     single burst reads as a door slamming, not as weather. */
  function crack(power = 1) {
    if (!wake()) return;
    /* Capped above as well as below: the bed's level is allowed to move the
       crack with it, but never past the house ceiling for a one-shot. */
    const k = clamp(clamp(power, 0, 1) * rel('storm'), 0.25, 1.1);
    openAmb(2.2);
    noise({ dur: 0.09, gain: 0.2 * k, at: 0.06, hp: 2600, bus: stinger });
    noise({ dur: 0.5, gain: 0.13 * k, at: 0.07, hp: 300, lp: 2200, bus: stinger });
    tone({ freq: 150, type: 'triangle', dur: 0.7, gain: 0.11 * k, at: 0.07, slide: 0.5, bus: stinger });
    [0.28, 0.62, 1.05].forEach((at, i) =>
      noise({ dur: 1 + i * 0.4, gain: (0.09 - i * 0.025) * k, at: 0.07 + at, hp: 120, lp: 700 - i * 140, bus: stinger })
    );
  }

  /* Distant is a colour, not an absence: the roll keeps enough midrange to
     survive a phone speaker and is quiet because it is far away, not because
     it has been filtered into nothing. */
  function rumble() {
    if (!wake()) return;
    const k = rel('storm');
    openAmb(4.5);
    [0, 0.5, 1.2].forEach((at, i) =>
      noise({ dur: 2.4 - i * 0.4, gain: (0.095 - i * 0.022) * k, at, hp: 140, lp: 620 - i * 120, bus: stinger })
    );
    tone({ freq: 152, type: 'triangle', dur: 2.4, gain: 0.055 * k, at: 0.1, slide: 0.72, bus: stinger });
  }

  /* --- the flower's hummed melody --- */
  /* Three phrases so a sky that sings four times does not sound like a loop. */
  const PHRASES = [
    [4, 7, 9, 7, 12, 9, 7],
    [0, 4, 7, 12, 9, 7, 4],
    [7, 9, 12, 14, 12, 9, 7]
  ];
  let phrase = 0;

  function sing(which) {
    if (!wake()) return;
    const p = PHRASES[typeof which === 'number' ? which % PHRASES.length : phrase % PHRASES.length];
    phrase += 1;
    openAmb(p.length * 0.34 + 1.4);
    p.forEach((s, i) => {
      const last = i === p.length - 1;
      hum({
        freq: note(s + 12),
        dur: last ? 1.1 : 0.46,
        gain: (last ? 0.11 : 0.13) * rel('wonderfall'),
        at: 0.1 + i * 0.34,
        bus: ambBus
      });
    });
  }

  /* --- measurement --- */
  /* A bed rendered offline, so the skies can be compared with numbers rather than
     with an ear on a laptop speaker. It builds through the SAME `BUILD[id]` the
     game plays and down the same gain chain — bed trim, the ambient channel,
     master — so what comes back is what a player would hear.

     It swaps the module's context for an `OfflineAudioContext` and puts the live
     one back in a `finally`. That is the price of measuring the real graph, and
     it is the right price: a bench that copies the constants stops measuring
     this file the first time either of them changes. Nothing in the game calls
     this; `tools/bedbench.js` does.

     `swing` is the loudest second against the quietest, in dB — the number that
     says whether a sky BREATHES or simply sits there. */
  async function renderBed(id, seconds = 20, opts = {}) {
    if (!BUILD[id]) return null;
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OC) return null;
    const rate = 44100;
    const live = ctx;
    const liveLoop = loopBuf;
    const off = new OC(1, Math.round(rate * seconds), rate);
    let data;
    try {
      ctx = off;
      /* The shared 4-second noise buffer belongs to whichever context made it. */
      loopBuf = null;
      const g = off.createGain();
      g.gain.value = bedGain(id) * chLevel('amb') * 0.9;
      if (opts.phoneHz) {
        /* A phone speaker gives back almost nothing under a few hundred hertz,
           so a bed measured whole can read as lively while the half anyone
           actually hears sits still. This is that half. */
        const hp = off.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = opts.phoneHz;
        hp.Q.value = 0.7;
        g.connect(hp);
        hp.connect(off.destination);
      } else {
        g.connect(off.destination);
      }
      const rec = BUILD[id](g);
      rec.nodes.forEach((n) => n.start(0));
      const rendered = await off.startRendering();
      rec.timers.forEach(clearInterval);
      data = rendered.getChannelData(0);
    } finally {
      ctx = live;
      loopBuf = liveLoop;
    }
    let peak = 0;
    let sum = 0;
    const windows = [];
    for (let sec = 0; sec < seconds; sec += 1) {
      let wsum = 0;
      const from = sec * rate;
      const to = Math.min(data.length, from + rate);
      for (let i = from; i < to; i += 1) {
        const v = data[i];
        const a = v < 0 ? -v : v;
        if (a > peak) peak = a;
        wsum += v * v;
        sum += v * v;
      }
      windows.push(Math.sqrt(wsum / Math.max(1, to - from)));
    }
    /* The first second is the bed's fade-in, not the bed. */
    const settled = windows.slice(1).filter((w) => w > 0);
    const lo = Math.min(...settled);
    const hi = Math.max(...settled);
    return {
      id,
      peak,
      rms: Math.sqrt(sum / data.length),
      swingDb: lo > 0 ? 20 * Math.log10(hi / lo) : 0,
      windows
    };
  }

  /* --- the effects duck --- */
  let ducked = false;

  function duck(on) {
    if (!ready && !init()) return false;
    ducked = !!on;
    /* The duck is the sky leaning on the effects, so a muted sky has nothing to
       lean with and the filter stays open. A slider does not cancel it: a bed
       turned down is still a bed, and the effects still belong under it. */
    sfxFilter.frequency.setTargetAtTime(ducked && prefs.amb ? DUCK_HZ : OPEN_HZ, ctx.currentTime, 0.35);
    return ducked;
  }

  return {
    init, resume, play, setSfx, setAmb, setMusic, setLevel, prefs,
    bed, bedsOff, arrange, duck, crack, rumble, sing, renderBed
  };
})();
