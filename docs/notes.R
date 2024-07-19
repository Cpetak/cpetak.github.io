# Notes for website

2. Using cellular automata (CA) rules to generate a set of **target developmental trajectories**, we found that the effect of environmental variability depended on the specific CA rule that was used. Frequently changing the environment had a negative effect on the maximum fitness the population could reach in some cases, while in other cases, varying the environments resulted in the populations reaching higher fitness peaks. Again, these results show that evolutionary dynamics in varying environments depend on the **genotype landscape**. This work is in review. 

::: {#fig-elephants layout-ncol=2}
  
![](docs/img/2d_plastic.png){width=4in}

![](docs/img/2d_examples.png){width=3in}

Left: Difference in maximum fitnesses after evolution in a variable environment compared to evolution in the first environment alone (x-axis) and in the second environment alone (y-axis), averaged across replicates. The two columns on the right are showing the two specific target patterns for each rule that was used in the evolutionary algorithm. Right: Maximum fitness in the population over time for
different CA rules to highlight behaviors for all four quadrants in the left figure.
:::
  
3. A two-loci population genetic model showed that an allele that **increases phenotypic variability**, that is usually considered a good strategy in a variable environment, **can also be selected for** in static environments under some circumstances, even if the average effect of the variation is negative, and the new phenotypic traits are not heritable. We found that increasing the selection pressure helped this allele spread, and that the population size had an interesting non-linear effect on the probability of fixation, tightly related to heritability. Manuscript in preparation.

::: {#fig-elephants layout-ncol=1}

![](docs/img/lineages.png){width=5in fig-align="center"}

Example run with no inheritance. Increase variability (blue) and wild-type (orange) lineages. Even though less blue carriers have offspring, the ones that do have a lot of offspring under high selection pressure conditions, offsetting the average negative effect.

:::

[Here](https://cpetak.github.io/Modifier_report.html) are my modifier results.