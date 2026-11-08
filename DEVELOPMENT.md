# Development

Git tracks the layout bundle `inst/js/tubemap-core.js`. `pnpm bundle` builds it
from `tools/bridge.js` and the `@jbrowse/tubemap-core` release pinned in
`package.json`, and writes that version into its header. The bundle also holds
`tools/walks.js`, the walk-file cut, with `@jbrowse/graph-walks`, and
`tools/v8-host.mjs` for the web globals R's V8 lacks. R serves the cut every
byte range and file size it asks for, through `fetch_range()` and
`fetch_size()`.

ggtubemap copies some files from [ggbandage](https://github.com/GMOD/ggbandage):
`R/import-standalone-*.R`, its byte-range, locus and V8 helpers, and
`tools/v8-host.mjs`. Each copy's header names the ggbandage commit it came from.
ggbandage's
[developing.md](https://github.com/GMOD/ggbandage/blob/main/docs/developing.md)
says why the bytes come from R and how it reads walk files.

The walk-file fixtures in `tests/testthat/testdata` are ggbandage's, in walk
format 7; its `tests/testthat/testdata/build.sh` rebuilds them with
gfa-to-tabix.

- `tools/check-standalone.sh` fails where a copy differs from that commit,
  and with `--latest`, where ggbandage's main has changed the file since
- `tools/check-standalone.sh --update <sha>` copies every file again from that
  ggbandage commit
- The `Standalone files` workflow runs the check on every push, and with
  `--latest` weekly

`pnpm update-core [version]` pins a tubemap-core release, the latest by default,
rebuilds the bundle, and copies that release's goldens into
`tests/testthat/golden` and its example graphs into `inst/extdata`.
`devtools::test()` then checks that V8 lays out exactly as Node does.

`pnpm update-deps [version]` runs `update-core`, then moves the other bundled
packages to their latest releases and the packages they depend on to the
newest their ranges allow, and lists what changed.

- The `Update bundled packages` workflow runs `update-deps` daily, committing
  to main when R CMD check passes
- `@jbrowse` releases go in the day they come out. Others wait three days,
  the `minimumReleaseAge` in `pnpm-workspace.yaml`
- The `Check` workflow runs R CMD check on every other push, and fails if
  `pnpm bundle` would change the tracked bundle
- The `Hosted files` workflow cuts the README's tandem repeat weekly from
  every jbrowse.org walk file the README, `R/data.R` and
  `tools/readme-figures.R` name, since R CMD check never touches the
  network. Run it locally with
  `GGTUBEMAP_HOSTED=true Rscript -e 'testthat::test_local(filter = "hosted")'`

To try unreleased core changes, bundle from a checkout's source instead:

```sh
pnpm install
tools/bundle.sh ../tubemap-core
```

The header then holds the checkout's commit; `pnpm bundle` puts the release
back.
