# A region of a walk file, cut in V8 by @jbrowse/graph-walks, which reads the
# file's directory by its name with .idx after it
cut_walks <- function(path, region, haplotypes, context) {
  check_walk_file(path)
  json <- js_call(
    "cutWalks",
    c(
      list(file = path, context = context),
      if (length(haplotypes)) list(haplotypes = as.list(haplotypes)),
      parse_region(region)
    ),
    await = TRUE
  )
  out <- jsonlite::fromJSON(json, simplifyVector = FALSE)
  warn_absent(haplotypes, vapply(out$tracks, `[[`, "", "name"),
              as_frame(out$absent), region)
  nodes <- out$nodes
  list(
    nodes = data.frame(
      name = unlist(nodes$name),
      seq = vapply(nodes$seq, function(s) if (is.null(s)) NA_character_ else s, ""),
      sequence_length = as.numeric(unlist(nodes$sequence_length)),
      stringsAsFactors = FALSE
    ),
    tracks = lapply(out$tracks, function(t) {
      t$sequence <- unlist(t$sequence)
      t
    })
  )
}

of_haplotype <- function(names, haplotype) {
  names <- as.character(names)
  names == haplotype | startsWith(names, paste0(haplotype, "#"))
}

bp <- function(x) format(x, big.mark = ",", scientific = FALSE, trim = TRUE)

# What a walk does where it leaves the reference and rejoins it, from the
# cut's departures for it
departure_text <- function(d) {
  d <- unique(d[c("from", "to", "own_bp", "missing_bp", "switch")])
  if (nrow(d) == 0) {
    return("no walk near the region in the file")
  }
  paste(sprintf(
    "leaves the reference at %s and rejoins it at %s%s, with %s",
    bp(d$from), bp(d$to), ifelse(d$switch, " on the other strand", ""),
    ifelse(
      d$own_bp == 0, "no sequence of its own between",
      paste0(bp(d$own_bp), " bp of its own between",
             ifelse(d$missing_bp > 0, paste0(", ", bp(d$missing_bp), " bp of it not in the graph"), ""))
    )
  ), collapse = "; ")
}

# A haplotype asked for whose walks take no step on the reference over the
# region gets no track; the warning says what each does there instead, and
# the context that would reach where it leaves or rejoins
warn_absent <- function(haplotypes, names, absent, region) {
  missing <- haplotypes[!vapply(haplotypes, function(h) any(of_haplotype(names, h)), logical(1))]
  if (length(missing)) {
    rows <- lapply(missing, function(h) absent[of_haplotype(absent$name, h), , drop = FALSE])
    text <- vapply(rows, departure_text, "")
    lines <- vapply(unique(text), function(t) {
      sprintf("- %s: %s", paste(missing[text == t], collapse = ", "), t)
    }, "")
    locus <- parse_region(region)
    reach <- unlist(lapply(rows, function(d) {
      if (nrow(d)) min(locus$start - d$from, d$to - locus$end)
    }))
    hint <- if (length(reach)) {
      sprintf("\n`context = %.0f` reaches where each leaves or rejoins the reference, to draw them.",
              ceiling(max(reach) / 1000) * 1000)
    } else {
      ""
    }
    warning(
      sprintf("No track for haplotypes with no step on the reference over %s:\n%s%s",
              region, paste(lines, collapse = "\n"), hint),
      call. = FALSE
    )
  }
}

is_walk_file <- function(path) grepl("\\.walks(\\.bed)?\\.gz$", bare_name(path))

check_walk_file <- function(path) {
  if (!is_walk_file(path)) {
    stop(
      sprintf("`region` cuts a gfa-to-tabix walk file, a .walks.gz; %s is not one", path),
      call. = FALSE
    )
  }
  if (grepl("\\.walks\\.bed\\.gz$", bare_name(path))) {
    stop(
      sprintf(
        "%s is an older walk file, which ggtubemap no longer reads: rebuild it with gfa-to-tabix 4.0 or later, which writes a .walks.gz and its .walks.gz.idx",
        path
      ),
      call. = FALSE
    )
  }
  directory <- beside(path, ".idx")
  if (!exists_at(directory)) {
    stop(sprintf("%s does not exist", directory), call. = FALSE)
  }
}
