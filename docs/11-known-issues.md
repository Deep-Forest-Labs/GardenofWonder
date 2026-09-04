# Known Issues and Rough Edges

Things that are wrong, unfinished, or surprising, recorded so nobody rediscovers them from scratch.
Nothing here is a crash — the game is stable. These are correctness, balance and polish gaps.

If you fix one, delete it from this file in the same commit.

## What the overnight fix round knowingly left (2026-09-03)

**Three drone-rental knobs ship PROVISIONAL and named, all three the owner's to pick, each a
one-line reversal.** (1) **The rental grants drone level 1** (`data.js`, the `drone` row of
`DATA.boosters`, `effects: { autoHarvest: 1 }`). Level 1 is one pickup every 2.5 s — the entry rung
of a five-rung ladder the permanent badge sells for 4,500 gold rising at ×2.4. It is the rental's
whole power: too weak and it is not worth thirty seconds of somebody's attention; at level 5 (0.7 s,
the floor) it would out-perform a badge chain costing ~600K gold. The sim-test reads the number off
the row rather than hard-coding it, so changing the single `1` moves nothing else. (2) **The reveal
curtain at 0 — always visible** (`DATA.droneRental.revealAt`). Zero is the no-change-neutral setting
of the existing convention (`upgradeRevealedNow`: absent or zero means always visible) and the only
setting under which a thirty-minute *taste* reaches the newer players it is a taste for; the badge's
own curtain is 2,500,000 lifetime gold. The stated cost: a newer player now meets the drone in the
Shop **before** the Upgrades badge reveals, so the rental introduces the thing rather than following
it. `DATA.droneRental.revealAt: 2500000` puts it back behind the badge with no other change, and a
sim-test drives exactly that reversal so the recipe cannot rot. (3) **The rental's ad cap at 2 a
day** (`DATA.ads.perPlacement.drone`) — an hour of borrowed machine, holding it to a treat, and
leaving two of `dailyCap`'s six for the placements [37-monetization.md](37-monetization.md) says
ship first. The sim-test drives the cap through `rentDrone()` rather than reading the number, so 1,
2 or 3 all pass.

**Two ad-and-food numbers ship PROVISIONAL and named, both the owner's to pick, both a one-line
reversal.** (1) **Petal Cake at 3 gems** (`data.js`, the `petalcake` row). Twelve cakes a day at four
tended creatures is 36 gems, ≈2.5 hours of the ~14 gems/hour faucet — real pressure; 10 gems would be
≈8.5 hours, a wall. `tools/sim-test.js` holds a *band* (twelve cakes under four hours of gem income),
so 1 through 4 pass and 20 goes red — the guard, not the ruling. (2) **The food ad cap at 2 a day**
(`DATA.ads.perPlacement.food`). Four pets on 16-hour Honeypots want six ads a day and
[37-monetization.md](37-monetization.md) plans 3–6 in total, so feeding alone would eat the whole
budget; two leaves 1–4 for the three placements that ship first. The sim-test asserts the shape
(below six, and room for three more), so 1, 2 or 3 all pass and 6 goes red.

**Clover is deliberately UNMOVED at 1,500, and the owner's "greatly increase the cost of food" is
therefore only two-thirds delivered.** For Petal Cake and Honeypot the currency change *is* the
increase. For Clover the currency does not change, so the increase would have to be a gold number and
no investigated one exists — under the round's rails a knob with no investigated number ships at
no-change-neutral and gets filed. The arithmetic for the answer: six meals a day per creature, so
four tended pets cost 36,000 gold a day against a measured late income of 30–40M
([33-year-one-economy.md](33-year-one-economy.md)), which is why it reads as free. **Whatever number
lands, Clover is the tier that must never wall** — the cheap food staying affordable is what stops
being broke from stranding a creature.

**The two cross-tier food price invariants are gone, and nothing replaces them one-for-one.**
"A longer stretch costs less per hour of boost" and "the cheapest is the most efficient way to merely
stay awake" both compared `cost` across tiers, and gold, gems and an ad do not compare. They were
deleted rather than repaired, and the daily bill at four tended creatures took their place. **Within
a currency there is now only one food each**, so the surviving escalation assertion is vacuously true
for both — it exists to catch a *second* gold or gem tier being added out of order, not to hold
today's ladder.

**The owner said "in the actual shop and not the upgrades", and the drone shipped in BOTH places,
split by kind.** The Shop sells the timed rental; the permanent Harvest Drone badge stays in
`CORE_UPGRADES` untouched. The literal move is not survivable: `buyUpgrade('autoHarvest')` is only
reachable through `CORE_UPGRADES`, so removing it deletes the only path to
`state.upgrades.autoHarvest` and silently switches **all offline earnings off for every existing
save** (`passiveIncomeRate()` returns 0 without it), strands levels 2–5 with nowhere to be bought,
and leaves `DRIP_UPGRADE_KEYS` still queueing an `upgrade:autoHarvest` reveal celebration at 2.5M
for a card that no longer draws. The split is also the two tabs' existing grammar rather than a
compromise: the Shop sells timed effects (the sky calls), Upgrades sells permanent ones. **The
reversal recipe, if the owner insists on a literal move:** lift `'autoHarvest'` out of
`CORE_UPGRADES` (`ui-sheet.js`) **and** out of `UI_BADGE_KEYS` (`tools/sim-test.js`) — they must move
together — render the permanent card inside `renderShop()` through the existing
`upgradeCard('autoHarvest')`, and re-spec `upgradeRevealsChanged()` and the reveal-moment path
*first*. Do not half-do it: filtering the key out of the Upgrades render while leaving it in
`CORE_UPGRADES` makes `tickSheetTimers()` re-render that tab every 0.25 s forever, which reads as a
tab fighting every tap rather than as a missing card.

**`Dev.grantBoosts()` now seats a drone charge on the power-up button, so a developer can start a
rental with no ad.** Accepted rather than fixed: the cheat iterates `DATA.boosters`, and forcing the
real `activateBoost()` path is exactly what the dev-cheat playbook asks for. `boostInv.drone` is
unreachable by every player path — no quest reward, no level grant, not in `DATA.startingBoosts` —
so the power-up button's empty-state copy ("They turn up for quests, for levelling, and for filling
the Almanac", `ui.js`) never lies to a player by omitting the ad. Worth knowing before somebody
"fixes" `boostInv.drone` into the opening bag.

**A rail chip whose countdown is longer than 99 seconds overlaps its own name, and this is
PRE-EXISTING rather than the drone rental's doing.** `renderRail()` prints `fmtTime(remain)` inside
the 19px `.ring` once the remainder passes 99 s, and "29m 54s" is far wider than the ring. Measured
side by side at 390 px: Fortune Aura (`dur: 1800`, an ordinary earned power-up that has shipped for
weeks) renders exactly the same overlap as the Harvest Drone rental, chip width 115 px against a
19 px ring in both. The rental makes it *more visible* — it is a half-hour chip a player chose to
start — but it does not cause it. Left because `.chip.timed` is shared by the weather chip, the
Wonder chip and every booster, and it is being edited by other work in the same round; the fix is a
sizing decision for whoever next owns the rail, not a change to smuggle into a feature commit.

**An ad refused because the day's budget ran out between render and tap plays the generic deny, and
the flower says "broke".** `emit('deny', { reason: 'ad' })` reaches `ui-events.js`'s one shared
handler, which plays the sound, shakes and speaks the broke line — the right *feedback* with slightly
wrong *words*, for a race that needs the offer to be spent on another surface in the second between
the panel rendering and a thumb landing. Deliberately not given its own channel: a second refusal
path for one rare line is more surface than the line is worth. The fix, when the deny reasons are
next touched, is to let `UI.say()` take the reason.

