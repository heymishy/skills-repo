## Benefit Metric: Feature-detail page UX redesign

**Discovery reference:** artefacts/2026-09-05-feature-page-ux-redesign/discovery.md (Approved — Hamish King, Operator/Engineer, 2026-09-05)
**Date defined:** 2026-09-05
**Metric owner:** Hamish King — Operator/Engineer (solo operator session — see note below)
**Reviewers:** None — solo operator session (contributor, approver, and metric owner are the same person; no non-engineering reviewer available. M3, the non-engineering outer-loop attribution rate, is not measured for this feature, consistent with the discovery artefact's own Reviewers note.)

**Product context read:** `product/mission.md` success outcomes — this feature supports outcome 1 ("run the full outer loop unassisted... single session") indirectly, by making the artefact-index page itself easier to read, and supports the broader beta-adoption goal implicit in the Secondary "UX designer"/"UX researcher" personas. `product/roadmap.md` was checked; this is a beta-hardening/quality item rather than a named Horizon 1/2 roadmap priority — it's justified directly by the discovery's own Why Now (active beta, client-facing risk), not by roadmap alignment.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward product/UX-quality initiative — it does not test a hypothesis about tooling, process, or team capability. Standard product metrics only, plus one Tier 3 compliance metric (accessibility is a named hard floor in `product/constraints.md`).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Visual consistency of `/features/:slug`

| Field | Value |
|-------|-------|
| **What we measure** | The count of visually distinct, unreconciled rendering conventions on a single `/features/:slug` page render (i.e. how many times the page's visual language changes mid-scroll — currently the `.sw-card`/`.sw-section-title` system at the top, then plain ad-hoc-styled `<details>` accordions at the bottom). |
| **Baseline** | 1 seam — confirmed 2026-09-05 on `2026-06-22-wuce-multi-tenancy` (20+ stories, 5 phases): the `.sw-card` → plain-`<details>` transition partway down the page. |
| **Target** | 0 seams — a single coherent visual language, top to bottom, on any multi-story feature page. |
| **Minimum validation signal** | Seam count reaches 0 on at least the reference feature (`wuce-multi-tenancy`) and one other multi-story feature, even before final visual polish (per Metric 2) is fully dialled in — functional consistency is the floor, polish is the stretch. |
| **Measurement method** | Manual/visual review by the operator across 2-3 representative multi-story features, performed once immediately post-implementation. This is CSS-layout-dependent — classified at DoR per `CLAUDE.md`'s CSS-layout AC rule as either a Playwright visual-regression test or a RISK-ACCEPT + manual smoke test (decision deferred to `/definition-of-ready`). |
| **Feedback loop** | If a seam persists after implementation, the story is not done — it returns to the coding-agent loop, not to a "deferred" backlog item, since this is the core defect the initiative exists to close. |

### Metric 2: Perceived design quality ("Apple/SaaS-tier" bar)

| Field | Value |
|-------|-------|
| **What we measure** | Whether the redesigned page passes a defined pass/fail self-review rubric: type hierarchy is deliberate (not default browser styling), spacing is consistent via layout (not ad hoc margins), color use is a considered palette (not raw defaults), and the page reads as belonging to the same product as its best-designed existing page. |
| **Baseline** | Below bar — confirmed 2026-09-05: the current page exhibits the Metric 1 seam plus dated, ad-hoc-styled `<details>` accordions with no design-token integration. |
| **Target** | Pass — operator self-review confirms the page is "on par with a modern SaaS product," using the four-point rubric above. |
| **Minimum validation signal** | No component of the page reads as visibly broken or obviously unfinished (even if not maximally polished) — i.e. "no longer visibly dated," short of "delightful." |
| **Measurement method** | Direct operator review performed once, immediately post-implementation — same live-verification convention used for `stcs-s1`/`ptvs-s1`/`pebd-s1` this session (a real, direct check, not an assumed pass). Re-assessed if unprompted beta feedback arrives later. |
| **Feedback loop** | If the minimum validation signal fails ("still looks broken"), treat as a defect requiring rework before DoD, not a deferred polish item — this metric exists precisely because "technically fixed but still looks bad" was the risk named in the discovery's own Assumptions and Risks section. |

### Metric 3: Navigation path clarity into `/features/:slug`

| Field | Value |
|-------|-------|
| **What we measure** | Click/decision count from `/dashboard` to a target feature's `/features/:slug` page via each real entry point (dashboard, product page, story DoD), and whether any entry point contains a dead-end or confusing hop. |
| **Baseline** | Not yet established — no click-count audit has been performed. Per the discovery's own Clarification log, whether dashboard/product-page/story-DoD are the *exhaustive* real entry points is also unconfirmed; both will be established together during the `/definition` nav-path audit. |
| **Target** | TBD — to be set once the `/definition` audit establishes the current baseline click count and confirms the full set of real entry points. Directionally: zero dead-end or confusing hops on any confirmed entry point. |
| **Minimum validation signal** | Zero dead-end or broken hops on the three named entry points, even if the click-count itself isn't reduced further. |
| **Measurement method** | Operator direct click-through review — once during `/definition` (to establish the baseline and target) and once post-implementation (to confirm). |
| **Feedback loop** | If the `/definition` audit surfaces an entry point materially more important than the three named here (e.g. a link shared directly with prospects), that becomes an in-scope addition to this story's own nav-path work, not a separately deferred item — the discovery's MVP scope explicitly anticipated this via the Q4 clarification. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

### Tier 3 metric — WCAG 2.1 AA accessibility conformance

| Field | Value |
|-------|-------|
| **Obligation source** | `product/constraints.md` #9 — "Accessibility standard (WCAG 2.1 AA minimum) is a hard floor, not a performance NFR." |
| **Metric** | WCAG 2.1 AA conformance of the redesigned `/features/:slug` page — contrast ratios, keyboard navigation (including the existing `<details>`/`<summary>` disclosure pattern if retained in any form), visible focus states, and correct semantic/ARIA structure for any new interactive elements. |
| **Target** | 100% — binary met/not-met against the WCAG 2.1 AA success criteria applicable to this page's components. |
| **Validated by** | Hamish King, Operator/Engineer (no dedicated accessibility role exists in this solo project) — manual audit at minimum; automated tooling (e.g. axe-core) to be confirmed as available/wired-in at `/definition`, since it is not currently part of this repo's toolchain per `product/tech-stack.md`. |
| **Sign-off required at DoR** | Yes — per `CLAUDE.md`'s own accessibility-floor rule; a DoR that ships this page without an explicit accessibility check is a gap, not a deferred item. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1: Visual consistency | [Populated at /definition] | Gap — pending story creation |
| Metric 2: Perceived design quality | [Populated at /definition] | Gap — pending story creation |
| Metric 3: Navigation path clarity | [Populated at /definition] | Gap — pending story creation |
| Tier 3: WCAG 2.1 AA conformance | [Populated at /definition] | Gap — pending story creation |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach, including the visual-language decision deferred to the optional `/design` pass — that is the definition (and design) skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
