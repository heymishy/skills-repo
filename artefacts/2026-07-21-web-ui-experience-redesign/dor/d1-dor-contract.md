**Contract Proposal — Start an impersonation session (search, reason-gated, session swap)**

**What will be built:** A user/tenant search endpoint; a reason-gated "Act as" flow; a session-swap mechanism (mechanics to be determined by this story's own first-task investigation, per its Architecture Constraints) that atomically writes an audit entry via a new `setImpersonationAuditAdapter()` (D37) while preserving the real admin's identity for exit/audit; a nested-impersonation guard.

**What will NOT be built:** The persistent banner/exit UI (D2). The audit log viewing UI (D3). Time-limiting or step-up re-auth (out of scope at the epic level).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on search filtering | unit |
| AC2 | Unit + integration test on mandatory-reason gate | unit / integration |
| AC3 | Integration test on atomic swap + audit write | integration |
| AC4 | Integration test on audit-failure blocking the swap | integration |
| AC5 | Integration test on nested-impersonation rejection | integration |
| AC6 (D37 wiring) | Integration test on two distinct, correctly-isolated audit rows | integration |

**Assumptions:** The session-swap mechanism itself is NOT yet designed — this contract explicitly does not commit to concrete session-store mechanics (e.g. exactly how Redis-backed session state is manipulated) because that is this story's own first implementation task, per its Architecture Constraints. This is the single largest open assumption in this entire feature.

**Estimated touch points:**
Files: `src/web-ui/middleware/session.js`, `src/web-ui/routes/auth.js` (or a new `impersonation.js` route module), `src/web-ui/server.js` (adapter wiring), a new `impersonation_audit_log` table
Services: Postgres (new table), Redis (existing session store, read/written differently)
APIs: New impersonation start/search endpoints