**Half of docs/22's "a sleeping creature must never need a scroll to reach the food that wakes it"
rule is already broken, and it was broken before the three-currency change.** Measured 2026-09-03
with `tools/probe.js` on the critter panel, and measured again against `HEAD` to be sure: at 375×812
the food row ends at **506px in a 582px body** — fine, 76px of headroom, and the ad tier costs zero
of it — but the **out-or-rest button ends at 602px**, below the fold. And on the short viewport the
conventions checklist names, **390×640, the food row itself ends at 507px in a 444px body** —
*identically* before and after this commit, so it is a pre-existing gap and not a regression. The
older numbers in docs/22 (518 and 579) do not reproduce and have been corrected. Fixing it is a panel
layout job, not a food job.

**`renderFeed()` still says "Either clock can run up to 24 hours ahead", which has been false since
the two clocks merged on 2026-08-20.** Found while working in that panel for the currency split;
there is one clock now and it is capped at 24 hours. Not fixed here because it is copy in a panel
this commit was not scoped to rewrite, and the sentence is one line above a paragraph that would want
re-reading with it.

**A thunderclap now sits about 6 dB above its own bed's peak** — roughly 0.094 against 0.048 —
where it used to sit level with it. That is the halving doing exactly what was asked (the hiss
down, the thunder untouched), and it is recorded as a watch item rather than a defect: a storm
whose cracks stand further out of the rain may read as *more* dramatic, not less. **Reversible in
one line at `stinger.gain.value` (audio.js)** if the owner reports the thunder as startling.

**The duck's depth was not re-derived against a bed half as loud.** `DUCK_HZ` stays at 950 — no
change — but the effects now sit relatively closer under a quieter sky. If taps ever read as muffled
for no visible reason, that is the knob; the bed trim is not.

*(The icon-registry paperwork entry that stood here is CLEARED. `#18` had to add a `video` glyph and
therefore had to run `node tools/export-icons.js`, which is all-or-nothing: it wrote
`mysteryBloom.svg` as well, added both manifest rows, and picked up `snow`'s missing `ui-sheet.js`,
`plantSpot`'s fourth room and the stale count in one pass. `node tools/export-icons.js --check` exits
zero for the first time in several commits, and [05-art-direction.md](05-art-direction.md)'s
"Fifty-two icons" sentence is corrected to fifty-six alongside it.)*

**`q_discover_3` will often lead the goal strip, at 2/3 = 0.667 against neighbours at 0.00 — and
that is the signpost working, not the jam returning.** `stripLeader()` ranks nearest-to-done, so a
two-thirds-full rung wins the strip, exactly as `q_discover_5` used to. The difference is the whole
point: the goal now names a wall the player can reach — one Bluebell at 150,000, inside a year at
~40% of its income — and it clears the moment that Bluebell is first harvested, rather than sitting
there for three walls of gold. Expect it to be re-reported as a regression by anyone reading the
strip alone; the number to check is what the goal costs, not how long it leads.

**The flower's greeting bubble covers the top-middle Fall crop's wait pill for the few seconds it is
up.** Moving `.fl-wait` to the bottom of the tile (`#24`, to free the top-right corner for the gem
chip) put it under `#speech`, which rises out of the centre cell into the tile above: measured 16px
of a 20px pill on plot 1 only, and gone about **2.6 s** later — `ui.js:427` drops `.show` on a
2400 ms timer and `.speech` fades out on `transition:opacity .22s`. (This entry first said ~4.5 s.
Nothing in the code has ever produced that; the two numbers to check are the timeout and the fade.)
Traded rather than solved — the top row is the chip's, and the alternative homes are worse:
shortening the growth bar to free the bottom-right halves the bar on a 320px screen, and the bar is
the growth signal. **Two
comments in `ui-fall.js` are stale in the same breath** (the `buildBoard()` note that the speech
bubble does not come with the flower, and `collectAll()`'s reason for having no `UI.say()`):
`ui.js:32-46` moves the one `#speech` node into whichever hero cell is on screen, so Fall does speak
now. The comments were left alone as out of scope; the behaviour they describe is what changed.

**The gem skip chip and the pack-drop chip can still act silently on the first gesture of a
session.** `Sound.play()` bails while the AudioContext is not `ready`, and only `Sound.resume()`
wakes it. `onPlotTap()` calls `resume()` first; `onSkipTap()` and `onPackTap()` never have. So a
returning player whose very first touch is a gem skip or a pack collect gets the animation with no
sound. `#25`'s new `onReplantTap()` calls `Sound.resume()` and so does not have the bug, which is
what made the gap visible in the two chips beside it. Deliberately not swept into a scoped fix round
— it is two one-line additions in `ui.js` and it belongs to whoever owns those chips next.

**The replant chip is hidden on a plot with a harvester assigned, and that is a ruling waiting to be
confirmed, not a settled design.** Shipped hidden because `processAutoPlant()` runs unthrottled
inside the every-frame tick, so such a plot refills within one frame of going empty and the chip is
literally unhittable — and in the one case where it would linger (the drone can afford nothing) the
player cannot afford the chip either, so it would sit permanently drained. If the owner wants the
chip there as a deliberate counterweight to a drone that always reaches for the priciest seed, that
is a real design and it needs more than the two-line reversal in `replantSeed()`: it needs the drone
to stop refilling a plot the player has just chosen for, which is a separate item.

**A plot's memory of its last seed dies at the Turn.** Shipped that way because the Turn's cell
rebuild names its fields explicitly and `lastSeed` is not among them — the no-change position, and
the one the punch list called "probably right". The player-visible consequence, which nobody asked
about: the morning after a Turn, every plot opens the picker again. One-line reversal, recorded in
`03-systems.md`.

**One assertion in `tools/sim-test.js` is intermittent, and it is not new.** `a real harvest lands
inside the range the picker quoted` (the seed-picker payout group) fails roughly **once in every
25 runs**, on `HEAD` as well as on the working tree — measured both ways, 25 runs each, one failure
each. The check arms rarity to `common` and then compares a real harvest against
`plantPayout().min/max`, so something else in the payout still rolls. It matters out of proportion
to its size: the round's whole "the count may only go up, 0 failed" gate becomes a coin flip nobody
is expecting, and the natural reading of a single red run is "my change broke it". **If you see it,
re-run before you debug**, and if you are the one to fix it, the group is
`the picker quotes what the plot would really give`, which sits **directly above**
`a petal button says what you have and what the next one adds` with nothing between them. (The
earlier "three above" was wrong.) The rate is worth re-measuring before anyone budgets time against
it: it did not appear once in the 2026-09-03 hardening round's runs. Not fixed here — it belongs to
whoever owns the picker's payout quote, and pinning it means moving an economy assertion.

**The one bar already scheduled in the instant before the page froze still fires on the way back.**
`#23` stops the three schedulers on a frozen context, but a note booked a moment earlier is already
on the AudioContext's own queue and plays when the context resumes. It is one chord against the 81
notes it replaces, and it is judged fine — the tune returning on its own chord is arguably the
better sound. **The knob if it is ever not fine:** `tone()` can drop any note whose `when` has
fallen more than a beat into the past.

## What the overnight fix round knowingly left (2026-08-31)

**The status rail is invisible in Fall on a screen shorter than 700px.** Both boards are now the
same square in the same place, so on a 667-tall phone the bed chip's row and the rail's row are the
same 48px of band. `visibility:hidden` in Fall only, deliberately — `display:none` would give the
row's height back to `.stage` in Fall and re-create the misalignment the round exists to remove.
Traded rather than solved: a booster and the Wonder Effect act on the *garden*, so there is nothing
in Fall for them to do and nothing there to tap, and one swipe brings them back. **The sky's chip
joined the rail later the same night and is covered by the same trade** — Fall crops take no
mutations and Fall's grow times are fixed, so a sky changes nothing a Fall player can act on either.
Above 700px both rows are shown and neither moves. If Fall ever gains something a rail chip must
announce, this needs a different answer.

**The sky's chip carries no countdown, and that is a decision waiting on the owner.** A timer would
turn a status light into a small clock to plant against, and paired with the flower's spoken
forecast it rebuilds most of the forecast panel ruled out in `18-mutations-and-weather.md`. Shipped
without one; everything needed is in place if the ruling changes. Note the trap if it does:
`weatherSlotRemaining()` measures the **slot**, and a called or held sky outlasts its slot, so a
chip that trusted it would count to zero and then keep going.

**Fixed 2026-09-01 (slice C) — "Fall's flower cannot speak" was two bugs, not one.** The recorded
half was the node: `#speech` lives inside the garden's flower cell and four `display:none` rules
delete that subtree. `UI.bindFlower()` now MOVES the one `#speech` node into whichever hero's cell
is on screen, which keeps the id — `tools/capture-screens.js` and `tools/stage-parity.js` both
address it by name — and keeps one `speechEl` for the cooldown to reason about. The half nobody had
written down: `sayText()` refused on `!el.coach.hidden`, and `.in-fall .coach:not(.season)` hides
the coach in CSS while leaving `hidden` false, so every line in a season room was refused before it
reached the node. It asks `offsetParent !== null` now. Fall's `windfall` line has drawn on screen
for the first time since Fall shipped.

**Fall's bed chip double-spaces around its bold words.** `.fl-chip` is
`display:flex; gap:7px`, and a flex gap applies between EVERY child — so
`<b>5 / 8</b> planted` renders as "5 / 8  planted", with seven pixels leaking into
the sentence wherever the copy bolds a number. Found 2026-09-01 while building Winter's chip, which
had inherited the same shape; `.wi-chip` takes `gap:0` with the margin on the icon instead. Fall's
is one line of CSS away and was deliberately not changed in slice C, because Fall is not that
slice — it is a two-minute fix for the next round.

**In landscape the chips are squeezed to illegibility and Fall's wait pill breaks out of its tile.
The chips themselves do NOT overflow — this entry used to say they did, and that was wrong.**
Re-measured 2026-09-03 at 844×390: every `.plot` and `.fl-plot` is 31.3px, and
`max-width:calc(100% - 10px)` resolves against the tile's 25.3px padding box (the plot carries a 3px
border), so **every chip is held to 15.3px and sits entirely inside its tile** — the garden's
`.skip-chip`, the garden's `.replant-chip` and Fall's `.fl-skip` alike, on every plot, and the same
holds at 667×375 and at 932×430 (38.6px tile, 22.6px chip). The clamp is doing its job. What it
cannot do is make 15.3px enough: inside the chip the 11px gem or sprout glyph is crushed to **zero
width** and the price overflows the pill's own background onto bare soil — a Pumpkin's chip spans
370→385.3 while its "360" paints 377→392.2, so the last two digits sit on the earth beside the chip
and it reads as a truncated price. **What actually leaves the plot is Fall's `.fl-wait`.** The pill
is 20.3px tall at `bottom:16px` off a padding box that ends 3px inside the tile, so it needs 39.3px
of tile height and landscape gives it 31.3px at 844×390 and 38.6px at 932×430 — its top edge sits
**8px above the tile** in the first case and 0.7px above in the second, on every plot. Sideways it
depends on the label: a Strawberry's "20m" is 36.8px on that 31.3px tile and hangs off both edges,
where a Pumpkin's "3h" is 28.5px and does not. And the pill **overlaps the gem chip on every plot**
in both viewports, which is the half of this that #24's own measurement did not cover. Landscape is
not a supported orientation. See the entry further down.

