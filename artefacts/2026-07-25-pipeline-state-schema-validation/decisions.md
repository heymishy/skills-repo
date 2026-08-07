## Decisions: local pipeline-state schema checks (pss-s1)

### Decision: extend `check-pipeline-state-integrity.js` rather than build a new Python-parity validator

**Date:** 2026-07-25
**Context:** CI's `scripts/validate-trace.sh` catches full `pipeline-state.schema.json` violations (required fields, enums, types) via Python's `jsonschema` library, but only runs in CI, after a PR is already open. Locally, `python3` is unusable on this operator's Windows dev machine (resolves to a permission-denied Windows Store stub); `python` (3.7.3) does have `jsonschema` installed, but relying on that specific local binding is fragile and inconsistent with this repo's otherwise all-Node local tooling.
**Decision:** Add five new narrowly-scoped checks (C10-C14) to the existing `scripts/check-pipeline-state-integrity.js`, rather than writing a new script or a generic Draft-7 JSON-Schema engine in Node. The five checks target only the specific fields that have caused real, documented incidents: story `id` (flat only), feature `track`, `dodStatus` enum, `prStatus` enum, `acVerified` type.
**Rationale:** This file already implements the identical class of check (C6: `testPlan.status` enum, C7: `feature.stage` enum, C8: epic-nested `slug` requirement) — extending it keeps all schema-adjacent local checks in one place operators already know to run, avoids a second implementation that could drift from the real schema, and stays "zero external dependencies" per the file's own documented contract. A full generic schema engine was explicitly rejected as over-scoped: the five fields chosen are the only ones with a real incident history in `workspace/capture-log.md`.

### Decision: do not retroactively fix real violations found by the new checks

**Date:** 2026-07-25
**Context:** Running the new C12/C13 checks against the real `.github/pipeline-state.json` immediately surfaced 12 pre-existing violations (invalid `dodStatus`/`prStatus` values on old stories).
**Decision:** Left them as-is; logged to `workspace/capture-log.md` as a follow-up data-cleanup candidate instead of fixing them inline.
**Rationale:** Matches this story's own Out of Scope section — fixing historical data is a separate, unscoped cleanup (a one-off `pipeline-state.json` correction, not a code change), and bundling it into this PR would conflate a behavioural change (new checks) with a data change (fixing old records), making the diff harder to review and revert independently if needed.
