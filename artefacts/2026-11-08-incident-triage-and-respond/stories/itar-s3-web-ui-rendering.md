## Story: Web UI rendering — first slice of initiative 1's visibility surface

**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-incident-triage-and-respond/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **delivery engineer responding to an alert**,
I want to **see incident records in the product detail page I already use for everything else**,
So that **I don't need a separate tool or a raw-JSON file read to know what incidents exist and what their triage status is**.

## Benefit Linkage

**Metric moved:** Web UI rendering existence
**How:** This story is the only mechanism that can satisfy "render ≥1 real incident record end-to-end" — without it, incident records exist only as raw JSON on disk, invisible to anyone using the product page.

## Architecture Constraints

- Extends `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`, inside `_renderProductView`/`handleGetProductView`) — the surface corrected during initiative 1's own `/definition` (2026-11-09, `decisions.md`). This story's artefact lives under this feature's own chain (`incident-triage-and-respond`), per the discovery's own resolved decision — initiative 1's future `/definition` references and builds on this slice rather than recreating it.
- Fetches `workspace/incidents.json` from the connected repo via the same `fetchRepoPath` GitHub-contents read primitive (`src/web-ui/adapters/artefact-fetcher.js`) initiative 1's `urpv-s3` story already established for `decisions.md` — no new GitHub API code path, reusing a proven mechanism a second time.
- `product/constraints.md` #9: this story touches rendered output in `src/web-ui/` — `hasDesignSystemTrack: true` required at DoR, compliance against `DESIGN.md` enforced via the `H-DESIGN` gate.
- ADR-025 (multi-tenancy): the fetch stays scoped by the same `repoOwner`/`repoName`/`accessToken` already resolved per-product, per-tenant.
- MC-A11Y-02 (colour not sole indicator): incident status (open/triaged/confirmed) must carry a text label, not a colour swatch alone.

## Dependencies

- **Upstream:** itar-s1 (the record mechanism this story fetches and renders), itar-s2 (the triage summary this story displays alongside each record).
- **Downstream:** None within this feature. Initiative 1's future `/definition` and initiative 5's story 5 both reference this slice.

## Acceptance Criteria

**AC1:** Given a connected repo's `workspace/incidents.json` contains at least one incident record, When the consolidated features view loads for that product, Then each record is fetched via `fetchRepoPath` and rendered as a distinct item, showing at minimum its status and triage summary (if present).

**AC2:** Given an incident record has a populated triage summary (from itar-s2), When the record renders, Then the triage summary's content (known context, suggested next step) is visible without requiring a separate click-through or page navigation.

**AC3:** Given a connected repo has no `workspace/incidents.json` file at all (e.g. a product that hasn't adopted this mechanism yet), When the consolidated features view loads, Then it renders normally with zero incident items — never a visible error or a broken page, consistent with the same graceful-degradation pattern `urpv-s3` already established for a missing `decisions.md`.

**AC4:** Given this is the first real content rendered on this slice of initiative 1's surface, When a real incident record (e.g. the migrated `productionErrorInvestigation`/`tenant_admin_bootstrap_failed` case from itar-s1's AC4) is rendered, Then it renders without error end-to-end — this is the concrete "≥1 real record" proof this metric's target requires, not a synthetic fixture alone.

## Out of Scope

- Any rendering of short-track-story reactive-work tags or `decisions.md` RISK-ACCEPT/SCOPE entries — that's initiative 1's own `urpv-s2`/`urpv-s3`, not duplicated here.
- A load rollup or filter UI for incidents specifically — initiative 1's `urpv-s4` pattern is not extended to incidents in this MVP.
- Creating or editing an incident record from the web UI — read-only rendering only.

## NFRs

- **Performance:** Same caveat already flagged in initiative 1's own NFR profile for `decisions.md` fetches — a live per-product GitHub fetch adds latency; `[UNKNOWN BASELINE]` at this repo's current incident volume (expected low), not assumed safe at scale without measurement.
- **Security:** `workspace/incidents.json` content rendered as escaped text, never raw HTML (MC-SEC-01); no credentials in the incident content itself (checked at itar-s1's own NFR level).
- **Accessibility:** WCAG 2.1 AA text-contrast compliance per `DESIGN.md`; status label per MC-A11Y-02 above.
- **Audit:** None beyond what itar-s1/itar-s2 already provide on the record itself.

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
