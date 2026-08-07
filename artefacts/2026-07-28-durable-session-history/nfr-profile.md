# NFR Profile: Durable Session History for Completed Pipeline Stages

**Feature:** 2026-07-28-durable-session-history
**Created:** 2026-07-28
**Last updated:** 2026-07-28
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Turn-persist write latency | Adds no more than ~100ms to the stage-completion response path (fire-and-forget) | Manual timing check during implementation | dsh-s1 |
| Durable read latency (hot tier) | Under ~200ms for a single-row lookup | Manual timing check | dsh-s2 |
| Breadcrumb page render overhead | No more than ~300ms versus today's artefact-only render | Manual timing check | dsh-s3 |
| Archive job runtime | Completes within its scheduled window without holding long-running locks on the hot table | CI job duration log | dsh-s5 |
| Archive-tier read latency (cold tier) | Under ~500ms | Manual timing check | dsh-s6 |

**Source:** Story AC (no formal SLO exists for this internal platform surface; targets are directional, set during story-writing to keep the split-view rebuild from feeling slower than today's page)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | Every `session_turns` row carries `tenant_id`; every read enforces the existing `requireJourneyAccess`/`isSameTenant` guard | ADR-025 (multi-tenancy at application layer) | dsh-s1, dsh-s2, dsh-s3, dsh-s4, dsh-s6 |
| Cross-tenant access response | A cross-tenant request returns 404, never 403 | CLAUDE.md FORBIDDEN-vs-NOT_FOUND policy | dsh-s2, dsh-s3, dsh-s6 |
| Secrets management | Turn content must never include `accessToken` | Matches `skill-session-redis.js`'s existing `_sanitise()` convention | dsh-s1 |
| Data-governance retention | Verbatim conversation text retained no longer than 60 days in the hot tier before archival | Resolved via `/clarify`, logged in `decisions.md`; closes the gap flagged in `product/constraints.md` #5 | dsh-s5 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Conversation turns may contain operator-authored, business-sensitive discussion of a feature's scope, decisions, or constraints — treated at the same Confidential level as the artefacts they produce, not a lower bar.

**Source:** `product/constraints.md` #5 (data-governance gap, closed via this feature's retention + access-control design, per `decisions.md`)

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

No data residency requirement applies — this platform has no stated jurisdictional data-boundary obligation (`meta.regulated: false` in `.github/context.yml`), and this feature stores data in the same Postgres instance already used for `journeys`/`artefacts`.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | Matches this web-ui surface's existing posture — hosted on Fly.io with no formal SLA today |
| RTO (recovery time) | Not defined | — | No change from today's recovery posture |
| RPO (data loss tolerance) | Zero, going forward | Continuous | The entire point of this feature — turns must never be lost again once persisted, until (and unless) explicitly archived per dsh-s5 |
| Planned maintenance window | Not applicable | — | No planned downtime introduced by this feature |

**Source:** Business context (internal platform hardening, no external SLA commitment)

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Internal platform governance (not an external regulator) | `product/constraints.md` #5 — "Intentional gap — verbatim instruction assembly record" | Retention bounded (60 days) + access control (tenant-isolation) must both be in place before verbatim conversation text can be durably stored | dsh-s1, dsh-s2, dsh-s5 |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

No external regulatory framework applies (`meta.regulated: false`). The internal constraint above was already resolved by the platform owner during `/clarify` (see `decisions.md`) — no separate compliance/legal review gate is needed for this solo-operator, non-regulated context.

---

## Gaps and open questions

No NFR gaps identified at 2026-07-28. All performance targets are directional (no formal SLO exists for this internal surface); all security/data-governance requirements trace to explicit decisions already logged in `decisions.md`.
