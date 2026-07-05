# Decisions: Product Hierarchy, Standards and Patterns Library

**Feature slug:** 2026-07-05-product-stds-hierarchy
**Created:** 2026-07-05 (retroactive at /definition-of-done — not created at discovery approval as CLAUDE.md mandates; see observation at end of file)

---

## Decision Log

### D1 — Context injection strategy: at session initialisation (ADR-022 Option B)

**Date:** 2026-07-05
**Context:** Two approaches were considered for injecting product context into skill sessions: (A) inject once at session start and persist in session state; (B) inject fresh at each session initialisation from the DB-canonical record.
**Decision:** Option B — inject at session initialisation, not across sessions. Each skill stage gets a fresh injection from the current product context.
**Rationale:** Option A risks divergence between injected content and DB state if product context is updated mid-delivery. Option B ensures trace validation always matches what the model received. The small overhead of one extra DB round-trip per session initialisation is acceptable.

---

### D2 — DB canonicity for context handoff (ADR-023 B-iii)

**Date:** 2026-07-05
**Context:** When assembling the system prompt, the product context content could be read from the session object (`session.artefactContent`) or retrieved fresh from Postgres via the injectable adapter.
**Decision:** Postgres via the injectable adapter (`getProductContext`) is the sole source. `session.artefactContent` or any in-memory copy must not be used as handoff input.
**Rationale:** Disk/DB canonicity is the ADR-023 B-iii rule. `/trace` validates against the DB record; if the injected content diverges from what trace sees, that is a traceability defect. Using the adapter enforces this.

---

### D3 — Injectable adapter pattern for AI/DB calls (D37)

**Date:** 2026-07-05
**Context:** Three operations require external IO that must be swappable in tests: AI draft generation (`generateProductDraft`), product context lookup (`getProductContext`), and standards lookup (`getActiveStandards`). The choice was direct inline calls vs injectable adapters.
**Decision:** All three implemented as injectable adapters with throwing stub defaults. Stubs throw `Error('Adapter not wired: <name>. Call set<Name>() before use.')`. Production wiring in `server.js` before HTTP start.
**Rationale:** CLAUDE.md D37 mandate. Throwing stubs make misconfiguration immediately visible — a silent null/empty return would let the flow complete incorrectly without an error signal.

---

### D4 — Standards opt-out model: per-standard junction table (psh-s9)

**Date:** 2026-07-05
**Context:** When a product opts out of an org-level standard, the opt-out could be stored as a flag on the standards row, as a flag on a product-standards join table, or as a separate `standard_product_optouts` junction table.
**Decision:** Separate `standard_product_optouts` junction table with `(product_id, standard_id)` UNIQUE constraint.
**Rationale:** A flag on the standards row would require modifying the standards record per-opt-out (multi-tenant write risk). A junction table is additive, isolates opt-out state cleanly, and supports the Phase 2 cross-org sharing model without schema changes. The UNIQUE constraint prevents duplicate opt-out rows.

---

### D5 — Solo plan enforcement: 1 product per solo tenant (psh-s3)

**Date:** 2026-07-05
**Context:** The platform supports solo, team, and enterprise plans. Whether to enforce a product limit on solo plans was a product decision — either no limit, a soft warning, or a hard 403 block.
**Decision:** Hard 403 block with `reason: plan_limit` and `upgradeRequired: true` for solo tenants attempting to create a second product.
**Rationale:** Hard limit keeps the data model clean (solo users have exactly one product) and creates a clear upgrade incentive. A soft warning would require UI complexity for a case that should be rare (solo devs rarely need multiple products before they upgrade). AC4 psh-s3.

---

### D6 — Standards injection ordering: Product Context → Standards → SKILL.md (psh-s10)

**Date:** 2026-07-05
**Context:** When both product context (psh-s5) and standards (psh-s10) are injected into the system prompt, the ordering relative to each other and relative to SKILL.md content must be decided.
**Decision:** Order is: (1) Product Context sections (from psh-s5), (2) Standards and Patterns sections (from psh-s10), (3) SKILL.md content.
**Rationale:** Product context (mission, tech-stack, constraints) provides the foundational frame. Standards provide constraints/guidelines that operate within that frame. SKILL.md provides the task instruction. This ordering mirrors a human reading a brief: understand the product first, then the constraints, then the specific task.

---

## Observation

This file was created retroactively at /definition-of-done (2026-07-05) rather than at discovery approval as CLAUDE.md mandates ("Create the file at discovery approval time; append entries as decisions are made during delivery"). The decisions above are accurate to what was implemented — none were revised post-implementation. Future features: create decisions.md at discovery approval and append as decisions are made; do not defer to DoD.
