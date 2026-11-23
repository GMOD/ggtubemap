the <- new.env(parent = emptyenv())

.onLoad <- function(libname, pkgname) {
  the$pid <- Sys.getpid()
}

js_context <- function() {
  if (is.null(the$ctx)) {
    if (engine_forked(the$pid)) {
      stop(
        "V8 hangs starting in a forked worker, such as parallel::mclapply()'s: ",
        "lay out in a socket cluster, such as parallel::makeCluster()'s",
        call. = FALSE
      )
    }
    ctx <- V8::v8()
    ctx$source(system.file("js", "tubemap-core.js", package = "ggtubemap"))
    the$ctx <- ctx
  }
  the$ctx
}

# A JavaScript error reaches R as "Error: <message>"; R adds its own prefix
js_call <- function(fun, ...) {
  tryCatch(
    js_context()$call(fun, ...),
    error = function(e) stop(sub("^Error: ", "", conditionMessage(e)), call. = FALSE)
  )
}

# camelCase is what the layout reads; snake_case is what R users write
rename_fields <- function(x, from, to) {
  hit <- match(names(x), from)
  names(x)[!is.na(hit)] <- to[hit[!is.na(hit)]]
  x
}

# a missing field is left out, as the layout reads a null one as given
as_rows <- function(x) {
  rows <- if (is.data.frame(x)) {
    lapply(seq_len(nrow(x)), function(i) lapply(x, `[[`, i))
  } else {
    x
  }
  lapply(rows, function(row) {
    row[!vapply(row, function(v) is.null(v) || (length(v) == 1 && is.na(v)), logical(1))]
  })
}

# A data frame goes out as JSON already, one object per row without its NA
# fields, which jsonlite writes far faster than a list of rows
normalize_nodes <- function(nodes) {
  if (is.data.frame(nodes)) {
    nodes <- rename_fields(nodes, "sequence_length", "sequenceLength")
    nodes$name <- as.character(nodes$name)
    jsonlite::toJSON(nodes, dataframe = "rows", digits = NA)
  } else {
    lapply(nodes, function(n) {
      n <- rename_fields(n, "sequence_length", "sequenceLength")
      n$name <- as.character(n$name)
      n
    })
  }
}

normalize_tracks <- function(tracks, type) {
  lapply(as_rows(tracks), function(t) {
    t <- rename_fields(
      t,
      c("source_track_id", "sequence_new", "first_node_offset",
        "final_node_cover_length", "index_of_first_base"),
      c("sourceTrackID", "sequenceNew", "firstNodeOffset",
        "finalNodeCoverLength", "indexOfFirstBase")
    )
    # I() keeps a one-node path a JSON array under auto_unbox
    t$sequence <- I(as.character(unlist(t$sequence)))
    if (is.null(t$sourceTrackID)) t$sourceTrackID <- if (type == "read") 1L else 0L
    if (type == "read") t$type <- "read"
    t
  })
}

# Shapes find their track by id, so a track or read without one takes the next
# id past every id given
fill_ids <- function(tracks) {
  ids <- lapply(tracks, `[[`, "id")
  missing <- vapply(ids, is.null, logical(1))
  first <- max(-1L, unlist(ids)) + 1L
  tracks[missing] <- Map(function(t, id) {
    t$id <- id
    t
  }, tracks[missing], first + seq_len(sum(missing)) - 1L)
  tracks
}

# an empty list goes out as {}, not []
as_object <- function(x) if (length(x) == 0) structure(list(), names = character()) else x

compact <- function(x) x[!vapply(x, is.null, logical(1))]

