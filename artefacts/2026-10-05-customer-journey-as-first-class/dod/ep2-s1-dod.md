# Definition of Done: Feature picker: read pipeline-state.json and render feature list in modal

**PR:** [#965](https://github.com/heymishy/skills-repo/pull/965) | **Merged:** 2026-10-09T05:26:19Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep2-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Feature picker modal lists features (name + slug) from `pipeline-state.json`. `check-ep2-s1-feature-picker.js` (2 unit tests: populated list, zero-features boundary distinct from AC3's error state) + **real staging confirmation (2026-10-09):** `wuce-staging.fly.dev`, clicked "Map feature" on a real stage card, confirmed the modal lists real features (e.g. "WUCE Multi-Tenancy — Authorization Guard and Tenant Isolation", `2026-06-22-wuce-multi-tenancy`) pulled live from the deployed repo's own `pipeline-state.json`, not a hardcoded sample | `unit` + `live` (staging) | None |
| AC2 | ✅ | Filter/search input narrows features by name or slug. `check-ep2-s1-feature-picker.js` (markup shape test + jsdom behavioral test: real script extraction, real DOM hide/show assertions) + **real staging confirmation:** typed "tenancy" into the search box, list narrowed from the full feature set down to exactly the one matching feature | `unit` + `live` (staging) | None |
| AC3 | ✅ | Explicit error state when `pipeline-state.json` cannot be read, exact text "Features could not be loaded. Check that pipeline-state.json exists." `check-ep2-s1-feature-picker.js` (2 unit tests: ENOENT-style failure, invalid JSON) | `unit` only | Not live-verified on staging — the verification script's own setup notes explicitly warn against corrupting the real shared repo's `pipeline-state.json` to trigger this state; relying on the two dedicated unit tests (both failure modes) plus `featuresLoadError`'s explicit, non-silent design (deliberately diverging from `products.js`'s own silent-fallback convention — see `decisions.md` D10) |
| AC4 | ✅ | Closing without selecting creates no mapping, canvas unchanged. `check-ep2-s1-feature-picker.js` (source-text shape check: no fetch/POST anywhere in the close-handling code + jsdom behavioral test: real open/close DOM state and focus restoration) + **real staging confirmation:** opened the picker, pressed Escape, modal closed, canvas unchanged (no new badge/annotation anywhere), focus visibly restored to the triggering "Map feature" button | `unit` + `live` (staging) | None |

**Live verification beyond the test plan (real Chrome, staging, post-merge, 2026-10-09):** Confirmed the deploy-restart session-logout pattern recurred a 6th time this session (`ep1-s3`, `pfi-s1`, `ep1-s4`, `ep4-s1`, `ep4-s2`, now `ep2-s1`) — re-authenticated, then walked the live flow on a real existing journey with 3 stages: all 3 stage cards render a "Map feature" button, clicking one opens the modal with the real, live feature list, the search filter narrows it correctly, and Escape closes it cleanly with focus restored. This closes out the RISK-ACCEPT logged in `decisions.md` D11 for AC1/AC2/AC4 — only AC3's live confirmation remains intentionally unperformed, for the data-safety reason stated above, not a gap in rigor.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: one new `_repoRootAdapter` import, one new pipeline-state.json read with an explicit (not silent) error flag, one new "Map feature" button per stage card, one new feature-picker modal with three mutually-exclusive states, client-side filtering, and open/close/Escape handling — all confined to `handleGetJourneyCanvas` in `src/web-ui/routes/journeys.js`.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 planned, plus 2 additional jsdom behavioral tests added during code-quality review (9 total).
**Tests passing in CI:** All pass; confirmed in PR #965's CI and independently re-run against merged master (`npm test`: 728 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (feature list, name + slug) | ✅ | ✅ | |
| AC1 (boundary — zero features, distinct from AC3) | ✅ | ✅ | |
| AC2 (filter input present, shape) | ✅ | ✅ | |
| AC2 (behavioral — real filter DOM assertions) | ✅ | ✅ | Added during code-quality review (jsdom) |
| AC3 (error state — file not found) | ✅ | ✅ | |
| AC3 (error state — invalid JSON) | ✅ | ✅ | |
| AC4 (no fetch/POST shape check) | ✅ | ✅ | |
| AC4 (behavioral — real open/close/focus DOM assertions) | ✅ | ✅ | Added proactively in Task 3, matching Task 2's own precedent |
| (shape) repo-root adapter wiring | ✅ | ✅ | |

