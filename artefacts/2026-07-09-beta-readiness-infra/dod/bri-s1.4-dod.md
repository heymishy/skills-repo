# Definition of Done: Wire tenant-level flag targeting via PostHog group analytics

**PR:** https://github.com/heymishy/skills-repo/pull/454 | **Merged:** 2026-07-11
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.4-tenant-level-targeting-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.4-tenant-level-targeting-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Two users in the same tenant calling `isEnabled()` with their respective session context receive the identical flag value | automated test | None |
| AC2 | ✅ | A flag targeted at tenant X in PostHog returns `true` for a tenant-X user and `false` for a different tenant's user | automated test | None |
| AC3 | ⚠️ | Unit-level: first-time group registration does not error; delayed/failed registration falls back to the safe default — fully true of the `identifyTenantGroup()` function in isolation | automated test (unit-level only) | **`identifyTenantGroup()` is never called from any live request path** — see Scope Deviations. The AC's own "when the group-identification call runs for the first time" premise never occurs in production, because nothing triggers that call |
| AC4 (Acceptance Criterion 4) | ✅ | Solo-tenant customer (today's default) uses the same per-tenant targeting mechanism with no special-casing — regression-proof | automated test | None |
| D37 wiring task — real `groupIdentify()` wired | ⚠️ | I5: `adapter.groupIdentify("tenant", "acme")` invokes `client.groupIdentifyImmediate({groupType:"tenant", groupKey:"acme"})` — the **adapter-level** wiring is real | automated test | The adapter-to-PostHog-client wiring is real and correct; the **caller-level** wiring (something in the live app actually calling `identifyTenantGroup()`) does not exist. D37's own mandate requires the wiring to be "verified by a test or smoke check" that proves real behaviour, not just that a function reference resolves — I5 proves the adapter functions correctly if called, not that it is ever called |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-11, DESIGN, implementation-plan):** this story implements the tenant-group-targeting mechanism and the D37 (injectable adapter rule) real-adapter wiring (`posthog-config.js`'s `groupIdentify`) in full, but does **not** add a live-request-handler call site that actually invokes `identifyTenantGroup()` during a real session — because bri-s1.3 (session-start bootstrap), the story that owns that call site, was not yet implemented at the time bri-s1.4 was built. The DoR contract's own Assumptions section anticipated exactly this ordering ("this story's wiring point is inside S1.3's existing bootstrap step"), with an explicit revisit trigger: "When S1.3 reaches implementation, confirm its bootstrap flow calls `identifyTenantGroup(...)` ahead of its own `isEnabled()` calls."

**This DoD independently re-verified that revisit trigger against the current merged code rather than trusting the decisions.md note, per this pipeline's standing instruction to verify downstream wiring directly. Finding: the trigger was never actually closed.** `grep -rn "identifyTenantGroup" src/` shows the function is defined and exported from `posthog-flags.js` (line 128) and referenced only in comments elsewhere — it is not called from `flag-bootstrap.js` (bri-s1.3's bootstrap module, read in full — it only calls `isEnabled()`), not from any route handler, and not from `server.js` (which wires an inert `groupIdentify: async function() {}` no-op stub for the test-mode adapter, but never wires a call to the wrapper function `identifyTenantGroup()` itself). The only place `identifyTenantGroup` is referenced anywhere in `tests/` is its own unit test file (`check-bri-s1.4-tenant-level-targeting.js`), which calls it directly as a unit under test — not as part of an integration/E2E flow that exercises a real request.

**Practical impact is partial, not total, because of how the mechanism was built:** `isEnabled()`'s own `_sanitizeContext`/`_withTenantGroup` logic (in `posthog-flags.js`) already auto-derives a `groups: { tenant: context.tenantId }` object on *every* flag-evaluation call, independent of whether `identifyTenantGroup()` was ever separately invoked — so AC1/AC2 (same flag value across tenant members; a tenant-targeted flag evaluates correctly per tenant) are still exercised correctly by the evaluate-flag call itself, and are genuinely covered by this story's passing tests. What is missing is the separate, explicit PostHog group *identify* event (`$groupidentify`) that AC3 describes registering — this is what would give PostHog's dashboard a populated group record (name, properties) for each tenant, which `decisions.md`'s ASSUMPTION entry (2026-07-09, validating the Group Analytics approach) treats as part of the intended mechanism, not an optional extra.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11
**Tests passing in CI:** 11 / 11 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (identical value across tenant members) | ✅ | ✅ | |
| AC2 (tenant-targeted flag) | ✅ | ✅ | |
| AC3 (first-time group registration, delayed/failed fallback) | ✅ | ✅ | Test passes and is correct at the unit level — it does not and cannot detect that the function under test is never called in production, since that's a wiring/integration gap, not a unit-behaviour gap |
| AC4 (solo-tenant regression) | ✅ | ✅ | |
| I5 (D37 wiring: `groupIdentify` → real `groupIdentifyImmediate`) | ✅ | ✅ | Same caveat — proves the adapter is correct, not that anything calls it |

