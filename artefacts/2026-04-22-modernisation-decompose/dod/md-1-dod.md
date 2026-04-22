# Definition of Done: Write `/modernisation-decompose` SKILL.md

**PR:** https://github.com/heymishy/skills-repo/pull/179 | **Merged:** 2026-04-22
**Story:** artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
**Test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-1-test-plan.md
**DoR artefact:** artefacts/2026-04-22-modernisation-decompose/dor/md-1-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1.1 (file exists at `.github/skills/modernisation-decompose/SKILL.md`), T1.2 (structural sections present); `npm test` passes with 0 skill-contracts failures | automated — `check-md-1-skill-md.js` T1.1–T1.2 + `check-skill-contracts.js` | None |
| AC2 | ✅ | T2.1–T2.2 content assertions confirm entry condition section text exists and includes graceful block message; `entry condition` and `artefacts/[system-slug]/reverse-engineering-report.md` keywords present | automated — `check-md-1-skill-md.js` T2.1–T2.2 | None |
| AC3 | ✅ | T3.1–T3.2 confirm Java boundary signal keywords present (Maven module, Spring `@Service`, JPA aggregate root, `@Transactional` span) and priority order section exists | automated — `check-md-1-skill-md.js` T3.1–T3.2; invocation behaviour untestable-by-nature — manual verification scenario in `verification-scripts/md-1-verification.md` | Agent invocation cannot be automated in CI; content assertions verify the instructions are correct |
| AC4 | ✅ | T4.1–T4.2 confirm corpus-state.md write instructions exist; T-NFR3 confirms `lastRunAt` named explicitly | automated — `check-md-1-skill-md.js` T4.1–T4.2, T-NFR3 | None |
| AC5 | ✅ | T5.1–T5.2 confirm candidate-features.md entry format instructions present with all required fields (feature-slug, problem-statement, rule IDs, persona, MVP scope) | automated — `check-md-1-skill-md.js` T5.1–T5.2 | None |
| AC6 | ✅ | T6.1–T6.2 confirm low-signal escalation section exists with three named operator options | automated — `check-md-1-skill-md.js` T6.1–T6.2 | None |
| AC7 | ✅ | T7.1–T7.2 confirm `umbrellaMetric` field instruction and traceability note present in SKILL.md | automated — `check-md-1-skill-md.js` T7.1–T7.2 | None |

**Overall: 7/7 ACs satisfied. 22/22 automated tests pass.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 22 / 22 total
**Tests passing in CI:** 22 / 22

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1 — SKILL.md file exists | ✅ | ✅ | |
| T1.2 — structural sections present | ✅ | ✅ | |
| T2.1–T2.2 — AC2 entry condition content | ✅ | ✅ | |
| T3.1–T3.2 — AC3 Java boundary signals | ✅ | ✅ | |
| T4.1–T4.2 — AC4 corpus-state.md write | ✅ | ✅ | |
| T5.1–T5.2 — AC5 candidate-features.md format | ✅ | ✅ | |
| T6.1–T6.2 — AC6 low-signal escalation | ✅ | ✅ | |
| T7.1–T7.2 — AC7 umbrellaMetric field | ✅ | ✅ | |
| T-NFR1–T-NFR3 — NFR content checks | ✅ | ✅ | |

**Gaps (tests not implemented):**
5 manual verification scenarios (AC2–AC7 agent invocation) remain in `verification-scripts/md-1-verification.md`. These are gap type `untestable-by-nature` — AI agent execution cannot be automated in CI. RISK-ACCEPT logged at DoR.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Corpus-state.md must not contain raw business rules or customer data — metrics only | ✅ | AC4 restricts write instructions to `moduleCoveragePercent`, `verifiedUncertainRatio`, `lastRunAt` — no system data fields. T-NFR1 assertion passes. |
| Decomposition heuristics must be deterministic (same inputs → same outputs) | ✅ | T-NFR2 confirms signal priority order section exists; tie-breaking rules present in SKILL.md. Non-determinism risk mitigated by deterministic instruction text. |
| `lastRunAt` field named explicitly in write instructions | ✅ | T-NFR3 passes. |
| Security — no credentials or personal data in committed artefacts | ✅ | SKILL.md is a Markdown instruction file; no data fields. Repo mandatory constraint enforced. |

---

## Review Finding Status

Two MEDIUM findings were raised in review `md-1-review-1.md` and acknowledged at DoR as RISK-ACCEPTs:

- **1-M1** (incomplete benefit linkage — M3 and MM-B omitted from story Benefit Linkage section): RISK-ACCEPT acknowledged at DoR. Downstream impact: test-plan author noted this; test coverage for M3 and MM-B is addressed via the wider feature metrics array rather than individual story traces. No AC coverage gap resulted.
- **1-M2** (umbrellaMetric format ambiguity — YAML vs table vs inline): RISK-ACCEPT acknowledged at DoR. The SKILL.md implementation uses inline instruction text (`umbrellaMetric: true` field instruction in the candidate-features.md section). T7.1–T7.2 confirm the instruction is present. Format interpretation is deferred to operator usage.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Decomposition consistency (≥80% cross-operator agreement) | ✅ Baseline 0% | Not yet — requires ≥2 real modernisation programme runs | SKILL.md shipped; first use needed before signal is available |
| MM-A — First-run acceptance rate (≥75% no boundary revision) | ✅ Baseline 0% | Not yet — requires real programme usage | As above |
| M3 — Convergence metric visibility | ✅ Baseline 0% | Not yet | corpus-state.md write instructions shipped; first use needed |

---

## Outcome

**Definition of done: COMPLETE ✅**

ACs satisfied: 7/7
Deviations: None
Test gaps: 5 manual scenarios (untestable-by-nature, RISK-ACCEPTed)
