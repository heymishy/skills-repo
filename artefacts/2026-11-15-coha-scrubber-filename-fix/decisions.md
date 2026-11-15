# Decisions - sff-s1 (scrubber filename fix)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: 6 pre-existing failing test files acknowledged**
**Decision:** Before any code, a full `npm test` in the new worktree (853 files, 347 s) failed 6 files: `tests/check-coha-s7-error-issue-incident.js` (W3 and W5, Windows CRLF line endings; story cwt-s1 fixes it), `scripts/check-pipeline-state-integrity.js` (tfhc-s1 C3, accepted bug 1042), `tests/check-pcr-s1-test-runner.js` (machine-specific timing limit), `tests/check-p4-enf-second-line.js` (timing under load), `tests/check-p3.5-validate-trace.js` (PowerShell 5 parse error), `tests/check-rtvap-s1-archived-test-plan-coverage.js` (WSL bash missing). None touch `src/web-ui/modules/error-capture.js`.
**Rationale:** All are environmental or tracked elsewhere; `/verify-completion` compares against this list, and `tests/check-coha-s5-error-capture.js` must stay green.
**Made by:** Hamish King (chose "Acknowledge and proceed" in chat), recorded by Claude Sonnet 5.5, 2026-11-15.
---

## Architecture Decision Records