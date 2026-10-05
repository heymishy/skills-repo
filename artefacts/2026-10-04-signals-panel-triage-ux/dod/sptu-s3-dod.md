# Definition of Done: Make the signals panel's existing sort order visible and explicit

**PR:** https://github.com/heymishy/skills-repo/pull/941 | **Merged:** 2026-10-05
**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
**Test plan:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s3-test-plan.md
**DoR artefact:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — the page states its own sort order explicitly, on any page/filter state | ✅ | Unit test asserts the label matches `/sorted by.*recent/i`. **Live-confirmed twice**: once at `/verify-completion` (2026-10-05) against a local dev server, and again on real `wuce-staging` (2026-10-06, post-merge, authenticated) — the label "Sorted by most recent first for signals that have a date — signals with no date are shown last, in their original order" renders correctly above the real signal list in both environments | `integration-real-code` + `live-verified` (real staging, authenticated, post-merge) | None |
| AC2 — signals with no timestamp are visually distinguished (text, not colour-only), independent of the parse-error marker | ✅ | Unit tests cover all 4 dated×parse-error combinations, confirming the "🕑 No date" marker and the parse-error marker render independently. **Live-confirmed** at `/verify-completion` against real local data: a real undated `learnings`/`note` signal showed the marker | `integration-real-code` + live local browser confirmation | None |
| AC3 — the stated sort order must not claim unqualified "sorted by recency" | ✅ | Dedicated unit test asserts the label text is not the bare string "Sorted by most recent first" and includes qualifying "no date" language — confirmed both by the test and by direct visual reading of the live-rendered label (above) | `integration-real-code` + live visual confirmation | None |
| AC4 — no functional change to signal order or content | ✅ | `ep2-s1`/`ep2-s3`'s own existing test suites re-run unchanged, both fully passing — confirmed at `/verify-completion` and again by the full suite passing post-merge-conflict-resolution (716/716, only the already-known unrelated `discovery_approved` failure) | `integration-real-code` (regression) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The story's own Out of Scope items (extending `signals-aggregator.js` to parse more real timestamps, a user-selectable alternate sort order, grouping/re-ordering undated signals among themselves) were not implemented.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 (plus the full suite, 716/716 post-merge, only the already-known unrelated failure)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| renderSignalsPanel includes a visible sort-order label (AC1) | ✅ | ✅ | |
| A signal with timestamp=null carries a distinct "no date" marker (AC2) | ✅ | ✅ | |
| The "no date" marker and the parse-error marker are independent (AC2) | ✅ | ✅ | |
| The sort-order label never claims unqualified recency (AC3) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` at `/test-plan`. No RISK-ACCEPT was required. The UI-evidence gate for AC1/AC2/AC3's real-world rendering claims was closed at `/verify-completion` via a real local browser check and is now additionally confirmed on real staging post-merge (see AC1's evidence row above) — not deferred.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no measurable change | ✅ | Trivial per-item boolean check, no dedicated test needed, confirmed at `/review` |
| Accessibility — "no date" indicator not colour-only | ✅ | AC2 unit tests + live local browser confirmation |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time-to-triage | ❌ | Not yet | `sptu-s1`/`sptu-s2`/`sptu-s3`/`sptu-s4` are now ALL merged, so the full filter→sort→dismiss×10 flow is finally code-complete end-to-end — but the real, live-timed measurement itself has not yet been performed. This is the next real step for this metric, not a blocker on this story's own DoD. |

**Metric 1 — Signal: not-yet-measured**
**Evidence note:** All 4 contributing stories are merged as of 2026-10-06; the real timed flow measurement itself is still outstanding — tracked as a follow-up action below, not part of this story's own scope.
**Date measured:** null

---

## Outcome

**COMPLETE**

**Follow-up actions:** Perform Metric 1's own real, live-timed filter→sort→dismiss×10 measurement now that all 4 contributing stories are merged — owner: next session/operator action, not blocking this story's own DoD.

---

## DoD Observations

1. This story's own PR developed a real merge conflict with `sptu-s4`/`dswf-s1` after they merged first (both branches independently extend `_signalItem`/`renderSignalsPanel` in the same file). Resolved by combining both features' markup rather than picking a side — documented in `decisions.md`'s "Merge conflict resolution" entry (2026-10-06), verified via a conflict-marker scan, a full local test run, and a fresh CI run (8/8 checks) before merging. No functional loss on either side.
2. AC1's live-rendered label is now independently confirmed in two genuinely different environments (local dev server at `/verify-completion`, real authenticated `wuce-staging` post-merge) — the second check was incidental (performed while re-verifying `dswf-s1`'s own fix) but is real, additional evidence worth recording here rather than discarding.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Make the signals panel's existing sort order visible and explicit" (sptu-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
