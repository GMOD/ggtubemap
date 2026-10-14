# Rscript tools/readme-figures.R, from the package root
devtools::load_all(quiet = TRUE)
library(ggplot2)

# autoplot(tubemap, ...) plus `extra`, the map `width` inches wide, with room
# for the ruler and `legend`
save <- function(name, tubemap, width, ..., xlim = NULL, legend = 0.35,
                 extra = NULL) {
  map <- tubemap_size(tubemap, px_per_in = 1, xlim = xlim, ruler = FALSE)
  px_per_in <- map[["width"]] / width
  size <- tubemap_size(tubemap, px_per_in, legend = legend, xlim = xlim)
  ggsave(file.path("man/figures", name),
         autoplot(tubemap, ..., xlim = xlim) + extra,
         width = size[["width"]], height = size[["height"]], dpi = 150,
         device = ragg::agg_png)
}

ex6 <- tubemap_layout(tubemap_example("example-6"))
save("example-6.png", ex6, 9, xlim = c(0, 1300), legend = 0.6,
     extra = theme(legend.text = element_text(size = 6)))

micb <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
micb$shapes$phase <- ifelse(
  startsWith(as.character(micb$shapes$name), "GRCh38"), "GRCh38",
  paste("haplotype", sub("^[^#]+#([^#]+)#.*", "\\1", micb$shapes$name))
)
save("micb.png", micb, 9, haplotypes = aes(fill = phase),
     extra = scale_fill_manual(values = c(GRCh38 = "black",
                                          "haplotype 1" = "#d97706",
                                          "haplotype 2" = "#0e7490"),
                               name = NULL))

brca1 <- tubemap_layout(tubemap_example("brca1"))
save("brca1.png", brca1, 7, xlim = c(250, 900), legend = 0,
     extra = theme(legend.position = "none"))

chrm <- tubemap_layout(tubemap_example("hprc-chrM"), node_width = "compressed",
                       facet_by = "sample_name")
save("hprc-chrM-facets.png", chrm, 9, mismatches = FALSE, legend = 0)
