# NFR Profile: Per-Product Git Repo Configuration and Management

**Feature:** 2026-07-14-product-repo-config
**Created:** 2026-07-14
**Last updated:** 2026-07-14
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Repo-access verification latency | Completes within a normal request/response cycle — no async job needed for MVP | Manual timing during DoD | prc-s1.2, prc-s2.1, prc-s4.1 |
| New-repo bootstrap completion | Under 30 seconds for the typical `.github/skills/` + `.github/templates/` + `scripts/` file count | Manual timing during DoD; if consistently missed, evidence for the local-clone fallback (prc-s2.2 AC4) | prc-s2.2 |
| Standards read latency | Must not regress from today's DB-only read latency — cache-read path stays fast, only writes/rebuilds touch git | Before/after comparison at DoD | prc-s3.2, prc-s3.3 |

**Source:** Story ACs (no formal SLA named in discovery — these are the operator's own usability bars, not contractual targets)

**Behavioural change flagged, not a target breach:** `prc-s2.4` converts `journey.js`'s artefact writes from near-instant local disk writes to Contents API network round-trips. This is a real latency change worth watching during implementation, not yet a defined SLO — no numeric target set because no baseline exists yet (consistent with Metric 1's own "Not yet established" baseline in `benefit-metric.md`).

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Identity/attribution | Every repo write uses the authenticated user's own GitHub OAuth token — never a service account | ADR-020 | prc-s1.2, prc-s1.3, prc-s2.1, prc-s2.2, prc-s2.3, prc-s2.4, prc-s3.1, prc-s4.1 |
| Fail-closed on missing repo config | A product with no connected repo rejects the write attempt with a clear error — never silently falls back to a shared/global repo | Discovery risk section ("must surface as a clear, visible error... never fail silently") | prc-s1.3, prc-s2.4, prc-s3.1 |
| Token storage | The OAuth token itself is never persisted against the product record — only owner/repo strings | ADR-020 (token stays session-scoped) | prc-s1.2, prc-s2.1 |
| Repo-access verification | A repo connection is only accepted after verifying the authenticated user's token actually has access to it | ADR-020 | prc-s1.2, prc-s2.1, prc-s4.1 |
| Cross-tenant isolation | Tenant A's writes can never land in Tenant B's repo, including under adversarial/malformed requests | Metric 3 (benefit-metric.md); matches `bri-s3.4`'s existing pattern | prc-s1.3, prc-s2.3, prc-s4.3 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (repo owner/name strings, product metadata; no PII, no payment data)

**Source:** ADR-020 (`.github/architecture-guardrails.md`), discovery.md risk section

---

## Data residency

Not applicable — no regional or jurisdictional data-residency requirement named in discovery or `product/constraints.md`.

---

## Availability

Not defined — no uptime SLA named for this feature; it inherits the platform's existing availability posture (Fly `auto_stop_machines`/`min_machines_running` config, unchanged by this feature).

---

## Compliance

Not applicable. `context.yml` sets `meta.regulated: false`; no compliance framework is named in discovery or benefit-metric. Matches benefit-metric.md's own Tier 3 determination ("not a compliance-driven feature").

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | No real baseline exists yet for Contents-API-write latency (prc-s2.4) — target is qualitative ("acceptable") until a real measurement exists | Hamish King | At DoD, once implemented |
| Security | Non-GitHub-authenticated users' inability to write (Google/email) is a UX gap, not a security gap — but worth re-confirming at DoD that the "link your GitHub account" prompt (prc-s1.2 AC3, prc-s2.1 AC3) never silently falls through to an unprotected path | Hamish King | At DoD |

