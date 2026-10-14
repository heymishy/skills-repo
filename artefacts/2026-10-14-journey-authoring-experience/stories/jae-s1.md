## Story: Seed a new journey with a default starting-skeleton template

**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **a brand-new journey to start with a recognizable default stage outline instead of a blank list**,
So that **I begin from a familiar shape rather than staring at an empty journey, directly reducing the friction this feature's own M1 (time-to-first-complete stage) and M2 (fields populated without manual prompting) measure**.

## Benefit Linkage

**Metric moved:** M2 — Fields populated without manual prompting (secondary: M1 — Time-to-first-complete stage, by removing the "what do I even name my first stage" hesitation)
**How:** A seeded, named 5-stage skeleton gives the operator a recognizable starting shape immediately, rather than requiring them to invent stage names from nothing before any other authoring friction even begins.

## Architecture Constraints

- **Constraint — reuse over invention (ADR-026).** Template-seeding reuses `handlePostJourneyStage`'s own existing single-stage INSERT shape (`customer_journey_stages (journey_id, tenant_id, name, position)`), called N times server-side within `handlePostJourneys`'s own existing transaction — not a new, separate insert path or a new table.
- **No data model change.** The 5-stage default skeleton (`Evaluate`, `Discover`, `Purchase`, `Onboard`, `Retain` — per the `cjm-best-practice` spike's own research) is a hardcoded constant in `journeys.js`, not a new `templates` table. A template library (plural, selectable) is explicitly out of scope for this story.
- **Multi-tenancy (ADR-025).** Seeded stages are inserted with the exact same `tenant_id` as the journey they belong to, via the same session-derived `tenantId` `handlePostJourneys` already uses — no new tenant-scoping logic needed.
- **Opt-out, not forced.** The existing "+ New journey" modal gets one new checkbox ("Start with a default stage outline"), checked by default — an operator who wants a genuinely blank journey can uncheck it before submitting. No new modal, no new route.
- **Named wire format (added per `/review` finding 1-M1).** The checkbox's state is sent as a new `seedDefaultStages` boolean field in the existing `POST /journeys` body (default `true` if omitted, matching "checked by default"). `handlePostJourneys` reads `req.body.seedDefaultStages !== false` (so `false` is the only value that suppresses seeding) and performs the 5-stage insert loop only when that evaluates `true`, immediately after the journey's own INSERT succeeds, within the same transaction.

## Dependencies

- **Upstream:** None — this story only touches the existing journey-creation path (`handlePostJourneys`), already shipped and unchanged in its own core logic.
- **Downstream:** `jae-s2` (guided stage creation) and `jae-s3` (field suggestions) both apply to EVERY stage regardless of whether it came from this template or was added manually afterward — no ordering dependency, but sequenced first per the chosen user-journey slicing strategy (template-seeding is the very first moment in the operator's own journey-creation flow).

## Acceptance Criteria

**AC1:** Given the "+ New journey" modal, When it renders, Then it includes a checkbox labeled "Start with a default stage outline," checked by default.

**AC2:** Given the operator submits the new-journey form with the checkbox checked (the default), When the journey is created, Then exactly 5 stages are inserted in order (`Evaluate`, `Discover`, `Purchase`, `Onboard`, `Retain`), each with only its `name` and `position` set — every other field (`description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`) stays null, exactly as a manually-added stage's own initial state already is.

**AC3:** Given the operator unchecks the box before submitting, When the journey is created, Then zero stages are seeded — the journey starts genuinely empty, exactly as journey creation behaves today.

**AC4:** Given a cross-tenant journey-creation request (a tenant_id mismatch scenario, mirroring `jcx-s5`'s own established authorization-hardening test pattern), When template-seeding runs, Then every seeded stage carries the SAME tenant_id as the journey itself — no seeded stage is ever created under a different tenant's scope.

## Out of Scope

- **A selectable template library** — exactly one hardcoded default skeleton; no selection UI, no per-product-type variants. Logged as a deferred extension in the epic's own Out of Scope.
- **Pre-filling any field beyond `name`/`position`** on the seeded stages — `description`, `emotion`, etc. all stay null, exactly as a manually-created stage's initial state. Field suggestions are `jae-s3`'s own separate scope, applied uniformly to seeded and manually-added stages alike.
- **Allowing the operator to edit or reorder the default skeleton's own stage NAMES before creation** — the 5 names are fixed; the operator can rename/reorder/delete any seeded stage afterward using the existing, already-shipped edit/reorder/delete mechanisms, exactly as they would for a manually-added stage.
- **Any change to `handlePostJourneys`'s own existing validation (empty-name 400, tenant-scoping) or response shape.**

## NFRs

- **Performance:** None beyond existing route bounds — 5 sequential INSERTs within the same transaction `handlePostJourneys` already opens; negligible latency addition.
- **Security:** None beyond existing route bounds — AC4 directly verifies no new tenant-isolation gap is introduced.
- **Accessibility:** WCAG 2.1 AA — the new checkbox must be a native, labeled `<input type="checkbox">` with its own `<label>`, keyboard-operable and screen-reader-announced by default HTML semantics (no custom widget needed).
- **Audit:** None — no new mutating action beyond the existing journey/stage creation routes already audited (if any).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
