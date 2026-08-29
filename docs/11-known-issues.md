# Known Issues and Rough Edges

Things that are wrong, unfinished, or surprising, recorded so nobody rediscovers them from scratch.
Nothing here is a crash — the game is stable. These are correctness, balance and polish gaps.

If you fix one, delete it from this file in the same commit.

## The Garden Year — phase 1's deliberate seams (2026-08-29)

The engine shipped with no UI, so several truths are temporarily invisible or mislabelled.
All of these resolve in phases 2–3; they are listed so nobody "fixes" them early or is
surprised on a fresh save.

### A FRESH save is hard-capped at 2 of 19 seeds and 4 of 8 plots until phase 2

Say it plainly (the gauntlet's spec critic caught the soft version of this note): with no
unlock surface shipped, a brand-new save on the live site can never plant past Tulip and can
never buy plots 5–8 or run a Turn from the game's own UI — `Game.unlockSeed()` has no caller
outside Developer tools (a **"Unlock the next seed" dev button** exists precisely so the wall
can be paid and *felt* during review), and the Turn exists only behind the dev sheet. The
owner's grandfathered save sees nothing locked, so the live game reads unchanged **for
migrated saves only** — confirm every live tester is on one before phase 2, or warn them.

The label seams, same family: `renderSeeds()` still chips a locked seed with the retired
`unlockLevel` ("Level 1" on a Bluebell that actually wants 150K gold), a year-gated plot's
chip and deny toast still say "Lv 3" while the true refusal is "no Turn yet", and the
level-up toast no longer announces seeds, which shortens levels 2–17's fanfare until the
ladder re-authors in slice D. Phase 2 ships the real unlock rows.

**And a MIGRATED save is not behaviourally unchanged either — three real differences**, so
"the live game plays identically" is retired as a claim (it holds for the *look*, not the
behaviour):

1. **Harvest yield drops by 5% × mastery tiers** on every flower, the moment the save loads —
   the accepted Bloom Mastery regression logged on 2026-08-29. The 2-seeds-per-tier conversion
   pays into a currency with no spend surface until phase 2, so the compensation is invisible
   for now.
2. **Plots 5–8 refuse purchase** until the first Turn, and the Land Deed badge reads *Maxed* at
   level 0 while that is true.
3. **The dev "Unlock the next seed" button finds nothing to sell** on a fully grandfathered
   save (it reports "Every seed is already unlocked"), and on a partly-grandfathered one it
   offers whatever seed is next — not necessarily Bluebell at 150K. **To feel the first wall as
   step 2 of the review script describes it, use a fresh save in a private window.**

### The Almanac still renders the frozen mastery ladder

`masteryGoal()` answers with the tier the save was on, forever, and the yield chip reads
"+0%" because `masteryMult()` retired. Honest but odd-looking. Phase 2 replaces the row with
petal tracks.

### Phase 2 must filter capped flowers out of the blessing picker

The ceremony's beat 3 is "pick any flower", the Turn is atomic and irreversible, and
`turnYear()` accepts a flower already at its Rich Bloom cap: it writes nothing, returns
`blessed: null`, and the Turn still completes. A player who picks a capped flower therefore
loses that Turn's blessing with no undo. Phase 1's dev button hit exactly this — it blessed
Daisy by name, and the review script's own steps cap her — so it now blesses the cheapest
flower with room and says so when none is left. The picker must do the same. Carried forward
from round 4 of the gauntlet.

### ~~The Tally's tier-reading needs the owner's confirmation~~ — RATIFIED

**Closed 2026-08-29 by the phase-1 independent review**, on arithmetic rather than taste:
cumulative tiers are the only reading that reproduces doc 33's own "47 orders → ×1.25"
worked example *and* reaches the ×2.0 cap the same document says a maxed year hits
(highest-tier-only caps out at ×1.69). `projectedTally()` was already right. Kept here only
so nobody reopens it; the reasoning is in the review entry of
[10-decision-log.md](10-decision-log.md) and inline in
[33-year-one-economy.md](33-year-one-economy.md#the-tally).

### `q_discover_5` straddles the year boundary on a fresh save

Discover quests read lifetime `discovered` and survive the Turn, so they resolve across
years rather than jamming — but a fresh save's `q_discover_5` (rep 12) will hold an active
slot from mid-year-one until rose unlocks in year two. Doc 33 re-keyed exactly four quests
and deliberately not this one. Watch it in the first playtest.

### ~~OPEN OWNER DECISION: the cheap-Turn cadence is strictly profitable~~ — RESOLVED, 2026-08-29

**The owner ruled: the mint becomes cumulative.** Phase 1.1 implemented it, and the exploit is
dead by construction rather than by tuning.

**What was wrong.** The mint was `mintK × sqrt(coinsEarnedThisYear) × (1 + veterancy ×
turnsCompleted)`. Two mechanisms stacked: `sqrt` of a *per-year* number is superadditive under
splitting (four 100K years minted ~2.6× one 400K year), and the uncapped veterancy term
compounded with turn count on top. Fall beds, which rightly survive the Turn, let the doomed
pre-Turn wallet be converted into next-year income. Measured through the real engine over 12
modelled days: turn-at-every-gate minted **~20× the wall-rider's Saved Seeds** at ~8 Turns/day,
while losing to them on gold by ~2.7× — a seeds-only break.

**What fixed it.** The pool a garden will ever mint is now `mintK × sqrt(state.lifetimeCoins)`;
a Turn draws the undrawn part of it (`state.mintedBase`), and the Tally multiplies the draw
without consuming it. Both ledgers are top-level and never reset. `DATA.year.veterancy` is
**deleted** — the phase-1 review proved that re-attaching *any* per-turn multiplier to a
split-neutral base re-arms the split at 1.3–1.4×, so capping it was never enough. `minSeeds`
now gates the un-tallied increment rather than the tallied pouch. Because the pool depends on
lifetime earnings alone, the sum of every Turn's draw is the same number however the year is
sliced — no cadence can out-mint another, and `node tools/year-sim.js 12 all` **exits zero**,
with normal play ahead of turn-spam by a median ~1.9× on seeds (range ~1.5–2.2× over 30 runs; re-measured
after the same day's Fall fixes gave the adversary a better crop; the margin widened).

**Whose ruling:** the owner's, taking the phase-1 independent review's recommendation (variant
B of four measured through the real engine — dials alone failed at 3.5–4×, a ratcheting coins
floor at 1.2–1.5×, and cumulative-with-capped-veterancy at 1.3–1.4×). The reasoning is in the
2026-08-29 review and phase-1.1 entries of [10-decision-log.md](10-decision-log.md); the
formula is in [33-year-one-economy.md](33-year-one-economy.md#saved-seeds--the-mint).

### OPEN OWNER DECISION: the blessing is now the largest per-Turn grant, and nothing prices it

**Found while landing the cumulative mint, 2026-08-29.** The mint's base is split-neutral now,
but the ceremony's blessing is not: **one free Rich Bloom petal per Turn, regardless of what
the year earned.** That is a per-turn *constant* on a split-neutral base — the same family the
review warned about, in a currency the mint does not control.

Driven through the real engine, turning as often as the gates allow and blessing the cheapest
uncapped flower each time:

- **95 Turns fill every flower's Rich Bloom ladder** (19 flowers × cap 5) — **318,189 Saved
  Seeds of value, exactly half the entire shared-skill sink — for free.**
- It costs **~101M lifetime coins**, about **2.5 days** of play at the measured ~40M/day late
  income. The mint pays **997 seeds** over the same 95 Turns.
- Buying that same 318,189 seeds' worth would need a lifetime of ~1.0 × 10¹³ coins — about
  **253,000 days**. The blessing is therefore worth ~320× the seeds it is handed out beside.

It is **pre-existing** — the blessing has always been one petal per Turn, and the old mint had
the same hole — but the old mint was large enough to dwarf it. What the ruling changed is the
ratio. `tools/year-sim.js` now separates **bought** petals from **blessed** ones in its report
and discloses this beneath the verdict; it does **not** fail on it, because the exit code
answers the question the owner ruled on and the blessing is a designed ceremony beat
([32-the-garden-year.md](32-the-garden-year.md), beat 3 — "one blessing per Turn, any flower,
repeatable across years").

**The dials, none of them taken:** price the blessing against the year (scale it with the
Tally or the increment), make it once per *year* rather than per *Turn*, cap total blessings,
or leave it and accept that the Rich Bloom ladder is a Turn-count reward rather than a Saved
Seeds sink. **This is a design decision about a ceremony beat, so it is the owner's** — phase
1.1 measured it and changed nothing.

### The shared-skill sink is now unreachable, and the 2–5-petals-per-Turn claim is false

Same cause, different consequence, and it is **phase 4's tuning chair rather than an owner
decision** — the review named it in advance as the cumulative mint's honest cost.

The lifetime seed supply is now hard-bounded at `0.1 × sqrt(lifetime coins)` where veterancy
previously let it grow without limit. So:

- Maxing both shared skills on all nineteen flowers (**636,378 Saved Seeds**) needs
  **4.05 × 10¹³ lifetime coins** — ~1,000,000 days at ~40M/day. Doc 33's "months of headroom"
  is now geological; the sink is not deep, it is out of reach.
- A whole year of play at that income opens a pool of only **~12,000 seeds**.
- Doc 33's **"every Turn affords a similar 2–5 petals forever" is false at these constants**:
  the shipped tool measures **1 of 5** Turns in band where the old shape measured 4 of 7. The
  two exponents doc 33 says must stay matched — petal cost compounding at 1.25/level against
  the pouch's growth — are genuinely mismatched now.

**`mintK` is the knob** (or the petal ladder is), and doc 33 already says these two tune
together or not at all. Deliberately not touched here: the ruling was about the mint's
*shape*, re-pricing it wants playtest data, and phase 4 owns the calibration. Both numbers
above are recomputed rather than quoted, and a sim-test pins the 636,378 figure.

## Balance

### Orchid is a throughput trap — half fixed

Orchid at 4.89 net coins/second is worse than Marigold at 5.45, despite costing 47% more, because
grow time jumps 55 s → 90 s. It's the only backwards step in nineteen tiers.

**Softened 2026-08-14.** Orchid now carries the **Lantern** verb — it doubles its neighbours' gem
chance — so there is a reason to plant it that is not coins per second. The coin curve is still
backwards and still worth fixing; the seed is just no longer strictly pointless.

### Aurora Bloom and Celestial Lotus have identical throughput

Both 10.00 net/s. Celestial costs 33% more for the same rate — purely a convenience upgrade. Not
necessarily wrong, but not obviously intentional either.

## Correctness

### Cheat buttons ship to players — kept on purpose, for now

Settings contains "Grant 50 Gems", "Grant 1,000,000 Gold", and "Summon a Wonder Effect".
These were development/testing affordances and are live on the public site. Unlike reset, they have
no confirmation.

**Decided 2026-08-14: leave them, and reconfirmed by the owner 2026-08-26** — the playtest group is
still a small circle of friends. The audience is friends and buddies, their sessions are not being
treated as clean playtest data, and the buttons are the fastest way to reach high-currency states.
The game has no analytics either way, so a cheated run and a genuine one are already
indistinguishable.

**Revisit before any real external audience.** The likely fix is a `?dev=1` URL gate rather than
removal, so the affordance survives for development. Don't re-raise it unprompted before then.

*Where:* `ui-sheet.js` `renderSettings()`.

### "Garden Mastery" and "Bloom Mastery" are two different things one panel apart

The Almanac's stats section has always had a block headed **Garden Mastery** — growth speed, rarity
odds, harvest yield, Wonder bonus. Bloom Mastery tiers now appear a few blocks above it in the same
panel. A player scrolling the Almanac sees "Tier 13" and then "Garden Mastery" and will reasonably
assume they are related.

Copy fix, not a code fix: rename the stats block to something like "Garden Bonuses". Left alone
because panel copy is the owner's call.

*Where:* `ui-sheet.js` `renderBonuses()`.

### A creature that arrives with progress already banked shows a full growth bar at ★1

`checkCritters()` returns immediately after a creature moves in, so it cannot arrive **and** grow on
the same call. Its panel then reads e.g. `24 / 24 Rose to ★2` while it is still ★1, until the next
harvest catches it up.

**Unreachable in normal play, which is why it is here rather than fixed.** `checkCritters()` runs on
every harvest, so the arrival threshold is crossed at exactly the authored count. `discovered` cannot
jump while away either, because offline income is a closed-form rate and never replays harvests. It
takes a seeded save or a dev cheat to bank progress ahead of an arrival.

Fixing it means falling through to the growth loop after an arrival, which would let a creature
**arrive at ★3** — and arriving small is a designed beat, not an accident
([22-creatures.md](22-creatures.md#stars--a-creature-is-raised-not-found)). Worth deciding
deliberately rather than as a side effect.

### `harvestsThisSession` is not per session

It's saved and never reset, making it a lifetime counter. The name will mislead. Behaviour is
reasonable — progress toward the 10-harvest reputation drip surviving a reload is what a player would
want — so this is a naming problem.

### Absolute timestamps are trivially exploitable

Growth, boosters and the Wonder all use wall-clock epoch seconds. Moving the system clock forward
completes every plot and expires every booster. No anti-cheat exists.

Fine for a single-player local game. It would matter if leaderboards were ever added.

## Accessibility

- **No keyboard support and no focus styles.** Buttons are focusable but nothing is styled, and the
  game can't be played without a pointer.
- **No screen-reader narration of the garden.** Plot states are invisible to assistive tech.
- **Rarity is communicated by colour alone** — no shape or text alternative.
- **Contrast is unaudited.** White outlined text over bright scenery is the likeliest problem.

## Platform

### The potting bench has no UI, and its quests are paused

Everything in [21-potting-bench.md](21-potting-bench.md) — the chain, the merge, the basket, the
banking escape hatch — is built in `game.js` and reachable from nowhere. No `ui*.js` file calls
`benchMergeOnce()`, `benchPlace()` or `benchBank()`, so there is no board to drag on and the
`merge` and `bank` quest tracks can never tick.

`q_tea`, `q_perfume` and `q_craft_2` are `paused: true` as of 2026-08-19 for exactly that reason —
handed out, they held one of three active slots forever and jammed the quest strip. Three live
stand-ins carry their 98 reputation. **This is the placeholder to remove when the bench ships a
screen**, along with the paused flags and the stand-ins.

### Safari blocks localStorage on `file://`

Saves silently don't persist when the game is opened directly as a file in Safari. `setItem` is
wrapped in try/catch so it degrades to a non-persistent session rather than crashing. Chrome is
fine. Documented in the README; serving over HTTP avoids it.

### Pages deployments share a localStorage origin

Everything under `jonishua.github.io` shares storage. Not a problem today, but a second game
published to the same account would need a distinct key prefix.

### ~~An installed iOS app's window is shorter than the screen~~ — fixed, and never a layout bug

**Fixed 2026-08-20** by changing `apple-mobile-web-app-status-bar-style` from `black-translucent`
to `default`. Translucent sizes the window to the screen minus the status bar and pins it to the
top; the strip left over at the bottom is outside the window and unreachable from CSS. Four rounds
of layout work went at this from inside the page. The one that helped was cosmetic — matching the
strip's colour so it read as lawn.

Everything from those rounds stays, because it is all independently right: the page background
follows the bottom of the screen, nothing draws a dark edge along the join, and `--app-h` never
stretches the game past the window. **If the band ever comes back, read Developer tools → Screen
first** — `window` shorter than `screen` by exactly the top inset is this bug, not a measurement
problem.

### An installed PWA's real height still cannot be read from CSS alone

Two readings of the window agree on it — `inset: 0` on an untransformed `.game`, plus `--app-h` as
a `min-height` floor from the larger of `innerHeight` and `clientHeight`. Both describe the window,
which is the only thing the page may size itself to; see the entry above for what happened when
`screen` was trusted instead.

What is no longer true is that a shortfall *looks* like a bug. The line across the bottom was never
the missing pixels — it was the **closed bottom sheet's box-shadow** reaching up into the lawn and
being clipped square by `.game`, with the vignette and the page's mismatched stripes adding to it.
All three are gone, and a game forced 80px short now renders *pixel-identical* green on both sides
of the join. Hold any future change to that bar: decode the screenshot and compare RGB, rather than
looking at it.

The other half is still open in a way a photograph cannot settle: a window can end short because the
browser under-reports a full-screen window, or because the window really does stop above the home
indicator with iOS painting the strip below. `sizeViewport()` tells them apart by the bottom inset
and only stretches in the first case. **Read the screen report in Developer tools on the handset**
before touching any of this.

Related and unfixable from the preview: **`env(safe-area-inset-*)` is always `0` in a desktop
browser**, so no amount of local testing exercises the notched-phone layout. The four `:root`
variables (`--sat`/`--sar`/`--sab`/`--sal`) exist so it can be simulated by overriding them —
do that before believing a layout change is safe on a phone.

### Haptics are absent on iOS Safari

`navigator.vibrate` is unimplemented. Calls are wrapped in try/catch. iPhone players get no
haptic feedback and there's no alternative.

### `Icons.get()` falls back silently, and it hid two missing icons

`Icons.get(name)` returns `LIB.sparkle` for an unknown name, so a typo renders a **plausible wrong
glyph** rather than failing. Two icons — `gift` and `moon` — were referenced by creature traits and
pairs for a whole session before anyone noticed they did not exist; the memento chip and Luna's trait
were both quietly drawing a sparkle.

**Fixed 2026-08-16.** Both icons were added, `Icons.has()` was introduced for an exact check, and the
suite now asserts every icon named by `CREATURE_TRAITS`, `CREATURE_PAIRS`, `BENCH`, `DATA.upgrades`
and `DATA.decor` really exists. The fallback itself is left in place — a missing glyph should not
crash a panel — but it can no longer hide.

**Note for whoever writes that kind of test next:** the obvious check —
`Icons.get(name) !== Icons.get('nonsense')` — is wrong, because anything legitimately using `sparkle`
is then indistinguishable from a mistake. It reported three false failures before `has()` existed.

## Visual standard

The Garden Standard audit of 2026-08-26 measured the drift off `style.css` at 8393738. Seven items
were fixed that day — see [10-decision-log.md](10-decision-log.md) — and the enforced values are in
[05-art-direction.md](05-art-direction.md). These are what it found and nobody has fixed yet.

### The radius and border sweep is deferred, deliberately

`style.css` still carries **16 distinct corner radii** in a system documented as having three
(12 / 18 / 26, plus `999px` and `50%`), and **11 distinct border widths** from `1.5px` to `11px` in
a system whose rule is "3px ink on everything". `border-radius:14px` alone appears 13 times.

**Left out of the 2026-08-26 pass on purpose.** Every other item in that pass was a material change
that could be verified by eye against the garden. Radius and border are *geometry*: changing them
moves layout, changes how a `:active` travel lines up against its lip, and touches nearly every
component at once — so it is its own pass, with its own screenshots, and it should not be bundled
with a colour change where a regression would be impossible to bisect.

When it happens, do it in the order the ladder is used, not file order: chips and small badges to 12,
cards / plots / dock to 18, the board to 26, and everything already at `999px` or `50%` left alone.

### Raw hex where a token exists

`#2c1a10` is written out **32 times** instead of `var(--ink)`, and `style.css` holds **147 distinct
hex values** against the 22 the palette names. Nobody chose most of them; they accreted. The ink can
never be adjusted globally while this is true, which undoes the reason for having tokens at all.

### `.card-desc` is the last `opacity: .7` description text

`.seed-desc`, `.cp-about` and `.cp-card-v` all use `var(--ink-soft)` at full opacity now.
`.card-desc` still uses opacity, which drags the text toward whatever surface is behind it — so it
gets washier as the panel gets lighter, and it is the first thing to fail on a phone in sunlight.
One-line fix, left because nothing else in the album was being touched.

*Where:* `style.css`, `.card-desc`.

### `.quest-card` has the seed row's material but not its contact shadow

Same 3px ink, same gradient, same `0 4px 0 var(--ink-2)` lip. `.seed-row` gained
`0 8px 14px rgba(44,26,16,.24)` on 2026-08-26 and `.quest-card` did not, so two rows built from the
same recipe now sit at different heights above the paper. Give it the same shadow next time the
quest panel is open on the bench.

### Some creature-panel CSS is unreachable

`.cp-head` (with `.cp-head.asleep`), `.cp-who` and `.cp-cards` are styled but no `ui-*.js` emits
them, and the `.bad` modifier on `.cp-card` is never applied either. `renderCritter()` builds
`.cp-plate`, `.cp-skill`, `.cp-card`, `.cp-said`, `.cp-about` and the fuel meter, and nothing else.

They were given the 2026-08-26 lip and repalette along with the live rules rather than deleted,
because the last "delete the unused thing" call in this repo was wrong by merge time — the `petal`
icon was correctly dead when the polish branch was cut and load-bearing on `main` before the merge
landed. Confirm against **both** branches, and against data-driven references, before removing any
of it.

### Nothing enforces any of this

Every rule in [05-art-direction.md](05-art-direction.md) is checkable by a script except taste: a
raw hex outside `:root`, a radius outside the allowed set, a `box-shadow` with zero blur and an
`rgba()` colour, an undeclared custom property. A pre-commit check on those four would have caught
every item the 2026-08-26 audit counted, including `--ink-soft`, which was undefined long enough to
be used 23 times. **The rules did not fail because anyone disagreed with them. They failed because
nothing noticed.** This is the single highest-leverage item on this page.

## Structural

### ~~`ui.js` is doing too much~~ — split 2026-08-16

It had reached 2,309 lines. All three named seams are out: the bottom sheet into `ui-sheet.js`, the
scenery and day/night code into `ui-scenery.js`, and the event wiring into `ui-events.js`, over a
shared `UI` global declared by `ui-shared.js`. `ui.js` is about 700 lines and keeps the garden, the
talking flower, the HUD, the rail, input, the frame loop and `boot()`. See
[02-architecture.md](02-architecture.md#the-shared-ui-surface).

Kept here rather than deleted because one dependency is worth knowing before adding to the UI:
**`ui-events.js` reaches into `ui.js` for twelve things** — `toast`, `showBanner`, `buildGarden`,
`say`, `faceReact`, `popWallet`, `renderQuestStrip`, `renderRail`, `hideCoach`, `noteActivity`,
`plotEls` and `flowerBtn`. That is the widest edge in the UI and the one most likely to grow. If it
keeps growing, the answer is to split the garden out of `ui.js`, not to widen `UI` further.

### Sheet panels use `innerHTML` with interpolation

All interpolated content currently comes from `data.js` and is trusted, so there's no live
vulnerability. But there's no escaping helper, so the first time player-supplied text reaches a
panel it will be an injection. Add escaping before adding any naming or text-entry feature.

*Where:* `ui-sheet.js`.

### Four sim-tests have been flaky, and the class of bug keeps recurring

All fixed. The first two on 2026-08-14 (**4 of 50 runs failed** beforehand), the second two on
2026-08-15. The suite now runs clean 40 times out of 40.

- **`gems move by the milestone`** asserted an exact gem count while the harvest that triggered it
  rolled its own independent **5% gem chance**. `Math.random` is now pinned across the block.
- **`four hives lift yield by about 32%`** averaged 4,000 random harvests and allowed ±0.06, which
  put the 2%-Legendary tail inside the tolerance (observed ratio 1.253 against a 1.26 floor). It now
  pins the roll and asserts **exact payouts** for one harvest instead of a sampled mean — which also
  removed the mastery drift, since mastery climbs as a loop proceeds and would otherwise skew it.

- **The combo block** asserted exact credit deltas from `tapFlower()`, and a tap can spark a Wonder
  (0.15%) that triples the payout. Two of its assertions failed about one run in twenty-five.
- **`a lantern roughly doubles gem drops next door`** sampled a Daisy, whose base gem chance fell
  from 5% to 0.6% when the faucet was fixed. The effect was still real; the instrument had silently
  become eight times too small. It now measures an Eternal Crown at 39%.

**The general rule:** any assertion touching a harvest **or a tap** has to pin `Math.random`, because
both pay rarity, gems, mastery tiers and Wonder rolls from the same call. Prefer asserting an exact
value on one harvest over a tolerance on a sampled mean — a statistical test that passes
forty-nine times in fifty reads as a real regression the one time it doesn't, and the person who
hits it will go looking for a balance bug that isn't there.

**And re-check your instruments after an economy change.** The lantern flake was not a bad test when
it was written; a faucet fix eight times smaller made it one. A sampled test is coupled to whatever
number its rate is built on.

**Also clear the ladder.** Any loop of many harvests climbs Bloom Mastery as it goes, so a test
measuring some *other* multiplier must call `clearMastery()` — and prefer a single harvest, where
the question does not arise.

### No automated tests for anything above the simulation

`tools/sim-test.js` runs the real `game.js` headlessly and now covers 1,149 assertions over the
economy, progression, saves and mastery. Everything above that line — the six `ui-*` files,
layout, the sheet, FX — is verified by hand against the checklist in
[09-conventions.md](09-conventions.md). That is the right split for a prototype, but a UI
regression has no net under it.

**This bit during the `ui.js` split.** The suite stays green through a change that breaks the plant
picker, because it never loads a DOM. A UI change has to be played, panel by panel, or it is not
checked at all.

## Documentation

### Seven stale claims in `docs/`, found by the 2026-08-26 design audit

Listed in full in [27-design-audit.md](27-design-audit.md#stale-documentation-found-during-the-audit).
Left unfixed on purpose: several of them sit in sections the pending design decisions will rewrite
anyway, and correcting a paragraph that is about to be replaced is churn. The two that mislead
hardest and should be fixed regardless of what gets decided:

- **[13-order-system.md](13-order-system.md) opens "Status: specification, not built."** The Garden
  Stand shipped 2026-08-25. A cold session reading top-down will believe the order system does not
  exist.
- **[12-meta-layer-design.md](12-meta-layer-design.md) locked decisions** still specify a flat
  eight-hour offline cap (superseded by the two-axis 25% / 4h model) and "storage caps on raw
  materials, generous and upgradeable" — which has never existed in any build.

**The pattern is the point.** Status lines and "locked decisions" go stale faster than body text,
because a later session adds a new section rather than retracting an old one. Body text usually
gets its retraction; headers rarely do.

### Nothing enforces a design rule the way `sim-test.js` enforces an economy rule

The suite holds the economy's invariants beautifully — never ask for the unproducible, delivering
beats selling, hives work unstaffed, no pair touches the yield pool. Nothing holds the design ones,
and every one of them is script-checkable: the place taxonomy (no two adjacent places of the same
type), the goods catalog's one-line test (every good has a `line` field), "no two adjacent
unlockables share an effect category", and the currency policy's "adding anything to this list
requires removing something else."

Same shape as [the visual standard](#nothing-enforces-any-of-this), same cause, and the same fix
would work: a check that fails, rather than a rule everyone agrees with and nobody notices breaking.
