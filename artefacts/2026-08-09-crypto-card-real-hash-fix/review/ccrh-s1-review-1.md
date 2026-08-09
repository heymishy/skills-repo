## Review: ccrh-s1 — Replace the landing page's fake illustrative hash with a real, live-computed one

**Story:** artefacts/2026-08-09-crypto-card-real-hash-fix/stories/ccrh-s1-real-instruction-hash.md
**Reviewer:** Claude (agent), operator-directed — content-correctness fix found via agentic-review trial
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage names the exact live symptom (fabricated `sha256:e3b0c4...` hash, independently confirmed to be the SHA-256 of an empty string via direct computation), the exact file/line (`landing.html:75`), and the exact real hash it should show instead (`334e1d2e...`, computed against the real `skills/review/SKILL.md`).

### Category B: Scope discipline

PASS. Out of scope explicitly excludes building a real trace-matching feature (a materially larger scope) and touching any other hero card. The fix is confined to one card's data source and copy.

### Category C: AC quality

PASS. 4 ACs, each Given/When/Then, each independently testable: AC1 covers the real-hash computation, AC2 covers dropping the unverifiable claim, AC3 is an explicit fail-open guard, AC4 is a regression guard for the existing landing-page suite.

### Category D: Completeness

PASS. NFRs stated, complexity rated 1, dependencies correctly noted as none.

### Category E: Architecture compliance

PASS. Correctly identifies that `skills/` (unlike `workspace/`) is deployed, so no build-time-injection workaround is needed — avoids over-engineering a fix that follows `lcdf-s1`'s pattern where a simpler one (live computation) is available and correct. The decision to drop the "✓ matches trace" claim rather than fabricate a second unverifiable claim is the right call, independently confirmed by grepping `workspace/traces/` for any real trace referencing this file (none found).

---

### Verdict

**PASS — 0 HIGH findings.** Well-scoped short-track fix with the root cause independently confirmed (SHA-256 of empty string, computed directly) and a fix design that correctly distinguishes this case from the superficially-similar `lcdf-s1` (build-time injection needed) by checking the actual deployment facts first. Cleared to proceed to `/test-plan`.
