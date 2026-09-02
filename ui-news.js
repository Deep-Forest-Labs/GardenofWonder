/* Garden Wonder — the What's New dialog.

   One announcement, once, on the way in: a piece of art, a few plain lines
   about what changed, and a single button. It is the only modal in the game
   that a player cannot swipe away, because its button does something — on an
   announcement marked `reset` it hands them a fresh garden, which is how a
   playtest group starts a new build together.

   Two rules hold this together and both are easy to break:

   The seen-flag is NOT in the save. `Game.markNewsSeen()` writes its own
   storage key, so the reset this dialog performs cannot erase the record that
   it ran — a flag inside the save would loop the popup forever.

   The preview never resets and never marks. Developer tools open this dialog
   to look at it, and a look must not cost the save.

   Reaches the rest of the UI through the `UI` global — see
   docs/02-architecture.md. */

(() => {
  const { $, fmt, fmtTime } = UI;

  const node = $('#news');
  let open = null;      // the announcement on screen, or null
  let preview = false;

  function bullets(list) {
    return (list || []).map((b) => (b && typeof b === 'object')
      ? `<li class="news-list-icon"><span class="mini-badge">${Icons.get(b.icon || 'badge')}</span>${b.text}</li>`
      : `<li>${b}</li>`
    ).join('');
  }

  function build(a) {
    /* The art is owner-supplied and portrait, so it is framed rather than laid
       out — a 1152x1728 picture given its own aspect would be the whole screen
       and this dialog is never fullscreen. */
    const art = a.img
      ? `<div class="news-art"><img src="${a.img}" alt="" width="1152" height="1728"></div>`
      : '';
    /* The fresh start is said by the dialog rather than stored in the row, so
       the sentence and the flag that makes it true can never drift apart. And
       the button never says "reset": the new garden is the gift, not the
       threat. */
    const note = a.reset && !preview
      ? '<p class="news-note">This one starts everyone on fresh soil.</p>'
      : '';
    return `
      <div class="news-card" role="dialog" aria-modal="true" aria-labelledby="newsTitle">
        ${art}
        <h2 id="newsTitle">${a.title}</h2>
        <ul class="news-list">${bullets(a.bullets)}</ul>
        ${note}
        <button class="big-btn yes" id="newsOk" type="button">Got it!</button>
      </div>`;
  }

  function show(a, asPreview) {
    if (!a || open) return false;
    open = a;
    preview = Boolean(asPreview);
    node.innerHTML = build(a);
    node.hidden = false;
    node.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => node.classList.add('show'));
    const ok = $('#newsOk', node);
    if (ok) ok.addEventListener('click', dismiss);
    Sound.play('open');
    return true;
  }

  function close() {
    open = null;
    preview = false;
    logEntry = false;
    momentEntry = false;
    node.classList.remove('show');
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = '';
  }

  function dismiss() {
    const a = open;
    if (!a) return;
    if (momentEntry) {
      const key = momentEntry.key;
      const wasPreview = preview;
      momentEntry = false;
      close();
      /* The developer's look, same precedent as the announcement's preview:
         it marks nothing, because looking at a dialog must never cost the
         save — a real reveal earned or cheated the normal way still gets a
         real, once-only celebration. */
      if (wasPreview) { Sound.play('close'); return; }
      /* Consumed only now — after the dialog has actually drawn and the
         player has actually dismissed it, never at enqueue and never on a
         discipline guard refusing to show it. */
      Game.consumeMoment(key);
      Sound.play('buy');
      if (UI.updateDockDots) UI.updateDockDots();
      /* One at a time: the next queued moment, if the gap and the cap still
         allow it, rather than waiting for an unrelated trigger to notice. */
      setTimeout(tryMoment, 300);
      return;
    }
    if (logEntry) {
      Game.markChangelogSeen();
      logEntry = false;
      close();
      Sound.play('buy');
      if (UI.updateMenuDot) UI.updateMenuDot();
      if (UI.afterNews) UI.afterNews();
      return;
    }
    if (preview) {
      close();
      Sound.play('close');
      return;
    }
    Game.markNewsSeen(a.id);
    Sound.play('buy');
    if (a.reset) {
      /* The full reset path, then straight back in. reset() has already made
         `state` a fresh garden, so the pagehide save that fires on the way out
         writes a fresh garden too — the trap that bites here is injecting a
         save and reloading with stale state in memory, which is the opposite
         of this order. */
      Game.reset();
      location.reload();
      return;
    }
    close();
    if (UI.afterNews) UI.afterNews();
  }

  /* ---- the changelog ----
     The What's New popup's little sibling: no art, no reset, and a list of dates
     rather than one event. It rides the same node, the same show/close, the same
     material and the same single `open` variable — which is also what guarantees
     the two can never be on screen together.

     `logEntry` is a private flag on the dialog rather than a second module-level
     `open`, so `dismiss()` can tell which of the two it is closing. */
  let logEntry = false;

  function logBody(entries) {
    /* The newest art announcement, as the first thing in the list and a way into
       it. It is the one changelog row with a picture behind it, so it gets to
       look like one — and it is a real button, because it goes somewhere. */
    const all = DATA.announcements || [];
    const latest = all[all.length - 1];
    const head = latest
      ? `<button class="log-ann" type="button" id="logAnn">
          ${latest.img ? `<span class="log-ann-art"><img src="${latest.img}" alt="" width="1152" height="1728"></span>` : ''}
          <span class="log-ann-txt"><b>${latest.title}</b><small>The full announcement</small></span>
          ${Icons.get('chevron')}
        </button>`
      : '';
    const blocks = entries.map((e) => `
      <div class="log-day">
        <h3>${UI.logDate(e.date)}</h3>
        <ul class="news-list">${bullets(e.lines)}</ul>
      </div>`).join('');
    return head + blocks;
  }

  function buildLog(entries) {
    return `
      <div class="news-card log-card" role="dialog" aria-modal="true" aria-labelledby="newsTitle">
        <h2 id="newsTitle">What's New</h2>
        ${logBody(entries)}
        <button class="big-btn yes" id="newsOk" type="button">Got it!</button>
      </div>`;
  }

  function showLog(entries) {
    if (!entries.length || open) return false;
    open = { id: 'changelog' };
    logEntry = true;
    preview = false;
    node.innerHTML = buildLog(entries);
    node.hidden = false;
    node.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => node.classList.add('show'));
    const ok = $('#newsOk', node);
    if (ok) ok.addEventListener('click', dismiss);
    const ann = $('#logAnn', node);
    /* Straight from one dialog into the other, because the node and the `open`
       flag are shared and two cannot stand at once. The announcement opens in
       preview, so its `reset` can never fire from in here — that path belongs to
       the once-per-build dialog on boot and to nothing else. */
    if (ann) {
      ann.addEventListener('click', () => {
        Game.markChangelogSeen();
        close();
        if (UI.openAnnouncement) UI.openAnnouncement();
      });
    }
    Sound.play('open');
    return true;
  }

  /* ---- the moments dialog, docs/47 ----
     The curtain's celebration: a THIRD mode on this same node, sharing the
     one `open` flag with the announcement and the changelog, which is what
     keeps "never two popups" true for free. The registry is never
     hand-written — an entry is built at read time from DATA.seeds or
     DATA.upgrades, the Numbers rule applied (full advert-form stats, exactly
     like the picker's own locked row). `momentEntry` is a private flag the
     same shape as `logEntry`, so `dismiss()` can tell the three modes apart. */
  let momentEntry = false;
  let hasInteracted = false;
  window.addEventListener('pointerdown', () => { hasInteracted = true; }, { once: true, capture: true });

  function seedMoment(s) {
    const price = Game.seedUnlockPrice(s.id);
    const pay = Game.plantPayout(s, 0);
    const bullets = [
      `<b>${fmt(s.cost)} gold</b> to plant · <b>${fmtTime(Math.round(s.grow))}</b> to grow`,
      `Pays <b>${fmt(pay.min)}–${fmt(pay.max)}</b> a harvest`
    ];
    const v = s.verb && DATA.verbs[s.verb];
    if (v) bullets.push(`<b>${v.name}</b> — ${v.desc}`);
    return {
      key: `seed:${s.id}`,
      title: `${s.name} revealed.`,
      bullets,
      tagline: price > 0 ? `Yours whenever you’ve saved ${fmt(price)} gold.` : 'Yours from the very first day.',
      img: s.revealArt ? `art/reveals/${s.revealArt}` : 'art/reveals/placeholder.jpg',
      fallback: () => `<div class="news-fallback"><span class="seed-art" style="--art:${s.art.c1}">${Flora.head(s, 56)}</span></div>`
    };
  }
  function upgradeMoment(key) {
    const def = DATA.upgrades[key];
    return {
      key: `upgrade:${key}`,
      title: `${def.short || def.name} revealed.`,
      bullets: [{ icon: def.icon, text: def.desc }],
      tagline: 'Upgrade available.',
      img: def.revealArt ? `art/reveals/${def.revealArt}` : 'art/reveals/placeholder.jpg',
      fallback: () => `<div class="news-fallback"><span class="card-badge">${Icons.get(def.icon || 'badge')}</span></div>`
    };
  }
  /* The art chain, docs/47: custom art, the shared placeholder, or the
     programmatic fallback — the dialog never blocks on art existing. Both
     failure edges are real `error` events, not a filesystem check (there is
     no filesystem from the browser), so a missing file degrades exactly the
     way a 404 degrades: instantly, with nothing broken on screen. */
  function momentArtHtml(entry) {
    return `<div class="news-art" id="momentArt"><img src="${entry.img}" alt=""></div>`;
  }
  function wireMomentArtFallback(entry) {
    const img = $('#momentArt img', node);
    if (!img) return;
    let triedPlaceholder = entry.img === 'art/reveals/placeholder.jpg';
    img.addEventListener('error', function onError() {
      const artNode = $('#momentArt', node);
      if (!artNode) return;
      if (!triedPlaceholder) { triedPlaceholder = true; img.src = 'art/reveals/placeholder.jpg'; return; }
      img.removeEventListener('error', onError);
      artNode.outerHTML = entry.fallback();
    });
  }

  function buildMoment(entry) {
    return `
      <div class="news-card" role="dialog" aria-modal="true" aria-labelledby="newsTitle">
        ${momentArtHtml(entry)}
        <h2 id="newsTitle">${entry.title}</h2>
        <ul class="news-list">${bullets(entry.bullets)}</ul>
        <p class="news-note">${entry.tagline}</p>
        <button class="big-btn yes" id="newsOk" type="button">Got it!</button>
      </div>`;
  }

  function showMoment(m, asPreview) {
    if (!m || open) return false;
    const entry = m.kind === 'seed' ? seedMoment(Game.seedById(m.id)) : upgradeMoment(m.id);
    if (!entry) return false;
    open = { id: entry.key };
    momentEntry = entry;
    preview = Boolean(asPreview);
    node.innerHTML = buildMoment(entry);
    node.hidden = false;
    node.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => node.classList.add('show'));
    const ok = $('#newsOk', node);
    if (ok) ok.addEventListener('click', dismiss);
    wireMomentArtFallback(entry);
    Sound.play('open');
    return true;
  }

  /* The structural guard, stated as a predicate rather than a list of
     examples so a future sheet or dialog cannot slip past it by not being
     named: nothing may show while THIS node already has something up, while
     ANY sheet is open (the picker included — it is a sheet, not a dialog),
     while the coach is visible, or before the session's first interaction. */
  function momentsQuiet() {
    /* tools/capture-screens.js sets this — checked inside the guard itself,
       never by overriding UI.tryMoment from outside, because dismiss()'s own
       queue-drain calls the private `tryMoment` binding directly and would
       not see an external override of the exported copy. A global flag is
       seen by every path regardless of which one calls in. */
    if (window.__noMoments) return false;
    if (open) return false;
    if (UI.sheetMode && UI.sheetMode()) return false;
    /* `el` is ui.js's own module-local cache, not part of the shared UI
       surface — reached here the same way sayText()'s coach check does,
       through a fresh query rather than a cross-file reference that does
       not exist. */
    const coach = $('#coach');
    if (coach && !coach.hidden && coach.offsetParent !== null) return false;
    if (!hasInteracted) return false;
    return true;
  }
  /* The one entry point every trigger calls — a sheet closing, the coach
     clearing, the news chain settling, and a once-a-second poll that is the
     backstop for every quiet beat none of those name. Idempotent and cheap:
     calling it when nothing is owed is a few comparisons that return false. */
  function tryMoment() {
    /* Latching happens here too, not only on a render path — the picker and
       the shop keep reveals fresh while they are open, but a threshold can
       cross while the player is simply standing in the garden with no sheet
       up at all, and this is the once-a-second beat that would otherwise be
       the only thing left to notice it. Cheap and idempotent either way. */
    if (Game.refreshReveals) Game.refreshReveals();
    if (!momentsQuiet()) return false;
    if (!Game.momentReady || !Game.momentReady()) return false;
    return showMoment(Game.nextMoment());
  }
  UI.tryMoment = tryMoment;
  /* The developer's look, same shape as UI.previewAnnouncement below: shows
     whatever is actually next in the real queue if anything is pending
     (so cheated or earned progress previews honestly), otherwise a fixed,
     always-available example so the dialog can be inspected on a save with
     nothing queued at all. Bypasses the discipline guard on purpose — that
     predicate governs when a real celebration is allowed to interrupt play,
     not whether a developer may look at the screen. */
  UI.previewMoment = () => {
    const m = (Game.nextMoment && Game.nextMoment()) || { kind: 'seed', id: 'bluebell' };
    return showMoment(m, true);
  };

  /* Called once from boot(). Returns true when a dialog went up, so the things
     that also want the screen on the first second — the away report, the
     flower's greeting — can wait their turn. */
  function maybeAnnounce() {
    if (show(Game.pendingAnnouncement(), false)) return true;
    /* Second in line, never beside it. `changelogDue()` already refuses while an
       announcement is pending, so this is belt and braces rather than the rule
       itself. */
    return Game.changelogDue() ? showLog(Game.changelogUnseen()) : false;
  }

  UI.maybeAnnounce = maybeAnnounce;
  /* The menu's What's New row. It opens the CHANGELOG now, with the art
     announcement as its top row — one door to "what changed", rather than a row
     that only ever showed the last big announcement and went quiet between
     builds. Unread entries if there are any, otherwise the most recent one, so
     the row always has something to say. */
  UI.openChangelog = () => {
    const unseen = Game.changelogUnseen();
    const all = DATA.changelog || [];
    const entries = unseen.length ? unseen : all.slice(0, 1);
    if (!entries.length) return Boolean(UI.openAnnouncement && UI.openAnnouncement());
    if (!showLog(entries)) return false;
    Game.markChangelogSeen();
    if (UI.updateMenuDot) UI.updateMenuDot();
    return true;
  };
  /* The menu's What's New row. A RE-READ: it shows the newest announcement in
     preview mode, so the button is only a way out and `reset` can never fire
     from here — the fresh-garden path belongs to the dialog that goes up on
     boot, once, and to nothing else. It does mark the row seen, because reading
     it is what the badge dot is asking for, and the dot has to be able to go
     out. `UI.previewAnnouncement` below is the developer's look and deliberately
     marks nothing. */
  UI.openAnnouncement = () => {
    const all = DATA.announcements || [];
    const a = all[all.length - 1];
    if (!a || !show(a, true)) return false;
    if (Game.markNewsSeen(a.id) && UI.updateMenuDot) UI.updateMenuDot();
    return true;
  };
  UI.previewAnnouncement = () => {
    const all = DATA.announcements || [];
    return show(all[all.length - 1], true);
  };
  UI.newsOpen = () => Boolean(open);
})();
