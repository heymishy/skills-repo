# Review Report: cdg.7 — Gated advance: validate-before-write for stage transitions, and web UI adapter wiring

**Story slug:** cdg.7
**Review run:** 1 (retrospective — PR #373 merged 2026-05-27 before review artefact was written)
**Review date:** 2026-06-15
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Feature:** 2026-05-19-cli-deterministic-governance
**Categories run:** A, B, C, D, E (all five)

---

## FINDINGS

### LOW findings

**1-L1 — Retrospective process exception (Completeness)**
This review artefact was written after the story was implemented and PR #373 merged. The process exception is administrative — all 6 ACs are verified and the pre-accepted deviation W1 (two sequential atomic writes) was recorded in the DoR before coding started.
- **Recommended action:** No remediation required. Record as LOW administrative finding.

**1-L2 — W1 deviation footprint (Architecture compliance)**
The two-write behaviour for combined feature+story updates (W1, accepted in DoR) creates a brief window where feature-level fields are written before the story advance. In a multi-operator context this could produce a torn state. Currently low risk (single-operator, low-concurrency web UI).
- **Recommended action:** If multi-operator concurrency becomes a requirement, a follow-up story should introduce a combined atomic write. Accepted for now per DoR acknowledgement.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 5 | PASS |
| D — Completeness | 4 | PASS |
| E — Architecture compliance | 4 | PASS |

**Traceability (5):** Story slug `cdg.7`, PR #373 (commit `c611f21`), DoR artefact, test plan, and DoD all present and cross-linked. 37 assertions across T1–T14 in `check-cdg7-gate-advance.js`.

**Scope integrity (5):** AC4 (`gate-map.js` 7-key registry) and AC5 (`pipeline-state-writer.js` delegate to `advance()`) confirm all in-scope file changes. Excluded files (`cli-advance.js`, `cli-outer-loop.js`, schema files, artefact files) confirmed untouched per DoD scope compliance table.

**AC quality (5):** 6 ACs covering gate validation (AC1), gated write (AC2), missing-args exit code (AC3), registry completeness (AC4), writer delegation (AC5), mandate in copilot-instructions (AC6). All independently testable. 37/37 assertions pass.

**Completeness (4):** DoD complete including NFR status table (OWASP A03 path traversal, prototype pollution, no-credentials in output). Score 4 due to retrospective process exception (1-L1) and W1 deviation footprint (1-L2).

**Architecture compliance (4):** ADR-023 (validate-before-write order) and D37 (injectable adapter, default-throws) both satisfied. W1 two-write behaviour is a known accepted deviation from ideal atomicity. No ADR violated; deviation acknowledged before coding.

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH | 0 MEDIUM | 2 LOW (1-L1 — retrospective process exception; 1-L2 — W1 two-write atomicity accepted)

All 6 ACs verified by 37 automated assertions. PR #373 merged. Story at definition-of-done.
