# Decision Log: revise-earlier-stage

**Feature:** Revise an Earlier Stage Mid-Journey
**Discovery reference:** artefacts/2026-08-27-revise-earlier-stage/discovery.md
**Last updated:** 2026-08-28

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-28 | RISK-ACCEPT | review**
**Decision:** Accept res-s4 review finding 1-M1 (Architecture Constraints doesn't reference `architecture-guardrails.md`'s documented "stage-sequence duplication" anti-pattern, and flag-state persistence is undefined) without amending the story now — proceed to `/test-plan` with the finding still open, to be resolved at DoR/implementation time instead of by another story-text revision pass.
**Alternatives considered:** (1) Amend res-s4 immediately, the same way 1-H1 was just fixed on res-s2/res-s3 — add an explicit Architecture Constraint naming `journey-store.js`'s `STAGE_SEQUENCE` as the only valid ordering source, and specify whether flag state persists via the same `_diskAdapter`/`_pgWrite` path as `completedStages`. (2) Descope the "downstream flag" concept from res-s4's AC1 entirely and defer it to a follow-up story.
**Rationale:** Unlike 1-H1, this finding doesn't block implementability — res-s4's existing ACs (AC1-AC4) remain valid and independently testable regardless of which stage-ordering source or persistence mechanism is eventually chosen. It's an implementation-detail gap, not a sequencing contradiction: the coding agent can resolve it correctly by reading the cited anti-pattern precedent directly (it's already documented, with two prior recurrences named — `dtra-s1`, `dspw-s1`) at DoR's H9 architecture-constraints check, rather than requiring the story text to be pre-amended. Further pre-implementation story-text iteration has diminishing returns once the underlying reference material already exists and is citable.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If the coding agent's implementation for res-s4 introduces a second hardcoded stage-order array duplicating `journey-store.js`'s `STAGE_SEQUENCE` (repeating the exact drift pattern already caught twice), or if flagged-stage state is found not to survive a server restart in a way that surprises real usage — treat as a real defect at that point, not just a documentation gap.
---

---
**2026-08-28 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept DoR Warning W4 (verification script reviewed by a domain expert) as unresolved pre-code for all 4 stories (res-s1, res-s2, res-s3, res-s4) — proceed to the coding agent without a pre-code human walkthrough of the 4 verification scripts.
**Alternatives considered:** (1) Pause DoR and walk through all 4 scripts before signing off any story.
**Rationale:** The verification scripts (`templates/ac-verification-script.md`) are explicitly designed to serve three moments without modification — pre-code sign-off, post-merge smoke test, and delivery review. Given solo-operator context and no separate domain expert available, the operator will use the scripts as the post-merge smoke test instead of a pre-code gate — this is one of the script's designed uses, not a workaround.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a post-merge smoke test run against any of the 4 scripts finds a scenario that reveals the AC itself was wrong (not just the implementation), treat that as evidence the pre-code walkthrough would have caught it — reconsider skipping W4 for future stories on this feature.
---

---
**2026-08-28 | RISK-ACCEPT | branch-setup**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js` as a pre-existing failure in the res-s1 worktree's baseline (561 files run, 1 failed) and proceed with implementation rather than blocking on it.
**Alternatives considered:** (1) Investigate and fix this failure before proceeding with res-s1.
**Rationale:** This exact file has already been independently documented as a known pre-existing flaky failure in this session's `cams-s1` and `adsr-s1` DoD artefacts ("1 known pre-existing flaky file, `check-p3.5-validate-trace.js`") — unrelated to this feature's own worktree or changes, and observed on a clean checkout before any res-s1 code was written.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If this file starts failing in a way that correlates with this feature's own changes (not just a standalone flake), or if it blocks CI on the eventual PR.
---

---
**2026-08-28 | RISK-ACCEPT | branch-setup**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js` as a pre-existing failure in the res-s3 worktree's baseline (563 files run, 1 failed) and proceed with implementation rather than blocking on it — third recurrence of the same file in this feature.
**Alternatives considered:** (1) Investigate and fix this failure before proceeding with res-s3.
**Rationale:** Same file as the res-s1 branch-setup RISK-ACCEPT above; re-run standalone (`node tests/check-p3.5-validate-trace.js`) and passed cleanly (5/5), confirming a flake rather than a res-s3-worktree-specific regression, consistent with the prior two occurrences. Recorded separately rather than assumed-covered by the res-s1 entry so `/trace` sees an accurate per-story acknowledgement.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** Same as the res-s1 entry — if this file starts failing in a way that correlates with this feature's own changes, or blocks CI on res-s3's eventual PR. Given three occurrences across three different worktrees now, worth a genuine root-cause fix outside this feature rather than continuing to RISK-ACCEPT indefinitely.
---

