# Garden Wonder — Documentation

This folder is the source of truth for how Garden Wonder works. It exists so that a person or
agent who has never seen the project can get productive without reverse-engineering the code.

Everything here describes the game **as it is currently built**, not as it was once planned.
If a document and the code disagree, the code is right and the document is a bug — fix it.

## Start here

**[HANDOFF.md](HANDOFF.md)** — current state, decisions already made, and what to work on next.
Read it before anything else if you're picking the project up cold.

## Read these in order

| Doc | Read it when |
| --- | --- |
| [01-overview.md](01-overview.md) | You want to know what the game is and what it's trying to feel like |
| [02-architecture.md](02-architecture.md) | You're about to touch code and need the module map |
| [03-systems.md](03-systems.md) | You need to know how a mechanic actually behaves |
| [04-economy.md](04-economy.md) | You're balancing numbers or adding content |
| [05-art-direction.md](05-art-direction.md) | You're drawing, styling, or animating anything |
| [06-audio-and-fx.md](06-audio-and-fx.md) | You're adding sound, particles, or game feel |
| [07-save-data.md](07-save-data.md) | You're changing the shape of saved state |
| [08-ui-and-layout.md](08-ui-and-layout.md) | You're changing layout, the sheet, or accessibility |
| [09-conventions.md](09-conventions.md) | **Before you write your first line of code** |
| [10-decision-log.md](10-decision-log.md) | You want to know why something is the way it is |
| [11-known-issues.md](11-known-issues.md) | Something looks wrong and you want to know if it's known |
| [12-meta-layer-design.md](12-meta-layer-design.md) | You're working on the multi-region world — **design, not built yet** |
| [13-order-system.md](13-order-system.md) | You're building the Market, the engine that drives the whole graph |
| [14-economy-model.md](14-economy-model.md) | You're authoring resources, recipes or tuning numbers |
| [15-navigation-and-ia.md](15-navigation-and-ia.md) | You're touching the dock, tabs, menus or where a feature lives |
| [16-progression-and-quests.md](16-progression-and-quests.md) | You're working on quests, levels, reputation, boosts or the Almanac — **phases 1–5 built, phase 6 specified** |
| [17-market-and-positioning.md](17-market-and-positioning.md) | You want to know who this game is for, what it competes with, or why an individual flower should be worth wanting — **research, not the game** |
| [18-mutations-and-weather.md](18-mutations-and-weather.md) | You're building weather or mutations — **specified, not built** |
| [19-card-album.md](19-card-album.md) | You're building card packs, sets, seasons or the album — a parallel meta, **deliberately independent of the garden** |
| [20-card-art-prompts.md](20-card-art-prompts.md) | You're generating card art externally and want the prompts, the style rules and how it gets wired in |
| [21-potting-bench.md](21-potting-bench.md) | You're touching the merge bench — the chain, entry tier, cascade timing, the deadlock, or what replaced the Apothecary |
| [22-creatures.md](22-creatures.md) | You're adding a creature, or touching attraction, keepsakes or the critter yard — the habitat direction |
| [23-installable-pwa.md](23-installable-pwa.md) | You're touching `manifest.json`, `sw.js`, the icons, or you added a script file and need it to work offline |
| [24-remote-sessions.md](24-remote-sessions.md) | You're working on the game from a phone or the web, without the Mac — the clone-and-push loop, `tools/probe.js`, and why a remote session works on a branch |
| [25-world-map.md](25-world-map.md) | You're working on the world map — what the farming market says, what belongs on the map and in what order, and why it is not ten gardens — **research and design, not built** |
| [26-goods-catalog.md](26-goods-catalog.md) | You're adding a good, a crop, or an order family — the six families, the three production shapes, the one-line test, and the rollout — **design, not built** |
| [27-design-audit.md](27-design-audit.md) | You want the honest state of the design as a whole — what is strong, what is redundant, what is missing, what should be cut, and in what order to settle it — **audit and recommendation, not decision** |
| [28-the-loop.md](28-the-loop.md) | You want to know what a session is, what the player's job is after automation, and what is scarce — and why merge moves to the centre while the garden stays the home screen — **proposal, not built** |
| [29-direction-and-odds.md](29-direction-and-odds.md) | You are deciding what game this is, or whether the genre is too crowded to enter — four directions with the odds on each, what the four distribution channels actually reward, and why the hook shipped by accident — **analysis, not the game** |
| [30-prestige-directions.md](30-prestige-directions.md) | You're designing the prestige system — five priced options, why a bounded economy cannot prestige, how the one-number rule bends, and what never resets — **analysis and recommendation, not built** |
| [31-per-seed-prestige.md](31-per-seed-prestige.md) | You're building the prestige system — the per-seed upgrade design pressure-tested: the currency formula, the unlock-price spread, the wall size, the tree surface rules, and the 25 invariants it touches — **the current design, not built** |
| [32-the-garden-year.md](32-the-garden-year.md) | You're building the Year — the seasonal world, the Turn, Saved Seeds, petals, orders-in-the-year, the never-resets partition, and the build slices — **the master design; the engine is BUILT (phase 1, 2026-08-29), the surfaces are not** |
| [33-year-one-economy.md](33-year-one-economy.md) | You're tuning or building the Year's numbers — unlock prices, the mint, petal costs and effects, the launch six signatures, Fall's plants, migration, and the sim-test bill — **the engine half is built; the surfaces arrive in phases 2–3** |
| [34-build-plan.md](34-build-plan.md) | You're building the Year or kicking off a builder session — the phases, the review gates, the critic gauntlet every phase runs, and the paste-ready prompts — **the build plan; phase 1 is built and reviewed, awaiting the owner's verdict** |
| [36-hud-and-dock.md](36-hud-and-dock.md) | You're touching the dock, the HUD's bottom half, or the Turn button — the Big Five spec, what retires into it, and the gate questions — **owner-specced, not built** |
| [37-monetization.md](37-monetization.md) | You're touching ads or purchases — the two promises, the ship-first placements, the store shelf, and the never-sell table with reasons — **the plan, owner picking, nothing built** |
| [38-market-refresh.md](38-market-refresh.md) | You want the lane as it stands now — the four numbers doc 17 quotes that don't hold, the fourteen competitors it never named, the coded complaint pile, the positioning map, and the answer to whether anyone else has a prestige loop — **research, not the game** |
| [41-the-preserve.md](41-the-preserve.md) | You're touching what fills an order, or the Turn's partition — last year's harvest becomes pressed flowers and kept jars, craftable but no longer a thing a customer will take — **owner-ruled, specced, not built** |
| [39-growth-and-launch.md](39-growth-and-launch.md) | You're planning a launch — the dated calendar from September 2026 to June 2027, the Reddit playbook, the ASO correction, what in this game is actually filmable, and the one sentence with the fork underneath it — **plan, owner picking** |
| [40-financial-model.md](40-financial-model.md) | You want to know what any of this earns — three scenarios in plain tables, the install volume needed to hold them, the cost side, the kill/scale signals, and the 2026 rules that change the plan; math in an appendix — **model, owner picking** |
| [41-weather-staging.md](41-weather-staging.md) | You're staging the sky — the Weather Ladder, the fronts, the motion gate, and the two math nudges — **owner-specced, not built** |
| [42-overnight-housekeeping.md](42-overnight-housekeeping.md) | You're wondering what the overnight round of 2026-08-30 did — the style check, the hex sweep, the bars, and the four things it filed rather than decided — **done, with a two-minute morning check** |

