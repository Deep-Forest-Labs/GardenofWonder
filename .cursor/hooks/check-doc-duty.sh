#!/bin/bash
# Catches the failure the AGENTS.md checklist exists to prevent: code shipped in a
# commit with no matching documentation change.
#
# Gated on commits rather than the working tree, because "same commit as the code" is
# the actual rule and because a commit is the only reliable "I'm finished" signal —
# checking the working tree would nag halfway through a task.
#
# Fails open everywhere. A documentation reminder must never block real work.

cat > /dev/null

pass() { echo '{}'; exit 0; }

command -v jq > /dev/null 2>&1 || pass

root=$(git rev-parse --show-toplevel 2>/dev/null) || pass
cd "$root" || pass
gitdir=$(git rev-parse --git-dir 2>/dev/null) || pass
head=$(git rev-parse HEAD 2>/dev/null) || pass

baseline_file="$gitdir/cursor-doc-baseline"
nagged_file="$gitdir/cursor-doc-nagged"

# No baseline means the session predates the hook. Start one and stay quiet.
if [ ! -f "$baseline_file" ]; then
  echo "$head" > "$baseline_file"
  pass
fi

baseline=$(cat "$baseline_file")
if ! git cat-file -e "${baseline}^{commit}" 2>/dev/null; then
  echo "$head" > "$baseline_file"
  pass
fi

# One reminder per commit. Re-nagging every turn would just train people to ignore it.
if [ -f "$nagged_file" ] && [ "$(cat "$nagged_file")" = "$head" ]; then
  pass
fi

committed=$(git diff --name-only "$baseline" "$head" 2>/dev/null)
[ -n "$committed" ] || pass

# legacy/ is a frozen prior build and .cursor/ is tooling; neither describes the game.
code=$(printf '%s\n' "$committed" | grep -E '\.(js|css|html)$' | grep -v '^legacy/' | grep -v '^\.cursor/')
docs=$(printf '%s\n' "$committed" | grep -E '^(docs/|AGENTS\.md$)')
staged=$(git status --porcelain 2>/dev/null | awk '{ print $NF }' | grep -E '^(docs/|AGENTS\.md$)')

if [ -z "$code" ] || [ -n "$docs" ] || [ -n "$staged" ]; then
  echo "$head" > "$baseline_file"
  pass
fi

echo "$head" > "$nagged_file"

changed=$(printf '%s\n' "$code" | head -8 | tr '\n' ' ')

jq -n --arg files "$changed" '{
  followup_message: (
    "Documentation duty — this session committed code but nothing under docs/.\n\nChanged: " + $files +
    "\n\nAGENTS.md \"Definition of done\" asks for the docs in the same commit as the code:\n" +
    "1. Update the doc that owns what changed (03-systems, 04-economy, 07-save-data, 08-ui-and-layout, 06-audio-and-fx).\n" +
    "2. Grep docs/ for any number you changed — values are quoted by hand in more than one place.\n" +
    "3. Add a dated entry to docs/10-decision-log.md: the reasoning and what you rejected, not the diff.\n" +
    "4. Prune docs/11-known-issues.md of anything you fixed; add anything you knowingly left broken.\n" +
    "5. Rewrite docs/HANDOFF.md last, from those docs rather than from memory.\n\n" +
    "Then commit the doc updates. If this change genuinely needs no documentation — tooling, hooks, " +
    "formatting — say so in one line and stop."
  )
}'
exit 0
