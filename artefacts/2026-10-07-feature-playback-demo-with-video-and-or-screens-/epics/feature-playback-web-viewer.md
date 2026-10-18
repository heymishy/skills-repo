## Epic: Sponsors can browse and play a DoD-validated feature's playback package inside the app, organised by this platform's own outer-loop traceability chain

**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, an authenticated user can open a new route in this app's own web UI, pick a DoD-validated feature, and see its playback package organised as a scope-and-benefit summary (reusing `discovery.md`/`benefit-metric.md` directly) followed by a per-story section showing each story's own ACs alongside the specific screenshot(s)/video clip(s) evidencing each one — reusing the DoD artefact's own AC Coverage table as the structure. Playback-only, no editing. The walking skeleton's own two-story shape: `fpd-s3` establishes the navigable structure (list a feature, drill into its stories and ACs) even before real media exists to show; `fpd-s4` fleshes it out with the actual screenshot gallery and video player.

## Out of Scope

- **Redesigning or replacing the existing governance dashboard** (`dashboards/pipeline-viz.html`) — per discovery Out of Scope item 7, this is a narrower, sponsor-facing acceptance view, not a dashboard replacement.
- **In-browser video editing, trimming, or annotation** — per discovery Out of Scope item 5, playback-only.
- **Sponsor feedback collection tooling** — per discovery Out of Scope item 1; the viewer is read-only.
- **Multiple output formats / a format picker** — per discovery Out of Scope item 6; MP4 and PNG only.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M1 — Acceptance loop closure rate | 0% | ≥80% within 5 business days | Without a viewer, "shared with sponsors" means emailing file paths or opening raw files in GitHub — this epic is what makes the package genuinely shareable and reviewable as a real artefact, not just produced |
| M2 — Sponsor feedback re-entry rate | Not yet established | 100% of change-requested feedback formalised within 10 business days | A sponsor reviewing a well-organised, traceable package (scope → benefit → per-story AC evidence) is far more likely to give specific, actionable feedback than one handed a folder of loose files |

## Stories in This Epic

- [x] Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure — `fpd-s3`
- [x] Viewer renders the actual screenshot gallery and plays video per AC — `fpd-s4`
- [x] Fix the two structural gaps blocking any real feature from using the viewer — `fpd-s5`
- [ ] Add an at-a-glance coverage summary to the top of the review page — `fpd-s6`

## Human Oversight Level

**Oversight:** High
**Rationale:** Per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture" — oversight defaults to High for every story in this repo's operating model, not because this epic's own complexity demands it.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
