# Definition of Done: Close the usage-cap bypass in the "add feature from within a product" flow

**PR:** https://github.com/heymishy/skills-repo/pull/651 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-product-feature-cap-bypass/stories/pfcb-s1-product-feature-cap-bypass.md
**Test plan:** artefacts/2026-07-30-product-feature-cap-bypass/test-plans/pfcb-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-product-feature-cap-bypass/dor/pfcb-s1-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-04

**Note:** Short-track story (bug fix). Per CLAUDE.md, short-track skips discovery through review but DoD still applies — this artefact closes a gap where no short-track story in this repo's history had previously reached DoD before merging.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: handlePostProductFeature blocks with 402 when the tenant is already at the journey cap` | automated test | None |
| AC2 | ✅ | `AC2: no journey is created in the store when the cap check blocks the request` | automated test | None |
| AC3 | ✅ | `AC3: handlePostProductFeature still succeeds (real redirect, no 402) when under the cap` | automated test | None |
| AC4 | ✅ | `AC4: no cap configured (unlimited) -- unchanged pre-existing behaviour, no 402` | automated test | None |
| AC5 | ✅ | `AC5: paid + active plan state lifts the cap entirely, same as the standalone /journey form` | automated test | None |
| AC6 (regression guard) | ✅ | All 6 named existing test files independently re-run: `check-jrf-s1-new-feature-redirect.js` (5/5), `check-jrf-s2-register-product-feature-journeys.js` (6/6), `check-fdn-s1-feature-display-name.js` (15/15), `check-pnfc-s1-product-feature-choice.js` (5/5), `check-psh-s4-navigation.js` (6/6), `check-pan-s1-product-aware-navigation.js` (29/29) | automated test, independently re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 3 items in the story's Out of Scope section (gating product creation itself, changing the cap mechanism/value, auditing every other route for the same gap class) were correctly left untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: blocks with 402 at cap | ✅ | ✅ | |
| AC2: no journey created when blocked | ✅ | ✅ | |
| AC3: succeeds under cap, no regression | ✅ | ✅ | |
| AC4: unconfigured cap unchanged | ✅ | ✅ | |
| AC5: paid/active plan lifts cap | ✅ | ✅ | |

Independently re-confirmed on master (2026-08-04): 5/5 passing.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible added cost (one listJourneys scan + cap lookup) | ✅ | Identical cost profile to the already-shipped standalone-form gate, confirmed by code review (same `tenantPlan.checkJourneyCap` call, same `journeyStore.listJourneys` pattern) |
| Security — closes a business-logic bypass, no new attack surface | ✅ | Confirmed: this is a usage-policy fix (unlimited free usage), not a data-exposure issue |
| Accessibility — reuses existing 402 page markup unchanged | ✅ | Confirmed via `_htmlShell.renderShell`, same as the standalone form |
| Audit — console.error on blocked request | ✅ | Confirmed in test output (`[handlePostProductFeature] Journey limit reached for tenant...`) |

---

## Metric Signal

No feature-level metrics defined for this story (short-track bug fix, no `benefit-metric.md`). Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None blocking. The story's own Out of Scope section names one legitimate `/improve` candidate: auditing every other route in the codebase for a similarly-missed cap-gate, since this specific instance was found only by direct operator testing, not a systematic audit.

---

## DoD Observations

1. **Also a real production/live-usage finding, not hypothetical:** the operator personally signed up a new account, deliberately skipped Stripe checkout, and found unlimited feature creation via a second, ungated entry point — the standalone `/journey` form correctly enforced the cap (from an earlier story, `s2.1`), but `handlePostProductFeature`'s separate code path had simply never been wired to the same check. A clean instance of "the same policy enforced in two places, only one of which was actually updated when the policy was introduced."
2. Same pattern as `pfgd-s1`: sat at `prStatus: merged` with no `dodStatus` for several days, only surfaced by an explicit operator request to review everything in flight, not by any pipeline gate.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Close the usage-cap bypass in the add-feature-from-within-a-product flow".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Are any scope deviations or follow-up actions that should block release not flagged?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
