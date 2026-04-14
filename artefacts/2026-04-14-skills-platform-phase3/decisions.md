# Decisions Log: Skills Platform — Phase 3

**Feature:** 2026-04-14-skills-platform-phase3
**Last updated:** 2026-04-14

---

## DEC-P3-001 — Bitbucket DC auth test resolution: Option B adopted

**Date:** 2026-04-14
**Story:** p3.1d — Resolve permanently-skipped Bitbucket DC auth tests
**Decision type:** Implementation path choice
**Status:** Accepted

**Context:** Story p3.1d (Acceptance Criterion 1 — Resolve permanently-skipped Bitbucket DC auth tests) offers two resolution paths for the four permanently-skipped auth tests (`app-password`, `OAuth`, `SSH key`, `PAT`) in `tests/check-bitbucket-dc.js`:

- Option A — Add a scheduled CI workflow (`.github/workflows/bitbucket-dc-auth.yml`) with a live Bitbucket DC Docker service container. Tests execute on a weekly schedule rather than on `pull_request`, satisfying Acceptance Criterion 2.
- Option B — Add dated manual test record entries to `tests/smoke-tests.md` and replace `// PREREQ-DOCKER` annotations with `// MANUAL: see smoke-tests.md`. Each entry records test name, last-run date (ISO 8601), result, runner identity, and Docker dependency rationale. Satisfies Acceptance Criterion 3.

**Decision:** Option B — manual test record in `tests/smoke-tests.md`.

**Rationale:** No Bitbucket DC Docker service is available in the CI environment at the time of Phase 3 implementation. Option A is architecturally preferred long-term but cannot be validated without the Docker infrastructure in place. Option B formalises the current skip as a documented, auditable coverage decision rather than leaving it as an unresolved gap. The four tests are no longer silently skipped — they carry an explicit annotation pointing to the dated manual record. Phase 4 infrastructure work can replace the smoke-tests.md entries with the scheduled workflow when the Docker service becomes available.

**Impact on ACs:**
- Acceptance Criterion 2 (Option A — scheduled CI workflow `bitbucket-dc-auth.yml`) is **OPTION-NOT-CHOSEN** for Phase 3. Not implemented.
- Acceptance Criterion 3 (Option B — `smoke-tests.md` entries with 5 required fields) **applies**. This is the active implementation path.
- Acceptance Criterion 4 (`npm test` shows `// MANUAL: see smoke-tests.md` annotation, not a permanent bare skip) **applies** under Option B.
- Acceptance Criterion 5 (decision logged in decisions.md with rationale) is **satisfied by this entry**.

**Alternatives considered:** Option A — deferred to Phase 4 pending Docker infrastructure provisioning.

**Reversibility:** Fully reversible. When a Bitbucket DC Docker service is provisioned in CI, Option A can be implemented by: creating `bitbucket-dc-auth.yml`, updating `tests/check-bitbucket-dc.js` to remove Manual annotations, and archiving or removing the `smoke-tests.md` entries for the four tests.

**Logged by:** Operator (tech lead), 2026-04-14
