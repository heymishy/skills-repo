# Review: HTML shell and navigation

**Story:** wuce.18 — HTML shell and navigation
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** E5 — HTML shell and core views
**Review date:** 2026-05-03
**Reviewer:** Agent (automated check)
**Review pass:** 1

---

## Category A — AC completeness and testability

| Finding | Severity | Detail |
|---------|----------|--------|
| All 5 ACs in Given/When/Then format | ✅ PASS | — |
| AC3 specifies `escHtml` conversion table for `<`, `>`, `&`, `"`, `'` | ✅ PASS | Unambiguous assertion target |
| AC4 is a concrete XSS assertion | ✅ PASS | `<script>alert(1)</script>` → `&lt;script&gt;` exactly |
| AC5 (keyboard focus styling) depends on CSS rendering | ⚠️ MEDIUM | Focus styling is a visual/layout assertion not testable via unit/jsdom; requires Playwright E2E or explicit RISK-ACCEPT. Flagged for DoR H-E2E check. |

**Category verdict: PASS with one MEDIUM finding**

---

## Category B — Architecture and constraint compliance

| Finding | Severity | Detail |
|---------|----------|--------|
| ADR-012 respected — `renderShell()` is a pure rendering utility, no API calls | ✅ PASS | Story constraint correctly prohibits session state access inside the function |
| `escHtml()` declared as single canonical XSS function | ✅ PASS | Explicit constraint: other modules import from `html-shell.js`; no duplicate definitions |
| `authGuard` on `/dashboard` — existing behaviour preserved | ✅ PASS | AC2 and constraint both reference existing guard |
| Inline styles only — no CDN CSS | ✅ PASS | ADR-001 pattern followed |
| WCAG 2.1 AA: `<nav aria-label>`, `<main>`, `<header>`, heading hierarchy | ✅ PASS | All four structural requirements explicitly named in AC3 and NFRs |

**Category verdict: PASS**

---

## Category C — Scope and out-of-scope discipline

| Finding | Severity | Detail |
|---------|----------|--------|
| Out of scope declared and non-trivial | ✅ PASS | 6 explicit exclusions: role-based nav, active-page highlighting, mobile hamburger, dark mode, search bar, sign-out link behaviour |
| No scope creep — story does not pull in any wuce.19–22 rendering | ✅ PASS | Shell + navigation only; body content injected by callers |

**Category verdict: PASS**

---

## Category D — Dependency and sequencing

| Finding | Severity | Detail |
|---------|----------|--------|
| Upstream dependency on wuce.1 (auth) — merged | ✅ PASS | Auth guard already in `server.js` |
| Downstream consumers (wuce.19–22 import `renderShell()`) clearly stated | ✅ PASS | Dependency chain documented |

**Category verdict: PASS**

---

## Category E — NFR coverage

| Finding | Severity | Detail |
|---------|----------|--------|
| Security NFR — `escHtml()` canonical definition stated | ✅ PASS | — |
| Accessibility NFR — structural landmarks specified | ✅ PASS | — |
| Performance NFR — synchronous render, no measurable latency | ✅ PASS | — |
| Audit NFR — explicitly "not required" for `/dashboard` GET | ✅ PASS | Justified: navigation page, session middleware covers it |

**Category verdict: PASS**

---

## Summary

| Category | Result |
|----------|--------|
| A — AC completeness | PASS (1 MEDIUM) |
| B — Architecture | PASS |
| C — Scope | PASS |
| D — Dependencies | PASS |
| E — NFRs | PASS |

**HIGH findings:** 0
**MEDIUM findings:** 1 — AC5 keyboard focus styling requires Playwright E2E or RISK-ACCEPT at DoR
**LOW findings:** 0

**Overall verdict: PASS** — story may proceed to test-plan. MEDIUM finding must be addressed at DoR (H-E2E check).
