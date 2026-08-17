# Definition of Done: Make feature rows in a product's view clickable, linking through to the persisted conversation and artefacts for each stage

**PR:** #581 ("frsr-s1: make feature rows clickable, linking through to the persisted conversation", commit `5b0acf7d`) | **Merged:** 2026-07-24 (per `git log`; note the task dispatch for this DoD pass cited PR #628, which is actually a later, separate story — `dsh-s4` ("Fix Resume conversation to always resolve to a real conversation view"), merged 2026-07-29, commit `206ac338` — corrected here using `git log` as the source of truth)
**Story:** artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — feature rows are real, keyboard-activatable links to `/features/:slug` | Yes | `check-frsr-s1-feature-row-session-resume.js`: "`_renderPvcItemRow`: output contains a real `<a href="/features/...">` wrapping the row, not a bare `<div>`" and "`_renderPvcItemRow`: discoveryArtefact link is a sibling, not nested inside the card link (invalid HTML)"; also `tests/e2e/frsr-s1-feature-row-session-resume.spec.js` (real-browser click + keyboard activation, per `decisions.md`) | Unit + E2E | None |
| AC2 — `completeStage()` records the active `sessionId` | Yes | "`completeStage`: resulting `completedStages` entry includes `sessionId` matching `activeSessionId` at call time" and "`completeStage`: `sessionId` omitted → entry has no `sessionId` field, no throw (backward compatible)" | Unit | None |
| AC3 — `/features/:slug` shows a "Resume conversation" link alongside "View" when a session is resolvable | Yes | "`handleGetFeatureArtefacts`: resolvable stage gets a Resume conversation link; the existing View link is still present" — asserts both the resume link and the pre-existing `/artefact/.../discovery` View link are present, and that the unresolvable `definition` stage gets no resume link | Integration | Link target evolved post-merge (see Scope Deviations) |
| AC4 — the resume link reaches `handleGetChatHtml`'s real, unmodified rendering | Yes | "`handleGetChatHtml`: the resume link's skillName/sessionId reaches the real, unmodified chat-history rendering" — asserts unique marker turn content (`FRSR_AC4_UNIQUE_QUESTION`/`_ANSWER`) is rendered, not partial/duplicated logic | Integration | Test exercises `handleGetChatHtml` directly via the `completedStages` entry's `skillName`/`sessionId`, not by following the current production link literally (see Scope Deviations) |
| AC5 — an evicted/unresolvable session shows the existing honest "not found" message | Yes | "`handleGetChatHtml`: a sessionId that resolves in neither memory nor Redis → 404 with the existing not-found message" — asserts HTTP 404 and `/session not found/i` message text | Integration | None |
| NFR-Performance — lookup runs once per render, not once per row | Yes | "`handleGetFeatureArtefacts`: `getJourneyByFeatureSlug` is called exactly once regardless of artefact-row count" (asserted with a spy, 2 artefact rows) | Integration | None |
| NFR-Security — resume link respects the same tenant/ownership guard as `handleGetChatHtml` | Yes | "cross-tenant request rejected identically to the existing direct-route guard" (non-200, secret content absent) and "the owning user's own request still succeeds" (200) | Integration | None |

## Scope Deviations

The story's own text explicitly accepts the `SESSION_MAX_AGE_DAYS` eviction window as a pre-existing, out-of-scope constraint (AC5 handles it honestly rather than removing it) — not a defect.

One evolution worth recording for transparency, not a defect in this story's own delivery: a later, separate story (`dsh-s4`, PR #628, merged 2026-07-29) changed the production "Resume conversation" link's target from the raw `/skills/:skillName/sessions/:sessionId/chat` route (frsr-s1's original AC3/AC4 design) to a durable `/journey/:journeyId/stage/:stageName` route (`_resolveResumeLinksForFeature` in `src/web-ui/routes/features.js`, confirmed by direct code read), specifically to avoid 404s once a session evicts from both memory and Redis. The AC3 test (in the fresh 10/10 run cited below) already asserts against this current, post-dsh-s4 link target, so AC3 evidence reflects live production behaviour. The AC4 test, however, still exercises `handleGetChatHtml` directly via the `completedStages` entry's raw `skillName`/`sessionId` pair rather than by following the current `/journey/.../stage/...` route end-to-end — it proves the underlying rendering mechanism is real and unmodified, but does not by itself prove the current production link chain reaches it. This is transparently documented in the test file's own inline comments and is a natural consequence of `dsh-s4` superseding part of frsr-s1's original routing design after the fact, not an undisclosed gap from frsr-s1's own delivery.

## Test Plan Coverage

`check-frsr-s1-feature-row-session-resume.js`: 10 passed, 0 failed (freshly re-run 2026-08-17). All 10 tests map directly to the AC/NFR table above (AC1 x2, AC2 x2, AC3 x1, AC4 x1, AC5 x1, NFR-Performance x1, NFR-Security x2). Per `frsr-s1-verification.md`, 2 additional Playwright E2E tests (`tests/e2e/frsr-s1-feature-row-session-resume.spec.js`) cover AC1's real-browser click and keyboard-activation path; these were not re-run for this DoD pass (not included in the fresh results supplied), but their existence and scope are confirmed by direct file read and by `decisions.md`'s explicit AC-to-test-type mapping (AC1 is E2E-tagged; AC2–AC5 are integration/unit by design, to avoid a disproportionate full-journey E2E build-out).

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (lookup bounded to one call per render) | Met | NFR-Performance test: exactly 1 call to `getJourneyByFeatureSlug` for 2 artefact rows |
| Security (same tenant/ownership guard as `handleGetChatHtml`) | Met | NFR-Security tests: cross-tenant rejected, owning user succeeds |
| Accessibility (keyboard-focusable/activatable rows) | Met | E2E test asserts keyboard activation per `decisions.md`; AC1 unit test confirms real `<a>` element (not a mouse-only `div` handler) |
| Audit (no new audited action) | Not independently re-verified this pass — story states no new audit event is introduced beyond the existing `feature_artefacts_accessed` log; no test asserts this directly, treated as a documentation claim, not a tested gap |

## Metric Signal

No benefit-metric artefact exists for this story — the story itself states this plainly under Benefit Linkage ("None — pure UX/visibility fix, not tied to a Tier 1 product metric... per CLAUDE.md's short-track convention"). The stated benefit (making a durably-persisted but practically-unreachable conversation reachable again) is a direct UX-gap closure, verified structurally via the AC coverage above rather than via a metric signal.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** None required. The one deviation noted (AC4's test still targets `handleGetChatHtml` directly rather than the current `/journey/.../stage/...` link chain introduced by `dsh-s4`) is a test-coverage nuance already transparently documented in-repo, not an open functional gap — the underlying mechanism AC4 requires (real, unmodified turn-history rendering) is confirmed working, and AC3's own passing test already exercises the current production link target.

## DoD Observations

Shipped 2026-07-24 (PR #581) and still in production three weeks later as of this assessment, with its link-target mechanism subsequently hardened by `dsh-s4` (PR #628, 2026-07-29) for session-eviction durability — a sign the feature saw real follow-on investment rather than being merged and forgotten. The task dispatch for this DoD pass cited the wrong PR number (#628 instead of #581); corrected above using `git log` as ground truth.
