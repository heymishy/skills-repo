# Definition of Ready Checklist (Short-track)

## Definition of Ready: Fix missing position_x/position_y migration breaking the journey canvas in deployed environments

**Story reference:** short-track bug fix (production incident)
**Test plan reference:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-hotfix1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Short-track justification

Bug fix, bounded, single-file change (`src/web-ui/server.js`), root cause already confirmed directly against real staging logs (not assumed) — matches CLAUDE.md's own short-track criteria exactly. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 3 ACs, 2 integration tests covering all 3 |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | Pure bug fix, mirrors an already-established in-repo pattern (inline migration duplicating a `scripts/*.js` file not shipped in the Docker image) — no new pattern introduced |
| H-GOV | Production-incident urgency | ✅ | Live 500 error confirmed on staging via `flyctl logs -a wuce-staging`, reported directly by the operator |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: Add position_x/position_y (nullable DOUBLE PRECISION) to server.js's
own inline customer_journey_stages startup migration block (around line
527-558), matching scripts/migrate-schema-journeys.js's own column
definitions exactly (ALTER TABLE customer_journey_stages ADD COLUMN IF
NOT EXISTS position_x DOUBLE PRECISION / position_y DOUBLE PRECISION).

Constraints:
- This is the ONLY correct fix location -- scripts/migrate-schema-journeys.js
  is never copied into the deployed Docker image (confirmed via Dockerfile's
  own COPY allowlist). Do not "fix" this by adding scripts/ to the Dockerfile;
  that changes an established, intentional convention this codebase already
  uses for every other table in this exact area (see the comments
  immediately above the customer_journeys/customer_journey_stages migration
  block in server.js).
- Must be idempotent (ADD COLUMN IF NOT EXISTS) -- staging/production already
  have real rows in this table.
- Verify against a real, disposable Postgres instance seeded with the OLD
  (pre-fix) table schema, not a fresh CREATE TABLE that already includes
  the columns -- the whole point is proving the ALTER path works against
  real staging's actual current state.
- Deploy to staging and confirm live via flyctl logs + a real authenticated
  page load before considering this done -- this is a live incident, not
  just a code fix.

Oversight level: Low (single-file, well-understood, already-established pattern)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — production-incident fast-track, operator already engaged directly in this session.
