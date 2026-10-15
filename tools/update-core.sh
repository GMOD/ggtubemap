#!/usr/bin/env bash
# Moves ggtubemap to a release of @jbrowse/tubemap-core, the latest by default:
# pins it, rebuilds the bundle, and copies in that release's goldens and
# example graphs, so the tests hold V8 to the layouts the same release
# makes under Node.
set -euo pipefail
cd "$(dirname "$0")/.."

version=${1:-$(npm view @jbrowse/tubemap-core version)}
pnpm add --save-dev --save-exact "@jbrowse/tubemap-core@$version"
tools/bundle.sh

upstream=$(mktemp -d)
trap 'rm -rf "$upstream"' EXIT
git -c advice.detachedHead=false clone --quiet --depth 1 --branch "v$version" \
  https://github.com/GMOD/tubemap-core.git "$upstream"

# Refresh the files already here by name, so an upstream rename fails loudly
# rather than leaving a stale copy behind
for file in tests/testthat/golden/*.json; do
  name=$(basename "$file")
  case $name in
    *.input.json) cp "$upstream/test/fixtures/${name%.input.json}.json" "$file" ;;
    *) cp "$upstream/test/layout-golden/$name" "$file" ;;
  esac
done
for file in inst/extdata/*.json; do
  cp "$upstream/test/fixtures/$(basename "$file")" "$file"
done
echo "ggtubemap now bundles @jbrowse/tubemap-core $version"
