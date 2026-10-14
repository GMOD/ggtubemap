# ggtubemap

Pangenome graphs as tube maps, the view of
[sequenceTubeMap](https://github.com/vgteam/sequenceTubeMap), drawn with
ggplot2. The layout is sequenceTubeMap's own, from
[`@jbrowse/tubemap-core`](https://github.com/GMOD/tubemap-core), run in an
embedded QuickJS engine; the drawing is ordinary ggplot2 layers, so a tube map
takes scales, themes, `patchwork` and vector output like any other plot.

The package is not published yet, so install it from a checkout:

```r
devtools::install()
```

QuickJS compiles from source with the package, so there is no Node, V8 or
browser to install.

## Usage

```r
library(ggtubemap)
library(ggplot2)

tm <- tubemap_layout(tubemap_example("example-6"))
autoplot(tm)
```

![Nine assemblies through a 3 kb region, each node's bases printed in it](man/figures/example-6.png)

`tubemap_layout()` takes a graph, from `read_gfa()` or as a list of `nodes` and
`tracks`, and returns every tube, node outline, base and read mismatch as data
frames in layout pixels. `autoplot()` draws them in sequenceTubeMap's order.

```r
g <- read_gfa("graph.gfa", reference = "GRCh38#0#chr6")
tm <- tubemap_layout(g, node_width = "compressed")
```

`read_gfa()` reads `P` and `W` lines; walks get PanSN names,
`sample#haplotype#contig`.

### Colour by anything

Each shape row has its track's `name`, `strand`, `mapping_quality`,
`sample_name`, `read_group` and `freq`. Add a column and map it:

```r
micb <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
micb$shapes$phase <- sub("^[^#]+#([^#]+)#.*", "\\1", micb$shapes$name)
autoplot(micb, haplotypes = aes(fill = phase)) +
  scale_fill_manual(values = c("0" = "black", "1" = "#d97706", "2" = "#0e7490"))
```

![91 HPRC haplotypes through MICB, coloured by haplotype 1 or 2](man/figures/micb.png)

Pass mappings through `autoplot()`'s `haplotypes` and `reads` arguments rather
than adding another tube layer, which would draw over the nodes. A `fill` on
the reads alone, such as `reads = aes(fill = mapping_quality)`, takes the fill
scale, and the haplotypes keep their default colours.

### Reads

Reads come with the graph in sequenceTubeMap's extracted form, as in the `brca1`
and `hprc-chrM` examples. `autoplot()` colours them by strand, fades them by
mapping quality, and marks their substitutions, deletions and insertions.
`xlim` and `ylim` zoom in by layout pixel:

```r
br <- tubemap_layout(tubemap_example("brca1"))
autoplot(br, xlim = c(250, 900))
```

![Reads stacked under the BRCA1 reference, substitutions printed on them](man/figures/brca1.png)

### Ruler and positions

`autoplot()` draws a ruler along the top in the coordinates of the first track
with an `index_of_first_base`. `read_gfa()` gives every track one, taken from
a walk's start or from a path named `name[start-end]` or `name:start-end`, and
0 for other paths. Draw the ruler on a custom plot with `scale_x_tubemap(tm)`.

`tubemap_x()` turns positions on that track into layout x, to mark a region:

```r
micb <- tubemap_layout(tubemap_example("micb-kir3dl1"), node_width = "compressed")
autoplot(micb) +
  annotate("rect", xmin = tubemap_x(micb, 31500700), xmax = tubemap_x(micb, 31500800),
           ymin = -Inf, ymax = Inf, fill = "gold", alpha = 0.3)
```

### Facets

`facet_by` stacks one panel per `sample_name`, `read_group` or PanSN
`haplotype_sample`, every panel sharing the same x:

```r
chrm <- tubemap_layout(tubemap_example("hprc-chrM"),
                       node_width = "compressed", facet_by = "sample_name")
autoplot(chrm)
```

![43 mitochondrial haplotypes, with each sample's reads in a separate panel](man/figures/hprc-chrM-facets.png)

### Custom plots

`autoplot()` builds the plot from these layers, each taking the layout:

```r
ggplot() +
  geom_tubemap_haplotypes(tm) +
  geom_tubemap_reads(tm) +
  geom_tubemap_nodes(tm) +
  geom_tubemap_sequence(tm) +
  geom_tubemap_mismatches(tm) +
  coord_tubemap(tm) +
  theme_tubemap()
```

`coord_tubemap()` reverses the y scale and fixes the aspect ratio at 1, because
the layout's y runs downward and its curves assume square pixels.

## Output size

Text and node outlines are sized in layout pixels and scale with the plot, so a
map looks the same at any size. The text layers drop sequence that would print
smaller than 1.5 pt, as the viewer hides it when zoomed out.

`tubemap_size()` gives the inches at which the map prints at a chosen pixels per
inch; at the default 96 it matches sequenceTubeMap at 100%:

```r
size <- tubemap_size(tm, legend = 0.5)
ggsave("tubemap.pdf", autoplot(tm), width = size[["width"]],
       height = size[["height"]], device = cairo_pdf)
```

## Development

Git tracks the layout bundle `inst/js/tubemap-core.js`. `pnpm bundle` builds it
from `tools/bridge.js` and the `@jbrowse/tubemap-core` release pinned in
`package.json`, and writes that version into its header.

`pnpm update-core [version]` pins a tubemap-core release, the latest by default,
rebuilds the bundle, and copies that release's goldens into
`tests/testthat/golden` and its example graphs into `inst/extdata`.
`devtools::test()` then checks that QuickJS lays out exactly as Node does.

The `Update tubemap-core` workflow runs this daily, committing to main when R
CMD check passes. The `Check` workflow runs R CMD check on every other push, and
fails if `pnpm bundle` would change the tracked bundle.

To try unreleased core changes, bundle from a checkout's source instead:

```sh
pnpm install
tools/bundle.sh ../tubemap-core
```

The header then holds the checkout's commit; `pnpm bundle` puts the release
back.

`tools/readme-figures.R` regenerates the figures above.

## See also

- [@jbrowse/tubemap-core](https://github.com/GMOD/tubemap-core) -
  sequenceTubeMap's layout, without the DOM
- [ggbandage](https://github.com/GMOD/ggbandage) - Bandage-style graph figures
  as ggplot2 layers
- [jbrowse-plugin-graphgenomeviewer](https://github.com/GMOD/jbrowse-plugin-graphgenomeviewer) -
  JBrowse 2 plugin that browses these graphs by locus
- [sequenceTubeMap, MemPanG26 edition](https://github.com/cmdcolin/sequenceTubeMap) -
  our fork of the tube map app

Tutorials on [jbrowse.org](https://jbrowse.org/jb2/docs/tutorials/)

- [HPRC part 1: graph alleles and haplotypes](https://jbrowse.org/jb2/docs/tutorials/pangenome_hprc/)
