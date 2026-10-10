# Rscript tools/readme-figures.R, from the package root
devtools::load_all(quiet = TRUE)
library(ggplot2)

# `width` inches wide and as tall as the map's aspect needs, plus `legend`
save <- function(name, plot, tubemap, width, xlim = NULL, legend = 0.35) {
  b <- tubemap$bounds
  xr <- if (is.null(xlim)) c(b$minX - 20, b$maxX + 20) else xlim
  height <- width * (b$maxY - b$minY + 40) / diff(xr) + legend
  if (!is.null(xlim)) plot <- plot + coord_tubemap(tubemap, xlim = xlim)
  ggsave(file.path("man/figures", name), plot, width = width, height = height,
         dpi = 150, device = ragg::agg_png)
}

ex6 <- tubemap_layout(tubemap_example("example-6"))
save("example-6.png", autoplot(ex6) + theme(legend.text = element_text(size = 6)),
     ex6, 9, xlim = c(0, 1300), legend = 0.6)

micb <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
micb$shapes$phase <- ifelse(
  startsWith(as.character(micb$shapes$name), "GRCh38"), "GRCh38",
  paste("haplotype", sub("^[^#]+#([^#]+)#.*", "\\1", micb$shapes$name))
)
save("micb.png",
     autoplot(micb, haplotypes = aes(fill = phase)) +
       scale_fill_manual(values = c(GRCh38 = "black", "haplotype 1" = "#d97706",
                                    "haplotype 2" = "#0e7490"), name = NULL),
     micb, 9)

brca1 <- tubemap_layout(tubemap_example("brca1"))
save("brca1.png", autoplot(brca1) + theme(legend.position = "none"), brca1, 7,
     xlim = c(250, 900), legend = 0)

chrm <- tubemap_layout(tubemap_example("hprc-chrM"), node_width = "compressed",
                       facet_by = "sample_name")
save("hprc-chrM-facets.png", autoplot(chrm, mismatches = FALSE), chrm, 9,
     legend = 0)
