# NFR Profile: Journey Authoring Experience — Guided Creation, Smarter Defaults, Templates

**Feature:** 2026-10-14-journey-authoring-experience
**Created:** 2026-10-14
**Last updated:** 2026-10-14
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Template-seeding latency | No perceptible delay — 5 sequential INSERTs within the same transaction `handlePostJourneys` already opens | Manual observation during DoD live-browser confirmation | jae-s1 |
| Guided-creation panel auto-open | No new network call — a sequencing change to already-executing client-side code | Manual observation | jae-s2 |
| Field-suggestion scan latency | Same cost profile as `jcx-s4`'s own already-proven persona-suggestion scan (bounded by linked feature-slug count per product, typically small) | Manual observation | jae-s3 |

**Source:** Story AC / direct reuse of established precedent from the parent `2026-10-11-journey-cx-redesign` feature's own NFR profile — no formal load-test SLO warranted at this scale.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Multi-tenancy | Seeded template stages carry the exact same `tenant_id` as the journey itself; verified directly via a cross-tenant test, not assumed | ADR-025 | jae-s1 |
| Multi-tenancy | `getFieldSuggestions` returns the same tenant-scoped result `getPersonaSuggestions` already returns for an equivalent cross-tenant scenario; verified directly, not assumed identical | ADR-025, direct reuse of `jcx-s4`'s own established pattern | jae-s3 |
| Reuse over invention | `extractProblemStatement`/`getFieldSuggestions` mirror `extractWhoItAffects`/`getPersonaSuggestions`'s own existing shape exactly — no new query pattern, no new file-access surface | ADR-026 | jae-s3 |
| No new mutating surface beyond existing patterns | Guided-creation's auto-open is a client-side sequencing change only; template-seeding reuses the existing single-stage INSERT shape N times | ADR-025 | jae-s1, jae-s2 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (journey/stage business data, same classification as the rest of the parent journey feature — not PII, not commercially restricted)

**Source:** Direct reuse of the parent `2026-10-11-journey-cx-redesign` feature's own established data-classification precedent.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — no new residency requirement introduced; all new/changed data stays in the same database as the rest of the journey feature.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | No dedicated SLA for this feature — rides on the platform's existing availability posture |
| RTO | Not defined | — | |
| RPO | Not defined | — | No new data store; same backup/recovery posture as the rest of `customer_journeys`/`customer_journey_stages` |
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

## Accessibility

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| WCAG 2.1 AA — new checkbox | Native, labeled `<input type="checkbox">`, keyboard-operable by default HTML semantics | jae-s1 |
| WCAG 2.1 AA — auto-open focus | Focus genuinely moves to the first editable field on auto-open — verified directly via `document.activeElement`, not assumed because `openPanel` already does this elsewhere | jae-s2 |
| WCAG 2.1 AA — suggestion buttons | Reuse `jcx-s4`'s own already-accessible `sw-persona-suggestion-btn` markup/CSS exactly — native `<button>`, no custom widget | jae-s3 |

**Source:** `product/constraints.md` #9 (hard floor, carried forward from the parent feature's own discovery.md), direct reuse of established accessible patterns per ADR-026.

---

## Gaps and open questions

_No open gaps as of 2026-10-14._ The one genuinely open question this feature's own discovery named — whether operators mostly start journeys from a linked feature (where `jae-s3`'s suggestion mechanism has real source material) or from nothing (where it doesn't) — is explicitly logged as a risk in `discovery.md`, not resolved here; it is expected to surface as a real signal once M2 is measured post-release, not something an NFR can pre-empt.
