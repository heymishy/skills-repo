# Definition of Done: Postgres artefact-content fallback for listArtefacts

**PR:** https://github.com/heymishy/skills-repo/pull/617 | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s4-postgres-artefact-fallback.md
**Test plan:** `tests/check-alrf-s4-postgres-artefact-fallback.js` (no separate test-plan.md — retrospective story convention)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Postgres rows used when local disk and GitHub API both find nothing | ✅ | `check-alrf-s4-postgres-artefact-fallback.js` AC1 | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — local disk still wins over Postgres when local has real content | ✅ | AC2 | Automated test, re-run fresh | None |
| AC3 — an existing-but-empty local directory still checks Postgres before giving up | ✅ | AC3 | Automated test, re-run fresh | None |
| AC4 — no regression when `pgArtefactRows` is omitted or empty | ✅ | AC4a/b | Automated test, re-run fresh | None |
| AC5 — route-level wiring resolves the journey once and fetches Postgres rows via `journeyId` | ✅ | AC5 | Automated test, re-run fresh | None |
| AC6 — a Postgres error degrades gracefully (no crash, empty rows, not a 500) | ✅ | AC6 | Automated test, re-run fresh | None |
| AC7 — no regression to existing suites | ✅ | `check-wuce6-feature-navigation.js` (57/57), `check-wuce20-artefact-index-html.js` (40/40), `check-kfd1-...` (42/42), `check-alrf-s1-...` (8/8), `check-p3.1-pg-journey-adapter.js` (13/13), `check-p3.3-persistence-survival.js` (18/18), all cited unchanged at merge | Not re-run individually in this pass — see Test Plan Coverage | None |

---

## Scope Deviations

None identified in this retroactive pass. Story explicitly changed `alrf-s1`'s original short-circuit-on-empty-dir behaviour (AC3) — a deliberate, documented in-scope revision to a sibling story's logic within the same cluster, not an undocumented deviation.

---

## Test Plan Coverage

**Tests passing:** 14/14 (`check-alrf-s4-postgres-artefact-fallback.js`), re-run fresh 2026-08-17.
**Story-cited regression suites at merge** — not individually re-run in this pass; `check-alrf-s1-...` itself was re-run fresh in this same DoD pass (8/8, unchanged) as part of `alrf-s1`'s own DoD write-up.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Graceful degradation on Postgres error (no crash, no 500) | ✅ | AC6 |
| No write-path change (read-only fallback, local disk still authoritative when present) | ✅ | AC2/AC4, story's own risk classification (LOW) |

---

## Metric Signal

No formal benefit-metric artefact traced. Closes the actual remaining gap in the artefact-listing mismatch this whole cluster (`alrf-s1` → `alrf-s4`) started from: content that survives only in Postgres after a redeploy (the realistic staging case) is now findable on the feature-index page.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None for this story. Story's own Out of Scope item (a GitHub-commit-based write path for artefacts, per `decisions.md` D3) remains an open architectural question, not a gap in this story's delivered read-side fix — tracked in the feature's own `decisions.md`, not re-litigated here.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. Closes the 3-story `alrf-s1`/`alrf-s2`/`alrf-s4` sub-cluster within this feature directory (distinct from the identically-prefixed `2026-07-26-function-level-audit` feature's own `alrf-s5`/`s6`/`s8`/`s10`/`s11`/`s12` — a coincidental ID-prefix collision across two unrelated features both dated 2026-07-26, confirmed via `git log` PR numbers (#614/#615/#617 here vs. that feature's own #620-#624 range) and via neither cluster's stories appearing in the other's pipeline-state.json registration).
