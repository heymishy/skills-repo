# Definition of Done: dmcb-s1 — document matrix spurious/duplicate column bugs

**Track:** Short-track (live production bug report)
**PR:** https://github.com/heymishy/skills-repo/pull/852 | **Merged:** 2026-09-09 (merge commit `41b23ee0`)
**Test plan:** artefacts/2026-09-09-doc-matrix-column-bugs/test-plans/dmcb-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-09-doc-matrix-column-bugs/dor/dmcb-s1-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session, all findings independently verified against real git/gh/production state)
**Date:** 2026-09-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Bug A fix — no spurious epic-name columns. Automated: T1 (`_buildGroupedFromTrace` routing), T2 (end-to-end header assertion). Live: production header row for `2026-06-22-wuce-multi-tenancy` now shows exactly 10 columns (`Story, RC, RCC, Plan, Rev, TP, Ver, DoD, Ref, Status`) — zero epic-name columns, down from 20 pre-fix. | automated test + live production verification | None |
| AC2 | ✅ | Bug A regression guard — epic doc links still work. T2's third assertion + live: 9 of 9 real epic divider rows on production still carry their own "View epic doc" link. | automated test + live production verification | None |
| AC3 | ✅ | Bug B fix — no duplicate "Story" column. Automated: T3. Live: exactly one "Story" header cell on production, down from two. | automated test + live production verification | None |
| AC4 | ✅ | Bug B regression guard — no documents silently dropped. The pre-existing `check-cat-s4-features-page-integration.js` real-data regression test (205 real files on `2026-04-19-skills-platform-phase4`) caught an intermediate version of the fix dropping 27, then 22 documents — final fix (folding excluded-column links into the story-name cell, rendering all of them for synthetic buckets) restores the full 205-link count. Live: the story-name cell on production now links directly to the story's own definition file (`stories/p0.1` confirmed). | automated test (real production-shaped data) + live production verification | None |

**Confirmed in CI, not just locally:** all 8 required checks passed on PR #852 after fixing a real registration gap (see Scope Deviations below) — `mergeStateStatus` was `CLEAN` before merge. **Confirmed live in production**, not just staging: `GET /version` on `skills-framework.fly.dev` returns `sha: 41b23ee0...` (this PR's merge commit), and the exact page the operator originally reported (`/features/2026-06-22-wuce-multi-tenancy`) was directly inspected via Chrome browser automation post-deploy — this is the strongest possible verification for a live-reported production bug: the operator's own exact repro page, checked after their own approval of `promote-to-prod`.

---

## Scope Deviations

None against the story's own fix scope. Three deviations surfaced and were resolved during delivery, all logged in `decisions.md`-equivalent detail in the test plan and PR:

