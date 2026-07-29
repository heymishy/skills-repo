# Decisions: Auto-confirm real-staging E2E specs immediately after every master deploy

---

**Decision:** GAP — no discovery artefact for this feature
**Date:** 2026-07-29
**Context:** Short-track path (per CLAUDE.md) intentionally skips `/discovery` through `/review` for bugs, small fixes, and bounded refactors.
**Decision:** Proceed without a discovery artefact. H-GOV is acknowledged as a structural short-track exception, not an oversight.
**Rationale:** This story is a bounded CI/documentation change matching the short-track profile exactly (Complexity 1, Stable scope, no cross-team dependency). The scope and rationale are fully captured in the story's own Benefit Linkage section, which cites the two concrete capture-log incidents (dsh-s4, 2026-07-28) that motivate it.

---

**Decision:** New post-deploy confirmation job is non-blocking, not a release gate
**Date:** 2026-07-29
**Context:** The story could have made the new job's success a prerequisite for `promote-to-prod` (stronger guarantee, but couples release cadence to a job whose only purpose is same-day visibility into a narrow bootstrapping edge case).
**Decision:** The new job has no `needs:` edge into it from any other job, and it is not added to `promote-to-prod`'s `needs:` list — a failure here is a signal to investigate, not an automatic block on promotion.
**Rationale:** `smoke-test` already gates `promote-to-prod` and covers the general "is staging healthy" question. This new job exists specifically to close the narrow bootstrapping-gap window (a spec that could not be meaningfully validated pre-merge because its target endpoint didn't exist yet) — conflating that with the release gate would mean a flaky or still-settling new spec could block unrelated releases. Non-blocking preserves the release gate's existing meaning while still delivering the confirmation signal same-day instead of relying on a human to remember a manual re-run.

---

**Decision:** Narrowed `check-rlcc-s1-smoke-test-worker-isolation.js`'s AC2 scope from "exactly one `--workers=1` in the whole `staging-deploy.yml` file" to "exactly one inside the `smoke-test` job specifically, and never inside `deploy-staging`/`promote-to-prod`"
**Date:** 2026-07-29
**Context:** Adding `--workers=1` to the new `post-deploy-e2e-confirm` job's two `run:` lines (needed for the identical CPU-contention reason rlcc-s1/a2ccf-s1 already document for these same spec files) caused the full test suite to regress from the established 37-failure baseline to 38 — `check-rlcc-s1-smoke-test-worker-isolation.js`'s AC2a asserted file-wide uniqueness of the flag, which was a correct proxy for "the flag didn't leak into an unrelated job" at the time rlcc-s1 was written, back when `staging-deploy.yml` had only one job that could plausibly need it.
**Decision:** Rewrote AC2 to check job-scoped uniqueness (within `smoke-test`) plus explicit absence from `deploy-staging` and `promote-to-prod`, rather than removing `--workers=1` from the new job (which would reintroduce the exact CPU-contention flake class rlcc-s1 fixed, applied to a job running the identical specs against the identical shared staging server).
**Rationale:** The test's real intent — confirmed by re-reading rlcc-s1's own story rationale — was narrow leakage prevention into `deploy-staging`/`promote-to-prod`, not a blanket ban on any other job ever using the same flag for its own, independently-justified reason. Keeping the file-wide assertion would have forced a worse outcome (dropping `--workers=1` from a job that needs it) purely to satisfy a test whose literal wording was stricter than its documented intent. Full suite re-run after the fix: back to the established 37-failure baseline, confirming no other regression.
