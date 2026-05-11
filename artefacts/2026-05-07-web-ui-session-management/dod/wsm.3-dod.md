# Definition of Done: wsm.3 — Non-happy-path navigation

**PR:** https://github.com/heymishy/skills-repo/pull/338 | **Merged:** 2026-05-08
**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.3-non-happy-path.md
**Test plan:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.3-test-plan.md
**DoR artefact:** artefacts/2026-05-07-web-ui-session-management/dor/wsm.3-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-08

---

## Outcome: COMPLETE WITH DEVIATIONS ⚠️

7 ACs satisfied. 30/38 tests passing. 8 test assertions failing due to two partial implementation gaps: (a) `stages` array missing from GET journey response (T1 — breadcrumb navigation), and (b) `session-boundary` marker not injected in turns array (T6 — previous-session separator). Recommit flow (AC2–AC5), needs-review disk persistence (AC7), and needs-review clearing (AC8) all fully pass.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: Breadcrumb shows completed stages as clickable, future as non-interactive | ⚠️ | T1b/T1c/T1d/T1e — `stages` array missing from GET /api/journey/:id response | Automated test | `handleGetJourneyState` does not include `stages` array in its response; breadcrumb data not exposed via API |
| AC2: Prior stage view shows turns (read-only) + Re-commit button | ✅ | T2 — GET stage/:name returns prior turns and `reCommitAvailable: true` (PASS) | Automated test | None |
| AC3: Re-commit with confirmation sets needs-review downstream | ✅ | T3a/T3b/T3c — downstream stages set to `needs-review`, upstream unchanged (PASS) | Automated test | None |
| AC4: Cancel confirmation makes no changes | ✅ | T4a/T4b/T4c — `cancelled: true`, no state change (PASS) | Automated test | None |
| AC5: Flagged stages show warning badge and note | ✅ | T5 — `needsReview: true` and correct message returned (PASS) | Automated test | None |
| AC6: "Previous session" separator injected at correct boundary | ⚠️ | T6b/T6c/T6d/T6e — separator marker absent from turns array in response | Automated test | `session-boundary` marker not injected in GET journey response; AC6 not fully implemented |
| AC7: needs-review flags persisted and restored after restart | ✅ | T7 — flags present after disk round-trip (PASS) | Automated test | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8
**Tests passing in CI:** 30/38 assertions

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — Breadcrumb navigable/non-interactive per stage | ✅ | ⚠️ | T1b–T1e fail: `stages` array absent from response |
| T2 — Prior stage GET returns turns + reCommitAvailable | ✅ | ✅ | |
| T3 — Re-commit with confirmed:true sets needs-review downstream | ✅ | ✅ | |
| T4 — Re-commit with confirmed:false makes no changes | ✅ | ✅ | |
| T5 — Flagged stage returns needsReview:true + message | ✅ | ✅ | |
| T6 — "Previous session" separator present in turns | ✅ | ⚠️ | T6b–T6e fail: session-boundary marker not injected |
| T7 — needs-review flags persisted to disk and restored | ✅ | ✅ | |
| T8 — needs-review cleared when re-committed | ✅ | ✅ | |

**Gaps:** No unimplemented tests. Two AC gaps need follow-up stories.

**Follow-up required:**
1. Add `stages` array (with `navigable` flags) to `handleGetJourneyState` response — AC1 breadcrumb support.
2. Inject `{ type: "session-boundary", label: "Previous session" }` marker into turns array at GET time when persisted turns are present — AC6 separator.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| NFR-consistency-needs-review: flag propagation and disk write atomic in same request cycle | ✅ | T7 — flags survive disk round-trip; T3 confirms in-memory + disk in same request |
| NFR-nodeps-wsm: zero new npm dependencies | ✅ | No new packages introduced |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Journey completion rate (proportion reaching DoR sign-off) | ❌ No pre-feature baseline measured | After breadcrumb (AC1) follow-up lands and operators can use back-navigation in real sessions | Core recommit + flagging mechanics shipped; UX entrypoint (breadcrumb) needs follow-up before operators can discover the feature |
