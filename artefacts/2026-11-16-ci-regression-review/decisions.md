# Decisions: CI regression scenarios review

**2026-11-16 | FINDING | CI cost and noise sit outside the functional tests**
**Evidence:** `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` (1000 runs over about 3.5 days): 342 always-red runs, incident bot PRs 23% of PR gating, the staging end-to-end tests master rather than the PR and sets the time to green, and no CI scenario exercises the real production wiring.

**2026-11-16 | DECISION | Operator: fix the Improvement Agent ("dreaming"); disable Fleet Aggregation**
**Context:** the operator asked, after reading the audit, for the Improvement Agent workflow to be fixed and Fleet Aggregation to be disabled.
**Decision:** story `ciw-s1` fixes the dreaming workflow (it currently pushes to master, which the ruleset rejects, and stages about 3000 trace files); story `ciw-s2` disables Fleet Aggregation (missing `FLEET_PUSH_TOKEN`) and records the Pages decision as an open question (Pages is not enabled, so its deploy fails on every push).
**Rationale:** the dreaming workflow is a feature the operator wants; Fleet is not currently used.

**2026-11-16 | SEQUENCING | Do the wiring smoke test before moving the staging end-to-end off the PR gate**
**Decision:** `sep-s1` is blocked until `pws-s1` is merged. Low-risk noise removal (`ciw-s2`, `inc-s1`, `spa-s1`) can go first.
**Rationale:** the staging end-to-end does not test the PR's code, but it is the only end-to-end signal today; the wiring smoke test is its replacement on the PR.

**2026-11-16 | CONSTRAINT | The ruleset requires three status checks**
**Context:** a push to master by the dreaming workflow was rejected with "3 of 3 required status checks are expected". Any story that skips, renames or path-filters a workflow must first read which three checks are required, because a required check that never reports blocks every merge. Affects `inc-s1` and `sep-s1`.

## Proposed order

1. `ciw-s2` (disable Fleet; Pages decision), `spa-s1`, `trr-s1`: small and independent.
2. `ciw-s1` (fix dreaming), once its two open questions are answered.
3. `pws-s1`, then `inc-s1`, then `sep-s1`.
4. `bfl-s1` and `pbj-s1` in parallel with the above when convenient.
