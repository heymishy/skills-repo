## Benefit Metric: Session-Origin Badge

**Discovery reference:** artefacts/2026-09-08-session-origin-badge/discovery.md (Approved — Hamish King, Platform Owner, 2026-09-08)
**Date defined:** 2026-09-08
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner (solo review, same pattern as discovery approval — no separate engineering-outside reviewer available on this repo)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward internal-tooling UX addition (a visibility indicator), not a test of a tooling/process/team-capability hypothesis. No Tier 2 meta-metrics apply. No compliance or regulatory obligation applies (`regulated: false`, no frameworks) — no Tier 3 metrics apply.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: List-view session-origin visibility

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of feature/story rows, across the product feature-list page, `/journey`, and the org kanban board, that display the correct session-origin tri-state indicator (fully session-backed / mixed / no session) without the operator needing to open the feature |
| **Baseline** | 0% — no such indicator exists on any of the three surfaces today; the only way to learn this is opening `/features/:slug` and checking for a "Resume conversation" link |
| **Target** | 100% of rows on all three surfaces show the correct indicator, verified against real journey data |
| **Minimum validation signal** | 100% coverage on the product feature-list page alone (the surface that prompted this — `/products/:id`). `/journey` and org kanban reaching 100% is the full target; product-list-only is the floor below which this should be treated as not shipped |
| **Measurement method** | One-time verification at `/definition-of-done`, not an ongoing tracked KPI: an automated test asserting correct rendering against fixture journeys covering all three states (fully / mixed / none), plus a manual spot-check on `wuce-staging` against known real features (e.g. a CLI-authored feature showing "no session", and a freshly-created session-backed feature showing "fully session-backed" — mirroring today's live verification of the underlying mechanism) |
| **Feedback loop** | If a surface doesn't reach the minimum validation signal by the story's DoD, the story is not marked done for that surface — /verify-completion blocks on it. No pivot/stop decision needed; this is a bounded build-and-verify story, not an experiment with an uncertain outcome |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| List-view session-origin visibility | sob-s1 (product feature-list — hits minimum validation signal), sob-s2 (/journey), sob-s3 (org kanban) | Covered — full target reached once all 3 stories are DoD-complete; minimum signal reached at sob-s1 alone |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach and visual design — that is `/design` and `/definition`
- Sprint targets or velocity — this metric is outcome-based (visibility achieved), not output-based
