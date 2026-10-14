built_layers <- function(p) {
  unname(vapply(p$layers, function(l) class(l$geom)[1], ""))
}

test_that("autoplot draws tubes, then nodes, then text", {
  tm <- tubemap_layout(tubemap_example("brca1"))
  p <- autoplot(tm)
  expect_s3_class(p, "ggplot")
  geoms <- built_layers(p)
  expect_equal(geoms[1:3], c("GeomPolygon", "GeomPolygon", "GeomTubemapOutline"))
  expect_true("GeomTubemapText" %in% geoms)
  expect_true("GeomRect" %in% geoms || all(tm$mismatches$type != "deletion"))
  expect_no_error(ggplot_build(p))
})

test_that("compressed widths leave the sequence out", {
  tm <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
  expect_false("GeomTubemapText" %in% built_layers(autoplot(tm)))
})

test_that("a haplotypes mapping replaces the fill and its scale", {
  tm <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
  tm$shapes$phase <- sub("^[^#]+#([^#]+)#.*", "\\1", tm$shapes$name)
  p <- autoplot(tm, haplotypes = aes(fill = phase))
  fills <- unique(ggplot_build(p)$data[[1]]$fill)
  expect_length(fills, length(unique(tm$shapes$phase[tm$shapes$type == "haplotype"])))
})

test_that("a reads fill takes the scale and the haplotypes keep their colours", {
  tm <- tubemap_layout(tubemap_example("brca1"))
  data <- ggplot_build(autoplot(tm, reads = aes(fill = mapping_quality)))$data
  expect_equal(unique(data[[1]]$fill), "grey15")
  expect_gt(length(unique(data[[2]]$fill)), 1)
})

test_that("opaque tubes get a seam stroke in their fill, translucent ones none", {
  tm <- tubemap_layout(tubemap_example("brca1"))
  reads <- tm$shapes$track_type == "read"
  tm$shapes$mapping_quality[reads] <- ifelse(tm$shapes$track_id[reads] %% 2 == 0, 10, 60)
  data <- ggplot_build(autoplot(tm))$data
  haplotypes <- data[[1]]
  expect_equal(haplotypes$colour, haplotypes$fill)
  reads <- data[[2]]
  translucent <- reads$alpha < 1
  expect_true(any(translucent) && !all(translucent))
  expect_true(all(is.na(reads$colour[translucent])))
  expect_equal(reads$colour[!translucent], unclass(reads$fill[!translucent]))
})

test_that("text and outlines scale with the panel's physical size", {
  grDevices::pdf(NULL)
  on.exit(grDevices::dev.off())
  grid::pushViewport(grid::viewport(width = unit(2, "inches")))
  # 144 layout px across 2 inches: one px is one point
  expect_equal(points_per_px(144), 1)
  grid::popViewport()
  grid::pushViewport(grid::viewport(width = unit(4, "inches")))
  expect_equal(points_per_px(144), 2)
})

test_that("text below the minimum size is dropped", {
  grDevices::pdf(NULL)
  on.exit(grDevices::dev.off())
  grid::pushViewport(grid::viewport(width = unit(1, "inches")))
  data <- data.frame(x = 0.5, y = 0.5, label = "A", colour = "black", size = 14,
                     alpha = NA, family = "mono", fontface = 1, hjust = 0.5,
                     vjust = 0)
  small <- gTree(data = data, px_range = 10000, min_size = 1.5, cl = "tubemap_text")
  expect_length(makeContent(small)$children, 0)
  large <- gTree(data = data, px_range = 100, min_size = 1.5, cl = "tubemap_text")
  text <- makeContent(large)$children[[1]]
  expect_equal(text$gp$fontsize, 14 * 72 / 100)
})

test_that("tubemap_size prints the layout at the asked pixels per inch", {
  tm <- tubemap_layout(tubemap_example("brca1"), node_width = "compressed")
  b <- tm$bounds
  expect_equal(tubemap_size(tm, px_per_in = 100, pad = 0),
               c(width = (b$maxX - b$minX) / 100, height = (b$maxY - b$minY) / 100))
  expect_equal(tubemap_size(tm, px_per_in = 100, xlim = c(0, 300))[["width"]], 3)
})

test_that("autoplot zooms without replacing its scale or coord", {
  tm <- tubemap_layout(tubemap_example("brca1"))
  p <- expect_silent(autoplot(tm, xlim = c(250, 900)))
  expect_equal(p$coordinates$limits$x, c(250, 900))
})
