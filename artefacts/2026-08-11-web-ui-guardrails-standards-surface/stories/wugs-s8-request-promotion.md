## Story: Request a product-level guardrail/standard be promoted to org level

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-3-promotion-approval.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **tech lead who has a product-level guardrail/standard proven at their product**,
I want **a "request promotion to org level" action on that entry**,
So that **I have a governed path to propose it as a broader floor, instead of no path at all** (per discovery's Problem Statement — "no governed path to do that today").

## Benefit Linkage

**Metric moved:** Product-to-org promotion-approval workflow usage
**How:** This story delivers the "request submitted" half of the metric's minimum validation signal — without it, there is nothing for `wugs-s9` to approve.

## Architecture Constraints

- **New tracking table** — no existing table can represent a pending promotion request (product-level content is a repo file, not a DB row); this story introduces `guardrail_promotion_requests` (`request_id` PK, `tenant_id`, `product_id`, `file_path`, `content_snapshot`, `status` [`pending`/`approved`/`rejected`], `requested_by`, `requested_at`).
- **`content_snapshot` is taken at request time, not re-read at approval time** — so what an admin approves is exactly what was requested, immune to the product-level file changing between request and approval.
- **Multi-tenancy (ADR-025):** `tenant_id`-scoped, same application-layer pattern as every other tenant table.

## Dependencies

- **Upstream:** `wugs-s2` (product-level view, where the "request promotion" action is added).
- **Downstream:** `wugs-s9` (approves/rejects this story's requests), `wugs-s10` (audit-logs this story's action).

## Acceptance Criteria

**AC1:** Given a product-level guardrail/standard entry, When a tech lead clicks "request promotion," Then a `guardrail_promotion_requests` row is created with `status: pending` and the entry's current content snapshotted.

**AC2:** Given a promotion request already exists and is still `pending` for the same entry, When the same tech lead tries to request promotion again, Then the UI shows the existing pending request rather than creating a duplicate.

**AC3:** Given a promotion request is submitted, When the view is next rendered, Then the entry shows a "promotion requested, pending approval" indicator.

**AC4:** Given a non-admin, non-owning-tenant user attempts to call the request-promotion endpoint directly (bypassing the UI), When the request is made, Then it is rejected with 403/404 (matching this platform's existing FORBIDDEN-vs-NOT_FOUND convention) if the product doesn't belong to their tenant.

## Out of Scope

- **Approving or rejecting the request** — `wugs-s9`.
- **Withdrawing/cancelling a pending request** — not in MVP; if needed, a small follow-up story.

## NFRs

- **Performance:** None specific.
- **Security:** Tenant-scoping (AC4) is a hard requirement, not advisory.
- **Accessibility:** "Request promotion" is a real button, keyboard-accessible.
- **Audit:** Request creation is audit-logged — covered fully by `wugs-s10`, not duplicated here.

## Complexity Rating

**Rating:** 1 — a straightforward request-creation story on top of already-built views.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)

---CANVAS-JSON: {"type":"data-model","title":"Data model — promotion requests","content":{"mermaid":"erDiagram\n    GUARDRAIL_PROMOTION_REQUESTS {\n        uuid request_id PK\n        text tenant_id\n        text product_id\n        text file_path\n        text content_snapshot\n        text status\n        text requested_by\n        timestamptz requested_at\n    }\n    TENANT_ORG_REPO {\n        text tenant_id PK\n        text repo_owner\n        text repo_name\n    }\n    GUARDRAIL_PROMOTION_REQUESTS }o--|| TENANT_ORG_REPO : \"resolved to target repo at approval time (wugs-s9)\""}}---
