# NFR Profile: Product Hierarchy, Standards and Patterns Library

**Feature slug:** 2026-07-05-product-stds-hierarchy
**Generated at:** /definition — 2026-07-05
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md

---

## Performance

| Requirement | Target | Story | Source |
|-------------|--------|-------|--------|
| Product creation (AI draft generation) | < 30 seconds end-to-end from form submission to inline review rendered | psh-s3 | UX constraint — operator must not feel blocked |
| Product context DB lookup per session init | ≤ 1 Postgres round-trip | psh-s5 | ADR-023 B-iii: DB canonical; must not fan out |
| Standards DB lookup per session init | ≤ 1 Postgres round-trip (may combine with product context query) | psh-s10 | Same pattern as psh-s5 |
| Per-product kanban render | < 2 seconds for products with ≤ 50 features | psh-s6 | Operator expectation for board view |
| Org kanban render | < 3 seconds for tenants with ≤ 10 products and ≤ 100 features | psh-s7 | Acceptable for cross-org overview |
| Standards list load | < 1 second for products with ≤ 50 standards | psh-s8 | Management view latency |
| Migration execution | Must complete without locking `journeys` table in a way that blocks read queries | psh-s2 | Live service — no full-table write locks |

---

## Security

| Requirement | Applies to | Story | Source |
|-------------|------------|-------|--------|
| `req.session.tenantId` is sole authoritative source for `org_id` / `tenant_id` on all DB writes | All routes | All | CLAUDE.md — access model guardrail |
| `req.session.accessToken` canonical field name for GitHub auth | Any route reading GitHub token | Any that touch GitHub | CLAUDE.md |
| HTML-escape all user-supplied content before DOM insertion | Product names, standard names, standard content, feature names in kanban | psh-s3, psh-s4, psh-s6, psh-s7, psh-s8 | MC-SEC-01 |
| Path traversal guard on disk writes derived from request data | Product context file writes (psh-s3), standards disk writes (psh-s8 if applicable) | psh-s3, psh-s8 | ougl path traversal NFR |
| `visibility = 'public'` blocked via HTTP 400 | Standards management endpoints | psh-s9 | Phase 2 guard — feature not built yet |
| No credentials, tokens, or personal data in committed artefacts | All artefact files | — | CLAUDE.md |
| POSTHOG_KEY must not appear in any Pino log output | PostHog integration | psh-s3, psh-s4, psh-s6, psh-s7, psh-s8 | CLAUDE.md |
| D37: injectable adapter stub defaults must throw, not return null/empty | `generateProductDraft`, `getProductContext`, `getActiveStandards` | psh-s3, psh-s5, psh-s10 | D37 — CLAUDE.md |

---

## Availability and Reliability

| Requirement | Target | Story | Source |
|-------------|--------|-------|--------|
| Service availability SLA | Inherits platform availability — no new SLA requirement | — | No dedicated uptime requirement for this feature |
| Migration failure handling | If migration fails mid-run, must be safely re-runnable (idempotent INSERT/UPDATE) | psh-s2 | psh-s2 AC: idempotency required |
| Standards injection failure | If standards DB query fails, `buildSystemPrompt` must propagate the error — no silent omission | psh-s10 | psh-s10 NFR |
| Product context injection failure | If product context read fails, session must not silently proceed with empty context — error or graceful null-product fallback only | psh-s5 | psh-s5 AC3 + NFR |

---

## Data

| Requirement | Value | Source |
|-------------|-------|--------|
| Data classification | Internal | Platform classification |
| Data residency | Same Fly.io Postgres instance as existing application data — no new residency constraint | CLAUDE.md |
| PII / sensitive data in standards content | Standards content is operator-authored — may contain internal documentation. Not public. Access scoped to tenantId. | — |
| No new external data stores | All product and standards data stored in existing Postgres instance. No new third-party services. | CLAUDE.md constraints |

---

## Compliance and Regulation

No regulated constraints apply to this feature. No PCI-DSS, GDPR, SOX, or HIPAA scope. No external compliance frameworks referenced in discovery. No regulated-constraint propagation actions required.

---

## Technology Constraints

| Constraint | Applies to | Source |
|------------|------------|--------|
| Node.js CommonJS only — no ES modules | All new `src/` modules | CLAUDE.md |
| No new npm dependencies | All new code | CLAUDE.md constraints |
| Postgres schema changes via idempotent migration | psh-s1 (`products`, `standards`), psh-s2 (journeys migration), psh-s9 (`standard_product_optouts`) | ADR-003 |
| `ALTER TABLE journeys ADD COLUMN IF NOT EXISTS product_id` — must not break existing journey queries | psh-s1 | Existing journey data continuity |

---

## Accessibility

| Requirement | Applies to | Story | Source |
|-------------|------------|-------|--------|
| Health indicators must use icon/text alongside colour — not colour alone | Kanban health display | psh-s6, psh-s7 | MC-A11Y-02 |
| Filter dropdowns and all interactive kanban elements must be keyboard-accessible | Product filter, kanban navigation | psh-s7 | MC-A11Y-01 |
| CSS-layout-dependent ACs (alignment, responsive breakpoints) require Playwright E2E or RISK-ACCEPT at DoR | psh-s6 AC6, psh-s7 AC6 | psh-s6, psh-s7 | ADR-018 / CLAUDE.md B2 |

---

## Monitoring and Observability

| Signal | How measured | Story |
|--------|-------------|-------|
| `product_created` PostHog event | PostHog product_created with productId, tenantId | psh-s3 |
| `journey_created` with `productId` set | PostHog journey_created enriched with productId | psh-s4 |
| `kanban_viewed` with `view: 'product'` | PostHog kanban_viewed event | psh-s6 |
| `kanban_viewed` with `view: 'org'` | PostHog kanban_viewed event | psh-s7 |
| `standard_created` PostHog event | PostHog standard_created with standardId, productId, tenantId, visibility | psh-s8 |
| Product context injection verified | Automated CI test asserts system prompt includes product tech-stack.md and constraints.md content | psh-s5 |
| Standards injection verified | Automated CI test asserts system prompt includes standards section for product with ≥1 active standard | psh-s10 |