#' Lay out a pangenome graph as a tube map
#'
#' Runs the sequenceTubeMap layout from `@jbrowse/tubemap-core` and returns
#' every shape it draws as polygons in layout pixels, ready for the
#' `geom_tubemap_*()` layers.
#'
#' @param graph A list with `nodes` and `tracks`, as [read_gfa()] or
#'   [tubemap_example()] return. `nodes` is a data frame or list with `name`
#'   and `seq` (or `sequence_length`); `tracks` is a list, or a data frame with
#'   a list column, each with a `name` and a `sequence` of node names, `-name`
#'   for a reverse visit. The first track is the reference.
#' @param reads Reads in sequenceTubeMap's extracted form; by default those in
#'   `graph`. A graph [read_gfa()] folded draws none, with a warning: reads
#'   map to the graph's own nodes, which the fold merged.
#' @param node_width How node width follows sequence length: `"normal"` draws
#'   every base, `"compressed"` its log, `"small"` 1% of it, and `"fixed"` one
#'   width for all. A folded graph is drawn `"small"` by default, at
#'   `bases_per_px`, so a node's width is its length and a variant's size
#'   reads off the map.
#' @param merge_nodes Merge unbranched runs of nodes into one. `FALSE` by
#'   default on a folded graph, whose nodes the branches name.
#' @param track_width Tube width in layout pixels.
#' @param freq_width How a track's `freq` widens its tube: `"log"` or `"linear"`.
#' @param show_reads Draw the reads.
#' @param coarsen Band the reads (or the haplotypes, when there are no reads),
#'   one band per edge.
#' @param ignore_strand Band reads of both strands together.
#' @param mapq_cutoff Drop reads below this mapping quality.
#' @param facet_by Stack one panel per `"sample_name"`, `"read_group"` or
#'   `"haplotype_sample"` (the PanSN sample of each haplotype).
#' @param curve_steps Straight pieces per Bézier when curves are flattened.
#' @param bases_per_px At `"small"` width, the bases a layout pixel stands
#'   for. By default 1% of a character's width to the base, and on a folded
#'   graph enough for the reference to span about 1,100 pixels.
#' @return A `tubemap` object: a list of data frames (`shapes`, `tracks`,
#'   `nodes`, `outlines`, `bases`, `mismatches`, `panels`, `ruler`) and the
#'   `bounds`. For a folded graph, `branches` is the graph's `branches` with
#'   where each is drawn (`xmin`, `xmax`, `x` and `y`, `NA` for one with no
#'   box or tube of its own) and where its label goes (`label_x`, `label_y`),
#'   and the `bounds` hold the labels; `tubes` is the graph's `tubes`; and
#'   `pieces` has a row for each straight piece of a tube, cut where it
#'   enters and leaves the nodes its walk steps on: whether it `reads` a node
#'   or passes outside one, and its `direction`, 1 left to right and -1
#'   right to left. `ruler` holds each node visit of the ruler track, the first
#'   track with an `index_of_first_base`, in coordinate order; it is empty
#'   when no track has one. `left_out` is the graph's `left_out`, the
#'   haplotypes [read_gfa()] drew no track for, which [autoplot.tubemap()]
#'   names under the map.
#' @export
#' @examples
#' tm <- tubemap_layout(tubemap_example("example-6"))
#' tm
tubemap_layout <- function(graph, reads = graph$reads,
                           node_width = c("normal", "compressed", "small", "fixed"),
                           merge_nodes = TRUE, track_width = 15,
                           freq_width = c("log", "linear"), show_reads = TRUE,
                           coarsen = FALSE, ignore_strand = FALSE,
                           mapq_cutoff = NULL, facet_by = NULL,
                           curve_steps = 16, bases_per_px = NULL) {
  folded <- isTRUE(graph$fold$folded)
  node_width <- if (folded && missing(node_width)) "small" else match.arg(node_width)
  if (folded && missing(merge_nodes)) merge_nodes <- FALSE
  if (folded && length(reads)) {
    warning(
      sprintf("The %d reads are not drawn: they map to the graph's own nodes, which `fold` merged.",
              NROW(reads)),
      call. = FALSE
    )
    reads <- NULL
  }
  bases_per_px <- small_scale(graph, folded, node_width, bases_per_px)
  freq_width <- match.arg(freq_width)
  if (!is.null(facet_by)) {
    facet_by <- match.arg(facet_by, c("sample_name", "read_group", "haplotype_sample"))
  }
  tracks <- normalize_tracks(graph$tracks, "haplotype")
  reads <- if (is.null(reads)) list() else normalize_tracks(reads, "read")
  all <- fill_ids(c(tracks, reads))
  request <- list(
    nodes = normalize_nodes(graph$nodes),
    tracks = all[seq_along(tracks)],
    reads = all[length(tracks) + seq_along(reads)],
    topology = compact(list(
      nodeWidthOption = node_width,
      basesPerPixel = bases_per_px,
      mergeNodes = merge_nodes,
      trackWidth = track_width,
      freqWidth = freq_width,
      showReads = show_reads,
      coarsenedReadView = coarsen,
      ignoreStrand = ignore_strand
    )),
    placement = as_object(compact(list(
      mappingQualityCutoff = mapq_cutoff,
      facetBy = facet_by
    ))),
    steps = curve_steps
  )
  json <- jsonlite::toJSON(request, auto_unbox = TRUE, null = "null",
                           na = "null", digits = NA, json_verbatim = TRUE)
  out <- jsonlite::fromJSON(js_call("tubemapLayout", as.character(json)))
  if (is.null(out)) {
    stop("No visible track is left to lay out.", call. = FALSE)
  }
  tubemap <- new_tubemap(out, node_width, graph$left_out)
  tubemap$bases_per_px <- bases_per_px
  place_branches(tubemap, graph)
}

