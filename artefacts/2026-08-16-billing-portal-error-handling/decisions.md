# Decision Log: billing-portal-error-handling

**Feature:** Add error handling and a missing-customer guard to the Stripe Billing Portal redirect
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-16

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
**[2026-08-16] | DESIGN | story authoring (bpe-s1)**
**Decision:** On a missing/falsy `stripeCustomerId` or a genuine `createPortalSession()` throw, `handleGetBillingPortal` redirects (302) to `/settings?error=no_billing_account` or `/settings?error=billing_unavailable` respectively, rather than rendering a full error page or returning a plain-text 500.
**Alternatives considered:** (1) Render a full-page friendly error via `renderShell()` directly inside `billing.js` — rejected, no such error-page helper exists in `html-shell.js` today and building one is out of this story's bounded scope. (2) Return a plain-text 500 body like `handlePostCheckout`'s existing "Billing not configured" response — rejected, a 500 status code is exactly the defect being fixed; a 302 to a normal page is a materially better outcome even without a visible message yet. (3) Redirect with no query param at all — rejected, the `?error=<code>` convention costs nothing extra and sets up a future story (rendering a visible banner) to reuse it directly.
**Rationale:** Investigated existing precedent before choosing (per `web-ui-patterns` reuse discipline): `products.js`'s `handleGetProductNew`/`plan_limit` guard is the one existing `?error=<code>` redirect-then-banner precedent in this codebase; `billing.js`'s own `handleGetBillingSuccess` already "fails open" to a redirect (not a 500) when a Stripe read fails. This design reuses both existing patterns rather than inventing a third. Rendering the code into a visible banner on the Settings page is deliberately deferred (see story's Out of Scope) — the redirect alone already converts the defect (raw 500) into a normal navigation outcome, which is the confirmed real-world bug being fixed.
**Made by:** Claude (agent), per the task's explicit instruction to check `settings.js` and sibling billing code for precedent before inventing a new pattern
**Revisit trigger:** If a follow-up story adds a visible banner reading `req.query.error` on the Settings page, use exactly these two code strings (`no_billing_account`, `billing_unavailable`) rather than renaming them.
---

---
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, bpe-s1)**
**Decision:** Proceeding with DoR sign-off on `bpe-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — deferred for the same practical reason applied consistently across this repo's other short-track features, most recently `tmss-s1` (`artefacts/2026-08-16-team-management-shared-shell-migration/decisions.md`, 2026-08-16 W4 entry): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; post-merge smoke testing (the script's own second intended use) remains the real verification checkpoint. This story's scope is additionally low-risk — a defensive guard + try/catch around an existing external call, not novel business logic, and the root cause was already independently confirmed live against staging before this story was even written.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, bpe-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path (`/test-plan → /definition-of-ready → coding agent`), matching the precedent already established by `pcr-s1` (`2026-07-11-pipeline-conflict-reduction`) and most recently reapplied by `tmss-s1` (`artefacts/2026-08-16-team-management-shared-shell-migration/decisions.md`, 2026-08-16 H-GOV entry) — both reached DoD-complete/branch-complete with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** (1) Block DoR sign-off until a discovery artefact is authored retroactively — rejected, would defeat the purpose of the short-track path. (2) Treat H-GOV as an automatic FAIL for any feature with no discovery.md — rejected, inconsistent with the already-shipped `pcr-s1`/`tmss-s1` precedent.
**Rationale:** H-GOV's own detail section only defines behaviour for a discovery artefact that exists but has an empty/missing/engineer-only `Approved By` section — it does not define behaviour for "no discovery artefact exists because this is short-track by design." The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context, matching `tmss-s1`'s identical reasoning.
**Made by:** Hamish King — Platform owner (requested the work directly); Claude (agent) identified and applied the precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

---
**[2026-08-16] | RISK-ACCEPT | branch-setup (bpe-s1)**
**Decision:** Proceeding with `bpe-s1`'s worktree (`.worktrees/bpe-s1`, branch `feature/bpe-s1`, based on master @ `7d50b3bf`) despite 33 pre-existing test failures at baseline (523 files run via `npm test`, 33 failed, 624789ms, exit code 1).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this bounded bug fix and would delay resolving a confirmed, already-triaged production defect for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files are: `scripts/check-pipeline-state-integrity.js`, `tests/artefact-preview.test.js`, `tests/artefact-writeback.test.js`, `tests/check-bee3-posthog.js`, `tests/check-i1.2-platform-init-fetch.js`, `tests/check-i3.1-discovery-attribution.js`, `tests/check-i3.2-benefit-metric-attribution.js`, `tests/check-i3.3-dor-h-gov.js`, `tests/check-ilc2-agent-selfrecord.js`, `tests/check-inc2.1-conditions-panel.js`, `tests/check-inc4-canvas-panel.js`, `tests/check-iwu2-right-panel-layout.js`, `tests/check-mfc1-model-first-chat-session.js`, `tests/check-mfc2-chat-ux-improvements.js`, `tests/check-ougl1-buildsystemprompt-handoff.js`, `tests/check-ougl2-journey-state-store.js`, `tests/check-ougl3-journey-entry-and-start.js`, `tests/check-ougl4-journey-aware-chat-button.js`, `tests/check-ougl5-gate-confirm-feature-stages.js`, `tests/check-ougl6-perstory-stage-routing.js`, `tests/check-p11-hgov.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`, `tests/check-rb-s5-optional-outer-loop-install.js`, `tests/check-s0.2-tenant-login-fallback.js`, `tests/check-sec3-return-to.js`, `tests/check-sec5-session-rotation.js`, `tests/check-srt1-status-report-template.js`, `tests/check-wsm2-collaborative-sessions.js`, `tests/check-wuce24-guided-question-form.js`, `tests/check-wuce3-attributed-signoff.js`, `tests/check-wuce4-docker-deployment.js`, `tests/check-wucp1-context-autoloader.js`. This is the same general shape of pre-existing, unrelated repo drift already independently observed and accepted by `tmss-s1` (also 33 failures, though master has moved since then — this is a freshly re-verified count/list, not an assumed carry-over). None overlap with `bpe-s1`'s expected touchpoints (`src/web-ui/routes/billing.js`, a new `tests/check-bpe-s1-*.js` file) — critically, `tests/check-lab-s3.5-billing-portal.js` (the existing test file for the same handler this story modifies) is NOT in the failure list, confirming the handler's currently-shipped behaviour is fully green before this story's changes begin.
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this story's changes during implementation, stop and investigate.
---