**The `--yard-h` reservation is now load-bearing for alignment.** `UI.boardSide()` reads `.stage`'s
bottom padding to find the yard's height, because the yard node measures zero in Fall. Anything that
changes how the yard reserves its room — a different property, a grid row, a media query on one
season only — silently changes Fall's board size relative to Summer's, which is the exact fault this
round fixed. Change it in one place or check both seasons.

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

## Three things the asset inventory found (2026-08-31)

All three turned up while building [45-asset-inventory.md](45-asset-inventory.md), by running the
code rather than reading it. None is a defect and none was fixed: they are recorded because a
Unity estimate made from the docs alone would get all three wrong.

- **Decor is bought, counted, and never drawn in the world.** Every consumer of `state.decor` was
  traced: it is written by `buyDecor()` and by the level-19 grant, and read by exactly one
  function, `decorCount(id)`, which the shop card uses for its "Owned ×N" caption. The four
  pieces are content that exists; the feature that places one in the garden does not. Deliberate
  as far as anything records, but the docs describe decor as if it were visible.
- **The card album has 108 named slots and no card art.** Twelve sets × nine cards, with
  rarities, set tints and the whole reveal staging — all filled today by nine placeholder motifs
  cycled by the card's index *within its set*, so every set's card #1 is the same sprout on the
  same green disc. The slot mechanism is real and finished; the art is the pipeline in
  [20-card-art-prompts.md](20-card-art-prompts.md) and it has not been run.
- **The `flask` icon is drawn by no code in the game.** One of forty-six, referenced by nothing —
  no `Icons.get`, no `data-icon`, no `icon:` field on any data row. Either a glyph waiting for
  its feature or dead weight; the manifest flags it on every run, so it cannot quietly become
  either.

One caveat on the gallery itself: **the Wild Meadow's jar counts drift by one between runs**,
because the hive clock keeps running through the waits that set the scene up. The badges come out
3/3/3/2 or 3/3/2/2. Nothing else in the twenty-six screens is non-deterministic — the sky, the
day phase, the pack roll and the Stand's board are all pinned.

## What the Sky Pass knowingly left (2026-08-31, phase 3.9)

**All five skies are in the game.** `DATA.weatherStage` holds the owner's tuned values, both engine
nudges are built, and the motion stage has stopped being a gate. What follows is what the pass chose
not to solve, so nobody files one as a bug or re-proposes one as an easy win.

**A rain that begins while nothing is watching never waters what was already in the ground.** The
shave rides the dry-to-wet *change*, and only something watching can see a change happen. A phone
that sleeps under a clear sky and wakes into a rain still gets it once, because the watch survives a
sleep — but a page that *reloads* into that same rain gets nothing, because the first look sets the
watch rather than paying it. The reload half is deliberate: paying on arrival at the page pays the
same rain again on every reload, and that was reproduced before it was closed. Nothing else about a
rain is missed. It still waters what is sown into it while it stands, and a plant still catches the
sky for its mutation at its own scheduled moment, whoever was watching. Only the growth nudge.

**A plant that lives through several rains is shaved once per rain, and it compounds.** *Every* rain
waters is the chosen reading, and each one takes its share off what is *left* rather than off the
original clock. A rain starts about ten times an hour, so the longest seed on the ladder — the
Eternal Crown at thirteen minutes — meets two of them on a good run and comes up about a tenth
sooner than its data row promises, a fifth at the outside. It is small only because the ladder is
short, and it grows with the seed: an hour-long seed would sit through ten rains. **Re-measure this
before any seed slower than the Crown ships.** The suite pins the size of a single shave and asserts
that a second rain shaves again, rather than assuming either.

