# Review: inc4 — Canvas output panel

**Story:** inc4
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Review date:** 2026-06-15
**Reviewer:** Coding Agent
**Result:** PASS (conditional — design gate must be cleared before DoR can be signed off)

---

## Findings

### HIGH
None.

### MEDIUM

**4-M1 — Design gate is a hard blocker for DoR**
inc4 cannot reach definition-of-ready without a `/frontend-design` artefact defining the canvas layout, block types, and interaction model. This is by design (stated in story and NFR), but it means inc4 cannot be implemented until the design gate is cleared. Risk: design work delays the story beyond the current sprint.

Mitigation accepted: design gate is explicit in DoR; story stage will remain at `review` until design artefact exists.

### LOW

**4-L1 — Block type allowlist not fully defined in story**
AC1 references "unknown type returns null" but the story does not enumerate the full allowlist. The test plan references `cluster-tree`, `table`, `text` but the story AC is looser. Resolved: DoR will specify the type allowlist.

**4-L2 — `#canvas-panel` relationship to `#draft-content` ambiguous**
AC3 says "replaces or augments" — the implementation choice affects both the HTML structure and the iwu2 right-panel tests. Resolved: design artefact must specify this before DoR.

---

## Summary

PASS conditional on design gate. The SSE marker pattern (CANVAS-JSON → canvasBlock) is well-established from the assumption/condition precedents. The main risk is the design gate delay, which is accepted and gated.
