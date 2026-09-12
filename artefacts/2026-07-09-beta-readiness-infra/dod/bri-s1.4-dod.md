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
| AC3 | ✅ — **closed 2026-09-12 by `tgid-s1`** | `tgid-s1` (merged, DoD-complete) added the missing caller-level wiring: `identifyTenantGroup(tenantId)` is now called inside `bootstrapFlags()` (`flag-bootstrap.js`), bounded by the same `_withTimeout` wrapper already used for flag resolution, skipped when no `tenantId`, called once per session — exactly the call site this DoD's own Follow-up Action named. | `tgid-s1`'s own DoD, 6 tests passing (U1-U5, N1) | None — closed |
| AC4 (Acceptance Criterion 4) | ✅ | Solo-tenant customer (today's default) uses the same per-tenant targeting mechanism with no special-casing — regression-proof | automated test | None |
| D37 wiring task — real `groupIdentify()` wired | ✅ — **closed 2026-09-12 by `tgid-s1`** | I5: `adapter.groupIdentify("tenant", "acme")` invokes `client.groupIdentifyImmediate({groupType:"tenant", groupKey:"acme"})` — the adapter-level wiring was already real; `tgid-s1` closed the caller-level gap, so the full D37 chain (adapter correctness + caller existence) is now proven end-to-end. | `tgid-s1`'s own DoD | None — closed |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None remaining. **Closed 2026-09-12 by `tgid-s1`** — see AC3/D37 rows above. Originally: this story implemented the tenant-group-targeting mechanism and the D37 (injectable adapter rule) real-adapter wiring (`posthog-config.js`'s `groupIdentify`) in full, but did not add a live-request-handler call site that actually invokes `identifyTenantGroup()` during a real session, because bri-s1.3 (session-start bootstrap), the story that owns that call site, was not yet implemented at the time bri-s1.4 was built. `tgid-s1` closed that gap directly.

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

**COMPLETE**

**Follow-up actions:**
- ~~Action required, real gap: wire a call to identifyTenantGroup(...) into a live request path...~~ — **Done (`tgid-s1`, merged 2026-09-12).** Wired into `flag-bootstrap.js`'s `bootstrapFlags()`, exactly as this DoD's own Follow-up Action specified.

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
