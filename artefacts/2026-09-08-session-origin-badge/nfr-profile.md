# NFR Profile: Session-Origin Badge

**Feature:** 2026-09-08-session-origin-badge
**Created:** 2026-09-08
**Last updated:** 2026-09-08
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Bulk lookup, not per-row query | Exactly one `_getSessionOriginBulk` call per page render, regardless of row count | Call-count assertion in automated tests (sob-s1 AC6, sob-s2 AC5, sob-s3 AC3) | sob-s1, sob-s2, sob-s3 |

**Source:** Story AC (derived from discovery's stated constraint and confirmed against `.github/architecture-guardrails.md`'s existing "Bulk per-board-render lookup seam" pattern)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | None new — reuses each page's existing auth guard | N/A | sob-s1, sob-s2, sob-s3 |
| Authorisation | None new — reads only data already scoped to the requesting tenant by each page's existing query | N/A | sob-s1, sob-s2, sob-s3 |
| Input validation | Not applicable — no new user input accepted by this feature | N/A | N/A |
| Secrets management | Not applicable — no secrets involved | N/A | N/A |
| Audit logging | None identified — no new write action to log | N/A | N/A |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

<!-- Journey existence and stage-completion state are operational metadata already visible to any authenticated user of the feature's own tenant via the existing pages -- this feature exposes no new data, only a derived summary of data already rendered. -->

**Source:** Not applicable — no security-relevant new surface introduced

---

## Data residency

Not applicable — no new data storage, no data movement across regions. Reads existing Postgres `journeys` rows and in-memory journey-store state in place.

**Source:** Not applicable

---

## Availability

Not applicable — a presentational indicator with graceful degradation on failure (sob-s1 AC7, sob-s3 AC4). No new uptime/RTO/RPO target; inherits the existing pages' availability characteristics unchanged.

**Source:** Not defined — not applicable to this feature's scope

---

## Compliance

Not applicable — `regulated: false`, no compliance frameworks apply to this feature (per discovery.md and `.github/context.yml`).

**Named sign-off required?**
- [x] Not required

---

## NFR AC blocks

Not applicable — no performance/security/data-residency AC blocks beyond what is already written directly into sob-s1/sob-s2/sob-s3's own Acceptance Criteria (AC6/AC7 in sob-s1, AC5 in sob-s2, AC3/AC4 in sob-s3).

---

## Gaps and open questions

No NFR gaps identified at 2026-09-08.
