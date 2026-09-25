# The Trunk and the Tree — a story on reputation, and a tree that replaces the petal menu

**Status: DIRECTION, 2026-09-24 — not the spec. Pressure-tested by two adversarial critics before
filing** (an economy-and-invariants pass and a design-and-grammar pass; between them they found
twenty-four defects in the draft, including two of the document's own arithmetic errors, a quest-ladder
deadlock, a missing reputation faucet and roughly a dozen unbilled sim-test checks — all folded in
below, with one finding rejected and the rejection recorded in §12). The picture, the rules, the option space with
each option priced, and the open questions. The spec is written after the owner has judged
`tools/tree-spike.html` by eye, per the wireframe gate in
[34-build-plan.md](34-build-plan.md#the-wireframe-gate--before-any-ui-phase-writes-ui-code). No
game code is written from this document. The rulings it builds on are the 2026-09-24 and
2026-09-22 entries in [10-decision-log.md](10-decision-log.md); where this document adds a number
it is marked **derived** (computed from the repo) or **JUDGMENT** (the desk's proposal, the
owner's to change).

**The sentence: *one number carries two riders — the village's story, and the height you can
see.***

## What this changes, in one paragraph

Reputation stops being a number that runs out at level 17 and becomes a forty-rung climb with two
independent consumers hanging off it. A **story beat** fires when a level lands. A **tree node** —
a flower, a perk, a creature, an access right, the offline ability — has its own reputation
threshold, and nodes sit several levels apart. The tree takes the Almanac's petal tab and
**replaces** the petal rows and the picker's unlock rows; nothing sits beside them. Saved Seeds
buy ranks on what the climb has revealed. Gold still buys the flower.

The two riders are never one-to-one. That is the owner's ruling, verbatim: *"Reputation is tied to
story, but it's also tied to unlocking new skills. They can't be one-to-one, so you're not going
to put a story beat on the same progression path in the prestige tree."* A chapter is never a card
on the path. **This supersedes the 2026-09-22 line "the story chapters sit on the trunk"** — that
was the desk's drawing, not the owner's word. The 09-22 condition survives untouched: every
chapter changes something visible in the village, never dialogue alone.

---

## 1. The picture

### The mechanism

Drawn at rung 32, rep 5,678 — the marker's number and its height agree, which is the whole point of
a rail. Read it bottom to top: the climb goes up.

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ ░░░ THE CURTAIN — cards are still HERE, their identity masked ░░░    │
   │ ░░░  silhouette · ??? · stats withheld · one directional hint ░░░    │
   └──────────────────────────────────────────────────────────────────────┘
        ░░░░░░░░░░░░░                                          ┊
        ░    ???    ░   rung 38 and above: present, masked.     ┊  38, 39, 40
        ░  ▲ ▲ ▲    ░   A missing row is nothing; a masked      ┊
        ░░░░░░░░░░░░░   one is a goal. (doc 47, unchanged)      ┊
                                                                ┊
                              ┌─────────────────┐               ┊
                              │  🔒  FLOWER 19  │               ┊  rung 37
                              │  Eternal Crown  │               ┊
                              │  ⬤ rep 12,574   │               ┊
                              └─────────────────┘               ┊
        ┌─────────────────┐                                     ┊
        │  🔒  SLOT       │                                     ┊  rung 36
        │  fifth spot     │                                     ┊
        └─────────────────┘                                     ┊
                              ╔═════════════════╗               ┊
                              ║ 🎀   UP NEXT    ║               ┊  rung 35
                              ║   FLOWER 18     ║               ┊
                              ║ Mythic Starflower║              ┊   exactly ONE ribbon,
                              ║  gold 65.7M     ║               ┊   and it always shows
                              ╚═════════════════╝               ┊   its price
                                                                ┊
                                                            ────┤  rung 34  ◄── story mark:
                                                                ┊   Chapter VII, and the rung
                                                                ┊   is its own — no card here
                                                                ┊
                                                                ┊  rung 33  ◄── bare: one free
                                                                ┊   rank on something you own
                                                            ╭───┴────╮
        ┏━━━━━━━━━━━━━━━━━┓                                 │ 5,678  │ ◄ the marker pill
        ┃ ★  PERK         ┃                                 │  YOU   │   carries the player's
        ┃  Late Light     ┃──┬── rank 1  ●                  ╰───┬────╯   own number
        ┃  gold frame,    ┃  ├── rank 2  ○                      ┊  rung 32
        ┃  art in colour  ┃  └── rank 3  ○   ← Saved Seeds      ┊
        ┗━━━━━━━━━━━━━━━━━┛                     buy these       ┊
                                                                ┊
                        ...thirty-one rungs below...            ┊
                                                                ┊
        ┏━━━━━━━━━━━━━━━━━┓                                     ┊  rung 2
        ┃ ★  FLOWER 3     ┃──┬── Rich Bloom   ●●●○○             ┊
        ┃   Bluebell      ┃  ├── Quick Sprout ●●○○○             ┊
        ┃   gold 150K     ┃  └── meets Pip, and Pip's own       ┊
        ┗━━━━━━━━━━━━━━━━━┛      small branch                   ┊
                                                                ┊  rung 1  ◄── Chapter I fires
                                                             ═══╧═══  rep 0, the foot of the rail
```

Three card states, one ribbon: **locked** (art dimmed, padlock, the threshold on a badge),
**exactly one UP NEXT** (a ribbon, and it always shows its price — the advert-row rule), and
**unlocked** (gold frame, art in full colour). The path is a single linear zigzag; nobody can
climb into a corner. Depth hangs sideways, never forward.

### The whole climb, rung by rung

Reputation to reach each rung is **derived** from `cumulativeRep()` in game.js for rungs 1–19 and
from the re-authored curve in §3 for 18–40. Gold prices are **derived** from
`seedUnlockPrice()` — `unlockBase 150,000 × unlockRatio 1.5^(i − freeSeeds)` — and are
**unchanged**, per ruling 8. Flower *order* is unchanged; only its rung moved.

| Rung | Rep | Chapter beat | Card on this rung | Sideways branch |
| --- | --- | --- | --- | --- |
| **1** | 0 | **I · The Quiet Garden** | *(none — the beat has the rung to itself)* |  |
| **2** | 10 |  | **FLOWER 3** — Bluebell · gold 150,000 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Pip (Grove Spirit)** + its buffs |
| **3** | 25 |  | **FLOWER 4** — Lavender · gold 225,000 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Bumble (Gardenbee)** + its buffs |
| **4** | 45 |  | **FLOWER 5** — Rose · gold 337,500 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Bramble (Hedgefox)** + its buffs |
| **5** | 70 |  | **FLOWER 6** — Peony · gold 506,250 | Rich Bloom ×5 · Quick Sprout ×5 |
| **6** | 100 | **II · Word Gets Around** | *(none — the beat has the rung to itself)* |  |
| **7** | 135 |  | **FLOWER 7** — Marigold · gold 759,375 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Thistle (Hedgepig)** + its buffs |
| **8** | 175 |  | **FLOWER 8** — Orchid · gold 1,139,063 | Rich Bloom ×5 · Quick Sprout ×5 |
| **9** | 220 |  | **SLOT** — third lawn spot | ranks |
| **10** | 270 |  | **FLOWER 9** — Sun Lotus · gold 1,708,594 | Rich Bloom ×5 · Quick Sprout ×5 |
| **11** | 325 |  | **FLOWER 10** — Jade Fern · gold 2,562,891 | Rich Bloom ×5 · Quick Sprout ×5 |
| **12** | 385 | **III · The Stand Fills** | *(none — the beat has the rung to itself)* |  |
| **13** | 450 |  | **OFFLINE** — the flower tends the garden. *The drone's upgrade branch hangs sideways off this card, so no rung is payer-only* | ranks |
| **14** | 520 |  | **FLOWER 11** — Moonflower · gold 3,844,336 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Luna (Moonmoth)** + its buffs |
| **15** | 595 |  | **PERK** — Steady Hands (harvests) | ranks |
| **16** | 675 |  | **FLOWER 12** — Starlit Iris · gold 5,766,504 | Rich Bloom ×5 · Quick Sprout ×5 · **meets Ember (Lampfly)** + its buffs |
| **17** | 760 |  | *(bare)* | **one free rank** — ruling 5 fires here |
| **18** | 850 | **IV · Night Visitors** | *(none — the beat has the rung to itself)* |  |
| **19** | 945 |  | **ACCESS** — Sprinklers, permanent | ranks |
| **20** | 1,055 |  | **FLOWER 13** — Aurora Bloom · gold 8,649,756 | Rich Bloom ×5 · Quick Sprout ×5 |
| **21** | 1,183 |  | **PERK** — Long Morning (sky) | ranks |
| **22** | 1,331 |  | **FLOWER 14** — Celestial Lotus · gold 12,974,634 | Rich Bloom ×5 · Quick Sprout ×5 |
| **23** | 1,503 |  | **ACCESS** — Land Deed, permanent | ranks |
| **24** | 1,703 | **V · The Long Clocks** | *(none — the beat has the rung to itself)* |  |
| **25** | 1,934 |  | **SLOT** — fourth lawn spot | ranks |
| **26** | 2,203 |  | **FLOWER 15** — Nebula Orchid · gold 19,461,951 | Rich Bloom ×5 · Quick Sprout ×5 |
| **27** | 2,514 |  | **HABITAT** — fifth tending slot (§6a) | ranks |
| **28** | 2,876 |  | **FLOWER 16** — Solstice Lily · gold 29,192,926 | Rich Bloom ×5 · Quick Sprout ×5 |
| **29** | 3,295 | **VI · What the Village Owes** | *(none — the beat has the rung to itself)* |  |
| **30** | 3,781 |  | *(bare)* | **one free rank** — ruling 5 fires here |
| **31** | 4,345 |  | **FLOWER 17** — Aurora Crown · gold 43,789,389 | Rich Bloom ×5 · Quick Sprout ×5 |
| **32** | 4,999 |  | **PERK** — Late Light (catches) | ranks |
| **33** | 5,758 |  | *(bare)* | **one free rank** — ruling 5 fires here |
| **34** | 6,638 | **VII · The Turning** | *(none — the beat has the rung to itself)* |  |
| **35** | 7,659 |  | **FLOWER 18** — Mythic Starflower · gold 65,684,084 | Rich Bloom ×5 · Quick Sprout ×5 |
| **36** | 8,843 |  | **SLOT** — fifth lawn spot | ranks |
| **37** | 10,217 |  | **FLOWER 19** — Eternal Crown · gold 98,526,125 | Rich Bloom ×5 · Quick Sprout ×5 |
| **38** | 11,811 |  | **PERK** — Deep Winter (seasons) | ranks |
| **39** | 13,660 | **VIII · What Grows On** | *(none — the beat has the rung to itself)* |  |
| **40** | 15,804 |  | **PERK** — Full Basket (orders) — the cap card | ranks |

**Three rungs sit above the last flower** (38–40), carrying a perk, the closing chapter and the cap
card. That is how the spine finally grows the vertebrae
[27-design-audit.md](27-design-audit.md#1-the-game-has-a-spine-it-is-reputation-and-it-stops-at-level-17)
says it lacks past 17.

**How the layout answers the decoupling ruling.** Every one of the eight chapter rungs carries **no
card at all** — the beat has the rung to itself. That is deliberate and it is structural, not
cosmetic: doc 47's moments dialog is one-at-a-time with `gap: 20s` and `sessionCap: 3`, and
*"crossings past the session cap persist latched-unseen and surface at the next session's quiet
beat."* A chapter sharing a rung with a two-second unveiling would queue behind it and, on a busy
rung, slip to the next session. The story beat is the thing that would lose that queue every time.
So beats never share.

**Creatures hang sideways off the flower that attracts them, not on their own rungs.** Pip's branch
is on Bluebell's card, because "plant five bluebells" *is* Bluebell. This makes the invariant — a
creature is never in reach before its flower is — true by construction rather than by a check, and
it keeps the path from crowding.

**Three rungs are deliberately bare** (17, 30, 33), which is where ruling 5's free rank actually
fires. Without them the rule would be a guarantee that never triggers.

> **The residual tension, and it is between two of the owner's own statements rather than something
> the desk invented.** Ruling 4 says node spacing stretches to *"one node per three or four levels
> deep in the game."* The owner's verbatim words say *"you might need multiple reputation levels to
> unlock a flower, a creature, or a perk."* Both point at a sparse late game. But nineteen flowers
> need nineteen rungs on their own, and the tree **replaces** the picker's unlock rows, so they
> cannot go anywhere else. At forty rungs the late game lands at roughly one node per one-to-three,
> not one per three-to-four. **Something has to give and it is the owner's call:** a longer trunk
> than forty rungs, fewer flowers carrying their own rung, or accepting a denser late game than
> ruling 4 describes. Priced as §12 question 9 — this is the single structural constraint the desk
> could not resolve inside the rulings as written.

### The first hour

What a brand-new player actually sees, standing at rung 1 with 0 reputation:

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ ░░░ THE CURTAIN ░░░   everything from rung 6 up: present, masked     │
   └──────────────────────────────────────────────────────────────────────┘
        ░░░░░░░░░░░░░
        ░    ???    ░   rung 6+ — silhouettes with one hint each:
        ░  ▲ ▲ ▲    ░   "Keep growing — the garden isn't done with you"
        ░░░░░░░░░░░░░
                              ┌─────────────────┐
                              │  🔒  FLOWER 6   │            rung 5
                              │   Peony         │
                              └─────────────────┘
        ┌─────────────────┐
        │  🔒  FLOWER 5   │                                  rung 4
        │   Rose          │
        └─────────────────┘
                              ┌─────────────────┐
                              │  🔒  FLOWER 4   │            rung 3
                              │   Lavender      │
                              └─────────────────┘
        ╔═════════════════╗
        ║ 🎀   UP NEXT    ║                                  rung 2
        ║   FLOWER 3      ║   the ribbon, and 150,000 gold on its face.
        ║   Bluebell      ║   This is the "six times everything I have
        ║   gold 150K     ║   ever earned" gasp, and it is arm 2's job.
        ╚═════════════════╝
                                                        ╭────────╮
                                                        │   0    │ ◄ marker at the foot
                                                        │  YOU   │
                                                        ╰───┬────╯
                                                            ┊  rung 1 — Chapter I has
                                                         ═══╧═══   already fired, full
                                                                   screen, over the garden
```

Four named cards, three silhouettes, one ribbon. Chapter I fired as a moment before the tree was
ever opened. **The UP NEXT ribbon on rung 2 is doing the job `seedRevealedNow()`'s arm 2 does
today** — see §2, because that is the part of the repeal that would otherwise be a real loss.

---

## 2. The two wallets, exactly

### What the code does today — stated first, because the earlier drafts of this direction got it wrong

**Gold reveals a flower, and gold buys it. One wallet does both jobs.**

- **Gold buys.** `unlockSeed(id)` (grep `emit('seedUnlock'`) checks `state.credits < price` and
  nothing else. There is no level check anywhere in the unlock path.
- **Gold reveals.** `seedRevealedNow(id)` (grep `The latch never clears`) has **four** arms, and
  its own comment calls them that. Arm 1: already unlocked. Arm 2: it is the lowest-priced locked
  seed — *the next wall, always shown*. Arm 3: `state.lifetimeCoins >= price × 0.85`
  (`DATA.year.revealAt`), throttled by `revealCapPerTurn: 2`. Arm 4: `state.credits >= price`, the
  affordability law, commented *"never capped"*. It latches into `state.seedRevealed` and never
  clears.
- **Reputation reveals nothing today.** `unlockLevel` still carries 1…17 for all nineteen seeds in
  data.js, but game.js reads it in exactly two places and neither is a live gate: the
  pre-Garden-Year grandfather inside `migrateYear()` (grep `nobody loses a seed they could already
  plant`), and `seedUnlockLevel()`, whose own comment reads *"levels stop gating seeds"*. That
  wrapper feeds `migrateProgression()` and the picker's interim label — two migrations and a label,
  no gate.

**So the two-wallet rule in this document is NEW.** It is not a formalisation of something half
built. Moving reveal from gold to reputation is the single biggest behavioural change in this
feature and the riskiest part of its migration. Ruling 17 takes the reveal job off gold and gives
it to reputation, and §8 carries the bill.

### The rule, after the tree

| | Reputation (the trunk) | Saved Seeds | Gold |
| --- | --- | --- | --- |
| **What it does** | **Reveals a card. Visibility only** | Buys **ranks** on a revealed card | Buys the flower's one-time unlock, and the shop's yearly rebuy |
| **How you get it** | The core loop only (§3) | Minted at the Turn, and only there | Earned all year, zeroed at the Turn after minting |
| **Never** | Bought, with anything — gems, money or an ad | Arrives outside the Turn | Buys a rank, or reveals a card |

> **Reputation reveals; it does not gate the purchase, and the wording matters.** An earlier draft of
> this table said reputation grants "visibility **and eligibility**." That would put a level gate back
> on buying a seed, which doc 33 explicitly retired: *"**Levels stop gating seeds.** `unlockLevel` on
> seeds retires; the two-stage gate becomes unlock price once, afford the plant price always."* It
> would also delete doc 33's finding that *"skipping unlocks is strictly dominated… so the sequence
> needs no enforcement"* — the reason `unlockSeed()` needs no ordering check at all. **So: once a card
> is revealed, gold buys it on today's curve, in any order, exactly as now.** Reputation decides what
> you can see, and nothing else.

**Saved Seeds still arrive only at the Turn, and ruling 5 is why that survives.** A bare level pays
one free *rank* — power placed directly on a node the player already owns — not currency. It opens
no faucet, so the well's "same total either way" promise (doc 32's glossary row for **the well**)
is untouched, and it reuses the blessing's own grammar. The blessing itself becomes **one free rank
on the blessed flower's Rich Bloom ladder** — the same petal it grants today, drawn as a rank on
the flower's sideways branch instead of a pip on an Almanac row.

**The Turn touches nothing on the tree.** It touches the shop beside it: the year's gold upgrades
are wiped and rebought, which is the ritual. A tree ACCESS node grants the permanent *right* to buy
Power Punch every year; it never buys the upgrade.

### What ruling 17 costs, and who pays

The repeal takes **three** of the four arms for flowers on the tree — arm 2 (always show the next
wall), arm 3 (the 85% savings arm) and arm 4 (affordability) — leaving arm 1 plus a new reputation
arm. **The player who loses is not the one the earlier drafts named.** Doc 47 is explicit that in
honest play credits exceed lifetime earnings by at most ~6K, so **arm 4 is a safety net for
cheated and hand-edited saves, not a live path.** The honest player's reveal today comes from arm 3
and arm 2. So:

- **Arm 3's loss is the real regression.** A player who has saved 85% of a flower's price sees it
  today and will not see it after the tree unless the rail has reached its rung. What they get
  instead: a rung with a number on it, reached by playing the core loop, and a two-second unveiling
  that is their genuine first sight of the flower. That is the trade, and it is the owner's stated
  reason — *an affordability peek spends the ceremony before it happens.*
- **Arm 2's loss is not a loss, because the tree re-homes it.** Doc 47's pressure test proved arm 3
  alone leaves a recurring window with no advert on screen, and arm 2 exists to close it by
  construction. The visual target already contains the replacement: **exactly one UP NEXT card,
  wearing a ribbon, always showing its price.** Say this explicitly in the spec so nobody deletes
  arm 2 without building the ribbon — the ribbon *is* arm 2, drawn on the rail.
- **Arm 4 stays available to the cheat paths** or the dev tools lose their reveal driver. §8 prices
  whether it survives as a dev-only arm or the tools move to driving reputation.

`upgradeRevealedNow()` is untouched throughout — per its own comment it carries "no affordability
law and no cap", and doc 47's law survives unchanged for everything that is not a tree card.

---

## 3. Reputation's faucets — RULED, do not reopen

Everything that pays today stays. Orders come back as the main faucet. The core loop only — no
records, creatures, honey, album sets or daily streak, per the owner's cut: *"the meta should stay
completely separate because it has nothing to do with passive gameplay."* **Reputation is never
bought, with anything.** Stated once, here.

| Faucet | Today | After the tree |
| --- | --- | --- |
| Quests | 789 rep, the year-one ladder, sim-test pinned | Unchanged. Still the tutorial |
| Almanac species milestones | 140 rep across 5/10/15/19 species | Unchanged |
| **The daily quest** | **12 rep every day, forever** — all three `DATA.dailies` entries pay `rep: 12`, rerolled per `todayKey()` | **Unchanged, and it is not the daily *streak* the owner cut.** The streak was a calendar reward; this is one core-loop task a day. It is the only faucet that never runs dry today, and the first draft of this document omitted it entirely |
| Every 10th harvest | **already built** — `harvestRepEvery: 10`, `harvestRepGrant: 1`, counted in `state.harvestsTowardRep`, which never resets | Unchanged mechanically. **Ruling 11 is mostly a UI change: show the counter.** A sky catch pays no reputation; it keeps the sky's own reward |
| Orders | authored onto every order, **payment switched off** at `STAND.repPaused` | **The main faucet.** `repPaused` comes off; `standOrderRep()` returns `repPay × lineItems` at `repPay` 4 / 7 / 11 / 16 by tier |
| The Turn's Tally | nothing | **Pays, per ruling 12.** A flat grant at the Turn — the core loop's last beat |
| Welcome-back board | nothing | Boosted reputation on easy orders for one sitting, at three days away |

### The curve has to be re-authored above rung 19, and this is the document's largest finding

**Measured, derived.** With orders switched on at the shipped `repPay` values and today's curve
(`repToNext = 10 + 5 × (level − 1)`, so rung 40 costs 4,095 lifetime rep), every persona climbs the
whole forty rungs long before the flowers are affordable:

| Persona | Reaches rung 17 | Reaches rung 40 |
| --- | --- | --- |
| casual | day 6 | **day 19** |
| regular | day 3 | **day 8** |
| heavy | day 2 | **day 4** |

Doc 33's simulation lands all nineteen flowers at **~day 46** on gold. So on today's curve the rail
outruns gold by two to five times: nineteen unveilings inside three weeks, then a month with nothing
left to reveal. **Reputation is quadratic-cheap while the flower ladder is geometric-expensive, and
ruling 17 is what makes that collide** — it did not matter while reputation revealed nothing.

**The proposal: keep the curve identical through rung 19 and take 20–40 geometric** —
`repToNext(L) = 95 × 1.16^(L−18)` — putting rung 40 at **15,804** lifetime rep. The ratio 1.16 is
**derived by solving for the casual persona reaching the last flower's rung on day 47**, against doc
33's ~day 46 on gold, because casual is the persona doc 33's own sim models.

| Rung | Today | Proposed | | Rung | Today | Proposed |
| --- | --- | --- | --- | --- | --- | --- |
| 19 | 945 | **945** (identical) | | 30 | 2,320 | 3,781 |
| 20 | 1,045 | 1,055 | | 35 | 3,145 | 7,659 |
| 24 | 1,495 | 1,703 | | 37 | 3,510 | 10,217 |
| 28 | 2,020 | 2,660 | | 40 | 4,095 | 15,804 |

**Rungs 1–19 are byte-identical, not 1–17.** Today's step into rung 18 is `10 + 5 × 17 = 95`, and the
proposed step into rung 18 is `95 × 1.16⁰ = 95`, so `cumulativeRep(18)` and `(19)` are unchanged at
850 and 945. Divergence starts at rung 20.

> ### THE ENGINEERING BILL, and it is why this is a proposal and not a decision
>
> The first draft of this document presented the re-authoring as a clean change with no migration
> cost. **That was wrong in five ways, each verified against the working tree.** The spec owns all
> five; the owner should know the shape before approving the direction.
>
> 1. **`cumulativeRep()` is an independent closed form and must be re-authored too.** It is
>    `10n + 5n(n−1)/2` (grep `return 10 * n + 5 * n * (n - 1) / 2`) and it does **not** read
>    `repToNext`. Change one and they silently disagree above rung 19, which breaks three live
>    readers: `repIntoLevel()` drives the progress bar in both `ui.js` and `ui-sheet.js`;
>    `migrateProgression()` *writes* `state.rep = cumulativeRep(best)`; and `Dev.grantLevels(n)`
>    computes `cumulativeRep(state.level + n) − state.rep`, which would go **negative** and silently
>    do nothing — killing a cheat button the playtest depends on.
> 2. **A named sim-test breaks by construction:** `check('level 20 lands on 1045', …)`. The proposal
>    puts rung 20 at 1,055. It is a deliberate change to an asserted number and must be re-authored
>    in the same commit, not discovered red.
> 3. **The latch cannot live on `state.level`.** That field is a derived cache, rebuilt from
>    `levelFromRep(state.rep)` by `ensureProgression()` on every boot and overwritten again by
>    `addRep()`. A "reached level never decreases" latch needs its **own** top-level SURVIVES key,
>    on the `seedRevealed` pattern.
> 4. **Worse, a naive latch re-pays level grants.** `addRep()` walks
>    `for (let L = before + 1; L <= after; L += 1) grants.push(grantLevel(L))` with `before` from
>    `levelFromRep`, not from any latch — so a save latched at rung 21 whose rep re-derives to 19
>    re-fires `grantLevel(20)` and `grantLevel(21)`. `grantLevel()` calls `credit(coins)` **with no
>    opts**, which writes `lifetimeCoins` and `year.coinsEarned` — **it feeds the mint**, breaking
>    §9's own "the well's inputs unchanged" invariant — and re-grants `DATA.levelGrants[20]`'s five
>    gems. The latch must gate the grant walk, not just the displayed level.
> 5. **Live saves sit higher than the first draft claimed, and the daily quest is why.** "No honest
>    save can be far above 17" is **false**: quests (789) plus Almanac milestones (140) already reach
>    **929 rep — rung 18 — with zero harvests**, and the daily quest adds 12 a day forever on top of
>    uncapped harvest rep. A sixty-to-ninety-day tester plausibly sits at 2,000–3,000 rep: **rung
>    27–34 today, rung 24–27 under the proposal — a three-to-seven rung loss, landing on exactly the
>    friend-testers.** Keeping 1–19 identical does not save them; only the latch does, which is why
>    item 3 is load-bearing rather than tidy.

### The climb, as the owner will feel it

**Derived** at ratio 1.16. The persona shapes are **JUDGMENT**, and the per-day arithmetic is printed
so the owner or a critic can reproduce the table rather than trust it:

| Persona | Orders/day | Harvests/day | Daily quest | Rep/day once quests run dry |
| --- | --- | --- | --- | --- |
| casual | 4 | 40 | most days | `4 × order_rep + 4 + ~8` → **~200** at tier 4 |
| regular | 10 | 120 | every day | `10 × order_rep + 12 + 12` → **~504** at tier 4 |
| heavy | 22 | 320 | every day | `22 × order_rep + 32 + 12` → **~1,100** at tier 4 |

`order_rep` is `repPay × lineItems` — **4 / 7 / 11 / 16** by tier at 1.5 / 2 / 2.5 / 3 average line
items, so a tier-4 order pays **48** and that is the hard per-order ceiling anywhere in the game.
Quests (789) and Almanac milestones (140) are front-loaded and then spent; the daily quest and
harvest rep never run dry.

| Persona | Day 3 | Day 7 | Day 30 | Day 45 | Last flower (rung 37) |
| --- | --- | --- | --- | --- | --- |
| casual | rung 11 | rung 21 | rung 34 | rung 36 | **day 47** |
| regular | rung 21 | rung 29 | rung 39 | rung 40 | day 20 |
| heavy | rung 28 | rung 35 | rung 40 | rung 40 | day 10 |

With a Turn inside the window and without it, the difference is **under one rung at every
checkpoint** at the proposed flat 25-rep Tally grant (**JUDGMENT** — the knob ruling 12 opens). Worth
the owner's eye: paying reputation at the Turn is currently *ceremonial* rather than load-bearing. If
turning the year should visibly advance the story, the grant has to be several hundred — and then it
becomes a faucet that rewards Turn count, the family `DATA.year.veterancy` was **deleted** for. §12
carries it.

> **The honest residual: a reveal schedule can only be calibrated to one persona.** 1.16 matches the
> casual player's climb to doc 33's gold pace almost exactly — last flower revealed day 47, affordable
> ~day 46. But the regular player reaches that rung on **day 20** and the heavy on **day 10**, so for
> them the rail still runs ahead of the wallet and the unveiling is a promise rather than a purchase.
> That may be fine — or even correct, since a revealed-but-unaffordable flower is the advert the
> curtain exists to show. **What nobody knows is whether their gold also arrives proportionally
> sooner**, because `tools/year-sim.js` has never been run per persona against the unlock ladder.
> That measurement is the cheapest thing that would de-risk this whole feature, and it is not in this
> document because the tool does not report it yet. Named as §12 question 10.

### The welcome-back board, at three days away

The existing scene already reports the absence window — `reconcile()` in game.js, grep `the window
is the absence` — and that is where it lands. **Earned, never granted**, per the 09-24 ruling: a
lapsed player is met by a board of easy orders paying boosted reputation for that sitting.

- **Trigger:** absence ≥ 3 days (**JUDGMENT**; `WELCOME_MIN_AWAY` is 120 seconds today and governs
  the scene, not this board).
- **The boost:** ×2 reputation on tier-1 and tier-2 orders only, for one sitting.
- **The cap:** the sitting's boosted reputation cannot exceed **one rung's worth at the player's
  current height** — so it accelerates the climb by at most one level, never skips a chapter. This
  is the number that keeps leaving from being the best way to climb.

---

## 4. The perk catalogue, at direction size

Every perk is a **placed object** — an owned perk sits on a lawn spot, so the build is visible on
the garden itself. The store's decorations convert to these. Full catalogue is spec work; what
follows is the desk's list with a perk added only where a category would otherwise be empty. Rank
ladders are in words, per doc 31 surgery 4: **chance axes are countdowns, never percentages.**

> **A gap this document has to admit rather than paper over.** The 2026-09-22 log entry closes with
> *"The perk brainstorm from the session is in the direction document, not here,"* and the entry
> below it repeats it — but that brainstorm of roughly thirty perks was never written to disk
> anywhere in this repo, and the session that held it is gone. What follows is therefore **authored
> fresh to cover every category the owner named** (taps, harvests, sky and catches, seasons,
> creatures and meadow, orders and story, the Turn; the drone's branch is §7) rather than recovered.
> Eleven cards, not thirty. If the owner still has that list, it supersedes this table on sight and
> the spec should use it — and the log's two promises should be corrected to say the list was lost,
> so the next reader does not go looking for it.

| Perk | Effect, one sentence | Touches | Rank ladder | Guardrail |
| --- | --- | --- | --- | --- |
| **Deep Roots** | Each tap pays a little more. | taps | +1 → +2 → +3 base tap | Never edits `seed.yield`; composes as a multiplier like `petalMult` |
| **Steady Hands** | Every Nth harvest comes back instantly. | harvests | every 20th → 15th → 12th | A countdown, visible; never a percentage |
| **Long Morning** | A sunbreak lingers after rain. | sky | +20s → +40s → +60s | Pure feel, zero economy — must not touch catch odds |
| **Late Light** | A catch is likelier on the last plot harvested. | catches | every 14th → 11th → 9th exposed harvest | Honours the tested 20–30% catch income band; data-capped |
| **Quiet Hours** | Winter's tuck-in covers one more plot. | seasons | +1 → +2 plots | Winter only; never touches the snowfall's payout |
| **Deep Winter** | A kept night ripens a little further. | seasons | +5% → +10% grow progress | Clamped at the 0.3 growth floor in `plantGrowth()` |
| **Warm Hollow** | A tended creature stays awake longer on one meal. | creatures | +2h → +4h → +6h | The Hollow keeps the number; the tree only raises it |
| **Full Basket** | An order's coins pay a little more. | orders | +5% → +10% → +15% | Must never touch `standOrderRep()` — gold only |
| **Long Table** | One more order slot on the board. | orders | +1 slot (one rank only) | `STAND.slots` is 3 today; the fourth is the cap |
| **Turning Year** | ⚠ The Tally's cap rises. | **the Turn** | ×2.0 → ×2.1 → ×2.2 | **FLAGGED — see below** |
| **The Long Year** | ⚠ The mint's pool grows. | **the Turn** | `mintK` +2% per rank | **FLAGGED — see below** |

> **⚠ The two flagged perks touch the Turn's currencies, and they are the ones the store must
> never sell.** Promise 1 in [37-monetization.md](37-monetization.md#the-two-promises--what-we-never-sell-ever)
> is absolute: Saved Seeds, petals, seed unlocks, season gates and the blessing cannot be bought
> with money or ads, directly or through a back door. A perk that raises `tallyCap` or `mintK` is a
> Saved Seeds faucet wearing a perk's name.
>
> **But the money rule is not the binding one here, and the first draft pointed this guardrail at the
> wrong risk.** Neither perk is priced in money — both are bought with **Saved Seeds**, and
> `The Long Year` raises `mintK`, the constant the Seeds pool is minted from
> (`totalMintable = DATA.year.mintK × sqrt(lifetimeCoins)`, doc 33). That is **Seeds buying more
> Seeds: a compounding loop in the one currency that never resets.** An assertion reading "never
> purchasable with money" would pass green while exactly that shipped. The invariant must be written
> against the recursion, not the wallet: **no node may raise `mintK` or `tallyCap`.**
>
> They are the most powerful cards in the catalogue and
> they belong at the top of the climb — which is where rungs 32 and 40 put them — but the spec must
> carry an assertion that neither is ever purchasable and neither ever enters a paid surface.
> **The desk's recommendation: cut both from v1.** `mintK` is already named in doc 33 as phase 4's
> knob for a mismatch it has not resolved; handing the player ranks on it before the owner has
> tuned it makes every number in doc 33 a lie. Priced as an open question in §12.

### The slot rule

**Two spots at the start, five at the top**, and the spots are themselves nodes (rungs 9, 20, 34),
so the lawn visibly grows into a build. A perk moves freely between spots — the record shelf's
equip grammar, where owning and wearing are different things. The catalogue can be generous because
early power is capped at two worn perks.

```
   THE LAWN AT TWO SPOTS                 THE LAWN AT FIVE
   ┌───────────────────────┐            ┌───────────────────────┐
   │   🌼   🌷   ⬜   ⬜    │            │   🌼   🌷   🪻   💜    │
   │                       │            │                       │
   │  [Deep Roots]  [ + ]  │            │  [Deep Roots] [Basket]│
   │                       │            │  [Long Table] [Warm]  │
   │        🌻 flower       │            │  [Quiet Hours]        │
   └───────────────────────┘            │        🌻 flower       │
     two spots, one filled              └───────────────────────┘
```

**The invariant: a spot cannot stack the same perk.** Five spots holding five Deep Roots is a
multiplier stack wearing one name — the failure the creature-pair rules exist to prevent.

---

## 5. Offline income, re-based on the flower

Today `passiveIncomeRate()` returns **zero without the bought drone**, and doc 31 surgery 5 named
that as the break reaching "exactly the players who churn fastest." The owner struck the drone from
offline income: *"Let's just strip the drone away from that idea."* The flower earns while you are
away.

**What the four named upgrades do today** (so the re-basing is honest about what it inherits):

| Upgrade | Today |
| --- | --- |
| **Power Punch** (`tapPower`) | +1 base tap payout per level, uncapped |
| **Quick Grip** (`holdSpeed`) | Shaves 60ms off the hold interval per level, from 900ms to a 180ms floor — twelve levels to max |
| **Lucky Charm** (`critChance`) | +1% tap crit chance per level, clamped at 99% |
| **Combo Coil** (`comboMeter`) | +10 combo cap per level; the combo pays +1% per point |

### The rate

The away framework in [03-systems.md](03-systems.md#offline-earnings) stays — two axes, both capped
and stated. What changes is what the rate is **made of**:

```
passiveIncomeRate()  =  tap income per second  ×  DATA.offline.flowerShare
   ... then, unchanged:  × offlineRate()   (25% base, +5%/level, cap 100%)
                         for offlineHours() (4h base, +1h/level, cap 24h)
                         then trickle at 10% past the cap, never zero
```

**Deriving `flowerShare`.** Doc 03 measures today's drone garden at ~644K over 12h away, which
back-solves to a passive rate of **~149 coins/sec** (derived: `644,000 = rate × 0.25 × (14,400 +
28,800 × 0.1)`; doc 03's 24h figure of ~805K back-solves to the same 149.1, which is what makes the
anchor trustworthy rather than a single reading). A mid-game tap rate — tap power 20, 15% crit at ×20, average combo ×1.4, 300
taps/min — is **~539 coins/sec** (derived from `tapStats()`'s own terms; the persona is
**JUDGMENT**). Matching today's income needs `flowerShare ≈ 0.28`, so:

> **`DATA.offline.flowerShare = 0.25`** — JUDGMENT, rounded from the derived 0.28. A quarter of
> what your own hands earn, before the two away axes apply.

**Against today's drone, for that mid-game save:** base offline pays ~34 coins/sec where the drone
paid ~37; at maxed away axes, ~135 against the drone's ~149. **Comparable, slightly below, and free
to everyone — from rung 13 onward.** The node's own ranks raise `flowerShare` above 0.25, which is
where the ceiling ends up higher than the drone ever reached — that is the trade, and the paid drone
becomes what its name says.

> **That qualifier is load-bearing and the first draft omitted it.** The node sits at rung 13, which
> §3's table puts at roughly day four for a casual player, so **the first three or four nights are
> still zero** — and doc 31 surgery 5 asked for a *global floor* that the trees then upgrade,
> precisely because zero overnight *"reaches exactly the players who churn fastest."* A floor that is
> itself a tree unlock is not a floor for the week that matters most. **The desk recommends a small
> always-on away trickle from rung 1**, with the rung-13 node raising it. That is surgery 5 as
> written, and it costs one more knob in `DATA.offline`.

**Moonlight Tending and Lantern Oil become the offline node's own two rank ladders** — both sideways
off rung 13, rate on one axis and hours on the other, exactly as `DATA.offline` already separates
them. The welcome-back
scene keeps reporting the cap and which level extends it — hidden caps read as theft, stated caps
read as rules. It now says the *flower* tended the garden, not the drone.

**The ceiling — and this is the part that needs a new knob.** `offlineRate()` caps at 100% and
`offlineHours()` at 24h, so away income is capped in *time* and in *share*. It is **not** capped in
coins, and today it is: `passiveIncomeRate()` ends in `Math.min(cycles, droneCapacity) * avgNet`
(grep `1 / Math.max(0.7, 3 - owned * 0.5)`), and that drone cadence is the only structural throttle on
the rate. Re-basing on tap income deletes it, and tap income rides ladders with no cap at all —
`tapPower` is "+1 per level, uncapped", `critMult` climbs to ×50, `comboMeter` adds +10 a level. **So
the spec must add an explicit ceiling** — either a `maxShare` on `flowerShare` or an absolute
coins-per-second cap — or offline income inherits an unbounded curve. Doc 03's two other stated rules
also change and the document should say so rather than claim the framework "stays": *"an unautomated
garden earns nothing while away"* stops being true (which is the point), and *"the drone's cadence
caps the total"* stops existing (which is the cost).

**And `flowerShare` carries a hidden second knob.** The 0.28 derivation assumes **300 taps/min**. That
figure is a persona, not a constant — it appears nowhere in `data.js` — so the spec needs a stated
taps-per-minute anchor beside `flowerShare`, or the one visible knob silently depends on an invisible
one. Both are in §9's knob list. Away gold keeps its current relationship to the well: it is real play's income
and it counts.

---

## 6. Creatures on the tree

The Hollow keeps the relationship — attraction by planting, feeding, keepsakes, pairs, stars. The
tree holds **the reveal** and **the permanent buffs**. One place per number: **a creature's stars
stay in the Hollow**, and the tree never becomes a second place to level the same thing.

### The recommended split

All six keep their attraction seed exactly as today. What changes is whether the creature's
*existence* is visible before you meet it.

| Creature | Attracted by | Revealed on | Rung |
| --- | --- | --- | --- |
| **Pip** (Grove Spirit) | Bluebell ×5 | Bluebell's card, sideways | 2 |
| **Bumble** (Gardenbee) | Lavender ×7 | Lavender's card, sideways | 3 |
| **Bramble** (Hedgefox) | Rose ×8 | Rose's card, sideways | 4 |
| **Thistle** (Hedgepig) | Marigold ×6 | Marigold's card, sideways | 7 |
| **Luna** (Moonmoth) | Moonflower ×6 | Moonflower's card, sideways | 14 |
| **Ember** (Lampfly) | Starlit Iris ×5 | Starlit Iris's card, sideways | 16 |

**A creature hangs off the flower that attracts it, not on a rung of its own.** "Plant five
bluebells" *is* Bluebell, so Pip's branch belongs on Bluebell's card. This makes the invariant — a
creature is never in reach before its flower is — **true by construction rather than by a check**,
and it stops five creature cards from crowding the early path. It also means no creature reveal can
drift out of order when flower rungs move, which was the fragile part of putting them on their own
rungs.

### The buff sub-nodes

Per creature, hanging sideways off its card, bought in Saved Seeds. Categorical, never "+X%" — the
creature-pair discipline:

- **"Stays awake longer"** — one more hour on the same meal, per rank.
- **"Keepsakes sooner"** — the keepsake countdown shortens by one harvest, per rank.
- **"Trait one star higher"** — the creature's trait reads as if one star further along. **One rank
  only, hard-capped**, because stars are the Hollow's number and this is the nearest thing in the
  design to a second levelling track.

### The slot collision, priced

`HABITAT_SLOT_LEVELS = [1, 5, 10, 16]` — four tending slots, gated on levels that the re-authored
curve leaves untouched. Six creatures, four slots: *more attracted than slots is the whole point*,
per data.js's own comment. Doc 33 sketches a fifth slot at ~level 24.

**The collision:** if the tree reveals five of six creatures and also sells buffs for them, a
player can own six buffed creatures and bench two. The buffs on a benched creature do nothing, so
Saved Seeds spent there are dead — the regret the checklist model exists to avoid.

**Two options, priced:**

- **(a) The fifth slot becomes a tree node** at rung 27, replacing doc 33's level-24 sketch. Cost:
  one rung. Buys: five of six tending, so only one is ever benched. **Recommended — but it does not
  fully close the regret**, and the first draft of this section overstated it: with six creatures and
  five slots one is still benched, and `"Trait one star higher"` is one rank and hard-capped, so Seeds
  spent on the wrong creature stay dead in the currency that only arrives at the Turn. Doc 31 surgery
  4 is unambiguous — *"everything eventually maxes; no order is wrong."* **So (a) needs a companion
  rule: a creature's branch is re-spec-able, or its ranks apply whether the creature is tending or
  benched.** The desk leans to the second — it is one line, and it makes the slot a choice about
  *tending* rather than a tax on spending.
- **(b) Leave slots at four and make buffs follow the creature, active or benched.** Cost: it
  deletes the choice that data.js says is the point of slots. Not recommended.

---

## 7. The drone, paid

There is no gold path to the permanent drone. It is **bought with real money or rented by ad**, and
the tree upgrades an owned one. This supersedes the 2026-09-21 "drone moves to the Shop as a gold
card" ruling, before it was built.

**The card in the Shop.** Two prices on one card: a one-time purchase, or rent by rewarded video
for half an hour. The rental already exists and ships its own guardrails — it composes with the
bought upgrade by `max` and never by replacement, it refuses before spending an impression when a
rental is already flying, and it is **excluded from `passiveIncomeRate()`** because that function
is a rate multiplied across a whole absence. `DATA.ads.perPlacement.drone` is 2 of a `dailyCap` of
6. **But one of those guardrails does not survive untouched, and §5 is why.** The sim-test that
asserts the rental never touches offline income works by checking `bare === 0 && rented === 0 &&
away === 0 && bought > 0` — it only holds because `passiveIncomeRate()` returns **zero without the
bought drone**, which is the exact line §5 removes. Once the flower earns while you are away, "a
rental changes nothing" has to be re-asserted a different way: by comparing away income with and
without a rental flying, rather than against zero. The rule is unchanged; the test that protects it
is not, and it is billed in §9.

**The upgrade branch hangs sideways off the offline node at rung 13, not on a rung of its own.** That
placement is deliberate: a rung only a payer could climb into would be a reputation threshold and a
Saved Seeds sink gated behind money, against doc 37's governing frame — *"paying accelerates, never
gates"* — and against doc 31 surgery 4's *"everything eventually maxes; no order is wrong."* As a
sideways branch on a card every player owns, a non-payer loses the branch and never a rung.

**The web lab's stand-in.** The web build has no IAP and never will — doc 37 puts real money in the
Unity shell. Testers get a stand-in purchase on the `Game.watchAd()` precedent: the one function
that changes when a real SDK arrives, with every cap, counter and mint exclusion already true and
already tested around it.

**The refund migration, worked.** Saves that own gold-bought drone levels get those levels
converted to Saved Seeds, spendable anywhere on the tree. The precedent is the mastery conversion
inside `migrateYear()` — grep `masteryConvert` — including **its silence**: no toast, the backfill
pattern.

```
   drone gold spent  =  Σ  base 4,500 × 2.4^(level − 1)       // DATA.upgrades.autoHarvest
   refund            =  round( droneConvert × levels )        // new knob, mastery's shape
```

**`droneConvert = 4` Saved Seeds per drone level** — JUDGMENT. `masteryConvert` is 2 per mastery
tier; a drone level costs far more gold than a mastery tier and there are far fewer of them, so
double it. A tester at drone level 3 receives 12 Saved Seeds.

> **Say plainly what a tester loses here, because they do lose something.** They lose **the drone
> itself.** A player who bought it with gold keeps no drone after this migration — they keep a
> handful of Saved Seeds and a Shop card asking for real money. That is the sharpest "nobody loses
> a thing they paid for" strain in this feature after ruling 17, and the owner should decide it
> knowing that the friend-testers are the people it happens to. The alternative — grandfather the
> owned drone forever — creates a permanent class of players with a paid item for free, which the
> owner's ruling explicitly refused: *"the drone becomes paid for everyone with no grandfathered
> class."* The ruling stands; the cost is real and is stated here rather than smoothed.

---

## 8. What it replaces, and the migration

| What goes | What a save that owns it today receives |
| --- | --- |
| **The Almanac's petal rows** | Every bought petal becomes a rank on the same flower's sideways branch. Identical power, new drawing. `state.petals` is not rewritten — the tree reads it |
| **The picker's unlock rows** | Nothing lost; the tree is the picker's ladder now. `state.seedUnlocks` untouched |
| **The `???` rows** | They become **masked cards** under the curtain — present on the path, silhouetted, `???`, stats withheld, one directional hint. Doc 47's rule is unchanged and load-bearing: *"a locked thing you can see is a goal, and a missing one is nothing."* **The curtain masks identity; it never removes a card** |
| **The affordability reveal arm (arm 4)** | See below — this is the strained one |
| **Arm 2, the always-show-the-next-wall arm** | Re-homed as the UP NEXT ribbon (§2). Nothing lost if the ribbon ships in the same commit |
| **Arm 3, the 85% savings arm** | Genuinely lost. The player sees the rung instead |
| **The `seedRevealed` latch, already true on live saves** | **Open — §12.** A latch cannot un-reveal |
| **The per-Turn reveal cap, in full** | See the itemised bill below |
| **Moonlight Tending and Lantern Oil** | Their levels become the offline node's levels, rank for rank. No level is lost |
| **The store's decorations** | Each becomes a perk node. Existing decor rows convert when the tree lands |
| **The drone's gold levels** | Refunded into Saved Seeds per §7. The drone itself is lost |

### Ruling 17 is where this table is strained, and it is where to be most honest

A returning player who could see six flowers yesterday can see two today. That is the regression,
in one sentence, and no amount of ceremony language makes it not one. The mitigations are real —
the ribbon replaces arm 2, the rail gives every threshold a visible height, the unveiling becomes a
genuine first sight — but the mitigation for arm 3 is *a different pleasure*, not the same pleasure
preserved. The owner ruled it knowing that. The spec's job is to make the migration not compound
it, which is the `seedRevealed` question in §12.

### The per-Turn reveal cap retires, and it is seed-only — so it retires from the game

**Verified 2026-09-24.** `revealCapPerTurn` has exactly one reader, `seedRevealedNow()`'s arm 3.
`upgradeRevealedNow()` carries "no affordability law and no cap" by its own comment. So removing
arm 3 leaves the cap with nothing to gate anywhere. The bill, itemised so none of it is discovered
in a diff:

1. **`DATA.year.revealCapPerTurn: 2`** — the knob in data.js.
2. **`DATA.year.revealAt: 0.85`** — arm 3's threshold, dead with the arm.
3. **`state.year.revealsThisTurn`** — a live save field: born in `defaultState()`, carried in
   `load()`'s year migration, incremented in arm 3, and zeroed at the Turn.
4. **doc 07's save-data row** for it, and doc 47's Part I text describing four arms.
5. **The sim-test checks that assert the cap works — eleven of them, across three groups**, not the
   "roughly five" an earlier draft of this section claimed: the groups are `arm 3: 85% of the price,
   and the per-Turn cap that throttles only this arm`, `the cap does not touch arms 1, 2 or 4`, and
   `jumpTurns is the burst adversary`. **The hand-sabotage check is
   `and it spent exactly one slot of the per-Turn cap`** — its comment is the one reading *"Sabotaged
   by hand: dropping the `state.year.revealsThisTurn < DATA.year.revealCapPerTurn` clause…"*. An
   earlier draft named `the exhausted cap itself did not move` instead, which carries no sabotage
   note; the whole point of naming a sabotage check in a document is that a reviewer can find it, so
   the wrong name defeated the purpose. These checks are **not re-authored. They are deleted.**
6. **Doc 47's test bill item 2**, "the wall's bodyguard" — it asserts arm 2, and it survives only
   if it is re-pointed at the UP NEXT ribbon. Re-point it; do not delete it.

**Still to be designed, and it belongs in the spec rather than §12:** whether
`state.year.revealsThisTurn` is dropped at migration or left in the save and ignored. Dropping is
cleaner; leaving it costs one dead field and zero risk. The desk leans to leaving it, because the
never-resets partition's completeness check is easier to keep green when a SURVIVES key is not
removed mid-flight.

---

## 9. The math bill

### Invariants the tree must hold — all of these exist today

- Every seed returns above cost; `yield = cost × 1.4` at Common holds for every seed.
- Gems per hour flat across seeds. **No per-seed gem axis, ever** — the deleted override mechanism.
- The well's inputs unchanged: the mint reads earnings, never balance; `lifetimeCoins` and
  `mintedBase` never reset; ad and cheat gold skip both accumulators.
- Away income capped and stated.
- The whole growth stack clamped at the 0.3 floor in `plantGrowth()`.
- No pair or trait touches the yield pool.

### Invariants it adds

- **A lawn spot cannot stack the same perk.** Five spots, five different perks, or the catalogue is
  one multiplier with five names.
- **A tree-revealed creature is never missable**, and is never revealed before its attract flower.
- **A node's rank cost curve** compounds, and must be pinned against the pouch's `sqrt(lifetime)`
  growth in the same test that pins the petal ladder — doc 33 already flags those two exponents as
  mismatched, and the tree adds a third consumer of the same currency.
- **A free rank from a bare level can never exceed what the same rank costs in Seeds.** Ruling 5's
  guardrail, and the number most likely to break something.
- **No flower is revealed by gold once the tree ships**, and **the slowest player's visible
  catalogue is never empty** — asserted at day 3 for the casual persona, where the model puts
  eleven rungs on screen.
- **A level the player has reached never decreases**, across the curve re-authoring (§3).
- **Neither Turn-touching perk is ever purchasable** with money, gems or an ad.

### The sim-test work this feature owns — every check named, because an unnamed broken check is the defect

The first draft of this section named two checks. **A critic pass found roughly a dozen more.** The
list below is what a reviewer should be able to tick off; anything not on it that goes red is a
finding against this document, not against the builder.

**Deleted** (their subject stops existing):

1. The **eleven reveal-cap checks** across three groups, per §8 item 5 — including the hand-sabotage
   check `and it spent exactly one slot of the per-Turn cap`.

**Re-authored against rungs** (the assertion is still right, its measure is not):

2. `no creature waits on a seed the game never unlocks` and `the first creature is reachable early`
   — both read the **retired** `unlockLevel` as a proxy for when a player reaches a flower. Once
   creatures hang off flower cards, both measure nothing. Ruling 8's promise that the sim stays "a
   check rather than a rewrite" holds for the flower ladder and does **not** hold here.
3. `check('level 20 lands on 1045', …)` — the curve proposal puts rung 20 at 1,055.
4. `check('the ladder reaches Eternal (level 17)', ladderRep >= 760)` — the last flower moves to rung
   37 (10,217 rep), so this check keeps **passing while asserting something twelve rungs untrue**. The
   quietest failure on the list.
5. `check('skipping ahead is allowed and priced the same', …)` — survives only because §2 drops the
   eligibility gate. If the owner reinstates one, this check is the thing that catches it.
6. **The suite's main fixture itself:** `unlockTo(level)` does `S.rep = G.cumulativeRep(level)` *and*
   reads `unlockLevel`, and it has **63 call sites, 37 of them at level 20** — exactly where the
   re-authored curve and `cumulativeRep()` diverge. §2 is right that `game.js` reads `unlockLevel`
   twice; `tools/sim-test.js` reads it in **five** places, and an earlier draft of this document named
   two.

**Re-authored because §5 re-bases offline income** — eleven checks in four groups, and the first draft
billed **none** of them:

7. Group `offline earnings run on two axes`: `an unautomated garden earns nothing while away`,
   `a drone with no planters still earns nothing`, `planters plus a drone produce income`,
   `the drone cadence caps throughput when the plots outrun it`, `a drone faster than the plots adds
   nothing`. Every one of these encodes the drone as the source of away income, which is the thing
   the owner struck.
8. Group `bill 10 — petal effects reach passiveIncomeRate()`: `Rich Bloom lifts the offline rate by
   exactly its harvest share`, `Quick Sprout shortens the offline cycle too`. These must still hold —
   petals reaching offline income is doc 32's discipline rule 1 — but against the new rate.
9. Group `the offline path is walled by the seed unlocks`: `a fresh save earns offline only from the
   seeds it actually owns`, `and the rate is the free ladder's, not the whole catalogue's`; plus the
   gapped-unlock case `and offline income values that seed, not the one at its index-minus-the-hole`.
10. `the rental does not touch offline income` — whose own comment calls it *"the most dangerous
    assertion in the item"*, and which per §7 has to be re-asserted by comparison rather than against
    zero.

**New checks this feature owes:**

11. No node raises `mintK` or `tallyCap` (§4's recursion).
12. A reached rung never decreases across the curve re-authoring — **and the grant walk in `addRep()`
    never re-fires**, since `grantLevel()` credits through the mint (§3's bill, items 3 and 4).
13. No flower is revealed by gold once the tree ships; the slowest persona's visible catalogue is
    never empty at day 3.
14. A lawn spot cannot hold two of the same perk.
15. Doc 47's bill item 2, "the wall's bodyguard," **re-pointed at the UP NEXT ribbon** rather than
    deleted — the ribbon is arm 2's replacement, so it inherits arm 2's test.

### The knobs, with no values — the owner's to tune on the spike's sliders

`repToNext` above rung 19 (the geometric ratio) · `repPay` per tier · the Tally's reputation grant ·
the welcome-back multiplier and its cap · `flowerShare` · **its taps-per-minute anchor** · **the
offline coins ceiling (`maxShare` or absolute), which today's drone cadence provides and §5 deletes**
· **the always-on away trickle from rung 1** · `droneConvert` · each perk's rank ladder · the rank
cost curve · the card count per rung · chapter boundaries.

---

## 10. What could go wrong — the desk's own doubts, before the critics find them

1. **The tree becomes a second navigation despite both doors.** It takes the Almanac's petal tab
   and the trunk in the garden scene wears the "up next" badge, so no tab is added — but a
   forty-rung full-screen scroll is a *place*, and places compete. The mitigation is that the
   garden-scene trunk puts demand on the production surface where doc 28 says it belongs. The risk
   is that the player stops visiting the Almanac at all and the flower's own story goes unread.
2. **The trunk starves if reputation is orders-heavy and orders are slice D.** Orders are the main
   faucet by ruling, and `repPaused` comes off in slice D. Until then the climb runs on quests
   (789, exhausted at rung 17), harvests (+1 per 10) and milestones (140). **The tree cannot ship
   before slice D**, or it ships with a rail that stops a third of the way up. This is a sequencing
   constraint, not a tuning one, and it is the first thing the spec must state.
3. **A perk catalogue that makes every number in doc 33 a lie.** Eleven perks with three ranks each
   is thirty-three new multipliers landing on an economy whose two pacing exponents doc 33 already
   describes as mismatched. The two Turn-touching perks are the acute case; the chronic case is that
   nobody has re-run `year-sim` with any of them.
4. **Slots turn the lawn into a menu.** Five placed perks on a board of eight plots and a talking
   flower is a crowded lawn. The spike's two-and-five frames are where this is judged, and the
   honest failure mode is that the garden stops reading as a garden.
5. **Forty rungs of free ranks quietly out-earning the Turn.** At direction density this never
   fires, which hides the risk rather than removing it. Thin the catalogue and it fires eight times
   — and a free rank is worth more than a purse.
6. **Eight chapters of writing become the thing that gates shipping.** Roughly a dozen beats, each
   changing something visible in the village. The visible change is the expensive half, not the
   dialogue.
7. **Ruling 17's own regression.** A returning player sees strictly less than they saw yesterday,
   and a curtain now hides things gold used to show. §2 and §8 state it; it stays on this list
   because it is the one a playtester will report as a bug.
8. **The curve re-authoring is a change to a never-resets number, and it does land on the testers.**
   §3 keeps rungs 1–19 identical, but the daily quest and uncapped harvest rep put a long-lived save
   at rung 27–34 today — so a tester loses three to seven rungs unless the latch works, and §3's bill
   shows the latch is the subtlest part of the feature. This is the riskiest save surgery here after
   the drone refund.
9. **Reputation accrues against nothing above rung 40, which is doc 27's defect relocated rather than
   cured.** Every rank ladder is three ranks and doc 31's *"everything eventually maxes"* is kept, so
   an engaged player finishes the tree — the heavy persona reaches rung 40 around day 15 — and then
   reputation, lifetime and never reset, has nothing left to buy. The cliff moves from 17 to 40. The
   owner asked for *"unlimited progression and an awesome meta"*; forty rungs is not unlimited, and
   this document does not solve it. §12 question 11.
10. **Gating a shop card behind a rung can deadlock the quest ladder, and it nearly shipped here.**
    Five upgrades are named by quests — `q_power_1` (Power Punch, rep 8, the fifth quest in the game),
    `q_grip_1`, `q_charm_1`, `q_star_1`, `q_coil_1` — and pre-slice-D the quest ladder is most of the
    reputation faucet. An earlier layout put Power Punch's ACCESS node at rung 11 (325 rep), which
    makes quest five unreachable until 325 rep that the quests themselves were supposed to pay. **The
    fix is in the layout: ACCESS nodes draw only from cards no quest names** — Sprinklers and Land
    Deed. It is an invariant, it belongs in the spec, and doc 47's quest-safety scan is the existing
    machinery for it.
11. **The offline re-basing removes the only coins ceiling on away income** (§5), and eleven sim-test
    checks encode the drone as away income's source. That is the largest unbilled engineering surface
    in the feature after the curve.

---

## 11. The spike brief — paste-ready

```
MODEL: Sonnet 5 (thinking)
EFFORT: high

You are ONE builder. No ultracode, no workflow, no subagents: this is a layout spike.

Build tools/tree-spike.html — one static page, no game dependencies, 390x844, wireframe
fidelity. Layout is the question; polish is the build's job. Obey docs/08-ui-and-layout.md
(the 560px column, the pinned row grid, the sheet grammar). Read docs/52-the-trunk-and-the-tree.md
first — the rung table in section 1 is your content. Read docs/05-art-direction.md for material.
Raise every layout question AS A QUESTION in the handoff; decide nothing the owner should decide.
Push, then STOP. No UI code follows until the owner approves (docs/34, the wireframe gate).

THE VISUAL TARGET, described in words. The reference is a screen recording on the owner's
machine; it never enters the repo or the wiki. Take the pattern, not the picture:

  - A full-screen vertical scroll.
  - A REPUTATION RAIL down the right edge, with a live marker pill carrying the player's own
    number — so a threshold is a HEIGHT on the rail, not just a number on a card.
  - Nodes as framed cards ZIGZAGGING left and right down a single linear path on the left.
  - Three card states: locked (art dimmed, padlock, threshold on a badge); exactly ONE
    "UP NEXT" wearing a ribbon and always showing its price (our advert-row rule); unlocked
    (gold frame, art in full colour).
  - A CURTAIN across the top. It MASKS identity, it does not remove cards: beyond the revealed
    stretch the cards are still on the path, silhouetted, "???", stats withheld, one directional
    hint each. Doc 47: "a locked thing you can see is a goal, and a missing one is nothing."
    Drawing nothing up there would delete the mechanism the curtain is named after.
  - THE UNVEILING when the marker reaches a card: doors open, a ribbon is cut, the card lights,
    the marker climbs, about two seconds, and the thing unlocked is shown as itself.
  - The owner's addition, which the reference lacks: SUB-SKILLS BRANCHING SIDEWAYS off a card,
    with ranks, so the path stays linear and the depth hangs off it.

WHAT NOT TO TAKE from the reference — stated so you do not absorb it:
  - Reward-in-currency as the point of an unlock. Ours unlocks CONTENT — a flower, a perk, a
    creature — and the currency line is secondary.
  - The glossy blue-and-gold material. Ours is doc 05's paper, ink and lip.
  - Any timer, offer, or buy-to-skip chrome.
Take the rail, the zigzag, the three states, the one ribbon, the curtain, and the ceremony.

THE FRAMES THE OWNER MUST JUDGE:
  1. The whole forty-rung path, zoomed out.
  2. The first hour — four cards and one silhouette (section 1 draws it).
  3. The rail with its marker mid-climb, and its story marks.
  4. One flower card open, with its sideways branch and ranks. NOTE: draw Rich Bloom (5 ranks) and
     Quick Sprout (5 ranks) only. Signatures are a LATER PHASE — `data.js` has two petals per
     flower today and doc 32's glossary says signatures "arrive in a later phase" — so draw the
     slot where a signature will go, unfilled and labelled, never a live ladder.
  5. The lawn at two slots, and at five, with a perk placed.
  6. A creature card revealed at a rung.
  7. A STORY BEAT firing as a moment over the garden — NOT a card on the path. Full screen,
     on the spot, the existing moments machinery.
  8. The unveiling, as a frame sequence.
  9. The offline node with its levels.
 10. The drone card in the Shop, with its two prices.
 11. The curtain with the next chapter in silhouette.

Story marks: a beat shows as a tick or ribbon mark ON THE RAIL, visibly not a card, so the
player sees a story moment coming two levels out. Marks cannot be bought and must never look
purchasable. Draw them at three distances so the owner can judge the read.
```

---

## 12. Open questions for the owner

Each with its two answers priced. The Tally's existence, the slot count, the trunk's length, the
drone migration's shape, the curtain's depth, the bare-level reward and the reveal gate itself are
**ruled** and are not here.

1. **The reputation-per-order number.** `repPay` is 4 / 7 / 11 / 16 by tier and has never paid.
   **(a) Ship as authored.** The §3 model uses these and lands the *casual* persona's last flower on
   day 47, against doc 33's ~day 46 on gold — it works for that persona. Cost: the numbers were sized when the ladder stopped at 20, so they are
   right by luck rather than by design. **(b) Re-derive per tier against the re-authored curve**,
   the way `tools/order-gold.js` re-derives the coin half. Cost: a tool nobody has written.
   *Desk leans (a) for the spike, (b) before ship.*

2. **The Tally's reputation grant.** At 25 flat it moves the climb by under one rung — ceremonial.
   **(a) Keep it small and ceremonial.** Cost: turning the year does not visibly advance the
   story, which is the reason ruling 12 said yes. **(b) Make it several hundred.** Cost: it becomes
   a faucet that rewards Turn count, the exact family `DATA.year.veterancy` was **deleted** for —
   and a splittable reputation faucet is a splittable story. *Desk leans (a), and flags that
   ruling 12's stated purpose may not survive it. This is the one place the desk thinks a ruling
   and its reason are in tension, and it is the owner's to resolve.*

3. **The welcome-back boost and its cap.** **(a) ×2 on tier 1–2 orders, capped at one rung's
   worth.** Cost: a three-day lapse buys at most one level — possibly too quiet to feel like a
   gift. **(b) ×3, capped at two rungs.** Cost: closer to Monopoly Go's felt generosity, and
   closer to making absence profitable. *Desk leans (a); the cap matters more than the multiplier.*

4. **The `seedRevealed` latch on live saves under ruling 17.** A latch cannot un-reveal, and every
   tester has flowers already latched true from arms 2, 3 and 4.
   **This question asks the owner to overturn one of his own rulings, and the first draft did not say
   so.** Doc 47's grandfather rule is ruled, not preferred: *"any save that predates the feature
   latches ALL seeds revealed and ALL moments celebrated, unconditionally… Deriving from a migrated
   ledger would re-hide rows a player can see today — the exact regression the ruling forbids."*
   Option (b) is that regression, deliberately. It may still be right — the ruling was made when gold
   was the only revealer — but it is a reversal and should be chosen as one.
   **(a) Grandfather the peeked flowers.** They stay visible above the rail. Cost: a permanent
   class of saves whose curtain disagrees with the rail — and on a heavily-cheated tester save,
   that is *every* flower, so the tree ships with no curtain at all for the people testing it.
   **(b) Re-base the latch at migration** — clear it and re-derive from reputation alone. Cost: it
   takes flowers off a tester's screen that they could see yesterday, which is the regression in
   §8 aimed directly at the friend-testers. *Desk leans **(b) with a one-time telling** — the
   moments machinery says once, plainly, that the garden has changed how it shows its secrets. A
   silent re-hide is the version that reads as a bug.*

5. **The chapter boundaries.** Eight chapters across forty rungs, currently at 1 / 5 / 10 / 16 /
   22 / 28 / 34 / 39. **(a) Keep them even.** Cost: chapter VIII gets two rungs and reads rushed.
   **(b) Front-load them** — five chapters in the first twenty rungs, three across the last twenty.
   Cost: the late game's story thins exactly where the nodes also thin. *Desk leans (b): the first
   hour is where a story earns the right to continue.*

6. **The two Turn-touching perks.** **(a) Cut both from v1** — the desk's recommendation. Cost: the
   Turn category has no card, and §4's "add a perk only where a category would be empty" rule then
   wants a harmless one. **(b) Ship them at the top of the climb** with the never-sold assertion.
   Cost: `mintK` and `tallyCap` are both named in doc 33 as unresolved phase-4 knobs; selling ranks
   on an unresolved knob is how a document becomes a lie.

7. **The fifth habitat slot, and whether a creature's ranks survive being benched.** §6's (a) plus
   its companion rule. *Desk leans (a) with ranks that apply benched — one line, and it removes the
   only dead-Seeds case in the feature.*

8. **The always-on away trickle.** §5 shows the offline node at rung 13 leaves the first three or four
   nights at zero, which is the window doc 31 surgery 5 called the churn window. **(a) Add a small
   trickle from rung 1**, node ranks raising it — surgery 5 as written, one more knob in
   `DATA.offline`. **(b) Leave the node as the floor.** Cost: the free player's first week is exactly
   the zero-overnight break the owner's ruling was meant to fix. *Desk leans (a).*

9. **The rung budget: forty rungs cannot hold nineteen flowers at ruling 4's late-game spacing.**
   §1 states the arithmetic. **(a) Accept a denser late game** than ruling 4 describes — roughly one
   node per one-to-three rungs instead of one per three-to-four. Cost: the late climb feels busier
   than the owner's own words imply, and the free rank fires only three times.
   **(b) Lengthen the trunk past forty.** Cost: reopens a ruled number, and every rep figure in §3
   moves. **(c) Demote some perks to sideways ranks** on existing cards so fewer things need a rung.
   Cost: the perk category loses its own cards, and §4 is already down to eleven.
   *Desk leans (c) then (a). This is the one structural constraint the desk could not resolve inside
   the rulings as written.*

10. **Run `tools/year-sim.js` per persona against the unlock ladder before the spec.** Not a design
    question — a measurement nobody has taken, and the cheapest thing that would de-risk the feature.
    §3's calibration matches the rail to gold for the casual persona only; whether a heavy player's
    gold also arrives proportionally sooner is unknown, and it decides whether the unveiling is a
    purchase or a promise for most of the audience. **(a) Measure first.** Cost: a tool change.
    **(b) Spike first, measure during the spec.** Cost: the spike may draw a pace that does not exist.
    *Desk leans (a) — it is hours, not days, and §3's whole argument rests on it.*

11. **What consumes reputation above rung 40?** §10 item 9 — the tree is finishable, so the cliff
    doc 27 named at level 17 moves to 40 rather than going away. **(a) Nothing; forty rungs is the
    game for now.** Cost: doc 27's finding is deferred again, and the owner's "unlimited progression"
    is not delivered. **(b) A repeating late tier** — cosmetic or catalogue rungs past 40 that never
    end. Cost: it is a whole design, and it is not this one. *Desk leans (a) explicitly and in
    writing, so the next reader knows it was seen rather than missed.*

12. **Whatever the critics leave standing.** For the record, one finding was **rejected**: the
    economy critic read §3's climb table as arithmetically impossible for the casual persona, computing
    230 rep/day against a 196/day ceiling. It assumed reputation sits exactly on rung boundaries. It
    does not — raw rep at day 30 is ~6,800 against rung 34's floor of ~5,300, so the segment needs ~200
    rep/day, which the persona supplies. The table stands; what the finding correctly exposed is that
    the model was not reproducible from the document, which is why §3 now prints the per-day
    arithmetic.
