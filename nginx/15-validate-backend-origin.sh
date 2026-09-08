#!/bin/sh

set -eu

if [ -z "${BACKEND_ORIGIN:-}" ]; then
  echo >&2 "ERROR: BACKEND_ORIGIN is required (for example, https://backend.example.com)."
  exit 1
fi

if ! printf '%s\n' "$BACKEND_ORIGIN" | grep -Eq '^https?://(\[[0-9A-Fa-f:.]+\]|[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?)(:[0-9]{1,5})?$'; then
  echo >&2 "ERROR: BACKEND_ORIGIN must contain only an http(s) scheme and authority, without credentials, path, query, fragment, or trailing slash."
  exit 1
fi

authority=${BACKEND_ORIGIN#*://}
port=
case "$authority" in
  \[*\]) ;;
  *:*) port=${authority##*:} ;;
esac

if [ -n "$port" ] && { [ "$port" -eq 0 ] || [ "$port" -gt 65535 ]; }; then
  echo >&2 "ERROR: BACKEND_ORIGIN port must be between 1 and 65535."
  exit 1
fi
