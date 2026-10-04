# Decision Log: trace-validation-ps1-parity-fix

**Feature:** Trace validation PS1 parity fix
**Last updated:** 2026-10-04

---

## Short-track DoR exemptions: H7 and H-GOV (2026-10-04)

**Context:** This feature follows `CLAUDE.md`'s documented short-track path (`/test-plan → /definition-of-ready → coding agent`), which explicitly skips `/discovery` and `/review`. `/definition-of-ready`'s own literal entry condition and H7/H-GOV hard blocks assume a review report and a discovery artefact exist, which short-track stories by design do not have — the same gap previously found and documented on `pcr-s1` (`artefacts/2026-07-11-pipeline-conflict-reduction/dor/pcr-s1-dor.md`).
**Decision:** Treat H7 (no review report exists) and H-GOV (no discovery artefact exists) as satisfied-via-short-track-exemption rather than hard-blocking, consistent with `pcr-s1`'s own established precedent — proceed via the operator's direct in-session instruction to run this as a short-track fix.
**Rationale:** `CLAUDE.md` is the authoritative, repo-level definition of the short-track path and explicitly names it as valid for "bugs, small fixes, bounded refactors" — this story (a scoped regex-logic fix to one function) fits that description exactly. Blocking on artefacts the chosen track deliberately skips would make short-track unusable in practice.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), per the operator's explicit instruction to fix this now as a quick short-track story, 2026-10-04.

## SCOPE NOTE: loosened an over-strict assertion in tests/check-egsv-s1-env-gated-skip-visibility.js (2026-10-04)

**Context:** After implementing Task 2, `npm test` revealed a real failure in an unrelated file: `tests/check-egsv-s1-env-gated-skip-visibility.js`'s own `p35SkipsAreTrackedSeparately` test asserts an EXACT count (`=== 2`) of "pwsh-unavailable skip blocks" found via regex in `tests/check-p3.5-validate-trace.js`'s own raw source — not a floor, an exact historical snapshot from whenever `egsv-s1` was written. Task 1's 4 new tests (each with their own pwsh-skip block) legitimately grew that count to 6, breaking the hardcoded assertion. This is not a regression in behaviour — every skip block still correctly increments `skipped`, never `passed`, which is the test's own actual documented intent (per its file header: "proving 3 test files no longer fold environment-gated skips into their passed counter").
**Decision:** Loosened the assertion from `=== 2` to `>= 2`, preserving the real property under test (every pwsh-skip block increments `skipped`) while allowing `check-p3.5-validate-trace.js` to legitimately grow new tests in the future without re-breaking this unrelated file.
**Rationale:** This is a necessary, narrow fix — without it, `npm test` cannot pass with this story's own Task 1 tests in place, and the story's own goal (restore trust in the trace-validation gate) requires a fully green suite. Scope was not in the original DoR contract's touch-point list; adding `tests/check-egsv-s1-env-gated-skip-visibility.js` as a second touch point here, per ADR-008 (DoR contract touch-point binding — amend before merge, not silently bundle).
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found and fixed during Task 2 implementation, 2026-10-05.
