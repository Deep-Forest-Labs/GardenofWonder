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

## The phases

| Phase | Ships | The owner reviews | Slice |
| --- | --- | --- | --- |
| **1 — The engine** | Year state, `credit()`, the mint + Tally math, `turnYear()`, unlock prices, petal effects, quest re-keys, migration, dev-tools drivers, **the whole sim-test bill** | Numbers, via a cheat-driven year — no UI yet | A (sim half) |
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
`unlockLevel` retirement and grandfather migration; petal effects via `petalMult` at harvest and
in `passiveIncomeRate()`; Bloom Mastery retirement + conversion grant; the four quest re-keys at
held reputation; Fall's plants and windfall **as simulation** (the board state machine, no
rendering); Century Bloom rules; dev-tools drivers (drive a year's earnings, force the meter,
run a Turn, inspect the Tally). **The entire sim-test bill, items 1–6 and 8–16.**

**Out of scope, hard:** any visible UI beyond dev tools; the ceremony sheet; the strip; Fall's
rendering; art of any kind. The live game must look and play identically after every phase-1
push — the year accrues silently underneath it.

**The review gate:** the owner opens dev tools, drives a simulated year in five minutes, and
judges the numbers: does the first wall read as six-times-everything, does the pouch feel
earned, do 2–5 petals per Turn feel right on paper.

### Phase 2 — The ceremony

The meter pill (third HUD pill, projection on tap, the re-invite), the `turn` sheet mode built
on the welcome-back scene's pattern — the ask, the blessing picker, **the Tally as theatre**
(base count-up, lines slamming in one at a time, the cap, the zero-line rule as presentation),
the gate reveal beat (pointing at phase 3's gates; in phase 2 it lands on Summer's spring
return), petal rows and buy chips on the Almanac, unlock rows in the seed picker, the
`--season-tint` aging. Visual critic mandatory: this phase is the game's biggest new surface
and it must pass doc 05 rule-by-rule, on a phone screenshot, before the owner sees it.

### Phase 3 — Fall and the strip

The horizontal swipe (background-start, `dx > dy`, mirroring the vertical rules), hedge gates
with their padlock chips, Fall's board on the garden grammar **with the talking flower in the
middle**, the eight crops, the windfall (all eight planted and ripe), the Century Bloom, the
map + `overworld.js` + camera retirement, and the World→Stand dock button swap. Grammar critic
mandatory: Fall must read as *the garden in another season*, not a second game — the meadow's
lesson, re-run.

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

You are the builder for Phase 1 of the Garden Year — the simulation layer of the
biggest change this game has made. You implement a finished spec; you do not
redesign it.

Open the repo at Ghost Garden/Ghost Garden (it is a subdirectory of the
workspace, not the root). Run git fetch and git status first — other sessions
work in this tree. The game deploys from main to GitHub Pages and the owner
tests from the live URL, so push after every change and keep the game playable
after every push.

Read, in order: docs/HANDOFF.md (state and traps — read "Traps in this codebase"
fully), docs/09-conventions.md (before your first line of code),
docs/32-the-garden-year.md (the design), docs/33-year-one-economy.md (every
number, and the sim-test bill that is your definition of done),
docs/34-build-plan.md (your phase: Phase 1, including its hard out-of-scope
list). AGENTS.md defines "done" — the docs must be true again in the same
commit, all five steps.

Your scope is docs/34-build-plan.md "Phase 1 — The engine", exactly: simulation
only, no UI beyond Developer-tools drivers, and the live game must look and play
identically while the year accrues silently underneath. Every number ships in
data.js. The sim-test bill in docs/33 (items 1-6 and 8-16) is the acceptance
test: node tools/sim-test.js, run several times — the repo has a documented
class of flaky tests from unpinned Math.random, and a flaky suite is a failing
suite.

When implementation is complete, run the gauntlet from docs/34-build-plan.md
before writing your handoff: an adversarial multi-agent critique with
independent critics for invariant coverage (every bill item genuinely asserted),
partition completeness (the Turn's clears vs the full field list in
docs/07-save-data.md), and economy pacing (drive a headless year through the
real game.js and check the doc 33 targets: first Turn ~day 2-3 of casual play,
~370K first-year coins, 2-5 petals per Turn through Turn 12). Fix what they
find and re-run until a clean round.

Where docs 32/33 are silent, ask the owner rather than invent — you are the
builder, the design conversation lives in another session. End with the
five-step docs handoff per AGENTS.md, and a five-minute cheat-driven test
script the owner can run from Developer tools to feel a whole year: earn, hit
the wall, Turn, watch the Tally numbers, spend petals, confirm the never-resets
list held. Then stop and wait for the owner's review — Phase 2 does not start
in your session.
```

### Phase 2–4 prompts — the template

Identical preamble (ultracode, repo location, git hygiene, reading order, AGENTS.md), then:

> Your scope is docs/34-build-plan.md "Phase N — …", exactly. The previous phase is merged and
> reviewed; do not reopen it. Run the gauntlet for your phase — for UI phases that includes the
> visual-fidelity critic (screenshots via tools/probe.js judged rule-by-rule against
> docs/05-art-direction.md) and the grammar critic. End with the five-step handoff, a
> five-minute phone test script, and stop for the owner's review.

Write the phase-specific prompt fresh at kickoff — after a review, the owner's notes from phase
N−1 go into phase N's prompt verbatim, which is what makes the review loop real.

## What the owner does between phases

1. Play the five-minute test script on the phone, from the live URL.
2. Judge the phase against its review gate above — and always against the rubric: *gift or
   loss?*
3. Optionally run `/code-review ultra` (owner-triggered, billed) — recommended after phases 1
   and 3.
4. Give the verdict and any notes; the notes go verbatim into the next phase's prompt.
