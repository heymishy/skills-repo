# Decisions - cwt-s1 (coha-s7 test CRLF fix)

---
**2026-11-15 | RISK-ACCEPT | branch-setup baseline: the same 6 pre-existing failing files as sff-s1**
**Decision:** A full `npm test` in the new worktree (853 files, 331 s) failed exactly the six files acknowledged by the operator for sff-s1 earlier today (coha-s7 incident check, tfhc-s1 integrity, pcr-s1 timing, p4-enf-second-line timing, p3.5 PowerShell, rtvap-s1 WSL). One of them, `tests/check-coha-s7-error-issue-incident.js`, is this story's own target (W3 and W5 fail because this CRLF checkout reads the workflow with Windows line endings), so it is expected to turn green; the other five are unrelated. Proceeding under the same acknowledgement; `/verify-completion` compares against this list.
**Made by:** recorded by Claude Sonnet 5.5, 2026-11-15; the operator's acknowledgement of the identical set was given in chat for sff-s1 (operator may object).
---

## Architecture Decision Records