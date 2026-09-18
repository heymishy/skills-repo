## Story: Restyle the Landing Page to Match DESIGN.md

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## User Story

As a **beta user** (one of the platform's 2 onboarded external users, or a future prospective user reaching the marketing page before signing up),
I want **the landing page to look like a modern, credible SaaS product on first arrival**,
So that **my very first impression of the platform — before I've even signed up — reflects the brand direction being set, not the dated "Notion-calm" styling**.

## Benefit Linkage

**Metric moved:** Visual consistency across the 4 real screens
**How:** This story converts the landing page — one of the 4 real screens the metric counts — from the old token values to `DESIGN.md`'s exact token values, moving the metric from 2/4 (after `dsa-s1`/`dsa-s2`) toward 4/4. The landing page is also the single most likely first-impression surface for any future prospective user, making it directly relevant to the beta-feedback metric too.

## Architecture Constraints

- Anti-pattern guardrail (`architecture-guardrails.md`): "Any change to shared surface modules (`html-shell.js`, design tokens, navigation structure, shared CSS) is a story — even a small one."
- Confirmed via `/clarify`: reuse and extend `src/web-ui/utils/html-shell.js`'s existing custom-property architecture — this story depends on `dsa-s1`'s token rename already being in place (see Dependencies).
- `DESIGN.md`'s own "Marketing/landing" layout pattern: centered hero, max-width ~900px for copy, full-bleed sections below at max-width 1120px, browser-chrome frame (traffic lights) for product screenshots.
- Real target files (confirmed to exist): `src/web-ui/routes/landing.js`, `src/web-ui/templates/landing.html`, `src/web-ui/routes/public.js` (the file that actually serves the real, live landing page per this session's own earlier investigation — confirm which of `landing.js`/`public.js` is the real live route before implementing, do not assume from file name alone).

## Dependencies

- **Upstream:** `dsa-s1` (shared `--green`/`--amber`/`--red` → `--success`/`--warn`/`--danger` token rename at the `html-shell.js` level).
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given the landing page is rendered in dark mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s dark-mode token table exactly.

**AC2:** Given the landing page is rendered in light mode, When its computed CSS custom-property values are inspected, Then every color token matches `DESIGN.md`'s light-mode token table exactly.

**AC3:** Given the landing page follows `DESIGN.md`'s "Marketing/landing" layout pattern (centered hero, max-width ~900px copy, full-bleed sections at max-width 1120px, browser-chrome-framed product screenshots), When the real page is rendered, Then this structure is present and visually matches the `Skills Platform - Landing.dc.html` mock.

**AC4:** Given the landing page's pre-existing functionality (sign-up/login entry points, marketing copy, any embedded product screenshots), When the restyle is applied, Then no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change.

## Out of Scope

- Any other of the 3 remaining real screens (artefact viewer/dashboard covered by `dsa-s1`/`dsa-s2`, skill-session chat) — each has its own story.
- Rewriting marketing copy or messaging — this is a visual restyle only.
- Building the `design.system` DoR governance mechanism — that is `dsa-s5`.

## NFRs

- **Performance:** No measurable page-load regression from the restyle — this is the first page a prospective user loads, so load-time regressions here are higher-consequence than on internal screens.
- **Security:** None identified.
- **Accessibility:** WCAG 2.1 AA (per `product/constraints.md` #9) — no regression to existing accessibility properties.
- **Audit:** None identified.

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
