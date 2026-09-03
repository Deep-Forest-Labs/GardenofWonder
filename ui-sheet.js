/* Garden Wonder — the bottom sheet: every panel that opens over the garden.

   Reaches the rest of the UI through the `UI` global — see docs/02-architecture.md. It owns the
   sheet element and everything rendered into it; the dock and HUD buttons that open it stay with
   the elements they sit on. */

(() => {
  const { $, $$, S, el, fmt, fmtTime, pct, signed, MASTERY_TRACK } = UI;

  /* The suspects, in the order worth trying them. Each one is a class on `#game` and a
     rule in the "FINDING THE COST" block in `style.css`. Blends and masks are last on
     purpose: if either of those moves the number a long way, the answer is the technique
     rather than any one layer, and that is a different conversation. */
  const COST_SWITCHES = [
    { id: 'wx', label: 'Weather layer' },
    { id: 'tint', label: 'Season tint' },
    { id: 'canvas', label: 'Particles' },
    { id: 'scenery', label: 'Sky & clouds' },
    { id: 'vignette', label: 'Vignette' },
    { id: 'critters', label: 'Creatures' },
    { id: 'flower', label: 'The flower' },
    { id: 'blends', label: 'ALL blends' },
    { id: 'masks', label: 'ALL masks' },
    { id: 'anims', label: 'ALL animation' }
  ];

  /* ============ bottom sheet ============ */
  let sheetMode = null;
  let sheetArg = null;
  let seedSort = 'tier';

  /* What wears the shop's tab pills. The Apiary left on 2026-08-25 — it is the
     Wild Meadow, a place on the map, and a place must not also be a tab. */
  const TABS = [
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'craft', label: 'Craft' },
    { id: 'shop', label: 'Shop' }
  ];
  const SHOP_TABS = TABS.map((t) => t.id);

  /* iOS paints anything below a short window with the page's background colour, so
     the page has to be whatever the bottom of the screen is showing — otherwise an
     open sheet ends in a strip of lawn. Harmless where the window does reach the
     bottom, since nothing is left uncovered there. */
  function setPageFill(color) {
    document.documentElement.style.setProperty('--page-fill', color);
  }

  /* The seed the picker is asking about, and the one it just sold. Both live
     up here rather than in the markup, because a `panels` event rebuilds the
     sheet body from scratch and anything held in the DOM would vanish
     mid-question. */
  let pendingUnlock = null;
  let justUnlocked = null;

  function openSheet(mode, arg) {
    sheetMode = mode;
    sheetArg = arg;
    pendingUnlock = null;
    if (mode === 'turn') startTurn(); else endTurn();
    renderSheet(true);
    el.sheet.classList.add('open');
    el.sheet.setAttribute('aria-hidden', 'false');
    setPageFill('#ffeecd');   // --paper-2, the colour the sheet ends on
    el.scrim.hidden = false;
    requestAnimationFrame(() => el.scrim.classList.add('show'));
    Sound.resume();
    Sound.play('open');
  }

  function closeSheet() {
    if (!sheetMode) return;
    /* The Turn has already committed by the time the Tally is rolling, and it
       cannot be undone — so the one thing the ceremony owes the player is the
       celebration. Every dismissal path comes through here, which is why the
       guard lives here rather than on each of them. */
    if (sheetLocked) return;
    endTurn();
    sheetMode = null;
    el.sheet.classList.remove('open');
    el.sheet.style.transform = '';
    el.sheet.setAttribute('aria-hidden', 'true');
    el.scrim.classList.remove('show');
    // Both wait out the slide — flipping the page back to lawn on the first frame
    // would put a green strip under a sheet that is still on screen.
    setTimeout(() => {
      if (sheetMode) return;
      el.scrim.hidden = true;
      setPageFill('#4fae54');   // back to the lawn
      /* The curtain's discipline guard treats any open sheet as a closed
         door — the picker included, since it is a sheet and not a dialog.
         A sheet closing is therefore one of the two things (with the coach
         clearing) that can turn a queued moment into the next quiet beat. */
      if (UI.tryMoment) UI.tryMoment();
    }, 340);
    Sound.play('close');
  }

  function renderSheet(resetScroll) {
    if (!sheetMode) return;
    const keep = resetScroll ? 0 : el.sheetBody.scrollTop;
    const titles = {
      upgrades: 'Upgrades', craft: 'Apothecary', shop: 'Shop',
      seeds: 'Choose a seed', bonuses: 'Garden Almanac', settings: 'Settings',
      quests: 'Quests', orders: 'Orders & Quests', year: 'The Year',
      dev: 'Developer tools', welcome: 'While you were away', feed: 'Feed',
      critter: '', stand: '', order: '', turn: '', crops: 'Choose a crop',
      winterPlants: 'Choose a winter plant',
      keepers: 'Keepers', shelf: 'The Honey Shelf', build: 'What goes here?',
      album: 'Cards', cardset: 'Set', pack: 'Opening a pack'
    };
    let title = titles[sheetMode] || '';
    if (sheetMode === 'turn') title = turnTitle();
    if (sheetMode === 'cardset') {
      const set = ALBUM.sets.find((x) => x.id === sheetArg);
      if (set) title = set.name;
    }

    el.sheetTitle.textContent = title;
    /* The ceremony keeps ONE height across all five beats — a sheet that resized
       between the ask and the Tally would jump under the player's thumb — and it
       is taller than a shop, so the beats with little content can centre. */
    el.sheet.classList.toggle('cere-sheet', sheetMode === 'turn');

    if (SHOP_TABS.includes(sheetMode)) {
      el.sheetTabs.innerHTML = TABS.map(
        (t) => `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === sheetMode}">${t.label}</button>`
      ).join('');
    } else if (sheetMode === 'seeds' && !pendingUnlock) {
      /* The sort pills go while the picker is asking a yes/no question — they
         are not part of the question, and tapping one under it would re-sort a
         list nobody can see. */
      const opts = [['tier', 'By tier'], ['balanced', 'Balanced'], ['costAsc', 'Cheapest'], ['costDesc', 'Priciest']];
      el.sheetTabs.innerHTML = opts
        .map(([id, label]) => `<button class="tab" role="tab" data-sort="${id}" aria-selected="${id === seedSort}">${label}</button>`)
        .join('');
    } else {
      el.sheetTabs.innerHTML = '';
    }

    const render = {
      upgrades: renderUpgrades, craft: renderCraft, shop: renderShop,
      seeds: renderSeeds, bonuses: renderBonuses, settings: renderSettings, quests: renderQuests,
      orders: renderOrders, year: renderYear,
      turn: renderTurn, crops: renderCrops, winterPlants: renderWinterPlants,
      dev: renderDev, welcome: renderWelcome, feed: renderFeed, critter: renderCritter,
      stand: renderStand, order: renderOrder,
      keepers: renderKeepers, shelf: renderShelf, build: renderBuild,
      album: renderAlbum, cardset: renderCardSet, pack: renderPack
    }[sheetMode];
    /* Whoever the sheet is about stands on top of it — a creature, or now the
       customer waiting at the Stand. Same device, same reason: a subject you can
       see is a subject you care about, where a header is just a label. */
    const star = sheetMode === 'critter' ? Game.critterById(sheetArg) : null;
    const guest = sheetMode === 'order' ? Game.standOrderAt(Number(sheetArg)) : null;
    if (star && Game.critterHere(star.id)) {
      const asleep = Game.critterAsleep(star.id);
      el.sheetArt.style.setProperty('--cg', star.art.glow || '#b6f2c8');
      el.sheetArt.className = `sheet-art${asleep ? ' asleep' : ''}`;
      el.sheetArt.innerHTML = Critters.draw(star);
      el.sheetArt.hidden = false;
    } else if (guest && customerById(guest.customer)) {
      const who = customerById(guest.customer);
      const glad = Game.standCanDeliver(guest);
      el.sheetArt.style.setProperty('--cg', who.art.accent || '#ffd6e8');
      el.sheetArt.className = `sheet-art guest ${glad ? 'is-happy' : 'is-waiting'}`;
      el.sheetArt.innerHTML = Customers.draw(who);
      el.sheetArt.hidden = false;
    } else if (!el.sheetArt.hidden) {
      el.sheetArt.hidden = true;
      el.sheetArt.innerHTML = '';
    }

    el.sheetBody.innerHTML = render ? render() : '';
    el.sheetBody.scrollTop = keep;
  }

  function priceTag(cost, currency, affordable, maxed) {
    if (maxed) return `<span class="price maxed">${Icons.get('check')}Maxed</span>`;
    const icon = currency === 'gems' ? 'gem' : 'coin';
    return `<span class="price ${affordable ? 'ok' : 'no'}">${Icons.get(icon)}${fmt(cost)}</span>`;
  }

  /* THE SHARED "WATCH AN AD" CONTROL, built once because two placements need it
     and docs/37-monetization.md names three more. One label and one glyph,
     everywhere. The playbook a new placement follows is in docs/09-conventions.md.

     It is a `.price` pill like the money beside it, because in a row of tiers an
     ad IS the price — but it takes no currency colour: cyan is gems and
     blue/purple/gold are the rarity vocabulary (docs/05-art-direction.md), and
     borrowing one here would teach a player something untrue.

     Callers: ask `Game.adOffered(placement)` FIRST and render nothing at all if
     it is false — absent, never disabled, in a first session. `ready` is for the
     second rule: an offer that cannot pay in full is shown drained with the
     reason beside it, and never taken. */
  const AD_LABEL = 'Watch an ad';
  function adTag(ready) {
    return `<span class="price ad${ready ? '' : ' off'}">${Icons.get('video')}${AD_LABEL}</span>`;
  }

  /* A number the garden has changed is never silently different from the one on
     the seed's data row: the pill carries the multiplier that did it, in either
     direction. A Nurse costs its own plot 10% and a Moonflower picked in
     daylight pays half, and a quietly smaller number is the same lie as a
     quietly larger one. Half a percent either way is rounding, not a change. */
  function mx(mult) {
    if (mult > 1.005) return ` <i class="mx">×${Number(mult.toFixed(2))}</i>`;
    if (mult < 0.995) return ` <i class="mx low">×${Number(mult.toFixed(2))}</i>`;
    return '';
  }

  function pips(level, max = 8) {
    const shown = Math.min(level, max);
    let s = '';
    for (let i = 0; i < max; i += 1) s += `<span class="pip ${i < shown ? '' : 'off'}"></span>`;
    return `<div class="pips">${s}${level > max ? `<span class="lvl-text">+${level - max}</span>` : ''}</div>`;
  }

  /* Land Deed (`plotExpansion`) is deliberately absent — owner's ruling,
     2026-09-02. It only ever unlocked plots the in-garden tap (`unlockPlot()`
     in game.js) already unlocks, at a second, differently-priced path, so the
     card was a confusing duplicate rather than a real choice. Its data,
     effect and saved level all stay intact in game.js/data.js; it simply
     never renders here, which also retires the whole "Land Deed reveal
     carve-out" doc 47 specced — a card that never draws needs no reveal rule. */
  const CORE_UPGRADES = [
    'tapPower', 'holdSpeed', 'critChance', 'critMult', 'comboMeter',
    'rainDance', 'beeSwarm', 'ladybug',
    'autoWater', 'autoHarvest',
    'offlineRate', 'offlineHours'
  ];

  /* WHAT YOU HAVE, AND WHAT THIS LEVEL BUYS. Thirteen badges shared one template
     whose only live number was "Lv N", and six of them said nothing numeric at
     all — a player could not tell a 1% crit from a doubled multiplier without
     buying one first. Every value comes off Game.upgradeEffect(), which is what
     keeps the hold's shrinking milliseconds and the harvester's seed NAME from
     being re-derived here.

     Two pills rather than a sentence: a number lives in a cream pill, and the
     pair is the ruling said out loud — this is what you have, this is what the
     price buys. */
  function upgradeValue(e) {
    switch (e.key) {
      /* The BASE, and it says so: boosts, the Wonder and the combo all multiply
         it and none of them belong to this badge. The Almanac carries the live
         figure; a card that quoted it here would move without anyone buying. */
      case 'tapPower': return [`base ${fmt(e.now)} a tap`, `next +${fmt(e.next)}`];
      /* The one badge whose number goes DOWN, and its step is clamped by the
         floor — so the last level really does buy less than the ones before. */
      case 'holdSpeed': return [`every ${(e.now / 1000).toFixed(2)}s`,
        e.next ? `next −${(e.next / 1000).toFixed(2)}s` : ''];
      case 'critChance': return [`${pct(e.now)} crit`, `next +${pct(e.next)}`];
      case 'critMult': return [`×${e.now} on a crit`, e.next ? `next +${e.next}` : 'at its cap'];
      case 'comboMeter': return [`combo ${e.now}`, e.next ? `next +${e.next}` : 'at its cap'];
      /* The unit is spelled out once. When the running total is already carrying
         it, the promise beside it only has to carry the step. */
      case 'rainDance': case 'beeSwarm': case 'ladybug':
        return [e.now ? `${pct(e.now, 1)} a tap` : '',
          e.now ? `next +${pct(e.next, 1)}` : `next ${pct(e.next, 1)} a tap`];
      case 'plotExpansion': return [`${e.now} plots`, `next +${e.next}`];
      case 'autoWater': return [e.now ? `${pct(e.now)} faster` : '',
        e.now ? `next +${pct(e.next)}` : `next ${pct(e.next)} faster`];
      /* A cadence improves by shrinking and bottoms out at the engine's floor,
         where another level is a purchase that changes nothing. */
      case 'autoHarvest': return [e.now ? `every ${e.now.toFixed(1)}s` : '',
        e.next === e.now ? 'as quick as it gets'
          : `next ${e.now ? '' : 'a pick '}every ${e.next.toFixed(1)}s`];
      case 'offlineRate': return [`${pct(e.now)} away`, `next +${pct(e.next)}`];
      case 'offlineHours': return [`${e.now}h away`, `next +${e.next}h`];
      /* A harvester plants the best bloom it has been raised to, and stops at the
         highest seed you have UNLOCKED — past that a level is a purchase with
         nothing behind it, and the card has to say so. */
      default: return [e.now ? `plants ${e.now}` : '',
        e.next === e.now ? 'none higher yet' : `next ${e.level ? '' : 'plants '}${e.next}`];
    }
  }

  /* The curtain's quiet tier, docs/47: revealed but not yet celebrated —
     never re-used from the seed row's `justUnlocked` (a purchase flag, the
     wrong shape for a reveal that can sit queued for a while behind the
     session cap) and never the same selector as `.fresh`, so a card mid-flash
     for a REVEAL can never be confused with one that was just bought. */
  const isFreshReveal = (momentKey) => Boolean(S.celebrated) && !S.celebrated[momentKey];

  function upgradeCard(key) {
    const def = DATA.upgrades[key];
    const lvl = S.upgrades[key];
    const maxed = Game.upgradeMaxed(key);
    const cost = Game.upgradePrice(key);
    const can = !maxed && S.credits >= cost;
    const [now, next] = upgradeValue(Game.upgradeEffect(key));
    const fresh = isFreshReveal(`upgrade:${key}`);
    return `<button class="card ${can ? 'affordable' : ''}${fresh ? ' reveal-fresh' : ''}" data-buy="upgrade" data-key="${key}" ${maxed ? 'disabled' : ''}>
      <div class="card-top">
        <span class="card-badge">${Icons.get(def.icon || 'badge')}</span>
        <span>
          <span class="card-title">${def.short || def.name}</span>
          <span class="card-sub">Lv ${lvl}</span>
        </span>
      </div>
      ${pips(lvl)}
      <span class="card-vals">${now ? `<span class="stat">${now}</span>` : ''}${
        next && !maxed ? `<span class="stat next">${next}</span>` : ''}</span>
      <span class="card-desc">${def.desc}</span>
      ${priceTag(cost, 'credits', can, maxed)}
    </button>`;
  }

  function renderUpgrades() {
    Game.refreshReveals();
    const core = CORE_UPGRADES.filter((k) => Game.upgradeRevealedNow(k)).map(upgradeCard).join('');
    const harvesters = PLOT_AUTOPLANTERS.filter(({ idx }) => !S.grid[idx].locked).map(({ key }) => upgradeCard(key)).join('');
    const lockedCount = PLOT_AUTOPLANTERS.filter(({ idx }) => S.grid[idx].locked).length;
    return `
      <p class="sheet-note">Buy upgrades to hit harder, grow faster and automate the garden.</p>
      <div class="card-grid">${core}</div>
      <p class="sheet-note" style="margin-top:16px">Harvesters keep a single plot planted for you, choosing the best seed you can afford.</p>
      <div class="card-grid">${harvesters || '<p class="sheet-note">Unlock a plot to hire its harvester.</p>'}</div>
      ${lockedCount ? `<p class="sheet-note" style="margin-top:10px">${lockedCount} more harvester${lockedCount > 1 ? 's' : ''} unlock with new plots.</p>` : ''}`;
  }

  /* "Everything growing gets a shot at Dewkissed" was prose standing in for two
     numbers the engine already knew — how many plants are actually in the ground
     to receive a roll, and what the mutation pays when one lands. On an empty
     board that first number is zero and the card was selling weather nobody
     could catch, so it DRAINS rather than disabling: the sky is still for sale,
     it just says what it is worth right now.

     "Nothing LEFT to catch it" rather than "nothing planted": the count is
     plants whose one mutation roll is still pending, so a board of four plants
     that have all already rolled is legitimately zero, and the older wording
     would have contradicted what the player could see. */
  function skyLine(eff) {
    const mins = `${Math.round(eff.minutes)} min`;
    if (!eff.plots) return `${mins} &middot; nothing left to catch it`;
    return `${mins} &middot; ${eff.plots} plant${eff.plots > 1 ? 's' : ''} standing to catch it`;
  }

  function skyCards() {
    const active = Game.weatherCallActive();
    const rows = Object.keys(DATA.weatherCall.prices).map((id) => {
      const w = DATA.weather.types.find((t) => t.id === id);
      const m = DATA.mutations[w.mutation];
      const price = Game.weatherCallPrice(id);
      const can = S.gems >= price && !active;
      const eff = Game.weatherCallEffect(id);
      return `<button class="card ${can ? 'affordable' : ''}${eff.plots ? '' : ' idle'}"
        data-buy="sky" data-key="${id}" ${active ? 'disabled' : ''}>
        <div class="card-top">
          <span class="card-badge" style="background:${w.tint}">${Icons.get('sparkle')}</span>
          <span>
            <span class="card-title">Call ${w.name}</span>
            <span class="card-sub">${skyLine(eff)}</span>
          </span>
        </div>
        <span class="card-vals">
          <span class="stat">${pct(eff.catch)} a plant</span>
          <span class="stat good">${m.name} pays ×${eff.mult}</span>
        </span>
        ${priceTag(price, 'gems', can, false)}
      </button>`;
    }).join('');
    return `<p class="dev-label">The sky</p>
      ${active ? `<p class="away-cap">${Icons.get('sparkle')}<span>A ${DATA.weather.types.find((t) => t.id === active.id).name.toLowerCase()} is already running.</span></p>` : ''}
      ${rows}
      <p class="sheet-note">Aurora and Wonderfall are not for sale &mdash; the rarest skies have to find you.</p>`;
  }

  /* THE SHOP'S SECOND TIMED EFFECT — half an hour of the drone for one rewarded
     video (docs/37-monetization.md, and the ad playbook in docs/09).

     ABSENT rather than drained when the offer does not exist — a first session,
     a spent day's budget, or below the reveal — because a greyed-out ad button
     on session one is still an ad on session one. DISABLED WITH A REASON when
     the offer exists but cannot be taken, so a player who just spent an ad can
     still see what they bought rather than watching the card vanish.

     THE CARD IS THE AD CONTROL. A <button> nested inside a <button> is invalid
     markup and will not fire, so the pill sits where priceTag() sits and the
     whole card carries the hook — the same shape a food button uses. */
  function droneCard() {
    if (!Game.droneRentalOffered()) return '';
    const b = DATA.boosters.find((x) => x.id === DATA.droneRental.boost);
    if (!b) return '';
    const why = Game.droneRentalBlocked();
    const note = why === 'running' ? 'The drone is already flying &mdash; the strip above the garden is counting it down.'
      : why === 'owned' ? 'Your own drone is already quicker than the loan.' : '';
    return `<p class="dev-label">The drone</p>
      ${note ? `<p class="away-cap">${Icons.get(b.icon)}<span>${note}</span></p>` : ''}
      <button class="card ${why ? '' : 'affordable'}" data-ad="${b.id}" ${why ? 'disabled' : ''}>
        <div class="card-top">
          <span class="card-badge" style="background:${b.tint}">${Icons.get(b.icon)}</span>
          <span>
            <span class="card-title">Borrow the drone</span>
            <span class="card-sub">${Math.round(b.dur / 60)} min &middot; picks a ready plot every ${Game.autoHarvestCadence(b.effects.autoHarvest).toFixed(1)}s</span>
          </span>
        </div>
        <span class="card-desc">${b.desc}</span>
        ${adTag(!why)}
      </button>`;
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
    /* The Decor label moved out of skyCards() and back up here when the drone
       block landed between them — a function named for the sky should not be
       emitting the heading for the grid two blocks below it. */
    return `${skyCards()}
      ${droneCard()}
      <p class="dev-label">Decor</p>
      <p class="sheet-note">Purely decorative — dress up your garden however you like. Buy the same piece again for another copy.</p>
      <div class="card-grid">${cards}</div>`;
  }

  /* ---- apiary ---- */
  /* The one number the button changes is the gold it hands over, and it was the
     one number the row did not show — the player was left to multiply the unit
     price by the count. Quantity and price both come off the same getter now, so
     the row and the sale can never disagree. */
  function stockRow(icon, name, kind, key) {
    const sale = Game.sellValue(kind, key);
    return `<div class="stock">
      <span class="stock-ico">${icon}</span>
      <span class="stock-name">${name}<span class="stock-sub">${Icons.get('coin')}${fmt(sale.unit)} each</span></span>
      <span class="stock-qty">x${sale.have}</span>
      <button class="mini" data-sell="${kind}" data-key="${key}">Sell all ${Icons.get('coin')}${fmt(sale.total)}</button>
    </div>`;
  }

  /* ---- the meadow's panels ----
     The room does the buying and collecting, because those are things you do to
     a place you are standing in. These three are the paperwork: who is working,
     what you have made, and what you can sell. */

  const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  const ordinal = (n) => ORDINALS[n] || `${n}th`;

  /* The whole price curve is 1.8^owned, so the count is what makes the number
     above it make sense. It sits under the price rather than in the copy for
     exactly that reason. */
  function buildBuy(cost, can, foot) {
    return `<span class="build-buy">
      ${priceTag(cost, 'credits', can)}
      ${foot ? `<span class="build-owned">${foot}</span>` : ''}
    </span>`;
  }

  const statPill = (icon, text, bad) =>
    `<span class="stat${bad ? ' bad' : ''}">${Icons.get(icon)}${text}</span>`;

  /* A PENALTY IS SAID AS PLAINLY AS A BENEFIT. Willow Shade and Foxglove Bank
     both slow the hives they touch, and both rows described themselves entirely
     in adjectives — cool and quiet, spires the bees can see. The engine hands
     over `speed` already flipped into the direction a player reads it, so a
     negative number here is genuinely a slower hive and wears the red pill the
     rest of the game uses for "no". */
  function tenderChips(eff) {
    const out = [];
    if (eff.speed > 0) out.push(statPill('clock', `${pct(eff.speed)} faster`));
    if (eff.speed < 0) out.push(statPill('clock', `${pct(-eff.speed)} slower`, true));
    if (eff.cap) out.push(statPill('honey', `holds +${eff.cap}`));
    if (eff.wax) out.push(statPill('wax', `+${pct(eff.wax)} wax`));
    if (eff.pollen) out.push(statPill('coin', `+${pct(eff.pollen)} garden gold`));
    if (eff.rare) out.push(statPill('sparkle', `${pct(eff.rare)} better jars`));
    return out.join('');
  }

  /* What you can put on an empty meadow cell. Every option shows what it would
     do FOR ITS NEIGHBOURS, because that is the decision — not what it is, but
     what it is next to. */
  function renderBuild() {
    const cell = Number(sheetArg);
    const near = Game.meadowNeighbours(cell);
    const nearHives = near.filter((n) => Game.cellIsHive(n)).length;

    const hiveCost = Game.nextHiveCost();
    const canHive = S.credits >= hiveCost;
    /* The projection answers for THIS cell, neighbours and keepers counted — so
       a hive dropped beside a Sun Trap quotes the faster jar before it is bought
       rather than after. */
    const hp = Game.hiveProjection(cell);
    const hiveChips = statPill('clock', `a jar every ${fmtTime(hp.interval)}`)
      + statPill('honey', `holds ${hp.capacity}`)
      + statPill('coin', `+${pct(hp.pollen)} garden gold`);
    const rows = [`<button class="build-row${canHive ? ' affordable' : ''}" data-build="hive"
        data-cell="${cell}" type="button">
        <span class="build-art">${Meadow.hive()}</span>
        <span class="build-copy">
          <span class="card-title">Hive</span>
          <span class="card-sub">${MEADOW.hive.desc}</span>
          <span class="build-stats">${hiveChips}</span>
        </span>
        ${buildBuy(hiveCost, canHive, `${ordinal(Game.hiveCount() + 1)} hive`)}
      </button>`];

    MEADOW.tenders.forEach((t) => {
      const cost = Game.nextTenderCost(t.id);
      const can = S.credits >= cost;
      const eff = Game.tenderEffect(t.id);
      const helps = nearHives
        ? `Helps ${nearHives} hive${nearHives > 1 ? 's' : ''} from here`
        : 'Nothing beside it yet';
      rows.push(`<button class="build-row${can ? ' affordable' : ''}" data-build="${t.id}"
        data-cell="${cell}" type="button">
        <span class="build-art">${Meadow.tender(t.id, t.tint)}</span>
        <span class="build-copy">
          <span class="card-title">${t.name}</span>
          <span class="card-sub">${t.desc}</span>
          <span class="build-stats">${tenderChips(eff)}</span>
          <span class="build-helps${nearHives ? ' on' : ''}">${helps}</span>
        </span>
        ${buildBuy(cost, can, eff.owned ? `${eff.owned} built` : '')}
      </button>`);
    });

    return `<p class="sheet-note">Hives make the honey. Everything else makes the hives it
        <b>touches</b> better — so where you put a thing matters as much as what it is.</p>
      ${rows.join('')}`;
  }

  function renderKeepers() {
    const slots = Game.keeperSlots();
    const now = Game.keepers();
    const out = Game.crittersTending();
    const rows = out.map((def) => {
      const on = Game.isKeeper(def.id);
      const asleep = Game.critterAsleep(def.id);
      const bee = def.affinity === 'meadow';
      const lift = Math.round(Game.keeperLift(def.id) * 100);
      return `<button class="keeper-row${on ? ' on' : ''}" data-keep="${def.id}" type="button">
        <span class="keeper-face${asleep ? ' asleep' : ''}">${Critters.draw(def)}</span>
        <span class="keeper-copy">
          <span class="card-title">${def.name}${bee ? ' <i class="keeper-bee">belongs here</i>' : ''}</span>
          <span class="card-sub">${asleep ? 'Asleep — no work until fed' : `Hives run +${lift}% faster`}</span>
        </span>
        <span class="keeper-pick">${on ? Icons.get('check') : ''}</span>
      </button>`;
    }).join('');

    /* A row says what ONE keeper is worth and the panel says what the bench is
       worth, because the two are not the same reading: an asleep keeper still
       shows its lift on its own row and adds nothing to the hives. */
    const bench = Game.keeperSpeed();
    return `<p class="sheet-note">The hives work on their own. A keeper just makes them quicker —
        ${now.length}/${slots} spots filled.</p>
      ${bench ? `<p class="sheet-note bench-note"><span class="chip">${Icons.get('clock')}+${pct(bench)} faster</span>
        on the hives, everyone on the bank counted.</p>` : ''}
      ${rows || '<p class="sheet-note">Nobody is out in the garden to send over.</p>'}
      ${out.length && !Game.keepersFree() && now.length < out.length
        ? '<p class="sheet-note">The bank is full. Tap someone on it to send them back.</p>' : ''}`;
  }

  /* The Honey Shelf: one slot per bloom, in the game's own seed order, coloured
     from the flower it came from. A silhouette for what you have not made yet —
     the standard collection pull, and the reason to plant a specific seed. */
  function renderShelf() {
    const filled = Game.shelfFilled();
    const total = Game.shelfTotal();
    const jars = DATA.seeds.map((sd) => {
      const has = Game.shelfHas(sd.id);
      const n = Game.shelfCount(sd.id);
      return `<div class="shelf-slot${has ? ' has' : ''}" title="${APIARY.honeyName(sd.id)}">
        <span class="shelf-jar">${has ? UI.meadowJar(sd.id) : Icons.get('honey')}</span>
        <span class="shelf-name">${has ? sd.name : '???'}</span>
        ${has && n > 1 ? `<span class="shelf-n">${fmt(n)}</span>` : ''}
      </div>`;
    }).join('');
    return `<p class="sheet-note">Every bloom makes its own honey. Plant it, keep a hive, and the
        jar turns up here — <b>${filled}</b> of ${total} so far.</p>
      <div class="shelf-bar"><i style="width:${Math.round((filled / total) * 100)}%"></i></div>
      <div class="shelf-grid">${jars}</div>`;
  }

  /* `renderStores` — the honey and beeswax pantry — was deleted 2026-08-30. It
     was fully written and registered in BOTH the titles and render maps, and a
     repo-wide search found no caller: the meadow's dock is Collect / Move /
     Keepers / Shelf and nothing opened Stores. Found by the phase-3.5 dock
     mapping, which existed to catch exactly this. `stockRow` stays — the
     Apothecary still uses it for goods. */

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
      return stockRow(Icons.get(r.icon), r.name, 'good', id);
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

  /* The one line every masked ??? row and Almanac slot carries — the same
     generic non-revealing note every time, the grammar pairRows() already
     uses for an unformed creature pair, never per-seed flavour text. */
  const CURTAIN_HINT = 'Keep growing — the garden isn’t done with you.';

  /* The curtain's sort-sink rule, docs/47 (ruled, not a builder's choice): a
     ??? row never participates in Cheapest/Priciest/Balanced — sorting it
     would leak the very price the mask exists to hide. Masked seeds are
     partitioned out first, sorted rows are ordered as before, and the masked
     tail is appended in ladder (DATA.seeds) order, always last. */
  function sortedSeeds() {
    const revealed = [];
    const masked = [];
    DATA.seeds.forEach((s) => (Game.seedRevealedNow(s.id) ? revealed : masked).push(s));
    const list = revealed;
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
    return list.concat(masked);
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

  /* ============ THE TURN — the ceremony ============

     Five beats on one sheet: the ask, the blessing, the Tally's three moments,
     the spring return. Two rules govern how it is built.

     ONE: it renders from a step variable, never from what is already in the
     DOM. Any `panels` emit rebuilds the sheet body from scratch, so a ceremony
     that animated out of its markup would restart its own fireworks every time
     an unrelated purchase fired. The pack reveal is the precedent.

     TWO: from the moment turnYear() commits until the total lands, the sheet
     cannot be dismissed. The Turn is atomic and has already happened by then —
     a stray scrim tap would cost the player the only celebration it has, with
     nothing to undo. The close button, the scrim and the drag are all guarded,
     and all three come back at the spring return.
  */
  const TURN_BASE_MS = 1100;
  const TURN_LINE_MS = 430;
  let turnStep = 0;        /* 0 ask · 1 bless · 2 count · 3 lines · 4 total · 5 spring */
  let turnPick = null;
  let turnResult = null;
  let turnLines = 0;
  let turnCount = 0;
  let turnTimers = [];
  let sheetLocked = false;

  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function turnClear() { turnTimers.forEach(clearTimeout); turnTimers = []; }
  function turnAt(ms, fn) { turnTimers.push(setTimeout(fn, ms)); }

  function startTurn() {
    turnClear();
    turnStep = 0; turnPick = null; turnResult = null; turnLines = 0; turnCount = 0;
    sheetLocked = false;
    el.sheet.classList.remove('no-exit');
  }
  function endTurn() {
    turnClear();
    sheetLocked = false;
    el.sheet.classList.remove('no-exit');
  }
  function lockSheet(on) {
    sheetLocked = on;
    el.sheet.classList.toggle('no-exit', on);
  }

  function turnTitle() {
    if (turnStep === 0) return 'The Turn';
    if (turnStep === 1) return 'Bless one flower';
    if (turnStep === 5) return `Year ${S.year.number}`;
    return '';
  }

  /* Every flower you own a seed for whose Rich Bloom still has room. Capped
     flowers are FILTERED OUT rather than shown and refused: turnYear() accepts
     one, writes nothing and completes anyway, so picking a full flower would
     lose the largest per-Turn grant in the game with no undo. */
  function blessableSeeds() {
    const cap = DATA.petals.shared.rich.cap;
    return DATA.seeds.filter((s) => Game.seedUnlocked(s.id) && Game.petalsOf(s.id).rich < cap);
  }

  function turnAsk() {
    const mint = Game.projectedMint();
    const growing = S.grid.filter((c) => c.seed && !c.ready && !c.locked).length;
    const ripe = S.grid.filter((c) => c.seed && c.ready).length;
    /* The icon names the thing, exactly as it does on the spring beat four
       screens later. Six identical ticks beside six words is a wall of copy
       wearing a chip, and it teaches the same object twice in one ceremony. */
    /* Eleven chips across two rows, and every glyph has to be its own — Level
       and Upgrades both wore the rosette, which is two facts in one icon on the
       screen whose whole job is telling them apart. The icon id stays `badge`:
       it is the fallback glyph for every upgrade card and renaming it blanks
       them with no error. */
    const keeps = [['pouch', 'Seeds'], ['lock', 'Unlocks'], ['clover', 'Petals'],
      ['butterfly', 'Creatures'], ['cards', 'Cards'], ['star', 'Level']]
      .map(([ico, k]) => `<span class="chip">${Icons.get(ico)}${k}</span>`).join('')
      /* Fall belongs in the "stays" column and was in neither. The Century
         Bloom's entire promise is that a Turn cannot touch it, and until now
         the only place that was written was the crop picker's note — seen once,
         up to fourteen days earlier. A cautious player would refuse to Turn for
         a fortnight, which is the exact trap the guarantee exists to prevent. */
      + ((S.fall && S.fall.grid || []).some((c) => c && c.seed)
        ? `<span class="chip">${Icons.get(Game.fallCenturyGrowing() ? 'sparkle' : 'leaf')}${
          Game.fallCenturyGrowing() ? 'The Century Bloom' : 'Fall’s bed'}</span>`
        : '');
    /* WHAT THE TURN TAKES, named before it is taken. The ask used to name only
       the growing plots, and told an empty board that the Turn "costs you
       nothing at all" — which is false on every board: gold zeroes to the fresh
       purse, every upgrade wipes and is rebought, power-ups go, and plots 5-8 close.
       Doc 32's clears column, said to the player in their own words. An
       irreversible commit may never understate its own price. */
    const bigPlots = S.grid.filter((c, i) => !c.locked && Game.plotUnlockLevel(i) > 1).length;
    /* Icon and noun, the same grammar the "stays" row uses two lines below —
       the row's own heading carries the verb, so the chips do not have to. */
    const goes = [
      [`${Icons.get('coin')}Gold`, true],
      [`${Icons.get('badge')}Upgrades`, Object.values(S.upgrades || {}).some((v) => v > 0)],
      [`${Icons.get('bolt')}Power-ups`, Object.values(S.boostInv || {}).some((v) => v > 0)],
      [`${Icons.get('grid')}${bigPlots} big plot${bigPlots === 1 ? '' : 's'}`, bigPlots > 0],
      [`${Icons.get('sprout')}${growing} growing`, growing > 0]
    ].filter(([, on]) => on).map(([html]) => `<span class="chip gone">${html}</span>`).join('');
    const cost = growing
      ? `${growing === 1 ? 'The plot' : `All ${growing} plots`} still growing ${growing === 1 ? 'goes' : 'go'} to the compost${ripe ? ' — everything ripe is picked for you first' : ''}.`
      : (ripe ? 'Everything ripe is picked for you first.' : 'The board is empty, so nothing is composted.');
    return `<div class="cere">
      <div class="cere-flower">${Flora.talkingFlower()}</div>
      <div class="speech-block">The year’s turning. Save your seeds?</div>
      <div class="plate">
        <p class="plate-cap">Ready to save</p>
        <div class="plate-big outlined">${Icons.get('pouch')}<span>${fmt(Math.floor(mint.base))}</span></div>
      </div>
      <div class="cost-line${growing ? '' : ' good'}">${Icons.get('sprout')}<span>${cost}</span></div>
      <p class="cere-lab">This year goes</p>
      <div class="keep-row">${goes}</div>
      <p class="cere-lab">These stay, always</p>
      <div class="keep-row">${keeps}</div>
      <div class="btn-row">
        <button class="big-btn yes" data-act="turnBless">${Icons.get('pouch')}Turn the year</button>
        <button class="big-btn" data-act="turnLater">Not yet</button>
      </div>
    </div>`;
  }

  function turnBlessPanel() {
    const list = blessableSeeds();
    if (!list.length) {
      return `<div class="cere">
        <div class="cere-flower">${Flora.talkingFlower()}</div>
        <div class="speech-block">Every bloom you have is as rich as it gets. Keep the blessing — there’ll be new flowers.</div>
        <div class="cost-line good">${Icons.get('check')}<span>No blessing lands this Turn. Nothing is lost, and nothing is owed.</span></div>
        <div class="btn-row">
          <button class="big-btn yes" data-act="turnGo">${Icons.get('pouch')}Turn the year</button>
          <button class="big-btn" data-act="turnBack">Back</button>
        </div>
      </div>`;
    }
    const cap = DATA.petals.shared.rich.cap;
    /* THE LARGEST PER-TURN GRANT IN THE GAME, and the panel never said what it
       was worth. Every petal is the same step, so the ask can carry the number
       once; the tiles carry what each flower is already sitting on, which is the
       fact the choice actually turns on. */
    const step = pct(Game.petalEffect(list[0].id, 'rich').next);
    const tiles = list.map((s) => {
      const eff = Game.petalEffect(s.id, 'rich');
      const pips = Array.from({ length: cap }, (_, i) =>
        `<i class="pip${i < eff.owned ? '' : ' off'}"></i>`).join('');
      return `<button class="bless-tile${turnPick === s.id ? ' on' : ''}" data-bless="${s.id}">
        <span class="bless-art" style="--art:${s.art.c1}">${Flora.head(s, 40)}</span>
        <span class="bless-name">${s.name}</span>
        <span class="pips">${pips}</span>
        ${eff.owned ? `<span class="bless-val">+${pct(eff.now)} gold</span>` : ''}
      </button>`;
    }).join('');
    const picked = turnPick ? Game.seedById(turnPick) : null;
    return `<div class="cere top">
      <p class="sheet-note">Your blessing lands as a free <b>Rich Bloom</b> petal —
        <span class="chip">+${step} gold</span> on that flower, kept through every Turn.</p>
      <div class="bless-grid">${tiles}</div>
      <div class="btn-row">
        <button class="big-btn yes" data-act="turnGo" ${picked ? '' : 'disabled'}>
          ${Icons.get('star')}${picked ? `Bless the ${picked.name}` : 'Pick a flower'}
        </button>
      </div>
    </div>`;
  }

  /* The Tally. The lines are already zero-filtered by the engine — a line the
     year scored nothing on is never emitted — so the cosy rule is honest by
     construction here rather than by filtering in the view. */
  function turnTally() {
    const t = turnResult.tally;
    const shown = t.lines.slice(0, turnLines);
    const cap = DATA.year.tallyCap;
    const running = Math.min(cap, 1 + shown.reduce((a, l) => a + l.bonus, 0));
    const done = turnStep === 4;
    /* Only the newest line animates. Every landing re-renders the plate, so an
       animation on .tline would replay the whole list each time and the Tally
       would jitter instead of stacking. */
    const rows = shown.map((l, i) => `<div class="tline${i === shown.length - 1 && !done ? ' just' : ''}">
      <span class="lab">${l.label}</span>
      <span class="chip cnt">${fmt(l.count)}</span>
      <span class="price bon">+${Math.round(l.bonus * 100)}%</span>
    </div>`).join('');
    /* THE COSY RULE, at the summary as well as the line. A year that scored
       nothing has no lines — and it must have no multiplier either, or the
       Tally ends on "×1.00", which is the "you failed" row doc 32 forbids
       wearing a different hat. It just shows the pouch and celebrates that. */
    const foot = done
      ? (t.mult > 1
        ? `<div class="tfoot centred">
             <span class="plate-cap">${fmt(Math.floor(turnResult.base))}</span>
             <span class="tmult outlined">×${t.mult.toFixed(2)}${t.mult >= cap ? ' MAX' : ''}</span>
           </div>`
        : '')
      : (turnLines
        ? `<div class="tfoot"><span class="plate-cap">the year scored</span>
             <span class="tmult outlined">×${running.toFixed(2)}</span></div>`
        : '');
    return `<div class="cere">
      <div class="plate${done ? ' won' : ''}">
        <p class="plate-cap">${done ? 'Into the pouch' : 'The year’s pouch'}</p>
        <div class="plate-big outlined">${Icons.get('pouch')}<span id="turnNum">${
          fmt(done ? turnResult.pouch : turnCount)}</span></div>
        ${rows}
        ${foot}
      </div>
      ${turnStep === 2 ? '<p class="sheet-note centred">counting…</p>' : ''}
      ${done ? `<div class="btn-row">
        <button class="big-btn yes" data-act="turnSpring">${Icons.get('pouch')}Into the pouch</button>
      </div>` : ''}
    </div>`;
  }

  function turnSpring() {
    const r = turnResult || {};
    const unlocks = Object.keys(S.seedUnlocks || {}).length;
    const petals = Object.values(S.petals || {}).reduce((a, p) => a + p.rich + p.quick + p.sig, 0);
    const chips = [
      `<span class="chip">${Icons.get('pouch')}${fmt(S.savedSeeds)} banked</span>`,
      unlocks ? `<span class="chip">${Icons.get('lock')}${unlocks} unlock${unlocks === 1 ? '' : 's'} kept</span>` : '',
      petals ? `<span class="chip">${Icons.get('star')}${petals} petal${petals === 1 ? '' : 's'} kept</span>` : ''
    ].join('');
    /* The card may not say a place is open and, 200px to its right, that it is
       not. Both halves follow the same condition: the gesture is only promised
       once the strip exists to honour it, and until then the card says the
       thing that is true. */
    const strip = Boolean(UI.enterSeason);
    /* BEAT ONE OF HOLLY'S INTRODUCTION: the gate lifts where the player is
       standing. Winter's card is Fall's card one season on — same object, a
       different sky and a different face — and the face is Holly's rather than
       a bloom's, because this card is the first time anybody meets her. Beat
       two is `hollyIntro`, spoken in her own room on first entry. */
    const gate = r.fallOpens ? `<div class="gate-card">
      <div class="gate-scene${strip ? '' : ' shut'}">
        <span class="hedge l">${UI.hedge(false)}</span><span class="hedge r">${UI.hedge(true)}</span>
        <span class="gate-bloom">${Flora.head(Game.seedById('marigold') || DATA.seeds[0], 62)}</span></div>
      <div class="gate-foot"><span>${strip ? 'Fall is open' : 'Fall opens next'}</span>
        ${strip ? `<span class="chip">${Icons.get('leaf')}the tab on the right</span>` : ''}</div>
    </div>` : r.winterOpens ? `<div class="gate-card">
      <div class="gate-scene winter${strip ? '' : ' shut'}">
        <span class="hedge l">${UI.hedge(false)}</span><span class="hedge r">${UI.hedge(true)}</span>
        <span class="gate-bloom">${Flora.hollyFace(70)}</span></div>
      <div class="gate-foot"><span>${strip ? 'Winter is open' : 'Winter opens next'}</span>
        ${strip ? `<span class="chip">${Icons.get('snow')}past Fall, on the right</span>` : ''}</div>
    </div>` : '';
    const blessed = r.blessed ? `<div class="cost-line good">${Icons.get('star')}<span>
      <b>${Game.seedById(r.blessed).name}</b> carries your blessing — a free Rich Bloom petal.</span></div>` : '';
    return `<div class="cere">
      <div class="cere-flower">${Flora.talkingFlower()}</div>
      <div class="speech-block">${r.fallOpens
        ? 'A whole new year — and somewhere new to put it.'
        : r.winterOpens
          ? 'A whole new year — and somewhere cold to put it. Be nice to her.'
          : 'A whole new year. I can already smell it.'}</div>
      ${gate}
      ${blessed}
      <div class="keep-row">${chips}</div>
      <div class="btn-row">
        <button class="big-btn yes" data-act="turnDone">${Icons.get('sprout')}Into the new year</button>
      </div>
    </div>`;
  }

  function renderTurn() {
    if (turnStep === 0) return turnAsk();
    if (turnStep === 1) return turnBlessPanel();
    if (turnStep >= 2 && turnStep <= 4) return turnResult ? turnTally() : turnAsk();
    return turnSpring();
  }

  /* ---- the sequence ---- */
  function commitTurn() {
    const res = Game.turnYear(turnPick);
    if (!res) { Sound.play('deny'); return; }
    turnResult = res;
    turnStep = 2; turnLines = 0; turnCount = 0;
    lockSheet(true);
    renderSheet(true);
    Sound.play('levelup');
    rollBase();
  }

  function rollBase() {
    const target = Math.floor(turnResult.base);
    if (calm()) { turnCount = target; turnStep = 3; renderSheet(false); landLine(); return; }
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / TURN_BASE_MS);
      turnCount = Math.round(target * (1 - Math.pow(1 - k, 3)));
      const n = $('#turnNum', el.sheetBody);
      if (n) n.textContent = fmt(turnCount);
      if (k < 1) turnAt(40, step);
      else { turnStep = 3; renderSheet(false); turnAt(260, landLine); }
    };
    step();
  }

  function landLine() {
    const lines = turnResult.tally.lines;
    if (turnLines >= lines.length) {
      turnStep = 4;
      renderSheet(false);
      celebrateTurn();
      return;
    }
    turnLines += 1;
    renderSheet(false);
    Sound.play('coin');
    FX.haptic(8);
    turnAt(calm() ? 0 : TURN_LINE_MS, landLine);
  }

  function celebrateTurn() {
    lockSheet(false);
    Sound.play('legend');
    FX.haptic([14, 50, 14]);
    const plate = $('.plate', el.sheetBody);
    if (!plate) return;
    const c = FX.centerOf(plate);
    FX.confetti(c.x, c.y);
    FX.ring(c.x, c.y, '#7bd88f', 0.5, 90);
    FX.shake(7);
  }

  /* ============ Fall's crop picker ============
     The plant picker's own row, unchanged, with two facts removed. Crops roll
     no rarity, take no mutations, drop no gems and are never written to
     `discovered` — so the row has three stat pills instead of five, and the
     shorter row is itself the tell that these are not flowers. The clocks do
     the rest: 20m where Summer says 24s. */
  function renderCrops() {
    const idx = sheetArg ?? 0;
    const pct = Math.round(DATA.fall.windfall * 100);
    const row = (p, extra) => {
      const can = S.credits >= p.cost;
      const tint = (Fall.PLANTS[p.id] || {}).body || '#e8d5a8';
      return `<button class="seed-row${extra || ''}" data-crop="${p.id}" ${can ? '' : 'disabled'}>
        <span class="seed-art" style="--art:${tint}">${Fall.crop(p.id, 3)}</span>
        <span>
          <span class="seed-name">${p.name}</span>
          <span class="seed-stats">
            <span class="stat">${Icons.get('coin')}${fmt(p.cost)}</span>
            <span class="stat">${Icons.get('clock')}${p.century ? `${Math.round(p.grow / 86400)}d` : fmtSpan(p.grow)}</span>
            <span class="stat good">${Icons.get('coin')}${fmt(p.yield)}</span>
          </span>
        </span>
        <span class="seed-go">${Icons.get('sprout')}</span>
      </button>`;
    };
    const crops = DATA.fall.plants.filter((p) => !p.century).map((p) => row(p)).join('');
    const cent = DATA.fall.plants.find((p) => p.century);
    /* The fortnight plant gets its own block and its own material. Two million
       gold in a list of two-thousand-gold strawberries is either scrolled past
       or tapped by accident. */
    const growing = Game.fallCenturyGrowing();
    const century = cent ? `
      <div class="stat-block century-block">
        <h3>${Icons.get('sparkle')} The long plant</h3>
        ${growing
          ? `<p class="stat-note">One is already growing. Only one at a time.</p>`
          : row(cent, ' century')}
        <p class="stat-note">Fourteen days. It survives every Turn, and it stands outside the
          bed — it never blocks the windfall.</p>
      </div>` : '';
    /* "Bed" is the whole board, always — the eight plots that pay together.
       A single cell is a plot, here as in Summer. */
    return `<p class="sheet-note">Planting into plot ${idx + 1}. Every plot ripe at once pays
      <b>+${pct}%</b> on the whole bed.</p>${crops}${century}`;
  }

  /* Winter's picker. Three stat pills like Fall's, plus one that says the
     season's rule at the point of purchase — the chip above the board carries
     it too, and a rule met twice on the way in is a rule learned once. */
  function renderWinterPlants() {
    const idx = sheetArg ?? 0;
    const pct = Math.round(DATA.winter.snowfall * 100);
    const rows = DATA.winter.plants.map((p) => {
      const can = S.credits >= p.cost;
      /* NOT c1 FOR A WHITE BLOOMER. `.seed-art` paints the token under a white
         veil, and two of Winter's six are white — Snowdrop and Paperwhite came
         out the same disc to one part in 255, each carrying a white flower on
         it. docs/05 names this failure by hand on `.set-ring`: "the veil is for
         a SATURATED token; a family already near cream takes a highlight
         instead". The plant's own second colour is the highlight, and it costs
         no new value: Snowdrop's green-marked inner tepal, Paperwhite's cup. */
      const art = Winter.PLANTS[p.id] || {};
      const pale = (hex) => {
        const n = parseInt((hex || '').slice(1), 16);
        return Number.isFinite(n) && ((n >> 16) & 255) > 240 && ((n >> 8) & 255) > 240 && (n & 255) > 235;
      };
      const tint = (pale(art.c1) ? art.c2 : art.c1) || '#dbe8f2';
      return `<button class="seed-row" data-winter-plant="${p.id}" ${can ? '' : 'disabled'}>
        <span class="seed-art" style="--art:${tint}">${Winter.bloom(p.id, 3)}</span>
        <span>
          <span class="seed-name">${p.name}</span>
          <span class="seed-stats">
            <span class="stat">${Icons.get('coin')}${fmt(p.cost)}</span>
            <span class="stat">${Icons.get('clock')}${fmtSpan(p.grow)}</span>
            <span class="stat good">${Icons.get('coin')}${fmt(p.yield)}</span>
          </span>
        </span>
        <span class="seed-go">${Icons.get('sprout')}</span>
      </button>`;
    }).join('');
    return `<p class="sheet-note">Planting into plot ${idx + 1}. Winter plants keep their own
      hours — tuck the bed in, and whatever opens under the quilt pays
      <b>+${pct}%</b> in the morning.</p>${rows}`;
  }

  function renderSeeds() {
    const plot = sheetArg ?? 0;
    /* Freshest truth before the list is built — a threshold crossed since the
       last render (a tap, an offline reconcile, a Turn's cap resetting) must
       show up the moment this sheet opens, not on the render after. */
    Game.refreshReveals();
    const rows = sortedSeeds().map((s) => {
      /* The curtain, docs/47: everything past this point in the list is
         masked before it is anything else — a silhouette, a name of ???, one
         line that never says what it is hiding. No stats, no price, no
         description; the row stays IN the list rather than vanishing, which
         is the whole point of the ruling. */
      if (!Game.seedRevealedNow(s.id)) {
        /* The padlock lives in `.seed-lock`, never `.seed-go` — that slot is
           the plant affordance and nothing else (docs/09's own scan enforces
           it: "no go slot can render a padlock"). A masked row shows no
           price to be "ok" or "no" about, so it always wears the same
           drained family the locked row's own `.no` state does. */
        return `<button class="seed-row masked" data-seed="${s.id}" disabled>
          <span class="seed-art cv-mask">${Icons.get('mysteryBloom')}</span>
          <span>
            <span class="seed-name"><span class="cv-qmark">???</span></span>
            <span class="cv-hint">${CURTAIN_HINT}</span>
          </span>
          <span class="seed-lock no">${Icons.get('lock')}</span>
        </button>`;
      }
      const locked = !Game.seedUnlocked(s.id);
      const can = !locked && S.credits >= s.cost;
      /* The real number this plot would get, not the one on the seed's data
         row. The label used to apply growModifier() alone, so a flower full of
         Quick Sprout read 18 seconds while genuinely growing in 12 — the engine
         was right and the label lied. Both pills now come from the same
         functions the plant itself goes through, and a number the garden has
         improved says so rather than being quietly different. */
      const grow = Math.round(Game.plantGrowth(s, plot));
      const quicker = grow < Math.round(s.grow);
      const pay = Game.plantPayout(s, plot);
      const drops = [];
      if (s.gemChance) drops.push(`<span class="stat gem">${Icons.get('gem')}${pct(s.gemChance, 1)}</span>`);
      if (locked) {
        /* A locked row is DRAINED, never illegible: it is an advert for the
           thing you are saving up for, so its numbers have to survive. The
           unlock price sits in the slot the go button uses on every other row,
           so the eye finds the answer in the same place down the whole list. */
        const price = Game.seedUnlockPrice(s.id);
        const afford = S.credits >= price;
        /* The curtain's quiet tier on a locked row: revealed but not yet
           celebrated. The seed's OWN `.fresh` class stays reserved for the
           moment you actually buy it — a different flag, a different id
           shape (justUnlocked vs. this moment key), and conflating them was
           priced and rejected. */
        const justRevealed = isFreshReveal(`seed:${s.id}`);
        return `<button class="seed-row locked${justRevealed ? ' reveal-fresh' : ''}" data-unlock="${s.id}">
          <span class="seed-art" style="--art:${s.art.c1}">${Flora.head(s, 40)}</span>
          <span>
            <span class="seed-name">${s.name}${verbChip(s)}</span>
            <span class="seed-stats">
              <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
              <span class="stat s-grow${quicker ? ' good' : ''}">${Icons.get('clock')}${fmtTime(grow)}</span>
              <span class="stat good s-pay">${Icons.get('coin')}${fmt(pay.min)}–${fmt(pay.max)}${mx(pay.mult)}</span>
              ${drops.join('')}
            </span>
            ${verbNote(s)}
          </span>
          <span class="seed-lock ${afford ? 'ok' : 'no'}">${Icons.get('lock')}${fmt(price)}</span>
        </button>`;
      }
      /* The go button drains, it never becomes a padlock. In this picker a
         padlock means the one-time wall above and nothing else; a row you will
         afford in ten seconds is grey, and grey is the whole message. */
      return `<button class="seed-row${justUnlocked === s.id ? ' fresh' : ''}" data-plant="${s.id}" ${can ? '' : 'disabled'}>
        <span class="seed-art" style="--art:${s.art.c1}">${Flora.head(s, 40)}</span>
        <span>
          <span class="seed-name">${s.name}${verbChip(s)}</span>
          <span class="seed-stats">
            <span class="stat">${Icons.get('coin')}${fmt(s.cost)}</span>
            <span class="stat s-grow${quicker ? ' good' : ''}">${Icons.get('clock')}${fmtTime(grow)}</span>
            <span class="stat good s-pay">${Icons.get('coin')}${fmt(pay.min)}–${fmt(pay.max)}${mx(pay.mult)}</span>
            ${drops.join('')}
          </span>
          ${verbNote(s)}
        </span>
        <span class="seed-go">${Icons.get('sprout')}</span>
      </button>`;
    }).join('');
    if (pendingUnlock) return unlockAsk();
    return `<p class="sheet-note">Planting into plot ${plot + 1}. Times and payouts are what this plot
      would really give — sprinklers, boosts, keepers and petals already counted.</p>${rows}`;
  }

  /* An unlock is one-time, permanent and unrefundable, and the game has no undo
     — so it asks. Rendered as the whole panel rather than as a card floating
     over the list, because a floating card has to survive a re-render in a
     scrolling body and this does not. */
  function unlockAsk() {
    const s = Game.seedById(pendingUnlock);
    if (!s) return '';
    const price = Game.seedUnlockPrice(s.id);
    const afford = S.credits >= price;
    return `<div class="unlock-ask">
      <span class="unlock-art" style="--art:${s.art.c1}">${Flora.head(s, 76)}</span>
      <h3>Unlock ${s.name}?</h3>
      <p>${fmt(price)} gold, once. It stays unlocked through every Turn, for good.</p>
      <div class="unlock-row">
        <button class="big-btn" data-unlockno="1">Not yet</button>
        <button class="big-btn yes" data-unlockgo="${s.id}" ${afford ? '' : 'disabled'}>
          ${Icons.get('coin')}${fmt(price)}
        </button>
      </div>
      ${afford ? '' : `<p class="unlock-short">${fmt(price - S.credits)} short.</p>`}
    </div>`;
  }

  function questRewardLine(def) {
    const bits = [`+${def.rep} reputation`];
    if (def.reward && def.reward.credits) bits.push(`+${fmt(def.reward.credits)} coins`);
    if (def.reward && def.reward.gems) bits.push(`+${def.reward.gems} gems`);
    /* A named booster and nothing else told a player who has never held one
       exactly nothing. How long it runs is the fact that fits — the rail chip
       carries the rest once it is lit. */
    if (def.reward && def.reward.boost) {
      const b = DATA.boosters.find((x) => x.id === def.reward.boost);
      const n = def.reward.n || 1;
      if (b) bits.push(`${n > 1 ? `${n} × ` : ''}${b.name} (${fmtTime(b.dur)})`);
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

  /* ============ Orders & Quests — the first of the Big Five ============ */
  /* ONE panel, TWO headed sections, not two tabs. The button's badge counts two
     different things — an order you can fill and a quest you can claim — so a
     player who taps in on a "2" has to be able to see both without making a
     second choice first. The scroll is short either way: three order slots, at
     most three ladder quests and one daily.

     Both halves are the panels that already existed. The Stand's own two-line
     header becomes this panel's first section heading, which is why nothing here
     is drawn twice. */
  function renderOrders() {
    /* The badge counts two things, so the panel names two things. Without a
       heading on the second half, a player who tapped in on a claimable quest
       scrolled past the Stand's footer into what looked like the same list. */
    const q = Game.stripQuest();
    const ready = q && q.complete;
    return `${renderStand()}
      <div class="ord-split"></div>
      <div class="on-head">
        <div class="on-head-copy">
          <b>Quests</b>
          <span>${ready ? 'One is ready to claim.' : 'Reputation, and what it opens.'}</span>
        </div>
        ${ready ? `<span class="on-tier">${Icons.get('check')}Ready</span>` : ''}
      </div>
      ${renderQuests()}`;
  }

  /* ============ The Year — the fourth of the Big Five ============ */
  /* The projection card the HUD pill used to pop, with room to breathe: the
     pouch, both Turn gates, the ceremony's own button when it is ready, and
     petal spending as a card per flower.

     YEAR ONE IS DIFFERENT, and deliberately so. Doc 32's rule is that the meter
     fills unexplained — but the owner's rule on top of it is that a mystery with
     no direction reads as broken. So year one gets a locked meter, ONE track
     (the gold, because gold is the half a player can push on directly), no
     numbers on it, and the flower saying what to do. The pouch, the petals and
     the seed gate all still wait for the first Turn. */
  function renderYear() {
    const { mint, seeds, coins, p } = UI.yearProgress();
    const y = DATA.year;
    const first = S.year.turnsCompleted < 1 && !(S.savedSeeds > 0);
    const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);

    const ready = Game.turnReady();

    if (first) {
      /* THE MYSTERY HAS TO HAVE A DOOR OUT OF IT. A meter that is full, a dock
         button that is breathing, and a panel still saying "keep going" is the
         exact failure the owner named: mysterious with no direction reads as
         broken. So the moment the Turn is ready the lock comes off and the
         ceremony's own button appears — and the ceremony's ask is where the
         explaining has always happened. Everything else stays hidden: no pouch,
         no second gate, no petals. */
      if (ready) {
        return `
          <div class="yr-meter ready" style="--p:100%"><i></i>
            <div class="yr-lab"><b>It&rsquo;s full</b></div>
          </div>
          <div class="cere-flower">${Flora.talkingFlower()}</div>
          <p class="sheet-note yr-say">&ldquo;It&rsquo;s full &mdash; and I know what it&rsquo;s for after all. Come and see.&rdquo;</p>
          <button class="big-btn yes" data-act="openTurn">${Icons.get('pouch')}See what it&rsquo;s for</button>`;
      }
      return `
        <div class="yr-meter locked" style="--p:${pct}%"><i></i>
          <div class="yr-lab">${Icons.get('lock')}<b>Something is filling</b></div>
        </div>
        <div class="yr-gates">
          <div class="yr-gate bind">
            <span class="lab">${Icons.get('coin')}Gold earned</span>
            <span class="track"><i style="width:${Math.round(Math.min(1, coins) * 100)}%"></i></span>
            <span class="tag">keep going</span>
          </div>
        </div>
        <div class="cere-flower">${Flora.talkingFlower()}</div>
        <p class="sheet-note yr-say">&ldquo;${UI.mysteryLine()}&rdquo;</p>
        <p class="sheet-note yr-say">&ldquo;Keep the gold coming and I&rsquo;ll know what it&rsquo;s for.&rdquo;</p>`;
    }

    const cta = ready
      ? `<button class="big-btn yes" data-act="openTurn">${Icons.get('pouch')}Turn the year</button>`
      : '';
    return `
      <div class="yr-meter${ready ? ' ready' : ''}" style="--p:${pct}%"><i></i>
        <div class="yr-lab"><b>${ready ? 'The year is ready to turn' : 'The year is still growing'}</b></div>
      </div>
      <div class="yr-gates">
        ${yrGate('coin', 'Gold earned', coins, coins <= seeds)}
        ${yrGate('pouch', 'Pouch ready', seeds, seeds < coins)}
      </div>
      <p class="sheet-note">Ready to save: <b>${fmt(Math.floor(mint.base))}</b> Saved Seeds. How the year <b>scored</b> is added when you Turn.</p>
      ${cta}
      <p class="sheet-note yr-spend">Spend your pouch
        <span class="chip">${Icons.get('pouch')}${fmt(S.savedSeeds)}</span></p>
      ${petalCards()}`;
  }

  /* Only the meter and the two tracks move on a tick. The petal cards and the
     ceremony's button are pressable and stay exactly where they are — the old
     projection popover could be rebuilt wholesale because it held nothing you
     could press, and this panel is not that. */
  function syncYearPanel() {
    if (sheetMode !== 'year') return;
    const { coins, seeds, p } = UI.yearProgress();
    const meter = el.sheetBody.querySelector('.yr-meter');
    if (!meter) return;
    meter.style.setProperty('--p', `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`);
    const tracks = el.sheetBody.querySelectorAll('.yr-gate .track i');
    const ratios = tracks.length === 1 ? [coins] : [coins, seeds];
    tracks.forEach((t, i) => {
      const w = `${Math.round(Math.min(1, Math.max(0, ratios[i])) * 100)}%`;
      if (t.style.width !== w) t.style.width = w;
    });
    /* The one change that IS a rebuild: the ceremony's button arriving, or year
       one's lock coming off. Those change what is on the panel rather than how
       far along it is, and neither can land under a thumb already pressing. */
    if (Game.turnReady() !== Boolean(el.sheetBody.querySelector('[data-act="openTurn"]'))) renderSheet();
  }

  /* The two tracks, with the BINDING one marked — the lower of the pair is what
     the dock button's fill is drawing, so "why can't I turn yet" is answered in
     the same place twice rather than in two different units. */
  /* Exactly ONE gate wears the marker. A tie marks the first, because two
     "this one" tags answer "why can't I turn yet" with a shrug. */
  function yrGate(icon, label, ratio, isBinding) {
    const met = ratio >= 1;
    const bind = isBinding && !met;
    return `<div class="yr-gate${met ? ' met' : ''}${bind ? ' bind' : ''}">
      <span class="lab">${Icons.get(icon)}${label}</span>
      <span class="track"><i style="width:${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%"></i></span>
      <span class="tag">${met ? Icons.get('check')
        : (bind ? 'this one' : (ratio >= 0.8 ? 'nearly' : `${Math.round(Math.max(0, ratio) * 100)}%`))}</span>
    </div>`;
  }

  /* Petal spending, as a card per flower — doc 36's words. The Almanac keeps the
     RECORD rows (what you found, its best rarity, how many you grew); this is
     the shop. Only unlocked seeds appear, because a petal on a flower you cannot
     plant is not a purchase. */
  function petalCards() {
    const cards = DATA.seeds.filter((sd) => Game.seedUnlocked(sd.id)).map((sd) => `
      <div class="pt-card">
        <div class="pt-head"><span class="pt-art">${Flora.head(sd, 26)}</span>${sd.name}</div>
        ${petalTrack(sd, 'rich', DATA.petals.shared.rich.name)}
        ${petalTrack(sd, 'quick', DATA.petals.shared.quick.name)}
      </div>`).join('');
    return `<div class="pt-cards">${cards}</div>`;
  }

  function renderQuests() {
    const lv = Game.levelFromRep(S.rep);
    const into = Game.repIntoLevel(S.rep);
    const need = Game.repToNext(lv);
    const active = Game.activeQuests().map((inst) => questCard(inst, Game.questById(inst.id), true)).join('');
    const daily = S.quests.daily;
    const ddef = daily && daily.id ? Game.questById(daily.id) : null;
    const dailyHtml = ddef && !daily.claimed
      ? questCard(daily, ddef, true)
      : `<p class="sheet-note">Today's quest is done. A new one arrives tomorrow.</p>`;
    // Paused quests are never handed out, so counting them would leave the
    // ladder permanently a few short of finished. Done ones can include a
    // paused id from an older save, so subtract against the live list.
    const live = DATA.quests.filter((q) => !q.paused);
    const doneLive = live.filter((q) => S.quests.done.indexOf(q.id) !== -1).length;
    const left = live.length - doneLive;
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
    /* Round to whole minutes FIRST. Rounding the remainder separately turns
       23h 59m 59s into "23h 60m". */
    const mins = Math.round(s / 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  /* Feeding buys a star for a while and nothing more. A creature that has not
     been fed works exactly as it always did — see docs/22-creatures.md, where
     the reason that matters is stated at some length. */
  /* The food is the button. A big token with what it gives you stamped on it,
     then the name, then the price — icon first, words second, which is the note
     the owner keeps coming back to. One clock means one number to stamp. */
  /* THE STAMP IS THE REAL GAIN, NOT THE TIN'S. It printed `f.hours` while the
     engine clamped to the 24-hour cap, so a creature with 22 hours left was
     offered "+16h" and handed two. Both numbers come off one getter now, and the
     line under the name is what the clock will read once the food is in. */
  /* The stamp is a corner badge on a 52px token, so it gets ONE unit — "14h 2m"
     wraps inside the pill and breaks it. The exact span is on the line below. */
  function foodStamp(eff) {
    /* An ad tier the cap would trim stamps the TIN'S number, not the trimmed
       one — the trimmed number is precisely what it is refusing to give. */
    if (eff.partial) return `+${Math.round(eff.nominal / 3600)}h`;
    const s = Math.round(eff.gain);
    if (s <= 0) return 'Full';
    if (s < 60) return `+${s}s`;
    if (s < 3600) return `+${Math.round(s / 60)}m`;
    return `+${Math.round(s / 3600)}h`;
  }

  function foodAfter(eff) {
    if (eff.gain <= 0) return `full at ${fmtSpan(eff.fedForAfter)}`;
    /* An ad is spent before the food arrives, so this tier says what it CANNOT
       do rather than what it would be trimmed to. */
    if (eff.partial) return 'too full for all of it';
    return eff.capped ? `caps at ${fmtSpan(eff.fedForAfter)}` : `then ${fmtSpan(eff.fedForAfter)}`;
  }

  function foodButtons(id) {
    /* Absent, not disabled: a first session, or a day whose ad budget is spent,
       simply has two tiers. The row's column count comes with it, so the grid
       never leaves a third of itself empty. */
    const foods = CREATURE_FOOD.filter((f) => f.currency !== 'ad' || Game.adOffered('food'));
    return `<span class="food-row" data-n="${foods.length}">${foods.map((f) => {
      const eff = Game.foodEffect(id, f.id);
      const room = eff.gain > 0 && !eff.partial;
      const pot = f.currency === 'gems' ? S.gems : S.credits;
      const can = room && (f.currency === 'ad' || pot >= f.cost);
      return `<button class="food-btn${can ? ' affordable' : ''}" data-feed="${f.id}" data-who="${id}"
        ${room ? '' : 'disabled'} title="${f.desc}">
        <span class="food-ico">${Icons.get(f.icon)}<b>${foodStamp(eff)}</b></span>
        <span class="food-name">${f.name}</span>
        <span class="food-after${eff.capped || eff.partial ? ' capped' : ''}">${foodAfter(eff)}</span>
        ${f.currency === 'ad' ? adTag(room) : priceTag(f.cost, f.currency, can)}
      </button>`;
    }).join('')}</span>`;
  }

  /* One creature, and everything you can do to it. Tapping a pet in the Hollow
     opens this rather than spending the tap on whichever dock verb was armed —
     modes were a workaround for having one tap target and several verbs, and a
     sheet is the answer that does not make the player arm anything first. */
  function renderCritter() {
    const def = Game.critterById(sheetArg);
    if (!def || !Game.critterHere(def.id)) return '<p class="stat-note">Nobody by that name lives here.</p>';
    const id = def.id;
    const tending = Game.critterTending(id);
    const asleep = Game.critterAsleep(id);
    const fed = Game.critterFed(id);
    const level = Game.critterLevel(id);
    const trait = def.trait ? CREATURE_TRAITS[def.trait.id] : null;
    const now = trait ? Game.critterTraitAt(def, Game.critterWorkLevel(id)) : 0;
    const goal = Game.critterGoal(id);
    const seed = Game.seedById(def.attract.seed);
    const held = Game.mementoCount(def.keepsake.id);
    const waiting = Game.keepsakesWaiting(id);
    const canTend = tending || Game.habitatFree() > 0;

    /* ONE box for the skill and its level, because they are the same thing — the
       star IS the trait getting stronger, so two cards said less and crowded
       more. Read left to right the row is a sentence made of pictures: this
       bloom, this far along, toward this star. The bar is as tall as the tokens
       beside it so the count and the caption stack INSIDE it. */
    const bloom = seed ? `<span class="cp-token">${Flora.head(seed, 34)}</span>` : '';
    const starToken = (n) => `<span class="cp-token cp-goal">${Icons.get('star')}<b>${n}</b></span>`;
    const grow = goal
      ? `<div class="cp-grow">
           ${bloom}
           <div class="cp-bar">
             <i style="width:${(Math.min(1, goal.have / goal.qty) * 100).toFixed(1)}%"></i>
             <span class="cp-bar-text">
               <b>${fmt(Math.min(goal.have, goal.qty))} / ${fmt(goal.qty)}</b>
               <em>${seed ? seed.name : 'Blooms'} harvested</em>
             </span>
           </div>
           ${starToken(goal.level)}
         </div>`
      : `<div class="cp-grow maxed">
           ${bloom}
           <div class="cp-bar">
             <i style="width:100%"></i>
             <span class="cp-bar-text"><b>Fully grown</b><em>Nothing left to ask for</em></span>
           </div>
           ${starToken(CREATURE_STARS)}
         </div>`;

    const skill = `<div class="cp-skill">
      ${trait ? `<span class="cp-card-k">${Icons.get(trait.icon)}${trait.name}</span>
        <span class="cp-card-v">${trait.desc(now)}</span>` : ''}
      ${grow}
    </div>`;

    /* ONE meter, because there is one clock. The pip marks where the star lapses:
       above it a creature is well fed and works a star up, below it it is awake
       but hungry, at nothing it is asleep. The pip sits LOW on purpose — that
       makes the band under it a warning strip rather than a bar to climb. */
    const cap = Game.foodCapSeconds();
    const left = Game.critterFedFor(id);
    const pipPct = (Game.fedThresholdSeconds() / cap) * 100;
    const meter = `<div class="cp-fuel${asleep ? ' out' : fed ? ' on' : ' low'}">
      <div class="cp-fuel-top">
        <span class="cp-fuel-k">${Icons.get(fed ? 'star' : 'clock')}${
          asleep ? 'Asleep' : fed ? 'Well fed' : 'Getting hungry'}</span>
        <span class="cp-fuel-v">${asleep ? `A meal wakes ${def.name} up` : `${fmtSpan(left)} left`}</span>
      </div>
      <div class="cp-fuel-bar">
        <i style="width:${Math.min(100, (left / cap) * 100).toFixed(1)}%"></i>
        <span class="cp-pip" style="left:${pipPct.toFixed(1)}%"
          title="Above this line it works a star higher">${Icons.get('star')}</span>
      </div>
    </div>`;

    const keep = !tending
      ? `<span class="critter-memento${held ? '' : ' none'}">${Icons.get('gift')}${
          def.keepsake.name} <b>×${fmt(held)}</b> kept</span>`
      : waiting
        ? `<span class="critter-memento">${Icons.get('gift')}<b>${waiting} ${def.keepsake.name}</b>
           waiting — tap it up in the garden</span>`
        : `<span class="critter-memento none">${Icons.get('gift')}${def.keepsake.name} <b>×${
            fmt(held)}</b> kept</span>`;

    const pairs = CREATURE_PAIRS.filter((p) => p.of.indexOf(id) !== -1);

    /* Order is the design here. Who it is, what it does, how grown it is, and
       then everything you might have opened this to DO — a sleeping creature
       should never need a scroll to reach the food that wakes it. */
    return `<div class="panel critter-panel">
      <div class="cp-plate${asleep ? ' asleep' : ''}">
        <h2 class="cp-name outlined">${def.name}</h2>
        <p class="cp-species">${def.species}</p>
        ${critterStars(level, fed && !asleep)}
      </div>

      ${skill}

      <h3>${Icons.get('honey')} Feed</h3>
      ${tending ? meter : ''}
      ${tending
        ? foodButtons(id)
        : '<p class="stat-note">Resting at home. It earns nothing and leaves nothing while it is in — send it out and food will do something.</p>'}

      <h3>${Icons.get('star')} Out or resting</h3>
      <button class="big-btn quiet" data-tend="${id}" data-on="${tending ? '1' : '0'}"
        ${canTend ? '' : 'disabled'}>${tending ? 'Send it home to rest' : 'Send it out to tend'}</button>
      <p class="stat-note cp-slots">${Game.habitatUsed()} of ${Game.habitatSlots()} tending${
        canTend ? '' : ' — rest someone else to bring this one out'}</p>

      <h3>${Icons.get('gift')} Keepsakes</h3>
      <div class="cp-card">${keep}</div>

      <h3>${Icons.get('sprout')} Say hello</h3>
      <p class="cp-about">${def.about}</p>
      <button class="big-btn" data-pet="${id}">Pet ${def.name}</button>
      <p class="cp-said" id="cpSaid">${def.lines.idle[0]}</p>

      ${pairs.length ? `<h3>${Icons.get('clover')} Companions</h3>${pairs.map((pair) => {
        const on = Game.pairActive(pair.id);
        const seen = S.pairsSeen.indexOf(pair.id) !== -1;
        const other = Game.critterById(pair.of.find((x) => x !== id));
        return `<div class="pair-row${on ? ' on' : ''}${seen ? '' : ' dim'}">
          <span class="pair-faces"><span class="pair-face${
            Game.critterHere(other.id) ? '' : ' unmet'}">${Critters.draw(other)}</span></span>
          <span class="pair-copy">
            <span class="pair-name">${seen ? pair.name : '???'}${on ? '<em>active</em>' : ''}</span>
            <span class="pair-note">${seen ? pair.desc : `Have both of them tending to find out.`}</span>
            <span class="pair-who">with ${other.name}</span>
          </span>
        </div>`;
      }).join('')}` : ''}
    </div>`;
  }


  function feedRows() {
    const home = Game.crittersHome();
    if (!home.length) {
      return '<p class="stat-note">Nobody lives here yet. Grow what they like and they will turn up.</p>';
    }
    /* Tending first — they are the only ones that can be fed at all, so a resting
       creature is dead weight at the top of the panel you came here to act in.
       Deliberately NOT sorted by who needs feeding most: that order changes on
       the very tap you just made, so the row you were looking at would jump away
       the instant you fed it. This one only moves when the loadout does, which
       happens on another screen. `sort` is stable, so each group keeps the
       roster order the Almanac uses. */
    const ordered = home.slice().sort((a, b) =>
      Number(Game.critterTending(b.id)) - Number(Game.critterTending(a.id)));

    return ordered.map((def) => {
      const tending = Game.critterTending(def.id);
      const fed = Game.critterFed(def.id);
      const level = Game.critterLevel(def.id);
      const trait = def.trait ? CREATURE_TRAITS[def.trait.id] : null;
      const now = trait ? Game.critterTraitAt(def, Game.critterWorkLevel(def.id)) : 0;

      const asleep = Game.critterAsleep(def.id);
      // One clock: the same number is how long it stays up AND how long the star
      // lasts, separated only by the threshold.
      const leftFor = `<b data-span="${Math.round(Game.nowSeconds() + Game.critterFedFor(def.id))}">${
        fmtSpan(Game.critterFedFor(def.id))}</b>`;
      const status = !tending
        ? '<span class="critter-note">Resting. Send it out in the Hollow to feed it.</span>'
        : asleep
          ? `<span class="food-state out"><span>Fast asleep, and not working.
             Feed it to wake it up.</span></span>`
          : fed
            ? `<span class="food-state on">${Icons.get('star')}<span>Well fed — working like
               ★${Game.critterWorkLevel(def.id)}, ${leftFor} of food left.</span></span>`
            : `<span class="food-state">${Icons.get('clock')}<span>Getting hungry — ${leftFor} left,
               working like ★${level}.</span></span>`;

      /* The food buttons sit outside the text column so they get the row's full
         width — nested beside a 46px portrait, three of them wrap to 2 + 1. */
      return `<div class="critter-row feed-row${tending ? '' : ' dim'}${
        asleep ? ' napping' : fed ? ' fed' : ''}">
        <span class="feed-top">
          <span class="critter-face${asleep ? ' asleep' : ''}">${Critters.draw(def)}</span>
          <span class="critter-copy">
            <span class="critter-who">${def.name} <em>· ${def.species}</em>${
              critterStars(level, fed && !asleep)}</span>
            ${trait ? `<span class="critter-trait">${Icons.get(trait.icon)}<b>${trait.name}:</b> ${trait.desc(now)}</span>` : ''}
            ${status}
          </span>
        </span>
        ${tending ? foodButtons(def.id) : ''}
      </div>`;
    }).join('');
  }

  /* ---------------- the Garden Stand ----------------

     The queue, and then one customer at a time. Deliberately NOT a list of order
     cards: the person is the story and the goods are the token, so a face is the
     largest thing on every row and tapping one opens them the way tapping a
     creature opens it.

     Every bloom asked for is drawn with the real Flora.head(), never named in
     prose — the owner's standing note that iconography beats sentences, and the
     reason an order reads at a glance. */

  const standNeedArt = (need, size) => {
    if (need.any) return `<span class="on-mixed">${Icons.get('petal')}</span>`;
    if (need.kind === 'honey') return `<span class="on-jar">${Icons.get('honey')}</span>`;
    const sd = Game.seedById(need.of);
    return sd ? Flora.head(sd, size) : Icons.get('petal');
  };

  const standNeedName = (need) => {
    if (need.any) return 'Any blooms';
    if (need.kind === 'honey') return APIARY.honeyName(need.of);
    const sd = Game.seedById(need.of);
    return sd ? sd.name : need.of;
  };

  /* One line item as a token: the thing itself on top, and how many of them you
     have in a band of its own underneath.

     The count used to sit ON the art and the owner caught it — a number across
     the bottom of a bloom means neither reads, and the bloom is the half the
     player has to act on. Both halves always show their numbers now, covered or
     not, with a tick added rather than substituted: "3/3 ✓" says more than a
     tick alone, which loses the size of the ask. */
  function standNeedChip(need, size) {
    const have = Game.standHave(need);
    const done = have >= need.qty;
    return `<div class="on-chip${done ? ' done' : ''}">
      <div class="on-chip-art">${standNeedArt(need, size)}</div>
      <div class="on-chip-count">${fmt(Math.min(have, need.qty))}/${fmt(need.qty)}${done ? Icons.get('check') : ''}</div>
      <div class="on-chip-name">${standNeedName(need)}</div>
      <b class="on-chip-qty">${need.qty}</b>
    </div>`;
  }

  const standFaceFor = (order) => {
    const c = customerById(order.customer);
    return c ? Customers.draw(c) : '';
  };

  /* Waiting vs. ready is carried on the face, not in a label. A customer whose
     order you can fill is already smiling at you from the queue, which is the
     whole reason the expressions exist. */
  const standMoodClass = (order) => (Game.standCanDeliver(order) ? 'is-happy' : 'is-waiting');

  function standRow(slot) {
    const order = Game.standOrderAt(slot);
    if (!order) {
      const left = Game.standRefillIn(slot);
      return `<div class="on-row empty">
        <div class="on-empty-art">${Icons.get('clock')}</div>
        <div class="on-empty-copy">
          <b>Someone is on their way</b>
          <span>${fmtSpan(left)}</span>
        </div>
      </div>`;
    }
    const c = customerById(order.customer);
    const good = goodById(order.good);
    const ready = Game.standCanDeliver(order);
    const pct = Math.round(Game.standProgress(order) * 100);
    const rep = Game.standOrderRep(order);
    return `<button class="on-row${ready ? ' ready' : ''}" data-order="${slot}">
      <div class="on-face ${standMoodClass(order)}">${standFaceFor(order)}</div>
      <div class="on-main">
        <div class="on-who">${c ? c.name : ''}</div>
        <div class="on-good">${Icons.get(good ? good.icon : 'petal')}<span>${good ? good.name : ''}</span></div>
        <div class="on-chips">${order.needs.map((n) => standNeedChip(n, 30)).join('')}</div>
        <div class="on-bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="on-pay">
        <span class="on-coins">${Icons.get('coin')}${fmt(order.coins)}</span>
        ${rep ? `<span class="on-rep">${Icons.get('star')}${rep}</span>` : ''}
        ${ready ? '<span class="on-go">Ready</span>' : ''}
      </div>
    </button>`;
  }

  function renderStand() {
    const tier = Game.standTier();
    const rows = [];
    for (let i = 0; i < STAND.slots; i += 1) rows.push(standRow(i));
    const ready = Game.standOrders().filter((o) => Game.standCanDeliver(o)).length;
    return `<div class="on-head">
        <div class="on-head-copy">
          <b>The Garden Stand</b>
          <span>${ready ? `${ready} ready to hand over` : 'Grow what they ask for.'}</span>
        </div>
        <span class="on-tier">${Icons.get('star')}Tier ${tier.tier}</span>
      </div>
      <div class="on-list">${rows.join('')}</div>
      <p class="on-foot">Nobody minds waiting, and turning someone away costs nothing.</p>`;
  }

  /* One customer, standing on the sheet. Same device as the creature panel, and
     for the same reason — a person you can see is a person you want to please. */
  function renderOrder() {
    const slot = Number(sheetArg);
    const order = Game.standOrderAt(slot);
    if (!order) return '<p class="on-foot">They have gone home.</p>';
    const c = customerById(order.customer);
    const good = goodById(order.good);
    const ready = Game.standCanDeliver(order);
    const pct = Math.round(Game.standProgress(order) * 100);
    const rep = Game.standOrderRep(order);
    const mood = ready ? 'delivered' : 'waiting';
    const line = ready
      ? UI.pickLine(c.lines.greet, order.id)
      : UI.pickLine(c.lines.waiting, order.id);

    return `<div class="on-plate">
        <h2 class="on-name">${c.name}</h2>
        <p class="on-said" id="onSaid">${line}</p>
      </div>
      <div class="on-want">
        <div class="on-want-head">${Icons.get(good.icon)}<b>${good.name}</b></div>
        <p class="on-line">${good.line}</p>
        <div class="on-chips big">${order.needs.map((n) => standNeedChip(n, 46)).join('')}</div>
        <div class="on-bar big"><i style="width:${pct}%"></i></div>
      </div>
      <div class="on-pays">
        <span class="on-coins">${Icons.get('coin')}${fmt(order.coins)}</span>
        ${rep ? `<span class="on-rep">${Icons.get('star')}${rep} rep</span>` : ''}
      </div>
      <button class="big-btn${ready ? ' go' : ' off'}" data-deliver="${slot}"${ready ? '' : ' disabled'}>
        ${ready ? 'Hand it over' : 'Still growing'}
      </button>
      <button class="ghost-btn" data-skiporder="${slot}">Not today &middot; free</button>
      <p class="on-foot" data-mood="${mood}">A new face turns up ${fmtSpan(STAND.refill)} after this one leaves.</p>`;
  }

  function renderFeed() {
    const naps = Game.crittersAsleep().length;
    return `<div class="panel">
      ${naps ? `<p class="feed-alert">${Icons.get('clock')}<span>${
        naps === 1 ? 'Someone has' : `${naps} of them have`} fallen asleep and stopped working.
        Feed to wake ${naps === 1 ? 'them' : 'them all'} up.</span></p>` : ''}
      <p class="stat-note">Food does two things. It keeps a creature <b>awake</b> — a sleeping one
        does nothing at all — and it keeps it <b>well fed</b>, which makes it work
        <b>one star above itself</b>. The awake half always lasts longer.</p>
      <p class="stat-note">Either clock can run up to <b>${FOOD_CAP_HOURS} hours</b> ahead.</p>
      ${feedRows()}
    </div>`;
  }

  /* THE PETAL TRACKS. They replace the mastery goal line the Garden Year
     retired, and they appear ONLY after the first Turn: doc 32's year one is
     "nothing, unexplained — the mystery is the tutorial", so there is no
     teaser, no locked track and no coming-soon. The pips arriving the morning
     after Turn 1 IS the tutorial. The signature (third) skill is slice B and is
     deliberately not stubbed — a row that advertises an unbuilt thing is the
     quest-strip trap wearing a different hat. */
  /* THE PIPS KEEP THE FEEL, THE NUMBER CARRIES THE VALUE. Dots alone were the
     phase-2 position and the owner overruled it from live play: this is an
     incremental game, so a button that costs something says what you get and
     what you now have. Rich Bloom is read in gold, Quick Sprout in time, and
     both are handed over by Game.petalEffect() rather than worked out here. */
  function petalValue(skill, eff) {
    const unit = skill === 'quick' ? 'time' : 'gold';
    const sign = skill === 'quick' ? '−' : '+';
    const now = `${sign}${Math.round(eff.now * 100)}% ${unit}`;
    if (eff.maxed) return `<span class="pv full">${now} · every petal in</span>`;
    const next = `next ${sign}${Math.round(eff.next * 100)}%`;
    return `<span class="pv">${eff.owned ? `${now} · ` : ''}${next}</span>`;
  }

  function petalTrack(seed, skill, label) {
    const def = DATA.petals.shared[skill];
    const eff = Game.petalEffect(seed.id, skill);
    const owned = eff.owned;
    const maxed = eff.maxed;
    const pips = Array.from({ length: def.cap }, (_, i) =>
      `<i class="pip${i < owned ? '' : ' off'}"></i>`).join('');
    const cost = maxed ? 0 : Game.petalCost(seed.id, skill);
    const can = !maxed && S.savedSeeds >= cost;
    const chip = maxed
      ? '<span class="price maxed">MAX</span>'
      : `<button class="price petal-buy ${can ? 'ok' : 'no'}" data-petal="${seed.id}" data-skill="${skill}"
           ${can ? '' : 'disabled'} aria-label="Buy a ${label} petal for ${seed.name}, ${fmt(cost)} Saved Seeds, taking it from ${Math.round(eff.now * 100)} to ${Math.round((eff.now + eff.next) * 100)} percent">${Icons.get('pouch')}${fmt(cost)}</button>`;
    /* THE SKILL SAYS WHAT IT IS BEFORE IT SAYS WHAT IT IS WORTH. At zero pips
       the value line collapses to a bare "next +30%", which teaches a player who
       has never bought one absolutely nothing — the name is four small words in
       a 44px column and the number has no noun attached to it. The sentence is
       authored in data and the percentage is written back into it from `value`,
       so it can never disagree with the effect. It is drawn at every pip count,
       not only at zero: the meaning does not stop being useful once you own one.
       `grid-column:1 / -1` is what keeps it out of the four-column track. */
    const desc = (def.desc || '').replace('{v}', pct(def.value));
    /* AT ZERO PIPS THE SENTENCE IS THE VALUE LINE. Unowned, `petalValue()`
       collapses to a bare "next +30%" — the same number the sentence already
       carries, with a noun attached. Printing both there is one fact said
       twice; from one pip on they answer different questions (what you have
       and what one more buys, against what the skill is) and both belong. */
    return `<div class="petal-track">
      <span class="pl">${label}</span><span class="pips">${pips}</span><span class="sp"></span>${chip}
      ${desc ? `<span class="pd">${desc}</span>` : ''}
      ${owned || !desc ? petalValue(skill, eff) : ''}
    </div>`;
  }


  function petalTracks(seed) {
    /* Year one shows no petal UI — doc 32's "the mystery is the tutorial".
       But a MIGRATED save is not in year one with nothing: migrateYear()
       converts retired Bloom Mastery tiers into Saved Seeds while
       turnsCompleted is still 0, and those seeds are the compensation for a
       yield regression the player is already paying. A currency you hold and
       cannot spend is not a mystery, it is a bug. */
    if (S.year.turnsCompleted < 1 && !(S.savedSeeds > 0)) return '';
    /* UNLOCKED, not discovered — the same rule the blessing picker uses and the
       same one turnYear() enforces. A blessing landing on a flower you own but
       have not grown yet must have somewhere to show itself. */
    if (!Game.seedUnlocked(seed.id)) return '';
    return petalTrack(seed, 'rich', DATA.petals.shared.rich.name)
      + petalTrack(seed, 'quick', DATA.petals.shared.quick.name);
  }

  function renderBonuses() {
    /* Every reading on this panel comes from the engine. The tap stack used to be
       rebuilt here and had already drifted away from tapFlower(), the growth line
       inverted the modifier by hand, the procs multiplied the per-level constant
       themselves and the drone's cadence was a second copy of the formula. Four
       ways for the Almanac to disagree with the game it is describing. */
    Game.refreshReveals();
    const tap = Game.tapStats();
    const growth = Game.growthStats();
    const harvestBonus = Game.boostVal('globalCredits');
    /* The COMPOSED level, not the badge's — a paid rental is visibly flying and
       this panel saying "Locked" while it does would be a lie the panel's own
       rule (every reading comes from the engine) exists to prevent. */
    const ah = Game.droneLevel();
    const found = Game.discoveredCount();
    const total = DATA.seeds.length;
    const fill = total ? found / total : 0;

    const line = (k, v, d) => `<div class="stat-line"><span class="kk"><span class="k">${k}</span>${d ? `<span class="d">${d}</span>` : ''}</span><span class="v">${v}</span></div>`;

    /* The bloom a harvester really plants stops at the highest seed UNLOCKED,
       which this row used to forget — so it named a flower the drone could not
       put in the ground. */
    const harvesters = PLOT_AUTOPLANTERS.map(({ key, name, idx }) => {
      const lvl = S.upgrades[key];
      if (!lvl) return null;
      const eff = Game.upgradeEffect(key);
      return line(`${name}`, `Lv ${lvl}`, `Plants up to ${eff.now}${S.grid[idx].locked ? ' (plot locked)' : ''}`);
    }).filter(Boolean).join('');

    const seedRows = DATA.seeds.map((s) => {
      /* The curtain, docs/47: masked keyed to the SAME latch the picker
         reads, never to discoveredOf — a seed you have unlocked but never
         grown keeps today's exact `.dim` row below, real name and art,
         dimmed. Only a seed the curtain has not lifted on yet goes ???, and
         the row count and the meter above never change either way. */
      if (!Game.seedRevealedNow(s.id)) {
        return `<div class="almanac-row masked">
          <div class="almanac-row-top">
            <span class="n"><span class="almanac-bloom">${Icons.get('mysteryBloom')}</span><span class="cv-qmark">???</span></span>
            <span class="r">—</span><span class="c">—</span>
          </div>
          <span class="cv-hint">${CURTAIN_HINT}</span>
        </div>`;
      }
      const n = Game.discoveredOf(s.id);
      const best = Game.bestRarityOf(s.id);
      const rdef = best ? DATA.rarity.find((r) => r.key === best) : null;
      const head = `<span class="n"><span class="almanac-bloom">${Flora.head(s, 22)}</span>${s.name}</span>`;
      /* Discovery is the row's own split, read from the lifetime harvest count
         rather than from the retired mastery ladder's goal. */
      if (!n || !rdef) {
        return `<div class="almanac-row dim">
          <div class="almanac-row-top">${head}<span class="r">—</span><span class="c">—</span></div>
          <span class="seed-desc">${s.desc}</span>
          ${petalTracks(s)}
        </div>`;
      }
      return `<div class="almanac-row">
        <div class="almanac-row-top">
          ${head}
          <span class="r r-${rdef.key}">${rdef.label}</span>
          <span class="c">×${fmt(n)}</span>
        </div>
        <span class="seed-desc">${s.desc}</span>
        ${petalTracks(s)}
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
          <i style="--fill:${pct(fill, 1)}"></i>
          <span>${found} / ${total} discovered</span>
        </div>
        ${milestoneRows}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sprout')} Seed Almanac</h3>
        ${(S.year.turnsCompleted >= 1 || S.savedSeeds > 0)
          ? `<p class="sheet-note pouch-note"><span class="chip">${Icons.get('pouch')}${fmt(S.savedSeeds)}</span> to spend on petals.</p>`
          : ''}
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
        ${line('Per tap', fmt(tap.perTap), `Base ${tap.base} · ${signed(tap.mult - 1)} from boosts · your combo multiplies it again`)}
        ${line('Hold-to-tap rate', `${(tap.holdInterval / 1000).toFixed(2)}s`, 'Hold the flower for automatic taps')}
        ${line('Crit chance', pct(tap.critChance, 1), 'Chance for a big bonus tap')}
        ${line('Crit multiplier', `${tap.critMult.toFixed(1)}x`, 'Payout spike when a crit lands')}
        ${line('Combo cap', `${tap.comboMax}`, `×${tap.comboMult.toFixed(2)} now · +1% per combo`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sparkle')} Tap Bonuses</h3>
        ${S.upgrades.rainDance
          ? line('Rain Dance', pct(Game.procChance('rainDance'), 1), 'Chance per tap to instantly water a growing plot')
          : line('Rain Dance', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.beeSwarm
          ? line('Bee Swarm', pct(Game.procChance('beeSwarm'), 1), 'Chance per tap to fill a jar in an open hive')
          : line('Bee Swarm', 'Locked', 'Buy it in Upgrades to unlock')}
        ${S.upgrades.ladybug
          ? line('Lucky Ladybug', pct(Game.procChance('ladybug'), 1), 'Chance per tap to boost a growing plot\u2019s rarity odds')
          : line('Lucky Ladybug', 'Locked', 'Buy it in Upgrades to unlock')}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('sprout')} Garden Mastery</h3>
        ${line('Growth speed', signed(growth.bonus), 'Sprinklers and boosts')}
        ${line('Rarity odds', signed(Game.boostVal('rarityWeight')), 'Chance of Rare, Epic and Legendary harvests')}
        ${line('Harvest yield', signed(harvestBonus), 'Extra credits on every harvest')}
        ${line('Wonder bonus', Game.wonderActive() ? `x${WONDER.payoutMult} active` : 'Idle', `Triggers randomly — ${S.stats.wonders || 0} so far`)}
      </div>
      <div class="stat-block">
        <h3>${Icons.get('drone')} Automation</h3>
        ${ah ? line('Harvest Drone', `Lv ${ah}`, `Collects a ready plot every ${Game.autoHarvestCadence(ah).toFixed(1)}s`) : line('Harvest Drone', 'Locked', 'Buy it to auto-collect')}
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
  /* One channel: a name, a switch and a level. The switch and the slider are two
     controls rather than one, because a muted channel that forgot where its
     slider was would come back at full height. The slider is a real
     `<input type=range>` — the first form control in the game — so it carries
     keyboard support and its own role rather than borrowing them. */
  const AUDIO_CHANNELS = [
    { key: 'sfx', icon: 'sound', name: 'Sound effects', note: 'Taps, coins, harvests' },
    { key: 'amb', icon: 'drop', name: 'Ambience', note: 'Rain, thunder, the sky' },
    { key: 'music', icon: 'music', name: 'Music', note: 'The garden\u2019s tune' }
  ];

  function audioRow(ch) {
    const on = S.prefs[ch.key];
    const pct = Math.round((S.prefs[ch.key + 'Vol'] ?? 1) * 100);
    return `<div class="set-row audio${on ? '' : ' muted'}">
      <span class="lbl">${Icons.get(ch.icon)}<span class="chn">${ch.name}<small>${ch.note}</small></span></span>
      <button class="toggle" data-toggle="${ch.key}" aria-pressed="${on}" aria-label="${ch.name}"><i></i></button>
      <input class="lvl" type="range" min="0" max="100" step="1" value="${pct}" style="--lvl:${pct}%"
        data-level="${ch.key}" aria-label="${ch.name} volume">
    </div>`;
  }

  function renderSettings() {
    return `
      ${AUDIO_CHANNELS.map(audioRow).join('')}
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
        <span class="set-bar"><i style="--p:${(n / 9) * 100}%"></i><b>${n}/9</b></span>
      </button>`;
    }).join('');
    return `
      <div class="album-head">
        <p class="album-lede">Collect nine cards to finish a set, and every set to finish the album.</p>
        <span class="album-bar"><i style="--p:${total ? (owned / total) * 100 : 0}%"></i><b>${owned} / ${total}</b></span>
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
      /* A cell, not a button: nothing has ever read `data-card` and a card in a
         set is a thing you look at rather than a thing you press. The Cards
         dock button sends far more traffic here than the HUD star ever did, so
         nine controls that do nothing is nine controls too many. */
      return `<div class="cardcell${have ? ' have' : ''}" data-card="${card.id}">
        ${starRow(r.stars, have ? r.stars : 0)}
        <span class="cardface" style="--set:${set.tint}">
          ${have ? cardArt(card, 46) : ''}
          <span class="cardname">${card.name}</span>
        </span>
        ${have && copies > 1 ? `<span class="cdupe">+${copies - 1}</span>` : ''}
      </div>`;
    }).join('');
    return `
      <div class="setbar" style="--set:${set.tint}">
        <span class="set-ring">${Icons.get(n === 9 ? 'check' : 'book')}</span>
        <span class="setbar-txt">
          <b>${n === 9 ? 'Complete' : `${n} of 9 collected`}</b>
          <span class="set-bar"><i style="--p:${(n / 9) * 100}%"></i><b>${n}/9</b></span>
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
    /* The curtain, docs/47: one plain line, never the popup itself — the
       moments dialog waits for the next quiet beat, which this sheet being
       open is not (it is a sheet). Say what, never which: naming the seed or
       card here would be the reveal, said in the wrong room. */
    if (r.newReveals) {
      lines.push(`<li class="away-reveal">${Icons.get('mysteryBloom')}<span><b>${r.newReveals}</b> new ${r.newReveals === 1 ? 'thing' : 'things'} to see in the garden.</span></li>`);
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
    /* WINTER, IN ONE LINE. The snowfall is named because it is the reason the
       number is bigger than the player expects, and Holly is credited when the
       bed was tucked — that is the whole of her job, said once. Reporting, and
       never a new faucet: nothing here pays anything. */
    if (r.winterRipe) {
      const pct = Math.round(DATA.winter.snowfall * 100);
      const blooms = `<b>${r.winterRipe}</b> ${r.winterRipe === 1 ? 'bloom' : 'blooms'}`;
      lines.push(`<li class="away-winter">${Icons.get('snow')}<span>${r.winterKept
        ? `Winter opened ${blooms} overnight${r.winterKept === r.winterRipe ? '' : `, <b>${r.winterKept}</b> of them`} under the quilt — the snowfall pays <b>+${pct}%</b> on ${r.winterKept === 1 ? 'it' : 'those'}. Holly kept watch.`
        : `Winter opened ${blooms} while you were gone.`}</span></li>`);
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

  /* The numbers behind the bottom of the screen, because this bug has now been
     diagnosed from photographs three times. `env()` is `0` on a desktop and an
     installed app has no console, so the only way to see what a real phone
     thinks its screen is, is to have the game say so out loud. Read it on the
     handset and compare: `window` shorter than `screen` with a bottom inset
     present means the browser is under-reporting a full-screen window; no bottom
     inset means the window genuinely stops above the home indicator and iOS is
     painting the strip below it. Those want opposite fixes. */
  function screenReport() {
    const de = document.documentElement;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:var(--sab,0px)';
    document.body.appendChild(probe);
    const sab = Math.round(probe.getBoundingClientRect().height);
    probe.style.height = 'var(--sat,0px)';
    const sat = Math.round(probe.getBoundingClientRect().height);
    probe.remove();
    const box = document.getElementById('game').getBoundingClientRect();
    const mode = (window.matchMedia && matchMedia('(display-mode: standalone)').matches)
      ? 'standalone' : 'browser';
    return [
      `screen ${screen.width}×${screen.height}`,
      `window ${window.innerWidth}×${window.innerHeight}`,
      `client ${de.clientHeight}`,
      `game ${Math.round(box.height)} (bottom ${Math.round(box.bottom)})`,
      `--app-h ${getComputedStyle(de).getPropertyValue('--app-h').trim() || 'unset'}`,
      `insets ${sat} / ${sab}`,
      `${mode}${navigator.standalone === true ? ' · ios app' : ''}`,
      `dpr ${window.devicePixelRatio}`
    ].join(' · ');
  }

  /* The Year at a glance, for the phase-1 review — the meter pill and the
     ceremony sheet arrive in phase 2, so this line is where the owner reads
     the mint until then. */
  function yearReport() {
    const p = Game.Dev.projectTurn();
    const lines = p.tally.lines.map((l) => `${l.label} ${l.count} +${Math.round(l.bonus * 100)}%`).join(' · ');
    return `year ${S.year.number}, turn ${p.turnsCompleted} · earned ${fmt(Math.floor(p.coinsEarned))} / ${fmt(p.minCoins)}
      · pool ${p.total.toFixed(1)} from ${fmt(Math.floor(p.lifetimeCoins))} lifetime, ${p.mintedBase.toFixed(1)} drawn
      · projects ${fmt(p.pouch)} seeds (increment ${p.base.toFixed(1)} / ${p.minSeeds} × tally ${p.tally.mult.toFixed(2)}${lines ? ` — ${lines}` : ''})
      · ${p.ready ? 'THE TURN IS READY' : 'not yet ready'}`;
  }

  /* The preview never resets and never marks seen, so the row says which state
     the real one is in — otherwise "it opened" tells you nothing about whether
     a player would see it. */
  function newsReport() {
    const all = DATA.announcements || [];
    const next = Game.pendingAnnouncement();
    const log = DATA.changelog || [];
    const unread = Game.changelogUnseen().length;
    return `${all.length} announcement${all.length === 1 ? '' : 's'} · ${
      next ? `"${next.title}" would show on the next load${next.reset ? ' and start a fresh garden' : ''}` : 'all seen'}
      · ${log.length} changelog entr${log.length === 1 ? 'y' : 'ies'}, ${unread} unread${
      Game.changelogDue() ? ', due on the next load' : ''}`;
  }

  function petalReport() {
    const d = Game.petalsOf('daisy');
    return `${fmt(S.savedSeeds)} Saved Seeds · Daisy R${d.rich}/Q${d.quick}
      · next ${fmt(Game.petalCost('daisy', 'rich'))} / ${fmt(Game.petalCost('daisy', 'quick'))}`;
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
    const summonStars = (what) => Array.from({ length: CREATURE_STARS }, (_, i) =>
      `<button class="dev-btn" data-dev="${what}" data-arg="${i + 1}">★${i + 1}</button>`).join('');

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
      ${devRow('Play the whole sky — front, arrive, linger, end', DATA.weather.types
        .filter((w) => w.id !== 'clear')
        .map((w) => `<button class="dev-btn" data-dev="wxSeq" data-arg="${w.id}">${w.name}</button>`)
        .join('') + '<button class="dev-btn" data-dev="wxSeq" data-arg="sunbreak">Sunbreak (daytime only)</button>')}
      ${devRow(`Frame rate — ${UI.perf.on() ? 'on' : 'off'}. Hold a sky and read it on the handset;
        a big <b>rest</b> with a small <b>js</b> is the sky costing paint and blend rather than script`, `
        <button class="dev-btn${UI.perf.on() ? ' on' : ''}" data-dev="perf" data-arg="toggle">${
          UI.perf.on() ? 'Hide the readout' : 'Show the readout'}</button>
        <button class="dev-btn" data-dev="perf" data-arg="reset">Start a fresh window</button>`)}
      ${UI.perf.on() ? `<pre class="dev-perf">${UI.perf.line()}</pre>` : ''}
      ${devRow(`Find the cost — switch a layer OFF and watch <b>rest</b> on the readout for ten
        seconds. Whichever one moves the number is the answer. These change how the game LOOKS
        on purpose; they are a measuring tool, not a setting`, COST_SWITCHES.map((c) =>
        `<button class="dev-btn${UI.el.game.classList.contains('cost-' + c.id) ? ' on' : ''}"
          data-dev="cost" data-arg="${c.id}">${c.label}</button>`).join('')
        + '<button class="dev-btn warn" data-dev="cost" data-arg="">All back on</button>')}
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
      ${devRow(`Creatures — ${Game.crittersHome().length} home · ${Game.habitatUsed()} out of ${
        Game.habitatSlots()} slot${Game.habitatSlots() === 1 ? '' : 's'} (slots open at levels ${
        HABITAT_SLOT_LEVELS.join('/')})`, summonStars('summon'))}
      ${devRow('Summon all six, at the same star', summonStars('summonAll'))}
      ${devRow(`Creature food clocks — ${Game.crittersAsleep().length} of ${
        Game.crittersTending().length} tending are asleep · ads ${Game.adCountToday('food')}/${
        Game.adCap('food')} today, ${Game.adImpressions()} all time${
        Game.adOffered('food') ? '' : ' · no offer right now'}`, `
        <button class="dev-btn" data-dev="drain" data-arg="1">Drain 1h</button>
        <button class="dev-btn" data-dev="drain" data-arg="4">Drain 4h</button>
        <button class="dev-btn" data-dev="drain" data-arg="24">Drain 24h</button>
        <button class="dev-btn warn" data-dev="sleep" data-arg="1">Send them to sleep</button>
        <button class="dev-btn" data-dev="feedAll" data-arg="1">Feed everyone</button>`)}
      ${devRow('Wind the world forward — no welcome sheet, no offline pay. Boosts and the Wonder keep their time', `
        <button class="dev-btn" data-dev="warp" data-arg="1">+1 hour</button>
        <button class="dev-btn" data-dev="warp" data-arg="8">+8 hours</button>
        <button class="dev-btn" data-dev="warp" data-arg="24">+24 hours</button>`)}
      ${devRow('Simulate an absence', `
        <button class="dev-btn" data-dev="away" data-arg="3">3 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="6">6 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="12">12 hours</button>
        <button class="dev-btn" data-dev="away" data-arg="24">24 hours</button>`)}
      ${devRow('Give', `
        <button class="dev-btn" data-dev="gold" data-arg="1">+1M gold</button>
        <button class="dev-btn" data-dev="gems" data-arg="1">+50 gems</button>
        <button class="dev-btn" data-dev="level" data-arg="1">+1 level</button>
        <button class="dev-btn" data-dev="level" data-arg="5">+5 levels</button>
        <button class="dev-btn" data-dev="boosts" data-arg="1">+1 of every power-up</button>`)}
      ${devRow(`The Garden Year — ${yearReport()}`, `
        <button class="dev-btn" data-dev="yearEarn" data-arg="25000">Earn +25K</button>
        <button class="dev-btn" data-dev="yearEarn" data-arg="100000">Earn +100K</button>
        <button class="dev-btn" data-dev="yearEarn" data-arg="400000">Earn +400K</button>
        <button class="dev-btn" data-dev="yearEarn" data-arg="3000000">Earn +3M — clears the whole drip</button>
        <button class="dev-btn" data-dev="yearStats" data-arg="1">A good year's Tally</button>
        <button class="dev-btn warn" data-dev="yearTurn" data-arg="1">Run the Turn (blesses a flower with room)</button>`)}
      ${devRow(`Jump ahead — each Turn earns its way there and wipes the garden, so you land bare with
        Saved Seeds banked. Spring and Winter open their GATE, not a garden: neither is built yet`, `
        <button class="dev-btn warn" data-dev="yearJump" data-arg="1">+1 Turn</button>
        <button class="dev-btn warn" data-dev="yearJump" data-arg="${DATA.year.winterTurn}">+${DATA.year.winterTurn} Turns (Winter's gate)</button>
        <button class="dev-btn warn" data-dev="yearJump" data-arg="${DATA.year.springTurn}">+${DATA.year.springTurn} Turns (Spring's gate)</button>`)}
      ${devRow(`Petals — ${petalReport()}`, `
        <button class="dev-btn" data-dev="yearSeeds" data-arg="50">+50 Saved Seeds</button>
        <button class="dev-btn" data-dev="petalBuy" data-arg="rich">Daisy: Rich Bloom</button>
        <button class="dev-btn" data-dev="petalBuy" data-arg="quick">Daisy: Quick Sprout</button>
        <button class="dev-btn" data-dev="unlockSeed" data-arg="1">Unlock the next seed (pays gold)</button>`)}
      ${devRow(`Fall — ${Game.fallOpen() ? 'open' : `opens at Turn ${DATA.year.fallTurn}`}`, `
        <button class="dev-btn" data-dev="fallFill" data-arg="1">Fill the bed</button>
        <button class="dev-btn" data-dev="fallRipen" data-arg="1">Ripen the bed</button>
        <button class="dev-btn" data-dev="fallHarvestAll" data-arg="1">Harvest the bed</button>`)}
      ${devRow(`Winter — ${Game.winterOpen() ? (Game.winterTucked() ? 'open, tucked in' : 'open') : `opens at Turn ${DATA.year.winterTurn}`}`, `
        <button class="dev-btn" data-dev="winterFill" data-arg="1">Plant the bed</button>
        <button class="dev-btn" data-dev="winterTuck" data-arg="1">Tuck it in</button>
        <button class="dev-btn" data-dev="winterNight" data-arg="1">Sleep a whole night</button>
        <button class="dev-btn" data-dev="winterHarvestAll" data-arg="1">Collect the morning</button>`)}
      ${devRow(`What's New — ${newsReport()}`, `
        <button class="dev-btn" data-dev="newsShow" data-arg="1">Preview announcement</button>
        <button class="dev-btn warn" data-dev="newsClear" data-arg="1">Clear announcement flags</button>
        <button class="dev-btn" data-dev="logShow" data-arg="1">Open the changelog</button>
        <button class="dev-btn warn" data-dev="logClear" data-arg="1">Clear changelog flags</button>
        <button class="dev-btn" data-dev="momentShow" data-arg="1">Preview a moment</button>`)}
      <button class="big-btn" data-dev="clear" data-arg="1">Clear everything armed</button>
      ${devRow('Screen', `<p class="sheet-note">${screenReport()}</p>`)}
      <p class="sheet-note">Day phase ${(Game.dayPhase() * 100).toFixed(0)}% · ${Game.isNight() ? 'night' : 'day'} ·
      sky now ${Game.currentWeather().name}</p>`;
  }

  /* A summon that lands but cannot come out has not failed, so it must not take
     the deny path — that is the habitat cap doing its job, and the way past it
     is levels, which is a different button. */
  function benched(n) {
    UI.toast({
      title: n === 1 ? 'Moved in, waiting in the roster' : `${n} moved in, waiting in the roster`,
      body: `${Game.habitatUsed()} of ${Game.habitatSlots()} slots are full. Tap +5 levels under Give, then Summon all six again to send them out — slots open at levels ${HABITAT_SLOT_LEVELS.join('/')}.`,
      art: Icons.get('sprout')
    });
  }

  function handleDev(what, arg) {
    const D = Game.Dev;
    let redraw = true;
    let ok = true;
    let deny = 'That cheat needs something in the garden first.';
    switch (what) {
      case 'weather': D.setWeather(arg); break;
      /* Presentation, so it never reaches `Game.Dev` — the same line screenReport()
         walks. `weatherSequence` plays the whole shape through the real code path;
         holding a sky can only ever park on the transform. */
      case 'wxSeq': UI.weatherSequence(arg); redraw = false; break;
      case 'perf':
        if (arg === 'reset') { UI.perf.reset(); redraw = false; } else UI.perf.toggle();
        break;
      /* Presentation, and deliberately destructive — see the note in the row. Resets the
         measuring window too, or the first ten seconds of the new number are averaged in
         with the ten before it and say nothing. */
      case 'cost':
        if (arg) UI.el.game.classList.toggle('cost-' + arg);
        else COST_SWITCHES.forEach((c) => UI.el.game.classList.remove('cost-' + c.id));
        UI.perf.reset(arg ? 'cost-' + arg : 'all-on');
        break;
      case 'mutate': ok = Boolean(D.mutate(arg)); redraw = false; break;
      case 'rarity': D.armRarity(arg); break;
      case 'gem': D.armGem(); break;
      case 'proc': D.toggleProc(arg); break;
      case 'wonder': Game.startWonder(); redraw = false; break;
      case 'fill': ok = D.fillGarden() > 0; break;
      case 'ripen': ok = D.ripenAll() > 0; break;
      case 'hive': { const free = Game.emptyCells(); D.grantGold(Game.nextHiveCost());
        ok = free.length ? Game.placeHive(free[0]) : false; break; }
      case 'gold': D.grantGold(1e6); break;
      case 'gems': S.gems += 50; Game.save(); Game.emit('currency'); break;
      case 'level': D.grantLevels(Number(arg) || 1); break;
      case 'warp':
        ok = Boolean(D.warp(Number(arg) || 1));
        deny = 'Nothing in the world is on a clock yet — plant something first.';
        break;
      case 'away': {
        const report = D.simulateAway(Number(arg) || 3);
        ok = Boolean(report);
        if (ok) { awayReport = report; closeSheet(); setTimeout(() => openSheet('welcome'), 260); }
        redraw = false;
        break;
      }
      case 'drain':
        ok = D.drainCritters(Number(arg) || 1) > 0;
        deny = 'Nobody lives here yet.';
        break;
      case 'sleep':
        ok = D.sleepCritters() > 0;
        deny = 'They are all asleep already.';
        break;
      case 'feedAll':
        ok = D.feedCritters() > 0;
        deny = 'Nobody is tending, or they are all fed to the cap.';
        break;
      case 'summon': {
        const got = D.summonCritter(Number(arg) || 1);
        ok = Boolean(got);
        deny = 'Every creature already lives here.';
        if (ok && !got.tending) benched(1);
        break;
      }
      case 'summonAll': {
        const outBefore = Game.habitatUsed();
        const got = D.summonAll(Number(arg) || 1);
        ok = got.length > 0 || Game.habitatUsed() > outBefore;
        deny = 'Every creature already lives here, and every slot is full.';
        const waiting = Game.crittersHome().length - Game.habitatUsed();
        if (ok && waiting) benched(waiting);
        break;
      }
      case 'boosts': D.grantBoosts(); break;
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
      case 'yearEarn': D.driveYear(Number(arg) || 0); break;
      case 'yearStats':
        D.setYearStats({ orders: 12, windfalls: 4, species: 6, legendaries: 2, bestCombo: 55 });
        break;
      case 'yearTurn': {
        /* Bless the cheapest flower whose Rich Bloom still has room, the way
           tools/year-sim.js does. Hardcoding Daisy meant the blessing silently
           stopped landing the moment her ladder capped — which the review
           script's own steps reach — and the toast simply omitted the word
           rather than saying the largest per-Turn grant in the game had found
           nowhere to go. */
        const blessId = (DATA.seeds.find((s) => Game.seedUnlocked(s.id)
          && Game.petalsOf(s.id).rich < DATA.petals.shared.rich.cap) || {}).id || null;
        const turn = D.runTurn(blessId);
        ok = Boolean(turn);
        deny = 'The Turn is not ready — earn the year first.';
        if (ok) {
          const lines = turn.tally.lines.map((l) => `${l.label}: ${l.count} → +${Math.round(l.bonus * 100)}%`);
          const blessNote = turn.blessed
            ? ` · blessed: ${(Game.seedById(turn.blessed) || {}).name || turn.blessed}`
            : ' · no blessing landed — every unlocked flower is at its Rich Bloom cap';
          UI.toast({
            title: `The year turned — ${fmt(turn.pouch)} Saved Seeds`,
            body: `drew ${turn.base.toFixed(1)} of a ${turn.total.toFixed(1)} pool · Tally ×${turn.tally.mult.toFixed(2)}${lines.length ? ' · ' + lines.join(' · ') : ''}${blessNote}`,
            art: Icons.get('sprout')
          });
          UI.buildGarden();
        }
        break;
      }
      case 'yearJump': {
        const want = Number(arg) || 1;
        const done = D.jumpTurns(want);
        ok = done > 0;
        deny = 'The Turn stalled — the pool could not reach another increment.';
        if (ok) {
          const at = S.year.turnsCompleted;
          const opened = [['Fall', DATA.year.fallTurn], ['Winter', DATA.year.winterTurn], ['Spring', DATA.year.springTurn]]
            .filter(([, gate]) => at >= gate).map(([name]) => name);
          UI.toast({
            title: `${done} of ${want} Turn${want === 1 ? '' : 's'} — now at Turn ${at}`,
            body: `${opened.length ? `${opened.join(', ')} unlocked. ` : ''}The garden is bare and your Saved Seeds are banked.`,
            art: Icons.get('sprout')
          });
          UI.buildGarden();
        }
        break;
      }
      case 'newsShow':
        /* Preview only: it neither marks the announcement seen nor performs its
           reset, because looking at a dialog must never cost the save. */
        ok = Boolean(UI.previewAnnouncement && UI.previewAnnouncement());
        deny = 'There is no announcement in DATA.announcements to show.';
        redraw = false;
        if (ok) closeSheet();
        break;
      case 'momentShow':
        /* Same precedent as newsShow: a look must never cost the save, so it
           neither latches nor celebrates anything — a real reveal earned the
           normal way plays exactly like every other player's, cheat or not. */
        ok = Boolean(UI.previewMoment && UI.previewMoment());
        deny = 'Nothing to preview.';
        redraw = false;
        if (ok) closeSheet();
        break;
      case 'newsClear':
        Game.clearNewsSeen();
        UI.toast({ title: 'Announcements forgotten', body: 'The next load shows the newest one again.', art: Icons.get('book') });
        break;
      case 'logClear':
        Game.clearChangelogSeen();
        UI.toast({ title: 'Changelog forgotten', body: 'The next load shows every entry again.', art: Icons.get('scroll') });
        break;
      case 'logShow':
        ok = Boolean(UI.openChangelog && UI.openChangelog());
        deny = 'There is nothing in DATA.changelog to show.';
        redraw = false;
        if (ok) closeSheet();
        break;
      case 'yearSeeds': D.grantSeeds(Number(arg) || 50); break;
      case 'petalBuy':
        ok = Game.buyPetal('daisy', arg);
        deny = 'Not enough Saved Seeds, or the skill is at its cap.';
        break;
      case 'winterFill':
        ok = D.fillWinter() > 0;
        deny = Game.winterOpen() ? 'The bed is already full.' : `Winter opens at Turn ${DATA.year.winterTurn}.`;
        break;
      case 'winterTuck':
        ok = Game.winterTuck();
        deny = Game.winterOpen() ? 'The bed is already tucked in.' : `Winter opens at Turn ${DATA.year.winterTurn}.`;
        if (ok && UI.winterOpen && UI.winterOpen()) UI.renderWinter();
        break;
      case 'winterNight':
        ok = D.nightWinter() > 0;
        deny = Game.winterTucked() ? 'Nothing is growing in Winter.' : 'Tuck the bed in first — a night nobody kept pays nothing.';
        if (ok && UI.winterOpen && UI.winterOpen()) UI.renderWinter();
        break;
      case 'winterHarvestAll': {
        const r = Game.winterHarvestAll();
        ok = Boolean(r);
        deny = 'Nothing in Winter is ready.';
        if (ok) {
          UI.toast({
            title: `Winter &middot; +${fmt(r.payout)}`,
            body: `${r.plots} collected${r.kept ? `, ${r.kept} kept overnight` : ''}`,
            art: Icons.get('snow')
          });
          if (UI.winterOpen && UI.winterOpen()) UI.renderWinter();
        }
        break;
      }
      case 'fallFill':
        ok = D.fillFall() > 0;
        deny = Game.fallOpen() ? 'The bed is already full.' : 'Fall opens at the first Turn.';
        break;
      case 'fallRipen':
        ok = D.ripenFall() > 0;
        deny = 'Nothing is growing in Fall.';
        break;
      case 'fallHarvestAll': {
        let paid = 0;
        let windfell = false;
        S.fall.grid.forEach((c, i) => {
          const r = Game.fallHarvest(i);
          if (r) { paid += r.payout; windfell = windfell || r.windfall; }
        });
        ok = paid > 0;
        deny = 'Nothing in Fall is ripe.';
        if (ok) {
          UI.toast({
            title: windfell ? 'Windfall!' : 'Fall harvest',
            body: `+${fmt(paid)} gold${windfell ? ` — the whole bed paid +${Math.round(DATA.fall.windfall * 100)}%` : ''}`,
            art: Icons.get('coin')
          });
        }
        break;
      }
      case 'unlockSeed': {
        const next = DATA.seeds.find((s) => !Game.seedUnlocked(s.id));
        ok = Boolean(next) && Game.unlockSeed(next.id);
        deny = next
          ? `${next.name} wants ${fmt(Game.seedUnlockPrice(next.id))} gold — the wall is the point.`
          : 'Every seed is already unlocked.';
        if (ok) UI.toast({ title: 'Seed unlocked', body: `${next.name} is plantable forever now`, art: Icons.get('sprout') });
        break;
      }
      case 'clear': D.clearAll(); break;
      default: ok = false;
    }
    /* A cheat that quietly did nothing is worse than no cheat — say so. Most failures are a
       precondition, like mutating with nothing in the ground. */
    if (!ok) {
      Sound.play('deny');
      FX.shake(4);
      UI.toast({ title: 'Nothing to apply', body: deny });
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

  /* A second listener on the same element, because a range is the one control in
     this game that reports through `input` rather than `click`. It is delegated
     the same way, so the panel stays a string of markup with no bindings in it.
     The save is written on `change` — the end of the drag — while the level
     follows the thumb, so hearing the slider never costs eight writes. */
  el.sheetBody.addEventListener('input', (e) => {
    const lvl = e.target.closest('[data-level]');
    if (!lvl) return;
    const k = lvl.dataset.level;
    S.prefs[k + 'Vol'] = Number(lvl.value) / 100;
    /* The track's fill is a gradient stop, so the paint follows the thumb by
       writing one custom property rather than by rebuilding the row. */
    lvl.style.setProperty('--lvl', `${lvl.value}%`);
    Sound.resume();
    Sound.setLevel(k, S.prefs[k + 'Vol']);
  });

  el.sheetBody.addEventListener('change', (e) => {
    const lvl = e.target.closest('[data-level]');
    if (!lvl) return;
    Game.save();
    /* One sound at the end of the drag, on the channel being set, so the player
       hears what they just chose. Music has no one-shot of its own and ambience
       is already playing itself, so only the effects slider speaks. */
    if (lvl.dataset.level === 'sfx') Sound.play('buy');
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
        if (UI.hollowOpen()) UI.renderHollow();
      } else {
        Sound.play('deny');
        UI.toast({
          title: 'Every slot is full',
          body: 'Rest someone else first, then this one can come out.',
          art: Icons.get('sprout')
        });
      }
      return;
    }

    /* Petting pays nothing and never has. A creature you tap for currency is a
       button; one that just reacts is a pet. */
    const pet = e.target.closest('[data-pet]');
    if (pet) {
      const def = Game.petCritter(pet.dataset.pet);
      if (def) {
        const c = FX.centerOf(pet);
        FX.sparks(c.x, c.y, 10, def.art.glow);
        Sound.play('tap');
        FX.haptic(8);
        /* The flower's speech bubble lives in the garden and is hidden while the
           Hollow is up, so the reply lands in the panel instead of nowhere. */
        const said = $('#cpSaid', el.sheetBody);
        if (said) {
          said.textContent = UI.critterLine(def, Game.critterAsleep(def.id) ? 'sleep' : 'pet');
          said.classList.remove('pop'); void said.offsetWidth; said.classList.add('pop');
        }
        const face = $('.cp-face', el.sheetBody);
        if (face) { face.classList.remove('bop'); void face.offsetWidth; face.classList.add('bop'); }
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
          title: got.woke ? `${got.def.name} is up again` : `${got.def.name} is well fed`,
          body: `Working like ★${Game.critterWorkLevel(got.def.id)}, with ${
            fmtSpan(Game.critterFedFor(got.def.id))} of food left.`,
          art: Icons.get(got.food.icon)
        });
        renderSheet(false);
        UI.renderCritters();
      }
      return;
    }
    /* Open one customer from the queue. Its own attribute, like every other
       purchase-adjacent control, because syncAfford()'s final else treats an
       unrecognised [data-buy] as a booster and throws. */
    const openOrder = e.target.closest('[data-order]');
    if (openOrder) {
      Sound.play('tap');
      UI.openSheet('order', Number(openOrder.dataset.order));
      return;
    }

    const give = e.target.closest('[data-deliver]');
    if (give) {
      const slot = Number(give.dataset.deliver);
      const order = Game.standOrderAt(slot);
      const res = Game.standDeliver(slot);
      if (!res) { Sound.play('deny'); return; }
      const who = customerById(order.customer);
      const good = goodById(order.good);
      /* The payoff beat: they light up, hearts, coins, and their thank-you in
         their own words. An order that just decrements a counter is a form. */
      const c = FX.centerOf(give);
      FX.stars(c.x, c.y, 8, '#ffe066');
      FX.sparks(c.x, c.y, 16, who ? who.art.accent : '#ffd6e8');
      FX.coins(c.x, c.y, 10);
      Sound.play('quest');
      FX.haptic(14);
      const rep = Game.standOrderRep(order);
      UI.toast({
        title: who ? UI.pickLine(who.lines.delivered, order.id) : 'Delivered',
        body: `${good ? good.name : 'Order'} &middot; +${fmt(res.paid)} coins${rep ? `, +${rep} rep` : ''}`,
        art: Icons.get(good ? good.icon : 'gift')
      });
      UI.openSheet('orders');
      return;
    }

    /* Free, always. The single most load-bearing rule in the order spec — it is
       what turns "I do not have that" from a wall into a choice. */
    const shoo = e.target.closest('[data-skiporder]');
    if (shoo) {
      if (Game.standSkip(Number(shoo.dataset.skiporder))) {
        Sound.play('tap');
        UI.openSheet('orders');
      }
      return;
    }

    const build = e.target.closest('[data-build]');
    if (build) {
      const cell = Number(build.dataset.cell);
      const what = build.dataset.build;
      const ok = what === 'hive' ? Game.placeHive(cell) : Game.placeTender(cell, what);
      if (!ok) { Sound.play('deny'); FX.shake(4); return; }
      Sound.play('buy');
      FX.haptic(12);
      UI.closeSheet();
      if (UI.meadowOpen()) UI.renderMeadow();
      return;
    }

    const keep = e.target.closest('[data-keep]');
    if (keep) {
      const id = keep.dataset.keep;
      const on = Game.isKeeper(id);
      if (Game.setKeeper(id, !on)) {
        Sound.play('tap');
        renderSheet(false);
        if (UI.meadowOpen()) UI.renderMeadow();
      } else {
        Sound.play('deny');
        UI.toast({
          title: 'The bank is full',
          body: 'Take someone off the hives first.',
          art: Icons.get('sprout')
        });
      }
      return;
    }

    const claim = e.target.closest('[data-claim]');
    if (claim && claim.dataset.claim) {
      if (Game.claimQuest(claim.dataset.claim)) Sound.resume();
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
    /* The rewarded-ad arm. Its own attribute rather than data-buy, because
       syncAfford()'s final else treats an unrecognised [data-buy] as a booster
       and throws — the same reason [data-tend] and [data-order] have their own.
       ONE arm, and every future ad placement that is a whole control rather
       than a tier inside one joins it here rather than adding a listener. The
       engine decides whether the ad may be spent; this only reports. */
    const adBtn = e.target.closest('[data-ad]');
    if (adBtn) {
      const took = adBtn.dataset.ad === DATA.droneRental.boost ? Game.rentDrone() : false;
      if (took) {
        const c = FX.centerOf(adBtn);
        FX.sparks(c.x, c.y, 12, '#b197fc');
        FX.ring(c.x, c.y, '#ffffff', 0.45, 70);
      } else { Sound.play('deny'); FX.shake(4); }
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
    /* The seed-unlock ladder: ask, then charge. pendingUnlock is cleared BEFORE
       unlockSeed() because that emits `panels`, which re-renders this sheet —
       leaving it set would redraw the question over the answer. */
    const unlockAskBtn = e.target.closest('[data-unlock]');
    if (unlockAskBtn) {
      pendingUnlock = unlockAskBtn.dataset.unlock;
      renderSheet(true);
      Sound.play('tap');
      return;
    }
    const unlockNo = e.target.closest('[data-unlockno]');
    if (unlockNo) {
      pendingUnlock = null;
      renderSheet(true);
      Sound.play('close');
      return;
    }
    const unlockGo = e.target.closest('[data-unlockgo]');
    if (unlockGo) {
      const id = unlockGo.dataset.unlockgo;
      const seed = Game.seedById(id);
      pendingUnlock = null;
      if (Game.unlockSeed(id)) {
        justUnlocked = id;
        Sound.play('buy');
        FX.haptic([12, 40, 12]);
        UI.toast({
          title: `${seed.name} unlocked`,
          body: 'Yours for good — unlocks survive every Turn.',
          art: Flora.head(seed, 34)
        });
        setTimeout(() => {
          if (justUnlocked !== id) return;
          justUnlocked = null;
          if (sheetMode === 'seeds') renderSheet(false);
        }, 2200);
      } else {
        Sound.play('deny');
      }
      renderSheet(true);
      return;
    }
    const crop = e.target.closest('[data-crop]');
    if (crop) {
      const idx = sheetArg ?? 0;
      if (Game.fallPlant(idx, crop.dataset.crop)) {
        Sound.play('buy');
        FX.haptic(8);
        closeSheet();
        UI.renderFall();
      } else {
        Sound.play('deny');
        FX.shake(3);
      }
      return;
    }

    const wplant = e.target.closest('[data-winter-plant]');
    if (wplant) {
      const idx = sheetArg ?? 0;
      if (Game.winterPlant(idx, wplant.dataset.winterPlant)) {
        Sound.play('buy');
        FX.haptic(8);
        closeSheet();
        UI.renderWinter();
      } else {
        Sound.play('deny');
        FX.shake(3);
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
      tog.closest('.set-row').classList.toggle('muted', !S.prefs[k]);
      if (k === 'sfx') Sound.setSfx(S.prefs[k]);
      else if (k === 'amb') Sound.setAmb(S.prefs[k]);
      else Sound.setMusic(S.prefs[k]);
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
    const petal = e.target.closest('[data-petal]');
    if (petal) {
      const { petal: id, skill } = petal.dataset;
      /* Measure BEFORE the purchase: buyPetal() emits `panels`, which rebuilds
         the sheet body, so by the time it returns this node is detached and its
         rect is 0x0 — the float would fire from the top-left corner. Same
         family as the confetti-from-the-corner trap already in the docs. */
      const at = FX.centerOf(petal);
      if (Game.buyPetal(id, skill)) {
        Sound.play('buy');
        FX.haptic(10);
        FX.float(at.x, at.y, '+1', 'good');
      } else {
        Sound.play('deny');
        FX.shake(3);
      }
      return;
    }

    const bless = e.target.closest('[data-bless]');
    if (bless) {
      turnPick = bless.dataset.bless;
      renderSheet(false);
      Sound.play('tap');
      return;
    }

    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      /* The Year panel hands off to the ceremony. Two panels rather than one
         because the ceremony locks the sheet while the Tally rolls, and a panel
         you cannot leave is not where petal spending belongs. */
      if (a === 'openTurn') { openSheet('turn'); return; }
      if (a === 'turnBless') { turnStep = 1; renderSheet(true); Sound.play('open'); return; }
      if (a === 'turnBack') { turnStep = 0; renderSheet(true); Sound.play('close'); return; }
      if (a === 'turnLater') { closeSheet(); Sound.play('close'); return; }
      if (a === 'turnGo') { commitTurn(); return; }
      if (a === 'turnSpring') { turnStep = 5; renderSheet(true); Sound.play('open'); return; }
      if (a === 'turnDone') {
        closeSheet();
        Sound.play('close');
        /* "Spring returns to Summer" — doc 32's fifth beat. The meter pill is in
           the HUD, which is up in every season, so the ceremony can be opened
           from Fall; ending it anywhere but home would leave the player looking
           at a bed the Turn did not touch while their garden was rebuilt behind
           them. */
        if (UI.seasonHere && UI.seasonHere() !== 'summer') UI.enterSeason('summer');
        return;
      }
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
        /* Through the flagged faucet, so cheated gold never reaches the
           year's earnings accumulator — the mint must stay clean. */
        Game.Dev.grantGold(1000000);
        Game.emit('panels');
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
          /* HOME FIRST, THEN RESET. A reset zeroes `turnsCompleted`, which
             re-locks every season — and `season` is a plain module local that
             the reset does not touch. Taken while standing in Fall or Winter it
             left the player in a room their save could no longer reach: the
             board renders, the gate never fires because nothing re-evaluates
             it, and the way out is a swipe they have no reason to make. */
          if (UI.seasonHere && UI.seasonHere() !== 'summer') UI.enterSeason('summer');
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

  /* The picker quotes what THIS plot would really give, and two of the things in
     that number arrive without anybody buying anything — a Wonder starting, and
     the sun going down. Neither re-renders the sheet, so an open picker held a
     stale payout for the whole length of the Wonder. Both pills are cached on
     the node so the slow tick only writes when the number has actually moved. */
  /* A reveal latching while the picker is open re-renders the list rather
     than patching a row in place — the markup changes too much (silhouette
     to real art, ??? to a name, a hint to real stats) for the usual per-field
     sync. renderSheet(false) preserves scroll, so the row that just lit up is
     the only thing that visibly moves. Checked every tick specifically so
     that no affordable row can stand on screen still reading ??? — the named
     browser item docs/47's gauntlet drives for. */
  function seedRevealsChanged() {
    Game.refreshReveals();
    return $$('.seed-row.masked[data-seed]', el.sheetBody).some((node) => Game.seedRevealedNow(node.dataset.seed));
  }
  function syncSeedRows() {
    if (seedRevealsChanged()) { renderSheet(false); return; }
    const plot = sheetArg ?? 0;
    $$('.seed-row', el.sheetBody).forEach((node) => {
      const s = Game.seedById(node.dataset.plant || node.dataset.unlock);
      if (!s) return;
      const grow = Math.round(Game.plantGrowth(s, plot));
      const pay = Game.plantPayout(s, plot);
      const g = $('.s-grow', node);
      if (g && g.dataset.v !== String(grow)) {
        g.dataset.v = String(grow);
        g.innerHTML = `${Icons.get('clock')}${fmtTime(grow)}`;
        g.classList.toggle('good', grow < Math.round(s.grow));
      }
      const p = $('.s-pay', node);
      const key = `${pay.min}|${pay.max}|${pay.mult}`;
      if (p && p.dataset.v !== key) {
        p.dataset.v = key;
        p.innerHTML = `${Icons.get('coin')}${fmt(pay.min)}–${fmt(pay.max)}${mx(pay.mult)}`;
      }
    });
  }

  /* Countdowns tick in place; a full re-render would fight the player's taps. */
  /* The shop's own version of the same rule — a masked upgrade card does not
     render at all (unlike a masked seed row), so "changed" means a
     now-revealed key with no card in the DOM yet, rather than a `.masked`
     node to spot. */
  function upgradeRevealsChanged() {
    Game.refreshReveals();
    const shown = new Set($$('.card[data-buy="upgrade"]', el.sheetBody).map((n) => n.dataset.key));
    return CORE_UPGRADES.some((k) => Game.upgradeRevealedNow(k) && !shown.has(k));
  }
  function tickSheetTimers() {
    if (!sheetMode) return;
    if (sheetMode === 'seeds') syncSeedRows();
    if (sheetMode === 'upgrades' && upgradeRevealsChanged()) { renderSheet(false); return; }
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
        /* A drone or a harvester can empty the board while the shop sits open,
           and what the sky is worth is the count of plants standing in it. */
        const eff = Game.weatherCallEffect(key);
        node.classList.toggle('idle', !eff.plots);
        const sub = $('.card-sub', node);
        if (sub) sub.innerHTML = skyLine(eff);
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
      const eff = Game.foodEffect(node.dataset.who, node.dataset.feed);
      if (!f || !eff) return;
      /* The third gold assumption, and the one that looks like a race rather
         than a missed branch: this re-derives `can` on every coin, so a gems or
         ad tier fixed only in foodButtons() would render correctly and go wrong
         a second later. It cannot make an ABSENT ad button appear, and does not
         need to — `adOffered()` only changes on a day roll or a purchase, and
         both already emit('panels'), which rebuilds. */
      const room = eff.gain > 0 && !eff.partial;
      const pot = f.currency === 'gems' ? S.gems : S.credits;
      const can = room && (f.currency === 'ad' || pot >= f.cost);
      node.disabled = !room;
      node.classList.toggle('affordable', can);
      /* A hungrier creature has room for more of the tin, so both of these move
         while the panel just sits there — not only when something is bought. */
      const stamp = $('.food-ico b', node);
      if (stamp) stamp.textContent = foodStamp(eff);
      const after = $('.food-after', node);
      if (after) {
        after.textContent = foodAfter(eff);
        after.classList.toggle('capped', eff.capped || eff.partial);
      }
      const price = $('.price', node);
      /* The ad pill carries its own drained class and no currency colour, so the
         two toggles must not fight over the same element. */
      if (price && price.classList.contains('ad')) price.classList.toggle('off', !room);
      else if (price) { price.classList.toggle('ok', can); price.classList.toggle('no', !can); }
    });
    $$('[data-petal]', el.sheetBody).forEach((node) => {
      const cost = Game.petalCost(node.dataset.petal, node.dataset.skill);
      const can = S.savedSeeds >= cost;
      node.disabled = !can;
      node.classList.toggle('ok', can);
      node.classList.toggle('no', !can);
    });
    $$('[data-crop]', el.sheetBody).forEach((node) => {
      const p = DATA.fall.plants.find((x) => x.id === node.dataset.crop);
      const can = Boolean(p) && S.credits >= p.cost;
      node.disabled = !can;
    });
    $$('[data-winter-plant]', el.sheetBody).forEach((node) => {
      const p = DATA.winter.plants.find((x) => x.id === node.dataset.winterPlant);
      const can = Boolean(p) && S.credits >= p.cost;
      node.disabled = !can;
    });
    $$('[data-unlockgo]', el.sheetBody).forEach((node) => {
      const price = Game.seedUnlockPrice(node.dataset.unlockgo);
      const can = S.credits >= price;
      node.disabled = !can;
      const short = $('.unlock-short', el.sheetBody);
      if (short) short.textContent = can ? '' : `${fmt(price - S.credits)} short.`;
    });
    $$('[data-unlock]', el.sheetBody).forEach((node) => {
      const price = Game.seedUnlockPrice(node.dataset.unlock);
      const can = S.credits >= price;
      const chip = $('.seed-lock', node);
      if (chip) { chip.classList.toggle('ok', can); chip.classList.toggle('no', !can); }
    });
    $$('[data-plant]', el.sheetBody).forEach((node) => {
      const s = Game.seedById(node.dataset.plant);
      if (!s || !Game.seedUnlocked(s.id)) {
        node.disabled = true;
        return;
      }
      const can = S.credits >= s.cost;
      node.disabled = !can;
    });
  }

  UI.openSheet = openSheet;
  UI.closeSheet = closeSheet;
  UI.renderSheet = renderSheet;
  UI.syncYearPanel = syncYearPanel;
  UI.sheetMode = () => sheetMode;
  UI.setAwayReport = (report) => { awayReport = report; };
  UI.syncAfford = syncAfford;
  UI.tickSheetTimers = tickSheetTimers;
  UI.fmtSpan = fmtSpan;
  UI.adTag = adTag;
  UI.AD_LABEL = AD_LABEL;
  UI.CORE_UPGRADES = CORE_UPGRADES;
})();
