# Decision Log: bri-s3-3-role-boundary-guard-gap

**Feature:** bri-s3-3-role-boundary-guard-gap
**Discovery reference:** None — short-track (bug fix)
**Last updated:** 2026-08-21

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-21 | RISK-ACCEPT | branch-setup**
**Decision:** Proceed with rbg-s1's implementation despite 33 pre-existing failing files (out of 530) in `npm test` (the check-scripts suite), rather than pausing to investigate them first.
**Alternatives considered:** Pause rbg-s1 entirely and investigate/fix the 33 failures before writing any new code.
**Rationale:** This worktree branched directly off master (commit 2b2a028a) with zero code changes applied — the 33 failures are master's current baseline state, not something rbg-s1 introduces. None of the 33 failing files (mfc1/mfc2, ougl1-6, wsm2, wucp1, and others) touch this story's actual scope, which lives entirely in `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` — a file not exercised by `npm test` at all (it runs via the separate `npm run test:e2e` / Playwright track, which is clean: 5/5 passing against the current, pre-fix spec body). Blocking a narrowly-scoped test-quality fix on an unrelated, pre-existing, repo-wide test-health issue would not reduce risk and would stall the actual work.
**Made by:** Hamish King (operator), via explicit AskUserQuestion response during /branch-setup.
**Revisit trigger:** If any of the 33 failing check-scripts is later found to cover code this story's implementation touches (products.js, requireAdmin, or the E2E spec file itself), or if the count grows and starts masking real regressions in future stories' baselines.
---

---

## Architecture Decision Records

None for this feature.
