write_gfa <- function(lines) {
  path <- tempfile(fileext = ".gfa")
  writeLines(lines, path)
  path
}

gfa <- c(
  "H\tVN:Z:1.1",
  "S\t1\tACGT",
  "S\t2\tA",
  "S\t3\t*\tLN:i:7",
  "S\t4\tTTGCA",
  "L\t1\t+\t2\t+\t0M",
  "P\tref\t1+,2+,4+\t*",
  "W\tHG002\t1\tchr1\t0\t10\t>1<3>4"
)

test_that("read_gfa reads segments, paths and walks", {
  g <- read_gfa(write_gfa(gfa))
  expect_equal(g$nodes$name, c("1", "2", "3", "4"))
  expect_equal(g$nodes$seq, c("ACGT", "A", NA, "TTGCA"))
  expect_equal(g$nodes$sequence_length, c(4, 1, 7, 5))
  expect_equal(g$tracks[[1]], list(name = "ref", sequence = c("1", "2", "4"),
                                   index_of_first_base = 0))
  expect_equal(g$tracks[[2]],
               list(name = "HG002#1#chr1", sequence = c("1", "-3", "4"),
                    index_of_first_base = 0))
})

test_that("subpath names and walks give the ruler its start", {
  expect_equal(path_start("GRCh38#0#chr6[31000000-31100000]"), 31000000)
  expect_equal(path_start("GRCh38#0#chr6:2000-3000"), 2000)
  expect_equal(path_start("GRCh38#0#chr6"), 0)
  tm <- tubemap_layout(read_gfa(write_gfa(sub("\tref\t", "\tref[100-112]\t", gfa))),
                       merge_nodes = FALSE)
  expect_equal(tm$ruler$start, c(100, 104, 105))
  expect_equal(tubemap_x(tm, c(100, 104, 99, 200)),
               c(tm$bases$x[1], tm$bases$x[tm$bases$node == "2"], NA, NA))
})

test_that("a walk's * start reads as unknown, and a segment of unknown length is refused", {
  g <- read_gfa(write_gfa(sub("\t0\t10\t", "\t*\t*\t", gfa)))
  expect_true(is.na(g$tracks[[2]]$index_of_first_base))
  expect_error(read_gfa(write_gfa(sub("\tLN:i:7", "", gfa))), "Segment 3 has neither")
})

test_that("read_gfa reads a file:// URL", {
  path <- write_gfa(gfa)
  expect_equal(read_gfa(paste0("file://", path))$nodes$name, c("1", "2", "3", "4"))
})

test_that("read_gfa puts the named reference first", {
  g <- read_gfa(write_gfa(gfa), reference = "HG002#1#chr1")
  expect_equal(g$tracks[[1]]$name, "HG002#1#chr1")
  expect_error(read_gfa(write_gfa(gfa), reference = "nope"), "No path named")
})

test_that("a GFA lays out, segments without sequence included", {
  tm <- tubemap_layout(read_gfa(write_gfa(gfa)), merge_nodes = FALSE)
  expect_setequal(unique(tm$nodes$name), c("1", "2", "3", "4"))
  expect_equal(tm$nodes$sequence_length[tm$nodes$name == "3"], 7)
})
