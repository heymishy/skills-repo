# NFR Profile: Tenant Admin Bootstrap

**Feature:** 2026-09-26-tenant-admin-bootstrap
**Created:** 2026-09-28
**Last updated:** 2026-09-28
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Login-path bootstrap check | No meaningful added latency — one additional indexed insert/lookup per login | Manual timing during live validation, matching this app's own established RISK-ACCEPT pattern for comparable synchronous login-path checks | `tab-s1` |
| One-time backfill batch | Completes in well under 1 minute at realistic current scale (small real tenant count) | Script execution log with start/end timestamp | `tab-s2` |

**Source:** Story AC / established pattern from this app's own comparable NFRs (e.g. `rtri-s1`'s own read-path performance NFR)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | No new auth mechanism — reuses the existing real login path for all 3 providers | This app's established login convention | `tab-s1` |
| Authorisation | The bootstrap grants the highest privilege level (admin) automatically — must be genuinely race-safe (exactly one winner per new tenant, never zero, never two) | `tab-s1` AC3 (real concurrent-request test, not mocked/serialized) | `tab-s1` |
| Input validation | Not applicable — no new user-supplied input in this feature; tenant/person identity comes from already-authenticated session state | N/A | — |
| Secrets management | This feature is a net secrets-reduction — `ADMIN_GITHUB_LOGINS` is removed, not added to | `tab-s3` AC3 | `tab-s3` |
| Audit logging | Every real admin grant (bootstrap or backfill) is logged with person id, tenant id, and timestamp — never the raw identity string | `tab-s1` NFR (Audit), `tab-s2`'s rollback-enabling pre-migration-role log | `tab-s1`, `tab-s2` |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Real identity values and role assignments are already stored and already read elsewhere in this app — this feature adds no new category of data, only a new write trigger (automatic, rather than admin-initiated) over data that already exists.

**Source:** ADR-025 / this app's own existing identity-and-role-handling convention

---

## Data residency

**Not applicable** — no new data storage, no new region/boundary requirement; reuses the existing `team_memberships` table and adds one small sibling table (`tenant_admin_bootstrap`) with the same residency characteristics as everything else in the same database.

**Source:** Not applicable

---

## Availability

**Not applicable** — no new infrastructure, no new SLA. This feature is entirely a login-path addition plus a one-time batch script within the existing web-ui process and its existing database.

**Source:** Not applicable

---

## Compliance

**No compliance frameworks apply.** Confirmed against `.github/context.yml` (`meta.regulated: false`) and the discovery artefact's own Constraints section.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## NFR AC blocks

**Security (race-safety, already reflected as `tab-s1` AC3):**
```
Given two requests attempting to bootstrap the same brand-new tenant_id concurrently
When both attempt the atomic INSERT ... ON CONFLICT DO NOTHING RETURNING
Then exactly one succeeds and the other does not — no tenant ends up with zero or two admins
```

**Audit logging (already reflected as `tab-s1`'s Audit NFR):**
```
Given the bootstrap mechanism grants admin to a real person
When the grant occurs
Then an admin_bootstrap_granted event is logged with person id, tenant id, and timestamp — never the raw identity string
```

---

## Gaps and open questions

No NFR gaps identified at 2026-09-28.
