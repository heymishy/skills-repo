# Discovery: State File Authority Model

**Feature slug:** 2026-05-02-state-file-authority-model
**Discovery started:** 2026-05-02
**Discovery source:** /improve extraction — feature `2026-04-30-governed-distribution-and-onboarding`, Category B findings (B2: `workspace/state.json` schema absent, B3: story nesting dual-structure undocumented)
**Track:** Short-track — scope is tightly bounded from /improve evidence; no ideation phase needed

---

## Problem Statement

The platform uses two state files: `pipeline-state.json` (delivery evidence, strict schema, viz source of truth) and `workspace/state.json` (operator session checkpoint, no schema, written by `/checkpoint`). Skills currently have no documented rule for which file to write to, and `workspace/state.json` has no schema contract. At scale this produces mismatches between what skills write and what tooling reads, and makes contributor on-boarding harder.

---

## Proposed Scope

A single short-track story that:
1. Creates `workspace/state.schema.json` — lightweight JSON Schema Draft 7 for the checkpoint file
2. Writes ADR-016 — two-file state authority model (which file does what, who writes it, what reads it)
3. Writes ADR-017 — story nesting dual-structure documentation (flat vs nested, migration path)
4. Updates `/checkpoint` SKILL.md to reference the schema path

---

## Out of Scope

- Data migration between the two files
- Adding `workspace/state.json` validation to CI
- Changing the `pipeline-state.json` schema

---

## Approved By

heymishy — operator — 2026-05-02