**Rain does not reach Fall's bed**, which is where the slow crops are — a Pumpkin is three hours and
the Century Bloom is a fortnight. That follows from Fall's bed sitting outside every growth modifier
rather than from anything this pass decided: `fallPlant()` writes the crop's raw grow time, and no
petal or Keeper reaches it either. Recorded because "rain waters" sounds like a promise about the
whole garden and is a promise about the eight plots.

**A shaved plant can walk past its own mutation roll.** Every plant books its one roll at a moment
picked when it is sown, and the shave rewrites the growing clock while deliberately leaving that
booking where it is. So a roll booked in the last stretch of the original window can now come due
after the plant is already ripe — and the drone picks a plot within a couple of seconds of readiness,
which clears the booking unfired. At most the last tenth of the window, per rain. The alternative,
re-booking the roll into the shortened window, would let the sky move the mutation income share the
whole seed ladder is tuned against; a sim-test holds the booking exactly where it is so that nobody
changes their mind about that quietly.

**Two flower lines land five seconds apart at the start of a real sky, and three around a rain that
ends in daylight** — the forecast as the front opens, the arrival on the boundary, and the sunbreak
five seconds after the drops thin. The speech cooldown is 3.2 seconds, so none of them holds the
next one back. Each was specced and each is worth having on its own. Whether the run of them is
chatty is a judgement for the owner with a phone in their hand, not a bug — and the cheapest cut, if
it wants one, is rain's and the storm's arrival line, because the forecast has just said it.

**An aurora standing at the moment you come back prices the whole absence.** `passiveIncomeRate()`
deliberately excludes rain — a sixty-second sky must not set the rate for a day away — but it reads
a Moonflower's Nightbell through `isNight()`, which an aurora now answers true for whatever the
hour. The hour has always done this, and night is a third of a six-minute cycle, so returning after
dark already quoted an absence at the night rate; the aurora is a second writer on the same
momentary reading rather than a new fault, and it lifts night from about 32% of moments to about
34%. Recorded because the rain half was closed on exactly this reasoning and this half was not.

**The bottom 44px of the lawn stays bright under a dark sky.** Every full-frame layer is masked out
over the last stretch, because iOS paints the strip below a short window with the flat lawn colour
and a tint running to the edge draws the join three rounds of layout work went into hiding. The same
compromise the season tint already makes, now carried by `--wxr-mask`. Load-bearing; do not "fix" it.

**The motion stage survives as the tuning bench, and it is a second copy of the sky.**
`tools/sky-spike.html` still carries all five skies, the sunbreak and every knob in
`DATA.weatherStage` on a slider, which is the fastest way to retune a feel — but its CSS is a copy
of the game's kept in step by hand. The two are in step today, the sunbreak's crossing sweep
included. A motion change made in `style.css` and not carried across leaves the bench quietly lying
about the game. Its hour, year-ripening and hold sliders are viewing conditions and deliberately
reach no data file.

---

## What phase 3.8 knowingly left (2026-08-30)

**The placeholder gate on swipe-down was not built, and the idea is dropped rather than deferred.**
Ruling 4 gave swipe-down to a hedge-gate placeholder — and swipe-down is the Wild Meadow's *only*
door in the game. Building it would have stranded the room, its hives, its keepers and four quests
worth 114 of the ladder's 789 reputation, on top of the strip-jam trap. **The owner ruled mid-round
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
difference is the change rather than the weather.

**DONE 2026-09-01 (slice C).** `tools/play-model.js` exists and both tools run on it; `year-sim.js`
is seeded on a fixed epoch and its output is byte-identical run to run. There were **two** copies of
the casual player rather than three — the pantry probe was a throwaway and is gone. The extraction's
acceptance test was `order-gold.js`'s full report coming back **byte-identical**, and it caught a
divergence nobody had listed: `results.turns` is an array of records in one tool and a counter in the
other, so there are five hooks and not four.

**And seeding immediately paid for itself twice.** Five runs of the UNSEEDED tool on unmodified code
returned FAIL, FAIL, FAIL, OK, FAIL, so bill 17's exit code had been reporting noise. And the first
seeded Winter arm failed bill 17 — which turned out to be the MODEL rather than the economy: a
`playWinter()` that refilled every plot on every eight-second check parked the casual player's whole
wallet in the slowest season in the game, for an 8% loss. Modelled as the ritual (collect when you
look, sow and tuck once on the way out) it passes both ways. **A model that does not represent a
person measures nobody**, and that is the general form of it.

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

**In landscape the plot chips hang off their plots — all three of them.** A 34px chip on a 31px
tile. *Amended 2026-08-31:* the wait that was making it worse is gone — the gem chip now shows the
price alone — so what is left is the original overflow, narrower than it was but still there.
*Amended 2026-09-03:* the replant chip added in the plot's bottom right inherits the same shared
rules, and therefore the same overhang; it is 41px in portrait at 390×844 against a 110px tile, and
45px at its widest label (Eternal Crown, `100K`) against an 89px tile at 320×568 — comfortable in
every supported size, and over the tile only in landscape, where every chip already is. Landscape is
not a supported orientation for this game; all three stay clamped to `white-space: nowrap` and
`max-width` so they hold one line rather than wrapping into the neighbouring plot.

**The announcement art is a JPEG carrying a `.png` extension**, 692 KB at 1152×1728. Browsers sniff
the content and render it, and the service worker stores whatever the server sends, so it works —
but the file is heavier than a phone dialog needs and its name does not describe it. Owner-supplied
art is the owner's to re-export; flagged rather than re-encoded.

## What phase 3.6 knowingly left (2026-08-30)

**~~The discover quest leads the goal strip the moment it is dealt, and cannot be advanced.~~** —
FIXED 2026-09-03, by the first of the two fixes this paragraph named. `q_discover_3` is a new rung
at the Bluebell wall, and `needSeeds` gates `q_discover_5` / `q_discover_8` / `q_discover_12` on
seeds owned so each arrives one unlock wall from its own goal instead of three, six or ten. The
evidence it was written from stands: `q_discover_5` did arrive at 2/5 = 0.40 against neighbours at
0.00, and on a fresh save its third species was behind Bluebell's 150,000 wall. The second fix on
the menu — pointing the track at `state.year.stats.speciesSeen` — was **not** taken and is still
live below, as the larger change it always was.

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
keepers, the Honey Shelf and four quests worth **114 of the ladder's 789 reputation**
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

