## Epic: Operators Can Scan a Large Product's Health at a Glance

**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md
**Slicing strategy:** Vertical slice

<!-- Vertical slice chosen because the discovery's own investigation already
     resolved the real technical unknowns (the rendering functions are
     confirmed generic, the Unknown-health cause is confirmed structural) --
     these are 4 independent, small, parallel fixes to the same page, not a
     sequential build-up needing a walking skeleton, and there is no
     significant remaining risk/uncertainty calling for risk-first
     sequencing. Each story is independently demoable. -->

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    PV[routes/products.js\\n_renderProductView]\n    CFS[routes/products.js\\n_renderConsolidatedFeaturesSection]\n    FD[routes/products.js\\nhandleGetFeatureDetail]\n    PV --> CFS\n    PV -. triage strip .-> PV\n    CFS -. collapse/expand .-> CFS\n    FD -. breadcrumb .-> FD"}}---

## Goal

An operator opening a product's dashboard page — whether it tracks 5 features or 224 — sees what needs their attention within the first screenful, not after scrolling past dozens of screens of static, non-interactive text. Every health signal on the page carries real meaning: a colored badge means something genuinely needs a look, and the majority-Unknown case (a structural artifact of feature-level-only health computation) no longer competes visually for that same attention. Clicking into any individual story always shows where it came from and a way back — never a bare, context-free dead end.

## Out of Scope

- Redesigning the module editor (Rename/Delete module inputs) itself — may be repositioned in a later pass but its own interaction model is untouched here.
- Extending health computation to story-level granularity — confirmed via discovery-time code investigation to be a separate, materially larger initiative touching the health-computation pipeline itself, not this page's rendering.
- A full visual rebrand of the products page — no new color system or component library; this is an information-architecture and default-state change layered onto the existing visual language.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Time to First Actionable Content | ~40 screens of static text before any interactive content | First screenful, zero scrolling | pdt-s1 removes the duplicate static list and collapses groups by default; pdt-s2 adds the triage strip as the very first interactive content; pdt-s4 removes the "dead end costs a re-navigation" tax after a click |
| Health-Signal Trustworthiness | 51% (115/224) Unknown items render as competing colored badges | 0% competing | pdt-s3 restyles Unknown to quiet, recessive text |

## Stories in This Epic

- [ ] Consolidate the epic/phase list — remove the duplicate static dump, default groups to collapsed — pdt-s1
- [ ] Add a triage summary strip for Blocked/Warning counts — pdt-s2
- [ ] De-emphasize Unknown health visually — pdt-s3
- [ ] Fix the story-detail dead end with a breadcrumb and back link — pdt-s4

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches a live, currently-used production page (`skills-framework` and every other product render through it) — a human should review each PR before merge, consistent with every recent story in this repo. Not High: each story is small, additive/corrective (not a redesign of the underlying data layer), and independently testable/revertible.

## Complexity Rating

**Rating:** 1

<!-- The feature-level complexity is low: no new data model, no new
     architecture, the confusing parts were already resolved during
     discovery's own code investigation. Individual stories range 1-2. -->

## Scope Stability

**Stability:** Stable