# The bases a layout pixel stands for at small width: those asked for, or on
# a folded graph enough for the reference to span about 1,100 pixels and
# never fewer than small's own 1% of a character; otherwise the layout's
small_scale <- function(graph, folded, node_width, bases_per_px) {
  if (!is.null(bases_per_px) && node_width != "small") {
    stop("`bases_per_px` sets the scale of `node_width = \"small\"`.", call. = FALSE)
  }
  if (is.null(bases_per_px) && folded && node_width == "small") {
    on_reference <- sub("^-", "", graph$tracks[[1]]$sequence)
    span <- sum(graph$nodes$sequence_length[match(on_reference, graph$nodes$name)])
    max(100 / 8.401, ceiling(span / 1100))
  } else {
    bases_per_px
  }
}

x_range <- function(shapes) {
  if (nrow(shapes)) range(shapes$x) else c(NA_real_, NA_real_)
}

# Where each branch of a folded graph is drawn: the box of its nodes, or for a
# deletion the gap between the two nodes it steps across and the top of the
# tube that steps
branch_anchor <- function(branch, tubemap) {
  outlines <- tubemap$outlines[tubemap$outlines$panel == 1, , drop = FALSE]
  boxes <- outlines[outlines$name %in% branch$nodes[[1]], , drop = FALSE]
  if (!branch$anchored) {
    rep(NA_real_, 3)
  } else if (nrow(boxes)) {
    c(x_range(boxes), min(boxes$y))
  } else {
    ends <- sort(c(x_range(outlines[outlines$name == branch$from, , drop = FALSE]),
                   x_range(outlines[outlines$name == branch$to, , drop = FALSE])))
    gap <- ends[2:3]
    tubes <- tubemap$shapes[tubemap$shapes$panel == 1 &
                              tubemap$shapes$track_id %in% (branch$tracks[[1]] - 1L), ,
                            drop = FALSE]
    across <- vapply(split(tubes, tubes$group), function(tube) {
      if (min(tube$x) <= mean(gap) && max(tube$x) >= mean(gap)) min(tube$y) else NA_real_
    }, 0)
    top <- if (all(is.na(across))) NA_real_ else min(across, na.rm = TRUE)
    c(gap, top)
  }
}

