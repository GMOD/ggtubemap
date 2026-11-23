# REF walks seven 1 kb nodes, DEL >1>6>7, INS >1>8>6>7 through a 2 kb node of
# its own, and SNP >1>2>3>5>6>7
stepless <- test_path("testdata", "stepless.REF.walks.gz")
pggb <- test_path("testdata", "ecoli_pggb.K12.walks.gz")

# No fixture's reference passes a node twice, so the cut is folded as one from
# a file whose header counts `revisits` such nodes
revisiting <- function(revisits) {
  call <- js_call
  function(fun, args, ...) {
    if (fun == "cutWalks") {
      cut <- call(fun, args[setdiff(names(args), c("fold", "cluster"))], ...)
      options <- sprintf('{"threshold":%s,"cluster":%s,"referenceRevisits":%s,',
                         args$fold, tolower(args$cluster), revisits)
      call("foldCut", sub("{", options, cut, fixed = TRUE))
    } else {
      call(fun, args, ...)
    }
  }
}

test_that("fold keeps the variants of its size or more as branches, in reference order", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  expect_true(g$fold$folded)
  expect_equal(g$fold$threshold, 500)
  expect_equal(g$fold$haplotypes, 4)
  b <- g$branches
  expect_s3_class(b, "data.frame")
  expect_equal(b$kind, c("deletion", "other", "deletion"))
  expect_equal(b$description, c("deletion", "replacement", "deletion"))
  expect_equal(b$length, c(4000, 4000, 1000))
  expect_equal(b$inserted_bp, c(0, 2000, 0))
  expect_equal(b$deleted_bp, c(4000, 4000, 1000))
  expect_equal(b$ref_start, c(1000, 1000, 3000))
  expect_equal(b$ref_end, c(5000, 5000, 4000))
  expect_equal(b$haplotypes, c(1, 1, 1))
  expect_equal(b$total, c(4, 4, 4))
  expect_equal(b$from, c("1", "1", "2~3"))
  expect_equal(b$to, c("6~7", "6~7", "5"))
  expect_equal(lengths(b$nodes), c(0, 1, 0))
  expect_false(any(b$cluster))
  expect_true(all(is.na(b$cluster_members)))
  expect_equal(b$label, c("deletion 4.0 kb, 1 of 4",
                          "replacement 2.0 kb for 4.0 kb, 1 of 4",
                          "deletion 1.0 kb, 1 of 4"))
})

test_that("the folded nodes are the reference between breakpoints, and every step is on one", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  expect_equal(g$tracks[[1]]$name, "REF#0#chr1")
  expect_equal(g$tracks[[1]]$sequence, c("1", "2~3", "4", "5", "6~7"))
  expect_equal(g$nodes$sequence_length[match(g$tracks[[1]]$sequence, g$nodes$name)],
               c(1000, 2000, 1000, 1000, 2000))
  steps <- sub("^-", "", unlist(lapply(g$tracks, `[[`, "sequence")))
  expect_true(all(steps %in% g$nodes$name))
  expect_true(all(unlist(g$branches$nodes) %in% g$nodes$name))
})

test_that("walks that fold to the same steps are one track that counts and lists them", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 1500)
  expect_equal(g$branches$label, c("deletion 4.0 kb, 1 of 4",
                                   "replacement 2.0 kb for 4.0 kb, 1 of 4"))
  freq <- vapply(g$tracks, `[[`, 0, "freq")
  expect_equal(sum(freq), 4)
  as_reference <- g$tracks[[which(vapply(g$tracks, function(t) "SNP#1#chr1" %in% t$haplotypes, NA))]]
  expect_equal(as_reference$sequence, g$tracks[[1]]$sequence)
})

test_that("without fold a cut is as it was, with no fold or branches", {
  g <- read_gfa(stepless, region = "chr1:1-7000")
  expect_named(g, c("nodes", "tracks", "left_out"))
  expect_length(g$tracks, 4)
})

