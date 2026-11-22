#!/bin/sh
# wait-ready.sh <step> <url> <timeoutSec> — poll until <url> answers 2xx, then mark <step> done.
# A timeout exits 1; with S6_BEHAVIOUR_IF_STAGE2_FAILS=2 that stops the container.
set -eu

step=$1 url=$2 timeout=$3
deadline=$(( $(date +%s) + timeout ))
until wget -q -O /dev/null "$url"; do
  [ "$(date +%s)" -lt "$deadline" ] || { echo "wait-ready: $step not ready after ${timeout}s" >&2; exit 1; }
  sleep 0.5
done
/etc/dw-boot/status.sh "$step"
