// The one function R calls: JSON in, JSON out, every table columnar so
// jsonlite reads it straight into a data frame. Shapes come out as flattened
// polygons in sequenceTubeMap's draw order, panel by panel.
import {
  curvePaths,
  flattenPath,
  isForwardIndex,
  layoutTopology,
  nodeOutlinePath,
  nodePixelCoordinatesInX,
  placeFacets,
  readMismatches,
} from '@jbrowse/tubemap-core'

// QuickJS has no structuredClone. Core clones only the inputs, which arrive
// here as parsed JSON, so a JSON round trip copies them exactly.
globalThis.structuredClone ??= value => JSON.parse(JSON.stringify(value))

function columns(names) {
  const table = {}
  for (const name of names) {
    table[name] = []
  }
  return table
}

function pushRow(table, row) {
  for (const key in table) {
    table[key].push(row[key] ?? null)
  }
}

const rectPoints = r => [
  [r.xStart, r.yStart],
  [r.xEnd + 1, r.yStart],
  [r.xEnd + 1, r.yEnd + 1],
  [r.xStart, r.yEnd + 1],
]

function counted(count, noun) {
  return `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`
}

const READ_FACET_NOUNS = { read_group: 'read group', sample_name: 'sample' }

function facetLabel(facet, panel) {
  if (facet.by === 'haplotype_sample') {
    if ('reads' in facet) {
      return `Reads · ${counted(panel.readCount, 'read')}`
    }
    const name = facet.key === null ? 'No PanSN sample' : `Sample ${facet.key}`
    return `${name} · ${counted(panel.haplotypeCount, 'haplotype')}`
  }
  const noun = READ_FACET_NOUNS[facet.by]
  const name =
    facet.key === null
      ? `No ${noun}`
      : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${facet.key}`
  return `${name} · ${counted(panel.readCount, 'read')}`
}

function trackShapes(layout, steps, emit) {
  const { rectangles, curves, corners, verticalRectangles } = layout.shapes
  for (const type of ['haplotype', 'read']) {
    for (const r of rectangles) {
      if (r.type === type) {
        emit(r.id, type, 'rectangle', rectPoints(r))
      }
    }
    for (const c of curvePaths(curves, type)) {
      emit(c.id, type, 'curve', flattenPath(c.path, steps))
    }
    // a turnaround's pieces draw together, track by track, so one track's
    // corners never sit under another's stems
    const turns = new Map()
    const addTurn = (id, points) => {
      turns.set(id, [...(turns.get(id) ?? []), points])
    }
    for (const r of verticalRectangles) {
      if (r.type === type) {
        addTurn(r.id, rectPoints(r))
      }
    }
    for (const c of corners) {
      if (c.type === type) {
        addTurn(c.id, flattenPath(c.path, steps))
      }
    }
    for (const [id, pieces] of turns) {
      for (const points of pieces) {
        emit(id, type, 'turn', points)
      }
    }
  }
}

// The ruler track's node visits in ascending coordinate order, as
// sequenceTubeMap's drawRuler walks them
function rulerVisits(layout, emit) {
  if (layout.trackForRuler === undefined) {
    return
  }
  const track = layout.tracks.find(t => t.name === layout.trackForRuler)
  const steps = track.indexSequence
  let start = track.indexOfFirstBase ?? 0
  for (let i = 0; i < steps.length; i += 1) {
    const step = track.isCompletelyReverse ? steps.length - 1 - i : i
    const node = layout.nodes[Math.abs(steps[step])]
    const [left, right] = nodePixelCoordinatesInX(node)
    emit({
      track: track.name,
      node: node.name,
      start,
      length: node.sequenceLength,
      reverse: isForwardIndex(steps[step]) === Boolean(track.isCompletelyReverse),
      left,
      right,
    })
    start += node.sequenceLength
  }
}

globalThis.tubemapLayout = function (requestJson) {
  const { nodes, tracks, reads, topology, placement, steps } =
    JSON.parse(requestJson)
  const arranged = layoutTopology(nodes, tracks, reads, topology)
  if (arranged === undefined) {
    return JSON.stringify(null)
  }
  const faceted = placeFacets(arranged, placement)

  const shapes = columns(['panel', 'group', 'track_id', 'type', 'shape', 'x', 'y'])
  const trackTable = columns([
    'id',
    'name',
    'type',
    'source_track_id',
    'freq',
    'width',
    'is_reverse',
    'mapping_quality',
    'sample_name',
    'read_group',
    'band_count',
    'band_label',
  ])
  const nodeTable = columns([
    'panel',
    'name',
    'x',
    'y',
    'pixel_width',
    'content_height',
    'left',
    'right',
    'seq',
    'sequence_length',
    'order',
  ])
  const outlines = columns(['panel', 'group', 'name', 'x', 'y'])
  const mismatches = columns([
    'panel',
    'read_id',
    'type',
    'x',
    'x_end',
    'y',
    'height',
    'seq',
    'soft_clip',
  ])
  const panels = columns(['panel', 'label', 'top', 'bottom', 'offset_y'])
  const ruler = columns(['track', 'node', 'start', 'length', 'reverse', 'left', 'right'])
  rulerVisits(faceted.panels[0].layout, row => pushRow(ruler, row))

  let group = 0
  const seenTracks = new Set()
  faceted.panels.forEach((p, i) => {
    const panel = i + 1
    const { layout, offsetY } = p
    const dy = y => y + offsetY
    trackShapes(layout, steps, (id, type, shape, points) => {
      group += 1
      for (const [x, y] of points) {
        pushRow(shapes, { panel, group, track_id: id, type, shape, x, y: dy(y) })
      }
    })
    for (const t of layout.tracks) {
      if (seenTracks.has(t.id)) {
        continue
      }
      seenTracks.add(t.id)
      const band = layout.coarsenedEdgeMeta.get(t.id)
      pushRow(trackTable, {
        id: t.id,
        name: t.name ?? '',
        type: t.type ?? 'haplotype',
        source_track_id: t.sourceTrackID,
        freq: t.freq,
        width: t.width,
        is_reverse: t.is_reverse,
        mapping_quality: t.mapping_quality,
        sample_name: t.sample_name,
        read_group: t.read_group,
        band_count: band?.count,
        band_label: band?.label,
      })
    }
    layout.nodes.forEach(n => {
      if (n.x === undefined) {
        return
      }
      pushRow(nodeTable, {
        panel,
        name: n.name,
        x: n.x,
        y: dy(n.y),
        pixel_width: n.pixelWidth,
        content_height: n.contentHeight,
        left: n.x - 4,
        right: n.x + n.pixelWidth + 4,
        seq: n.seq,
        sequence_length: n.sequenceLength,
        order: n.order,
      })
      group += 1
      for (const [x, y] of flattenPath(nodeOutlinePath(n), steps)) {
        pushRow(outlines, { panel, group, name: n.name, x, y: dy(y) })
      }
    })
    for (const m of readMismatches(layout)) {
      pushRow(mismatches, {
        panel,
        read_id: m.readId,
        type: m.type,
        x: m.x,
        x_end: m.xEnd,
        y: dy(m.y),
        height: m.height,
        seq: m.seq,
        soft_clip: m.softClip,
      })
    }
    pushRow(panels, {
      panel,
      label: p.facet === undefined ? null : facetLabel(p.facet, p),
      top: dy(layout.bounds.minY),
      bottom: dy(layout.bounds.maxY),
      offset_y: offsetY,
    })
  })

  return JSON.stringify({
    bounds: faceted.bounds,
    shapes,
    tracks: trackTable,
    nodes: nodeTable,
    outlines,
    mismatches,
    panels,
    ruler,
  })
}
