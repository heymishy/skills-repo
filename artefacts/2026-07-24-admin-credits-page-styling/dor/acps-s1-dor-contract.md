# Contract Proposal: Style the admin credits page with the shared design system shell

**What will be built:**
`adminCreditsGet` (`src/web-ui/routes/admin-credits.js`) rewritten to build its `bodyContent` (the tenant table + adjust forms — same fields, same CSRF token, same structure) as a string, then pass it to `renderShell({ title: 'Admin — Credits', bodyContent, user: req.session, isAdmin: true, active: 'admin-credits' (or equivalent nav-active key), crumbs: [...] })` instead of hand-rolling a full `<!DOCTYPE html>` document.

**What will NOT be built:**
Any change to `adminCreditsPost`, `getAllTenantBalances`, `getValidTenantIds`, `adjustBalanceWithAudit`, or CSRF logic — all untouched, reused exactly as-is.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting renderShell's known structure is present, old bare markup is absent | Unit |
| AC2 | Unit test asserting tenant data/form fields unchanged | Unit |
| AC3 | Existing CSRF/audit test suites, run unmodified | Integration |
| AC4 | Unit test asserting a nav-back link/element is present | Unit |

**Assumptions:**
`renderShell`'s existing param list (`title, bodyContent, user, active, crumbs, headerActions, isAdmin, impersonation`) is sufficient for this page's needs — no new `renderShell` parameter is anticipated.

**Estimated touch points:**
Files: `src/web-ui/routes/admin-credits.js` only.
Services: None new.
APIs: None new — same GET/POST routes, same paths.
