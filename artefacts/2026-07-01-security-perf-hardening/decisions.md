# Decisions — Security and Performance Hardening

**Feature slug:** 2026-07-01-security-perf-hardening

---

## RISK-ACCEPT: sec-perf-s3 defers CSRF protection on non-highest-value form POST routes

**Date:** 2026-07-14
**Story:** sec-perf-s3
**Context:** sec-perf-s3 adds CSRF (Cross-Site Request Forgery) token protection to the four highest-value server-rendered form POST routes only (admin credit adjustment, team member add/role-assign, billing checkout, email signup/login) — reviewed at `artefacts/2026-07-01-security-perf-hardening/review/sec-perf-s3-review-1.md` (finding 3-M1).
**Decision:** Ship sec-perf-s3 scoped to those 4 route groups. The remaining server-rendered form POST routes — `POST /journey/wizard`, `POST /api/journey`, `POST /api/artefacts/:slug/:file/annotations`, `POST /api/skills/:name/sessions` (form path), `POST /api/skills/:name/sessions/:id/commit` (form path), `POST /products/confirm`, `POST /products/:id/features` — remain unprotected by an app-level CSRF token after this story ships. They are still covered by the existing `SameSite=Strict` session cookie policy (`src/web-ui/middleware/session.js`), which independently mitigates classic cross-site CSRF in modern browsers.
**Rationale:** These routes do not move money, change account privilege, or create/authenticate an account — the four categories protected by sec-perf-s3 were chosen because a successful forgery there has the highest real-world impact (financial loss, privilege escalation, account takeover). Protecting all ~14 remaining form routes in one short-track story would blow the story's bound; a follow-up story should pick these up explicitly rather than the gap being silently forgotten once the parent `sec-perf` DoR's "CSRF tokens on POST endpoints" deferral line reads as closed by sec-perf-s3.
**Follow-up action:** File a follow-up short-track story (suggested slug continuation `sec-perf-s4` or similar) to extend `csrfGuard`/`csrfField` (built by sec-perf-s3, reusable as-is) to the routes named above.
