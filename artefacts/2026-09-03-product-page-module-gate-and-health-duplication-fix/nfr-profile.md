# NFR Profile: product-page-module-gate-and-health-duplication-fix

**Feature:** 2026-09-03-product-page-module-gate-and-health-duplication-fix
**Created:** 2026-09-03
**Last updated:** 2026-09-03
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new computation | Reuses already-computed `healthCounts`/`groupItemsByPhase`/`groupItemsByModule` data unchanged | Code review — no new query, no new rollup-computation call | ppg-s1 |

**Source:** Story Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input or attack surface | Pure rendering/template change, no new data write, no new input surface | N/A | ppg-s1 |

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

**Source:** Matches the existing classification already established for the `dashboard-triage` epic this story extends.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not applicable — pure client-facing rendering change, no availability impact | — | — | — |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

_None identified at 2026-09-03._
