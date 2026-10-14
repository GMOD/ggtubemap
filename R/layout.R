the <- new.env(parent = emptyenv())

js_context <- function() {
  if (is.null(the$ctx)) {
    ctx <- QuickJSR::JSContext$new(stack_size = 64 * 1024 * 1024)
    ctx$source(file = system.file("js", "tubemap-core.js", package = "ggtubemap"))
    the$ctx <- ctx
  }
  the$ctx
}

# camelCase is what the layout reads; snake_case is what R users write
rename_fields <- function(x, from, to) {
  hit <- match(names(x), from)
  names(x)[!is.na(hit)] <- to[hit[!is.na(hit)]]
  x
}

as_rows <- function(x) {
  if (is.data.frame(x)) {
    lapply(seq_len(nrow(x)), function(i) {
      row <- lapply(x, `[[`, i)
      row[!vapply(row, function(v) length(v) == 1 && is.na(v), logical(1))]
    })
  } else {
    x
  }
}

normalize_nodes <- function(nodes) {
  lapply(as_rows(nodes), function(n) {
    n <- rename_fields(n, "sequence_length", "sequenceLength")
    n$name <- as.character(n$name)
    n
  })
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
    # a list, never a bare string, so a one-node path stays a JSON array
    t$sequence <- as.list(as.character(unlist(t$sequence)))
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
#'   `graph`.
#' @param node_width How node width follows sequence length: `"normal"` draws
#'   every base, `"compressed"` its log, `"small"` 1% of it, and `"fixed"` one
#'   width for all.
#' @param merge_nodes Merge unbranched runs of nodes into one.
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
#' @return A `tubemap` object: a list of data frames (`shapes`, `tracks`,
#'   `nodes`, `outlines`, `bases`, `mismatches`, `panels`, `ruler`) and the
#'   `bounds`. `ruler` holds each node visit of the ruler track, the first
#'   track with an `index_of_first_base`, in coordinate order; it is empty
#'   when no track has one.
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
                           curve_steps = 16) {
  node_width <- match.arg(node_width)
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
                           na = "null", digits = NA)
  out <- jsonlite::fromJSON(js_context()$call("tubemapLayout", as.character(json)))
  if (is.null(out)) {
    stop("No visible track is left to lay out.", call. = FALSE)
  }
  new_tubemap(out, node_width)
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

new_tubemap <- function(out, node_width) {
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

  shapes <- as_frame(out$shapes)
  shapes <- cbind(shapes, track_info[match(shapes$track_id, track_info$id), -1])
  rownames(shapes) <- NULL

  nodes <- as_frame(out$nodes)
  mismatches <- as_frame(out$mismatches)
  if (nrow(mismatches) > 0) {
    mismatches <- cbind(
      mismatches,
      track_info[match(mismatches$read_id, track_info$id),
                 c("name", "strand", "mapping_quality")]
    )
    rownames(mismatches) <- NULL
  }

  structure(
    list(
      shapes = shapes,
      tracks = tracks,
      nodes = nodes,
      outlines = as_frame(out$outlines),
      bases = node_bases(nodes),
      mismatches = mismatches,
      panels = as_frame(out$panels),
      ruler = as_frame(out$ruler),
      bounds = out$bounds,
      node_width = node_width
    ),
    class = "tubemap"
  )
}

# One row per base, centred on its share of the node's pixel extent, at the
# baseline sequenceTubeMap draws node sequence on
node_bases <- function(nodes) {
  has_seq <- !is.na(nodes$seq) & nchar(nodes$seq) > 0
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
    base = unlist(strsplit(nodes$seq, ""), use.names = FALSE),
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
