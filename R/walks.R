# A region of a walk file, cut in V8 by @jbrowse/graph-walks
cut_walks <- function(path, region, haplotypes, context) {
  json <- js_context()$call(
    "cutWalks",
    c(
      list(file = path, index = paste0(path, ".tbi"), context = context),
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

# a 1-based inclusive locus, as a genome browser writes it, to the 0-based
# half-open range the walk file answers
parse_region <- function(region) {
  m <- regmatches(
    region,
    regexec("^\\s*([^:\\s]+):([0-9,]+)-([0-9,]+)\\s*$", region, perl = TRUE)
  )[[1]]
  if (!length(m)) {
    stop(sprintf("\"%s\" is not a region like chr6:160,653,940-160,654,130", region),
         call. = FALSE)
  }
  num <- function(s) as.numeric(gsub(",", "", s))
  list(refName = m[[2]], start = num(m[[3]]) - 1, end = num(m[[4]]))
}

is_url <- function(x) grepl("^(https?|ftp|file)://", x)

# V8 calls this through console.r.call for each byte range the reader wants;
# a negative length reads to the end
fetch_range <- function(location, position, length) {
  position <- as.numeric(position)
  length <- as.numeric(length)
  if (is_url(location)) url_range(location, position, length) else file_range(location, position, length)
}

file_range <- function(path, position, length) {
  left <- max(0, file.size(path) - position)
  n <- if (length < 0) left else min(length, left)
  if (n == 0) return(raw())
  con <- file(path, "rb")
  on.exit(close(con))
  seek(con, position)
  readBin(con, "raw", n)
}

# A server without range support answers 200 with the whole file, so the range
# is cut from that
url_range <- function(url, position, length) {
  if (length == 0) return(raw())
  handle <- curl::new_handle()
  ranged <- length > 0 || position > 0
  if (ranged) {
    last <- if (length > 0) sprintf("%.0f", position + length - 1) else ""
    curl::handle_setopt(handle, range = sprintf("%.0f-%s", position, last))
  }
  res <- curl::curl_fetch_memory(url, handle)
  if (res$status_code == 416) return(raw())
  if (res$status_code >= 400) {
    stop(sprintf("HTTP %d reading %s", res$status_code, url), call. = FALSE)
  }
  if (ranged && res$status_code == 200) {
    left <- max(0, length(res$content) - position)
    n <- if (length < 0) left else min(length, left)
    return(res$content[position + seq_len(n)])
  }
  res$content
}
