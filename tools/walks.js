// A region of a gfa-to-tabix --walks file as a tube map's nodes and tracks.
// V8 has no file system or network, so each byte range and file size comes
// from R through console.r.call, and @jbrowse/graph-walks does the cut.
import { WalkReader, walksKept } from '@jbrowse/graph-walks'

import { rangeFile } from './v8-host.mjs'

function openFile(location) {
  return rangeFile('ggtubemap:::fetch_range', 'ggtubemap:::fetch_size', location)
}

// the reference sample's walk first, as a tube map draws its reference on top
function tracksOf({ nodes, walks }, reference) {
  const tracks = []
  for (let p = 0; p < walks.names.length; p++) {
    const sequence = []
    for (let s = walks.offsets[p]; s < walks.offsets[p + 1]; s++) {
      const name = nodes.names[walks.steps[s]]
      sequence.push(walks.reversed[s] ? `-${name}` : name)
    }
    tracks.push({
      name: walks.names[p],
      sequence,
      index_of_first_base: walks.starts[p],
    })
  }
  return tracks.sort((a, b) => (b.name === reference) - (a.name === reference))
}

// R asks for one region and waits for it, so the cut lifts every budget a
// browser window sets and reads every abridged walk in full
globalThis.cutWalks = async function ({
  file,
  refName,
  start,
  end,
  haplotypes,
  context,
}) {
  const reader = WalkReader.open(file, openFile)
  const { references } = await reader.header()
  const sample = references[0] ?? ''
  const anchor = await reader.sequenceFor(sample, refName)
  if (anchor === undefined) {
    const names = await reader.referenceSequences()
    throw new Error(
      `the walk file has no sequence ${refName} on ${sample}; it holds ${names.slice(0, 5).join(', ')}${names.length > 5 ? ', ...' : ''}`,
    )
  }
  const { graph, kept, fragments } = await reader.cut(
    anchor,
    { start, end },
    {
      context,
      keep: walksKept(haplotypes, anchor),
      expand: () => true,
      sequences: true,
      links: false,
      stepBudget: Infinity,
      byteBudget: Infinity,
      departureByteBudget: Infinity,
      attachBp: 0,
      attachFetches: 0,
    },
  )
  const tables = graph.tables(kept, fragments, [])
  const seq = tables.nodes.names.map(name => graph.sequences.get(Number(name)) ?? null)
  return JSON.stringify({
    nodes: {
      name: tables.nodes.names,
      seq,
      sequence_length: [...tables.nodes.lengths],
    },
    tracks: tracksOf(tables, anchor),
  })
}
