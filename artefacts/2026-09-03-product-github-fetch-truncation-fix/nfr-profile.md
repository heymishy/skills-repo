# NFR Profile: product-github-fetch-truncation-fix

**Feature:** 2026-09-03-product-github-fetch-truncation-fix
**Created:** 2026-09-03
**Last updated:** 2026-09-03
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Worst-case added latency when all retries fail | Well under 2 seconds of additional retry-backoff delay before the background sync ultimately fails | Code review of the fixed backoff schedule (500ms + 1000ms = 1500ms worst case) | pgft-s1 (AC1) |

**Source:** Story AC1 and Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|--------------------|-----------------|
| No new external input or attack surface | Same `Authorization: Bearer [token]` header and Contents API endpoint reused unchanged across retries; no new input surface introduced | Existing adapter convention (D37, ADR-020 — caller's own OAuth token, never a service account) | pgft-s1 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Matches the existing classification already established for `pst-s1` (the story this one directly follows) — no new sensitivity class introduced.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|-------------------|-------------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — this story changes retry/error-handling behaviour for an existing outbound fetch; it introduces no new data storage or cross-border transfer.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Sync success rate for products with a large connected `pipeline-state.json`, for the specific failure mode this story addresses (transient network/parse failure on the GitHub fetch) | Improvement over today's zero-retry behaviour; full resolution not guaranteed without further production observation (see story's own Complexity Rating note) | Post-merge production log observation — watch for recurrence of `[product-sync] background sync failed` for the same product after this ships | pgft-s1 — direct continuation of `pst-s1`'s own core motivation |

**Source:** Story's own Benefit Linkage section — live-reproduced on `skills-framework.fly.dev`, 2026-09-03, immediately after `pst-s1`'s own fix was promoted to production.

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
| Availability | Whether retry-with-backoff fully resolves the production incident is not provable pre-merge — only that the retry mechanism itself works correctly (covered by unit tests). If the failure recurs identically in production logs after this ships, that is new evidence for a harder root cause (e.g. a GitHub API size-tier behaviour, or a Fly egress network limit) requiring follow-up investigation. | Hamish King | Post-merge log observation — watch `flyctl logs --app skills-framework` for `[product-sync] background sync failed` recurrence over the following days |

_No compliance or data-residency gaps identified at 2026-09-03._
