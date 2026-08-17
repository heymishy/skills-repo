# Definition of Done: Render the product view grouped by module with dual health/coverage indicators and a scale gauge

**PR:** https://github.com/heymishy/skills-repo/pull/531 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a4-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/a4-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (epics grouped under module, Unassigned section) | ⚠️ | `check-a4-module-grouped-rendering.js`, structural markup test | Automated test only in this pass — see live-check note | None found, but not live-observed |
| AC2 (health/coverage as two distinct indicators) | ⚠️ | Same file | Automated test only | Not live-observed |
| AC3 (scale gauge with epic/story counts + proportional visual) | ⚠️ | Same file | Automated test only | Not live-observed |
| AC4 (zero-module ungrouped fallback renders cleanly, no console error) | ✅ | Live-verified 2026-08-17 on `wuce-staging.fly.dev` (`Canned products`, `test product` — both zero-module accounts) | Manual, via Chrome | None |
| AC5 (smooth expand/collapse transition, not instant snap — flagged `hasLayoutDependentGaps` at DoR) | ⚠️ | `check-a4-module-grouped-rendering.js`: "module section markup includes the CSS transition rule and a toggle handler (structural precondition for AC5)" | Automated structural test only | CSS presence confirmed, actual smoothness not visually confirmed |

11/11 (`check-a4-module-grouped-rendering.js`) + 5/5 (`check-a4-session-store-state.js`) assertions pass fresh on current master.

**Live-check limitation (honest gap, not a failure):** every staging product account checked (`Canned products`, `test product`) has zero modules configured, so only the AC4 fallback state was directly observable. AC1/AC2/AC3/AC5 — the actual grouped-rendering behaviour this story exists to deliver — could not be live-observed without first creating test modules and assigning epics to them, which was judged out of scope for a backlog DoD pass (would mean modifying real product data rather than just observing it). AC1–AC3/AC5 rest on automated test coverage only in this pass.

---

## Scope Deviations

None identified in code; see the live-check limitation above for an evidence-quality gap.

---

## Test Plan Coverage

**Tests passing in CI:** 16/16 (11 + 5), re-run fresh 2026-08-17.
**Gaps:** Live/visual confirmation of grouped rendering (AC1–AC3, AC5) — not exercised in this pass, no test data available with modules configured.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

**Time to identify the least-healthy area of a large product (Metric 1)**
Signal: not-yet-measured
Evidence note: `a4` is the primary UI surface for this metric, but no product in the checked staging accounts actually uses modules yet — real-world adoption of the module-grouping feature itself appears to be near-zero, which is itself a signal worth the operator's attention (the feature may be under-adopted or under-discovered, separate from whether it works correctly).
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] Consider a real live check of AC1/AC2/AC3/AC5 (grouped rendering, dual indicators, scale gauge, expand/collapse smoothness) on a product that actually has modules configured — none was available in this pass. Low urgency given 16/16 automated tests pass and no user reports of grouping issues.
- [Owner: Hamish King] Separately worth noting: apparent near-zero real adoption of the Modules feature itself across checked staging products — may be worth a quick look at whether module creation is discoverable enough (not a defect in this story, an adoption/UX observation).

---

## DoD Observations

1. **Live-check attempted honestly, with a real environment constraint surfaced rather than glossed over**: rather than either skipping the live check entirely or fabricating a "confirmed" claim for ACs that weren't actually observable, this DoD records exactly what was and wasn't verified live, and why (no test data available). This is consistent with the general principle that "attempted and inconclusive" is a more honest and useful DoD signal than a false confirmation.
2. This pass also surfaced a separate, related finding on `d2` (same feature, same live-check session) — see `d2-dod.md` and the new follow-up story `artefacts/2026-08-17-impersonation-banner-dashboard-gap/`.
