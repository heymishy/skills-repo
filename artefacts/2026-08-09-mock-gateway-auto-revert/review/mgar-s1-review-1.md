## Review: mgar-s1 — Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs

**Story:** artefacts/2026-08-09-mock-gateway-auto-revert/stories/mgar-s1-auto-revert-and-ci-enforcement.md
**Reviewer:** Claude (agent), operator-directed
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to the operator's own live-reported incident, confirms the exact mechanism via direct source inspection (`isMockGatewayEnabled()`'s precedence order), and independently confirms via this repo's own decisions.md history that the admin identity needed for the CI-side fix (AC5) is already provisioned — not an assumption.

### Category B: Scope discipline

PASS. Out of scope explicitly excludes redesigning the persistence model (correctly deferring to amgt-s1's own deliberate original choice), re-provisioning an already-provisioned identity, touching the fixture mechanism, and building a broader alerting system beyond the admin page itself — each with a one-line reason.

### Category C: AC quality

PASS. 6 ACs, each independently testable. AC1-AC3 form a coherent trio covering the TTL's core behaviour (expiry, direction-asymmetry, refresh-resets-window) — AC3 in particular is a strong catch, preventing the naive TTL design from prematurely reverting a genuinely still-in-use debugging session. AC5 explicitly requires non-throwing, reason-reporting behaviour matching an established precedent (`topUpTestTenantCredits`) rather than inventing new failure semantics. AC6 is a clean regression guard.

### Category D: Completeness

PASS. NFRs correctly scoped — performance/security/audit assessed honestly (audit "improves" via the natural log-event companion, not overclaimed). Complexity rated 2 with specific, genuine justification (three moving parts: precedence-order correctness, CI-auth reuse, workflow YAML), appropriately higher than today's other three short-track fixes (rated 1).

### Category E: Architecture compliance

PASS. Explicitly confirms the D37 non-adapter classification is preserved. No shared surface module (admin auth, CSRF, `renderShell`) is modified in its own logic — only consumed and extended with new copy/exports. `.github/architecture-guardrails.md` is not implicated.

---

### Verdict

**PASS — 0 HIGH findings.** Well-grounded safety fix with a genuinely useful AC3 (refresh-resets-TTL) catch that a less careful design would have missed. Cleared to proceed to `/test-plan`.
