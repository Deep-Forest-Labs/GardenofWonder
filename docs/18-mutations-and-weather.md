# Mutations and Weather

**Status: specification, not built.** Specified 2026-08-15. Structure is locked; every number below
is a starting point to be tuned against a measured target, not a value to trust. Reasoning in
[10-decision-log.md](10-decision-log.md). Market evidence in
[17-market-and-positioning.md](17-market-and-positioning.md#why-plant-this-flower).

## The trap this design exists to avoid

The game already rolls Common / Rare / Epic / Legendary at 70/20/8/2 for ×1/2/4/8 on every harvest.
**If a mutation is "a second dice roll that multiplies payout", it is rarity with a new coat of
paint** — the AdVenture Capitalist failure mode this project has already diagnosed once.

Three properties keep them structurally different. All three are load-bearing; drop one and this
becomes rarity again.

| | Rarity today | A mutation |
| --- | --- | --- |
| **When you learn** | At harvest | **While it is growing** — you watch it arrive |
| **Agency** | None | **Odds you can stack** |
| **Cause** | Hidden dice | **Visible weather in the world** |

The feeling being bought is *"look what happened to my garden"*, not *"that harvest paid well."*

## The weather clock

Weather is **derived deterministically from wall-clock epoch time**, not from a running timer.

```
slot      = floor(epochSeconds / WEATHER.slotSeconds)
weather   = WEATHER.table[ hash(slot) ]
```

`hash` is any small deterministic integer hash of the slot number. No stored state, no scheduler.

Three things fall out of that choice, and together they are the reason for it:

1. **Everyone sees the same sky at the same moment.** A shared-world feeling with no server, no
   accounts, and no live-ops.
2. **Past weather is computable.** `slot` for any moment in the past can be evaluated, so weather
   that happened while the player was away can be reconciled on load. This is what makes mutations
   feed the welcome-back scene rather than fight it.
3. **It fixes the day/night cycle.** That cycle currently lives in `ui.js` keyed to *page boot*
   (`CYCLE`, `bootAt`), so it restarts on every reload. Moving the clock into `game.js` on real time
   makes the sky honest and **re-opens the night-blooming verb** that had to be dropped from the
   first verb pass for exactly this reason — see [10-decision-log.md](10-decision-log.md).

**`game.js` still touches no DOM.** It owns the clock and exposes `weatherAt(t)` / `currentWeather()`;
`ui.js` reads those and paints. The existing layering rule is unchanged.

### The weather table

| Weather | Share of slots | Mutation it can cause | Sky |
| --- | --- | --- | --- |
| **Clear** | 70% | none | current sky, unchanged |
| **Rain** | 20% | Dewkissed | grey wash, drifting droplets |
| **Thunderstorm** | 7% | Gilded | dark sky, occasional flash |
| **Aurora** | 2.5% | Prismatic | colour bands across the night sky |
| **Wonderfall** | 0.5% | Wonderstruck | the Wonder Effect's palette, garden-wide |

**Weather rarity gates mutation rarity, and that is the point.** A Wonderstruck needs a rare *sky*
and then a roll inside it — two gates, which is what makes it genuinely rare without any single
absurd probability. It also means the rare sky is itself an event you notice and want to plant into.

Reuse the Wonder Effect's existing veil and palette for Wonderfall rather than authoring a second
garden-wide treatment. It already exists, it already reads as "something special is happening", and
the tonal overlap is a feature.

**Slot length.** Web build runs compressed like everything else here — a few minutes per slot, in
keeping with a Daisy maturing in 12 seconds. Mobile scale will be much longer. Do not "fix" the
discrepancy; see the same note about grow times in [HANDOFF.md](HANDOFF.md).

## The mutation ladder

Four tiers. A plant holds **at most one** mutation — the best it has caught — so tiers never stack
on a single bloom.

| Mutation | Catch chance per slot | Pays | Contribution to average income |
| --- | --- | --- | --- |
| **Dewkissed** | 25% during Rain | ×2 | ~+5% |
| **Gilded** | 15% during Thunderstorm | ×10 | ~+9% |
| **Prismatic** | 12% during Aurora | ×25 | ~+7% |
| **Wonderstruck** | 10% during Wonderfall | ×100 | ~+5% |

Roughly **+26% of average income**, arriving as four genuinely different events at four different
cadences — a couple a session, every other session, about weekly, and once in a very long while.

### Tune the income share, not the multipliers

This is the durable decision and the one to protect.

**Target: mutations contribute 20–30% of total income.** Pick that first; derive chance × multiplier
to hit it. The share survives a full economy retune. Individual multipliers do not — when seeds are
rebalanced, recompute the ladder against the same target and the work is done.

The arithmetic that should govern every future change here:

```
contribution = chance × (multiplier − 1)
```

Which produces a result worth internalising: **a rare huge multiplier is economically safer than a
common modest one.** A ×3 at 20% adds **+40%** to average income; a ×50 at 0.2% adds **+10%**. The
modest common bonus inflates the curve four times harder and delivers a fraction of the feeling.

**So: be generous at the top of the ladder and stingy at the bottom.** Jackpots are cheap. Frequent
small bonuses are what quietly wreck an economy.

### Slow seeds catch more weather, on purpose

A plant is exposed to mutation once per weather slot it lives through, so a 780-second Eternal Crown
sees far more weather than a 12-second Daisy. **This is a feature, not a rounding error.** It hands
long-grow seeds a real advantage that has nothing to do with yield, and it partially answers the
throughput-trap class of problem recorded in [11-known-issues.md](11-known-issues.md) — a slow seed
is now buying mutation exposure with its grow time.

It also makes the ladder harder to tune by hand, which is why the target is a *measured* income share
rather than a set of numbers someone reasoned about. See "Sim-test requirements" below.

## Stacking the odds

Agency is what separates this from rarity, and the game already has the mechanism: **verbs**.

- A **Beacon** adjacent to a plot raises that plot's catch chance.
- Future tools (a weathervane, a glass cloche, a rain barrel) do the same, and are the natural home
  for a rewarded-video or upgrade lever later.

This is Grow a Garden's sprinkler mechanic mapped onto a system already built and already liked. It
means an arranged garden meaningfully out-performs a random one during weather, which is the whole
reason adjacency exists.

**Rule:** stacking multiplies the *catch chance*, never the payout. Payout tiers stay fixed, so the
income-share target stays computable and a well-built garden gets *more jackpots*, not bigger ones.

## What the player sees

**While growing.** A mutated plant is visibly different the moment it catches — this is the whole
mechanic and it must never be deferred to harvest. `flora.js` already renders `glow` and
`rainbow: true` from the art block (Aurora Crown uses both), so the visual treatments largely exist.
Add a per-mutation tint and let the existing machinery carry it.

**When it catches.** A brief, tier-scaled celebration on that plot, placed on the feedback ladder in
[06-audio-and-fx.md](06-audio-and-fx.md) — Dewkissed is a small sparkle, Wonderstruck is the largest
moment in the game. **Confetti stays reserved for the top of the ladder**, or it stops meaning
anything.

**When weather turns.** The sky changes and the flower comments. Rare weather deserves a banner;
Rain does not. A cue on every slot change would be noise four times an hour.

**On harvest.** The payout number carries the mutation's colour and name.

## Away from the game

Because weather is computable for any past moment, **mutations happen while you are away**, and a
garden left full is a garden that catches weather.

Reconcile on load by walking the slots since `lastSeen`, and surface the result in the welcome-back
scene as *events*, not as a total: *"A thunderstorm passed over. Your Marigold came back Gilded."*
That is the Neko Atsume framing recorded in
[17-market-and-positioning.md](17-market-and-positioning.md#offline-progress) — who visited and what
they left, never "+4,213 coins".

**This is a reason to log off with a full garden, which is exactly the right incentive** — and it is
why mutations should be built alongside the offline work rather than before it.

### The anti-FOMO rules

The first design pillar is *cosy, not demanding*. Weather must never punish absence.

- **Mutations land on what is already growing.** Being present is never required.
- **Weather recurs forever.** No limited-time sky, no seasonal-only mutation, no missable tier.
- **Nothing is lost by missing a storm.** Another is coming.
- **Never notify about weather.** A push telling someone to come and watch the sky is the exact
  pattern this audience punishes.

## Mutations do NOT feed the card album

An earlier draft of this document claimed mutations were the album's content engine, with card rarity
mapping onto the mutation ladder. **That was wrong and is retracted** — see
[19-card-album.md](19-card-album.md) and [10-decision-log.md](10-decision-log.md).

Cards are a **parallel meta**, deliberately independent of the garden. No card is earned by growing
anything in particular. The reason matters here: if a card required a Gilded Marigold, the album
would dictate what the player plants, and the garden would stop being a place to arrange and become a
checklist to satisfy. Verbs, adjacency and mutations all exist to make planting a *choice*. An album
that overrode that choice would cancel them out.

**Mutations pay in coins, rarity and spectacle. They do not pay in cards.** The album's relationship
to the garden is that packs *turn up* there — the spawning-pack proc — never that the garden
determines their contents.

The mutation Almanac is a separate thing from the card album and stays coupled to species, as it
should: see [16-progression-and-quests.md](16-progression-and-quests.md).

## State and save

Keep this small — the weather clock is derived and stores nothing.

- `cell.mutation` — mutation id or null, on each grid cell. Cleared on harvest with the rest.
- `state.lastSeen` — epoch seconds, for offline slot reconciliation.
- Cards are recorded per (species, mutation) in the album's own structure, and per
  [16-progression-and-quests.md](16-progression-and-quests.md) a card must be an owned **instance
  with an id**, not a boolean, so gifting or trading stays possible later.

`cell.mutation` is a **new per-cell grid field**, which means it needs its own backfill loop over
`state.grid` in `load()` — the same trap that `luckyBug` hit. See "Traps in this codebase" in
[HANDOFF.md](HANDOFF.md). Nothing else needs migrating.

## Sim-test requirements

The ladder cannot be tuned by hand, because "slow seeds catch more weather" makes the blended result
depend on what the player plants. The suite measures it instead.

1. **Measure the income share directly.** Play a representative garden forward across many weather
   slots and assert mutations contribute **20–30%** of total income. This is the assertion that
   makes the whole design tunable; write it first.
2. **Weather is deterministic.** The same slot yields the same weather on every call and across
   reloads.
3. **The distribution matches the table** over a large sample.
4. **A plant holds at most one mutation**, and only ever upgrades to a better tier.
5. **Offline reconciliation is exact** — walking slots forward equals having been present.
6. **Stacking raises catch chance and never payout.**
7. **`yield === cost × 1.4` still holds**, as it does through verbs. Mutations are a third axis and
   must not touch the seed curve.

Per [11-known-issues.md](11-known-issues.md), **pin `Math.random` and prefer exact assertions on a
single event to tolerances on sampled means** — with one deliberate exception: the income-share test
is inherently statistical, so give it a wide band and a large sample rather than pretending it is
exact.

## Open questions

- Does a plant that catches Dewkissed and later meets a Thunderstorm upgrade to Gilded, or is the
  first catch final? **Leaning: upgrade.** A plant that can still improve is a plant worth leaving in
  the ground, which supports long grow times and full gardens.
- Can the player *see* the forecast? A one-slot lookahead would create real anticipation and real
  planting decisions. It also risks turning a cosy game into an optimisation problem.
- Does Wonderfall also trigger the existing Wonder Effect, or are they deliberately separate events
  that can coincide?
- Should mutation affect anything besides payout — gem chance, growth, card rarity only?
- Do the three tap-procs (Rain Dance, Bee Swarm, Lucky Ladybug) interact with weather? **Rain Dance
  in particular reads like it should summon Rain**, which would be a strong tie between the tap loop
  and the garden loop.

## Build order

1. **The weather clock and the sky.** Deterministic epoch slots, `game.js` owns it, `ui.js` paints
   it. Ship this alone and confirm the sky is pleasant before anything depends on it.
2. **One mutation, end to end** — Dewkissed. Catch, visible while growing, pays out, one sim-test.
3. **The rest of the ladder**, plus the income-share test that tunes it.
4. **Verb stacking.**
5. **Offline reconciliation**, alongside the welcome-back work.
6. **Card generation** from species × mutation.

Steps 1–3 are the minimum to judge whether this is fun.
