# The Story Flow — a brief for the story bible's writer

**Status: a brief, 2026-09-26. Not the story bible and not the premise.** Read
[53-narrative-premise.md](53-narrative-premise.md) first — it holds the premise, the cast, the five
acts and the guardrails, plus the desk's read of what fits the game and what collides. Doc 53 is the
**what**. This document is the **when and where**: the shape of the player's first session, the two
clocks a beat can ride, and the physical places in the game a beat can actually land.

It exists because the first-time experience was redesigned on 2026-09-26, after doc 53 was written.
**One of doc 53's delivery rules is now backwards** — see §3. Do not inherit it.

Everything here is ruled unless it says otherwise. The rulings are the 2026-09-26 entries in
[10-decision-log.md](10-decision-log.md); the systems are
[52-the-trunk-and-the-tree.md](52-the-trunk-and-the-tree.md) and
[32-the-garden-year.md](32-the-garden-year.md).

---

## 1. The first session, beat by beat

This is the sequence the story has to carry. It is short on purpose — the whole thing is **minutes,
not hours**.

1. **The seed.** The player plants what is in the tin. It blooms, looks up, and asks the question.
   Doc 53's FTUE beat, unchanged — it is the hook and the primary UA creative. Nothing is explained.
2. **The flower teaches the garden.** A quest strip across the top of the screen runs the tutorial:
   tap, plant, harvest, buy an upgrade. It is the game's teaching voice and it always has been; what
   is new is that it now has an **ending**.
3. **The flower asks for the store.** The tutorial's goal is not "learn the buttons," it is **get the
   store open again**. That is the narrative spine of the first session and it is what makes the
   quest strip feel like a story rather than a checklist.
4. **The first Turn.** The quest strip runs *to the first Turn* and stops there. In the fiction this
   is the will's deadline met — the moment Mara keeps the garden. Doc 53's desk-read already found
   this and it is now ruled: the inheritance clause and the Garden Year are the same clock.
5. **The store reopens. Customers arrive.** The space the tutorial bar occupied now carries **orders
   and arriving customers**. This is the visible reward for finishing the tutorial, and it is the
   first time the player sees other people want something from them.
6. **From here, orders are where reputation comes from.** That was already the rule in doc 32; what
   changed is that the player now *meets* it in the first session instead of hours later.

**Why the pacing moved.** The first Turn used to sit behind 100,000 gold — hours away — so most
players never learned what a Turn was. The owner's ruling: *"we put it too far out, so they don't
really know what it is."* The tutorial now teaches the whole loop — earn gold, take a Turn, spend
into the trunk, meet the story — inside one session.

---

## 2. What the player is climbing

- **Reputation is experience points.** It is permanent, it never resets, and it is earned by doing
  the things the village sees — filling orders above all.
- **Levels are the rungs.** Reputation fills toward the next level. There are on the order of **120**
  of them, and each one reveals a card on a single vertical path: a flower, a flower upgrade, a perk,
  a creature, a lawn spot. This is the trunk.
- **Story beats are ticks on that rail, never cards.** A chapter tick is visibly not a card. When the
  player crosses one, a beat fires.
- **The Turn is the prestige moment** — the year ends, gold goes, and **Prisms** arrive. Prisms are
  the forever money and they buy depth on the trunk.

**Write in these words.** Every word a player sees has to be a glossary word from
[32-the-garden-year.md](32-the-garden-year.md). The ones that bite most often: it is **the Turn**,
never "reset"; it is **a catch**, never "mutation"; the permanent currency is **Prisms**, never
"Saved Seeds" (renamed 2026-09-26) and never "seeds", which are the things you plant.

---

## 3. The correction to doc 53 — read this twice

Doc 53's "How story is delivered" says:

> Bloom cycles — the prestige reset… **Carries no story weight of its own beyond Wonder aging.**

**That is now false for the first Turn, and the first Turn is the most important beat in the game.**
It is the climax of the tutorial, the moment the garden is kept, and the moment the store reopens and
people start arriving. It carries an act break.

