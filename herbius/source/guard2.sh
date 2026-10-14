#!/usr/bin/env bash
# Run a command on 2 cores with a k10temp watchdog that kills it at 88°C.
# Usage: guard2.sh <cmd...>
taskset -c 0,1 "$@" &
JOB=$!
while kill -0 "$JOB" 2>/dev/null; do
  t=$(cat /sys/class/hwmon/hwmon*/temp1_input 2>/dev/null | sort -n | tail -1)
  if [ -n "$t" ] && [ "$t" -ge 88000 ]; then
    echo "guard2: ${t} mC, killing job $JOB" >&2
    kill -TERM -- "$JOB" 2>/dev/null; sleep 1; kill -KILL -- "$JOB" 2>/dev/null
    exit 99
  fi
  sleep 1
done
wait "$JOB"
