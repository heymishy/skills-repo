# NFR Profile: Multi-Tenant Repo Resolution for SaaS Export + Repo-Connection UX

**Feature:** 2026-08-06-multi-tenant-repo-resolution
**Created:** 2026-08-06
**Last updated:** 2026-08-06
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Tenant-scoped repo lookup | ≤ 500ms added versus the previous env-var read | Wall-clock timing around the lookup call | mtrr-s1 |
| Repo-connection picker load | ≤ 2 seconds, cached to avoid repeat GitHub API calls | Manual timing + cache-hit assertion | mtrr-s2 |

**Source:** Story AC/NFR sections

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Tenant isolation | No inference of another tenant's product/repo existence via timing or distinguishable error responses | `ADR-025` | mtrr-s1 |
| Credential handling | Caller's own credential only, never a service account | `product/constraints.md` #12 | mtrr-s1 |
| No new credential surface | Picker uses existing GitHub OAuth login credential, no new handling introduced | — | mtrr-s2 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — this feature directly concerns which tenant's data is accessible to whom; a real cross-tenant boundary, stricter than a typical internal feature
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** `ADR-025` / `product/constraints.md` #12

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no new cross-border data handling introduced; this fix narrows an existing data-access boundary, it doesn't move data across a new one.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | No new service introduced; inherits the existing export endpoint's availability posture |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None named | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

_No named regulatory framework applies today. Flagged for awareness only: this is functionally a data-isolation control, and if a future compliance framework (e.g. SOC 2) is adopted, this fix would likely become evidence for that framework's access-control requirements._

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Products-table data quality | 3 open `[ASSUMPTION]` lines from discovery not yet resolved via `/clarify` — data completeness of repo-association columns, feature-to-product traceability, GitHub OAuth scope sufficiency | Hamish King | Before `mtrr-s1`/`mtrr-s2` move past `/definition-of-ready` |
