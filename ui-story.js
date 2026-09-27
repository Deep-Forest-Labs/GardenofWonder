/* Garden Wonder — the story's surface.

   The chapter scene (two faces trading lines over the blurred garden, a title
   card between scenes, Mara's thought and a Continue to close), Poppy's bubble
   runs in the garden with Mara's reply chips, the welcome-back line and the
   Almanac's replay door. Layout and feel are tools/scene-spike.html's, and the
   motion values are DATA.story.motion — the ones the owner tunes there.

   THE ENGINE DECIDES WHAT PLAYS; THIS FILE DECIDES ONLY WHEN. Every chapter,
   run, sliver and line comes from a Game.story*() getter, and nothing here
   picks one. The "when" is the moments dialog's own guard (UI.momentsQuiet —
   no sheet, no news, no coach mark, not before the first touch), plus the
   rooms a scene would break: the Hollow, the meadow, a season gate, the menu.
   The Turn's ceremony is a sheet, so the act break waits for it to shut.

   Three rules this file is built around, all from HANDOFF's traps:

   Nothing waits on an animation. Every row is written in its FINAL state and
   the Web Animations play toward it; a tap calls finish() on whatever is
   running and lands the next line in the same instant. A frozen animation
   clock therefore shows a finished scene, never a missing one.

   Reduced motion is a static substitute written here, not in a media block:
   the stylesheet's clamp cannot reach element.animate(), so under the
   preference nothing is animated at all and every state is simply drawn.

   The story's words never enter a template literal. Rows, chips, titles and
   labels are built with createElement and filled with textContent from
   DATA.story; only the house art (Customers.draw, Flora.talkingFlower,
   Icons.get) is markup. tools/html-check.js holds the Game.story* accessors.

   Reaches the rest of the UI through the `UI` global — see
   docs/02-architecture.md. */

