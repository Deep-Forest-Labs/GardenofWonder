# Handoff — Current State and Next Steps

Last updated: **2026-08-05**

Read this first if you're picking up the project cold. It covers where things stand, what's been
decided, and what to do next. Update it at the end of any significant session.

## Where the project stands

The game is **built, working, and live** at <https://jonishua.github.io/ghostgarden/>, deployed from
`main` at the repository root. It is a single-screen idle garden — tap a talking flower, plant
seeds in eight plots, harvest with rarity multipliers, spend on badges, decor and boosters.

Fully documented in this folder. Start with [README.md](README.md), then
[02-architecture.md](02-architecture.md) and [09-conventions.md](09-conventions.md).

The current build is a **prototype and design reference**, not the shipping product.

## Who is doing what

| Person | Role |
| --- | --- |
| Owner | Design and web prototyping. Not the implementer. |
| Engineer | Porting to Unity for iOS and Android. |
| Agent | Design advisor, prototype implementation, documentation. |

The web build is the **design lab** — cheap and fast to test ideas. Unity is the **shipping
product**. Keep them in that relationship; don't gold-plate the web build.

## Decisions already made

Don't relitigate these without a reason.

**Goal is modest revenue** — a few thousand a month, low risk. Not a venture-scale hit. This drives
scope, monetization tone, and the bias toward proven patterns.

**Next milestone is the multi-region meta-layer**, specified in
[12-meta-layer-design.md](12-meta-layer-design.md). One contiguous expanding map, five regions
feeding one interlocking economy, driven by a Township-style order system.

**One new mechanic only — merge, in the Potting Shed.** Everything else is timer-and-tap with
distinct art until the structure proves it retains. This is the main defence against scope collapse.
Merge replaced an earlier match-3 plan because match-3's hand-designed level treadmill is
unsustainable for two people.

**The world stays cozy and botanical.** Bees instead of chickens, a nursery instead of a mine.
Tonal coherence is the cheapest competitive advantage available and the easiest to squander.

**Unity port starts with the platform shell**, not the garden. Store setup, IAP, ad mediation,
analytics, remote config, cloud save.

**Every number must live in data, not code**, wired to remote config. Highest-value technical
constraint on the port.

**Economy is currently a frozen port** from *Idle Garden Reborn* and contains known problems — see
below.

## What to work on next

In order:

1. ~~Lock the resource graph~~ — **done**, see [12-meta-layer-design.md](12-meta-layer-design.md).
2. ~~Spec the order system~~ — **done**, see [13-order-system.md](13-order-system.md).
3. ~~Economy model skeleton~~ — **done**, see [14-economy-model.md](14-economy-model.md). Structure
   is locked; the numbers in it are deliberate placeholders.
4. **Prototype the Garden ↔ Apiary loop** in the web build. Flowers determine honey type, honey
   feeds one Apothecary recipe, pollination boosts garden yield. This is the current task. Smallest
   closed loop that proves interdependence is fun — do it before tuning real numbers or designing
   further regions.
5. **Tune the economy for real**, informed by how the prototype feels.
6. **Fix the known economy bugs** before building content on top of them.

## Known problems worth knowing immediately

Full list in [11-known-issues.md](11-known-issues.md). The three that affect design decisions:

- **The combo does nothing.** It drives the ring visual and tap pitch only, never payout — which
  makes the 2,500-coin Combo Coil badge a dead purchase.
- **Endgame seeds have lower gem chances than a Daisy.** Defining `gemChance` overrides the generous
  5% default, so the best gem farm is spamming the cheapest seed.
- **Cheat buttons ship to players.** Settings has "Grant 50 Gems & Tickets" and "Summon a Wonder
  Effect" with no confirmation, live on the public site.

All inherited from the frozen economy port. Fixing them is a deliberate balance project.

## Model and cost guidance

The owner is cost-sensitive. Tier the work:

| Task | Model |
| --- | --- |
| Architecture, economy math, hard bugs, design advice | Opus 5 thinking or Gemini 3.1 Pro |
| Day-to-day feature work — the default | **Sonnet 5 thinking** |
| Mechanical edits, boilerplate, exploration subagents | Composer 2.5 Fast or Gemini 3 Flash |

Two multipliers:

- **Point cheap models at these docs.** A Sonnet-class model reading
  [09-conventions.md](09-conventions.md) produces better-fitting code than an expensive model
  guessing. This is the main reason the docs exist.
- **Decide expensive, build cheap.** Advisory conversations cost a fraction of code generation. Use
  a strong model to make the call, a cheap one to implement it.

## Briefing a new agent

Paste something like this into a fresh chat:

> I'm building a mobile idle/casual game called Garden Wonder. The repo is my workspace root and
> it's fully documented in `docs/`.
>
> Read `docs/HANDOFF.md` first, then `docs/README.md` for the index. Before writing any code, read
> `docs/09-conventions.md` and `docs/02-architecture.md`.
>
> Current focus is the multi-region meta-layer in `docs/12-meta-layer-design.md`.
>
> I'm the designer; an engineer is porting to Unity. Goal is modest revenue, small scope, two-person
> team. I want you as a design advisor as well as an implementer — push back on scope creep and tell
> me when an idea is a bad one.
>
> [then the specific task]

The point of the docs is that this briefing is short. If a new agent needs more than that, a
document is missing.

## Maintaining this file

At the end of a significant session, update: where the project stands, decisions made, what's next.
Add reasoning to [10-decision-log.md](10-decision-log.md) and prune anything fixed from
[11-known-issues.md](11-known-issues.md).

A full transcript of the founding conversation exists in Cursor's agent history, but it is long and
mostly implementation detail. **These documents are the intended handoff surface** — if something
important lives only in a transcript, move it here.
