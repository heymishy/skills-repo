# Definition of Done: Signals panel — render real signals in a web UI page

**PR:** https://github.com/heymishy/skills-repo/pull/935 | **Merged:** 2026-10-03
**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Real signals render on page load | ✅ | Confirmed post-merge on master: `node tests/check-ep2-s1-signals-panel.js` → 11/11 pass. Also real-browser verified pre-merge: a real Claude-in-Chrome screenshot of the live, unmodified `/signals` page (real local dev server, real production data) showed genuine signal entries, nothing blank/placeholder | `integration-real-code` + `live-verified` (real Chromium browser, real server, real data) | None |
| AC2 — Each signal's CTA label is visible | ✅ | Unit tests pass post-merge. Real-browser confirmed with live production data: a DOM query against the real rendered page found 5 genuinely distinct CTA labels ("Review", "Open feature", "Review proposal", "View scenario", "View trace") across 5,294 real buttons — conclusively not hardcoded | `integration-real-code` + `live-verified` | None |
| AC3 — Empty state when no signals exist | ✅ | Unit test pass post-merge (empty array → "No signals yet", no error). Not separately real-browser-checked — this repo's real workspace never has zero signals, and "empty state present" is a DOM-presence claim, not a CSS-layout claim (confirmed not flagged as CSS-layout-dependent at `/test-plan` Step 3a) | `integration-real-code` | None |
| AC4 — Parse-error signals are visually distinguished | ✅ | Unit test pass post-merge. Real-browser confirmed: a live screenshot shows the one genuine `parse-error` signal with a clearly distinct orange left border and background tint, visually separated from plain white cards — an actual rendered visual difference, not just a DOM attribute | `integration-real-code` + `live-verified` | None |
| AC5 — Page requires authentication | ✅ | Integration test pass post-merge (unauthenticated → 302 to `/auth/github`). Confirmed live as a byproduct of the browser check: `/signals` genuinely required the session cookie to render | `integration-real-code` + `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all 5 ACs satisfied exactly as scoped, with the strongest verification-strength tier (`live-verified`) achieved on all 4 ACs with any browser-observable component — a first for this feature's own stories, since Claude-in-Chrome was unavailable for every prior Chrome-check attempt this session (`ep1-s1`/`ep1-s2`/`ep1-s3` all substituted Playwright or a plain local HTTP check).

---

## Scope Deviations

None. The merged PR is exactly what the DoR contract described: `src/web-ui/views/signals-panel-view.js` (new), `src/web-ui/routes/signals-panel.js` (new), `src/web-ui/server.js` (route registration + require line only), `tests/check-ep2-s1-signals-panel.js` (new), `tests/e2e/ep2-s1-signals-panel.spec.js` (new). All 10 commits on the branch trace directly to the 6-task implementation plan, confirmed at `/verify-completion` time via `git log --oneline master..HEAD`.

One real production finding surfaced during implementation (Task 5), already correctly scoped out rather than silently absorbed: this repo's own live data has 5,293 signals, and this story's own Out of Scope explicitly accepted "Pagination for very large signal counts... acceptable to render the full list for MVP/solo-operator scale" — an assumption since found to be empirically wrong for this repo's own real, accumulated history. The real production fix is tracked as a new, separately-scoped, already-written follow-up story (`ep2-s3`), not retrofitted into this story's own already-reviewed scope.

A second, unrelated finding surfaced at `/branch-complete` time (operator-caught): the PR initially had zero CI runs due to a real merge conflict this session's own pipeline-state.json write pattern silently produced (lacking true git ancestry with master). Fixed via a real `git merge`, documented in `decisions.md` and `capture-log.md` as a structural gap in the established write pattern, not a defect in this story's own code.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (11 unit/integration + 1 real E2E) — the test plan was itself corrected mid-implementation from an initially-undercounted 9 to the real 12 (see `test-plans/ep2-s1-test-plan.md`'s own 2026-10-02 note and `decisions.md`).
**Tests passing in CI:** Confirmed on PR #935's real CI run post-merge-conflict-fix: Assurance Gate, Cross-Tenant Isolation Repeat Gate, Playwright E2E smoke tests, PR Checks (lint/typecheck/test/build), Watermark Gate, and both staging E2E scenarios all passed. The one red check ("Validate traceability chain") is a confirmed, pre-existing, repo-wide gap affecting 5 unrelated features — not a defect in this story, logged separately (`capture-log.md`, 2026-10-03 entry).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit + Integration | ✅ | ✅ | |
| AC2 unit x2 (label + hidden fields) | ✅ | ✅ | |
| AC3 unit | ✅ | ✅ | |
| AC4 unit | ✅ | ✅ | |
| AC5 Integration | ✅ | ✅ | |
| Security (escHtml) unit | ✅ | ✅ | |
| NFR-Performance unit | ✅ | ✅ | |
| NFR-Security (no new deps) unit | ✅ | ✅ | |
| Error-handling (robustness) Integration | ✅ | ✅ | Found by code-quality review during Task 4, not in the original test plan — added and documented |
| NFR-Accessibility real E2E | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (<100ms server-side render) | ✅ | Confirmed via dedicated unit test, same method as `ep1-s3`'s own precedent (render-time measurement, not full-browser navigation) |
| Accessibility (keyboard Tab order) | ✅ | Real Playwright E2E, confirmed passing post-merge-equivalent evidence at `/verify-completion` time; classified CSS-layout-dependent by analogy to `ep1-s3`'s own precedent (jsdom cannot reproduce real sequential Tab-order focus movement) |
| No new attack surface | ✅ | Confirmed via dedicated unit test (no new npm dependency in the 2 new source files) and `escHtml` escaping confirmed via the Security unit test and, separately, real-browser inspection never showed unescaped content |

---

## Metric Signal

**Measurement-ready gate:** Yes — this story is the direct, real contributor to both Metric 2's full target and Metric 3's minimum validation signal, and is now merged and live on master.

> **Metric 2 — Improvement signal surfacing**
> Signal: on-track
> Evidence: `ep2-s1` delivers the "displayed per active feature" half of Metric 2's own full target, the gap explicitly identified and documented in `ep1-s3-dod.md`/`decisions.md` (2026-10-01). Real, live confirmation: a Claude-in-Chrome screenshot of the real `/signals` page shows real signals from all real aggregator sources (`capture-log`, `pipeline-state`, `decisions`, `dod-follow-up`, `learnings`, `parse-error`, etc.) genuinely rendering, not a subset or mock.
> Date measured: 2026-10-03

> **Metric 3 — Self-improvement loop accessibility**
> Signal: on-track
> Evidence: This story alone satisfies Metric 3's own minimum validation signal — "the visibility half of the loop works end-to-end (signal appears, is legible, and is traceable to its source)" — now genuinely, not just nominally, delivered: real signals render with real source/type/text, each traceable to its origin. The full 100% target (seeding + landing in a pre-populated session) still depends on `ep2-s2`, not yet merged. Note: the real unpaginated-at-scale finding (5,293 signals) means the *practical* accessibility of this visibility is itself imperfect at this repo's own real scale until `ep2-s3` ships — recorded honestly here rather than claiming a cleaner signal than the evidence supports.
> Date measured: 2026-10-03

---

## Outcome

**COMPLETE**

All 5 ACs satisfied exactly as scoped, with the strongest evidence tier achieved on every browser-observable AC — the first story in this feature where Claude-in-Chrome was actually available and used, rather than substituted with Playwright or a plain HTTP check. No scope deviations. No test gaps. Marked clean `COMPLETE` (not "with deviations") because the two real findings that surfaced during this story's lifecycle (the pagination/scale issue, and the CI-merge-conflict issue) were both correctly scoped *out* of this story from the start, handled as separate follow-up work, and documented — not symptoms of anything wrong with what this story itself delivered.

**Follow-up actions:**
1. `ep2-s3` (pagination) — already written, ready for `/review`. Should ship before Metric 3's own visibility claim can be considered fully robust at this repo's real scale, not just nominally correct.
2. The repo-wide discovery-approval gap (5 features, including the unrelated `2026-09-30-refactoring-and-product-health`) remains an open, tracked (capture-log only, per operator decision) governance backlog item — not this story's own follow-up, but worth noting here since it was found during this story's own `/branch-complete` pass.
3. The pipeline-state.json write-pattern structural gap (content-fetch-and-commit without real git merge) — recommend adopting a real `git merge origin/master` as the final step of `/branch-complete`'s and `/subagent-execution`'s own "Pipeline-state write safety" sections, for every future story, not just this one.

---

## DoD Observations

1. **Claude-in-Chrome connected successfully for the first time this session**, after being unavailable throughout `ep1-s1`/`ep1-s2`/`ep1-s3`'s own DoD and verification passes. Used for a genuine, real live browser render check — not a simulated/predicted one. **/improve candidate:** none specific to this repo's own pipeline; worth noting that browser-tool availability can change mid-session without warning, so it is worth re-checking availability at each story's own verification point rather than assuming the prior story's unavailability still holds.
2. **A real, operator-caught process gap (zero CI runs on an opened PR) was found, root-caused, and fixed within the same session** — not left for a future session to rediscover. The underlying pattern (pipeline-state.json write-and-commit without real git merge) had been used identically, without incident, across 5 prior stories this session (`ep1-s1`, `ep1-s2`, `ep1-s3`, and this feature's own earlier checkpoints) — all already merged, so not retroactively at risk, but the gap itself was real and would have recurred on every subsequent story's own `/branch-complete` had it gone unnoticed.
3. **A real, repo-wide governance gap (5 features with unapproved-but-marked-complete discoveries) was found while investigating an unrelated CI failure**, correctly left unresolved (not force-approved) pending the operator's own decision on how to track it, rather than either silently ignoring it or unilaterally approving someone else's work to make a check pass.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep2-s1 (Signals panel:
render real signals in a web UI page).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