If you only read two, read [09-conventions.md](09-conventions.md) and
[02-architecture.md](02-architecture.md).

## The 60-second version

A cozy mobile idle game. You tap a talking flower for coins and plant seeds in eight plots
arranged around it. Seeds grow on a timer, harvests roll a rarity multiplier, and you spend the
proceeds on upgrades that make taps stronger, growth faster, and the whole loop automated.

It is a static site: nineteen plain `<script>` tags, no build step, no dependencies, and no audio
files. All art is inline SVG and CSS. All sound is synthesized at runtime with the Web Audio API.
It is deployed straight from the repository root to GitHub Pages, and installs to a phone's home
screen as a PWA that plays offline — see [23-installable-pwa.md](23-installable-pwa.md). The only
binary files in the repository are the home screen icons in `icons/`.

## Keeping these docs current

The point of this folder is that it stays true as the game grows. When you change the game:

1. Update the doc that covers what you changed, in the same commit as the code.
2. Add a dated entry to [10-decision-log.md](10-decision-log.md) explaining *why*, not what.
3. If you found and fixed something in [11-known-issues.md](11-known-issues.md), remove it.
4. If you knowingly left something broken or unfinished, add it there instead.
5. Run `node tools/wiki-sync.js` last, once the docs above are true — it mirrors this folder to
   the wiki.

Numbers matter. Every value quoted in these docs is copied from the code. If you rebalance
something, search the docs folder for the old number — it is probably quoted in more than one
place.

The wiki is a mirror, not a second place to write. `tools/wiki-sync.js` copies this folder to the
project's [GitHub wiki](https://github.com/Deep-Forest-Labs/GardenofWonder/wiki) so the Unity
engineers can read the design in a browser without cloning the repo, rewriting the links on the way
— wiki page URLs carry no `.md`, so an unrewritten link 404s. Every run overwrites the wiki
wholesale, so **nothing is ever edited on the wiki side**: an edit made there survives until the
next sync and then vanishes, unreviewed and unrecorded. If something on the wiki is wrong, it is
wrong here — fix it in `docs/` and run the sync again. `legacy/` is deliberately not mirrored.

## Legacy material

[`legacy/`](legacy/) holds the original design documents from *Idle Garden Reborn*, the build
that preceded this one. They are kept for historical context and are **not** an accurate
description of the current game. Where they conflict with these docs, they are wrong.

The playable previous build lives in [`../legacy/`](../legacy/) at the repository root.
