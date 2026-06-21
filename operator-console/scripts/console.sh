#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${APP_ROOT}/.console.pid"
LOG_FILE="${APP_ROOT}/.console.log"
PORT_VALUE="${PORT:-8765}"
CONFIG_VALUE="${CONFIG:-config.json}"

is_running() {
  local pid="$1"
  kill -0 "${pid}" 2>/dev/null
}

case "${1:-}" in
  start)
    if [ -f "${PID_FILE}" ]; then
      pid="$(cat "${PID_FILE}")"
      if is_running "${pid}"; then
        echo "already running"
        exit 0
      fi
    fi

    (
      cd "${APP_ROOT}"
      uv run --with fastapi --with uvicorn --no-project --python 3.11 python -m console --config "${CONFIG_VALUE}" --host 127.0.0.1 --port "${PORT_VALUE}" > "${LOG_FILE}" 2>&1 &
      echo "$!" > "${PID_FILE}"
    )
    echo "started http://127.0.0.1:${PORT_VALUE}"
    echo "log ${LOG_FILE}"
    ;;
  stop)
    if [ -f "${PID_FILE}" ]; then
      pid="$(cat "${PID_FILE}")"
      kill "${pid}" 2>/dev/null || true
      rm -f "${PID_FILE}"
    fi
    lsof -ti tcp:"${PORT_VALUE}" | xargs kill 2>/dev/null || true
    echo "stopped"
    ;;
  status)
    if [ -f "${PID_FILE}" ]; then
      pid="$(cat "${PID_FILE}")"
      if is_running "${pid}"; then
        echo "running pid ${pid}"
        exit 0
      fi
    fi
    echo "not running"
    ;;
  *)
    echo "usage: console.sh {start|stop|status}" >&2
    exit 2
    ;;
esac
