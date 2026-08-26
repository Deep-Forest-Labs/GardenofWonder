# Known Issues and Rough Edges

Things that are wrong, unfinished, or surprising, recorded so nobody rediscovers them from scratch.
Nothing here is a crash — the game is stable. These are correctness, balance and polish gaps.

If you fix one, delete it from this file in the same commit.

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

**Decided 2026-08-14: leave them.** The audience is friends and buddies, their sessions are not being
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

`tools/sim-test.js` runs the real `game.js` headlessly and now covers 837 assertions over the
economy, progression, saves and mastery. Everything above that line — the six `ui-*` files,
layout, the sheet, FX — is verified by hand against the checklist in
[09-conventions.md](09-conventions.md). That is the right split for a prototype, but a UI
regression has no net under it.

**This bit during the `ui.js` split.** The suite stays green through a change that breaks the plant
picker, because it never loads a DOM. A UI change has to be played, panel by panel, or it is not
checked at all.
