# Story: Dashboard-shell UX/CX parity and scope/benefit summary

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui]

---

## Background

`ppc`'s capture-evidence page has shipped as a deliberate walking-skeleton MVP since `ppc-s1`: plain inline-styled HTML, not integrated into the shared dashboard shell (`_htmlShell.renderShell`, already used across `products.js`/`settings.js`), with no scope/benefit summary or coverage-at-a-glance line. Compared directly against `/playback`'s own styled, summarised viewer (built by `fpd-s3`/`fpd-s4`) after today's `ppc-s4` fix made a real feature reachable in production for the first time, the gap was judged too large to leave as-is — not a regression, but the MVP's own named next step, now surfaced per `decisions.md`'s 2026-10-25 SCOPE entry.

Direct code inspection (this story's own `/definition` session) confirmed the reusable building blocks:
- `_htmlShell.renderShell({ title, bodyContent, user, active, crumbs, isAdmin, products, activeProductId, noProductJourneyCount })` — the real shared shell, already used by every other authenticated page in this app.
- `/playback`'s own `extractMarkdownSection`, `parseBenefitMetricTargets` (from `dod-parsing.js`), and `renderCoverageSummaryHtml`/`computeAcCoverageSummary` — all already exported and reusable. `fpd`'s own summary reads `discovery.md`/`benefit-metric.md` from **local disk** (untenanted, this repo's own artefacts), which is exactly the gap `ppc` was built to avoid — this story must read the tenant's own discovery/benefit-metric content via the already-wired `fetchArtefact` adapter (the same one `ppc-s4` just used for DoD content), not local disk.

## User Story

As a **tenant Product Owner**,
I want to **see my feature's scope/benefit summary and an at-a-glance coverage line, inside the same navigable dashboard shell as the rest of the product**,
So that **I can orient myself and make a sign-off decision without the page feeling like a disconnected, unfinished tool bolted onto the side of the product**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption) and m3 (Engineer manual-demo load removed).
**How:** `benefit-metric.md`'s own Metric 3 feedback loop names this exact risk directly: *"the gap is either trust in the captured evidence or a UX/discoverability problem for the PO."* An unstyled, orphaned page (no nav, no context, no summary) is itself a discoverability/trust problem independent of the evidence's own content quality — this story removes that specific friction.

## Architecture Constraints

- Reuse `_htmlShell.renderShell` exactly as every other authenticated page does — no second shell implementation (matches this codebase's own single-shell convention, confirmed by its use across `products.js`, `settings.js`, kanban board rendering).
- Reuse `fpd`'s own `extractMarkdownSection`/`parseBenefitMetricTargets`/`renderCoverageSummaryHtml`/`computeAcCoverageSummary` exports (`playback.js`, `dod-parsing.js`) rather than writing a second parsing/rendering implementation (MC-A11Y-02: full-vs-partial coverage distinguished by wording, not colour alone — already satisfied by reusing `renderCoverageSummaryHtml` as-is).
- ADR-025: the summary content must come from the tenant's own connected repo via `fetchArtefact` (GitHub Contents API, tenant-scoped), never from this repo's own local `artefacts/` disk path — reusing `fpd`'s local-disk read pattern here would reintroduce the exact cross-tenant data source `discovery.md` already ruled unsafe for this feature.
- NFR-Accessibility (carried from `ppc-s1`'s own precedent): the page must remain keyboard-operable without client-side JS — wrapping in the dashboard shell must not introduce a JS-dependent interaction the existing plain `<form>` elements don't already have.

## Dependencies

- **Upstream:** `ppc-s1` (the page this story restyles), `ppc-s4` (the `fetchArtefact`-based GitHub content path this story reuses for the summary section).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant PO opens the capture-evidence page for one of their own features, When the page renders, Then it is wrapped in the same `_htmlShell.renderShell` dashboard shell as every other authenticated page in the product — top nav, product context, and styling all present, not a bare unstyled HTML fragment.

**AC2:** Given the page renders, When the summary section loads, Then it shows a "Scope" section (the feature's Problem Statement, fetched from the tenant's own connected repo's `discovery.md` via `fetchArtefact`) and a "Benefit" section (metric targets, fetched from the tenant's own `benefit-metric.md` via the same adapter) — mirroring `/playback`'s own summary layout, but sourced tenant-scoped via GitHub, never from local disk.

**AC3:** Given the page renders, When the AC list loads, Then an at-a-glance coverage line appears above the per-AC sections ("N of M ACs have captured evidence" / "Full coverage" / "0 of M..."), reusing `renderCoverageSummaryHtml`/`computeAcCoverageSummary` as-is, including their existing text-distinct (not colour-only) full/partial/none states.

**AC4:** Given a tenant's connected repo has no `discovery.md` or `benefit-metric.md` at the expected path (e.g. an older feature, or a `fetchArtefact` 404), When the summary section attempts to load, Then the page still renders fully — the Scope/Benefit section shows a "not available" state that names the specific missing artefact (e.g. "discovery.md not found in the connected repo") rather than a generic message, and the rest of the page (AC list, capture forms) is unaffected.

**AC5:** Given the existing plain `<form>`/`<input>`/`<button>` capture-target and capture-trigger elements (`ppc-s1`/`ppc-s2`), When the page is wrapped in the dashboard shell, Then every existing form still submits correctly with no client-side JS required — the shell wrap changes layout/chrome only, not the existing keyboard-operable interaction model.

## Out of Scope

- Embedding captured video (`ppc-s5`)/screenshots in a richer gallery layout beyond the existing inline `<img>`/(new) `<video>` rendering — this story is shell/summary parity only, not a redesign of evidence display itself.
- Per-epic or per-story grouping of ACs (mirroring `/playback`'s own epic-nested rendering) — `ppc`'s AC list stays flat, matching its existing data model; grouping is a further fast-follow if ever needed.
- Any change to `/playback`'s own page itself — this story only touches `ppc`'s capture-evidence page.
- Real-time/live-updating coverage line (e.g. during an in-progress `capture-all` run) — the existing `_renderCaptureAllProgress` mechanism (`ppc-s2`) is unchanged; this story's coverage line reflects state at page load/render time only.

## NFRs

- **Performance:** Two additional `fetchArtefact` calls (discovery.md, benefit-metric.md) per page load — bounded, same per-request cost class as the existing DoD-content fallback fetch (`ppc-s4`), not a new class of latency risk.
- **Security:** Summary content fetched via the same tenant-scoped `fetchArtefact`/`ownerRepo` path already proven by `ppc-s4` — no new cross-tenant exposure surface.
- **Accessibility:** Shell wrap must preserve keyboard operability (AC5); coverage-summary reuse already satisfies MC-A11Y-02 (text-distinct states, not colour-only).
- **Audit:** No new audit requirement beyond what `ppc-s1`/`ppc-s2`/`ppc-s4` already log.

## Complexity Rating

**Rating:** 1
<!-- Well understood, clear path — every building block (shell, summary parsing, coverage rendering, tenant-scoped fetch) already exists and is proven; this story composes them, it does not invent new mechanisms. -->
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
