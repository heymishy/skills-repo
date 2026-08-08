# Review Report: Restyle the existing auth panel as the page's closing CTA — Run 1

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s5-restyle-auth-panel-as-closing-cta.md
**Date:** 2026-08-08
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Traceability / accuracy — AC2 states "`handleGetLinkSettings`-style mechanics are unchanged." This is a factually wrong reference: `handleGetLinkSettings` (`src/web-ui/routes/account-linking.js`) is the handler for the *account-linking settings page* — letting an already-authenticated user add a second sign-in method. It has nothing to do with the landing page's unauthenticated sign-in panel, which is served by `handleRoot` (`src/web-ui/routes/public.js`) rendering `templates/landing.html`, with the actual auth mechanics living in `src/web-ui/routes/auth.js` (`/auth/github`, `/auth/google`, `/auth/email/*`).
  Risk if proceeding: a coding agent implementing this story could be misled into inspecting or touching `account-linking.js` instead of the actually-relevant `public.js`/`auth.js`/`templates/landing.html`, wasting implementation time or introducing an unnecessary touchpoint.
  To acknowledge: run /decisions, category RISK-ACCEPT — or, preferably, just fix the reference now (this is a one-line correction, not a design change): AC2 should name the real routes (`/auth/github`, `/auth/google`, `/auth/email/login`, `/auth/email/signup`, all in `routes/auth.js`) rather than `handleGetLinkSettings`.
  **RESOLVED 2026-08-08:** AC2 corrected to name the real routes.

---

## LOW findings — note for retrospective

- **[1-L1]** Traceability — Same Metric Linkage circularity pattern as the other stories in this epic, though slightly stronger here since the CTA is literally the conversion event — worth explicitly stating in Metric Linkage rather than only in the User Story clause.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

*Traceability scored 3, not 4 — a wrong function-name reference in an AC is a more concrete accuracy defect than the other stories' circular-but-not-wrong Metric Linkage phrasing, even though it doesn't break the AC's actual testability once corrected.*

**Category E — Architecture compliance:** Architecture Constraints populated (3 items), correctly notes the `req.session.accessToken` canonical field rule and the unchanged `lab-s1.2` AC6 security guarantee. No pattern/anti-pattern violation. Guardrail `MC-SEC-02` evaluated — met (this story doesn't touch the no-`accessToken`-in-HTML guarantee).

**Verdict:** PASS — all criteria scored 3 or above. 1 MEDIUM finding (wrong handler reference in AC2) should be fixed before `/test-plan` — it's a one-line correction, not a scope or design issue.
