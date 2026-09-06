# Definition of Done: Build the canonical artefact trace from real disk structure for any feature

**PR:** https://github.com/heymishy/skills-repo/pull/842 | **Merged:** 2026-09-06
**Story:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
**Test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s1-core-trace-builder-test-plan.md
**DoR artefact:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s1-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: Fully-registered feature → correct epic/story/artefact attribution | ✅ | `[cat-s1] AC1` blocks (nested-shape via `2026-07-01-landing-auth-billing`, flat-shape via `2026-09-06-feature-artefact-document-matrix`, longest-prefix and bare-`<slug>.md` regression guards) — 14 assertions, all passing | automated test: `tests/check-cat-s1-core-trace-builder.js` | None — a genuine AC1 regression (bare `<slug>.md` files matching `bsgm-s1`'s own earlier fix) was found by the mandatory final-review step and fixed in commit `8ca84e64` before merge, so the merged code has no known deviation |
| AC2: Zero-registration feature (`phase4`, 205 files) → all returned, no drop, no crash | ✅ | `returns all 205 real files` against the real, on-disk `phase4` fixture | automated test | None |
| AC3: Archived-directory fallback, one implementation | ✅ | `resolves via the archived/ fallback` + `finds the file under the archived path` | automated test | None |
| AC4: Genuinely nonexistent slug → typed not-found | ✅ | `status is not-found, not null, not thrown` | automated test | None |
| AC5: Unsynced tenant checkout → distinct not-yet-synced | ✅ | `not-yet-synced is never conflated with not-found` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded — the only material gap found during delivery (the bare-`<slug>.md` regression) was caught and fixed pre-merge by this story's own final-review step, so it does not appear here as a shipped deviation.

---

## Scope Deviations

None. The merged PR touches exactly two files, both new (`src/web-ui/adapters/artefact-trace.js`, `tests/check-cat-s1-core-trace-builder.js`) — confirmed via `gh pr view 842 --json files` at branch-complete time and re-confirmed here. No label/subdirectory table consolidation, no divergence classification beyond the 3 status codes (`found`/`not-found`/`not-yet-synced`), and no `pipeline-state.json` write — all three items named in the story's own Out of Scope section were correctly excluded.

One deliberate, tracked deferral (not a violation): a DRY overlap between the new `walkDir` helper and `artefact-list.js`'s existing `walkMdFiles` was identified during implementation and explicitly deferred to `cat-s4`/`cat-s5` rather than fixed inline, since consolidating now would touch a file outside this story's own scope. Logged in `artefacts/2026-09-06-canonical-artefact-trace/decisions.md` (2026-09-06, SCOPE).

---

## Test Plan Coverage

**Tests from plan implemented:** 13 planned at `/test-plan` time / 23 actually implemented (10 additional regression-guard and NFR tests added during implementation as real gaps were found — bare-slug attribution, nested-hyphen prefix collision, flat-shape coverage — none were in the original test plan's count, all are genuine strengthenings, not scope creep)
**Tests passing in CI:** 23 / 23, confirmed via `gh pr checks 842` — all 7 CI jobs pass (Cross-tenant isolation spec, Lint/typecheck/test/build, Playwright E2E smoke, Run assurance gate, Scenario A/B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (nested + flat shape + 2 prefix guards + bare-slug fix) | ✅ | ✅ | 14 assertions total |
| AC2 (zero-registration, 205 files) | ✅ | ✅ | 3 assertions |
| AC3 (archived fallback) | ✅ | ✅ | 2 assertions |
| AC4 (not-found) | ✅ | ✅ | 2 assertions |
| AC5 (not-yet-synced) | ✅ | ✅ | 2 assertions |
| NFR-perf (walk <50ms) | ✅ | ✅ | measured 17–24ms across runs |
| NFR-sec (no shell-out) | ✅ | ✅ | asserts no `require('child_process')` |

**Gaps (tests not implemented):** None. No `CSS-layout-dependent` gaps exist for this story (confirmed at `/test-plan` time — this is a pure data-layer function with no rendering surface), so the layout-gap audit is not applicable.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — directory walk <50ms for ~300-file feature | ✅ | Measured 17–24ms against the real 205-file `phase4` fixture across multiple task-level and final-review runs |
| Security — no new unvalidated input surface | ✅ | Source-review test asserts the module never `require`s `child_process`; independently re-verified by two separate reviewer subagents (regex tested against real positive/negative cases) |
| Accessibility | N/A | Data-layer function, no rendering |
| Audit | N/A | Read-only, no state-changing action |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Registered-vs-disk divergence rate | ✅ (~90/260 features, ~35%) | Not yet — `cat-s1` ships the builder function only; no consumer (`features.js`, `artefact-fetcher.js`) reads from it yet | Measurement becomes possible once `cat-s4`/`cat-s5` wire consumers onto `buildArtefactTrace`, replacing the independent derivations this metric tracks |
| m2: Bugs of this class per session | ✅ (5 in one session: `bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`, `phase4`) | Not yet — same reasoning; the metric tracks whether a *future* fix touches one file or many, which requires consumers to actually be wired onto the canonical builder first | Same trigger as m1 |

`m3` (Unregistered documents visible without a bug report) does not list `cat-s1` as a contributing story per the benefit-metric artefact's own matrix (`cat-s3`, `cat-s4` only) — not assessed here.

**Signal recorded for both m1 and m2:** `not-yet-measured`, evidence note: "cat-s1 ships the canonical builder function only; no consumer wired onto it yet (cat-s4/cat-s5 do that wiring) — divergence-rate and bug-recurrence measurement is not yet possible."

---

## Outcome

**COMPLETE**

All 5 ACs satisfied with concrete test evidence, zero scope deviations (one DRY deferral tracked, not a violation), zero test gaps, both applicable NFRs verified, and all CI checks green. The one real defect found during delivery (bare-`<slug>.md` attribution regression) was caught and fixed before merge by the story's own mandatory final-review step — it does not appear as a post-merge gap.

**Follow-up actions:**
1. `cat-s2`–`cat-s6` (already in progress / planned) must actually wire consumers onto `buildArtefactTrace` before m1/m2 become measurable — tracked via the epic's own Benefit Metrics Addressed table, not a new action.
2. When `cat-s4`/`cat-s5` land, confirm whether `artefact-list.js`'s `walkMdFiles` becomes fully dead code (delete it) or still has a live caller (extract the shared util at that point) — per the DRY deferral logged in `decisions.md`.

---

## DoD Observations

1. **Pipeline-state bookkeeping gap found and fixed during this DoD pass:** the feature's `metrics[]` array in `pipeline-state.json` had empty `contributingStories` for all 3 metrics, despite the benefit-metric artefact's own Metric Coverage Matrix having named story lists for each since `/definition`. This was never populated — likely an omission at `/definition` time (the matrix table is manually authored prose; nothing in `/definition`'s own skill file mechanically syncs it to `pipeline-state.json`'s `metrics[].contributingStories`). Fixed here by populating all 3 metrics' `contributingStories` arrays to match the artefact. **Tag: /improve candidate** — `/definition`'s own "State update" section should be checked for whether it's supposed to populate `metrics[].contributingStories` from the benefit-metric matrix mechanically, and if not, that gap should be added to its instructions so future features don't silently carry empty `contributingStories` arrays until a DoD pass happens to notice.
2. **The final-review step (part of `/subagent-execution`, not `/definition-of-done`) caught a real, would-have-shipped regression** — worth a forward note for whoever eventually runs `/improve` on this epic: this is direct evidence that the mandatory whole-diff final review (as distinct from per-task reviews) earns its keep, and should not be considered a redundant/skippable step in future loop-design optimization passes.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build the canonical artefact trace from real disk structure for any feature" (cat-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
