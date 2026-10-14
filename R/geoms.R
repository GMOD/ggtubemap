#' @import ggplot2
#' @importFrom grid gTree gList gpar textGrob polygonGrob convertWidth unit
#' @importFrom grid setChildren makeContent
NULL

merge_aes <- function(base, extra) {
  base[names(extra)] <- extra
  base
}

tubemap_layer <- function(geom, data, mapping, params, show.legend = FALSE) {
  layer(
    data = data, mapping = mapping, stat = "identity", geom = geom,
    position = "identity", show.legend = show.legend, inherit.aes = FALSE,
    params = params
  )
}

# Points per layout pixel in the panel being drawn. coord_tubemap() keeps the
# aspect ratio at 1, so x alone gives it.
points_per_px <- function(px_range) {
  convertWidth(unit(1, "npc"), "inches", valueOnly = TRUE) / px_range * 72
}

# Text and strokes sized in layout pixels, so they scale with the drawing at
# any output size, as they do when sequenceTubeMap zooms. Text shrunk below
# `min_size` points is dropped, as the viewer hides sequence when zoomed out.
# With `points`, size is in points and stays put, as the viewer's labels do.
GeomTubemapText <- ggproto("GeomTubemapText", Geom,
  required_aes = c("x", "y", "label"),
  default_aes = aes(colour = "black", size = 14, alpha = NA, family = "mono",
                    fontface = 1, hjust = 0.5, vjust = 0),
  draw_panel = function(data, panel_params, coord, min_size = 1.5,
                        points = FALSE) {
    px_range <- if (points) NA else diff(panel_params$x.range)
    data <- coord$transform(data, panel_params)
    gTree(data = data, px_range = px_range, min_size = min_size,
          cl = "tubemap_text")
  },
  draw_key = draw_key_text
)

#' @export
makeContent.tubemap_text <- function(x) {
  d <- x$data
  fontsize <- if (is.na(x$px_range)) d$size else d$size * points_per_px(x$px_range)
  keep <- fontsize >= x$min_size
  if (!any(keep)) {
    return(setChildren(x, gList()))
  }
  d <- d[keep, , drop = FALSE]
  setChildren(x, gList(textGrob(
    d$label, d$x, d$y, default.units = "npc", hjust = d$hjust, vjust = d$vjust,
    gp = gpar(col = alpha(d$colour, d$alpha), fontsize = fontsize[keep],
              fontfamily = d$family, fontface = d$fontface)
  )))
}

GeomTubemapOutline <- ggproto("GeomTubemapOutline", Geom,
  required_aes = c("x", "y", "group"),
  default_aes = aes(colour = "black", fill = "white", alpha = 0.4,
                    linewidth = 2, linetype = 1),
  draw_panel = function(data, panel_params, coord) {
    px_range <- diff(panel_params$x.range)
    data <- coord$transform(data, panel_params)
    gTree(data = data, px_range = px_range, cl = "tubemap_outline")
  },
  draw_key = draw_key_polygon
)

#' @export
makeContent.tubemap_outline <- function(x) {
  d <- x$data
  first <- d[!duplicated(d$group), , drop = FALSE]
  # grid's lwd unit is 1/96 inch, or 3/4 of a point
  lwd <- pmax(first$linewidth * points_per_px(x$px_range) * 96 / 72, 0.25)
  setChildren(x, gList(polygonGrob(
    d$x, d$y, id = d$group, default.units = "npc",
    gp = gpar(col = first$colour, fill = alpha(first$fill, first$alpha),
              lwd = lwd, lty = first$linetype)
  )))
}

tube_layer <- function(data, mapping, seam, params) {
  if (seam && is.null(mapping$colour)) {
    # a hairline in each tube's own fill closes the gap antialiasing leaves
    # between tubes that share an edge; a translucent tube takes none, or its
    # edge would darken where stroke and fill overlap
    mapping$colour <- aes(colour = after_scale(
      ifelse(is.na(alpha) | alpha >= 1, fill, NA)
    ))$colour
    params$linewidth <- params$linewidth %||% 0.1
  }
  tubemap_layer(GeomPolygon, data, mapping, params, show.legend = NA)
}

#' Tube map layers
#'
#' Each layer draws one part of a [tubemap_layout()]. They take the layout
#' as their first argument and ignore the plot's data and aesthetics, so they
#' combine freely with each other and with ordinary ggplot2 layers.
#' [autoplot.tubemap()] puts them together with sequenceTubeMap's defaults.
#'
#' Shape tables carry their track's `name`, `haplotype`, `strand`,
#' `mapping_quality`, `sample_name`, `read_group` and `freq`, so any of those
#' can be mapped. Text sizes and outline widths are in layout pixels and scale
#' with the plot.
#'
#' @param tubemap A [tubemap_layout()].
#' @param mapping Aesthetics for the layer, added to its defaults.
#' @param seam Stroke each opaque tube in its own fill, so no hairline of
#'   background shows between neighbouring tubes.
#' @param ... Fixed aesthetics, such as `fill = "grey40"` or `size = 12`.
#' @name tubemap_layers
NULL

#' @describeIn tubemap_layers The haplotype tubes, filled by `haplotype`.
#' @export
geom_tubemap_haplotypes <- function(tubemap, mapping = NULL, seam = TRUE, ...) {
  data <- tubemap$shapes[tubemap$shapes$type == "haplotype", , drop = FALSE]
  mapping <- merge_aes(aes(x = x, y = y, group = group, fill = haplotype), mapping)
  tube_layer(data, mapping, seam, list(...))
}

