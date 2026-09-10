# Decisions: journey-autofocus-scroll-trap

---

## RISK-ACCEPT: jasb-s1 verification script not yet reviewed by a separate domain expert

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (DoR Warning W4)
**Context:** DoR for `jasb-s1` flagged W4 — the AC verification script (`artefacts/2026-09-10-journey-autofocus-scroll-trap/verification-scripts/jasb-s1-verification.md`) has not been reviewed by a separate domain expert before sign-off.
**Decision:** Proceed without a separate pre-code review of the verification script.
**Rationale:** The root cause was confirmed via live reproduction on `wuce-staging.fly.dev` (direct JS inspection of `window.scrollY` and `document.activeElement`, 2026-09-10) before the story was written, not inferred or guessed. The fix is a single conditional-attribute change (complexity rating 1) with a precisely scoped, already-live bug as its own specification — low ambiguity, low blast radius. Operator (Hamish King) directed the story directly in-session.

---

## RISK-ACCEPT: pre-existing baseline test failure acknowledged at branch-setup

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (branch-setup baseline)
**Context:** `/branch-setup` for `jasb-s1` ran the full test suite on a fresh worktree checked out from master (commit `d496b813`, before any implementation code was written). 1 of 632 test files failed: `tests/check-p3.5-validate-trace.js`.
**Decision:** Acknowledge as pre-existing and proceed — do not fix as part of this story.
**Rationale:** This is the same known, pre-existing baseline failure documented by every prior short-track story's own baseline note this session (e.g. `cpco-s1`'s "Pre-existing failure `tests/check-p3.5-validate-trace.js` confirmed present on master before this branch existed"). Unrelated to `jasb-s1`'s scope (`src/web-ui/routes/journey.js`). Fixing it is out of scope for this story.

---

## RISK-ACCEPT: pre-existing reference-upload.spec.js failures (T9-T15), confirmed unrelated to this story

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (verify-completion, mandatory route/handler E2E coverage check)
**Context:** `jasb-s1` touches `src/web-ui/routes/journey.js`, triggering `/verify-completion`'s mandatory route/handler E2E coverage check. `tests/e2e/reference-upload.spec.js` navigates to `/journey?new=1` and was run locally: 7 of its tests (T9-T15) failed, all timing out on `page.waitForURL(/\/journey\/[^/]+\/reference-modal/)` after submitting the new-feature form.
**Decision:** Acknowledge as pre-existing and proceed — do not fix as part of this story.
**Rationale:** Per the Iron Law (no completion claims without fresh evidence), ran the identical spec at the pre-fix commit (`116b23f6`, via a temporary worktree at that commit) before assuming this was unrelated. Result: the exact same 7 tests (T9-T15) fail identically at the pre-fix baseline, same failure mode, same line (`reference-upload.spec.js:112`/`:128`). Confirms this is a pre-existing gap unrelated to `jasb-s1`'s one-line conditional-attribute change — not a regression introduced by this story. `ep1-s4-stage-selector.spec.js` and `bri-s3.5-billing-journey.spec.js` (the other two specs found exercising `/journey`) both pass cleanly. Fixing `reference-upload.spec.js`'s T9-T15 is out of scope for this story; worth its own follow-up story given 7 failing tests in one file is a real gap.
