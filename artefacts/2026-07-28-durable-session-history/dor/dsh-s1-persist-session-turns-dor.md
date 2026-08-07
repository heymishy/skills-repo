# Definition of Ready: dsh-s1 — Persist a stage's session turns to Postgres on completion

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s1-persist-session-turns-test-plan.md
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
| H5 | Benefit linkage names a metric | ✅ | |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Dependencies block is "None" |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-025/026/027 all cited |
| H-E2E | CSS-layout-dependent gap check | ✅ | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform owner. M1 signal: role unverified (not clearly non-engineering) |
| H-ADAPTER | Adapter wiring AC + throwing stub + separate task | ✅ | AC5 scopes wiring; AC4 confirms throw; Contract Proposal names wiring as its own task |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM findings acknowledged | ✅ | None outstanding (Run 2) | |
| W4 | Verification script reviewed by domain expert | ✅ | Confirmed by Hamish King, 2026-07-28 | Hamish King |
| W5 | No uncertain gap-table items | ✅ | None | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s1 — Persist a stage's session turns to Postgres on completion — artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s1-persist-session-turns-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, plain `assert`-based tests (matching tests/check-*.js convention) — no Jest/Mocha.
- New module: src/web-ui/adapters/session-turns-pg.js (D37 injectable adapter,
  stub throws "Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore()
  with a real implementation before use.").
- Real Postgres wiring in server.js is a SEPARATE task from the handler hook in
  routes/skills.js — do not combine them into one commit/task.
- New table `session_turns` (schema in the story's Data Model section) — add to
  scripts/migrate-schema-pg.js following the exact column/index conventions
  already used for `journeys`/`artefacts`.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing — specifically ADR-025 (tenant_id scoping), ADR-026 (already
  resolved via /clarify — do not re-litigate the new-table-vs-extend-artefacts
  decision), ADR-027 (this is ordinary src/web-ui/ app code, not a skill).
- Security standards (.github/standards/security/security-standards.md):
  parameterised queries only (no string concatenation in SQL); deny-by-default
  access control; no secrets/tokens in logs.
- Data standards (.github/standards/data/data-standards.md): this file is
  currently unfilled template scaffolding in this repo — no additional
  repo-specific data rules beyond what's already in this story's own NFRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture; Hamish King (Platform owner) is both story author and tech lead here. Acknowledged before assigning.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
