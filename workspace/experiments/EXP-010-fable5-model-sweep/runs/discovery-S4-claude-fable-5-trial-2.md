# Discovery: Card Services Experience API

## 1. Problem Statement

Eleven downstream consumers integrate point-to-point with the card core, each with divergent data models and auth patterns. The vendor's legacy API deprecation in **18 months** forces a migration. Rather than 11 independent migrations, the proposal is a single **Experience API layer** that abstracts the card core behind a stable, versioned contract — turning a forced migration into an architectural consolidation.

**Primary driver:** Vendor deadline (hard constraint).
**Secondary drivers:** Reduce integration sprawl, fix the shared-admin-account security debt, enable governed external partner access.

---

## 2. Goals & Success Criteria

| Goal | Measurable outcome |
|---|---|
| Decommission legacy API dependency | 0 direct consumer integrations against card core by month 18 (or 24 with extension) |
| Single stable contract | All 11 consumers on versioned Experience API; vendor API changes absorbed without consumer-facing breaks |
| PCI DSS compliant caching | No raw PAN at rest in the API layer; cache passes PCI audit |
| Consent-governed partner access | Partner requests rejected when consent absent/expired/revoked; auditable per data type |
| Least-privilege access | Shared admin service account retired; per-operation scoped credentials |
| Extension trigger secured | Demonstrable migration progress evidence package ready by **month 12** |

---

## 3. Proposed Scope

**In scope:**
- Experience API: card account summary, transaction history (90 days), spend categories, card controls (freeze/unfreeze, limit changes), dispute initiation
- Read-path caching layer (PCI-constrained)
- AuthN/AuthZ model with per-operation least-privilege scopes
- Consent enforcement layer for the two external fintech partners
- Migration of 11 existing integrations
- API versioning and deprecation policy for the new layer itself

**Out of scope (assumed — confirm):**
- Changes to card core itself or vendor contract negotiation beyond the extension clause
- Transaction history beyond 90 days / data warehouse use cases
- New product features beyond the five listed capabilities
- Partner onboarding beyond the two existing fintechs

**Scope boundary questions (see §7):** dispute *initiation* vs. dispute lifecycle; whether spend categorisation is computed by us or passed through from the vendor.

---

## 4. Stakeholders & Consumers

| Group | Interest |
|---|---|
| Mobile app, internet banking, contact centre teams | Internal consumers; migration effort, contract design input |
| Two fintech partners | External consumers; consent model, sandbox, contractual SLAs |
| Card core vendor | Deprecation timeline, new API capabilities, extension clause |
| Security / PCI compliance | Cache design, PAN handling, scope reduction opportunity |
| Open banking / CDR programme owner | Consent framework alignment |
| Identity/IAM team | Service account decomposition, scoped credentials |
| Operations / SRE | New critical-path component; availability now gates 11 consumers |

**Inventory needed:** Map all 11 integrations — which of the five capabilities each uses, traffic volumes, auth pattern, team capacity for migration, and any consumers using vendor API features *not* in the five-capability list (a classic hidden-scope risk).

---

## 5. Constraints

1. **Hard deadline:** 18 months, extendable to 24 only with demonstrated progress by month 12. The month-12 checkpoint is effectively the real milestone.
2. **PCI DSS:** Transaction data in scope. Cache must never hold raw PAN; truncated PAN (last 4) permitted. The Experience API itself enters PCI scope — segmentation, key management, audit logging all apply.
3. **CDR-equivalent consent:** Per-customer, per-data-type consent checks for partner traffic. Consent revocation must take effect on the read path (cache invalidation implication).
4. **Write operations carry higher risk:** Card controls and dispute initiation are mutations — idempotency, audit trail, and stronger authorisation needed than for reads.
5. **Least-privilege undefined:** Currently a gap, not just a constraint — needs explicit design work (see §8).

---

