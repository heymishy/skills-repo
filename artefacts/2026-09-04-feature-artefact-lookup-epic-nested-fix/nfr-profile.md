# NFR Profile: feature-artefact-lookup-epic-nested-fix

**Feature:** 2026-09-04-feature-artefact-lookup-epic-nested-fix
**Created:** 2026-09-04
**Last updated:** 2026-09-03
**Status:** Verified at 2026-09-03 (DoD)

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new query added | Reuses `_resolveBreadcrumbContext`'s existing tenant-scoped taxonomy query once per request, replacing today's redundant pattern (query result computed but not reused for the artefact fetch) | Code review — confirm only one taxonomy query per request, not two | fal-s1 |

**Source:** Story Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input or attack surface | The taxonomy scan is already tenant-scoped (`WHERE p.tenant_id = $1`), unchanged by this story; no new user input is accepted | N/A | fal-s1 |

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

**Source:** Matches the existing classification already established for the artefact-page route this story fixes.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not applicable — read-path bug fix, no new failure mode; the pre-existing "No artefacts found" fallback still applies whenever nothing resolves | — | — | — |

---

## Audit

| NFR | Requirement | Measurement method | Applies to story |
|-----|-------------|--------------------|-----------------|
| Audit trail reflects the real artefacts accessed | The existing `feature_artefacts_accessed` audit log entry logs the resolved real feature slug where it differs from the raw URL slug | Code review — confirm the log call uses the resolved slug, not the raw parameter | fal-s1 |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

_None identified at 2026-09-04._
