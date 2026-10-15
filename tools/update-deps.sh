#!/usr/bin/env bash
# Moves every bundled package to its latest release, and the packages they
# depend on to the newest their ranges allow, then rebuilds the bundle.
# tubemap-core goes through update-core.sh, which also copies in that
# release's goldens and example graphs; give a version to take that one.
# pnpm-workspace.yaml's minimumReleaseAge holds a release back three days,
# except the @jbrowse packages. Prints what changed, one `name old -> new` per
# line.
set -euo pipefail
cd "$(dirname "$0")/.."

before=$(pnpm list --depth Infinity --json)
tools/update-core.sh "${1:-}" >&2
pnpm update --latest --silent
tools/bundle.sh >&2
after=$(pnpm list --depth Infinity --json)

node -e '
  const walk = (tree, out = new Map()) => {
    for (const [name, dep] of Object.entries(tree ?? {})) {
      out.set(name, dep.version)
      walk(dep.dependencies, out)
    }
    return out
  }
  const [before, after] = process.argv.slice(1).map(json => {
    const [project] = JSON.parse(json)
    return walk({ ...project.dependencies, ...project.devDependencies })
  })
  for (const [name, version] of after) {
    if (before.get(name) !== version) {
      console.log(`${name} ${before.get(name) ?? "(new)"} -> ${version}`)
    }
  }
' "$before" "$after"
