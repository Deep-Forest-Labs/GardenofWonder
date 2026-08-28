# The Garden Year — Build Plan and Gauntlet

**Status: the build plan, 2026-08-29.** How [32-the-garden-year.md](32-the-garden-year.md) and
[33-year-one-economy.md](33-year-one-economy.md) get built: **phases the owner reviews one at a
time, each run by a fresh builder session, each ending in a critic gauntlet before the owner ever
sees it.** This session-splitting is deliberate — the strategy/design session stays clean, and
each builder gets a paste-ready prompt from this document.

Three bars every phase is judged against, the owner's words:

1. **Visual fidelity** — everything new passes [05-art-direction.md](05-art-direction.md): the
   material recipe, the lip ladder, tokens not hexes, and the phone-first column rules.
2. **Tuning in every aspect** — numbers live in data, the sim-test bill stays green, and pacing
   is measured, never asserted.
3. **The prestige has to feel like what the game was always meant to be** — the Turn is a gift,
   the Tally is a celebration, and the rubric question for every phase is doc 32's: *does turning
   the year feel like a gift or a loss?*

## The gauntlet — the critic protocol every phase runs

A phase is not "done, please review." A phase runs this ladder, in order, before the owner is
asked for a verdict:

1. **The suite, several times.** `node tools/sim-test.js` repeatedly — the docs record a whole
   class of flaky failures from unpinned `Math.random`. A phase with a flaky test is not done.
2. **The adversarial workflow.** The builder session runs a multi-agent critique of its own
   phase (the prompt for each phase includes the word *ultracode*, which authorizes it):
   independent critics for **invariant coverage** (every sim-test in doc 33's bill actually
   asserted, not just written), **partition completeness** (the Turn's clears list vs the full
   field list in [07-save-data.md](07-save-data.md)), **economy pacing** (a headless year driven
   through the real `game.js`), and — for any phase with UI — **visual fidelity** (screenshots
   via `tools/probe.js`, judged rule-by-rule against doc 05) and **grammar** (share the grammar,
   never share the verb). Findings are fixed and the critics re-run until a clean round.
3. **The docs, per AGENTS.md.** All five steps, same commit. A phase that ships code without
   true docs is not done.
4. **Push, then the phone.** The owner tests from the live URL. Every phase's handoff ends with
   a **five-minute test script** — the exact cheat-driven steps to *feel* the phase (e.g. "grant
   gold, drive a year, watch the Tally") — so the review never starts with "where do I look?"
5. **The owner's verdict gates the next phase.** No builder starts phase N+1 without it.
   Optionally, the owner runs `/code-review ultra` on the phase branch-point — that is
   owner-triggered and billed, and it is worth it on phases 1 and 3.

**Standing rules for every builder:** push after every change (the owner tests live); numbers in
`data.js`, never in code; design questions come back to the owner instead of being settled in
the builder session — doc 32/33 are the spec, and where they are silent the builder asks rather
than invents; and the game on `main` must stay playable after every push, which is why phase 1
is simulation-only.

## The wireframe gate — before any UI phase writes UI code

**Owner-required, 2026-08-29: a UI phase begins with a full layout pass of every screen it will
touch, and the owner approves it before a line of UI code is written.** The house already has
the right vehicle — the spike (`tools/map-spike.html`, `merge-spike`, `hollow-spike`,
`customer-spike` all "saved real time," per the standing note). So:

1. **The builder's first deliverable is a spike** — `tools/turn-spike.html` (phase 2),
   `tools/fall-spike.html` (phase 3) — a static page, no game dependencies, showing **every
   screen and state the phase touches** at 390×844, with real proportions, placeholder content,
   and every new element placed. It obeys [08-ui-and-layout.md](08-ui-and-layout.md)'s rules
   (the 560px column, the pinned row grid, the sheet grammar) at wireframe fidelity — layout is
   the question here, polish is the build's job.
2. **Self-review before showing:** the builder checks the spike against doc 08's layout rules
   and flags every deviation or open layout question *as a question*, not a decision.
3. **Push, then stop.** The spike is reachable from the live URL on the owner's phone. The
   handoff names each screen, the layout decisions made, and the questions raised. **No UI code
   until the owner approves.**
4. **The owner's annotations go verbatim into the build.** The approved spike becomes the
   reference the visual-fidelity critic later judges the built UI against — first for layout,
   then doc 05 for finish.

## The phases

| Phase | Ships | The owner reviews | Slice |
| --- | --- | --- | --- |
| **1 — The engine** — **BUILT 2026-08-29, awaiting the owner's verdict** | Year state, `credit()`, the mint + Tally math, `turnYear()`, unlock prices, petal effects, quest re-keys, migration, dev-tools drivers, **the whole sim-test bill** (items 1–6, 8–18 asserted; suite at 1,096) | Numbers, via a cheat-driven year — no UI yet | A (sim half) |
| **2 — The ceremony** | The meter pill, the Turn sheet with the arcade Tally, the blessing, petal rows on the Almanac, unlock rows in the seed picker, the season tint | Plays a full year on the phone; *gift or loss?* | A (surface half) |
| **3 — Fall and the strip** | The horizontal season strip, hedge gates, Fall's board + eight crops + windfall + Century Bloom, map retirement, the Stand's dock entry | Turn 1 → the gate opens → a Fall day | A (world half) |
| **4 — The tuning pass** | Play-derived retune of every knob against the doc 33 targets, FTUE beats, flower lines, celebration polish | Day 1–3 pacing on a fresh save; the wall's *feeling* | A (polish) |
| 5 — The signatures | The launch six, countdown framing, sim-test 7 | Do petals make flowers feel owned | B |
| 6 — Winter | The night-shift garden, morning-check session | Does the overnight ritual form | C |
| 7 — Orders return | The order strip, ladder past 17, order-driven rep | Does demand pull planting | D |
| 8 — Spring | The nursery; ceremony moves home | The long game | E |

Phases 5–8 get their scopes from doc 32's slice table when their time comes; do not design them
early.

### Phase 1 — The engine (simulation only, no UI)

**In scope:** `DATA.year` / `DATA.fall` / `DATA.petals` (+ the GLOBALS whitelist);
`state.year { number, coinsEarned, stats, turnsCompleted }`, `savedSeeds`, `petals`,
`seedUnlocks`, `blessed`, `state.fall` — all in `defaultState()` **and** the re-merge list;
`Game.credit(amount, {cheat, refund})` wired through every faucet; the mint with the Tally
(counters, tiers, cap, zero-line rule); atomic `Game.turnYear(blessedId)` over the full
partition including the in-flight rules; unlock prices (charged once ever) with the seed
`unlockLevel` retirement and grandfather migration; the two Turn gates (`minSeeds`, `minCoins`)
and the plots-5–8 year gate; petal effects via `petalMult` at harvest and
in `passiveIncomeRate()`; Bloom Mastery retirement + conversion grant; the four quest re-keys at
held reputation; Fall's plants and windfall **as simulation** (the board state machine, no
rendering); Century Bloom rules; dev-tools drivers (drive a year's earnings, force the meter,
run a Turn, inspect the Tally). **The entire sim-test bill, items 1–6 and 8–18.**

