walk_file <- test_path("testdata", "ecoli_pggb.K12.walks.gz")

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
  abridged <- test_path("testdata", "ecoli_pggb_abridged.K12.walks.gz")
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
  copy <- file.path(tempdir(), "lone.walks.gz")
  file.copy(walk_file, copy, overwrite = TRUE)
  expect_error(read_gfa(copy, region = "chr:1004500-1004961"), "lone.walks.gz.idx does not exist")
})

test_that("an older .walks.bed.gz is refused with the rebuild it needs", {
  expect_error(
    read_gfa("old.GRCh38.walks.bed.gz", region = "chr6:1-10"),
    "rebuild it with gfa-to-tabix 5.0 or later"
  )
})

test_that("a haplotype the cut cannot find is named in a warning", {
  expect_warning(
    g <- read_gfa(walk_file, region = "chr:1004500-1004961",
                  haplotypes = c("IAI39#1", "NOPE#1")),
    "- NOPE#1: no walk near the region in the file"
  )
  expect_equal(vapply(g$tracks, `[[`, "", "name"), c("K12#1#chr", "IAI39#1#chr"))
})

test_that("a left-out haplotype is described by its departures, and the context to draw it", {
  absent <- data.frame(
    name = c("A#1#c", "B#2#c", "C#1#c", "C#1#c"),
    from = c(1000, 4000, 4000, 4000),
    to = c(9000, 6000, 6000, 6000),
    own_bp = c(500, 0, 0, 0),
    missing_bp = c(200, 0, 0, 0),
    switch = FALSE
  )
  expect_warning(
    warn_absent(left_out(c("A#1", "B#2", "C#1"), "REF#0#c", absent), "c:5,001-5,100"),
    paste0(
      "- A#1: leaves the reference at 1,000 and rejoins it at 9,000, with 500 bp of its own between, 200 bp of it not in the graph\n",
      "- B#2, C#1: leaves the reference at 4,000 and rejoins it at 6,000, with no sequence of its own between\n",
      "`context = 4000`"
    ),
    fixed = TRUE
  )
  expect_no_warning(warn_absent(left_out("A#1", "A#1#c", absent), "c:5,001-5,100"))
})

# pggb's HG005#1 has 26 departures across chrY:16,160,000-16,163,000 and no
# step on the reference over it
test_that("a haplotype that jumps across the region many times is told by its shortest jump", {
  absent <- data.frame(
    name = "D#1#c",
    from = c(4990, 4000, 4995),
    to = c(9000, 60000, 266000),
    own_bp = 0,
    missing_bp = 0,
    switch = TRUE
  )
  expect_equal(
    departure_text(absent),
    "leaves the reference at 4,990 and rejoins it at 9,000 on the other strand, with no sequence of its own between, the shortest of its 3 jumps across the region"
  )
})

stepless <- test_path("testdata", "stepless.REF.walks.gz")

# REF walks seven 1 kb nodes, DEL >1>6>7, INS >1>8>6>7 through a 2 kb node of
# its own, and SNP >1>2>3>5>6>7, so none steps on chr1:3000-4000. The default
# context reaches SNP's steps on nodes 3 and 5, so these cuts keep none
test_that("a haplotype with no step on the reference over the region is named in a warning and under the map", {
  expect_warning(
    g <- read_gfa(stepless, region = "chr1:3201-3800", context = 0),
    paste0(
      "- DEL#1: leaves the reference at 1,000 and rejoins it at 5,000, with no sequence of its own between\n",
      "- INS#1: leaves the reference at 1,000 and rejoins it at 5,000, with 2,000 bp of its own between\n",
      "- SNP#1: leaves the reference at 3,000 and rejoins it at 4,000, with no sequence of its own between\n"
    ),
    fixed = TRUE
  )
  expect_equal(vapply(g$tracks, `[[`, "", "name"), "REF#0#chr1")
  expect_equal(g$left_out$haplotype, c("DEL#1", "INS#1", "SNP#1"))
  p <- autoplot(tubemap_layout(g))
  expect_equal(p$labels$caption, "Not drawn: DEL#1, INS#1, SNP#1 (no step on the reference here)")
  expect_no_error(ggplot2::ggplot_gtable(ggplot2::ggplot_build(p)))
})

test_that("the cut keeps the browser readers' context by default, which reaches SNP's steps", {
  expect_warning(
    g <- read_gfa(stepless, region = "chr1:3201-3800"),
    "`context = 2000` reaches where each leaves or rejoins",
    fixed = TRUE
  )
  expect_equal(vapply(g$tracks, `[[`, "", "name"), c("REF#0#chr1", "SNP#1#chr1"))
  expect_equal(g$tracks[[2]]$sequence, c("3", "5"))
  expect_equal(g$left_out$haplotype, c("DEL#1", "INS#1"))
})

test_that("the caption tells a haplotype the file lacks from one with no step here", {
  expect_warning(
    g <- read_gfa(stepless, region = "chr1:3201-3800", haplotypes = c("DEL#1", "NOPE#1"),
                  context = 0)
  )
  expect_equal(
    autoplot(tubemap_layout(g))$labels$caption,
    "Not drawn: DEL#1 (no step on the reference here); NOPE#1 (no walk near here in the file)"
  )
  drawn <- read_gfa(stepless, region = "chr1:1-1000")
  expect_equal(nrow(drawn$left_out), 0)
  expect_null(autoplot(tubemap_layout(drawn))$labels$caption)
})

test_that("a walk file needs a region, and a region needs a walk file", {
  expect_error(read_gfa(walk_file), "give the `region` to cut")
  gfa <- tempfile(fileext = ".gfa")
  writeLines(c("S\t1\tACGT", "P\tp\t1+\t*"), gfa)
  expect_error(read_gfa(gfa, region = "p:1-4"), "is not one")
})

test_that("a graph with no bases draws at normal node widths", {
  g <- read_gfa(walk_file, region = "chr:1004500-1004961")
  expect_true(all(is.na(g$nodes$seq)))
  tm <- tubemap_layout(g)
  expect_equal(nrow(tm$bases), 0)
  expect_no_error(ggplot2::ggplot_build(autoplot(tm)))
})