Later Turns can stay light — the rule was written to stop the prestige loop from gating story, and
that concern is still right. The precise shape:

- **The first Turn carries a major beat.** Treat it as the end of the opening act.
- **Every Turn after it carries no required story**, so a player who Turns often and a player who
  waits both see the same narrative. Doc 53's underlying worry — that tying story to the reset would
  unravel it — holds for every Turn but the first.

Doc 53's other delivery rules stand: acts gated by **total reputation**, never by calendar; front-load
mystery slivers; cap beats per day. Note that "acts gated by total reputation" is exactly the level
model above — reputation is the spine, and the trunk is what it looks like.

---

## 4. Where a beat can physically land

These are the surfaces that exist or are being built. A beat that needs a surface not on this list is
a request for engineering work and should be flagged as one.

| Surface | What it is | Good for |
| --- | --- | --- |
| **Chapter ticks on the trunk's rail** | A mark between cards at a given level | Act breaks and chapter openings |
| **The moments dialog** (doc 47) | The game's one-at-a-time reveal panel | A scene with a beginning and an end |
| **The flower's lines** (`FLOWER_LINES`) | The flower talking in the garden | Mystery slivers, reactions, the running voice |
| **Villagers' order lines** | What a customer says when they want something | Character colour at the Stand, and faction flavour |
| **The welcome-back board** | Shown after a real absence | Re-engagement beats, a nudge from a neglected character |
| **The quest strip** | The tutorial bar, first session only | The opening — and it converts to orders when it ends |

**Every chapter must change something visible** (ruled 2026-09-22). A beat that is only dialogue is
half a beat; the bible maps each one to a room or an object that visibly changes — the greenhouse
restored, a villager arriving at the Stand, the Hollow waking, Holly keeping Winter, the show as
Fall's bed and its windfall. The visible half is the expensive half and it is the part a builder can
actually build.

---

## 5. Hard constraints

Non-negotiable. Doc 53's guardrails all still apply; these are the ones the flow adds or sharpens.

- **The flower never appears in a purchase prompt.** Already the house rule (doc 37) and now a story
  rule too. The maternal hook and the monetization voice live in different characters, permanently.
- **One reputation number, not three factional tracks.** Ruled in doc 52. Delphine, the Baroness and
  Bram survive as **people at the Stand** who place orders and whose beats fire on chapters —
  never as a second or third progression bar.
- **One confession, four lines**, then silence. Mara never explains her childlessness.
- **A hard cap on story beats per day**, regardless of how fast reputation is earned.
- **Write to a budget.** Doc 53 estimates 40–60k words for year one; the desk's read prices volume
  one at **eight chapters** of a few hundred words each, plus villagers' order lines, plus the memory
  slivers. Acts 4 and 5 are volume two. The alive-daughter hook goes into volume one's last sliver so
  live-ops has somewhere to go.

---

## 6. Open — the owner's calls, not the writer's

Do not resolve these in the bible; flag them and write around them.

- **The flower's name.** "Wonder" collides with the Wonder Effect (the game's jackpot moment) and
  with the title. It needs its own name. Related: **Holly**, Winter's hero flower, already exists
  with a voice — same plant in winter, a sibling from the same tin, or a separate character?
- **Mara as a named lead.** Today the flower talks to *you*, an unnamed gardener. A named lead suits
  the lane, but it re-reads every existing flower line and needs a dialogue surface that does not
  exist yet.
- **How long the tutorial is** — how many steps, and how many minutes to the first Turn. The story's
  opening pace depends on this and it has not been sized.
- **Bram.** The game already has **Bram the Baker** as a customer in `data.js`. Reuse or rename.

---

## 7. What the desk would check before the bible is believed

Named here so the bible's own critic has targets: what players *praise* in Lily's Garden, Gossip
Harbor and June's Journey — the beats, not the premise — and what they complain about (pacing gates,
paywalled chapters, drama that turns mean). And one question on the flower's line, *"Are you my
mommy?"* — is it the UA creative that cuts through, or the line a store reviewer screenshots?
