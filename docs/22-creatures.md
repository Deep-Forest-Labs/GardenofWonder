# Creatures

**Status: built 2026-08-16.** Six creatures, arrival, living in the garden, petting, keepsakes,
traits and tending, stars and growth, **eight named pairs**, a habitat and companions block in the
Almanac, save, and 131 sim-test assertions.

This is the first step of the **habitat direction** agreed 2026-08-16. Reasoning in
[10-decision-log.md](10-decision-log.md).

## The reframe this belongs to

Everything before this thought in **production chains** — garden makes flowers, bench makes goods,
market consumes goods. What creatures add is a second frame beside it: **the garden is a place that
becomes alive because of what you plant**, and part of the reward for playing is that it gets more
inhabited rather than only that a number gets bigger.

The owner's diagnosis is what started it: the world had a *place* and a *character*, but no
*inhabitants* — nothing lived there except the talking flower.

### The production chain is not cancelled — clarified by the owner 2026-08-16

An earlier version of this section said the chain "is not what this audience wants" and implied it had
been abandoned. **That overstated it and the owner corrected it.** The garden → bench → market chain
and the order system are still wanted; **what is missing is the right way to fold them in**, not the
appetite for them. Read the parked status of the Potting Bench and the Market as *unsolved*, never as
*rejected* — see [21-potting-bench.md](21-potting-bench.md) and
[13-order-system.md](13-order-system.md), both of which remain live designs.

