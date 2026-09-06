# Definition of Done: Collapse five independent label tables into one shared, corrected table

**PR:** https://github.com/heymishy/skills-repo/pull/843 | **Merged:** 2026-09-06
**Story:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
**Test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s2-unified-label-table-test-plan.md
**DoR artefact:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s2-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: All 14 subdirectories → non-generic label | ✅ | `resolveLabel` covers all 14 keys; 14-subdirectory loop test, all passing | automated test: `tests/check-cat-s2-unified-label-table.js` | None |
| AC2: `dor-contract.md`/`dor.md` → distinct keys, reusing `_deriveMatrixColumn` | ✅ | `resolveColumnKey('dor', ...)` delegates via a lazy require (avoiding a real circular dependency found during implementation); cross-module agreement test | automated test | None |
| AC3: `CLAUDE.md` directory-tree updated | ✅ | Line 146 now lists all 14 names | manual verification (per test plan's own gap table — no automated test convention for markdown prose) | None |
| AC4: 3 protected existing tests pass unchanged | ✅ | `check-alrf-s4-postgres-artefact-fallback.js` (14/14), `check-wuce20-artefact-index-html.js` (40/40), `check-wuce6-feature-navigation.js` (57/57) — all unchanged, re-verified by 3 separate reviewer passes | automated test + individual re-runs | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded — two real engineering judgment calls were made during implementation (a circular-dependency fix, and preserving a protected test's `dor` assertion), both resolved without deviating from any AC, documented in `decisions.md`.

---

## Scope Deviations

None. The merged PR touches exactly 6 files, all named in the story's own file map or directly required by AC4's redirect work (`CLAUDE.md`, `artefact-fetcher.js`, `artefact-list.js`, `artefact-labels.js`, `plain-language-labels.js`, the new test file). No storage-location change, no UI-visible change beyond label-text consistency — confirmed by the mandatory final-review step, which explicitly checked for a 6th undiscovered label table and found none.

One deliberate, tracked deferral (not a violation): `plain-language-labels.js`'s `LABEL_MAP` keeps its own `dor: 'Ready Check'` entry as a separate literal rather than being fully redirected, because `labelArtefactType`'s own signature has no filename parameter and a real protected test (`check-wuce6-feature-navigation.js`) depends on this exact value. Logged in `decisions.md` (2026-09-06, SCOPE) as an accepted residual risk, with a revisit trigger if `labelArtefactType`'s signature ever changes.

One forward-looking landmine logged for `cat-s4`/`cat-s5` (not a cat-s2 defect): `resolveColumnKey`'s non-`dor` output (bare lowercased subdirectory name) does not yet match `features.js`'s own `_deriveMatrixColumn` `SUBDIR_KEY` mapping (e.g. `'stories'` vs `'story'`). Nothing calls it for non-`dor` subdirectories yet, so this has no live effect — logged in `decisions.md` (2026-09-06, SCOPE) for whichever story first wires real matrix rendering onto it.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 planned at `/test-plan` time / 39 actually implemented (33 additional regression-guard and coverage tests added during implementation as real gaps were found — flat-shape coverage, nested-hyphen collision case, `isKnownSubdir`/`listKnownSubdirs`/`ARTEFACT_SUBDIRS` invariant tests, 7-subdirectory consumer-level coverage — none were scope creep, all closed genuine test-adequacy gaps found by code-quality review)
**Tests passing in CI:** 39/39, confirmed via `gh pr checks 843` — all 7 CI jobs pass

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (14-subdirectory coverage) | ✅ | ✅ | 15 assertions after cleanup |
| AC2 (dor/dor-contract + reuse verification) | ✅ | ✅ | 2 tests, including cross-module agreement check |
| AC3 (CLAUDE.md edit) | ✅ | ✅ (manual) | No automated test — documented gap, handled correctly |
| AC4 (redirect + 3 protected tests) | ✅ | ✅ | 22 assertions across the redirect + protected-test trip-wires |

**Gaps (tests not implemented):** None. AC3's manual-only status was acknowledged explicitly at `/test-plan` time, not discovered post-hoc.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A — confirmed | Plain object/Map lookup, no measurable cost, no dedicated NFR test needed per the story's own NFR section |
| Security | ✅ N/A — confirmed | None identified — data-layer only, no new input surface |
| Accessibility | N/A | Data-layer only |
| Audit | N/A | Read-only, no state-changing action |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Registered-vs-disk divergence rate | ✅ (~90/260 features, ~35%) | Not yet — `cat-s2` ships the canonical label table only; no route/rendering consumer reads from it yet | Same trigger as `cat-s1`: measurement becomes possible once `cat-s4`/`cat-s5` wire real consumers onto the canonical builder |
| m2: Bugs of this class per session | ✅ (5 in one session) | Not yet — same reasoning | Same trigger as `cat-s1` |

**Signal recorded for both m1 and m2:** `not-yet-measured`, evidence note: "cat-s2 ships the canonical label table and redirects 3 of 5 old tables' internals to it; no route/rendering consumer reads resolveLabel/resolveColumnKey directly yet (cat-s4/cat-s5 do that wiring) — divergence-rate and bug-recurrence measurement is not yet possible."

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with concrete test evidence, zero scope deviations (two DRY/consistency deferrals tracked, not violations), zero test gaps, both applicable NFRs confirmed not-applicable, and all CI checks green. Two real engineering judgment calls surfaced and resolved correctly during implementation — a circular-dependency the plan didn't anticipate, and a protected-test conflict the plan's literal instructions would have broken — neither shipped as a defect.

**Follow-up actions:**
1. `cat-s4`/`cat-s5` must wire real consumers onto `resolveLabel`/`resolveColumnKey` before m1/m2 become measurable — tracked via the epic's own Benefit Metrics Addressed table, not a new action.
2. When `cat-s4`/`cat-s5` land, confirm whether `resolveColumnKey`'s non-`dor` output needs reconciling with `features.js`'s `SUBDIR_KEY` mapping — per the forward note in `decisions.md`.
3. If `labelArtefactType`'s signature is ever extended with a filename parameter for an unrelated reason, redirect its `dor` lookup through the canonical table at that point — per the other forward note in `decisions.md`.

---

## DoD Observations

1. **Two independent judgment calls in this story both concerned name/data collisions the original plan hadn't anticipated** (circular dependency; `dor` duplicate value). Both were caught by the implementer during TDD, not by a downstream reviewer — worth noting as evidence that reading the actual current state of a file before extending it (rather than trusting a plan written before implementation began) continues to pay off, consistent with the same lesson from `cat-s1`.
2. **A test-adequacy gap-finding cycle on Task 4 nearly doubled that task's own test count** (20 → 39 across the whole story) without any scope creep — all additions were direct responses to named, reasoned code-quality findings (missing coverage for `isKnownSubdir`/`listKnownSubdirs`, the `ARTEFACT_SUBDIRS` order-sensitive invariant, 7 previously-unverified migrated subdirectory names). No `/improve` action needed; this is the review process working as designed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Collapse five independent label tables into one shared, corrected table" (cat-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
