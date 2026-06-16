# Definition of Done — Evaluation Report
## Story: credit.fairness-eval-1 — Implement demographic parity evaluation script
**PR #251 · Evaluated against inline definition artefact**

---

## Overall Verdict

> ## ⚠️ BLOCKED — NOT DONE
>
> All ACs, NFRs, and constraints pass on functional grounds. One deviation (D1) remains unresolved at merge time. PR #251 has been merged with a compliance-relevant artefact defect present in the repository. The story cannot be accepted as Done until D1 is remediated via a follow-up PR.

---

## AC / NFR / Constraint Matrix

| Criterion | Description | Evidence | Status |
|-----------|-------------|----------|--------|
| AC1 | JSON schema to stdout | T1 PASS · S1 PASS | ✅ PASS |
| AC2 | Exit code 1 + stderr log on breach | T2 PASS · T3 PASS · S2 PASS | ✅ PASS |
| AC3 | Exit code 0 when all within threshold | T4 PASS · S3 PASS | ✅ PASS |
| NFR-1 | FMA formula: gap = max − min per dimension | T5 PASS · NFR check confirmed (0.70 − 0.55 = 0.15) | ✅ PASS |
| NFR-2 | Deterministic / reproducible stdout | T6 PASS · sorted by dimension then group name | ✅ PASS |
| C1 | Threshold from config; hardcoding prohibited | T7 PASS · S4 PASS · PR diff confirms config read | ✅ PASS |
| C2 | Stderr audit trail every run, includes threshold | T3 PASS · S5 PASS · both passing and failing runs confirmed | ✅ PASS |

---

## Test Coverage Assessment

| Test | Mapped Criterion | Result |
|------|-----------------|--------|
| T1 — JSON output schema correct | AC1 | ✅ PASS |
| T2 — Gap > threshold → exit code 1 | AC2 | ✅ PASS |
| T3 — Stderr contains failing group + threshold | AC2, C2 | ✅ PASS |
| T4 — All gaps ≤ threshold → exit code 0 | AC3 | ✅ PASS |
| T5 — FMA max − min formula | NFR-1 | ✅ PASS |
| T6 — Same input → identical stdout | NFR-2 | ✅ PASS |
| T7 — Config threshold change drives exit code | C1 | ✅ PASS |

**7/7 tests passing. Coverage maps cleanly to all 7 criteria with no gaps.**

> **Coverage note:** C2 requires audit trail on *every* run (both passing and failing). T3 covers the failing-run case. S5 explicitly confirms stderr is non-empty on both passing and failing runs. Coverage is adequate. A future hardening recommendation would be a dedicated T8 asserting audit-trail presence on a clean passing run as a first-class test rather than scenario evidence only — but this is not a blocker for this story.

---

## Out-of-Scope Compliance

All six exclusions verified clean:

| Exclusion | Check |
|-----------|-------|
| Model retraining | ✅ Absent |
| CCCFA affordability | ✅ Absent |
| Gini / ROC-AUC / KS metrics | ✅ Absent |
| Real-time inference | ✅ Absent |
| Database storage | ✅ Absent |
| Hardcoded threshold constant | ✅ Absent — config read confirmed |

---

## Deviation Assessment

### D1 — JSON comment in `config/fairness-config.json` referencing unapproved AU APRA thresholds

| Attribute | Detail |
|-----------|--------|
| **Artefact** | `config/fairness-config.json` |
| **Nature** | Comment listing AU APRA threshold alternatives (0.03, 0.04) flagged by compliance team as premature — thresholds not yet approved for use |
| **Functional impact** | None — script reads `"fairness_threshold"` key correctly; C1 is not broken |
| **Compliance impact** | **Significant.** This is a regulatory configuration file in a credit fairness evaluation system. Any value or commentary in this file that references unapproved regulatory standards may be read by auditors, downstream engineers, or compliance reviewers as implying approval or intent to adopt those thresholds. In a regulated lending context this is not a cosmetic issue. |
| **Merge state** | PR #251 merged with deviation present. The comment is now in the main branch. |
| **Classification** | Minor functional impact · Non-trivial compliance risk |

**Disposition:** The deviation was identified and documented before merge. However, the record states it "must be removed before the PR is merged" and merge occurred without that remediation. The condition was not met. Marking as resolved-by-comment in a deviation log is not sufficient when the prescribed remediation action was a pre-merge code change.

**Required action:** A follow-up PR must remove the AU APRA comment from `config/fairness-config.json`. Until that PR is merged, this story is not Done.

---

## Pre-Merge Condition Failure

The deviation record explicitly states:

> *"The comment must be removed before the PR is merged"*

PR #251 has been merged. This pre-merge condition was not satisfied. The pipeline must treat the story as blocked regardless of the "minor" classification applied to D1. Classification affects severity, not whether a stated pre-merge condition was met.

---

## Remediation Requirements

To close this story as Done the following must be completed:

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| R1 | Open follow-up PR to remove AU APRA threshold comment from `config/fairness-config.json` | Engineer | **Immediate — compliance blocker** |
| R2 | Compliance team to confirm removal is sufficient, or specify whether a formal note in the deviation register is also required | Compliance | Before story acceptance |
| R3 | (Recommended, non-blocking) Add T8 as a first-class test asserting stderr audit trail is non-empty on a passing run | Engineer | Next sprint |

---

## Sign-off State

| Gate | Status |
|------|--------|
| All ACs pass | ✅ |
| All NFRs pass | ✅ |
| All constraints pass | ✅ |
| Test suite 100% passing | ✅ |
| Out-of-scope clean | ✅ |
| Deviations resolved | ❌ D1 unresolved at merge — pre-merge condition not met |
| **Story status** | **⚠️ NOT DONE — pending R1 + R2** |

---

*Pipeline: /definition-of-done · Story: credit.fairness-eval-1 · PR #251 merged · Report generated against inline definition artefact*