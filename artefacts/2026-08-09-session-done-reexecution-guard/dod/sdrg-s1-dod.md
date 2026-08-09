# Definition of Done: Guard the initial-turn auto-fire so viewing an already-completed session can never re-execute or re-mutate it

**PR:** https://github.com/heymishy/skills-repo/pull/698 | **Merged:** 2026-08-09 (merge commit `3f7ece6ac632494bb61abb158de63a5bedd5db5e`)
**Story:** artefacts/2026-08-09-session-done-reexecution-guard/stories/sdrg-s1-session-done-reexecution-guard.md
**Test plan:** artefacts/2026-08-09-session-done-reexecution-guard/test-plans/sdrg-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-session-done-reexecution-guard/dor/sdrg-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

AC1: streaming endpoint — `__init__` on a done session is a true no-op. AC2: non-streaming endpoint — `__init__` on a done session is a true no-op. AC3: fresh-session `__init__` behaviour unchanged (regression guard). AC4: client `SESSION_DONE` flag suppresses auto-fire on a done session. AC5: auto-fire still fires for a genuinely fresh session (regression guard). Full text: `artefacts/2026-08-09-session-done-reexecution-guard/stories/sdrg-s1-session-done-reexecution-guard.md`.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `streamTurn_initOnDoneSession_isNoOp_executorNeverCalled` + `streamTurn_initOnDoneSession_emitsValidTerminalDoneEvent` — executor spy never called, `session.turns`/`artefactContent` unchanged, one valid terminal `{done:true, artefactContent}` SSE event written, response ended cleanly | automated test | None |
| AC2 | ✅ | `submitTurn_initOnDoneSession_isNoOp_executorNeverCalled` + `submitTurn_initOnDoneSession_returnsExistingCompletionState` — executor spy never called, state unchanged, `{done:true, artefactContent}` returned | automated test | None |
| AC3 | ✅ | `streamTurn_initOnFreshSession_behaviourUnchanged` + `submitTurn_initOnFreshSession_behaviourUnchanged` — executor IS called, assistant turn IS pushed, exactly as before this fix | automated test | None |
| AC4 | ✅ | `renderChatPage_doneSession_emitsSessionDoneTrueAndSuppressesAutoFire` — emitted HTML contains `var SESSION_DONE = true;` and the auto-fire condition is gated `if(!SESSION_DONE && thread.children.length === 0)` | automated test (static script-string assertion, per the test plan's stated lower-fidelity substitute for real-browser execution) | None |
| AC5 | ✅ | `renderChatPage_freshEmptySession_autoFireStillPresent` — `SESSION_DONE = false` and `sendTurn("__init__")` call site still present in the emitted script | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — this story delivered exactly as scoped.

---

## Scope Deviations

None. Only the three named call sites in `src/web-ui/routes/skills.js` were touched (`handlePostTurnStreamHtml`, `htmlSubmitTurn`, `_renderChatPage`'s emitted script). No change to `skill-turn-executor.js`, session-restore/Redis-merge logic, or `routes/journey.js`, matching the DoR's out-of-scope contract exactly.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 planned
**Tests passing:** 8 / 8 new, run standalone and as part of the full suite

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| streamTurn_initOnDoneSession_isNoOp_executorNeverCalled | ✅ | ✅ | |
| streamTurn_initOnDoneSession_emitsValidTerminalDoneEvent | ✅ | ✅ | |
| submitTurn_initOnDoneSession_isNoOp_executorNeverCalled | ✅ | ✅ | |
| submitTurn_initOnDoneSession_returnsExistingCompletionState | ✅ | ✅ | |
| streamTurn_initOnFreshSession_behaviourUnchanged | ✅ | ✅ | |
| submitTurn_initOnFreshSession_behaviourUnchanged | ✅ | ✅ | |
| renderChatPage_doneSession_emitsSessionDoneTrueAndSuppressesAutoFire | ✅ | ✅ | |
| renderChatPage_freshEmptySession_autoFireStillPresent | ✅ | ✅ | |

**Regression verification:** `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js` (both exercise the handlers this story modifies) re-run before and after this change via `git stash` — their existing failures (`T1.6` thinkingDiv-removal ordering, `T3.2` history=[] assertion, `T8.1`-`T8.3` missing `ANTHROPIC_API_KEY`) are confirmed pre-existing on `master`, unchanged by this fix.

**Full suite:** 489 files run, 38 failed — 37 match this session's already-documented baseline exactly, plus one confirmed test-isolation flake (`check-rb-s3-harness-agnostic-instructions.js`, 8/8 passing when run in isolation; a pre-existing full-suite-only ordering issue unrelated to any file this story touches).

**Gaps (tests not implemented):** None against the test plan. Per the test plan's own stated scope, no live-browser/Playwright confirmation of AC4/AC5's client-side suppression was added — acceptable because AC1/AC2 enforce the actual security-relevant guarantee server-side regardless of client behaviour. A one-off manual live-browser recheck of the specific fixture card that originally exposed this bug (`new-feature-f3765c1a` on the real `skills-framework` board) is a reasonable post-merge confirmation step, not a blocking gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security / integrity | ✅ | AC1/AC2's automated tests directly assert zero executor calls and zero state mutation for `__init__` against a done session — the exact property this NFR requires |
| Cost | ✅ | Same guard prevents wasted LLM/mock-gateway spend from spurious re-execution of the opening prompt against already-complete sessions |
| Performance | ✅ (negligible, as stated) | Early-return guard clause, no new I/O |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE** — PR #698 merged 2026-08-09.

**Follow-up actions:**
1. ✅ **Done 2026-08-09, with a strong direct confirmation.** First pass (`new-feature-f2aaa734`, Women's mentorship product): opened its Discovery resume link before/after — kanban card stayed at "7 artefacts / definition-of-ready / Not ready to advance" with zero change, matching the automated suite. That click routed through a newer read-only "view completed stage" viewer rather than the old auto-fire chat page, so it was corroborating, not definitive. Second pass (`new-feature-5a4e59db`, "test product: 2×2 canvas", session `ba08c5de-...`) landed directly on the actual previously-vulnerable `skills.js` chat page — `read_network_requests` confirmed the client's auto-fire really did POST to `/api/skills/definition/sessions/.../turn-stream` (200 OK) against this already-done session. Artefact count stayed flat at exactly 5 before and after — zero new artefact written, the precise defect this story closed. This is now a direct, network-proven live confirmation on the real vulnerable path, not just the unit tests. See `workspace/capture-log.md`, 2026-08-09 (two entries).
2. Not opened as a follow-up story: the separately-reported "SSE doesn't load after resume" signal remains unconfirmed as fixed by this change (explicitly out of scope, per the story) — recheck it live before assuming it's resolved.

---

## DoD Observations

1. **This is the second finding this session traced to the exact same file's initial-turn/auto-fire mechanism** (the first being the operator's own separately-reported SSE-after-resume signal). Both point at `skills.js`'s turn-initiation logic as a recurring source of subtle state bugs — worth flagging as a candidate area for a closer structural look (e.g. consolidating the three near-duplicate "is this a fresh session" checks into one shared, correctly-reasoned helper) in a future session, rather than continuing to patch each symptom at its own call site.
2. **The regression-guard ACs (AC3/AC5) earned their keep**: writing them forced explicit test coverage proving the fix is scoped correctly (only suppresses re-execution for done sessions, not fresh ones) rather than relying on manual reasoning alone.
