# NFR Profile: Admin Role System and Admin Panel

**Feature slug:** 2026-07-03-admin-role-panel
**Date:** 2026-07-03
**Source:** Derived from discovery constraints, CLAUDE.md coding standards, and epic oversight level (Medium).

---

## Security

**Auth gate correctness:** `requireAdmin` must check both `req.session.userId` (authenticated) AND `req.session.role === 'admin'` with strict equality. A missing userId check or truthy role check is an authorization bypass defect — treated as a blocking finding at DoR and /review.

**Input validation:** All user-supplied inputs to admin routes (`tenantId`, `amount`) must be validated server-side before any DB write or query construction. `tenantId` must be validated against a DB allowlist of existing tenants (not string matching alone). `amount` must be a positive integer. Client-side validation is not a substitute.

**No role elevation via request:** `req.session.role` is set only by the server-side DB lookup in auth callbacks (arl-s1). It must never be accepted from request body, query string, or header. Any code path that allows a client to supply `role` is a critical security defect.

**Path traversal guard (ougl):** Although arl-s3 does not write to disk, all admin form inputs follow the ougl input validation mandate — `tenantId` is not used in any file path construction. If a future story adds disk writes, the ougl path validation guard (`path.resolve` + `startsWith(repoRoot)`) is mandatory.

**Response escaping:** Any `tenantId` or balance value interpolated into the admin credits HTML page must be HTML-escaped before insertion to prevent stored XSS if a tenant_id contains special characters.

---

## Performance

**Role lookup latency:** The `getUserRole(tenantId)` DB query in auth callbacks adds one synchronous DB round-trip per login. Target: under 50ms on the Fly.io Postgres instance. No caching required in MVP — logins are infrequent and the table is small.

**Admin credits page load:** `GET /admin/credits` executes a single `SELECT` against the `credits` table. Target: HTTP 200 within 2 seconds for up to 100 tenant rows. No pagination required in MVP.

---

## Reliability

**Migration idempotency:** The `CREATE TABLE IF NOT EXISTS user_roles` migration must not error on repeat execution (server restart, redeployment). `IF NOT EXISTS` is mandatory — not optional.

**Role load failure handling:** If the DB query in the auth callback fails (connection error, timeout), the error must propagate — the session must not be saved with a silently defaulted or missing role. Login must fail visibly, not silently succeed with an incorrect role.

---

## Compliance

**Non-regulated:** This feature has no regulatory compliance requirements (no PCI scope, no GDPR special-category data, no audit mandate in MVP). Standard secure coding practices apply (see Security section above).

---

## Accessibility

**Admin credits page:** Server-rendered HTML using native `<form>`, `<input>`, and `<button>` elements. Native keyboard accessibility (Tab/Enter/Space) is the baseline. AC7 of arl-s3 is classified as RISK-ACCEPT + manual smoke test per B2 (see decisions.md ADR-004). WCAG 2.1 AA automated compliance is not required for this operator-only internal page in MVP.

---

## Observability

No structured logging requirement is introduced in MVP. The existing Pino logger in auth callbacks will naturally emit session creation events including `tenantId`. No new log events are mandated by this feature.

---

## Constraints Summary

| Constraint | Source | Status |
|-----------|--------|--------|
| No new npm dependencies | product/tech-stack.md | Hard constraint |
| Node.js CommonJS only | product/tech-stack.md | Hard constraint |
| No Express | product/tech-stack.md | Hard constraint |
| D37 injectable adapter (getUserRole) | CLAUDE.md | Mandatory — arl-s1 |
| ougl path traversal guard | CLAUDE.md | Mandatory — arl-s3 inputs |
| B2 CSS-layout AC classification | CLAUDE.md | Mandatory — arl-s3 AC7, classified as RISK-ACCEPT |
| req.session.accessToken canonical | CLAUDE.md | Hard constraint on any auth.js modification |
