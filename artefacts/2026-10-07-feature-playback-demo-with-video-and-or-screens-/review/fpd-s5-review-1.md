# Review Report: Close the real-capture loop — fix the two gaps blocking any real feature from using the viewer, and prove it end to end

**Story:** fpd-s5
**Run:** 1
**Date:** 2026-10-18
**Reviewer:** Claude Sonnet 5.5

---

## FINDINGS

**1-M1 (MEDIUM, Category C — AC quality):** AC1 names an internal function and its internal return shape directly — "When `parseDodAcCoverage` parses that file, Then it returns the same `{acId, description, satisfied, evidence}` shape" — describing implementation rather than observable behaviour. Should describe the user-observable outcome instead (the AC section rendering real evidence for a story using the other table shape), consistent with how AC4 is written.

**1-L1 (LOW, Category E — Architecture compliance):** The story's own Architecture Constraints section doesn't cite `sdsb-s1` by name, even though AC3 modifies the exact file (`staging-deploy.yml`) and exact mechanism (`paths-ignore`) that story introduced — the established prior-art convention this story extends should be named directly, not left implicit.

**1-L2 (LOW, Category A — Traceability):** `benefit-metric.md`'s own coverage matrix (lines 63-64) lists `fpd-s3`/`fpd-s4` as M1/M2's contributing stories but not yet `fpd-s5` — matrix not yet updated for the new story.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — one LOW (coverage matrix not yet updated) |
| Scope integrity | 5 | PASS — no issues found; story's own out-of-scope section correctly excludes real video capture, other features' DoD content, and the earlier hand-authored demo |
| AC quality | 4 | PASS — one MEDIUM (AC1 describes implementation, not observable behaviour); all other ACs are Given/When/Then, observable, independently testable, no "should" language |
| Completeness | 5 | PASS — all required fields populated, named persona reused consistently from the already-accepted `fpd-s4` precedent |

### Category E: Architecture compliance

- Architecture Constraints field populated ✓
- Story's implementation path doesn't violate a named approved pattern ✓ (AC1 reuses `parseDodAcCoverage`'s existing call sites — ADR-026; no new traversal introduced)
- No listed anti-pattern used ✓
- Active ADRs referenced or respected ✓ — no Active ADR governs `staging-deploy.yml`'s own trigger logic specifically (checked `.github/architecture-guardrails.md`; ADR-006/008/009 govern a different concern — audit-gate evaluation/write-back separation, not deploy triggers); the directly relevant prior art is `sdsb-s1` itself, a story convention not a numbered ADR — see 1-L1
- Story NFRs align with mandatory constraints ✓ — no new NFR category introduced

**Verdict:** PASS — all criteria scored 3 or above.

---

## Completion output

**Review PASSED ✅ — Run 1**

0 HIGH; 2 MEDIUM/LOW-adjacent findings (1 MEDIUM, 2 LOW) — all three are trivial wording/citation fixes, applied directly to the story before proceeding (not deferred to `/decisions`, since they require no judgment call).

Ready to run `/test-plan` for "Close the real-capture loop".
