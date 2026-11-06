# Decision Log: bcfx-s1

**Feature:** Branch-complete's freshness check must not be invalidated by verify-completion's own bookkeeping commit
**Discovery reference:** N/A — short-track bug fix, discovered during `/definition-of-done` for `ilce-s2`

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-11-06 | RISK-ACCEPT | branch-setup**
**Decision:** Proceeding with `bcfx-s1`'s worktree baseline despite 4 pre-existing test failures (`scripts/check-pipeline-state-integrity.js`, `tests/check-cat-s1-core-trace-builder.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`) — same established rotating category observed throughout this session's other stories, none caused by this fix.
**Alternatives considered:** investigate and fix — rejected, already-documented pre-existing/flaky failures unrelated to this feature.
**Rationale:** confirmed via direct baseline run before any `bcfx-s1` code existed; fixing unrelated pre-existing issues is out of scope for this fix.
**Made by:** Hamish King (via /branch-setup, 2026-11-06)
**Revisit trigger:** if any of these files' failures ever correlate with a change this fix actually makes, re-open as a real regression.
---
