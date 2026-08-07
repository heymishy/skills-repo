# Definition of Ready: dsh-s5 — Archive turns older than 60 days out of the hot table

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s5-archive-job-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | |
| H2 | ≥3 ACs in G/W/T | ✅ | 5 |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage names a metric | ✅ | Direct implementation of the metric it measures |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Same reasoning as dsh-s2 |
| H9 | Architecture Constraints, no Cat E HIGH | ✅ | ADR-025/027, product/constraints.md #11 all cited |
| H-E2E | Layout-dependent gap check | ✅ | No UI surface |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | |
| H-ADAPTER | D37 adapter introduced (CLI-scoped, matching purge-e2e-tenants.js) | ✅ PASS | Stub throws; the CLI entrypoint itself IS the production wiring (same shape as purge-e2e-tenants.js — no separate server.js wiring applies to a standalone scheduled script) |

---

## Warnings

All resolved (same basis as prior stories).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s5 — Archive turns older than 60 days out of the hot table — artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s5-archive-job-test-plan.md

Goal:
Make every test in the test plan pass.

Constraints:
- New scripts/archive-session-turns.js — mirror purge-e2e-tenants.js's exact
  shape: D37 injectable adapter (stub throws), CLI entrypoint wires the real
  pg.Pool, never throws out of the main loop (log + continue per row), always
  exits 0 (pure hygiene, not a correctness gate — same rationale as
  purge-e2e-tenants.js's own header comment).
- New session_turns_archive table (same shape as session_turns) — add to
  scripts/migrate-schema-pg.js.
- New scheduled GitHub Actions workflow (cron trigger) — this must be the ONLY
  new persistent-looking mechanism; do not introduce a long-running process.
  Reference product/constraints.md #11 explicitly in the workflow's own
  comments, matching this repo's existing commenting convention.
- AC3's test uses execFileSync to spawn the CLI as a real child process
  (matching check-alrf-s11-purge-e2e-tenants.js's existing pattern for
  purge-e2e-tenants.js's own CLI tests) — do not skip this by only testing the
  exported function.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
