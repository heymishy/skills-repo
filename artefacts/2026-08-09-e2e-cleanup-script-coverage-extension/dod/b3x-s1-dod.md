# Definition of Done: Extend the existing staging-cleanup script's matching pattern and table coverage to close three real gaps

**PR:** https://github.com/heymishy/skills-repo/pull/703 | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/stories/b3x-s1-cleanup-script-coverage-extension.md
**Test plan:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/test-plans/b3x-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-e2e-cleanup-script-coverage-extension/dor/b3x-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `isTaggedForE2E('bri-s3-2-1784957724823-344530@example.test')` returns `true` | `tests/check-b3-cleanup-script.js` — "AC1 (b3x-s1)" | None |
| AC2 | ✅ | All 3 pre-existing `isTaggedForE2E` unit tests pass unmodified (prefix match, lookalike rejection, case/type rejection) | `tests/check-b3-cleanup-script.js` — pre-existing AC2 suite, re-run unchanged | None |
| AC3 | ✅ | Tenant-less journey + its `artefacts` row both deleted; delete order verified (artefacts before journey, FK-safe) | `tests/check-b3-cleanup-script.js` — "AC3 (b3x-s1)" | None |
| AC4 | ✅ | Tagged `credits`/`tenant_plan`/`user_roles` rows all deleted | `tests/check-b3-cleanup-script.js` — "AC4 (b3x-s1)" | None |
| AC5 | ✅ | Real (non-tagged) rows in all four newly-covered tables survive `run()` untouched | `tests/check-b3-cleanup-script.js` — "AC5 (b3x-s1)" | None |
| AC6 | ✅ | Dry-run reports eligible rows for all new tables; zero DELETE statements issued against them | `tests/check-b3-cleanup-script.js` — "AC6 (b3x-s1)" | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The `decisions.md` "Staging test-data accumulation" RISK entry was not touched (its own AC3 test — asserting the entry's implemented/running language — passes unmodified); the CLI wrapper's flag parsing and `DATABASE_URL`/`STRIPE_SECRET_KEY` wiring were not touched; `--execute` was not run against real staging (explicitly out of scope, remains a separate operator action).

**Note on story history:** an earlier draft of this work mistakenly began building a brand-new, duplicate cleanup script on the false premise that no teardown mechanism existed at all. This was caught before any commit landed (via `git add` showing the file as modified rather than added) and fully reverted; the real, already-merged script (`b3-staging-test-data-cleanup`, PR #561) was then correctly extended instead. Recorded here for traceability, not as a defect in the merged code.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (new) + 11 / 11 (pre-existing regression) = 16 / 16
**Tests passing in CI:** 16 / 16

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: `@example.test` suffix matching | ✅ | ✅ | New |
| AC2: zero regression to existing prefix-matching behaviour | ✅ | ✅ | 11 pre-existing tests re-run unmodified |
| AC3: tenant-less journey + artefacts deletion | ✅ | ✅ | New |
| AC4: credits/tenant_plan/user_roles deletion | ✅ | ✅ | New |
| AC5: real-row false-positive safety, all new tables | ✅ | ✅ | New |
| AC6: dry-run safety, all new tables | ✅ | ✅ | New |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Safety (primary) — additive-only broadening, no new false-positive path | ✅ | AC2 (11/11 pre-existing tests unchanged) + AC5 (false-positive safety across every newly-covered table) both pass |
| Auditability — per-record `_logDeletion` extends to new record types | ✅ | Code review + test output confirms `journey`/`creditsRow`/`tenantPlanRow`/`userRolesRow` audit lines are emitted using the existing mechanism, no new logging code added |

---

## Metric Signal

No metrics defined for this short-track feature (`metrics: []` in `pipeline-state.json`) — direct correctness fix, no formal benefit-metric artefact per the story's Benefit Linkage section.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Actually running `--execute` against real staging to clear the ~1000 tenant-less journeys and the 1833-row Credits-page pollution found this session is a separate, explicit operator action — this story only builds and tests the mechanism.
- `credit_audit_log`, `organisations`, `impersonation_audit_log` remain uncovered by design (not implicated in any observed symptom) — noted as a possible future pass if a similar pollution symptom is ever observed against those tables.

---

## DoD Observations

1. Same `pipeline-state.json` merge-hotspot pattern as `rps-s1`/`jpws-s1`: this branch needed conflict resolution against master **twice** (once when `rps-s1` merged first, once when `jpws-s1` merged second, since this was the last of the three PRs to land). Each time resolved by keeping every feature as its own separate array entry in the `features` array rather than letting one insertion silently overwrite another's. All three stories' regression suites (16 + 13 + 3 + 14 = 46 relevant tests across the three merges) were re-run after each conflict resolution with zero failures. This is a `/improve` candidate: three short-track stories landing in the same session, all appending to the same JSON array's tail, produced the identical conflict shape three times in a row — a structural (not incidental) collision worth a standards note if this volume of parallel short-track work recurs.
2. This story is the direct closure of the "zero E2E teardown" finding logged earlier in this session's `capture-log.md` — that log entry should be corrected/annotated to reflect that a real mechanism did exist (with the three gaps this story closes), since the original entry inaccurately claimed no teardown mechanism existed anywhere. Flagged for a follow-up `capture-log.md` correction, not a defect in this story's own delivery.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for b3x-s1 (cleanup-script coverage extension).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
