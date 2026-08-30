# Working on this game from a phone

Cowork sessions started from a phone or the web run in a disposable Linux container in the cloud,
not on the owner's Mac. There is no mounted folder and no editor. The container has `git`, Node 22
and a headless Chromium, a network connection, and nothing else that matters.

That turns out to be enough, because this project has no build step and no dependencies. A cloud
session clones the repository, changes files, proves the change, commits and pushes. This document
is the part a session cannot work out on its own.

## The loop

```bash
git clone https://github.com/jonishua/gardenwonder.git && cd gardenwonder
```

Then read `docs/HANDOFF.md` and `docs/09-conventions.md` as always — the rules in `AGENTS.md` are
not relaxed because the session is remote. Make the change, then prove it:

```bash
node tools/sim-test.js          # 1,353 assertions, about 2 seconds
node --check <every file touched>
node tools/probe.js shot:after  # see it, don't just believe it
```

Commit the code and the documentation together, per the definition of done in `AGENTS.md`, and
push.

## Seeing the game

`tools/probe.js` exists because a remote session cannot open the game and look at it. It serves the
repository, opens it in headless Chromium emulating a 390×844 phone, runs a short script of taps
and waits, writes PNGs to `.probe/`, and reports any console errors. It has no dependencies — it
drives Chrome over the DevTools Protocol using the WebSocket client built into Node 22 — and it
finds Chrome on both the cloud container and a Mac.

```bash
node tools/probe.js shot:boot
node tools/probe.js 'tap:#flowerBtn*30' wait:400 shot:combo 'eval:document.getElementById("credits").textContent'
node tools/probe.js size:430x932 shot:large
```

Steps run in order: `shot:NAME`, `tap:SELECTOR` or `tap:SELECTOR*25`, `wait:MS`, `eval:EXPR`,
`size:WxH`, `page:PATH`. An unrecognised step is an error rather than a no-op, so a typo fails
loudly instead of silently skipping a tap. It exits non-zero if the page threw.

The screenshots are worth attaching to the session so the owner can check a layout fix from a
phone without getting to a desk. `.probe/` is ignored by git.

**To screenshot a screen that needs progress, seed the running game — never the save.** Most of the
interesting screens are gated: the plant picker greys nineteen seeds at level 1, and the creature
panel renders "Nobody by that name lives here" until somebody has moved in. The obvious move is to
write a hand-made save into `localStorage` and reload, and it does not work. `load()` wraps the
whole parse-and-migrate in one `try`, and on any exception it **warns and returns a fresh state** —
so a save that is subtly wrong gives you a level-1 garden, a clean probe report, and no clue. Reach
through `Game.state` on the already-loaded page instead:

```bash
# .probe/seed.js sets Game.state directly, then emits 'currency' / 'grid' / 'panels'
node tools/probe.js \
  "eval:fetch('.probe/seed.js').then(r=>r.text()).then(t=>eval(t))" wait:1200 \
  shot:garden "eval:UI.openSheet('seeds',0)" wait:800 shot:seeds
```

No reload, so `load()` never sees anything hand-written, and the state is exactly what the game
would have built. `UI.openSheet(mode, arg)` opens any panel directly; `UI.enterHollow()`,
`UI.enterMeadow()` and `UI.enterMap()` open the places.

**`probe.js` reports console *errors*, and a warning is not an error.** It listens for
`Runtime.exceptionThrown` and for `consoleAPICalled` with `type === 'error'` only, so every
`console.warn` in the game is invisible to it — including `Save load failed`, which is the one you
most want to see. "no console errors" means no errors, not no problems.

**A `tap:` on an element below the fold misses, silently, and the run still exits 0.** The step
dispatches a real touch at the element's coordinates, so anything scrolled outside the 844px
viewport is simply not there to hit — the sheet's Garden Year buttons sit at roughly y=1285 and
were never reached. Nothing errors, the screenshots look plausible, and the exit code says
success: the run proved the page did not throw, **not that any of your steps ran.** Use
`eval:` with `.click()` to test that a handler is wired, and keep `tap:` for testing that a hit
target is actually reachable by a thumb — which is the one question `eval:` cannot answer. Cost
a session an hour on the phase-1 dev panel, twice: once believing a live button was dead, once
trusting a green run that had done nothing. Assert on state after a `tap:`, never on the exit
code alone.

**What it will not tell you.** Nothing about audio, because there is no output device. Nothing
about real touch feel, momentum or the bottom sheet's drag. Nothing about iOS Safari, which is the
platform this game is actually played on and the one most likely to disagree — a change to sticky
positioning, viewport units, or anything in `23-installable-pwa.md` needs a real device before it
is believed. Chromium-on-Linux is a smoke test, not a verdict.

## Pushing publishes

The repository root deploys straight to GitHub Pages, and `sw.js` is network-first, so a push to
`main` reaches installed players in about as long as it takes them to reopen the game. There is no
staging step between a phone session and the audience.

So remote sessions work on a branch — `mobile/<short-name>` — and leave the merge for a moment
when the change can be looked at on a real phone. The cost of the branch is one extra command; the
cost of skipping it is discovering a broken layout from a coffee shop with no way to check it.

A push needs credentials the container does not have. The owner supplies a fine-grained personal
access token scoped to this repository alone, with **Contents: read and write**, at the start of a
session:

```bash
git remote set-url origin https://<token>@github.com/jonishua/gardenwonder.git
```

The container is destroyed when the session ends, and takes the token with it. Never write the
token into a file in the repository, and never echo it back into the transcript.

## When the Mac is awake instead

If the desktop app is running on the Mac, a phone session can reach the real folder through it and
edit files in place, no clone and no token. That path is better when it is available — it is the
working copy, and the change is on disk immediately. It just requires the Mac to be powered on and
awake, which is exactly the condition a phone session usually cannot rely on.
