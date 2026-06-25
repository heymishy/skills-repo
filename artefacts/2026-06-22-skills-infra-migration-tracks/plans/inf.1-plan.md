# Implementation Plan: inf.1 — Write `infra-definition` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.1-dor.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.1-test-plan.md
**Test file:** `tests/check-inf1-infra-definition-skill.js`
**Worktree:** `.worktrees/inf.1` (branch: `feature/inf.1`)
**Plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Goal

Create `.github/skills/infra-definition/SKILL.md` — a new skill instruction file that guides operators through producing a structured infra-definition artefact covering: change description, blast-radius statement, rollback plan (discrete steps + time-to-execute), tier-applicability table (4 tiers × validation status), and plan/preview attachment. No hardcoded tool names in required-step contexts. Accepts `ops/` prefix. Explicit credentials warning in attachment section.

---

## File Map

| File | Action | Rationale |
|------|--------|-----------|
| `tests/check-inf1-infra-definition-skill.js` | **CREATE** | 15 tests (13 unit + 2 NFR) — written RED before SKILL.md exists |
| `.github/skills/infra-definition/SKILL.md` | **CREATE** | The deliverable — all ACs are content assertions against this file |

**Files NOT touched:** src/, pipeline-state.json (via advance only), any existing SKILL.md.

---

## Tasks

### T1 — Write failing tests (RED)

Create `tests/check-inf1-infra-definition-skill.js` with 15 tests. All will fail (SKILL.md doesn't exist yet).

### T2 — Create SKILL.md (GREEN)

Create `.github/skills/infra-definition/SKILL.md` with:
- `## Step 1: Change Description` — operator declares what infrastructure component changes
- `## Step 2: Blast-Radius Statement` — declares impact scope (services, environments, data at risk)
- `## Step 3: Rollback Plan` — numbered discrete steps + "**Estimated time to execute:**" field
- `## Step 4: Tier-Applicability` — markdown table with columns: Tier | Scope | Validation Status; rows: local, CI, staging, production
- `## Step 5: Plan/Preview Attachment` — tool-agnostic; attach "your plan/preview output" as text; explicit warning against credentials/tokens/secrets
- Output path: `artefacts/[feature]/infra/[story-id]-infra-def.md` or `artefacts/ops/[ops-slug]/infra/standalone-infra-def.md`
- Tool references (Terraform, Pulumi, CDK) only in a non-exhaustive examples list, not as required steps

### T3 — Verify + commit + PR

1. `node tests/check-inf1-infra-definition-skill.js` — 15/15 PASS
2. `node scripts/check-pipeline-state-integrity.js` — 0 fail
3. Commit: `feat(inf.1): infra-definition SKILL.md with blast-radius, rollback, tier table`
4. Push + `gh pr create --draft`
