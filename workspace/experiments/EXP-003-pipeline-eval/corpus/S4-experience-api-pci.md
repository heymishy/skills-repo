# S4 — Experience API Layer — Card Services

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for a PCI DSS–regulated API abstraction layer with a hard vendor deadline and a hidden Redis-at-rest encryption gap.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our card services platform currently exposes data to downstream consumers (mobile app, internet banking, contact centre tooling) through point-to-point integrations. Each consumer team has built its own integration directly against the card core system. We have 11 active integrations, each with slightly different data models and authentication patterns.

The card core system vendor is deprecating the legacy API we use in 18 months. Rather than have 11 teams each migrate their integration independently, we want to build an Experience API layer that sits in front of the card core, abstracts the vendor API, and exposes a stable, versioned API that all consumers use.

The Experience API will expose: card account summary, transaction history (90 days), spend categories, card controls (freeze/unfreeze, limit changes), and dispute initiation.

Card transaction data is PCI DSS in scope. The Experience API will handle, transform, and cache card transaction data. Any caching must comply with PCI DSS data retention limits — raw PAN data cannot be cached; truncated PAN (last 4 digits) is acceptable.

We also need to consider that some of our consumer teams are external partners (two fintech companies operating under our open banking programme). Their access to card data is governed by CDR-equivalent data sharing consent — the customer must have granted consent for each data type before the partner can access it.

The 18-month deprecation timeline is fixed by the vendor. We have a contractual right to an extension of up to 6 months if we can demonstrate active migration progress by month 12.

Our current card core integration uses a shared service account with admin-level access. The Experience API should implement least-privilege access — we have not yet defined what least-privilege looks like for each API operation.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **PCI DSS scope:** The Experience API will be a new CDE component. It requires QSA assessment before go-live. Our QSA has capacity in months 8 and 14 of the project — we need to plan around one of these windows.
>
> **Open banking consent:** We use a consent management service built for our mortgage open banking programme. It may be extensible to card data — the consent manager team has not confirmed. If not extensible, a new consent check must be built into the Experience API gateway layer.
>
> **Least-privilege access:** The card core vendor supports role-based API keys with operation-level scoping. Defining the roles requires a workshop with each of the 11 consumer teams to understand their actual data needs vs what they currently access.
>
> **Caching:** A Redis cache is proposed for transaction history (reduces card core load). The security team has not reviewed whether Redis-at-rest encryption meets PCI DSS requirements in our infrastructure configuration.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | PCI DSS — Experience API is a new CDE component; QSA assessment required before go-live; QSA availability constrained to months 8 and 14 | Regulatory (PCI DSS) | No — explicit in follow-up |
| C2 | CDR-equivalent consent required before external partner access to card data — consent management extensibility unconfirmed | Regulatory/legal (open banking) | No — explicit |
| C3 | Vendor deprecation — 18-month hard deadline; 6-month extension available only if month-12 migration milestone demonstrated | Technical/contractual | No — explicit |
| C4 | PCI DSS raw PAN caching prohibited — truncated PAN (last 4 digits) only; raw PAN must never enter the cache | Regulatory (PCI DSS data) | No — explicit |
| C5 | [Hidden] Redis cache PCI DSS compliance — at-rest encryption has not been confirmed for the Redis configuration in the enterprise's infrastructure; if at-rest encryption is not enabled, caching card data in Redis is a PCI DSS violation that will fail QSA assessment | Hidden technical/regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (PCI DSS QSA), C2 (open banking consent), C4 (PCI DSS data prohibition)
**Regulated CPF threshold:** 0.80 (failure threshold for C1, C2, C4)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — vendor-forced API migration in a PCI DSS–regulated environment with an open banking consent overlay for external partners; not "build an API abstraction layer".
2. **Personas** — 11 internal consumer teams (depend on stable API contract), two external fintech partners (require consent-gated access), card customers (whose PAN data must never be exposed), the enterprise QSA / security team (own PCI DSS assessment gate), card core vendor (owns the deprecation deadline).
3. **MVP scope** — Experience API exposing all five data types (summary, history, spend categories, controls, dispute); consent gate for external partners; truncated PAN only in cache; QSA assessment planned for month 8.
4. **Constraints** — C1 through C4 all named. C5 surfaced as a risk or assumption: "Redis at-rest encryption must be confirmed before caching card data; if not confirmed, Redis caching is not a viable option under PCI DSS."
5. **Assumptions** — at minimum: Redis at-rest encryption is or can be enabled (confirm with security before design is committed), consent management service extensibility (confirm with consent team before partner access story is scoped), least-privilege role definitions (workshop required before API key stories can be written).

---

## CPF measurement notes for evaluator

- C1 and C4 are both PCI DSS but test different dimensions: C1 is a process gate (QSA timing), C4 is a data architecture constraint. A model that merges them or captures only one has partial propagation.
- C5 — count as propagated only if the model explicitly raises the Redis at-rest encryption question as a prerequisite confirmation item, not as a general note about "security". The specific risk is that caching PCI-in-scope data in Redis without confirmed encryption is a CDE violation.
- C2 has a dependency depth element — if the consent management service is not extensible, the external partner feature requires a separate consent implementation that is not currently scoped or budgeted. Count as above-average if the model carries this dependency as a project risk with a named resolution gate.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | API design standards, PCI DSS CDE classification rules, caching standards, open banking consent integration pattern | ~8 KB |
| Synthetic EA registry entry | Card Core System (vendor-managed), Consent Management Service (extensibility status unknown), Redis Cache (at-rest encryption status unknown), two external fintech partners (CDR-gated) | ~5 KB |
| **Estimated total** | | **~15 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
