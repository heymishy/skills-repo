# Decisions: journey-gate-live-completion-sticky-gap

Per this repo's standing rule (`CLAUDE.md`, "decisions.md is mandatory for features with architectural choices"). Created at story-authoring time (short-track); appended as further decisions are made during delivery.

---

## RISK-ACCEPT: AC1 (sticky positioning on the live-completion path) verified via unit string assertion + manual smoke check, not a new Playwright E2E spec

**Date:** 2026-09-11
**Category:** RISK-ACCEPT (test-plan, CSS-layout-dependent AC, B2)
**Context:** AC1 requires the `showCommitLink()`-injected gate control to render with `position:sticky;bottom:0`, a real browser layout/rendering behaviour — CSS-layout-dependent per B2's classification rule, which requires either an automated visual regression test or a RISK-ACCEPT + manual smoke test.
**Decision:** RISK-ACCEPT + manual smoke test, not a new automated E2E spec. `wnl-s2`'s own existing Playwright suite (`tests/e2e/wnl-s2-journey-gate-sticky.spec.js`, AC1/AC3/AC5) already proves `position:sticky;bottom:0` renders correctly under this codebase's real browser layout engine, for the server-rendered path. This story applies the identical, already-proven CSS mechanism to a second code path (`showCommitLink()`); verified here via a unit-level string assertion (AC1's test) plus a live Chrome smoke check on staging post-deploy, recorded in the DoD artefact.
**Rationale:** A second, live-turn-driven E2E spec would need to seed a not-yet-done session and reliably wait for a real (or mocked) LLM turn to complete in CI — meaningful added complexity and flake risk for zero additional proof that `position:sticky` itself works, since that mechanism is already proven elsewhere in this exact codebase. The actual, narrow risk this story addresses — whether the CSS string was correctly added to the *second* location — is fully and precisely covered by a direct string assertion. This mirrors `wnl-s1`'s own AC3 precedent this session (structural verification accepted in place of a redundant behavioural test when the underlying mechanism is native/already-proven).

---

## RISK-ACCEPT: Verification script not yet reviewed by a separate domain expert

**Date:** 2026-09-11
**Category:** RISK-ACCEPT (DoR Warning W4)
**Context:** DoR flagged W4 — the test plan/verification script has not been reviewed by a separate person before implementation begins.
**Decision:** Proceed without a separate pre-code review.
**Rationale:** Complexity rating 1, root cause and fix both precisely identified via live reproduction (not guessed) — matches the exact precedent already accepted for `jasb-s1` earlier this session. Operator (Hamish King) directed this fix directly in-session, immediately after independently reviewing the live-verification findings that produced this story.
