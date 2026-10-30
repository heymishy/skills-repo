# NFR Profile: test-fixture-hardening-continuation

**Feature:** 2026-10-30-test-fixture-hardening-continuation
**Created:** 2026-10-30
**Last updated:** 2026-10-31
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Shared fixture / self-test execution time | < 1 second | Timed as part of `node scripts/run-all-tests.js` | tfhc-s3 |
| Structural check execution time | < 1 second per file | Timed manual run of `scripts/check-skills-fixture-usage.js` | tfhc-s3 |
| E2E fixture wrapper overhead | Negligible — thin wrapper around an existing POST call | Observed during `tfhc-s1`'s own migration | tfhc-s1 |
| Shared fixture / self-test execution time | < 1 second | Timed as part of `node scripts/run-all-tests.js` | tfhc-s7 |
| Structural check execution time | < 1 second per file | Timed manual run of `scripts/check-journeys-fixture-usage.js` | tfhc-s7 |
| Adapter-stubbing change | Not applicable — no runtime behavioural change, test-infrastructure-only | N/A | tfhc-s8 |

**Source:** Story ACs (tfhc-s3 AC2, tfhc-s7 AC2, story NFRs). No product-level SLO applies — this is internal test tooling, not a served response path.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new production code path | All stories' deliverables live under `tests/` or `scripts/` only — no `src/` production code is added or modified | N/A — architectural boundary, not a named standard | tfhc-s1, tfhc-s2, tfhc-s3, tfhc-s4, tfhc-s7, tfhc-s8 |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Not defined — no production attack surface is introduced by this feature. Noted because the originating incident class (`ctpl-s1`) was security-relevant, even though this feature's own mitigation (test-fixture hygiene, continued) is not itself security-sensitive code.

---

## Data residency

Not applicable — no data storage, persistence, or cross-region concern. This feature produces only test-time helper code, local CI/review check scripts, and investigation artefacts (classification, spikes).

**Source:** Not applicable

---

## Availability

Not applicable — no runtime service, no SLA. This is build/test-time tooling and investigation only.

**Source:** Not applicable

---

## Compliance

Not applicable — no named regulatory framework or clause drives this feature. Discovery's Constraints section lists none identified.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-10-30, reconfirmed 2026-10-31. The 2 spike stories (`tfhc-s5`, `tfhc-s6`) carried no NFRs of their own — pure investigation with no implementation surface. Their follow-on implementation stories (`tfhc-s7`, `tfhc-s8`, written 2026-10-31 once each spike's PROCEED verdict unlocked them) have now had their own NFRs defined above, same bounded shape as the earlier implementation stories.
