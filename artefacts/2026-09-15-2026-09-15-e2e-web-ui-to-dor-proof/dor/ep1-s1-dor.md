# Definition of Ready — ep1-s1: Verify discovery through definition pipeline stages

**Story:** ep1-s1
**Feature:** 2026-09-15-e2e-web-ui-to-dor-proof
**Date:** 2026-09-15
**Status:** SIGNED OFF — Ready for execution

---

## Hard blocks: PASS (19/19)

All mandatory checks passed. No blockers.

---

## Warnings: Acknowledged

- W1 (NFRs): Populated inline ✅
- W2 (Scope stability): Declared as Stable ✅
- W3 (MEDIUM findings): None found ✅
- W4 (Solo operator): Standard RISK-ACCEPT posture per guardrails.md ✅
- W5 (Gaps): 1 gap (Real GitHub API verification) handled by manual script ✅

---

## Coding Agent Instructions

### Execution Model

This story is a **manual verification run**, not a traditional coding task. The "coding agent" role is the operator running skill sessions through the web UI and verifying outcomes.

**Primary actor:** Hamish King — Operator

**Execution path:**
1. Open the web UI at `http://localhost:3000`
2. Authenticate with GitHub OAuth (if not already authenticated)
3. Run `/discovery` skill for feature slug `2026-09-15-e2e-web-ui-to-dor-proof`
4. Produce discovery artefact and commit to GitHub via web UI
5. Run `/benefit-metric` skill for the same feature slug
6. Produce benefit-metric artefact and commit to GitHub
7. Run `/definition` skill for the same feature slug
8. Produce definition artefact (with 2 embedded stories: ep1-s1 and ep1-s2) and commit to GitHub
9. After each commit, verify in GitHub that the commit appears in `git log --oneline` under the operator's identity
10. After definition commit, verify `pipeline-state.json` reflects `stage: definition` and both stories have correct `artefactPath` fields

### Acceptance Criteria Verification

**AC1 — Three stages commit, pipeline-state.json shows correct stage/artefactPath:**

Verify by running the four manual scenarios from the test plan (`test-plans/ep1-s1-test-plan.md`):
1. Scenario 1: Discover and commit discovery.md — check `git log --oneline` and artefact file existence
2. Scenario 2: Run benefit-metric and commit — check new commit and file existence
3. Scenario 3: Run definition and commit with 2 stories — check new commit and both story files exist
4. Scenario 4: Verify pipeline-state.json reflects correct stage and artefactPath

If all four scenarios pass, AC1 is verified complete.

### Applicable Standards

None injected (story has no domain field).

### Constraints and Risks

**Constraint:** All three commits must land on master in the same session (per NFR).

**Risk:** If the web UI's commit mechanism fails or produces incorrect artefactPath values, this story will not pass AC verification. Root cause: wsd/wsap fixes not fully merged or broken by a later change.

**Mitigation:** If any commit fails or artefactPath is incorrect, pause the run, inspect the error, and halt until root cause is identified. Do not attempt to proceed past the failed stage.

### Definition of Done Criteria

This story is **complete** when:
1. All three manual scenarios (Scenarios 1–3) in the test plan complete successfully with visible commits in `git log`
2. Scenario 4 verification passes: `pipeline-state.json` on master shows `stage: definition` with correct artefactPath fields
3. Both story artefacts (`ep1-s1.md` and `ep1-s2.md`) exist at the correct paths in `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/stories/`

No code review, no PR, no branch setup required. The verification is complete when the operator has manually confirmed all four scenarios pass.

---

## Human Sign-Off Required

**Sign-off:** Required from Hamish King — Operator

**Sign-off recorded:**
- **Name:** Hamish King
- **Role:** Operator
- **Date:** 2026-09-15
- **Confirmation:** Proceeding with manual verification run as outlined above.

---