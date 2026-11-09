## Story: Web UI rendering alongside incident records

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **see deferred-item records in the same product page I already use for incidents**,
So that **I have one place to look, not a second tool or a raw-JSON read, for everything that's been deferred**.

## Benefit Linkage

**Metric moved:** Web UI rendering existence
**How:** This story is the only mechanism that can deliver "deferred-item records render in the shared surface alongside incident records, ≥1 seeded real record" — without it, ddft-s1's records are visible only via the CLI scan (ddft-s2), never in the UI.

## Architecture Constraints

- **Extends the same surface `itar-s3` builds**, not a separate view — `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`). Rendering distinguishes `type: "incident"` from `type: "deferred-item"` items (per ddft-s1's schema) within the same list, not two parallel sections.
- **Hard dependency, confirmed binding**: this story cannot be implemented before `itar-s3` ships (the UI surface it extends). If `itar-s3` has not shipped when this story is picked up, this story is blocked, not reworked into a standalone view — per the discovery's own cross-initiative sequencing constraint.
- `product/constraints.md` #9: `hasDesignSystemTrack: true` required at DoR, same as `itar-s3`.
- Fetches `workspace/incidents.json` via the same `fetchRepoPath` primitive `itar-s3` already established — filters client- or server-side on `type` to render deferred-item records distinctly (e.g. a different icon/label, not a different fetch call).
- MC-A11Y-02: the `incident`/`deferred-item` type distinction must carry a text label, not colour alone — same rule already applied to `urpv-s2`'s reactive/planned tag and `itar-s3`'s status label.

## Dependencies

- **Upstream:** ddft-s1 (the schema), `itar-s3` (the surface this story extends — an upstream dependency on a different feature's story, confirmed real per the discovery's cross-initiative sequencing constraint).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a connected repo's `workspace/incidents.json` contains at least one record with `type: "deferred-item"`, When the consolidated features view loads, Then that record renders alongside any `type: "incident"` records, visually distinguished by a text label (e.g. "Deferred" vs. "Incident"), not colour alone.

**AC2:** Given a deferred-item record has a populated `revisitCondition` field, When the record renders, Then that text is visible without requiring a separate click-through, consistent with how `itar-s3` already surfaces an incident's triage summary inline.

**AC3:** Given this story ships, When ddft-s1's 2 seeded real records (`tfhc-s1`, C1-vs-Option-C) are rendered, Then both render without error — the concrete "≥1 seeded real record" proof this metric's target requires, using real history rather than a synthetic fixture.

**AC4:** Given a connected repo has `workspace/incidents.json` present but with zero `type: "deferred-item"` records (e.g. only incidents exist so far), When the view loads, Then it renders normally showing only the incident records — no error, no empty-state regression for the incident-only case `itar-s3` already handles.

## Out of Scope

- Any filter or rollup UI specific to deferred items — not built in this MVP, consistent with this epic's narrow typing boundary.
- Creating or resolving a deferred-item record from the web UI — read-only rendering only, same as `itar-s3`.

## NFRs

- **Performance:** Same already-flagged `[UNKNOWN BASELINE]` caveat as `itar-s3`'s and `urpv-s3`'s own fetch-latency gaps — not reintroducing a new risk, just inheriting the existing one on the same fetch path.
- **Security:** Same escaped-rendering requirement (MC-SEC-01) as `itar-s3`.
- **Accessibility:** WCAG 2.1 AA text-contrast per `DESIGN.md`; text label per MC-A11Y-02 above.
- **Audit:** None beyond what ddft-s1 already provides on the record itself.

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
