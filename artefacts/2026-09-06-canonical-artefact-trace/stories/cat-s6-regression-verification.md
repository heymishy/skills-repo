## Story: The two existing non-trace consumers of artefact fetching keep working unchanged

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Platform maintainer**,
I want **explicit regression proof that `journey.js`'s gate-confirm flow and `export-data-source.js`'s SaaS export both behave identically after `cat-s5`'s changes to `fetchArtefact`'s internals**,
So that **this epic doesn't fix one class of bug while silently introducing a regression in an adjacent, easy-to-miss call site — the exact failure mode `tir-s5`'s mock-shape mismatch and `mtrr-s1`'s cross-tenant defect both taught this codebase to guard against explicitly**.

## Benefit Linkage

**Metric moved:** Bugs of this class per session
**How:** A regression in either of these two call sites would itself become a 6th instance of "this class of bug," directly undermining the metric this whole epic exists to move. Proving they're unaffected is what makes the 0-future-instances target credible, not just asserted.

## Architecture Constraints

- `req.session.accessToken` is the canonical field name (per `CLAUDE.md`) — confirm neither call site was quietly relying on the deprecated `req.session.token` in a way this epic's changes might expose.
- Mock-shape verification (per `CLAUDE.md`'s own documented `tir-s5` lesson) — any test written for this story must assert against the real, current shape of `journey.js`'s and `export-data-source.js`'s actual `fetchArtefact` call sites, not an assumed or convenient shape.

## Dependencies

- **Upstream:** cat-s5 (the change being verified against).
- **Downstream:** None — this is the epic's final story.

## Acceptance Criteria

**AC1:** Given `journey.js`'s gate-confirm flow (line 921, `fetchArtefact(journey.featureSlug, stageName, req.session.accessToken, _dasOwnerRepo)`), when a real gate-confirm is exercised for a feature with correct registration, then it returns the exact same artefact content as before `cat-s5`'s changes — verified via a direct test against the real call site, not a reimplemented mock of it.

**AC2:** Given `export-data-source.js`'s SaaS export path (`fetchArtefact` with a `repoOverride` for a specific tenant's repo), when a real export is exercised, then the per-tenant repo override still resolves correctly and independently of the trace's own single-repo assumptions in `cat-s1`-`cat-s5` — confirming `mtrr-s1`'s cross-tenant isolation is not silently reopened.

**AC3:** Given the full existing regression suites for `bsgm-s1`, `sri-s1`, `adlr-s1`, and `fadm-s1` (the four prior stories this epic's own work builds on), when this epic's changes are complete, then all four suites still pass unchanged — no test in any of them needs updating, since this epic changes the internal implementation those tests exercise, not their observable contracts.

**AC4:** Given the full repo test suite, when this epic's changes are complete, then the only failures present are the same pre-existing, already-documented baseline failures from this session (`check-p3.5-validate-trace.js`'s unrelated draft-status case; `check-pcr-s1-test-runner.js`'s timing-sensitive threshold) — no new failure is introduced anywhere in the suite.

## Out of Scope

- Fixing either of the two known pre-existing baseline test failures — explicitly out of scope, unrelated to this epic.
- Any change to `journey.js`'s or `export-data-source.js`'s own code — this story is verification-only; if a real defect is found, it becomes its own separate story, not folded into this one.

## NFRs

- **Performance:** Not applicable — this is a test/verification story.
- **Security:** Confirms `mtrr-s1`'s cross-tenant isolation is not weakened (AC2) — the one NFR-relevant aspect of this story.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

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
