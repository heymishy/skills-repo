# Definition of Done: Suggest whether a stage revision is material to downstream stages

**PR:** https://github.com/heymishy/skills-repo/pull/781 | **Merged:** 2026-08-28 (commit `2835d67a`)
**Story:** `artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md`
**Test plan:** `artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s3-test-plan.md`
**DoR artefact:** `artefacts/2026-08-27-revise-earlier-stage/dor/res-s3-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Materiality judgment and one-sentence rationale presented to the operator in the same chat turn as the revision confirmation — traced end-to-end (server SSE emit → client dispatcher → `appendBubble` render) by a dedicated final-review pass, not just "a test exists" | Automated tests (`AC1: a materialitySuggestion SSE event was emitted`, `AC1: the materiality suggestion arrives in the SAME turn, before the final done event`, Task 5's `AC1 fix: the materialitySuggestion branch calls appendBubble`) plus manual code-path trace | **Yes — caught and fixed pre-merge, not post-merge.** The first implementation (Tasks 1–4) satisfied AC1 only on the server side; a final cross-task review found the browser had no consumer for the SSE event, so no operator would ever have seen the suggestion. Fixed in Task 5 before this PR opened. See DoD Observation #1. |
| AC2 | ✅ | Problem Statement/MVP Scope/Constraints change → "material", with exclusivity (only the changed section(s) named) | Automated tests (`AC2: Problem Statement change classified as material`, `AC2: Constraints change classified as material`, plus 2 exclusivity assertions added at Task 1 code-quality review) | None |
| AC3 | ✅ | Wording-only change (outside target sections) → "minor" | Automated tests (`AC3: wording-only change (non-target section) classified as minor`, `AC3 edge case: single-character typo fix classified as minor`) | A known boundary case — a wording-only edit made *inside* a target section still classifies "material" — is an unavoidable consequence of the DoR contract's own approved deterministic-diff trade-off, not a bug. Explicitly RISK-ACCEPTed in `decisions.md` (2026-08-28) rather than silently shipped or silently hidden by test design. |
| AC4 | ✅ | Suggested classification recorded via PostHog (`materiality_suggestion_generated`) with a `suggestionId` that is identical across the capture event, the function's return value, and the client-visible SSE payload — genuinely joinable with res-s4's later choice | Automated tests (`AC4: exactly one PostHog capture call recorded`, `AC4: capture properties include the same suggestionId returned to the caller`, `AC4: the client-visible suggestionId matches what the hook returned`) | None |
| AC5 | ✅ | `setMaterialityCheckHook` wired to the real `runMaterialityCheck` implementation in `server.js`, verified behaviourally — two different pre/post pairs resolve to two different, individually-correct classifications through the real wired chain, not just a reference-assignment check (D37 rule #4) | Automated tests (`AC5: server.js wires setMaterialityCheckHook to the real implementation`, `AC5: the two pairs produce two DIFFERENT classifications`) | AC5 itself was added to the story during implementation planning — it did not exist at DoR sign-off. The DoR's H-ADAPTER check had incorrectly read "No new adapter introduced." Corrected before implementation began, not discovered post-merge; see `decisions.md`'s 2026-08-28 ARCH entry. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Two are recorded above (AC1's pre-merge fix, AC3's logged boundary case) — both resolved or explicitly accepted before this PR merged, not post-merge surprises.

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/modules/materiality-check.js` (new), `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, one new test file, and the DoR-contract/story/decisions/capture-log artefacts corrected during `/implementation-plan` and the final-review fix cycle — matching the corrected DoR contract's touch points. Acting on the suggestion (accept/override) and any downstream artefact regeneration remain untouched, correctly deferred to res-s4 and confirmed out-of-scope per the story's own Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 34 tests across 5 tasks (9 originally planned at test-plan stage across 4 ACs; grew during implementation to cover AC5 plus code-quality-review-driven strengthening and the Task 5 corrective fix — final count independently verified, not a gap).
**Tests passing in CI:** 34/34 — confirmed via the merged PR's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run directly against the merged `master` HEAD during this DoD check (34 passed, 0 failed).

| Task | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Task 1 — deterministic section-diff classifier (9 tests) | ✅ | ✅ | Strengthened from 7→9 at code-quality review (exclusivity assertions; a broken implementation returning all target sections unconditionally would have passed the original 7) |
| Task 2 — orchestration: runMaterialityCheck (9 tests) | ✅ | ✅ | Reuses Task 1's classifier directly, no reimplementation; NFR test confirms zero additional model/executor calls |
| Task 3 — await hook, forward as SSE event (8 tests) | ✅ | ✅ | Touches the same shared `handlePostTurnStreamHtml` function res-s1/res-s2 also modify — regression-tested against both sibling stories' own test files at every subsequent task |
| Task 4 — D37 wiring (4 tests) | ✅ | ✅ | Behavioural-correctness wiring test (D37 rule #4), not a reference-assignment check |
| Task 5 — final-review fix: AC1 client-render + ADR-023 disk-canonicity (4 tests) | ✅ | ✅ | Added after a dedicated final cross-task review found both gaps; independently re-verified with a second full final review after the fix |

**Gaps (tests not implemented):** None. Full suite: 564/564 passing (confirmed both during `/verify-completion` and independently re-run against merged master for this DoD). Route/handler E2E coverage check (mandatory per `/verify-completion`): 3 matched specs — 1 local/mocked run fresh (5/5 passing), 2 `@real-staging` (`a4-ideate-session-resume.spec.js`, `dsh-s4-resume-conversation-survives-restart.spec.js`) named as residual risk at verify-completion — now confirmed passing on the merged commit's real CI run (`Scenario A E2E (staging)` and `Scenario B E2E (staging)` both SUCCESS). Residual risk now closed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — materiality judgment adds at most one additional model turn, no separate blocking API call | ✅ | Exceeded: the shipped implementation makes **zero** additional model/executor calls (rationale is a deterministic template derived from the diff, per the DoR contract's correction — see `decisions.md`). NFR test `NFR: materiality check invokes zero additional skill-turn-executor calls` passing. |
| Security | ✅ N/A | None identified beyond existing chat-turn handling, per the story's own NFR section |
| Accessibility — suggestion text follows existing chat message rendering, no new UI component | ✅ | Task 5's fix renders via the existing `appendBubble(role, html)` helper, the same mechanism used for every other assistant message — confirmed by direct code trace, not just a passing test |
| Audit — suggestion and rationale logged | ✅ | `materiality_suggestion_generated` PostHog event with `journeyId`, `skillName`, `suggestionId`, `classification`, `changedSections` — same mechanism as res-s1's `earlier_stage_reopened` event |
| Data classification (Internal) | ✅ N/A | No new data classification introduced by this story |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Materiality-suggestion acceptance rate | ✅ (not yet established — feature didn't exist) | Not yet — res-s3 makes suggestions genuinely generate and reach the operator (closing the AC1 gap the first implementation attempt left open), but "acceptance" requires the operator's later choice from res-s4, which has not merged yet | The mechanical suggestion-generation half of M2 is now real; the acceptance-tracking half needs res-s4 |

**Measurement-ready gate:** Not yet — recorded per the skill's `not-yet-measured` path rather than asking for a premature signal value. (M1 and M3 do not list res-s3 in their `contributingStories` — not assessed here.)

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. `/improve` candidate: the DoR contract's "Estimated touch points" naming the wrong file (`journey.js` instead of `skills.js`) has now recurred a third time across this feature's stories (res-s2, res-s3) — `/definition-of-ready`'s Contract Proposal step should require the named file to be grep-confirmed to actually contain the referenced function before sign-off, not accepted on faith. Already flagged in `decisions.md`'s 2026-08-28 ARCH entry.
2. `/improve` candidate: this story's own delivery is direct evidence that per-task spec + code-quality review, however rigorous, cannot catch cross-task integration gaps (AC1's missing client-side consumer was invisible to every individual task's own narrow tests). The mandatory final cross-task review step (`/subagent-execution` Step 3) is what caught it — this is a strong argument for keeping that step non-optional and possibly strengthening its own rigor further (e.g. requiring the final reviewer to trace at least one AC fully end-to-end through actual code reading, not just re-running tests, exactly as happened here).
3. Not blocking, but worth tracking: two observations from Task 3's code-quality review remain open in `workspace/capture-log.md` — the SSE keepalive interval is cleared before the (currently fast, synchronous-feeling) materiality hook runs, and no test exercises the hook rejecting/throwing. Both are low-risk today; revisit if the hook implementation is ever changed to have genuine I/O latency.

---

## DoD Observations

1. **A final cross-task review caught a real, otherwise-invisible AC1 gap that four individually-approved tasks' own review rounds could not see.** Task 3 correctly made the server emit a `materialitySuggestion` SSE event and correctly tested that emission against a mock response object — but the browser-side SSE dispatcher (an inlined JS string array, also in `skills.js`) had no branch for that event name, so it was silently dropped on the client. An operator on a real revision turn would have seen nothing, despite AC1's literal test passing. This was found only because the final reviewer traced the complete path end-to-end (server emit → wire → client dispatch → render) rather than confirming a branch existed. **This is the single most consequential process signal from this story**: task-level review, however careful, structurally cannot catch a gap that spans the boundary between two tasks' own narrow scopes (Task 3 owned the server emit; nothing in the 4-task plan explicitly owned the client consumer, because the story's AC1 wording didn't distinguish "emit" from "render" as separate concerns). Fixed via a corrective Task 5, itself independently re-verified by a second full final review.

2. **A second, independent gap (ADR-023 disk-canonicity) was found in the same final-review pass** — `postRevisionContent: session.artefactContent` used in-memory state instead of reading the just-written content back from disk, contradicting the story's own explicit Architecture Constraints. Practically harmless today (the two values coincide by construction), which is exactly why no test caught it — but a real deviation from a named constraint, fixed alongside AC1's gap in the same Task 5.

3. **The Task 5 corrective-fix cycle itself demonstrated good process resilience**: the implementer caught a genuine bug in the orchestrating session's own plan text (a snippet that would not have satisfied its own paired test's regex capture region) and fixed it correctly without being asked, documenting the reasoning rather than silently deviating. Independently verified by the spec reviewer before being trusted.

4. **A materially unrelated but significant discovery was made during this story's pre-planning investigation**: two already-merged DoD artefacts (res-s1, res-s2) and a `pipeline-state.json` guardrail entry cited an automated test (`stageReopenFiresAuditEvent`) that had never actually been implemented — a fabricated verification-method claim, not a functional regression (the underlying production behaviour was genuinely correct). Corrected with dated notes in both prior DoD artefacts and the guardrail entry in the same commit, not silently rewritten. **Candidate for `/improve`**: a DoD artefact's cited test name should be spot-checked against the real test suite (grep the name, confirm it runs) before being trusted as evidence — this exact discipline is already documented in this repo's memory system for recalling file/function names, but had not yet been applied to DoD test citations specifically until this story's investigation surfaced the gap.

5. **The DoR contract's "wrong touch-point file" pattern recurred a third time** (res-s1 clean, res-s2 and res-s3 both needed correction) — logged as a genuine `/improve` candidate in `decisions.md`, not just noted and left.
