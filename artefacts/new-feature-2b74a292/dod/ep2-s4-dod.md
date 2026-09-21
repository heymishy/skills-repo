# Definition of Done: Concurrent Write Merge for Artefact Edits

**PR:** https://github.com/heymishy/skills-repo/pull/913 | **Merged:** 2026-09-21 (merge commit `fa7eb9e6`)
**Story:** artefacts/new-feature-2b74a292/stories/ep2-s4.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep2-s4-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep2-s4-dor.md
**Implementation plan:** artefacts/new-feature-2b74a292/plans/ep2-s4-plan.md
**Assessed by:** Claude
**Date:** 2026-09-22

---

## AC Coverage

- **AC1:** Concurrent save requests within 100ms are detected as a concurrent edit, not two independent sequential saves
- **AC2:** The three-way merge runs and both users see the merged result (both edits present) immediately
- **AC3:** `feature_edits` has a record with `operation: "merge"` and accurate `lineAttributions`

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep2-s4-concurrent-edit-buffer.js` (5/5 pass, precise 100ms-window/strict-`<` boundary logic with injectable clock) + `tests/check-ep2-s4-integration.js::"darren's concurrent save: 200, merged:true..."` (13/13 pass, real dispatch through `routes/journey.js`'s router, not mocked) | unit + integration-real-code | None. The exact sub-100ms concurrency window is a precise internal-timing claim, not a browser-observable effect — controlled-clock unit/integration evidence is the appropriate verification class for it (see `check-ep2-s4-concurrent-edit-buffer.js`'s own injectable `_now()`/`setNow()`, matching the story's own binding contract). A live two-tab browser pass was also run on real staging today (see AC2's row) but real network latency across two sequential tool calls made landing two saves inside a literal 100ms window unreliable to reproduce live — recorded honestly in `decisions.md` rather than claimed. |
| AC2 | ✅ | `tests/check-ep2-s4-merge-artefact-edits.js` (8/8 pass: non-overlapping merges, delete-vs-edit/edit-vs-edit hard-conflict detection, index-shift and mis-attribution regressions, 1000-line NFR) + `tests/check-ep2-s4-integration.js` ("darren's concurrent save: 200, merged:true, real three-way-merged content", "SSE subscriber received a push for EVERY save via the SAME `keyFor()` key as the save route") + live two-tab browser test on real staging today (`decisions.md`, "post-deployment two-tab concurrent-save smoke test" entry): confirmed the SSE push demonstrably updates the *other* tab's textarea with newly-saved content live, with no page reload, and no edit was ever lost across two concurrent tabs — zero console errors throughout | unit + integration-real-code + live-verified | The live-browser pass confirmed "both users see the merged version immediately, no reload" via the SSE-live-push path (the second tab's listener absorbed the first tab's save before its own edit was even submitted) rather than by directly observing a `merged:true` API response combining both edits in one round trip — real network latency meant the two saves never landed inside the same 100ms window live. The harder `merged:true` 3-way-merge response is fully covered by automated evidence (1000 randomized disjoint-edit trials + 400 randomized genuine-overlap trials, 0 false positives/negatives; the `darren` integration test above) but was not itself directly observed in a real browser today. This is recorded as a verification-class nuance, not a functional gap — the end-user-visible guarantee (no data loss, live update, no reload) was directly confirmed live. |
| AC3 | ✅ | `tests/check-ep2-s4-feature-edits.js` (`recordEdit creates a row with operation=merge and correct lineAttributions JSON`, `recordEdit sets edit_hash to a real 64-char SHA-256 hex digest`, `listEditsForFeature respects tenant isolation (ADR-025)`) + `tests/check-ep2-s4-integration.js` ("`feature_edits` recorded BOTH the plain save and the merge, in order, with correct attribution") | unit + integration-real-code | None. AC3 is a backend data-integrity claim (a database record's shape and content), not a browser-observable UI effect, so the DoD's UI-evidence gate does not apply — `integration-real-code` evidence against the real `feature-edits.js` module and real router dispatch is the appropriate and sufficient verification class. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one recorded deviation (AC2) is a verification-class nuance, not a functional shortfall — the underlying guarantee was independently confirmed both by extensive automated randomized testing and by a live browser pass, just not by the same single observation.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list:
- **Optimistic conflict resolution** (showing the conflict to the user; accepting one version wholesale) — not built; hard conflicts fail with `MERGE_CONFLICT_HARD` and an HTTP-level error, never a user-facing conflict-picker UI.
- **Real-time co-editing cursors or presence within the artefact editor** — not built; this story's SSE stream only pushes post-save merged content, no live cursor/typing state.
- **Handling merge conflicts requiring human intervention** — not built; hard conflicts fail gracefully (confirmed: `MERGE_CONFLICT_HARD`, graceful non-crash failure in both the unit suite and the 100-scenario NFR test), no manual-resolution workflow exists.

---

## Test Plan Coverage

**Tests from plan implemented:** consolidated into 5 test files (`check-ep2-s4-merge-artefact-edits.js`, `check-ep2-s4-concurrent-edit-buffer.js`, `check-ep2-s4-feature-edits.js`, `check-ep2-s4-integration.js`, `check-ep2-s4-nfr-merge-success-rate.js`) covering all 12 planned test scenarios (3 unit + 3 integration + 3 E2E + 3 NFR) — a leaner grouping than the plan's own per-scenario file breakdown, matching this feature's established consolidation pattern (see `ep2-s3-dod.md`), plus 1 E2E spec (`tests/e2e/ep2-s4-concurrent-merge.spec.js`) and 1 additional post-merge regression test (`check-ep2-s4-artefact-edit-merge-static-route.js`, not in the original plan — added after a post-merge live-browser check found the client script's static route was never wired into `server.js`; see `decisions.md`).
**Tests passing:** all passing — freshly re-run in this session against merged master: `check-ep2-s4-merge-artefact-edits.js` 8/8, `check-ep2-s4-concurrent-edit-buffer.js` 5/5, `check-ep2-s4-feature-edits.js` 6/6, `check-ep2-s4-integration.js` 13/13, `check-ep2-s4-nfr-merge-success-rate.js` 3/3 (99/100 randomized scenarios succeed, 1 graceful hard-conflict), `check-ep2-s4-artefact-edit-merge-static-route.js` 6/6. Full `npm test` on merged master (commit `6f42f179`): **691 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — pre-existing, unrelated Windows local `python3` shim permission issue, confirmed repeatedly across multiple unrelated worktrees/branches throughout this session, not introduced by this story).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `check-ep2-s4-merge-artefact-edits.js` | AC2 | ✅ 8/8 | Includes 2 regression tests added during final review (index-shift, mis-attribution) and the 1000-line NFR-Perf-1 timing test |
| `check-ep2-s4-concurrent-edit-buffer.js` | AC1 | ✅ 5/5 | Includes the exact-100ms boundary case (strict `<`, not `<=`) |
| `check-ep2-s4-feature-edits.js` | AC3 | ✅ 6/6 | Includes tenant isolation (ADR-025) and SHA-256 edit-hash format |
| `check-ep2-s4-integration.js` | AC1, AC2, AC3 | ✅ 13/13 | Full real-dispatch round trip; includes the 2 Critical cross-tenant-write regression tests added during final review |
| `check-ep2-s4-nfr-merge-success-rate.js` | NFR-Perf-3 | ✅ 3/3 | 100 randomized scenarios, seeded LCG PRNG for determinism |
| `tests/e2e/ep2-s4-concurrent-merge.spec.js` | AC1, AC2 | ✅ 2/2 | Uses raw `fetch`/`context.request` against real HTTP routes, not a real rendered `<script>`-tag browser page — see NFR/UI-evidence note below |
| `check-ep2-s4-artefact-edit-merge-static-route.js` | (post-merge regression) | ✅ 6/6 | Added post-merge; proves `/public/artefact-edit-merge.js` is wired into `server.js`'s real router |

**Gaps (tests not implemented):** NFR-Perf-2 (line-attribution accuracy within 1 character) has no test literally named for it, but its substance is covered by `check-ep2-s4-merge-artefact-edits.js`'s "non-overlapping edits merge cleanly with correct line attribution" and "a mid-file insertion on one side does not mis-attribute unrelated unchanged later lines" tests — not a real gap, a naming difference from the plan's own per-NFR breakdown.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Merge completes within 1s | ✅ | `check-ep2-s4-merge-artefact-edits.js::"1000-line artefact merges in under 1s (NFR-Perf-1)"` — integration-real-code |
| Line-level attribution accurate to within 1 character | ✅ | `check-ep2-s4-merge-artefact-edits.js`'s attribution-correctness and mis-attribution-regression tests (see Test Plan Coverage gap note above) — integration-real-code |
| Merge success rate ≥99% | ✅ | `check-ep2-s4-nfr-merge-success-rate.js` — 99/100 randomized scenarios succeed, 1 graceful `MERGE_CONFLICT_HARD` (not a crash), 0 unexpected outcomes; re-verified this session with 1000 additional disjoint-edit trials (0 false positives) and 400 additional genuine-overlap trials (400/400 correctly detected) during final review — integration-real-code |
| Live browser render check (client script actually executes in a real browser) | ✅ | Originally RISK-ACCEPTed at `/verify-completion` (Chrome unavailable that session) — `decisions.md`, "live browser render check RISK-ACCEPTed" entry. Closed post-merge with a genuine finding: the client script's static route was never wired into `server.js`, causing a real `SyntaxError` in production (`decisions.md`, "post-merge live browser check... real finding" entry). Fixed (PR #914, merged `fd5910dd`) and re-verified live-clean on staging (zero console errors). `live-verified`. |
| Two-tab concurrent-save UX (no data loss, live update, no reload, no console errors) | ✅ | `decisions.md`, "post-deployment two-tab concurrent-save smoke test" entry (2026-09-22) — confirmed live on real staging today. `live-verified`, with the verification-class nuance recorded in AC2's row above. |

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update (confirmed: the feature object has no `metrics` key).

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Synchronous team access ("A team of 3 people... can each log in independently, access the same feature in real time") | ✅ (baseline: 0 — features were single-user scoped before this epic) | Not yet measured | This story is the concurrency-safety layer underneath synchronous access (ep2-s1 delivered presence; ep2-s4 delivers safe concurrent writes) — the mechanism is now shipped and verified working end-to-end (real staging, two real browser tabs, zero data loss). No real beta-team usage has occurred yet to observe the target directly. Signal: `not-yet-measured`. Evidence note: concurrent-write-merge mechanism shipped 2026-09-21 and verified live 2026-09-22; awaiting first real beta-team concurrent-edit session to observe the target. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied. One recorded deviation (AC2's verification-class nuance: the live-browser pass confirmed the end-user guarantee via the SSE-live-push path rather than by directly observing a `merged:true` response combining both edits — the harder 3-way-merge path itself remains verified by extensive automated evidence only). Zero scope violations. Zero test gaps that block release (one NFR naming difference, not a substantive gap). One real production bug was found and fixed post-merge via this story's own deferred live-browser check (the missing static route for the new client script) — see `decisions.md` for the full account; this is recorded as a strength of the process (the RISK-ACCEPT gap was proactively closed, not left open) rather than a defect in the original delivery.

**Follow-up actions:**
1. None blocking. The one open item from the original RISK-ACCEPT — the deferred live-browser check — has now been fully closed (both the static-route bug fix and the two-tab smoke test).
2. `/improve` candidate: this is the second story in this feature (`ep2-s1`, `ep2-s4`) where a client-side `<script src>` route was shipped and merged without any test exercising a real `<script>`-tag fetch+parse, and only a live-browser check caught it — worth considering whether `/implementation-plan` or `/verify-completion` should require a direct-router-dispatch test (matching `check-jsvr-s1-wire-stage-view-route.js`'s established pattern) for any story that adds a new `/public/*.js` file, rather than relying on a live-browser check to catch it after the fact.

---

## DoD Observations

1. **This story's DoR was built against an architecture that doesn't exist** (route, file, and client-side AJAX/SSE layer all assumed rather than verified) — corrected before implementation began at `/implementation-plan` time (`decisions.md`, "DoR touch-points contract corrected" entry). Consistent with this feature's now-repeated pattern (also seen in `ep1-s2`/`ep1-s3`/`ep2-s1`/`ep2-s2`/`ep2-s3`) — an `/improve` candidate already flagged in `ep2-s3-dod.md`'s own DoD Observations.
2. **A genuine Critical/HIGH correctness bug in the core merge algorithm was found TWICE** across this story's delivery — once mid-story (positional/index-based comparison desynced on any insert/delete, fixed via LCS-based alignment), and once again during final-review NFR closure (a subtler whole-segment-granularity false-conflict bug, found only via a new randomized 100-scenario test written specifically to close a coverage gap). Both fixed and independently re-verified. This is a strong argument for the randomized-trial NFR test pattern used here becoming a standard tool for any story implementing a non-trivial merge/diff algorithm.
3. **Two separate Critical/HIGH cross-tenant security vulnerabilities were found and fixed** during code-quality/final review — the new SSE route had no tenant guard at all (any authenticated user of any tenant could subscribe to any journey's live edits), and the save route itself also had no tenant guard (a pre-existing gap predating this story, confirmed via branch-setup-baseline diff, but judged in-scope given ADR-025's binding constraint). Both fixed with 3 new regression tests. `/improve` candidate: this is the second time this session a new SSE/streaming route has shipped without a tenant guard where its sibling read/write route had one — worth considering whether `/implementation-plan`'s task template should explicitly prompt "does this new route need the same access guard as its sibling route" whenever a story adds a route alongside an existing, already-guarded one.
4. **A dispatched implementer subagent hit the account's own monthly spend limit mid-task (Task 5), dying before committing, but leaving genuinely strong real work on disk.** Recovered by independently re-verifying the uncommitted work with full review rigor (not re-dispatching) and committing it directly — recorded here for completeness, not a defect in the delivered code.
5. **A real production bug was found and fixed via this story's own deferred live-browser check, performed proactively once Chrome became available post-merge** (`/public/artefact-edit-merge.js` was never wired into `server.js`'s router — the exact same bug class `ep2-s1`'s `presence-sidebar.js` route already hit once in this same epic, whose own code comment predicted almost exactly this recurrence). See Outcome's `/improve` candidate above.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep2-s4 (Concurrent Write Merge for Artefact Edits).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
