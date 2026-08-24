## Test Plan: vcfrc-s1 — Check for an already-fresh same-session result before re-running the full suite

**Story reference:** `artefacts/2026-08-24-verify-completion-fresh-result-check/stories/vcfrc-s1-check-for-fresh-same-session-result-before-rerunning-suite.md`
**Test file:** `tests/check-vcfrc-s1-verify-completion-fresh-result-check.js`

Content-assertion pattern (same family as `check-s3fw-s1`, `check-vtc-s1`): read `skills/verify-completion/SKILL.md` and assert the new fresh-result check text is present with the required content, and that no existing Step 1 text was altered.

### Tests

**T1 — step1HasFreshResultCheck (AC1)**
Assert Step 1's text (before the test command block) contains an explicit instruction to check for an already-fresh same-session full-suite result before running the command.

**T2 — freshnessDefinitionPrecise (AC2)**
Assert the added text requires both "no code changes since" and "same full-suite command" (not a targeted subset) for a result to count as fresh.

**T3 — citesConcreteEvidence (AC3)**
Assert the added text references `vrne-s3`, `vrne-s4`, and `loop-design.md` (or its Section 8c) by name.

**T4 — existingStep1TextUnchanged (AC4, non-regression)**
Byte-for-byte presence check on the existing test-command block, the "Tests: [N]/[N] passing" report format, the "If failures exist" instruction, and the Route/handler E2E coverage check section — confirms nothing else in Step 1 was altered.

**T5 — skillContractsUntouchedOrConsistentlyGuarded**
If `.github/scripts/check-skill-contracts.js` gains a new required-string entry for this addition, assert the script still passes (`node .github/scripts/check-skill-contracts.js` exits 0). If no entry was added, assert the script still passes unchanged — either way, the governance script must not be broken by this change.
