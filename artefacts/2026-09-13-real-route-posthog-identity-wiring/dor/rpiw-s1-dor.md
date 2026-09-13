# Definition of Ready Checklist

## Definition of Ready: Wire real client-side PostHog identity tracking into the routes actually served in production

**Story reference:** artefacts/2026-09-13-real-route-posthog-identity-wiring/stories/rpiw-s1-wire-client-posthog-into-real-routes.md
**Test plan reference:** artefacts/2026-09-13-real-route-posthog-identity-wiring/test-plans/rpiw-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator building funnel analytics on top of this product's real PostHog project" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 12/12, each AC covered (AC4 gets 2 dedicated security tests) |
| H4 | Out-of-scope section is populated | ✅ | 5 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track instrumentation-correctness fix, per its own stated Benefit Linkage — directly requested by the operator after discovering the dead-code/wrong-route root cause |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — new shared module, two named real-route call sites, explicit exclusions for `journey.js`/`landing.js`/board-view/JSON branches |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Appends a `<script>` tag only — no visible layout change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Performance, Security, Audit all addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — the new module exports plain string-building functions, not an injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Behavioural + security tests against a well-understood existing pattern (`journey.js`'s already-audited `buildDashboardPostHogScript`) | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire real client-side PostHog identity tracking into the routes actually served in production — artefacts/2026-09-13-real-route-posthog-identity-wiring/stories/rpiw-s1-wire-client-posthog-into-real-routes.md
Test plan: artefacts/2026-09-13-real-route-posthog-identity-wiring/test-plans/rpiw-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New module: src/web-ui/modules/posthog-client-snippet.js, exporting
  buildPostHogScript(key, opts) and buildClickCaptureScript(key, selector,
  eventName). AC8 graceful degradation (empty key -> '').
- ADD to src/web-ui/routes/public.js's handleRoot -- do NOT remove or
  modify the existing _getPosthog().capture('anonymous',
  'landing_page_viewed') call. Inject the new client-side snippet + CTA
  click tracker before </body>, only when POSTHOG_KEY is set.
- ADD to src/web-ui/routes/products.js's handleGetDashboard -- only the
  non-board, non-json HTML branch. Inject identify(login,{tenant_id})
  + capture('login_completed') before </body>, only when POSTHOG_KEY
  is set.
- NEVER inject req.session.accessToken or any other token field --
  only login and tenantId, matching journey.js's existing
  buildDashboardPostHogScript security pattern exactly.
- Do NOT touch journey.js, landing.js, the ?view=board branch, the
  res.json branch, or dashboard.js's handleDashboard fallback.
- Re-run tests/check-lab-s1.2-landing-page.js and
  tests/check-wnl-s3-dashboard-no-product-entry.js unmodified -- all
  existing assertions must still pass.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — additive change to two route handlers plus a new small shared module, following an already-established, already-audited security pattern; operator explicitly requested this fix after reviewing the investigation)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-13

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
