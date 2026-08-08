## Review: mar-s1 — Remove check-md-3-adr.js's nested full-suite npm test recursion

**Story:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/stories/mar-s1-remove-nested-npm-test-recursion.md
**Reviewer:** Claude (agent), operator-directed
**Date:** 2026-08-08

---

### Category A: Traceability

PASS. Benefit linkage traces the exact mechanism (`execSync('npm test', ...)` at `check-md-3-adr.js` line 117), cites this repo's own prior documentation (`check-tst-s1-baseline-triage.js` lines 127–132) describing it as a permanent, un-fixable baseline entry, and independently confirms via direct testing that the env-inheritance guard mechanism itself is sound — correctly distinguishing "the guard usually works" from "the design is still fragile and redundant regardless."

### Category B: Scope discipline

PASS. Out of scope explicitly excludes fixing the separately-starved file (`check-p3.5-validate-trace.js`) and any other undiscovered instances of the same pattern, both with clear reasoning (don't assume a fix based on a plausible side effect; don't scope-creep into an unconfirmed, unaudited area).

### Category C: AC quality

PASS. 4 ACs: AC1 covers standalone correctness (T1–T3 unaffected), AC2 covers in-suite bounded runtime, AC3 explicitly closes the historical "permanent baseline" documentation debt this fix creates, AC4 is a clean full-suite regression guard. AC3 is a notable strength — it's easy to fix code but leave stale documentation claiming the bug still exists; this AC prevents that.

### Category D: Completeness

PASS. NFRs correctly frame this as a reliability/performance fix with no security/accessibility surface. Complexity rated 1, correctly — deleting a self-contained, already-understood block.

### Category E: Architecture compliance

PASS. No shared surface module touched. This is a single test file's internal design; no guardrail implicated.

---

### Verdict

**PASS — 0 HIGH findings.** Cleared to proceed to `/test-plan`.
