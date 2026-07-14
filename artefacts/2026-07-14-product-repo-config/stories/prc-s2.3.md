## Story: Resolve annotation write-back to the product's own repo

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **web UI operator or pairing engineer**,
I want to **have annotation commits land in my product's own repo, the same way sign-off now does**,
So that **all forms of write-back are consistently product-scoped, not just one**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact; Metric 3 — Cross-tenant repo isolation
**How:** Extends prc-s1.3's proven per-product resolution pattern to the second existing GitHub-Contents-API write path (`annotation-writer.js`), closing the gap where only sign-off was fixed.

## Architecture Constraints

ADR-020: same identity model. This story directly mirrors prc-s1.3's implementation pattern applied to `annotation-writer.js` instead of `sign-off-writer.js` — should reuse the same resolution helper, not duplicate the logic.

## Dependencies

- **Upstream:** prc-s1.3 (this story reuses/extends the resolution mechanism it introduced)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a product with a connected repo, When an operator or engineer annotates an artefact for that product, Then the resulting commit lands in that product's repo, not the single global repo.

**AC2:** Given a product with no connected repo, When an annotation is attempted, Then it is rejected with the same "no repo configured" error pattern as prc-s1.3 AC3 — consistent failure behaviour across both write paths.

**AC3:** Given the per-product resolution logic already exists from prc-s1.3, When this story is implemented, Then it reuses that same resolution function/module rather than reimplementing owner/repo lookup a second time — a direct code-reuse check, not just a behavioural one.

## Out of Scope

- Any new annotation UI/UX — this story only changes which repo receives the commit, not how annotation itself works.

## NFRs

- **Performance:** No material change.
- **Security:** Fail-closed behaviour (AC2) is the key requirement, matching prc-s1.3.
- **Accessibility:** Not applicable.
- **Audit:** Existing annotation audit logging unchanged.

## Complexity Rating

**Rating:** 1
<!-- Directly reuses prc-s1.3's pattern — the hard part was solved once already. -->
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
