# Corpus Case S4 — Experience API Layer (Card Services)

## Case metadata

```json
{
  "case_id": "S4",
  "label": "PCI DSS experience API — card data abstraction layer",
  "difficulty": "high",
  "domain": "API / PCI DSS + open banking",
  "regulated_constraint_count": 3,
  "hidden_constraint": "Redis cache PCI DSS at-rest encryption not confirmed",
  "source": "workspace/handoffs/pipeline-corpus-S2-S7.md"
}
```

## Operator input

> /discovery — Our card services platform currently exposes data to downstream
> consumers (mobile app, internet banking, contact centre tooling) through point-to-point
> integrations. Each consumer team has built its own integration directly against the
> card core system. We have 11 active integrations, each with slightly different data
> models and authentication patterns.
>
> The card core system vendor is deprecating the legacy API we use in 18 months.
> Rather than have 11 teams each migrate their integration independently, we want to
> build an Experience API layer that sits in front of the card core, abstracts the
> vendor API, and exposes a stable, versioned API that all consumers use.
>
> The Experience API will expose: card account summary, transaction history (90 days),
> spend categories, card controls (freeze/unfreeze, limit changes), and dispute initiation.
>
> Card transaction data is PCI DSS in scope. The Experience API will handle, transform,
> and cache card transaction data. Any caching must comply with PCI DSS data retention
> limits — raw PAN data cannot be cached; truncated PAN (last 4 digits) is acceptable.
>
> We also need to consider that some of our consumer teams are external partners
> (two fintech companies operating under our open banking programme). Their access
> to card data is governed by CDR-equivalent data sharing consent — the customer
> must have granted consent for each data type before the partner can access it.
>
> The 18-month deprecation timeline is fixed by the vendor. We have a contractual
> right to an extension of up to 6 months if we can demonstrate active migration
> progress by month 12.
>
> Our current card core integration uses a shared service account with admin-level
> access. The Experience API should implement least-privilege access — we have not
> yet defined what least-privilege looks like for each API operation.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a forced migration under a vendor deprecation deadline with PCI DSS compliance complexity and open banking consent obligations; NOT "build a better API layer"
- **Personas** — 11 internal consumer teams (who need a stable migration target), 2 fintech partners (who need consent-governed access), card platform team (owns the migration), QSA (must certify before go-live), PCI DSS compliance officer
- **MVP scope** — bounded to: Experience API core operations (account summary, transaction history, card controls), PCI DSS compliant data handling, consent validation for external partners, least-privilege access model; explicitly defer: QSA assessment window planning, Redis caching architecture pending security review
- **Constraints** — C1 (PCI DSS — new CDE component requires QSA assessment), C2 (CDR consent — required before partner access to card data), C3 (18-month vendor deadline), C4 (PCI DSS — raw PAN caching prohibited)
- **Assumptions** — must flag: Redis cache PCI DSS at-rest encryption unconfirmed; consent management extensibility to card data unconfirmed; least-privilege roles undefined pending 11-team workshop; QSA capacity windows constrained to months 8 and 14
- **Success indicators** — all 11 integrations migrated before vendor deprecation; QSA assessment passed; zero PAN data in cache; partner consent validation end-to-end tested

## Known failure modes for this case

- **PCI DSS scope conflation**: model captures "no raw PAN" (C4) but misses the QSA assessment process gate (C1) as a separate constraint
- **Redis encryption gap missed**: model treats Redis caching as unproblematic without flagging at-rest encryption confirmation requirement
- **Consent extensibility assumed**: model assumes existing consent management works for card data without noting the unconfirmed extensibility
- **Least-privilege deferred without note**: model includes least-privilege as a requirement without flagging the undefined-roles dependency
