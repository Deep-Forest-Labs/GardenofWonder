# Save Data

## Storage

| | |
| --- | --- |
| Mechanism | `localStorage`, JSON |
| Current key | `gw-save` |
| Legacy key | `igr-save` (*Idle Garden Reborn*) |
| Schema version | `2` |

Saves are scoped to the browser origin, so a GitHub Pages deployment shares storage with anything
else published under the same `github.io` account. Progress does not sync between devices and is
lost if the player clears site data.

## State shape

```js
{
  version: 2,
  credits: 100,
  tickets: 0,
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
  decor: [ { id: 'gnome', type: 'critChance', val: 0.05 } ],   // one entry per copy owned
  boosters: { bloom: 1735689600.123 },                          // id → absolute expiry, epoch seconds
  harvestsThisSession: 0,
  stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
  wonder: { until: 0, last: 0 },
  prefs: { sfx: true, music: false },
  seen: { intro: false, plot: false }
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

**`decor` is a list, not a count.** Each purchased copy pushes another entry, and `decorVal()` sums
them. A player with ten gnomes has ten array entries.

**`harvestsThisSession` is a misnomer** — it's saved and never reset, so it's a lifetime counter
driving the every-10-harvests ticket bonus.

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
re-merged over its defaults individually: `tap`, `stats`, `wonder`, `prefs`, `seen`.

**When you add a nested object to state, add it to that list.** Forgetting is the single most likely
way to break loading for existing players.

### Schema fixups

Two live migrations run on load:

- `plot1Gardener` is renamed to `plot1Harvester` (the key was renamed during the rebuild) and the
  old key deleted.
- Any missing `plotNHarvester` key is initialised to `0`, so adding harvester slots later is safe.

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

**Reset does not touch `igr-save`.** The legacy save is never destroyed, so a reset player will
have their old *Idle Garden Reborn* progress re-imported on the next load. Arguably a bug,
arguably a safety net. Recorded in [11-known-issues.md](11-known-issues.md).

## Changing the schema

If you add a field:

1. Add it to `defaultState()`.
2. If it's a nested object, add it to the individual re-merge list in `load()`.
3. Existing saves will pick up the default automatically — no version bump needed.

If you change the *meaning* of an existing field, bump `version` and write an explicit upgrade step
keyed off the old value. Nothing currently branches on `version`; it's set to 2 unconditionally on
load, so it's available for exactly this purpose but unused so far.

Never rename a field without a fixup like the `plot1Gardener` one. Players have saves.
