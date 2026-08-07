# Decision Log: artefact-not-found-vs-fetch-failed

**Feature:** Distinguish "artefact doesn't exist yet" from "fetch actually failed" in das-s1's git-fallback
**Story reference:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/stories/anvf-s1-distinguish-not-found-from-fetch-failed.md
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | Process gap acknowledged (e.g. short-track skipping discovery/review) |

---

## Log entries

---
**2026-08-07 | GAP (H-GOV) | short-track**
**Decision:** This story proceeds via the short-track path, skipping discovery/benefit-metric/definition — no `## Approved By` discovery section exists for H-GOV to check.
**Alternatives considered:** Full outer loop for a one-catch-block fix.
**Rationale:** Bounded, well-understood, single-file bug fix found via live testing immediately after `das-s1` merged — same class of fix as `cdpl-s1` and the earlier `tpac-s1`/`npwe-s1` precedent this session.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None.
---

---
**2026-08-07 | GAP (dispatch) | implementation approach**
**Decision:** This story is implemented directly by the orchestrating agent in the main session rather than dispatched to a separate coding subagent.
**Alternatives considered:** Dispatching a standard inner-loop coding subagent, as done for every other story this session.
**Rationale:** The account's agent-dispatch session limit was hit mid-session (both `das-s2` and `cdpl-s1`'s coding subagents failed with "session limit · resets 3:50pm"), and this fix is small and well-understood enough (a single catch-block change reusing already-exported error classes) to implement directly without needing a fresh subagent session. The full inner-loop discipline (TDD, verify-completion, branch-complete via draft PR) is still followed — only the "who does the typing" changed, not the process.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via explicit choice when offered the alternative of queuing this for later)
**Revisit trigger:** None — this is a one-off adaptation to the session-limit constraint, not a new standing practice.
---