# The straight pieces of a folded graph's tubes, cut where they enter and
# leave the nodes their walk steps on: `reads` where a piece is inside such a
# node and not where it passes outside one, and `direction` 1 where the
# layout says the walk runs left to right and -1 right to left. A stretch
# outside its own nodes passes a node only where it runs `stub` pixels or more
# beside one; the stretch between two neighbouring nodes passes none and has
# no row
tube_pieces <- function(tubemap, tracks, stub = 20) {
  shapes <- tubemap$shapes[tubemap$shapes$panel == 1 & tubemap$shapes$shape == "rectangle", ,
                           drop = FALSE]
  boxes <- tubemap$outlines[tubemap$outlines$panel == 1, , drop = FALSE]
  box <- lapply(split(boxes, boxes$name), function(o) c(range(o$x), range(o$y)))
  rows <- lapply(split(shapes, shapes$group), function(piece) {
    steps <- tracks[[piece$track_id[1] + 1]]$sequence
    x <- range(piece$x)
    y <- range(piece$y)
    stepped <- box[sub("^-", "", steps)]
    read <- vapply(stepped, function(b) {
      !is.null(b) && x[1] < b[2] && x[2] > b[1] && y[1] >= b[3] && y[2] <= b[4]
    }, logical(1))
    inside <- unique(do.call(rbind, c(list(matrix(numeric(), ncol = 2)),
                                      lapply(stepped[read], function(b) {
      c(max(x[1], b[1]), min(x[2], b[2]))
    }))))
    inside <- inside[order(inside[, 1]), , drop = FALSE]
    cuts <- c(x[1], t(inside), x[2])
    spans <- data.frame(xmin = cuts[-length(cuts)], xmax = cuts[-1],
                        reads = rep(c(FALSE, TRUE), length.out = length(cuts) - 1))
    beside <- vapply(seq_len(nrow(spans)), function(i) {
      any(vapply(box, function(b) min(spans$xmax[i], b[2]) - max(spans$xmin[i], b[1]) > stub,
                 logical(1)))
    }, logical(1))
    spans <- spans[spans$xmax > spans$xmin & (spans$reads | beside), , drop = FALSE]
    cbind(
      track_id = rep(piece$track_id[1], nrow(spans)), spans,
      ymin = rep(y[1], nrow(spans)), ymax = rep(y[2], nrow(spans)),
      direction = rep(if (piece$reverse[1] %in% TRUE) -1 else 1, nrow(spans))
    )
  })
  out <- do.call(rbind, rows)
  rownames(out) <- NULL
  out
}

# Branch labels sit in rows above the map, each centred over its branch where
# it fits, in text an 80th of the map's width. The
# bounds grow to hold the rows
place_branches <- function(tubemap, graph) {
  branches <- graph$branches
  if (!is.null(branches)) {
    b <- tubemap$bounds
    anchors <- vapply(seq_len(nrow(branches)), function(i) {
      branch_anchor(branches[i, , drop = FALSE], tubemap)
    }, numeric(3))
    branches$xmin <- anchors[1, ]
    branches$xmax <- anchors[2, ]
    branches$x <- (branches$xmin + branches$xmax) / 2
    branches$y <- anchors[3, ]
    size <- max(14, (b$maxX - b$minX) / 80)
    width <- nchar(branches$label) * size * 0.55
    left <- pmin(pmax(branches$x - width / 2, b$minX), pmax(b$maxX - width, b$minX))
    row_end <- numeric()
    branches$label_x <- left + width / 2
    branches$label_width <- width
    branches$label_y <- rep(NA_real_, nrow(branches))
    for (i in which(!is.na(branches$x))) {
      free <- which(row_end + size < left[i])
      row <- if (length(free)) free[1] else length(row_end) + 1
      row_end[row] <- left[i] + width[i]
      branches$label_y[i] <- b$minY - size * (1.6 * row - 0.6)
    }
    tubemap$branches <- branches
    tubemap$branch_size <- size
    tubemap$tubes <- graph$tubes
    tubemap$pieces <- tube_pieces(tubemap, graph$tracks)
    if (length(row_end)) {
      tubemap$bounds$minY <- b$minY - size * 1.6 * length(row_end)
    }
  }
  tubemap
}

