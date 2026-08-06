/* Garden Wonder — WebAudio synth. Every sound is generated, nothing to download. */

const Sound = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let ready = false;
  const prefs = { sfx: true, music: false };

  function init() {
    if (ready) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = prefs.sfx ? 0.65 : 0;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    ready = true;
    if (prefs.music) startMusic();
    return true;
  }

  function resume() {
    if (!ready && !init()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  function setSfx(on) {
    prefs.sfx = on;
    if (ready) sfxBus.gain.setTargetAtTime(on ? 0.65 : 0, ctx.currentTime, 0.02);
  }

  function setMusic(on) {
    prefs.music = on;
    if (!ready) return;
    if (on) startMusic();
    musicBus.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.4);
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

  function noise({ dur = 0.2, gain = 0.2, at = 0, hp = 800 }) {
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
    filt.connect(g);
    g.connect(sfxBus);
    src.start(t);
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

  function startMusic() {
    if (musicTimer || !ready) return;
    const step = () => {
      const chord = PROG[bar % PROG.length];
      chord.forEach((s, i) =>
        tone({ freq: note(s - 12), type: 'sine', dur: 3.4, gain: 0.09, at: i * 0.02, bus: musicBus })
      );
      for (let i = 0; i < 6; i += 1) {
        const s = chord[i % chord.length] + (i > 2 ? 12 : 0);
        tone({ freq: note(s + 12), type: 'triangle', dur: 0.5, gain: 0.045, at: 0.35 + i * 0.42, bus: musicBus });
      }
      bar += 1;
    };
    step();
    musicTimer = setInterval(step, 3200);
  }

  return { init, resume, play, setSfx, setMusic, prefs };
})();
