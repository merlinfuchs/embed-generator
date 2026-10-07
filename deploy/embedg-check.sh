#!/bin/sh
# One monitoring sample of embedg-server, scoped to the currently running PID.
PID=$(systemctl show embedg-server -p MainPID --value)
START=$(systemctl show embedg-server -p ExecMainStartTimestamp --value)
echo "ts=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "pid=$PID restarts=$(systemctl show embedg-server -p NRestarts --value) state=$(systemctl show embedg-server -p ActiveState --value)"
echo "started=$START"
echo "cpu_rss_elapsed=$(ps -p "$PID" -o pcpu=,rss=,etime= 2>/dev/null)"
echo "load=$(cut -d' ' -f1-3 /proc/loadavg)"
echo "panics=$(journalctl -u embedg-server _PID="$PID" --no-pager 2>/dev/null | grep -c 'panic:')"
echo "err50035=$(journalctl -u embedg-server _PID="$PID" --no-pager 2>/dev/null | grep -c '50035')"
echo "errors=$(journalctl -u embedg-server _PID="$PID" --no-pager 2>/dev/null | grep -c ' ERR ')"
echo "goroutines=$(curl -s 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=1' | head -1 | awk '{print $NF}')"
echo "identifying=$(curl -s 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=1' | grep -c 'identifyRateLimiterImpl')"
