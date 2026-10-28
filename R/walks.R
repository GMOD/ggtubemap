# A region of a walk file, cut in V8 by @jbrowse/graph-walks
cut_walks <- function(path, region, haplotypes, context) {
  json <- js_context()$call(
    "cutWalks",
    c(
      list(file = path, index = index_or_tbi(path), context = context),
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
