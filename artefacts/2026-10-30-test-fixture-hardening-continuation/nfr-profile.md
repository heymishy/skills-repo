# NFR Profile: test-fixture-hardening-continuation

**Feature:** 2026-10-30-test-fixture-hardening-continuation
**Created:** 2026-10-30
**Last updated:** 2026-10-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Shared fixture / self-test execution time | < 1 second | Timed as part of `node scripts/run-all-tests.js` | tfhc-s3 |
| Structural check execution time | < 1 second per file | Timed manual run of `scripts/check-skills-fixture-usage.js` | tfhc-s3 |
| E2E fixture wrapper overhead | Negligible — thin wrapper around an existing POST call | Observed during `tfhc-s1`'s own migration | tfhc-s1 |

**Source:** Story ACs (tfhc-s3 AC2, story NFRs). No product-level SLO applies — this is internal test tooling, not a served response path.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new production code path | All 4 stories' deliverables live under `tests/` or `scripts/` only — no `src/` production code is added or modified | N/A — architectural boundary, not a named standard | tfhc-s1, tfhc-s2, tfhc-s3, tfhc-s4 |

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

No NFR gaps identified at 2026-10-30. The 2 spike stories (`tfhc-s5`, `tfhc-s6`) carry no NFRs of their own — they are pure investigation with no implementation surface until their own verdict unlocks a follow-on task, at which point that follow-on task's own NFRs would be defined when it is written.
