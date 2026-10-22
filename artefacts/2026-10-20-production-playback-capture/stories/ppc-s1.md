# Story: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

> **Revised 2026-10-21, post-/review Run 1 (finding 1-H1):** AC2 originally assumed AC→screen target resolution was a direct reuse of `rpca-s2`'s selector-derivation mechanism. That mechanism parses `tests/e2e/*.spec.js` files in *this* repo for an AC-naming-comment convention — confirmed not to generalise to an arbitrary external tenant's own feature in their own connected repo (no guarantee of matching E2E specs, or any E2E specs at all). Revised to use one-time manual target entry per AC instead, with automatic derivation named explicitly as fast-follow. See `decisions.md`'s 2026-10-21 DESIGN entry for the full reasoning.

**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-10-20-production-playback-capture/benefit-metric.md`
**Domain:** `[web-ui, auth, security]`

## User Story

As a **Tenant Product Owner**,
I want to **open one of my own DoD-complete features and trigger a screenshot capture for a single acceptance criterion, using my own login session**,
So that **I can see real evidence the feature works, without an engineer, proving the self-service mechanism actually works before I trust it for a whole feature.**

## Benefit Linkage

**Metric moved:** Self-service DoD validation adoption (Metric 1)
**How:** This story delivers the first real, working instance of the self-service mechanism — without it there is no path to any tenant self-serving DoD validation at all. It is the walking-skeleton proof the rest of the epic extends.

## Architecture Constraints

- **ADR-018 compliance (not exception):** this story's capture mechanism must use the real authenticated user's own `req.sessionId` to seed the headless Playwright browser context's cookie — it must NOT use the `NODE_ENV=test` auth-bypass fixture (`seedTestSession` / `/test/session`). Confirmed viable via direct inspection of `src/web-ui/middleware/session.js`: sessions are opaque, unsigned IDs in a server-side store, so no signed-token minting is required.
- **AC-to-target resolution is NOT a reuse of `rpca-s2`'s selector-derivation mechanism** (revised post-`/review`, finding 1-H1). `rpca-s2` parses `tests/e2e/*.spec.js` files in this repo for an AC-naming-comment convention that is not a platform-wide mandated standard (confirmed: `/test-plan`'s own `SKILL.md` detects whether E2E tooling exists, but mandates no specific naming/comment/selector convention any tenant's own E2E specs would automatically follow). This MVP uses one-time manual target entry per AC instead — stored as a new key (`captureTargets`) within `journeys.data`, the table's existing JSONB column, so no schema/column migration is required.
- The new tenant-scoped surface's access-control check must filter by **both** `tenant_id` AND `product_id` — not `tenant_id` alone, since a tenant may own multiple products (per `decisions.md`'s 2026-10-21 ARCHITECTURE entry revisit trigger).
- Must **not** reuse `/playback`'s existing data path (`journey-store.js`'s `getJourneyByFeatureSlug`, confirmed to have no tenant filtering) for any tenant-facing read — this is the confirmed cross-tenant leak risk documented in `decisions.md`.
- `session_id` must never leave the server process boundary (no client-side exposure, no logging) — per the `discovery.md` Q1 resolution.
- **Screenshot persistence reuses `commitArtefact`/`realCommitArtefact` (`src/web-ui/adapters/artefact-commit-writer.js`), extended for binary content.** That mechanism already writes to the tenant's own connected repo via the GitHub Contents API, authenticated with the user's own `req.session.accessToken` (never a service account) — but its current docstring scopes it to "artefact markdown content." Capturing a screenshot means extending the same commit path to accept base64-encoded binary image content, not writing to local disk — the path-traversal guard convention for local `fs.writeFileSync` calls (`web-ui-patterns.md`) does not directly apply here, but the same discipline does: `artefactPath` passed into `commitArtefact` must still be derived from validated `feature_slug`/`acId` values, never raw unsanitized request input.
- **Related known gap, corroborating this story's new-surface decision:** `security-standards.md`'s own "Known gaps" section already documents, independently of this feature, that `GET /features/:slug` (`handleGetFeatureArtefacts`) has no tenant-ownership check — the exact same route this story's Architecture Constraints (below) already identify as unsafe to reuse.
- **D37 injectable adapter rule applies — confirmed at DoR, not conditional.** This story introduces a genuinely new injectable adapter: a route-callable bridge from `req.sessionId` to an authenticated Playwright page (verified at DoR: no such adapter existed before this story — `rpca`'s own mechanism is CLI-only, not route-handler-callable). Stub default must throw, not return empty; AC8 scopes the wiring requirement explicitly; the implementation plan must name wiring as a task separate from the handler task; the wiring test must assert real behavioural correctness (two different sessions produce two different, correctly-isolated authenticated pages), not just that a function reference was assigned. The existing `captureAcScreenshots` and `commitArtefact` adapters are reused and extended (not newly introduced), so D37 does not re-trigger for those two.

## Dependencies

- **Upstream:** None within this feature. Consumes the already DoD-complete `rpca` epic's `captureAcScreenshots` mechanism (rpca-s1 through rpca-s5, merged).
- **Downstream:** `ppc-s2` extends this story's single-AC capture to the full set of ACs for a feature.

## Acceptance Criteria

**AC1:** Given a tenant's Product Owner is logged into the product with their own session, and they have at least one feature in one of their own products whose `journeys.data.completedStages` includes a `definition-of-done` entry (this repo's own existing signal for "DoD-complete," confirmed by code read of `journey-store.js`/`journey-store-pg.js` — not a new field), When they navigate to the new playback-review surface for that feature, Then they see a list of that feature's acceptance criteria, scoped to their own `tenant_id` and `product_id` only.

**AC2:** Given an AC has no capture target defined yet, When an engineer or Product Owner with access enters a target URL and a CSS selector for that AC on the new surface, Then the target is stored as `{acId, url, selector}` in `journeys.data.captureTargets` for that feature, and is available for that AC's own capture and every subsequent capture attempt without re-entry.

**AC3:** Given an AC already has a stored capture target, When the Product Owner clicks "Capture evidence" for that AC, Then the system seeds a headless Playwright browser context's cookie with the Product Owner's own `req.sessionId`, navigates to the stored target URL, locates the stored selector, and captures a screenshot — without prompting for credentials and without using any service-account or test-auth-bypass mechanism.

**AC4:** Given an AC has no capture target defined yet, When the Product Owner views that AC on the surface, Then the UI clearly indicates "capture target not set" rather than silently failing, erroring, or showing a broken capture action.

**AC5:** Given a capture has completed for one AC, When the Product Owner views the surface again, Then the captured screenshot displays inline next to that AC's text, with no separate download step required.

**AC6:** Given tenant B has a DoD-complete feature with the same `feature_slug` as tenant A's feature (a `featureSlug` collision), When tenant A's Product Owner views the new surface, Then only tenant A's own feature content is returned — tenant B's feature, ACs, capture targets, and screenshots are never shown. This is tested directly against the collision scenario, not inferred from the access-control code alone.

**AC7:** Given a Product Owner attempts to open another tenant's feature directly (e.g. a guessed URL), When the request is made, Then the response is 403/not-found with no partial content and no metadata revealing that the other tenant's feature exists.

**AC8:** Given this story introduces a new route-callable adapter bridging `req.sessionId` to an authenticated Playwright page (no such adapter existed before this story — `rpca`'s own mechanism is CLI-only, not route-handler-callable), When the implementation is complete, Then the adapter's stub default throws (not a silent empty/null return) until wired, and it is wired to a real implementation in `server.js`, with the wiring verified by a test or smoke check that asserts real behavioural correctness (e.g. two different sessions produce two different, correctly-isolated authenticated pages) — not merely that a function reference was assigned.

## Out of Scope

- Looping capture across all ACs of a feature in one action — `ppc-s2`.
- Rate limiting the capture-trigger endpoint — `ppc-s3`.
- Automatic AC→screen target derivation (e.g. parsing E2E specs the way `rpca-s2` does) — this MVP uses one-time manual target entry per AC instead; automatic derivation is fast-follow, and would need its own platform-wide convention design (see `decisions.md` 2026-10-21 DESIGN entry) before it could be built.
- Video capture, automated redaction, and ffmpeg presentation polish — epic-level out of scope (fast-follow).

## NFRs

- **Performance:** No fixed SLA yet for this story — a single-AC capture is expected to complete within a few seconds based on `rpca`'s own proven per-screenshot timing; real per-feature timing is measured and validated in `ppc-s2`.
- **Security:** `session_id` never leaves the server process (no client-side exposure, no logging); tenant isolation is verified directly by AC6/AC7, not assumed; the real authenticated session is used, never the `NODE_ENV=test` bypass (ADR-018).
- **Accessibility:** the new surface's feature list, AC list, and "Capture evidence" action meet WCAG 2.1 AA and are keyboard-accessible.
- **Audit:** none identified for this story — not a blocking gap, flagged as a candidate for a later story if usage patterns show it's needed.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    PRODUCTS {\n        uuid product_id PK\n        varchar tenant_id\n        varchar name\n        varchar repo_provider\n        varchar repo_owner\n        varchar repo_name\n    }\n    JOURNEYS {\n        varchar journey_id PK\n        varchar tenant_id\n        varchar feature_slug\n        uuid product_id FK\n        jsonb data\n    }\n    JOURNEYS }o--|| PRODUCTS : \"scoped by tenant_id + product_id\""}}---
