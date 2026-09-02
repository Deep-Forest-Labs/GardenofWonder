# The Night Shift — Winter, and Holly who keeps it

**Status: the spec, 2026-09-01 — slice C's design, ruled by the owner's adoption of the design
desk's recommendation and pressure-tested before it entered this folder** (two adversarial
critics; three blockers and thirteen highs found and folded in — the reasoning and the rejected
alternatives are in the 2026-09-01 night-shift entry in [10-decision-log.md](10-decision-log.md)).
The look and feel still pass through the spike gates below; layout and art are approved by the
owner's eye, never by this document. Where this spec is silent, the builder asks the owner rather
than inventing. Every number here is **provisional and marked**, ships in `data.js`
remote-config-ready, and is measured before it is called final.

**The sentence: *tuck your garden into bed, and see what the morning brings.***

## What Winter is (and the one rule above it)

A season is **a speed and a rule, never a re-skin**. Winter's speed is **half a day to two days**;
Winter's rule is **the night pays extra when the garden was kept** — and the keeper of it is
Holly.

- **Opens at Turn 3** (`DATA.year.winterTurn`, already live). All eight plots open the moment it
  unlocks — Turn 3's gift, as Fall was Turn 1's. Note the moment: the gate lifts **inside the
  Turn ceremony**, when gold has just been zeroed to a fresh purse — the entry plant's price is
  set for that morning (see the ladder below), or the player meets Winter and cannot afford it.
