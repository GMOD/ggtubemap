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
#' `--walks` file with its `.tbi`, local or a URL, such as the HPRC release
#' 2.1 walk file the JBrowse HPRC demo hosts. Range requests fetch only the
#' blocks the region needs, and the reference sample's walk comes first.
#'
#' @param path A GFA file, optionally gzipped, local or a URL; or a
#'   `.walks.bed.gz` file with `region`.
#' @param reference The name of the path to draw as the reference, which the
#'   layout puts first. By default the first path in the file.
#' @param region On a walk file, the locus to cut, such as
#'   `"chr6:160,653,940-160,654,130"`.
#' @param haplotypes On a walk file, the `sample#haplotype` walks to keep,
#'   every one when `NULL`.
#' @param context On a walk file, bp of reference kept past each end of
#'   `region`.
#' @return A list of `nodes` (a data frame of `name` and `seq`, or
#'   `sequence_length` where a segment's sequence is `*`) and `tracks`.
#' @export
#' @examples
#' \dontrun{
#' walks <- "https://jbrowse.org/demos/hprc/hprc-v2.1-mc-grch38-f2.GRCh38.walks.bed.gz"
#' g <- read_gfa(walks, region = "chr6:160,653,940-160,654,130",
#'               haplotypes = c("HG00097#1", "HG00133#2"))
#' }
read_gfa <- function(path, reference = NULL, region = NULL, haplotypes = NULL,
                     context = 0) {
  if (!is.null(region)) {
    return(order_tracks(cut_walks(path, region, haplotypes, context), reference))
  }
  lines <- gfa_lines(path)
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
         index_of_first_base = as.numeric(f[5]))
  })
  tracks <- c(paths, walks)
  if (length(tracks) == 0) {
    stop("The GFA has no P or W lines to draw.", call. = FALSE)
  }
  order_tracks(list(nodes = nodes, tracks = tracks), reference)
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

gfa_lines <- function(path) {
  if (grepl("^(https?|ftp)://", path)) {
    local <- tempfile()
    on.exit(unlink(local))
    utils::download.file(path, local, mode = "wb", quiet = TRUE)
    path <- local
  }
  con <- gzfile(path)
  on.exit(close(con), add = TRUE, after = FALSE)
  readLines(con)
}

# The start of a subpath, named `name[start-end]` as vg writes it or
# `name:start-end` as odgi does, and otherwise 0
path_start <- function(name) {
  m <- regmatches(name, regexec("(\\[|:)([0-9]+)(-[0-9]+)?\\]?$", name))[[1]]
  if (length(m) == 0) 0 else as.numeric(m[3])
}
