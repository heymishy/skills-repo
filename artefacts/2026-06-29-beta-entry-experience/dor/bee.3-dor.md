# Definition of Ready — bee.3 — PostHog instrumentation

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md`
**Test plan reference:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.3-test-plan.md`
**Contract:** `artefacts/2026-06-29-beta-entry-experience/dor/bee.3-dor-contract.md`
**Assessed by:** /definition-of-ready skill (agent-auto)
**Date:** 2026-06-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So with named persona | ✅ | "As Hamish King (platform operator)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 9 ACs |
| H3 | Every AC has ≥1 test | ✅ | T1–T16 + NFR-T1/T2 cover all 9 ACs; AC4 browser-navigation gap acknowledged in gap table with manual scenario |
| H4 | Out-of-scope section populated | ✅ | 5 items: server-side SDK, feature flags, A/B tests, custom dashboards, live PostHog confirmation |
| H5 | Benefit linkage to named metric | ✅ | M3 (landing page conversion), M4 (referral attribution), M1 (activation) named with mechanism sentences |
| H6 | Complexity rated | ✅ | Complexity: 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS — 0 HIGH, 2 MEDIUM both resolved (AC7 placement committed, typeof guard added to arch constraints) |
| H8 | No uncovered ACs (or gaps acknowledged) | ✅ | AC4 browser-navigation gap acknowledged; manual Scenario 4 edge case in verification script 🔴 |
| H8-ext | Dependencies on bee.1 + bee.2; schemaDepends: [] — no schema fields consumed | ✅ | |
| H9 | Architecture Constraints populated; no Cat-E HIGH | ✅ | PostHog CDN only, POSTHOG_KEY env var, typeof guard requirement, ADR-011, ADR-018, accessToken canonical, no npm package |
| H-E2E | AC4 gap is DOM-behaviour (not CSS-layout-dependent) — H-E2E does not fire | ✅ | DOM-behaviour gap handled as manual scenario |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-06-29-beta-entry-experience/nfr-profile.md` |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | Non-regulated project |
| H-NFR3 | Data classification not blank | ✅ | Internal (PostHog event data — GitHub login, tenantId, UTM source) |
| H-NFR-profile | NFRs declared; profile exists | ✅ | |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform operator / product owner — 2026-06-29 |
| H-ADAPTER | No injectable adapters introduced | ✅ | POSTHOG_KEY is env var; snippet injection is string interpolation |
| H-INF | hasInfraTrack absent — skip | ✅ | |
| H-MIG | hasMigrationTrack absent — skip | ✅ | |

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | — |
| W2 | Scope stability: Stable | ✅ | — |
| W3 | MEDIUM findings resolved (not RISK-ACCEPT) | ✅ — AC7 fixed + typeof guard added to arch constraints | — |
| W4 | Verification script reviewed by domain expert | ⚠️ — solo-operator self-review acknowledged | Hamish King — Platform operator — 2026-06-29 |
| W5 | Gaps acknowledged (AC4 manual 🔴; PostHog live verification out of scope) | ✅ | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: bee.3 — PostHog instrumentation
Story artefact: artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md
Test plan: artefacts/2026-06-29-beta-entry-experience/test-plans/bee.3-test-plan.md
Test script: tests/check-bee3-posthog.js
Contract: artefacts/2026-06-29-beta-entry-experience/dor/bee.3-dor-contract.md

Goal:
Make every test in tests/check-bee3-posthog.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

Implementation plan:
Task 1 — Update src/web-ui/routes/landing.js (PostHog injection)
  Add a helper function buildPostHogSnippet(key):
    Returns empty string if !key
    Returns: '<script async src="https://eu-assets.i.posthog.com/static/array.js">' +
             '<script>posthog.init("' + key + '", {...})</script>'
             + '<script>' +
             'posthog.capture("landing_page_view");' +
             '</script>'
  
  Add a helper buildCtaScript(key):
    Returns empty string if !key
    Returns inline script that:
      - Adds click listener to the Sign in with GitHub CTA link
      - Handler: if (typeof posthog !== 'undefined') { posthog.capture('cta_clicked'); }
  
  In handleLanding: when key is set, inject both snippets into the response HTML.
  When key is unset (process.env.POSTHOG_KEY is falsy or ''): inject nothing.

Task 2 — Update src/web-ui/routes/journey.js (PostHog injection)
  Add helper buildDashboardPostHogScript(key, login, tenantId):
    Returns empty string if !key
    Returns: CDN snippet + inline script:
      posthog.identify(login, { tenant_id: tenantId });
      posthog.capture('login_completed');
  
  In handleJourneys: inject result of buildDashboardPostHogScript(
    process.env.POSTHOG_KEY,
    req.session.login,
    req.session.tenantId
  ) into the HTML response.
  
  CRITICAL SECURITY: inject req.session.login and req.session.tenantId only.
  NEVER inject req.session.accessToken. Test T11 asserts a canary token is absent.

Task 3 — Update src/web-ui/routes/skills.js (journey_created event)
  In handleGetChatHtml (the handler for GET /skills/:name/sessions/:id/chat):
    const key = process.env.POSTHOG_KEY;
    const journeyCreatedScript = key
      ? '<script>if (typeof posthog !== "undefined") { posthog.capture("journey_created"); }</script>'
      : '';
    Inject journeyCreatedScript into the HTML response body.

Constraints:
- Node.js CommonJS — require(), no import
- No Express
- ZERO new npm dependencies — no require('posthog-js'), no require('posthog-node')
- PostHog CDN only — the <script> tag loads from eu-assets.i.posthog.com (or equivalent PostHog CDN)
- POSTHOG_KEY from process.env.POSTHOG_KEY — never hardcoded; never in source
- Empty string treated same as unset
- req.session.accessToken MUST NOT appear in any HTML response (NFR-T1 canary test)
- req.session.accessToken is canonical — never req.session.token
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review

PostHog CDN snippet: use the standard PostHog CDN array snippet from posthog.com/docs.
The key value appears in the snippet. The snippet should be self-contained and async.

DoR grep check (must return zero results before PR opens):
  grep -rn "req\.session\.token[^A]" src/web-ui/
  grep -rn "posthog-js\|posthog-node" package.json

Security note: verify that no HTML response body contains req.session.accessToken
by running T11 in the test suite (canary token assertion).

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — Low oversight

---

## Inner coding loop

1. /branch-setup — create isolated worktree, verify clean baseline
2. /implementation-plan — Task 1 (landing page PostHog), Task 2 (dashboard PostHog), Task 3 (chat page journey_created) — name all three explicitly; bee.3 requires bee.1 and bee.2 to be merged first
3. /subagent-execution or /tdd per task
4. /verify-completion — run `node tests/check-bee3-posthog.js` + walk through bee.3-verification.md (Scenario 4 edge case 🔴 requires browser test with PostHog blocked)
5. /branch-complete — open draft PR

After PR merges: run /definition-of-done for bee.3.