- **The board is the garden's own grammar**: eight plots, the season's hero flower in the middle
  paying exactly what taps pay everywhere (`UI.flowerBtn()`'s rule). Art ships as a background
  swap — snow over the familiar bones — with real art later, per the standing call. **Winter's
  board mirrors Fall's `fl-*` markup pattern and never reuses `.plot` or `data-stage`** — the
  four-stage growth system is Summer's, and its style block is load-bearing for the exporter.
- **Winter plants are outside every flower system and every growth modifier** — Fall's precedent
  extended deliberately: no rarity, no mutations, no gems, never `discovered`, no pantry; no rain
  shave, no petals, no Keepers, no sprinklers, no boosts. They count generic `harvest` quest
  tracks and **nothing else — including `state.year.stats`: kept collects write no Tally counter
  and get no Tally line at slice C** (Fall's windfall does feed the Tally; Winter deliberately
  does not — it is the quiet season, and a Tally line can arrive later with the story). They
  also **never enter the Stand's pools** — cross-season demand is slice D's question. *(Doc 32's
  "Fall produce joins when Fall opens" sentence describes an unbuilt slice-D future; it is
  annotated there now.)*
- **Winter plants never enter `passiveIncomeRate()`.** Offline income is automation the player
  owns; Winter needs no automation — its plants ripen on their timestamps and pay on collect.
- **The Turn never touches Winter, including its ripe plants.** Doc 32's in-flight auto-collect
  rule is scoped to the main garden (its bullet now says so): a ripe Winter plant — kept or not —
  crosses the Turn intact and pays into the year it is collected in. The partition test pins it:
  a Turn taken over a kept ripe Winter cell leaves the cell, its mark and the wallet untouched.
- **Winter plant ids are append-only once shipped** — never renamed, never removed. The load
  path drops unknown ids to empty cells (Fall's disposal rule), and Winter advertises long holds,
  so a renamed id would silently delete a held bloom a player was saving.

## The ritual — the tuck-in and the snowfall

**Evening: the tuck-in.** One tap on the bed's tuck button, whenever the player's day ends — the
mechanic is **time-free** (tucking at 2pm is fine; it means "goodnight" whenever you leave).
Quilts settle over the plots and the plants sleep — **the sleeping-face grammar (shut-eye arcs,
drifting Zs, the slow breathe) redrawn for plants**: new hand-drawn work under doc 05, shown at
the wireframe gate, with no stake attached — and Holly takes the watch.

**Morning: the snowfall.** A plant that **ripened while the bed was tucked in** is *kept*: it
wears a frost-kissed shimmer and pays the **snowfall bonus** when collected — Fall has the
windfall, Winter has the snowfall, one bonus grammar met twice.

### The tuck's lifecycle — ruled, so no builder invents it

1. **Tucking sets `tuckedAt = now`** on the bed. One tap, free, repeatable across nights. There
   is no separate untuck verb — the night ends on its own (below), and the button reads as the
   bed's state.
2. **A standing tuck covers the whole bed, including plants sown under it.** Plant-then-tuck and
   tuck-then-plant both work; the quilt is over the bed, not over a list.
3. **`kept` is DERIVED from timestamps, never observed live** — Winter ripens while the app is
   closed, so no code runs at the ripening moment. The rule: a plant is kept iff its computed
   ripen instant (`plantedAt + grow`) falls **inside the recorded tuck window**
   (`tuckedAt ≤ ripenAt < the night's end`). The mark is derived whenever ripeness is first
   observed — load, reconcile, tick or collect — then persisted per cell, Fall's per-cell-marks
   pattern with the `bedPaid` lesson applied to the tuck itself: **timestamps are the stored
   truth; everything bed-level derives from them.** Consequence, and a named test: **tucking
   after a plant has ripened earns nothing** — kept requires `ripenAt ≥ tuckedAt`.
4. **First light is an event, not an hour: the first collect from the bed after any covered
   plant has ripened ends the night** — quilts lift, `tuckedAt` clears, and ripenings after that
   moment are unkept until the next tuck. Marks already earned are unaffected: **a kept plant
   collected late (or much later) still pays its snowfall** — replanting, partial collects and
   the passage of years never void an earned mark, and the bonus applies at collect-time rates
   (a retune between earning and collecting repays at the new rate — accepted).
5. **The morning collect is `Game.winterHarvestAll()`** — one atomic commit shaped on
   `fallHarvestAll()`, with the one semantic that a literal mirror would get wrong spelled out:
   **it collects every ripe plant, kept or not, and pays the snowfall only on the kept subset.**
   `Game.winterBedValue()` sums both populations, bonus applied per kept mark, so the number on
   the button is the number the tap pays. A mixed bed — kept and unkept-ripe together — is a
   named test case, because the all-kept path is the one walk that hides the difference.

**The rules that keep it cosy — each one a sim-test:** nothing is ever lost to a night (no frost
damage, no wilting, no decay — pre-rejected in the decision log so no builder proposes it); an
untucked bed grows at full speed and pays full base; the tuck-in adds and never protects; the
bonus is an appointment, not a test — like the windfall, it is meant to be earned by anyone
playing the season at all, and the yields are priced assuming it.

### How a player learns it

Winter mirrors **Fall's chip grammar**: a chip above the board states the rule and the bed's
state ("Tucked in — 3 growing" / "2 kept blooms waiting — +50%"), with `hollyTuck` free to carry
the flavour. The rule lives on the chip; Holly's lines are never load-bearing.

## The economy — provisional numbers and two guardrails

**PROVISIONAL, all of it — one knob each in `DATA.winter`, measured before shipping:**

| Plant | Clock | Cost | Yield (×1.4) |
| --- | --- | --- | --- |
| Snowdrop | 12h | 2,500 | 3,500 |
| Winter Jasmine | 16h | 6,000 | 8,400 |
| Cyclamen | 20h | 14,000 | 19,600 |
| Paperwhite | 24h | 30,000 | 42,000 |
| Witch Hazel | 36h | 70,000 | 98,000 |
| Camellia | 48h | 160,000 | 224,000 |

- **Snowfall: +50%** (`DATA.winter.snowfall = 0.5`) — the windfall's learned size.
- **The clock floor is 12 hours** — doc 33's own band (12–48h), restored after the pressure test
  caught an 8h draft entry sitting on Fall's apple clock. "Plant at dinner, ready at breakfast"
  still holds at 12h. **Pricing constraint: at any clock length the seasons share, Winter's
  per-hour rate prices below Fall's** — the tuck's convenience premium is paid in rate, so
  Winter never simply dominates Fall's overnight anchor.
- **Guardrail one, a measured assertion, not a hope: a single full kept night must not clear
  both Turn gates on its own at Turns 3–6.** The pressure test worked the arithmetic: at modest
  cost sizes, eight kept plots can trip `minCoins` and the `minSeeds` increment overnight, and
  every extra Turn pays the blessing — the one per-Turn faucet nothing prices (doc 11's open
  item, upstream of these costs). The cost ladder is tuned under this constraint.
- **Guardrail two, the Turn vault, named and accepted:** because ripe Winter crosses the Turn and
  pays into the new year, holding a ripe bed through a Turn is good play — a bounded vault of at
  most eight × top cost × 2.1 into a fresh purse. This is Fall's own seam, wider; it is
  **accepted as cosy planning, not an exploit**, its size is a stated tuning input, and if live
  play shows it distorting the Turn the ready answer is the Preserve's grammar (doc 41), not a
  clamp. Slice C's pacing measurement includes a Turn-crossing hold arm so the acceptance is
  measured rather than assumed.

**The measurement, with its prerequisites named** (they are already-ruled work, not new asks):
seed `year-sim` and extract the shared `tools/play-model.js` **before** Winter's measurement (doc
11's standing items — a Winter model must not become the fourth diverged copy of the play model);
add a tuck-and-collect Winter arm to the model; run seeded and paired against a winterless
baseline. **The metric:** a kept night's payout as a share of the casual player's trailing daily
income (target band set at measurement, guardrail one asserted by exit code), with Winter payouts
excluded from any per-active-minute rate the way `order-gold.js` excludes offline income — a
whole night's payout attributed to the one active second of the morning collect is exactly the
inflation that tool's preamble warns about.

## Holly — the winter rose

The game's second character-grade flower (the full character ruling, the silhouette test and the
rejected alternatives are in the 2026-09-01 Holly entry in the decision log). The build facts:

- **Species: the winter rose** — a real flower that blooms in snow. Keeping the garden overnight
  is not her job, it is her nature — and she will insist she didn't do it for you.
- **Look** (the character spike explores; the owner picks): pale porcelain face where Summer's is
  warm yellow; outer petals near-black plum with hot-pink undersides; a frost crown of **five or
  more points, never two**; angled, lashed, mischievous eyes; a smug smile; one hot-pink accent
  (winterberry earrings or pink-tipped petals). Flat inks, the house outline, doc 05 throughout —
  the ice lives in palette and shape, never translucency or sparkle shaders. **The silhouette
  test is a build gate**: filled as plain black she reads as no one but herself; the spike
  carries a black-silhouette row and a small-size row (the avatar picker renders faces at 46px —
  she must survive it).
- **Voice**: deadpan, superior, secretly devoted. **Her sass aims at the Summer flower, never at
  the player.** Four buckets, small on purpose: `hollyIntro`, `hollyTuck`, `hollyMorning`,
  `hollyIdle`. Weather chatter stays the Summer flower's job — deliberate scoping.
- **The introduction is two beats in two rooms** — the meadow-signpost lesson applied before it
  can recur. Beat one: the Turn-3 ceremony shows **Winter's gate card** (Fall's `fallOpens`
  pattern) — the gate lifts where the player is standing. Beat two: **`hollyIntro` plays on the
  player's first entry to Winter** — 3–4 scripted lines in her own room, the one-shot flag
  consumed only after the line has actually drawn.
