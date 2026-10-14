# Definition of Done: Seed a new journey with a default starting-skeleton template

**PR:** https://github.com/heymishy/skills-repo/pull/988 | **Merged:** 2026-10-14
**Story:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s1.md
**Test plan:** artefacts/2026-10-14-journey-authoring-experience/test-plans/jae-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-14-journey-authoring-experience/dor/jae-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "+ New journey" modal renders the checkbox, checked by default — confirmed via direct markup inspection | `unit` | None |
| AC2 | ✅ | Checked submission seeds exactly 5 stages (Evaluate/Discover/Purchase/Onboard/Retain), name/position only, defaults to seeding when the field is omitted entirely | `integration` | None |
| AC3 | ✅ | Unchecked submission seeds zero stages | `integration` | None |
| AC4 | ✅ | Every seeded stage carries the journey's own `tenant_id`, confirmed by direct parameter inspection | `integration` | None |

### Verification strength summary
- `unit`: 1
- `integration`: 3
- `live-verified`: 1 (AC1/AC2) — confirmed 2026-10-14 on `wuce-staging.fly.dev`: created a new journey with the "Start with a default stage outline" checkbox checked (default-on, matching AC1); the 5-stage skeleton (Evaluate/Discover/Purchase/Onboard/Retain) rendered correctly on the Canvas view immediately after creation, matching AC2. AC3 (unchecked → zero stages) and AC4 (tenant scoping) were not separately re-exercised live — already covered by integration tests, no live-only risk identified for either.

---

## Scope Deviations

None. All 4 ACs implemented exactly as scoped; the Out of Scope section's items (template library, pre-filled field content, editable skeleton names) were correctly not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing in CI:** confirmed via PR #988 — all CI checks green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit) | ✅ | ✅ | |
| AC2 (integration) | ✅ | ✅ | Includes the field-omitted-defaults-to-true edge case |
| AC3 (integration) | ✅ | ✅ | |
| AC4 (integration) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | 5 sequential INSERTs within the existing transaction, no perceptible delay expected; not separately measured live |
| Security | ✅ | AC4 directly verifies no new tenant-isolation gap |
| Accessibility | ✅ | Native, labeled checkbox — default HTML semantics cover keyboard operability |
| Audit | ✅ N/A | No new mutating action beyond the existing journey/stage creation routes |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Fields populated without manual prompting | `[UNKNOWN BASELINE]` — pending pre-release DB query | Not yet | This story is the template-seeding half of M2's own mechanism; `jae-s3`'s field suggestions are the other half |
| M1 — Time-to-first-complete stage | Not yet established | Not yet | Secondary contribution — removes the "what do I name my first stage" hesitation |

**Measurement-ready gate:** Not yet — both metrics need their own baseline measurement before/shortly after this epic's 3 stories are all live.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE — NO DEVIATIONS**

**Follow-up actions:**
1. ~~Live-verify this story on staging~~ — **Done, 2026-10-14.** Confirmed on `wuce-staging.fly.dev` (see Verification strength summary above). The Customer-experience view's own rendering of the 5-stage skeleton was not separately re-checked live (Canvas view confirmation was sufficient to validate the seeding mechanism itself, which both views read from the same underlying data).
2. **Owner: future session, product.** ~~Run the real pre-release baseline DB query for M2~~ — **Done, 2026-10-14** (see `benefit-metric.md` M2 and commit `bf011bbf`). Caveated as staging-test-data, not a clean baseline.

---

## DoD Observations

1. This story's own implementation was the simplest of the 3 in the epic (Complexity 1) and shipped with zero review findings and zero deviations — a useful calibration point against `jae-s2` (which had a real review-caught defect, 1-H1) for how much variance exists even within one small, tightly-scoped epic.
