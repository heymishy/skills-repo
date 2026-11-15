# Decisions - pes-s1 (environment-specific error fingerprint)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: the same 6 pre-existing failing files as sff-s1 and cwt-s1**
**Decision:** A full `npm test` in the new worktree (853 files, 333 s) failed exactly the six files already acknowledged by the operator for sff-s1: coha-s7 incident check (Windows CRLF; fixed by PR 1098, not yet merged), tfhc-s1 integrity, pcr-s1 timing, p4-enf-second-line timing, p3.5 PowerShell, rtvap-s1 WSL. None touch `src/web-ui/modules/error-capture.js` or `tests/check-coha-s5-error-capture.js`. Proceeding under the same acknowledgement; `/verify-completion` compares against this list.
**Made by:** recorded by Claude Sonnet 5.5, 2026-11-15; operator acknowledgement of the identical set given in chat for sff-s1.
---

## Architecture Decision Records