test_that("a threshold larger than every variant leaves the reference and no branch", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 1e6)
  expect_true(g$fold$folded)
  expect_equal(nrow(g$branches), 0)
  expect_named(g$branches, names(read_gfa(stepless, region = "chr1:1-7000", fold = 500)$branches))
  tm <- tubemap_layout(g)
  expect_equal(nrow(tm$branches), 0)
  expect_no_error(ggplot2::ggplot_build(autoplot(tm)))
})

test_that("fold and cluster say what they need", {
  expect_error(read_gfa(stepless, region = "chr1:1-7000", fold = "big"), "size in bp")
  expect_error(read_gfa(stepless, region = "chr1:1-7000", fold = 0), "size in bp")
  expect_error(read_gfa(stepless, region = "chr1:1-7000", fold = c(50, 100)), "size in bp")
  expect_error(read_gfa(stepless, region = "chr1:1-7000", cluster = TRUE), "give `fold` too")
  expect_error(read_gfa(stepless, region = "chr1:1-7000", fold = 500, cluster = NA),
               "TRUE or FALSE")
  expect_error(read_gfa(stepless, region = "chr1:1-7000", fold = 500, reference = "DEL#1#chr1"),
               "takes no `reference`")
  gfa <- tempfile(fileext = ".gfa")
  writeLines(c("S\t1\tACGT", "P\tp\t1+\t*"), gfa)
  expect_error(read_gfa(gfa, fold = 500), "cut from a walk file")
})

test_that("cluster folds a window with no near-equal alleles as fold alone does", {
  plain <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  clustered <- read_gfa(stepless, region = "chr1:1-7000", fold = 500, cluster = TRUE)
  expect_true(clustered$fold$cluster)
  expect_equal(clustered$branches, plain$branches)
})

test_that("a cluster's label gives its member count and size range, and an open inversion says so", {
  b <- data.frame(
    description = c("insertion", "inversion", "deletion"),
    length = c(9264, 16562, 74),
    inserted_bp = c(9264, 0, 0),
    deleted_bp = c(0, 0, 74),
    haplotypes = c(129, 439, 310),
    total = 464,
    open = c(FALSE, TRUE, FALSE),
    cluster = c(TRUE, FALSE, FALSE),
    cluster_members = c(56, NA, NA),
    cluster_min_length = c(8866, NA, NA),
    cluster_max_length = c(9527, NA, NA)
  )
  expect_equal(branch_label(b), c(
    "insertion 9.3 kb (cluster of 56 lengths, 8.9 kb to 9.5 kb), 129 of 464",
    "inversion 16.6 kb, cut by the window, 439 of 464",
    "deletion 74 bp, 310 of 464"
  ))
  expect_equal(bp_size(c(999, 1000, 45516, 123456)), c("999 bp", "1.0 kb", "45.5 kb", "123 kb"))
})

test_that("a pggb window whose reference passes each node once folds, by either way in", {
  g <- read_gfa(pggb, region = "chr:1004500-1004961", fold = 50)
  local_mocked_bindings(js_call = revisiting(0))
  expect_equal(read_gfa(pggb, region = "chr:1004500-1004961", fold = 50), g)
  expect_true(g$fold$folded)
  expect_equal(sum(vapply(g$tracks, `[[`, 0, "freq")), 5)
})

test_that("a graph that cannot be folded is drawn as it is, with a warning that says why", {
  reason <- "the reference passes 3 nodes of the graph more than once, so a run off it may be a copy of reference sequence and not a variant"
  as_it_is <- read_gfa(pggb, region = "chr:1004500-1004961")
  local_mocked_bindings(js_call = revisiting(3))
  expect_warning(
    g <- read_gfa(pggb, region = "chr:1004500-1004961", fold = 50),
    paste0("chr:1004500-1004961 is drawn unfolded: ", reason, "."),
    fixed = TRUE
  )
  expect_false(g$fold$folded)
  expect_equal(g$fold$reason, reason)
  expect_equal(nrow(g$branches), 0)
  expect_equal(g$nodes, as_it_is$nodes)
  expect_equal(g$tracks, as_it_is$tracks)
  expect_equal(g$tubes$haplotypes, rep(1, 5))
  expect_equal(g$tubes$skipped_bp_max, rep(0, 5))
  tm <- tubemap_layout(g)
  expect_equal(tm$node_width, "normal")
  expect_equal(nrow(tm$branches), 0)
  expect_length(geom_tubemap_branches(tm), 0)
})

