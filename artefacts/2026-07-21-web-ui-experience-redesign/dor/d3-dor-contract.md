**Contract Proposal — Impersonation audit log**

**What will be built:** A read-only audit list view (Settings → Impersonate tab) querying the `impersonation_audit_log` table D1 writes to, gated by `requireAdmin` at the API layer.

**What will NOT be built:** Filtering/search/export. Target-user notification. A tiered reviewer role.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit + integration test on completed-session rendering | unit / integration |
| AC2 | Unit test on in-progress-session rendering | unit |
| AC3 | Integration test on API-layer rejection for non-admins | integration |
| AC4 | Unit test on empty state | unit |

**Assumptions:** D1's audit table schema (admin identity, target identity, tenant, reason, start/end timestamps) is stable and this story reads it directly, without needing its own separate schema.

**Estimated touch points:**
Files: `src/web-ui/routes/settings.js` (Impersonate tab), reuses D1's audit adapter for reads
Services: Postgres (existing table from D1)
APIs: A read-only audit-list endpoint