**Gaps (tests not implemented):** None at the unit level — the test plan's own tests are all implemented and pass. The gap found in this DoD (see Scope Deviations) is a live-integration wiring gap that no test in the plan was designed to catch, since the test plan itself scoped this story to the mechanism and adapter, not the caller.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Group identification adds ≤100ms within the 200ms session-bootstrap budget | ✅ | No timing violation found in the automated test run |
| `tenantId` for group targeting read from `req.session.tenantId`, never client-supplied | ✅ | Confirmed via code review — consistent with ADR-025 |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Feature flags toggle without a redeploy | ✅ (0) | Not yet — the mechanism is real and tested, but "consistent across all users in a tenant" is only concretely demonstrated once a real flag/route is wired at bri-s1.5 | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Action required, real gap, no owner yet assigned:** wire a call to `identifyTenantGroup(resolveTenantIdFromRequest(req))` into a live request path — the natural location is `flag-bootstrap.js`'s `bootstrapFlags()`, ahead of its `isEnabled()` calls, exactly as the DoR contract's own Assumptions section anticipated. Currently no route, handler, or bootstrap module calls it anywhere in `src/`. Flag evaluation targeting itself is not broken (see the practical-impact note above), but PostHog's Group Analytics dashboard will never show a populated group record for any tenant until this is wired — undermining part of the reason `decisions.md` validated adopting Group Analytics in the first place. This is a materially different, smaller-blast-radius gap than a broken AC, but it is a real, unresolved wiring gap, not a documentation nitpick.

---

## DoD Observations

1. **Primary finding of this DoD pass: a real, previously-undetected wiring gap.** `decisions.md`'s own DESIGN entry named an explicit revisit trigger for exactly this ("confirm bri-s1.3's bootstrap flow calls `identifyTenantGroup(...)`") — but nothing in this pipeline's history between bri-s1.4's merge (2026-07-11) and this DoD sweep (2026-07-14) ever actually executed that check, including bri-s1.5 (which depends on S1.1-S1.4 "all being complete" per its own Dependencies field, and would have been the natural place to close it). This is the same class of gap this pipeline's CLAUDE.md documents for `tir-s1`/`tir-s7` (a wiring test that proves a function is correct without proving it's called) — caught here only because this DoD sweep re-read the actual merged code rather than trusting the decisions.md note that the ordering was "anticipated." **Tag: /improve candidate** — the D37 (injectable adapter rule) wiring-test guidance should be extended to explicitly require a check for *caller* existence, not just adapter correctness, mirroring the existing guidance about asserting differentiated behavioural outcomes rather than mere function-reference assignment.
2. **RISK-ACCEPT already on file for a citation-hygiene issue** (`decisions.md`, 2026-07-10, definition-of-ready): the Benefit Linkage's "consistent across all users in a tenant" phrase is attributed to discovery.md when it actually traces to the epic's own Goal statement. Cosmetic only, no action needed.
3. **RISK-ACCEPT already on file for a shared, pre-existing environment baseline gap** (`decisions.md`, 2026-07-11, branch-setup): the Windows `cmd.exe` command-line-length limit on the aggregate `npm test` chain, and the missing `.github/skills/definition/SKILL.md` reference — both pre-existing, unrelated to this story, already documented for bri-s1.1/bri-s1.2/bri-s2.2. This story's own verification instead ran its test file directly (11/11) plus the two upstream files' suites to confirm no regressions.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire tenant-level flag targeting via PostHog group analytics" (bri-s1.4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the `identifyTenantGroup()` never-called finding correctly scoped (a real, if lower-severity, gap) rather than either over-stated as a broken AC1/AC2 or dismissed as a non-issue?
Report findings as HIGH / MEDIUM / LOW.
```
