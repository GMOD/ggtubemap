// The bundle's header: the core version it carries and that version's license
import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = new URL('../node_modules/@jbrowse/tubemap-core/', import.meta.url)
const { version } = JSON.parse(readFileSync(new URL('package.json', dir), 'utf8'))
// a linked checkout can run ahead of its version, so name the commit too
let commit = ''
try {
  commit = ` (${execFileSync(
    'git',
    ['-C', realpathSync(fileURLToPath(dir)), 'describe', '--tags', '--always', '--dirty'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  ).trim()})`
} catch {}
const license = readFileSync(new URL('LICENSE', dir), 'utf8')
  .trim()
  .split('\n')
  .map(line => ` * ${line}`.trimEnd())
  .join('\n')
process.stdout.write(
  `/*\n * @jbrowse/tubemap-core ${version}${commit}, bundled by tools/bridge.js\n *\n${license}\n */`,
)
