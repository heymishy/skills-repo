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

---
**2026-08-07 | GAP | /verify-completion**
**Decision:** Acknowledge `tests/check-npwe-s1-skills-nav-wiring.js`'s `IT2.1` test as an expected, non-blocking failure on this branch — not a regression this story introduced.
**Alternatives considered:** Reverting the journey.js change to keep IT2.1 passing (not viable — journey.js is exactly the file this story's fix lives in); modifying IT2.1 itself as part of this story (rejected — out of scope, a separate concern belonging to `npwe-s1`'s own test).
**Rationale:** `IT2.1` asserts 7 "excluded" route files (including `journey.js`) remain byte-for-byte identical to `origin/master` forever, as a regression guard for `npwe-s1`'s own nav-wiring change. This premise is structurally unsustainable: `journey.js` is an actively-changing file — `das-s1` already had to modify it (merged), and this story legitimately modifies it again. The test will fail for ANY future story that touches `journey.js`, regardless of whether that story is correct. This is the second time this exact test has surfaced a false alarm this session (first as a stale-base artifact on `emss-s1`'s branch, now as an inherent design limitation on a branch with a genuine, intentional change) — confirmed via direct diff inspection that the flagged content is exactly this story's own documented fix, nothing else.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct code inspection, not assumed)
**Revisit trigger:** `npwe-s1`'s `IT2.1` test should be loosened in a future story — e.g. asserting only the specific nav-wiring-related lines/functions stay unchanged, not the entire file byte-for-byte — since the current form cannot coexist with legitimate future changes to any of its 7 "excluded" files. Worth scoping once agent-dispatch capacity is available again.
---
