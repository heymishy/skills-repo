# NFR Profile: product-sync-blob-fallback-diagnostics

**Feature:** 2026-09-03-product-sync-blob-fallback-diagnostics
**Created:** 2026-09-03
**Last updated:** 2026-09-03
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No added latency for the common (non-truncated) case | Zero additional API calls or log lines when decoded length matches reported size | AC4 regression test — asserts the Blobs API mock is never called | psbf-s1 |
| Truncation-detected case adds one Blobs API round-trip | Acceptable since the whole sync already runs in the background (pst-s1's fire-and-forget design) | Code review — the fallback call happens entirely within the already-async background sync path | psbf-s1 |

**Source:** Story AC2/AC4 and Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input or attack surface | Blobs API call uses the same caller-supplied OAuth token (ADR-020) and the same tenant-scoped product/repo resolution already in place | D37 adapter convention, ADR-020 | psbf-s1 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Matches the existing classification already established for `pst-s1`/`pgft-s1` — no new sensitivity class introduced. PostHog event properties (repo/product identifiers, byte counts) contain no PII.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no new data storage; PostHog events are operational telemetry (byte counts, product/repo identifiers), not user data.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Sync success rate for `skills-framework` specifically (the repo this entire 3-story incident chain has been chasing) | First real, direct confirmation of the root cause and its resolution | Post-merge PostHog + production log observation (see verification script) | psbf-s1 — the culmination of `pst-s1` and `pgft-s1`'s own core motivation |

**Source:** Story's own Benefit Linkage section — live-reproduced on `skills-framework.fly.dev`, 2026-09-03, immediately after `pgft-s1`'s own fix was promoted and confirmed insufficient by itself.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Availability | Whether the Blobs API fallback actually resolves the live incident is the direct thing this story exists to confirm — not closeable until post-merge production observation (see verification script Scenarios 1-2) | Hamish King | Post-merge, immediately after promote-to-prod for this story's merge commit |

_No compliance or data-residency gaps identified at 2026-09-03._
