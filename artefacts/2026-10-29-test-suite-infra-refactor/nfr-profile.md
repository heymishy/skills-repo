# NFR Profile: test-suite-infra-refactor

**Feature:** 2026-10-29-test-suite-infra-refactor
**Created:** 2026-10-29
**Last updated:** 2026-10-29
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Self-test execution time | < 1 second | Timed as part of `node scripts/run-all-tests.js` | tsir-s2 |
| Structural check execution time | < 1 second per file | Timed manual run of `scripts/check-journey-fixture-usage.js` | tsir-s3 |

**Source:** Story AC (tsir-s2 AC3, tsir-s3 NFRs). No product-level SLO applies — this is internal test tooling, not a served response path.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new production code path | All three stories' deliverables live under `tests/` or `scripts/` only — no `src/` production code is added or modified | N/A — architectural boundary, not a named standard | tsir-s1, tsir-s2, tsir-s3 |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Not defined — no production attack surface is introduced by this feature. Noted because the originating incident (`ctpl-s1`) was security-relevant, even though this feature's own mitigation (test-fixture hygiene) is not itself security-sensitive code.

---

## Data residency

Not applicable — no data storage, persistence, or cross-region concern. This feature produces only test-time helper code and a local CI/review check script.

**Source:** Not applicable

---

## Availability

Not applicable — no runtime service, no SLA. This is build/test-time tooling only.

**Source:** Not applicable

---

## Compliance

Not applicable — no named regulatory framework or clause drives this feature. Discovery's Constraints section lists none identified.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-10-29.