**Gaps:** None in the test-plan sense. AC3's live staging confirmation is deliberately not performed, for data-safety reasons stated in the AC Coverage table above — not a missing test.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Read `pipeline-state.json` via `fs.readFileSync` (ADR-029) | ✅ | Local filesystem read via `_repoRootAdapter.getRepoRoot(req)`, never cached/duplicated in Postgres |
| No Postgres write in this story | ✅ | Confirmed by code read and by AC4's own "no fetch/POST" test |
| No new npm runtime dependencies | ✅ | `package.json`/`package-lock.json` diff empty (confirmed by the final cross-task reviewer) |
| Modal keyboard-accessible (WCAG 2.1 AA) | ✅ | Real `role="dialog"`/`aria-modal`/`aria-hidden` attributes, Escape-to-close, focus moves into the search input on open and returns to the trigger on close — confirmed via both jsdom behavioral tests and live staging click-through |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Feature-to-stage mapping adoption | No (pre-feature) | **Mechanism now exists** — the feature picker is the entry point M2 depends on, though the mapping itself cannot yet be saved (`ep2-s2`'s own scope). M2 becomes fully measurable once `ep2-s2` ships. |

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with unit-test evidence (9/9 passing, including 2 jsdom behavioral tests added during code-quality review), AND a full post-deploy staging confirmation completed within this same session for AC1/AC2/AC4. AC3's live confirmation was deliberately not performed to avoid corrupting the real shared staging repo's `pipeline-state.json`, per the verification script's own explicit warning — covered instead by its two dedicated unit tests. No scope deviations. CI fully green. `npm test` on master: 728 files, 0 failed.

Three CI workflow findings were observed on the merge commit and investigated — none block this DoD:
1. **Deploy dashboards to GitHub Pages** (NEW finding, first seen this session) failed with `Resource not accessible by integration` when `actions/configure-pages@v5` tried to auto-create a Pages site — a repository-configuration issue (GitHub Pages not enabled, or the workflow's `GITHUB_TOKEN` lacks `pages: write`), unrelated to this story's code (no `dashboards/` files were touched).
2. **Improvement Agent — Scheduled Dreaming** failed again with the same `GH013` branch-protection ruleset rejection already logged in `ep4-s2`'s own DoD — now confirmed recurring, not a one-off.
3. **Trace Commit** succeeded this time (this PR's commit message had no embedded double-quoted text to trigger the shell-quoting defect previously found in `ep4-s2`'s DoD).

**Follow-up actions:**
1. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature (now affects `ep1-s3`, `ep1-s4`, `ep4-s1`, `ep2-s1`'s own local E2E/verification attempts identically).
2. Fold the deploy-timing + session-logout diagnostic into a shared skill instruction — now confirmed recurring a 6th time this session.
3. Investigate the new "Deploy dashboards to GitHub Pages" failure (repo settings or workflow permissions) and the recurring "Improvement Agent — Scheduled Dreaming" `GH013` conflict (needs either a path-based bypass extended to that bot's own commit paths, or a PR-based flow) — both logged as pipeline-maintenance follow-ups, not yet actioned as their own story.
4. Document the `branch-complete` gate's missing artefact convention (found this story, logged in `capture-log.md`): `gate-advance` for this specific gate requires a JSON file this pipeline has no established committed path for, unlike every other gate. Either define a real convention or document `branch-complete` as a legitimate `advance`-only exception to CLAUDE.md's gate-advance mandate.

---

## DoD Observations

1. **This is the first story in this feature delivered via `/subagent-execution`** rather than direct single-session implementation. The governance overhead (3 fresh implementer dispatches, 3 spec reviews, 3 code-quality reviews, 1 final cross-task review, 2 fix-and-re-review cycles) caught two real, substantive gaps a single-session implementation might have shipped silently: a test-structure convention deviation (Task 1) and a markup-only test masquerading as behavioral coverage (Task 2) — the latter is exactly the kind of gap that would have passed every existing check while leaving the actual filter logic unverified. Worth noting as a positive signal for continuing to use `/subagent-execution` on stories with real behavioral surface area, not just mechanical ones.
2. **A dispatched reviewer subagent hit the exact no-notification background-process trap its own instructions warned against** (the final cross-task reviewer backgrounded its own test run and then waited for a notification that would never arrive). Caught via the task-notification's own "waiting on its own background work" signal rather than silently hanging; corrected with a single follow-up message instructing it to re-run in the foreground. Confirms this failure mode isn't fully eliminated by stating the warning once — worth considering whether `/subagent-execution`'s own warning text needs to be even more explicit about what "foreground" means in practice (e.g. explicitly naming `run_in_background` as the thing never to use).
3. **AC3's live-staging verification was deliberately skipped**, the first time in this feature a planned live-browser AC check was intentionally not performed for a reason other than a `fake-test-db.js`/deploy-timing gap — specifically, doing so would have required corrupting the real shared staging repo's own `pipeline-state.json`, which the verification script's own setup notes already explicitly warned against. Judged the dual unit-test coverage (both failure modes) as sufficient given the alternative was a genuinely risky action against shared infrastructure.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Feature picker: read
pipeline-state.json and render feature list in modal" (ep2-s1). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or live Chrome confirmation)?
2. Is skipping AC3's live staging verification (to avoid corrupting the
   real shared pipeline-state.json) the right call, given the two
   dedicated unit tests already cover both failure modes?
3. Is the outcome verdict (COMPLETE) consistent with the AC rows, given
   this story closes with full staging confirmation on 3 of 4 ACs and a
   deliberate, justified skip on the 4th?
4. Should the branch-complete gate artefact gap (Follow-up action 4)
   become its own short-track story now, given it will recur on every
   future story's own branch-complete step?
```