**Out of scope, hard:** any visible UI beyond dev tools; the ceremony sheet; the strip; Fall's
rendering; art of any kind. The live game must look and play identically after every phase-1
push — the year accrues silently underneath it.

**The review gate:** the owner opens dev tools, drives a simulated year in five minutes, and
judges the numbers: does the first wall read as six-times-everything, does the pouch feel
earned, do 2–5 petals per Turn feel right on paper.

### Phase 2 — The ceremony

**Begins at the wireframe gate: `tools/turn-spike.html`, owner-approved before any UI code.**
The spike must show every screen and state:

1. The HUD with the third pill — mystery-meter state (pre-Turn-1) and banked-seeds state, with
   the tap-for-projection affordance.
2. The Turn sheet, all four beats as separate frames: the ask, the blessing picker, **the Tally
   sequence** (base count-up, lines landing, the total), and the spring return.
3. An Almanac row with petal tracks and buy chips — empty pre-Turn-1 state and a mid-progress
   state.
4. A seed-picker locked row wearing the unlock price, and the moment after unlocking.
5. The `--season-tint` aging at three points of the year.

Then the build: the meter pill, the `turn` sheet mode on the welcome-back scene's pattern, the
Tally as theatre (zero-line rule as presentation), petal rows, unlock rows, the tint. Visual
critic mandatory — this is the game's biggest new surface and it must pass doc 05 rule-by-rule,
on a phone screenshot, before the owner sees it.

### Phase 3 — Fall and the strip

**Begins at the wireframe gate: `tools/fall-spike.html`, owner-approved before any UI code.**
The spike must show:

1. Summer with the strip's presence legible (how a player discovers sideways exists — edge
   affordance, gate peek, or the World button's replacement).
2. A hedge gate up close: the padlock chip, the turn label, the drifting particle.
3. Fall's board: the flower in the middle, eight plots, the crop picker, a windfall-ready bed
   (all eight ripe — how that state announces itself), and the windfall pop.
4. The Century Bloom growing (day 3 of 14 — what the wait *looks* like).
5. The dock with the Stand button where World was.

Then the build: the horizontal swipe (background-start, `dx > dy`, mirroring the vertical
rules), the gates, Fall's board and crops, the windfall, the Century Bloom, the map +
`overworld.js` + camera retirement, the dock swap. Grammar critic mandatory: Fall must read as
*the garden in another season*, not a second game — the meadow's lesson, re-run.

### Phase 4 — The tuning pass