test_that("a folded graph is laid out small, to scale, with its nodes unmerged", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  tm <- tubemap_layout(g)
  expect_equal(tm$node_width, "small")
  expect_setequal(tm$nodes$name, g$nodes$name)
  expect_equal(tm$nodes$sequence_length[match(g$nodes$name, tm$nodes$name)],
               g$nodes$sequence_length)
  on_reference <- tm$nodes[match(g$tracks[[1]]$sequence, tm$nodes$name), ]
  expect_equal(on_reference$pixel_width / on_reference$sequence_length * tm$bases_per_px,
               rep(1, 5), tolerance = 0.15)
  wide <- tubemap_layout(g, bases_per_px = 50)
  expect_gt(tm$bounds$maxX, 2 * wide$bounds$maxX)
  expect_error(tubemap_layout(g, node_width = "compressed", bases_per_px = 50), "folded graph")
  expect_error(tubemap_layout(tubemap_example("example-6"), bases_per_px = 50), "folded graph")
  expect_equal(tubemap_layout(g, node_width = "compressed")$node_width, "compressed")
})

test_that("the ruler of a folded graph reads in true coordinates", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  tm <- tubemap_layout(g)
  expect_equal(tm$ruler$node, c("1", "2~3", "4", "5", "6~7"))
  expect_equal(tm$ruler$start, c(0, 1000, 3000, 4000, 5000))
  expect_equal(tm$ruler$length, c(1000, 2000, 1000, 1000, 2000))
  expect_false(is.na(tubemap_x(tm, 6999)))
  expect_true(is.na(tubemap_x(tm, 7000)))
})

test_that("each branch is placed on the map and labelled above it", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  tm <- tubemap_layout(g)
  b <- tm$branches
  expect_equal(b$label, g$branches$label)
  expect_false(anyNA(b[c("x", "xmin", "xmax", "y", "label_x", "label_y")]))
  box <- tm$outlines[tm$outlines$name == b$nodes[[2]], ]
  expect_equal(c(b$xmin[2], b$xmax[2]), range(box$x))
  gap <- function(from, to) {
    c(max(tm$outlines$x[tm$outlines$name == from]), min(tm$outlines$x[tm$outlines$name == to]))
  }
  expect_equal(c(b$xmin[1], b$xmax[1]), gap("1", "6~7"))
  expect_equal(c(b$xmin[3], b$xmax[3]), gap("2~3", "5"))
  expect_lt(tm$bounds$minY, min(tm$shapes$y))
  expect_true(all(b$label_y > tm$bounds$minY & b$label_y < min(tm$outlines$y)))
  p <- autoplot(tm)
  expect_no_error(ggplot2::ggplot_gtable(ggplot2::ggplot_build(p)))
  labels <- unlist(lapply(p$layers, function(l) l$data$label))
  expect_true(all(b$label %in% labels))
  bare <- autoplot(tm, branches = FALSE)
  expect_false(any(b$label %in% unlist(lapply(bare$layers, function(l) l$data$label))))
})

test_that("a branch with no box or tube of its own is named in the caption", {
  g <- read_gfa(pggb, region = "chr:1004500-1004961", fold = 50)
  expect_equal(g$branches$description, "walk starts inside the window")
  tm <- tubemap_layout(g)
  expect_true(is.na(tm$branches$x))
  expect_length(geom_tubemap_branches(tm), 0)
  expect_equal(autoplot(tm)$labels$caption,
               paste("No box of its own:", g$branches$label))
  expect_null(autoplot(tm, branches = FALSE)$labels$caption)
})

