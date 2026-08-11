## Contract Proposal — Admin approves or rejects a promotion request

**What will be built:**
Approve/reject handlers gated by `isEffectivelyAdmin`. Approval invokes `wugs-s6`'s adapter with the request's `content_snapshot` targeting `tenant_org_repo`, using a single conditional `UPDATE ... WHERE status = 'pending' RETURNING request_id` to resolve the request atomically (per the Architecture Constraint added during this DoR run — see review finding `wugs-s9` 1-M1, resolved).

**What will NOT be built:**
Review comments. Bulk approve/reject.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mocked adapter, PR number recorded | unit |
| AC2 | Unit test, reject path, adapter not called | unit |
| AC3 | Integration test, non-admin session, 403 | integration |
| AC4 | Unit test, no org repo designated, blocked with clear error | unit |
| AC5 | Integration test, two concurrent resolution calls, atomic UPDATE mocked to return zero rows on the second | integration |

**Assumptions:**
None — the atomic-update mechanism is now explicit (resolved pre-DoR).

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-wugs-s9-*.js` (new)
Services: None
APIs: None directly
