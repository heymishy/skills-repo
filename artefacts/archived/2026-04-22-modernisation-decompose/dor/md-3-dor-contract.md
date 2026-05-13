# DoR Contract: Add ADR-014 to `architecture-guardrails.md` (md-3)

**Story:** md-3 — Add ADR-014 (Dual-Scope Artefact Model) to `architecture-guardrails.md`
**Feature:** 2026-04-22-modernisation-decompose
**Produced by:** /definition-of-ready — 2026-04-22
**Status:** Approved

---

## What will be built

A single updated file: `.github/architecture-guardrails.md`.

Two append-only changes:
1. New row in the Active ADRs table for ADR-014: title "Two-tier artefact scope model: system corpus vs feature delivery", status Active, constrains-field referencing modernisation programme contributors and `/modernisation-decompose` skill invocations.
2. Full ADR write-up section `### ADR-014:` appended to the file body with Context, Decision, and Consequences sub-sections plus `**Decided:** 2026-04-22`.

---

## What will NOT be built

- Changes to any existing ADR entries or guardrail sections
- Updates to the `guardrails-registry` YAML block (out of scope — review finding md-3 1-M1 acknowledged)
- New governance check scripts to enforce the ADR
- Changes to any other file

---

## File touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/architecture-guardrails.md` | MODIFY | Append ADR-014 row + write-up section only |

All other files are out of scope. Any modification to files not listed here is a violation of this contract.

---

## AC → test mapping

| AC | Test ID(s) in test plan | Type |
|----|------------------------|------|
| AC1 — ADR-014 row exists with correct fields | T1.1, T1.2, T1.3 (unit) | Unit |
| AC2 — ADR write-up with Context/Decision/Consequences | T1.4, T1.5, T1.6 (unit) | Unit |
| AC3 — npm test passes after change | T2 (integration) | Integration |

---

## Assumptions

- ADR-014 is the next sequential number (after ADR-013 in the current Active ADRs table)
- `**Decided:** 2026-04-22` format matches what tests assert
- The `guardrails-registry` YAML block is out of scope per review finding acknowledgement

---

## schemaDepends

`schemaDepends: []` — dependency on md-1 is delivery-order only (the dual-scope model design decisions from md-1 inform the ADR content, but no pipeline-state.json fields are read from md-1's output). No schema check required.

---

## Explicit exclusions (out-of-scope guard)

- Do not modify any existing ADR entry (`### ADR-001` through `### ADR-013`)
- Do not modify the `guardrails-registry` YAML block
- Do not modify mandatory constraints, active anti-patterns, or any other section of architecture-guardrails.md beyond the two specified additions
- Do not modify any script, SKILL.md, or artefact file
- Do not add any npm dependency
