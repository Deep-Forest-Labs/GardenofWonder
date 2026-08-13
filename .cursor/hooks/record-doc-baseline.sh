#!/bin/bash
# Records the commit the session started from, so check-doc-duty.sh can tell which
# commits this session is responsible for. Fails open — nothing here may block work.

cat > /dev/null

finish() { echo '{}'; exit 0; }

root=$(git rev-parse --show-toplevel 2>/dev/null) || finish
cd "$root" || finish
gitdir=$(git rev-parse --git-dir 2>/dev/null) || finish

git rev-parse HEAD > "$gitdir/cursor-doc-baseline" 2>/dev/null
rm -f "$gitdir/cursor-doc-nagged"

finish