No new systems. A fresh-save playthrough measured against doc 33's targets (first Turn day 2–3,
~370K first year, 2–5 petals per Turn), every knob adjusted **in data** with the reasoning
logged, the FTUE beats (mystery meter, the scripted first blessing), 3–4 meter-state
`FLOWER_LINES`, and the celebration ladder placement for the Tally and the gate. This is where
"the tuning is in every aspect" is earned, and it is deliberately its own phase so tuning is
never squeezed into the end of a build phase.

## The prompts

### Phase 1 prompt — paste into a fresh session

```
ultracode

You are the builder for Phase 1 of the Garden Year — the simulation engine of
the biggest change this game has made. You implement a finished spec; you do
not redesign it.

Open the repo at Ghost Garden/Ghost Garden (a subdirectory of the workspace,
not the root). Run git fetch and git status first — other sessions work in this
tree. The game deploys from main to GitHub Pages and the owner tests from the
live URL: push after every change, and the game must look and play identically
after every push — Phase 1 is simulation only, and the year accrues silently
under the live game.

Read, in order:
1. docs/HANDOFF.md — where everything stands; read "Traps in this codebase" in full
2. docs/09-conventions.md — before your first line of code
3. docs/32-the-garden-year.md — the design
4. docs/33-year-one-economy.md — every number, and the 18-item sim-test bill
   that is your definition of done (items 1-6 and 8-18 are yours; item 7 waits
   for Phase 5)
5. docs/34-build-plan.md — your exact scope ("Phase 1 — The engine", including
   its hard out-of-scope list) and the gauntlet you must run before handing off

Non-negotiables: every number lives in data.js, remote-config-ready; no UI
beyond Developer-tools drivers; docs updated per AGENTS.md's five steps in the
same commit as the code; node tools/sim-test.js run several times per change —
the repo documents a class of flaky tests from unpinned Math.random, and a
flaky suite is a failing suite.

Key numbers as of 2026-08-29 (docs/33 is authoritative wherever anything
differs): unlock(3) = 150K at x1.5/tier; mint = 0.1·sqrt(coinsEarned) ·
(1 + 0.2·turns) · tally, tally summed then capped at x2.0; the Turn requires
projected mint >= 10 AND coinsEarned >= 100K; petals cost
15 · 1.45^(seed-1) · 1.25^(petal-1), signatures x0.6; plots 5-8 require
turnsCompleted >= 1 (migrated saves keep what they own); cheated gold never
reaches coinsEarned.

When implementation is complete, run the gauntlet from docs/34 before your
handoff: an adversarial multi-agent critique with independent critics for
invariant coverage (all 17 slice-A bill items genuinely asserted, not just
written), partition completeness (the Turn's clears vs the full field list in
docs/07-save-data.md), and economy pacing (a headless year driven through the
real game.js: first Turn ~day 2.7-3.3 of casual play, ~370-410K first-year
coins, 2-5 petals per Turn through Turn 12, and the daisy-rush shape
unprofitable per bill item 17). Fix findings and re-run until a clean round.

Where docs 32/33 are silent, ask the owner instead of inventing — the design
conversation lives in another session. End with the five-step docs handoff per
AGENTS.md, and a five-minute test script the owner can run from Developer
tools to feel a whole year: earn, hit the wall, Turn, watch the Tally, spend
petals, confirm the never-resets list held. Then stop and wait for the owner's
review. Phase 2 does not start in your session — and when it starts in its
own, it begins at the wireframe gate in docs/34, with owner-approved layouts
before any UI code.
```

### Phase 2–4 prompts — the template

Identical preamble (ultracode, repo location, git hygiene, reading order, AGENTS.md), then:

> Your scope is docs/34-build-plan.md "Phase N — …", exactly. The previous phase is merged and
> reviewed; do not reopen it. **If your phase touches UI, your first deliverable is the
> wireframe gate**: the phase's spike showing every screen and state, pushed, with your layout
> questions raised as questions — then stop for the owner's approval before any UI code. Run the
> gauntlet for your phase — for UI phases that includes the visual-fidelity critic (screenshots
> via tools/probe.js judged first against the approved spike for layout, then rule-by-rule
> against docs/05-art-direction.md for finish) and the grammar critic. End with the five-step
> handoff, a five-minute phone test script, and stop for the owner's review.

Write the phase-specific prompt fresh at kickoff — after a review, the owner's notes from phase
N−1 go into phase N's prompt verbatim, which is what makes the review loop real.

## What the owner does between phases

1. Play the five-minute test script on the phone, from the live URL.
2. Judge the phase against its review gate above — and always against the rubric: *gift or
   loss?*
3. Optionally run `/code-review ultra` (owner-triggered, billed) — recommended after phases 1
   and 3.
4. Give the verdict and any notes; the notes go verbatim into the next phase's prompt.
