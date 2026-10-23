# NFR Profile: Production Playback Capture

**Feature:** 2026-10-20-production-playback-capture
**Created:** 2026-10-21
**Last updated:** 2026-10-23
**Status:** Verified at 2026-10-23 (`ppc-s1`, `ppc-s2`, `ppc-s3` all reached `/definition-of-done` with every NFR row addressed and evidenced)

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Single-AC capture time | No fixed SLA — expected a few seconds based on `rpca`'s proven per-screenshot timing | Observed during implementation | `ppc-s1` |
| Full-feature capture time | No fixed SLA yet — ~30-60s is the named threshold for revisiting sync vs. async | Real wall-clock measurement recorded as DoD evidence (story AC3) | `ppc-s2` |
| Rate-limiter overhead | Negligible — matches existing `sign-off.js` usage | Consistent with existing `createRateLimiter` implementation, no new infra | `ppc-s3` |

**Source:** Story AC (`ppc-s2` AC3/AC4) / Not yet a committed SLO — this feature's own build is what establishes the real baseline.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authentication | Capture mechanism uses the Product Owner's own real, already-authenticated `req.sessionId` — never a service credential, never the `NODE_ENV=test` bypass | ADR-018 (Playwright/E2E auth-bypass boundary) | `ppc-s1` |
| Authorisation | Access-control check filters by both `tenant_id` AND `product_id`; capture content is strictly bounded to what the triggering Product Owner's own session can already see | `decisions.md` 2026-10-21 ARCHITECTURE entries | `ppc-s1`, `ppc-s2` |
| Input validation | N/A — no new user-supplied path/query parameters beyond existing authenticated routing; path-traversal guard convention applies if any file path is built from request data (CLAUDE.md mandatory) | CLAUDE.md "Path traversal guard for disk writes" | `ppc-s1` |
| Secrets management | `session_id` is an unsigned bearer-equivalent value and must never leave the server process boundary — no client-side exposure, no logging | `discovery.md` Q1 resolution | `ppc-s1`, `ppc-s2` |
| Audit logging | None identified for this feature at this stage — not a blocking gap, flagged as a candidate for a later story if usage patterns justify it | Not defined | All stories |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Classified Confidential because captured screenshots show a tenant's real, live production data (not synthetic/demo data) — bounded to exactly what that tenant's own Product Owner is already authorized to see (per the Q1/Q3 resolution in `discovery.md`), but still real commercial/customer data, not public or purely internal.

**Source:** `discovery.md` Assumptions and Risks (Q1/Q3 resolutions) / `decisions.md` 2026-10-21 ARCHITECTURE entries / ADR-018.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | No regulated constraint or data-residency requirement identified in `discovery.md` | — |

**Source:** Not applicable — `discovery.md` Constraints section identified no regulated constraints.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | This feature has no dedicated SLA beyond the existing product's own availability. |
| RTO (recovery time) | Not defined | — | No new durable state is introduced beyond existing `journeys`/`products` tables and the tenant's own connected repo (artefact files). |
| RPO (data loss tolerance) | Not applicable | — | Captured screenshots are written as files to the tenant's own connected repo — not a new database of record requiring its own backup/recovery policy. |
| Planned maintenance window | Not defined | — | Follows the existing product's own deployment cadence. |

**Source:** Business context — not formally defined for this feature.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

No regulated constraint or compliance framework was identified in `discovery.md`'s Constraints section. Step 4a (regulated constraint propagation check) was skipped per its own entry condition — no regulated constraint present.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance | Real full-feature capture timing is unknown until `ppc-s2` is built — this is a designed open question, not an oversight (see `ppc-s2` AC3/AC4) | Platform Owner / implementing engineer | At `ppc-s2` DoD |
| Audit logging | No audit trail for capture-trigger actions — flagged, not yet scoped as a story | Platform Owner | Revisit post-MVP if usage patterns justify it |
