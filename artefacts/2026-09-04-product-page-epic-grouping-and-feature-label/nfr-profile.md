# NFR Profile: product-page-epic-grouping-and-feature-label

**Feature:** 2026-09-04-product-page-epic-grouping-and-feature-label
**Created:** 2026-09-04
**Last updated:** 2026-09-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new computation | `feature.name` already loaded by `computeTaxonomyRollup`'s existing loop; `byPhase.byPhase.length` reuses the `groupItemsByPhase` call `_renderConsolidatedFeaturesSection` already makes | Code review — confirm no new query or new call to `groupItemsByPhase`/`computeTaxonomyRollup` | pefl-s1 |

**Source:** Story Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input or attack surface | Pure rendering/template change, reuses already-loaded data | N/A | pefl-s1 |

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

**Source:** Matches the existing classification already established for the product page this story extends.

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

_None identified at 2026-09-04._
