# The Curtain and the Drip — reveals, and the moments dialog that celebrates them

**Status: the spec, 2026-09-02 — ruled by the owner and pressure-tested twice before filing**
(five researchers across two runs; the second run's two critics found six blockers in the draft —
among them a reveal condition that would have hidden the next wall, and a grandfather rule that
re-hid rows on real saves — all folded in below). The rulings and rejected alternatives are in
the 2026-09-02 curtain-and-drip entry in [10-decision-log.md](10-decision-log.md). Where this
spec is silent, the builder asks the owner. Every number ships in `data.js`,
remote-config-ready; the ones marked PROVISIONAL are phase 4's to retune.

**The sentence: *the game reveals itself as you grow.***

Three parts, one pass: the **seed curtain**, the **upgrade drip**, and the **moments dialog**
(one reusable celebration popup — named "moments" deliberately: **"milestone" is a taken word
here**, owned by the Almanac's `almanacMilestones` rewards, and the two must never be conflated).

## Part I — the seed curtain

The picker's nineteen rows become three bands. **Not one economy number moves** — every unlock
price, plant cost, grow time and yield stays exactly as it is; this pass changes what a player
can SEE, never what anything costs.

1. **Unlocked seeds** — exactly today's rows.
2. **Revealed, still locked** — exactly today's locked row: drained art, real name, real stats,
   the padlock pill with the real price ("an advert for the thing you are saving up for" — the
   row's own comment, kept).
3. **`???` rows** — everything beyond: the row stays IN the list (a missing row is the recorded
   anti-pattern — "a locked thing you can see is a goal, and a missing one is nothing"), masked:
   the bloom a dark silhouette, the name `???`, stats and description withheld, and **one
   directional hint** in the creature-pair grammar ("Keep growing — the garden isn't done with
   you"). Player-facing vocabulary never says "mystery box"; the rows are simply the garden's
   secrets.

**The sort pills get one rule (ruled here; the spike draws it):** `???` rows always sink to the
bottom of the list in ladder (`DATA.seeds`) order, whatever sort is active — Cheapest, Priciest
and Balanced reorder **revealed rows only**. A cost-sorted `???` row would leak the very price
the mask withholds, and "Priciest" must never open on a wall of silhouettes.

**The Almanac wears the curtain keyed to the LATCH, never to the discovery count.** "Discovered"
already means *harvested at least once* in that panel, and a never-grown-but-unlocked species
today shows its real name, art and description dimmed — that stays exactly as is. A row is
masked (silhouette, `???`, description withheld) **iff its seed is unrevealed under the latch**;
the row count, the "N / 19" meter and the milestone reward rows are untouched — they read
counts, not names. Identity is masked; existence and the finishable denominator never are.

### The reveal — when the curtain lifts

**The condition has four arms, and the second one is the wall's bodyguard:** a seed is revealed
iff —

1. it is free or already unlocked; **or**
2. **it is the lowest-priced locked seed** — the next wall is ALWAYS revealed, from the first
   frame of a fresh save, so the designed "150,000 when I've earned 25,000" gasp can always
   occur (the pressure test proved the 0.85 clause alone leaves a recurring window with NO
   advert on screen — this arm closes it by construction); **or**
3. `lifetimeCoins ≥ unlockPrice × DATA.year.revealAt` — **the owner's ruled threshold,
   `revealAt = 0.85`**, governing every row beyond the next wall; **or**
4. `credits ≥ unlockPrice` — the law as code: **a seed you can afford is revealed, by
   definition, always.** (In honest play credits can exceed lifetime earnings by at most ~6K —
   the audited faucets all run through `credit()` — so this arm is purely the safety net for
   `grantGold`-cheated and hand-edited saves; `Dev.driveYear` and `jumpTurns` move
   `lifetimeCoins` deliberately and need no net.)

**Derived, then latched — and the latch's home is ruled so no builder invents it:** a getter in
`game.js` (`Game.seedRevealedNow(id)`-shaped) evaluates the condition and latches
`state.seedRevealed[id] = true` on first truth. It is called by `load()` (after the year-block
backfill sets `lifetimeCoins`, before `reconcile()` credits offline income), by the picker's
render path, and by the suite. **`credit()` and `turnYear()` are not touched** — the mint's
faucet stays pristine, and the new keys must never join the suite's `HARVEST_WRITES` whitelist.
The latch never clears: no path — Turn, save/load, spending — ever un-reveals (partition:
SURVIVES, both new keys).

**The reveal is a moment** (Part III): the popup shows the seed's art, name and full stats in
advert form — the Numbers rule applies to reveals. The seed is then bought in the picker as
ever; the popup sells nothing. **The next wall revealed at a fresh save's birth is born
pre-celebrated** — no popup for seed 3 at minute one.

### Grandfathering — unconditional, because the ledger cannot be trusted backwards

`lifetimeCoins` does not honestly exist on older saves (its backfill is the standing year's
earnings, zeroed at every Turn) — so **any save that predates the feature latches ALL seeds
revealed and ALL moments celebrated, unconditionally**, keyed on the absence of the new save key
(`hasOwnProperty` — the `boostInv` pattern, never an emptiness check). Deriving from a
migrated ledger would re-hide rows a player can see today — the exact regression the ruling
forbids. The test fixture: a pre-feature save with tiny `lifetimeCoins` and deep `seedUnlocks`
must boot fully revealed with an empty moments queue.

## Part II — the upgrade drip

The shop opens with **four cards** — verified id ↔ name: **Power Punch** (`tapPower`), **Quick
Grip** (`holdSpeed`), **Lucky Charm** (`critChance`), **Combo Coil** (`comboMeter`). The other
nine core cards start hidden and reveal by the same derived-then-latched mechanism
(`state.upgradeRevealed`, top-level, SURVIVES — **never inside `state.upgrades`, which the Turn
zeroes wholesale**), on absolute lifetime-gold thresholds in `DATA.upgrades[k].revealAt`
(absent or 0 = always visible).

**PROVISIONAL thresholds** (phase 4 owns the retune; the owner has said these cards' costs also
need rebalancing later — **no cost moves in THIS pass**): Rain Dance 4K · Bee Swarm 20K ·
**Star Strike** (`critMult`) 40K · Lucky Ladybug 120K · Sprinklers (`autoWater`) 300K ·
**Land Deed** (`plotExpansion`) — see below · Moonlight (`offlineRate`) 600K · Lantern Oil
(`offlineHours`) 1.2M · Harvest Drone (`autoHarvest`) 2.5M. Note for the spike: in the shop's
fixed order, Star Strike sits **between** Lucky Charm and Combo Coil — the opening shop shows
the four starters with Star Strike's slot simply absent until it reveals; draw the true opening
shop.

- **Why upgrades do not carry the seeds' affordability law**: the seed law protects the pacing
  spine's advert phenomenology; the shop's drip is progressive disclosure of a menu — the
  genre's standard — and a hidden card refuses no one. What upgrades DO carry: **every
  threshold reachable by earning alone** (nothing chains to purchases — nothing can hide
  forever), and the quest-safety rule.
- **The quest-safety rule, with its one live collision named**: `q_star_1` — "Buy Star Strike"
  — is the only quest today that names a dripped card. The scan (every quest and daily key
  against the reveal table) must pass **by tuning Star Strike's threshold against where
  `q_star_1` sits in the ladder** — deliberately, not by discovering the assertion red.
  `q_power_1`, `q_grip_1`, `q_charm_1`, `q_coil_1` all name starters and pass trivially.
- **Land Deed's carve-out (ruled at spec time; the owner may veto at the spike):** the card is
  structurally unbuyable in year one (the plots-5–8 Turn gate), so an earnings-only reveal at
  400K would plausibly **celebrate a card that refuses the tap** — a popup advertising a
  disabled purchase. Its reveal condition is therefore `turnsCompleted ≥ plotTurnGate AND
  lifetime ≥ 400K`. This is visibility matching the card's own purchasability, not information
  paced to Turn count — the no-turn-keyed-reveals ruling guarded the economy's information
  from turn-spamming, and a card that cannot be bought pre-Turn has nothing to leak. The
  revealed card's gated state reads "after your first Turn", never "at its cap".
- **The affordability dot must learn the curtain or it nags at nothing**: the band's UPGRADE
  pill lights today whenever ANY core card is affordable — Rain Dance costs 250 and would be
  affordable within minutes while hidden until 4K. `updateDockDots`, `renderUpgrades` and
  `syncAfford` all filter to **revealed** cards; the pill's dot means *an affordable revealed
  card, or a revealed card you haven't seen* — reconciled visually in the spike, counts per
  doc 36's grammar where counts already show.
- **A newly revealed card is a moment** (owner-ruled: upgrades get the popup too), plus the
  quiet tier: the dot while unseen, and the seed-row `.fresh` gold-flash treatment **extended
  to `.card` with its own selector and first-view flag in the same commit** — the existing
  flash is seed-row-scoped and its driving flag is a seed id; reuse is not free.
- Per-plot harvester cards keep their existing hide-until-plot behaviour, unchanged. **Fall's
  and Winter's pickers have no unlock ladder and take no curtain** — doc 33's own warning:
  their renderers are not this picker.

## Part III — the moments dialog, built once

The reusable celebration popup — one system, so popups are never rebuilt per feature. **It is a
third mode ON `#news`** — the changelog-rider pattern, its own private flag beside the
announcement's and the changelog's, one shared module-level `open` — which keeps "never two
popups" structural against every dialog in the game for free. It drains its queue through the
existing `UI.afterNews` chain. (The draft's "beside #news" sibling wording is dead: a sibling
node would un-structure the single-open guarantee.)

**The registry is data.** `DATA.moments = { gap, sessionCap }` carries the knobs
(PROVISIONAL: gap 20s, sessionCap 3); seed and upgrade moment entries are **generated at
runtime from their own tables** — never hand-written twice — with room for bespoke entries
later (feature unlocks, Winter's beats, album completions, the story's moments). The seen-map
is **`state.celebrated`** — top-level, SURVIVES, backfilled per Part I's grandfather rule.
This module is quietly the story system's delivery skeleton.

**The art chain — the dialog never blocks on art:**

1. **Per-entry custom art** — owner-supplied raster in `art/reveals/`, a new, explicitly
   widened cousin of the announcements exception, recorded in 09-conventions in the same
   commit with its one differing term stated: **the agent MAY compress and resize reveal art
   on the way in** (the announcements folder forbids that; this folder grants it), one file
   per entry, lowercase paths, never load-bearing. **Cap: 300KB per file — a new ruling of
   this pass** (the 300KB figure elsewhere belongs to the screenshot tool's git-churn budget;
   here the rationale is phone payload).
2. **The shared placeholder** — `art/reveals/placeholder.jpg`: the owner's "Garden of Wonder"
   cast art, today untracked at `art/IMG_3718.jpg` (394KB, 1206×1431 — re-encode under the
   cap, move, and **git-add it**; it has never been committed). Used whenever an entry has no
   custom art yet.
3. **The programmatic last resort** — the seed's bloom via `Flora.head()` at dialog scale, or
   the upgrade's icon — so even a missing placeholder file breaks nothing.

**Every reveal-art file joins `sw.js`'s CORE list with a VERSION bump when added or changed** —
the announcements art's own recorded rule, extended with the folder.

**The discipline rules — the structural predicate, not a list of examples:** no moment shows
while `UI.newsOpen()`, while **`sheetMode` is non-null — ANY sheet, the seed picker included**
(the picker is a sheet, not a dialog, and income settles under open sheets), while the coach is
visible, or before the session's first interaction. Crossings in play fire once the causing
celebration settles and nothing is up; crossings from away get one line in the welcome-back
telling plus the dot, the popup waiting for the next quiet beat; **crossings past the session
cap persist latched-unseen and surface at the next session's quiet beat, without a welcome
line** — stated so nobody files it as a bug. One at a time, `gap` and `sessionCap` from data.
Nothing fades in; the button exists from frame one. Seen-flags consumed only after the dialog
actually drew. Reduced motion: every state static. **Paid content never enters a `???` slot,
ever** — the architectural rule for the future golden seed: mystery plus payment is a PEGI
rating cliff. The dialog sells nothing.

## Save plumbing — the full checklist, so nothing is discovered red

Three new top-level keys: `state.seedRevealed`, `state.upgradeRevealed`, `state.celebrated`.
Each: in `defaultState()`; **individually re-merged in `load()` with unknown ids dropped** (the
`seedUnlocks` filter pattern — junk ids must not accumulate forever in SURVIVES keys);
classified SURVIVES in the suite (bill 1's completeness check goes red until they are);
**explicitly kept out of `HARVEST_WRITES`**; rows added to doc 07 in the same commit. Migration
keys on `hasOwnProperty`, never emptiness. Load order: backfill after the year block, before
`reconcile()` — offline income credited at load can legitimately cross thresholds, and those
moments pop after the first-interaction guard; the migration fixture includes pending offline
income so the behaviour is witnessed, not assumed. The registry lives inside `DATA`, so the
suite's GLOBALS whitelist is untouched — a builder who reaches for a new `MOMENTS` global trips
it.

## Coordination — checked 2026-09-02, re-verify at kickoff

**Winter has LANDED on main** (engine, opens, three gauntlet rounds and the handoff, night of
09-01) — `reconcile()` and the welcome renderer already carry its changes, so the welcome-back
away-reveal line builds now, no deferral. The live coordination points: **the Winter gauntlet's
clean round is still open** with a short open-items list in HANDOFF — fixes may land in
`ui-sheet.js`; **fix-round #15** (season-tab retirement) touches `ui.js` AND
`tools/capture-screens.js`, both of which this pass touches; and the capture gallery: **three
scenes photograph these exact panels** (`plant-picker` — which grants CHEAT gold, so under the
curtain only the affordability arm fires and deep rows go `???`; `upgrades` — which buys 16
cards; `almanac`). Their steps and gallery lines are updated in this pass (drive reveals with
`Dev.driveYear`, not `grantGold`), the run gains a moments-suppression step on the
`markNewsSeen` precedent, and docs 44 regenerates. `git fetch` and re-read the decision log's
top at kickoff — this tree takes commits mid-session daily.

## The test bill (asserted, sabotaged, then believed)

1. **The law, by exit code**: no moment where any seed is affordable and unrevealed — unit
   assertions on all four arms (the cheat arm pinned to `grantGold`, which alone skips the
   ledger) AND a seeded play-model run across the personas.
2. **The wall's bodyguard**: at every state, while any seed is locked, at least one locked
   seed is revealed (arm 2) — sabotage by removing the arm and watch the fresh-save assert go
   red.
3. Latches are monotone: no path — Turn, save/load, spending below a threshold, migration —
   ever clears any of the three keys. Partition SURVIVES; completeness check covers them.
4. **Grandfather**: the pre-feature fixture (tiny `lifetimeCoins`, deep `seedUnlocks`, pending
   offline income) boots fully revealed, fully celebrated, empty queue.
5. **Quest safety**: every quest and daily key naming an upgrade or seed resolves
   revealed-at-dealing — `q_star_1` is the live case the scan must pass by deliberate tuning.
6. Upgrade thresholds all reachable by earning alone; the four starters at 0; Land Deed's
   carve-out asserted in both directions (no reveal pre-Turn however rich; reveals post-Turn
   at the threshold).
7. The queue: cap and gap respected, never two open, celebrated consumed only after draw
   (draw-confirm is a named browser item); `jumpTurns` — one call, potentially 40M credited —
   is the burst adversary for the cap.
8. The Almanac: 19 rows and the meter unchanged; masking keyed to the latch, never to
   `discoveredOf`.
9. **Nothing economic moved**: a before/after snapshot of every price, yield, grow and unlock
   value is byte-identical.
10. Suite byte-identical across repeated runs on the pinned clock.

**Named browser items for the gauntlet** (sim-test loads no UI file): the three picker bands
and sort-sink rendering; the silhouette treatment at row and Almanac scale; **a reveal latching
while the picker is open re-renders the list preserving scroll** — an affordable row must never
stand on screen reading `???`; the dot filters and the `.card` fresh-flash; the dialog's three
art states; reduced motion; the strip of guards driven live (cross three thresholds in one
`credit()` with the picker open — nothing may pop until the sheet closes).

## The gates, in order

1. **The wireframe spike** — `tools/curtain-spike.html`, one page, then STOP for the owner:
   the picker's three bands at 390×844 with the `???` row treatment, hint line and sort-sink
   behaviour; the Almanac's masked row beside a revealed-but-ungrown row; the opening shop
   (four starters, Star Strike's gap); the dot states; and the moments dialog in all three art
   states — custom art, the Garden of Wonder placeholder, the Flora fallback. The owner's
   annotations build verbatim.
2. **Engine**: the getters, latches, registry and queue — the test bill green.
3. **The surface**, faithful to the approved spike; capture scenes updated; docs 44
   regenerated.
4. **The gauntlet** (doc 34): invariant coverage; the visual critic against the spike then doc
   05; the grammar critic (a `???` row must read as this game's own secret — the creature-pair
   grammar, never a loot-box tease); **the popup-discipline critic** (drive the burst, the
   open-sheet, and the session-start cases and witness the guards hold); the named browser
   items; reduced motion; scope. Then the owner's verdict and the five-minute phone script —
   the Developer tools "Earn" buttons (`Dev.driveYear`) are the reveal driver (the gold cheat
   proves the safety-net arm instead, by design), and the pass adds one bigger Earn step and a
   "preview a moment" dev row on the `previewAnnouncement` precedent so the owner can see all
   three art states in a minute.

## Docs made true in the same commit

Doc 32's glossary gains its row for the `???` seeds; doc 07 the three keys; doc 09 the
`art/reveals/` exception with its compression grant; doc 45's owner-supplied-art paragraph the
new folder; docs 44 regenerated; `tools/wiki-sync.js` the DESC and title rows for this
document; `DATA.changelog` one plain line (the reveal moments introduce themselves — no What's
New announcement for this pass); the decision-log entry for the build's own judgment calls;
HANDOFF; wiki-sync last.
