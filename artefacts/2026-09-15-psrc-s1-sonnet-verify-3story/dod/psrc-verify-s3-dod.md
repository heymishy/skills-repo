# Definition of Done: Startup drift guard — warn loudly if a governance-critical skill silently resolves to Haiku

**PR:** https://github.com/heymishy/skills-repo/pull/924 | **Merged:** 2026-09-29
**Story:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md
**Test plan:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/dor/psrc-verify-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet`, `checkModelRoutingDriftReturnsAllFiveWhenNoOverridesSet` | automated unit test | None |
| AC2 | ✅ | `serverStartupLogsOneWarningPerDriftEntry`, `serverStartupLogsNothingWhenAllFiveHealthy`, plus `serverJsWiresCheckModelRoutingDriftAtRealStartup` (source-level wiring guard) | automated integration test + wiring guard | None |
| AC3 | ✅ | `checkModelRoutingDriftReturnsExactlyOneWhenOneOverrideMissing` | automated unit test | None |
| AC4 | ✅ | `checkModelRoutingDriftNeverIncludesDiscoveryOrIdeate` | automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. `DRIFT_GUARD_SONNET_SKILLS` and `checkModelRoutingDrift(envVars)` are additive only — no existing export of `model-routing.js` was modified, and `HAIKU_BLOCKED_SKILLS`/`DEFAULT_SONNET_SKILLS` are untouched, exactly as scoped.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 7 / 7 (6 planned + 1 additional wiring-guard test added during implementation, matching this repo's own established D37-lesson convention for verifying a real call site, not just an import)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet | ✅ | ✅ | |
| checkModelRoutingDriftReturnsAllFiveWhenNoOverridesSet | ✅ | ✅ | |
| checkModelRoutingDriftReturnsExactlyOneWhenOneOverrideMissing | ✅ | ✅ | |
| checkModelRoutingDriftNeverIncludesDiscoveryOrIdeate | ✅ | ✅ | |
| serverStartupLogsOneWarningPerDriftEntry | ✅ | ✅ | |
| serverStartupLogsNothingWhenAllFiveHealthy | ✅ | ✅ | |
| serverJsWiresCheckModelRoutingDriftAtRealStartup (wiring guard) | ✅ | ✅ | Added during implementation, not in the original test plan — cheap, valuable addition |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible overhead | ✅ | 5 synchronous, in-memory function calls at startup; no I/O; confirmed via code review, not separately load-tested (appropriately, given the trivial cost) |
| Security — N/A | ✅ N/A | No new credentials, no new attack surface |
| Accessibility — N/A | ✅ N/A | No rendered UI; log-line-only feature |
| Audit — startup log is the audit trail | ✅ | `[model-routing-drift]`-prefixed `console.warn` lines, visible via `fly logs` on both real environments |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Model-routing intent matches deployed reality (drift guard, Tier 3) | ✅ — both environments confirmed correctly configured at `psrc-verify-s2` (2026-09-29) | Continuously, from the next real deploy/restart of either `wuce-staging` or `skills-framework` onward | The guard is now live in production; its own "signal" is the ABSENCE of a `[model-routing-drift]` log line going forward — the metric owner (Hamish King) should periodically spot-check `fly logs` after any Fly-secret change touching `WUCE_MODEL_OVERRIDE_*` |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. When Chrome/browser access is available again, run the originally-planned live verification (`psrc-verify-s1`'s own AC1-AC3 scenarios) as a bonus confirmation — logged as the revisit trigger in `decisions.md`, not blocking, already deferred there.
2. Fix the `2026-09-28-web-ui-learnings-and-improvements` feature's own slug typo (`weeb-ui` instead of `web-ui`) at the operator's convenience — cosmetic, logged as a separate observation below, not part of this story's own scope.

---

## DoD Observations

1. **Repo-wide `trace-validation` CI blocker found and fixed during this story's own `/verify-completion` → merge cycle, unrelated to this story's own diff.** Three real issues were surfacing as a hard-fail on PR #924 (and would have blocked every open PR in the repo, not just this one): (a) this feature's own `discovery.md` had an internal inconsistency (Status: Draft despite an Approved By line — my own authoring mistake, made when resuming the stalled 2026-09-15 discovery); (b) `pipeline-state.json` set `dorContractArtefact: null` for all 3 `psrc-verify-*` stories where the schema requires a string when the field is present — fixed by omitting the field entirely, since none of these stories has a separate DoR-contract artefact; (c) a completely unrelated, concurrently-in-progress operator feature (`2026-09-28-web-ui-learnings-and-improvements`, built live through the web UI in this same session) had a `pipeline-state.json` entry missing the schema-required `name`/`track`/`health` fields, and its `discovery.md` was not yet marked Approved. All three were fixed directly on `master` (pipeline bookkeeping, no PR required per this repo's own convention) after explicit operator confirmation for item (c). **/improve candidate:** `trace-validation`'s schema-wide and discovery-approval checks currently block CI repo-wide on ANY unrelated feature's incomplete state, rather than scoping to the current PR's own diff — worth considering whether these specific checks should be scoped to only the features a PR's diff actually touches, or at minimum surfaced as a non-blocking warning for unrelated features. Not fixed here — flagged for a future `/improve` review of `scripts/validate-trace.sh`/`scripts/validate-trace.ps1`.
2. **The deployed web UI's own commit-writing mechanism produced a schema-invalid `pipeline-state.json` entry** (missing `name`/`track`/`health` entirely) for the `2026-09-28-web-ui-learnings-and-improvements` feature. This suggests the web UI's own commit-writer path may not always populate the full required schema when creating a new feature entry — worth a `/improve` investigation into that write path specifically, separate from the `trace-validation` scoping question above.
3. **Local trace-validation tooling required a `python3` shim on this Windows environment** — `scripts/validate-trace.sh` invokes `python3` directly, which resolves to a broken Windows Store app-execution-alias stub rather than a real Python install on this machine. Worked around locally via a temporary `PATH` shim (`python3` → the real `python.exe`); not a repo bug (works correctly in the real Linux CI environment), but worth noting for any other Windows-based local development on this repo.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for psrc-verify-s3 (startup drift guard for governance-critical model routing).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
