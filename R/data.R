#' Example graphs
#'
#' Graphs from sequenceTubeMap's demos and test suite, with nodes, haplotype
#' tracks and reads as the viewer extracts them from vg.
#'
#' - `example-6`: a 3 kb region across 9 assemblies, with 5 reads
#' - `brca1`: one reference path through BRCA1 under 161 reads
#' - `micb-kir3dl1`: 91 HPRC haplotypes, PanSN-named
#' - `hprc-chrM`: 43 HPRC mitochondrial haplotypes and 112 reads
#'
#' @param name Which graph.
#' @return A list of `nodes`, `tracks` and `reads` for [tubemap_layout()].
#' @export
#' @examples
#' g <- tubemap_example("micb-kir3dl1")
#' length(g$tracks)
tubemap_example <- function(name = c("example-6", "brca1", "micb-kir3dl1", "hprc-chrM")) {
  name <- match.arg(name)
  path <- system.file("extdata", paste0(name, ".json"), package = "ggtubemap")
  jsonlite::fromJSON(path, simplifyVector = FALSE)
}

#' Read a GFA file
#'
#' Reads the segments and the paths (`P` lines) and walks (`W` lines) of a GFA
#' 1.0 or 1.1 file, for [tubemap_layout()]. Links are not needed: the layout
#' follows the paths. A walk is named in PanSN form, `sample#haplotype#contig`.
#'
#' Each track's `index_of_first_base`, the coordinate the ruler starts from, is
#' a walk's start, or the start in a path named as a subpath (`name[start-end]`
#' or `name:start-end`), or else 0.
#'
#' With `region`, `path` is a [gfa-to-tabix](https://github.com/GMOD/gfa-to-tabix)
#' `--walks` file, a `.walks.gz` with its `.walks.gz.idx` directory beside it,
#' local or a URL, such as the HPRC release 2.1 walk file the JBrowse HPRC demo
#' hosts. gfa-to-tabix 5.0 and later write these, in walk format 8. Range
#' requests fetch only the blocks the region needs, and the reference sample's
#' walk comes first.
#'
#' @param path A GFA file, optionally gzipped, local or a URL; or a
#'   gfa-to-tabix 5.0 `.walks.gz` file with `region`.
#' @param reference The name of the path to draw as the reference, which the
#'   layout puts first. By default the first path in the file.
#' @param region On a walk file, the locus to cut, such as
#'   `"chr6:160,653,940-160,654,130"`.
#' @param haplotypes On a walk file, the `sample#haplotype` walks to keep,
#'   every one when `NULL`. One with no step on the reference over `region`
#'   gets no track: a warning says where it leaves the reference and rejoins
#'   it, and the `context` that would draw it, and [autoplot.tubemap()] names
#'   it under the map.
#' @param context On a walk file, bp of reference kept past each end of
#'   `region`. `NULL` keeps what the browser readers keep, graph-walks'
#'   `WALK_CONTEXT`.
#' @param fold On a walk file, the size in bp at which a variant is kept, such
#'   as `1000`; `NULL` draws the graph as it is. Every smaller bubble is
#'   merged into the reference, so the nodes are the stretches of reference
#'   between the breakpoints of the variants kept, and walks that then take
#'   the same steps become one track whose `freq` counts them. A graph whose
#'   reference passes a node more than once, as a pggb graph's can, is not
#'   folded: a warning says so and the graph comes back as it is.
#' @param cluster With `fold`, draw insertions or deletions at one site whose
#'   lengths differ by at most 5% as one branch, whose label gives the range
#'   of lengths it stands for and how many.
#' @return A list of `nodes` (a data frame of `name` and `seq`, or
#'   `sequence_length` where a segment's sequence is `*`) and `tracks`, and
#'   from a walk file `left_out`, a data frame of each `haplotype` that got no
#'   track and the `reason`.
#'
#'   With `fold`, also `fold`, a list of whether the graph was `folded`, the
#'   `reason` when it was not, the `threshold`, `cluster` and the `haplotypes`
#'   counted, and `branches`, a data frame of the variants kept, in reference
#'   order:
#'   - `kind`, one of `insertion`, `deletion`, `inversion` and `other`, and
#'     `description`, which names an `other`, such as `replacement`
#'   - `length`, `inserted_bp` and `deleted_bp`
#'   - `ref_start` and `ref_end`, on the reference
#'   - `haplotypes`, how many of the `total` carry it, and `tracks`, which
#'     of the folded tracks do
#'   - `anchored`, `FALSE` for a branch with no node or step of its own to
#'     label, such as a walk that ends inside the window
#'   - `open`, for an inversion the cut runs through
#'   - `nodes`, the nodes that are its box, and `from` and `to`, the nodes on
#'     either side of it
#'   - `cluster`, and for a cluster `cluster_members`, `cluster_min_length`
#'     and `cluster_max_length`
#'   - `label`, graph-fold's text for it, which [geom_tubemap_branches()]
#'     prints
#'
#'   A folded track stands for every haplotype that takes its steps, and
#'   lists them in `haplotypes`; its `name` is their count. They share its
#'   route and orientation and nothing under the threshold, which `tubes`
#'   counts, a row per track: `haplotypes`, the distinct `walks` they took
#'   before folding, and the least, median and most bp by which a haplotype
#'   differs from the nodes drawn (`folded_away_bp_min`,
#'   `folded_away_bp_median`, `folded_away_bp_max`), with its two halves, the
#'   bp inserted and skipped, in the `inserted_bp_` and `skipped_bp_` columns,
#'   and a `label` that says so in words.
#' @export
#' @examples
#' \dontrun{
#' walks <- "https://jbrowse.org/demos/hprc/hprc-v2.1-mc-grch38-f8.GRCh38.walks.gz"
#' g <- read_gfa(walks, region = "chr6:160,653,940-160,654,130",
#'               haplotypes = c("HG00097#1", "HG00133#2"))
#'
#' # a 45.5 kb deletion, with everything under 1 kb folded away
#' del <- read_gfa(walks, region = "chr1:72,298,000-72,349,000", fold = 1000,
#'                 cluster = TRUE)
#' del$branches
#' }
read_gfa <- function(path, reference = NULL, region = NULL, haplotypes = NULL,
                     context = NULL, fold = NULL, cluster = FALSE) {
  check_fold(fold, cluster, region, reference)
  if (!is.null(region)) {
    return(order_tracks(cut_walks(path, region, haplotypes, context, fold, cluster),
                        reference))
  }
  if (is_walk_file(path)) {
    stop("A walk file holds a whole genome's graph; give the `region` to cut.",
         call. = FALSE)
  }
  lines <- read_lines(path)
  fields <- strsplit(lines, "\t", fixed = TRUE)
  kind <- vapply(fields, `[`, "", 1)

  segments <- fields[kind == "S"]
  seq <- vapply(segments, `[`, "", 3)
  length_tag <- vapply(segments, function(f) {
    tag <- grep("^LN:i:", f[-(1:3)], value = TRUE)
    if (length(tag) == 0) NA_real_ else as.numeric(sub("^LN:i:", "", tag[1]))
  }, 0)
  nodes <- data.frame(
    name = vapply(segments, `[`, "", 2),
    seq = ifelse(seq == "*", NA, seq),
    sequence_length = ifelse(seq == "*", length_tag, nchar(seq)),
    stringsAsFactors = FALSE
  )
  unsized <- nodes$name[is.na(nodes$sequence_length)]
  if (length(unsized)) {
    stop(sprintf("Segment %s has neither a sequence nor an LN tag.", unsized[1]),
         call. = FALSE)
  }

  paths <- lapply(fields[kind == "P"], function(f) {
    steps <- strsplit(f[3], ",", fixed = TRUE)[[1]]
    oriented <- ifelse(endsWith(steps, "-"), "-", "")
    list(name = f[2], sequence = paste0(oriented, substr(steps, 1, nchar(steps) - 1)),
         index_of_first_base = path_start(f[2]))
  })
  walks <- lapply(fields[kind == "W"], function(f) {
    steps <- regmatches(f[7], gregexpr("[<>][^<>]+", f[7]))[[1]]
    oriented <- ifelse(startsWith(steps, "<"), "-", "")
    list(name = paste(f[2], f[3], f[4], sep = "#"),
         sequence = paste0(oriented, substring(steps, 2)),
         index_of_first_base = if (f[5] == "*") NA_real_ else as.numeric(f[5]))
  })
  tracks <- c(paths, walks)
  if (length(tracks) == 0) {
    stop("The GFA has no P or W lines to draw.", call. = FALSE)
  }
  order_tracks(list(nodes = nodes, tracks = tracks), reference)
}