- **She is the flower button** — center cell, taps pay what taps pay. She joins the avatar
  picker once met, gated like any earned face.
- **Prerequisite, absorbed into slice C: the speech bubble gets a per-season home.** `#speech`
  lives inside the garden's flower cell and is hidden outside Summer (doc 11 — "Fall's flower
  cannot speak"). Holly's lines are the season's soul; the bubble lives with whichever hero is
  on screen, and Fall inherits the fix for free.
- **The chips follow the owner's #11 ruling into Winter.** Fall has always been outside boosts by
  construction; the 2026-09-01 ruling ratified it and ordered a running power-up's chip hidden in
  any room it does not reach — naming winter in its own words. Tonight's fix round builds the
  room filter; **slice C extends it (and #9's tooltip close-on-room-change guard) to Winter.**
- **The Summer flower keeps the icon, the tutorial and the ceremony.** Holly is additive.

## The welcome-back scene learns about Winter

Doc 32's slice C row names the extension. The mechanics that make it true: `reconcile()` gains
Winter's counts (ripened, kept) **and both of its nothing-happened null-gates include them** — a
morning whose only news is kept Winter blooms must produce a scene, and today the scene reads
`state.grid` alone. Winter is the first non-Summer garden the scene reports: the payload test is
new ground, not a mirror. One line in the telling, the snowfall named, Holly credited when the
bed was tucked. Reporting, never a new faucet.

## State, save, and the review kit

`state.winter` mirrors `state.fall`'s shape: a positional grid rebuilt to `DATA.winter.plots`
length on load, never merged; per-cell kept marks with their own backfill; `tuckedAt` (and the
night-end bookkeeping) stored as timestamps, everything bed-level derived from them. Every new
field is classified in the Turn partition (all of Winter is SURVIVES), and joins `defaultState()`,
the `load()` backfill and the suite's grid-clearing helpers in the same commit — the three places
new grid fields have historically leaked. No save migration: Winter did not exist.

**`Dev.warp()` gains Winter's clocks in the same commit the fields ship** — `plantedAt` and the
tuck timestamps wound together, `state.lastSeen` untouched as ever — or the owner cannot review
an overnight season in an afternoon and the five-minute script needs real nights.

## The slice C test bill (asserted headless, sabotaged, then believed)

1. The full `state.winter` subtree survives `turnYear()` verbatim — extended partition test —
   **including a kept ripe cell crossing a Turn with cell, mark and wallet untouched**.
2. No Winter plant ever writes rarity, mutation, gems, `discovered`, the pantry, **or
   `state.year.stats`**.
3. No growth modifier reaches Winter — rain, petals, Keepers, sprinklers, boosts — asserted from
   the NO side (delete the guard, suite goes red).
4. `passiveIncomeRate()` ignores Winter entirely.
5. Kept derivation: ripen-inside-the-window pays snowfall; ripen-before-tuck pays base
   (**tuck-after-ripeness earns nothing** — the named fishing case); ripen-after-first-light
   pays base until the next tuck.
6. Marks persist: save/load round-trip, collect-years-later still pays, replanting and partial
   collects never void an earned mark.
7. `winterHarvestAll()` is atomic — one credit, one save — and **the mixed bed** (kept +
   unkept-ripe in one collect) pays each population correctly; `winterBedValue()` equals what
   the tap then pays.
8. The tuck lifecycle round-trips: tuckedAt set by the tap, cleared by first light, covered
   plants sown under a standing tuck are kept.
9. Engine gates: `Game.winterOpen()` at `winterTurn`; the `hollyIntro` one-shot arms once and
   exposes an explicit consume API (the drew-before-consume half, and the strip's `built` flip,
   are **browser items in the gauntlet by name** — sim-test loads no UI file).
10. The suite stays byte-identical across runs on the pinned clock; Winter's long clocks use the
    fixed-epoch discipline.

## Coordination with tonight's fix round — five live surfaces

Checked 2026-09-01; re-verify at kickoff, because these land tonight: **#15 retires the season
tabs** slice C might otherwise lean on — assert season state against the engine and the gate
screen, never the tabs, and expect the swipe coach marks re-anchored; **`goSeason()` is a
summer/fall binary** that slice C makes ternary while #15's fix sketch promises to leave it
untouched — a merge trap, sequence around it; **`seasonWaiting()` is hard-coded to Fall** and doc
43 already says it widens the day another season is built — Winter's morning-ready dot rides
that widening; **`renderRail()` is edited by #11 and #9 tonight** — slice C extends their room
filter and tooltip guard rather than re-implementing; **the stages pass owns the `.plot` /
`data-stage` style block** and the exporter refuses to run if its anchors move — Winter mirrors
`fl-*`, stays out.

## The gates, in order

1. **Two spikes, then STOP for the owner.** `tools/holly-spike.html` — three or four takes on
   Holly at 390×844, a 46px face row, the black-silhouette row, and sleeping-plants-under-quilts
   studies. `tools/winter-spike.html` — every Winter screen and state: the board under snow, the
   tuck button and tucked bed, the morning shimmer and Collect All with the snowfall stated, the
   chip, the ceremony's gate card, Holly's intro moment, the plant picker with real clocks.
   **DONE, 2026-09-01** — both are live and both are the record of what was decided:
   [holly-spike](https://deep-forest-labs.github.io/GardenofWonder/tools/holly-spike.html) ·
   [winter-spike](https://deep-forest-labs.github.io/GardenofWonder/tools/winter-spike.html).
2. **The owner's annotations build verbatim** — the motion-gate contract. **CLOSED, 2026-09-01**:
   the owner spent the gate on play rather than on reading — *"go with your recommendation on
   everything; I need to go in there and play with it"* — so every open question on both spikes
   was ruled by the builder and written down in the 2026-09-01 gate-1 entry of
   [10-decision-log.md](10-decision-log.md), which is where they are argued rather than here.

   **The as-built answers, so this document stays true:** Holly is **take A**, the seven-point
   crown; she joins the avatar picker **fitted**, because the picker's circular mask clips her
   crown off entirely and a dark disc beside the Summer flower has not identified her; the plants
   sleep **tucked to the shoulders**, bloom above the quilt; the board is **M1**, a dark
   cold-frame timber frame with mid frozen-earth cells and snow on the rail — the dark-body,
   mid-cell polarity of docs/05's tier table, not Fall's inversion; the strip below the board
   carries **one button whose verb is the bed's state** (Tuck → Tucked in → Collect all), and it
   is absent on an empty bed exactly as Fall's Collect All is; **no falling snow this slice**.
   Holly's hot pink is `#ff5d95`, which is `gp-talker`'s own bottom stop rather than a new hue.
3. **Engine as simulation first** (the phase-1 pattern): `winter.js` under the live game, the
   test bill green, the measurement run with its prerequisites — the live game unchanged (Winter
   sits behind a Turn-3 gate regardless). **SHIPPED, 2026-09-01.** As-built notes:

   - The engine lives in `game.js` beside Fall's, not in a `winter.js` — because **Fall's does
     too.** `fall.js` is the ART file (scene, floors, crops) and every line of Fall's economy is
     in `game.js`. Winter mirrors that split exactly: the economy is a `game.js` block and
     `winter.js` will be the art file when the surface ships. A separate `winter.js` holding
     economy would have been the first place in the project where a season's rules lived outside
     `game.js`, and `game.js never touches the DOM` is the rule that makes that block the right
     home.
   - `state.winter = { grid, tuckedAt }`, per-cell `{ seed, plantedAt, grow, ready, kept }`.
     `tuckedAt` is restored from the save (unlike Fall's `bedPaid`, which is derived fresh);
     `kept` is derived and then persisted, because it records something that happened on a night
     that may be long over.
   - The full bill is green at **1,592 assertions**, and **every guard was sabotaged before it was
     believed** — eighteen sabotages, each one checked for the *exact* assertion going red. Three
     found real gaps and are now closed: a Tally counter written in `winterHarvestAll` survived
     because only the single-harvest path was walked; the Turn's auto-collect was never asserted
     from the NO side; and the mark-containment invariant (every kept cell is a ripe cell, which
     is what makes a collect-all unable to strand a mark) was assumed rather than pinned. One
     guard is genuinely **belt-and-braces** and the suite now says so out loud rather than
     carrying a test that cannot fail — `winterPlant()`'s `cell.kept = false`, the same shape as
     `fallHarvestAll()`'s `def.century` check.
   - **The suite pins its own epoch for this group.** Earlier groups leave the suite clock at a
     few hundred thousand seconds, and `load()`'s pre-epoch heuristic — a timestamp under `1e8` is
     elapsed-seconds corruption — cannot tell a legitimate small clock from a corrupt one. Right
     for the game, wrong for a suite running in 1970. Byte-identical across runs, verified three
     times.
   - `Dev.warp()` winds Winter's plant clocks **and its tuck together**, or an owner who warps
     twelve hours forward arrives at a night that never happened. The warp's own rule is stated
     precisely in the suite now: `lastSeen` is never wound *backwards* (`processWeather()`
     re-pins it forward), because winding it back would hand out an offline absence the player
     did not have.
4. **The surface**, faithful to the approved spikes; capture-screens gains Winter scenes and
   docs 44/45 regenerate. **SHIPPED, 2026-09-01.** As-built:

   - `winter.js` (art) + `ui-winter.js` (board), mirroring `fall.js` / `ui-fall.js`. Board classes
     are `wi-*` throughout and nothing here touches `.plot` or `data-stage`.
   - **One button below the board whose verb is the bed's state** — Tuck the bed in → Tucked in →
     Collect all — because Fall's Collect All already owns that strip at 132px and the band's two
     buttons are not hidden in Winter either.
   - **The speech bubble has a per-season home**, and it turned out to be two bugs: the node, and
     `sayText()`'s coach test, which refused every line in a season room because the coach is
     `display:none`'d there while `hidden` stays false. Fall's `windfall` line has drawn on screen
     for the first time since Fall shipped.
   - **The rail's room filter landed here** rather than waiting for the fix round — the #11 ruling
     names Winter in its own words, and Winter is the season that makes the rule visible.
   - `goSeason()` is a table of rooms with a leave-then-enter walk, so Spring is one row.
   - Holly is in `flora.js` at the Talking Flower's construction, and in the avatar picker
     **fitted**, gated on `seen.hollyIntro`.
   - Twelve new colours: three declared ramps and two gate literals, all in docs/05 with reasons.
5. **The gauntlet** (doc 34) — invariant coverage, partition, pacing, visual fidelity against
   the spikes then doc 05, the grammar critic (Winter reads as the same game at a different
   speed; Holly reads as this game's character and no one else's — silhouette test re-run), the
   named browser items from the bill, reduced motion, and scope (zero change outside the slice).
   Then the owner's verdict on the season's own question: **does the overnight ritual form?**

   **TWO ROUNDS RUN, 2026-09-01.** Eight critics, every finding verified before it was believed.
   The four that mattered most were things no green suite would have caught:

   - **Holly failed her own build gate.** Filled in plain black only THREE crown points read,
     against a ruling that says five or more and never two — the short points alternated to 0.66
     and topped out just under the petal ring, which swallowed four of seven. The alternation, the
     base radius, the crown length and the petal scale are **one measurement**, and the code says
     so now.
   - **The sleeping face was unreachable code.** A tucked plant is never ripe, so it is never at
     stage 3, and the shut-eye arcs only existed there — the entire study the owner chose had never
     rendered. A screenshot of a ripe board cannot show you that.
   - **A power-up spent in Winter bought nothing**, silently, and the button is in the band, which
     is not hidden here.
   - **Holly's introduction was spent behind the plant picker** — the meadow-signpost lesson at one
     more remove, and the same answer: wait.

   And two tests that could not fail: the Turn partition rig replaced `state.seen` wholesale, so
   both of this slice's new flags were witnessed at their DEFAULT; and the Winter half of
   `reconcile()` — which this document calls "new ground, not a mirror" — had no test at all. The
   bill is 1,642 assertions now, and the guards that could not go red have been made to.

   **What the gauntlet did NOT do:** a third clean round. Every finding above is fixed and the
   suite is green, but the critics have not been re-run against the result.

**And the pacing measurement, reported rather than judged, because the acceptance is the owner's:**

- **Guardrail one FAILS, and the number to rule on is the top rung's cost.** A single full kept night
  of **eight Camellia grosses 2,688,000**, which clears `minCoins` 100,000 twenty-six times over and
  mints **18.3 Saved Seeds against a gate of 10** — at every Turn from 3 to 6. Driven through the real
  engine rather than derived: `Game.turnReady()` goes false → true on that one collect with nothing
  else played. **Only Camellia breaches**; Witch Hazel and below are clear.
  
  **The dial, and it points the opposite way to intuition.** At this model's poorest Turn-3-to-6
  lifetime a night may gross at most **1,459,149**, which is a top rung costing at most **86,854**
  against 160,000 today. Gross is `plots × cost × 1.4 × 1.5`, so it RISES with cost — making Camellia
  dearer makes this worse. The dials are the top rung's cost coming **down**, `DATA.winter.snowfall`
  coming down, or `DATA.year.minSeeds` going up, and the last is outside this slice. All three are the
  owner's; doc 46 says every number in `DATA.winter` is provisional and measured before it ships.

  *(This was reported as "passes by 7.5%" until 2026-09-02. That was wrong, and wrong in the
  direction that matters: the guardrail was priced from **net** — the night's takings less what the
  bed cost to sow — and no Turn gate reads net. `credit()` moves `year.coinsEarned` and
  `lifetimeCoins` by the full payout and sowing is a bare `state.credits -= cost` that touches
  neither. The mint reads EARNINGS, never balance, which `game.js` says in those words and sim-test's
  bill 3 asserts by name. Net understates every rung by a constant 1.909, which is the whole
  difference between the pass and the failure.)*
- **Doc 46's own metric:** a kept morning is worth a **median 23% of that day's income** (spread
  8%–52%, eleven mornings in thirty days). The band is the owner's to set.
- **Winter buys gold and spends Turns.** Over thirty days the arm that plays Winter turns 16 times
  against 21, because the casual model rides each year to its wall and Winter's income pushes the
  wall out. Whether that is a cost is the owner's question: the capital Winter parks is capital a
  sleeping player was not cycling anyway.
