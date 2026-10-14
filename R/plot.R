#' Draw a tube map
#'
#' Puts the [tubemap_layers] together in sequenceTubeMap's order: haplotypes,
#' reads, node outlines, then sequence, read mismatches and facet labels. The
#' result is an ordinary ggplot, so scales, themes and further layers add on
#' as usual.
#'
#' @param object A [tubemap_layout()].
#' @param haplotypes,reads Aesthetics for the haplotype and read tubes, added to
#'   the defaults of [geom_tubemap_haplotypes()] and [geom_tubemap_reads()].
#'   Map these here rather than adding a second tube layer, which would draw
#'   over the nodes. Both layers share one fill scale, so a `fill` mapped on
#'   the reads alone takes it, and the haplotypes keep [scale_fill_tubemap()]'s
#'   colours without a legend.
#' @param sequence Print each node's bases. By default, when nodes are drawn
#'   at `"normal"` width, the only width at which bases fit.
#' @param mismatches Draw read mismatches; by default under the same rule.
#' @param xlim,ylim Limits in layout pixels, to zoom in on part of the map, as
#'   in [coord_tubemap()].
#' @param ... Unused.
#' @return A ggplot. When neither `haplotypes` nor `reads` maps `fill`, it
#'   carries [scale_fill_tubemap()], whose legend is dropped past 12
#'   haplotypes; a `fill` mapping brings its own scale.
#' @exportS3Method ggplot2::autoplot
#' @examples
#' tm <- tubemap_layout(tubemap_example("example-6"))
#' ggplot2::autoplot(tm)
#'
#' # colour by a column of your own, here the haplotype in each PanSN name
#' micb <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
#' micb$shapes$phase <- sub("^[^#]+#([^#]+)#.*", "\\1", micb$shapes$name)
#' ggplot2::autoplot(micb, haplotypes = ggplot2::aes(fill = phase))
autoplot.tubemap <- function(object, haplotypes = NULL, reads = NULL,
                             sequence = object$node_width == "normal",
                             mismatches = sequence, xlim = NULL, ylim = NULL,
                             ...) {
  levels <- nlevels(object$shapes$haplotype)
  default_fill <- is.null(haplotypes$fill) && is.null(reads$fill)
  if (is.null(haplotypes$fill) && !is.null(reads$fill)) {
    object$shapes$.haplotype_fill <-
      scale_fill_tubemap()$palette(levels)[object$shapes$haplotype]
    haplotypes <- merge_aes(aes(fill = I(.haplotype_fill)), haplotypes)
  }
  ggplot() +
    geom_tubemap_haplotypes(object, haplotypes) +
    geom_tubemap_reads(object, reads) +
    geom_tubemap_nodes(object) +
    (if (sequence) geom_tubemap_sequence(object)) +
    (if (mismatches) geom_tubemap_mismatches(object)) +
    geom_tubemap_panel_labels(object) +
    (if (default_fill) {
      scale_fill_tubemap(guide = if (levels > 12) "none" else "legend")
    }) +
    coord_tubemap(object, xlim = xlim, ylim = ylim) +
    theme_tubemap()
}

#' @export
plot.tubemap <- function(x, ...) {
  print(autoplot.tubemap(x, ...))
  invisible(x)
}

#' Haplotype colours
#'
#' The reference, which the layout always takes as the first haplotype, in
#' near-black, and the rest from a qualitative palette.
#'
#' @param reference Colour of the first level.
#' @param palette A function of `n` giving the other colours.
#' @param ... Passed to [ggplot2::discrete_scale()].
#' @export
scale_fill_tubemap <- function(reference = "grey15",
                               palette = function(n) grDevices::hcl.colors(n, "Dark 3"),
                               ...) {
  discrete_scale(
    "fill",
    palette = function(n) c(reference, if (n > 1) palette(n - 1)),
    name = "haplotype", na.translate = FALSE, ...
  )
}

#' A blank theme for tube maps
#'
#' [ggplot2::theme_void()] with the legend below, in a size that reads at
#' figure scale.
#'
#' @param base_size Base font size, in points.
#' @export
theme_tubemap <- function(base_size = 9) {
  theme_void(base_size = base_size) +
    theme(
      legend.position = "bottom",
      legend.key.size = unit(base_size, "pt"),
      plot.background = element_rect(fill = "white", colour = NA),
      plot.margin = margin(4, 4, 4, 4)
    )
}

#' Output size for a tube map
#'
#' The width and height in inches at which the whole map prints at
#' `px_per_in` layout pixels per inch. Text and outlines scale with the map
#' at any size; at the default 96 they match sequenceTubeMap at 100% zoom.
#'
#' @param tubemap A [tubemap_layout()].
#' @param px_per_in Layout pixels per inch.
#' @param pad As in [coord_tubemap()].
#' @param legend Extra height in inches to leave for a legend.
#' @param xlim,ylim As in [coord_tubemap()], for a map zoomed in on part of
#'   the layout.
#' @return A named vector of `width` and `height`, to pass to
#'   [ggplot2::ggsave()].
#' @export
#' @examples
#' tm <- tubemap_layout(tubemap_example("brca1"), node_width = "compressed")
#' tubemap_size(tm)
tubemap_size <- function(tubemap, px_per_in = 96, pad = 20, legend = 0,
                         xlim = NULL, ylim = NULL) {
  lim <- tubemap_limits(tubemap, xlim, ylim, pad)
  c(
    width = abs(diff(lim$x)) / px_per_in,
    height = abs(diff(lim$y)) / px_per_in + legend
  )
}
