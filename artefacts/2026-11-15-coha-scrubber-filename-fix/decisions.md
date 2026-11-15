# Decisions - sff-s1 (scrubber filename fix)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: 6 pre-existing failing test files acknowledged**
**Decision:** Before any code, a full `npm test` in the new worktree (853 files, 347 s) failed 6 files: `tests/check-coha-s7-error-issue-incident.js` (W3 and W5, Windows CRLF line endings; story cwt-s1 fixes it), `scripts/check-pipeline-state-integrity.js` (tfhc-s1 C3, accepted bug 1042), `tests/check-pcr-s1-test-runner.js` (machine-specific timing limit), `tests/check-p4-enf-second-line.js` (timing under load), `tests/check-p3.5-validate-trace.js` (PowerShell 5 parse error), `tests/check-rtvap-s1-archived-test-plan-coverage.js` (WSL bash missing). None touch `src/web-ui/modules/error-capture.js`.
**Rationale:** All are environmental or tracked elsewhere; `/verify-completion` compares against this list, and `tests/check-coha-s5-error-capture.js` must stay green.
**Made by:** Hamish King (chose "Acknowledge and proceed" in chat), recorded by Claude Sonnet 5.5, 2026-11-15.
---

---
**2026-11-15 | DESIGN | subagent-execution: one implementer for all three tasks; reviews on the whole diff**
**Decision:** The three plan tasks (red, red, green, a 4-line production change) were given to one implementer subagent with per-task commits (16d7efd82, 0fa81c96c, e92dd0c21), instead of one dispatch per task. The spec-compliance and code-quality reviewers each reviewed the whole diff once, concurrently. The orchestrator re-ran the tests, the diff and the non-ASCII counts itself.
**Evidence:** both red commits left `src/` unchanged and failed as the plan expected (77 passed, 5 failed; then 77 passed, 6 failed); the green commit gives 83 passed, 0 failed; coha-s6 unchanged at 83 passed, 7 skipped. Spec review: SPEC COMPLIANT. Quality and privacy review: APPROVED (probes with getters, toString objects, arrays, frozen frames and a polluted Object.prototype all produced either a validated repository path or exactly `[redacted]`).
**Plan correction:** the plan said 84 passing tests; the right figure is 83 (77 existing plus 6 new: UT1, UT2, UT3, UT4, UT6, IT1; UT5 is "the whole existing file" and adds no test).
**Observations (not fixed here):** (1) test names skip UT5, cosmetic; (2) `RE_REPO_PATH` accepts `..` segments (existing behaviour, not tenant data): candidate for a later hardening story; (3) the story text says "three real shapes" but the fixture holds the four frames actually seen.
**Made by:** Claude Sonnet 5.5, 2026-11-15.
---
## Architecture Decision Records