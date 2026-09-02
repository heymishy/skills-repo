## Benefit Metric: Product Dashboard Becomes Unreadable at Real-World Scale

**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md (Approved — Hamish King, Platform Owner, 2026-09-02)
**Date defined:** 2026-09-02
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a UX/information-architecture fix to an existing platform page (`/products/:id`), not a hypothesis test about tooling, process, or team capability. No Tier 2 meta-metrics apply. No named regulatory or compliance obligation is in play, so no Tier 3 metrics apply either — measured entirely on Tier 1 terms, with the Platform maintainer / product owner and Tech lead / squad lead personas (per `product/mission.md` and the discovery's own "Who It Affects") as the users whose value is being protected.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time to First Actionable Content

| Field | Value |
|-------|-------|
| **What we measure** | The amount of scrolling an operator must do on `/products/:id` before reaching the first interactive, filterable content (search box, health filter chips, or a clickable group) — not just any content, the first content they can *act on*. |
| **Baseline** | On `skills-framework` (224 features, 40+ epic/phase groups), confirmed via direct live review: the first interactive content appears after roughly 40 screens of static, non-interactive text. |
| **Target** | The first interactive content (triage summary strip, health filters) appears within the first screenful of the page — zero scrolling required, on a standard viewport. |
| **Minimum validation signal** | The redundant static "Epics" list is removed and the existing health filter chips + search box render above the fold on `skills-framework` specifically — even before the full triage-strip (blocked/stalled/needs-review counts) is built. |
| **Measurement method** | Manual verification (direct screenshot/scroll-position comparison) pre/post on `skills-framework`; an automated scroll-depth-to-first-interaction instrumentation event could formalize this later if useful, but is not required for this MVP. |
| **Feedback loop** | If post-implementation the fold-line content still requires scrolling on common viewport sizes, revisit which content is prioritized in the first screenful before considering this metric met. |

### Metric 2: Health-Signal Trustworthiness

| Field | Value |
|-------|-------|
| **What we measure** | Whether a health badge on the page carries real, differentiated visual weight (Healthy/Warning/Blocked as distinct colors competing for attention) versus an `Unknown` badge rendered with the same visual weight, diluting the signal. |
| **Baseline** | 115 of 224 items (51%) on `skills-framework` show `? Unknown` today, styled as a colored badge indistinguishable in visual weight from the 3 real Warning items and 53 real Healthy items — confirmed live and via direct code reading of the feature-level-only health computation (`computeHealthCounts`). |
| **Target** | 0% of `Unknown` items render as a colored/competing badge. All `Unknown` items render in quiet, recessive styling (grey text, not a badge), so the page's only visually "loud" health signals are genuine Warning/Blocked states. |
| **Minimum validation signal** | `Unknown` items are visually de-emphasized via a styling change alone — confirmable by direct visual inspection, no change to the underlying feature-granularity health computation required (that remains explicitly out of scope per the discovery). |
| **Measurement method** | Direct visual audit pre/post on `skills-framework` and at least one other product with a materially different Healthy/Warning/Blocked/Unknown ratio, confirming `Unknown` no longer visually competes with real Warning/Blocked signals in either case. |
| **Feedback loop** | If de-emphasizing `Unknown` makes genuinely important Warning/Blocked items *harder* to notice at a glance (e.g. insufficient remaining contrast against the now-quieter Unknown state), revisit the specific visual treatment (e.g. an icon-based distinction instead of color alone) rather than declaring this metric met. |

<!-- Both metrics trace to this discovery's single MVP scope (triage strip, collapsed-by-default groups, remove duplicate static list, de-emphasize Unknown, fix the story-detail dead end) -- expect a small number of stories at /definition, likely one per MVP scope item or a tightly-coupled pair, given Complexity is likely 1-2 per this repo's estimation model for a rendering/IA change with no new data-layer work. -->

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Time to First Actionable Content | TBD at /definition | Gap |
| Metric 2 — Health-Signal Trustworthiness | TBD at /definition | Gap |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach (exact markup/CSS changes, whether groups collapse via a data attribute or a client-side script) — that is `/definition`'s and the implementation plan's job
- Sprint targets or velocity — these metrics are outcome-based (can an operator find what needs attention, does the health signal mean something), not output-based (lines of code, tasks closed)
