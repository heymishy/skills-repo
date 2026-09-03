# NFR Profile: product-sync-timeout-fix

**Feature:** 2026-09-03-product-sync-timeout-fix
**Created:** 2026-09-03
**Last updated:** 2026-09-03
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Immediate acknowledgment response time for `POST /products/:id/sync` | Well under 1 second, regardless of how long the actual background sync takes | Wall-clock measurement (`Date.now()` deltas) in the test suite, using a deliberately slow mock sync adapter to prove decoupling, not just fast-in-practice timing | pst-s1 (AC1, NFR-Performance) |
| Overall sync completion time (the background work itself) | Unchanged from today — this story does not optimize `triggerProductSync`'s own computation, only decouples it from the HTTP response lifetime | Not separately measured by this story; the existing computation is reused as-is | pst-s1 |

**Source:** Story AC1 and its own NFR-Performance test.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new external input or attack surface | The new `GET /products/:id/sync/status` endpoint performs the same tenant/product validation as the existing sync trigger endpoint before returning any state — it must not leak sync status for a product outside the caller's own tenant | Existing tenant-scoping convention already used by `handleGetProductView`/`handlePostProductSync` (`bri-s3.4`'s own precedent) | pst-s1 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Matches the existing classification already established for this product's own dashboard/sync surface — no new sensitivity class introduced.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes response timing and client polling behaviour for an existing sync operation; it introduces no new data storage or cross-border transfer.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Sync operation success rate for products with a large connected `pipeline-state.json` | No regression from today at minimum; realistically, a real improvement — the current architecture fails outright (confirmed live) once fetch-plus-compute exceeds the platform's own reverse-proxy timeout | Manual observation via the AC verification script's own scenarios, pre- and post-merge | pst-s1 — this is the story's own core motivation, not a side effect |

**Source:** Story's own Benefit Linkage section — live-reproduced failure on `skills-framework.fly.dev`, 2026-09-03.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility | The "Syncing…" polling state's real-browser timing behaviour (does it genuinely poll at the intended interval, does it genuinely reload) is verified manually, not by an automated accessibility scan — matches the same DOM-behaviour gap already named in the test plan, not a separate accessibility-specific gap | Hamish King | Post-merge smoke test, before this story's own DoD sign-off |

_No compliance or data-residency gaps identified at 2026-09-03._