## 6. Key Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | New vendor API lacks parity with legacy API (e.g., missing fields, different semantics for disputes/controls) | Scope blowout, redesign mid-flight | **Spike first:** gap analysis legacy vs. replacement vendor API before contract design |
| R2 | One or more of the 11 consumers uses undocumented legacy API features outside the five capabilities | Late-discovered scope, blocked migration | Integration inventory + traffic analysis in first 4–6 weeks |
| R3 | Experience API becomes a single point of failure for 11 consumers | Availability incident affects everything | HA design, SLOs, capacity planning, circuit breakers to card core |
| R4 | Big-bang migration risk — all consumers cut over near the deadline | Deadline miss, no extension evidence | Strangler pattern: migrate consumers incrementally, starting month ~6; sequence low-risk read-only consumers first |
| R5 | PCI scope expansion of the new platform delays go-live (audit, segmentation) | Timeline slip | Engage PCI assessor at design stage, not pre-launch |
| R6 | Consent enforcement bugs expose card data to partners without consent | Regulatory breach | Consent check as a mandatory policy enforcement point, deny-by-default; contract tests per data type |
| R7 | Cache invalidation gaps (consent revocation, card freeze state) serve stale/unauthorised data | Compliance + correctness failures | Short TTLs on consent-gated and stateful data; event-driven invalidation where vendor supports it |
| R8 | 11 consumer teams' migration capacity is outside this project's control | Schedule slip | Migration is a programme, not a project — needs sequencing, a self-serve migration kit, and exec sponsorship for prioritisation |

---

## 7. Open Questions (need answers before design)

**Vendor & timeline**
1. Is the replacement vendor API available now for evaluation? Does it cover all five capabilities at functional parity?
2. What constitutes acceptable "active migration progress" evidence for the month-12 extension clause — is it contractually defined?
3. Does the vendor API support eventing/webhooks (relevant to cache invalidation)?

**Consumers**
4. Do any of the 11 integrations use capabilities beyond the five listed? (Traffic analysis required.)
5. What are peak/aggregate volumes, latency expectations, and availability requirements per consumer?
6. Are any integrations batch/file-based rather than API-based?

**Compliance & data**
7. Who is the PCI assessor/QSA, and can they review the cache design early?
8. Is spend categorisation vendor-supplied or do we compute it? (Affects data processing and consent classification.)
9. For CDR-equivalent consent: what's the consent data store of record, and what's the required revocation propagation SLA?
10. Does "dispute initiation" include status tracking/updates, or strictly create-only?

**Security**
11. Who owns least-privilege definition sign-off — security team, or per-domain?
12. What does the vendor's new API offer for credential scoping — can we get per-operation credentials, or must we enforce scoping within our layer?
13. What auth standard for consumers — OAuth2/OIDC with scoped tokens? Existing API gateway/IdP to reuse?

---

## 8. Least-Privilege Starting Model (proposal to refine)

Define scopes per operation, mapped to consumer needs:

| Scope | Operations | Likely consumers |
|---|---|---|
| `cards:summary:read` | Account summary | All |
| `cards:transactions:read` | 90-day history | All (partners: consent-gated) |
| `cards:categories:read` | Spend categories | App, banking, partners (consent-gated) |
| `cards:controls:write` | Freeze/unfreeze, limits | App, banking, contact centre — **not partners** (confirm) |
| `cards:disputes:write` | Dispute initiation | App, banking, contact centre — **not partners** (confirm) |

Principles: deny by default; partners get read scopes only, intersected with active consent; contact centre operations additionally bound to an authenticated agent identity (audit trail); upstream credentials to card core also decomposed per operation if the vendor API permits.

---

## 9. Indicative Phasing (against the 18-month clock)

| Phase | Months | Outcome |
|---|---|---|
| **Discovery & spikes** | 0–2 | Integration inventory, vendor API gap analysis, PCI assessor engagement, consent model design, answers to §7 |
| **Foundation** | 2–6 | API contract v1, auth/scope model, cache design signed off by PCI, consent enforcement point, read-only endpoints live |
| **Write path + first migrations** | 6–10 | Card controls & disputes live; first 2–3 internal consumers migrated (strangler pattern) |
| **Migration at scale** | 10–12 | Majority of internal consumers migrated; **month-12 extension evidence package assembled regardless of confidence** |
| **Partners + tail** | 12–16 | Partner migration with consent enforcement; remaining consumers |
| **Decommission** | 16–18 | Legacy credentials revoked, shared admin account retired, vendor API dependency removed |

**Critical-path note:** Treat the month-12 checkpoint as the real deadline for demonstrable progress — it buys the 6-month buffer that de-risks everything after it.

---

## 10. Recommended Immediate Next Steps

1. **Integration inventory** across all 11 consumers (capabilities used, volumes, auth, team capacity) — 4 weeks.
2. **Vendor API gap-analysis spike** — confirm functional parity for all five capabilities, especially disputes and card controls.
3. **Engage PCI assessor** on the proposed caching architecture before any build.
4. **Confirm extension-clause evidence requirements