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

Once you know what you're touching, ask the graph before you go reading source files by hand — see
"Finding your way: graft" in [docs/09-conventions.md](docs/09-conventions.md) and the fenced section
below.

## Non-negotiables

No build step. No dependencies. No binary assets — SVG and synthesized audio only. No
`<script type="module">`. Relative paths only, never a leading slash. `game.js` never touches the
DOM; `ui.js` never does economy math.

## Verifying

Run `node tools/sim-test.js` and `node --check` on every file you touched. If you touched a
`ui-*.js` file or `index.html`, run `node tools/html-check.js` — it holds the one rule in
[docs/11-known-issues.md](docs/11-known-issues.md) that a script can hold: player-typed text never
enters a template literal. If you touched `style.css`, run `node tools/style-check.js` — it holds the four rules in
[docs/05-art-direction.md](docs/05-art-direction.md) that a script can hold, and it fails on new
drift rather than on the debt already there.
`node tools/probe.js shot:after` screenshots the running game in headless Chrome when you cannot
open it yourself — see [docs/24-remote-sessions.md](docs/24-remote-sessions.md), which also covers
why a session working from a phone commits to a branch rather than `main`. Add sim-test coverage for
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

**And one more, for anything a player can see.** A change a player would notice adds **one plain
sentence to `DATA.changelog`** in `data.js`, in the same commit — the words of the glossary at the
top of [docs/32-the-garden-year.md](docs/32-the-garden-year.md), not the words of the code. Newest
entry first; append a line to today's entry if there is one, and start a new dated entry if there is
not. **A shipped entry's date is its identity and must never be edited** — the seen-marker records
dates, so changing one re-shows the whole entry to everybody. If a change is genuinely invisible to
a player, it adds nothing, and saying so in a line is the right answer.

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

**Talk to the owner like a game designer, not a mathematician** (their standing request,
2026-08-30). Lead with how it feels to play, use the plain words in the glossary at the top of
[docs/32-the-garden-year.md](docs/32-the-garden-year.md), and keep formulas and derivations in
the docs — the owner reads flows and pictures faster than equations.

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
