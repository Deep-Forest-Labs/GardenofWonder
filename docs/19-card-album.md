# The Card Album

**Status: built 2026-08-15** — album, sets, cards, packs, the opening, and the spawning pack. Not
yet built: duplicates and dust, seasons, and completion rewards. Specified the same day,
replacing an earlier and wrong sketch that tied cards to flower species and mutations. Reasoning in [10-decision-log.md](10-decision-log.md).

## What it is

A **parallel collection meta**, in the shape of Monopoly Go's and Coin Master's sticker albums. The
player earns **card packs** from playing, opens them, and fills sets in a themed seasonal album.

Reference points: Monopoly Go (~$85M/month, album is the retention spine), Coin Master. Both are the
same structural idea — a collection layer that sits *beside* the game rather than inside it.

## The rule that defines the design: cards are independent of the garden

**A card is not a flower. A card is not earned by growing anything specific.** No card requires a
species, a mutation, a rarity, or any particular action in the garden.

This was got wrong once, so the reasoning is recorded:

- **A coupled album becomes a chore list.** If a card required a Gilded Marigold, the album would
  dictate what the player plants. The garden stops being a place to arrange and becomes a checklist
  to satisfy. Verbs and adjacency exist to make planting a *choice*; an album that overrides that
  choice cancels them out.
- **Independence lets everything pay into it.** Because cards care about nothing in particular,
  *every* system can grant a pack — quests, levels, dailies, the shop, a random spawn. A coupled
  album can only be fed by the one system it is coupled to.
- **It keeps two economies from fighting.** Card value never distorts the coin curve, and an economy
  retune never invalidates the album.
- **It is what the references actually do.** Monopoly Go's stickers are not board spaces. Coin
  Master's cards are not spins.

The album is **flower- and farm-flavoured**, so it is tonally of a piece with the game. It just is
not *about* the game's mechanics.

## Structure

| Level | Count | Notes |
| --- | --- | --- |
| **Season** | ~3 months | One themed album, e.g. *Harvest Moon* |
| **Sets per season** | ~12 | Each with its own art direction and a beat of story |
| **Cards per set** | 9 | Inside the 7–12 band collection research recommends |
| **Cards per season** | ~108 | |

Card rarity runs **Common → Uncommon → Rare → Legendary**, plus **exactly one Mythical per set** —
the chase card, and the reason to keep opening packs after a set is nearly done.

## Story is the product

This is the part that makes an album worth finishing rather than worth completing.

A season has a **theme** — *Harvest Moon* — and each of its twelve sets carries **a beat of that
story** plus its own art. The cards are the illustrations; the set is the page; the album is the
chapter. A player finishing a set should feel they learned something, not that a counter hit nine.

Three devices worth using, all cheap:

- **The talking flower narrates the album.** It already exists, it already has opinions, and it is
  the natural voice for "oh, *this* one." Same Blathers role recorded in
  [17-market-and-positioning.md](17-market-and-positioning.md).
- **Write a question, not an ending.** Merge Mansion built a cult following, $700M+ lifetime, on a
  question it never intends to answer. A season should open one and not close it.
- **Flavour text on every card.** ~108 lines a season, and it is the cheapest differentiator
  available.

**Do not gate story behind the Mythical.** The rarest card being the last beat of the narrative means
most players never see the ending, which is the version of this that generates resentment.

## Packs are the engine, not the cards

The dopamine in this genre is **opening**, not owning. Design the pack, not just the contents.

### Where packs come from

Every one of these is a system that already exists or is already planned:

| Source | Cadence | Notes |
| --- | --- | --- |
| **Quest rewards** | Regular | Slot alongside the existing `reward.boost` |
| **Level-ups** | Milestone | `DATA.levelGrants` already grants boosts this way |
| **Daily reward** | Daily | The strongest come-back-tomorrow hook the album offers |
| **Shop** | Player-chosen | **See the loot-box warning below** |
| **Random spawn in the garden** | Surprise | The best one — see below |
| **Order completion** | Later | When the Market ships |

### The spawning pack — built

