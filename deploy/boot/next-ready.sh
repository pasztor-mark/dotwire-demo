#!/bin/sh
# Wait for Next.js, then load the presend route once before declaring the app ready. dotwire's
# presend call has a 500 ms budget and fails closed, so the first message after a cold boot would
# otherwise pay for compiling/loading that route chunk and could be rejected.
set -eu

/etc/dw-boot/wait-ready.sh app http://127.0.0.1:3000/api/health 60 || exit 1
# GET on a POST-only route answers 405, which still loads the module; wget's non-zero exit is expected.
wget -q -O /dev/null http://127.0.0.1:3000/api/hooks/presend 2>/dev/null || true
