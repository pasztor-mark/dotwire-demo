#!/bin/sh
# status.sh [step] — mark a step done (if given), then rewrite /run/dw/status.json atomically.
# Served by Caddy at /__status for deploy/loading.html.
set -eu

dir=/run/dw
[ $# -gt 0 ] && touch "$dir/steps/$1"

flag() { if [ -e "$dir/steps/$1" ]; then printf true; else printf false; fi; }
printf '{"steps":{"database":%s,"bus":%s,"gateway":%s,"app":%s}}\n' \
  "$(flag database)" "$(flag bus)" "$(flag gateway)" "$(flag app)" > "$dir/status.json.tmp"
chmod 644 "$dir/status.json.tmp"
mv "$dir/status.json.tmp" "$dir/status.json"
