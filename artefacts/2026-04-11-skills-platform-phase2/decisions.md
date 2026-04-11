# Decisions: Skills Platform — Phase 2

---

## SCOPE — 2026-04-11

### SCOPE-01: p2.5 split into p2.5a and p2.5b

**Date:** 2026-04-11
**Decided by:** Hamish (operator) — pre-authorised before /definition began
**Decision type:** SCOPE

During /definition story decomposition, analysis of the five surface adapter types (IaC, SaaS-API, SaaS-GUI, M365-admin, manual) produced a projected AC count exceeding the operator-specified threshold of 8 for a single story. Operator instruction: "if AC count exceeds 8, split into p2.5a (IaC + SaaS-API) and p2.5b (SaaS-GUI + M365-admin + manual)."

**Split decision:**
- p2.5a: IaC + SaaS-API adapters + respective POLICY.md floor variants (~6 ACs)
- p2.5b: SaaS-GUI + M365-admin + manual adapters + respective POLICY.md floor variants (~6 ACs)

**Rationale:** IaC and SaaS-API are cloud-native, CI-adjacent surface types with diff-based findings vocabularies. SaaS-GUI, M365-admin, and manual introduce novel result patterns (screen-capture evidence, admin audit log references, checklist-only outputs) that increase AC complexity independently of the IaC/API pattern. Grouping by result vocabulary is the natural seam.

**Effect on story count:** 12 planned → 13 total (E2 gains one story). Estimate impact within E1 headroom (~+2h outer loop for the extra story through review + DoR).

---

## ARCH — 2026-04-11

### ARCH-01: /definition D1/D2/D3 delivered as a single story

**Date:** 2026-04-11
**Decided by:** Hamish (operator)
**Decision type:** ARCH

D1 (dependency chain validation), D2 (testability filter), and D3 (learnings exit step) are grouped into a single story (p2.1) rather than three separate stories. Rationale: all three are instruction-text changes to `.github/skills/definition/SKILL.md`; they have a natural exit-gate relationship (D3 fires at the same point as the scope accumulator check); and separating them would require three sequential pass-through /review + DoR cycles on the same file with no value-add checkpoint between them.

**Constraint:** Any future change to one of D1/D2/D3 that does not affect the other two should be a separate story.

---

## ASSUMPTION — 2026-04-11

### ASSUMPTION-01: EA registry API contract shape deferred to p2.6 story decomposition

**Date:** 2026-04-11
**Decided by:** Hamish (operator)
**Decision type:** ASSUMPTION

The EA registry Path A resolver (p2.6) requires knowledge of the EA registry's published API response format (specifically: which field name carries the surface type). This contract is not yet confirmed. The assumption recorded here: the EA registry at `https://github.com/heymishy/ea-registry` follows JSON with a `surfaceType` field in the application record. This must be validated at p2.6 /definition-of-ready — if the actual field name differs, the resolver AC3 test is the catch point.

**Resolution trigger:** p2.6 /definition-of-ready H1 (clear and testable ACs) — the AC must reference the confirmed field name, not a placeholder.
