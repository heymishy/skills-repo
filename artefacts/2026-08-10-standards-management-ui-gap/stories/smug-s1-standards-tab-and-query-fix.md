## Story: Standards management has a fully-built backend but no way to reach it by clicking anything

**Epic reference:** None — short-track (missing-UI gap, found via source tracing + live confirmation on the operator's real `skills-framework` product page)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner managing standards across my products**,
I want **a Standards tab on each product's page where I can see, promote-to-org, and opt-out of standards**,
So that **I can actually use the standards-promotion feature that already exists on the backend, instead of it being reachable only via direct API calls**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — `psh-s8`/`psh-s9` (feature `2026-07-05-product-stds-hierarchy`, both `dodStatus: complete` in `pipeline-state.json`) shipped a real, tested backend for standards management (`src/web-ui/routes/standards.js`), but `server.js` only wires those handlers as JSON REST endpoints (`POST/GET /products/:id/standards`, `PUT /standards/:id/promote`, `POST/DELETE /standards/:id/optout`). No HTML route, no template, and no inline script anywhere in `products.js` references "Promote to org", "Opt out", or renders a standards list. Confirmed live on 2026-08-10: `skills-framework`'s real product page nav shows only Delete product / Kanban / Roadmap / New feature — no Standards tab exists to click.

**How:** A second, related gap was found in the same trace: even the API layer under-implements the promotion/opt-out model it claims to support. `standards.js`'s `standardsList` query (`WHERE product_id = $1 AND org_id = $2`) never includes org-promoted standards from *other* products, and never excludes opted-out ones — contrast with `server.js`'s `setStandardsAdapter` (used correctly for skill-session prompt injection, `psh-s10`), which does `(product_id = $1 OR (visibility='org' AND org_id=$2)) AND NOT IN (opt-outs)`. If a UI is ever built directly on top of `standardsList` as-is, promoted/opted-out standards will render wrong.

## Architecture Constraints

- **Reuse `setStandardsAdapter`'s already-correct query shape** (`server.js`, used for `psh-s10`'s prompt injection) as the reference implementation for `standardsList` — do not invent a second, divergent query. Ideally the two converge on one shared query function; at minimum `standardsList` must be brought in line with the same visibility/opt-out logic.
- **New HTML route + tab, matching this repo's existing product-page tab pattern** (Kanban/Roadmap already exist as sibling nav links off the product page) — do not build a separate top-level page disconnected from product context.
- **Reuse the existing `POST /standards/:id/optout`, `DELETE /standards/:id/optout`, `PUT /standards/:id/promote` handlers** — this story adds the UI that calls them; it does not change their contracts.

## Dependencies

- **Upstream:** `psh-s8`, `psh-s9`, `psh-s10` (all shipped, `dodStatus: complete`) — this story is a UI-completion follow-up to already-merged backend work, not new backend design.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a product page, When the operator views its navigation, Then a "Standards" tab/link is present alongside Kanban/Roadmap.

**AC2:** Given the Standards tab, When opened, Then it lists the product's own standards plus any standards promoted from other products in the same org, each showing name and visibility (own / org-promoted).

**AC3:** Given a standard the product has opted out of, When the Standards tab renders, Then that standard does not appear in the list (matching the same opt-out semantics `psh-s10`'s prompt injection already correctly applies).

**AC4:** Given a standard owned by this product, When the operator clicks "Promote to org", Then `PUT /standards/:id/promote` is called and the standard's visibility updates to org-promoted, reflected immediately in the UI without a full page reload requirement.

**AC5:** Given an org-promoted standard from another product, When the operator clicks "Opt out", Then `POST /standards/:id/optout` is called and the standard disappears from this product's list.

**AC6:** Given the `standardsList` query itself, When called for a product with at least one org-promoted standard from a different product AND at least one opted-out standard, Then the returned list includes the promoted one and excludes the opted-out one — matching `setStandardsAdapter`'s already-correct semantics exactly.

## Out of Scope

- **Any change to the promote/opt-out HTTP handler contracts** (`standards.js`'s existing routes) — reused as-is, only newly reachable via UI.
- **Standards CREATION UI** — this story surfaces existing standards for promotion/opt-out management; creating a new standard from scratch is a separate, larger scope not addressed here.
- **`psh-s10`'s prompt-injection mechanism itself** — already correct, used only as the reference implementation to fix `standardsList` against.

## NFRs

- **Correctness:** Closes a real "backend exists, unreachable by any user action" gap, plus a real data-correctness gap in the API layer that would otherwise silently ship an incomplete feature.
- **Consistency:** The fixed `standardsList` query must produce results consistent with what `psh-s10`'s already-shipped, already-tested prompt-injection path computes for the same product — divergence here is the exact failure shape `tir-s5` (a prior story this session's research surfaced) already demonstrated can ship a feature that looks complete but silently does the wrong thing.

## Complexity Rating

**Rating:** 2 — the query fix (AC6) is small and has a proven-correct reference implementation to match. The UI (AC1-AC5) is new but bounded — a single list view with two buttons, reusing existing endpoints, no new backend design.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
