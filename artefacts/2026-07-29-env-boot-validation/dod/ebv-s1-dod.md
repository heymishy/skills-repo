# Definition of Done: Warn at boot time for silently-misconfigured-but-optional env vars

**PR:** https://github.com/heymishy/skills-repo/pull/637 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-env-boot-validation/stories/ebv-s1-boot-time-env-var-warnings.md
**Test plan:** artefacts/2026-07-29-env-boot-validation/test-plans/ebv-s1-boot-time-env-var-warnings-test-plan.md
**DoR artefact:** artefacts/2026-07-29-env-boot-validation/dor/ebv-s1-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `warnOnOptionalEnvVars()` (merged, on master) warns naming `PLATFORM_TENANT_ID` and "self-registration" when unset | Automated test (`node tests/check-ebv-s1-boot-time-env-var-warnings.js`, U1-U2), re-run against merged master | None |
| AC2 | ✅ | Warns naming `ADMIN_GITHUB_LOGINS` and "admin/credits" when unset or empty-after-parsing | Automated test (U3-U5), re-run against merged master | None |
| AC3 | ✅ | Warns naming `SKILL_EXECUTOR_PROVIDER`/`ANTHROPIC_API_KEY` when the anthropic (default) provider is missing its key | Automated test (U6-U8), re-run against merged master | None |
| AC4 | ✅ | Warns about the per-user Copilot-license caveat when provider is explicitly `copilot` — the exact shape of the real incident this closes | Automated test (U9-U10), re-run against merged master | None |
| AC5 | ✅ | A fully-configured environment emits zero warnings — confirmed as a regression guard | Automated test (U11), re-run against merged master | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged PR touches only `src/web-ui/config/validate-env.js` (new function), `src/web-ui/server.js` (one new import, one new call site alongside the existing hard-fail check), and the new test file — matching the story's estimated touch points exactly. `POSTHOG_KEY_STAGING`/`POSTHOG_KEY_PROD` were confirmed untouched, per the story's own Out of Scope section and the decisions.md entry explaining why (already correctly handled by existing code).

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11
**Tests passing in CI:** 11 / 11

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1-U2 (AC1) | ✅ | ✅ | Re-run against merged master code today |
| U3-U5 (AC2) | ✅ | ✅ | Re-run against merged master code today |
| U6-U8 (AC3) | ✅ | ✅ | Re-run against merged master code today |
| U9-U10 (AC4) | ✅ | ✅ | Re-run against merged master code today |
| U11 (AC5) | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** One permanent, accepted gap, documented in the test plan itself: whether an operator actually notices the warning in `flyctl logs` in practice is a behavioural/human-attention outcome, not a code property, and cannot be tested automatically. Confirmed by the absence (or presence) of a repeat of this exact incident class going forward.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible, a handful of `process.env` reads at boot | ✅ | Confirmed by design; no I/O, no new dependency |
| Security — no secret values logged, only variable names and static consequences | ✅ | Confirmed by code review — matches `posthog-config.js`'s own "never log the key value itself" convention exactly |
| Audit — every warning names the specific variable and concrete consequence | ✅ | Confirmed by every unit test's message-content assertion (U1, U3, U6, U9 all assert specific text, not a generic "some vars missing" message) |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-env-boot-validation` has an empty `metrics: []` in `pipeline-state.json` — short-track infra fix, no benefit-metric artefact). The story's own Benefit Linkage section quantifies the problem directly (4 documented incidents, 1 already resolved by prior work, 3 closed by this story) rather than a formal metric; ongoing confirmation is the absence of a repeat incident in this exact shape, tracked as the same gap already named in Test Plan Coverage.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Passive: observe the next staging/production environment stand-up or misconfiguration for whether the new warnings are noticed and act as intended — no explicit action owner needed, this is passive confirmation via normal `flyctl logs` observation.

---

## DoD Observations

1. This story closes out the "biggest benefit first" prioritized list from this session's capture-log/learnings review: `gav-s1` (gate-advance validation), `dta-s1` (domain-tag standards injection), and now `ebv-s1` (boot-time env-var warnings), plus the `cif-s2` fix that surfaced along the way. All four are merged and DoD-complete.
2. Investigating this story's own scope (checking `posthog-config.js`'s actual current behaviour before writing the story) avoided building redundant or conflicting logic for a case that was already correctly handled — a concrete instance of "verify before assuming a documented gap is still open," worth reinforcing as a standing practice when working from a capture-log/learnings synthesis that may itself be stale relative to intervening fixes.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Warn at boot time for silently-misconfigured-but-optional env vars" (ebv-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