1. **Spring has a gate but no garden** (slice E). Its gate reads *"Opens at Turn N"* while the turn
   is the binding gate and *"Still growing in"* once it has passed, so it never tells a Turn-8
   player that Spring opens at Turn 6. *(Winter left this list on 2026-09-01 — slice C built it.
   The `season-gate-winter` screenshot went with it: the only locked season left to photograph is
   Spring's, and `tools/capture-screens.js` shoots that one now.)*
2. **Collecting a full Fall bed is eight taps.** `fallHarvest(idx)` is per plot, so the bed's big
   moment arrives as eight separate toasts. A collect-all is the single biggest difference between
   Fall feeling like an appointment and Fall feeling like admin, and it needs either a new
   affordance or a change to how the engine is called.
3. **Fall is not in the welcome-back report.** `reconcile()` walks `state.grid` and, since
   2026-09-01, `state.winter.grid` — so a Fall bed that ripened while the app was shut still gets no
   line in the away sheet. **Winter's arrival makes this louder rather than quieter**: two of the
   three gardens now report an overnight and the middle one does not. Slice C deliberately did not
   widen it — Fall is not that slice, and the honest version is a `fallRipe` count beside Winter's
   in the same payload, which is a small job for whoever touches Fall next.
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

## Performance

### The game crashes and drops to ~10 fps under heavy play — owner-reported 2026-09-01, part-answered

**The likely cause is composited-layer MEMORY, not frame time, and the first fix is in.** Reasoning
in the 2026-09-01 (second pass) entry in [10-decision-log.md](10-decision-log.md).

**What was ruled out, with numbers.** A hundred harvest-and-replant cycles with two thousand taps
leave DOM nodes flat at ~1,250, the JS heap flat at 3 MB, no console errors and a steady 16.5 ms a
frame. Eight hundred taps created ~1,750 oscillators and ~1,850 gain nodes with no heap growth.
**There is no leak in the game logic, the particle pool, the DOM or the audio graph** — at least not
one Chrome can be made to show. So the failure is not something that accumulates in JavaScript.

**What was found.** `node tools/probe.js layers:3` prices the compositor's backing stores. On a
**clear** sky, doing nothing: **80 composited layers, 343 MB at DPR 3**, of which 118 MB was held by
`mask-image` on fourteen layers that were all invisible. `opacity:0` hides a layer; it does not
release it. Dropping the mask and the blend on every sky layer that is not standing takes that to
**59 layers and 266 MB**, with every sky pixel-identical. Wonderfall came to 404 MB and is now 363 MB.

**Why this is a better fit for the report than anything in the frame timings**: it crashes rather
than stutters, it worsens the longer a session runs and the more the sky has cycled, and it does not
reproduce on a desktop — which is where every other measurement said the game was healthy.

**What is NOT known.** Whether 266 MB is over or under an iPhone 16's ceiling. These are Chrome's
layers priced by hand on a machine with no such limit; Safari layerises differently and publishes no
number. **The remaining 266 MB is mostly layers with no obvious cause, and that is the next thread
to pull.** If the handset still crashes after this change, that is where to look — and the fastest
way to know is the Frame rate readout plus whether the crash is a reload, a freeze or a white screen.

### THE DEVICE NUMBERS ARE IN — 29 fps on a CLEAR sky, and the frame is all paint (2026-09-01)

**The owner recorded the readout on an iPhone 16 Pro.** This is the measurement the whole pass was
built to get, and it is unambiguous:

```
fps 29.4  int 34  hz 60
p50 34 p95 54 max 125          ... later in the clip: p95 145 max 990
js   0 / 2   n 243
rest 34 / 54   >1.5x 197 >2.5x 47
clear/idle night0 sun0
dpr 2 cv 804x1624 wx 0 fx 12
```

Read it line by line, because every line rules something out:

- **`clear/idle`** — this is a CLEAR sky doing nothing. Not weather. The standing cost.
- **`js 0 / 2`** — our JavaScript costs nothing. **The game logic is exonerated on the device**, not
  just on the bench.
- **`rest 34`** — the entire frame is paint, blend and composite.
- **`fps 29.4`, `int 34`** — that is 2 x 16.7. **iOS has given up on 60 and is holding the page at
  30**, which is what it does when a page cannot make the budget.
- **`>1.5x 197` of `n 243`** — four frames in five miss.
- **`max 990`** — a frame took a full second.
- **`fx 12`, `wx 0`** — twelve particles on screen. It is not the particles.

The numbers are identical with a sheet open and closed, so the seed picker's backdrop blur is not
it either.

**The crash is a white screen followed by a reload**, which is the renderer process being killed and
restarted — the memory signature, not a script error. It is consistent with the layer budget above.

**What has been done since:** the weather layers give up their masks and blends when their sky is
not standing (343 MB to 266 MB), and the Wonder Effect's veil does the same (266 MB to 241 MB) — it
was holding a full-window `overlay` blend at all times for an effect that runs twelve seconds now and
then. Neither changes a pixel.

**What has NOT been established: which layer costs the 34 ms.** No desktop reproduces it — the same
clear sky measures 2.3 ms here. So the next measurement has to happen on the handset, and there is
now a tool for it: **Developer tools → "Find the cost"**, a row of switches that each remove one
layer. Turn one off, watch `rest` for ten seconds, turn it back on. Whichever one moves the number is
the answer. They change how the game looks on purpose; they are a measuring tool, not settings.

Try them in this order: **Weather layer, Season tint, Sky & clouds, Particles**, then the blunt ones —
**ALL blends** and **ALL masks**. If one of the blunt two moves the number a long way and none of the
specific ones do, the answer is the technique rather than any single layer, and that is a design
conversation rather than a bug.

**Still wanted from the owner:** a video of the crash. Safari's "A problem repeatedly occurred" is a
memory kill and confirms the above; a freeze with the page intact is something else entirely; and a
white screen is a third thing. The three have different fixes and the symptom is the cheapest way to
tell them apart.

*Where:* the `:not()` gate block after `.wx` in `style.css`, and `tools/probe.js`'s `layers:` step.


### The Sky Pass dips frame rate on an iPhone 16 — measured 2026-09-01, and it needs the owner's eyes

Reported from live play the morning the five skies landed. **Measured, and mostly fixed — but the
last word belongs to the handset and nobody has read it there yet.** Reasoning, method and what was
rejected are in the 2026-09-01 entry in [10-decision-log.md](10-decision-log.md).

**Wonderfall was the dip.** It cost eighty percent more per frame than a clear sky; every other sky
sat inside the bench's noise floor. Two rules did it, and both are fixed with the pixels proven
unchanged: the breathing warp was one animated colour-matrix filter duplicated across eight
full-window scenery layers and is now one, on `.scenery-warp`; the veil animated
`background-position`, a full-window repaint every frame, and now slides a tiled child on a
transform. Wonderfall now costs thirteen percent more than a clear sky rather than eighty.

**Two bigger costs were not on the suspect list at all, and are not about weather.** The screen shake
wrote three custom properties on `#game` every frame and `updateSky()` wrote seven on the document
root 1.67 times a second — invalidating everything beneath them, at 2.5–3.4 ms and 3.7 ms a call
against 0.004 ms and 0.19 ms for the same values written on the elements that read them. Both
pre-existed the Sky Pass; the Sky Pass added a subtree reading ninety-odd `var(--wx-*)` that made a
full recalc about 40% dearer, which is the best-evidenced answer to *why it started dipping when the
skies landed*. Both are fixed.

**Two Sky Pass animations were never gated** — `.wx-ray` and `.wx-front-cloud` declared infinite
animations in base rules, so ten invisible promoted layers animated under every sky from page load.
They are gated now. **This one is unproven rather than fixed**: it shows no measurable win on a
desktop bench, which does not charge for a promoted layer that paints nothing, where iOS commits
every promoted layer every frame. It is recorded honestly as a fix made on the evidence rather than
on a measurement.

**The suspects that were innocent**, so nobody re-chases them: the standing stack of blend layers
(they are cheap when they are not animating), the aurora's ribbons (inside the noise floor), and the
DPR-2 particle canvas — particles cover under 1.2% of the surface under every sky, and capping the
DPR is the one lever on the brief's list that cannot be taken without softening every particle edge.
[41-weather-staging.md](41-weather-staging.md) records the DPR-2 cap as an owner-specced constraint;
reversing it needs a device measurement and the owner's word.

**What is still open, and it is the part that matters.** Every number above comes from headless
Chrome with software rasterisation on a Mac. It ranks skies honestly and **it cannot tell you what an
A18 does with a `mix-blend-mode`** — iOS Safari pays for blends and animated filters in full-screen
compositing passes that desktop Skia does not charge for, which is exactly why this was reported from
a phone and not from a desk. The instrument for that is built and shipped off: **Settings →
Developer tools → Frame rate**, which prints the frame interval split into `js` and `rest` so a big
`rest` with a small `js` reads as "this sky costs paint, not code". Somebody has to hold each sky on
the handset and read it. Until then, "the web build holds 60 with all five skies live" is a
reasonable expectation and not a finding.

The owner's slider-approved feel is the spec; performance work may not change what a sky looks like,
only what it costs. `DATA.weatherStage` is untouched, and the look-parity diff is bit-for-bit on
Clear, Rain, Thunderstorm, Aurora and the Sunbreak.

#### The two-minute check, on the phone

Open the game on the handset, then **Settings → Developer tools**. Turn **Frame rate** on — a small
black panel appears under the quest bar. Tap the panel itself at any point to start a fresh window.

Then, from the same sheet, **hold the weather** on each sky in turn and give it about twenty seconds
before reading:

1. **Clear** first, and write the number down. It is the floor everything else is judged against.
2. **Rain**, then **Thunderstorm**, then **Aurora**, then **Wonderfall**.
3. **Play the whole sky → Sunbreak** if it is daytime — the panel's last line says whether it is.

What to read:

- **`fps` and `int`** are what your hand feels. `hz` is the refresh rate it detected — 60 on a base
  16, 120 on a Pro. A frame at or under `int 16.7` on a 60 Hz phone is a full frame rate.
- **`js` vs `rest`** is the diagnosis. `js` is our code; `rest` is paint, blend and composite. **A
  big `rest` with a small `js` means the sky is expensive to draw**, which is the class of cost this
  pass was hunting and the class no desktop can measure.
- **`>1.5x` and `>2.5x`** count frames that missed the budget. A handful over twenty seconds is
  normal; dozens is the dip.

**The answer that is wanted is one line per sky.** If Clear and Rain hold and only Wonderfall
struggles, this pass did its job and the remaining work is Wonderfall alone — which is 0.5% of slots.
If Clear does not hold, the problem is not weather at all and the two custom-property fixes above are
where to look first.

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

**Re-examined 2026-08-30, and the question has changed.** Two things were checked because an
overnight round was told the rename was "already implied by the glossary":

- **The glossary does not imply it.** [32-the-garden-year.md](32-the-garden-year.md) has sixteen
  entries and names none of "Garden Mastery", "Bloom Mastery", "Mastery" or "Garden Bonuses". There
  is nothing there to derive a replacement word from, so this is still exactly what the paragraph
  above says it is: the owner's call.
- **The collision this entry describes is unreachable.** "Bloom Mastery" appears in **zero**
  player-facing strings — all five hits in the shipped code are comments — `recordHarvest()` returns
  `mastery: []` so the "Tier N" toast cannot fire, and the petal tracks replaced the mastery goal
  line in the Almanac. A player scrolling the Almanac today sees `<h3>Garden Mastery</h3>` at
  `ui-sheet.js:1933` with nothing above it to confuse it with.

**So the question for the owner is no longer "what should it be renamed to". It is "is there still
a problem here at all?"** If Bloom Mastery is gone for good, this entry can be deleted rather than
actioned.

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

**Checked 2026-08-30 for a display-only fix that would dodge that decision. There is not one, and
the reason is the useful part.** The display fix is already in the code: `ui-sheet.js` clamps that
growth line in three places, and the clamp is precisely what turns the true state — say 40 lifetime
Rose against a goal of 24 — into the string "24 / 24 Rose to ★2".

The panel is not lying about the state. It is faithfully rendering a state that is itself
impossible, because `state.critters[id].level` and `state.discovered[seed]` are two independent
numbers and the growth bar's only job is to show the relationship between them. When they disagree
**every** rendering of that relationship is wrong in one direction: believe `level` and the count is
a lie, believe `discovered` and the stars row is a lie. That is also why the summon cheat's empty bar
is the honest number and this one is not — they are the same disagreement read from opposite ends.

A second clamp would move the lie, not remove it. **The fix is in the state**, which is the design
decision this entry already reserved.

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
scope, and a bare `location.hostname` there is a `ReferenceError` that takes all 1,444 checks with
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

### ~~`.quest-card` has the seed row's material but not its contact shadow~~ — FIXED 2026-08-30

It has it now. Measured on a live quest card: `0 4px 0 var(--ink-2), 0 8px 14px rgba(44,26,16,.24)`,
which is `.seed-row`'s stack exactly, so the two rows built from the same recipe finally sit at the
same height above the paper. Doc 05 pairs a 4px lip with that shadow and says they scale together or
the object looks like it is hovering at the wrong height.

`.seed-row`'s press — the `translateY(4px)` and the `:active` shadow swap — was **not** copied
across. That is a separate decision about whether a quest card is a thing you press, and the ruling
here was about height, not behaviour.

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

`tools/style-check.js` is the thing that notices. Zero dependencies, one file, six checks: raw hex
outside `:root`, translucent `box-shadow` lips, undeclared custom properties with no fallback,
undeclared custom properties with one, corner radii outside the ladder, and a count of distinct
border widths. The first three fail; the last three only report, because the geometry sweep below is
deliberately deferred and a measurement should not smuggle in a decision.

**The missing-variable check is split, and the split was found by running the tool on code it had
never seen.** Pointed at the in-flight Sky Pass branch it reported 26 undeclared properties — every
`--wx-*` knob the weather CSS reads. They are still undeclared and always will be: the stylesheet
never sets them, `ui-weather.js` mirrors them onto `#game` from `DATA.weatherStage` at runtime so a
layer can be pure CSS and still be retuned without a build. All of them carry a fallback, all of
them are deliberate, and a gate that fails on those is a gate that fires on correct work.
`var(--x)` with no fallback drops the declaration at computed-value time
and paints nothing; `var(--x, 12px)` paints the fallback. Only the first fails, and its baseline is
**zero** — so the next one is caught the day it appears.

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

### Sheet panels use `innerHTML` with interpolation (measured 2026-08-30, overnight round)

**There is still no live vulnerability, and the reason to leave it that way is that a blanket escape
would break four times more than it fixes.** The surface was parsed rather than eyeballed: every
template literal in the nine `ui-*.js` files, with its interpolations counted and each one sorted by
what it actually returns.

**The size.** 56 `innerHTML` assignments. 513 template literals, 221 of which carry markup. 1,282
`${…}` interpolations, of which **908 reach an `innerHTML`** — either directly or through a template
nested inside one. 796 of the 908 are in `ui-sheet.js`, and all but six of those sit below a single
line: `el.sheetBody.innerHTML = render ? render() : ''` at `ui-sheet.js:151`, which dispatches to 23
panel renderers. The rest are `ui.js` (53), `ui-fall.js` (21), `ui-meadow.js` (20), `ui-hollow.js`
(10), `ui-news.js` (6), `ui-scenery.js` (2).

**Why it is not a find-and-replace.** Of the 908:

- **468 are markup that must NOT be escaped.** `${Icons.get('coin')}` returns an SVG string — that one
  icon appears at 16 sites — `${Critters.draw(def)}` returns a whole creature, and a nested
  ``${trait ? `<span class="critter-trait">…</span>` : ''}`` returns a fragment. Escaping any of them
  prints tag source into the panel.
- **120 are text that must be escaped.** `${def.name}`, `${def.about}`, `${good.line}`, `${s.desc}`.
- **320 cannot carry markup at all.** `${fmt(cost)}`, `${pct(eff.catch)}`, `${can ? 'affordable' :
  ''}`, `${s.art.c1}`, `${(n / 9) * 100}`.

**The middle category is 3.9 times the size of the first, and that is the whole problem.** A blanket
`esc()` needs 468 hand-judged opt-outs across 6,568 lines, and each mistake is a silent visual break
rather than a crash. Two facts make it worse. 191 of the 908 sit *inside a tag* — 137 in a quoted
attribute, 42 inside `style="…"`, 12 unquoted (all twelve a literal `disabled`) — so one escape
function is not even the right tool everywhere; a colour going into `style="--set:${set.tint}"` wants
a CSS-value guard, not an HTML one. And escaping destroys the HTML entities that already travel
through interpolations: `skyLine()` at `ui-sheet.js:280` returns a string containing `&middot;` and is
interpolated at `:298`, so a blanket pass would print a literal `&middot;` on the weather card.

**The first player-typed text has now shipped, and it is the player's NAME, not a creature's.**
The menu drawer (2026-08-31) holds an editable `state.profile.name`. This entry was written for that
feature before it existed, and it was built to this ruling rather than to a new one. **The plan
predicted a handful of sites rather than 908, and the real number is TWO:** `paintName()` in
`ui-menu.js`, which writes `.textContent` into a `<b data-pname>` the template left empty, and the
edit field's `.value`. There is no third, and there is no `esc()`.

**Both halves of "what would hold it" are now built.** `tools/html-check.js` exists in the shape
this entry specified — no dependencies, a small text reader, a `html-check.json` baseline that
ratchets — and its named list of free-text fields is no longer empty: `state.profile.name` is its
first entry, listed by all three of its spellings (`profileName()`, `profile().name`,
`state.profile.name`), because a check that knew one would pass while the other two shipped the bug.
The probe regression the entry asked for was run with the name set to
`<img src=x onerror=alert(1)>`: `document.querySelectorAll('img[onerror]').length === 0`, the `<b>`
has zero element children, and the console is clean.

**One thing the entry did not anticipate, found by sabotaging the checker.** A template literal has
to be found by walking the file, and a *depth counter over backticks is not enough* — the first
backtick inside a template opens a nested one rather than closing the outer, so a nested case reads
as a closed span and slips through in silence. The first version of that walker did exactly that and
passed a planted `${a ? `<span title="${S.profile.name}">` : ''}` without a word. It keeps a mode
stack now, with a brace counter per expression so an object literal cannot end one, and it was
re-broken four ways before being believed. **A check that has never gone red is not a check.**

**Nothing else is reachable today, and that was checked rather than assumed.** Across every
non-legacy script and `index.html`: zero `<input>`, zero `<textarea>`, zero `contenteditable`, zero `prompt()`,
zero `location.search` / `location.hash` / `URLSearchParams`, zero `postMessage`, and no `fetch`
outside `sw.js`. Every string in state is an id from `data.js` or a number, and no string value in
`data.js` contains a tag. The only route is hand-editing `gw-save` in devtools, which is a player
attacking themself.

**What a naming feature would actually touch is 16 sites, not 908.** Naming a creature is the
likeliest, and it is one field. Eleven direct renders: `ui-hollow.js:83`, `ui-meadow.js:209`,
`ui-sheet.js:455`, `:1284` (a `title=` attribute), `:1311`, `:1336`, `:1469`, `:1494`, `:1518`,
`:1531` (`other.name`) and `:1584`. Five more arrive through two shared funnels — `UI.toast()`
(`ui.js:623`, interpolated at `:627`) from `ui-hollow.js:142`, `ui-meadow.js:334` and `ui.js:1313`,
and `UI.showBanner()` (`ui.js:1200`, interpolated at `:1201`) from `ui-events.js:363` and `:373`.
Hardening the two funnels covers all five, so it is thirteen edits. Three places already do it safely
and need nothing: the `setAttribute('aria-label', …)` calls at `ui-hollow.js:78`, `ui.js:1237` and
`ui-meadow.js:216`.

**The ruling: player-supplied text never enters a template literal, and no `esc()` helper is
written.** A field that can hold free text gets an empty labelled node from the template —
`<span class="cp-name" data-cname></span>` — filled with `.textContent` in one pass after the panel
is written; attribute cases use `setAttribute`. `sayText()` at `ui.js:309` already works exactly this
way. It costs zero sites today, which is what makes it safe to adopt before the feature exists, and it
survives the Unity port in a way an HTML escape function would not. The one honest price: a name
inside a sentence — `Pet ${def.name}`, `A meal wakes ${def.name} up` — gains a wrapping span.

The alternatives were priced. A blanket `esc()` needs the 468 opt-outs above. **Escaping at the
boundary** — storing `esc(name)` in the save — is cheapest to write and worst to live with: `&lt;`
ends up in the save file, [07-save-data.md](07-save-data.md) has to promise that field is
HTML-escaped forever, the three `aria-label` sites and `sayText()` would show the escaped form, and
every old save is stranded the day anyone changes their mind. **Doing it at the point of use when the
feature is built** is right on timing and has no teeth — it is what this entry already said, which is
why the entry is still here.

**What would hold it.** `tools/sim-test.js` loads only `data.js`, `icons.js` and `game.js` and
contains no reference to `document` or `window`. It cannot see any of this and should not be made to:
`game.js` staying DOM-free is what makes that suite cheap and what is meant to survive the port. Two
things can hold it instead, and both have a precedent in `tools/`:

- **`tools/html-check.js`, in the shape of `tools/style-check.js`** — BUILT 2026-08-31. No
  dependencies, a small text reader, and a `html-check.json` baseline that ratchets rather than
  judges. One rule: a named list of state fields that can hold free text and a failure if an
  accessor for one appears inside a template literal in a `ui-*.js` file, `ui.js` or `index.html`.
  `game.js` is excluded on purpose — it never touches the DOM, so a template there is a string for
  something else to decide about. It passed green on an empty list for as long as the list was
  empty, which is the only way a check written before its feature lives long enough to meet it.
- **`tools/probe.js`**, which already drives headless Chrome over CDP, takes `eval:EXPR` and exits
  non-zero on an uncaught page error. RUN 2026-08-31 against the real thing: set the name to
  `<img src=x onerror=alert(1)>` through the field the player uses, and
  `document.querySelectorAll('img[onerror]').length === 0` with no console errors. Also run with
  `<b>x&y</b>`, which renders as the literal five characters and whose `innerHTML` reads back as
  `&lt;b&gt;x&amp;y&lt;/b&gt;` — the browser escaping on the way out of `textContent`, which is the
  whole mechanism working.

*Where:* `ui-sheet.js` (796 of the 908), `ui.js` (53), `ui-fall.js` (21), `ui-meadow.js` (20),
`ui-hollow.js` (10), `ui-news.js` (6), `ui-scenery.js` (2). The sink to leave alone is
`ui-sheet.js:151`; the problem was never the sink.

### Five flakes have been found in this suite, and the class of bug keeps recurring

All fixed. The first two on 2026-08-14 (**4 of 50 runs failed** beforehand), the next two on
2026-08-15, the fifth on 2026-08-30.

**Re-measured 2026-08-30 at 1,408 assertions: 45 consecutive runs, 0 divergent.** Ten was the ask;
ten is not enough to believe, because the flakes recorded below were 4-in-50 and roughly 1-in-25, and
ten runs would miss a 1-in-25 flake two times in three. Forty-five is the number that makes "it does
not flake" mean something. The twenty-one design-rule assertions added the same day read files and data
tables and roll no dice, so they cannot introduce this class of bug.

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
- **Three growth assertions read the real weather**, because the suite started its clock at
  `Date.now()` and the sky is a function of wall-clock time. That was harmless until rain began
  changing how fast things grow; from that moment the same three assertions passed or failed
  depending on what the weather happened to be doing while the suite ran. The clock is pinned to a
  fixed epoch now, chosen because its slot and the two after it are Clear and in daylight — the
  neutral conditions an unrelated test should see. Anything that wants a sky asks for one and puts
  it back.

**The general rule:** any assertion touching a harvest **or a tap** has to pin `Math.random`, because
both pay rarity, gems, mastery tiers and Wonder rolls from the same call. Prefer asserting an exact
value on one harvest over a tolerance on a sampled mean — a statistical test that passes
forty-nine times in fifty reads as a real regression the one time it doesn't, and the person who
hits it will go looking for a balance bug that isn't there.

**The clock is a die too.** `Math.random` is not the only unpinned input: the sky, the hour and the
day all fall out of the wall clock, and any one of them can be wired to something a test measures
without the test ever mentioning it. A suite that starts at "now" runs a slightly different
experiment every time it is run.

**And re-check your instruments after an economy change.** The lantern flake was not a bad test when
it was written; a faucet fix eight times smaller made it one. A sampled test is coupled to whatever
number its rate is built on.

**Also clear the ladder.** Any loop of many harvests climbs Bloom Mastery as it goes, so a test
measuring some *other* multiplier must call `clearMastery()` — and prefer a single harvest, where
the question does not arise.

### No automated tests for anything above the simulation

`tools/sim-test.js` runs the real `game.js` headlessly and now covers 1,444 assertions over the
economy, progression, saves and mastery. Everything above that line — every `ui-*` file, layout,
the sheet, FX — is verified by hand against the checklist in
[09-conventions.md](09-conventions.md). That is the right split for a prototype, but a UI
regression has no net under it.

**This bit during the `ui.js` split.** The suite stays green through a change that breaks the plant
picker, because it never loads a DOM. A UI change has to be played, panel by panel, or it is not
checked at all.

**`ui-weather.js` is the largest thing yet on the wrong side of that line.** It is not a renderer —
it holds which sky the layers are wearing, which phase it is in and a fan of timers, and it hands
over between one sky and the next. The suite can testify that none of it reaches the save, and the
probe can photograph any sky standing still (`UI.weatherSequence()` exists to be driven from an
`eval:` step, and the live game never calls it). What nothing checks is a *handover*: a sky
interrupted mid-arrival, a bought sky landing on a front, a tail cut short by the next front. Those
were played by hand, and they are where the next weather bug will be.

## Documentation

### Seven stale claims in `docs/`, found by the 2026-08-26 design audit

Listed in full in [27-design-audit.md](27-design-audit.md#stale-documentation-found-during-the-audit).
Left unfixed on purpose: several of them sit in sections the pending design decisions will rewrite
anyway, and correcting a paragraph that is about to be replaced is churn. The two that mislead
hardest and should be fixed regardless of what gets decided:

- ~~**[13-order-system.md](13-order-system.md) opens "Status: specification, not built."**~~ —
  **already fixed, and this bullet was the stale one.** Its header has read "Status: built
  2026-08-25" for some time. Checked 2026-08-30.
- ~~**[12-meta-layer-design.md](12-meta-layer-design.md) locked decisions**~~ — **FIXED 2026-08-30.**
  Both are struck through in place with what replaced them: the offline cap is two axes rather than
  one flat eight hours, and storage caps were confirmed never built by grepping the engine — the
  only capacity in it is the five jars a hive holds. Struck rather than deleted, because a locked
  decision that quietly disappears reads as though it was never made.

**The pattern is the point.** Status lines and "locked decisions" go stale faster than body text,
because a later session adds a new section rather than retracting an old one. Body text usually
gets its retraction; headers rarely do.

### ~~Nothing enforces a design rule the way `sim-test.js` enforces an economy rule~~ — BUILT 2026-08-30

Twenty-one assertions, in five groups at the end of `tools/sim-test.js`, each one a sentence a doc
already states turned into something that can go red. Every one was **sabotaged individually and
confirmed to be the assertion that fails** — in a throwaway copy, so the tree was never dirty.

- **The offline list still lists the game.** Every `<script>` in `index.html` is in `CORE` in
  `sw.js`, every `CORE` path is a file that still exists, no path starts with a slash, and every
  script on disk is one the page loads. `sw.js` precaches with `Promise.allSettled`, so a file left
  out fails without a sound and the symptom is an installed app that will not boot on a train.
- **Every badge in the data reaches a surface a player can see** — step 3 of the add-an-upgrade
  playbook, plus a check that this suite's own hand-kept `UI_BADGE_KEYS` still matches the tab.
- **Every announcement image survives the trip to a real phone**: precached, on disk, and
  **lowercase**. That last one earns its place — sabotaging the path to `Garden-Year.png` left the
  on-disk check **green**, because a Mac disk is case-insensitive and GitHub Pages is not. Doc 09's
  "this bit once already" reproduced exactly.
- **Decor stays cosmetic and boosters stay unbuyable**, read against the *catalogue* rather than a
  migrated save, and asking about six price fields rather than the one word `tickets` that the
  existing check was written for.
- **Every good carries the line its customer speaks**, and names the offender when it does not.

Of the four candidates this entry originally named, one is dead and one is not a data rule:

- **The place taxonomy is gone with the map.** `overworld.js` and `ui-map.js` are not on disk and
  `docs/25-world-map.md` was retired the same day this entry was written.
- **The currency policy is a constraint on a diff, not on a snapshot.** "Adding anything to this
  list requires removing something else" is a rule about a change; a test only ever sees one state.
  It cannot be asserted, and see the Documentation section below — it is also already broken.

### Five documentation faults the design-rule pass turned up

Found by trying to assert what the docs say and discovering the docs are wrong. None are code bugs.

- **[33-year-one-economy.md](33-year-one-economy.md) says "every level grants something, and no two
  adjacent levels grant the same category."** The **first half is false**: `DATA.levelGrants` has no
  entry at levels 9, 11, 13, 14, 16 or 17. The rotation half holds and is now asserted. The sentence
  needs its first half retracted, or the ladder needs filling — that is a design call.
- ~~**The currency policy is violated by its own terms.**~~ **Fixed 2026-08-31 by the design
  session:** Saved Seeds joined doc 12's table in the slot retired tickets vacated — the trade the
  rule demands existed all along and was simply never written down. Petals are recorded there as
  purchases, not a currency (an upgrade level is not a wallet), and `tickets` stays a dead field
  for old saves.
- **[26-goods-catalog.md](26-goods-catalog.md)'s schema example does not match shipped `GOODS`.** It
  shows `chain: { rung }` and `inputs: [...]`, which no shipped good carries, and omits `icon`,
  which all ten have. Ahead of the data in one direction and behind it in the other.
- **[33-year-one-economy.md](33-year-one-economy.md) cites `ui-map.js:257`** as the sole caller of
  `UI.enterMeadow()`. That file was deleted 2026-08-30, so the argument around it — 114 reputation
  of meadow-dependent quests — rests on a reference that no longer resolves.
- **The rotation rule has to be read at the grain of the reward, not the row key.** Read as
  `boost`/`hive`/`decor`/`gems` it fails at nine consecutive pairs today, because levels 2–15 are
  all boost rows. Read as *which* boost, the ladder rotates exactly as the doc describes. Anyone
  re-asserting this should know which reading is meant.
