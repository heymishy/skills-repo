# Decisions - tabf-s1 (tenant-admin bootstrap statement)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: the same acknowledged pre-existing failing files**
**Decision:** A full `npm test` in the new worktree (853 files, 324 s) failed five files, all already acknowledged by the operator earlier today: `scripts/check-pipeline-state-integrity.js` (tfhc-s1), `tests/check-cat-s1-core-trace-builder.js` (50 ms timing assertion; passes alone), `tests/check-pcr-s1-test-runner.js` (machine-specific timing), `tests/check-p3.5-validate-trace.js` (PowerShell 5), `tests/check-rtvap-s1-archived-test-plan-coverage.js` (no WSL bash). None touch `tenant-admin-bootstrap.js`. Proceeding under the same acknowledgement; `/verify-completion` compares against this list.
**Made by:** recorded by Claude Sonnet 5.5, 2026-11-15; operator acknowledgement of the same set given in chat for sff-s1.
---

## Architecture Decision Records