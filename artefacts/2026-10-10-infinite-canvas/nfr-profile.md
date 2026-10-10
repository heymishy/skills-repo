# NFR Profile: Infinite Canvas — Reusable Free-Form Spatial Canvas Primitive

**Feature:** 2026-10-10-infinite-canvas
**Created:** 2026-10-10
**Last updated:** 2026-10-10
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Canvas render / interaction | No perceptible delay vs. the current list view, for journeys up to 20 stages | Manual observation during DoD live-browser confirmation | ic-s1, ic-s3 |
| Position-save latency | Fire-and-forget, no blocking spinner on drag release | Manual observation | ic-s2, ic-s4 |

**Source:** Story AC / Stakeholder requirement (informal — no journey in this codebase today has more than a handful of stages, so no formal load-test SLO is warranted at this scale)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | New position-update route follows ownership-check-before-mutation / 404-not-403 cross-tenant pattern | `decisions.md` D13 | ic-s2 |
| Multi-tenancy | Position data is tenant-scoped exactly like the rest of the journey feature | ADR-025 | ic-s2 |
| Static asset trust level | `/vendor/drawflow.min.js`/`.css` are unauthenticated, session/tenant-data-free, same trust level as the existing `/vendor/mermaid.min.js` route | `csd-s1` precedent | ic-s1 |
| Input validation | N/A — this feature introduces no new free-text or file-upload input surface; positions are numeric coordinates written by the canvas library itself | — | ic-s2, ic-s4 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (journey/stage business data, same classification as the rest of this feature — not PII, not commercially restricted)

**Source:** `decisions.md` / existing journey feature precedent

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no new residency requirement introduced; data stays in the same database as the rest of the journey feature.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | No dedicated SLA for this feature — rides on the platform's existing availability posture |
| RTO | Not defined | — | |
| RPO | Not defined | — | Position data loss tolerance is the same as the rest of `customer_journey_stages` — no separate backup/recovery requirement |
| Planned maintenance window | Not defined | — | |

**Source:** Business context — no stakeholder-named SLA for this feature.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required — `meta.regulated: false` in `.github/context.yml`, no compliance frameworks apply to this feature.

---

## Gaps and open questions

_No open gaps as of 2026-10-10._ Canvas pan/zoom keyboard operability was identified during `/review` (`ic-s3-review-1.md`, finding 1-M1) and resolved the same day via a formal RISK-ACCEPT (`decisions.md`, Hamish King — Platform Owner) rather than a committed fix — see that entry for rationale and revisit trigger.
