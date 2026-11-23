// A region of a gfa-to-tabix --walks file as a tube map's nodes and tracks.
// V8 has no file system or network, so each byte range and file size comes
// from R through console.r.call, and @jbrowse/graph-walks does the cut.
import { branchLabel, foldGraph, variationLabel } from '@jbrowse/graph-fold'
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

// graph-fold's label for a track, `439 haplotypes` or the one walk's name,
// which the legend prints. Two tracks of one count share a label, so those
// also name their first walk
function legendNames(tracks) {
  const count = new Map()
  for (const t of tracks) {
    count.set(t.label, (count.get(t.label) ?? 0) + 1)
  }
  return tracks.map(t => (count.get(t.label) > 1 ? `${t.label}: ${t.names[0]}, ...` : t.label))
}

function branchTable(branches, haplotypes) {
  return {
    kind: branches.map(b => b.kind),
    description: branches.map(b => b.description),
    length: branches.map(b => b.length),
    inserted_bp: branches.map(b => b.insertedBp),
    deleted_bp: branches.map(b => b.deletedBp),
    ref_start: branches.map(b => b.refStart),
    ref_end: branches.map(b => b.refEnd),
    haplotypes: branches.map(b => b.haplotypes),
    total: branches.map(() => haplotypes),
    anchored: branches.map(b => b.anchored),
    open: branches.map(b => b.open === true),
    from: branches.map(b => b.from ?? null),
    to: branches.map(b => b.to ?? null),
    nodes: branches.map(b => b.nodes),
    tracks: branches.map(b => b.tracks.map(id => id + 1)),
    cluster_members: branches.map(b => b.cluster?.members ?? null),
    cluster_min_length: branches.map(b => b.cluster?.minLength ?? null),
    cluster_max_length: branches.map(b => b.cluster?.maxLength ?? null),
    label: branches.map(b => branchLabel(b, haplotypes)),
  }
}

// What each folded tube stands for and hides, as graph-fold counts it
function tubeTable(tracks, names) {
  const spread = (amount, stat) => tracks.map(t => t.variation[amount][stat])
  return {
    name: names,
    track: tracks.map(t => t.id + 1),
    haplotypes: tracks.map(t => t.freq),
    walks: tracks.map(t => t.variation.walks),
    folded_away_bp_min: spread('foldedAwayBp', 'min'),
    folded_away_bp_median: spread('foldedAwayBp', 'median'),
    folded_away_bp_max: spread('foldedAwayBp', 'max'),
    inserted_bp_min: spread('insertedBp', 'min'),
    inserted_bp_median: spread('insertedBp', 'median'),
    inserted_bp_max: spread('insertedBp', 'max'),
    skipped_bp_min: spread('skippedBp', 'min'),
    skipped_bp_median: spread('skippedBp', 'median'),
    skipped_bp_max: spread('skippedBp', 'max'),
    label: tracks.map(t => variationLabel(t)),
  }
}

// One input track per distinct walk, counting in `freq` and naming in
// `members` the haplotypes that take it, since graph-fold's count of distinct
// walks is of the tracks it is given. The reference stays a track of its own
function distinctWalks(tracks) {
  const groups = new Map()
  tracks.forEach((t, i) => {
    const key = i === 0 ? '' : t.sequence.join()
    const group = groups.get(key)
    if (group) {
      group.freq += 1
      group.members.push(t.name)
    } else {
      groups.set(key, {
        name: t.name,
        sequence: t.sequence,
        indexOfFirstBase: t.index_of_first_base,
        freq: 1,
        members: [t.name],
      })
    }
  })
  return [...groups.values()]
}

// The window with its small variation merged into the reference by
// @jbrowse/graph-fold, or as it came with the reason it cannot be folded
function foldedWindow(nodes, tracks, options) {
  const walks = distinctWalks(tracks)
  const result = foldGraph(
    nodes.name.map((name, i) => ({ name, sequenceLength: nodes.sequence_length[i] })),
    walks,
    options,
  )
  const fold = {
    folded: result.folded,
    reason: result.folded ? null : result.reason,
    threshold: result.threshold,
    cluster: options.cluster === true,
    haplotypes: result.haplotypes,
  }
  const names = result.folded ? legendNames(result.tracks) : []
  return result.folded
    ? {
        nodes: {
          name: result.nodes.map(n => n.name),
          seq: result.nodes.map(() => null),
          sequence_length: result.nodes.map(n => n.sequenceLength),
        },
        tracks: result.tracks.map((t, i) => ({
          name: names[i],
          sequence: t.sequence,
          ...(t.indexOfFirstBase === undefined
            ? {}
            : { index_of_first_base: t.indexOfFirstBase }),
          freq: t.freq,
          haplotypes: result.walks.flatMap((walk, w) =>
            walk.track === t.id ? walks[w].members : [],
          ),
        })),
        fold,
        branches: branchTable(result.branches, result.haplotypes),
        tubes: tubeTable(result.tracks, names),
      }
    : { nodes, tracks, fold, branches: branchTable([], result.haplotypes), tubes: tubeTable([], []) }
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
