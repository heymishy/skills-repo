# Definition of Done: Billing tab — plan status and Stripe portal access

**PR:** https://github.com/heymishy/skills-repo/pull/527 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c2-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/c2-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC5 (Billing tab, plan status pill, Stripe portal link, trial-plan upgrade control) | ✅ | `check-c2-billing-tab.js`, 11 assertions | Automated test, re-run fresh on current master 2026-08-17 | See note |

11/11 assertions pass fresh. **Live-verified extensively today (2026-08-17)** as part of `si-s3`'s own live checks: "Manage billing" correctly shows the no-Stripe-customer error banner (fixed by later stories `bpe-s1`/`bse-s1`) and, separately, the real "Active — Paid plan" status pill was confirmed rendering correctly for a live account.

**Note:** this file was also touched by two LATER stories: `bse-s1` (2026-08-16, added the error-banner rendering this AC set didn't originally cover) and `si-s2` (2026-08-17, fixed one assertion that had drifted page-wide instead of Billing-panel-scoped). Both are separately DoD'd on their own stories — not scope creep on `c2` itself, just noting the file has an active, well-maintained history since this story shipped it.

---

## Scope Deviations

None identified in this retroactive pass — see note above re: later stories' legitimate extensions of this file.

---

## Test Plan Coverage

**Tests passing in CI:** 11/11, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

**Settings/account discoverability (Metric 3)**
Signal: on-track
Evidence: Same reasoning as `c1` — actively extended by 3 later, independently-verified stories (`bpe-s1`, `bse-s1`, `si-s2`) without structural rework, and directly live-verified today via real staging clicks.
Date measured: 2026-08-17

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live in production. This is the single most actively-extended file from this entire 14-story batch (3 separate later stories built on it), and every one of those extensions has its own DoD already on record — strong signal this story's original design was sound and extensible.
