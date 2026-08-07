# Review Report: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E — Run 1

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
**Date:** 2026-07-23
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC1's clause "no local mocked server is involved" is not something the Playwright spec itself can observe or assert at runtime; it's an architectural property of the test's target configuration (staging URL vs local `NODE_ENV=test` server), not an observable outcome of the auth-stub flow.
  Risk if proceeding: the AC as worded can't be directly encoded as a test assertion — the implementer will either silently drop this clause or write a hollow assertion that doesn't actually check anything meaningful, giving false confidence that the AC is covered.
  To acknowledge: run /decisions, category RISK-ACCEPT — or reword AC1 to assert only the observable outcome (real user record + valid session cookie against the staging base URL), dropping the negative clause.

---

## LOW findings — note for retrospective

- **[1-L1]** Architecture compliance — AC3 (verifying the stub's enabling variable/credential is absent from production `fly.toml`) is a config-inspection check, not a browser-driven Playwright test. ADR-018 scopes specs to `tests/e2e/` as Playwright-only; this AC's verification mechanism differs in kind from AC1/AC2/AC4 and isn't called out as such in Architecture Constraints, which could lead an implementer to force it into a Playwright spec unnecessarily.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. 1 MEDIUM finding should be acknowledged in /decisions or fixed before /test-plan; 1 LOW noted for retrospective.
