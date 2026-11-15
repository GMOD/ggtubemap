# A region of a walk file, cut in V8 by @jbrowse/graph-walks, which reads the
# file's directory by its name with .idx after it
cut_walks <- function(path, region, haplotypes, context) {
  check_walk_file(path)
  json <- js_call(
    "cutWalks",
    c(
      list(file = path),
      if (!is.null(context)) list(context = context),
      if (length(haplotypes)) list(haplotypes = as.list(haplotypes)),
      parse_region(region)
    ),
    await = TRUE
  )
  out <- jsonlite::fromJSON(json, simplifyVector = FALSE)
  absent <- left_out(haplotypes, vapply(out$tracks, `[[`, "", "name"),
                     as_frame(out$absent))
  warn_absent(absent, region)
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
    }),
    left_out = data.frame(
      haplotype = as.character(names(absent)),
      reason = as.character(ifelse(vapply(absent, nrow, 0L) > 0,
                                   "no step on the reference here",
                                   "no walk near here in the file")),
      stringsAsFactors = FALSE
    )
  )
}

of_haplotype <- function(names, haplotype) {
  names <- as.character(names)
  names == haplotype | startsWith(names, paste0(haplotype, "#"))
}

bp <- function(x) format(x, big.mark = ",", scientific = FALSE, trim = TRUE)

# What a walk does where it leaves the reference and rejoins it, from the
# cut's departures for it: the one leaving and rejoining nearest the region,
# and how many there are where a walk jumps across it more than once
departure_text <- function(d) {
  d <- unique(d[c("from", "to", "own_bp", "missing_bp", "switch")])
  if (nrow(d) == 0) {
    return("no walk near the region in the file")
  }
  d <- d[order(d$to - d$from), ]
  sprintf(
    "leaves the reference at %s and rejoins it at %s%s, with %s%s",
    bp(d$from[1]), bp(d$to[1]), if (d$switch[1]) " on the other strand" else "",
    if (d$own_bp[1] == 0) {
      "no sequence of its own between"
    } else {
      paste0(bp(d$own_bp[1]), " bp of its own between",
             if (d$missing_bp[1] > 0) paste0(", ", bp(d$missing_bp[1]), " bp of it not in the graph"))
    },
    if (nrow(d) > 1) sprintf(", the shortest of its %d jumps across the region", nrow(d)) else ""
  )
}

# The haplotypes asked for, or with none asked every one the cut holds a
# departure of, that get no track, each with its departures across the region
left_out <- function(haplotypes, names, absent) {
  asked <- if (length(haplotypes)) {
    haplotypes
  } else {
    unique(sub("^([^#]*#[^#]*)#.*$", "\\1", absent$name))
  }
  missing <- asked[!vapply(asked, function(h) any(of_haplotype(names, h)), logical(1))]
  lapply(stats::setNames(missing, missing), function(h) {
    absent[of_haplotype(absent$name, h), , drop = FALSE]
  })
}

# A haplotype left out says what each does over the region instead, and the
# context that would reach where it leaves or rejoins
warn_absent <- function(rows, region) {
  if (length(rows)) {
    missing <- names(rows)
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
        "%s is an older walk file, which ggtubemap no longer reads: rebuild it with gfa-to-tabix 5.0 or later, which writes a .walks.gz and its .walks.gz.idx",
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
