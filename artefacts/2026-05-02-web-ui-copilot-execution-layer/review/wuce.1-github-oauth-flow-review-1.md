# Review Report: GitHub OAuth flow and authenticated session — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.1-github-oauth-flow.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** [E — Architecture compliance] — ADR-004 is misapplied in Architecture Constraints. The constraint reads: "OAuth App client ID and callback URL must be read from `context.yml`." `context.yml` is the skills pipeline config file — it is committed to the repository and is not a runtime config mechanism for a Docker-deployed web service. A coding agent following this constraint would attempt to parse `context.yml` at container startup to retrieve OAuth credentials — an anti-pattern for a 12-factor service. Furthermore, the OAuth client secret is not mentioned at all in this story's Architecture Constraints, leaving the most sensitive credential unguarded. wuce.4 correctly states: "all runtime configuration (GitHub OAuth client ID/secret, session secret …) must be read from environment variables." This story must align.
  Fix: Replace the ADR-004 Architecture Constraint bullet with: "ADR-004: OAuth client ID, client secret, and callback URL must be read from environment variables at runtime (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`) — never from `context.yml`, never hardcoded in application code."

---

## LOW findings — note for retrospective

- **[1-L1]** [C — AC quality] — AC4 (SAML SSO) tests a GitHub platform behaviour rather than application logic. "Then the flow completes successfully without requiring any additional configuration" is unverifiable in an automated test environment without a live enterprise GitHub org with SAML enabled. Test plan should designate this as manual-verification-only and document the specific test condition required (enterprise org, SAML enabled, user who is member of that org).

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 4 | PASS | All references present. "So that…" clause is feature-functional rather than metric-linked; Benefit Linkage section fully compensates with named metric (M2) and mechanism sentence. |
| B — Scope integrity | 5 | PASS | Out of scope well-bounded. No discovery violations. Non-GitHub providers, token refresh, role management all explicitly deferred. |
| C — AC quality | 4 | PASS | All ACs in Given/When/Then format. Observable outcomes. No "should." AC4 testability caveat (LOW above). |
| D — Completeness | 5 | PASS | All mandatory fields populated. Named persona, benefit linkage mechanism sentence, complexity rating, scope stability, NFRs across 4 categories. |
| E — Architecture | 3 | PASS | ADR-004 misapplied (MEDIUM above). ADR-012, ADR-009, and all mandatory security constraints otherwise correctly cited. |

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome: PASS** — No HIGH findings. Proceed to /test-plan after resolving or acknowledging 1-M1 via /decisions (RISK-ACCEPT or fix).

The story is structurally sound. The MEDIUM finding (1-M1) is a critical clarification for the coding agent: without it, the implementing agent may attempt to read OAuth credentials from the committed `context.yml` file rather than from injected environment variables. Resolving this before coding begins avoids a security anti-pattern.
