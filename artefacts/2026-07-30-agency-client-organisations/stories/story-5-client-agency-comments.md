## Story: Client-org lightweight collaboration — comments only

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **Client org member (read-only)**,
I want to **leave a comment on a product/feature my agency has shared with me**,
So that **I can give feedback directly in the tool, instead of only being able to silently view work with no way to respond**.

## Benefit Linkage

**Metric moved:** Ongoing client-agency artefact collaboration
**How:** This story delivers the exact mechanism the metric measures — a comment thread with participants from both an Agency org and a Client org.

## Architecture Constraints

- **ADR-025 (Multi-tenancy enforced at the application layer):** a comment is a new, additive object scoped to the same grant that governs viewing (Story 2) — a user can only comment on a resource they can already view via a valid grant. Commenting does not grant edit access to the underlying shared resource itself.
- **ADR-026 (Reuse before introducing new entities):** confirmed no existing commenting/annotation mechanism exists elsewhere in this codebase for products/features — this is a genuinely new table, not a duplicate.

## Dependencies

- **Upstream:** Story 2 (shared-access grants) — a user must have a valid grant to view a resource before commenting on it.
- **Downstream:** None within this epic.

## Acceptance Criteria

**AC1:** Given a Client-org user has a valid grant to view a shared product/feature, When they submit a comment on that resource, Then the comment is saved with the author's `org_id`, `user_id`, resource reference, and timestamp, and is visible to both the Client-org user and the Agency-org users with access to that resource.

**AC2:** Given a Client-org user does NOT have a grant to view a given resource, When they attempt to submit a comment on it directly (e.g. via a crafted request), Then the request is rejected — matching Story 2's AC4 policy (404, not 403).

**AC3:** Given an Agency-org user has access to a product/feature shared with a Client org, When they view that resource, Then they see comments left by Client-org users on it, and can reply with their own comment.

**AC4:** Given a comment thread exists with at least one comment from an Agency-org participant and at least one from a Client-org participant, When the benefit-metric measurement runs, Then this thread is counted as satisfying the "ongoing client-agency artefact collaboration" metric's minimum validation signal.

## Out of Scope

- Editing or deleting a submitted comment — comments are append-only in this MVP.
- Real-time updates (e.g. websocket push) when a new comment arrives — a page refresh or standard polling pattern is sufficient for MVP, consistent with this codebase's existing conventions elsewhere.
- Any comment moderation, reporting, or notification mechanism — out of scope; a natural follow-up if usage warrants it.
- Comments on resources not shared via a Story-2 grant (e.g. a Standalone tenant's own private products) — comments are scoped exclusively to the Agency/Client shared-resource context established by this epic.

## NFRs

- **Performance:** Comment list retrieval for a resource should not require an N+1 query pattern — one batched query per resource view, matching this codebase's own established convention (e.g. `_getArtefactCountsBulk`'s batched-read precedent).
- **Security:** Comment visibility and submission must go through the same grant-check guard as Story 2's view enforcement — a comment endpoint is a new read/write path and must not bypass the access-control guard established there.
- **Accessibility:** Comment form and thread display use real `<form>`/`<textarea>`/semantic list markup, keyboard-navigable.
- **Audit:** Comment creation is logged with author `org_id`, `user_id`, resource reference, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Data Model

---CANVAS-JSON: {"type":"data-model","title":"Client-agency comments","content":{"mermaid":"erDiagram\n    SHARED_ACCESS_GRANTS {\n        text grant_id PK\n        text relationship_id FK\n        text resource_type\n        text resource_id\n        timestamptz granted_at\n        timestamptz revoked_at\n    }\n    COMMENTS {\n        text comment_id PK\n        text resource_type\n        text resource_id\n        text org_id FK\n        text user_id FK\n        text body\n        timestamptz created_at\n    }\n    SHARED_ACCESS_GRANTS ||--o{ COMMENTS : \"scopes visibility of\""}}---

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
