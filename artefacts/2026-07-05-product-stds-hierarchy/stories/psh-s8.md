## Story: psh-s8 — Standards definition and management per product

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e5-standards-library.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **to create, view, and edit standards and patterns in a per-product standards library**,
So that **my team's coding guides, architecture patterns, and reference implementations are available in a single place and can later be injected into skill sessions — contributing to M4a (standards adoption rate) observation**.

## Benefit Linkage

**Metric moved:** M4a (Standards library adoption rate) — this story is the creation flow. The `standard_created` PostHog event emitted here is the primary signal PostHog will count over 60 days to establish a baseline. No target is set yet for M4a; this story populates the observation data.
**How:** An operator who creates ≥1 standard triggers `standard_created`. PostHog counts unique `tenantId` values with at least one `standard_created` event over 60 days. This gives the adoption rate used to set the M4a target.

## Architecture Constraints

- **ADR-011 (artefact-first):** Any new `src/` module for standards management requires this artefact to exist first.
- **MC-SEC-01 (no raw innerHTML):** Standard names and content rendered in the standards list must be HTML-escaped before DOM insertion. Standard content may contain code snippets — these must be rendered safely (pre-escaped or via a text-safe renderer).
- **Path traversal guard (ougl):** If any standard content is written to disk at a path derived from form input, the resolved path must be validated against the allowed base directory. HTTP 400 if the guard fails; no file is written.
- **ADR-003 (schema-first):** No new pipeline-state.json fields are introduced in this story.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (standards table must exist).
- **Downstream:** psh-s9 (org-level promotion requires standards to exist), psh-s10 (injection requires standards to exist and be queryable).

## Acceptance Criteria

**AC1:** Given the operator is on a product's standards view, when they submit the create-standard form (name + content — markdown text, required; description — optional), then a row is inserted into the `standards` table with `product_id` = current product's `product_id`, `org_id` = `req.session.tenantId`, `visibility = 'product'`, `name` and `content` as submitted. HTTP 201 is returned with the new `standard_id`.

**AC2 (PostHog event):** Given a standard is created successfully, when the creation response is returned, then a PostHog `standard_created` event is emitted with properties: `standardId`, `productId`, `tenantId`, `visibility: 'product'`.

**AC3 (list view):** Given the operator views the product's standards list, when the page loads, then all standards with `product_id = current product` are shown with their name, visibility indicator (`Product` or `Org`), and creation date. Standards are ordered by creation date (newest first).

**AC4 (edit):** Given an existing standard, when the operator submits an edit (updated name or content), then the `standards` table row is updated with the new values and `updated_at` is refreshed to the current time. HTTP 200 is returned.

**AC5 (input sanitisation):** Given the standards form accepts a `name` field containing `<script>alert(1)</script>` or other HTML, when the value is stored and later rendered in the standards list, then the rendered name is the plain text string — no script executes and no HTML is injected into the DOM.

**AC6 (path traversal guard):** Given the standards creation endpoint derives a file path from the standard name or content, when the resolved path does not start with the permitted base directory, then the server returns HTTP 400 and no file is written.

## Out of Scope

- Org-level promotion — psh-s9.
- Standards injection into skill sessions — psh-s10.
- Standards versioning or change history — post-MVP.
- Reference file / URL import — post-MVP.
- Standards deletion — post-MVP (standards are append-only in MVP; deletion requires audit consideration).

## NFRs

- **Security:** Standard content is HTML-escaped before rendering. `req.session.tenantId` is the sole authoritative source of org_id on write — never from request body.
- **Performance:** Standards list loads in < 1 second for products with ≤ 50 standards.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

New standards CRUD route + view. No AI calls in this story. Path traversal guard is a standard pattern established in ougl.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependency (psh-s1) confirmed complete
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
