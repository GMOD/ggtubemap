// The bundle's header: the core version it carries and that version's license.
// A checkout can run ahead of its version, so one given as an argument is
// named by its commit too.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const checkout = process.argv[2]
const dir = checkout
  ? pathToFileURL(`${checkout}/`)
  : new URL('../node_modules/@jbrowse/tubemap-core/', import.meta.url)
const { version } = JSON.parse(readFileSync(new URL('package.json', dir), 'utf8'))
const commit = checkout
  ? ` (${execFileSync('git', ['-C', checkout, 'describe', '--tags', '--always', '--dirty'], {
      encoding: 'utf8',
    }).trim()})`
  : ''
const license = readFileSync(new URL('LICENSE', dir), 'utf8')
  .trim()
  .split('\n')
  .map(line => ` * ${line}`.trimEnd())
  .join('\n')
process.stdout.write(
  `/*\n * @jbrowse/tubemap-core ${version}${commit}, bundled by tools/bridge.js\n *\n${license}\n */`,
)