as_frame <- function(columns) {
  columns <- lapply(columns, function(col) {
    if (length(col) == 0) {
      logical(0)
    } else if (is.list(col)) {
      unlist(lapply(col, function(v) if (is.null(v)) NA else v))
    } else {
      col
    }
  })
  as.data.frame(columns, stringsAsFactors = FALSE)
}

# The layout sends each polygon's fields once with its vertex count `n`, and
# the vertices in `x` and `y`; one row per vertex is what the layers draw
as_polygons <- function(table) {
  n <- as.integer(unlist(table$n))
  fields <- setdiff(names(table), c("n", "x", "y"))
  as_frame(c(lapply(table[fields], rep, times = n), table[c("x", "y")]))
}

new_tubemap <- function(out, node_width, left_out = NULL) {
  tracks <- as_frame(out$tracks)
  tracks$strand <- ifelse(is.na(tracks$is_reverse), NA,
                          ifelse(tracks$is_reverse, "-", "+"))
  track_info <- tracks[c("id", "name", "type", "strand", "mapping_quality",
                         "sample_name", "read_group", "freq", "band_count",
                         "band_label")]
  names(track_info)[names(track_info) == "type"] <- "track_type"
  haplotype_tracks <- tracks[tracks$type == "haplotype", ]
  levels <- unique(haplotype_tracks$name[order(haplotype_tracks$id)])
  track_info$haplotype <- factor(
    ifelse(track_info$track_type == "haplotype", track_info$name, NA),
    levels = levels
  )

  shapes <- as_polygons(out$shapes)
  shapes <- cbind(shapes, track_info[match(shapes$track_id, track_info$id), -1])
  rownames(shapes) <- NULL

  nodes <- as_frame(out$nodes)
  mismatches <- as_frame(out$mismatches)
  mismatches <- cbind(
    mismatches,
    track_info[match(mismatches$read_id, track_info$id),
               c("name", "strand", "mapping_quality")]
  )
  rownames(mismatches) <- NULL

  structure(
    list(
      shapes = shapes,
      tracks = tracks,
      nodes = nodes,
      outlines = as_polygons(out$outlines),
      bases = node_bases(nodes),
      mismatches = mismatches,
      panels = as_frame(out$panels),
      ruler = as_frame(out$ruler),
      bounds = out$bounds,
      node_width = node_width,
      left_out = left_out,
      branches = NULL,
      branch_size = NULL,
      tubes = NULL,
      pieces = NULL
    ),
    class = "tubemap"
  )
}

# One row per base, centred on its share of the node's pixel extent, at the
# baseline sequenceTubeMap draws node sequence on. A node merged from runs
# with and without sequence has fewer bases than its length, and prints none.
node_bases <- function(nodes) {
  has_seq <- !is.na(nodes$seq) & nchar(nodes$seq) > 0 &
    nchar(nodes$seq) == nodes$sequence_length
  nodes <- nodes[has_seq, ]
  n <- nchar(nodes$seq)
  i <- sequence(n) - 1
  row <- rep(seq_len(nrow(nodes)), n)
  step <- (nodes$right - nodes$left) / n
  data.frame(
    panel = nodes$panel[row],
    node = nodes$name[row],
    x = nodes$left[row] + (i + 0.5) * step[row],
    y = nodes$y[row] + 4,
    base = as.character(unlist(strsplit(nodes$seq, ""), use.names = FALSE)),
    stringsAsFactors = FALSE
  )
}

#' @export
print.tubemap <- function(x, ...) {
  b <- x$bounds
  haplotypes <- sum(x$tracks$type == "haplotype")
  reads <- sum(x$tracks$type == "read")
  cat(sprintf(
    "<tubemap> %d nodes, %d haplotypes, %d reads in %d panel%s; %.0f x %.0f layout px (%s widths)\n",
    length(unique(x$nodes$name)), haplotypes, reads, nrow(x$panels),
    if (nrow(x$panels) == 1) "" else "s",
    b$maxX - b$minX, b$maxY - b$minY, x$node_width
  ))
  invisible(x)
}