1. **An intermediate version of the Bug B fix silently dropped documents.** Caught by a pre-existing real-data regression test before merge, not after — fixed by folding excluded-column links into the story-name cell rather than discarding them.
2. **A stale hardcoded pass-count baseline in an unrelated story's own regression suite** (`check-cat-s6-regression-verification.js`, expecting exactly 27 passing in `fadm-s1`'s tests) needed reconciling to 32 after adding 5 new regression tests — same class of drift documented repeatedly elsewhere this session.
3. **The new feature was never registered in `pipeline-state.json`** at initial branch-setup time, causing 2 of 3 CI failures on the first PR push (`Validate traceability chain`'s `discovery_exists` check, and the assurance gate's own artefact-collection step). Fixed via a follow-up commit (`eddaae1b`) registering the feature with `track: short`, matching this repo's own established exemption pattern — re-verified locally via `pwsh scripts/validate-trace.ps1 --ci` before re-pushing. The third CI failure on that same run (`Scenario B E2E (staging)`, `POST /api/journey` returning 403 instead of 303) was confirmed genuinely unrelated and environmental: it passed cleanly on the two immediately-prior, unrelated PRs (#850, #851), and passed again on the retry after the registration fix — nothing in this diff touches journey creation, CSRF, or auth.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T3 (6 new tests) + T4 (existing suites confirmed unchanged in behaviour, updated only where a real, expected count changed)
**Tests passing in CI:** 632 files, 1 pre-existing unrelated failure (`check-p3.5-validate-trace.js`, documented repeatedly this session as an unrelated feature's own governance gap)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — `_buildGroupedFromTrace` routes `type: 'epics'` correctly | ✅ | ✅ | `check-cat-s4-features-page-integration.js`, 3 assertions |
| T2 — end-to-end: no spurious epic columns, epic links preserved | ✅ | ✅ | `check-fadm-s1-document-matrix.js`, 3 assertions |
| T3 — no duplicate "Story" column | ✅ | ✅ | `check-fadm-s1-document-matrix.js`, 2 assertions |
| T4 — existing suites unchanged | ✅ | ✅ | `check-cat-s4-features-page-integration.js` (27→27, golden fixture regenerated to reflect the intentional behaviour change), `check-fadm-s1-document-matrix.js` (26→32, +6 new), `check-cat-s6-regression-verification.js` (baseline reconciled 27→32) |

**Gaps:** None. This story's own scope is fully automated-test-covered plus directly live-verified against the operator's exact original repro page — no CSS-layout-dependent ACs, no manual-only verification needed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| No documents silently dropped (data-integrity NFR, inherited from the pre-existing cat-s4 regression guard) | ✅ | 205/205 real files on `2026-04-19-skills-platform-phase4` still render as distinct links post-fix |
| No new queries, no new user input, no accessibility regression | ✅ | Pure server-side rendering fix; `<th>`/`<td>` scope semantics unaffected |

---

## Metric Signal

Not applicable — this is a bug fix, not a metric-contributing story. No benefit-metric was defined for this short-track item (per this repo's own short-track process, which skips discovery/benefit-metric).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding for this fix. One small, unrelated finding surfaced during deploy verification, worth a future `/improve` look but not blocking: the repo's own "Trace Commit" GitHub Actions workflow broke on this story's own registration-fix commit message, because the commit body contained an internally-double-quoted phrase (`"Collect governed artefacts"`) that appears to be spliced unsafely into a generated shell script (`governed: command not found` — a stray token from inside the quoted phrase). Two other workflows also failed on the same push (`Deploy dashboards to GitHub Pages`, `Improvement Agent — Scheduled Dreaming`) but were confirmed pre-existing and unrelated (a GitHub Pages API-permissions config issue, and a branch-protection rule blocking a direct push respectively) — neither caused by this session's work. None of the three block the actual deploy pipeline, which completed successfully.

---

## DoD Observations

1. **A live, operator-reported production bug was root-caused precisely via direct DOM inspection against production, not assumed from reading code alone.** Fetching the actual server-rendered table markup (`document.documentElement.outerHTML`) revealed the exact spurious columns and their `title` attributes, which directly named the underlying data source (epic-doc filenames) — this made the code trace back through `_deriveMatrixColumn` → `_buildGroupedFromTrace` fast and unambiguous, rather than guessing from the symptom description alone.
2. **A pre-existing real-data regression test (`cat-s4`'s 205-file phase4 check) caught a real defect in an intermediate version of this very fix, before merge.** This is a second independent confirmation this session that real-data regression tests (as opposed to only small synthetic fixtures) catch classes of bugs synthetic tests miss — the first version of the Bug B fix would have shipped a silent, hard-to-notice data-loss regression (documents present in the underlying data but simply never rendered as a link anywhere) if that test hadn't existed.
3. **Registering a new short-track feature in `pipeline-state.json` should happen at branch-setup time, not be forgotten until CI fails on it.** This story skipped that step initially (an oversight, not a process gap — the established short-track convention for other stories this session did include it), costing one extra CI round-trip. Worth a small process reminder: even a genuinely tiny, single-commit bug fix needs its `pipeline-state.json` registration before the first push, not after the first CI failure surfaces it.
4. **This story validated the full staging→production promotion pipeline end-to-end for the first time this session with a real operator-approval gate in the loop**, not just a merge-and-assume. `promote-to-prod` genuinely required and waited for manual approval (confirmed via polling its own job status, not assumed) — the fix was only verified live *after* that approval actually happened, which is the correct discipline for a fix delivered in response to a live production bug report: the operator's own exact repro page is the real acceptance test, not a green CI badge alone.