# Challenger Spec: proposed-definition-skill-update-f6f7

## User Story

As a platform maintainer,
I want to validate the proposed change to the `definition` skill,
so that any modification to the skill file is backed by evidence and a pre-check result before it lands in master.

## Acceptance Criteria

- **AC1:** The proposed change directly addresses F6 (slicing strategy suppresses regulated constraint propagation to architectural-change stories).
- **AC2:** The proposed change directly addresses F7 (self-check table is feature-scoped, not story-scoped — produces false positives for regulated constraints).
- **AC3:** The change is additive — it does not remove or weaken any existing rule (anti-overfitting gate).
- **AC4:** The change produces no regression on non-regulated features (skip path is explicit and unconditional).
- **AC5:** The trigger definition provides a concrete, model-applicable test for "does this story trigger the regulated gate" — not relying on model judgment alone.

## Done condition

Pre-check is complete when `proposed-definition-skill-update-f6f7-challenger-result.md` exists in `workspace/proposals/` with all five required fields: `verdict`, `session_summary`, `traces_produced`, `reviewer` (named human identity), `reviewed_at` (ISO datetime).

## Proposal reference

- **Proposal ID:** proposed-definition-skill-update-f6f7
- **Skill slug:** definition
- **Confidence:** high (single, well-evidenced failure mode from EXP-003 Config C runs 1 and 2)
- **Created at:** 2026-05-14
- **Evidence count:** 3 (config-A-run-1/definition.md, config-C-run-1/definition.md, config-C-run-2/definition.md comparative analysis; cpf-scores.md F6/F7 findings)
- **Source findings:** F6 and F7 in `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/cpf-scores.md`

## Proposed diff summary

**Two additions to `.github/skills/definition/SKILL.md`:**

**Addition 1 — New Step 4a (inserted between Step 4 and Step 5):**
A mandatory regulated constraint propagation check. When regulated constraints are present in the discovery Constraints section, the step:
1. Lists each regulated constraint and its gate type (4a.1)
2. Enumerates which stories trigger each gate using a concrete trigger definition heuristic — distinguishing implementation stories (have code ACs; modify system components within regulated scope) from preparation stories (documentation, scoping, vendor engagement only) — and gets operator confirmation (4a.2)
3. Verifies the constraint appears in the Architecture Constraints field of every triggering story; surfaces a gap prompt and applies the fix immediately if missing (4a.3)

The step explicitly prohibits feature-level checks: "Verifying that a regulated constraint 'appears somewhere in the feature' is insufficient and produces false positives." This directly prevents the F7 false-positive pattern.

**Addition 2 — New quality check item (in "Quality checks before completing" section):**
"Regulated constraint propagation (Step 4a): for each regulated constraint in discovery, appears as Architecture Constraint in every story whose implementation scope triggers the gate — per-story check, not feature-level"

## Challenger scenario

**If this text had been in the SKILL.md during Config C run 2 /definition:**

Step 4a.1 would have listed C2 (PCI DSS — process gate) and C3 (AML/CFT — retention rule) as regulated constraints.

Step 4a.2 trigger enumeration:
- C2: S1.2 triggers (implements PostgreSQL replication — modifies data architecture within PCI DSS CDE scope; has code ACs); S2.2 triggers (implements failover automation — modifies access controls and network paths within PCI DSS CDE scope; has code ACs); S1.1 does NOT trigger alone (scoping workshop — solely documentation/planning); S1.3 does NOT trigger alone (validation and sign-off — solely post-implementation validation)
- C3: S1.3 triggers (implements 5-year retention — introduces data store retention rule within AML/CFT scope; has code ACs)

Step 4a.3 verification:
- C2 in S1.2 → MISSING → gap prompt → fix applied
- C2 in S2.2 → MISSING → gap prompt → fix applied
- C3 in S1.3 → PRESENT → pass

Predicted CPF impact: C2 at definition would be 1.00 (both triggering stories corrected before artefact finalized) instead of 0.35.

## Notes

Reviewer must be a named human identity. Analytical pre-check is sufficient for AC1–AC5; a live skill run is not required for this proposal since the scenario prediction is mechanically deterministic given the trigger definition.
