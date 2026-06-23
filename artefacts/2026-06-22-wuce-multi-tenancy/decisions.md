# Decisions — WUCE Multi-Tenancy

**Feature slug:** wuce-multi-tenancy
**Last updated:** 2026-06-22

---

## Regulated constraint propagation check (Step 4a)

No regulated constraints (PCI-DSS, GDPR, SOX, HIPAA, or equivalent) were identified in the discovery Constraints section. The constraints are operational/security (C1–C6): solo-founder operability, accessToken strip-before-write, path-traversal guard preservation, phase independence, chain-hash trace preservation, and infra governance. None of these reference an external compliance framework or a third-party assessment gate.

Step 4a is not applicable. No trigger table required.

---

## Decision 1 — Legacy journey permissive access policy

**Date:** 2026-06-22
**Context:** Journeys created before Phase 0 have `ownerId: null` (set by the existing `createJourney()` path, which does not set `ownerId`). After the authorization guard is wired, these journeys would be unreachable unless explicitly handled.
**Decision:** Legacy journeys (ownerId null) remain accessible to any authenticated user in Phase 0 and Phase 1. This is the permissive legacy behaviour. When Phase 1 populates `tenantId` on journeys at create time, newly created journeys have the tenant boundary enforced; legacy journeys retain the null-ownerId passthrough.
**Rationale:** Solo-developer deployment — all pre-Phase-0 journeys belong to one user and there is no cross-user risk in practice. Silently blocking access to all pre-existing journeys at Phase 0 would break in-flight work with no warning and no migration path.
**Applies to:** p0.1 AC1, p1.2 AC4.

---

## Decision 2 — Multi-org membership: first allowlist match wins

**Date:** 2026-06-22
**Context:** Discovery OQ5 — if a user belongs to two orgs in the allowlist, which one becomes their tenantId?
**Decision:** First match in `TENANT_ORG_ALLOWLIST` order (not GitHub org response order).
**Rationale:** Operator-controlled priority (allowlist order is set by the operator, not by the user). Deterministic and reproducible across API responses.
**Applies to:** p1.1 AC5.

---

## Decision 3 — Tenant directory provisioning is operator-manual

**Date:** 2026-06-22
**Context:** Phase 2 requires `WUCE_TENANT_ROOT_BASE/${tenantId}/` to exist before a tenant can use the platform. Should the platform auto-create the directory on first use?
**Decision:** Operator creates the directory manually before onboarding a tenant. The platform reads from it but does not create it.
**Rationale:** Auto-creation without validation risks writing data to an unexpected location if `tenantId` resolution is misconfigured. Solo-founder context — onboarding a new tenant is a deliberate operator action; a directory creation step is appropriate friction.
**Applies to:** p2.1 out-of-scope section.

---

## Decision 4 — In-memory journey store is NOT namespaced in Phase 2

**Date:** 2026-06-22
**Context:** The in-memory `_journeys` Map in `journey-store.js` holds all journeys for all tenants in a single Map (keyed by UUID). Phase 2 could namespace this Map by tenantId.
**Decision:** Do not namespace the in-memory store in Phase 2. The authorization guard + `isSameTenant()` enforces HTTP-layer isolation. The in-memory store is replaced by Postgres in Phase 3; namespacing a temporary in-memory structure that will be replaced adds complexity with no durable value.
**Rationale:** The journeyId is a UUID — guessing another tenant's journeyId in-memory is not the attack vector. The attack vector is the HTTP layer, which is already guarded. Phase 3 Postgres is the right place to enforce storage-layer isolation.
**Applies to:** p2.1 out-of-scope section.

---

## Decision 6 — MEDIUM review finding acknowledgement: benefit coverage matrix gap

**Date:** 2026-06-22
**Context:** All 8 story reviews raised finding M1 (MEDIUM): the benefit coverage matrix was absent from `benefit-metric.md`. Definition SKILL.md Step 5 requires this matrix to be populated after all stories are written; that step was omitted during the definition run.
**Decision:** Add the `## Metric coverage matrix` section to `benefit-metric.md` immediately — before any story proceeds to DoR. The gap was a definition-step omission, not a story defect; the per-story metric linkage fields were complete. The fix was applied on 2026-06-22 alongside the /review run.
**Rationale:** The fix is one additive section in one file with no impact on story scope, ACs, or test plans. It is the correct path forward; blocking all 8 stories until a separate definition re-run would add overhead with no quality benefit.
**Applies to:** All 8 story review reports (findings 1-M1 through 8-M1). RESOLVED — matrix now present in benefit-metric.md.

---

## Decision 5 — Slicing strategy: risk-first across all 6 stories

**Date:** 2026-06-22
**Context:** Discovery identified a live security bug (Phase 0), then identity boundary (Phase 1), then storage isolation (Phase 2). Multiple slicing strategies considered.
**Decision:** Risk-first — Phase 0 closes the highest-risk item (active exploit possible today), Phase 1 adds identity (medium risk, no infra change), Phase 2 adds storage isolation (lowest risk of the three, infra change required).
**Rationale:** Phase 0 can ship today with no dependencies. Phases 1 and 2 have sequencing dependencies. Risk-first naturally produces the correct phase ordering.
**Applies to:** All 3 epics.
