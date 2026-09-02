# Save Data

## Storage

| | |
| --- | --- |
| Mechanism | `localStorage`, JSON |
| Current key | `gw-save` |
| Legacy key | `igr-save` (*Idle Garden Reborn*) |
| Announcements seen | `gw-news` — **deliberately outside the save**, see below |
| Schema version | `4` (the Garden Year — mastery's meaning changed from live ladder to frozen record) |

Saves are scoped to the browser origin, so a GitHub Pages deployment shares storage with anything
else published under the same `github.io` account. Progress does not sync between devices and is
lost if the player clears site data.

## State shape

```js
{
  version: 4,
  profile: { name: 'Gardener', avatar: 'flower' },   // who the player is — see below
  credits: 100,
  tickets: 0,                 // kept so old saves parse; zeroed after conversion
  gems: 0,
  tap: { power: 1, critChance: 0.05, critMult: 10, combo: 0, comboMax: 50, holdInterval: 900 },
  grid: [ /* 8 cells */
    { locked: false, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '' }
  ],
  upgrades: {
    tapPower: 0, holdSpeed: 0, critChance: 0, critMult: 0, comboMeter: 0,
    rainDance: 0, beeSwarm: 0, ladybug: 0,
    plotExpansion: 0, autoWater: 0, autoHarvest: 0, offlineRate: 0, offlineHours: 0,
    plot1Harvester: 0, /* … through plot8Harvester */
  },
  flowers: {},                // spendable bloom pantry, seedId -> count — harvest() banks one per
                              // bloom; crafting, selling and Stand deliveries spend it. NOT the
                              // lifetime record (that is `discovered`).
  craft: [],                  // in-flight apothecary jobs, { id, doneAt }
  goods: {},                  // finished craft goods, id -> count
  decor: [ { id: 'gnome' } ],   // one entry per copy owned, cosmetic only since v3
  boosters: { bloom: 1735689600.123 },                          // id → absolute expiry, epoch seconds
  boostInv: { bloom: 0, seedrush: 0, fortune: 0, golden: 0 },   // held copies, not yet activated
  fall: {                       // the hour-class bed — positional, rebuilt to length on load
    grid: [ { seed: 'pumpkin', plantedAt: 1735689600.1, grow: 10800, ready: false, windfall: false } ],
    bedPaid: false              // DERIVED on load from the marks, never restored
  },
  winter: {                     // the night shift — positional, rebuilt to length on load
    grid: [ { seed: 'snowdrop', plantedAt: 1735689600.1, grow: 43200, ready: false, kept: false } ],
    tuckedAt: 0                 // one timestamp for the whole bed; 0 means the quilts are off
  },
  harvestsTowardRep: 0,
  stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
  wonder: { until: 0, last: 0 },
  prefs: { sfx: true, amb: true, music: false, sfxVol: 1, ambVol: 1, musicVol: 1 },
  seen: { intro: false, plot: false, apiary: false, meadow: false, fallSwipe: false, gardenSwipe: false,
          winterSwipe: false, hollyIntro: false },
  quests: {
    active: [ { id: 'q_tap_25', progress: 0 } ],
    done: [],
    daily: { id: 'd_harvest_10', progress: 0, day: '2026-8-12', claimed: false }
  },
  rep: 0,
  level: 1,
  discovered: {},                 // seedId -> lifetime harvest count
  bestRarity: {},                 // seedId -> rarity key
  almanacClaimed: [],             // milestone `at` values already paid
  mastery: {},                    // seedId -> mastery tiers completed and paid
  rarityCounts: {}                // seedId -> { rare, epic, legend } lifetime counts
}
```

### Details that matter

**`grid` has 8 entries, but the board shows 9 cells.** The centre cell is the talking flower and
has no state. `ui.js` maps DOM cell index to plot index by skipping 4.

**Time is absolute epoch seconds, not elapsed.** `plantedAt`, `boosters` expiries and
`wonder.until` are all wall-clock. This is what makes offline growth work: a plot planted before
closing the tab is simply ready when you return. It also means **moving the system clock forward
completes every plot**, and moving it backward strands them. There is no anti-cheat.

**`grow` stores the already-modified duration, not the seed's base.** Growth bonuses are baked in at
planting, so changing sprinkler levels never retroactively affects something in the ground.

**`decor` is a list, not a count.** Each purchased copy pushes another entry, `{ id }` only. A
player with ten gnomes has ten array entries. `Game.decorCount(id)` counts them for display;
nothing sums a stat from them anymore.

**`harvestsTowardRep` is lifetime, not per-session.** It is saved and never reset, and only ever
matters modulo 10 — it drives the every-10-harvests reputation drip. It was `harvestsThisSession`
until 2026-08-30; an older save is renamed on load (see [Schema fixups](#schema-fixups)).

**`boostInv` is nested and must be re-merged in `load()`.** A save without that key is a pre-phase-2
save: tickets convert to gems at `round(tickets / 5)` once, then the field is written so the
conversion never repeats.

**`rep` is earned, never spent.** `level` is derived from it (`repToNext(L) = 10 + 5×(L−1)`) and
stored so a level-up can be detected. Nested `quests` is re-merged in `load()` like the other
objects; a save without a `rep` key is grandfathered (see
[16-progression-and-quests.md](16-progression-and-quests.md)).

**Retiring a quest requires pruning live saves, not just deleting the definition.**
`ensureProgression()` drops any `quests.active` entry whose id no longer resolves through
`questById()`, and nulls an unclaimed `quests.daily.id` so `refreshDaily()` rerolls it. Without
that, a save carrying the retired quest keeps the orphan forever: `fillActive()` caps `active` at
three, so the dead entry permanently costs the player a slot, and the strip only falls through to
the daily once `active` is empty, so it also keeps the daily quest off the strip. This was added
when the three unreachable sell
quests were removed (2026-08-15). A claimed daily is left alone on purpose — rerolling it would pay
its reward twice.

**`seen` flags are backfilled from play evidence in `load()`.** Like the other nested objects it is
merged defaults-first, so a save predating a flag reads back `false` and re-runs onboarding for a
player who is plainly past it. `intro` is inferred from `stats.totalTaps || stats.totalHarvests`,
`plot` from `stats.totalHarvests` or any occupied plot; `fallSwipe` and `gardenSwipe` from Fall
itself — a paid bed (`fall.bedPaid`) or any `fall.grid` cell with a seed is proof the player found
Fall and came back. `meadow` deliberately has **none**, because nobody has seen the line it gates.
**A new `seen` flag needs its own line**, the same rule as a new upgrade key. Covered by the suite.

**A written fresh save carries power-ups that `defaultState()` does not.** `giveOpeningBag()` puts
`DATA.startingBoosts` into `boostInv` at the three points where a save is *created* — a load that
finds none, a load whose save will not parse, and the Settings reset. It is deliberately not part of
`defaultState()`, because that object is also the backfill source for every save ever written, and a
bag declared there would be handed to any old save predating `boostInv`.

**`prefs.music` defaults to `false`.** Deliberate: unrequested audio on load is hostile.

**Six flat audio keys, not a nested `prefs.audio` object.** The nested shape reads better and would
backfill correctly *today*, because `prefs` is one of the objects re-merged over its defaults
individually — but the re-merge is shallow, so the day a fourth channel is added an existing save's
`prefs.audio` replaces the default wholesale and the new channel arrives `undefined`. That is the
nested-object trap in `09-conventions.md` wearing a name that reads better. Flat keys cannot fall
into it.

**`prefs.amb` is derived on first load, never defaulted flat.** Until the third channel existed the
beds were governed by the effects switch, so a save with `sfx: false` had deliberately silenced the
sky too. `load()` reads `parsed.prefs.sfx` for any save that has no `amb` key of its own, so nobody
comes back to a garden that has started making noise on its own. A save written after the split
carries its own value and the derivation never fires again.

## Writing

Two paths:

- `Game.save()` — debounced 250 ms. Called after essentially every state change. The debounce is
  what makes rapid tapping cheap; without it every tap would serialize the whole state.
- `Game.saveNow()` — immediate, no debounce. Bound to `visibilitychange` (when hidden) and
  `pagehide`, so backgrounding or closing the tab flushes pending writes.

Both wrap `setItem` in a try/catch and swallow quota errors. A full or blocked `localStorage`
degrades to a non-persistent session rather than crashing — which is what happens in Safari on
`file://`.

## Loading

`Game.load()` returns `{ migrated, fresh }`, which `ui.js` uses to decide whether to show the
"Progress restored" toast.

The sequence:

1. Read `gw-save`.
2. Read `igr-save`.
3. **If both exist**, check whether the modern save is pristine and the legacy one isn't. If so,
   discard the modern save so the legacy one is used instead.
4. If there's no modern save but a legacy one exists, use the legacy save and flag `migrated`.
5. Merge over a fresh default state, then re-merge each nested object individually.
6. Apply schema fixups.
7. Sanitise grid timestamps.
8. If migrated, `saveNow()` immediately so the import is durable.

### Why step 3 exists

Merely opening the game writes a `gw-save`. Without the pristine check, a player who launched the
new build once, did nothing, and closed it would have a real *Idle Garden Reborn* save shadowed
forever by an empty one, with no way to recover it.

`isPristine()` treats a save as untouched if credits are still 100 (or absent), there are no taps
or harvests recorded, and no decor is owned. This was added after the bug was found in testing —
see [10-decision-log.md](10-decision-log.md).

### Nested merge

`Object.assign(state, defaultState(), parsed)` is shallow, so a legacy save missing `stats`
entirely would leave that key absent and crash on first write. Each nested object is therefore
re-merged over its defaults individually: `tap`, `stats`, `wonder`, `prefs`, `seen`, `profile`,
`boostInv`, `discovered`, `bestRarity`, `mastery`, `rarityCounts`. `almanacClaimed` is copied as an array when
present, else `[]`. `rarityCounts` is nested a second level — a missing seed key reads as
`{ rare: 0, epic: 0, legend: 0 }` through `rarityCountsOf()`, which is the only thing that should
read it.

**When you add a nested object to state, add it to that list.** Forgetting is the single most likely
way to break loading for existing players.

### `state.profile` — who the player is (added 2026-08-31)

```js
profile: { name: 'Gardener', avatar: 'flower' }
```

**Two fields, and neither is progress.** A Turn must not touch identity, so `profile` sits in the
`SURVIVES` column of the never-resets partition and `tools/sim-test.js` bill 1 asserts it verbatim,
with the rig writing a non-default name *and* a non-default avatar so the assertion cannot pass on a
value that happens to equal its own default. The **Settings reset is a different thing** and does
clear it: that path is an explicit, twice-confirmed erasure of the whole save, and the name goes back
to `Gardener` with everything else. See "The Turn is not the Settings reset" below.

**`name` is the first player-typed text this game has ever stored, and nothing here escapes it.**
The ruling is in [11-known-issues.md](11-known-issues.md): storing `esc(name)` puts `&lt;` in the
save and makes every future reader keep a promise nobody wrote down. What the engine guarantees is
narrower and more useful — that the name is **short, single-line and never empty**:

- newlines, tabs and the two Unicode line separators become spaces, so `a\nb` is `a b` and not `ab`;
- runs of whitespace collapse and the ends are trimmed;
- **the 16-character cap is applied after collapsing**, or a padded name would spend its whole
  allowance on nothing;
- an empty result, or a non-string, falls back to `Gardener`.

`setProfileName()` returns **what was stored**, not what it was sent, so a caller can render the
trimmed form rather than the raw keystrokes. The same sanitiser runs on `load()`, so a save
hand-edited in devtools to hold a tag or a 900-character monster comes back clean — the cap is
enforced in two places on purpose, because the field's own `maxlength` is a courtesy and a save file
is not.

**`avatar` is an id, never markup.** `flower` for the talking flower, `seed:<id>` for a bloom,
`critter:<id>` for a creature — a string the art files resolve, so a save can never carry a drawing.
It is re-validated on every load and on every write: a bloom the player has not unlocked, a creature
that has not moved in, or anything unrecognised falls back to `flower` rather than rendering
nothing. `setProfileAvatar()` returns `false` when it refuses, which is what stops an unearned face
being worn by hand-editing the save.

**A save written before the menu existed has no `profile` at all**, which is why it is in the nested
re-merge list above. It gets the default pair, and both fields are then validated like any other.

### Schema fixups

Six live migrations run on load:

- `plot1Gardener` is renamed to `plot1Harvester` (the key was renamed during the rebuild) and the
  old key deleted.
- `harvestsThisSession` is renamed to `harvestsTowardRep`, same shape, and the old key deleted, so a
  returning player keeps their progress toward the next reputation drip.
- Any missing `plotNHarvester` key is initialised to `0`, so adding harvester slots later is safe.
- A save without `boostInv` converts leftover tickets to gems at 5:1, once.
- Remaining `flowers` keys backfill `discovered` (max with any existing count). Unclaimed
  Almanac milestones whose threshold is already met then pay once.
- A seed with lifetime harvests but no `rarityCounts` entry has one estimated from the drop-table
  weights in `DATA.rarity`, clamped by `bestRarity` and capped at the harvests that happened.
  Mastery tiers then advance to wherever that puts them, granting yield but **no gems and no
  toasts**. Once a seed has a `rarityCounts` entry it is normalised, never re-estimated, so the
  migration is idempotent.

### Grid sanitisation

Legacy and corrupted saves produce impossible timestamps, so every planted cell is checked:

- `grow` missing or `<= 0` → set to 1.
- `plantedAt` missing, zero, or `< 1e8` → treated as elapsed-seconds rather than epoch, and
  rewritten as `now − grow`, which marks the plot ready immediately. The `1e8` threshold is a
  sentinel: any real epoch timestamp is far larger, so a small number means the old format.
- `plantedAt` more than `1e5` seconds in the future (a clock change) → clamped to now.

Winter's cells take the same three rules, and `state.winter.tuckedAt` takes a fourth: a tuck under
`1e8` or more than `1e5` seconds in the future is rewritten to **now** rather than to `now − grow`.
Clamping a corrupt tuck forward is the conservative direction — it can only ever refuse marks, never
fabricate them.

### `state.winter` — the night shift (added 2026-09-01, slice C)

**Positional, like `state.fall` and the meadow's cells.** The grid is rebuilt to
`DATA.winter.plots` length on every load and **never merged**; a plant id that no longer exists
drops to an empty cell. That disposal rule is why **Winter plant ids are append-only once
shipped** — the season advertises two-day holds, so a renamed id would silently delete a bloom the
player was saving.

**Two fields, and the difference between them is the whole design.**

- **`tuckedAt`** is a single timestamp for the whole bed — the quilt is over the *bed*, not over a
  list, which is what makes plant-then-tuck and tuck-then-plant both work without any per-cell
  bookkeeping. Zero means the quilts are off. It is **restored from the save**, because it is the
  stored truth every mark derives from: losing it on load would silently end every night at every
  boot.
- **`kept`** is per-cell, **derived and then persisted**. It is *not* Fall's `bedPaid`, which is
  derived fresh on every load and deliberately never restored. A mark is a record of something that
  already happened on a night that may be long over, so it comes back from the save exactly as it
  went in. Deriving it again would be wrong twice over: the night it was earned on may have ended,
  and re-deriving would either lose it or hand it out a second time.

**The derivation.** A plant is kept iff `plantedAt + grow` falls inside the standing tuck window —
at or after `tuckedAt`, and at or before now. It runs wherever ripeness is first observed: `load()`,
`reconcile()`, `processWinter()` on the tick, and both collect paths.

**`tuckedAt` takes the grid's own clock sanitisation**, plus one rule of its own: a tuck stamped in
the future clamps to now, because a bed tucked "tomorrow" would swallow every mark for as long as it
stood.

**Three places a new Winter cell field has to land in the same commit** — `defaultState()`, the
`load()` rebuild, and `clearWinter()` in `tools/sim-test.js`. That trio is where new grid fields have
historically leaked, and the suite's own partition test fails if a new save key is not classified.

**No migration.** Winter did not exist, so a save without a `winter` key comes back on the defaults:
an empty bed, untucked.

## Reset

Settings offers a reset behind a two-tap confirmation that disarms after 4 seconds. It removes
`gw-save`, restores defaults in place, and emits `grid`, `panels` and `currency`.

**Reset clears `igr-save` as well as `gw-save`** (changed 2026-08-15). It previously left the
legacy key alone, so the next load re-imported the player's old *Idle Garden Reborn* progress and a
reset silently didn't take. The safety-net reading lost: a player who asks for a clean start is
asking for a clean start, and nothing in the UI explained the import.

### `state.preserve` — ruled, not built (2026-08-30)

Last year's harvest, kept: `{ flowers: {}, honey: {} }`, id to count, additive at every Turn. It
**survives** the Turn and needs its own line in `defaultState()`, in the `load()` re-merge list and
in the partition sweep. Orders may not spend from it; crafting and selling may. Spec in
[41-the-preserve.md](41-the-preserve.md).

### The two markers that are NOT in the save (2026-08-30, second one 2026-08-31)

`gw-news` holds a JSON array of the announcement ids the player has already read, and it is the
only piece of persistence in the game that lives outside `gw-save` on purpose.

The What's New dialog's button marks the announcement seen **and then wipes the save**, which is how
a playtest group starts a new build together. A flag stored in the save would be erased by the very
reset the button performs, and the dialog would open on every load for ever. Its own key survives
`reset()` by construction — and survives a player's own Settings reset for the same reason, which
is also correct: an announcement is news, and news is not progress.

**`gw-log` is the changelog's marker, and it lives out here for the same reason and one more.**
It holds `{ seen: [<entry dates>], day: '<the last day a popup went up>' }`. A Turn wipes the garden
and a `reset` announcement replaces it outright, and neither is a reason to hand somebody a list of
changes they have already read. `seen` is a list of **dates**, which is why a shipped changelog
entry's date must never be edited — changing one re-shows the whole entry to every player. `day`
enforces "at most once a day" without a timer.

Read and written through `Game.changelogUnseen()`, `Game.changelogDue()`,
`Game.markChangelogSeen()`, `Game.seedChangelogSeen()` and `Game.clearChangelogSeen()`.
`seedChangelogSeen()` is called from boot on a **fresh save only** and refuses if anything is
already recorded: a first-time player's first changelog is the game itself, not a list of what
changed before they arrived.

The announcement flags are read and written through `Game.newsSeen()`, `Game.markNewsSeen()`,
`Game.clearNewsSeen()` and `Game.pendingAnnouncement()`. It needs **no** `defaultState()` entry, no `load()` backfill and no
Turn-partition classification — which is the whole reason to keep it out. A sim-test asserts it
survives a `reset()` that demonstrably clears the wallet; that assertion is false the moment anyone
moves the flag into `state`.

## Changing the schema

If you add a field:

1. Add it to `defaultState()`.
2. If it's a nested object, add it to the individual re-merge list in `load()`.
3. Existing saves will pick up the default automatically — no version bump needed.

If you change the *meaning* of an existing field, bump `version` and write an explicit upgrade step
keyed off the old value.

Never rename a field without a fixup like the `plot1Gardener` one. Players have saves.

### Worked example: decor losing its stats (v2 → v3)

The first real use of `version`-gated migration. When decor became cosmetic (navigation phase 1,
[15-navigation-and-ia.md](15-navigation-and-ia.md)), existing saves held decor entries carrying
`type`/`val` that no longer mean anything. `migrateDecor()` in `game.js`:

1. Runs only `if (fromVersion < 3)`, where `fromVersion` is the *incoming* save's `version` (missing
   entirely on very old saves, treated as `1`).
2. For each owned decor entry, looks up its `DATA.decor` definition and refunds `cost` in
   `currency` — the player keeps the item as a cosmetic record, and gets the price back once.
3. Strips every entry down to `{ id }`, discarding `type`/`val` for good.
4. Returns `null` if there was nothing to refund (a fresh save, or a save already on v3), so `ui.js`
   only shows the "refunded" toast once, ever, per save.

`load()` then sets `state.version = 3` unconditionally, same pattern as the old hardcoded `2`. This
is the template for the next schema change that alters meaning rather than just adding a field.

## Meadow land (added 2026-08-25)

`state.apiary.locked` is a **fixed-length boolean array**, one per cell, exactly like
`state.apiary.cells`. It is positional, so `load()` rebuilds it to length rather than merging — a
short or sparse array indexes to `undefined` everywhere downstream.

Two rules in the migration, and the second is the one worth remembering:

- A save that predates the gates has no `locked` key, so empty land goes back behind the level
  table.
- **A cell that already holds something is never re-locked.** Taking back ground a player has built
  on is the one migration that is always wrong, whatever the new table says.

## Weather and mutation fields (added 2026-08-15)

Two new **per-cell grid fields** and one top-level field:

| Field | Where | Notes |
| --- | --- | --- |
| `mutation` | `state.grid[i]` | Mutation id or `null`. Cleared on harvest with the rest of the plot. |
| `mutateAt` | `state.grid[i]` | Epoch seconds of this plant's single mutation roll; `0` once spent. |
| `packDrop` | `state.grid[i]` | A card pack waiting on this plot. Added 2026-08-15; needs its own backfill. |
| `lastSeen` | top level | Epoch seconds, written every tick. For offline reconciliation, not yet used. |

**Both grid fields need their own backfill loop over `state.grid` in `load()`** — the same trap
`luckyBug` hit, and they sit beside it. A save from before this feature has neither key, and
`undefined` is not `null`.

**The weather clock itself stores nothing.** It is a pure function of epoch time, so there is no
migration for it and never will be.

## Offline earning badges (added 2026-08-15)

`offlineRate` and `offlineHours` join `state.upgrades`. Like every badge before them they need
their line in the **manual backfill list in `load()`** — they are in it, beside `holdSpeed` and the
proc keys. Without that an old save reads `undefined`, not `0`, and the offline rate comes back
`NaN`.

`state.lastSeen` (added with the weather work) is what an absence is measured against. It is written
on every `processWeather()` tick and on every `reconcile()`.

## `weatherCall` (added 2026-08-15)

`state.weatherCall` is `{ id, from, until }` or `null` — a player-bought sky. Top-level, so it needs
no per-cell backfill, but it does need to survive `load()`; a stale one simply expires because
`weatherAt()` checks the window.

## The card album (added 2026-08-15)

| Field | Notes |
| --- | --- |
| `cards` | Card id → **count**, not a boolean. Duplicates must stay representable for dust and any future gifting. |
| `packs` | Unopened packs. |
| `setsClaimed` | Set ids whose completion has been recorded, so it pays once. |

All three are top-level and **all three need their own re-merge in `load()`** — nested objects are
replaced wholesale, so a save from before the album would otherwise come back with `cards`
undefined. A test loads a stripped save and asserts they rebuild.

## The potting bench (added 2026-08-16)

```js
bench: {
  cells: Array(36),     // null | { tier } — a fixed 6x6, whatever is unlocked
  side: 4,              // unlocked square, side length, 1..6
  basket: [],           // tier numbers waiting to be placed, capped at 60
  stock: {}             // chain id -> count, banked off the bench
}
```

`state.bench` is **nested, so it needs its own re-merge in `load()`** — the same trap as `cards` and
`boostInv`. A save written before the bench existed comes back with `bench` undefined otherwise, and
every lookup in the bench section of `game.js` throws on the first harvest.

The backfill is deliberately defensive on every field, because all four are player-visible state that
a future data change can invalidate:

- **`cells`** is truncated or padded to exactly `BENCH.cols²`, and any entry whose `tier` no longer
  names a rung in `BENCH.chain` is dropped to `null`. Shortening the chain must not brick a save.
- **`side`** is clamped to `1..BENCH.cols`. A save claiming a bigger bench than the data allows would
  otherwise let items sit in cells the code treats as locked.
- **`basket`** drops any entry that is not a real rung and is capped at `BENCH.basketMax`.
- **`stock`** is a plain id → count map and needs no repair.

Three sim-tests cover this: a full round-trip, a save written before the bench existed, and a save
containing a junk rung, an impossible `side` and a bogus basket entry.

**The bench does not add a per-cell grid field**, so the `state.grid` backfill loop beside `luckyBug`
and `mutateAt` is untouched. It is its own top-level object.

## Creatures (added 2026-08-16)

```js
critters: {
  pip: { since, fed, fedUntil, gifts, met, level, tending }   // one per creature that moved in
}
```

Nested, so it needs its **own re-merge in `load()`**, same as `bench` and `cards`.

The backfill is defensive in two ways that matter:

- **An id no longer in `CREATURES` is dropped.** Retiring or renaming a creature must not leave a
  save carrying a ghost the code cannot look up.
- **`gifts` is clamped to that creature's `keepsake.cap`.** Lowering a cap in `data.js` would
  otherwise leave old saves holding more than the game will ever hand out again.

An entry without `since` is treated as absent, so a half-written record cannot resurrect a creature
that never actually arrived.

`state.mementos` is a **count per keepsake id**, top-level, added 2026-08-16. Nothing spends them
yet, so it only ever grows — but it is a count rather than a boolean because a future craft or trade
needs quantities. The backfill drops any id no longer in `CREATURES` and any non-positive count, so
retiring a creature cannot leave a ghost.

`state.pairsSeen` and `state.luckyPacks` are top-level, added with named pairs. `pairsSeen` filters
out any id no longer in `CREATURE_PAIRS`, so retiring a pair cannot leave a save holding a ghost, and
`luckyPacks` is clamped at zero.

`level` (added with stars) is clamped to `1..CREATURE_STARS`, and **an absent value comes back as 1,
not 0** — a save from before stars is a creature the player already earned.

`tending` (added with traits) has two rules that matter:

- **Absent means "tend it", not "off".** A save written before traits existed must come back working
  — a returning player finding their creature idle is the same harm as taking a seed away. An
  explicit `tending: false` is still respected.
- **The total is trimmed to the current slot count**, walking `CREATURES` in order. The slot table can
  shrink in a balance pass and a save can be edited, so the overflow is dropped rather than handing
  out effects the game no longer grants.

`fedUntil` (added 2026-08-18 with food) is **an absolute epoch second**, not a remaining duration,
so time away needs no replaying and nothing has to tick. Two rules:

- **It is clamped to `now + FOOD_CAP_HOURS`** on load. An edited save must not be able to hold a
  boost forever, and the clamp is where that is enforced rather than at every read site.
- **Absent means unfed**, which is simply a creature working at the star it was raised to. Nothing
  is switched off by the absence, so a save from before food needs no migration at all.

`fedUntil` is the **one fullness clock**, an absolute epoch second. Above `FED_THRESHOLD_HOURS`
remaining the creature is well fed, above zero it is awake, at zero it is asleep. Three rules:

- **It is clamped to `now + FOOD_CAP_HOURS`** on load. An edited save must not be able to hold a
  boost forever, and the clamp is where that is enforced rather than at every read site.
- **Absent means the full `ARRIVAL_AWAKE_HOURS` grant** — not asleep, and not zero. A save from
  before any of this must not open on a room of creatures the game never warned anyone about, which
  is the same rule `tending` follows for the same reason. An explicit `0` is respected, because that
  is a creature that genuinely ran out.
- **It absorbed `awakeUntil` on 2026-08-20.** There were two clocks, and `awakeUntil` was always the
  longer — so the surviving field takes `max(fedUntil, awakeUntil)` and the old one is dropped. The
  migration lives in the backfill and needs no version bump, because a save carrying both still
  loads to the right place.

> **`fed` and `fedUntil` are unrelated despite the names.** `fed` is the **keepsake clock** — when
> this creature last handed one over — and it has been there since creatures shipped. Writing food
> into it would silently reset every keepsake timer in the game. This is the single easiest mistake
> to make in this record.

**Attraction stores nothing.** Progress is read live from `state.discovered`, which is already a
lifetime record that never decrements — see [22-creatures.md](22-creatures.md).

## `state.stand` — the Garden Stand

Added 2026-08-25.

```js
stand: {
  slots:  [order|null, order|null, order|null],  // fixed length, indexed by slot
  nextAt: [0, 0, 0],                             // absolute epoch seconds a slot refills
  seq: 0, delivered: 0, skipped: 0
}
```

**The arrays are fixed-length and positional, so they are resized on load rather than merged.**
`Object.assign` would keep a three-slot array from an older build even if `STAND.slots` changed,
and a sparse or short array indexes to `undefined` in `processStand()`. `load()` rebuilds both to
`STAND.slots` length.

**An order naming a good or customer that no longer exists is dropped**, and the slot simply
refills. Renaming a good id therefore costs nothing — the same rule keepsake ids follow.

**An order's `rep` is authored but unpaid while `STAND.repPaused` is on.** It stays in the save on
purpose: the pause is a read through `Game.standOrderRep()`, so flipping the flag off pays every
board already written, with no migration and no save mutation. Never read `order.rep` directly.

## `state.apiary` — the meadow board

Rewritten 2026-08-25 when the meadow became a board.

```js
apiary: {
  cells: Array(8),          // null | { kind:'hive', at, jars:[] } | { kind:'tender', type }
  honey: {}, wax: 0,
  shelf: { daisy: 12 },     // lifetime count per bloom
  keepers: ['bumble']       // creature ids stationed at the bottom
}
```

**Cells are positional, so the array is rebuilt to length on load rather than merged.** A short or
sparse one indexes to `undefined` everywhere downstream and nothing throws.

**A save from before the board carries `hives` instead**, a plain list. `load()` seats each one on a
cell in order so nobody loses a hive they paid for, then deletes the old key. A tender whose type no
longer exists is dropped to `null`.

**Keepers are filtered on load** to real creature ids, de-duplicated and clamped to
`MEADOW.keeperSlots`; `Game.keepers()` filters again at read time to creatures actually tending, so
a creature sent to rest stops keeping without anything having to remember.

## The Garden Year (added 2026-08-29)

**Eight** new top-level fields, all in `defaultState()` **and** re-merged individually in
`load()` (six landed with phase 1; `lifetimeCoins` and `mintedBase` arrived with the
cumulative mint in phase 1.1):

```js
year: {
  number: 1,                    // which year is being played, 1-based
  coinsEarned: 0,               // THIS year's earnings — written ONLY by credit(), never decremented, zeroed at the Turn; opens the coins gate
  turnsCompleted: 0,            // gates Fall (fallTurn) and plots 5–8 (plotTurnGate) — and NOTHING in the mint
  stats: {                      // the Tally's counters: year-scoped, zeroed at the Turn
    orders: 0, windfalls: 0, species: 0,
    speciesSeen: {},            // seedId -> true, so a species counts once per year
    legendaries: 0, bestCombo: 0
  }
},
lifetimeCoins: 0,               // every coin honestly earned, ever — written ONLY by credit(), NEVER reset; sizes the mintable pool
mintedBase: 0,                  // seeds already drawn from that pool, un-tallied; NEVER reset, grows only at the Turn
savedSeeds: 0,                  // the forever money; minted at the Turn, spent on petals, never reset
petals: {},                     // seedId -> { rich, quick, sig }; clamped to the shared caps on load
seedUnlocks: {},                // seedId -> true; one-time gold prices, permanent across Turns
blessed: [],                    // [{ seed, year }] — provenance of every Turn's free petal
fall: {
  grid: [ /* DATA.fall.plots cells */ { seed: null, plantedAt: 0, grow: 0, ready: false, windfall: false } ],
  bedPaid: false                // the windfall's once-per-fill latch — DERIVED, not sticky:
                                // it mirrors "some plot still carries an unspent windfall
                                // mark", recomputed on every arm and every Fall harvest
}
```

Rules that matter:

- **`fall.grid` is positional** and rebuilt to `DATA.fall.plots` length on load, like the meadow's
  cells and the Stand's slots. A plant id that no longer exists drops to an empty cell; a second
  Century Bloom (an edited save) is dropped; timestamps get the main grid's sanitisation (a
  pre-epoch `plantedAt` ripens now, a future one clamps).
- **`petals` entries are clamped** to the shared caps and unknown seed ids are dropped;
  `seedUnlocks` keeps only real seed ids; `blessed` keeps only real seeds.
- **`year.stats.species` is recomputed from `speciesSeen`** on load, so the pair can never drift
  apart.
- **`coinsEarned` may be fractional** and survives as a Number; it is compared, never displayed
  raw. **`lifetimeCoins` and `mintedBase` are fractional too** and round-trip to the fraction —
  `mintedBase` in particular must never be rounded, or repeated Turns would drift the ledger
  away from the pool it is meant to track.
- **The two ledgers are rebuilt after `state.year`**, because `lifetimeCoins` falls back to the
  *sanitised* `year.coinsEarned` when the save has no ledger of its own. A junk `lifetimeCoins`
  (string, `null`, `NaN`, negative) takes the same fallback; a junk `mintedBase` clamps to 0.
  `projectedMint()` clamps the increment at zero, so an edited save with `mintedBase` past its
  pool simply has nothing to draw rather than minting a negative pouch.

### The Year migration — `migrateYear()`, keyed on the missing `year` key

A save from before the Year enters it mid-flight, exactly once (the `boostInv` presence
pattern):

1. **Grandfather unlocks.** Any seed with `discovered[id] > 0`, or whose old `unlockLevel` the
   save's level had already passed, is marked unlocked free — nobody loses a seed they could
   plant. This runs *after* `migrateProgression()` and the backfills, so a pre-rep save gets its
   level first and the counts it is judged by are the repaired ones.
2. **Convert Bloom Mastery.** The recorded counts first earn whatever tiers they had reached
   (the old backfill's advance, run one last time), then the whole ladder converts:
   `round(DATA.year.masteryConvert × totalTiers)` Saved Seeds, silent. The tiers stay in
   `state.mastery` as a frozen record. A second load neither advances nor converts again.
3. **`coinsEarned` starts at zero** — no lifetime coin figure exists anywhere in the save, so
   there is nothing honest to backfill from. The meter simply starts low. **`lifetimeCoins`
   and `mintedBase` start at zero with it**, for the same reason.
4. **Nothing owned is re-locked**: open plots stay open (the Turn gate only refuses *purchases*
   while `turnsCompleted < plotTurnGate`), and `version` is stamped `4`.

### The ledger migration — phase 1 saves, added 2026-08-29 (phase 1.1)

A save that already carries a `year` but no `lifetimeCoins` — everything phase 1 wrote,
including the owner's own — is not a `migrateYear()` case, because its `year` key exists. It
is handled in `load()`'s field rebuild instead: **`lifetimeCoins` inherits the sanitised
`year.coinsEarned`** (the only earnings figure such a save actually holds) and **`mintedBase`
starts at 0**, so the year it is standing in is drawn exactly once — the same pouch the old
per-year formula would have paid it at zero Turns — and never again. A save that had already
completed Turns gets a one-off draw on its current year only; that is generous by at most one
year's pouch, bounded, and correct in the only direction that matters, since no honest
lifetime figure exists to reconstruct.

**The Turn is not the Settings reset.** `turnYear()` is a selective, atomic path over the
partition in [32-the-garden-year.md](32-the-garden-year.md#what-the-turn-clears-and-what-it-never-touches);
the `gw-save` wipe remains what it always was. Sim-test bill item 1 asserts the partition field
by field and fails the suite if a future save field is not classified as cleared-or-surviving.