test_that("a folded graph draws no reads, and says so", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 500)
  reads <- tubemap_example("example-6")$reads
  expect_warning(tm <- tubemap_layout(g, reads = reads),
                 "The 5 reads are not drawn: they map to the graph's own nodes", fixed = TRUE)
  expect_equal(sum(tm$tracks$type == "read"), 0)
  expect_equal(tm$shapes, tubemap_layout(g)$shapes)
  g$reads <- reads
  expect_warning(tubemap_layout(g), "reads are not drawn")
  expect_no_warning(tubemap_layout(g, reads = NULL))
})

test_that("tubes counts what each folded track stands for and what the fold hid in it", {
  g <- read_gfa(stepless, region = "chr1:1-7000", fold = 1500)
  expect_equal(g$tubes$name, vapply(g$tracks, `[[`, "", "name"))
  expect_equal(g$tubes$track, seq_along(g$tracks))
  expect_equal(g$tubes$haplotypes, vapply(g$tracks, `[[`, 0, "freq"))
  expect_equal(g$tubes$walks, rep(1, nrow(g$tubes)))
  snp <- g$tubes[g$tubes$name == "SNP#1#chr1", ]
  expect_equal(unlist(snp[c("skipped_bp_min", "skipped_bp_median", "skipped_bp_max")],
                      use.names = FALSE), c(1000, 1000, 1000))
  expect_equal(snp$inserted_bp_max, 0)
  expect_equal(tubemap_layout(g)$tubes, g$tubes)
})

# what graph-fold returns for REF A B C and three walks that take B reversed
inverted <- function() {
  list(
    nodes = data.frame(name = c("A", "B", "C"), sequence_length = c(2000, 6000, 2000)),
    tracks = list(
      list(name = "REF", sequence = c("A", "B", "C"), freq = 1, index_of_first_base = 0),
      list(name = "3 haplotypes: INV#1, ...", sequence = c("A", "-B", "C"), freq = 3)
    ),
    fold = list(folded = TRUE, threshold = 1000, cluster = FALSE, haplotypes = 4),
    branches = branch_frame(
      list(kind = list("inversion"), description = list("inversion"), length = list(6000),
           inserted_bp = list(0), deleted_bp = list(0), ref_start = list(2000),
           ref_end = list(8000), haplotypes = list(3), open = list(FALSE), from = list(NULL),
           to = list(NULL), nodes = list(list("B")), cluster_members = list(NULL),
           cluster_min_length = list(NULL), cluster_max_length = list(NULL)),
      4
    )
  )
}

test_that("the pass through an inversion runs against the reference, and the passes round it with it", {
  tm <- tubemap_layout(inverted())
  expect_equal(tm$branches$label, "inversion 6.0 kb, 3 of 4")
  box <- tm$outlines[tm$outlines$name == "B", ]
  expect_equal(c(tm$branches$xmin, tm$branches$xmax, tm$branches$y),
               c(range(box$x), min(box$y)))
  d <- tm$directions
  expect_true(all(d$direction[d$track_id == 0] == 1))
  loop <- d[d$track_id == 1, ]
  inside <- loop$ymin >= min(box$y) & loop$ymax <= max(box$y) &
    loop$xmin >= min(box$x) & loop$xmax <= max(box$x)
  expect_equal(loop$direction[inside], -1)
  expect_equal(loop$direction[!inside], c(1, 1))
  p <- autoplot(tm)
  expect_no_error(ggplot2::ggplot_gtable(ggplot2::ggplot_build(p)))
  expect_length(autoplot(tm, direction = FALSE)$layers, length(p$layers) - 1)
})

test_that("only a folded graph has directions", {
  tm <- tubemap_layout(tubemap_example("example-6"))
  expect_null(tm$directions)
  expect_length(geom_tubemap_direction(tm), 0)
})
