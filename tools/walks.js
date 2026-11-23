// A region of a gfa-to-tabix --walks file as a tube map's nodes and tracks.
// V8 has no file system or network, so each byte range and file size comes
// from R through console.r.call, and @jbrowse/graph-walks does the cut.
import { foldGraph } from '@jbrowse/graph-fold'
import { CUT_PRESETS, departureKind, WalkReader, walksKept } from '@jbrowse/graph-walks'

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

// A figure's cut: the browser readers' rules, so a region draws the graph they
// draw, with the budgets a browser window sets lifted, since R asks for one
// region and waits for it; every abridged walk read in full
globalThis.cutWalks = async function ({
  file,
  refName,
  start,
  end,
  haplotypes,
  context,
  fold,
  cluster,
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
  const { graph, kept, fragments, departures } = await reader.cut(
    anchor,
    { start, end },
    {
      ...CUT_PRESETS.figure,
      ...(context === undefined ? {} : { context }),
      keep: walksKept(haplotypes, anchor),
      expand: () => true,
      sequences: true,
      links: 'none',
    },
  )
  const tables = graph.tables(kept, fragments, [])
  const seq = tables.nodes.names.map(name => graph.sequences.get(Number(name)) ?? null)
  const nodes = {
    name: tables.nodes.names,
    seq,
    sequence_length: [...tables.nodes.lengths],
  }
  const cut = {
    nodes,
    tracks: tracksOf(tables, anchor),
    absent: absentDepartures(fragments, departures),
  }
  return JSON.stringify(
    fold === undefined
      ? cut
      : foldedCut(cut, {
          threshold: fold,
          cluster,
          referenceRevisits: tables.revisited,
        }),
  )
}

// A cut as cutWalks returns it, with graph-fold's options beside its fields,
// folded: for a caller that has the cut already
globalThis.foldCut = function (requestJson) {
  const { threshold, cluster, referenceRevisits, ...cut } = JSON.parse(requestJson)
  return JSON.stringify(foldedCut(cut, { threshold, cluster, referenceRevisits }))
}

function foldedCut({ nodes, tracks, absent }, options) {
  return {
    ...foldedWindow(nodes, tracks, options),
    drawn: tracks.map(t => t.name),
    absent,
  }
}

function foldedTrackName({ names, freq }) {
  return freq > 1 ? `${freq} haplotypes: ${names[0]}, ...` : names[0]
}

function spread(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = (sorted.length - 1) / 2
  return {
    min: sorted[0],
    median: (sorted[Math.floor(middle)] + sorted[Math.ceil(middle)]) / 2,
    max: sorted.at(-1),
  }
}

// What each folded tube stands for: its haplotypes, the distinct walks they
// took before folding, and how much each had inserted or skipped under the
// threshold. graph-fold is to report this itself; until then it is counted
// here from the walks, input track i being walk i
function tubeTable(result, tracks) {
  const tubes = result.tracks.map((_, track) => {
    const members = result.walks.flatMap((walk, i) =>
      walk.track === track ? [{ walk, sequence: tracks[i].sequence.join() }] : [],
    )
    const perHaplotype = amount =>
      spread(members.flatMap(({ walk }) => Array(walk.freq).fill(walk[amount])))
    return {
      haplotypes: members.reduce((sum, { walk }) => sum + walk.freq, 0),
      walks: new Set(members.map(m => m.sequence)).size,
      inserted: perHaplotype('insertedBp'),
      skipped: perHaplotype('skippedBp'),
    }
  })
  return {
    track: tubes.map((_, i) => i + 1),
    haplotypes: tubes.map(t => t.haplotypes),
    walks: tubes.map(t => t.walks),
    inserted_bp_min: tubes.map(t => t.inserted.min),
    inserted_bp_median: tubes.map(t => t.inserted.median),
    inserted_bp_max: tubes.map(t => t.inserted.max),
    skipped_bp_min: tubes.map(t => t.skipped.min),
    skipped_bp_median: tubes.map(t => t.skipped.median),
    skipped_bp_max: tubes.map(t => t.skipped.max),
  }
}

function branchTable(branches) {
  return {
    kind: branches.map(b => b.kind),
    description: branches.map(b => b.description),
    length: branches.map(b => b.length),
    inserted_bp: branches.map(b => b.insertedBp),
    deleted_bp: branches.map(b => b.deletedBp),
    ref_start: branches.map(b => b.refStart),
    ref_end: branches.map(b => b.refEnd),
    haplotypes: branches.map(b => b.haplotypes),
    open: branches.map(b => b.open === true),
    from: branches.map(b => b.from ?? null),
    to: branches.map(b => b.to ?? null),
    nodes: branches.map(b => b.nodes),
    cluster_members: branches.map(b => b.cluster?.members ?? null),
    cluster_min_length: branches.map(b => b.cluster?.minLength ?? null),
    cluster_max_length: branches.map(b => b.cluster?.maxLength ?? null),
  }
}

// The window with its small variation merged into the reference by
// @jbrowse/graph-fold, or as it came with the reason it cannot be folded
function foldedWindow(nodes, tracks, options) {
  const result = foldGraph(
    nodes.name.map((name, i) => ({ name, sequenceLength: nodes.sequence_length[i] })),
    tracks.map(t => ({
      name: t.name,
      sequence: t.sequence,
      indexOfFirstBase: t.index_of_first_base,
    })),
    options,
  )
  const fold = {
    folded: result.folded,
    reason: result.reason ?? null,
    threshold: result.threshold,
    cluster: options.cluster === true,
    haplotypes: result.tracks.reduce((sum, t) => sum + t.freq, 0),
    walks: tracks.length,
  }
  return result.folded
    ? {
        nodes: {
          name: result.nodes.map(n => n.name),
          seq: result.nodes.map(() => null),
          sequence_length: result.nodes.map(n => n.sequenceLength),
        },
        tracks: result.tracks.map(t => ({
          name: foldedTrackName(t),
          sequence: t.sequence,
          ...(t.indexOfFirstBase === undefined
            ? {}
            : { index_of_first_base: t.indexOfFirstBase }),
          freq: t.freq,
          haplotypes: t.names,
        })),
        fold,
        branches: branchTable(result.branches),
        tubes: tubeTable(result, tracks),
      }
    : { nodes, tracks, fold, branches: branchTable([]), tubes: tubeTable(result, tracks) }
}

// where each walk the cut drew no track for leaves the reference and rejoins
// it, for R to say what it does over the window
function absentDepartures(fragments, departures) {
  const drawn = new Set(fragments.map(f => f.name))
  const absent = departures.filter(d => !drawn.has(d.name))
  return {
    name: absent.map(d => d.name),
    from: absent.map(d => Math.min(d.leavePos, d.rejoinPos)),
    to: absent.map(d => Math.max(d.leavePos, d.rejoinPos)),
    own_bp: absent.map(d => d.ownBp),
    missing_bp: absent.map(d => d.missingBp),
    switch: absent.map(d => departureKind(d) === 'switch'),
  }
}
