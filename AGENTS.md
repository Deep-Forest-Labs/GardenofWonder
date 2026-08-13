# Working in this repo

Garden Wonder — a mobile idle/casual game. Static site, no build step, deployed straight from the
repository root to GitHub Pages.

`docs/` is the source of truth. This file exists only to state the things that must be true at the
*end* of a task, since by then the docs you read at the start are long out of context. **If this
file and `docs/` disagree, `docs/` is right and this file is a bug.**

## Before you write code

Read [docs/HANDOFF.md](docs/HANDOFF.md) for where the project stands, then
[docs/09-conventions.md](docs/09-conventions.md) before your first line.
[docs/README.md](docs/README.md) indexes the rest.

Two sections earn their reading time even under pressure: **"Traps in this codebase"** in the
handoff, and the playbook in the conventions doc matching what you're about to add.

## Non-negotiables

No build step. No dependencies. No binary assets — SVG and synthesized audio only. No
`<script type="module">`. Relative paths only, never a leading slash. `game.js` never touches the
DOM; `ui.js` never does economy math.

## Verifying

Run `node tools/sim-test.js` and `node --check` on every file you touched. Add sim-test coverage for
anything you changed in the economy — the suite is the cheapest check in the project and it should
grow with the game.

## Definition of done

A task is not finished when the code works. It is finished when the docs are true again. Work
through this in order, in the **same commit** as the code:

1. **Update the doc that owns what you changed.** A mechanic goes in `03-systems.md`, a number in
   `04-economy.md`, saved state in `07-save-data.md`, layout in `08-ui-and-layout.md`, sound and
   juice in `06-audio-and-fx.md`.
2. **Grep `docs/` for any number you changed.** Values are copied into the docs by hand and are
   usually quoted in more than one place.
3. **Add a dated entry to `10-decision-log.md`** — the reasoning, not the diff. Git has the diff.
   Include what you rejected and why; that's the part nobody can reconstruct later.
4. **Prune `11-known-issues.md`** of anything you fixed, and add anything you knowingly left broken.
5. **Update `HANDOFF.md` last**, from the docs above rather than from memory: where the project
   stands, the current task, what comes after, and any new trap you hit.

`HANDOFF.md` is **derived, never authored alone.** It summarizes the other documents, so a handoff
written without steps 1–4 will confidently describe a game that the specific docs contradict — and
the next agent will believe the specific doc. Written in this order the handoff is nearly free,
because every fact is already on the page and you're summarizing your own writing rather than a long
session you half remember.

**"Write a handoff" means run all five steps, not just step 5.**

A `stop` hook in `.cursor/hooks.json` checks this. If the session commits code without touching
`docs/`, it says so once. It is a reminder, not a gate — if a change genuinely needs no
documentation, say so in a line and move on.

## Working with the owner

The owner is the designer; an engineer ports the result to Unity. Small team, modest revenue goal,
deliberately small scope. Act as a design advisor as well as an implementer: push back on scope
creep, and say so plainly when an idea is a bad one.
