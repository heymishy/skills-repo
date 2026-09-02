# NFR Profile: Product Dashboard Becomes Unreadable at Real-World Scale

**Feature:** 2026-09-02-product-dashboard-triage
**Created:** 2026-09-02
**Last updated:** 2026-09-02
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Page load / render time | No regression — removing the duplicate static rendering pass should, if anything, reduce response size | Manual before/after comparison on `skills-framework` | pdt-s1 |
| Triage strip data | Reuses already-computed `healthCounts` — no new query | Code review confirms no new data fetch introduced | pdt-s2 |

**Source:** Story AC / established repo pattern

_No formal latency budget defined — this is an internal dashboard, not a customer-facing performance-sensitive path._

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new data exposure | The story-detail breadcrumb surfaces only product/phase/epic context already visible on the page the operator navigated from | Story AC | pdt-s4 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Established repo pattern — no new sensitivity class introduced by any story in this feature.

---

## Data residency

Not applicable — no new data storage introduced. All four stories are rendering/IA changes against already-computed, already-stored data.

**Source:** Not applicable

---

## Availability

No availability SLA changes. This feature does not introduce new infrastructure or change deployment topology.

**Source:** Not applicable

---

## Compliance

No named regulatory framework or compliance obligation applies. The discovery artefact names no compliance concern, and `context.yml`'s `meta.regulated` is `false` for this repo.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility | Every story carries its own accessibility AC (keyboard operability, `aria-expanded`, contrast, focus states) rather than a single feature-level accessibility test pass — acceptable given the small, independent scope of each story, but worth a combined accessibility smoke-check across all four once merged | Hamish King | Post-merge, before DoD sign-off on the last story |

_No compliance or data-residency gaps identified at 2026-09-02._
