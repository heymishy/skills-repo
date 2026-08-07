# Decisions: CI deploy-collision fix (cif-s1, cif-s2)

---

**Decision:** GAP — no discovery artefact for this feature (cif-s1 and cif-s2)
**Date:** 2026-07-29
**Context:** Short-track path (per CLAUDE.md) intentionally skips `/discovery` through `/review` for bugs, small fixes, and bounded refactors. This `decisions.md` was not created at cif-s1 time despite that story's own DoR referencing it — retroactively noted here rather than silently left absent, since cif-s2 reopens this same feature folder.
**Decision:** Proceed without a discovery artefact for both stories. H-GOV is acknowledged as a structural short-track exception, not an oversight.
**Rationale:** Both stories are bounded CI workflow changes matching the short-track profile exactly (Complexity 1, Stable scope). cif-s1's scope and rationale are fully captured in its own Benefit Linkage section (5 confirmed deploy-collision occurrences this session); cif-s2's scope and rationale are captured in its Benefit Linkage section (the PR #633 cancellation evidence).

---

**Decision:** Fix cif-s2's scenario-racing gap via an explicit `needs:` edge, not a distinct concurrency group per scenario
**Date:** 2026-07-29
**Context:** Discovered while verifying PR #633 (pmec-s1, unrelated feature): `scenario-a-staging-e2e` and `scenario-b-staging-e2e` (both given `concurrency: deploy-group` by cif-s1) have no ordering relationship between them and both fire from the same `pull_request` event, so they simultaneously request the same group on every push. GitHub Actions only allows one running plus one queued request per group at a time — a third concurrent request (another open PR's own Scenario A/B pair, or a `deploy-staging` run) can cancel the queued one outright. Confirmed directly: PR #633's `Scenario B E2E (staging)` was cancelled ("Canceling since a higher priority waiting request for deploy-group exists") when two rapid pushes produced four simultaneous requests for the group; re-running the cancelled job in isolation (no competing request) passed cleanly.
**Decision:** Add `needs: scenario-a-staging-e2e` to `scenario-b-staging-e2e`, rather than giving Scenario A and Scenario B distinct concurrency groups from each other.
**Rationale:** Two alternatives were considered and rejected:
  1. **Give Scenario A and B separate groups from each other** (e.g. `deploy-group-a` / `deploy-group-b`) — rejected, because this would only work if BOTH still share `deploy-staging`'s exact group name to preserve cif-s1's original deploy-vs-E2E collision fix; giving them fully separate names would either reintroduce that original race (if neither matches `deploy-staging`'s name) or require three-way group juggling for no real benefit over simple sequencing.
  2. **Remove the concurrency guard from one of the two scenarios** — rejected, since both genuinely need protection from racing a live redeploy; removing either would reintroduce cif-s1's original bug for that scenario.
  Sequencing via `needs:` is the minimal, deterministic fix: it converts an implicit, racy "these two happen to want the same group" relationship into an explicit dependency, so at most one of {Scenario A, Scenario B} is ever an active requester — freeing the group's single queued slot for genuine cross-PR/deploy contention instead of Scenario A and B consuming it against each other. This also matches cif-s1's own stated intent ("Scenario A and B become mutually exclusive with each other too") — the goal was always sequential execution; this story makes that goal reliable instead of merely accidental.
