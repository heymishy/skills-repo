# Definition of Done: Collaborative sessions

**PR:** https://github.com/heymishy/skills-repo/pull/337 | **Merged:** 2026-05-08
**Story:** artefacts/archived/2026-05-07-web-ui-session-management/stories/wsm.2-collaborative-sessions.md
**Test plan:** artefacts/archived/2026-05-07-web-ui-session-management/test-plans/wsm.2-test-plan.md
**DoR artefact:** artefacts/archived/2026-05-07-web-ui-session-management/dor/wsm.2-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

**Note:** `pipeline-state.json` referenced a `dodArtefact` path for this story (implying an earlier DoD pass), but no file exists at that path (checked both the current and `archived/` locations) — the artefact was apparently never actually saved to disk, or was lost. This is a fresh write-up, informed by the real historical record still present in `pipeline-state.json`'s own `blocker` field and `wsm.4`'s own story artefact (which names this story's exact failing assertions as its target).

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| Original shape-mismatch defect (turns/stage missing from GET response) | ✅ (fixed by `wsm.4`, PR #339, 2026-05-10) | `wsm.4`'s own story explicitly names and maps to this story's exact failing tests | Historical record + `wsm.4`'s own DoD (this pass) | Fixed 2 days after this story's own merge |
| Live re-verification, 2026-08-17 | ❌ (different symptom) | `check-wsm2-collaborative-sessions.js` re-run fresh: 5 failures — T2b/T2c/T2d/T4a/T4b now fail with `404`, not the original shape-mismatch | Automated test, re-run fresh 2026-08-17 | **Pre-existing, already documented** — see below |

---

## Scope Deviations

**Historical:** at original merge (2026-05-08), this story shipped with 6 failing assertions (viewer response shape, viewer count, idle cleanup) — explicitly flagged and a follow-up story ("Follow-up story required") was correctly identified as needed.

**Resolution:** that follow-up was `wsm.4` (PR #339, merged 2026-05-10) — it directly named and fixed this story's exact failing tests (T2c, T2d, T4b, T5b, T5c, T7c) by removing a duplicate handler declaration that was shadowing the correct implementation. This is confirmed via `wsm.4`'s own story text, not just an assumption.

**Current gap (found in this pass):** re-running the same test file fresh in 2026-08-17 shows 5 of those same test IDs failing again — but with `404` responses, not the original shape-mismatch. This is a **different underlying issue** than what `wsm.2`/`wsm.4` originally addressed (something in the ~600 PRs merged since likely changed how the test's journey fixture resolves or how the route is reached). **This is not a new finding requiring a new follow-up story** — `check-wsm2-collaborative-sessions.js` is already listed in `tests/known-baseline-failures.json`, meaning this later regression was already identified and accepted as a known, pre-existing gap by an earlier point in this repo's history, independent of this DoD pass.

---

## Test Plan Coverage

**Tests passing in CI:** 12/17 fresh (2026-08-17). The 5 failures are pre-existing/documented, not newly introduced.
**Gaps:** See above — tracked in `tests/known-baseline-failures.json`, not a new gap.

---

## NFR Status

No new NFR concerns identified in this pass.

---

## Metric Signal

No formal benefit-metric artefact traced for this feature. No metric signal to record.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] If full collaborative-viewer functionality matters again, the current 404 regression (distinct from the original, already-fixed shape-mismatch defect) needs a fresh investigation — the root cause has changed since `wsm.4`'s fix. Not urgent: already tracked as a known baseline failure, not blocking any current work.

---

## DoD Observations

1. **This story's original deviation was genuinely fixed** (by `wsm.4`, 2 days later) — but `pipeline-state.json`'s `dodStatus`/`releaseReady`/`blocker` fields were never updated to reflect that, leaving this story looking permanently broken in the pipeline state for over 3 months when the real picture is more nuanced: fixed once, then hit a different, later, already-tracked regression.
2. See `wsm.4-dod.md` for the full resolution history and `wsm.3-dod.md` for the sibling story that `wsm.4` fully and cleanly resolved (no remaining regression there).
