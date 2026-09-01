# The screens

Every key screen of the live build, at true phone size. **Captured 2026-09-01** from the
build as it stood; regenerate the whole gallery with:

```bash
node tools/capture-screens.js
```

That drives the real game headlessly through every state below and rewrites both the images
and this page. Nothing here is hand-made, and nothing here should be hand-edited — the next
run silently overwrites it. If a screen looks wrong, the game changed: run the command.

Shot at 390x844 at 2x, the phone this game is designed for. Each screen is
**driven into its state first and photographed second**, and the run asserts that state before
the shutter fires — a screen photographed in the wrong state looks perfectly plausible, and is
the one failure this gallery exists to prevent.

Images are linked by absolute URL, so this page renders identically in the repo, on the wiki,
and for anyone you forward it to.

---

## The garden

### The summer garden, mid-year

[![The summer garden, mid-year](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/summer-garden.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/summer-garden.png)

The core loop with a year behind it: eight plots planted at staggered stages, creatures tending, and the talking flower waiting for a tap.

Owned by [08-ui-and-layout.md](08-ui-and-layout.md) · drawn by [ui.js](../ui.js)

### The Big Five dock, in situ

[![The Big Five dock, in situ](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/big-five-dock.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/big-five-dock.png)

The five buttons the whole game navigates from — Orders & Quests, Cards, Garden, Turn and Shop — carrying their live counts and dots.

Owned by [36-hud-and-dock.md](36-hud-and-dock.md) · drawn by [index.html](../index.html)

### The welcome-back report

[![The welcome-back report](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/welcome-back.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/welcome-back.png)

What a returning player is shown first: what the garden banked while they were away, and what is standing ready.

Owned by [03-systems.md](03-systems.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The menu

[![The menu](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-menu.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-menu.png)

The hamburger opens a drawer off the right edge: your face and your name, then everywhere else. Four rows built, three reserved and drained.

Owned by [08-ui-and-layout.md](08-ui-and-layout.md) · drawn by [ui-menu.js](../ui-menu.js)

### Your garden is your face

[![Your garden is your face](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-avatar-picker.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-avatar-picker.png)

Every portrait is drawn by the game from something the player earned — unlocked blooms, then creatures that have moved in. No uploads, no photographs, ever.

Owned by [03-systems.md](03-systems.md) · drawn by [ui-menu.js](../ui-menu.js)

### The What's New announcement

[![The What's New announcement](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/whats-new.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/whats-new.png)

One announcement, once, on the way in — a piece of owner-supplied art, a few plain lines, and a single button.

Owned by [08-ui-and-layout.md](08-ui-and-layout.md) · drawn by [ui-news.js](../ui-news.js)

## The seasons

### Fall — the bed part-filled

[![Fall — the bed part-filled](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/fall-bed.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/fall-bed.png)

Fall's woven trug with five of its eight plots planted at mixed stages, and the chip counting the fill toward the windfall.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-fall.js](../ui-fall.js)

### Fall — the bed armed for the windfall

[![Fall — the bed armed for the windfall](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/fall-armed.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/fall-armed.png)

Every crop ripe at once, and the trug takes a gold rim: clear the whole bed in one go and the windfall pays a bonus on top.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-fall.js](../ui-fall.js)

### A locked season — the Winter gate

[![A locked season — the Winter gate](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/season-gate-winter.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/season-gate-winter.png)

A season you have not reached yet is a hedge with a lock on it, naming the Turn that opens it.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui.js](../ui.js)

## The Turn

### The Turn — the ask

[![The Turn — the ask](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-ask.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-ask.png)

Beat one. The year is over: what turning pays, what it takes away, and what it never touches.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Turn — the blessing

[![The Turn — the blessing](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-blessing.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-blessing.png)

Beat two. One flower is blessed for the year ahead, and the choice is the only thing carried across the reset.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Turn — the Tally, mid-roll

[![The Turn — the Tally, mid-roll](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-tally.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-tally.png)

Beat three, caught while it is still counting: the year totted up into the Saved Seeds that survive it.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Turn — the spring return

[![The Turn — the spring return](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-spring.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/turn-spring.png)

Beat four. The hedges open on a new year, and this first Turn is the one that unlocks Fall.

Owned by [32-the-garden-year.md](32-the-garden-year.md) · drawn by [ui-sheet.js](../ui-sheet.js)

## The other places

### The Hollow

[![The Hollow](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-hollow.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-hollow.png)

The warm room under the garden where every creature that has moved in actually lives — one of them asleep, which is what makes the upkeep read as cosy rather than as a chore.

Owned by [22-creatures.md](22-creatures.md) · drawn by [ui-hollow.js](../ui-hollow.js)

### The Wild Meadow

[![The Wild Meadow](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-wild-meadow.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-wild-meadow.png)

The second place: eight cobbled cells holding hives and keepers, worked by the creatures you are not using in the garden.

Owned by [25-world-map.md](25-world-map.md) · drawn by [ui-meadow.js](../ui-meadow.js)

## The panels

### The plant picker — a locked unlock price

[![The plant picker — a locked unlock price](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/plant-picker.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/plant-picker.png)

Seeds no longer gate on level: past the free two, every flower carries a price, and the picker shows exactly what the next one costs.

Owned by [33-year-one-economy.md](33-year-one-economy.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Upgrades sheet

[![The Upgrades sheet](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/upgrades.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/upgrades.png)

What coins buy inside a year — harder taps, faster growth, automation — with some bought, one affordable and the rest out of reach.

Owned by [04-economy.md](04-economy.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Almanac — petal tracks

[![The Almanac — petal tracks](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/almanac.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/almanac.png)

Every flower ever grown, and the permanent petal ladders that Saved Seeds buy — the part of the game that outlives a year.

Owned by [16-progression-and-quests.md](16-progression-and-quests.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Cards album

[![The Cards album](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-album.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-album.png)

The parallel meta: twelve sets to fill, deliberately independent of the garden, with a pack waiting to be opened.

Owned by [19-card-album.md](19-card-album.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Cards album — one set

[![The Cards album — one set](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-set.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-set.png)

Inside a set: nine cards across five rarity rungs, the owned ones lit and the missing ones still ghosts.

Owned by [19-card-album.md](19-card-album.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### A pack reveal

[![A pack reveal](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-pack.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/cards-pack.png)

The moment a pack opens. The roll is pinned here so this picture is the same every run; in the game it is not.

Owned by [19-card-album.md](19-card-album.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Stand — the orders queue

[![The Stand — the orders queue](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-stand.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-stand.png)

The Market: villagers at the counter, each wanting something the garden can grow, shown here at tier 3.

Owned by [13-order-system.md](13-order-system.md) · drawn by [ui-sheet.js](../ui-sheet.js)

### The Shop

[![The Shop](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-shop.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/the-shop.png)

Where gems go: decor that changes nothing but how the garden looks, and the called skies.

Owned by [03-systems.md](03-systems.md) · drawn by [ui-sheet.js](../ui-sheet.js)

## The weather

### Rain

[![Rain](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-rain.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-rain.png)

The common sky, and the only one that changes the simulation: rain grows things faster and can leave a Dewkissed bloom behind.

Owned by [41-weather-staging.md](41-weather-staging.md) · drawn by [ui-weather.js](../ui-weather.js)

### Thunderstorm

[![Thunderstorm](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-storm.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-storm.png)

Rarer and heavier: a near-navy sky, slanted drops and lightning, with a Gilded bloom as the prize.

Owned by [41-weather-staging.md](41-weather-staging.md) · drawn by [ui-weather.js](../ui-weather.js)

### Aurora

[![Aurora](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-aurora.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-aurora.png)

Rare enough to be an event. It bends the light rules and reads as night at any hour, which is how Prismatic blooms happen at noon.

Owned by [41-weather-staging.md](41-weather-staging.md) · drawn by [ui-weather.js](../ui-weather.js)

### Wonderfall

[![Wonderfall](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-wonderfall.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-wonderfall.png)

The rarest sky in the game at one slot in two hundred: gold drizzle over a lifted, saturated world, and a Wonderstruck bloom if you catch one.

Owned by [41-weather-staging.md](41-weather-staging.md) · drawn by [ui-weather.js](../ui-weather.js)

### The sunbreak

[![The sunbreak](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-sunbreak.png)](https://deep-forest-labs.github.io/GardenofWonder/docs/screens/weather-sunbreak.png)

Not a sky of its own but the reward for sitting through one: rain or a storm ending into daylight puts shafts of sun across the garden.

Owned by [41-weather-staging.md](41-weather-staging.md) · drawn by [ui-weather.js](../ui-weather.js)

---

_28 screens. The scene table that produced them — what each one drives, and what it
asserts before capturing — is the top of [`tools/capture-screens.js`](../tools/capture-screens.js).
Add a screen there and it appears here on the next run._
