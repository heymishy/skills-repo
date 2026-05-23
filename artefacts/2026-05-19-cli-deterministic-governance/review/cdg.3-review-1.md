# Review Report: cdg.3 — `skills advance` CLI command

**Story slug:** cdg.3
**Review run:** 1
**Review date:** 2026-05-24
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Feature:** 2026-05-19-cli-deterministic-governance
**Categories run:** A, B, C, D, E (all five)

---

## FINDINGS

### MEDIUM findings

**1-M1 — No NFR section (Completeness)**
The story does not include an NFR section. The template requires either populated NFRs or an explicit "None — confirmed" declaration. As a thin CLI wrapper with no user-facing UI, no network calls, and no latency SLA, the correct field value is "None — confirmed", but the field is absent entirely.
- **Line reference:** Story ends at "## Scope Stability — Stability: Stable." — no NFR section follows.
- **Recommended action:** Add `## Non-Functional Requirements` with "None — confirmed — cdg.3 is a CLI utility. No latency SLA, no uptime requirement, no user-facing UI. Security: no external input; all arguments from operator-controlled CI context." Operator has applied this fix inline before write (see Scope Stability section).

### LOW findings

**1-L1 — AC3 exit code unspecified (AC quality)**
AC3 states "the command exits with a non-zero code" without naming which exit code. AC2 and AC4 both correctly specify "exit code 8". AC3 validates the enum rejection path — this is served by the `pipeline-state-writer.js` enum validation, which already returns a typed error object. The AC is testable as-written (non-zero is verifiable) but is weaker than the other ACs in naming precision. Consistent with the typed-exit-code value proposition of this feature, a specific code would be more precise.
- **Line reference:** AC3: "the command exits with a non-zero code, stderr names the invalid value..."
- **Recommended action:** Clarify which exit code enum rejection produces (likely exit 1 from writer validation, not exit 8). Low severity — non-zero is sufficient for test purposes.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 4 | PASS |
| D — Completeness | 3 | PASS |
| E — Architecture compliance | 5 | PASS |

**Traceability (5):** Epic, discovery, and benefit-metric references all present. "So that..." links to M4 by name. Benefit linkage section contains a specific mechanism sentence ("pipeline-state-writer.js validates enum fields before writing and writes atomically via rename"). M4 exists in benefit-metric.md. No broken references.

**Scope integrity (5):** `skills advance` is explicitly in-scope for Phase 2 in the discovery MVP. Story out-of-scope section names 4 excluded behaviours (validate-before-advance, trace, web UI route, dry-run). No discovery out-of-scope items are implemented.

**AC quality (4):** 8 ACs, all in Given/When/Then format. All describe observable behaviour (exit codes, stderr content, file state, stdout confirmation). Edge cases have dedicated ACs. Minor: AC3 uses "non-zero" rather than a specific exit code (finding 1-L1).

**Completeness (3):** User story uses As/Want/So format with named persona ("platform maintainer") ✓. Benefit linkage populated ✓. Out of scope populated ✓. Complexity rated ✓. Scope stability declared ✓. NFR section missing (finding 1-M1 — MEDIUM). Score of 3 is borderline pass; field is addressable without story rework.

**Architecture compliance (5):** ADR-H7.1 (module import, not subprocess) explicitly referenced ✓. ADR-001 CommonJS require explicitly stated ✓. ADR-003 schema-sync rule stated in Architecture Constraints ✓. D37 injectable adapter rule referenced ✓. No anti-patterns used. No guardrail violations.

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH | 1 MEDIUM (1-M1 — missing NFR section — acknowledge in /decisions before proceeding to /test-plan) | 1 LOW (1-L1 — AC3 exit code unspecified)

Ready to run /test-plan for cdg.3.
