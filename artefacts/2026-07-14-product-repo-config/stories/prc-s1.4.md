## Story: Prove the walking skeleton end-to-end with a real commit

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **web UI operator running the outer loop**,
I want to **verify, with a real commit in a real repo, that the whole per-product write chain actually works**,
So that **Epic 2 onward can build on a proven foundation rather than an assumed one**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** This story is the first real measurement point for Metric 1's baseline — establishing that the mechanism works at all before layering more scope on top.

## Architecture Constraints

None identified beyond what prc-s1.1 through prc-s1.3 already established — this is a verification story, not new implementation.

## Dependencies

- **Upstream:** prc-s1.1, prc-s1.2, prc-s1.3 (all must be complete)
- **Downstream:** None — this is the epic's terminal story, gating Epic 2's start.

## Acceptance Criteria

**AC1:** Given a real (non-mock) GitHub repo connected to a real test product, When a sign-off is performed through the actual web UI (not a unit test mock), Then a real commit appears in that repo's history, authored by the operator's real GitHub identity.

**AC2:** Given the E2E verification in AC1, When the commit is inspected, Then its content matches exactly what the sign-off action was supposed to write — no truncation, no encoding corruption from the base64 Contents API round-trip.

**AC3:** Given this is the walking skeleton's proof point, When AC1 and AC2 both pass, Then this is recorded as Metric 1's first real baseline measurement in the benefit-metric artefact's coverage matrix — not left as an untracked manual check.

## Out of Scope

- Automating this as a permanent CI E2E spec — that's prc-s4.3's cross-tenant isolation spec, which supersedes this manual check with an automated one covering more ground. This story is a one-time proof, not a regression guard.

## NFRs

- **Performance:** None identified.
- **Security:** None beyond what prior stories established.
- **Accessibility:** Not applicable.
- **Audit:** The proof itself is the audit evidence — record the commit SHA in the story's DoD artefact.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
