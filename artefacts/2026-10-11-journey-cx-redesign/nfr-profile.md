# NFR Profile: Journey CX/UX Redesign — Journey Map + Placeholder-Feature Trigger

**Feature:** 2026-10-11-journey-cx-redesign
**Created:** 2026-10-11
**Last updated:** 2026-10-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Emotion curve render | No perceptible delay for journeys up to 20 stages, matching the prior canvas epic's own bound | Manual observation during DoD live-browser confirmation | jcx-s3 |
| Placeholder-feature trigger latency | Completes within 2 seconds (folder creation + Section-1 seeding is lightweight, no heavy computation) | Manual observation | jcx-s1 |
| Persona pre-population scan latency | Within normal page-interaction latency (bounded file read — only features under one product, not the whole repo) | Manual observation | jcx-s4 |

**Source:** Story AC / established precedent from `2026-10-10-infinite-canvas`'s own NFR profile (no formal load-test SLO warranted at this scale — no journey in this codebase today has more than a handful of stages)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | Placeholder-feature creation, trigger, and mapping-conversion routes follow ownership-check-before-mutation / 404-not-403 cross-tenant pattern | `decisions.md` D13 | jcx-s1, jcx-s2, jcx-s5 |
| Authorisation (role) | Same non-viewer authorization as every other mutating route — no new permission tier; explicitly, independently verified via real server-dispatch tests | `decisions.md` (2026-10-11, `/clarify`), `check-vrne-s4-edge-case-gate.js` precedent | jcx-s5 |
| Multi-tenancy | New columns (`mapping_state`, `persona_name`/`persona_role`/`persona_goal`) and all new routes are tenant-scoped exactly like the rest of the journey feature | ADR-025 | jcx-s1, jcx-s2, jcx-s4, jcx-s5 |
| Path traversal | The placeholder-feature trigger's feature-folder creation must validate the resolved path (`path.resolve` + `startsWith(repoRoot)`), matching the `ougl` path-traversal guard convention | `CLAUDE.md` Coding standards | jcx-s1 |
| Input validation | Persona fields (`persona_name`/`persona_role`/`persona_goal`) are free text — same validation posture as existing `description`/`pain_points`/`opportunities` fields (escaped on render, no new injection surface) | — | jcx-s4 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (journey/persona business data, same classification as the rest of this feature — not PII, not commercially restricted)

**Source:** `decisions.md` / `2026-10-10-infinite-canvas`'s own established precedent

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
| RPO | Not defined | — | New data (persona, mapping state) has the same backup/recovery posture as the rest of `customer_journeys`/`feature_customer_journey_stage_mappings` — no separate requirement |
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

_No open gaps as of 2026-10-11._ The one genuinely novel risk area — the placeholder-trigger's own authorization model — was resolved explicitly during `/clarify` (same-as-existing-routes, no new permission tier) and given its own dedicated verification story (`jcx-s5`), added to MVP scope via a `/definition`-time scope note (`decisions.md`, 2026-10-11) rather than left as an assumed-safe afterthought.
