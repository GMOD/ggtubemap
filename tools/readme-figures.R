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

walks <- "https://jbrowse.org/demos/hprc/hprc-v2.1-mc-grch38-chr6-sequences-f8.GRCh38.walks.gz"
samples <- c("HG00097", "HG00099", "HG00126", "HG00128", "HG00133", "HG002",
             "HG00140", "HG00146")
haplotypes <- paste0(rep(samples, each = 2), "#", 1:2)

str <- read_gfa(walks, region = "chr6:160,653,940-160,654,130",
                haplotypes = c("CHM13#0", haplotypes[c(1, 3, 10, 13)]))
str_map <- tubemap_layout(str)
save("hprc-str.png", str_map, 9, xlim = tubemap_x(str_map, c(160653972, 160654042)),
     legend = 0.6, extra = theme(legend.text = element_text(size = 6)))

hla <- read_gfa(walks, region = "chr6:29,942,850-29,943,250",
                haplotypes = c("CHM13#0", haplotypes[1:12]))
hla_map <- tubemap_layout(hla, node_width = "compressed")
save("hprc-hla.png", hla_map, 9,
     xlim = tubemap_x(hla_map, c(29942850, 29943250)), legend = 0, extra = theme(legend.position = "none"))

phased <- tubemap_layout(
  read_gfa(walks, region = "chr6:160,653,940-160,654,130", haplotypes = haplotypes),
  node_width = "compressed"
)
phased$shapes$phase <- ifelse(
  startsWith(as.character(phased$shapes$name), "GRCh38"), "GRCh38",
  paste("haplotype", sub("^[^#]+#([^#]+)#.*", "\\1", phased$shapes$name))
)
save("hprc-str-phased.png", phased, 9, haplotypes = aes(fill = phase),
     xlim = tubemap_x(phased, c(160653940, 160654130)),
     extra = scale_fill_manual(values = c(GRCh38 = "black",
                                          "haplotype 1" = "#d97706",
                                          "haplotype 2" = "#0e7490"),
                               name = NULL))

if (requireNamespace("ggbandage", quietly = TRUE)) {
  library(patchwork)
  tm <- tubemap_layout(str, node_width = "compressed")
  cut <- tempfile(fileext = ".gfa")
  writeLines(ggbandage::bandage_gfa(walks, "chr6:160,653,940-160,654,130",
                                    haplotypes = c("CHM13#0", haplotypes[c(1, 3, 10, 13)]),
                                    context = 0), cut)
  g <- ggbandage::bandage_layout(cut, walks = "HG00133#2#CM090065.1", width = 600)
  ggsave("man/figures/with-ggbandage.png",
         autoplot(tm, xlim = tubemap_x(tm, c(160653940, 160654130))) / ggplot2::autoplot(g) + plot_layout(heights = c(1, 2)),
         width = 9, height = 8, dpi = 150, device = ragg::agg_png)
}
