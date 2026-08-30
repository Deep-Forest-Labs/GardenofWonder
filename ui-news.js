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
    node.classList.remove('show');
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = '';
  }

  function dismiss() {
    const a = open;
    if (!a) return;
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

  /* Called once from boot(). Returns true when a dialog went up, so the things
     that also want the screen on the first second — the away report, the
     flower's greeting — can wait their turn. */
  function maybeAnnounce() {
    return show(Game.pendingAnnouncement(), false);
  }

  UI.maybeAnnounce = maybeAnnounce;
  UI.previewAnnouncement = () => {
    const all = DATA.announcements || [];
    return show(all[all.length - 1], true);
  };
  UI.newsOpen = () => Boolean(open);
})();
