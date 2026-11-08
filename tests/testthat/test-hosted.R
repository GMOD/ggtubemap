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
