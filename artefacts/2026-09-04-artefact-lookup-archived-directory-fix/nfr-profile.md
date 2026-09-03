# NFR Profile: artefact-lookup-archived-directory-fix

**Feature:** 2026-09-04-artefact-lookup-archived-directory-fix
**Created:** 2026-09-04
**Last updated:** 2026-09-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible added cost | One additional `fs.existsSync` check, only reached when the primary path is already confirmed absent | Code review | aada-s1 |

**Source:** Story Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input | `featureSlug` is already trusted and used to build the primary path today; this constructs a second, analogous path from the same value | N/A | aada-s1 |

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not applicable — read-path bug fix, no new failure mode | — | — | — |

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