#' @describeIn tubemap_layers The reads, coloured by strand with opacity by
#'   mapping quality unless `mapping` says otherwise.
#' @export
geom_tubemap_reads <- function(tubemap, mapping = NULL, seam = TRUE, ...) {
  data <- tubemap$shapes[tubemap$shapes$type == "read", , drop = FALSE]
  data$.strand_fill <- ifelse(is.na(data$strand) | data$strand == "+",
                              "#c53030", "#2b6cb0")
  data$.mapq_alpha <- ifelse(is.na(data$mapping_quality), 1,
                             0.25 + 0.75 * pmin(data$mapping_quality, 60) / 60)
  mapping <- merge_aes(
    aes(x = x, y = y, group = group, fill = I(.strand_fill),
        alpha = I(.mapq_alpha)),
    mapping
  )
  tube_layer(data, mapping, seam, list(...))
}

#' @describeIn tubemap_layers The node outlines, translucent white with a
#'   black edge 2 layout pixels wide.
#' @export
geom_tubemap_nodes <- function(tubemap, mapping = NULL, ...) {
  mapping <- merge_aes(aes(x = x, y = y, group = group), mapping)
  tubemap_layer(GeomTubemapOutline, tubemap$outlines, mapping, list(...))
}

#' @describeIn tubemap_layers Each node's bases, 14 layout pixels high, in a
#'   monospaced font. Bases that would print smaller than `min_size` points
#'   are left out.
#' @param min_size Smallest text, in points, that a text layer draws.
#' @export
geom_tubemap_sequence <- function(tubemap, mapping = NULL, min_size = 1.5, ...) {
  mapping <- merge_aes(aes(x = x, y = y, label = base), mapping)
  tubemap_layer(GeomTubemapText, tubemap$bases, mapping,
                list(min_size = min_size, ...))
}

#' @describeIn tubemap_layers Each read's differences from the graph:
#'   substituted bases in text, deletions as grey bars, insertions as `*`.
#' @param soft_clips Mark insertions at a read's ends, which
#'   sequenceTubeMap hides by default.
#' @param deletion_fill Fill of a deletion's bar.
#' @export
geom_tubemap_mismatches <- function(tubemap, soft_clips = FALSE, min_size = 1.5,
                                    deletion_fill = "grey50") {
  mm <- tubemap$mismatches
  if (nrow(mm) == 0) {
    return(list())
  }
  if (!soft_clips) {
    mm <- mm[!mm$soft_clip, , drop = FALSE]
  }
  deletions <- mm[mm$type == "deletion", , drop = FALSE]
  substitutions <- mm[mm$type == "substitution", , drop = FALSE]
  insertions <- mm[mm$type == "insertion", , drop = FALSE]
  text <- function(data, label, dx) {
    tubemap_layer(GeomTubemapText, data,
                  merge_aes(aes(x = x + dx, y = y + height), label),
                  list(min_size = min_size, size = 12, hjust = 0))
  }
  list(
    if (nrow(deletions) > 0) {
      tubemap_layer(GeomRect, deletions,
                    aes(xmin = x, xmax = x_end, ymin = y, ymax = y + height),
                    list(fill = deletion_fill))
    },
    if (nrow(substitutions) > 0) text(substitutions, aes(label = seq), 1),
    if (nrow(insertions) > 0) text(insertions, aes(label = "*"), -3)
  )
}

#' @describeIn tubemap_layers Each facet panel's label above it, with a
#'   dashed rule between panels, as sequenceTubeMap draws them. Labels are
#'   `size` points at any scale.
#' @param size Label size in points.
#' @export
geom_tubemap_panel_labels <- function(tubemap, size = 8) {
  panels <- tubemap$panels[!is.na(tubemap$panels$label), , drop = FALSE]
  if (nrow(panels) == 0) {
    return(list())
  }
  b <- tubemap$bounds
  panels$x <- b$minX
  # placeFacets leaves 30 px for a label above each panel and 40 between
  # panels; the rule splits the gap and the label hangs just under it
  panels$rule_y <- panels$top - 30 - 40 / 2
  panels$label_y <- panels$rule_y + 4
  rules <- panels[-1, , drop = FALSE]
  list(
    if (nrow(rules) > 0) {
      tubemap_layer(GeomSegment, rules,
                    aes(x = x, xend = b$maxX, y = rule_y, yend = rule_y),
                    list(colour = "#bbbbbb", linetype = "dashed", linewidth = 0.3))
    },
    tubemap_layer(GeomTubemapText, panels, aes(x = x, y = label_y, label = label),
                  list(points = TRUE, min_size = 0, size = size, hjust = 0,
                       vjust = 1, family = "sans", fontface = 2,
                       colour = "#333333"))
  )
}

tubemap_limits <- function(tubemap, xlim, ylim, pad) {
  b <- tubemap$bounds
  list(
    x = xlim %||% c(b$minX - pad, b$maxX + pad),
    y = ylim %||% c(b$minY - pad, b$maxY + pad)
  )
}

#' Coordinates for a tube map
#'
#' The layout's y runs downward and its curves assume square pixels, so a
#' tube map needs a reversed y scale and a fixed aspect ratio of 1.
#'
#' @param tubemap A [tubemap_layout()], whose bounds set the limits when
#'   `xlim` or `ylim` is not given.
#' @param xlim,ylim Limits in layout pixels, to zoom in on part of the map.
#' @param pad Margin around the bounds, in layout pixels.
#' @export
coord_tubemap <- function(tubemap = NULL, xlim = NULL, ylim = NULL, pad = 20) {
  if (!is.null(tubemap)) {
    lim <- tubemap_limits(tubemap, xlim, ylim, pad)
    xlim <- lim$x
    ylim <- lim$y
  }
  list(
    scale_y_reverse(),
    coord_fixed(ratio = 1, xlim = xlim,
                ylim = if (is.null(ylim)) NULL else sort(ylim, decreasing = TRUE),
                expand = is.null(tubemap) && is.null(xlim))
  )
}
