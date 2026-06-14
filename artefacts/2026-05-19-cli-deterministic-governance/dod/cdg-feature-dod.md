# Definition of Done: CLI Deterministic Governance (feature)

**Feature:** 2026-05-19-cli-deterministic-governance
**PRs:** #353 (cdg.1), #354 (cdg.2), #355 (cdg.3), #356 (cdg.4), #357 (cdg.5), #358 (cdg.6), #373 (cdg.7)
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-15

---

## Outcome: COMPLETE ✅

All 7 stories delivered. All ACs satisfied. All PRs merged to master. Gate enforcement deployed on CLI and web UI paths. Two tier-1/tier-3 metrics deferred pending EXP runs — the enforcement infrastructure is in place; measurement follows.

---

## Story Delivery Summary

| Story | PR | ACs | Tests | Status |
|-------|----|-----|-------|--------|
| cdg.1 — skills validate CLI + exit code framework | #353 | 6/6 | 26 automated | ✅ COMPLETE |
| cdg.2 — H1–H9 gate logic: DoR deterministic checks | #354 | 7/7 | 33+ automated | ✅ COMPLETE |
| cdg.3 — skills advance: pipeline-state field write | #355 | — | — | ✅ COMPLETE |
| cdg.4 — Web UI gate-confirm: `_validate` adapter | #356 | 7/7 | 10 automated | ✅ COMPLETE |
| cdg.5 — Chain-hash trace emission on gate-confirm | #357 | 8/8 | 10 automated | ✅ COMPLETE |
| cdg.6 — skills advance enhancements (epic-nested, dot-notation, coercion, harness rule) | #358 | 7/7 | 34 automated | ✅ COMPLETE |
| cdg.7 — Gated advance: gate-map registry, validate-before-write, web UI writer delegation | #373 | 6/6 | 37 automated | ✅ COMPLETE |

---

## What was delivered

**Phase 1 — validate CLI (cdg.1, cdg.2):** `skills validate` command with `--story` and `--artefact-path` flags. H1–H9 checks implemented as deterministic gate logic. `check-cli-outer-loop.js` (34 assertions) verifies the gate. Exit code framework: 0=pass, 1=generic-fail, 3=H1-H8 violation, 4=structural-fail, 8=missing-args.

**Phase 2 — advance CLI + trace (cdg.3, cdg.5, cdg.6):** `skills advance` command writes pipeline-state fields post-validation. Chain-hash trace emitted to `workspace/traces/<feature-slug>.trace.jsonl` on every successful gate-confirm. Epic-nested story lookup, dot-notation field writes, integer coercion, and prototype pollution guard added in cdg.6. Harness wiring rule in `copilot-instructions.md` governs post-merge agent behaviour.

**Phase 2 — web UI + gate-advance (cdg.4, cdg.7):** `_validate` adapter injected into `handlePostGateConfirm` in `journey.js` — validate call sits between disk write and pipeline-state write, enforcing ADR-023 order. `gate-advance` command added (`cli-gate-advance.js` + `gate-map.js` 7-key registry). `pipeline-state-writer.js` now delegates all story-level writes to `advance()` — enum validation and prototype pollution guard applied on every web UI state write.

---

## Metric Status

| Metric | Signal | Evidence |
|--------|--------|---------|
| M1 — CPF composite score | not-yet-measured | Deferred; requires EXP run against regulated story. Enforcement infrastructure deployed. |
| M2 — Gate bypass incident rate | on-track | gate-advance deployed; mandate in copilot-instructions.md; trace emitted on every success. |
| M3 — Gate logic unit test fixtures (target ≥33) | on-track | 34 assertions in check-cli-outer-loop.js; 10 further in cdg.4 (web UI layer). |
| M4 — Schema violation rate | on-track | 0 violations in test suite; pipeline-state-writer delegates to advance() on every write. |
| T3M1 — Audit readability | not-yet-measured | Minimum signal = one complete feature with validate entries. pmf trace entries available in workspace/traces/. Follow-on: operator review of pmf trace to record T3M1. |

---

## Feature Review

**Review artefact:** `artefacts/2026-05-19-cli-deterministic-governance/review/cdg-feature-review-1.md`
**Verdict:** PASSED — 0 HIGH | 2 MEDIUM (M1/T3M1 deferred) | 2 LOW (cdg.3 DoD gap; retrospective reviews)

---

## Open Items / Follow-On Actions

1. **M1 measurement:** Run EXP against a regulated story delivery to establish CPF baseline. Target 0.9; minimum signal 0.8.
2. **T3M1 close:** Operator reviews `workspace/traces/2026-06-14-web-ui-pm-flow.trace.jsonl` (pmf feature trace) and records readability signal. Can close T3M1 as a lightweight standalone action.
3. **cdg.3 DoD artefact:** Write retroactively from git history if audit completeness is required. Not blocking feature closure.
4. **Feature archival:** Move to `artefacts/archived/` once T3M1 signal is recorded and CDG Phase 3 (if any) is scoped separately.
