golden <- function(name) {
  jsonlite::fromJSON(test_path("golden", paste0(name, ".json")), simplifyVector = FALSE)
}

placed_nodes <- function(g) {
  nodes <- Filter(function(n) !is.null(n$x), g$nodes)
  data.frame(
    name = vapply(nodes, `[[`, "", "name"),
    x = vapply(nodes, `[[`, 0, "x"),
    y = vapply(nodes, `[[`, 0, "y"),
    pixel_width = vapply(nodes, `[[`, 0, "pixelWidth")
  )
}

expect_nodes_match <- function(tm, g) {
  want <- placed_nodes(g)
  got <- tm$nodes[match(want$name, tm$nodes$name), ]
  expect_equal(got$x, want$x, tolerance = 1e-9)
  expect_equal(got$y, want$y, tolerance = 1e-9)
  expect_equal(got$pixel_width, want$pixel_width)
}

# The corner of every rectangle the layout drew, as golden and tubemap each
# record it, the tubemap's being one past the inclusive end core reports
rectangle_corners <- function(rects) {
  sort(paste(round(rects$x, 6), round(rects$y, 6)))
}

test_that("QuickJS reproduces core's golden layout of example-6", {
  g <- golden("example-6.default")
  tm <- tubemap_layout(tubemap_example("example-6"))
  expect_equal(unlist(tm$bounds), unlist(g$bounds), tolerance = 1e-9)
  expect_nodes_match(tm, g)

  rects <- tm$shapes[tm$shapes$shape == "rectangle", ]
  starts <- rects[!duplicated(rects$group), ]
  want <- data.frame(
    x = vapply(g$rectangles, `[[`, 0, "xStart"),
    y = vapply(g$rectangles, `[[`, 0, "yStart")
  )
  expect_equal(rectangle_corners(starts), rectangle_corners(want))
})

test_that("compressed widths and reads match core's golden brca1", {
  g <- golden("brca1.compressed")
  tm <- tubemap_layout(tubemap_example("brca1"), node_width = "compressed")
  expect_equal(unlist(tm$bounds), unlist(g$bounds), tolerance = 1e-9)
  expect_nodes_match(tm, g)
})

test_that("an inversion draws one turn per golden corner and vertical rectangle", {
  g <- golden("example-2.default")
  tm <- tubemap_layout(jsonlite::fromJSON(test_path("golden", "example-2.input.json"),
                                          simplifyVector = FALSE))
  expect_nodes_match(tm, g)
  turns <- tm$shapes[tm$shapes$shape == "turn", ]
  expect_equal(length(unique(turns$group)),
               length(g$corners) + length(g$verticalRectangles))
})

test_that("facets stack where core's golden puts them, each labelled", {
  g <- golden("example-6.facet-sample")
  graph <- tubemap_example("example-6")
  # as core's golden test splits them
  graph$reads <- Map(function(r, i) {
    r$sample_name <- if (i < 3) "S1" else "S2"
    r
  }, graph$reads, seq_along(graph$reads) - 1)
  tm <- tubemap_layout(graph, facet_by = "sample_name")
  expect_equal(unlist(tm$bounds), unlist(g$bounds), tolerance = 1e-9)
  expect_equal(tm$panels$offset_y, vapply(g$panels, `[[`, 0, "offsetY"))
  expect_equal(tm$panels$label, c("Sample S1 · 3 reads", "Sample S2 · 2 reads"))
})

test_that("a path through one node stays a path", {
  graph <- list(
    nodes = data.frame(name = c("1", "2"), seq = c("ACGT", "TT")),
    tracks = list(
      list(name = "ref", sequence = c("1", "2")),
      list(name = "short", sequence = "1")
    )
  )
  tm <- tubemap_layout(graph)
  expect_setequal(as.character(tm$shapes$name), c("ref", "short"))
  expect_equal(levels(tm$shapes$haplotype), c("ref", "short"))
})

test_that("reads without ids number on past the haplotypes", {
  graph <- tubemap_example("example-6")
  strip_id <- function(t) {
    t$id <- NULL
    t
  }
  graph$tracks <- lapply(graph$tracks, strip_id)
  graph$reads <- lapply(graph$reads, strip_id)
  tm <- tubemap_layout(graph)
  expect_equal(sum(tm$tracks$type == "haplotype"), length(graph$tracks))
  expect_equal(sum(tm$tracks$type == "read"), length(graph$reads))
  haplotypes <- tm$shapes[tm$shapes$type == "haplotype", ]
  expect_false(anyNA(haplotypes$haplotype))
})

test_that("tracks may come as a data frame with a list column", {
  graph <- list(
    nodes = data.frame(name = c("1", "2", "3"), seq = c("ACGT", "A", "G")),
    tracks = data.frame(name = c("ref", "alt"))
  )
  graph$tracks$sequence <- list(c("1", "2"), c("1", "3"))
  tm <- tubemap_layout(graph)
  expect_equal(sum(tm$tracks$type == "haplotype"), 2)
})

test_that("bases sit one per base across each node", {
  tm <- tubemap_layout(tubemap_example("example-6"))
  node <- tm$nodes[which.max(tm$nodes$sequence_length), ]
  bases <- tm$bases[tm$bases$node == node$name, ]
  expect_equal(paste(bases$base, collapse = ""), node$seq)
  expect_true(all(diff(bases$x) > 0))
  expect_true(min(bases$x) > node$left && max(bases$x) < node$right)
})

test_that("read mismatches carry their read", {
  tm <- tubemap_layout(tubemap_example("brca1"))
  mm <- tm$mismatches
  expect_gt(nrow(mm), 0)
  expect_true(all(mm$read_id %in% tm$tracks$id[tm$tracks$type == "read"]))
  expect_true(all(mm$x_end >= mm$x))
})

test_that("nothing to draw is an error", {
  graph <- list(nodes = data.frame(name = "1", seq = "A"), tracks = list())
  expect_error(tubemap_layout(graph), "No visible track")
})
