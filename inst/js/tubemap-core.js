/*
 * @jbrowse/tubemap-core 0.2.4 (v0.2.4-1-gba4f215), bundled by tools/bridge.js
 *
 * MIT License
 *
 * Copyright (c) 2017 Wolfgang Beyer, 2026 Colin Diesh
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  // ../tubemap-core/esm/types.js
  function emptyTrackShapes() {
    return {
      rectangles: [],
      curves: [],
      corners: [],
      verticalRectangles: []
    };
  }

  // ../tubemap-core/esm/panSN.js
  var NOT_SAMPLES = /* @__PURE__ */ new Set(["_gbwt_ref", "unknown"]);
  function parsePanSN(name) {
    const [sample, haplotype, contig] = name?.split("#") ?? [];
    if (sample === void 0 || sample === "" || NOT_SAMPLES.has(sample) || haplotype === void 0 || !/^\d+$/.test(haplotype) || contig === void 0 || contig === "") {
      return void 0;
    }
    return { sample, haplotype: Number(haplotype), contig };
  }

  // ../tubemap-core/esm/layout.js
  var DEBUG = false;
  function debugLog(...args) {
    if (DEBUG) {
      console.log(...args);
    }
  }
  var READ_FACET_FIELDS = ["read_group", "sample_name"];
  var FACET_FIELDS = [...READ_FACET_FIELDS, "haplotype_sample"];
  function layersFrom({ layers, coarsenedReadView = false, showReads = true }, hasReads) {
    if (layers !== void 0) {
      return layers;
    }
    const coarsen = coarsenedReadView && showReads;
    const stat = (banded) => banded ? { stat: "coarsen" } : {};
    return [
      { data: "haplotypes", ...stat(coarsen && !hasReads) },
      { data: "reads", ...stat(coarsen && hasReads) }
    ];
  }
  function statOf(layers, data) {
    return layers.find((layer) => layer.data === data)?.stat;
  }
  function configFrom(options, hasReads) {
    return {
      mergeNodes: options.mergeNodes ?? true,
      showReads: options.showReads ?? true,
      coarsenedReadView: options.coarsenedReadView ?? false,
      layers: layersFrom(options, hasReads),
      ignoreStrand: options.ignoreStrand ?? false,
      nodeWidthOption: options.nodeWidthOption ?? "normal",
      charWidth: options.charWidth ?? 8.401,
      trackWidth: options.trackWidth ?? 15,
      freqWidth: options.freqWidth ?? "log"
    };
  }
  function emptyState(config) {
    return {
      config,
      nodes: [],
      tracks: [],
      reads: [],
      nodeMap: /* @__PURE__ */ new Map(),
      nodesPerOrder: [],
      nodeOrders: [],
      assignments: [],
      extraLeft: [],
      extraRight: [],
      maxOrder: -1,
      shapes: emptyTrackShapes(),
      imageBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      trackForRuler: void 0,
      coarsenedEdgeMeta: /* @__PURE__ */ new Map()
    };
  }
  var measurements = /* @__PURE__ */ new WeakMap();
  function layoutTopology(inputNodes, inputTracks, inputReads = [], options = {}) {
    const topology = arrangeTopology(inputNodes, inputTracks, inputReads, options);
    if (topology === void 0) {
      return void 0;
    }
    const everything = place(topology, topology.tracks, topology.reads, "measure");
    everything.nodes.forEach((node, i) => {
      if (node.order >= 0) {
        topology.nodes[i].x = node.x;
      }
    });
    measurements.set(topology, everything);
    return topology;
  }
  function placeTubeMap(topology, options = {}) {
    return placeSubset(topology, selectTracks(topology, options.facet), selectReads(topology, options));
  }
  function placeSubset(topology, tracks, reads, bandIdBase) {
    const measured = measurements.get(topology);
    return measured !== void 0 && tracks.length === topology.tracks.length && reads.length === topology.reads.length ? measured : place(topology, tracks, reads, "topology", bandIdBase);
  }
  function arrangeTopology(inputNodes, inputTracks, inputReads, options) {
    const state = emptyState(configFrom(options, inputReads.length > 0));
    if (inputNodes.length === 0 || inputTracks.length === 0) {
      return void 0;
    }
    structuredClone(inputNodes).forEach((node, i) => {
      node.seq ?? (node.seq = "");
      node.sequenceLength ?? (node.sequenceLength = node.seq.length);
      state.nodes[i + 1] = node;
    });
    state.tracks = structuredClone(inputTracks);
    state.reads = state.config.showReads ? structuredClone(inputReads.filter((read) => read.is_secondary !== true)) : [];
    for (let i = state.tracks.length - 1; i >= 0; i -= 1) {
      const t = state.tracks[i];
      t.type ?? (t.type = "haplotype");
      if (t.hidden === true) {
        state.tracks.splice(i, 1);
        continue;
      }
      if (t.indexOfFirstBase !== void 0) {
        state.trackForRuler = t.name;
      }
    }
    if (state.tracks.length === 0) {
      return void 0;
    }
    straightenTrack(state, 0);
    state.nodeMap = generateNodeMap(state);
    generateTrackIndexSequences(state, state.tracks);
    generateTrackIndexSequences(state, state.reads);
    generateNodeWidth(state);
    if (state.config.mergeNodes) {
      generateNodeSuccessors(state);
      generateNodeOrder(state);
      reverseReversedReads(state);
      mergeNodes(state);
      state.nodeMap = generateNodeMap(state);
      generateNodeWidth(state);
      generateTrackIndexSequences(state, state.tracks);
      generateTrackIndexSequences(state, state.reads);
    }
    generateNodeSuccessors(state);
    generateNodeDegree(state);
    generateNodeOrder(state);
    switchNodeOrientation(state);
    generateNodeOrder(state);
    reverseReversedReads(state);
    generateTrackIndexSequences(state, state.reads);
    return {
      options: state.config,
      nodes: state.nodes,
      tracks: state.tracks,
      reads: state.reads,
      nodeMap: state.nodeMap,
      maxOrder: getMaxOrder(state),
      trackForRuler: state.trackForRuler
    };
  }
  function selectReads(topology, { mappingQualityCutoff = 0, focusReadNames = null, facet }) {
    const focus = focusReadNames ? new Set(focusReadNames) : null;
    return topology.reads.filter((read) => (read.mapping_quality ?? 0) >= mappingQualityCutoff && (focus === null || read.name !== void 0 && focus.has(read.name)) && (facet === void 0 || facetHoldsRead(facet, read)));
  }
  function facetHoldsRead(facet, read) {
    return facet.by === "haplotype_sample" ? "reads" in facet : (read[facet.by] ?? null) === facet.key;
  }
  function references(topology) {
    return new Set(topology.tracks.filter((track, i) => i === 0 || track.name === topology.trackForRuler));
  }
  function selectTracks(topology, facet) {
    if (facet?.by !== "haplotype_sample") {
      return topology.tracks;
    }
    const kept = references(topology);
    return topology.tracks.filter((track) => kept.has(track) || !("reads" in facet) && sampleOf(track) === facet.key);
  }
  function sampleOf(track) {
    return parsePanSN(track.name)?.sample ?? null;
  }
  function haplotypeCount(topology, tracks) {
    const skip = references(topology);
    return new Set(tracks.flatMap((track) => {
      if (skip.has(track)) {
        return [];
      }
      const name = parsePanSN(track.name);
      return [name ? `${name.sample}#${name.haplotype}` : track];
    })).size;
  }
  function groupBy(items, keyOf) {
    const groups = /* @__PURE__ */ new Map();
    for (const item of items) {
      const key = keyOf(item);
      const group = groups.get(key);
      if (group === void 0) {
        groups.set(key, [item]);
      } else {
        group.push(item);
      }
    }
    return [...groups].sort(([a], [b]) => a === null || b === null ? Number(a === null) - Number(b === null) : a.localeCompare(b, void 0, { numeric: true }));
  }
  function facetReads(topology, by, options = {}) {
    return groupBy(selectReads(topology, { ...options, facet: void 0 }), (read) => read[by] ?? null).map(([key, reads]) => ({
      facet: { by, key },
      tracks: topology.tracks,
      reads
    }));
  }
  function facetHaplotypes(topology, options = {}) {
    const kept = references(topology);
    const samples = groupBy(topology.tracks.filter((track) => !kept.has(track)), sampleOf);
    if (samples.length === 0) {
      return [];
    }
    const ofSample = samples.map(([key]) => {
      const facet2 = { by: "haplotype_sample", key };
      return { facet: facet2, tracks: selectTracks(topology, facet2), reads: [] };
    });
    const facet = { by: "haplotype_sample", reads: true };
    const reads = selectReads(topology, { ...options, facet });
    return reads.length === 0 ? ofSample : [...ofSample, { facet, tracks: selectTracks(topology, facet), reads }];
  }
  var FACET_LABEL_HEIGHT = 30;
  var FACET_GAP = 40;
  function placeFacets(topology, options = {}) {
    const { facetBy, ...placement } = options;
    const subsets = facetBy === void 0 || facetBy === null ? [] : facetBy === "haplotype_sample" ? facetHaplotypes(topology, placement) : facetReads(topology, facetBy, placement);
    if (subsets.length === 0) {
      const layout = placeTubeMap(topology, placement);
      return {
        panels: [
          {
            layout,
            readCount: layout.reads.length,
            haplotypeCount: haplotypeCount(topology, topology.tracks),
            offsetY: 0
          }
        ],
        bounds: layout.bounds
      };
    }
    const banded = facetBy === "haplotype_sample" ? "haplotypes" : "reads";
    let nextBandId;
    let bottom = 0;
    const panels = subsets.map(({ facet, tracks, reads }, i) => {
      const layout = placeSubset(topology, tracks, reads, nextBandId === void 0 ? void 0 : { [banded]: nextBandId });
      const bandIds = [...layout.coarsenedEdgeMeta.keys()];
      if (bandIds.length > 0) {
        nextBandId = Math.max(...bandIds) + 1;
      }
      const offsetY = i === 0 ? 0 : bottom + FACET_GAP + FACET_LABEL_HEIGHT - layout.bounds.minY;
      bottom = offsetY + layout.bounds.maxY;
      return {
        facet,
        readCount: reads.length,
        haplotypeCount: haplotypeCount(topology, tracks),
        layout,
        offsetY
      };
    });
    return {
      panels,
      bounds: {
        minX: Math.min(...panels.map((p) => p.layout.bounds.minX)),
        maxX: Math.max(...panels.map((p) => p.layout.bounds.maxX)),
        minY: panels[0].layout.bounds.minY - FACET_LABEL_HEIGHT,
        maxY: bottom
      }
    };
  }
  function place(topology, tracks, reads, x, bandIdBase = {}) {
    const state = emptyState(topology.options);
    topology.nodes.forEach((node, i) => {
      state.nodes[i] = { ...node };
    });
    state.tracks = tracks.map((track) => ({ ...track }));
    state.reads = reads.map((read) => ({ ...read }));
    state.nodeMap = topology.nodeMap;
    state.maxOrder = topology.maxOrder;
    state.trackForRuler = topology.trackForRuler;
    const { layers, ignoreStrand } = state.config;
    const haplotypeBandIdBase = bandIdBase.haplotypes ?? COARSENED_ID_BASE;
    const haplotypeBands = statOf(layers, "haplotypes") === "coarsen" ? bandHaplotypes(state, haplotypeBandIdBase) : void 0;
    if (haplotypeBands !== void 0) {
      state.tracks = [haplotypeBands.ref];
    }
    calculateTrackWidth(state);
    generateLaneAssignment(state);
    generateReadOnlyNodeAttributes(state);
    const readBands = statOf(layers, "reads") === "coarsen" && state.reads.length > 0 ? buildCoarsenedSyntheticBands(state, state.reads, "read", bandIdBase.reads ?? haplotypeBandIdBase + (haplotypeBands?.bands.length ?? 0)) : void 0;
    if (readBands !== void 0) {
      state.reads = readBands.bands;
    }
    const coarsened = {};
    for (const [data, unit, banding] of [
      ["haplotypes", "haplotype", haplotypeBands],
      ["reads", "read", readBands]
    ]) {
      if (banding !== void 0) {
        reverseReversedReads(state, banding.bands);
        generateTrackIndexSequences(state, banding.bands);
        coarsened[data] = {
          unit,
          total: banding.total,
          reverse: !ignoreStrand && banding.bands.some((b) => b.is_reverse)
        };
      }
    }
    if (haplotypeBands !== void 0) {
      state.reads = haplotypeBands.bands.concat(state.reads);
    }
    if (state.reads.length > 0) {
      placeReads(state);
      state.tracks = state.tracks.concat(state.reads);
    } else {
      state.nodes.forEach((node) => {
        node.incomingReads = [];
        node.outgoingReads = [];
        node.internalReads = [];
      });
    }
    if (x === "measure") {
      generateNodeXCoords(state);
    }
    generateSVGShapesFromPath(state);
    debugLog("Tracks:", state.tracks);
    debugLog("Nodes:", state.nodes);
    debugLog("Lane assignment:", state.assignments);
    getImageDimensions(state);
    return {
      nodes: state.nodes,
      tracks: state.tracks,
      reads: state.reads,
      nodeMap: state.nodeMap,
      shapes: state.shapes,
      bounds: state.imageBounds,
      maxOrder: state.maxOrder,
      trackForRuler: state.trackForRuler,
      coarsenedEdgeMeta: state.coarsenedEdgeMeta,
      coarsened
    };
  }
  function isReverse(nodeName) {
    return nodeName.startsWith("-");
  }
  function forward(nodeName) {
    return isReverse(nodeName) ? nodeName.substring(1) : nodeName;
  }
  function reverse(nodeName) {
    return isReverse(nodeName) ? nodeName : `-${nodeName}`;
  }
  function flip(nodeName) {
    return isReverse(nodeName) ? forward(nodeName) : reverse(nodeName);
  }
  function isForwardIndex(n) {
    return n > 0;
  }
  function straightenTrack(state, index) {
    const nodesToInvert = /* @__PURE__ */ new Set();
    const visitedForward = /* @__PURE__ */ new Set();
    for (const visit of state.tracks[index].sequence) {
      if (!isReverse(visit)) {
        visitedForward.add(visit);
      } else if (!visitedForward.has(forward(visit))) {
        nodesToInvert.add(forward(visit));
      }
    }
    if (nodesToInvert.size === 0) {
      return;
    }
    for (const { sequence } of [...state.tracks, ...state.reads]) {
      for (let j = 0; j < sequence.length; j += 1) {
        if (nodesToInvert.has(forward(sequence[j]))) {
          sequence[j] = flip(sequence[j]);
        }
      }
    }
    state.nodes.forEach((node) => {
      if (nodesToInvert.has(node.name)) {
        node.seq = getReverseComplement(node.seq);
      }
    });
  }
  function generateReadOnlyNodeAttributes(state) {
    state.nodesPerOrder = [];
    for (let i = 0; i <= state.maxOrder; i += 1) {
      state.nodesPerOrder[i] = [];
    }
    const orderY = /* @__PURE__ */ new Map();
    state.nodes.forEach((node) => {
      if (node.y !== void 0) {
        setMapToMax(orderY, node.order, node.y + node.contentHeight);
      }
    });
    state.tracks.forEach((track) => {
      if (track.type === "haplotype") {
        track.path.forEach((step) => {
          setMapToMax(orderY, step.order, (step.y ?? 0) + track.width);
        });
      }
    });
    state.nodes.forEach((node, i) => {
      if (node.order >= 0 && node.y === void 0) {
        node.y = (orderY.get(node.order) ?? 0) + 25;
        node.contentHeight = 0;
        state.nodesPerOrder[node.order].push(i);
      }
    });
  }
  function setMapToMax(map, key, value) {
    const existing = map.get(key);
    if (existing === void 0) {
      map.set(key, value);
    } else {
      map.set(key, Math.max(existing, value));
    }
  }
  var READ_WIDTH = 7;
  function assignReadsToNodes(state) {
    state.nodes.forEach((node) => {
      node.incomingReads = [];
      node.outgoingReads = [];
      node.internalReads = [];
    });
    state.reads.forEach((read, idx) => {
      if (read.width === void 0 || read.width === 0) {
        read.width = READ_WIDTH;
      }
      if (read.path.length === 1) {
        const firstNode = read.path[0].node;
        if (firstNode !== null) {
          state.nodes[firstNode].internalReads.push(idx);
        }
      } else {
        read.path.forEach((element, pathIdx) => {
          if (pathIdx === 0) {
            const firstNode = read.path[0].node;
            if (firstNode !== null) {
              state.nodes[firstNode].outgoingReads.push([idx, pathIdx]);
            }
          } else {
            const elemNode = element.node;
            if (elemNode !== null) {
              state.nodes[elemNode].incomingReads.push([idx, pathIdx]);
            }
          }
        });
      }
    });
  }
  function placeReads(state) {
    state.reads.forEach((read) => {
      read.path = basicPath(state, read);
    });
    assignReadsToNodes(state);
    const sortedNodes = state.nodes.filter((node) => node.order >= 0);
    sortedNodes.sort(compareNodesByOrder);
    const sets = /* @__PURE__ */ new Map();
    for (let i = 0; i < state.reads.length; i++) {
      const read = state.reads[i];
      const layer = read.haplotypeShare === void 0 ? 1 : 0;
      const source = read.sourceTrackID;
      const key = `${layer}:${source}`;
      const set = sets.get(key);
      if (set === void 0) {
        sets.set(key, { layer, source, reads: /* @__PURE__ */ new Set([i]) });
      } else {
        set.reads.add(i);
      }
    }
    const orderedSets = [...sets.values()].sort((a, b) => a.layer - b.layer || a.source - b.source);
    const topMargin = orderedSets.length > 1 ? READ_WIDTH : 0;
    sortedNodes.forEach((node) => {
      for (const { reads } of orderedSets) {
        placeReadSet(state, reads, node, topMargin);
      }
    });
    const bottomY = calculateBottomY(state);
    const elementsWithoutNode = [];
    state.reads.forEach((read, idx) => {
      const len = read.path.length;
      const prevSegment = new Array(len);
      let lastValidPrev;
      for (let i = 0; i < len; i++) {
        if (i === 0) {
          prevSegment[i] = void 0;
        } else {
          prevSegment[i] = lastValidPrev ?? read.path[0];
        }
        const seg = read.path[i];
        if (seg.node !== null && seg.node) {
          lastValidPrev = seg;
        }
      }
      const nextSegment = new Array(len);
      let firstValidNext;
      for (let i = len - 1; i >= 0; i--) {
        if (i === len - 1) {
          nextSegment[i] = void 0;
        } else {
          nextSegment[i] = firstValidNext ?? read.path[len - 1];
        }
        const seg = read.path[i];
        if (seg.node !== null && seg.node) {
          firstValidNext = seg;
        }
      }
      read.path.forEach((element, pathIdx) => {
        if (element.y === void 0) {
          const previousVisitToNode = prevSegment[pathIdx];
          const nextVisitToNode = nextSegment[pathIdx];
          const betweenCycleReverseTraversal = Boolean(
            // A segment can be between a cycle if it there are nodes on both sides
            nextVisitToNode && previousVisitToNode && // A segment is between a cycle if the next node it visits is behind the previous node it visited
            (previousVisitToNode.order > nextVisitToNode.order || // A segment can also be between a cycle if it's visiting the same node it just visited in the same direction
            nextVisitToNode.order === previousVisitToNode.order && nextVisitToNode.isForward === previousVisitToNode.isForward)
          );
          element.betweenCycleReverseTraversal = betweenCycleReverseTraversal;
          elementsWithoutNode.push({
            readIndex: idx,
            pathIndex: pathIdx,
            previousY: previousVisitToNode?.y,
            previousNode: previousVisitToNode?.node
          });
        }
      });
    });
    elementsWithoutNode.sort((a, b) => compareNoNodeReads(state, a, b));
    elementsWithoutNode.forEach((element) => {
      const read = state.reads[element.readIndex];
      const segment = read.path[element.pathIndex];
      segment.y = bottomY[segment.order];
      bottomY[segment.order] += read.width;
    });
    debugLog("Reads:", state.reads);
  }
  function placeReadSet(state, toPlace, node, topMargin) {
    let incomingReads = node.incomingReads.filter(([readID]) => toPlace.has(readID));
    const outgoingReads = node.outgoingReads.filter(([readID]) => toPlace.has(readID));
    const internalReads = node.internalReads.filter((readID) => toPlace.has(readID));
    if (incomingReads.length === 0 && outgoingReads.length === 0 && internalReads.length === 0) {
      topMargin = 0;
    }
    const startY = node.y + node.contentHeight + topMargin * 2;
    const incomingKeys = incomingReads.map((entry) => {
      const [readID, pathIdx] = entry;
      const path = state.reads[readID].path;
      let decisionStep = pathIdx + 1;
      let foundY;
      for (let k = 1; k <= pathIdx; k++) {
        const y = path[pathIdx - k]?.y;
        if (y !== void 0) {
          decisionStep = k;
          foundY = y;
          break;
        }
      }
      return { entry, decisionStep, y: foundY };
    });
    incomingKeys.sort(compareIncomingReadKeys);
    incomingReads = incomingKeys.map((k) => k.entry);
    let currentY = startY;
    const occupiedUntil = /* @__PURE__ */ new Map();
    incomingReads.forEach((readElement) => {
      const read = state.reads[readElement[0]];
      read.path[readElement[1]].y = currentY;
      setOccupiedUntil(occupiedUntil, read, readElement[1], currentY, node);
      currentY += read.width;
    });
    let maxY = currentY;
    outgoingReads.sort((a, b) => compareReadOutgoingSegmentsByGoingTo(state, a, b));
    const occupiedFrom = /* @__PURE__ */ new Map();
    currentY = startY;
    outgoingReads.forEach((readElement) => {
      const read = state.reads[readElement[0]];
      const firstNodeOffset = read.firstNodeOffset ?? 0;
      read.path[readElement[1]].y = currentY;
      occupiedFrom.set(currentY, firstNodeOffset);
      const occUntil = occupiedUntil.get(currentY);
      if (occUntil === void 0 || occUntil + 1 <= firstNodeOffset) {
        currentY += read.width;
        maxY = Math.max(maxY, currentY);
      } else {
        occupiedUntil.set(currentY, 0);
        incomingReads.forEach((incReadElementIndices) => {
          const incRead = state.reads[incReadElementIndices[0]];
          const incReadPathElement = incRead.path[incReadElementIndices[1]];
          if (incReadPathElement.y !== void 0 && incReadPathElement.y >= currentY) {
            incReadPathElement.y += read.width;
            setOccupiedUntil(occupiedUntil, incRead, incReadElementIndices[1], incReadPathElement.y, node);
          }
        });
        currentY += read.width;
        maxY += read.width;
      }
    });
    internalReads.sort((a, b) => compareInternalReads(state, a, b));
    internalReads.forEach((readIdx) => {
      const currentRead = state.reads[readIdx];
      const firstNodeOffset = currentRead.firstNodeOffset ?? 0;
      const finalNodeCoverLength = currentRead.finalNodeCoverLength ?? 0;
      currentY = startY;
      while (firstNodeOffset < (occupiedUntil.get(currentY) ?? -Infinity) + 2 || finalNodeCoverLength > (occupiedFrom.get(currentY) ?? Infinity) - 3) {
        currentY += currentRead.width || READ_WIDTH;
      }
      currentRead.path[0].y = currentY;
      occupiedUntil.set(currentY, finalNodeCoverLength);
      maxY = Math.max(maxY, currentY);
    });
    const heightIncrease = maxY - node.y - node.contentHeight;
    node.contentHeight += heightIncrease;
    adjustVertically3(state, node, heightIncrease);
  }
  function compareIncomingReadKeys(a, b) {
    if (a.decisionStep !== b.decisionStep) {
      return a.decisionStep - b.decisionStep;
    }
    if (a.y === void 0 || b.y === void 0) {
      return (a.y === void 0 ? 0 : 1) - (b.y === void 0 ? 0 : 1);
    }
    return a.y - b.y;
  }
  function setOccupiedUntil(map, read, pathIndex, y, node) {
    if (pathIndex === read.path.length - 1) {
      map.set(y, read.finalNodeCoverLength ?? 0);
    } else {
      map.set(y, node.sequenceLength);
    }
  }
  function compareNoNodeReads(state, a, b) {
    const readA = state.reads[a.readIndex];
    const readB = state.reads[b.readIndex];
    const segmentA = readA.path[a.pathIndex];
    const segmentB = readB.path[b.pathIndex];
    if (segmentA.order !== segmentB.order) {
      return segmentA.order - segmentB.order;
    }
    if (readA.sourceTrackID !== readB.sourceTrackID) {
      return readA.sourceTrackID - readB.sourceTrackID;
    }
    if (a.previousNode && b.previousNode) {
      const prevNodeA = state.nodes[a.previousNode];
      const prevNodeB = state.nodes[b.previousNode];
      if (prevNodeA && prevNodeB && prevNodeA.order !== prevNodeB.order) {
        return prevNodeA.order - prevNodeB.order;
      }
    }
    const aPrev = a.previousY ?? 0;
    const bPrev = b.previousY ?? 0;
    const aReverse = segmentA.betweenCycleReverseTraversal === true;
    const bReverse = segmentB.betweenCycleReverseTraversal === true;
    if (aReverse !== bReverse) {
      return aReverse ? 1 : -1;
    }
    return aReverse ? bPrev - aPrev : aPrev - bPrev;
  }
  function compareReadOutgoingSegmentsByGoingTo(state, [readIndexA, pathIndexA], [readIndexB, pathIndexB]) {
    const readA = state.reads[readIndexA];
    const readB = state.reads[readIndexB];
    let previousValidYA;
    let previousValidYB;
    let lastPathIndexA = readA.path.length - 1;
    let lastPathIndexB = readB.path.length - 1;
    while (!previousValidYA && lastPathIndexA >= 0) {
      previousValidYA = readA.path[lastPathIndexA]?.y;
      lastPathIndexA -= 1;
    }
    while (!previousValidYB && lastPathIndexB >= 0) {
      previousValidYB = readB.path[lastPathIndexB]?.y;
      lastPathIndexB -= 1;
    }
    if (previousValidYA && previousValidYB) {
      return previousValidYA - previousValidYB;
    }
    const initialNodeA = readA.path[pathIndexA]?.node;
    const initialNodeB = readB.path[pathIndexB]?.node;
    let nodeA = typeof initialNodeA === "number" ? state.nodes[initialNodeA] : null;
    let nodeB = typeof initialNodeB === "number" ? state.nodes[initialNodeB] : null;
    while (nodeA && nodeB && nodeA === nodeB) {
      if (pathIndexA < readA.path.length - 1) {
        pathIndexA += 1;
        while (readA.path[pathIndexA]?.node === null) {
          pathIndexA += 1;
        }
        const nextNodeIdx = readA.path[pathIndexA]?.node;
        nodeA = typeof nextNodeIdx === "number" ? state.nodes[nextNodeIdx] : null;
      } else {
        nodeA = null;
      }
      if (pathIndexB < readB.path.length - 1) {
        pathIndexB += 1;
        while (readB.path[pathIndexB]?.node === null) {
          pathIndexB += 1;
        }
        const nextNodeIdx = readB.path[pathIndexB]?.node;
        nodeB = typeof nextNodeIdx === "number" ? state.nodes[nextNodeIdx] : null;
      } else {
        nodeB = null;
      }
    }
    if (nodeA) {
      if (nodeB) {
        return compareNodesByOrder(nodeA, nodeB);
      }
      return 1;
    }
    if (nodeB) {
      return -1;
    }
    const beginDiff = (readA.firstNodeOffset ?? 0) - (readB.firstNodeOffset ?? 0);
    if (beginDiff !== 0) {
      return beginDiff;
    }
    return (readA.finalNodeCoverLength ?? 0) - (readB.finalNodeCoverLength ?? 0);
  }
  function compareTrackByInitialOrdering(trackA, trackB) {
    const pathA = trackA.path;
    const pathB = trackB.path;
    let AIndex = 0;
    let BIndex = 0;
    while (AIndex < pathA.length && BIndex < pathB.length) {
      const a = pathA[AIndex];
      const b = pathB[BIndex];
      const trackAOrder = a.order;
      const trackBOrder = b.order;
      if (trackAOrder === trackBOrder && a.node && b.node) {
        return (b.y ?? 0) - (a.y ?? 0);
      } else if (trackAOrder < trackBOrder) {
        AIndex += 1;
      } else if (trackAOrder > trackBOrder) {
        BIndex += 1;
      } else {
        AIndex += 1;
        BIndex += 1;
      }
    }
    return 0;
  }
  function compareInternalReads(state, idxA, idxB) {
    const a = state.reads[idxA];
    const b = state.reads[idxB];
    const aFirst = a.firstNodeOffset ?? 0;
    const bFirst = b.firstNodeOffset ?? 0;
    if (aFirst < bFirst) {
      return -1;
    } else if (aFirst > bFirst) {
      return 1;
    }
    const aLast = a.finalNodeCoverLength ?? 0;
    const bLast = b.finalNodeCoverLength ?? 0;
    if (aLast < bLast) {
      return -1;
    } else if (aLast > bLast) {
      return 1;
    }
    return 0;
  }
  function calculateBottomY(state) {
    const bottomY = [];
    for (let i = 0; i <= state.maxOrder; i += 1) {
      bottomY.push(0);
    }
    state.nodes.forEach((node) => {
      if (node.y !== void 0) {
        bottomY[node.order] = Math.max(bottomY[node.order], node.y + node.contentHeight + 20);
      }
    });
    state.tracks.forEach((track) => {
      track.path.forEach((element) => {
        bottomY[element.order] = Math.max(bottomY[element.order], (element.y ?? 0) + track.width);
      });
    });
    return bottomY;
  }
  function basicPath(state, track) {
    const path = [];
    const pass = (order, isForward) => {
      path.push({ order, isForward, node: null });
    };
    const visit = (order, isForward, node) => {
      path.push({ order, isForward, node });
    };
    let currentNodeIndex = Math.abs(track.indexSequence[0]);
    let currentNodeIsForward = isForwardIndex(track.indexSequence[0]);
    let currentNode = state.nodes[currentNodeIndex];
    visit(currentNode.order, currentNodeIsForward, currentNodeIndex);
    for (let i = 1; i < track.sequence.length; i += 1) {
      const previousNode = currentNode;
      const previousNodeIsForward = currentNodeIsForward;
      currentNodeIndex = Math.abs(track.indexSequence[i]);
      currentNodeIsForward = isForwardIndex(track.indexSequence[i]);
      currentNode = state.nodes[currentNodeIndex];
      const { order } = currentNode;
      if (order > previousNode.order) {
        if (!previousNodeIsForward) {
          pass(previousNode.order, true);
        }
        for (let j = previousNode.order + 1; j < order; j += 1) {
          pass(j, true);
        }
        if (!currentNodeIsForward) {
          pass(order, true);
        }
      } else if (order < previousNode.order) {
        if (previousNodeIsForward) {
          pass(previousNode.order, false);
        }
        for (let j = previousNode.order - 1; j > order; j -= 1) {
          pass(j, false);
        }
        if (currentNodeIsForward) {
          pass(order, false);
        }
      } else if (currentNodeIsForward === previousNodeIsForward) {
        pass(order, !currentNodeIsForward);
      }
      visit(order, currentNodeIsForward, currentNodeIndex);
    }
    return path;
  }
  function reverseReversedReads(state, reads = state.reads) {
    reads.forEach((read) => {
      let pos = 0;
      while (pos < read.sequence.length && read.sequence[pos].startsWith("-")) {
        pos += 1;
      }
      if (pos === read.sequence.length) {
        read.is_reverse = true;
        read.sequence = read.sequence.reverse();
        for (let i = 0; i < read.sequence.length; i += 1) {
          read.sequence[i] = forward(read.sequence[i]);
        }
        const sequenceNew = read.sequenceNew ?? [];
        sequenceNew.reverse();
        read.sequenceNew = sequenceNew;
        for (const entry of sequenceNew) {
          entry.nodeName = forward(entry.nodeName);
          reverseMismatches(entry.mismatches, nodeByName(state, entry.nodeName).sequenceLength);
        }
        const temp = read.firstNodeOffset ?? 0;
        const firstLen = nodeByName(state, read.sequence[0]).sequenceLength;
        read.firstNodeOffset = firstLen - (read.finalNodeCoverLength ?? 0);
        const lastLen = nodeByName(state, read.sequence[read.sequence.length - 1]).sequenceLength;
        read.finalNodeCoverLength = lastLen - temp;
      }
    });
  }
  function reverseMismatches(mismatches, sequenceLength) {
    mismatches.forEach((mm) => {
      Object.assign(mm, mirroredMismatch(mm, sequenceLength));
    });
  }
  function mirroredMismatch(mm, sequenceLength) {
    const span = mm.type === "insertion" ? 0 : mm.type === "deletion" ? mm.length ?? 0 : mm.seq?.length ?? 0;
    return {
      ...mm,
      pos: sequenceLength - mm.pos - span,
      ...mm.seq !== void 0 && { seq: getReverseComplement(mm.seq) }
    };
  }
  var COMPLEMENT = { A: "T", T: "A", C: "G", G: "C" };
  function getReverseComplement(s) {
    let result = "";
    for (let i = s.length - 1; i >= 0; i -= 1) {
      result += COMPLEMENT[s.charAt(i)] ?? "N";
    }
    return result;
  }
  function generateTrackIndexSequences(state, tracksOrReads) {
    const signedIndexOf = /* @__PURE__ */ new Map();
    tracksOrReads.forEach((track) => {
      track.indexSequence = track.sequence.map((nodeName) => {
        let signed = signedIndexOf.get(nodeName);
        if (signed === void 0) {
          const index = state.nodeMap.get(forward(nodeName));
          if (index === void 0) {
            throw new Error(`Track ${track.name ?? track.id} visits unknown node ${nodeName}`);
          }
          signed = isReverse(nodeName) ? -index : index;
          signedIndexOf.set(nodeName, signed);
        }
        return signed;
      });
    });
  }
  var NODE_HORIZONTAL_SLACK = 20;
  function getImageDimensions(state) {
    const bounds = { minX: 99, maxX: -99, minY: 99, maxY: -99 };
    state.nodes.forEach((node) => {
      if (node.x !== void 0) {
        bounds.minX = Math.min(bounds.minX, node.x);
        bounds.maxX = Math.max(bounds.maxX, node.x + NODE_HORIZONTAL_SLACK + node.pixelWidth);
      }
      if (node.y !== void 0) {
        bounds.minY = Math.min(bounds.minY, node.y - 10);
        bounds.maxY = Math.max(bounds.maxY, node.y + node.contentHeight + 10);
      }
    });
    state.tracks.forEach((track) => {
      track.path.forEach((segment) => {
        const y = segment.y ?? 0;
        bounds.maxY = Math.max(bounds.maxY, y + track.width);
        bounds.minY = Math.min(bounds.minY, y);
      });
    });
    state.imageBounds = bounds;
  }
  function nodeByName(state, nodeName) {
    const index = state.nodeMap.get(forward(nodeName));
    const node = index === void 0 ? void 0 : state.nodes[index];
    if (node === void 0) {
      throw new Error(`Unknown node ${nodeName}`);
    }
    return node;
  }
  function generateNodeMap(state) {
    const nodeMap = /* @__PURE__ */ new Map();
    state.nodes.forEach((node, index) => {
      nodeMap.set(node.name, index);
    });
    return nodeMap;
  }
  function generateNodeSuccessors(state) {
    const successorSets = state.nodes.map(() => /* @__PURE__ */ new Set());
    const predecessorSets = state.nodes.map(() => /* @__PURE__ */ new Set());
    const addEdges = (track) => {
      for (let i = 0; i < track.indexSequence.length - 1; i += 1) {
        const current = Math.abs(track.indexSequence[i]);
        const follower = Math.abs(track.indexSequence[i + 1]);
        successorSets[current].add(follower);
        predecessorSets[follower].add(current);
      }
    };
    state.tracks.forEach(addEdges);
    state.reads.forEach(addEdges);
    state.nodes.forEach((node, i) => {
      node.successors = Array.from(successorSets[i]);
      node.predecessors = Array.from(predecessorSets[i]);
    });
  }
  function generateNodeOrderOfSingleTrack(state, sequence) {
    let forwardOrder = 0;
    let backwardOrder = 0;
    let minOrder = 0;
    sequence.forEach((nodeIndex) => {
      var _a, _b;
      const idx = Math.abs(nodeIndex);
      if (nodeIndex < 0) {
        const order = (_a = state.nodeOrders)[idx] ?? (_a[idx] = backwardOrder);
        if (order < minOrder) {
          minOrder = order;
        }
        forwardOrder = order;
        backwardOrder = order - 1;
      } else {
        const order = (_b = state.nodeOrders)[idx] ?? (_b[idx] = forwardOrder);
        forwardOrder = order + 1;
        backwardOrder = order;
      }
    });
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
  }
  function generateNodeOrderTrackBeginning(state, sequence) {
    let anchorIndex = 0;
    let minOrder = 0;
    while (anchorIndex < sequence.length && state.nodeOrders[Math.abs(sequence[anchorIndex])] === void 0) {
      anchorIndex += 1;
    }
    if (anchorIndex >= sequence.length) {
      return null;
    }
    const anchorSeqVal = sequence[anchorIndex];
    let currentOrder;
    let increment;
    if (anchorSeqVal >= 0) {
      currentOrder = state.nodeOrders[anchorSeqVal] - 1;
      increment = -1;
    } else {
      currentOrder = state.nodeOrders[-anchorSeqVal] + 1;
      increment = 1;
    }
    for (let j = anchorIndex - 1; j >= 0; j -= 1) {
      const idx = Math.abs(sequence[j]);
      if (state.nodeOrders[idx] === void 0) {
        state.nodeOrders[idx] = currentOrder;
        minOrder = Math.min(minOrder, currentOrder);
        currentOrder += increment;
      }
    }
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
    return anchorIndex;
  }
  var UNREACHABLE_ORDER = -1;
  function fillUnassignedOrders(orders) {
    const filled = [];
    for (const order of orders) {
      filled.push(order ?? UNREACHABLE_ORDER);
    }
    return filled;
  }
  function generateNodeOrder(state) {
    let modifiedSequence;
    let currentOrder;
    let rightIndex;
    let leftIndex;
    let minOrder = 0;
    const tracksAndReads = state.tracks.concat(state.reads);
    const reachability = {
      stamp: new Int32Array(state.nodes.length),
      generation: 0
    };
    state.nodeOrders = new Array(state.nodes.length).fill(void 0);
    state.nodes.forEach((node) => {
      node.order = void 0;
    });
    generateNodeOrderOfSingleTrack(state, state.tracks[0].indexSequence);
    for (let i = 1; i < tracksAndReads.length; i += 1) {
      debugLog(`generating order for track ${i + 1}`);
      rightIndex = generateNodeOrderTrackBeginning(state, tracksAndReads[i].indexSequence);
      if (rightIndex === null) {
        if (i < state.tracks.length) {
          generateNodeOrderOfSingleTrack(state, tracksAndReads[i].indexSequence);
        } else {
          tracksAndReads.splice(i, 1);
          state.reads.splice(i - state.tracks.length, 1);
          i -= 1;
        }
        continue;
      }
      modifiedSequence = uninvert(tracksAndReads[i].indexSequence);
      while (rightIndex < modifiedSequence.length) {
        leftIndex = rightIndex;
        rightIndex += 1;
        while (rightIndex < modifiedSequence.length && state.nodeOrders[modifiedSequence[rightIndex]] === void 0) {
          rightIndex += 1;
        }
        if (rightIndex < modifiedSequence.length) {
          currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] + 1;
          for (let j = leftIndex + 1; j < rightIndex; j += 1) {
            state.nodeOrders[modifiedSequence[j]] = currentOrder;
            currentOrder += 1;
          }
          if (state.nodeOrders[modifiedSequence[rightIndex]] > state.nodeOrders[modifiedSequence[leftIndex]]) {
            if (state.nodeOrders[modifiedSequence[rightIndex]] < currentOrder) {
              increaseOrderForSuccessors(state, modifiedSequence[rightIndex], modifiedSequence[rightIndex - 1], currentOrder);
            }
          } else {
            if (tracksAndReads[i].indexSequence[rightIndex] >= 0 && !isSuccessor(state, modifiedSequence[rightIndex], modifiedSequence[leftIndex], reachability)) {
              increaseOrderForSuccessors(state, modifiedSequence[rightIndex], modifiedSequence[rightIndex - 1], currentOrder);
            } else {
              if (tracksAndReads[i].indexSequence[leftIndex] < 0 || state.nodes[modifiedSequence[leftIndex + 1]].degree < 2 && state.nodeOrders[modifiedSequence[rightIndex]] < state.nodeOrders[modifiedSequence[leftIndex]]) {
                currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] - 1;
                for (let j = leftIndex + 1; j < rightIndex; j += 1) {
                  state.nodeOrders[modifiedSequence[j]] = currentOrder;
                  minOrder = Math.min(minOrder, currentOrder);
                  currentOrder -= 1;
                }
              }
            }
          }
        } else {
          if (tracksAndReads[i].indexSequence[leftIndex] >= 0) {
            currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] + 1;
            for (let j = leftIndex + 1; j < modifiedSequence.length; j += 1) {
              const idx = modifiedSequence[j];
              if (state.nodeOrders[idx] === void 0) {
                state.nodeOrders[idx] = currentOrder;
                currentOrder += 1;
              }
            }
          } else {
            currentOrder = state.nodeOrders[modifiedSequence[leftIndex]] - 1;
            for (let j = leftIndex + 1; j < modifiedSequence.length; j += 1) {
              const idx = modifiedSequence[j];
              if (state.nodeOrders[idx] === void 0) {
                state.nodeOrders[idx] = currentOrder;
                minOrder = Math.min(minOrder, currentOrder);
                currentOrder -= 1;
              }
            }
          }
        }
      }
    }
    if (minOrder < 0) {
      increaseOrderForAllNodes(state, -minOrder);
    }
    const finalOrders = fillUnassignedOrders(state.nodeOrders);
    state.nodeOrders = finalOrders;
    finalOrders.forEach((order, i) => {
      const node = state.nodes[i];
      if (node !== void 0) {
        node.order = order;
      }
    });
  }
  function isSuccessor(state, first, second, scratch) {
    scratch.generation += 1;
    const { stamp, generation } = scratch;
    const stack = [first];
    stamp[first] = generation;
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === second) {
        return true;
      }
      for (const childIndex of state.nodes[current].successors) {
        if (stamp[childIndex] !== generation) {
          stamp[childIndex] = generation;
          stack.push(childIndex);
        }
      }
    }
    return false;
  }
  function getMaxOrder(state) {
    let max = -1;
    state.nodeOrders.forEach((order) => {
      if (order !== void 0 && order > max) {
        max = order;
      }
    });
    return max;
  }
  function uninvert(sequence) {
    return sequence.map((v) => Math.abs(v));
  }
  function increaseOrderForAllNodes(state, amount) {
    state.nodeOrders.forEach((order, i) => {
      if (order !== void 0) {
        state.nodeOrders[i] = order + amount;
      }
    });
  }
  function increaseOrderForSuccessors(state, startingNode, tabuNode, newOrder) {
    const increasedOrders = /* @__PURE__ */ new Map();
    const queue = [[startingNode, newOrder]];
    let head = 0;
    while (head < queue.length) {
      const [currentNode, currentOrder] = queue[head];
      head += 1;
      const currentNodeOrder = state.nodeOrders[currentNode];
      if (currentNodeOrder !== void 0 && currentNodeOrder < currentOrder) {
        if (!increasedOrders.has(currentNode) || increasedOrders.get(currentNode) < currentOrder) {
          increasedOrders.set(currentNode, currentOrder);
          state.nodes[currentNode].successors.forEach((successor) => {
            if (state.nodeOrders[successor] > currentNodeOrder && successor !== tabuNode) {
              queue.push([successor, currentOrder + 1]);
            }
          });
          if (currentNode !== startingNode) {
            state.nodes[currentNode].predecessors.forEach((predecessor) => {
              if (state.nodeOrders[predecessor] > currentNodeOrder && predecessor !== tabuNode) {
                queue.push([predecessor, currentOrder + 1]);
              }
            });
          }
        }
      }
    }
    increasedOrders.forEach((value, key) => {
      state.nodeOrders[key] = value;
    });
  }
  function generateNodeDegree(state) {
    state.nodes.forEach((node) => {
      node.tracks = [];
    });
    state.tracks.forEach((track) => {
      track.indexSequence.forEach((nodeIndex) => {
        state.nodes[Math.abs(nodeIndex)].tracks.push(track.id);
      });
    });
    state.nodes.forEach((node) => {
      node.degree = node.tracks.length;
    });
  }
  function switchNodeOrientation(state) {
    switchNodeOrientationForPaths(state, [...state.tracks.slice(1), ...state.reads], state.tracks[0]);
  }
  function switchNodeOrientationForPaths(state, paths, pivotPath) {
    const scores = new Int32Array(state.nodes.length);
    const onPivot = new Uint8Array(state.nodes.length);
    for (const nodeName of pivotPath.sequence) {
      const index = isReverse(nodeName) ? void 0 : state.nodeMap.get(nodeName);
      if (index !== void 0) {
        onPivot[index] = 1;
      }
    }
    for (const path of paths) {
      const { sequence, indexSequence } = path;
      const last = indexSequence.length - 1;
      for (let j = 0; j <= last; j += 1) {
        const index = Math.abs(indexSequence[j]);
        if (onPivot[index] === 1) {
          continue;
        }
        const order = state.nodes[index].order;
        const prevOrder = j > 0 ? state.nodes[Math.abs(indexSequence[j - 1])].order : void 0;
        const nextOrder = j < last ? state.nodes[Math.abs(indexSequence[j + 1])].order : void 0;
        const vote = isReverse(sequence[j]) ? 1 : -1;
        if ((prevOrder === void 0 || prevOrder < order) && (nextOrder === void 0 || order < nextOrder)) {
          scores[index] += vote;
        }
        if ((prevOrder === void 0 || prevOrder > order) && (nextOrder === void 0 || order > nextOrder)) {
          scores[index] -= vote;
        }
      }
    }
    for (const path of paths) {
      const { sequence, indexSequence } = path;
      for (let j = 0; j < indexSequence.length; j += 1) {
        if (scores[Math.abs(indexSequence[j])] > 0) {
          sequence[j] = flip(sequence[j]);
          indexSequence[j] = -indexSequence[j];
        }
      }
    }
    state.nodes.forEach((node, index) => {
      if (scores[index] > 0) {
        node.seq = getReverseComplement(node.seq);
        node.switched = true;
      }
    });
  }
  function generateNodeXCoords(state) {
    let currentX = 0;
    let nextX = 20;
    let currentOrder = -1;
    const sortedNodes = state.nodes.slice();
    sortedNodes.sort(compareNodesByOrder);
    const extra = calculateExtraSpace(state);
    sortedNodes.forEach((node) => {
      if (node.order >= 0) {
        if (node.order > currentOrder) {
          currentOrder = node.order;
          currentX = nextX + 10 * extra[node.order];
        }
        node.x = currentX;
        nextX = Math.max(nextX, currentX + 40 + node.pixelWidth);
      }
    });
  }
  function calculateExtraSpace(state) {
    const leftSideEdges = [];
    const rightSideEdges = [];
    const fallAngleAdjustment = [];
    const extra = [];
    for (let i = 0; i <= state.maxOrder; i += 1) {
      leftSideEdges.push(0);
      rightSideEdges.push(0);
      fallAngleAdjustment.push(0);
    }
    state.tracks.forEach((track) => {
      for (let i = 1; i < track.path.length; i += 1) {
        const seg = track.path[i];
        const prevSeg = track.path[i - 1];
        if (seg.order === prevSeg.order) {
          if (seg.isForward) {
            leftSideEdges[seg.order] = leftSideEdges[seg.order] + 1;
          } else {
            rightSideEdges[seg.order] = rightSideEdges[seg.order] + 1;
          }
        } else {
          const yDifference = Math.abs((seg.y ?? 0) - (prevSeg.y ?? 0));
          fallAngleAdjustment[seg.order] = Math.max(yDifference / 17.5, fallAngleAdjustment[seg.order]);
        }
      }
    });
    extra.push(Math.max(0, leftSideEdges[0] - 1));
    for (let i = 1; i <= state.maxOrder; i += 1) {
      extra.push(Math.max(Math.max(0, leftSideEdges[i] - 1) + Math.max(0, rightSideEdges[i - 1] - 1), fallAngleAdjustment[i]));
    }
    return extra;
  }
  function generateLaneAssignment(state) {
    const prevSegmentPerOrderPerTrack = [];
    const assignmentByOrderAndNode = [];
    for (let i = 0; i <= state.maxOrder; i += 1) {
      state.assignments[i] = [];
      assignmentByOrderAndNode[i] = /* @__PURE__ */ new Map();
      prevSegmentPerOrderPerTrack[i] = [];
    }
    state.tracks.forEach((track, trackNo) => {
      track.path = basicPath(state, track);
      track.path.forEach((segment, segmentNumber) => {
        addToAssignment(state, segment.order, segment.node, trackNo, segmentNumber, prevSegmentPerOrderPerTrack, assignmentByOrderAndNode);
      });
    });
    for (let i = 0; i <= state.maxOrder; i += 1) {
      generateSingleLaneAssignment(state, state.assignments[i], i);
    }
  }
  function addToAssignment(state, order, nodeIndex, trackNo, segmentID, prevSegmentPerOrderPerTrack, assignmentByOrderAndNode) {
    const segment = {
      trackID: trackNo,
      segmentID,
      compareToFromSame: prevSegmentPerOrderPerTrack[order][trackNo] ?? null
    };
    const existing = nodeIndex === null ? void 0 : assignmentByOrderAndNode[order].get(nodeIndex);
    if (existing === void 0) {
      const assignment = {
        type: "single",
        node: nodeIndex,
        tracks: [segment]
      };
      state.assignments[order].push(assignment);
      if (nodeIndex !== null) {
        assignmentByOrderAndNode[order].set(nodeIndex, assignment);
      }
    } else {
      existing.type = "multiple";
      existing.tracks.push(segment);
    }
    prevSegmentPerOrderPerTrack[order][trackNo] = segment;
  }
  function getIdealLanesAndCoords(state, assignment, order) {
    let index;
    assignment.forEach((node) => {
      node.idealLane = 0;
      node.tracks.forEach((track) => {
        if (track.segmentID === 0) {
          track.idealLane = track.trackID;
          track.idealY = null;
        } else {
          if (state.tracks[track.trackID].path[track.segmentID - 1].order === order - 1) {
            track.idealLane = state.tracks[track.trackID].path[track.segmentID - 1].lane ?? void 0;
            track.idealY = state.tracks[track.trackID].path[track.segmentID - 1].y;
          } else if (track.segmentID < state.tracks[track.trackID].path.length - 1 && state.tracks[track.trackID].path[track.segmentID + 1].order === order - 1) {
            track.idealLane = state.tracks[track.trackID].path[track.segmentID + 1].lane ?? void 0;
            track.idealY = state.tracks[track.trackID].path[track.segmentID + 1].y;
          } else {
            index = track.segmentID - 1;
            while (index >= 0 && state.tracks[track.trackID].path[index].order !== order - 1) {
              index -= 1;
            }
            if (index < 0) {
              track.idealLane = track.trackID;
              track.idealY = null;
            } else {
              track.idealLane = state.tracks[track.trackID].path[index].lane;
              track.idealY = state.tracks[track.trackID].path[index].y;
            }
          }
        }
        node.idealLane += track.idealLane;
      });
      node.idealLane /= node.tracks.length;
    });
  }
  function generateSingleLaneAssignment(state, assignment, order) {
    let currentLane = 0;
    const potentialAdjustmentValues = /* @__PURE__ */ new Set();
    let currentY = 20;
    let prevNameIsNull = false;
    let prevTrack = -1;
    getIdealLanesAndCoords(state, assignment, order);
    assignment.sort(compareByIdealLane);
    assignment.forEach((node) => {
      if (node.node !== null) {
        state.nodes[node.node].topLane = currentLane;
        if (prevNameIsNull) {
          currentY -= 10;
        }
        state.nodes[node.node].y = currentY;
        state.nodes[node.node].contentHeight = 0;
        prevNameIsNull = false;
      } else {
        if (prevNameIsNull) {
          currentY -= 25;
        } else if (currentY > 20) {
          currentY -= 10;
        }
        prevNameIsNull = true;
      }
      node.tracks.sort(compareByIdealLane);
      node.tracks.forEach((track) => {
        track.lane = currentLane;
        if (track.trackID === prevTrack && node.node === null && prevNameIsNull) {
          currentY += 10;
        }
        state.tracks[track.trackID].path[track.segmentID].lane = currentLane;
        state.tracks[track.trackID].path[track.segmentID].y = currentY;
        if (typeof track.idealY === "number") {
          potentialAdjustmentValues.add(track.idealY - currentY);
        }
        currentLane += 1;
        currentY += state.tracks[track.trackID].width;
        if (node.node !== null) {
          state.nodes[node.node].contentHeight += state.tracks[track.trackID].width;
        }
        prevTrack = track.trackID;
      });
      currentY += 25;
    });
    adjustVertically(state, assignment, potentialAdjustmentValues);
  }
  function adjustVertically(state, assignment, potentialAdjustmentValues) {
    let verticalAdjustment = 0;
    let minAdjustmentCost = Number.MAX_SAFE_INTEGER;
    potentialAdjustmentValues.forEach((moveBy) => {
      const cost = getVerticalAdjustmentCost(state, assignment, moveBy);
      if (cost < minAdjustmentCost) {
        minAdjustmentCost = cost;
        verticalAdjustment = moveBy;
      }
    });
    assignment.forEach((node) => {
      if (node.node !== null) {
        state.nodes[node.node].y += verticalAdjustment;
      }
      node.tracks.forEach((track) => {
        const seg = state.tracks[track.trackID].path[track.segmentID];
        seg.y = seg.y + verticalAdjustment;
      });
    });
  }
  function adjustVertically3(state, node, adjustBy) {
    if (node.order < 0 || state.assignments[node.order] === void 0) {
      return;
    }
    state.assignments[node.order].forEach((assignmentNode) => {
      if (assignmentNode.node !== null) {
        const aNode = state.nodes[assignmentNode.node];
        if (aNode !== node && aNode.y > node.y) {
          aNode.y += adjustBy;
          assignmentNode.tracks.forEach((track) => {
            const seg = state.tracks[track.trackID].path[track.segmentID];
            seg.y = seg.y + adjustBy;
          });
        }
      } else {
        assignmentNode.tracks.forEach((track) => {
          const seg = state.tracks[track.trackID].path[track.segmentID];
          if (seg.y >= node.y) {
            seg.y = seg.y + adjustBy;
          }
        });
      }
    });
    if (state.nodesPerOrder[node.order].length > 0) {
      state.nodesPerOrder[node.order].forEach((nodeIndex) => {
        if (state.nodes[nodeIndex] !== node && state.nodes[nodeIndex].y > node.y) {
          state.nodes[nodeIndex].y += adjustBy;
        }
      });
    }
  }
  function getVerticalAdjustmentCost(state, assignment, moveBy) {
    let result = 0;
    assignment.forEach((node) => {
      node.tracks.forEach((track) => {
        if (typeof track.idealY === "number" && state.tracks[track.trackID].type !== "read") {
          result += Math.abs(track.idealY - moveBy - state.tracks[track.trackID].path[track.segmentID].y) * state.tracks[track.trackID].width;
        }
      });
    });
    return result;
  }
  function compareByIdealLane(a, b) {
    if (a.idealLane !== void 0) {
      if (b.idealLane !== void 0) {
        if (a.idealLane < b.idealLane) {
          return -1;
        } else if (a.idealLane > b.idealLane) {
          return 1;
        }
        return 0;
      }
      return -1;
    }
    if (b.idealLane !== void 0) {
      return 1;
    }
    return 0;
  }
  function compareNodesByOrder(a, b) {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.y !== void 0 && b.y !== void 0) {
      return a.y - b.y;
    }
    return 0;
  }
  function calculateTrackWidth(state) {
    let allAreFour = true;
    const NARROW_WIDTH = 4;
    const WIDE_WIDTH = state.config.trackWidth;
    if (state.config.freqWidth === "linear") {
      for (const track of state.tracks) {
        track.width = track.type === "read" ? NARROW_WIDTH : Math.max(1, Math.round(track.freq ?? 1)) * WIDE_WIDTH;
      }
      return;
    }
    for (const track of state.tracks) {
      if (track.freq !== void 0) {
        track.width = Math.round((Math.log(Math.max(track.freq, 1)) + 1) * NARROW_WIDTH);
      } else {
        track.width = WIDE_WIDTH;
        if (track.type !== void 0 && track.type === "read") {
          track.width = NARROW_WIDTH;
        }
      }
      if (track.width !== NARROW_WIDTH) {
        allAreFour = false;
      }
    }
    if (allAreFour) {
      state.tracks.forEach((track) => {
        if (track.freq !== void 0) {
          track.width = WIDE_WIDTH;
        }
      });
    }
  }
  function getReadXStart(state, read) {
    const seg = read.path[0];
    const node = state.nodes[seg.node];
    const offset = read.firstNodeOffset ?? 0;
    return clampedXCoordinateOfBaseWithinNode(node, seg.isForward ? offset : node.sequenceLength - offset);
  }
  function getReadXEnd(state, read) {
    const seg = read.path[read.path.length - 1];
    const node = state.nodes[seg.node];
    const cover = read.finalNodeCoverLength ?? 0;
    return clampedXCoordinateOfBaseWithinNode(node, seg.isForward ? cover : node.sequenceLength - cover);
  }
  function getXCoordinateOfBaseWithinNode(node, base) {
    if (base > node.sequenceLength) {
      return null;
    }
    return clampedXCoordinateOfBaseWithinNode(node, base);
  }
  function clampedXCoordinateOfBaseWithinNode(node, base) {
    const [nodeLeftX, nodeRightX] = nodePixelCoordinatesInX(node);
    if (node.sequenceLength === 0) {
      return nodeLeftX;
    }
    const clamped = Math.min(Math.max(base, 0), node.sequenceLength);
    return nodeLeftX + clamped / node.sequenceLength * (nodeRightX - nodeLeftX);
  }
  function generateSVGShapesFromPath(state) {
    let xStart;
    let xEnd;
    let yStart;
    let yEnd;
    for (let i = 0; i <= state.maxOrder; i += 1) {
      state.extraLeft.push(0);
      state.extraRight.push(0);
    }
    const orderStartX = [];
    const orderEndX = [];
    state.nodes.forEach((node) => {
      if (node.x !== void 0) {
        orderStartX[node.order] = node.x;
        if (orderEndX[node.order] === void 0) {
          orderEndX[node.order] = node.x + node.pixelWidth;
        } else {
          orderEndX[node.order] = Math.max(orderEndX[node.order], node.x + node.pixelWidth);
        }
      }
    });
    const reference = state.tracks[0];
    state.tracks.sort(compareTrackByInitialOrdering);
    state.tracks.forEach((track) => {
      yStart = track.path[0].y;
      if (track.type !== "read") {
        if (track.sequence[0].startsWith("-")) {
          xStart = orderEndX[track.path[0].order] + 20;
        } else {
          xStart = orderStartX[track.path[0].order] - 20;
        }
      } else {
        xStart = getReadXStart(state, track);
      }
      for (let i = 0; i < track.path.length; i += 1) {
        if (track.path[i].y !== yStart) {
          if (track.path[i - 1].isForward) {
            xEnd = orderEndX[track.path[i - 1].order];
          } else {
            xEnd = orderStartX[track.path[i - 1].order];
          }
          if (xEnd !== xStart) {
            state.shapes.rectangles.push({
              xStart: Math.min(xStart, xEnd),
              yStart,
              xEnd: Math.max(xStart, xEnd),
              yEnd: yStart + track.width - 1,
              // TODO: This is not actually the index of the track!
              id: track.id,
              name: track.name,
              type: track.type
            });
          }
          if (track.path[i].order - 1 === track.path[i - 1].order) {
            xStart = xEnd;
            xEnd = orderStartX[track.path[i].order];
            yEnd = track.path[i].y;
            state.shapes.curves.push({
              xStart,
              yStart,
              xEnd: xEnd + 1,
              yEnd,
              width: track.width,
              id: track.id,
              name: track.name,
              type: track.type,
              nodeStart: track.path[i - 1].node,
              nodeEnd: track.path[i].node,
              orderStart: track.path[i - 1].order,
              orderEnd: track.path[i].order,
              ...track === reference ? { reference: true } : {}
            });
            xStart = xEnd;
            yStart = yEnd;
          } else if (track.path[i].order + 1 === track.path[i - 1].order) {
            xStart = xEnd;
            xEnd = orderEndX[track.path[i].order];
            yEnd = track.path[i].y;
            state.shapes.curves.push({
              xStart: xStart + 1,
              yStart,
              xEnd,
              yEnd,
              width: track.width,
              id: track.id,
              name: track.name,
              type: track.type,
              nodeStart: track.path[i - 1].node,
              nodeEnd: track.path[i].node,
              orderStart: track.path[i - 1].order,
              orderEnd: track.path[i].order,
              ...track === reference ? { reference: true } : {}
            });
            xStart = xEnd;
            yStart = yEnd;
          } else {
            if (track.path[i - 1].isForward) {
              yEnd = track.path[i].y;
              generateTurnaround(state, 1, xEnd, yStart, yEnd, track.width, track.id, track.path[i].order, track.type, track.name);
              xStart = orderEndX[track.path[i].order];
              yStart = track.path[i].y;
            } else {
              yEnd = track.path[i].y;
              generateTurnaround(state, -1, xEnd, yStart, yEnd, track.width, track.id, track.path[i].order, track.type, track.name);
              xStart = orderStartX[track.path[i].order];
              yStart = track.path[i].y;
            }
          }
        }
      }
      if (track.type !== "read") {
        if (!track.path[track.path.length - 1].isForward) {
          xEnd = orderStartX[track.path[track.path.length - 1].order] - 20;
        } else {
          xEnd = orderEndX[track.path[track.path.length - 1].order] + 20;
        }
      } else {
        xEnd = getReadXEnd(state, track);
      }
      state.shapes.rectangles.push({
        xStart: Math.min(xStart, xEnd),
        yStart,
        xEnd: Math.max(xStart, xEnd),
        yEnd: yStart + track.width - 1,
        id: track.id,
        name: track.name,
        type: track.type
      });
    });
  }
  var COARSENED_ID_BASE = 1e9;
  function buildCoarsenedSyntheticBands(state, source, unit, firstId = COARSENED_ID_BASE) {
    const edges = /* @__PURE__ */ new Map();
    let total = 0;
    const span = state.nodes.length;
    const edgeKey = (s, d) => (s + span) * (2 * span + 1) + d + span;
    const ignoreStrand = state.config.ignoreStrand;
    for (const [sourceIndex, item] of source.entries()) {
      const weight = Math.max(item.freq ?? 1, 1);
      total += weight;
      const seq = item.indexSequence;
      if (seq.length < 2) {
        continue;
      }
      for (let i2 = 0; i2 < seq.length - 1; i2 += 1) {
        const sSigned = seq[i2];
        const dSigned = seq[i2 + 1];
        const srcNode = state.nodes[Math.abs(sSigned)];
        const dstNode = state.nodes[Math.abs(dSigned)];
        const key = ignoreStrand ? Math.min(edgeKey(sSigned, dSigned), edgeKey(-dSigned, -sSigned)) : edgeKey(sSigned, dSigned);
        const existing = edges.get(key);
        if (existing === void 0) {
          edges.set(key, {
            sSigned,
            dSigned,
            sName: sSigned < 0 ? `-${srcNode.name}` : srcNode.name,
            dName: dSigned < 0 ? `-${dstNode.name}` : dstNode.name,
            count: weight,
            crossings: weight,
            sourceTrackID: item.sourceTrackID,
            lastSource: sourceIndex
          });
        } else {
          existing.crossings += weight;
          if (existing.lastSource !== sourceIndex) {
            existing.count += weight;
            existing.lastSource = sourceIndex;
          }
        }
      }
    }
    let maxEdgeCount = 0;
    for (const e of edges.values()) {
      if (e.crossings > maxEdgeCount) {
        maxEdgeCount = e.crossings;
      }
    }
    const BAND_MIN_WIDTH = READ_WIDTH;
    const BAND_MAX_WIDTH = 60;
    const widthForCount = (c) => {
      if (maxEdgeCount <= 1) {
        return BAND_MIN_WIDTH;
      }
      return BAND_MIN_WIDTH + (BAND_MAX_WIDTH - BAND_MIN_WIDTH) * Math.sqrt(c / maxEdgeCount);
    };
    const synthetic = [];
    let i = 0;
    for (const edge of edges.values()) {
      const id = firstId + i;
      const share = unit === "haplotype" ? { count: edge.count, total } : void 0;
      const shareText = share === void 0 ? "" : ` (${formatShare(share)})`;
      const crossingsText = edge.crossings === edge.count ? "" : `, ${edge.crossings.toLocaleString()} crossings`;
      const label = `${edge.count.toLocaleString()} ${unit}${edge.count === 1 ? "" : "s"}${shareText}${crossingsText}: Node ${edge.sName} \u2192 Node ${edge.dName}`;
      state.coarsenedEdgeMeta.set(id, { count: edge.count, label });
      const srcLen = state.nodes[Math.abs(edge.sSigned)].sequenceLength;
      synthetic.push({
        id,
        sourceTrackID: edge.sourceTrackID,
        type: "read",
        // Human-readable so the name surfaces sensibly in any UI that uses it
        // (right-click → add to group, etc.) — and so trackTooltipText fallback
        // shows something meaningful.
        name: label,
        sequence: [edge.sName, edge.dName],
        indexSequence: [],
        path: [],
        // Pre-set width so placeReads / placeReadSet allocate the right vertical
        // space and assignReadsToNodes (patched to honor pre-set widths) leaves
        // it alone.
        width: widthForCount(edge.crossings),
        firstNodeOffset: srcLen,
        finalNodeCoverLength: 0,
        sequenceNew: [
          { nodeName: edge.sName, mismatches: [] },
          { nodeName: edge.dName, mismatches: [] }
        ],
        mapping_quality: 0,
        is_secondary: false,
        sample_name: null,
        read_group: null,
        score: edge.count,
        haplotypeShare: share
      });
      i += 1;
    }
    if (DEBUG) {
      let tallestName = "?";
      let tallestH = 0;
      state.nodes.forEach((n) => {
        if (n.contentHeight > tallestH) {
          tallestH = n.contentHeight;
          tallestName = n.name;
        }
      });
      debugLog(`[coarsened] ${unit}s_in=${source.length} edges_out=${synthetic.length} tallestNodeBeforePlace=${tallestName}(${tallestH.toFixed(1)})`);
    }
    return { bands: synthetic, total };
  }
  function bandHaplotypes(state, firstId) {
    const rulerIndex = state.trackForRuler === void 0 ? -1 : state.tracks.findIndex((t) => t.name === state.trackForRuler);
    const refIndex = rulerIndex === -1 ? 0 : rulerIndex;
    const ref = state.tracks[refIndex];
    const refDuplicates = (ref.freq ?? 1) - 1;
    const refSigns = firstVisitSigns(state, ref);
    const altHaplotypes = state.tracks.filter((_, i) => i !== refIndex).map((walk) => orientedLike(refSigns, walk));
    if (refDuplicates > 0) {
      altHaplotypes.push({ ...ref, freq: refDuplicates });
    }
    if (altHaplotypes.length === 0) {
      return void 0;
    }
    const { bands, total } = buildCoarsenedSyntheticBands(state, altHaplotypes, "haplotype", firstId);
    return bands.length > 0 ? { ref, bands, total } : void 0;
  }
  function orientedLike(refSigns, walk) {
    let agreement = 0;
    for (const visit of walk.indexSequence) {
      const sign = refSigns[Math.abs(visit)];
      if (sign !== void 0 && sign !== 0) {
        agreement += sign === Math.sign(visit) ? 1 : -1;
      }
    }
    return agreement >= 0 ? walk : {
      ...walk,
      sequence: walk.sequence.map(flip).reverse(),
      indexSequence: walk.indexSequence.map((visit) => -visit).reverse()
    };
  }
  function firstVisitSigns(state, ref) {
    const signs = new Int8Array(state.nodes.length);
    for (const visit of ref.indexSequence) {
      const node = Math.abs(visit);
      if (signs[node] === 0) {
        signs[node] = Math.sign(visit);
      }
    }
    return signs;
  }
  function formatShare({ count, total }) {
    const share = count / total;
    if (share < 0.01) {
      return "<1%";
    }
    if (share > 0.99 && count < total) {
      return ">99%";
    }
    return `${Math.round(share * 100)}%`;
  }
  var MIN_BEND_WIDTH = 7;
  function generateTurnaround(state, dir, x, yStart, yEnd, trackWidth, trackID, order, type, trackName) {
    const extra = dir === 1 ? state.extraRight : state.extraLeft;
    const offset = 10 * extra[order];
    const apex = x + dir * (offset + 5);
    const radius = MIN_BEND_WIDTH;
    const stem = Math.min(MIN_BEND_WIDTH, trackWidth);
    const yTop = Math.min(yStart, yEnd);
    const yBottom = Math.max(yStart, yEnd);
    const stubNear = dir === 1 ? x : apex - 1;
    const stubFar = dir === 1 ? apex : x;
    const horizontal = (segTop) => {
      state.shapes.verticalRectangles.push({
        xStart: stubNear,
        yStart: segTop,
        xEnd: stubFar,
        yEnd: segTop + trackWidth - 1,
        id: trackID,
        name: trackName,
        type
      });
    };
    horizontal(yStart);
    state.shapes.verticalRectangles.push({
      xStart: dir === 1 ? apex + radius : apex - radius - stem,
      yStart: yTop + trackWidth + radius - 1,
      xEnd: dir === 1 ? apex + radius + stem - 1 : apex - radius - 1,
      yEnd: yBottom - radius + 1,
      id: trackID,
      name: trackName,
      type
    });
    horizontal(yEnd);
    const inner = apex + dir * radius;
    const outer = apex + dir * (radius + stem);
    let d = `M ${apex} ${yBottom}`;
    d += ` Q ${inner} ${yBottom} ${inner} ${yBottom - radius}`;
    d += ` H ${outer}`;
    d += ` Q ${outer} ${yBottom + trackWidth} ${apex} ${yBottom + trackWidth}`;
    d += " Z ";
    state.shapes.corners.push({ path: d, id: trackID, type });
    d = `M ${apex} ${yTop}`;
    d += ` Q ${outer} ${yTop} ${outer} ${yTop + trackWidth + radius}`;
    d += ` H ${inner}`;
    d += ` Q ${inner} ${yTop + trackWidth} ${apex} ${yTop + trackWidth}`;
    d += " Z ";
    state.shapes.corners.push({ path: d, id: trackID, type });
    extra[order] += 1;
  }
  function nodePixelCoordinatesInX(node) {
    const nodeLeftX = node.x - 4;
    const nodeRightX = node.x + node.pixelWidth + 4;
    return [nodeLeftX, nodeRightX];
  }
  function generateNodeWidth(state) {
    switch (state.config.nodeWidthOption) {
      case "compressed":
        state.nodes.forEach((node) => {
          node.width = 1 + Math.log2(Math.max(node.sequenceLength, 1));
          node.pixelWidth = Math.round((node.width - 1) * 8.401);
        });
        break;
      case "small":
        state.nodes.forEach((node) => {
          node.width = node.sequenceLength / 100;
          node.pixelWidth = Math.max(Math.round((node.width - 1) * 8.401), 0);
        });
        break;
      case "fixed":
        state.nodes.forEach((node) => {
          node.width = 10;
          node.pixelWidth = Math.round(node.width * 8.401);
        });
        break;
      case "normal": {
        const charWidth = state.config.charWidth;
        state.nodes.forEach((node) => {
          node.width = node.sequenceLength;
          node.pixelWidth = Math.round(charWidth * Math.max(node.sequenceLength - 1, 0));
        });
        break;
      }
      default:
        throw new Error(`${state.config.nodeWidthOption} not implemented`);
    }
  }
  var TRACK_END = 0;
  function noNeighbors(nodeCount) {
    return { first: new Int32Array(nodeCount), count: new Uint8Array(nodeCount) };
  }
  function addNeighbor(neighbors, index, neighbor) {
    const count = neighbors.count[index];
    if (count === 0) {
      neighbors.first[index] = neighbor;
      neighbors.count[index] = 1;
    } else if (count === 1 && neighbors.first[index] !== neighbor) {
      neighbors.count[index] = 2;
    }
  }
  function soleNeighbor(neighbors, index) {
    return neighbors.count[index] === 1 ? Math.abs(neighbors.first[index]) : 0;
  }
  function mergeNodes(state) {
    const pred = noNeighbors(state.nodes.length);
    const succ = noNeighbors(state.nodes.length);
    const signedIndexOf = /* @__PURE__ */ new Map();
    const visit = (nodeName) => {
      let signed = signedIndexOf.get(nodeName);
      if (signed === void 0) {
        const index = state.nodeMap.get(forward(nodeName));
        signed = isReverse(nodeName) ? -index : index;
        signedIndexOf.set(nodeName, signed);
      }
      return signed;
    };
    const tracksAndReads = state.tracks.concat(state.reads);
    tracksAndReads.forEach((track) => {
      const { sequence } = track;
      const isHaplotype = track.type === "haplotype";
      const last = sequence.length - 1;
      let previous = TRACK_END;
      let current = last >= 0 ? visit(sequence[0]) : TRACK_END;
      for (let i = 0; i <= last; i += 1) {
        const next = i < last ? visit(sequence[i + 1]) : TRACK_END;
        if (current > 0) {
          if (i > 0) {
            addNeighbor(pred, current, previous);
            if (previous < 0) {
              addNeighbor(pred, current, -previous);
            }
          } else if (isHaplotype) {
            addNeighbor(pred, current, TRACK_END);
          }
          if (i < last) {
            addNeighbor(succ, current, next);
            if (next < 0) {
              addNeighbor(succ, current, -next);
            }
          } else if (isHaplotype) {
            addNeighbor(succ, current, TRACK_END);
          }
        } else {
          const index = -current;
          if (i > 0) {
            addNeighbor(succ, index, -previous);
            if (previous > 0) {
              addNeighbor(succ, index, previous);
            }
          } else if (isHaplotype) {
            addNeighbor(succ, index, TRACK_END);
          }
          if (i < last) {
            addNeighbor(pred, index, -next);
            if (next > 0) {
              addNeighbor(pred, index, next);
            }
          } else if (isHaplotype) {
            addNeighbor(pred, index, TRACK_END);
          }
        }
        previous = current;
        current = next;
      }
    });
    const absorbed = new Uint8Array(state.nodes.length);
    state.nodes.forEach((_, i) => {
      if (mergeableWithPred(i, pred, succ) !== 0) {
        absorbed[i] = 1;
      }
    });
    const origin = new Int32Array(state.nodes.length);
    const start = new Float64Array(state.nodes.length);
    const end = new Float64Array(state.nodes.length);
    state.nodes.forEach((node, head) => {
      if (absorbed[head] === 1) {
        return;
      }
      origin[head] = head;
      end[head] = node.sequenceLength;
      for (let donor = head; mergeableWithSucc(donor, pred, succ); ) {
        donor = soleNeighbor(succ, donor);
        origin[donor] = head;
        start[donor] = node.sequenceLength;
        node.sequenceLength += state.nodes[donor].sequenceLength;
        node.seq += state.nodes[donor].seq;
        end[donor] = node.sequenceLength;
      }
    });
    state.reads.forEach((read) => {
      const { sequence } = read;
      const entries = read.sequenceNew ?? sequence.map((nodeName) => ({ nodeName, mismatches: [] }));
      const shift = (nodeName) => {
        const index = Math.abs(visit(nodeName));
        return isReverse(nodeName) ? state.nodes[origin[index]].sequenceLength - end[index] : start[index];
      };
      const last = sequence.length - 1;
      read.firstNodeOffset = (read.firstNodeOffset ?? 0) + shift(sequence[0]);
      read.finalNodeCoverLength = (read.finalNodeCoverLength ?? 0) + shift(sequence[last]);
      const mergedSequence = [];
      const mergedEntries = [];
      let carried = [];
      sequence.forEach((nodeName, i) => {
        const index = Math.abs(visit(nodeName));
        const { mismatches } = entries[i];
        const by = shift(nodeName);
        mismatches.forEach((mismatch) => {
          mismatch.pos += by;
        });
        if (absorbed[index] === 1 && !isReverse(nodeName) && i > 0) {
          mergedEntries.at(-1).mismatches.push(...mismatches);
        } else if (absorbed[index] === 1 && isReverse(nodeName) && i < last) {
          carried.push(...mismatches);
        } else {
          const name = state.nodes[origin[index]].name;
          const merged = isReverse(nodeName) ? reverse(name) : name;
          mergedSequence.push(merged);
          mergedEntries.push({
            nodeName: merged,
            mismatches: carried.concat(mismatches)
          });
          carried = [];
        }
      });
      read.sequence = mergedSequence;
      if (read.sequenceNew !== void 0) {
        read.sequenceNew = mergedEntries;
      }
    });
    state.tracks.forEach((track) => {
      const { sequence } = track;
      let kept2 = 0;
      for (const nodeName of sequence) {
        if (absorbed[Math.abs(visit(nodeName))] === 0) {
          sequence[kept2] = nodeName;
          kept2 += 1;
        }
      }
      sequence.length = kept2;
    });
    let kept = 1;
    for (let i = 1; i < state.nodes.length; i += 1) {
      if (absorbed[i] === 0) {
        state.nodes[kept] = state.nodes[i];
        kept += 1;
      }
    }
    state.nodes.length = kept;
  }
  function mergeableWithPred(index, pred, succ) {
    const predecessor = soleNeighbor(pred, index);
    return predecessor !== 0 && soleNeighbor(succ, predecessor) !== 0 ? predecessor : 0;
  }
  function mergeableWithSucc(index, pred, succ) {
    const successor = soleNeighbor(succ, index);
    return successor !== 0 && soleNeighbor(pred, successor) !== 0;
  }

  // ../tubemap-core/esm/geometry.js
  function groupBy2(items, key) {
    const groups = /* @__PURE__ */ new Map();
    for (const item of items) {
      const k = key(item);
      const group = groups.get(k);
      if (group === void 0) {
        groups.set(k, [item]);
      } else {
        group.push(item);
      }
    }
    return groups;
  }
  function compareCurvesByXYStartValue(a, b) {
    if (a.xStart < b.xStart) {
      return 1;
    } else if (a.xStart > b.xStart) {
      return -1;
    } else if (a.yStart > b.yStart) {
      return 1;
    } else if (a.yStart < b.yStart) {
      return -1;
    }
    return 0;
  }
  function curveEnds(curve) {
    return [
      curve.nodeStart ?? -1,
      curve.nodeEnd ?? -1,
      curve.nodeStart === null ? curve.orderStart : -1,
      curve.nodeEnd === null ? curve.orderEnd : -1
    ];
  }
  function compareTuples(a, b) {
    for (let i = 0; i < a.length; i += 1) {
      const d = a[i] - b[i];
      if (d !== 0) {
        return d;
      }
    }
    return 0;
  }
  var STEEP_SHARE = 0.75;
  var MAX_SPREAD = 0.8;
  function spreads(group, gapWidth) {
    const first = group[0];
    const span = Math.min(Math.abs(first.xEnd - first.xStart), gapWidth);
    if (span === 0) {
      return group.map(() => 0);
    }
    const floor = group.length > 5 ? 0.4 / group.length : 0;
    const wanted = group.map((c) => {
      const rise = Math.abs(c.yEnd - c.yStart);
      const across = rise / Math.hypot(rise, span) * Math.min(c.width, MAX_SPREAD * STEEP_SHARE * span);
      return Math.max(floor, across / (STEEP_SHARE * span));
    });
    const sum = (pick) => wanted.reduce((total, w, i) => total + (pick(group[i]) ? w : 0), 0);
    const reference = sum((c) => c.reference === true);
    const others = sum((c) => c.reference !== true);
    const referenceScale = reference > MAX_SPREAD ? MAX_SPREAD / reference : 1;
    const room = MAX_SPREAD - reference * referenceScale;
    const othersScale = others > room ? room / others : 1;
    return wanted.map((w, i) => w * (group[i].reference ? referenceScale : othersScale));
  }
  function curvePaths(curves, type, { gapWidth = Infinity } = {}) {
    const groupedCurves = groupBy2(curves.filter((curve) => curve.type === type), (curve) => curveEnds(curve).join(","));
    groupedCurves.forEach((curveGroup) => {
      curveGroup.sort(compareCurvesByXYStartValue);
      const spread = spreads(curveGroup, gapWidth);
      let adjustValue = 0.5 - spread.reduce((sum, s) => sum + s, 0) / 2;
      curveGroup.forEach((curve, i) => {
        const at = (share) => curve.xStart + (curve.xEnd - curve.xStart) * (curve.yStart < curve.yEnd ? 1 - share : share);
        const xAdjusted = at(adjustValue);
        adjustValue += spread[i];
        const xNextAdjusted = at(adjustValue);
        let d = `M ${curve.xStart} ${curve.yStart}`;
        d += ` C ${xAdjusted} ${curve.yStart} ${xAdjusted} ${curve.yEnd} ${curve.xEnd} ${curve.yEnd}`;
        d += ` V ${curve.yEnd + curve.width}`;
        d += ` C ${xNextAdjusted} ${curve.yEnd + curve.width} ${xNextAdjusted} ${curve.yStart + curve.width} ${curve.xStart} ${curve.yStart + curve.width}`;
        d += " Z";
        curve.path = d;
      });
    });
    return [...groupedCurves.values()].sort((a, b) => compareTuples(curveEnds(a[0]), curveEnds(b[0]))).flat();
  }
  function flattenPath(d, steps = 16) {
    const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
    const points = [];
    let x = 0;
    let y = 0;
    let i = 0;
    const num = () => Number(tokens[i++]);
    while (i < tokens.length) {
      const command = tokens[i++];
      if (command === "M" || command === "L") {
        x = num();
        y = num();
        points.push([x, y]);
      } else if (command === "H") {
        x = num();
        points.push([x, y]);
      } else if (command === "V") {
        y = num();
        points.push([x, y]);
      } else if (command === "C") {
        const [x1, y1, x2, y2, x3, y3] = [
          num(),
          num(),
          num(),
          num(),
          num(),
          num()
        ];
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          const u = 1 - t;
          const a = u * u * u;
          const b = 3 * u * u * t;
          const c = 3 * u * t * t;
          const e = t * t * t;
          points.push([
            a * x + b * x1 + c * x2 + e * x3,
            a * y + b * y1 + c * y2 + e * y3
          ]);
        }
        x = x3;
        y = y3;
      } else if (command === "Q") {
        const [x1, y1, x2, y2] = [num(), num(), num(), num()];
        for (let s = 1; s <= steps; s += 1) {
          const t = s / steps;
          const u = 1 - t;
          points.push([
            u * u * x + 2 * u * t * x1 + t * t * x2,
            u * u * y + 2 * u * t * y1 + t * t * y2
          ]);
        }
        x = x2;
        y = y2;
      } else if (command !== "Z") {
        throw new Error(`flattenPath: unsupported path command ${command}`);
      }
    }
    return points;
  }
  function nodeOutlinePath(node) {
    let d = `M ${node.x - 9} ${node.y} Q ${node.x - 9} ${node.y - 9} ${node.x} ${node.y - 9}`;
    let x = node.x;
    let y = node.y - 9;
    if (node.width > 1) {
      x += node.pixelWidth;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x + 9} ${y} ${x + 9} ${y + 9}`;
    x += 9;
    y += 9;
    if (node.contentHeight > 0) {
      y += node.contentHeight;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x} ${y + 9} ${x - 9} ${y + 9}`;
    x -= 9;
    y += 9;
    if (node.width > 1) {
      x -= node.pixelWidth;
      d += ` L ${x} ${y}`;
    }
    d += ` Q ${x - 9} ${y} ${x - 9} ${y - 9}`;
    x -= 9;
    y -= 9;
    if (node.contentHeight > 0) {
      y -= node.contentHeight;
      d += ` L ${x} ${y}`;
    }
    return d;
  }

  // ../tubemap-core/esm/mismatches.js
  function readMismatches(layout) {
    const { nodes, nodeMap } = layout;
    const out = [];
    for (const read of layout.tracks) {
      const entries = read.sequenceNew;
      if (read.type !== "read" || entries === void 0) {
        continue;
      }
      entries.forEach((entry, i) => {
        const nodeIndex = nodeMap.get(forward(entry.nodeName));
        const node = nodeIndex === void 0 ? void 0 : nodes[nodeIndex];
        let pathIndex = i;
        while (pathIndex < read.path.length && read.path[pathIndex].node !== nodeIndex) {
          pathIndex += 1;
        }
        const segment = read.path[pathIndex];
        if (node === void 0 || segment?.y === void 0) {
          return;
        }
        for (const edit of entry.mismatches) {
          const mm = segment.isForward ? edit : mirroredMismatch(edit, node.sequenceLength);
          const span = mm.type === "deletion" ? mm.length : mm.type === "substitution" ? mm.seq?.length : 0;
          if (span === void 0) {
            continue;
          }
          const x = getXCoordinateOfBaseWithinNode(node, mm.pos);
          const xEnd = getXCoordinateOfBaseWithinNode(node, mm.pos + span);
          if (x === null || xEnd === null) {
            continue;
          }
          out.push({
            type: mm.type,
            readId: read.id,
            x,
            xEnd,
            y: segment.y,
            height: read.width,
            nodeY: node.y,
            seq: mm.seq,
            softClip: mm.type === "insertion" && (i === 0 && edit.pos === read.firstNodeOffset || i === entries.length - 1 && edit.pos === read.finalNodeCoverLength)
          });
        }
      });
    }
    return out;
  }

  // tools/bridge.js
  globalThis.structuredClone ?? (globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value)));
  function columns(names) {
    const table = {};
    for (const name of names) {
      table[name] = [];
    }
    return table;
  }
  function pushRow(table, row) {
    for (const key in table) {
      table[key].push(row[key] ?? null);
    }
  }
  var rectPoints = (r) => [
    [r.xStart, r.yStart],
    [r.xEnd + 1, r.yStart],
    [r.xEnd + 1, r.yEnd + 1],
    [r.xStart, r.yEnd + 1]
  ];
  function counted(count, noun) {
    return `${count.toLocaleString("en-US")} ${noun}${count === 1 ? "" : "s"}`;
  }
  var READ_FACET_NOUNS = { read_group: "read group", sample_name: "sample" };
  function facetLabel(facet, panel) {
    if (facet.by === "haplotype_sample") {
      if ("reads" in facet) {
        return `Reads \xB7 ${counted(panel.readCount, "read")}`;
      }
      const name2 = facet.key === null ? "No PanSN sample" : `Sample ${facet.key}`;
      return `${name2} \xB7 ${counted(panel.haplotypeCount, "haplotype")}`;
    }
    const noun = READ_FACET_NOUNS[facet.by];
    const name = facet.key === null ? `No ${noun}` : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${facet.key}`;
    return `${name} \xB7 ${counted(panel.readCount, "read")}`;
  }
  function trackShapes(layout, panel, steps, emit) {
    const { rectangles, curves, corners, verticalRectangles } = layout.shapes;
    for (const type of ["haplotype", "read"]) {
      for (const r of rectangles) {
        if (r.type === type) {
          emit(panel, r.id, type, "rectangle", rectPoints(r));
        }
      }
      for (const c of curvePaths(curves, type)) {
        emit(panel, c.id, type, "curve", flattenPath(c.path, steps));
      }
      const ids = [
        ...new Set(
          [...verticalRectangles, ...corners].filter((s) => s.type === type).map((s) => s.id)
        )
      ];
      for (const id of ids) {
        for (const r of verticalRectangles) {
          if (r.type === type && r.id === id) {
            emit(panel, id, type, "turn", rectPoints(r));
          }
        }
        for (const c of corners) {
          if (c.type === type && c.id === id) {
            emit(panel, id, type, "turn", flattenPath(c.path, steps));
          }
        }
      }
    }
  }
  globalThis.tubemapLayout = function(requestJson) {
    const { nodes, tracks, reads, topology, placement, steps } = JSON.parse(requestJson);
    const arranged = layoutTopology(nodes, tracks, reads, topology);
    if (arranged === void 0) {
      return JSON.stringify(null);
    }
    const faceted = placeFacets(arranged, placement);
    const shapes = columns(["panel", "group", "track_id", "type", "shape", "x", "y"]);
    const trackTable = columns([
      "id",
      "name",
      "type",
      "source_track_id",
      "freq",
      "width",
      "is_reverse",
      "mapping_quality",
      "sample_name",
      "read_group",
      "band_count",
      "band_label"
    ]);
    const nodeTable = columns([
      "panel",
      "name",
      "x",
      "y",
      "pixel_width",
      "content_height",
      "left",
      "right",
      "seq",
      "sequence_length",
      "order"
    ]);
    const outlines = columns(["panel", "group", "name", "x", "y"]);
    const mismatches = columns([
      "panel",
      "read_id",
      "type",
      "x",
      "x_end",
      "y",
      "height",
      "seq",
      "soft_clip"
    ]);
    const panels = columns(["panel", "label", "top", "bottom", "offset_y"]);
    let group = 0;
    const emit = (panel, id, type, shape, points) => {
      group += 1;
      for (const [x, y] of points) {
        pushRow(shapes, { panel, group, track_id: id, type, shape, x, y });
      }
    };
    const seenTracks = /* @__PURE__ */ new Set();
    faceted.panels.forEach((p, i) => {
      const panel = i + 1;
      const { layout, offsetY } = p;
      const dy = (y) => y + offsetY;
      const before = shapes.y.length;
      trackShapes(layout, panel, steps, emit);
      for (let k = before; k < shapes.y.length; k += 1) {
        shapes.y[k] = dy(shapes.y[k]);
      }
      for (const t of layout.tracks) {
        if (seenTracks.has(t.id)) {
          continue;
        }
        seenTracks.add(t.id);
        const band = layout.coarsenedEdgeMeta.get(t.id);
        pushRow(trackTable, {
          id: t.id,
          name: t.name ?? "",
          type: t.type ?? "haplotype",
          source_track_id: t.sourceTrackID,
          freq: t.freq,
          width: t.width,
          is_reverse: t.is_reverse,
          mapping_quality: t.mapping_quality,
          sample_name: t.sample_name,
          read_group: t.read_group,
          band_count: band?.count,
          band_label: band?.label
        });
      }
      layout.nodes.forEach((n) => {
        if (n.x === void 0) {
          return;
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
          order: n.order
        });
        group += 1;
        for (const [x, y] of flattenPath(nodeOutlinePath(n), steps)) {
          pushRow(outlines, { panel, group, name: n.name, x, y: dy(y) });
        }
      });
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
          soft_clip: m.softClip
        });
      }
      pushRow(panels, {
        panel,
        label: p.facet === void 0 ? null : facetLabel(p.facet, p),
        top: dy(layout.bounds.minY),
        bottom: dy(layout.bounds.maxY),
        offset_y: offsetY
      });
    });
    return JSON.stringify({
      bounds: faceted.bounds,
      shapes,
      tracks: trackTable,
      nodes: nodeTable,
      outlines,
      mismatches,
      panels
    });
  };
})();
