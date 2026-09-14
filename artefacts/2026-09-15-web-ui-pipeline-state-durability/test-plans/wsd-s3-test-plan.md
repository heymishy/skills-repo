# Test Plan: Snapshot pipeline-state writer context at first-known-good (wsd-s3)

**Story:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s3.md
**Track:** Short-track

---

## Test Cases

No new automated test file — this is a pure refactor of an existing call site (moving where three already-tested values are read from), covered entirely by re-running the existing regression suite that already exercises `handlePostGateConfirm`'s pipeline-state-writer call path, plus a live production re-verification for AC3 (not automatable — see below).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Regression | `tests/check-owle6-pipeline-state-auto-write.js` re-run — 20 checks, unchanged |
| T2 | AC1 | Regression | `tests/check-acdg-s1-commit-guard.js` re-run — 6 checks, unchanged |
| T3 | AC1 | Regression | `tests/check-acdg-s2-durability-signal.js` re-run — 8 checks, unchanged |
| T4 | AC1 | Regression | `tests/check-das-s1-commit-artefact-git-fallback.js` re-run — 11 checks, unchanged |
| T5 | AC1 | Regression | `tests/check-dcuf-s1-github-commit-real-completion-point.js` re-run — 13 checks, unchanged |
| T6 | AC1 | Regression | `tests/check-cdg4-gate-confirm-validation.js` re-run — 10 checks, unchanged |
| T7 | AC2 | Regression | `tests/check-wsd-s2-github-pipeline-state-writer.js` re-run — 24 assertions, unchanged |
| T8 | AC3 | Live verification | Post-deploy: drive a fresh feature through a real stage completion in the production web UI; confirm a new commit touching `.github/pipeline-state.json` lands on `origin/master` reflecting that feature's advance. Performed by the orchestrating session directly against production, not an automated CI test. |

## Regression coverage

T1-T7 collectively ARE the regression surface for this change — every existing test file that exercises `handlePostGateConfirm`'s artefact-commit + pipeline-state-writer call sites.

## Out of Scope (per story)

- Root-causing the exact session-staleness mechanism.
- Any change to `pipeline-state-github-writer.js`'s own contract.
