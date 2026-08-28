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
**2026-08-28 | RISK-ACCEPT | branch-setup**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js` as a pre-existing failure in the res-s4 worktree's baseline (564 files run, 1 failed) and proceed with implementation rather than blocking on it — fourth recurrence of the same file in this feature, across all four of its stories.
**Alternatives considered:** (1) Investigate and fix this failure before proceeding with res-s4 — the last story in this feature, so the final opportunity to close this out within the feature's own scope.
**Rationale:** Same file as the three prior branch-setup RISK-ACCEPTs above; re-run standalone (`node tests/check-p3.5-validate-trace.js`) and passed cleanly (5/5), confirming a flake rather than a res-s4-worktree-specific regression, consistent with all prior occurrences. Recorded separately so `/trace` sees an accurate per-story acknowledgement. Given this is now four-for-four across every worktree created in this feature, this is no longer a marginal judgment call — it is a genuine, reproducible flake in the shared test infrastructure, independent of any of this feature's own code. Not fixed here because root-causing a shared, cross-feature test infrastructure flake is out of scope for a single feature's branch-setup step, and would itself need its own DoR-signed-off story per the artefact-first rule (it would touch `tests/` and possibly `scripts/`).
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** This is the last story in this feature — no further branch-setup RISK-ACCEPT opportunities remain within `2026-08-27-revise-earlier-stage`. Recommend opening a dedicated short-track story (test-plan → DoR → coding agent) to root-cause and fix `tests/check-p3.5-validate-trace.js` outside this feature, given the 4/4 recurrence rate documented across `res-s1`, `res-s2` (implicitly, via the res-s1 entry's coverage), `res-s3`, and now `res-s4`.
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
**2026-08-28 | RISK-ACCEPT | subagent-execution (res-s3, final cross-task review)**
**Decision:** Accept that `checkMateriality`'s deterministic section-diff classifies a pure wording/typo fix made WITHIN a target section (Problem Statement, MVP Scope, or Constraints) as "material" — even though AC3 as literally written says a wording-only change with "no scope or constraint impact" should be "minor." Proceed without changing the classifier.
**Alternatives considered:** (1) Add sub-section-level semantic diffing (e.g. word-level diff plus a heuristic for "meaning-preserving" edits) to distinguish a genuine scope change from a same-section wording tweak. (2) Route only in-target-section changes through a model call to judge materiality, while keeping cross-section changes deterministic.
**Rationale:** This is not a newly-discovered defect — it is the direct, foreseeable consequence of the DoR contract's own approved trade-off (deterministic section-diff instead of LLM judgment, chosen specifically to resolve the test-plan's flagged test-design risk about non-deterministic classification). Any change to text WITHIN a target section, however small, cannot be distinguished from a genuine scope change without either NLP-level semantic diffing (expensive, unreliable, exactly the flakiness the deterministic approach was chosen to avoid) or a model call (reintroducing the non-determinism the contract explicitly rejected). Both Task 1's test cases for AC3 correctly exercise wording-only changes only in a NON-target section ("Who It Affects") — this was not an oversight, it is the honest boundary of what a section-level deterministic diff can promise. The DoR contract's own Assumption #1 states the diff "checks section-level text... to avoid false 'material' positives on pure formatting changes within a section" — this wording overstates what was actually delivered (it does NOT avoid false positives on wording changes within a section, only in a section that already differs some other way) and should be read as describing intent, not a verified guarantee; this decision entry is the correction.
**Made by:** Claude (agent), acting on a final cross-task reviewer's finding (Observation O1)
**Revisit trigger:** If real usage shows operators are frequently surprised by "material" flags on what they consider trivial in-section wording edits (tracked via M2, the materiality-suggestion acceptance rate metric — a low acceptance rate specifically correlated with in-section wording-only revisions would be the signal), revisit with either of the two alternatives above as a follow-up story.
---

---
**2026-08-28 | ARCH | implementation-plan (res-s4)**
**Decision:** Correct res-s4's signed-off DoR contract (`dor/res-s4-dor-contract.md`) before writing its implementation plan. Direct code investigation found three real, previously-undocumented touch points beyond the contract's original list: (1) the operator's flag/leave-as-is choice needs a dedicated deterministic action, not a "chat-turn handler" — this codebase already has an exact precedent (`skills.js`'s `handlePostAssumptionConfirm` + client-side button wiring for assumption cards), and this story should follow the same pattern with a new endpoint in `skills.js`, not `journey.js`; (2) `journey.js` contains TWO independent, near-duplicate step-nav render functions (`handleGetStageReview` and `handleGetJourneyStageView`), and AC1's "each downstream stage's step-nav entry displays a visible flag/marker" is only genuinely true if both are updated — a flag visible on only one of the two pages an operator might view is a real gap; (3) `journey.flaggedStages` (a new top-level array field) needs a DIFFERENT persistence call than `completedStages` uses on both backends — Postgres via `journey-store-pg.js`'s `_sanitise()`, an explicit field allowlist that will silently drop any unlisted field on restart (its own comment documents this exact failure mode), and disk via `saveJourney` (whole-object write) rather than `updateStage` (a per-stage nested-field merge, the wrong shape for a top-level array).
**Alternatives considered:** (1) Write the implementation plan against the original contract and let a subagent discover the gaps mid-task — the pattern this session has repeatedly found costs more (a subagent hitting an unexplained integration test failure, or worse, silently shipping a flag that vanishes on PG restart with no test catching it if `flagStatePersistsAcrossServerRestart` only ever runs against the disk/in-memory path locally). (2) Interpret "chat-turn handler for the flag-choice" literally and have the model parse free-text intent from the operator's next message — rejected because it reintroduces non-deterministic classification for a binary choice that has a clean, already-precedented deterministic UI mechanism available, and the story's Out-of-Scope note about free-text only covers the third "handle it differently" path, not flag/leave-as-is.
**Rationale:** ADR-008 — the contract is the authoring defect to be corrected before planning, not bypassed. Unlike res-s2/res-s3's touch-point corrections (which were "wrong file named"), these three findings are of a different character — not a wrong file, but under-scoped touch points within files the contract did name, only discoverable by reading the actual persistence/rendering code rather than assuming `completedStages`'s pattern transfers unchanged to a differently-shaped new field. The Postgres allowlist finding in particular is the kind of gap that can ship silently: correct in every local test run (disk/in-memory), broken only in a PG-backed production restart — exactly the scenario `flagStatePersistsAcrossServerRestart` exists to catch, but only if the implementer knows to route it through the real PG adapter rather than assuming the disk-adapter test alone is sufficient.
**Made by:** Claude (agent), continuing the operator's "yes please" instruction to proceed with /implementation-plan
**Revisit trigger:** If a future story's contract review finds another "field needs different persistence mechanism than a superficially-similar existing field" gap, treat as a new class of recurring DoR-contract risk (distinct from the "wrong file named" pattern already tracked) worth its own `/improve` note — Contract Proposals that describe persistence as "the same path as [existing field] already uses" should be required to verify the existing field's storage SHAPE (top-level vs. per-stage-nested) matches the new field's proposed shape, not just that the same module is involved.
---

---
**2026-08-29 | ARCH | subagent-execution (res-s4, final cross-task review)**
**Decision:** Dispatch a corrective Task 5 for res-s4 to fix two findings from the mandatory final cross-task review: (F1) a THIRD step-nav render site — `_renderChatPage` in `src/web-ui/routes/skills.js` (~lines 4292-4303) — renders the same `.sn-step` component as `journey.js`'s two sites but was never given the `sn-flag-marker` treatment, so AC1's "visible flag marker" is invisible on the chat page itself, the exact page the operator is looking at when they click "Flag downstream stages"; (O1) `handlePostMaterialityAction`'s flag branch (`skills.js:5639`) REPLACES `flaggedStages` wholesale from the current `downstream` computation rather than unioning it with any existing flags, so a second flag action from a later stage silently discards unresolved flags from an earlier one, with no test covering a second flag action on the same journey.
**Alternatives considered:** (1) Ship res-s4 as-is and defer both findings to a follow-up story — rejected for F1 because it is a genuine, user-visible AC1 gap of the same class res-s3's own final review caught (a real code path never wired to its consumer), not a hardening nitpick; deferring a known AC-failure past DoD would repeat the exact process gap this feature's own short-track/DoD retrospective was written to close. (2) Fix F1 only, defer O1 — rejected because O1 is a genuine silent-data-loss bug (not a hypothetical), cheap to fix (union instead of replace), and touches the same handler already being reopened for F1's neighbouring test file.
**Rationale:** Per ADR-008 and this feature's established pattern (res-s3's own corrective Task 5), a real gap found at final review is fixed via a scoped corrective task with its own spec + code-quality review cycle, not folded silently into "post-merge cleanup." Both F1 and O1 are within res-s4's existing story scope (AC1 and AC1/AC4 respectively) — neither requires a new AC or DoR contract amendment, only a correction to code already written under the existing contract.
**Made by:** Claude (agent), acting on the final cross-task reviewer's findings F1 and O1
**Revisit trigger:** If a future story's final review finds a fourth occurrence of "a render/consumer site outside the DoR contract's explicitly-named touch points was missed," treat as a signal the Contract Proposal step needs a repo-wide grep step (e.g. "grep every render site of the shared component being modified, not just the ones the contract names") added to `/definition-of-ready`, not just relying on final review to catch it after the fact.
---

---
**2026-08-29 | RISK-ACCEPT | subagent-execution (res-s4, final cross-task review)**
**Decision:** Accept finding O2 (flags can land on a downstream stage the operator has never reached, and such a flag has no resolution path — `getDownstreamStages` returns every later stage in `STAGE_SEQUENCE` regardless of completion status, and neither `handleGetJourneyStageReopen`'s clear logic nor `completeStage()` ever clears a flag on a stage reached for the first time) without a code change in res-s4. AC4 as literally worded ("flag clears when the operator reopens and resolves that stage") is satisfied — the gap is between AC4's stated rationale ("flags don't persist forever with no resolution path") and this specific edge case, not the AC's literal text.
**Alternatives considered:** (1) Scope `getDownstreamStages` to only stages already present in `completedStages`, so flags are only ever set on stages that already have a defined resolution (reopen) path — narrows AC1's own "downstream stages" language, which the story and DoR both currently read as ALL later stages, not just completed ones; would require a story-text amendment, not just a code fix. (2) Clear a stage's own flag inside `completeStage()` the first time it's reached (in addition to the existing reopen-path clear) — a plausible fix, but changes `completeStage()`, a function shared by every story in this feature and several prior features, which is a bigger blast radius than a single-story corrective task should take on without its own DoR review.
**Rationale:** Unlike F1/O1, this is a genuine design question about what "downstream" and "resolution path" are meant to cover, not an implementation defect against an agreed contract — resolving it well requires either a scope decision (alternative 1) or a shared-function change with wider review (alternative 2), both bigger than what a same-day corrective task should absorb. Shipping with the gap documented is preferable to a rushed, under-reviewed fix to `completeStage()`.
**Made by:** Claude (agent), acting on the final cross-task reviewer's finding O2
**Revisit trigger:** If M2 (materiality-suggestion acceptance rate) data, once live, shows a meaningful share of flags going stale (never resolved because the flagged stage was never reached before the journey otherwise concluded, or the operator reports confusion about a flag on a stage they haven't written yet), open a dedicated short-track story to implement alternative (2) above.
---

---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
