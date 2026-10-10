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
#' @param path A GFA file, optionally gzipped.
#' @param reference The name of the path to draw as the reference, which the
#'   layout puts first. By default the first path in the file.
#' @return A list of `nodes` (a data frame of `name` and `seq`, or
#'   `sequence_length` where a segment's sequence is `*`) and `tracks`.
#' @export
read_gfa <- function(path, reference = NULL) {
  lines <- readLines(gzfile(path))
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
    list(name = f[2], sequence = paste0(oriented, substr(steps, 1, nchar(steps) - 1)))
  })
  walks <- lapply(fields[kind == "W"], function(f) {
    steps <- regmatches(f[7], gregexpr("[<>][^<>]+", f[7]))[[1]]
    oriented <- ifelse(startsWith(steps, "<"), "-", "")
    list(name = paste(f[2], f[3], f[4], sep = "#"),
         sequence = paste0(oriented, substring(steps, 2)))
  })
  tracks <- c(paths, walks)
  if (length(tracks) == 0) {
    stop("The GFA has no P or W lines to draw.", call. = FALSE)
  }
  if (!is.null(reference)) {
    first <- which(vapply(tracks, `[[`, "", "name") == reference)
    if (length(first) == 0) {
      stop(sprintf("No path named '%s'.", reference), call. = FALSE)
    }
    tracks <- c(tracks[first[1]], tracks[-first[1]])
  }
  list(nodes = nodes, tracks = tracks)
}
