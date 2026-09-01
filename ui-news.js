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
  const { $ } = UI;

  const node = $('#news');
  let open = null;      // the announcement on screen, or null
  let preview = false;

  function bullets(list) {
    return (list || []).map((b) => `<li>${b}</li>`).join('');
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
    node.classList.remove('show');
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = '';
  }

  function dismiss() {
    const a = open;
    if (!a) return;
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
