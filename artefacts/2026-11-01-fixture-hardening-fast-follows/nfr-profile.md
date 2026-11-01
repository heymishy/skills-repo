# NFR Profile: fixture-hardening-fast-follows

**Feature:** 2026-11-01-fixture-hardening-fast-follows
**Created:** 2026-11-01
**Last updated:** 2026-11-01
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Production concurrency cap | Higher than the current value of 3, confirmed stable across repeated local runs | Direct code read + repeated local full-suite runs | fhff-s1 |
| Real CI `Unit test chain` step duration | Measurable reduction below the confirmed 124s baseline | `gh api` job-step timing, same technique proven at `tfhc-s9`'s own DoD | fhff-s1 |
| Shared factory / self-test / structural check execution time | < 1 second per file | Timed manual run, same precedent as every prior walking-skeleton story | fhff-s3 |

**Source:** Story ACs (fhff-s1 AC2/AC4, fhff-s3 NFR). No product-level SLO applies — this is internal test tooling and CI workflow, not a served response path.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new production code path | fhff-s1 and fhff-s3's deliverables live under `tests/`/`scripts/` only | N/A — architectural boundary | fhff-s1, fhff-s3 |
| Least-privilege CI permissions | Any new workflow/step calling the GitHub Actions rerun mechanism uses the minimum permission scope needed | N/A — operational security practice | fhff-s2 |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal
- [ ] Confidential
- [ ] Restricted

**Source:** Story NFRs (fhff-s1, fhff-s2, fhff-s3). No regulated data path in any of the 3 stories.

---

## Data residency

Not applicable — no data storage, persistence, or cross-region concern. This feature produces test-tooling code, CI workflow changes, and investigation findings only.

**Source:** Not applicable

---

## Availability

Not applicable — no runtime service, no SLA. Build/test-time tooling and CI-workflow reliability only (the `deploy-group` fix improves CI *signal reliability*, not a served application's availability).

**Source:** Not applicable

---

## Compliance

Not applicable — no named regulatory framework or clause drives this feature. Discovery's Constraints section lists none identified.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-11-01. `fhff-s2`'s security NFR (least-privilege CI permissions) is a new NFR shape not seen in the parent epic's own stories (which were all pure test-tooling with no CI-workflow-permission surface) — worth confirming at `/definition-of-ready` that the actual implementation's `permissions:` block is reviewed, not just declared as an intent here.
