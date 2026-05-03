# Contract: HTML shell navigation and shared layout

**Story:** wuce.18
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- `src/web-ui/utils/html-shell.js` — `renderShell(title, bodyHtml, navActiveLink)` export and `escHtml(str)` export
- Navigation bar with links: Dashboard (`/dashboard`), Features (`/features`), Status (`/status`), Actions (`/actions`), Run a Skill (`/skills`)
- `<main>` and `<header>` landmark regions with accessible role semantics
- Keyboard focus ring via CSS `outline` (`:focus-visible`) — delivered via inline `<style>` in `renderShell`
- Active nav link marked with `aria-current="page"` based on `navActiveLink` param

## Components NOT built by this story

- Any individual route handler or page content
- Server startup or request routing
- Authentication or session middleware
- Any external CSS file or static asset pipeline
- Any non-HTML content-type response path

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `renderShell(title, bodyHtml)` returns complete HTML5 document | T1: document has <!DOCTYPE html>, T2: contains <title>, T3: bodyHtml embedded in <main> |
| AC2 | Nav bar contains all 5 links with correct href values | T4: /dashboard, T5: /features, T6: /status, T7: /actions, T8: /skills present |
| AC3 | `navActiveLink` sets `aria-current="page"` on matching nav item | T9: active link has aria-current=page, T10: inactive links do not have aria-current |
| AC4 | `escHtml(str)` escapes &, <, >, ", ' — export from html-shell.js | T11: & → &amp;, T12: < → &lt;, T13: > → &gt;, T14: " → &quot;, T15: single quote → &#39; |
| AC5 | Focus ring CSS rule present in rendered output (`:focus-visible`) | T16: rendered HTML contains :focus-visible CSS rule, T17: outline property present |
| AC5-E2E | Keyboard tab lands on nav links and shows visible outline | E2E-T1: Tab key → focus ring visible on nav, E2E-T2: skip-link present and functional |

## Assumptions

- Inline `<style>` is the correct mechanism for focus ring CSS — no external CSS file exists yet
- `escHtml` is the canonical XSS-escaping function for all modules in the web-ui layer

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/utils/html-shell.js` | Create | renderShell and escHtml exports |
| `tests/check-wuce18-html-shell-navigation.js` | Create | 18 unit tests |
| `tests/e2e/wuce18-keyboard-navigation.spec.js` | Create | 2 Playwright E2E tests |

## Out of scope — files that MUST NOT be touched

- Any existing route handler under `src/web-ui/routes/`
- `src/web-ui/server.js` or any server startup file
- Any other test file not listed above
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
