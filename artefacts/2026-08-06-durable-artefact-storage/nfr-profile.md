# NFR Profile: durable-artefact-storage

**Feature:** 2026-08-06-durable-artefact-storage
**Created:** 2026-08-06
**Last updated:** 2026-08-06
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Stage-completion latency (git commit added) | No more than ~2s added vs. today's local-disk-only write | E2E test timing assertions | das-s1 |
| Journey-start gate check latency | <50ms added (single existing-column read) | Functional test | das-s2 |

**Source:** Story AC / discovery MVP scope.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Reuses existing `req.session.accessToken` pattern — no new credential mechanism | `product/constraints.md` #12 (credentials are structural) | das-s1, das-s2 |
| Authorisation | Repo owner/name resolution and the journey-start gate both scoped by `tenant_id` via the existing `products` table lookup | ADR-025 (application-layer multi-tenancy) | das-s1, das-s2 |
| Secrets management | Git commit author is always the operator's own OAuth identity, never a service account | `product/constraints.md` #12; matches `sign-off-writer.js`'s existing pattern | das-s1 |
| Audit logging | The git commit itself is the audit trail for das-s1's write path (real author, real timestamp) — no separate audit log needed | — | das-s1 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Artefact content may include business-sensitive discovery/definition/review material; journey and product records are tenant-scoped. Consistent with the `multi-tenant-repo-resolution` feature's own classification.

**Source:** `.github/standards/security/` / consistency with `mtrr-s1`/`mtrr-s2`'s classification.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no residency requirement stated in discovery or `product/constraints.md` for this feature.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | Matches existing `wuce-staging`/production application availability; no new dedicated SLA introduced by this feature. |
| RTO (recovery time) | Not defined | — | This feature's whole purpose is to remove the redeploy-induced data-loss window that RTO/RPO would otherwise need to cover for artefacts specifically. |
| RPO (data loss tolerance) | 0 (by design, post-fix) | — | Once das-s1 ships, a completed stage's artefact has zero data loss tolerance across redeploys — that is the metric this feature exists to hit. |

**Source:** Discovery success indicators / benefit-metric.md.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

Confirmed at `/benefit-metric` Step 3b: operational reliability fix, no named compliance framework or regulatory obligation (`complianceFrameworks: []`, `regulated: false`).

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance/durability | `das-s1`'s Out of Scope explicitly excludes committing *edited/re-saved* artefact content to git — only the initial stage-completion commit is durable. If edit-durability turns out to matter in practice, a follow-on story is needed. | Hamish King | Revisit post-beta if a real edit-loss incident occurs |

