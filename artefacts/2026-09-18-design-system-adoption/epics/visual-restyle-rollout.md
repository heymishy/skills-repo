## Epic: Product Screens Reflect a Consistent, Modern SaaS Visual Identity

**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

Every real screen a user encounters — the dashboard, the landing page, the skill-session chat, and the artefact viewer — renders using `DESIGN.md`'s token values (color, typography, spacing, components) instead of today's inconsistent "Notion-calm" system. Each screen's restyle is an independent, demo-able, revertible slice, reusing and extending the existing CSS custom-property architecture already in `src/web-ui/utils/html-shell.js` rather than introducing a parallel styling mechanism. Both dark and light mode work correctly on every restyled screen, using the existing toggle in Settings.

## Out of Scope

- **Building or modifying the light/dark toggle mechanism itself** — it already exists and works (`src/web-ui/routes/settings.js`); this epic applies new token values to it, it does not touch the toggle's own logic.
- **Any screen beyond the 4 named** (e.g. Settings, Admin Credits) as a hard requirement of this epic — the design system's tokens may be applied more broadly where reasonable during implementation, but the 4 named screens are this epic's committed, demo-able scope.
- **Inventing new tokens, components, or patterns beyond what `DESIGN.md` and the mocks already specify** — that is a future initiative, not this epic.
- **The `design.system` DoR governance mechanism** — that is Epic 2, a distinct piece of work (governance tooling, not visual restyle).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Visual consistency across the 4 real screens | 0 of 4 screens match `DESIGN.md`'s token values | 4 of 4 screens match, confirmed by a scripted check | Each story in this epic restyles one screen to match `DESIGN.md`'s token table exactly |
| Beta user feedback on visual quality | Not yet established | Positive feedback from both beta users, no unprompted negative comments | This epic is the actual visual change the beta users will experience and react to |

## Stories in This Epic

- [ ] Artefact Viewer restyled to match DESIGN.md — dsa-s1
- [ ] Dashboard restyled to match DESIGN.md — dsa-s2
- [ ] Landing page restyled to match DESIGN.md — dsa-s3
- [ ] Skill-session chat restyled to match DESIGN.md — dsa-s4

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All 4 screens are real, already-shipped, in-production surfaces with real users (including 2 beta customers) — a visual regression is customer-visible. The skill-session chat page (`dsa-s4`) is this codebase's single largest, most heavily-used file, carrying real regression risk beyond styling alone. Human review at PR is warranted for all 4 stories, not full autonomous merge.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the design system's tokens and mock screens already exist, substantially de-risking this epic, but the exact scope of markup restructuring needed per real screen (vs. a pure token-value swap) isn't fully known until each screen's real current implementation is read against its mock. -->

## Scope Stability

**Stability:** Stable
