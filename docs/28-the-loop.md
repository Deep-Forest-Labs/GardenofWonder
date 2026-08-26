# The Loop — what a session is, what the player's job is, and what is scarce

**Status: proposal, 2026-08-26.** Item 0 of the sequence in
[27-design-audit.md](27-design-audit.md#the-order-to-settle-things-in). It exists because
everything below it — the spine, the ceiling, retention, monetization, the retune — is
unanswerable until this is settled, and because the owner asked directly for the merge feature to
become a larger part of the game.

It answers three questions and makes one recommendation the owner has not yet ruled on.

---

## The question underneath all of it

> **What is the player's job when they open the app?**

Today the answer is *tap the flower and re-plant the plots*. Both are explicitly designed to be
automated away — per-plot harvesters, then the Harvest Drone, then offline earnings. After
automation the game asks nothing of the player at all, and that is why the ceiling, the session
shape and the retention plan are all missing at once. They are the same hole seen from three
angles.

**The bench is the answer, and this document is the argument for it.**

---

## The Gossip Harbor lesson, extracted correctly

The owner played Gossip Harbor and named what worked, precisely: *"you spawn items while you're
merging, and then you see the orders appear up top as you play. It gave the merging game a fun
aspect of progression or goals while you're merging."*

There are three things in that sentence and **only one of them is about merge**:

1. **A generator you act on to produce.** Garden Wonder has one — the talking flower — but its
   output is coins, which is the least interesting thing a generator can make.
2. **Demand rendered on top of supply.** The order queue lives *on* the production surface. You
   never navigate to find out what is wanted.
3. **Visible progress while you play.** Every action advances something you can see without
   opening a panel.

**Point 2 is the load-bearing one, and it is a layout insight rather than a genre one.** Garden
Wonder currently puts its demand **two navigations away from its supply**: garden → swipe down →
map → tap the Stand → dive in → read → back out → plant. The MVP's own feel rubric in
[25-world-map.md](25-world-map.md#the-mvp-decided-2026-08-25--build-plain-test-the-feel-polish-as-we-go)
asks *"does checking the Stand pull you back into planting something specific"* — and as laid out,
it structurally cannot. The customer is smiling at you from a screen you are not on.

---

## Merge central: yes. A merge game: no

The owner floated *"maybe this turns into a game that's more like Gossip Harbor, and we just have
some extra features like the garden and the pets."* This is the one part of the direction this
document argues against, and it argues for going **further** than the status quo in every other
respect.

### Three reasons the garden stays the home screen

**1. Merge core loops monetize on energy, and energy is already rejected — twice.**

Gossip Harbor, Merge Mansion, Travel Town and Family Island are all energy-gated. That is not a
coincidence, it is the genre's business model: a merge board is infinitely playable, so the
developer sells the right to play it. [25-world-map.md](25-world-map.md#what-was-looked-at-and-deliberately-not-taken)
rejects energy as *"the anti-cosy pattern"* and names the cosy pillar as **the product**.

A merge game without energy has no engine under it. Removing energy from the shape removes the
reason the shape earns.

**2. A merge core loop carries the content treadmill that killed the match-3 plan.**

[HANDOFF.md](HANDOFF.md#decisions-already-made) records the reasoning: *"Merge replaced an earlier
match-3 plan because match-3's hand-designed level treadmill is unsustainable for two people."*

That holds while merge is a **side board**. Promote it to the core and the treadmill arrives with
it, because a merge board with nothing to spend on is a board you abandon. Gossip Harbor's
consumable content is a renovation storyline of hundreds of drip-fed tasks; Merge Mansion's is the
same. **Metacore and Microfun are not small teams.** The merge board is the cheap half of a merge
game; the task ladder is the expensive half, and it never stops.

**3. It trades the only differentiated asset in the project for the most commoditized screen in
mobile.**

[17-market-and-positioning.md](17-market-and-positioning.md#the-differentiator) names the moat:
*"Almost nobody applies Mario Wonder-grade squash-and-stretch, thick outlines, saturated colour and
confetti juice to an idle garden."* The same document's **avoid entirely** list names *"Merge-2
(growing but a Century Games / Moon Active capital war)."*

The garden is the store screenshot, the identity, the talking flower's home, and the surface two
people can out-craft a studio on. A merge board is what everyone already has.

> **You cannot out-spend Century Games. You can out-craft them.**
> **Merge rewards spend. Cosy rewards craft.**

Merge-2 at the top is a user-acquisition business — the same diagnosis doc 17 already applies to
hybrid-casual (*"it is a user-acquisition business with a game attached"*). Two people with no UA
budget entering that lane is the highest-CAC decision available. The cosy-botanical lane has
Wholesome Direct, r/incremental_games and r/CozyGamers, all free, all reachable, and all closed to
a merge game.

---

## What is proposed instead: four changes, no new genre

This is a **larger** role for merge than the current plan, not a smaller one. The current plan
buries the bench in a shed on a map behind two navigations. This puts it one gesture from the
garden and gives it the job the game does not currently have.

### 1. The order queue comes to the garden

Three customer faces on a strip above the plots — the Stand's existing simulation, rendered where
the planting decision is actually made. Faces already carry mood as expression, and every bloom
asked for is already drawn with the real `Flora.head()`. **This is the Gossip Harbor layout lesson
ported at the cost of a strip, not a system**, and it is the direct fix for the rubric question the
map MVP was built to test.

The Stand as a *place* survives — that is where you go to deliver, meet the customer and read the
long tail of the queue. What moves to the garden is the **ask**, not the whole screen.

### 2. The bench becomes the second screen, not the sixth place

One gesture from the garden, with the same order strip above it. The garden is where things are
**grown**; the bench is where things are **made**; both look at the same queue. The Potting Shed
was already specified as *"a building beside the garden, not a bought parcel"*
([25-world-map.md](25-world-map.md#the-places-and-what-each-one-does)) — this takes that seriously.

*The gesture is a downstream decision.* The vertical ladder is spoken for (map → garden → Hollow),
and "beside the garden" argues for a horizontal axis at garden altitude. Settle it with the spine.

### 3. The bench is the job that never automates — and that is the point

The garden automates by design and should keep doing so. The bench cannot and must not. **It is
what your hands do while the garden runs itself**, which is a coherent division of labour and the
actual answer to the question at the top of this document.

This also resolves the bench's oldest problem honestly. It has sat built-as-simulation with no
surface since 2026-08-16 because nobody could say what it was *for*. This is what it is for.

### 4. The generator is the garden, not an energy meter

**This is the change that makes it not-Gossip-Harbor, and it is the one that makes it cosy.**

A harvest drops a chain item into the basket — already built, already tested, already how
`benchBank()` works. There is no energy, no timer on the board, and no paywall on playing. The rate
limiter is **how much you have grown**, which is the idle half of the game doing real work instead
of accumulating a number.

And the limiter has two stages that already exist in
[04-economy.md](04-economy.md#the-potting-bench): `basketMax` (60) caps what banks up while you are
away, and board space caps what you can hold at once — *"board space is the only sink that scales
with how automated the garden already is."* That sentence was written before anyone knew what it
was for.

### The consequence nobody has noticed yet

A harvest's bench rung is `seedBucket[seed] + rarityBump[rarity]`. Which means **rarity and
mutations decide the quality of your merge board**, not just the size of a coin payout. Legendary
and Gilded stop being a bigger number and start being a better hand.

That is the strongest answer the project has ever had to *why does the garden still matter* — and
it required no new design, only noticing that two built systems already touch.

---

## The pacing chain

```
garden (timers, automatable)  →  harvest drops an item at a rung set by rarity
        ↓                                        ↓
   coins buy more garden            basket (cap 60)  →  bench board (space is the limit)
        ↑                                                        ↓
    orders pay coins + reputation  ←  the Stand  ←  merged goods
```

Every arrow already exists in code or in a shipped spec. Nothing on that diagram is a new system.

---

## What is scarce

The audit's finding was that **nothing in this game is scarce**, and that this is upstream of the
missing ceiling. Every seed returns 2.212× cost in expectation, there is no bad purchase, and
outside creature hunger nothing can go backwards.

The rule this proposes, which the cosy pillar permits and the current design does not use:

> **Scarcity in a cosy game is space and attention. Never permission, and never progress.**
> You may run out of room, and you may run out of hands. You may never run out of the right to
> play, and nothing you have earned may be taken away.

That rule is checkable, and it is why an upkeep clock passes and an energy meter does not: hunger
costs a creature's *work* and is visibly reversible; energy costs you the *game*.

Five scarcities follow, and four already exist:

| Scarcity | State | Why it is cosy |
| --- | --- | --- |
| **Board space on the bench** | Specced, unbuilt | Running out is legible and solvable — you merge your way out. Pressure with an obvious action |
| **Habitat slots** (4 tending) | Built | Forces a choice between characters you like. Keep it tight as the roster grows |
| **Plot adjacency** (2 neighbours) | Built, underused | A layout puzzle, not a shopping list. Verbs already depend on it |
| **The creature awake clock** | Built | The template. The sleeping face is what makes an upkeep survivable |
| **Time of day** — the Night Garden | Designed, unbuilt | Scarcity of *opportunity* rather than resource. The one hook the game lacks |

And the standing prohibitions, so they stay decided: **no energy, no lives, no expiry on anything
earned, no losing a creature, no un-buying a plot.**

---

## The three session shapes

The research asks for ~7-minute sessions, ~5.8 a day
([17-market-and-positioning.md](17-market-and-positioning.md#numbers-to-plan-against)). Three
documents describe a session and none of them specifies one. These are specified.

### The 40-second check — map altitude, four or five times a day

> Open → the welcome-back scene if you were away → glance at the order strip → collect what is
> ready → tap collect-all on any fully automated place → out.

**No decision is required and nothing can be got wrong.** This is the session the map exists for and
it is where the 2× rewarded video belongs.

### The 7-minute sit-down — garden and bench, once or twice a day

> Open → clear the basket onto the board → merge toward whichever order is up → plant against what
> the queue wants → feed anyone hungry → deliver → spend.

**This is where the game actually is.** Every beat is a decision, and the order strip is what
sequences them — it is the thread that turns six systems into one errand.

### The 30-second return — any time

> Something specific finished. You came for it. You collect it and you leave.

The one that notifications serve, and the reason
[12-meta-layer-design.md](12-meta-layer-design.md#session-shape)'s rule holds: **opening the app
must never present an empty screen.**

---

## What this settles, and what it does not

**Settled if the owner agrees:** the garden stays the home screen; merge is promoted to a
first-class screen rather than a room on the map; the generator is the garden and never an energy
meter; the order queue is rendered where production happens; and scarcity is space and attention.

**Explicitly not settled here:** which gesture reaches the bench, what the merge chains contain
(that is [26-goods-catalog.md](26-goods-catalog.md), and it survives either way), whether the
prototype `CRAFT_RECIPES` bench retires now or later, and how the bench interacts with creature
stations. All of those are item 1.

## Rejected

**The full Gossip Harbor pivot** — the garden demoted to a feature, the merge board as home. Three
reasons above, and the shortest is that it swaps a lane where craft wins for a lane where UA spend
wins.

**Energy, in any form**, including "just a soft one on the generator." It is the merge genre's
engine and it is the cosy pillar's opposite, and there is no version that is a little bit of both.

**Leaving the bench on the map as a sixth place.** It is the second screen or it is nothing; a
merge board reached by two navigations is a room nobody visits, which is what the last ten days
have already demonstrated.

**A second generator beside the garden** — a tappable spawner on the bench itself. It would work,
and it would immediately make the garden optional, which is the whole thing this document is
protecting.

**Adding a new mechanic to fill the after-automation hole.** The bench was already built and
already had no job. The cheapest fix to a missing loop was a system this project has been carrying
unused for ten days.
