# Decisions — CLI Deterministic Governance (2026-05-19-cli-deterministic-governance)

**Feature:** CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail
**Discovery artefact:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md

---

## Decision Log

### RISK-ACCEPT-001 — MEDIUM review findings acknowledged without /decisions resolution (cdg.1, W3)

**Date:** 2026-05-23
**Session phase:** definition-of-ready
**Decision:** Acknowledge and proceed with 2 MEDIUM review findings from cdg.1-review-1.md without resolving them before DoR sign-off.

**Context:** Two MEDIUM findings were raised in the review of cdg.1 (Run 1, 2026-05-23). W3 (MEDIUM findings not acknowledged in /decisions) was surfaced at DoR. The operator chose to log a RISK-ACCEPT rather than resolve the findings before proceeding.

**Finding 1-M1 — AC1 uses uninstructive fixture:** AC1 specifies `artefacts/2026-05-19-cli-deterministic-governance/discovery.md` as the example artefact for the clean-pass test. A discovery.md trivially passes H1 (it contains no story slug references), so the test does not exercise a "story referenced and found on disk" success path. The test plan mitigates this by using a synthetic artefact in T4a-T4c that exercises the relevant code path.

**Finding 1-M2 — AC3 exit code unspecified:** AC3 says "non-zero code" for insufficient argument count, while AC2 and AC6 both explicitly specify exit code 8 for related error conditions. The inconsistency is preserved in cdg.1 scope — the test plan asserts `status !== 0` (not pinned to 8). Formal exit code mapping for all error categories is cdg.2 scope.

**Risk accepted:** Both findings are non-blocking. The test plan already contains mitigations (synthetic fixture for T4a-T4c; status-range assertion for IT1-IT2). Risk of regressions at PR review is low given the mitigations are in place.

**Decision:** RISK-ACCEPT — proceed with DoR sign-off. No changes to cdg.1.md or the test plan required.

---

### RISK-ACCEPT-002 — Verification script not independently reviewed (cdg.1, W4)

**Date:** 2026-05-23
**Session phase:** definition-of-ready
**Decision:** Proceed to DoR sign-off with the cdg.1 verification script reviewed only by the operator (sole platform maintainer) acting as both author and domain expert.

**Context:** The verification script (`artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.1-verification.md`) was produced on 2026-05-23 and describes CLI behaviour for all 6 ACs. On a solo personal project with a single operator, independent domain expert review is not available. W4 was surfaced at DoR and the operator accepted the risk.

**Risk accepted:** The operator is the domain expert for this CLI tooling. The verification script was checked against the AC definitions at DoR time. The primary risk (coding agent implements against misspecified behaviour) is partially mitigated by the test plan's unit and integration tests, which provide a second specification layer that is independent of the verification script prose.

**Decision:** RISK-ACCEPT — proceed with DoR sign-off. Operator acts as sole domain expert reviewer.

---

### RISK-ACCEPT-003 — Verification script not independently reviewed (cdg.2, W4)

**Date:** 2026-05-23
**Session phase:** definition-of-ready
**Decision:** Proceed to DoR sign-off with the cdg.2 verification script reviewed only by the operator (sole platform maintainer) acting as both author and domain expert.

**Context:** The verification script (`artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.2-verification.md`) was produced on 2026-05-23 and describes CLI behaviour for all 8 ACs across 6 verification scenarios. On a solo personal project with a single operator, independent domain expert review is not available. W4 was surfaced at DoR and the operator accepted the risk.

**Risk accepted:** The operator is the domain expert for this CLI tooling. The verification script was checked against the AC definitions at DoR time. The primary risk (coding agent implements against misspecified behaviour) is partially mitigated by the unit test suite (T8-T11, G2a-G2b), which provides a second specification layer independent of the verification script prose.

**Decision:** RISK-ACCEPT — proceed with DoR sign-off. Operator acts as sole domain expert reviewer.
