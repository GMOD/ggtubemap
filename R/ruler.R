#' Layout x of sequence positions
#'
#' Finds where positions along the ruler track, the first track with an
#' `index_of_first_base`, fall in layout pixels: the centre of the base, where
#' [geom_tubemap_sequence()] prints it. Use it to place annotations on the map,
#' or to line other plots up with it.
#'
#' @param tubemap A [tubemap_layout()].
#' @param position Positions in the ruler track's coordinates.
#' @return Layout x for each position, `NA` where the track does not reach.
#' @export
#' @examples
#' tm <- tubemap_layout(tubemap_example("hprc-chrM"), node_width = "compressed")
#' tubemap_x(tm, c(1000, 5000, 10000))
tubemap_x <- function(tubemap, position) {
  r <- tubemap$ruler
  if (nrow(r) == 0) {
    stop("The layout has no ruler track; give a track an `index_of_first_base`.",
         call. = FALSE)
  }
  i <- findInterval(position, r$start)
  i[i == 0] <- NA
  offset <- position - r$start[i]
  offset[offset >= r$length[i]] <- NA
  along <- ifelse(r$reverse[i], r$length[i] - 1 - offset, offset)
  r$left[i] + (along + 0.5) / r$length[i] * (r$right[i] - r$left[i])
}

#' A ruler above the tube map
#'
#' An x axis along the top of the map in the ruler track's coordinates, as
#' sequenceTubeMap draws it. Candidate ticks fall every `interval` bases and,
#' at widths other than `"normal"`, at the start of every node, so short
#' nodes get a tick too. Ticks closer than `clearance` layout pixels to the
#' one before are dropped, and so is any label that would overlap another at
#' the size the plot prints.
#'
#' @param tubemap A [tubemap_layout()].
#' @param interval Bases between candidate ticks; by default 20 at `"normal"`
#'   width and 100 at the others.
#' @param clearance Least layout pixels between ticks.
#' @param ... Passed to [ggplot2::scale_x_continuous()].
#' @export
scale_x_tubemap <- function(tubemap, interval = NULL, clearance = 80, ...) {
  r <- tubemap$ruler
  if (nrow(r) == 0) {
    return(scale_x_continuous(...))
  }
  normal <- tubemap$node_width == "normal"
  interval <- interval %||% if (normal) 20 else 100
  first <- r$start[1]
  last <- r$start[nrow(r)] + r$length[nrow(r)] - 1
  from <- ceiling(first / interval) * interval
  position <- if (from <= last) seq(from, last, by = interval) else first
  if (!normal) {
    position <- unique(sort(c(position, r$start[r$length > 0])))
  }
  x <- tubemap_x(tubemap, position)
  keep <- !is.na(x)
  position <- position[keep][order(x[keep])]
  x <- sort(x[keep])
  taken <- logical(length(x))
  last_x <- -Inf
  for (k in seq_along(x)) {
    if (x[k] - last_x >= clearance) {
      taken[k] <- TRUE
      last_x <- x[k]
    }
  }
  breaks <- x[taken]
  # the spaces keep a gap between labels that check.overlap lets touch
  labels <- paste0(" ", format(position[taken], big.mark = ",",
                               scientific = FALSE, trim = TRUE), " ")
  scale_x_continuous(
    breaks = breaks, labels = function(x) labels[match(x, breaks)],
    position = "top", guide = guide_axis(check.overlap = TRUE), ...
  )
}