What the research in [17-market-and-positioning.md](17-market-and-positioning.md#who-this-game-is-for)
actually supports is narrower and worth keeping straight: the likely audience is **69% female with
Completion and Fantasy as the top two motivations**, so a supply chain cannot be the *only* thing the
game asks you to care about. It is an argument about emphasis, not a reason to delete a system.

## The rule that makes this worth building

**A creature is a character first and a mechanic a distant second.**

If a grove spirit is "+5% growth" with a face drawn on it, this is the badge list wearing a costume,
and it fails for exactly the reason the AdVenture Capitalist trap describes. A sim-test asserts every
creature has a name, a species, a line about itself, a hint, a named keepsake, and arrival, idle and
pet dialogue — so a stat-only creature cannot be added without the suite noticing.

## Why this answers "why plant this flower"

The longest-running open question in the project. Verbs made flowers *behave* differently, mutations
made any flower *exciting*, orders would make a flower *wanted*. None of them made you want a
specific bloom.

**Pip comes for bluebells and for nothing else.** That is desire rather than a quota, and it costs a
data row.

## Attraction

```js
attract: { seed: 'bluebell', count: 5 }
```

Progress reads **`state.discovered`** — the lifetime harvest record — and never `state.flowers`.
Flowers are spendable, so an attraction keyed to the pantry would let a creature *leave* when the
player crafts, which is the same class of bug that once jammed the quest strip. Two sim-tests cover
it: an empty pantry does not send a creature away, and the wrong bloom never counts.

`checkCritters()` runs at the end of `harvest()`, **after `recordHarvest()`**, so the bloom that
meets the threshold is the one that brings the creature rather than the one after it.

Arrival is a moment, not a notification: confetti, the flower pulling a `wow` face, a banner, and
then the creature introducing itself **in its own voice** through `UI.sayText()` rather than the
flower's `FLOWER_LINES`.

## Keepsakes

```js
keepsake: { id: 'mossy_pebble', name: 'Mossy Pebble', every: 900, cap: 3, gems: 1, credits: 250 }
```

**The keepsake is kept, not just cashed in.** `state.mementos` holds a lifetime count per keepsake id
— nothing spends them yet, but a name that evaporates on collection is decoration, and any future
craft, display or trade needs quantities to read. Counts, not booleans, for the same reason the card
album stores counts.

**Ids are stable and separate from the display name**, so renaming *Someone Else's Button* can never
orphan a save. A sim-test asserts they are unique and never collide with a card id.

| Creature | Keepsake | Every | Cap | Pays |
| --- | --- | --- | --- | --- |
| Pip | Mossy Pebble | 15 min | 3 | 1 gem + 250 |
| Thistle | Bent Nail | 20 min | 3 | 1 gem + 400 |
| Bumble | Thimble of Honey | 20 min | 3 | 1 gem + 500 |
| Bramble | Someone Else's Button | 25 min | 3 | 2 gems + 600 |
| Luna | Wing Dust | 25 min | 3 | 2 gems + 700 |
| Ember | Warm Pebble | 30 min | 3 | 2 gems + 900 |

**Each is a small joke about its creature** — this is the Neko Atsume memento device recorded in
[17-market-and-positioning.md](17-market-and-positioning.md). Bramble brings you things, not all of
them hers, so hers is *Someone Else's Button*. Thistle digs constantly and forgets what he buried, so
his is a *Bent Nail*. That is the whole reason they are named rather than being "+250 coins".

**The coins and gems are the placeholder, not the memento.** Eventually the object should be the
reward and the currency should shrink or go — held mementos are the thing a craft or a display shelf
would read.

Derived from **elapsed time against an absolute timestamp**, the same shape the hives already use, so
time away counts for free and nothing needs replaying.

**Only a creature that is OUT leaves anything, from 2026-08-20.** A rester earns nothing while it is
in. This is what makes the loadout decide memento income rather than only trait income — and because
a decoration costs keepsakes from *two different creatures*, it means **the roster has to be rotated
to collect every kind**. That turns the loadout from a fixed optimum into something you revisit,
which is the property the slot limit was always reaching for.

**Nothing is lost by resting.** What a creature had already earned is banked the moment it goes in
and handed straight back when it comes out; the clock is stamped on both edges so the time spent
resting is never credited later. Asserted in both directions.

**A sleeping creature is still out, so it still leaves keepsakes.** Punishment on one axis: sleep
costs the trait, not the mementos.

**They cap.** Three waiting is a small gift; thirty is homework, and homework is what the cosy pillar
exists to prevent. `settleCritters()` runs once on boot and rolls a capped creature's clock forward
without paying out, so a creature that has been full for a week is not silently banking time it can
never turn into anything.

**Petting pays nothing at all**, and a sim-test asserts it. A creature you tap for currency is a
button; a creature that just reacts is a pet. The keepsake is the reward and the tap is the
relationship.

## Traits and tending

**Added 2026-08-16.** Creatures carry stats, because the owner wanted the roster to feel like pets
with attributes rather than a gallery — swappable, and worth thinking about.

**Depth is fine; RPG *framing* is the trap.**
[17-market-and-positioning.md](17-market-and-positioning.md#what-to-avoid-entirely) says idle RPG has
the worst install rate in mobile at 2.0 per 1,000 impressions. That is about how the game is
*marketed*, not whether there is strategy underneath. Loadouts, yes. "RPG" on the store page, no.

### Retraction: traits may share an axis with a verb

**An earlier version of this section said a trait must not share an effect category with a verb,
because the two would "cancel out". That was wrong and is retracted.** They stack, and stacking is
the pleasure of the genre — this project's own market doc cites Cookie Clicker's 36 synergy pairs
approvingly. The rule was imported from the wrong place: *verbs* may not share a category because a
plot picks **one** verb, so two identical verbs would make that choice meaningless. A loadout picks
**three of N**, which is a different problem.

### What actually constrains a trait: the pool it stacks into

Harvest payout is already seven multiplied terms —
`yield × rarity × (1+globalCredits) × (1+pollination) × wonder × mastery × verb × mutation` — and the
mastery ladder never ends. That product is where an idle economy quietly breaks, and it is the same
reasoning that kept mutations as chance-not-payout in
[18-mutations-and-weather.md](18-mutations-and-weather.md).

So every trait declares a `pool`:

| Pool | What it touches | Stack freely? |
| --- | --- | --- |
| `capped` | A stat with a ceiling — crit chance, growth floor, combo cap | **Yes.** The cap holds it |
| `chance` | A roll — mutation catch, gem drop, double harvest | **Yes.** `chance × (mult−1)` stays small |
| `utility` | Off the yield curve — keepsake speed, offline rate, information | **Yes** |
| `yield` | Multiplies the harvest product directly | **Sparingly.** Four at +25% is 2.44× on top of everything else |

Two sim-tests replace the retracted rule, and they guard what actually goes wrong:

- **The roster may not be all one kind of effect.** Six creatures that all add a percentage make
  choosing three a ranking rather than a decision. Once three or more traits exist, at least half must
  be distinct categories.
- **At most a third of the roster may sit in the `yield` pool.**

### The slot limit is the whole mechanic

```js
HABITAT_SLOT_LEVELS = [1, 5, 10, 16]   // slots = how many of these the level has passed
```

**Moved earlier on 2026-08-16, from 1 / 8 / 14 / 20.** Pairs are the most interesting thing in the
system and they need two slots to exist at all — at the old spacing a player could not form a single
pair until level 8, or hold two until 14. Discovering the mechanic late is the same as not having it.

**Only tending creatures stand in the yard.** Four is the most the lawn holds before it reads as
clutter, so a resting creature leaves the screen — but it is still home, still in the Almanac roster,
and still one tap from coming back. Nothing is ever taken away, which is what keeps this cosy; having
more creatures than slots is what makes "which three are out" a decision, and that decision is the
strategy layer.

A tending creature wears a leaf badge, so the state is legible from the garden itself, and **its glow
brightens with its star** — how grown a creature is reads off the art rather than only out of a panel.

**Stars are shown as stars, never as the word "level."** Five pips under the name say everything at a
glance, and the Almanac row carries a progress bar to the next one.

**Where resting creatures live: the Hollow.** Agreed 2026-08-16 and drawn as an art spike at
`tools/hollow-spike.html` — a warm burrow *under* the garden, reached through a crack in the roots.
Chosen over a shed interior or a fenced paddock because it is the only option that is both an
interior — walls, alcoves, somewhere to put a memento — **and** continuous with the garden, which the
locked navigation in [15-navigation-and-ia.md](15-navigation-and-ia.md) requires: you go *down*, not
away.

**`tools/hollow-spike-v1.html` is a frozen reference**, kept as a live file rather than a screenshot
so the wisps, the breathing light and the night palette can be compared honestly against any later
pass. Do not edit it.

**Warm earth, never stone.** Night cools only the light coming through the crack; the walls stay
ochre. A cold palette on the earth turns the room into a cellar, which is the failure this design is
most exposed to.

Three drawing lessons, all found by looking rather than by a test:

- **A jagged outline drawn the obvious way is a mountain.** In SVG a smaller `y` is higher, so the
  first two attempts at the crack produced upward peaks. A hole seen from below only reads when it is
  a bright irregular gap with dark earth teeth hanging *down* into it.
- **An even-width stroke is a wire, not a root.** A root has to be fat where it leaves the soil and
  thin where it ends.
- **Reuse a shape that already works before inventing one.** A plank shelf for mementos read as a
  wire strung across the wall; a small carved alcove — the burrow mouth at a smaller size — reads
  immediately.

**The spike is now full-screen portrait, 390 × 844**, because a square canvas was hiding the real
composition problem — the room has to fill a phone. What that settled:

- **A vertical tower of burrows reads well.** Five staggered rather than gridded, because earth is dug
  where it lets you, plus a floor spot and a memento cubby. Six creatures visible in one chamber.
- **The bottom 96px belong to the Hollow's own dock**, so the floor sits *above* it rather than
  disappearing under it. Reserving that strip changes the composition and had to be designed in, not
  added later.
- **The Hollow has different verbs from the garden** — Feed, Pet, Loadout, Decorate. A per-place dock
  is a small evolution of "places on the map, systems in the dock" in
  [15-navigation-and-ia.md](15-navigation-and-ia.md), and it also sidesteps the five-tab cap, because
  places no longer compete for slots.
- **Arch burrows, not circles.** A round mouth read as a sticker sitting on the moss; the arch
  encloses a creature. Moss **drips over the lip** — drawn behind the band so only the rounded bottom
  shows, because narrow shapes drawn in front read as table legs.
- **Vines run beside a burrow, never across one**, and have to hang from something. A vine crossing a
  burrow mouth reads as growing through somebody's front door, and one starting in mid-air reads as a
  mistake.

Agreed but not yet designed: **chambers rather than a continuous strip** — swipe between rooms of
three or four, which is more legible one-handed than scrubbing along a wall, gives each room its own
character, and is the natural unit for the decoration the owner wants later. **One level first**; a
second is a progression reward once the roster needs it, since an empty second floor is worse than
none. Entry is **a visible burrow mouth in the garden to teach it, and a swipe down as the fast
path** — swipe alone is undiscoverable, and swipe-down also fights the sheet drag and browser refresh.

**Wired into the game 2026-08-16.** A **burrow mouth** in the garden, bottom left, opens it; the exit
chip or a swipe up closes it. `hollow.js` draws the room and knows nothing about the game;
`ui-hollow.js` places real creatures into `Hollow.SPOTS` and owns the screen.

- **Every creature that has moved in lives down here**, up to six per chamber. The garden yard shows
  only the ones tending — the **leaf badge** in the Hollow is what says which, and the gem badge says
  who has a keepsake waiting. Tapping one pets it or collects, through the same `UI.tapCritter()` the
  garden uses, so there is one code path for the whole interaction.
- **The Hollow has its own dock** — Feed, Pet, Loadout, Decorate. **Feed and Decorate are honest
  about not existing** rather than doing something token: the buttons are there because the shape of
  the screen depends on them, and they say so when tapped.
- **The garden's dock, rail and quest strip hide while the Hollow is up**, via `.in-hollow` on
  `#game`. The frame loop redraws the Hollow instead of the garden yard while it is open.
- **The sky follows `Game.isNight()`**, so the room is lit by whichever light is actually outside.

### Five things only a real device showed

All five came from playing it on a phone, and four are the kind a screenshot hides.

- **Rebuilding is what breaks motion.** `renderTenants()` wiped and rebuilt every creature node on the
  0.6s tick, so every float, tilt and glow restarted constantly — which reads as a hitch at the end of
  the loop, not as a rebuild. The scene was redrawn on every entry too, which restarted the wisps and
  made the lights cut off harshly instead of fading. **Nodes are now built once and only their badges
  change**, and the scene is only redrawn when the sky actually changes.
- **A percentage of the container is not a position in the art.** The scene is drawn with
  `preserveAspectRatio="slice"`, so on any screen that is not exactly 390×844 it is cropped — and the
  overlaid creatures drifted off their burrows. `Hollow.SPOTS` are now the scene's **own coordinates**,
  mapped through the SVG's `getScreenCTM()`. Measured at 0px offset on every creature.
- **Swipe down to go up.** Dragging down pulls the world down past you, which is the direction every
  scroll already uses. Swiping up to rise reads backwards the moment you try it.
- **The dock has to be the garden's dock.** It was styled from scratch and felt like a different game;
  it now reuses `.dock` / `.dock-btn` / `.dock-ico`, so it matches by construction rather than by
  someone remembering to keep two rules in step. **Watch the hide rule**: `.in-hollow .dock` then
  swallowed the Hollow's own dock, so the garden's is hidden by `#dock` instead.
- **Idle animation was scoped to `.critter`**, so creatures in the Hollow floated but never tilted or
  blinked — noticeably less alive than the same creature upstairs. Every idle rule now covers
  `.hollow-pet` too.

Two placements also had to move: the tending count sat over the crack, where the art is busy enough to
swallow small white text, and the garden's leftmost creature spot sat under the burrow door.

### Tapping a pet in the garden, and swiping between the two places — 2026-08-20

**A tap on a creature in the garden collects what it left, and opens its panel when there is
nothing to collect.** One target, two jobs, and the right one every time — the collect is what you
came for when there is a badge, and when there is not, the thing you probably want is to feed it.
Walking down to the Hollow to feed a creature standing in front of you was the long way round.

**Swipe up in the garden to go down to the Hollow**, mirroring the swipe down that comes back.
Dragging up pulls the world up past you, the same direction any scroll uses.

**The swipe only starts on the background** — sky, lawn, the margins beside the board. Plots and the
flower act on `pointerdown` and have already fired by the time a drag is recognisable, so a swipe
begun on one would plant or harvest on its way out. Making them wait for `pointerup` would fix that
and cost the tap latency the entire core loop is built on, which is a far worse trade. The burrow
mouth is still the discoverable way in; the swipe is the fast path for someone who knows.

Both swipes require the gesture to be **vertical and clearly so** (`dy > dx`), so a diagonal drag
does nothing. The Hollow's exit gained the same start-target guard at the same time: dragging down
off a creature there used to open its sheet *and* leave the room.

### A tap on a creature opens everything you can do to it, 2026-08-20

**The Hollow is where they live, not where they work.** Collecting a keepsake happens **up in the
garden**, where the creature actually is when it is working. Down here it simply exists, and a tap
opens its own panel instead.

**One creature, one sheet.** Portrait, about line, trait at its current value, awake/fed state, the
growth bar, what its keepsake is doing, an out-or-rest button, the three foods, a Pet button, and
the pairs it belongs to. **Modes were a workaround** for having one tap target and several verbs;
a per-creature sheet is the answer that does not ask the player to arm anything first.

- **Loadout mode survives as a fast path**, because swapping three creatures in a row should not be
  three sheets. It is the one mode left, and the dock's Pet button is now effectively its off switch.
- **The dock is deliberately still there.** Feed still opens the roster-wide panel and Decorate is
  still honest about not existing. Whether Feed and Pet have anything left to do once every verb
  lives on the creature is the open question this change exists to answer — see the owner's note in
  [10-decision-log.md](10-decision-log.md).
- **The keepsake badge in the Hollow now means "there is something waiting for you upstairs."**
  Only a tender earns, and a tender is in the garden, so the badge always has somewhere to go.
- **Petting replies inside the panel.** The flower's speech bubble lives in the garden and is hidden
  while the Hollow is up, so a line said through it would land nowhere.

**The creature stands on the sheet, 2026-08-20.** Its art breaks out **above** the panel's top edge,
sunk far enough in that its body disappears behind the paper — a creature that only touches the top
edge reads as a sticker, one whose body is cut off by the panel reads as standing there. It is
absolutely positioned on `.sheet` rather than in the scrolling body, so it rides the open/close
transform and then holds still while the body scrolls, and it carries a radial glow in the
creature's own `art.glow`. Note the creature art leaves ~7% empty below the body inside its own
viewBox, so the overlap has to swallow that before it starts eating actual body.

The panel around it is a **character card, not a form**: the name in the game's existing `.outlined`
display type with the species beneath it, a big star row, and every fact in its own chunky chip.
**The palette stays paper and botanical** — the reference that prompted this is a dark-blue
sci-fi chrome, and borrowing its layout ideas is right where borrowing its colours would put a
different game's skin on this one. The owner confirmed that call.

**The growth row is a sentence made of pictures**, read left to right: **the bloom itself** in a
round token, then the bar with the count **inside** it, then the star being climbed toward. There is
deliberately no "Growing on Moonflower" line above it — the bloom does the naming, the caption
underneath only has to say which flower, and nobody needs to be told that a progress bar is
progress. The standing note from the owner is that **more iconography beats more sentences
everywhere in this game**, and this row is the worked example.

Two small things that matter in it: the count sits in the bar because that is where the eye already
is, and it is dark ink with a **white halo** rather than the house white-on-ink outline — at 13px
those eight offset copies crowd the glyphs into mud, where a halo stays clean over both the filled
and the empty half.

**The art is hidden by CSS whenever the sheet is not `.open`**, not by a JS call on the close path.
It rides the sheet's transform, and a closed sheet parks just below the bottom edge — which left a
creature's head sitting over the dock. Tying it to the class means no future close path can forget
it.

### The loadout is chosen in the room, 2026-08-18

**Pet and Loadout are modes, and a tap on a creature spends whichever is armed.** Loadout used to
open the Almanac, which meant choosing the pets standing in front of you by leaving the room and
reading a book about them. Now the dock button arms the mode, the armed button lights up, and
tapping a creature sends it out or lets it rest.

- **The room already had the display for this.** The leaf badge said who was tending before any of
  this was built; loadout mode adds a ring around it and steps a resting creature back to half
  opacity and low saturation. Nobody leaves — that is what keeps the slot limit cosy rather than
  punitive.
- **No toast for entering a mode.** The count line reads `3 of 3 tending · tap to swap` and the
  dimming carries the rest. Toasts are for notable moments and the cap is two.
- **The Almanac's Habitat block keeps its toggles.** It is still where an *unmet* creature and its
  harvest progress live, and the Hollow can only show creatures that are already home. Two surfaces
  onto one `Game.setTending()`, which is the same discipline `UI.tapCritter()` already follows.
- **Nothing was added to the save.** Mode is a UI local, reset to Pet on exit.

**A celebration cannot be centred on a hidden element.** Forming a pair from inside the Hollow fired
its confetti and ring from the top-left corner, because both the `pair` and `critter` handlers were
centred on `#garden` — and `.in-hollow` sets `display:none` on `.stage`, so `#garden` measures a
0×0 rect. Both now go through one `critterStage()` helper that picks whichever screen is up. This
was invisible until the Hollow became a place where the loadout can change; an automated harvest
could always have brought a creature while the room was open.

Still not built: chambers and sideways paging, a second level, and decorating.

## Food, and the two clocks it runs — 2026-08-18

Food does two separate things, and keeping them separate is the design.

| Food | Keeps it **awake** | Keeps it **well fed** | Costs |
| --- | --- | --- | --- |
| Clover Nibble | 4 hours | 1 hour | 1,500 |
| Petal Cake | 8 hours | 4 hours | 5,000 |
| Honeypot | 16 hours | 12 hours | 12,000 |

- **Awake** is upkeep. A creature whose awake clock has run out is **asleep** — eyes shut, Zs
  drifting up, contributing no trait and forming no pair. This is the retention mechanic and it is
  meant to have teeth.
- **Well fed** is a boost on top: the creature works **one star above itself**.

Every food does both, and **the awake clock always outlasts the boost**, asserted. The cheap food is
"keep them going"; the dear one is "keep them going *and* strong".

### How this landed, because the reasoning is the useful part

**The first pass had only the boost and nothing that ever switched off.** The owner asked for the
upkeep half back the same day, and was right to: *"as much as I think we are a cozy game, we need to
have some features that are somewhat punishing… the whole idea is retention and getting people to
come back in."* A game with no stakes gives a returning player nothing to feel.

**What resolved the objection was the presentation, not a compromise on the mechanic.** The
argument against an upkeep timer was that this document says three separate times that nothing is
ever taken away — "losing one is punitive", and a returning player finding a creature idle is "the
same class of harm as taking a seed away". **A pet that is visibly *asleep* is not a pet that was
taken away.** It is obviously reversible, it says what to do about it, and it is charming rather
than punishing. That is the Animal Crossing register rather than the energy-wall register.

**So the sleeping art is not decoration on this feature — it is the load-bearing part of it.** If a
creature ever stops working without *looking* asleep, the mechanic reverts to the version the cosy
pillar rejects. Treat the shut eyes and the Zs as a requirement, not a flourish.

It also settles what would otherwise have broken the pair rules. **Pairs need both halves tending
*and* awake**, so a pair does go quiet when someone falls asleep. That is fine here and only here:
the rules say "a bonus you cannot tell is active is not a bonus", and a visibly sleeping creature is
exactly how you can tell.

### What sleep costs, and what it deliberately does not

**Punishment on one axis is a mechanic; on two it is a tax.**

- A sleeping creature contributes **no trait** and forms **no pair**. `critterWorking()` is the one
  predicate for this — tending *and* awake — so a new consumer cannot forget half of it.
- It is **still home, still tending, and still holds its habitat slot.** Nothing is taken away.
- It **still leaves keepsakes.** A lapsed player comes back to a small gift waiting rather than to
  nothing, and mementos are the currency the Hollow's decorating will read.
- It **stays on screen**, asleep, in both the yard and the Hollow. Vanishing would be the
  "something was taken away" feeling coming back in through the side door, and a dozing pet is the
  reminder to feed it.
- **Tapping one says so in its own voice** — every creature has `lines.sleep`, asserted. A tap that
  did nothing would read as the creature having broken rather than as it being asleep.

**Only a *tending* creature can be asleep.** A resting one contributes nothing either way, and
**it cannot be fed** — so letting it read as asleep would show the player a problem with no way to
act on it, which is the one thing an upkeep mechanic must never do. Found by driving the dev cheats:
three resting creatures went to sleep and nothing could wake them. A rested creature swapped back in
with an expired clock *does* wake up needing food, and the Feed panel says so. Asserted both ways —
that a resting creature with an empty clock is not asleep, and that everyone listed as asleep is
someone who can be fed.

### Testing it without waiting four hours

`Game.Dev` carries three cheats for this, in the Developer tools panel under **Creature food
clocks**, which also shows a live count of how many tenders are down:

- **Drain 1h / 4h / 24h** winds both clocks *back*. This is the real mechanism rather than a
  simulation of it — sleeping is derived from `awakeUntil` against now, so moving it is exactly what
  the passage of time does. Both clocks move together, because every food's awake window outlasts
  its boost and *asleep but still well fed* is a state real play cannot reach.
- **Send them to sleep** empties every clock at once. It drains resting creatures too, so swapping
  one in shows it needing food.
- **Feed everyone** is the way back, and it goes through the real `feedCritter()` purchase path
  rather than writing the clocks, so the wake-up beat is the one a player gets.

### The numbers, and where the dial is

**4 / 8 / 16 hours awake is the tighter of two ladders the owner was offered** (the other was
8 / 16 / 24). It means a daily player has to feed on their first check-in and a twice-daily player
stays comfortably ahead. **If this ever reads as a chore rather than a habit, raise `awake` — never
the prices.** The failure mode to watch for is a player who finds their pets asleep *every* time,
because at that point it stops being pressure and becomes a wall.

**An arriving creature gets `ARRIVAL_AWAKE_HOURS` (24) free**, and a save written before sleeping
existed loads with the same grant. Nobody should meet their first pet and watch it fall asleep
before they have learned food exists, and nobody should open the game to a room of sleepers it never
warned them about. Note the side effect: the arrival grant equals the cap, so a brand-new creature
cannot be starved inside one food's worth of time. That is deliberate.

**Offline income is evaluated at the end of an absence**, so a creature that fell asleep while you
were away is simply not helping when `reconcile()` runs. Ember's `offlineRate` is the trait this
touches. It falls out of the closed-form rate for free and needs no replaying.

**For the Unity port:** this mechanic wants notifications, and
[17-market-and-positioning.md](17-market-and-positioning.md) is the ceiling to design against —
more than two streak nudges a week makes abandonment 41% more likely.

### A star rather than a flat multiplier

The obvious version was ×2 while fed. Measured against the real roster, that is safe for four
creatures and genuinely dangerous for two:

| creature | pool | at ★5 | flat ×2 | fed = ★6 |
| --- | --- | --- | --- | --- |
| Pip | chance | 25% | 50% | 30% |
| Thistle | chance | 60% | **120%** | 72% |
| Bramble | chance | 2% | 4% | 2.4% |
| Luna | **yield** | 30% | **60%** | 36% |
| Ember | utility | 20% | 40% | 24% |
| Bumble | utility | 100% | 200% | 120% |

The `pool` system already protects most of it — that is what it is for. Doubling a chance keeps
`chance × (mult−1)` small, Bumble stays under the existing `k.every/4` floor in
`keepsakesWaiting()`, and Ember sits inside the `maxRate` clamp. **Luna and Thistle are the two that
matter**: Luna is the only trait in the `yield` pool, and at ×2 she goes from +9.6% to **+19.2%
average payout** on a harvest product that is already seven multiplied terms with an endless mastery
ladder underneath. Thistle at ×2 doubles the faucet on the **premium** currency.

So food grants **one star**, which is self-limiting where a flat multiplier is self-amplifying:

```
★1 -> ★2   ×2.00      a fresh creature really does double
★3 -> ★4   ×1.33
★5 -> ★6   ×1.20      worst case Luna: +9.6% -> +11.5% average
```

The boost shrinks exactly as the creature's absolute contribution grows. It also costs almost
nothing to build, because `critterTraitAt()` already scales a trait by star — a fed creature simply
computes one higher. `FED_STARS` in `data.js` is the one number to change.

**The ceiling is `CREATURE_STARS + FED_STARS`, not `CREATURE_STARS`.** Clamping at five would have
handed the most invested player the only boost in the game that does nothing.

**Food never advances the star a creature was raised to.** `critterLevel()` stays what growth counts
against; `critterWorkLevel()` is what every trait reads. Keeping those separate is what stops food
becoming a second path to raising a creature — and the bloom-raises-its-own-creature rule is this
project's best answer to "why would I ever plant a Daisy again."

### The rest of the rules

- **Fed time caps at 24 hours** and the panel says so openly. Without a cap one large purchase buys
  weeks of boost and the loop it exists to create stops existing. A stated cap reads as a rule; a
  hidden one reads as theft.
- **Only a tending creature can be fed.** Traits are only read from tenders, so feeding a resting
  one would be a purchase that buys nothing. The panel says why, and the fix is one tap away in the
  Hollow's Loadout mode. A **sleeping** one is the opposite case — waking it is the whole point.
- **The Feed panel lists tending creatures first**, since resting ones cannot be fed at all and are
  dead weight at the top of a panel you opened to act in. It is deliberately **not** sorted by who
  needs feeding most: that order changes on the very tap you just made, so the row you were looking
  at would jump away the instant you fed it. This order only moves when the loadout does, which
  happens on another screen. The sort is stable, so each group keeps the roster order the Almanac
  uses.
- **Derived from absolute timestamps** (`fedUntil`, `awakeUntil`), the same shape keepsakes and
  hives use, so time away needs no replaying and nothing has to tick.
- **Prices are placeholders**, flat rather than scaling, like every other number in the economy. The
  per-hour rate falls as the tier rises, so a longer commitment is the cheaper way to buy it. Whether
  the price should eventually scale with star or level is a real open question — see below.
- **How it reads without a panel:** the garden's creature glow is driven by `critterWorkLevel()`, so
  a fed creature is visibly brighter out in the yard, and a sleeping one wears shut eyes and Zs. In
  the Hollow a fed creature also gets a third badge. **Three badges is the ceiling** — leaf for
  tending, gem for a keepsake waiting, clover for fed — and a fourth would not be readable at that
  size. Sleep is deliberately *not* a badge for this reason; it is the face.
- **The lit star sits in the slot the creature is working at**, not appended after the row. Appended,
  it reads as a sixth star rather than as one on loan. A five-star creature is the only case that
  genuinely grows a sixth pip.

### Drawing a sleeping creature

`critters.js` **always draws both pairs of eyes and the Zs**, and CSS picks which show. The file
still knows nothing about the game — it is never told whether a creature is asleep — and every
screen that draws a creature gets the state for free, including `tools/hollow-spike.html`.

Three things found by looking:

- **A Z that only exists once a keyframe has run is invisible** anywhere the animation does not
  play. The first pass started `.cr-z` at `opacity: 0` and faded it in — the same mistake already
  recorded for the pack badge, made again in a file whose comment said not to. Visibility belongs to
  the base style; the drift is the flourish.
- **A stroked Z is a hairline and disappears against dark earth.** They are filled glyphs rather than
  a stroked squiggle.
- **Then outlined filled glyphs were too loud.** Seen on a real phone they read as three hard graphic
  shapes stuck to a creature's head. They are now **solid white with no outline** — the one place the
  house rule of "flat fill inside one thick outline" is deliberately broken, because a Z is a wisp
  coming off a creature rather than a thing in the world. Smaller, softer, ~0.72 opacity.
- **The motion has to be a zigzag, not a slide.** The first pass translated each Z out to one side
  and scaled it up, which reads as a graphic being pushed rather than something drifting off a
  sleeping animal. It now sways left, right, left over a slow 4.8s rise with **no scaling**, and the
  three share one keyframe offset by negative delays so they form a stream rather than a pulse.
- **The corners of a creature belong to its badges.** Tucked beside the head, the Zs sat underneath
  the keepsake badge. They rise *above* the viewBox instead — every screen gives the creature SVG
  `overflow: visible`.

In a list row the Zs are hidden and only the shut eyes remain: they are sized to rise well clear of
the art, which in a 46px portrait means drifting into the row above, and nothing in a list should be
animating anyway.

### Two traps this landed on

- **`state.critters[id].fed` already existed and means the keepsake clock** — when the creature last
  handed one over. Food is `fedUntil`, and the two are unrelated despite the names. Writing food into
  `fed` would silently reset every keepsake timer in the game.
- **A new `data.js` global must be added to the `GLOBALS` whitelist in `tools/sim-test.js`.** It is
  an explicit list, and a missing entry makes the constant `undefined` inside `game.js`, which throws
  inside `load()`, which is caught — so the whole save silently resets and the failure surfaces
  somewhere unrelated. `CREATURE_FOOD`, `FED_STARS`, `FOOD_CAP_HOURS` and `ARRIVAL_AWAKE_HOURS` are
  now on it.
- **Rounding a remainder separately produces "23h 60m".** The span formatter rounded hours and
  minutes independently. Round to whole minutes first, then split.

Covered by **97 assertions**. The three that matter most: an unfed creature's trait returns to
*exactly* baseline while it is still awake, a sleeping one contributes exactly zero while staying
home, tending, and still leaving keepsakes, and everyone the game shows as asleep is someone the
player can actually wake.

### Stars — a creature is raised, not found

```js
CREATURE_STARS = 5
attract: { seed: 'bluebell', count: 5, growth: 3 }
```

A creature **arrives at one star with a fifth of its trait** and grows to full. `trait.value` in
`data.js` is the value at five stars, and `critterTraitAt()` scales it — so a one-star Pip gives 5%
and a five-star Pip gives the listed 25%.

This exists because a creature that arrives finished has nothing left to ask for — the same problem
Bloom Mastery was invented to solve for flowers. The point of a pet is that you raise it.

**The duplicate that raises it comes from the same bloom that attracted it**, at an escalating count:
`count × growth^(level−1)`, so Pip needs 5 / 15 / 45 / 135 / 405 lifetime Bluebell harvests. In
fiction, a second Pip turns up and merges in.

**This is the payoff, and it is bigger than the levelling itself:** a low-tier seed now has a reason
to be in the ground long after its coins stop mattering. It is the first real answer this project has
had to *"why would I ever plant a Daisy again."*

Arrival and growth run through **one** `checkCritters()`, and the growth check **loops** — a long
absence can bank enough for more than one star at once, and granting a single level per harvest would
silently swallow the rest.

Numbers are placeholders. The shape — arrives weak, escalating cost per star, capped at five — is the
part to keep.

### The roster

Six creatures, each on a different bloom and a different axis. Values are at ★5; a creature carries a
fifth of that at ★1.

| Creature | Comes for | Trait | Pool | At ★5 |
| --- | --- | --- | --- | --- |
| **Pip** — Grove Spirit | Bluebell (Lv 1) | *Coaxes the Sky* | chance | +25% mutation catch chance |
| **Bumble** — Gardenbee | Lavender (Lv 2) | *Busy Hands* | utility | Every creature's keepsakes arrive 100% faster |
| **Bramble** — Hedgefox | Rose (Lv 3) | *Forager* | chance | 2% chance a harvest turns up a card pack |
| **Thistle** — Hedgepig | Marigold (Lv 5) | *Rummager* | chance | +60% gem drop chance on harvest |
| **Luna** — Moonmoth | Moonflower (Lv 9) | *Moonlit* | yield | Night harvests pay +30% |
| **Ember** — Lampfly | Starlit Iris (Lv 10) | *Lantern Keeper* | utility | +20% offline earning rate |

**Six distinct categories and only one in the `yield` pool**, both asserted. Three properties worth
keeping as the roster grows:

- **Every creature is on a different bloom**, and they are spread across seed unlock levels 1 to 10,
  so creatures arrive gradually rather than all at once.
- **Bumble buffs the other creatures**, which makes the loadout self-referential and immediately more
  interesting than six parallel percentages.
- **Luna is the only yield multiplier and it is structurally capped** — night is roughly 32% of the
  clock, so +30% at night is about +10% on average, and the cap is something the player does not
  control. That is the shape to copy for any future `yield` trait.

Where each one lands:

| Trait | Consumer |
| --- | --- |
| `mutationLuck` | `catchMultiplier()` — the choke point both mutation roll paths use |
| `gemLuck` | the gem roll inside `harvest()`, alongside the Lantern verb. **Not** `gemChanceFor()`, which stays the base rate |
| `packLuck` | `rollCardPack(chance)` from `harvest()` — the same landing spot as the tap proc, so the album still only *receives* from the garden |
| `nightYield` | `critterPayoutMult()`, kept apart from `verbPayoutMult()` so a creature and a verb are never confused in a balance pass |
| `offlineRate` | `offlineRate()`, inside the existing `maxRate` clamp so a creature can never push past the cap |
| `keepsakeSpeed` | `keepsakesWaiting()`, floored at a quarter of the authored wait so no stack of helpers turns keepsakes into a print button |

A sim-test asserts each of these six actually moves its consumer. **A trait wired to nothing is
invisible until someone notices the number never changes**, which is the kind of bug that survives for
months.

Wired into **`catchMultiplier()`**, which is the single choke point both mutation roll paths already
go through, so there is no second consumer to keep in sync. It raises the **chance and never the
payout**, which is the rule that keeps the mutation income share computable — see
[18-mutations-and-weather.md](18-mutations-and-weather.md#tune-the-income-share-not-the-multipliers).

`critterTrait(id)` sums a trait across every tending creature. Consumers ask **by trait id, not by
creature**, which is what makes a new creature a data row: add the row and any existing consumer
already sees it.

### Two migration rules worth keeping

- **An arrival tends itself if there is room.** A first creature that did nothing until the player
  found a toggle would read as broken.
- **An absent `tending` field means "tend it", not "switched off".** A save written before traits
  existed must come back working; a returning player finding their creature idle with no explanation
  is the same class of harm as taking a seed away. A *deliberate* rest is still respected, and the
  slot trim caps both cases.

## Named pairs

Two specific creatures tending together unlock a third thing neither does alone. Cookie Clicker ships
36 of these; this game starts with eight, and each is one row of `CREATURE_PAIRS`.

**This is what stops a loadout being a ranking.** With six creatures and three slots there are 20
trios, and without pairs the answer is fixed — pick the three biggest numbers. With pairs, a trio
forms up to **three** at once, and the best answer depends on how you play.

| Pair | Both tending | Effect |
| --- | --- | --- |
| **Nightbloom** | Pip + Luna | A mutation caught after dark has a 50% chance to come in one tier higher |
| **Lantern in the Rain** | Pip + Ember | A sky called with gems lasts twice as long |
| **Pollination Rounds** | Pip + Bumble | Every creature holds five keepsakes instead of three |
| **The Long Watch** | Luna + Ember | Two more hours at full rate while away |
| **Night Errand** | Luna + Bramble | A pack found after dark is guaranteed a Rare or better |
| **The Hedgerow** | Thistle + Bramble | A foraged pack turns up with gems in it |
| **Jar of Odds and Ends** | Thistle + Bumble | Thistle's keepsakes pay double gems |
| **The Delivery Round** | Bramble + Bumble | A collected keepsake may turn out to be a card pack |

### Two perfect trios, on purpose

- **Pip + Luna + Ember** lights all three of Nightbloom, Lantern in the Rain and The Long Watch — a
  *night-and-away* build, for someone who checks in twice a day.
- **Thistle + Bramble + Bumble** lights The Hedgerow, Jar of Odds and Ends and The Delivery Round — a
  *finds-and-gems* build, for someone who plays actively.

Neither dominates. They reward **different lives**, which is the property worth protecting as the
roster grows.

### The four rules

1. **No pair touches the `yield` pool.** Every effect is a chance, a duration, a cap or an
   upgrade-to-a-roll. Eight pairs quietly joining the harvest product would be a multiplier stack
   wearing eight names. A sim-test asserts a full loadout never changes `critterPayoutMult()`.
2. **Categorical, never "+X% more."** "A mutation at night comes in one tier higher" is a different
   thing happening; "+15% mutation chance" is Pip again, louder.
3. **Every creature sits in at least two pairs**, asserted — otherwise a creature that appeared in
   none would be strictly worse than the rest the moment pairs existed.
4. **Binary.** Both out and it is on. A bonus you cannot tell is active is not a bonus, and scaling
   it with stars would make it unreadable.

### Nightbloom is the one to watch

Upgrading Dewkissed (×2) to Gilded (×10) is a **5× jump on that harvest**, so it is deliberately a
coin flip rather than a certainty, and `nightbloomCap` stops it ever producing the top tier — **the
game's biggest moment should be found, not engineered**, the same principle that keeps Wonderfall
unpriced in [03-systems.md](03-systems.md#gems-where-they-come-from-and-what-they-buy). Both numbers
live in `PAIR_TUNING`. If the economy runs hot, this is the first dial.

### Where each pair lands

Two are worth knowing because they are not where you would guess:

- **Night Errand banks a rarity floor** in `state.luckyPacks` rather than tagging the pack, because
  `state.packs` is a count and always has been. `openPack()` spends one floor on its first card.
- **Nightbloom is applied at both mutation roll sites** — the live one and the skip path. Applying it
  at one would make it silently inconsistent.

### Discovery

The Almanac's **Companions** block lists all eight. A pair you have formed is named with its effect;
one you have not shows **both portraits with the effect hidden** — a locked thing you can see is a
goal, a missing one is nothing. `state.pairsSeen` records the first forming, which fires a banner
once and never again.

## Where they live

On the lawn **below the garden board, never on a plot** — a creature standing on a plot reads as
something to harvest.

**The yard's height is reserved as `padding-bottom` on `.stage`, and `sizeGarden()` subtracts it.**
This is not cosmetic: the board sizes itself to the stage, so on a taller viewport it grew *down over*
the yard and put a creature on top of a plot. Reserving the strip is what keeps them separate at every
screen size. Creatures take fixed spots along the yard and keep them between renders.

**No permanent name label.** The arrival banner names it and the toast names it; a tag stapled under
every creature is clutter, and Neko Atsume reveals names on interaction for the same reason.

## Art

`critters.js`, the same contract as `flora.js` — parameters in, SVG out, knows nothing about the
game. A creature is a palette and a feature list, so a new one is a data row rather than a drawing.

Pip is **original work in the kodama archetype**, not a copy of one. The game ships commercially, so
the silhouette language is borrowed and the design is not: a sprout instead of a bare head, moss
speckles, blush, and a saturated storybook palette.

**One body, a vocabulary of features.** `crown` is `sprout | spines | ears | antennae`, plus optional
`wings` (`moth` broad, `buzz` small), `tail`, `stripes` and a palette. Six creatures come out of that
and a seventh is a data row. Only ever **one crown** per creature — two turns the silhouette to mush
at thumbnail size, which is the whole test in
[05-art-direction.md](05-art-direction.md).

Five rules learned while drawing them:

- **The sprout must clear the body.** Tucked lower, the crown swallows it and the creature reads as a
  generic ghost. The sprout is the entire reason it reads as *garden* spirit.
- **Blush stays well inside the silhouette.** A cheek that crosses the outline reads as a rendering
  fault.
- **Blush and an eye highlight are what keep a pale spirit friendly.** This game is storybook-bright,
  never haunted — see [05-art-direction.md](05-art-direction.md).
- **Wings must clear the body by a wide margin.** Tucked in behind it they read as small nubs and a
  moth stops being a moth.
- **No shading band.** An `inset()` clip drew a hard horizontal seam across every creature, most
  obvious on a light body. The house style is flat fills inside one thick outline, so the band was
  off-style as well as an artifact. Stripes use a real `<clipPath>` with a unique id — an inline
  `clip-path: path()` silently did nothing, which left the bee with no stripes at all.

Motion is all CSS: a slow float, an irregular head-tilt every few seconds, a blink, a pulsing glow,
and drifting spores. The tilt is the personality and it is worth protecting.

**Presence comes from a class toggle, never from a keyframe finishing** — the trap already recorded
for the pack badge. An element that only exists once an animation has run is untappable anywhere the
animation does not play.

## State

```js
critters: {
  pip: { since, fed, gifts, met }
}
```

Nested, so it gets its **own re-merge in `load()`**. The backfill drops any creature id that is no
longer in `CREATURES` and clamps `gifts` to the creature's cap, so shortening the roster or retuning
a cap cannot brick a save. Three sim-tests cover a save from before creatures existed, an unknown
creature id, and an impossible gift count.

## What is not built

- **Only one creature.** The roster is a data array and a second entry needs no code.
- **The collection surface is a start, not finished.** The Almanac now has a **The Habitat** block
  listing every creature — met ones with their about line, trait and a Tending toggle; unmet ones as
  a greyscale silhouette with their hint and harvest progress. It is not yet a proper Completion
  screen with keepsake records or a roster count.
- **Keepsakes pay coins and gems**, which is a placeholder. They should eventually pay something
  expressive rather than currency — see the memento device in
  [17-market-and-positioning.md](17-market-and-positioning.md). **Held mementos now have an agreed
  destination**: decorations for the Hollow, not food. See the open questions below.
- **No interaction with weather, night or verbs.** A moth that only comes at night is one `attract`
  field away, and `Game.isNight()` already exists.

## Open questions

- Do creatures ever leave? Leaning **no** — losing one is punitive and the cosy pillar argues
  against it.
- Should a creature do something mechanical at all, or stay purely a character? The rule above says
  character first; it does not say character *only*.
- Does the roster become the collection spine in place of the card album? Two collections split the
  pull of both — see the decision log.
- How many creatures per bloom? One-to-one is legible but caps the roster at 19.
- **Should food prices scale?** They are flat, so a Honeypot stops mattering late. Scaling with the
  creature's star is the obvious dial and it is self-balancing, but it also charges more for the
  creature you invested most in. Decide it with the wider economy retune rather than alone.
- **Mementos are still spent on nothing, and the answer is decorating, not feeding.** Agreed
  2026-08-18: mementos buy **decorations and skins for the Hollow**, with a piece costing keepsakes
  from *two different creatures* so decorating requires roster breadth. The art already has a memento
  cubby waiting for it, and it is the *item-as-key* device in
  [17-market-and-positioning.md](17-market-and-positioning.md). This is the next piece to build.
