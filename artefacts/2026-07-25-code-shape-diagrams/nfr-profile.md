# NFR Profile: 2026-07-25-code-shape-diagrams

**Feature:** 2026-07-25-code-shape-diagrams
**Created:** 2026-07-25
**Last updated:** 2026-07-25
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Canvas diagram render latency | No perceptible added latency vs existing block types | Informal comparison during dogfood use — no numeric baseline exists yet | csd-s1, csd-s2 |
| Migration-file parsing / drift comparison time | Completes within the normal `/verify-completion` session time budget | Session timing observation | csd-s5, csd-s6 |

**Source:** Story AC / Not defined (no numeric baseline exists for a brand-new capability)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Client-side rendering safety | Mermaid rendering configuration must disable any HTML-injection-capable features | Mermaid's own security-level configuration | csd-s1, csd-s2 |
| Data exposure scope | Diagrams show schema/structure only (table/column/relationship names) — never row-level or tenant-specific data | Discovery's resolved "no cross-tenant exposure risk by construction" reasoning | csd-s4, csd-s5, csd-s6 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Discovery Constraints section / Not defined beyond the above

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this feature has no data residency requirement; diagram content is derived from the operator's own already-committed repository content, not stored or transferred cross-region.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | Not a customer-facing uptime-critical path — a diagram rendering failure degrades gracefully (per csd-s5 AC4) rather than blocking any critical flow. |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | No numeric baseline exists for canvas render latency or migration-parsing time — informal observation only for MVP | Hamish King | Revisit once real usage data exists (post csd-s1 dogfood) |

