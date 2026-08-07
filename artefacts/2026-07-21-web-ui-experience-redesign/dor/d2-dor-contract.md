**Contract Proposal — Persistent viewing-as banner, exit flow, and permission-scoped visibility**

**What will be built:** A shell-level (not per-route) banner rendered by `renderShell` whenever an impersonation session is active; an exit action reverting the session fully; effective-role-based visibility logic applied to every existing `requireAdmin`-gated nav item/settings tab, reading the impersonated session's effective role rather than the real admin's.

**What will NOT be built:** The session-start flow itself (D1). The audit log viewing UI (D3).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test (banner via shell) + Playwright E2E (persists across pages) | integration / E2E |
| AC2 | Unit + integration test on non-admin-target visibility scoping | unit / integration |
| AC3 | Unit + integration test on admin-target visibility accuracy | unit / integration |
| AC4 | Integration test + Playwright E2E on exit | integration / E2E |
| AC5 | Integration test on session-expiry handling | integration |

**Assumptions:** D1's session-swap mechanism exists and exposes a queryable "is this session currently impersonating, and what is the effective role" state that this story's visibility logic can read.

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js` (banner + visibility logic), every route/handler currently gated by `requireAdmin`
Services: None new
APIs: An exit-impersonation endpoint
