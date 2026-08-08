## Story: Wrap kanban board HTML in the shared page shell so design-system tokens resolve

**Epic reference:** None — short-track (bounded bug fix)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator viewing any kanban board (product, org, or tenant scope)**,
I want to **see the board rendered with the platform's actual design system (colours, spacing, card styling)**,
So that **the board looks like a real, finished feature instead of unstyled placeholder HTML**.

## Benefit Linkage

**Metric moved:** Direct correctness/visual-defect fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-08) while evaluating kanban as a landing-page demo candidate: `GET /products/:id/kanban` renders as plain black-on-white HTML with no card borders, no colour, and no visual hierarchy at all, despite story `s2.1` ("shared-token-redesign", part of `2026-07-24-interactive-kanban-boards`, shipped to DoD) explicitly adding CSS rules using the shared design-token custom properties (`var(--surface)`, `var(--ink)`, `var(--line)`, etc.).

**How:** Direct source inspection confirms the root cause. `renderKanban()` (`src/web-ui/views/kanban-view.js`) returns an HTML *fragment* (a `<style>` block plus board markup) whose CSS rules reference custom properties such as `var(--surface)` — but those properties are only ever *defined* inside `:root { }` in `DESIGN_SYSTEM_CSS`, which lives in `renderShell()` (`src/web-ui/utils/html-shell.js`). All three call sites that produce a kanban response — `handleGetProductKanban`, `handleGetOrgKanban`, and the tenant-scope board branch inside `handleGetDashboard` (`?view=board`) — call `_sendKanbanHtml(res, html)`, which sends `renderKanban()`'s raw fragment directly as the entire HTTP response body, never passing it through `renderShell()`. Every `var(--x)` reference in the fragment's `<style>` block therefore resolves to nothing in the browser, and the board renders with default browser styling. This has been true since `s2.1` merged — the "shared design-token redesign" has never actually been visible to a real user in production.

## Architecture Constraints

- **Match the existing pattern exactly:** every other product-scoped and dashboard page in this codebase renders its body content, then wraps it via `_htmlShell.renderShell({ title, bodyContent, user: { login }, active, ... })` before sending (e.g. `handleGetProductView`, `_renderRoadmapTab`). This story brings the three kanban routes in line with that established pattern — it does not invent a new rendering convention.
- **No change to `renderKanban()` itself or its CSS.** The board's own markup, class names, and `<style>` block are correct as written — the bug is purely that the fragment is never embedded in a page that defines the tokens it depends on. `kanban-view.js` is not touched by this fix.
- **No D37/adapter concern:** this is a fix inside existing route handlers, not a new adapter.

## Dependencies

- **Upstream:** None (fixes already-shipped code from `s2.1`/`kbc-s1`, both already merged).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an authenticated operator requests `GET /products/:id/kanban` for a product they own, When the response is rendered in a browser, Then the page includes the shared design-system `:root` token definitions (i.e. the response is wrapped via `renderShell()`, not sent as a raw `renderKanban()` fragment), and the board's `.kb-card`/`.kb-column` elements resolve real, non-default colours and borders (not initial/transparent values).

**AC2:** Given an authenticated operator requests `GET /org/kanban`, When the response is rendered, Then the same shell-wrapping applies as AC1 — the org-scope board is visually styled identically to the product-scope board (same shared `renderKanban()` output, same shell).

**AC3:** Given an authenticated operator requests `GET /dashboard?view=board` (tenant scope), When the response is rendered, Then the same shell-wrapping applies as AC1 — the tenant-scope board is visually styled identically to the other two scopes.

**AC4:** Given the existing kanban E2E and unit test suites (`tests/e2e/psh-s6-product-kanban.spec.js`, `tests/e2e/psh-s7-org-kanban.spec.js`, `tests/e2e/s3.1-drag-to-advance.spec.js`, `tests/e2e/s3.2-*.spec.js`, `tests/check-kbc-s1-*.js`, and any other test asserting on `[data-stage]`, `.kb-card`, or the board's drag/advance/reorder behaviour), When they are re-run after this fix, Then all pass unchanged — shell-wrapping must not remove, rename, or restructure any element these tests select against, and inline `<script>` behaviour (drag-and-drop, advance, reorder) must continue to function identically when embedded inside the shell's `<main>`.

## Out of Scope

- **Wiring the sidebar product list / breadcrumbs to match other product-scoped pages exactly** (e.g. `activeProductId`, `products` nav list, per-page crumbs). This fix's scope is strictly "the tokens resolve and the board is visibly styled" — full nav-parity polish (matching breadcrumb conventions used elsewhere) is a reasonable follow-on but not required to fix the reported defect.
- **Any change to kanban's visual design, layout, or interaction behaviour.** The CSS and markup added by `s2.1`/`s3.1`/`s3.2`/`s3.3`/`s3.4` are correct as designed — this fix only makes them actually take effect.
- **A dedicated "Kanban" nav entry.** Whether kanban views get a first-class nav item is a separate, already-noted UX gap (see the nav redesign discussion), not part of this fix.

## NFRs

- **Performance:** Negligible — wrapping in `renderShell()` is the same cost every other HTML-rendering route already pays.
- **Security:** None identified — no new user input handling; `renderShell()` is the same trusted, already-audited wrapper used everywhere else.
- **Accessibility:** Improves, incidentally — the shell provides the site's standard `<title>`, nav landmarks, and theme toggle, none of which the raw fragment currently has.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — a single, well-understood "wrap existing output in the existing, already-proven shell function" fix, matching a pattern already used by every other page in this file.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
