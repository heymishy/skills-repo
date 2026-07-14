# Review Report: Connect an existing GitHub repo to a product — Run 1

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md
**Date:** 2026-07-14
**Categories run:** A, B, C, D, E
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Category E — Architecture Constraints cites "the existing account-linking flow" without naming the specific route. Verified against real code: `src/web-ui/routes/account-linking.js` already exposes `GET /settings/link-account/github/start`, reusing the existing OAuth adapter — the mechanism genuinely exists and the citation is directionally correct, but should name the route explicitly rather than gesturing at "the existing flow."
  Fix: update Architecture Constraints to read `... directing them to the existing GET /settings/link-account/github/start flow (verified working, account-linking.js)`.

- **[1-L2]** Category C — AC1 says `repo_provider`/`repo_owner`/`repo_name` "are set" without stating the literal value `repo_provider` receives (e.g. `"github"`). Obviously implied given MVP is GitHub-only, but an AC should be precise enough that two people testing it wouldn't need to infer the value.
  Fix: AC1 could read "...Then `repo_provider` is set to `github` and `repo_owner`/`repo_name` are set to the submitted values."

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW.
**Outcome:** PASS

**Category detail:**
- A — Traceability: 5/5.
- B — Scope integrity: 5/5. Out-of-scope correctly excludes repo creation (Epic 2) and non-GitHub providers.
- C — AC quality: 4/5 — see 1-L2.
- D — Completeness: 5/5.
- E — Architecture compliance: 4/5 — see 1-L1.
