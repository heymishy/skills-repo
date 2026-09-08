## Epic: Operators can tell whether a feature has a real resumable session without opening it

**Discovery reference:** artefacts/2026-09-08-session-origin-badge/discovery.md
**Benefit-metric reference:** artefacts/2026-09-08-session-origin-badge/benefit-metric.md
**Slicing strategy:** Walking skeleton — Story 1 establishes the shared derivation logic, the bulk-lookup seam, and the visual indicator on the product feature-list page (the surface that prompted this and benefit-metric's own minimum validation signal). Stories 2 and 3 extend the same shared logic to `/journey` and org kanban, with no new derivation logic to write.

## Goal

An operator scanning the product feature-list page, `/journey`, or the org kanban board can see, at a glance and without opening any feature, whether that feature's completed stages were driven through a real interactive web session (resumable) or authored directly by an agent/CLI (nothing to resume) — closing the visibility gap found during today's investigation of a "resume link missing" report, where the underlying mechanism was proven correct but had no way to be seen from a list view.

## Out of Scope

- Retroactively creating a session for a CLI-authored feature — the existing lazy-session-creation-on-first-resume-click flow (`ep1-s3`) already covers this; unchanged by this epic.
- Changing `/features/:slug`'s own "Resume conversation" per-artefact links — verified working correctly this session; out of scope.
- Surfacing CLI-authored features with zero real journey on org kanban or the product page's journeys-table rows — both currently invisible on those two surfaces by construction (they only query `journeys` directly); a separate, larger visibility gap this epic's design investigation surfaced but does not fix (see design.md Open Question #2).
- Any click/drill-down interaction on the indicator itself — MVP is glance-only.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| List-view session-origin visibility | 0% | 100% of rows on product feature-list, `/journey`, and org kanban show the correct indicator | Story 1 delivers the shared derivation logic and the product feature-list page (hits the 100%-on-one-surface minimum signal); Stories 2 and 3 extend coverage to the remaining two surfaces |

## Stories in This Epic

- [ ] sob-s1 — Shared session-origin derivation + product feature-list indicator
- [ ] sob-s2 — Session-origin indicator on the /journey dashboard
- [ ] sob-s3 — Session-origin indicator on the org kanban board

## Human Oversight Level

**Oversight:** Low
**Rationale:** Read-only presentational feature, no new writes, no schema change, no regulated/PCI/customer-facing-externally scope. A coding agent can proceed without checkpoints beyond the normal PR review.

## Complexity Rating

**Rating:** 1

<!-- Well understood, low ambiguity, clear path — derivation logic is a pure function over existing data, and the bulk-lookup seam pattern is already established and used twice in this codebase. -->

## Scope Stability

**Stability:** Stable
