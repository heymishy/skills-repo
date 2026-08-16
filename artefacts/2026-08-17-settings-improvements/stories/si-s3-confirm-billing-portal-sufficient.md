## Story: Confirm the Stripe billing portal satisfies the "manage my plan" ask

**Epic reference:** artefacts/2026-08-17-settings-improvements/epics/settings-improvements.md
**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-08-17-settings-improvements/benefit-metric.md
**Domain:** [payments, web-ui]

## User Story

As a **wuce account owner/admin**,
I want to **reach a working Stripe billing portal when I click "Manage billing" in Settings**,
So that **I can actually manage my plan end-to-end, closing the "I want to manage my plan" ask without needing new in-app UI**.

## Benefit Linkage

**Metric moved:** Original beta-reported friction resolved
**How:** This story directly verifies (and, if needed, fixes) the specific mechanism the metric's plan-management component depends on — the existing Stripe portal link at `/settings/billing`, already hardened by `bpe-s1`/`bse-s1` for the error paths but never verified end-to-end on the success path.

## Architecture Constraints

- None new. This story verifies existing, already-shipped code (`bpe-s1`'s redirect fix, `bse-s1`'s error banner) — it does not introduce new architecture. If verification surfaces a genuine gap, any resulting fix must follow the shared shell module rule already governing `settings.js` and `renderBillingTab`.

## Dependencies

- **Upstream:** `bpe-s1` (2026-08-16-billing-portal-error-handling, merged) and `bse-s1` (2026-08-16-billing-settings-error-banner, merged) must both be in production — this story verifies their combined effect. `[External: bpe-s1 at artefacts/2026-08-16-billing-portal-error-handling/stories/bpe-s1-billing-portal-error-handling.md, already merged and DoD-complete — confirmed by operator on 2026-08-17]` `[External: bse-s1 at artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md, already merged and DoD-complete — confirmed by operator on 2026-08-17]`
- **Downstream:** None. Per the clarified discovery scope (Q3), this story does not gate on a live beta-user follow-up conversation — verification is against real staging behaviour, not against the reporting beta user's own confirmation.

## Acceptance Criteria

**AC1:** Given the existing automated test suites for `bpe-s1` and `bse-s1`, When they are re-run on current `master` as part of this story's verification, Then all previously-passing tests still pass with no regression introduced by this epic's other stories (si-s1, si-s2).

**AC2:** Given an authenticated staging account with no Stripe customer ID configured, When "Manage billing" is clicked, Then the page redirects to `/settings?error=no_billing_account` and the Billing tab displays the fixed, honest error banner (not a raw 500) — reconfirming `bpe-s1`/`bse-s1`'s already-tested behaviour still holds live on staging, not just in the test suite.

**AC3:** Given an authenticated staging account WITH a valid Stripe customer ID configured, When "Manage billing" is clicked, Then the user reaches the actual Stripe-hosted billing portal successfully — this is the positive/success path, not previously covered by `bpe-s1`/`bse-s1`'s error-focused test suites, and is the specific gap this story closes.

**PROCEED-BLOCKED condition (review run 1, finding 1-M1 / PAT-06):** AC3 requires a staging account with a real Stripe customer ID already configured. This story must not be dispatched to a coding agent until that fixture's existence is confirmed at `/definition-of-ready` — either an existing staging account is named, or one is provisioned first. If no such fixture can be provisioned within this story's scope, AC3 is deferred and this condition is re-evaluated (see `decisions.md`, RISK-ACCEPT 2026-08-17).

**AC4:** Given AC2 and AC3 have both been verified live, When this story's DoD is written, Then the outcome (portal reachable and working end-to-end vs. a genuine remaining gap) is recorded explicitly — if a gap is found, it is logged as a new feedback signal (`artefacts/feedback/`) rather than silently expanding this story's scope to fix it inline.

## Out of Scope

- Building new in-app plan-management UI — this story only verifies the existing external Stripe portal path; if verification finds it insufficient, a new discovery/story is scoped separately, not built inline here.
- A live follow-up conversation with the reporting beta user to get his personal confirmation — per the clarified discovery scope (Q3), this story proceeds on staging verification alone; only revisited if he raises the issue again.
- Any change to Stripe account configuration, pricing, or plan structure — verification only, no commercial/billing-config changes.

## NFRs

- **Performance:** None identified beyond what `bpe-s1`/`bse-s1` already established.
- **Security:** None new — no new code path, verification only.
- **Accessibility:** None new.
- **Audit:** AC2/AC3's live verification steps and their outcome must be recorded in this story's DoD artefact as evidence (per this repo's own "CSS/browser-only verification must be classified at DoR" convention — AC2/AC3 require a manual smoke test, classified accordingly at DoR).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