---
**2026-08-28 | ARCH | implementation-plan (res-s2)**
**Decision:** Correct res-s2's signed-off DoR contract (`dor/res-s2-dor-contract.md`) before writing its implementation plan — the "Estimated touch points" section named `src/web-ui/routes/journey.js` as the chat-turn handler file; direct code investigation found the real artefact-completion/disk-write/`completeStage()` logic lives in `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml`. Two previously-unidentified mechanisms were also discovered and added to the contract: (1) a duplicate-`completedStages`-entry risk — the existing code unconditionally calls `completeStage()` on a session's first artefact completion, which a reopened session (res-s1) would trigger again on a revision turn, violating AC1/AC3's "no entry added" requirement; (2) the existing disk-write-failure handling only logs to console, never surfacing to the operator, contradicting AC4 as literally written.
**Alternatives considered:** (1) Write the implementation plan against the original (incorrect) contract and let a subagent discover the mismatch mid-task, the way res-s1's Task 3 plan/test inconsistency was discovered. (2) Silently fix the code without updating the contract.
**Rationale:** ADR-008 states the contract is binding at pre-merge and, when contract and reality conflict, the contract is the authoring defect to be corrected — not silently bypassed or left stale. Correcting the contract before planning (rather than during implementation) means the coding agent's task descriptions are accurate from the start, avoiding a repeat of the res-s1 Task 3 pattern where an inaccurate plan was only caught by a subagent hitting a real test failure.
**Made by:** Claude (agent), reviewed inline with the operator's "yes please continue" instruction
**Revisit trigger:** If a future story's own contract review surfaces the same "wrong file named in Estimated touch points" pattern a third time, treat it as a signal that `/definition-of-ready`'s Contract Proposal step should include a stronger verification step (e.g. requiring the file path to be grep-confirmed to exist and contain the referenced function) before sign-off, not just after implementation begins.
---

---
**2026-08-28 | ARCH | implementation-plan (res-s3)**
**Decision:** Correct res-s3's signed-off DoR contract (`dor/res-s3-dor-contract.md`) before writing its implementation plan — the "Estimated touch points" section named `src/web-ui/routes/journey.js` as the chat-turn handler file, the same authoring defect already found and fixed on res-s2's contract. Direct code investigation found the real integration point is `src/web-ui/routes/skills.js`'s `_materialityCheckHook`/`setMaterialityCheckHook` D37 adapter (introduced by res-s2 specifically for this story). A second, more significant defect was also found: the hook's existing call site (`skills.js` ~line 5089-5102) is fire-and-forget — `try { _materialityCheckHook({...}); } catch (_) {...}`, never awaited, its return value discarded — so even a correct materiality-check implementation could not actually reach the operator's chat response as AC1 requires ("presented ... in the same chat turn's response"). This story must also change the call site to await the hook and forward its result as an additional SSE event before the final `done` write. A third gap: the story had no AC covering the mandatory D37 wiring of `setMaterialityCheckHook` in `server.js`, and the DoR's H-ADAPTER check incorrectly read "No new adapter introduced" — added as AC5 to the story artefact (see story's own 2026-08-28 note).
**Alternatives considered:** (1) Write the implementation plan against the original (incorrect) contract, as before. (2) Silently fix the hook call site and adapter wiring without adding an explicit AC or logging the H-ADAPTER discrepancy.
**Rationale:** Same ADR-008 rationale as the res-s2 correction — the contract is the authoring defect to be corrected before planning, not bypassed. This is now the third occurrence of the "wrong file named in Estimated touch points" pattern across this feature's stories (res-s1's implementation plan required no contract correction; res-s2 and now res-s3 both did) — per the res-s2 entry's own revisit trigger, this confirms `/definition-of-ready`'s Contract Proposal step needs a stronger verification step (e.g. grep-confirm the named file actually contains the referenced function before sign-off) rather than accepting the proposal's stated touch points on faith. Flagging as a genuine `/improve` candidate now that the pattern has recurred a third time, not just a second.
**Made by:** Claude (agent), continuing the operator's "yes please" instruction to proceed with /implementation-plan
**Revisit trigger:** Raise this at the next `/improve` run regardless of whether it recurs a fourth time — three occurrences across three consecutive stories in one feature is sufficient signal on its own.
---

---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
