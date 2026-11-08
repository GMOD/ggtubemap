# A region of a walk file, cut in V8 by @jbrowse/graph-walks, which reads the
# file's directory by its name with .idx after it
cut_walks <- function(path, region, haplotypes, context) {
  check_walk_file(path)
  json <- js_context()$call(
    "cutWalks",
    c(
      list(file = path, context = context),
      if (length(haplotypes)) list(haplotypes = as.list(haplotypes)),
      parse_region(region)
    ),
    await = TRUE
  )
  out <- jsonlite::fromJSON(json, simplifyVector = FALSE)
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

check_walk_file <- function(path) {
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
