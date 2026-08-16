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

If you only read two, read [09-conventions.md](09-conventions.md) and
[02-architecture.md](02-architecture.md).

## The 60-second version

A cozy mobile idle game. You tap a talking flower for coins and plant seeds in eight plots
arranged around it. Seeds grow on a timer, harvests roll a rarity multiplier, and you spend the
proceeds on upgrades that make taps stronger, growth faster, and the whole loop automated.

It is a static site: seven plain `<script>` tags, no build step, no dependencies, no images, and
no audio files. All art is inline SVG and CSS. All sound is synthesized at runtime with the Web
Audio API. It is deployed straight from the repository root to GitHub Pages.

## Keeping these docs current

The point of this folder is that it stays true as the game grows. When you change the game:

1. Update the doc that covers what you changed, in the same commit as the code.
2. Add a dated entry to [10-decision-log.md](10-decision-log.md) explaining *why*, not what.
3. If you found and fixed something in [11-known-issues.md](11-known-issues.md), remove it.
4. If you knowingly left something broken or unfinished, add it there instead.

Numbers matter. Every value quoted in these docs is copied from the code. If you rebalance
something, search the docs folder for the old number — it is probably quoted in more than one
place.

## Legacy material

[`legacy/`](legacy/) holds the original design documents from *Idle Garden Reborn*, the build
that preceded this one. They are kept for historical context and are **not** an accurate
description of the current game. Where they conflict with these docs, they are wrong.

The playable previous build lives in [`../legacy/`](../legacy/) at the repository root.
