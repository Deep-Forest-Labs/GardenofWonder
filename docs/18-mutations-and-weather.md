# Mutations and Weather

**Status: built 2026-08-15**, steps 1–5. Step 6, card generation, is **withdrawn** — cards are a
parallel meta and are not fed by mutations; see [19-card-album.md](19-card-album.md). One thing in the original spec was wrong and was corrected by
measurement during the build — see "Exposure" below. Reasoning in
[10-decision-log.md](10-decision-log.md). Market evidence in
[17-market-and-positioning.md](17-market-and-positioning.md#why-plant-this-flower).

**The sky itself was restaged on 2026-08-31.** Until then, weather was one flat colour fade over the
garden and nothing else — no sound, no reaction from the world, no ending. It is now a
sequence: it announces itself, arrives in layers, holds while it stands, and finishes. Two of those
layers reach the simulation and are recorded here; the rest is show, and the show and every value in
it live in [41-weather-staging.md](41-weather-staging.md). **This document stays the mechanics
record** — what weather is worth, what it costs, and what it must never be allowed to become.

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
   (`CYCLE`, `bootAt`), so it restarted on every reload. **That move has happened** — `dayPhase()`
   lives in `game.js` and derives from epoch time, which is what `Game.isNight()` and therefore the
   sunbreak's daytime gate rest on. Moving the clock into `game.js` on real time
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

**Slot length is 60 s** in the web build, compressed like everything else here, in keeping with a
Daisy maturing in 12 seconds. Mobile scale will be much longer. Do not "fix" the
discrepancy; see the same note about grow times in [HANDOFF.md](HANDOFF.md).

## The mutation ladder

Four tiers. A plant holds **at most one** mutation and rolls for it exactly once, so tiers never
stack on a single bloom.

| Mutation | Catch chance | Pays | How often a harvest carries it |
| --- | --- | --- | --- |
| **Dewkissed** | 25% during Rain | ×2 | **~5.0%** |
| **Gilded** | 15% during Thunderstorm | ×10 | **~1.0%** |
| **Prismatic** | 12% during Aurora | ×25 | **~0.29%** |
| **Wonderstruck** | 10% during Wonderfall | ×100 | **~0.045%** |

Measured at **~20% of income**, evenly across seeds (Daisy 20.4%, Marigold 20.9%, Eternal Crown
19.2%). Four genuinely different events at four cadences — a couple a session, every other session,
about weekly, and once in a very long while.

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

### Exposure: one roll per plant — the spec's original model was wrong

**Every plant gets exactly one mutation roll**, at a moment chosen when it is sown
(`plantedAt + random() × grow`), evaluated against the weather standing at that moment. The roll
fires mid-growth, so the result is visible while the plant is still in the ground.

The first version of this spec said exposure was **one roll per weather slot lived through**, on the
theory that slow seeds *should* catch more weather. That was reasoned about, not measured, and the
measurement killed it:

| Seed | Income share, per-slot model |
| --- | --- |
| Eternal Crown (780 s) | **75%** |
| Marigold (55 s) | 21% |
| Daisy (12 s) | **5.9%** |

A **65× spread** — dominant late, nearly invisible early. Turning the catch rates down to fix the top
end pushed a Daisy to 0.6%, meaning a new player would go hours without ever seeing the feature the
game is partly built around.

**The reasoning error:** slow seeds do not need extra exposure, because they already get the reward.
The same ×10 lands on a far bigger yield — ×10 on an Eternal Crown is worth about 2,000× the same
mutation on a Daisy. Exposure was paying them twice.

With one roll per plant the share is **even across every seed** (20.4% / 20.9% / 19.2%), which is the
property that keeps mutations present at every stage of the game. The original catch rates turned out
to be right all along; only the exposure model was wrong.

**Consequence: there are no upgrades.** One roll means one outcome, so a plant cannot catch Dewkissed
and later improve to Gilded. That resolves an open question in the earlier draft, and it is simpler
to reason about.

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

## What the sky changes besides mutations

Two skies reach into the garden itself, and they are the only two that do. Everything else weather
does is presentation, and the line matters: a sky that quietly moved a third number would put the
income share out of reach of the one measurement that keeps it honest.

**Rain waters.** While it rains, a plant takes a tenth off its growing time — Stardew's most-loved
weather rule, and what turns a shower from a mood into a gift. It has to pay along
two paths to be honest, because growth is fixed at the moment a seed goes into the ground: a seed
sown into rain comes up that much sooner, and everything *already* growing when the sky turns has a
tenth shaved off whatever it has left to do. Neither path pays the other's plants, so one shower can
never quicken the same flower twice. The shave rides the turn in the sky rather than the sky itself,
which means the next rain is a fresh gift and a rain that simply carries on is not. A bought rain is
the same rain and waters identically. It multiplies into the same growth stack as sprinklers and
Keepers, under the same 0.3 floor, so no combination of gifts can collapse a grow time to nothing.

**And rain is deliberately kept out of the offline rate.** What the garden earns while you are away
is computed with the sky ignored on purpose. A sixty-second shower has no business setting the rate
for a day's absence, and if it did, closing the app during rain would be worth real money — an
incentive nobody asked for and the opposite of cosy. Rain waters what is in the ground, not what the
drone will plant tomorrow.

**An aurora brings the night with it.** While one hangs, the game answers *yes* to "is it dark"
whatever the hour, and that is exactly what lets an aurora read at noon. Everything keyed to night
wakes under it: a Nightbell pays its night rate, Nightbloom can lift a catch a tier, night-yield
creature traits count, and the night errand fires. It answers for the *moment it is asked about*
rather than for now, so a roll that came due while the tab was shut resolves against the sky that
was actually standing — the same rule the rest of this document already runs on.

The cost of that is small, and bounded on purpose: an aurora is 2.5% of slots, so night goes from
about 32% of all moments to about 34%, and a Nightbell's long-run average moves by less than a
twentieth of a multiplier. The suite holds that bound rather than trusting it, because the
temptation to make a rare sky pay *a bit more* is exactly how a bounded system stops being one.

## What the player sees

**While growing.** A mutated plant is visibly different the moment it catches — this is the whole
mechanic and it must never be deferred to harvest. `flora.js` already renders `glow` and
`rainbow: true` from the art block (Aurora Crown uses both), so the visual treatments largely exist.
Add a per-mutation tint and let the existing machinery carry it.

**When it catches.** A brief, tier-scaled celebration on that plot, placed on the feedback ladder in
[06-audio-and-fx.md](06-audio-and-fx.md) — Dewkissed is a small sparkle, Wonderstruck is the largest
moment in the game. **Confetti stays reserved for the top of the ladder**, or it stops meaning
anything.

**When weather turns.** A sky is a sequence, not a state. It announces itself, transforms in layers,
holds for as long as it stands, and then ends — and **rarity buys layers**: Rain moves three
channels of the world at once, the storm five, the aurora six, and Wonderfall moves all of them. A
Clear slot following a Clear slot does nothing whatever, and that silence is the whole reason the
other three slots in ten land as events.

**It is seen coming.** The sky is a function of the clock, so the next one can simply be read — and
a few seconds before a real sky lands, the flower says a line about it. Rain and the storm also push
a bank of grey cloud in ahead of themselves; the aurora and Wonderfall get the line and nothing
else, because both of them *begin*, and a wall of cloud in front of either would spend the surprise
the sky itself is. Nothing is announced for a Clear slot, and a sky already standing never announces
itself a second time.

**The world answers, differently for each sky.** Rain darkens the soil and cobbles, glistens the
plants and lands the occasional drop on one. The storm leans everything into the wind, flashes, and
sends tending creatures under the nearest leaves. The aurora rims every plant in light and stops the
creatures where they stand to look up. Wonderfall drops the veil, sets ripe plants bobbing and has
the flower sing. The banner ruling is unchanged and still right: **Wonderfall gets a banner and
nothing else does.** One four times an hour would be noise.

**The music rearranges rather than changing.** Every sky dresses the same four-bar progression its
own way over its own ambience bed, cross-fading without dropping the bar — the same tune in
different clothes. Rearrangement, never replacement.

**And Rain and the storm are the two skies with an ending.** They fade rather than stop: the drops
thin out, the ground stays wet for about half a minute after the sky has gone, and if the next slot
is Clear and it is daytime, the sun comes through in shafts for another half-minute while the flower
says so. That sunbreak is the payoff those two skies *earn* — it is why a storm is worth watching
all the way out, and it is the trace that says something happened here. The aurora and Wonderfall
simply go, because nothing could reasonably follow either.

The sequences, the ladder of channels and every tuned number in them are in
[41-weather-staging.md](41-weather-staging.md).

**On harvest.** The payout number carries the mutation's colour and name.

## Away from the game

Because weather is computable for any past moment, **mutations happen while you are away**, and a
garden left full is a garden that catches weather.

**No catch-up walk is needed, and an earlier draft of this section was wrong to call for one.**
`rollMutations()` evaluates each plant against `weatherAt(cell.mutateAt)` — the weather at *its own
scheduled moment* — so a roll that came due while the tab was shut already resolves against the sky
that was actually standing then. Reconciliation is O(plots), not O(slots), and it was correct before
anyone reported it. What was missing was only the *telling*.

`Game.reconcile()` returns the report and is called once on load. Surface it as *events*, not a
total: *"A thunderstorm passed over. Your Marigold came back Gilded."*
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

The ladder cannot be tuned by hand. The suite measures it instead — and it was the measurement that
caught the exposure error above, which no amount of reasoning had.

1. **Measure the income share directly**, for a fast seed *and* a slow one, and assert they land in
   the same band. This is the assertion that makes the design tunable, and the cross-seed comparison
   is what catches an exposure model that favours one end of the ladder. Write it first.
2. **Weather is deterministic.** The same slot yields the same weather on every call and across
   reloads.
3. **The distribution matches the table** over a large sample.
4. **A plant rolls exactly once** — a spent roll never re-fires, and a roll scheduled in the future
   does not fire early.
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
- ~~Can the player *see* the forecast?~~ **Answered 2026-08-31: the flower tells them, in one line,
  and only when a real sky is genuinely coming.** The one-slot lookahead the question wanted is
  there — the sky is computable, so the next slot has always been readable — but it is *spoken*,
  never displayed. A remark from the flower is anticipation; a forecast panel is a timetable, and
  the moment planting is scheduled against a readout the garden stops being a place and becomes an
  optimisation problem, which is precisely the risk this question named. A Clear slot is announced
  by nothing at all, so the lookahead is silent for most of the day.
- ~~Can the player see what the sky STANDING NOW is worth?~~ **Answered 2026-08-31: yes, and it does
  not reopen the forecast ruling above.** A tinted chip in the status rail names the sky, and a tap
  gives one paragraph about what it is doing. That is a status light for the sky that is here, not a
  timetable for the one that is coming — the distinction the ruling above turns on. **It carries no
  countdown**, and that is where the two touch: a countdown to the end of this sky is also a
  countdown to when the next one starts, and paired with the flower's spoken forecast it would
  rebuild most of the panel that was ruled out. **The timer is on the table for the owner**, with
  everything already in place if they want it.
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
