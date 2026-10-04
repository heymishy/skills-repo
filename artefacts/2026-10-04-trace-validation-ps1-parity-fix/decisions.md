# Decision Log: trace-validation-ps1-parity-fix

**Feature:** Trace validation PS1 parity fix
**Last updated:** 2026-10-04

---

## Short-track DoR exemptions: H7 and H-GOV (2026-10-04)

**Context:** This feature follows `CLAUDE.md`'s documented short-track path (`/test-plan → /definition-of-ready → coding agent`), which explicitly skips `/discovery` and `/review`. `/definition-of-ready`'s own literal entry condition and H7/H-GOV hard blocks assume a review report and a discovery artefact exist, which short-track stories by design do not have — the same gap previously found and documented on `pcr-s1` (`artefacts/2026-07-11-pipeline-conflict-reduction/dor/pcr-s1-dor.md`).
**Decision:** Treat H7 (no review report exists) and H-GOV (no discovery artefact exists) as satisfied-via-short-track-exemption rather than hard-blocking, consistent with `pcr-s1`'s own established precedent — proceed via the operator's direct in-session instruction to run this as a short-track fix.
**Rationale:** `CLAUDE.md` is the authoritative, repo-level definition of the short-track path and explicitly names it as valid for "bugs, small fixes, bounded refactors" — this story (a scoped regex-logic fix to one function) fits that description exactly. Blocking on artefacts the chosen track deliberately skips would make short-track unusable in practice.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), per the operator's explicit instruction to fix this now as a quick short-track story, 2026-10-04.
