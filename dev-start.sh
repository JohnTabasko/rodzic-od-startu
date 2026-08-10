#!/bin/bash
# Start podglądu web z auto-odtwarzaniem zależności (sandbox czyszcący node_modules)
cd "$(dirname "$0")"
[ -d node_modules/expo ] || { echo "→ odtwarzam node_modules..."; npm ci --no-audit --no-fund --silent; }
echo "→ startuję Expo web na :8081"
exec npx expo start --web --port 8081 --host lan
