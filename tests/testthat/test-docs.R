test_that("the README and the read_gfa() example name the format 8 genome-wide HPRC walk file", {
  skip_if_not(file.exists(test_path("../../README.md")), "not in a source checkout")
  files <- test_path("../..", c("README.md", "R/data.R", "man/read_gfa.Rd", "tools/readme-figures.R"))
  text <- unlist(lapply(files, readLines, warn = FALSE))
  urls <- unique(unlist(regmatches(text, gregexpr("https://[^\"' )`]+\\.walks(\\.bed)?\\.gz", text))))
  expect_identical(
    grep("-chr6-sequences\\.", urls, value = TRUE, invert = TRUE),
    "https://jbrowse.org/demos/hprc/hprc-v2.1-mc-grch38-f8.GRCh38.walks.gz"
  )
})
