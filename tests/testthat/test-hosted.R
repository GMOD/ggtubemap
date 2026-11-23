# The walk files the README, the docs and the figure script read from
# jbrowse.org still serve the cuts they show. These need the network, so they
# run only where GGTUBEMAP_HOSTED is set, as the weekly Hosted files
# workflow sets it

skip_unless_hosted <- function() {
  skip_if_not(nzchar(Sys.getenv("GGTUBEMAP_HOSTED")), "GGTUBEMAP_HOSTED is not set")
  skip_if_not(file.exists(test_path("../../README.md")), "not in a source checkout")
}

hosted_walk_files <- function() {
  files <- test_path("../..", c("README.md", "R/data.R", "tools/readme-figures.R"))
  text <- unlist(lapply(files, readLines, warn = FALSE))
  unique(unlist(regmatches(text, gregexpr("https://[^\"' )]+\\.walks(\\.bed)?\\.gz", text))))
}

test_that("every hosted walk file the docs name cuts the README's tandem repeat", {
  skip_unless_hosted()
  urls <- hosted_walk_files()
  expect_gt(length(urls), 0)
  haplotypes <- c("CHM13#0", "HG00097#1", "HG00099#1", "HG00133#2", "HG00140#1")
  for (url in urls) {
    g <- expect_no_warning(
      read_gfa(url, region = "chr6:160,653,940-160,654,130", haplotypes = haplotypes)
    )
    names <- vapply(g$tracks, `[[`, "", "name")
    expect_equal(names[1], "GRCh38#0#chr6", label = url)
    expect_length(names, length(haplotypes) + 1)
    expect_s3_class(tubemap_layout(g, node_width = "compressed"), "tubemap")
  }
})

test_that("the chr6 file built with --sequences gives every node its bases, and the genome-wide file's nodes", {
  skip_unless_hosted()
  urls <- hosted_walk_files()
  chr6 <- grep("-chr6-sequences", urls, value = TRUE)
  whole <- grep("-chr6-sequences", urls, value = TRUE, invert = TRUE)
  expect_length(chr6, 1)
  expect_gt(length(whole), 0)
  region <- "chr6:160,653,940-160,654,130"
  haplotypes <- c("CHM13#0", "HG00133#2")
  g <- read_gfa(chr6, region = region, haplotypes = haplotypes)
  expect_true(all(nchar(g$nodes$seq) == g$nodes$sequence_length))
  w <- read_gfa(whole[1], region = region, haplotypes = haplotypes)
  expect_identical(g$tracks, w$tracks)
  expect_identical(g$nodes$name, w$nodes$name)
})

test_that("haplotypes that skip the amylase window are described, and drawn with the context given", {
  skip_unless_hosted()
  url <- grep("-chr6-sequences", hosted_walk_files(), value = TRUE, invert = TRUE)[1]
  region <- "chr1:103,640,000-103,660,000"
  haplotypes <- c("HG00097#1", "HG00128#1")
  expect_warning(
    read_gfa(url, region = region, haplotypes = haplotypes),
    "HG00128#1: leaves the reference at 103,620,893 and rejoins it at 103,715,097, with no sequence of its own"
  )
  g <- expect_no_warning(read_gfa(url, region = region, haplotypes = haplotypes, context = 29000))
  expect_length(g$tracks, 3)
})

# The two windows the README folds, with the counts its figures and text give
test_that("the README's deletion and inversion fold to the branches it shows", {
  skip_unless_hosted()
  url <- grep("-chr6-sequences", hosted_walk_files(), value = TRUE, invert = TRUE)[1]
  del <- expect_no_warning(
    read_gfa(url, region = "chr1:72,298,000-72,349,000", fold = 1000, cluster = TRUE)
  )
  expect_true(del$fold$folded)
  expect_equal(del$fold$haplotypes, 464)
  expect_true("deletion 45.5 kb, 306 of 464" %in% del$branches$label)
  expect_true("insertion 8.9 kb to 9.5 kb (56 lengths), 129 of 464" %in%
                del$branches$label)
  expect_equal(nrow(del$nodes), 8)
  expect_length(del$tracks, 6)
  unclustered <- read_gfa(url, region = "chr1:72,298,000-72,349,000", fold = 1000)
  expect_equal(sum(unclustered$branches$kind == "insertion"), 56)
  expect_no_error(ggplot2::ggplot_build(autoplot(tubemap_layout(del))))

  inv <- expect_no_warning(read_gfa(url, region = "chr16:75,204,000-75,225,000", fold = 1000))
  expect_equal(inv$branches$label, "inversion 16.6 kb, 439 of 464")
  loop <- inv$tubes[inv$tubes$haplotypes == 439, ]
  expect_equal(loop$walks, 356)
  expect_equal(loop$name, "439 haplotypes")
  expect_equal(loop$label,
               "439 haplotypes on 356 distinct walks, 8 bp to 795 bp folded away in each")
  expect_equal(c(loop$folded_away_bp_min, loop$folded_away_bp_max), c(8, 795))
  tm <- tubemap_layout(inv)
  against <- tm$pieces[tm$pieces$direction %in% -1, ]
  expect_true(nrow(against) > 0 && all(against$reads))
  expect_equal(sum(!tm$pieces$reads & tm$pieces$track_id == inv$branches$tracks[[1]] - 1), 2)
  expect_lt(tm$bounds$maxX - tm$bounds$minX, 2000)
})
