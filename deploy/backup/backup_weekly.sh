#!/bin/bash
# Pings /fail on error so Better Stack alerts right away instead of after the grace period.
HEARTBEAT_URL=https://incidents.betterstack.com/api/v1/heartbeat/<weekly-heartbeat-token>

cd /root
if ./embedg-server backup postgres create --name "weekly$(( 10#$(date +%V) % 3 ))"; then
  curl -fsS -m 10 --retry 3 -o /dev/null "$HEARTBEAT_URL"
else
  curl -fsS -m 10 --retry 3 -o /dev/null "$HEARTBEAT_URL/fail"
  exit 1
fi
