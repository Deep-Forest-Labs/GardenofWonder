/* Garden Wonder — the wiring from simulation events to what the player sees and hears.

   `game.js` emits; this subscribes. Nothing here decides anything — it turns an event payload into
   particles, sound, haptics, a toast or a banner. Subscriptions are registered once at load and
   never removed, so none of this may move inside a function that reruns. Reaches the rest of the
   UI through the `UI` global — see docs/02-architecture.md. */

(() => {
  const { S, el, fmt, signed, rnd } = UI;

  Game.on('wonder', ({ active }) => {
    if (active) {
      el.game.classList.add('wonder');
      UI.showBanner('WONDER!', WONDER.lines[(Math.random() * WONDER.lines.length) | 0], 2600);
      Sound.play('wonder');
      FX.shake(10, 0.5);
      FX.haptic([30, 40, 30, 40, 60]);
      const c = FX.centerOf(UI.flowerBtn());
      FX.rainbowBurst(c.x, c.y);
      for (let i = 0; i < 5; i += 1) {
        setTimeout(() => FX.confetti(Math.random() * window.innerWidth, window.innerHeight * 0.35, 20), i * 220);
      }
      UI.faceReact('wow');
      UI.say('wonder', true);
    } else {
      el.game.classList.remove('wonder');
      UI.showBanner('Wonder over', 'Back to the quiet garden', 1500);
    }
  });

  /* ============ tap-triggered garden proc FX ============
     Each of these is rare on purpose (see docs/10-decision-log.md) — the
     animation is what has to carry the "you just won something" feeling,
     since the numbers themselves are small and infrequent. All three rebuild
     their DOM/animation state from scratch on every call rather than
     toggling a persistent class, so a retrigger on the same target (possible
     at high Quick Grip speeds) always restarts cleanly instead of looking
     like a dud. */

  function triggerRainFX(v, shaved) {
    if (!v) return;
    v.root.querySelectorAll('.rain-cloud').forEach((n) => n.remove());
    v.inner.querySelectorAll('.rain-drops').forEach((n) => n.remove());

    const cloud = document.createElement('div');
    cloud.className = 'rain-cloud';
    cloud.innerHTML = '<i></i><i></i><i></i>';
    v.root.appendChild(cloud);
    setTimeout(() => cloud.remove(), 950);

    const drops = document.createElement('div');
    drops.className = 'rain-drops';
    for (let i = 0; i < 12; i += 1) {
      const d = document.createElement('span');
      d.className = 'rain-drop';
      d.style.setProperty('--x', `${rnd(8, 92).toFixed(0)}%`);
      d.style.setProperty('--delay', `${rnd(0.1, 0.45).toFixed(2)}s`);
      d.style.setProperty('--dur', `${rnd(0.4, 0.6).toFixed(2)}s`);
      d.style.setProperty('--fall', `${rnd(80, 100).toFixed(0)}%`);
      drops.appendChild(d);
    }
    v.inner.appendChild(drops);
    setTimeout(() => drops.remove(), 1100);

    Sound.play('rainDance');

    setTimeout(() => {
      v.inner.classList.remove('watered'); void v.inner.offsetWidth; v.inner.classList.add('watered');
      v.bar.classList.remove('flash'); void v.bar.offsetWidth; v.bar.classList.add('flash');
      v.slot.classList.remove('perk'); void v.slot.offsetWidth; v.slot.classList.add('perk');
      const pc = FX.centerOf(v.root);
      FX.sparks(pc.x, pc.y, 6, '#74c0fc');
      FX.floatAt(v.root, `${shaved.toFixed(1)}s faster!`, 'water');
    }, 560);
  }

  function triggerBeeFX() {
    const c = FX.centerOf(UI.flowerBtn());
    const bee = document.createElement('div');
    bee.className = 'bee-fly';
    bee.innerHTML = Icons.get('bee');
    bee.style.setProperty('--cx', `${c.x}px`);
    bee.style.setProperty('--cy', `${c.y}px`);
    bee.style.setProperty('--ex', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--ey', `${rnd(-170, -90).toFixed(0)}px`);
    bee.style.setProperty('--xx', `${rnd(-160, 160).toFixed(0)}px`);
    bee.style.setProperty('--xy', `${rnd(90, 170).toFixed(0)}px`);
    document.body.appendChild(bee);
    setTimeout(() => bee.remove(), 1000);

    Sound.play('beeSwarm');

    setTimeout(() => {
      FX.sparks(c.x, c.y - 6, 5, '#ffc93c');
      FX.floatAt(UI.flowerBtn(), '+1 Honey', 'bee');
    }, 430);
  }

  function triggerLadybugFX(v) {
    if (!v) return;
    v.lucky.classList.add('show');
    v.lucky.classList.remove('land'); void v.lucky.offsetWidth; v.lucky.classList.add('land');
    setTimeout(() => v.lucky.classList.remove('land'), 650);

    const pc = FX.centerOf(v.root);
    FX.sparks(pc.x, pc.y - 6, 6, '#fa5252');
    FX.floatAt(v.root, 'Lucky spot!', 'lucky');
    Sound.play('ladybug');
  }

  /* ============ game events ============ */
  Game.on('currency', () => {
    if (UI.sheetMode()) UI.syncAfford();
  });

  Game.on('quest', () => {
    const c = FX.centerOf(el.questStrip);
    FX.coins(c.x, c.y, 9);
    FX.stars(c.x, c.y, 9, '#4dabf7');
    FX.ring(c.x, c.y, '#4dabf7', 0.5, 120);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    UI.renderQuestStrip();
    UI.renderRail();
  });

  Game.on('levelup', ({ to, grants }) => {
    const c = FX.centerOf(el.questStrip);
    FX.confetti(c.x, c.y, 34);
    FX.shake(9, 0.4);
    FX.haptic([20, 40, 20, 40, 40]);
    Sound.play('levelup');
    const g = grants && grants[grants.length - 1];
    let body = 'The garden is growing.';
    if (g && g.seed) body = `${g.seed.name} seeds are in the picker.`;
    else if (g && g.plot != null) body = `Plot ${g.plot + 1} can be bought with coins.`;
    else if (g && g.hive) body = 'A new hive is waiting in the Apiary.';
    else if (g && g.decor) body = 'A new decoration was added to the garden.';
    else if (g && g.gems) body = `+${g.gems} gems`;
    else if (g && g.boost) {
      const b = DATA.boosters.find((x) => x.id === g.boost);
      body = b ? `${b.name} is waiting on the tray.` : 'A boost is waiting on the tray.';
    }
    UI.toast({ title: `Level ${to}!`, body, art: Icons.get('star') });
    UI.showBanner(`Level ${to}!`, body, 2000);
    UI.renderQuestStrip();
    UI.renderRail();
  });

  Game.on('tap', (p) => {
    const c = FX.centerOf(UI.flowerBtn());
    FX.floatAt(UI.flowerBtn(), `+${fmt(p.gain)}`, p.crit ? 'crit' : '');
    FX.coins(c.x, c.y, p.crit ? 16 : 4);
    UI.popWallet('credits');
    UI.faceReact(p.crit ? 'crit' : 'tap');
    UI.noteActivity();
    if (p.crit) {
      FX.shake(7);
      FX.stars(c.x, c.y, 10, '#ffe066');
      FX.ring(c.x, c.y, '#ffe066', 0.5, 130);
      FX.haptic([12, 30, 22]);
      Sound.play('crit');
      UI.say('crit');
    } else {
      FX.haptic(7);
      Sound.play('tap', p.combo);
      if (Math.random() < 0.06) UI.say('tap');
    }
    if (p.gemDrop) {
      FX.floatAt(UI.flowerBtn(), '+1 Gem', 'gem');
      UI.popWallet('gems');
    }
    if (p.rainDance) triggerRainFX(UI.plotEls[p.rainDance.idx], p.rainDance.shaved);
    if (p.beeSwarm) triggerBeeFX();
    if (p.ladybug) triggerLadybugFX(UI.plotEls[p.ladybug.idx]);
    if (p.cardPack) {
      const v = UI.plotEls[p.cardPack.idx];
      if (v) {
        const c = FX.centerOf(v.root);
        FX.sparks(c.x, c.y, 14, '#ffe066');
        FX.ring(c.x, c.y, '#ffe066', 0.55, 80);
        Sound.play('rare');
        FX.haptic(10);
      }
    }
  });

  /* Adjacency is invisible until something points at it, and a permanent indicator would clutter
     a board kept deliberately clean. So it is shown at the moment the choice is made, then fades. */
  function flashAdjacency(idx, verbId) {
    const def = DATA.verbs[verbId];
    if (!def) return;
    const targets = Game.neighboursOf(idx);
    if (!targets.length) return;
    targets.forEach((n) => {
      const nv = UI.plotEls[n];
      if (!nv) return;
      nv.root.style.setProperty('--verb', def.tint);
      nv.root.classList.add('verb-linked');
      setTimeout(() => nv.root.classList.remove('verb-linked'), 1600);
    });
    const src = UI.plotEls[idx];
    if (src) {
      src.root.style.setProperty('--verb', def.tint);
      src.root.classList.add('verb-source');
      setTimeout(() => src.root.classList.remove('verb-source'), 1600);
    }
  }

  Game.on('weather', ({ weather }) => {
    UI.paintWeather(weather);
    if (FLOWER_LINES[weather.id]) UI.say(weather.id, weather.id === 'wonderfall');
    if (weather.id === 'wonderfall') UI.showBanner('Wonderfall', 'Anything growing might change');
  });

  const seedNameOf = (idx) => {
    const cell = S.grid[idx];
    const sd = cell && cell.seed ? Game.seedById(cell.seed) : null;
    return sd ? sd.name : '';
  };

  Game.on('mutate', ({ caught }) => {
    caught.forEach(({ idx, mutation }) => {
      const v = UI.plotEls[idx];
      const md = DATA.mutations[mutation];
      if (!v || !md) return;
      const c = FX.centerOf(v.root);
      const rank = md.rank;
      FX.sparks(c.x, c.y, 6 + rank * 6, md.tint);
      FX.ring(c.x, c.y, md.glow, 0.5, 60 + rank * 30);
      FX.float(c.x, c.y - 10, md.name, rank >= 3 ? 'legend' : rank === 2 ? 'epic' : 'rare');
      if (rank >= 3) {
        FX.shake(rank * 2);
        FX.confetti(c.x, c.y);
        UI.showBanner(md.name, `Your ${seedNameOf(idx) || 'bloom'} changed`);
      }
      Sound.play(rank >= 3 ? 'legend' : 'rare');
      FX.haptic(rank * 8);
    });
  });

  Game.on('plant', ({ idx, auto, verb }) => {
    if (!S.seen.plot) {
      S.seen.plot = true;
      Game.save();
      UI.hideCoach();
      el.game.classList.remove('onboard');
    }
    const v = UI.plotEls[idx];
    if (!v) return;
    if (verb) flashAdjacency(idx, verb);
    const c = FX.centerOf(v.root);
    FX.sparks(c.x, c.y + 8, 8, '#c99a6b');
    if (auto) {
      v.tag.classList.add('show');
      setTimeout(() => v.tag.classList.remove('show'), 1100);
    } else {
      Sound.play('plant');
      FX.haptic(10);
    }
    UI.noteActivity();
  });

  Game.on('harvest', (p) => {
    const v = UI.plotEls[p.idx];
    const c = v ? FX.centerOf(v.root) : FX.centerOf(UI.flowerBtn());
    const rk = p.rarity.key;
    FX.coins(c.x, c.y, rk === 'legend' ? 22 : rk === 'epic' ? 14 : rk === 'rare' ? 9 : 6);
    FX.float(c.x, c.y - 6, `+${fmt(p.payout)}`, rk === 'common' ? 'big' : rk);
    UI.popWallet('credits');
    UI.noteActivity();

    if (rk === 'common') {
      Sound.play('harvest');
      FX.haptic(12);
    } else {
      const tint = { rare: '#4dabf7', epic: '#b197fc', legend: '#ffd43b' }[rk];
      FX.stars(c.x, c.y, rk === 'legend' ? 16 : 9, tint);
      FX.ring(c.x, c.y, tint, 0.6, 150);
      if (rk === 'legend') {
        FX.confetti(c.x, c.y, 34);
        FX.shake(9, 0.4);
        FX.haptic([20, 40, 20, 40, 40]);
        Sound.play('legend');
        UI.say('legend', true);
      } else {
        FX.shake(rk === 'epic' ? 5 : 3);
        FX.haptic([10, 20, 14]);
        Sound.play(rk === 'epic' ? 'legend' : 'rare');
      }
      // Rare fires often enough that a toast would be noise; sparkles carry it.
      if (rk !== 'rare') {
        UI.toast({
          title: `${p.rarity.label} ${p.seed.name}!`,
          body: `Worth ${fmt(p.payout)} coins`,
          art: Flora.head(p.seed, 26),
          kind: rk
        });
      }
    }
    if (p.gemDrop) { FX.float(c.x + 26, c.y - 20, '+1 Gem', 'gem'); UI.popWallet('gems'); }
    if (p.repBonus) {
      FX.float(c.x, c.y - 40, `+${p.repBonus} Reputation`, 'big');
      UI.renderQuestStrip();
    }
    if (p.luckyHarvest) {
      FX.sparks(c.x, c.y, 8, '#fa5252');
      FX.float(c.x, c.y + 18, 'Ladybug luck!', 'lucky');
    }
    if (p.firstDiscover && !(p.milestones && p.milestones.length)) {
      FX.float(c.x - 20, c.y - 28, `${p.seed.name} discovered!`, 'big');
      if (rk === 'common' || rk === 'rare') {
        UI.toast({
          title: `${p.seed.name} discovered!`,
          body: `${Game.discoveredCount()} / ${DATA.seeds.length} in the Almanac`,
          art: Flora.head(p.seed, 26)
        });
      }
    }
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
    if (Math.random() < 0.12) UI.say('harvest');
  });

  Game.on('almanac', ({ found, milestones }) => {
    const c = FX.centerOf(el.questStrip);
    FX.coins(c.x, c.y, 9);
    FX.stars(c.x, c.y, 9, '#51cf66');
    FX.ring(c.x, c.y, '#51cf66', 0.5, 120);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    const last = milestones[milestones.length - 1];
    const boost = last.boost ? DATA.boosters.find((b) => b.id === last.boost) : null;
    const parts = [];
    if (last.rep) parts.push(`+${last.rep} reputation`);
    if (last.gems) parts.push(`+${last.gems} gem${last.gems === 1 ? '' : 's'}`);
    if (boost) parts.push(boost.name);
    UI.toast({
      title: `${last.at} species collected!`,
      body: parts.join(' · ') || `${found} / ${DATA.seeds.length} in the Almanac`,
      art: Icons.get('book')
    });
    if (last.gems) UI.popWallet('gems');
    UI.renderQuestStrip();
    UI.renderRail();
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
  });

  Game.on('mastery', ({ idx, seed, tier, gems, first, mult }) => {
    const v = UI.plotEls[idx];
    const c = v ? FX.centerOf(v.root) : FX.centerOf(el.questStrip);
    FX.stars(c.x, c.y, 9, '#ffd43b');
    FX.ring(c.x, c.y, '#ffd43b', 0.5, 110);
    Sound.play('quest');
    FX.haptic([12, 30, 22]);
    FX.float(c.x, c.y - 52, `${seed.name} Tier ${tier}`, 'big');
    FX.float(c.x, c.y - 34, signed(mult - 1), 'gem');
    // A tier lands every few harvests of a seed, so only the beats that are
    // actually rare get a toast. The rest ride on the sparkles.
    if (gems || first) {
      UI.toast({
        title: `${seed.name} · Tier ${tier}`,
        body: `${signed(mult - 1)} yield${gems ? ` · +${gems} gem${gems === 1 ? '' : 's'}` : ''}`,
        art: Flora.head(seed, 26)
      });
    }
    if (gems) UI.popWallet('gems');
    if (UI.sheetMode() === 'bonuses') UI.renderSheet(false);
  });

  Game.on('unlock', ({ idx }) => {
    const v = UI.plotEls[idx];
    if (v) {
      const c = FX.centerOf(v.root);
      FX.confetti(c.x, c.y, 22);
      FX.ring(c.x, c.y, '#8ce99a', 0.6, 120);
    }
    Sound.play('unlock');
    FX.haptic([15, 30, 15]);
    UI.say('unlock', true);
    UI.toast({ title: 'Plot unlocked!', body: 'New ground to plant on', art: Icons.get('sprout') });
  });

  Game.on('purchase', ({ kind, def }) => {
    Sound.play(kind === 'booster' ? 'boost' : 'buy');
    FX.haptic(14);
    if (kind === 'booster' && def) {
      UI.toast({ title: `${def.name} active!`, body: def.desc, art: Icons.get(def.icon), ms: 2400 });
    }
  });

  Game.on('deny', () => {
    Sound.play('deny');
    FX.shake(3, 0.16);
    FX.haptic(20);
    UI.say('broke');
  });

  Game.on('grid', () => UI.buildGarden());
  Game.on('panels', () => { if (UI.sheetMode()) UI.renderSheet(false); });
})();
