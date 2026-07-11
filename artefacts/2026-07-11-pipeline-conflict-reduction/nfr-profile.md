# NFR Profile: pipeline-conflict-reduction

**Feature:** 2026-07-11-pipeline-conflict-reduction
**Created:** 2026-07-11
**Last updated:** 2026-07-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| `npm test` total wall-clock time | No more than 110% of the pre-change baseline (same set of test files, sequential execution) | Direct wall-clock measurement via `process.hrtime()`/`Date.now()` in the new runner, compared against a one-time recorded baseline of today's chain | pcr-s1 (AC1, N1) |

**Source:** Story AC (N1 in the test plan).

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| N/A | This feature is internal tooling (test runner, pipeline-state write scoping, git merge strategy) with no new external input, no new attack surface, no authentication/authorisation surface | Not defined — no applicable standard | pcr-s1 |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Not defined — no security-relevant surface introduced by this feature.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this feature has no data-residency dimension (it changes local repo tooling and git merge configuration, not any data storage or transfer).

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | This feature has no runtime service component — it is dev/CI tooling only, not a running production service with an uptime SLA. |

**Source:** Not defined — no applicable service.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-07-11.
