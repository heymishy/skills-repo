# Review: wfp.9 — Author and maintain workforce-to-initiative allocation assignments

**Run:** 1
**Date:** 2026-05-26
**Reviewer:** Copilot /review skill
**Story artefact:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.9.md

---

## FINDINGS

**1-M1 — MEDIUM — Architecture Constraints missing implementation module path**

The Architecture Constraints section establishes coding conventions (CommonJS, no new deps, fixed paths, atomic write) but does not declare the implementation module path. The established pattern in this feature set is `src/workforce/[capability].js` (e.g., `src/workforce/intake.js` in wfp.1). Without this declaration, the coding agent has no authoritative source for the module name and may choose an inconsistent path.

Recommended action: Add "The workforce-assign implementation lives in `src/workforce/assign.js`. The SKILL.md entry point lives under `.github/skills/workforce-assign/SKILL.md`." to the Architecture Constraints section.

**1-L1 — LOW — AC9 mixes observable behaviour with implementation mechanism**

AC9 states the file is replaced "atomically (write to temp, rename)" — this names the implementation mechanism. The observable behaviour ("the old file is not modified until the new content is ready") is stated immediately after, but the parenthetical prescribes the how rather than the what. Per AC quality standards, ACs should describe observable behaviour only; implementation method belongs in Architecture Constraints or NFRs (which already cover this in the Integrity NFR).

Recommended action: Remove "(write to temp, rename)" from AC9. The Integrity NFR already governs the implementation approach.

---

## SCORES

| Category | Score | Notes |
|----------|-------|-------|
| A — Traceability | 5 | All three artefact references present. Benefit Linkage names M1 and M2 with a specific causal mechanism sentence: "without it, wfp.3 and wfp.4 cannot run and M1/M2 cannot be measured." M1 and M2 confirmed in benefit-metric.md. |
| B — Scope integrity | 5 | Out-of-scope section covers five explicit Phase 1 boundaries: incremental merge, browser UI, skills validation in guided/file modes, external system reads, and parentSlug in auto-derive. No overreach against the epic or discovery out-of-scope list. |
| C — AC quality | 4 | Nine ACs, all in GWT format with specific exit codes and quoted error messages. One LOW finding (1-L1): AC9 includes the implementation mechanism in parentheses alongside the observable behaviour. All ACs are independently testable; the interactive guided-mode ACs (AC1, AC2) will require stdin mocking — this is noted but is a test-plan concern, not a story defect. |
| D — Completeness | 5 | All template fields populated. Named persona (Head of Engineering). Benefit linkage is causal (not a technical dependency description). Four NFRs with quantified targets. Complexity rated 3 with rationale. Scope stability declared Stable. |
| E — Architecture compliance | 4 | CommonJS, no new external deps, fixed paths, atomic write — all consistent with architecture-guardrails.md. One MEDIUM finding (1-M1): implementation module path not declared in Architecture Constraints. No guardrail violations. |

**Overall score: 4.6**

---

## VERDICT: PASS

1 MEDIUM finding (1-M1 — implementation module path not declared in Architecture Constraints), 1 LOW finding (1-L1 — implementation mechanism in AC9). Neither requires story rework; both are addressable in the DoR artefact's Coding Agent Instructions block without editing the story.

**Notes for /test-plan:**
- AC1 and AC2 (guided mode) require an injectable `promptFn` adapter following the D37 pattern. The implementation must expose `setPromptFn(fn)` so unit tests can inject a mock without spawning a child process. The stub default must throw per D37 rule.
- AC3 and AC9 share the "write to temp, rename" atomicity guarantee — both should be exercised with an explicit fixture verifying the output file is valid JSON regardless of any simulated write interruption.
- AC7 (no portfolio files) should test both: (a) `portfolio/` directory absent, and (b) `portfolio/` directory present but empty.
- Overwrite protection (AC8) should be tested against all three modes to confirm the guard is mode-independent.
