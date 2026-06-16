# Definition of Done Evaluation — credit.fairness-eval-1

**PR #251 | Implement demographic parity evaluation script**
Evaluated against story artefact, test plan, AC verification, PR diff, and deviation record.

---

## Summary Verdict

> ⚠️ **NOT DONE — Conditional block on D1 (documentation/compliance)**

All functional, non-functional, and constraint requirements are met. One open item blocks sign-off.

---

## AC Evaluation

| Criterion | Requirement | Evidence | Result |
|-----------|-------------|----------|--------|
| AC1 | JSON to stdout: `{ "groups": [{ group, dimension, gap, threshold, pass }] }` | T1 PASS; S1 PASS — schema confirmed | ✅ PASS |
| AC2 | Gap > threshold → exit 1; failing groups to stderr | T2 PASS (exit 1); T3 PASS (stderr content); S2 PASS | ✅ PASS |
| AC3 | All groups ≤ threshold → exit 0 | T4 PASS; S3 PASS | ✅ PASS |
| NFR-1 | Gap = max(rate) − min(rate) per dimension (FMA, non-substitutable) | T5 PASS — three-group ethnicity case: 0.70 − 0.55 = 0.15 verified | ✅ PASS |
| NFR-2 | Same input → identical stdout (deterministic ordering) | T6 PASS — two runs compared; sorted by dimension then group name | ✅ PASS |
| C1 | Threshold read from `config/fairness-config.json`; no hardcoding | T7 PASS; S4 PASS — threshold change from 0.05 → 0.10 changes exit code; diff confirms no constant in script | ✅ PASS |
| C2 | Stderr audit log with all gap values and threshold on every run | T3 PASS; S5 PASS — stderr non-empty on both passing and failing runs | ✅ PASS |

---

## Test Coverage Evaluation

| Test | Maps to | Status | Adequacy note |
|------|---------|--------|---------------|
| T1 | AC1 | PASS | Schema validated |
| T2 | AC2 | PASS | Boundary case: gap 0.20 > threshold 0.05 |
| T3 | AC2, C2 | PASS | Stderr content verified for failing group |
| T4 | AC3 | PASS | All-pass scenario confirmed |
| T5 | NFR-1 | PASS | Three-group case exercises max−min correctly |
| T6 | NFR-2 | PASS | Two-run comparison; deterministic ordering confirmed |
| T7 | C1 | PASS | Config-driven threshold change observed in exit code |

**Coverage assessment:** All ACs, NFRs, and constraints have at least one corresponding passing test. The test matrix is complete relative to the story scope.

**One gap noted for awareness (not a blocker for this story):** No test currently covers the case where `config/fairness-config.json` is absent or malformed. This is an operational resilience concern; recommend capturing as a follow-up ticket rather than holding this story.

---

## Out-of-Scope Check

| Item | Status |
|------|--------|
| Model retraining | Not present |
| CCCFA affordability scoring | Not present |
| Gini / ROC-AUC / KS metrics | Not present |
| Database writes | Not present |
| Real-time inference / API endpoints | Not present |

No scope bleed detected.

---

## Deviation Evaluation

### D1 — AU APRA threshold alternatives in `config/fairness-config.json` (JSON comment)

**Classification:** Minor — compliance/documentation risk, not a functional defect.

**Analysis:**

The story requires that `config/fairness-config.json` configures the NZ FMA threshold. The committed file satisfies this (`"fairness_threshold": 0.05`). However, the inline JSON comment referencing AU APRA alternatives (0.03, 0.04) introduces a material compliance concern:

- AU APRA thresholds have not been approved for use in this jurisdiction context.
- A config file is an operational artefact. Comments in config files are routinely read by engineers making threshold changes under time pressure. An unapproved threshold value listed alongside the approved one creates a plausible path to an incorrect configuration change.
- The compliance team has explicitly flagged this. That flag is on record.

**The stated rationale — "minor and does not affect AC pass/fail" — is accurate for functional correctness but is not the relevant frame.** The relevant frame is whether a committed artefact contains unapproved compliance-sensitive values that could influence future operational decisions. It does.

**Disposition:**

> 🔴 **D1 blocks Done sign-off.**
> The comment must be removed from `config/fairness-config.json` and the corrected file committed before this story is marked Done. This requires a follow-up commit or PR — PR #251 has already merged, so the remediation must be a new commit.

The fix is trivial (comment deletion). This is not a reopening of functional work. However, marking Done before the config is corrected would leave an unapproved compliance artefact in the main branch, which is inconsistent with the compliance constraint the story operates under.

---

## Remediation Required

| Item | Action | Owner | Blocking? |
|------|--------|-------|-----------|
| D1 — Remove AU APRA comment from `config/fairness-config.json` | New commit; delete comment lines referencing 0.03 / 0.04 APRA alternatives | Assigned dev + compliance confirmation | **Yes** |
| Missing malformed-config test | Create follow-up ticket for error-handling coverage | Story author | No — follow-up only |

---

## Conditions for Done

This story may be marked **Done** when:

1. ✅ A follow-up commit removes the AU APRA comment from `config/fairness-config.json` on the main branch.
2. ✅ Compliance team confirms the corrected config (verbal or ticket comment is sufficient — no re-review cycle required given the trivial nature of the change).
3. ✅ No new functional changes are introduced in that commit (comment deletion only).

All other ACs, NFRs, constraints, tests, and scope checks are satisfied and do not require further action.

---

*Definition of Done pipeline evaluation complete. Status: CONDITIONAL — one non-functional remediation item outstanding (D1).*