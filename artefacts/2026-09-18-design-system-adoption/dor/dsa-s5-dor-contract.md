# Contract Proposal: `design.system` Context Tag Triggers a Real DoR Hard Block

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
**Date:** 2026-09-18
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
A `design` key referencing `DESIGN.md`'s path in `.github/context.yml` (per `product/constraints.md` #8). A new conditional hard block, `H-DESIGN`, added to `skills/definition-of-ready/SKILL.md`'s hard-block table, modeled precisely on the existing `H-INF`/`H-MIG` trigger-condition/skip-when-absent pattern.

**What will NOT be built:**
An automated structural/layout compliance checker. No retroactive re-gating of `dsa-s1`–`dsa-s4` or any other already-in-flight story.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (context.yml references DESIGN.md) | Unit: read the real `context.yml` file, check for the path reference | Unit |
| AC2 (H-DESIGN scans, fails with specific message) | Unit: fixture file with a hardcoded non-token color; fixture file with only token values (negative control) | Unit |
| AC3 (noncompliant test story blocked) | Integration: fixture story tagged `hasDesignSystemTrack: true`, run full DoR hard-block sequence | Integration |
| AC4 (compliant test story passes) | Integration: same, compliant fixture | Integration |
| AC5 (untagged story unaffected) | Integration: fixture story with flag absent; re-run existing `H-INF`/`H-MIG` test coverage | Integration |

**Assumptions:**
`H-INF`/`H-MIG`'s real structural pattern is the correct template to extend.

**Estimated touch points:**
Files: `.github/context.yml`, `skills/definition-of-ready/SKILL.md`. Services: none. APIs: none.
