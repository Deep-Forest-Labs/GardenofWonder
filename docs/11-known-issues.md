# Known Issues and Rough Edges

Things that are wrong, unfinished, or surprising, recorded so nobody rediscovers them from scratch.
Nothing here is a crash — the game is stable. These are correctness, balance and polish gaps.

If you fix one, delete it from this file in the same commit.

## The live web build loses saves after a week on iOS Safari (found 2026-08-30, strategy pass)

**Safari's tracking prevention deletes all script-writeable storage — localStorage, IndexedDB,
sessionStorage, and service worker registrations and cache — after 7 days of no interaction with the
site.** The only exemption is a site the player added to their Home Screen: *"The first-party domain
of home screen web applications is exempt from ITP's 7-day cap on all script-writeable storage"*
([WebKit](https://webkit.org/tracking-prevention/)).

**So an iOS Safari playtester who did not install the game and takes a week off loses their entire
garden, silently.** For a game whose whole promise is that the garden is still there when you come
back, this is the worst possible failure, and the review evidence across this lane says players blame
the developer rather than the browser — save-data loss is the #1 one-star driver for the category
leader ([38-market-refresh.md](38-market-refresh.md)).

Three things follow, none of them done:

- **The friend playtest group is exposed to this right now.** Anyone on iPhone who opened the link in
  Safari without adding it to their Home Screen is on a seven-day clock. Worth telling them.
- **iOS 26 made the install easier to ask for** — Safari 26.0 removed installability requirements
  entirely, "there are now zero requirements for 'installability' in Safari" — but there is still **no
  programmatic install prompt** on iOS (`BeforeInstallPromptEvent` is unsupported on Safari and
  Firefox and is non-standard). The player has to be taught to use Share → Add to Home Screen.
- **Cloud save, or a very hard install prompt, is a precondition for the web build going wide**, per
  the ruling in [39-growth-and-launch.md](39-growth-and-launch.md).

Two related facts recorded so nobody plans around the wrong ones: the **EU restriction on Home Screen
web apps was reversed before iOS 17.4 shipped** — there is no EU carve-out — and **Background Sync
does not exist in Safari at all** and is non-standard, so offline catch-up must run on next foreground
open, which is what the game already does.

## Two documentation contradictions the strategy pass hit (2026-08-30)

Not game bugs, but they cost a research agent a whole wrong answer, so they are recorded here until
someone reconciles them.

- **Unity or Capacitor?** [37-monetization.md](37-monetization.md) gates every dollar of revenue on
  "the Unity shell" and repeats it as gate 1. [23-installable-pwa.md](23-installable-pwa.md) says the
  store wrapper is "a separate wrapper (Capacitor)". Docs 19 and 20 assume a Unity asset pipeline.
  The cost research read doc 23, concluded the project owes Unity nothing, and priced the port at
  zero. **Whoever knows the answer should write it in one place.** Note that the answer matters: the
  art direction is implemented in `style.css`, so a Unity port means re-authoring the moat in a
  language with no CSS, and that is the largest unpriced line in the project.
- **The service worker is network-first by design**, which is correct for a no-build-step web game and
  is documented in `sw.js`'s own header. But a Capacitor-wrapped build that fetches `game.js` on every
  launch is close to Apple guideline 2.5.2 ("may not download, install, or execute code which
  introduces or changes features or functionality of the app"), and doc 37's promise that caps are
  "all remote-tunable" makes it deliberate rather than incidental, because the tunable numbers live in
  `data.js`, which is JavaScript rather than JSON. **Cheap to fix if decided now (bundle locally, move
  the knobs to fetched JSON, flip the wrapped build to cache-first), expensive to discover in review.**
  Moot if the answer to the question above is Unity.

## What the Sky Pass's motion stage knowingly left (2026-08-30, phase 3.9)

**Nothing has integrated, and that is the gate working.** `tools/sky-spike.html` is up; no sky
is in the game, `DATA.weatherStage` does not exist yet, and neither engine nudge — `rainGrowth`
or the aurora's night window — is built. All of it waits on the owner approving each sky's feel.

Four things the stage carries deliberately, so nobody files them as bugs:

- **The bottom 44px of the lawn stays bright under a dark sky.** Every full-frame tint is masked
  out over the last stretch, because iOS paints the strip below a short window with the flat lawn
  colour and a tint running to the edge draws the join three rounds of layout work went into
  hiding. The same compromise the season tint already makes. Load-bearing; do not "fix" it.
- **`rain.wash` and `storm.wash` start above the live `.scenery::after` opacities** (0.46/0.68
  against 0.30/0.52). The spike's wash is its own gradient layer rather than a flat tint, so the
  two numbers are not comparable and the live values are not the target. Whatever the owner
  lands on is the number.
- **The beds run on a second `AudioContext`.** `Sound` exports no context and no bus, so the
  spike cannot reach in. Written in the shape it will take inside `audio.js`, so the build is a
  transcription — but on the stage there really are two graphs, and the stage's own music is the
  arrangement rather than `Sound`'s pad.
- **`stageHoldSeconds` is a stage control, not a value.** It sets how long the stage sits in the
  transform, and it deliberately never reaches `data.js`. Same for the hour and the year-ripening
  sliders: those are viewing conditions.

---

## What phase 3.8 knowingly left (2026-08-30)

**The placeholder gate on swipe-down was not built, and the idea is dropped rather than deferred.**
Ruling 4 gave swipe-down to a hedge-gate placeholder — and swipe-down is the Wild Meadow's *only*
door in the game. Building it would have stranded the room, its hives, its keepers and four quests
worth 114 of the ladder's 777 reputation, on top of the strip-jam trap. **The owner ruled mid-round
that the meadow keeps the direction and the gate waits for a round that gives it somewhere else to
live.** Recorded here so the next agent does not re-propose it as an easy win: the blocker is not the
gate, it is that the meadow needs a second door first.

**The Cards pass raised four layout questions instead of answering them.** The ruling was look, not
layout, and each of these needs the owner:

1. **The card face's internal composition.** Art and name are centred, so the lower third of every
   face is empty. Doc 05's check 4 would put the name in a capsule at the bottom — which turns the
   face from "stacked centre" into "art above, name-plate below", a real internal layout change to a
   102×136px cell.
2. **An unowned card is an empty box.** The honest fix is a silhouette or a card-back pattern, which
   is new content rather than a look change.
3. **The grid gaps.** `.card-grid9` is 8px and `.set-grid` 9px; a 4px lip with its contact shadow
   wants ~12px of clearance below each cell, and raising the gap changes how many rows fit above the
   fold.
4. **Whether Mythical should have a colour of its own.** It wears legendary gold said twice, because
   the card ladder has five rungs where the garden has four and `--epic` purple already means one rung
   *down*. Frozen, a Legendary and a Mythical differ by 1px of ring and 14px of glow blur.

**Fall's board is ~23px higher than the garden's**, where it used to sit ~12px lower, because the bed
chip's strip is reserved out of the frame. On an SE-class screen the board also gives up ~45px. Both
are the price of Fall's one rule being readable, and both are deliberate — see
[08-ui-and-layout.md](08-ui-and-layout.md#the-vertical-ladder).

**~~Three progress bars still compress their gradient instead of revealing it.~~** — FIXED
2026-08-30, and there were two. `.q-bar i` and `.almanac-meter i` now clip a full-width fill the way
the album's bars do, so a part-full bar shows its green end instead of a squeezed copy of the whole
ramp. Measured before and after at 11/25: the quest bar used to reach full gold at 44%.

**The fill goes out as `--fill`, not `--p`.** `renderQuest()` writes `--p` as a *unitless ratio* on
`.q-pip-wrap` one line above, and `.turn-fill::before` reads `--p` as a *percentage*; the album
reads it as a percentage too. They are siblings today so nothing inherits across, but
`calc(100% - 0.44)` is invalid and an invalid `clip-path` **shows the whole bar**, so the failure
mode of that collision is a meter that reads 100% when it is not. One name carrying two units inside
one button is how that stops being hypothetical.

**The third bar was never live.** `.mastery-bar b`, and the `.almanac-row-goal` block it sits in, are
emitted by no `ui-*.js` file — the mastery ladder is retired and the petal tracks replaced its goal
line. It was left exactly as it was: giving dead code a `--fill` contract that nothing satisfies
would hand whoever revives it an empty bar and no clue why. Dead CSS, filed as dead CSS.

**`.critter-grow i` also scales, and it is a different bug.** It is a solid `#8ce99a` with no ramp,
so its colour has nothing to get wrong; what `scaleX()` distorts is the 2px ink border and the 999px
cap — at 20% the vertical strokes thin to 0.4px while the horizontal ones stay 2px, in an art
direction whose whole grammar is an even contour. The album's line will not fix it: the `<i>` **is**
the bar and has no track behind it, so clipping would cut away its own right border and leave a
three-sided stub. The honest fix is giving it a track, which is new markup and a new rule.

**The season coach mark stands over the board at 390×667.** In Summer it grazes the bottom of the
planter by 22px; in Fall it flips to the stacked shape, clears the bed chip by 6px and then covers a
corner of the bed, with its arrow stopping short of the SUMMER tab. On a screen that short there is
no clear gap at all: the mark yields to the band and to Fall's own rule, which are the two things
with content the player needs, and the board is what is left. It is one-shot, `pointer-events:none`,
and in Fall the bed it covers is empty on the visit where it appears. Accepted; if it ever needs
solving, the honest fix is a smaller mark on `max-height:700px`, not another clamp.

**A swipe begun on the What's New dialog navigates the world underneath it.** `noSwipe` in `ui.js`
lists `.sheet` and `.scrim` but not `#news`, so a drag across the announcement card can enter the
Hollow behind it. Found during this round's review and confirmed byte-identical at `ba5ddbf` — it
predates the round and the direction flip neither caused nor widened it. One entry in the `noSwipe`
string fixes it.

**At 390×667 the pouch chip covers the top ~6px of the Turn button's icon.** `.seedchip{top:-9px}`
against the short-screen `.dock-btn{height:50px}`. Also pre-existing; the glint does not touch the
chip, this is the chip touching the icon.

## What phase 3.7 knowingly left (2026-08-30)

**The pantry survives the Turn, so a fresh board of orders meets last year's stockpile.**
`turnYear()` regenerates all three slots and never touches `state.flowers` — and nothing else in the
game empties that bag either, so it grows for the life of a save. **30.0% of a Turn-heavy player's
entire order income lands in the first sixty seconds of a new year** (401 deliveries of 1,304;
5.7% for a player who Turns four times). `state.apiary.honey` has the identical hole and four goods
are honey goods, though it is unmeasured because the play model never builds a hive.

**Ruled and specced 2026-08-30, not built**: last year's harvest becomes preserved — craftable,
sellable, and no longer something a customer will take. [41-the-preserve.md](41-the-preserve.md)
carries the spec, the measurement, the test bill, and the three things the change knowingly costs.
**This is also the explanation for the entry below**, which was diagnosed wrongly at first.

**`year-sim`'s cheap-Turn verdict no longer decides the same way twice.** Raising order gold to the
ruled band moved the two shapes it compares close enough together that its single unseeded run per
strategy cannot separate them: five runs at 30/200/210/225 came back **OK, OK, OK, FAIL, FAIL**, and
`casual`'s own day-10 lifetime coins ranged **43M to 142M** across those runs while `smart`'s sat
tight at 70–86M. Before the raise the margin was a stable 1.5× (22.7M against 15.3M) and the tool
exited 0 every time.

**The property the mint actually guarantees is intact in every run.** `smart` never out-mints
`casual` on Saved Seeds — 1,061 against 1,258 and 1,024 against 1,055 in the two failing runs — so
the cumulative mint is still split-neutral by construction, which is what bill item 17 was written
to protect. What `smart` wins on is *lifetime gold*.

**The first diagnosis of that gold win was wrong, and is corrected here rather than deleted.** It
blamed `smart` dumping its doomed wallet into Fall beds before each Turn. Fall-dumping is good play
— the correct response to gold that is about to vanish, and the investment feeling Fall exists for —
and gold at the Turn cannot be the mechanism at all, because the mint reads what a year *earned* and
never what is left in the wallet. The actual amplifier is the pantry entry above. What a fast cadence
genuinely *costs* is the badge wipe: fifty-three Turns is fifty-three rebuilds of the automation,
which is why a four-Turn player normally wins on lifetime gold and why blocking the pantry catapult
flips the result back.

**Ruled 2026-08-30: seed it and run it paired**, rather than moderating the multipliers. Moderating
would also have flipped the verdict and would have undone the ruling that raised them. Seeding is the
load-bearing half — the same player can then be run on the same dice against two economies, so the
difference is the change rather than the weather. It is the job *before* the Preserve, because the
Preserve is the first change worth a real before-and-after. Note also that
`tools/order-gold.js` copied `tools/year-sim.js`'s play model verbatim and the pantry probe made a
third copy: **three copies of the casual player exist**, and pulling one `tools/play-model.js` out of
them is part of the same job.

**The spread INSIDE a tier is far wider than the spread between tiers, and no multiplier can close
it.** At the ruled values a tier-4 board pays anywhere from 4 seconds to six hours of the player's
rate, p25 to p75 spanning 20×–200×. Two structural causes, both in the engine rather than in the
multipliers:

- **`standFloorUnit()` is pinned to Daisy for ever.** A wild line prices off `Math.min` over the
  whole unlocked pool, Daisy is free and never leaves it, so Garden Handful's base value is the same
  on day 30 as on day 0. It is roughly an eighth of every board.
- **`standBuildOrder()` draws named blooms from the whole unlocked pool.** A tier-4 Posy can ask for
  two Daisies or three Auroras — a 260× spread inside one good at one tier.

Fixing either is an engine change with its own test bill, and the ruling was explicitly data-only.
The cheapest first move is pricing a wild line off the pool's median rather than its minimum.

**A board that was already sitting in a save shows the old price until the slot refills.**
`order.coins` is authored at generation, and `standDeliver()` pays `Math.max(order.coins, worth)` —
so an order written before the raise pays the NEW rate and displays the OLD one for up to one
`STAND.refill` (100s). Nobody is underpaid and it clears itself; it is recorded so a screenshot of
it is not diagnosed as a bug. The announcement's reset makes it moot for the playtest group.

**Three buttons still cost something and cannot say what you now have, and all three are "no
room".** The garden's **plot unlock badge** and the meadow's **cell badge** are ~60px and already
carry either a gate label (`Turn 1`, `Lv 3`) or a price; the **season edge tabs** are 38px and say
which Turn opens them and nothing about what is behind. The number that is missing under the letter
of the rule is how many plots or cells you already own, and that is visible on the board itself. The
**POWER-UP button** is the fourth: it spends one of a rotating inventory of boosters and shows a
glyph and a count, so the same button spends a different thing on different taps. Its name, effect
and duration are in its accessible label now, but a visible caption needs the round button to give
up glyph size and every booster name is two words, so it would be a truncation. Owner's call.

**Two meadow numbers still drift on a clock nobody notices.** The Keepers panel's bench chip and the
build sheet's hive projection both divide by `Game.keeperSpeed()`, which falls when a keeper's food
clock runs out and it falls asleep — a transition with no event behind it (`critterAsleep` is a
computed predicate, not a flag). `syncAfford()` now runs on the 0.6s tick for any open sheet, which
covers every surface that carries a `data-*` attribute, but the build sheet's rows carry
`data-build` and the Keepers panel's chip is prose. Measured: a keeper's lift stepping 8% → 4% → 0%
on the clock alone with the panel open and nothing redrawing. Accepted: both panels are snapshots
you open to make a decision, and the drift is downward — you are never shown more than you have.
The fix, if the owner wants it, is a `data-*` hook on those rows so `syncAfford()` can reach them.

**In landscape the gem skip chip hangs off its plot.** It did before this pass (34px chip on a 31px
tile) and the wait it now carries makes it worse. Landscape is not a supported orientation for this
game and nothing else in the phase touches it; the chip is clamped to `white-space: nowrap` and
`max-width` so it stays one line rather than wrapping into the neighbouring plot.

**The announcement art is a JPEG carrying a `.png` extension**, 692 KB at 1152×1728. Browsers sniff
the content and render it, and the service worker stores whatever the server sends, so it works —
but the file is heavier than a phone dialog needs and its name does not describe it. Owner-supplied
art is the owner's to re-export; flagged rather than re-encoded.

## What phase 3.6 knowingly left (2026-08-30)

**The discover quest leads the goal strip the moment it is dealt, and cannot be advanced.** This is
the backfill and the nearest-to-done rule meeting each other: `q_discover_5` arrives at **2/5 =
0.40** while `q_hive_1` and `q_honey_3` sit at 0.00, so it is genuinely the closest to done — and on
a fresh save the third species is behind Bluebell's 150,000 wall, so nothing the player does moves
it. It is **no longer a permanent jam**: any quest that finishes jumps the strip from anywhere, and
claiming re-opens the ranking. But between claims the strip shows a goal you cannot act on. Both
halves are the owner's ruling working as specified, so neither was overridden. **The two cheapest
fixes are already on the menu above**: re-cost the first rung to `discover 3`, reachable at the first
unlock, which turns the jam into a signpost for the wall itself; or point the track at
`state.year.stats.speciesSeen`, which makes breadth a seasonal goal instead of a lifetime one.

**Pausing the Stand's standing also holds the Stand at a lower tier, which costs real gold.**
`standTier()` reads `state.rep`, and the tier multiplier runs 30 → 225 — so the pause does not
only stop levels, it slows the coin curve that feeds the Turn meter. Measured with `year-sim`,
casual, three runs each to day 14: **paused sits tight at ~30–32M lifetime; live ranges ~32–58M**,
much wider and higher. `year-sim` exits 0 either way and no knob moved, but this is worth weighing
when slice D's timing is decided — and worth remembering while judging petal pacing, because a
slower gold curve is a slower Turn.

**A +24h warp puts every creature exactly to sleep.** `FOOD_CAP_HOURS` and `ARRIVAL_AWAKE_HOURS` are
both 24, so one full-day warp empties every food clock at once — anyone judging the HUD's pet band
after a day-long warp is judging four sleeping faces. Not a bug (that is what a day without feeding
does) but it defeats the review it was built for, so the two-minute check says to warp **+8 hours**
when the band is what you are looking at, or to tap *Feed everyone* first.

## Two accepted seams in the time-warp (2026-08-30, phase 3.6)

**A called sky is voided for the rolls it pulled.** `callWeather()` drags every unspent `mutateAt`
into its window; `Dev.warp()` then winds those rolls back but leaves `state.weatherCall` alone,
because a bought sky is a running purchase and the warp's whole ruling is that it must not destroy
one. So the pulled rolls land before `call.from` and `weatherAt()` resolves them against the real
historical sky instead. Accepted: a gem-bought sky and a warp in the same minute is a dev-panel
situation, and the alternatives are worse — ending the call early destroys the purchase, and
widening its window backwards makes a bought sky retroactively true.

**A warp with a drone earns into the mint.** `Dev.warp()` calls `credit()` nowhere, but `tick(0)`
runs `processAutoHarvest()`, and a warped plot really is ripe — so the drone takes one plot per warp
and that harvest earns on both ledgers. This is the same precedent `Dev.simulateAway()` already sets
(`reconcile()` pays offline income unflagged, and a sim-test asserts it does). It means repeated
warping is a Saved Seeds faucet for anyone holding the panel open. Testers are friends and the
pacing tool is `year-sim`, so this is accepted for now; revisit with the dev buttons themselves
before any external audience.

## The meadow's only door is a gesture nobody can see (2026-08-30, phase 3.5)

**Accepted, not a bug — but the thing to watch in the first playtest.** The owner ruled at the
phase-3.5 gate that the Hollow and the meadow lose their labelled door graphics and are reached by
the vertical swipe. **Re-pointed 2026-08-30 (phase 3.8): swipe UP goes down to the Hollow, swipe
DOWN goes out to the meadow** — the finger drags the world rather than pointing at the room.

The Hollow survives that easily — a player who never swipes still sees its creatures standing in the
garden, and the Feed panel and Loadout are reachable the moment they do. **The meadow has nothing of
the kind.** There is no button, no tab and no label pointing at it, and it holds the hives, the
keepers, the Honey Shelf and four quests worth **114 of the ladder's 777 reputation**
(`q_hive_1` 14, `q_honey_3` 16, `q_honey_8` 36, `q_honey_15` 48).

Its whole discoverability is one line from the flower, fired once on the first idle after the
tutorial and gated by a new `seen.meadow` save flag: *"Swipe down for the wild meadow."* The flag
has **no load-time backfill by design**, so a save that already spent the line will not hear the new
direction — that is the cost of re-pointing the axis and it is accepted, because the meadow's exit
pill names the way back the moment a player is inside.

**And one dot has nowhere to live.** `updateDockDots()` put a badge on the World button whenever
jars were waiting in the meadow; the World button is gone and nothing has replaced that signal, so a
full hive now waits silently. If the meadow reads as forgotten in play, the cheapest fixes in order
are: give the meadow's swipe an edge tab of its own on the bottom edge (the season tabs' pattern,
already built), or re-home the jar dot onto something always visible.

## What the phase-3.5 gauntlet left open (2026-08-30)

Fifty-two findings confirmed; the blocker and every high is fixed. These are the ones knowingly left.

- **Four tending creatures overlap by 30px each, and the outermost tucks 5px behind the UPGRADE
  pill.** There is no arrangement that avoids it: the band leaves 177px of clear lane between the two
  floating buttons and four creatures need 268. They are trimmed from 19vw to 17vw and stacked by
  position (`node.style.zIndex = spot`) so the occlusion reads left-behind-right instead of by
  arrival order, which is the readable version of a crowd. **A fifth Habitat slot breaks this
  first.**
- **The reserved rail costs a 700px-tall phone 31px of board**, permanently, so the board no longer
  jumps 9% when a power-up starts. Stability over size, the same call the HUD made.
- **The sheet's breakout art is clipped in short landscape** — about 45% of the portrait is off the
  top. Pre-existing; landscape is not a supported orientation for this game and nothing else in the
  phase touches it.
- **`Game.sell()`'s honey and wax branches are now provably unreachable** with the `stores` sheet
  deleted. Harmless, and sweeping `game.js` for them is a separate change with its own test bill.

## Two dead surfaces, found by the phase-3.5 dock mapping (2026-08-30)

Both pre-date this phase. They are recorded rather than fixed because the dock rebuild must not
"preserve" a route that was never live.

### ~~The `stores` sheet is opened by nothing~~ — DELETED 2026-08-30

Sheet mode `stores` — the honey and beeswax pantry with a "Sell all" button per line — is fully
written and registered in **both** the titles map and the render map in `ui-sheet.js`, and a
repo-wide search for `openSheet(` finds **no caller**. The meadow's dock is Collect / Move / Keepers
/ Shelf; nothing opens Stores. Either wire it to a door or delete it, as its own decision.

### ~~A card cell in the album does nothing~~ — FIXED 2026-08-30

The nine cells are `<div>`s now. A card in a set is a thing you look at, and nine controls that do
nothing is nine controls too many behind a dock button that gets far more traffic than a HUD star.

## The Garden Year — phase 1's deliberate seams (2026-08-29)

The engine shipped with no UI, so several truths are temporarily invisible or mislabelled.
All of these resolve in phases 2–3; they are listed so nobody "fixes" them early or is
surprised on a fresh save.

### ~~Phase 3 shipped the strip and Fall, and DELIBERATELY did not retire the map~~ — DONE 2026-08-30 (phase 3.5)

The map, `overworld.js`, `ui-map.js`, the camera, the World dock button and the swipe-down pull-back
are all deleted, in the order the rail required: **the meadow's way in shipped first, on its own,
while the map still worked.** The Stand is the Orders & Quests button; the Wild Meadow is the swipe
up; the Hollow is the swipe down. The four meadow quests and their 114 reputation are reachable
again — through a gesture rather than a button, which is its own entry above. (The two directions
swapped in phase 3.8: the meadow is the swipe **down**, the Hollow the swipe **up**.)

**What is still open from phase 3, unchanged:**

1. **Winter and Spring have gates but no gardens** (slices C and E). Their gate reads *"Opens at
   Turn N"* while the turn is the binding gate and *"Still growing in"* once it has passed, so it
   never tells a Turn-5 player that Winter opens at Turn 3.
2. **Collecting a full Fall bed is eight taps.** `fallHarvest(idx)` is per plot, so the bed's big
   moment arrives as eight separate toasts. A collect-all is the single biggest difference between
   Fall feeling like an appointment and Fall feeling like admin, and it needs either a new
   affordance or a change to how the engine is called.
3. **Fall is not in the welcome-back report.** `reconcile()` walks `state.grid` only, so a Fall bed
   that ripened while the app was shut gets no line in the away sheet.
4. **Fall has no season tint of its own.** `--season-tint` ripens *Summer* toward autumn; Fall's
   scene is already autumn and is not tinted. Whether Fall should have its own clock is a phase-4
   question.

### ~~A FRESH save is hard-capped at 2 of 19 seeds~~ — FIXED 2026-08-29 (phase 2)

**The seed half is closed.** The plant picker sells unlocks: a locked row wears its one-time
gold price, asks before it charges, and says *yours for good* when it lands. The two label
seams that came with it are gone too — the retired `unlockLevel` no longer appears anywhere in
the picker, and a plot the Turn is holding now chips **"Turn 1"** with a deny float reading
*After your first Turn*, instead of a "Lv 3" nobody could act on.

**Still true, and by design:** a fresh save is played on **four plots** through year one —
plots 5–8 open at the first Turn ([32-the-garden-year.md](32-the-garden-year.md)), so this is
the design, not a gap. **The Turn now has its surface** (the meter pill and the ceremony, phase 2),
so a fresh save can reach Turn 1 from the game's own UI and open them.

The remaining seam in this family: the level-up toast no longer announces seeds, which
shortens levels 2–17's fanfare until the ladder re-authors in slice D.

**And a MIGRATED save is not behaviourally unchanged either — three real differences**, so
"the live game plays identically" is retired as a claim (it holds for the *look*, not the
behaviour):

1. **Harvest yield drops by 5% × mastery tiers** on every flower, the moment the save loads —
   the accepted Bloom Mastery regression logged on 2026-08-29. ~~The 2-seeds-per-tier conversion
   pays into a currency with no spend surface until phase 2~~ — **closed 2026-08-29 (phase 2).**
   The conversion grants Saved Seeds while `turnsCompleted` is still 0, so the Almanac's petal
   tracks and its pouch balance now appear on `turnsCompleted >= 1 **or** savedSeeds > 0`. Doc
   32's "year one shows nothing" rule is about a player holding nothing, and it still holds for
   them; a migrated save is holding the compensation for a yield cut it is already paying, and a
   currency you own and cannot spend is not a mystery.
2. **Plots 5–8 refuse purchase** until the first Turn, and the Land Deed badge reads *Maxed* at
   level 0 while that is true.
3. **The dev "Unlock the next seed" button finds nothing to sell** on a fully grandfathered
   save (it reports "Every seed is already unlocked"), and on a partly-grandfathered one it
   offers whatever seed is next — not necessarily Bluebell at 150K. **To feel the first wall as
   step 2 of the review script describes it, use a fresh save in a private window.**

### ~~The Almanac still renders the frozen mastery ladder~~ — FIXED 2026-08-29 (phase 2)

The row's third line is now two **petal tracks** — Rich Bloom and Quick Sprout, with pips and a
price in Saved Seeds. The Almanac no longer calls `masteryGoal()` at all; discovery is read from
the lifetime harvest count instead. Tracks appear only after the first Turn and only on a flower
you have actually grown.

### ~~Phase 2 must filter capped flowers out of the blessing picker~~ — DONE 2026-08-29

The ceremony's picker lists only flowers whose Rich Bloom still has room, and shows each one's pips
so the room is visible. The every-flower-capped case has its own panel: the flower says the
blessing is being kept, and the Turn goes ahead saying plainly that nothing is lost and nothing is
owed.

### ~~The Tally's tier-reading needs the owner's confirmation~~ — RATIFIED

**Closed 2026-08-29 by the phase-1 independent review**, on arithmetic rather than taste:
cumulative tiers are the only reading that reproduces doc 33's own "47 orders → ×1.25"
worked example *and* reaches the ×2.0 cap the same document says a maxed year hits
(highest-tier-only caps out at ×1.69). `projectedTally()` was already right. Kept here only
so nobody reopens it; the reasoning is in the review entry of
[10-decision-log.md](10-decision-log.md) and inline in
[33-year-one-economy.md](33-year-one-economy.md#the-tally).

### ~~The discover track is broken twice over~~ — FIXED 2026-08-30 (phase 3.6)

Both faults are closed, on the owner's ruling. A quest on a track the game keeps a lifetime record
for is now **dealt at that record** (`QUEST_RECORDS` / `questFloor()` in `game.js`), so the strip and
the Almanac count the same word, and `q_discover_12` — dealt at eight species — asks for four more
rather than twelve in a nineteen-seed game. The quest strip now shows the **nearest-to-done** live
active quest rather than `active[0]`, so a slow or stuck quest can no longer be the permanent
contents of the game's one always-visible goal, and the daily is reachable again once the ladder is
finished. The prices fall to the documented **712,500 / 3,117,188**. What is *not* fixed by this: an
uncompletable quest still eats one of the three active slots, and only `paused: true` frees it.

**The owner hit this in the first minutes of a fresh save, and auditing it found a second,
worse fault underneath the first.** Both are reproduced against the real engine.

#### Fault 1: a discover quest cannot count a species you already have

`fillActive()` hands every quest out at `progress: 0` (game.js:1258) and `noteQuest()` only ever
bumps instances **already in `state.quests.active`** (game.js:1332). A species fires its discover
event exactly once, ever, on its first harvest (`almanac.first`, game.js:2025). Daisy and Tulip are
grown in the first minute of a save; `q_discover_5` is the eleventh quest in the ladder and is dealt
later. **Those two events are therefore spent before the quest exists, and nothing backfills.**

Reproduced on a fresh save: the Almanac reads **2 species discovered** while the strip reads
**0 / 5**. Growing a third takes the Almanac to 3 and the strip to 1. Two counters for the same
word, on the same screen, permanently off by the number of species you found before the quest
arrived.

So the price is not what this file said yesterday. The real bar is **five *new* species**:

| | reads | actually needs | cumulative gold |
| --- | --- | --- | --- |
| `q_discover_5` (rep 12) | 5 species | species #7 (Marigold) | **1,978,125** |
| `q_discover_8` (rep 18) | 8 species | species #10 (Jade Fern) | **7,388,673** |
| Almanac milestone 1 (rep 20, 1 gem, a boost) | 5 species | *correct* — it reads the lifetime count | 712,500 |

The Almanac milestones are the control case: `almanacMilestones` is evaluated as
`found >= m.at` against the lifetime count (game.js:1372), so it says the true thing. **The quest
engine is the one that is wrong**, and fixing it there makes the two agree.

#### Fault 2: the ladder's last rung is arithmetically unclaimable

`q_discover_12` (rep 50) is the fortieth of forty quests, so it is dealt only once ~31 others are
done — by which point a measured run has found **10 species**. It then needs twelve *more*.
Proved by exhaustion — deal it at N found, then first-harvest **every remaining species in the
game**:

| dealt at | best possible | |
| --- | --- | --- |
| 6 found | 12 / 12 | claimable |
| 7 found | 12 / 12 | claimable |
| **8 found** | **10 / 12** | **never claimable** |
| 10 found | 9 / 12 | never claimable |
| 12 found | 7 / 12 | never claimable |

**Consequences, in order of how much they hurt.** It holds one of three active slots forever.
`stripQuest()` returns `active[0]` (game.js:1616), so once the two ahead of it clear it becomes the
permanent contents of the always-visible strip. And because `stripQuest()` only falls through to the
daily when the ladder list is empty, **the daily quest can never appear on the strip again.** The
quest panel reads "1 quest left on the ladder" for the life of the save.

#### Before either fault bites: the strip is a discover billboard from about day 2

`q_discover_5` reaches the front of the strip at roughly **three active minutes** of play, and the
models clear it at day 2.75–3.5 on a 24-minute-a-day shape and **day 24+ on a 12-minute one**. The
quests behind it still advance and are claimable from the quest panel, so rep does not stop — but
the game's one always-visible progress display shows an unmovable species counter for days.

#### For the design session

Doc 33 re-keyed four quests for these walls — `q_rose_3`, `q_lavender_3`, `q_marigold_3`,
`q_peony_3` — each onto a freely-advanceable track at the same rep so the 777 total held. That is
the house's own worked example. The options, roughly in order of how much they buy:

1. **Backfill `discover` progress on hand-out** from the lifetime count, the way the Almanac
   milestones already do. One edit, fixes fault 1 everywhere, makes the strip agree with the
   Almanac, and drops the prices to the documented 712,500 / 3,117,188. It does **not** fix fault 2
   on its own — `q_discover_12` becomes merely very long (12 species ≈ 17.0M gold).
2. **Re-key or bench the discover quests**, the four-re-keys pattern. `paused: true` is the
   documented escape hatch and the ladder's rep total is preserved by a stand-in rung.
3. **Re-cost the quantities** against the gold ladder — e.g. `discover 3`, reachable at the *first*
   unlock, which turns the jam into a signpost for the wall itself.
4. **Make `stripQuest()` prefer the nearest-to-complete active quest** rather than `active[0]`. Two
   lines, and it would have defused the Posy jam and the sell-quest jam as well as this one. Worth
   considering on its own merits whatever else is decided.
5. **Point the discover track at `state.year.stats.speciesSeen`**, which already exists for the
   Tally and resets each Turn — turning breadth into a repeatable seasonal goal rather than a
   lifetime one. The largest change, and the one that fits the Garden Year best.

### ~~The Stand out-runs the level ladder~~ — RULED AND PAUSED, 2026-08-30

**The owner ruled: bench the rep half of orders until slice D.** Shipped as `STAND.repPaused` in
`data.js`, read through `Game.standOrderRep(order)` — one edit to reverse. Orders keep paying gold
and keep counting the Tally's `orders` line; the order card omits its star chip while the flag is
on. What remains open is slice D's job, not a bug: the rungs for levels 18–40. Kept below as the
evidence that produced the ruling.

#### The evidence

Found in the same audit. **`standDeliver()` pays `addRep(order.rep)`** (game.js:3123) and the Stand
is open from a fresh save — `STAND.tiers[0]` is `rep: 0, repPay: 4`, rising to `repPay: 16` at 600
lifetime rep. A three-line tier-4 order pays **48 rep**, more than the largest quest in the game.

Doc 32 puts order-driven reputation in **slice D** ("from the first Turn onward, orders are where
reputation comes from"), together with the re-authored rungs for levels 18–40. **The faucet shipped
in slice A; the rungs did not.** The measured effect on a casual model is level 18 by the first Turn
and level 68 by day 21, against a `DATA.levelGrants` table that stops at level 20 — after which a
level-up pays `20 × level` coins and nothing else, forever. Every level gate in the game
(`plotUnlockLevel` max 12, meadow cells max 14, habitat slots max 16) is cleared inside three days.

**Options:** bench the rep half of orders until slice D (they keep paying coins and the Tally's
`orders` line); ship the 18–40 rungs before the faucet is allowed to reach them; scale `repPay`
down; or split order standing from the level bar — which contradicts doc 16's "one progression
number", the rule that made the feature affordable in the first place.

*(This one is not caused by the Garden Year — the Stand has paid rep since it shipped — but the
Year is what made it visible, because the Year is what made the level ladder stop being the thing
that gates seeds.)*

### ~~The plant picker uses one padlock for two different refusals~~ — FIXED 2026-08-30 (phase 3.6)

**The owner ruled: the padlock means the one-time wall and nothing else.** The go button now draws
its sprout in every state and drains on the drained-paper tokens when the row is unaffordable, so a
refusal that clears itself in ten seconds is grey and nothing more, while the `.seed-lock` chip and
its price keep the only padlock in the picker. Fall's crop picker took the same edit — it shares the
row and has no unlock wall at all, so its padlock could only ever have meant *can't afford yet*.

**The half that is easy to miss and is now asserted:** `syncAfford()` rewrote that slot on every
`currency` emit, so a markup-only fix would have put the padlock back about a second after the panel
opened. Both of its writers are gone, and a sim-test reads `ui-sheet.js` to hold all four sites at
once — including the negative case, because deleting every padlock in the file would otherwise pass.



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

### The blessing is the largest per-Turn grant and nothing prices it — ACCEPTED FOR NOW, 2026-08-30

**RULED: keep it exactly as it is.** The owner's diagnosis was sharper than the advisor's — the
blessing feels lackluster *because it is a ceremony wrapped around a thing you can already buy*, so
the open question stopped being *how do we price this* and became **what should a blessing actually
be**. No once-ever cap, no pricing; the farmability below is a known, accepted seam until that
creative brief lands. Three sparks are recorded with the ruling in the 2026-08-30 blessing entry in
[10-decision-log.md](10-decision-log.md). **The numbers below stand and are why the seam is worth
watching — they are not a pending decision.**

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

**The summon cheat produces the mirror image, not this bug.** `Dev.summonCritter(star)` leaves
`discovered` alone on purpose, so a creature summoned at ★3 reads `0 / 135 Bluebell to ★4` — an
empty bar rather than a full one. That is the honest number: it has no lifetime harvests behind it,
and the next real harvest of its bloom will not move it until the count passes the ★4 goal.

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

- **No keyboard support.** Every button now takes a visible `:focus-visible` ring — 3px of ink, 3px
  clear of the contour, written as an `outline` because a `box-shadow` ring would have deleted the
  lip off every button in the game at once. But there are still no key handlers, and the game can't
  be played without a pointer. Three components override it: `.dev-btn`, `.mw-cell` and `.mw-keeper`
  set their own `outline` in a state rule that outranks it.
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

**Extended 2026-08-30.** The suite only covers names that come from a data table, so a **hand-written
call site** could still hide a typo — and both of the original two were hand-written. `get()` now
warns to the console the first time it is asked for a name it does not have, **once per name**, kept
in a private `Set`. The fallback is byte-identical; only the silence is gone.

It is gated on `location.hostname` being `localhost`, `127.0.0.1` or `''` — the same test
`index.html` already uses to skip the service worker, and the only honest dev/production signal in a
project with no build step to strip a branch. **The `typeof location !== 'undefined'` half of that
gate is load-bearing:** Node has no `location`, `tools/sim-test.js` evaluates `icons.js` at global
scope, and a bare `location.hostname` there is a `ReferenceError` that takes all 1,385 checks with
it.

**Two things it does not do, on purpose.** It never warns in production, and it cannot be caught by
the suite — Node has no `location`, and sim-test only ever calls `has()`. `tools/probe.js` will not
catch it either: its console handler drops everything that is not an `error`. This is a check for a
human with devtools open, and a green suite is not evidence it works.

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
a system whose rule is "3px ink on everything". `border-radius:14px` alone appears 12 times (13
before the Cards pass snapped three of its own to the ladder).

**Left out of the 2026-08-26 pass on purpose.** Every other item in that pass was a material change
that could be verified by eye against the garden. Radius and border are *geometry*: changing them
moves layout, changes how a `:active` travel lines up against its lip, and touches nearly every
component at once — so it is its own pass, with its own screenshots, and it should not be bundled
with a colour change where a regression would be impossible to bisect.

When it happens, do it in the order the ladder is used, not file order: chips and small badges to 12,
cards / plots / dock to 18, the board to 26, and everything already at `999px` or `50%` left alone.

### Raw hex where a token exists — the exact matches are swept, the rest is a design pass

**Swept 2026-08-30.** `#2c1a10` is gone: all 25 raw uses outside `:root` are `var(--ink)`, and the
ink can now be adjusted globally. 32 substitutions in total, and the rule for choosing them was
narrow on purpose — **a hex was only replaced where the token's NAME matches the site's evident
MEANING.** `#ffd43b` on `.toast.legend` became `var(--legend)`; the same hex on `.hollow-gift` did
not, because that is a gold that happens to equal the rarity colour without meaning the rarity.
Encoding the wrong meaning is worse than a raw hex, because it also breaks the next retune.

`node tools/style-check.js --strict` prints what is left. Sorted against the palette it is three
different problems, and only the first is a sweep:

- **29 distinct near-misses, 74 occurrences** — a hex within a hair of a token. `#fff8e8` against
  `--paper` `#fff8e7` is one step of red; `#5c3a22` against `--ink-2` `#5a3a1f`; `#ffd23f` against
  `--legend` `#ffd43b`. Each is either a typo or a deliberate half-shade, and **nobody can tell
  which from the file** — which is exactly why they need the owner rather than a script.
- **~94 distinct colours with no token near them**, the real accretion. A palette pass, not a sweep.
- **Two golds that mean different things.** `--coin` `#ffc93c` and `--legend` `#ffd43b` are both in
  the palette; `#f08c00` is a third, deeper gold used for legendary text on cream and for coin
  figures, and it has no name. It wants either a `--legend-d` or an admission that it is `--coin-d`
  doing double duty.

### ~~`.card-desc` is the last `opacity: .7` description text~~ — DONE 2026-08-30 (phase 3.8)

Fixed alongside the Cards pass, which cleared the same family out of `.album-lede`,
`.cardcell:not(.have) .cardname`, `.setbar small` and the pack's duplicate state.

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

### ~~Nothing enforces any of this~~ — BUILT 2026-08-30

`tools/style-check.js` is the thing that notices. Zero dependencies, one file, five checks: raw hex
outside `:root`, translucent `box-shadow` lips, custom properties used but never declared, corner
radii outside the ladder, and a count of distinct border widths. The first three fail; the last two
only report, because the geometry sweep below is deliberately deferred and a measurement should not
smuggle in a decision.

**It fails on new drift, not on the debt already there.** `tools/style-check.json` records the
counts as found. This is the part that makes it survive: a check that is red on its first run and
every run after it gets switched off within a week, and then the rules fail the same way they
failed before. Raising the baseline is allowed and is a deliberate act — `--update-baseline` — and
doc 05 check 5 says the new value gets written down with its reason.

Three things it deliberately does not flag, each blessed by doc 05: an `inset` shadow (the house
material's lit top and shaded bottom edge are translucent on purpose), a ring (`0 0 0 3px rgba(…)`,
which the rarity and state vocabulary uses), and a hex assigned to a component-local custom property
(the `--mw-stone-*` pattern). A lip is the shadow with a **vertical offset and no blur**, which is
the signature doc 05 tells you to grep for.

It was sabotaged before it was believed, per the trap recorded in
[HANDOFF.md](HANDOFF.md#traps-in-this-codebase): each of the three failing checks was broken in turn
and confirmed to be the one that goes red, and the three blessed patterns above were confirmed to
stay green.

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

`tools/sim-test.js` runs the real `game.js` headlessly and now covers 1,385 assertions over the
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
