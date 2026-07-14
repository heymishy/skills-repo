## Story: Resolve sign-off write-back to the product's own repo

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-1-walking-skeleton.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **web UI operator running the outer loop**,
I want to **have sign-off commits land in my product's own connected repo**,
So that **my product's artefacts have real, isolated git history instead of landing in the platform's shared repo**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact; Metric 3 — Cross-tenant repo isolation
**How:** This is the first write path to stop reading the single global `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` and instead resolve per-product — the concrete mechanism both metrics depend on.

## Architecture Constraints

ADR-020: must continue using the authenticated user's own OAuth token; only the owner/repo resolution changes, not the identity model. `sign-off-writer.js`'s `commitSignOff` currently reads `process.env.GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` directly — this story changes it to accept owner/repo as parameters, resolved by the caller (`routes/sign-off.js`) from the product's `repo_owner`/`repo_name`.

## Dependencies

- **Upstream:** prc-s1.1, prc-s1.2 (needs a connected repo to resolve to)
- **Downstream:** prc-s1.4 (the end-to-end proof depends on this working); prc-s2.3 (annotation write path reuses the same resolution pattern)

## Acceptance Criteria

**AC1:** Given a product with a connected repo, When an operator signs off an artefact belonging to that product, Then the resulting commit lands in that product's repo, not the single global repo.

**AC2:** Given two different products with two different connected repos, When operators sign off artefacts in each, Then each commit lands only in its own product's repo — never the other's. (This AC is the direct precursor to Epic 4's formal cross-tenant isolation E2E spec, proven here at the unit/integration level first.)

**AC3:** Given a product with NO connected repo, When an operator attempts to sign off an artefact for that product, Then the action is rejected with a clear "this product has no repo configured" error — never silently falling back to the old global env var.

**AC4:** Given the existing `commitSignOff` behaviour (commit author/committer as the authenticated user, never a service account), When write-back now resolves per-product, Then that identity/attribution behaviour is unchanged — only the target repo changes.

## Out of Scope

- Routing the annotation write path (prc-s2.3) or the local artefact-write path in `journey.js` (prc-s2.4) — this story covers sign-off only, deliberately, to keep the walking skeleton thin.
- Any UI changes beyond what's needed to surface the "no repo configured" error.

## NFRs

- **Performance:** No material change — same number of API calls, just parameterized.
- **Security:** AC3's fail-closed behaviour is itself the key security requirement — no silent fallback to the shared repo.
- **Accessibility:** Not applicable.
- **Audit:** Existing sign-off audit logging (commit message includes approver) is unchanged.

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