check_fold <- function(fold, cluster, region, reference) {
  if (!is.null(fold)) {
    if (!is.numeric(fold) || length(fold) != 1 || is.na(fold) || fold < 1) {
      stop("`fold` is the size in bp at which a variant is kept, such as 1000.",
           call. = FALSE)
    }
    if (is.null(region)) {
      stop("`fold` folds a `region` cut from a walk file; give both.", call. = FALSE)
    }
    if (!is.null(reference)) {
      stop("`fold` folds onto the walk file's reference, so it takes no `reference`.",
           call. = FALSE)
    }
  }
  if (!isTRUE(cluster) && !isFALSE(cluster)) {
    stop("`cluster` is TRUE or FALSE.", call. = FALSE)
  }
  if (cluster && is.null(fold)) {
    stop("`cluster` joins the branches `fold` keeps; give `fold` too.", call. = FALSE)
  }
}

order_tracks <- function(graph, reference) {
  if (is.null(reference)) {
    return(graph)
  }
  tracks <- graph$tracks
  first <- which(vapply(tracks, `[[`, "", "name") == reference)
  if (length(first) == 0) {
    stop(sprintf("No path named '%s'.", reference), call. = FALSE)
  }
  graph$tracks <- c(tracks[first[1]], tracks[-first[1]])
  graph
}

# The start of a subpath, named `name[start-end]` as vg writes it or
# `name:start-end` as odgi does, and otherwise 0
path_start <- function(name) {
  m <- regmatches(name, regexec("(\\[|:)([0-9]+)(-[0-9]+)?\\]?$", name))[[1]]
  if (length(m) == 0) 0 else as.numeric(m[3])
}
