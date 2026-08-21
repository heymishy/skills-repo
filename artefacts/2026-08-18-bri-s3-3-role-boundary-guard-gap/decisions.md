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
**2026-08-21 | RISK-ACCEPT | subagent-execution (Task 1)**
**Decision:** Amended rbg-s1's DoR constraint ("Do NOT touch any file under src/web-ui/") to touch `src/web-ui/server.js`, to wire the arl-s1/tir-s1/tir-s7/tir-s9/sec-perf-s2 role adapters (`setGetRoleForTenant`, `setGetCurrentRole`) to the in-memory fake test DB in `NODE_ENV=test` mode — a gap that made it impossible to write ANY real admin-role-gated E2E assertion locally (every role lookup fell back to non-admin, since the whole adapter block was only ever wired inside `if (process.env.DATABASE_URL)`). Did NOT fix the second, deeper bug this uncovered (see F12 below) — that was routed to a separate story instead.
**Alternatives considered:** (1) Leave rbg-s1's AC1 test weak/avoiding the real admin-gated route, defeating the story's entire purpose. (2) Pause rbg-s1 and create a separate short-track story for the wiring gap first, resuming rbg-s1 only after it ships.
**Rationale:** The fix is small, mechanical, and exactly mirrors an already-established, repeatedly-used precedent in the same code block (`bmau-s1`'s identical fix for `setModulesAdapter`, `bri-s3.2`'s identical fix for `setUserDb`/`_pshPool`, both a few lines above in `server.js`). Splitting it into a separate story would have added process overhead disproportionate to the size of the change, for a fix that rbg-s1 could not itself pass without.
**Made by:** Hamish King (operator), via explicit AskUserQuestion response during Task 1 implementation.
**Revisit trigger:** None expected — this mirrors an existing, already-accepted pattern.
---

---
**2026-08-21 | RISK-ACCEPT | subagent-execution (Task 1)**
**Decision:** After the wiring fix above, rbg-s1's AC1 test still failed — this time exposing a real, separate, higher-severity bug (bob, an engineer, incorrectly resolved to admin via `requireAdmin`'s live per-request role re-check on a shared `TENANT_ORG_ALLOWLIST` tenant). Rather than fixing this second bug inline under the same amendment, it was logged as its own finding (F12, `workspace/dod-backlog-findings.md`) with a dedicated short-track story (`lrtc-s1`, `artefacts/2026-08-21-live-role-recheck-tenant-collapse/`), and rbg-s1 was marked blocked (`health: red`) pending that story shipping.
**Alternatives considered:** Fix the second bug inline too, under the same RISK-ACCEPT umbrella as the first (offered to the operator as the "recommended" option).
**Rationale:** The first fix (test-harness wiring) was purely additive infrastructure with an existing, safe precedent. This second bug is a live security defect (privilege escalation between teammates sharing a tenant) in production-reachable code (`require-admin.js`, unconditionally wired in `server.js`) — qualitatively different in severity and blast radius from a test-harness gap, and warrants its own DoR/decision trail rather than being folded silently into a test-coverage story's implementation.
**Made by:** Hamish King (operator), via explicit AskUserQuestion response during Task 1 implementation.
**Revisit trigger:** None — resolved by `lrtc-s1` shipping; rbg-s1 resumes once that story's own AC3 (rbg-s1's AC1 test passes without further changes) is satisfied.
---

---

## Architecture Decision Records

None for this feature.
