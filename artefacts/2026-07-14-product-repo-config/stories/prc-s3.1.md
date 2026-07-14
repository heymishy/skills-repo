## Story: Write standards to the product's repo as the source of truth

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As an **engineer actively pairing from a different surface**,
I want to **have a product's standards exist as real files in its repo**,
So that **I can review and contribute to them the same way I would any other file, without needing web UI access**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** Per the `/clarify` resolution, files are the source of truth for standards — this story is the write path that makes that true for new/edited standards going forward.

## Architecture Constraints

ADR-020: same identity/token model as every other write path in this feature. Reuses the same Contents/Git Data API mechanism established in prc-s2.4.

## Dependencies

- **Upstream:** prc-s2.4 (reuses its write mechanism)
- **Downstream:** prc-s3.2, prc-s3.3

## Acceptance Criteria

**AC1:** Given a product with a connected repo, When a standard is created or edited (via `standardsPost`/`standardsPut`), Then the content is committed to a real file in that product's repo (e.g. `standards/<name>.md`), not only written to the `standards` DB table.

**AC2:** Given a standard already exists as a file, When it's edited again, Then the existing file is updated (a new commit), not duplicated.

**AC3:** Given a product has no connected repo, When a standard creation/edit is attempted, Then it's rejected with the same "no repo configured" error pattern as every other write path in this feature.

## Out of Scope

- The opt-out/promote mechanisms themselves (`standard_product_optouts`) — this story only changes where standard content is written, not the visibility-tier logic layered on top.

## NFRs

- **Performance:** Same as other Contents API writes.
- **Security:** Same fail-closed pattern.
- **Accessibility:** Not applicable.
- **Audit:** Commit history is the audit trail.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
