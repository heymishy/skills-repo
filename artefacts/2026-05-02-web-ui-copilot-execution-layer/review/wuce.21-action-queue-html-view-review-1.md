# Review: Action queue HTML view

**Story:** wuce.21 — Action queue HTML view
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** E5 — HTML shell and core views
**Review date:** 2026-05-03
**Reviewer:** Agent (automated check)
**Review pass:** 1

---

## Category A — AC completeness and testability

| Finding | Severity | Detail |
|---------|----------|--------|
| All 6 ACs in Given/When/Then format | ✅ PASS | — |
| AC1 specifies HTML shape per action item — title, feature, action type, direct link | ✅ PASS | Testable via jsdom |
| AC2 empty-state message — no empty `<ul>` | ✅ PASS | Unambiguous DOM assertion |
| AC3 `GET /api/actions` backward-compatibility preserved | ✅ PASS | JSON endpoint separation from HTML route explicitly stated |
| AC4 XSS via `escHtml()` on action title and feature slug | ✅ PASS | — |
| AC5 unauthenticated → 302 to `/auth/github` | ✅ PASS | — |
| AC6 nav "Actions" link points to `/actions` not `/api/actions` | ✅ PASS | Integration check — confirms routing wire-up; testable via HTTP integration test |

**Category verdict: PASS**

---

## Category B — Architecture and constraint compliance

| Finding | Severity | Detail |
|---------|----------|--------|
| ADR-009: separate `handleGetActionsHtml()` in `routes/dashboard.js`; existing JSON handler unchanged | ✅ PASS | Route separation explicitly stated |
| ADR-012: `getPendingActions(userIdentity, token)` adapter reused | ✅ PASS | No inline API calls; both handlers share same adapter call |
| `renderActionQueue(actions)` reused from `adapters/action-queue.js` | ✅ PASS | Export requirement noted if not currently exported — scoped into this story |
| `GET /actions` added to `server.js` with `authGuard` | ✅ PASS | `GET /api/actions` preserved unchanged |
| `renderShell()` wraps output | ✅ PASS | — |
| `escHtml()` on all action metadata | ✅ PASS | — |

**Category verdict: PASS**

---

## Category C — Scope and out-of-scope discipline

| Finding | Severity | Detail |
|---------|----------|--------|
| Out of scope declared and non-trivial | ✅ PASS | Dismiss/complete from view, filtering, real-time push, API shape change, notifications all excluded |
| HTML route is read-only — no write operations | ✅ PASS | Sign-off action deferred to wuce.3 route |

**Category verdict: PASS**

---

## Category D — Dependency and sequencing

| Finding | Severity | Detail |
|---------|----------|--------|
| Upstream wuce.5 (action queue JSON) merged | ✅ PASS | Data model and adapter exist |
| Upstream wuce.18 (HTML shell) must be merged first | ✅ PASS | Explicit dependency stated |

**Category verdict: PASS**

---

## Category E — NFR coverage

| Finding | Severity | Detail |
|---------|----------|--------|
| Security — action titles and feature slugs escaped | ✅ PASS | — |
| Performance — no extra round-trip; `renderActionQueue()` called synchronously | ✅ PASS | — |
| Accessibility — `<ul>`/`<li>` with descriptive link text identifying action and feature | ✅ PASS | — |
| Audit — `/actions` access logged (userId, route, timestamp) | ✅ PASS | Pattern consistent with wuce.5 |

**Category verdict: PASS**

---

## Summary

| Category | Result |
|----------|--------|
| A — AC completeness | PASS |
| B — Architecture | PASS |
| C — Scope | PASS |
| D — Dependencies | PASS |
| E — NFRs | PASS |

**HIGH findings:** 0
**MEDIUM findings:** 0
**LOW findings:** 0

**Overall verdict: PASS** — story may proceed to test-plan.
