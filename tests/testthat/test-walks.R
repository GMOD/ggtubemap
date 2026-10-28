walk_file <- test_path("testdata", "ecoli_pggb.K12.walks.bed.gz")

test_that("read_gfa cuts a region out of a walk file, reference first", {
  g <- read_gfa(walk_file, region = "chr:1004500-1004961")
  names <- vapply(g$tracks, `[[`, "", "name")
  expect_equal(names[1], "K12#1#chr")
  expect_setequal(sub("#.*", "", names), c("K12", "CFT073", "IAI39", "NCTC86", "Sakai"))
  steps <- sub("^-", "", unlist(lapply(g$tracks, `[[`, "sequence")))
  expect_true(all(steps %in% g$nodes$name))
  expect_s3_class(tubemap_layout(g), "tubemap")
})

test_that("haplotypes keeps the reference and the walks asked for", {
  g <- read_gfa(walk_file, region = "chr:1004500-1004961", haplotypes = "IAI39#1")
  expect_equal(vapply(g$tracks, `[[`, "", "name"), c("K12#1#chr", "IAI39#1#chr"))
})

test_that("a walk the file abridged cuts in full, as from a file that did not", {
  abridged <- test_path("testdata", "ecoli_pggb_abridged.K12.walks.bed.gz")
  expect_match(readLines(gzfile(abridged)), "\tabridged\t", all = FALSE)
  tracks <- function(file) {
    g <- read_gfa(file, region = "chr:1004501-1004961")
    g$tracks[order(vapply(g$tracks, `[[`, "", "name"))]
  }
  expect_equal(tracks(abridged), tracks(walk_file))
})

test_that("a bare sequence name finds the PanSN one", {
  expect_error(read_gfa(walk_file, region = "chrX:1-10"), "no sequence chrX")
})

test_that("a byte range reads the same from a file and from a URL", {
  skip_on_os("windows")
  url <- paste0("file://", normalizePath(walk_file))
  expect_identical(fetch_range(url, 10, 20), fetch_range(walk_file, 10, 20))
  expect_identical(fetch_range(walk_file, 0, -1), readBin(walk_file, "raw", file.size(walk_file)))
})

test_that("a region is a 1-based locus, one base or a span, and a 0-based or reversed one is refused", {
  expect_equal(parse_region("chr:7")[c("start", "end")], list(start = 6, end = 7))
  expect_error(read_gfa(walk_file, region = "chr:0-10"), "1 <= start <= end")
  expect_error(read_gfa(walk_file, region = "chr:200-100"), "1 <= start <= end")
})

test_that("a walk file with no index beside it names the index it needs", {
  copy <- file.path(tempdir(), "lone.walks.bed.gz")
  file.copy(walk_file, copy, overwrite = TRUE)
  expect_error(read_gfa(copy, region = "chr:1004500-1004961"), "lone.walks.bed.gz.tbi does not exist")
})

test_that("a graph with no bases draws at normal node widths", {
  g <- read_gfa(walk_file, region = "chr:1004500-1004961")
  expect_true(all(is.na(g$nodes$seq)))
  tm <- tubemap_layout(g)
  expect_equal(nrow(tm$bases), 0)
  expect_no_error(ggplot2::ggplot_build(autoplot(tm)))
})
