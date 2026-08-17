# Save Data

## Storage

| | |
| --- | --- |
| Mechanism | `localStorage`, JSON |
| Current key | `gw-save` |
| Legacy key | `igr-save` (*Idle Garden Reborn*) |
| Schema version | `3` |

Saves are scoped to the browser origin, so a GitHub Pages deployment shares storage with anything
else published under the same `github.io` account. Progress does not sync between devices and is
lost if the player clears site data.

## State shape

```js
{
  version: 3,
  credits: 100,
  tickets: 0,                 // kept so old saves parse; zeroed after conversion
  gems: 0,
  tap: { power: 1, critChance: 0.05, critMult: 10, combo: 0, comboMax: 50 },
  grid: [ /* 8 cells */
    { locked: false, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '' }
  ],
  upgrades: {
    tapPower: 0, critChance: 0, critMult: 0, comboMeter: 0,
    plotExpansion: 0, autoWater: 0, autoHarvest: 0,
    plot1Harvester: 0, /* … through plot8Harvester */
  },
  decor: [ { id: 'gnome' } ],   // one entry per copy owned, cosmetic only since v3
  boosters: { bloom: 1735689600.123 },                          // id → absolute expiry, epoch seconds
  boostInv: { bloom: 0, seedrush: 0, fortune: 0, golden: 0 },   // held copies, not yet activated
  harvestsThisSession: 0,
  stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
  wonder: { until: 0, last: 0 },
  prefs: { sfx: true, music: false },
  seen: { intro: false, plot: false },
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

**`harvestsThisSession` is a misnomer** — it's saved and never reset, so it's a lifetime counter
driving the every-10-harvests reputation drip.

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
three, so the dead entry permanently costs the player a slot, and `stripQuest()` renders
`active[0]`, so it can also jam the quest strip. This was added when the three unreachable sell
quests were removed (2026-08-15). A claimed daily is left alone on purpose — rerolling it would pay
its reward twice.

**`seen` flags are backfilled from play evidence in `load()`.** Like the other nested objects it is
merged defaults-first, so a save predating a flag reads back `false` and re-runs onboarding for a
player who is plainly past it. `intro` is inferred from `stats.totalTaps || stats.totalHarvests`,
`plot` from `stats.totalHarvests` or any occupied plot. **A new `seen` flag needs its own line**,
the same rule as a new badge key. Covered by the suite.

**`prefs.music` defaults to `false`.** Deliberate: unrequested audio on load is hostile.

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
re-merged over its defaults individually: `tap`, `stats`, `wonder`, `prefs`, `seen`, `boostInv`,
`discovered`, `bestRarity`, `mastery`, `rarityCounts`. `almanacClaimed` is copied as an array when
present, else `[]`. `rarityCounts` is nested a second level — a missing seed key reads as
`{ rare: 0, epic: 0, legend: 0 }` through `rarityCountsOf()`, which is the only thing that should
read it.

**When you add a nested object to state, add it to that list.** Forgetting is the single most likely
way to break loading for existing players.

### Schema fixups

Three live migrations run on load:

- `plot1Gardener` is renamed to `plot1Harvester` (the key was renamed during the rebuild) and the
  old key deleted.
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

## Reset

Settings offers a reset behind a two-tap confirmation that disarms after 4 seconds. It removes
`gw-save`, restores defaults in place, and emits `grid`, `panels` and `currency`.

**Reset clears `igr-save` as well as `gw-save`** (changed 2026-08-15). It previously left the
legacy key alone, so the next load re-imported the player's old *Idle Garden Reborn* progress and a
reset silently didn't take. The safety-net reading lost: a player who asks for a clean start is
asking for a clean start, and nothing in the UI explained the import.

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
  pip: { since, fed, gifts, met }   // one entry per creature that has moved in
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

**Attraction stores nothing.** Progress is read live from `state.discovered`, which is already a
lifetime record that never decrements — see [22-creatures.md](22-creatures.md).
