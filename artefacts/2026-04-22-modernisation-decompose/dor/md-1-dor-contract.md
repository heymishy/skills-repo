# DoR Contract: Write `/modernisation-decompose` SKILL.md (md-1)

**Story:** md-1 — Write `/modernisation-decompose` SKILL.md
**Feature:** 2026-04-22-modernisation-decompose
**Produced by:** /definition-of-ready — 2026-04-22
**Status:** Approved

---

## What will be built

A single new file: `.github/skills/modernisation-decompose/SKILL.md`

Sections required:
1. YAML frontmatter — `name: modernisation-decompose`, `description`, `triggers` array
2. Entry condition check — verifies `artefacts/[system-slug]/reverse-engineering-report.md` exists; blocks with error message if absent
3. Decomposition step — surfaces Java boundary signals as stated rationale; explicit priority order: Maven module > Spring `@Service` > JPA aggregate root > `@Transactional` span; tie-breaking rules defined
4. Low-signal escalation — names the missing signal problem; offers exactly 3 distinct operator options
5. Completion output — describes `candidate-features.md` format; 5 required fields per entry; `umbrellaMetric: true` field with traceability note and explicit format specification
6. `## State update — mandatory final step` — describes writes to `corpus-state.md`: module coverage %, VERIFIED:UNCERTAIN ratio, `lastRunAt` timestamp
7. Extension point comment for non-Java languages (COBOL, PL/SQL, .NET) — comment only, not implemented

---

## What will NOT be built

- Non-Java language heuristics
- Changes to any existing SKILL.md files
- Pipeline visualiser integration for `corpus-state.md`
- Changes to `/review`, `/definition`, or any other existing skill
- The `candidate-features.md` file itself (created at operator runtime)
- New npm dependencies

---

## File touch points

| File | Action | Notes |
|------|--------|-------|
| `.github/skills/modernisation-decompose/SKILL.md` | CREATE | New directory and file |

All other files are out of scope. Any modification to files not listed here is a violation of this contract.

---

## AC → test mapping

| AC | Test ID(s) in test plan | Type |
|----|------------------------|------|
| AC1 — npm test passes with new skill registered | T2.1, T2.2 (integration) | Integration |
| AC2 — Entry condition with graceful block message | T1.2 | Unit |
| AC3 — Java boundary signals as rationale per boundary | T1.3 | Unit |
| AC4 — corpus-state.md three fields in state update | T1.4 | Unit |
| AC5 — candidate-features.md five fields in output | T1.5 | Unit |
| AC6 — Low-signal escalation three options | T1.6 | Unit |
| AC7 — umbrellaMetric field in output with traceability | T1.7 | Unit |

---

## Assumptions

- `reverse-engineering-report.md` path pattern follows `/reverse-engineer` output convention
- `corpus-state.md` is co-located in `artefacts/[system-slug]/`
- Review finding 1-M2 (umbrellaMetric format ambiguity) resolved by coding agent: must state explicit format in SKILL.md

---

## schemaDepends

None — no upstream story dependency.

---

## Explicit exclusions (out-of-scope guard)

- Do not modify `.github/skills/reverse-engineer/SKILL.md`
- Do not modify `.github/skills/discovery/SKILL.md`
- Do not modify `scripts/check-skill-contracts.js` (that is md-2's scope)
- Do not create or modify `artefacts/` files
- Do not modify `.github/templates/`
- Do not add any npm dependency
