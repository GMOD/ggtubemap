#!/usr/bin/env bash
# Builds inst/js/tubemap-core.js from the pinned @jbrowse/tubemap-core release,
# or, given the path of a tubemap-core checkout, from its source, to try
# changes that are not released yet.
set -euo pipefail
cd "$(dirname "$0")/.."

core=${1:-}
alias=()
if [ -n "$core" ]; then
  core=$(realpath "$core")
  alias=(--alias:@jbrowse/tubemap-core="$core/src/index.ts")
fi

pnpm exec esbuild tools/bridge.js --bundle --format=iife --target=es2020 \
  --legal-comments=inline "${alias[@]}" \
  --banner:js="$(node tools/banner.js ${core:+"$core"})" \
  --outfile=inst/js/tubemap-core.js
