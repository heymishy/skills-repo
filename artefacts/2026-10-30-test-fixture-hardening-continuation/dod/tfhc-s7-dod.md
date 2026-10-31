# Definition of Done: Extract a shared mockReq/mockRes fixture module for journeys.js tests

**PR:** https://github.com/heymishy/skills-repo/pull/1046 | **Merged:** 2026-10-31
**Story:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s7-journeys-js-fixture-walking-skeleton.md
**Test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s7-journeys-js-fixture-walking-skeleton-test-plan.md
**DoR artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s7-dor.md
**Assessed by:** Copilot
**Date:** 2026-10-31

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/helpers/journeys-fixture.js`'s default session is exactly `{ tenantId: 'org-1' }` — re-confirmed fresh against merged master via direct read | integration-real-code | None |
| AC2 | ✅ | `node tests/check-journeys-fixture-self-test.js` → 3/3 passed, re-run fresh on merged master | integration-real-code | None |
| AC3 | ✅ | `node tests/check-ep3-s2-journey-health.js` → 6/0, re-run fresh on merged master, identical to pre-migration baseline | integration-real-code | None |
| AC4 | ✅ | `node scripts/check-journeys-fixture-usage.js` against both AC4 fixtures, re-run fresh: hand-rolled → exit 1 (names the fix); shared-fixture-usage → exit 0 | integration-real-code | None |
| AC5 | ✅ | `skills/review/SKILL.md` re-grepped fresh on merged master: "8 categories (A–H)" appears at both required locations (count=2), Category H section present | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

No deviations found on re-verification.

---

## Scope Deviations

None. All out-of-scope items (migrating the other 29 hand-rolled `journeys.js` files, `products.js` work, promoting the check to a DoR hard block) were confirmed untouched at `/subagent-execution`'s own final review and remain untouched on merged master.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Factory returns mockReq with default session shape (AC1) | ✅ | ✅ | |
| Self-test re-derives fields from source (AC2) | ✅ | ✅ | |
| Self-test confirms overrides merge (AC2) | ✅ | ✅ | |
| Structural check flags hand-rolled literal (AC4) | ✅ | ✅ | |
| Structural check passes compliant file (AC4) | ✅ | ✅ | |
| Migrated file's assertions pass unchanged (AC3) | ✅ | ✅ | |
| Category H wired into /review at both locations (AC5) | ✅ | ✅ | |
| Self-test and structural check complete in <1s (NFR) | ✅ | ✅ | Both complete near-instantly; no timing instrumentation needed |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — self-test/structural check < 1 second | ✅ | Both run near-instantly (plain object factory / grep-based pattern match, no network/DB access) |
| Security — no new production code path | ✅ | `git diff` confirms zero `src/` changes; all 9 files touched live under `tests/`, `scripts/`, or `skills/` |
| Accessibility | ✅ N/A | No UI |
| Audit | ✅ N/A | No audit-relevant surface |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| `journeys.js` fixture duplication (m8) | ✅ | 2026-10-31 (now) | Baseline 0/31; proof-of-pattern migration confirmed (1 file, `check-ep3-s2-journey-health.js`), structural check correctly distinguishes hand-rolled vs. compliant — minimum validation signal fully met |

**Measurement-ready gate:** Yes — measurement is possible now.

**Signal:** on-track
**Evidence:** 1 of 31 real `journeys.js`-touching files migrated to the shared fixture as proof-of-pattern (exactly meets the "1 migrated" target); the new structural check (`scripts/check-journeys-fixture-usage.js`) correctly flags a hand-rolled ad-hoc session literal and passes the migrated file, confirmed fresh on merged master. Zero new hand-rolled callers introduced by this story (the only other `journeys.js`-touching changes this story made were the new fixture module, self-test, and structural check itself — none of which hand-roll a session literal).
**Date measured:** 2026-10-31

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required by this story itself. (The broader `journeys.js` retrofit of the remaining 29 hand-rolled files, and `products.js`'s own separately-confirmed duplication, remain named fast-follows per `tfhc-s5`'s spike — not blocking this story's own completion.)

---

## DoD Observations

1. During `/subagent-execution`, a code-quality review correctly flagged a 3rd near-identical copy of the fixture-usage-check script shape (`check-journey-fixture-usage.js`, `check-skills-fixture-usage.js`, now `check-journeys-fixture-usage.js`) as crossing a DRY threshold. Not fixed within this story's own bounded scope — logged as a capture-log `/improve` candidate (extract a shared `scripts/lib/make-fixture-usage-check.js` factory) for a future bounded fast-follow, rather than expanding this story's scope mid-task.
2. A genuine correctness bug was found and fixed during implementation: the structural check's hand-rolled-literal detection regex only matched when `session` was the first object key in an inline literal — a file with `{ params: {...}, session: {...} }` would have slipped through undetected. Fixed with a windowed-match technique and locked in with dedicated regression test coverage (`tests/check-tfhc-s7-journeys-fixture-usage-check.js`) before merge — this is exactly the kind of silent-divergence risk this epic exists to catch, caught here before shipping rather than after.
3. PR #1046 hit the now-understood, already-logged CI `deploy-group` concurrency-cancellation pattern twice during this story's own lifecycle (once pre-merge-conflict, once post-conflict-resolution) — both resolved via `gh run rerun`, root cause already captured in `workspace/capture-log.md` as a deferred future story, not re-logged here.
4. A real merge conflict occurred on `workspace/capture-log.md` between this branch and a direct master commit made during the same session's CI investigation — resolved by keeping both independently-appended entries. No `pipeline-state.json` conflict occurred (it auto-merged cleanly).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Extract a shared mockReq/mockRes fixture module for journeys.js tests.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
