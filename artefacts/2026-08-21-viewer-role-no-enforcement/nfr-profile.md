# NFR Profile: Viewer role has no actual write-blocking enforcement

**Feature:** 2026-08-21-viewer-role-no-enforcement
**Created:** 2026-08-22
**Last updated:** 2026-08-22
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. The gate reuses `requireAdmin`'s existing live-role-check adapter call; no new query pattern or additional latency is introduced beyond what `requireAdmin`-gated routes already incur today.

**Source:** Not defined — no performance constraint applies to a role-check gate of this shape.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|---------------------|-------------------|
| Authorisation | A `viewer`-role session must be denied on every enumerated write route; `engineer`/`product`/`admin` roles must see zero regression | "Access control: Deny by default" — this repo's own injected security standard, already applied identically in `jatg-s1` this session | vrne-s1, vrne-s2, vrne-s3, vrne-s4 |
| Fail-closed on ambiguous role | Missing, null, or unrecognised role state must deny, not silently pass | Same standard, mirrors `requireAdmin`'s existing fail-closed default | vrne-s1 (AC4) |
| Audit logging | Every denial logged with person ID, tenant ID, timestamp, route | Mirrors `requireAdmin`'s existing `admin_access_denied` audit pattern | vrne-s1 (AC5), vrne-s2 (AC5), vrne-s3 (AC3), vrne-s4 (AC6) |

**Data classification:**
- [x] Internal — non-public but low sensitivity (role/session state; no PII beyond what already flows through `requireAdmin`'s identical existing pattern)
- [ ] Public — no PII, no sensitive data
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** This repo's own injected security standard ("deny by default") + direct precedent from `requireAdmin`'s existing implementation.

---

## Data residency

Not applicable — no data storage or residency change. The gate reads the existing `req.session.role` field (already sourced from `team_memberships` via the same mechanism `requireAdmin` already uses); no new persisted data, no new region/boundary concern.

**Source:** Not applicable

---

## Availability

No availability SLO applies — this is a synchronous, in-process authorization check with no external dependency beyond the existing role-resolution adapter `requireAdmin` already calls.

**Source:** Not defined — not applicable to this feature's scope

---

## Compliance

No named regulatory framework applies. `context.yml`'s `meta.regulated` is `false` for this repo. This is a self-imposed risk-reduction obligation (see benefit-metric.md's Tier 3 metric), not an external compliance driver.

**Named sign-off required?**
- [ ] Not required
- [x] Yes — security-relevant sign-off recommended at DoR (not a compliance/legal review, but the same "explicit risk acknowledgment" pattern used for `jatg-s1`'s own W4 RISK-ACCEPT this session), given this touches many real routes across the app.