(() => {
  const { $ } = UI;

  const node = $('#story');
  const chipsNode = $('#storyChips');
  const gameNode = $('#game');

  const STORY = () => DATA.story;
  const MOTION = () => DATA.story.motion;
  const LABEL = (k) => DATA.story.labels[k] || '';
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nowS = () => Date.now() / 1000;

  /* ---------------- portraits ---------------- */

  /* customers.js draws every face at once and CSS picks one; doc 57's twelve
     expressions map onto its three through DATA.story.faces (happy, laugh,
     proud and sly smile; sad, worried, cross, tired and sleepy wait; the rest
     are neutral), and anything unlisted is neutral. */
  function faceClass(mood) {
    const f = STORY().faces[mood];
    return f === 'happy' ? 'is-happy' : f === 'waiting' ? 'is-waiting' : '';
  }
  function castName(who) {
    const c = STORY().cast[who];
    if (c) return c.name;
    const cu = customerById(who);
    return cu ? cu.name : '';
  }
  /* Poppy's portrait is the talking flower's own face, cropped to the head —
     her voice in a scene is the same face the player taps all day. A villager
     (and Mara) is a customers.js bust cropped to a disc. */
  function portraitSvg(who) {
    if (who === 'poppy') return Flora.talkingFlower().replace('viewBox="0 0 120 130"', 'viewBox="14 8 92 92"');
    const def = who === 'mara' ? STORY().cast.mara : customerById(who);
    return def ? Customers.draw(def).replace('viewBox="0 -18 100 154"', 'viewBox="4 -12 92 100"') : '';
  }
  function face(who, mood) {
    const f = document.createElement('div');
    f.className = `st-face${who === 'poppy' ? ' poppy' : ''} ${faceClass(mood)}`.trim();
    const disc = document.createElement('div');
    disc.className = 'st-disc';
    disc.innerHTML = portraitSvg(who);
    const tag = document.createElement('span');
    tag.className = 'st-tag';
    tag.textContent = castName(who);
    f.append(disc, tag);
    return f;
  }
  const SIL = '<svg viewBox="0 0 120 260" aria-hidden="true"><g fill="currentColor"><circle cx="60" cy="38" r="26"/><path d="M28 250 L34 120 C36 84 46 70 60 70 C74 70 84 84 86 120 L92 250 Z"/></g></svg>';

  /* ---------------- the scene ---------------- */

  let cur = null;       // { ch, replay, scene, lines, idx, done, card }
  let refs = null;
  let running = [];
  let ffTimer = null;
  let lastSceneEnd = 0;

  function finishAll() {
    running.forEach((a) => { try { a.finish(); } catch (e) { /* already gone */ } });
    running = [];
  }
  function animate(el, frames, ms) {
    if (calm() || !(ms > 0) || !el || !el.animate) return;
    const a = el.animate(frames, { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)' });
    running.push(a);
    a.onfinish = () => { running = running.filter((x) => x !== a); };
  }

  function buildRow(l) {
    const row = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'st-bubble';
    bubble.textContent = l.text;
    if (l.who === 'note') {
      row.className = 'st-row note';
      row.appendChild(bubble);
      return row;
    }
    row.className = `st-row ${l.who === 'mara' ? 'mara' : 'them'}${l.mode === 'think' ? ' think' : ''}`;
    row.append(face(l.who, l.mood), bubble);
    return row;
  }

  function skeleton() {
    node.textContent = '';
    const top = document.createElement('div');
    top.className = 'story-top';
    const ff = document.createElement('button');
    ff.type = 'button';
    ff.className = 'story-ff';
    ff.setAttribute('aria-pressed', 'false');
    ff.setAttribute('aria-label', LABEL('ff'));
    ff.innerHTML = Icons.get('fastForward');
    top.appendChild(ff);
    const wrap = document.createElement('div');
    wrap.className = 'story-stack-wrap';
    const stack = document.createElement('div');
    stack.className = 'story-stack';
    stack.setAttribute('role', 'log');
    stack.setAttribute('aria-live', 'polite');
    wrap.appendChild(stack);
    const foot = document.createElement('div');
    foot.className = 'story-foot';
    const hint = document.createElement('span');
    hint.className = 'story-hint';
    hint.textContent = LABEL('next');
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'big-btn yes story-go';
    go.textContent = LABEL('go');
    go.hidden = true;
    foot.append(hint, go);
    const card = document.createElement('div');
    card.className = 'story-card';
    card.hidden = true;
    const sil = document.createElement('div');
    sil.className = 'story-sil';
    sil.innerHTML = SIL;
    const title = document.createElement('h2');
    title.className = 'story-card-title';
    const small = document.createElement('span');
    small.className = 'story-card-hint';
    card.append(sil, title, small);
    node.append(top, wrap, foot, card);
    refs = { ff, stack, hint, go, card, title, small };
  }

  function sceneOpen() { return Boolean(cur); }

  function openScene(p, replay) {
    const ch = Game.storyChapterFor(p.chapter, replay);
    if (!ch || cur) return false;
    UI.hideCoach();
    hideChips();
    cur = { ch, replay: Boolean(replay), scene: 0, lines: [], idx: 0, done: false, card: null };
    skeleton();
    node.hidden = false;
    node.setAttribute('aria-hidden', 'false');
    gameNode.classList.add('story-on');
    Sound.play('quest');
    loadScene(p.scene, p.line);
    try { node.focus({ preventScroll: true }); } catch (e) { /* older engines */ }
    return true;
  }

  function loadScene(sceneIdx, resumeLine) {
    const sc = cur.ch.scenes[sceneIdx];
    cur.scene = sceneIdx;
    cur.lines = sc.lines.filter((l) => l.mode !== 'stage');
    cur.idx = 0;
    cur.done = false;
    refs.stack.textContent = '';
    refs.go.hidden = true;
    refs.hint.hidden = false;
    /* A resumed chapter lands the lines already read, in place and unanimated. */
    const upTo = Math.min(resumeLine || 0, cur.lines.length);
    while (cur.idx < upTo) land(true);
    if (sc.card && !upTo) showCard(sc.card, 'begin');
    else if (!cur.idx) land(false);
  }

  function showCard(text, kind) {
    cur.card = kind;
    refs.title.textContent = text;
    refs.small.textContent = LABEL(kind === 'end' ? 'end' : 'begin');
    refs.card.hidden = false;
    if (!calm()) animate(refs.card, [{ opacity: 0 }, { opacity: 1 }], MOTION().cloudMs);
  }
  function passCard() {
    const kind = cur.card;
    cur.card = null;
    refs.card.hidden = true;
    if (kind === 'end') { closeScene(); return; }
    if (!cur.idx) land(false);
  }

  /* One line, landed. `still` is the resume path: no motion, no save. */
  function land(still) {
    const l = cur.lines[cur.idx];
    if (!l) return;
    cur.idx += 1;
    const row = buildRow(l);
    refs.stack.appendChild(row);
    /* Six rows is two more than the clip shows — enough to push through, few
       enough that a long chapter never builds a tall column nobody sees. */
    while (refs.stack.children.length > 6) refs.stack.removeChild(refs.stack.firstElementChild);
    if (!still) {
      const m = MOTION();
      const h = row.getBoundingClientRect().height + 12;
      animate(refs.stack, [
        { transform: `translateY(${h}px)` },
        { transform: `translateY(${-h * (m.overshoot / 100)}px)`, offset: 0.72 },
        { transform: 'translateY(0)' }
      ], m.pushMs);
      const dx = row.classList.contains('them') ? 26 : row.classList.contains('note') ? 0 : -26;
      const think = l.mode === 'think';
      animate(row.querySelector('.st-bubble'), [
        { transform: `translateX(${dx}px) scale(${think ? 0.86 : 0.94})`, opacity: 0 },
        { transform: 'none', opacity: 1 }
      ], think ? m.cloudMs : m.slideMs);
      animate(row.querySelector('.st-disc'), [
        { transform: 'scale(.82)' }, { transform: 'scale(1.07)', offset: 0.6 }, { transform: 'scale(1)' }
      ], m.popMs);
      if (!cur.replay) Game.storyAdvance(cur.ch.id, cur.scene, cur.idx);
    }
    if (cur.idx >= cur.lines.length) endScene();
  }

  function endScene() {
    cur.done = true;
    stopFf();
    refs.hint.hidden = true;
    refs.go.hidden = false;
  }

  /* A tap anywhere lands the next line NOW. With tapCompletes on, a tap during
     a slide only finishes it; off (the shipped default) every tap is a line. */
  function onTap() {
    if (!cur) return;
    if (cur.card) { passCard(); return; }
    if (cur.done) return;
    if (MOTION().tapCompletes && running.length) { finishAll(); return; }
    finishAll();
    land(false);
  }

  function onContinue() {
    if (!cur || !cur.done) return;
    finishAll();
    const sc = cur.ch.scenes[cur.scene];
    if (!cur.replay) Game.storyDismiss(cur.ch.id, cur.scene);
    const next = cur.scene + 1;
    if (next < cur.ch.scenes.length) { Sound.play('close'); loadScene(next, 0); return; }
    if (sc.endCard) { showCard(sc.endCard, 'end'); return; }
    closeScene();
  }

  function closeScene() {
    finishAll();
    stopFf();
    cur = null;
    refs = null;
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
    node.textContent = '';
    gameNode.classList.remove('story-on');
    lastSceneEnd = nowS();
    Sound.play('close');
    /* The quiet beat after a scene belongs to whatever waited for it — Fall's
       coach mark, a reveal, the chapter's own coda. */
    setTimeout(() => { if (UI.tryMoment) UI.tryMoment(); }, 400);
  }

  function toggleFf() {
    if (!cur) return;
    if (ffTimer) { stopFf(); return; }
    refs.ff.setAttribute('aria-pressed', 'true');
    const step = () => {
      if (!cur || cur.done) { stopFf(); return; }
      if (cur.card === 'end') { stopFf(); return; }
      onTap();
    };
    step();
    ffTimer = setInterval(step, 1000 / Math.max(1, MOTION().ffLinesPerSec));
  }
  function stopFf() {
    clearInterval(ffTimer);
    ffTimer = null;
    if (refs) refs.ff.setAttribute('aria-pressed', 'false');
  }

  /* pointerdown for the tap-through, because the tap latency is the feel;
     click for the two buttons, so a press that lands on one never also counts
     as a tap on the stage. */
  node.addEventListener('pointerdown', (e) => {
    if (!cur || e.button > 0) return;
    if (e.target.closest('.story-ff, .story-go')) return;
    onTap();
  });
  node.addEventListener('click', (e) => {
    if (e.target.closest('.story-ff')) { toggleFf(); return; }
    if (e.target.closest('.story-go')) onContinue();
  });
  node.addEventListener('keydown', (e) => {
    if (!cur || (e.key !== ' ' && e.key !== 'Enter')) return;
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault();
    if (cur.done) onContinue(); else onTap();
  });

  /* ---------------- Poppy's bubble runs ---------------- */

  let run = null;       // { item, idx, timer, suspended, said }
  let lastRunEnd = 0;

  const readMs = (text) => STORY().bubbleMs.base + STORY().bubbleMs.perChar * text.length;
  const spoken = (l) => l && l.mode !== 'stage' && l.mode !== 'strip';
  function nextSpoken(from) {
    const lines = run.item.lines;
    for (let i = from; i < lines.length; i += 1) if (spoken(lines[i])) return { l: lines[i], i };
    return null;
  }

  function startRun(item) {
    run = { item, idx: 0, timer: null, suspended: false, said: false };
    /* Chapter I's first memory is a tune: Poppy hums her own phrase, and the
       line that follows is about it. */
    if (item.id === 'ch1.hum' && Sound.sing) {
      Sound.sing(0);
      run.timer = setTimeout(runStep, 2600);
      return;
    }
    runStep();
  }

  function consume() {
    if (run.said) return;
    run.said = true;
    Game.storySaid(run.item.id);
  }
  function finishRun(after) {
    clearTimeout(run.timer);
    run = null;
    lastRunEnd = nowS() + (after || 0) / 1000;
  }

  function runStep() {
    if (!run) return;
    clearTimeout(run.timer);
    const at = nextSpoken(run.idx);
    if (!at) { consume(); finishRun(); return; }
    run.idx = at.i;
    const l = at.l;
    if (l.mode === 'chip') { showChips(l); return; }
    const next = nextSpoken(at.i + 1);
    const hold = next && next.l.mode === 'chip' ? 0 : readMs(l.text);
    if (!UI.sayText(l.text, 'story', hold)) { suspend(); return; }
    if (UI.faceReact) UI.faceReact(STORY().faces[l.mood] === 'happy' ? 'happy' : 'open');
    run.idx = at.i + 1;
    /* Consumed the moment the LAST line has drawn — the hollyIntro rule. */
    if (!next) { consume(); finishRun(hold); return; }
    if (next.l.mode === 'chip') { run.idx = next.i; showChips(next.l); return; }
    run.timer = setTimeout(runStep, hold);
  }

  function suspend() {
    if (!run) return;
    clearTimeout(run.timer);
    run.suspended = true;
    hideChips();
  }
  function resume() {
    run.suspended = false;
    /* Say the line under the chips again, or carry on from where it stopped. */
    const l = run.item.lines[run.idx];
    if (l && l.mode === 'chip') {
      let back = run.idx - 1;
      while (back >= 0 && !spoken(run.item.lines[back])) back -= 1;
      const prev = run.item.lines[back];
      if (prev && prev.who === 'poppy' && !UI.sayText(prev.text, 'story', 0)) { suspend(); return; }
      showChips(l);
      return;
    }
    runStep();
  }

  /* Mara's reply: one or two chips under the board, never a branch — two
     chips differ in tone and lead to the same next line. The player's tap IS
     her saying it, so nothing repeats it back. */
  function showChips(l) {
    chipsNode.textContent = '';
    const who = document.createElement('div');
    who.className = 'sc-face';
    who.setAttribute('aria-label', LABEL('reply'));
    who.innerHTML = portraitSvg('mara');
    chipsNode.appendChild(who);
    l.chips.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-chip';
      b.textContent = t;
      chipsNode.appendChild(b);
    });
    placeChips();
    chipsNode.hidden = false;
    if (!calm()) animate(chipsNode, [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], MOTION().slideMs);
  }
  function hideChips() {
    chipsNode.hidden = true;
    chipsNode.textContent = '';
  }
  /* Just under the board — under the bubble would be on Poppy's face. */
  function placeChips() {
    const g = $('#garden');
    const r = g ? g.getBoundingClientRect() : null;
    const host = gameNode.getBoundingClientRect();
    chipsNode.style.top = r && r.height ? `${Math.round(r.bottom - host.top + 10)}px` : '';
  }
  chipsNode.addEventListener('click', (e) => {
    const b = e.target.closest('.story-chip');
    if (!b || !run) return;
    Sound.play('close');
    hideChips();
    run.idx += 1;
    if (!nextSpoken(run.idx)) {
      consume();
      const sp = UI.speechNode && UI.speechNode();
      if (sp) sp.classList.remove('show');
      finishRun();
      return;
    }
    runStep();
  });

  /* ---------------- when ---------------- */

  const roomOk = () => !(UI.hollowOpen && UI.hollowOpen()) && !(UI.meadowOpen && UI.meadowOpen())
    && !(UI.gateOn && UI.gateOn()) && !(UI.menuOpen && UI.menuOpen());
  const inGarden = () => UI.seasonHere && UI.seasonHere() === 'summer';

  /* The one entry point, called from tryMoment() — so a sheet closing, the
     news settling, the coach clearing and the once-a-second poll all reach it.
     Returns true when the story holds the screen. */
  function tryStory() {
    if (cur) return true;
    const quiet = UI.momentsQuiet && UI.momentsQuiet() && roomOk();
    if (!quiet) { if (run && !run.suspended) suspend(); return false; }
    if (replayWanted) {
      const id = replayWanted;
      replayWanted = null;
      if (run) { suspend(); run = null; }
      return openScene({ chapter: id, scene: 0, line: 0 }, true);
    }
    const p = Game.storyPending();
    if (p) {
      if (run) { suspend(); run = null; }
      return openScene(p, false);
    }
    if (run) {
      if (!inGarden()) { if (!run.suspended) suspend(); return false; }
      if (run.suspended) resume();
      return true;
    }
    if (!inGarden()) return false;
    const t = nowS();
    if (t - lastRunEnd < STORY().runGap || t - lastSceneEnd < STORY().runGap) return false;
    const item = Game.storyLine();
    if (!item) return false;
    startRun(item);
    return Boolean(run);
  }

  /* The coach waits for the story (docs/55 §6): while a scene is up or owed on
     this screen, or Chapter I's opening is mid-run or owed in the garden.
     Slivers and story lines never hold it — they are texture and simply wait
     their turn behind a mark. */
  function storyHoldsCoach() {
    if (cur || (run && !run.suspended)) return true;
    if (!roomOk()) return false;
    if (Game.storyPending()) return true;
    if (!inGarden() || Game.storySeen('ch1')) return false;
    const l = Game.storyLine();
    return Boolean(l && l.kind === 'run');
  }

  /* ---------------- the doors in other panels ---------------- */

  /* Replay from the Almanac: the sheet shuts first (a scene never opens over a
     sheet), and the chapter plays from its first card without latching a thing. */
  /* Replay from the Almanac: the sheet shuts first (a scene never opens over a
     sheet), and the chapter plays from its first card without latching a thing.
     The request is HELD rather than timed, and it holds the floor while it
     waits: the sheet closing is a quiet beat, and a reveal card that takes it
     would otherwise put the replay underneath a dialog. */
  let replayWanted = null;
  function storyReplay(id) {
    if (cur || !Game.storyChapterFor(id, true)) return false;
    replayWanted = id;
    if (UI.closeSheet) UI.closeSheet();
    return true;
  }

  function roman(n) {
    return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
  }

  /* Fills the empty nodes ui-sheet.js leaves for the story's words. */
  function paintStory(root, report) {
    root.querySelectorAll('[data-story-label]').forEach((n) => { n.textContent = LABEL(n.dataset.storyLabel); });
    root.querySelectorAll('[data-chapter-title]').forEach((n) => {
      const ch = Game.storyChapterFor(n.dataset.chapterTitle, true);
      n.textContent = ch ? [LABEL('chapter'), roman(ch.n), '·', ch.title].join(' ') : '';
    });
    const w = root.querySelector('[data-story-welcome]');
    if (w && report && report.welcome) {
      const f = face(report.welcome.who, 'happy');
      const said = document.createElement('span');
      said.className = 'aw-said';
      said.textContent = report.welcome.text;
      w.textContent = '';
      w.append(f, said);
    }
  }

  let turnSaid = 0;
  function storyAfterTurn() {
    const n = Game.state.year.turnsCompleted;
    if (turnSaid === n) return;
    const line = Game.storyTurnLine();
    if (!line) return;
    turnSaid = n;
    setTimeout(() => { if (!cur && inGarden()) UI.sayText(line, 'story'); }, 900);
  }

  window.addEventListener('resize', () => { if (!chipsNode.hidden) placeChips(); });

  UI.tryStory = tryStory;
  UI.storyOpen = sceneOpen;
  UI.storyBusy = () => Boolean(cur || replayWanted || (run && !run.suspended));
  UI.storyHoldsCoach = storyHoldsCoach;
  UI.storyReplay = storyReplay;
  UI.paintStory = paintStory;
  UI.storyAfterTurn = storyAfterTurn;
})();
