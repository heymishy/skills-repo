# Definition of Done: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**PR:** https://github.com/heymishy/skills-repo/pull/982 | **Merged:** 2026-10-13
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s5-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s5-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Cross-tenant placeholder-feature creation → 404, zero writes. `check-jcx-s5-authorization.js`: "AC1: cross-tenant placeholder-feature creation returns 404 and makes zero writes" | `integration-real-code` | None |
| AC2 | ✅ | Cross-tenant trigger → 404, no folder/state created. `check-jcx-s5-authorization.js`: "AC2: cross-tenant trigger returns 404, no folder or pipeline-state entry created" | `integration-real-code` | None |
| AC3 | ✅ | Viewer-role session → 403, real server dispatch. `check-jcx-s5-authorization.js`: "AC3" — real `server.js` router dispatch via a seeded viewer-role session (`login: 'e2e-viewer'`), reusing `check-vrne-s4-edge-case-gate.js`'s own harness verbatim; confirms `requireNonViewer` is wired on both routes, not just assumed | `integration-real-code` (real server dispatch) | None |
| AC4 | ✅ | Cross-tenant mapping-conversion → 404, no partial conversion. `check-jcx-s5-authorization.js`: "AC4: cross-tenant mapping-conversion returns 404 with zero partial conversion" — confirms the tenant-scoped journey-row SELECT 404s before `checkPlaceholderConversions` ever runs | `integration-real-code` | None |
| AC5 | ✅ | No regression. Full suite run: 744 files, 0 failed | `full-suite` | None |

### Verification strength summary
- `integration-real-code`: 4 (all 4 ACs, including one real `server.js` router dispatch)
- `live-verified`: 0 — not required; no AC in this story is UI/browser-dependent (see note below)

### UI-evidence gate
Not applicable. Every AC in this story is integration/handler-level (direct handler calls or a real server-router dispatch), with no CSS-layout or visual-rendering component. None of this session's recurring local-dev-server-hang / no-fresh-browser-session blockers apply here — no RISK-ACCEPT was needed for this story.

---

## Scope Deviations

None. No production code changed. A pre-read of `src/web-ui/server.js` (lines 4105–4123) before writing any test confirmed both the placeholder-creation and trigger routes were already wired through `authGuard` → `requireNonViewer` → handler, matching every other mutating route in this file. All 4 tests passed on the first run — unlike the `ic-s2` precedent this story cites (where an independent check found and fixed a genuinely missing gate), this verification pass found the wiring already correct.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4
**Tests passing in CI:** 4/4 — confirmed via PR #982 (all 8 checks green)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (cross-tenant creation) | ✅ | ✅ | |
| AC2 (cross-tenant trigger) | ✅ | ✅ | |
| AC3 (viewer-role, real dispatch) | ✅ | ✅ | Tested both routes in one test case |
| AC4 (cross-tenant conversion) | ✅ | ✅ | |

**Gaps (tests not implemented):** None. AC5 is verified by the full suite run itself, per the test plan's own scoping (not a dedicated test).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none beyond existing route bounds | ✅ N/A | No new runtime code paths |
| Security — this story's entire purpose | ✅ | AC1–AC4 above |
| Accessibility — not applicable | ✅ N/A | Verification-only, no new UI surface |
| Audit — denied attempts observable via the existing logging convention | ✅ | AC3's real-dispatch test output includes `{"event":"viewer_write_denied","personId":9002,"tenantId":"e2e-jcx-s5-integration",...,"route":"/journeys/j1/stages/s1/placeholder-features"}` (and the equivalent for the trigger route) — confirms the existing `requireNonViewer` audit-logging convention already covers this new trigger surface, with no additional wiring needed |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Placeholder-feature trigger actually used | ✅ (baseline: feature not yet shipped) | Not yet | This story is what makes M2's growth safe to encourage (per the story's own Benefit Linkage) — the trigger surface is now independently confirmed safe against cross-tenant leakage and viewer-role mutation. The actual usage-growth signal requires real post-merge usage time, not inferable from code. |

**Measurement-ready gate:** Not yet.
**Evidence note:** The safety precondition for M2 is now confirmed; the usage-growth measurement itself needs real post-merge time.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE — NO DEVIATIONS**

This is the first story in the `journey-map-and-placeholder-trigger` epic to close with zero RISK-ACCEPTs and zero scope deviations — every AC had direct, strong evidence (including a real `server.js` router dispatch for the one AC that specifically required it), and no gap was found in the routes it verified.

**Follow-up actions:**
1. **Owner: future session, now unblocked.** The operator has logged into a real `wuce-staging.fly.dev` session (as of this session). This unblocks a live Chrome re-verification of the RISK-ACCEPTed visual/UI items across `jcx-s1`–`jcx-s4` (emotion curve rendering, persona card interaction, placeholder-trigger UI) — the exact blocker every prior RISK-ACCEPT entry in `decisions.md` named as its own revisit trigger. This is the natural next action now that the epic's final story has merged.
2. **Owner: future session, product.** Now that the full epic is shipped, solicit the operator's own direct M1 judgment (CX quality vs. the 3 reference examples) and observe M2/M3 usage signals with real post-merge time.

---

## DoD Observations

1. This story's own `/clarify`-confirmed authorization model (uniform non-viewer check, no new permission tier) held on the first real check — a useful contrast to `ic-s2`'s own precedent (where the same class of check DID find a real gap). Both outcomes are valuable: this one confirms the pattern-copying convention this codebase relies on (new mutating routes copying `authGuard`→`requireNonViewer` from an adjacent route) is actually reliable when followed, not just assumed to be.
2. With this story merged, all 5 stories in the `journey-map-and-placeholder-trigger` epic (`jcx-s1` through `jcx-s5`) are now DoD-complete. Epic status should be recomputed to `complete`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-s5 (authorization/tenant-scoping verification).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is it reasonable that zero RISK-ACCEPTs were needed, given every AC is integration/handler-level rather than UI-dependent?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Should the epic's own status now be recomputed to complete, given all 5 stories show dodStatus: complete?
Report findings as HIGH / MEDIUM / LOW.
```
