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

---

### ADR-H7.1 — Module import over subprocess for web UI CLI integration

**Date:** 2026-05-24
**Session phase:** spike (H7.1)
**Spike artefacts:** `artefacts/2026-05-19-cli-deterministic-governance/spikes/h7.1-web-ui-subprocess-outcome.md`

**Context:** Phase 2 requires the web UI gate-confirm handler to enforce CLI structural checks before writing pipeline state. H7.1 investigated whether this should be done via subprocess invocation (`child_process.spawn('node bin/skills validate ...')`) or direct module import (`require('../enforcement/cli-outer-loop').validate(...)`).

**Decision:** Phase 2 web UI integration uses direct module import (`require()`), not subprocess invocation. The `bin/skills advance` CLI binary (for CI use) also calls the same underlying modules directly — it is a thin wrapper, not a subprocess caller.

**Rationale:** `cli-outer-loop.js` is a pure exportable function with no side effects. The established web UI pattern throughout `src/web-ui/` is `require()` for all internal module calls — `child_process` appears only in `cli-adapter.js` for `git fetch`, not in any route handler. Subprocess invocation from a route handler would introduce PATH resolution risk, shell injection surface, stdout/stderr parsing overhead, and subprocess lifecycle management, all of which are avoided by direct module import. Both surfaces (web UI and CI binary) exercising the same modules means a module-level test covers both callers.

**Integration gap confirmed:** `handlePostGateConfirm` in `src/web-ui/routes/journey.js` currently writes pipeline state without first calling `cli-outer-loop.validate()`. Phase 2 closes this gap: the handler must call `validate(dorArtefactPath, 'definition-of-ready', repoRoot)` and only proceed to `_pipelineStateWriter()` if exit code is 0. Artefact disk write precedes validate (already the case — correct per disk canonicity rule ADR-023).

---

### RISK-ACCEPT-004 — MEDIUM review finding acknowledged: NFR section absent in cdg.3, cdg.4, cdg.5

**Date:** 2026-05-24
**Session phase:** review
**Decision:** Proceed to /test-plan for cdg.3, cdg.4, cdg.5 after acknowledging finding 1-M1 (missing NFR section). Finding resolved inline during review session — NFR sections added to all three stories before review reports were written.

**Context:** Review Run 1 for all three Phase 2 stories (cdg.3, cdg.4, cdg.5) surfaced the same MEDIUM finding: no `## Non-Functional Requirements` section. The review template requires either populated NFRs or an explicit "None — confirmed" statement. None of the three stories had this section.

**Resolution:** The fix is trivial and was applied inline during this review session:
- cdg.3: Added "None — confirmed — cdg.3 is a CLI utility. No latency SLA, no uptime requirement, no user-facing UI."
- cdg.4: Added security NFR (path traversal guard, input sanitisation — already encoded in ACs and Architecture Constraints; stated here for completeness) and performance NFR (no SLA — infrequent human action).
- cdg.5: Added integrity NFR (append-only file writes), test isolation NFR, and no-external-crypto-dependency NFR.

All three stories now have an NFR section. The finding is resolved — no residual risk.

**Decision:** RISK-ACCEPT moot — finding resolved inline. Stories ready for /test-plan.

---

### RISK-ACCEPT-005 — Verification scripts not independently reviewed (cdg.3, cdg.4, cdg.5 — W4)

**Date:** 2026-05-24
**Session phase:** definition-of-ready
**Decision:** Acknowledge W4 for cdg.3, cdg.4, and cdg.5. Proceed to coding.

**Context:** W4 applies to all three Phase 2 stories — the verification scripts for cdg.3 (`cdg.3-verification.md`), cdg.4 (`cdg.4-verification.md`), and cdg.5 (`cdg.5-verification.md`) have not been reviewed by a separate domain expert. On a solo personal project there is no separate domain expert available.

**Rationale:** The operator (Hamis) is the sole platform maintainer and acts as the domain expert for all three scripts. The scripts were reviewed during authoring in this session. Misspecified behaviour would surface during coding (tests would not pass) or at PR review. The risk of undetected misspecification is low because the scripts map directly to story ACs which were written first.

**Residual risk:** Low. Solo project context — no compliance obligation requiring independent verification.
