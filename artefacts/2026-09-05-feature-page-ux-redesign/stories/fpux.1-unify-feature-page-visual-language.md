## Story: Unify `/features/:slug`'s visual language across feature-level and per-story sections

**Epic reference:** artefacts/2026-09-05-feature-page-ux-redesign/epics/page-and-nav-redesign.md
**Discovery reference:** artefacts/2026-09-05-feature-page-ux-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As a **prospective client evaluating the platform during beta** (and secondarily, the Developer/Engineer and Tech Lead personas who use this page daily),
I want to **see one deliberate, modern visual language across the entire `/features/:slug` page, including large multi-story features**,
So that **the page does not read as visibly unfinished or inconsistent — a plausible silent churn trigger during evaluation, per the discovery's own Why Now.**

## Benefit Linkage

**Metric moved:** M1 (Visual consistency of `/features/:slug`, style-seam count), M2 (Perceived design quality — Apple/SaaS-tier rubric), M4 (Tier 3 — WCAG 2.1 AA conformance)
**How:** Extending the existing `html-shell.js` token system (`.sw-card`/`.sw-section-title` and the `--ink`/`--muted`/`--surface`/`--line` custom properties) to `renderGroupedArtefactIndexHtml`'s epic/story accordion eliminates the single visible style seam (M1 → 0), brings the whole page to a self-reviewed "on par with a modern SaaS product" bar (M2 → Pass), and closing any accessibility gaps in the process (contrast, focus states, keyboard navigation of the `<details>`/`<summary>` disclosure pattern) satisfies the WCAG 2.1 AA floor (M4 → 100%).

## Architecture Constraints

- **`html-shell.js` is the single canonical source** for shared HTML-shell functions and CSS design tokens — any new or extended class/token used by the epic/story accordion (currently inline-styled directly in `features.js`'s `renderGroupedArtefactIndexHtml`/`renderStory`) must be added to `html-shell.js`, not duplicated as page-local inline styles in `features.js`. (`.github/architecture-guardrails.md`, "single canonical source" pattern.)
- **Both light and dark theme must be supported** — `html-shell.js` already defines `:root` (light) and `[data-theme="dark"]`/`prefers-color-scheme` (dark) token blocks; any new token or class this story adds must resolve correctly in both, matching the existing pattern (do not hardcode a color that only works in one theme).
- **No CSS framework** — hand-authored CSS only, consistent with `product/tech-stack.md` (`src/web-ui` is raw Node `http.createServer()`, zero Express/React/Tailwind).
- **Anti-pattern avoided:** this change is captured under this story's own artefact chain — not an ad-hoc, undocumented shell/token edit (`.github/architecture-guardrails.md` anti-pattern table, "Ad-hoc cross-cutting surface changes without a story").

## Dependencies

- **Upstream:** None
- **Downstream:** None — this story and fpux.2 are independently shippable (vertical slice), per the epic's own slicing rationale.

## Acceptance Criteria

**AC1:** Given a multi-story feature page is rendered (e.g. `/features/2026-06-22-wuce-multi-tenancy`), When the page loads, Then every visible section — the feature-level artefact list at the top and the phase/story accordion below it — uses the same `html-shell.js` token set (same card treatment, same section-title typography, same spacing rhythm), with zero points where the visual language visibly changes.

**AC2:** Given the redesigned page in both light and dark theme (`data-theme="light"` and `data-theme="dark"`, plus the unstamped "system" default under both `prefers-color-scheme` states), When the page is rendered in each, Then all colors, borders, and backgrounds resolve to a themed value from the token set — no element is invisible, low-contrast, or styled only for one theme.

**AC3:** Given the redesigned epic/story `<details>`/`<summary>` accordion, When a keyboard-only user tabs through the page, Then every `<summary>` element receives a visible focus indicator and can be expanded/collapsed via keyboard (Enter/Space) without a mouse — meeting WCAG 2.1 AA keyboard-operability and focus-visibility criteria.

**AC4:** Given the redesigned page, When checked with a contrast-ratio tool (manual or automated) against WCAG 2.1 AA, Then all text/background combinations in both themes meet the minimum contrast ratio (4.5:1 for normal text, 3:1 for large text/UI components).

**AC5:** Given the existing "Delete this feature" button and any other pre-existing interactive element on the page, When the redesign is applied, Then their existing behaviour (confirm dialog, DELETE fetch, redirect) is unchanged — this story is a visual/styling change only, not a behavioural one.

## Out of Scope

- A materially new visual language (new color palette, new type family) beyond extending the existing `html-shell.js` token system — deferred per the discovery's own Clarification log (no `/design` pass was run before this `/definition` session).
- Any change to `/features` (the list page), `/dashboard`, `/products/:id`, or other pages sharing similar patterns — out of scope per the epic's own Out of Scope section.
- Automated axe-core or other accessibility-scanning tooling — not currently part of this repo's toolchain (`product/tech-stack.md`); AC3/AC4 are verified manually at this story's DoR/DoD unless tooling is confirmed available and wired in first (platform-availability gate, D2-platform).

## NFRs

- **Performance:** No new network calls or heavy computation introduced — page render time must not regress from its current baseline (informal check: page loads visibly instantly today, same expectation post-redesign).
- **Security:** None identified — no new data exposure, no new user input surface.
- **Accessibility:** WCAG 2.1 AA minimum (contrast, keyboard operability, visible focus states) — see AC3/AC4. Verification method (automated Playwright visual-regression test vs. RISK-ACCEPT + manual smoke test) to be classified at `/definition-of-ready` per `CLAUDE.md`'s CSS-layout-dependent AC rule.
- **Audit:** Not applicable — no new state-changing action is introduced.

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
