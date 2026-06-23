# Corpus Case S13 — Trans-Tasman Payment Corridor (SWIFT Correspondent Bank Agreement Constraint)

## Case metadata

```json
{
  "case_id": "S13",
  "label": "Trans-Tasman retail payments — SWIFT correspondent bank agreement + dual-jurisdiction AML/CFT",
  "difficulty": "high",
  "domain": "RBNZ AML/CFT / AUSTRAC / DIA Payment Services / SWIFT correspondent banking",
  "regulated_constraint_count": 4,
  "hidden_constraint": "SWIFT correspondent bank agreement requires prior written notification before routing transactions outside the agreed SWIFT channel — not flagged in brief",
  "source": "workspace/handoffs/pipeline-corpus-S8-S13.md"
}
```

## Operator input

> /discovery — We want to build a trans-Tasman payment feature for the enterprise retail customers that allows them to send money to any Australian bank account quickly and cheaply. This is a competitive gap we feel keenly: most of our customers with family or business connections in Australia are using TransferWise (Wise) or third-party remittance services because our current SWIFT-based international payment takes 1–2 business days and costs $18–25 per transaction. We lose approximately NZD $4.2M in annual payment revenue to these alternative services.
>
> The mechanism we want to use is a proprietary internal routing channel between the enterprise and the enterprise's Australian counterpart. We have a close relationship with our Australian counterpart — shared group infrastructure and a reciprocal payment routing agreement already in place for internal treasury flows. Using this channel, a NZ customer's payment instruction would be processed at the NZ end and settled via the enterprise group treasury books, with the enterprise's Australian counterpart crediting the Australian recipient's account on the AU end. Net positions between the enterprise and the enterprise's Australian counterpart would be settled at end of day in the treasury books. The customer-facing experience would show settlement within 2 hours.
>
> Target pricing is under $5 per transaction for payments up to $10,000. Above $10,000 payments would go through the standard SWIFT channel with existing pricing.
>
> We are aware that international payments carry AML/CFT obligations. Our current SWIFT-based international payment flow already includes sanctions screening and RBNZ AML/CFT threshold reporting. We plan to extend the same AML/CFT screening logic to the new channel. Our compliance team is comfortable that the existing AML/CFT process covers the requirements.
>
> We anticipate some regulatory notifications will be required before launch — we are used to this. Our regulatory team will manage the standard notifications process. We see this as a 6-month build, with a pilot to a small cohort of customers before full rollout.
>
> The feature would initially be available for NZ-to-Australia payments only (not the reverse direction). We would expand to AU-to-NZ in a future phase if the pilot performs well.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a competitive gap in trans-Tasman retail payment speed and cost, bounded by dual-jurisdiction AML/CFT obligations (RBNZ + AUSTRAC), RBNZ FX transaction reporting requirements, DIA registration requirements, and the contractual terms of the SWIFT correspondent bank agreement; NOT "build a fast payment feature using the intra-group channel"; the core challenge is activating the proprietary routing channel in a manner that satisfies both NZ and Australian regulatory obligations and does not breach the correspondent bank agreement governing the bank's international payment infrastructure
- **Personas** — retail customers with trans-Tasman payment needs (speed and cost certainty), enterprise payments product team, RBNZ AML/CFT compliance team (NZ-leg obligations), AUSTRAC (Australian inbound-side obligations via enterprise's Australian counterpart), enterprise Australian counterpart treasury team (AU settlement partner), DIA (NZ payment service registration authority), JPMorgan Chase correspondent banking relationship manager (must be notified before non-SWIFT routing), enterprise treasury team (own FX net settlement structure)
- **MVP scope** — bounded to: NZ-to-AU direction only, payments up to $10,000, RBNZ AML/CFT sanctions screening and threshold reporting, AUSTRAC originator information provision confirmed with AU counterpart, RBNZ FX transaction reporting model confirmed, DIA registration confirmed before launch, correspondent bank notified before channel is activated; SWIFT channel retained for over-$10,000 payments and as fallback
- **Constraints** — C1 (RBNZ AML/CFT Act 2009 — NZ originator screening, threshold reporting; enterprise retains AML/CFT liability regardless of channel), C2 (AUSTRAC — inbound AU side obligations; enterprise must provide originator information to AU counterpart; "our compliance team is comfortable" covers NZ side only), C3 (RBNZ FX transaction reporting — intra-group net settlement is an FX transaction; not automatically exempt), C4 (Payment Services Regulations 2021 — DIA registration required if proprietary channel constitutes new payment service type); C5 (hidden: SWIFT correspondent bank agreement — JPMorgan Chase bilateral agreement requires prior written notification before routing transactions outside SWIFT; non-SWIFT routing without notification is contractual breach)
- **Assumptions** — must flag: C5 (confirm with enterprise Treasury whether SWIFT correspondent agreement permits non-SWIFT routing and what notification is required), AUSTRAC originator information requirements not confirmed with AU counterpart compliance team, DIA registration requirement not assessed against existing licence, NZ-side AML/CFT screening does not cover beneficiary-side AU verification
- **Success indicators** — sub-$5 fee and under-2-hour settlement for eligible payments up to $10,000, dual-jurisdiction AML/CFT obligations confirmed (both RBNZ and AUSTRAC), DIA registration completed or confirmed as covered, correspondent bank notified before channel activation, zero correspondent bank compliance incidents in first 12 months

## Known failure modes for this case

- **SWIFT correspondent gap missed**: model notes AML/CFT and DIA obligations but does not surface the correspondent bank agreement notification requirement — the primary hidden constraint
- **AML/CFT coverage assumed to extend**: model accepts "our compliance team is comfortable" as covering both NZ and Australian obligations, missing the AUSTRAC originator information responsibility on the AU side
- **FX reporting not flagged**: model treats intra-group net settlement as an internal treasury matter without identifying RBNZ FX transaction reporting obligations
- **DIA registration accepted as standard notification**: model treats DIA registration as a routine notification step rather than a go-live gate requiring confirmation before launch
- **Multi-jurisdiction boundary collapsed**: model treats the AML/CFT requirement as a single unified obligation rather than identifying the NZ (RBNZ/AML/CFT Act) and Australian (AUSTRAC) regimes as separate with different responsible parties
