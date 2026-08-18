/* Garden Wonder — the bottom sheet: every panel that opens over the garden.

   Reaches the rest of the UI through the `UI` global — see docs/02-architecture.md. It owns the
   sheet element and everything rendered into it; the dock and HUD buttons that open it stay with
   the elements they sit on. */

(() => {
  const { $, $$, S, el, fmt, fmtTime, pct, signed, MASTERY_TRACK } = UI;

  /* ============ bottom sheet ============ */
  let sheetMode = null;
  let sheetArg = null;
  let seedSort = 'tier';

  const TABS = [
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'apiary', label: 'Apiary' },
    { id: 'craft', label: 'Craft' },
    { id: 'shop', label: 'Shop' }
  ];
  const SHOP_TABS = TABS.map((t) => t.id);

  function openSheet(mode, arg) {
    sheetMode = mode;
    sheetArg = arg;
    renderSheet(true);
    el.sheet.classList.add('open');
    el.sheet.setAttribute('aria-hidden', 'false');
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('show'));
    Sound.resume();
    Sound.play('open');
  }

  function closeSheet() {
    if (!sheetMode) return;
    sheetMode = null;
    el.sheet.classList.remove('open');
    el.sheet.style.transform = '';
    el.sheet.setAttribute('aria-hidden', 'true');
    el.scrim.classList.remove('show');
    setTimeout(() => { if (!sheetMode) el.scrim.hidden = true; }, 300);
    Sound.play('close');
  }

  function renderSheet(resetScroll) {
    if (!sheetMode) return;
    const keep = resetScroll ? 0 : el.sheetBody.scrollTop;
    const titles = {
      upgrades: 'Upgrades', apiary: 'Apiary', craft: 'Apothecary', shop: 'Shop',
      seeds: 'Choose a seed', bonuses: 'Garden Almanac', settings: 'Settings',
      quests: 'Quests', dev: 'Developer tools', welcome: 'While you were away', feed: 'Feed',
      album: ALBUM.season, cardset: 'Set', pack: 'Opening a pack'
    };
    let title = titles[sheetMode] || '';
    if (sheetMode === 'cardset') {
      const set = ALBUM.sets.find((x) => x.id === sheetArg);
      if (set) title = set.name;
    }
    el.sheetTitle.textContent = title;

    if (SHOP_TABS.includes(sheetMode)) {
      el.sheetTabs.innerHTML = TABS.map(
        (t) => `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === sheetMode}">${t.label}</button>`
      ).join('');
    } else if (sheetMode === 'seeds') {
      const opts = [['tier', 'By tier'], ['balanced', 'Balanced'], ['costAsc', 'Cheapest'], ['costDesc', 'Priciest']];
      el.sheetTabs.innerHTML = opts
        .map(([id, label]) => `<button class="tab" role="tab" data-sort="${id}" aria-selected="${id === seedSort}">${label}</button>`)
        .join('');
    } else {
      el.sheetTabs.innerHTML = '';
    }

    const render = {
      upgrades: renderUpgrades, apiary: renderApiary, craft: renderCraft, shop: renderShop,
      seeds: renderSeeds, bonuses: renderBonuses, settings: renderSettings, quests: renderQuests,
      dev: renderDev, welcome: renderWelcome, feed: renderFeed,
      album: renderAlbum, cardset: renderCardSet, pack: renderPack
    }[sheetMode];
    el.sheetBody.innerHTML = render ? render() : '';
    el.sheetBody.scrollTop = keep;
  }

  function priceTag(cost, currency, affordable, maxed) {
    if (maxed) return `<span class="price maxed">${Icons.get('check')}Maxed</span>`;
    const icon = currency === 'gems' ? 'gem' : 'coin';
    return `<span class="price ${affordable ? 'ok' : 'no'}">${Icons.get(icon)}${fmt(cost)}</span>`;
  }

  function pips(level, max = 8) {
    const shown = Math.min(level, max);
    let s = '';
    for (let i = 0; i < max; i += 1) s += `<span class="pip ${i < shown ? '' : 'off'}"></span>`;
    return `<div class="pips">${s}${level > max ? `<span class="lvl-text">+${level - max}</span>` : ''}</div>`;
  }

  const CORE_UPGRADES = [
    'tapPower', 'holdSpeed', 'critChance', 'critMult', 'comboMeter',
    'rainDance', 'beeSwarm', 'ladybug',
    'plotExpansion', 'autoWater', 'autoHarvest',
    'offlineRate', 'offlineHours'
  ];

  function upgradeCard(key) {
    const def = DATA.upgrades[key];
    const lvl = S.upgrades[key];
    const maxed = Game.upgradeMaxed(key);
    const cost = Game.upgradePrice(key);
    const can = !maxed && S.credits >= cost;
    return `<button class="card ${can ? 'affordable' : ''}" data-buy="upgrade" data-key="${key}" ${maxed ? 'disabled' : ''}>
      <div class="card-top">
        <span class="card-badge">${Icons.get(def.icon || 'badge')}</span>
        <span>
          <span class="card-title">${def.short || def.name}</span>
          <span class="card-sub">Lv ${lvl}</span>
        </span>
      </div>
      ${pips(lvl)}
      <span class="card-desc">${def.desc}</span>
      ${priceTag(cost, 'credits', can, maxed)}
    </button>`;
  }

  function renderUpgrades() {
    const core = CORE_UPGRADES.map(upgradeCard).join('');
    const harvesters = PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked).map(({ key }) => upgradeCard(key)).join('');
    const lockedCount = PLOT_AUTOPLANTERS.filter(({ idx }) => S.grid[idx].locked).length;
    return `
      <p class="sheet-note">Buy upgrades to power up your taps, speed up growth and automate the garden.</p>
      <div class="card-grid">${core}</div>
      <p class="sheet-note" style="margin-top:16px">Harvesters keep a single plot planted for you, choosing the best seed you can afford.</p>
      <div class="card-grid">${harvesters || '<p class="sheet-note">Unlock a plot to hire its harvester.</p>'}</div>
      ${lockedCount ? `<p class="sheet-note" style="margin-top:10px">${lockedCount} more harvester${lockedCount > 1 ? 's' : ''} unlock with new plots.</p>` : ''}`;
  }

  function skyCards() {
    const active = Game.weatherCallActive();
    const rows = Object.keys(DATA.weatherCall.prices).map((id) => {
      const w = DATA.weather.types.find((t) => t.id === id);
      const m = DATA.mutations[w.mutation];
      const price = Game.weatherCallPrice(id);
      const can = S.gems >= price && !active;
      return `<button class="card ${can ? 'affordable' : ''}" data-buy="sky" data-key="${id}" ${active ? 'disabled' : ''}>
        <div class="card-top">
          <span class="card-badge" style="background:${w.tint}">${Icons.get('sparkle')}</span>
          <span>
            <span class="card-title">Call ${w.name}</span>
            <span class="card-sub">${DATA.weatherCall.minutes} min &middot; everything growing gets a shot at ${m.name}</span>
          </span>
        </div>
        ${priceTag(price, 'gems', can, false)}
      </button>`;
    }).join('');
    return `<p class="dev-label">The sky</p>
      ${active ? `<p class="away-cap">${Icons.get('sparkle')}<span>A ${DATA.weather.types.find((t) => t.id === active.id).name.toLowerCase()} is already running.</span></p>` : ''}
      ${rows}
      <p class="sheet-note">Aurora and Wonderfall are not for sale &mdash; the rarest skies have to find you.</p>
      <p class="dev-label">Decor</p>`;
  }

  function renderShop() {
    const cards = DATA.decor.map((d) => {
      const owned = Game.decorCount(d.id);
      const pot = d.currency === 'gems' ? S.gems : S.credits;
      const can = pot >= d.cost;
      return `<button class="card ${can ? 'affordable' : ''}" data-buy="decor" data-key="${d.id}">
        <div class="card-top">
          <span class="card-badge">${Icons.get(d.icon)}</span>
          <span>
            <span class="card-title">${d.name}</span>
            <span class="card-sub">${owned ? `Owned x${owned}` : 'Not placed'}</span>
          </span>
        </div>
        <span class="card-desc">${d.desc}</span>
        ${priceTag(d.cost, d.currency, can)}
      </button>`;
    }).join('');
    return `${skyCards()}
      <p class="sheet-note">Purely decorative — dress up your garden however you like. Buy the same piece again for another copy.</p>
      <div class="card-grid">${cards}</div>`;
  }

  /* ---- apiary ---- */
  const honeyIco = (type) => {
    const s = Game.seedById(type);
    return s ? Flora.head(s, 22) : Icons.get('honey');
  };

  function stockRow(icon, name, qty, unit, kind, key) {
    return `<div class="stock">
      <span class="stock-ico">${icon}</span>
      <span class="stock-name">${name}<span class="stock-sub">${Icons.get('coin')}${fmt(unit)} each</span></span>
      <span class="stock-qty">x${qty}</span>
      <button class="mini" data-sell="${kind}" data-key="${key}">Sell all</button>
    </div>`;
  }

  function renderApiary() {
    const hives = S.apiary.hives;
    const waiting = Game.jarsWaiting();

    if (!hives.length) {
      const cost = Game.nextHiveCost();
      const can = S.credits >= cost;
      return `<p class="sheet-note">Bees gather nectar from whatever is blooming right now — plant
        lavender and you get lavender honey. Every hive also pollinates the garden.</p>
        <button class="card wide ${can ? 'affordable' : ''}" data-apiary="buy">
          <div class="card-top">
            <span class="card-badge">${Icons.get('hive')}</span>
            <span>
              <span class="card-title">Set up your first hive</span>
              <span class="card-sub">A jar every ${fmtTime(APIARY.interval)} · +${pct(APIARY.pollination)} garden yield</span>
            </span>
          </div>
          <span class="card-desc">Holds ${APIARY.capacity} jars before the bees knock off. Collect to keep them working.</span>
          ${priceTag(cost, 'credits', can)}
        </button>`;
    }

    const cards = hives.map((h, i) => {
      const full = h.jars.length >= APIARY.capacity;
      const next = full ? 0 : h.at + APIARY.interval;
      const names = h.jars.length
        ? [...new Set(h.jars.map((j) => APIARY.honeyName(j)))].join(', ')
        : 'Empty — the bees are out.';
      return `<div class="hive ${h.jars.length ? 'has' : ''}">
        <div class="hive-top">
          <span class="hive-ico">${Icons.get('hive')}</span>
          <span class="hive-info">
            <span class="card-title">Hive ${i + 1}</span>
            <span class="card-sub">${names}</span>
          </span>
          <span class="hive-count">${h.jars.length}/${APIARY.capacity}</span>
        </div>
        <div class="jars">${
          Array.from({ length: APIARY.capacity }, (_, j) =>
            `<span class="jar ${j < h.jars.length ? 'on' : ''}">${j < h.jars.length ? honeyIco(h.jars[j]) : ''}</span>`
          ).join('')
        }</div>
        <div class="hive-foot">
          <span class="card-sub">${full ? 'Full — collect to restart' : `Next jar in <b data-countdown="${next}">${fmtTime(Math.max(0, next - Game.nowSeconds()))}</b>`}</span>
          <button class="mini go" data-apiary="collect" data-i="${i}" ${h.jars.length ? '' : 'disabled'}>Collect</button>
        </div>
      </div>`;
    }).join('');

    const cost = Game.nextHiveCost();
    const can = S.credits >= cost;
    const buy = Game.hivesFull()
      ? '<p class="sheet-note">Every hive the meadow can hold is yours.</p>'
      : `<button class="card wide ${can ? 'affordable' : ''}" data-apiary="buy">
          <div class="card-top">
            <span class="card-badge">${Icons.get('hive')}</span>
            <span>
              <span class="card-title">Another hive</span>
              <span class="card-sub">+${pct(APIARY.pollination)} garden yield</span>
            </span>
          </div>
          ${priceTag(cost, 'credits', can)}
        </button>`;

    const honeys = Object.keys(S.apiary.honey).sort((a, b) => APIARY.honeyValue(b) - APIARY.honeyValue(a));
    const stock = honeys.map((t) =>
      stockRow(honeyIco(t), APIARY.honeyName(t), S.apiary.honey[t], APIARY.honeyValue(t), 'honey', t)
    ).join('') + (S.apiary.wax ? stockRow(Icons.get('wax'), 'Beeswax', S.apiary.wax, APIARY.waxValue, 'wax', 'wax') : '');

    return `
      <p class="sheet-note">Pollination is giving every harvest <b>+${pct(Game.pollination())}</b>.
        ${waiting ? `<b>${waiting}</b> jar${waiting > 1 ? 's' : ''} waiting.` : ''}</p>
      ${waiting > 1 ? '<button class="wide-btn" data-apiary="all">Collect every hive</button>' : ''}
      ${cards}
      ${buy}
      <p class="sheet-note" style="margin-top:16px">Stores</p>
      ${stock || '<p class="sheet-note">Nothing in the pantry yet.</p>'}`;
  }

  /* ---- apothecary ---- */
  function needLabel(n) {
    if (n.kind === 'wax') return `${n.qty} beeswax`;
    if (n.kind === 'flower') return `${n.qty} flowers`;
    if (n.of) return `${n.qty} ${APIARY.honeyName(n.of).toLowerCase()}`;
    return `${n.qty} honey`;
  }

  function haveLabel(n) {
    if (n.kind === 'wax') return S.apiary.wax;
    if (n.kind === 'flower') return Game.flowerTotal();
    if (n.of) return S.apiary.honey[n.of] || 0;
    return Game.honeyTotal();
  }

  function renderCraft() {
    const busy = S.craft.length;
    const queue = S.craft.map((c) => {
      const r = CRAFT_RECIPES.find((x) => x.id === c.id);
      return `<div class="brew">
        <span class="stock-ico">${Icons.get(r.icon)}</span>
        <span class="stock-name">${r.name}<span class="stock-sub">Ready in <b data-countdown="${c.doneAt}">${fmtTime(Math.max(0, c.doneAt - Game.nowSeconds()))}</b></span></span>
      </div>`;
    }).join('');

    const cards = CRAFT_RECIPES.map((r) => {
      const can = Game.canCraft(r);
      const parts = r.needs.map((n) => {
        const ok = haveLabel(n) >= n.qty;
        return `<span class="need ${ok ? 'ok' : 'no'}">${needLabel(n)} <b>${haveLabel(n)}/${n.qty}</b></span>`;
      }).join('');
      return `<div class="card wide recipe ${can ? 'affordable' : ''}">
        <div class="card-top">
          <span class="card-badge">${Icons.get(r.icon)}</span>
          <span>
            <span class="card-title">${r.name}</span>
            <span class="card-sub">${fmtTime(r.time)} · sells for ${fmt(r.value)}</span>
          </span>
        </div>
        <span class="card-desc">${r.desc}</span>
        <div class="needs">${parts}</div>
        <button class="mini go" data-craft="${r.id}" ${can ? '' : 'disabled'}>
          ${busy >= CRAFT_SLOTS ? 'Bench full' : 'Make'}
        </button>
      </div>`;
    }).join('');

    const goods = Object.keys(S.goods).map((id) => {
      const r = CRAFT_RECIPES.find((x) => x.id === id);
      return stockRow(Icons.get(r.icon), r.name, S.goods[id], r.value, 'good', id);
    }).join('');

    const flowers = Object.keys(S.flowers)
      .sort((a, b) => flowerValue(b) - flowerValue(a))
      .map((id) => {
        const s = Game.seedById(id);
        return `<span class="chip" title="${s ? s.name : id}">${s ? Flora.head(s, 20) : ''}<b>${S.flowers[id]}</b></span>`;
      }).join('');

    return `
      <p class="sheet-note">Every harvest keeps the bloom itself. Combine flowers with honey from the
        Apiary to make something worth far more than its parts.</p>
      <div class="chips">${flowers || '<span class="card-sub">No flowers yet — go harvest something.</span>'}
        ${S.apiary.wax ? `<span class="chip">${Icons.get('wax')}<b>${S.apiary.wax}</b></span>` : ''}</div>
      ${queue ? `<p class="sheet-note" style="margin-top:14px">On the bench (${busy}/${CRAFT_SLOTS})</p>${queue}` : ''}
      <p class="sheet-note" style="margin-top:14px">Recipes</p>
      ${cards}
      ${goods ? `<p class="sheet-note" style="margin-top:16px">Finished goods</p>${goods}` : ''}`;
  }

  function sortedSeeds() {
    const list = [...DATA.seeds];
    if (seedSort === 'costAsc') list.sort((a, b) => a.cost - b.cost);
    else if (seedSort === 'costDesc') list.sort((a, b) => b.cost - a.cost);
    else if (seedSort === 'balanced') {
      // What you could afford to plant in every plot at once, not what you
      // could afford to dump into just this one — surfaces the best tier to
      // spread across the whole garden instead of the single priciest seed.
      const unlocked = S.grid.filter((c) => !c.locked).length || 1;
      const budget = S.credits / unlocked;
      list.sort((a, b) => Math.abs(a.cost - budget) - Math.abs(b.cost - budget));
    }
    return list;
  }

  /* A verb is what the flower *does*. Shown as a tinted chip so it reads as a different kind of
     fact from the cost/time/yield numbers beside it. */
  function verbChip(seed) {
    const v = seed.verb && DATA.verbs[seed.verb];
    if (!v) return '';
    return `<span class="verb-chip" style="--verb:${v.tint}">${v.name}</span>`;
  }

  function verbNote(seed) {
    const v = seed.verb && DATA.verbs[seed.verb];
    return v ? `<span class="verb-note" style="--verb:${v.tint}">${v.desc}</span>` : '';
  }

  function renderSeeds() {
    const rows = sortedSeeds().map((s) => {
      const locked = !Game.seedUnlocked(s.id);
      const can = !locked && S.credits >= s.cost;
      const grow = Math.round(s.grow * Game.growModifier());
      const max = Math.round(s.yield * MAX_RARITY_MULT);
      const drops = [];
      if (s.gemChance) drops.push(`<span class="stat gem">${Icons.get('gem')}${pct(s.gemChance, 1)}</span>`);
      if (locked) {
        return `<div class="seed-row gated">
          <span class="seed-art">${Flora.head(s, 40)}</span>
          <span>
            <span class="seed-name">${s.name}${verbChip(s)}</span>
            <span class="seed-stats">
              <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
              <span class="stat">${Icons.get('clock')}${fmtTime(grow)}</span>
              <span class="stat good">${Icons.get('coin')}${fmt(s.yield)}–${fmt(max)}</span>
              ${drops.join('')}
            </span>
            <span class="seed-desc">${s.desc}</span>
            ${verbNote(s)}
          </span>
          <span class="seed-go">Level ${s.unlockLevel}</span>
        </div>`;
      }
      return `<button class="seed-row" data-plant="${s.id}" ${can ? '' : 'disabled'}>
        <span class="seed-art">${Flora.head(s, 40)}</span>
        <span>
          <span class="seed-name">${s.name}${verbChip(s)}</span>
          <span class="seed-stats">
            <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
            <span class="stat">${Icons.get('clock')}${fmtTime(grow)}</span>
            <span class="stat good">${Icons.get('coin')}${fmt(s.yield)}–${fmt(max)}</span>
            ${drops.join('')}
          </span>
          <span class="seed-desc">${s.desc}</span>
          ${verbNote(s)}
        </span>
        <span class="seed-go">${Icons.get(can ? 'sprout' : 'lock')}</span>
      </button>`;
    }).join('');
    return `<p class="sheet-note">Planting into plot ${(sheetArg ?? 0) + 1}. Grow times already include your sprinklers and boosts.</p>${rows}`;
  }

  function questRewardLine(def) {
    const bits = [`+${def.rep} reputation`];
    if (def.reward && def.reward.credits) bits.push(`+${fmt(def.reward.credits)} coins`);
    if (def.reward && def.reward.gems) bits.push(`+${def.reward.gems} gems`);
    if (def.reward && def.reward.boost) {
      const b = DATA.boosters.find((x) => x.id === def.reward.boost);
      if (b) bits.push(b.name);
    }
    return bits.join(' · ');
  }

  function questCard(inst, def, claimable) {
    if (!def) return '';
    const done = inst.progress >= def.qty;
    const tag = done ? 'Claim' : `${inst.progress} / ${def.qty}`;
    const reward = questRewardLine(def);
    if (claimable && done) {
      return `<button class="quest-card ready" type="button" data-claim="${def.id}">
        <span class="q-meta"><span class="seed-name">${def.text}</span>
        <span class="card-sub">${reward}</span></span>
        <span class="q-prog">${tag}</span>
      </button>`;
    }
    return `<div class="quest-card">
      <span class="q-meta"><span class="seed-name">${def.text}</span>
      <span class="card-sub">${reward}</span></span>
      <span class="q-prog">${tag}</span>
    </div>`;
  }

  function renderQuests() {
    const lv = Game.levelFromRep(S.rep);
    const into = Game.repIntoLevel(S.rep);
    const need = Game.repToNext(lv);
    const active = S.quests.active.map((inst) => questCard(inst, Game.questById(inst.id), true)).join('');
    const daily = S.quests.daily;
    const ddef = daily && daily.id ? Game.questById(daily.id) : null;
    const dailyHtml = ddef && !daily.claimed
      ? questCard(daily, ddef, true)
      : `<p class="sheet-note">Today's quest is done. A new one arrives tomorrow.</p>`;
    const left = DATA.quests.length - S.quests.done.length;
    const tail = lv >= 17
      ? 'No new seeds past level 17 until the Market opens. Reputation still fills the bar.'
      : `${left} quest${left === 1 ? '' : 's'} left on the ladder.`;
    return `
      <p class="sheet-note">Level ${lv} · ${fmt(into)} / ${fmt(need)} reputation to the next level.</p>
      <p class="sheet-note" style="margin-top:4px">${tail}</p>
      <p class="sheet-note" style="margin-top:14px">Now</p>
      ${active || '<p class="sheet-note">The ladder is complete.</p>'}
      <p class="sheet-note" style="margin-top:14px">Today</p>
      ${dailyHtml}`;
  }

  /* Every creature in the game, home or not. A creature you have not met is a
     named silhouette with its hint showing, because a locked thing you can see
     is a goal and a missing one is nothing. */
  /* Stars, not the word "level" — a glance should say how grown a creature is. */
  /* A fed creature is working one star above itself, and the lit star sits in
     the slot it is working at — appended after the row instead, it reads as a
     sixth star rather than as "this one is on loan". A five-star creature is
     the only case that genuinely grows a sixth pip. */
  function critterStars(level, fed = false) {
    let out = '';
    for (let i = 1; i <= CREATURE_STARS; i += 1) {
      const on = i <= level;
      const lent = fed && i === level + 1;
      out += `<span class="cr-star${on ? '' : lent ? ' fed' : ' off'}">${Icons.get('star')}</span>`;
    }
    if (fed && level >= CREATURE_STARS) out += `<span class="cr-star fed">${Icons.get('star')}</span>`;
    return `<span class="critter-stars" aria-label="${level} of ${CREATURE_STARS} stars${
      fed ? ', well fed' : ''}">${out}</span>`;
  }

  /* Unformed pairs show both portraits with the effect hidden — a locked thing you
     can see is a goal, a missing one is nothing. Same rule as the seed picker. */
  function pairRows() {
    return CREATURE_PAIRS.map((pair) => {
      const on = Game.pairActive(pair.id);
      const seen = S.pairsSeen.indexOf(pair.id) !== -1;
      const faces = pair.of.map((id) => {
        const def = Game.critterById(id);
        const home = Game.critterHere(id);
        return `<span class="pair-face${home ? '' : ' unmet'}" title="${def.name}">${Critters.draw(def)}</span>`;
      }).join('');
      const names = pair.of.map((id) => Game.critterById(id).name).join(' + ');
      return `<div class="pair-row${on ? ' on' : ''}${seen ? '' : ' dim'}">
        <span class="pair-faces">${faces}</span>
        <span class="pair-copy">
          <span class="pair-name">${seen ? pair.name : '???'}${on ? '<em>active</em>' : ''}</span>
          <span class="pair-note">${seen ? pair.desc : 'Have both of them tending to find out.'}</span>
          <span class="pair-who">${names}</span>
        </span>
      </div>`;
    }).join('');
  }

  function critterRows() {
    return CREATURES.map((def) => {
      const home = Game.critterHere(def.id);
      const tending = Game.critterTending(def.id);
      const trait = def.trait ? CREATURE_TRAITS[def.trait.id] : null;
      const seed = Game.seedById(def.attract.seed);
      const have = Game.critterProgress(def);
      const want = def.attract.count;

      if (!home) {
        return `<div class="critter-row dim">
          <span class="critter-face">${Critters.draw(def)}</span>
          <span class="critter-copy">
            <span class="critter-who">${def.name} <em>· ${def.species}</em></span>
            <span class="critter-note">${def.hint}</span>
            <span class="critter-note">${Math.min(have, want)} / ${want} ${seed ? seed.name : ''} harvested</span>
            ${trait ? `<span class="critter-trait">${Icons.get(trait.icon)}<b>${trait.name}:</b> ${
              (trait.maxDesc || trait.desc)(def.trait.value)}</span>` : ''}
          </span>
        </div>`;
      }

      const level = Game.critterLevel(def.id);
      const fed = Game.critterFed(def.id);
      const held = Game.mementoCount(def.keepsake.id);
      const goal = Game.critterGoal(def.id);
      const now = trait ? Game.critterTraitAt(def, Game.critterWorkLevel(def.id)) : 0;
      const canTend = tending || Game.habitatFree() > 0;
      const grow = goal
        ? `<span class="critter-grow">
             <i style="transform:scaleX(${Math.min(1, goal.have / goal.qty).toFixed(3)})"></i>
             <span>${fmt(Math.min(goal.have, goal.qty))} / ${fmt(goal.qty)} ${seed ? seed.name : ''} to ★${goal.level}</span>
           </span>`
        : '<span class="critter-note">Fully grown.</span>';

      return `<div class="critter-row${tending ? ' tending' : ''}">
        <span class="critter-face">${Critters.draw(def)}</span>
        <span class="critter-copy">
          <span class="critter-who">${def.name} <em>· ${def.species}</em>${critterStars(level, fed)}</span>
          <span class="critter-note">${def.about}</span>
          ${trait ? `<span class="critter-trait">${Icons.get(trait.icon)}<b>${trait.name}:</b> ${trait.desc(now)}</span>` : ''}
          ${grow}
          ${held > 0
            ? `<span class="critter-memento">${Icons.get('gift')}${def.keepsake.name} <b>×${fmt(held)}</b></span>`
            : `<span class="critter-memento none">${Icons.get('gift')}No ${def.keepsake.name} yet</span>`}
        </span>
        <button class="critter-toggle" data-tend="${def.id}" data-on="${tending ? '1' : '0'}"
          ${canTend ? '' : 'disabled'}>${tending ? 'Tending' : 'Resting'}</button>
      </div>`;
    }).join('');
  }

  /* `fmtTime` stops at minutes, which is right for a grow timer and useless for
     a twelve-hour feed. */
  function fmtSpan(sec) {
    const s = Math.max(0, Math.round(sec));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  /* Feeding buys a star for a while and nothing more. A creature that has not
     been fed works exactly as it always did — see docs/22-creatures.md, where
     the reason that matters is stated at some length. */
  function foodButtons(id) {
    return CREATURE_FOOD.map((f) => {
      const room = Game.foodGain(id, f.id) > 0;
      const can = room && S.credits >= f.cost;
      return `<button class="food-btn${can ? ' affordable' : ''}" data-feed="${f.id}" data-who="${id}"
        ${room ? '' : 'disabled'} title="${f.desc}">
        <span class="food-ico">${Icons.get(f.icon)}</span>
        <span class="food-name">${f.name}</span>
        <span class="food-hours">+${f.hours}h</span>
        ${priceTag(f.cost, 'credits', can)}
      </button>`;
    }).join('');
  }

  function feedRows() {
    const home = Game.crittersHome();
    if (!home.length) {
      return '<p class="stat-note">Nobody lives here yet. Grow what they like and they will turn up.</p>';
    }
    return home.map((def) => {
      const tending = Game.critterTending(def.id);
      const fed = Game.critterFed(def.id);
      const level = Game.critterLevel(def.id);
      const trait = def.trait ? CREATURE_TRAITS[def.trait.id] : null;
      const now = trait ? Game.critterTraitAt(def, Game.critterWorkLevel(def.id)) : 0;

      const status = !tending
        ? '<span class="critter-note">Resting. Send it out in the Hollow to feed it.</span>'
        : fed
          ? `<span class="food-state on">${Icons.get('clock')}<span>Well fed for
             <b data-span="${Math.round(Game.nowSeconds() + Game.critterFedFor(def.id))}">${
               fmtSpan(Game.critterFedFor(def.id))}</b>
             — working like ★${Game.critterWorkLevel(def.id)}</span></span>`
          : `<span class="food-state">${Icons.get('clock')}<span>Not fed. Working like ★${level}, which is fine.</span></span>`;

      /* The food buttons sit outside the text column so they get the row's full
         width — nested beside a 46px portrait, three of them wrap to 2 + 1. */
      return `<div class="critter-row feed-row${tending ? '' : ' dim'}${fed ? ' fed' : ''}">
        <span class="feed-top">
          <span class="critter-face">${Critters.draw(def)}</span>
          <span class="critter-copy">
            <span class="critter-who">${def.name} <em>· ${def.species}</em>${critterStars(level, fed)}</span>
            ${trait ? `<span class="critter-trait">${Icons.get(trait.icon)}<b>${trait.name}:</b> ${trait.desc(now)}</span>` : ''}
            ${status}
          </span>
        </span>
        ${tending ? `<span class="food-row">${foodButtons(def.id)}</span>` : ''}
      </div>`;
    }).join('');
  }

  function renderFeed() {
    return `<div class="panel">
      <p class="stat-note">A fed creature works <b>one star above itself</b> until the food runs
        out. Nothing ever switches off — an unfed creature works exactly as it always did, so this
        is a treat rather than an upkeep.</p>
      <p class="stat-note">You can keep a creature fed up to <b>${FOOD_CAP_HOURS} hours</b> ahead.</p>
      ${feedRows()}
    </div>`;
  }

  function renderBonuses() {
    const tapMult = (1 + Game.boostVal('tapPower')) * (1 + Game.boostVal('globalCredits'));
    const tapEff = S.tap.power * tapMult * Game.wonderMult();
    const critChance = Game.critChanceNow();
    const critMult = S.tap.critMult;
    const growBonus = Math.max(0, 1 - Game.growModifier());
    const harvestBonus = Game.boostVal('globalCredits');
    const ah = S.upgrades.autoHarvest;
    const found = Game.discoveredCount();
    const total = DATA.seeds.length;
    const fill = total ? found / total : 0;

    const line = (k, v, d) => `<div class="stat-line"><span class="kk"><span class="k">${k}</span>${d ? `<span class="d">${d}</span>` : ''}</span><span class="v">${v}</span></div>`;

    const harvesters = PLOT_AUTOPLANTERS.map(({ key, name, idx }) => {
      const lvl = S.upgrades[key];
      if (!lvl) return null;
      const seed = DATA.seeds[Math.min(lvl - 1, DATA.seeds.length - 1)];
      return line(`${name}`, `Lv ${lvl}`, `Plants up to ${seed.name}${S.grid[idx].locked ? ' (plot locked)' : ''}`);
    }).filter(Boolean).join('');

    const seedRows = DATA.seeds.map((s) => {
      const n = Game.discoveredOf(s.id);
      const best = Game.bestRarityOf(s.id);
      const rdef = best ? DATA.rarity.find((r) => r.key === best) : null;
      const goal = Game.masteryGoal(s.id);
      const head = `<span class="n"><span class="almanac-bloom">${Flora.head(s, 22)}</span>${s.name}</span>`;
      if (!goal || !rdef) {
        return `<div class="almanac-row dim">
          <div class="almanac-row-top">${head}<span class="r">—</span><span class="c">—</span></div>
        </div>`;
      }
      const fill = goal.qty ? Math.max(0, Math.min(1, goal.have / goal.qty)) : 0;
      const gemTier = DATA.masteryGemEvery && goal.tier % DATA.masteryGemEvery === 0;
      return `<div class="almanac-row">
        <div class="almanac-row-top">
          ${head}
          <span class="r r-${rdef.key}">${rdef.label}</span>
          <span class="c">×${fmt(n)}</span>
        </div>
        <div class="almanac-row-goal">
          <span class="g">Tier ${goal.tier} · ${fmt(goal.have)} / ${fmt(goal.qty)} ${MASTERY_TRACK[goal.track]}${gemTier ? `<span class="gem-pip">${Icons.get('gem')}</span>` : ''}</span>
          <i class="mastery-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${goal.qty}" aria-valuenow="${Math.min(goal.have, goal.qty)}" aria-label="${s.name} mastery tier ${goal.tier}"><b style="transform:scaleX(${fill})"></b></i>
          <span class="y">${signed(Game.masteryMult(s.id) - 1)}</span>
        </div>
      </div>`;
    }).join('');

    const milestoneRows = Game.almanacMilestones().map((m) => {
      const boost = m.boost ? DATA.boosters.find((b) => b.id === m.boost) : null;
      const reward = [
        m.rep ? `★${m.rep}` : '',
        m.gems ? `${m.gems} gem${m.gems === 1 ? '' : 's'}` : '',
        boost ? boost.name : ''
      ].filter(Boolean).join(' · ');
      const status = m.claimed ? 'Collected' : `${m.at} / ${total}`;
      return line(`${m.at} species`, status, reward);
    }).join('');

    return `
      <div class="stat-block">
        <h3>${Icons.get('book')} Collection</h3>
        <div class="almanac-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${found}" aria-label="${found} of ${total} discovered">
          <i style="transform:scaleX(${fill})"></i>
          <span>${found} / ${total} discovered</span>
        </div>
        ${milestoneRows}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sprout')} Seed Almanac</h3>
        ${seedRows}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sparkle')} The Habitat</h3>
        <p class="stat-note">${Game.habitatUsed()} of ${Game.habitatSlots()} tending${
          Game.habitatFree() > 0 ? '' : ' — rest one to swap another in'}${
          Game.mementoTotal() ? ` · ${fmt(Game.mementoTotal())} keepsakes kept` : ''}</p>
        ${critterRows()}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('clover')} Companions</h3>
        <p class="stat-note">${S.pairsSeen.length} of ${CREATURE_PAIRS.length} found${
          Game.activePairs().length ? ` · ${Game.activePairs().length} active now` : ''}</p>
        ${pairRows()}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('fist')} Tap Power</h3>
        ${line('Per tap', fmt(tapEff), `Base ${S.tap.power} · ${signed(tapMult - 1)} from boosts`)}
        ${line('Hold-to-tap rate', `${(S.tap.holdInterval / 1000).toFixed(2)}s`, 'Hold the flower for automatic taps')}
        ${line('Crit chance', pct(critChance, 1), 'Chance for a big bonus tap')}
        ${line('Crit multiplier', `${critMult.toFixed(1)}x`, 'Payout spike when a crit lands')}
        ${line('Combo cap', `${S.tap.comboMax}`, `${Game.comboMult().toFixed(2)}× now · +1% per combo`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sparkle')} Tap Bonuses</h3>
        ${S.upgrades.rainDance
          ? line('Rain Dance', pct(S.upgrades.rainDance * 0.002, 1), 'Chance per tap to instantly water a growing plot')
          : line('Rain Dance', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.beeSwarm
          ? line('Bee Swarm', pct(S.upgrades.beeSwarm * 0.002, 1), 'Chance per tap to fill a jar in an open hive')
          : line('Bee Swarm', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.ladybug
          ? line('Lucky Ladybug', pct(S.upgrades.ladybug * 0.002, 1), 'Chance per tap to boost a growing plot\u2019s rarity odds')
          : line('Lucky Ladybug', 'Locked', 'Buy it in Upgrades to unlock')}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sprout')} Garden Mastery</h3>
        ${line('Growth speed', signed(growBonus), 'Sprinklers and boosts')}
        ${line('Rarity odds', signed(Game.boostVal('rarityWeight')), 'Chance of Rare, Epic and Legendary harvests')}
        ${line('Harvest yield', signed(harvestBonus), 'Extra credits on every harvest')}
        ${line('Wonder bonus', Game.wonderActive() ? `x${WONDER.payoutMult} active` : 'Idle', `Triggers randomly — ${S.stats.wonders || 0} so far`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('drone')} Automation</h3>
        ${ah ? line('Harvest Drone', `Lv ${ah}`, `Collects a ready plot every ${Math.max(0.7, 3 - ah * 0.5).toFixed(1)}s`) : line('Harvest Drone', 'Locked', 'Buy it to auto-collect')}
        ${harvesters || line('Harvesters', 'None hired', 'Hire them in the Upgrades tab')}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('star')} Records</h3>
        ${line('Taps', fmt(S.stats.totalTaps))}
        ${line('Crits', fmt(S.stats.totalCrits))}
        ${line('Harvests', fmt(S.stats.totalHarvests))}
        ${line('Wonder Effects', fmt(S.stats.wonders || 0))}
      </div>`;
  }

  let resetArmed = false;
  function renderSettings() {
    return `
      <div class="set-row">
        <span class="lbl">${Icons.get('sound')} Sound effects</span>
        <button class="toggle" data-toggle="sfx" aria-pressed="${S.prefs.sfx}"><i></i></button>
      </div>
      <div class="set-row">
        <span class="lbl">${Icons.get('music')} Ambient music</span>
        <button class="toggle" data-toggle="music" aria-pressed="${S.prefs.music}"><i></i></button>
      </div>
      <p class="sheet-note">Your garden saves automatically to this browser.</p>
      <button class="big-btn magic" data-act="cheat">${Icons.get('gem')} Grant 50 Gems</button>
      <button class="big-btn magic" data-act="cheatGold">${Icons.get('coin')} Grant 1,000,000 Gold</button>
      <button class="big-btn" data-act="wonder">${Icons.get('sparkle')} Summon a Wonder Effect</button>
      <button class="big-btn danger" data-act="reset">${Icons.get('trash')} ${resetArmed ? 'Tap again to erase everything' : 'Reset save'}</button>
      <p class="sheet-note" style="margin-top:14px;text-align:center">Garden Wonder · progress carried over from Idle Garden Reborn</p>`;
  }

  /* ---- the card album ---- */

  /* Card art is a slot. `{ icon, tint }` composes a placeholder from the existing icon vocabulary;
     `{ src }` would drop in a real illustration without touching this function. Nothing here knows
     or cares which it got. */
  function cardArt(card, size) {
    const a = card.art || {};
    if (a.src) return `<img class="card-img" src="${a.src}" alt="" width="${size}" height="${size}">`;
    return `<span class="card-motif" style="--motif:${a.tint || '#d8cfc0'};width:${size}px;height:${size}px">
      ${Icons.get(a.icon || 'petal')}</span>`;
  }

  const starRow = (n, lit) => {
    let out = '';
    for (let i = 0; i < n; i += 1) out += `<i class="cstar${i < lit ? ' on' : ''}">${Icons.get('star')}</i>`;
    return `<span class="cstars">${out}</span>`;
  };

  function renderAlbum() {
    const owned = Game.albumOwned();
    const total = Game.albumTotal();
    const tiles = ALBUM.sets.map((set) => {
      const n = Game.setOwned(set.id);
      const done = n === 9;
      return `<button class="set-tile${done ? ' done' : ''}" data-set="${set.id}" style="--set:${set.tint}">
        <span class="set-ring">${Icons.get(done ? 'check' : 'book')}</span>
        <span class="set-name">${set.name}</span>
        <span class="set-bar"><i style="width:${(n / 9) * 100}%"></i><b>${n}/9</b></span>
      </button>`;
    }).join('');
    return `
      <div class="album-head">
        <p class="album-lede">Collect nine cards to finish a set, and every set to finish the album.</p>
        <span class="album-bar"><i style="width:${(owned / total) * 100}%"></i><b>${owned} / ${total}</b></span>
      </div>
      ${S.packs ? `<button class="big-btn magic" data-act="openPack">Open a pack &middot; ${fmt(S.packs)} waiting</button>`
        : '<p class="sheet-note">No packs right now. They turn up from quests, levels and the odd surprise in the garden.</p>'}
      <div class="set-grid">${tiles}</div>`;
  }

  function renderCardSet() {
    const set = ALBUM.sets.find((x) => x.id === sheetArg) || ALBUM.sets[0];
    const n = Game.setOwned(set.id);
    const cards = set.cards.map((card) => {
      const have = Game.hasCard(card.id);
      const r = Game.rarityDef(card.rarity);
      const copies = Game.cardCount(card.id);
      return `<button class="cardcell${have ? ' have' : ''}" data-card="${card.id}">
        ${starRow(r.stars, have ? r.stars : 0)}
        <span class="cardface" style="--set:${set.tint}">
          ${have ? cardArt(card, 46) : ''}
          <span class="cardname">${card.name}</span>
        </span>
        ${have && copies > 1 ? `<span class="cdupe">+${copies - 1}</span>` : ''}
      </button>`;
    }).join('');
    return `
      <div class="setbar" style="--set:${set.tint}">
        <span class="set-ring">${Icons.get(n === 9 ? 'check' : 'book')}</span>
        <span class="setbar-txt">
          <b>${n === 9 ? 'Complete' : `${n} of 9 collected`}</b>
          <span class="set-bar"><i style="width:${(n / 9) * 100}%"></i><b>${n}/9</b></span>
        </span>
      </div>
      <div class="card-grid9">${cards}</div>
      <button class="big-btn" data-act="backToAlbum">Back to the album</button>`;
  }

  /* The opening is the feature. Cards reveal one at a time, rarity telegraphed before the card is
     legible, and a duplicate has to read differently from a new card at a glance. */
  let packQueue = [];
  let packShown = 0;

  let packCompleted = [];

  function celebrateCard() {
    const item = packQueue[packShown];
    if (!item) return;
    const r = Game.rarityDef(item.card.rarity);
    const node = $('.pack-card', el.sheetBody);
    const c = node ? FX.centerOf(node) : FX.centerOf(el.sheetBody);
    if (!item.isNew) { Sound.play('close'); return; }
    FX.sparks(c.x, c.y, 6 + r.stars * 5, item.set.tint);
    if (r.stars >= 4) {
      FX.confetti(c.x, c.y);
      FX.shake(r.stars);
      Sound.play('legend');
    } else if (r.stars === 3) {
      FX.ring(c.x, c.y, '#ffffff', 0.5, 90);
      Sound.play('rare');
    } else {
      Sound.play('coin');
    }
    FX.haptic(r.stars * 6);
  }

  function renderPack() {
    const item = packQueue[packShown];
    if (!item) return '<p class="sheet-note">Nothing left in this pack.</p>';
    const r = Game.rarityDef(item.card.rarity);
    const last = packShown >= packQueue.length - 1;
    return `
      <div class="pack-reveal r-${item.card.rarity}${item.isNew ? ' is-new' : ''}">
        ${starRow(r.stars, r.stars)}
        <div class="pack-card" style="--set:${item.set.tint}">
          ${cardArt(item.card, 96)}
          <span class="pack-name">${item.card.name}</span>
        </div>
        <p class="pack-tag">${item.isNew ? `New &middot; ${r.label}` : `Already had it &middot; ${item.copies} copies`}</p>
        <p class="sheet-note">${item.set.name}</p>
      </div>
      <button class="big-btn magic" data-act="${last ? 'packDone' : 'packNext'}">
        ${last ? 'Done' : `Next &middot; ${packShown + 1} of ${packQueue.length}`}</button>`;
  }

  /* The welcome-back scene. Deliberately a list of things that *happened* rather than a total —
     "a thunderstorm passed and your Marigold came back Gilded" is a garden that lived without you,
     where "+4,213 coins" is a receipt. See docs/18-mutations-and-weather.md. */
  let awayReport = null;

  function awayWords(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return `${d} day${d === 1 ? '' : 's'}`;
    }
    if (h) return `${h} hour${h === 1 ? '' : 's'}${m ? ` and ${m} minute${m === 1 ? '' : 's'}` : ''}`;
    return `${Math.max(1, m)} minute${m === 1 ? '' : 's'}`;
  }

  function renderWelcome() {
    if (!awayReport) return '';
    const r = awayReport;
    const lines = [];

    if (r.earned) {
      lines.push(`<li class="away-earn">${Icons.get('coin')}<span>The garden kept working and banked <b>${fmt(r.earned)}</b> coins.</span></li>`);
    }
    if (r.ripened) {
      lines.push(`<li>${Icons.get('sprout')}<span><b>${r.ripened}</b> ${r.ripened === 1 ? 'bloom is' : 'blooms are'} ready to pick.</span></li>`);
    }
    r.caught.forEach((c) => {
      const m = DATA.mutations[c.mutation];
      const w = c.weather && c.weather.name ? c.weather.name.toLowerCase() : 'the weather';
      lines.push(`<li style="--mut:${m.tint}" class="away-mut">${Icons.get('sparkle')}<span>${w === 'clear' ? 'Something' : `A spell of ${w}`} passed. Your <b>${c.seed.name}</b> came back <b>${m.name}</b>.</span></li>`);
    });
    if (r.jars) {
      lines.push(`<li>${Icons.get('hive')}<span>The bees left <b>${r.jars}</b> ${r.jars === 1 ? 'jar' : 'jars'}.</span></li>`);
    }

    return `
      <p class="away-lede">You were gone <b>${awayWords(r.away)}</b>. The garden kept going.</p>
      <ul class="away-list">${lines.join('')}</ul>
      ${r.capped ? `<p class="away-cap">${Icons.get('lantern')}<span>The lantern burned out after <b>${r.capHours}h</b> — after that the garden only ticked over. Lantern Oil keeps it lit longer.</span></p>` : ''}
      <p class="sheet-note">The sky is ${r.weather.name.toLowerCase()} right now.${r.rate ? ` The garden works at ${Math.round(r.rate * 100)}% pace while you are gone.` : ''}</p>
      <button class="big-btn magic" data-act="closeWelcome">Back to the garden</button>`;
  }

  /* Development tools. Everything here forces an outcome through the real code path rather than
     faking an effect, so a cheat exercises the feature it claims to test. Reached from an
     unlabelled hit area beside the gem wallet. */
  function devRow(label, buttons) {
    return `<p class="dev-label">${label}</p><div class="dev-row">${buttons}</div>`;
  }

  function renderDev() {
    const pending = Game.Dev.pending();
    const boosted = pending.boost || [];
    const wx = DATA.weather.types.map((w) =>
      `<button class="dev-btn${pending.weather === w.id ? ' on' : ''}" data-dev="weather" data-arg="${w.id}">${w.name}</button>`).join('');
    const muts = Object.entries(DATA.mutations).map(([id, m]) =>
      `<button class="dev-btn" style="--dev:${m.tint}" data-dev="mutate" data-arg="${id}">${m.name}</button>`).join('');
    const rars = DATA.rarity.slice(1).map((r) =>
      `<button class="dev-btn${pending.rarity === r.key ? ' on' : ''}" data-dev="rarity" data-arg="${r.key}">${r.label}</button>`).join('');

    const armed = [];
    if (pending.rarity) armed.push(`next harvest: ${pending.rarity}`);
    if (pending.gem) armed.push('next harvest: gem');
    if (pending.weather) armed.push(`weather held: ${pending.weather}`);
    if (boosted.length) armed.push(`procs boosted to 50%: ${boosted.join(', ')}`);

    return `
      <p class="sheet-note">Nothing here is random. Each button forces the real system, so the
      animation you see is the one players get.</p>
      ${armed.length ? `<p class="dev-armed">Armed — ${armed.join(' · ')}</p>` : ''}
      ${devRow('Hold the weather', wx + '<button class="dev-btn warn" data-dev="weather" data-arg="">Release</button>')}
      ${devRow('Mutate a growing plot now', muts)}
      ${devRow('Arm the next harvest', rars + '<button class="dev-btn" data-dev="gem" data-arg="1">Gem drop</button>')}
      ${devRow('Boost a tap proc — stays on, then just tap the flower', `
        <button class="dev-btn${boosted.includes('rainDance') ? ' on' : ''}" data-dev="proc" data-arg="rainDance">Rain Dance</button>
        <button class="dev-btn${boosted.includes('beeSwarm') ? ' on' : ''}" data-dev="proc" data-arg="beeSwarm">Bee Swarm</button>
        <button class="dev-btn${boosted.includes('ladybug') ? ' on' : ''}" data-dev="proc" data-arg="ladybug">Lucky Ladybug</button>`)}
      ${devRow('Trigger now', '<button class="dev-btn" data-dev="wonder" data-arg="1">Wonder Effect</button>')}
      ${devRow('Garden', `
        <button class="dev-btn" data-dev="fill" data-arg="1">Fill plots</button>
        <button class="dev-btn" data-dev="ripen" data-arg="1">Ripen all</button>
        <button class="dev-btn" data-dev="hive" data-arg="1">Add hive</button>`)}
      ${devRow('Cards', `
        <button class="dev-btn" data-dev="packs" data-arg="1">+1 pack</button>
        <button class="dev-btn" data-dev="packs" data-arg="10">+10 packs</button>
        <button class="dev-btn" data-dev="packs" data-arg="60">+60 packs</button>
        <button class="dev-btn" data-dev="card" data-arg="">+1 card</button>
        <button class="dev-btn" data-dev="card" data-arg="mythic">+1 mythical</button>
        <button class="dev-btn" data-dev="completeSet" data-arg="1">Complete a set</button>
        <button class="dev-btn" data-dev="dropPack" data-arg="1">Drop a pack in the garden</button>`)}
      ${devRow('Simulate an absence', `
        <button class="dev-btn" data-dev="away" data-arg="3">3 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="6">6 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="12">12 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="24">24 hours</button>`)}
      ${devRow('Give', `
        <button class="dev-btn" data-dev="gold" data-arg="1">+1M gold</button>
        <button class="dev-btn" data-dev="gems" data-arg="1">+50 gems</button>
        <button class="dev-btn" data-dev="level" data-arg="1">+1 level</button>
        <button class="dev-btn" data-dev="level" data-arg="5">+5 levels</button>`)}
      <button class="big-btn" data-dev="clear" data-arg="1">Clear everything armed</button>
      <p class="sheet-note">Day phase ${(Game.dayPhase() * 100).toFixed(0)}% · ${Game.isNight() ? 'night' : 'day'} ·
      sky now ${Game.currentWeather().name}</p>`;
  }

  function handleDev(what, arg) {
    const D = Game.Dev;
    let redraw = true;
    let ok = true;
    switch (what) {
      case 'weather': D.setWeather(arg); break;
      case 'mutate': ok = Boolean(D.mutate(arg)); redraw = false; break;
      case 'rarity': D.armRarity(arg); break;
      case 'gem': D.armGem(); break;
      case 'proc': D.toggleProc(arg); break;
      case 'wonder': Game.startWonder(); redraw = false; break;
      case 'fill': ok = D.fillGarden() > 0; break;
      case 'ripen': ok = D.ripenAll() > 0; break;
      case 'hive': S.credits += Game.nextHiveCost(); ok = Game.buyHive(); break;
      case 'gold': S.credits += 1e6; Game.save(); Game.emit('currency'); break;
      case 'gems': S.gems += 50; Game.save(); Game.emit('currency'); break;
      case 'level': D.grantLevels(Number(arg) || 1); break;
      case 'away': {
        const report = D.simulateAway(Number(arg) || 3);
        ok = Boolean(report);
        if (ok) { awayReport = report; closeSheet(); setTimeout(() => openSheet('welcome'), 260); }
        redraw = false;
        break;
      }
      case 'packs': Game.grantPacks(Number(arg) || 1); break;
      case 'card': {
        const got = D.grantCard(arg || null);
        ok = Boolean(got);
        if (ok) {
          UI.toast({ title: got.isNew ? 'New card' : 'Another copy', body: `${got.card.name} — ${got.set.name}`, art: Icons.get('cards') });
          if (got.completedSet) UI.showBanner('Set complete', got.set.name);
        }
        redraw = false;
        break;
      }
      case 'completeSet': {
        const set = D.completeSet();
        ok = Boolean(set);
        if (ok) UI.showBanner('Set complete', set.name);
        redraw = false;
        break;
      }
      case 'dropPack': ok = Boolean(D.dropPack()); redraw = false; break;
      case 'clear': D.clearAll(); break;
      default: ok = false;
    }
    /* A cheat that quietly did nothing is worse than no cheat — say so. Most failures are a
       precondition, like mutating with nothing in the ground. */
    if (!ok) {
      Sound.play('deny');
      FX.shake(4);
      UI.toast({ title: 'Nothing to apply', body: 'That cheat needs something in the garden first.' });
    } else {
      Sound.play(what === 'clear' ? 'close' : 'buy');
    }
    if (redraw) renderSheet(true);
  }

  /* ---- sheet interactions ---- */
  el.sheetTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    if (tab.dataset.tab) { sheetMode = tab.dataset.tab; renderSheet(true); Sound.play('open'); }
    else if (tab.dataset.sort) { seedSort = tab.dataset.sort; renderSheet(true); }
  });

  el.sheetBody.addEventListener('click', (e) => {
    /* Its own data attribute rather than data-buy — syncAfford()'s final else
       treats anything unrecognised as a booster and throws. */
    const tend = e.target.closest('[data-tend]');
    if (tend) {
      const id = tend.dataset.tend;
      if (Game.setTending(id, !Game.critterTending(id))) {
        Sound.play('tap');
        renderSheet(false);
        UI.renderCritters();
      }
      return;
    }
    /* Its own attribute rather than data-buy, for the same reason data-apiary
       and data-craft have theirs — syncAfford() below keys off the kind. */
    const feed = e.target.closest('[data-feed]');
    if (feed) {
      const got = Game.feedCritter(feed.dataset.who, feed.dataset.feed);
      if (got) {
        const c = FX.centerOf(feed);
        FX.sparks(c.x, c.y, 12, got.def.art.glow);
        FX.stars(c.x, c.y, 5, '#ffe066');
        Sound.play('quest');
        FX.haptic(10);
        UI.toast({
          title: `${got.def.name} is well fed`,
          body: `Working like ★${Game.critterWorkLevel(got.def.id)} for ${fmtSpan(Game.critterFedFor(got.def.id))}.`,
          art: Icons.get(got.food.icon)
        });
        renderSheet(false);
        UI.renderCritters();
      }
      return;
    }
    const claim = e.target.closest('[data-claim]');
    if (claim && claim.dataset.claim) {
      if (Game.claimQuest(claim.dataset.claim)) Sound.resume();
      return;
    }
    const api = e.target.closest('[data-apiary]');
    if (api) {
      const what = api.dataset.apiary;
      if (what === 'buy') {
        if (Game.buyHive()) {
          const c = FX.centerOf(api);
          FX.sparks(c.x, c.y, 14, '#ffc93c');
          FX.ring(c.x, c.y, '#ffe066', 0.5, 80);
          Sound.play('buy');
        } else { Sound.play('deny'); FX.shake(4); }
      } else {
        const got = what === 'all' ? Game.collectAllHives() : [Game.collectHive(Number(api.dataset.i))].filter(Boolean);
        const jars = got.reduce((a, r) => a + r.jars.length, 0);
        const wax = got.reduce((a, r) => a + r.wax, 0);
        if (jars) {
          const c = FX.centerOf(api);
          FX.coins(c.x, c.y, Math.min(12, jars * 2));
          Sound.play('coin');
          UI.toast({
            title: `${jars} jar${jars > 1 ? 's' : ''} collected`,
            body: wax ? `and ${wax} beeswax` : 'straight to the pantry',
            art: Icons.get('honey')
          });
        }
      }
      return;
    }
    const craft = e.target.closest('[data-craft]');
    if (craft) {
      if (Game.startCraft(craft.dataset.craft)) {
        const c = FX.centerOf(craft);
        FX.sparks(c.x, c.y, 10, '#8ce0ff');
        Sound.play('buy');
      } else { Sound.play('deny'); FX.shake(4); }
      return;
    }
    const sellBtn = e.target.closest('[data-sell]');
    if (sellBtn) {
      const total = Game.sell(sellBtn.dataset.sell, sellBtn.dataset.key, true);
      if (total) {
        const c = FX.centerOf(sellBtn);
        FX.coins(c.x, c.y, 8);
        FX.float(c.x, c.y - 6, `+${fmt(total)}`, 'big');
        Sound.play('coin');
      } else { Sound.play('deny'); }
      return;
    }
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const { buy: kind, key } = buy.dataset;
      const ok = kind === 'upgrade' ? Game.buyUpgrade(key)
        : kind === 'sky' ? Boolean(Game.callWeather(key))
        : Game.buyDecor(key);
      if (ok) {
        const c = FX.centerOf(buy);
        FX.sparks(c.x, c.y, 12, '#ffe066');
        FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
        if (kind === 'sky') renderSheet(true);
      } else if (kind === 'sky') {
        Sound.play('deny');
        FX.shake(4);
      }
      return;
    }
    const plant = e.target.closest('[data-plant]');
    if (plant) {
      const seed = Game.seedById(plant.dataset.plant);
      const idx = sheetArg;
      if (Game.plant(idx, seed)) {
        closeSheet();
      } else {
        Sound.play('deny');
        FX.shake(4);
      }
      return;
    }
    const tog = e.target.closest('[data-toggle]');
    if (tog) {
      const k = tog.dataset.toggle;
      S.prefs[k] = !S.prefs[k];
      tog.setAttribute('aria-pressed', String(S.prefs[k]));
      Sound.resume();
      if (k === 'sfx') Sound.setSfx(S.prefs[k]); else Sound.setMusic(S.prefs[k]);
      Game.save();
      if (S.prefs[k]) Sound.play('buy');
      return;
    }
    const setTile = e.target.closest('[data-set]');
    if (setTile) { openSheet('cardset', setTile.dataset.set); Sound.play('open'); return; }
    const devBtn = e.target.closest('[data-dev]');
    if (devBtn) {
      handleDev(devBtn.dataset.dev, devBtn.dataset.arg);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'closeWelcome') { closeSheet(); Sound.play('close'); return; }
      if (a === 'backToAlbum') { openSheet('album'); Sound.play('open'); return; }
      if (a === 'openPack') {
        const r = Game.openPack();
        if (!r) { Sound.play('deny'); FX.shake(4); return; }
        packQueue = r.drawn;
        packShown = 0;
        packCompleted = r.completedSets;
        openSheet('pack');
        celebrateCard();
        return;
      }
      if (a === 'packNext') { packShown += 1; renderSheet(true); celebrateCard(); return; }
      if (a === 'packDone') {
        packCompleted.forEach((id) => {
          const set = ALBUM.sets.find((x) => x.id === id);
          if (set) UI.showBanner('Set complete', set.name);
        });
        if (S.packs > 0) { openSheet('album'); } else { openSheet('album'); }
        Sound.play('close');
        return;
      }
      if (a === 'cheat') {
        S.gems += 50;
        Game.save(); Game.emit('currency'); Game.emit('panels');
        Sound.play('coin');
        UI.toast({ title: 'Pockets filled!', body: '+50 gems', art: Icons.get('gem') });
      } else if (a === 'cheatGold') {
        S.credits += 1000000;
        Game.save(); Game.emit('currency'); Game.emit('panels');
        Sound.play('coin');
        UI.toast({ title: 'Pockets filled!', body: '+1,000,000 gold', art: Icons.get('coin') });
      } else if (a === 'wonder') {
        Game.startWonder();
        closeSheet();
      } else if (a === 'reset') {
        if (!resetArmed) {
          resetArmed = true;
          renderSheet(false);
          setTimeout(() => { if (resetArmed) { resetArmed = false; if (sheetMode === 'settings') renderSheet(false); } }, 4000);
        } else {
          resetArmed = false;
          Game.reset();
          UI.buildGarden();
          renderSheet(true);
          UI.toast({ title: 'Fresh soil', body: 'The garden has been reset', art: Icons.get('sprout') });
        }
      }
    }
  });

  $('#sheetClose').addEventListener('click', closeSheet);
  el.scrim.addEventListener('click', closeSheet);

  /* drag-to-dismiss */
  (() => {
    let startY = 0, lastY = 0, lastT = 0, dy = 0, dragging = false;
    const onDown = (e) => {
      if (!sheetMode) return;
      dragging = true;
      startY = lastY = e.clientY;
      lastT = performance.now();
      dy = 0;
      el.sheet.classList.add('dragging');
      el.sheetGrip.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      lastY = e.clientY;
      lastT = performance.now();
      el.sheet.style.transform = `translateY(${dy}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.sheet.classList.remove('dragging');
      el.sheet.style.transform = '';
      if (dy > 110) closeSheet();
    };
    el.sheetGrip.addEventListener('pointerdown', onDown);
    el.sheetGrip.addEventListener('pointermove', onMove);
    el.sheetGrip.addEventListener('pointerup', onUp);
    el.sheetGrip.addEventListener('pointercancel', onUp);
  })();

  /* Countdowns tick in place; a full re-render would fight the player's taps. */
  function tickSheetTimers() {
    if (!sheetMode) return;
    $$('[data-countdown]', el.sheetBody).forEach((n) => {
      const left = Number(n.dataset.countdown) - Game.nowSeconds();
      n.textContent = left > 0 ? fmtTime(left) : 'a moment';
    });
    /* Hours-scale spans get their own attribute rather than sharing the one
       above — `fmtTime` stops at minutes and would render a feed as "720m". */
    $$('[data-span]', el.sheetBody).forEach((n) => {
      n.textContent = fmtSpan(Number(n.dataset.span) - Game.nowSeconds());
    });
  }

  /* refresh affordability styling without a full rebuild */
  function syncAfford() {
    $$('[data-buy]', el.sheetBody).forEach((node) => {
      const { buy: kind, key } = node.dataset;
      let can = false;
      if (kind === 'upgrade') can = !Game.upgradeMaxed(key) && S.credits >= Game.upgradePrice(key);
      else if (kind === 'decor') {
        const d = DATA.decor.find((x) => x.id === key);
        const pot = d.currency === 'gems' ? S.gems : S.credits;
        can = pot >= d.cost;
      } else if (kind === 'sky') {
        can = !Game.weatherCallActive() && S.gems >= Game.weatherCallPrice(key);
      }
      node.classList.toggle('affordable', can);
      const price = $('.price', node);
      if (price && !price.classList.contains('maxed')) {
        price.classList.toggle('ok', can);
        price.classList.toggle('no', !can);
      }
    });
    $$('[data-feed]', el.sheetBody).forEach((node) => {
      const f = Game.foodById(node.dataset.feed);
      const room = Game.foodGain(node.dataset.who, node.dataset.feed) > 0;
      const can = Boolean(f) && room && S.credits >= f.cost;
      node.disabled = !room;
      node.classList.toggle('affordable', can);
      const price = $('.price', node);
      if (price) { price.classList.toggle('ok', can); price.classList.toggle('no', !can); }
    });
    $$('[data-plant]', el.sheetBody).forEach((node) => {
      const s = Game.seedById(node.dataset.plant);
      if (!s || !Game.seedUnlocked(s.id)) {
        node.disabled = true;
        return;
      }
      const can = S.credits >= s.cost;
      node.disabled = !can;
      const go = $('.seed-go', node);
      if (go) go.innerHTML = Icons.get(can ? 'sprout' : 'lock');
    });
  }

  UI.openSheet = openSheet;
  UI.closeSheet = closeSheet;
  UI.renderSheet = renderSheet;
  UI.sheetMode = () => sheetMode;
  UI.setAwayReport = (report) => { awayReport = report; };
  UI.syncAfford = syncAfford;
  UI.tickSheetTimers = tickSheetTimers;
  UI.CORE_UPGRADES = CORE_UPGRADES;
})();