**A card pack lands on a plot and waits to be collected.** Borrowed from Lucky Ladybug, because
"something turned up in your garden, go and get it" is a better beat than a number appearing in a
wallet. Unlike the ladybug badge it is **tappable**, since collecting it is the point.

This is the most valuable idea in the whole feature, because it costs almost nothing and does two
jobs at once. The machinery is built: three tap-triggered procs already roll independently on every
tap, each with a dedicated animation, tuned through one shared `PROC_CHANCE_PER_LEVEL` constant
(see [03-systems.md](03-systems.md#tap-triggered-garden-procs)). A pack proc is a fourth entry in
that pattern.

What it buys:
- **It gives tapping a second reason to exist** beyond coins, without touching the coin economy.
- **It connects the album to the garden without coupling them.** The garden is *where packs turn up*,
  never *what determines their contents*. That is the right relationship — presence without
  dependence.

**Always on, unlike the three badge procs.** `packDropChance` is a flat 0.0015 per tap with no
badge behind it, because this is the album's only in-game source — a player who has bought nothing
still has to be able to find one. It lands on any unlocked plot that does not already hold a pack,
planted or empty.

**The badge's visibility comes from `display`, never from its animation.** A badge that only exists
once a keyframe has run is invisible and uncollectable anywhere the animation does not play. The
landing and bob are a flourish on top.

### The opening

Spec this as carefully as any harvest. It is the moment the feature is for.

- Cards reveal **one at a time**, not as a grid.
- The reveal escalates: **rarity is telegraphed before the card is legible** — a glow, a colour, a
  held beat. The anticipation is the mechanic.
- A **new** card and a **duplicate** must read differently and instantly.
- Place it on the feedback ladder in [06-audio-and-fx.md](06-audio-and-fx.md). **A Mythical should be
  the loudest thing in the game outside a Wonder.**
- Never auto-open. The tap to open is the moment.

## Duplicates need a sink from day one

Duplicates are unavoidable and are the single most common source of album resentment. Monopoly Go
solves it with trading; there is no trading here yet
([16-progression-and-quests.md](16-progression-and-quests.md)).

**The sink: duplicates convert to a dust currency that buys a specific card of your choosing.** That
turns the worst moment in a pack — "I already have this" — into slow, visible progress toward the
card actually wanted, and it defuses the endgame problem where only one card remains.

Price dust so the last card of a set is *reachable but expensive*. Never let dust make the Mythical
trivial, and never make it impossible either — an unreachable final card reads as rigging and
triggers exactly the loss-aversion quit the research warns about.

## ⚠️ Paid random packs are loot boxes

The most important constraint in this document, recorded because "sales" came up as a pack source.

**Selling a randomized pack for real money is a loot box**, with the following consequences:

- **Banned as gambling in Belgium and the Netherlands.**
- **Barred to under-18s in Brazil from March 2026.**
- **PEGI rates loot boxes 16+** — which a bright, family-appeal garden game cannot absorb without
  losing the audience it is built for.
- Regulatory pressure on loot boxes is **the stated reason Nintendo shut down Animal Crossing: Pocket
  Camp**, a game that had earned $381M.

What is safe, and is what the album should sell:

| Safe | Not safe |
| --- | --- |
| Packs **earned** through play, however random | Randomized packs **bought with money** |
| Selling a **specific, named card** | "Mystery pack, 3 cards, $2.99" |
| Selling a **guaranteed-contents** bundle | Paid rerolls on a random draw |
| Selling **dust** | Paid odds-boosting |
| A **content pack** — a whole new set, contents listed | |

The Little Alchemy 2 content-pack model recorded in
[17-market-and-positioning.md](17-market-and-positioning.md#monetization) fits this exactly: sell
*more album*, never *a better chance*.

Also required regardless: **disclosed odds** on any pack, and the **real-world cost of any premium
currency shown beside it** — already law under the EU DSA.

## The seasonal commitment, honestly

Recorded because the earlier version of this doc had an affordability argument that no longer holds.

The first sketch tied cards to species × mutation, which meant ~95 cards fell out of art already
rendered procedurally. **That argument is gone.** Independent cards with bespoke art and story mean
**~108 hand-authored illustrations plus ~108 lines of writing, every season, forever.**

That is a real content pipeline, and it is the exact commitment the research says burns out small
teams — a season is a subscription to your own output, and **missing one scores worse than never
promising one.**

It also collides with a stated non-negotiable: **no binary assets, SVG only**
([09-conventions.md](09-conventions.md)). 108 bespoke SVG illustrations a season is not a realistic
authoring target by hand.

Three ways through, not mutually exclusive:

1. **Let the prototype cheat.** The web build is the design lab, not the shipping product. Prototype
   cards can be simple procedural compositions — a frame, a tint, a motif from `icons.js` — purely to
   prove the loop. Real illustration happens in Unity, which has an asset pipeline and no such rule.
2. **Compose rather than draw.** A card = background × motif × frame × rarity treatment. Authoring 12
   backgrounds, 20 motifs and 5 frames yields hundreds of distinct-looking cards. This is how the
   art cost stays survivable for two people.
3. **Keep a no-op fallback.** Pocket Camp Complete recycled seven years of events into a fixed
   offline rotation. A season that re-runs an earlier album with a fresh completion track is far
   better than a season that does not arrive.

**Position: build the album, design seasons as possible, and do not announce a cadence until one
season has been authored end to end and the hours measured.**

## What exists today

**12 sets of 9 = 108 cards**, in one season, *The Long Season*. Content in `ALBUM_SETS` / `ALBUM`
(`data.js`); state and drawing in the album section of `game.js`; three sheet panels in `ui-sheet.js` —
`album`, `cardset`, `pack`. Reached from the **Cards** button in the dock (it was a star in the HUD
until the Big Five rebuilt the bottom of the screen).

**The three screens were brought onto the house material on 2026-08-30.** The album shipped on 15
August and the visual standard hardened on the 26th, so these were the last screens in the game
still drawn the old way — flat pastel tiles on cream paper, no lip on anything, numbers set loose on
coloured bars. Nothing about the layout or the behaviour changed. What changed:

- **The tiles and the card faces are the dark body tier**, in the Tally plate's ramp
  (`#8a5a33 → #71472a → #5c3a22`, lip `#4a2e1a`), because that ramp exists for exactly this case: a
  dark body standing on cream inside a sheet. Twelve pale tints on pale cream had no figure and no
  ground, which is doc 05's first and most important check.
- **The set's tint moved to its ring**, under the white veil `.seed-art` uses — a tint belongs on a
  badge, not on a wall.
- **Every surface got the five-layer recipe**: grain, two blemishes, a lit top edge, a shaded bottom
  and an opaque lip with the contact shadow that goes with it.
- **`.cardcell.have .cardface` was the documented lip-deletion trap running live** — `box-shadow` is
  one property, so owning a card deleted its lit top edge. Every state now restates the whole stack.
- **A finished set wears a restated ring, not an `outline`** — an outline cannot carry a lip.
- **Unowned cards and duplicate reveals are DRAINED, not faded.** `--paper-dim` with the lip
  restated, never `opacity` or `grayscale`.
- **Every number is in a cream pill** — the `n/9` on the bars, the `+N` spare counter.
- **Rarity is painted in the rarity colours.** The reveal used to glow gem-cyan for Rare and
  coin-gold for Legendary — the two currencies — and Wonderstruck pink for Mythical. Rare is now
  `--rare`, Legendary `--legend`. **Mythical wears legendary gold said twice** — a solid ring, a
  wider glow and the saturate breath — because the card ladder has five rungs where the garden has
  four, and borrowing `--epic` purple would give the top rung a colour the player already learned
  means one rung *down*. Common and Uncommon get no ring at all, which is the feedback ladder's own
  rule about a common thing not announcing itself.

**What was deliberately NOT done, and is a question for the owner** — see
[HANDOFF.md](HANDOFF.md): the card face's internal composition (art above, name below, with the
lower third empty), a back for an unowned card, the grid gaps, and whether Mythical should have a
colour of its own. All four are layout or content, not look.

Every set has the **same rarity shape**: three Common, two Uncommon, two Rare, one Legendary, one
Mythical. Fixed on purpose — a new set is then only nine names and a tint, and a sim-test asserts
the shape holds across all twelve.

### Card art is a slot, not a commitment

```js
art: { icon: 'sprout', tint: '#8ce99a' }   // procedural placeholder, drawn from icons.js
art: { src: 'cards/dawn.png' }             // a real illustration, when one exists
```

`cardArt()` in `ui-sheet.js` renders either and nothing else knows which it got. **Nine motifs are cycled
across all twelve sets** (listed below under *The cards*) — still the web placeholder path; finished
candy-language faces are the Unity / illustration pipeline, locked 2026-10-03 against the candy-v2 plates.

This is how the no-binary-assets rule in [09-conventions.md](09-conventions.md) and real card art
coexist: the web build is the design lab and keeps its placeholders, finished art belongs to the
Unity port, and swapping one for the other is a data edit with no code change. Midjourney or any
other generator can therefore be used freely without it ever blocking the build.

### The cards (The Long Season)

Season name, set ids, card ids, names, rarities and motif icons are copied from `ALBUM_SETS` / `ALBUM`
and `CARD_MOTIFS` / `SET_SHAPE` in `data.js`. **12 sets × 9 cards = 108.** Every set uses the same
rarity shape: three Common, two Uncommon, two Rare, one Legendary, one Mythical. Motif index within
the set maps to rarity (card 1–3 Common … card 9 Mythical); the same nine icons recycle across every set.

#### Art direction lock 2026-10-03

Luke signed candy Cards art against the **candy-v2** plates (2026-10-03). Style bar:
**Garden of Wonder title splash / popzgames.com hero** — plump toy-smooth candy 3D, simple rounded
shapes, bright saturated colour, **not photoreal**, not complex topiary.

Drive folder: [Candy Cards plates](https://drive.google.com/drive/folders/1GpKgFm1m8pGdk3VwSvnZw8Mx9om0xVi3)

Reference files: `cards-motifs-sheet.candy-v2.jpg`, `mood-firstlight.candy-v2.jpg`,
`mood-nightgarden.candy-v2.jpg`, `mood-weatherwatch.candy-v2.jpg`.

**Motif language (9, reused across sets — not 108 unique illustrations):**

| # | Motif (candy lock) | `CARD_MOTIFS.icon` | tint |
| --- | --- | --- | --- |
| 1 | seedling | `sprout` | `#8ce99a` |
| 2 | petal (daisy) | `petal` | `#ffc9de` |
| 3 | sparkle | `sparkle` | `#c9b6ff` |
| 4 | lantern | `lantern` | `#ffd6a5` |
| 5 | butterfly | `butterfly` | `#a5d8ff` |
| 6 | hive+bee | `hive` | `#ffe066` |
| 7 | teacup | `teacup` | `#d8b4a0` |
| 8 | four-leaf clover | `clover` | `#b2f2bb` |
| 9 | star-bloom | `star` | `#ffd43b` |

**Set-mood concepts** (plates for First Light, Night Garden, Weather Watch): mood language only.
Weather Watch plate drifted sunny — treat as **soft / not locked subject**.

Season: **The Long Season**. Pack size: **3** (from `ALBUM.packSize`).

#### First Light (`firstlight`)

Set tint: `#ffe3bf`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `firstlight_0` | Dawn Chorus | Common | `sprout` |
| 2 | `firstlight_1` | Dewfall | Common | `petal` |
| 3 | `firstlight_2` | The Early Row | Common | `sparkle` |
| 4 | `firstlight_3` | Frost on the Gate | Uncommon | `lantern` |
| 5 | `firstlight_4` | Mist Over the Beds | Uncommon | `butterfly` |
| 6 | `firstlight_5` | Long Shadows | Rare | `hive` |
| 7 | `firstlight_6` | The Watering Can | Rare | `teacup` |
| 8 | `firstlight_7` | Sunrise Bloom | Legendary | `clover` |
| 9 | `firstlight_8` | The First Warmth | Mythical | `star` |

#### Harvest Moon (`harvestmoon`)

Set tint: `#ffd6a5`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `harvestmoon_0` | Full Moon | Common | `sprout` |
| 2 | `harvestmoon_1` | The Late Crop | Common | `petal` |
| 3 | `harvestmoon_2` | Lantern Path | Common | `sparkle` |
| 4 | `harvestmoon_3` | Moths at the Window | Uncommon | `lantern` |
| 5 | `harvestmoon_4` | Cider Press | Uncommon | `butterfly` |
| 6 | `harvestmoon_5` | The Long Table | Rare | `hive` |
| 7 | `harvestmoon_6` | Autumn Wreath | Rare | `teacup` |
| 8 | `harvestmoon_7` | Moonlit Furrow | Legendary | `clover` |
| 9 | `harvestmoon_8` | The Harvest Song | Mythical | `star` |

#### Good Neighbours (`goodneighbours`)

Set tint: `#b2f2bb`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `goodneighbours_0` | Over the Fence | Common | `sprout` |
| 2 | `goodneighbours_1` | Borrowed Shears | Common | `petal` |
| 3 | `goodneighbours_2` | The Spare Seedling | Common | `sparkle` |
| 4 | `goodneighbours_3` | Jam for the Postman | Uncommon | `lantern` |
| 5 | `goodneighbours_4` | A Cutting to Share | Uncommon | `butterfly` |
| 6 | `goodneighbours_5` | The Shared Wall | Rare | `hive` |
| 7 | `goodneighbours_6` | Left on the Step | Rare | `teacup` |
| 8 | `goodneighbours_7` | Village Show | Legendary | `clover` |
| 9 | `goodneighbours_8` | The Kindest Gardener | Mythical | `star` |

#### Small Visitors (`smallvisitors`)

Set tint: `#a5d8ff`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `smallvisitors_0` | Bumblebee | Common | `sprout` |
| 2 | `smallvisitors_1` | Ladybird | Common | `petal` |
| 3 | `smallvisitors_2` | Garden Snail | Common | `sparkle` |
| 4 | `smallvisitors_3` | The Bold Robin | Uncommon | `lantern` |
| 5 | `smallvisitors_4` | Hedgehog at Dusk | Uncommon | `butterfly` |
| 6 | `smallvisitors_5` | Dragonfly | Rare | `hive` |
| 7 | `smallvisitors_6` | The Fox Who Waits | Rare | `teacup` |
| 8 | `smallvisitors_7` | Barn Owl | Legendary | `clover` |
| 9 | `smallvisitors_8` | The Rare Moth | Mythical | `star` |

#### Weather Watch (`weatherwatch`)

Set tint: `#c5f6fa`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `weatherwatch_0` | Soft Rain | Common | `sprout` |
| 2 | `weatherwatch_1` | Sun After Rain | Common | `petal` |
| 3 | `weatherwatch_2` | The Still Morning | Common | `sparkle` |
| 4 | `weatherwatch_3` | Thunder Far Off | Uncommon | `lantern` |
| 5 | `weatherwatch_4` | Petrichor | Uncommon | `butterfly` |
| 6 | `weatherwatch_5` | Hailstones | Rare | `hive` |
| 7 | `weatherwatch_6` | The Green Sky | Rare | `teacup` |
| 8 | `weatherwatch_7` | Aurora | Legendary | `clover` |
| 9 | `weatherwatch_8` | The Wonderfall | Mythical | `star` |

#### The Tool Shed (`toolshed`)

Set tint: `#e9d8c4`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `toolshed_0` | Trowel | Common | `sprout` |
| 2 | `toolshed_1` | Twine | Common | `petal` |
| 3 | `toolshed_2` | The Good Gloves | Common | `sparkle` |
| 4 | `toolshed_3` | Terracotta Pots | Uncommon | `lantern` |
| 5 | `toolshed_4` | Seed Tins | Uncommon | `butterfly` |
| 6 | `toolshed_5` | The Wheelbarrow | Rare | `hive` |
| 7 | `toolshed_6` | Grandfather’s Spade | Rare | `teacup` |
| 8 | `toolshed_7` | The Brass Tap | Legendary | `clover` |
| 9 | `toolshed_8` | The Lost Key | Mythical | `star` |

#### The Night Garden (`nightgarden`)

Set tint: `#c9b6ff`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `nightgarden_0` | Evening Primrose | Common | `sprout` |
| 2 | `nightgarden_1` | Moonflower | Common | `petal` |
| 3 | `nightgarden_2` | Night Scent | Common | `sparkle` |
| 4 | `nightgarden_3` | The Owl’s Round | Uncommon | `lantern` |
| 5 | `nightgarden_4` | Glow Worms | Uncommon | `butterfly` |
| 6 | `nightgarden_5` | Stars Through Leaves | Rare | `hive` |
| 7 | `nightgarden_6` | The Sleeping Hive | Rare | `teacup` |
| 8 | `nightgarden_7` | Midnight Bloom | Legendary | `clover` |
| 9 | `nightgarden_8` | What Blooms Once | Mythical | `star` |

#### Sweet Things (`sweetthings`)

Set tint: `#ffc9de`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `sweetthings_0` | Honeycomb | Common | `sprout` |
| 2 | `sweetthings_1` | Elderflower Cordial | Common | `petal` |
| 3 | `sweetthings_2` | Windfall Apples | Common | `sparkle` |
| 4 | `sweetthings_3` | Bramble Jam | Uncommon | `lantern` |
| 5 | `sweetthings_4` | The Cake on the Sill | Uncommon | `butterfly` |
| 6 | `sweetthings_5` | Sugared Petals | Rare | `hive` |
| 7 | `sweetthings_6` | Rosehip Syrup | Rare | `teacup` |
| 8 | `sweetthings_7` | The Secret Recipe | Legendary | `clover` |
| 9 | `sweetthings_8` | First Honey | Mythical | `star` |

#### The Gardener’s Ledger (`ledger`)

Set tint: `#d8cfc0`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `ledger_0` | Seed Packets | Common | `sprout` |
| 2 | `ledger_1` | Pressed Flowers | Common | `petal` |
| 3 | `ledger_2` | The Margin Note | Common | `sparkle` |
| 4 | `ledger_3` | A Bad Year | Uncommon | `lantern` |
| 5 | `ledger_4` | The Good Year | Uncommon | `butterfly` |
| 6 | `ledger_5` | Sketch of a Bee | Rare | `hive` |
| 7 | `ledger_6` | Weather Notes | Rare | `teacup` |
| 8 | `ledger_7` | The Last Page | Legendary | `clover` |
| 9 | `ledger_8` | What Was Planted First | Mythical | `star` |

#### The Wild Edge (`wildedge`)

Set tint: `#8ce99a`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `wildedge_0` | Nettles | Common | `sprout` |
| 2 | `wildedge_1` | The Unmown Corner | Common | `petal` |
| 3 | `wildedge_2` | Bindweed | Common | `sparkle` |
| 4 | `wildedge_3` | Seedheads | Uncommon | `lantern` |
| 5 | `wildedge_4` | Where the Fence Ends | Uncommon | `butterfly` |
| 6 | `wildedge_5` | The Old Hedge | Rare | `hive` |
| 7 | `wildedge_6` | Foxgloves | Rare | `teacup` |
| 8 | `wildedge_7` | The Path Nobody Cut | Legendary | `clover` |
| 9 | `wildedge_8` | What Grew Back | Mythical | `star` |

#### Keeping (`keeping`)

Set tint: `#ffe066`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `keeping_0` | Dried Bunches | Common | `sprout` |
| 2 | `keeping_1` | The Cold Frame | Common | `petal` |
| 3 | `keeping_2` | Wrapped in Newspaper | Common | `sparkle` |
| 4 | `keeping_3` | Root Cellar | Uncommon | `lantern` |
| 5 | `keeping_4` | Labelled Jars | Uncommon | `butterfly` |
| 6 | `keeping_5` | The Saved Seed | Rare | `hive` |
| 7 | `keeping_6` | Overwintering | Rare | `teacup` |
| 8 | `keeping_7` | The Long Wait | Legendary | `clover` |
| 9 | `keeping_8` | Come Spring | Mythical | `star` |

#### The Open Question (`openquestion`)

Set tint: `#ffd43b`.

| # | id | name | rarity | motif icon |
| --- | --- | --- | --- | --- |
| 1 | `openquestion_0` | A Gate You Did Not Build | Common | `sprout` |
| 2 | `openquestion_1` | Footprints in the Beds | Common | `petal` |
| 3 | `openquestion_2` | The Bell Nobody Rang | Common | `sparkle` |
| 4 | `openquestion_3` | Someone Has Been Weeding | Uncommon | `lantern` |
| 5 | `openquestion_4` | A Note, Unsigned | Uncommon | `butterfly` |
| 6 | `openquestion_5` | The Locked Greenhouse | Rare | `hive` |
| 7 | `openquestion_6` | What the Flower Won’t Say | Rare | `teacup` |
| 8 | `openquestion_7` | The Ninth Row | Legendary | `clover` |
| 9 | `openquestion_8` | Not Yet | Mythical | `star` |

### Drawing

`drawCard()` rolls a rarity off `CARD_RARITIES` (weights 46/27/17/8/2), then **biases toward cards
the player is missing** within that rarity. An album that keeps returning duplicates nobody can yet
spend is the fastest way to make collecting feel like a chore, and dust does not exist yet to soften
it. A sim-test asserts a single missing card gets found quickly.

A pack is **three cards**. `openPack()` returns each marked new or duplicate, plus any sets the pack
completed — reported **once**, on the pack that finishes them.

### State

`state.cards` maps card id to a **count**, not a boolean — duplicates have to be representable for
dust or any future gifting to exist at all. Plus `state.packs` and `state.setsClaimed`. All three are
top-level and all three need their own re-merge in `load()`, since nested objects are replaced
wholesale; an old save without them loads clean, and a test covers it.

### The opening

Cards reveal **one at a time**, never as a grid. The frame telegraphs rarity before the name is
legible, a duplicate is visibly greyed and reads "Already had it", and the celebration escalates —
sparks for common, a ring for rare, confetti and a shake for Legendary and Mythical, which also
pulses. Set completion fires a banner after the last card, not during.

## Data model

- A card is an owned **instance with an id**, never a boolean on a card type. Duplicates must be
  representable, because dust needs them and any future gifting or trading needs them.
- Sets, cards, rarities, art references and flavour text are **all content in `data.js`**, shipped
  through remote config later. A new season must be data, never code.
- Pack contents are generated from a rarity table, also data.
- Album progress records owned instances, set completion and album completion separately.

## Completion rewards

- **Set completion** pays immediately and visibly. Nine cards is a short enough run that the payoff
  must feel like an event.
- **Album completion** is the season's headline goal and should pay something memorable — a decor
  piece, a title, a permanent cosmetic that says *I was here for Harvest Moon*.
- **Never start a player at zero.** Pre-load one card in the first set. Blank starts are the leading
  abandonment cause in collection design.
- Prefer rewards that are **cosmetic or expressive** over rewards that are power. The album is a
  parallel economy and should stay parallel — paying power into the coin curve would recouple the two
  systems this document exists to keep apart.

## Open questions

- Do sets unlock in sequence, or are all twelve open from the start? Sequence tells the story in
  order; open lets the player chase what they like.
- Does an expired season's album stay viewable? **Leaning: yes, always.** A collection you can lose
  access to is a collection not worth building.
- Can incomplete sets carry over between seasons, or do they close? This is the FOMO dial, and the
  cosy pillar argues for carrying over.
- Is dust per-season or permanent?
- Does the album need its own dock tab, or does it live behind Cards alongside the Almanac? See
  [15-navigation-and-ia.md](15-navigation-and-ia.md) — the dock caps at five.

## Build order

1. **One set of nine cards, one pack source** (quest reward). Hand-authored, no season, no dust.
   Enough to feel the open.
2. **The opening sequence**, properly juiced. This is the feature; give it the time.
3. **The spawning pack proc** — the fourth entry in the existing tap-proc pattern.
4. **Duplicates and dust.**
5. **Twelve sets and a season frame.**
6. **Set and album completion rewards.**
7. **Story and flavour text.**

Steps 1–2 are the minimum to judge whether opening a pack is fun. Everything else is content.
