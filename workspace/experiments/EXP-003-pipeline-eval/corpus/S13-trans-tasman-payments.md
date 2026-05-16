# S13 — Trans-Tasman Payment Corridor: Correspondent Bank Agreement Constraint

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Multi-jurisdiction cross-border payment scenario testing CPF across two regulatory regimes (RBNZ AML/CFT for NZ leg; AUSTRAC for AU leg) plus a treasury settlement model that implicates RBNZ FX transaction reporting. Hidden constraint: the enterprise's SWIFT correspondent bank agreement with JPMorgan Chase contains a clause prohibiting routing transactions outside the agreed SWIFT channel without prior written notification. Using a proprietary intra-group channel without that notification constitutes a contractual breach with credit relationship risk. Also tests multi-jurisdiction awareness by scoring NZ, AU, and cross-border constraints separately.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — We want to build a trans-Tasman payment feature for the enterprise retail customers that allows them to send money to any Australian bank account quickly and cheaply. This is a competitive gap we feel keenly: most of our customers with family or business connections in Australia are using TransferWise (Wise) or third-party remittance services because our current SWIFT-based international payment takes 1–2 business days and costs $18–25 per transaction. We lose approximately NZD $4.2M in annual payment revenue to these alternative services.

The mechanism we want to use is a proprietary internal routing channel between the enterprise and the enterprise's Australian counterpart. We have a close relationship with our Australian counterpart — shared group infrastructure and a reciprocal payment routing agreement already in place for internal treasury flows. Using this channel, a NZ customer's payment instruction would be processed at the NZ end and settled via the the enterprise group treasury books, with the enterprise's Australian counterpart crediting the Australian recipient's account on the AU end. Net positions between the enterprise and the enterprise's Australian counterpart would be settled at end of day in the treasury books. The customer-facing experience would show settlement within 2 hours.

Target pricing is under $5 per transaction for payments up to $10,000. Above $10,000 payments would go through the standard SWIFT channel with existing pricing.

We are aware that international payments carry AML/CFT obligations. Our current SWIFT-based international payment flow already includes sanctions screening and RBNZ AML/CFT threshold reporting. We plan to extend the same AML/CFT screening logic to the new channel. Our compliance team is comfortable that the existing AML/CFT process covers the requirements.

We anticipate some regulatory notifications will be required before launch — we are used to this. Our regulatory team will manage the standard notifications process. We see this as a 6-month build, with a pilot to a small cohort of customers before full rollout.

The feature would initially be available for NZ-to-Australia payments only (not the reverse direction). We would expand to AU-to-NZ in a future phase if the pilot performs well.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **AUSTRAC obligations:** We have spoken to the enterprise's Australian counterpart about the routing arrangement but we have not specifically discussed AUSTRAC obligations. Our assumption is that the enterprise's Australian counterpart handles Australian regulatory compliance on their side and we handle ours. We have not confirmed what originator information the enterprise's Australian counterpart requires from us to satisfy their AUSTRAC correspondent banking obligations.
>
> **RBNZ FX transaction reporting:** Our treasury team manages FX reporting but they have not specifically reviewed the net settlement model for this channel. The current SWIFT payments generate individual FX transaction reports for each payment. The net settlement model generates a single end-of-day net position — our treasury team is not certain whether net positions are reported as individual FX transactions or as a single net settlement amount.
>
> **DIA registration:** We were not aware that a new payment service type might require DIA registration. Our regulatory team handles standard payment compliance notifications. They have not reviewed whether the proprietary channel constitutes a new service type under the Payment Services Regulations 2021.
>
> **Correspondent bank agreement:** the enterprise uses JPMorgan Chase as its SWIFT correspondent for USD and AUD international payments. We have a bilateral correspondent banking agreement. We have not reviewed the agreement in the context of this channel — our assumption was that the the enterprise's Australian counterpart relationship is a group arrangement separate from the SWIFT correspondent infrastructure.
>
> **Existing AML/CFT screening coverage:** The existing SWIFT AML/CFT flow screens the NZ originator and the payment instruction. For SWIFT payments, the correspondent bank is contractually responsible for the beneficiary-side AML/CFT check. For the proprietary channel, the AML/CFT responsibility chain is different — the enterprise and the enterprise's Australian counterpart will need a bilateral data-sharing agreement confirming the split of AML/CFT responsibilities.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | RBNZ AML/CFT Act 2009 (NZ leg) — outbound international payments must be screened against RBNZ and OFAC sanctions lists before transmission; threshold reporting obligations apply above NZD $10,000; the enterprise retains primary AML/CFT liability regardless of channel used | Regulatory (NZ law) | Partial — brief mentions AML/CFT screening but frames it as covered |
| C2 | AUSTRAC (AU leg) — receipt of funds from overseas into Australian accounts triggers Australian AML/CFT obligations; the enterprise is responsible for providing sufficient originator information (name, account, address) to the enterprise's Australian counterpart; "our compliance team is comfortable" covers only the NZ side | Regulatory (Australian law — AUSTRAC) | Partial — brief says compliance team is comfortable; AU side not assessed |
| C3 | RBNZ FX Transaction Reporting — intra-group net settlement of NZD/AUD positions is a foreign exchange transaction; RBNZ requires reporting of FX transactions above threshold; net settlement model must be reviewed against RBNZ FX reporting obligations before channel goes live | Regulatory (RBNZ FX rules) | Partial — brief describes net settlement model without naming FX reporting |
| C4 | Payment Services Regulations 2021 (NZ) — DIA registration — a new payment service type not covered under existing licence may require DIA registration before the service can be offered to retail customers; proprietary channel with intra-group net settlement may constitute a new payment service type | Regulatory (NZ law) | Partial — brief refers to "standard notifications" without naming DIA |
| C5 | [Hidden] the enterprise's SWIFT correspondent bank agreement with JPMorgan Chase contains a clause requiring prior written notification before routing NZD/AUD transactions outside the agreed SWIFT channel; using the proprietary channel without correspondent notification constitutes a contractual breach; correspondent relationship is a credit facility — breach exposes the enterprise to reputational and credit risk | Hidden contractual obligation (correspondent bank agreement) | **Yes — hidden** |

**Regulated constraints:** C1 (RBNZ AML/CFT), C2 (AUSTRAC)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

**Multi-jurisdiction scoring applies** — score NZ constraints (C1, C3, C4), AU constraints (C2), and cross-border constraints (C5) separately.

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — competitive gap in trans-Tasman retail payment speed and cost, bounded by dual-jurisdiction AML/CFT obligations, RBNZ FX reporting requirements, DIA registration requirements, and contractual terms of the SWIFT correspondent relationship; NOT "build a fast payment feature using the the enterprise's Australian counterpart channel".
2. **Personas** — the enterprise retail customers with trans-Tasman payment needs, the enterprise payments product team, RBNZ AML/CFT compliance team, AUSTRAC (AU regulator), the enterprise's Australian counterpart treasury team (settlement partner), DIA (NZ payment service registration authority), JPMorgan Chase correspondent banking relationship manager (must be notified before non-SWIFT routing goes live), the enterprise treasury team (own FX net settlement structure).
3. **MVP scope** — NZ-to-AU direction only, payments up to $10,000 via proprietary channel, RBNZ AML/CFT sanctions screening and threshold reporting, AUSTRAC originator information provision to the enterprise's Australian counterpart, RBNZ FX transaction reporting confirmation, DIA registration confirmed before launch, correspondent bank notification completed before channel activation. SWIFT channel retained for over-$10,000 payments and as fallback.
4. **Constraints** — C1 through C4 named explicitly. C5 surfaced: "proprietary channel routing bypasses SWIFT — the existing SWIFT correspondent bank agreement must be reviewed to confirm whether prior notification of channel change is required before the proprietary routing can be activated."
5. **Assumptions** — at minimum: C5 (confirm with the enterprise Treasury whether the SWIFT correspondent agreement permits non-SWIFT routing and what notification obligation exists), AUSTRAC originator information requirements confirmed with the enterprise's Australian counterpart before channel activation, DIA registration requirement assessed and either confirmed covered or registration initiated.
6. **Success indicators** — baseline (SWIFT only: $18–25 fee, 1–2 day settlement) + target (sub-$5 fee, under-2-hour settlement for eligible payments up to $10,000, dual-jurisdiction AML/CFT obligations confirmed, DIA registration completed, correspondent notified, zero correspondent bank compliance incidents in first 12 months post-launch).

---

## CPF measurement notes for evaluator

**Multi-jurisdiction scoring:** Score C1 (NZ), C2 (AU), C3 (NZ), C4 (NZ), C5 (cross-border contractual) as separate CPF dimensions.

- C1 (RBNZ AML/CFT — NZ leg) — quality differentiator: the model recognises that the enterprise retains primary AML/CFT liability regardless of channel, and that the SWIFT-based screening model must be validated as fit-for-purpose for a non-SWIFT channel before go-live. "We'll use the existing screening" does not count as full propagation.
- C2 (AUSTRAC — AU leg) is the hardest explicit constraint. A NZ-focused model may not surface AUSTRAC at all. Count as propagated only if the model explicitly names AUSTRAC as an Australian regulatory obligation that must be confirmed before channel activation, and identifies that the enterprise has an originator-information provision obligation to the enterprise's Australian counterpart. "the enterprise's Australian counterpart handles their side" does not count.
- C3 (RBNZ FX Transaction Reporting) — count as propagated only if the model names RBNZ FX reporting as a separate obligation from AML/CFT and identifies that the net settlement model (vs per-transaction SWIFT reporting) creates a reporting-frequency and aggregation question that must be confirmed with the treasury team.
- C4 (DIA registration) — count as propagated only if the model names the Payment Services Regulations 2021 DIA registration requirement explicitly, not just "standard regulatory notifications". "Our regulatory team will handle notifications" does not count.
- C5 (SWIFT correspondent bank agreement — JPMorgan Chase notification obligation) is the deepest constraint. Correspondent bank agreement terms are specialist banking domain knowledge. Count as propagated only if the model explicitly surfaces the need to review the SWIFT correspondent agreement before switching to a non-SWIFT channel and identifies that existing correspondent agreements commonly restrict non-SWIFT routing. Models that name JPMorgan Chase specifically demonstrate exceptional domain depth but this is not required for a C5 count — naming the correspondent agreement review requirement is sufficient.

---

## Context injection spec (Config C only)

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | Cross-Border Payment Architecture patterns, SWIFT Integration Standards (all international SWIFT payments must route via approved gateway; changes to routing must be reviewed against correspondent bank agreements), Sanctions Screening Architecture (all international channels must integrate with central sanctions screening), Multi-Jurisdiction Payment Compliance pattern | ~8 KB |
| Synthetic EA registry entry | Trans-Tasman Payment Routing Service — planned entry including: TTPS-ROUTE-001 (the enterprise Group Treasury Intra-Group API — proprietary channel); TTPS-SWIFT-001 (SWIFT gateway via JPMorgan Chase — existing); risk flags: TTPS-RISK-001 (BLOCKER: SWIFT correspondent bank notification obligation — JPMorgan Chase agreement requires prior written notification before routing NZD/AUD outside agreed SWIFT channel; notification not filed; breach risk); TTPS-RISK-002 (DIA payment service registration not confirmed); TTPS-RISK-003 (RBNZ FX transaction reporting not assessed); TTPS-RISK-004 (AUSTRAC originator information format not confirmed with the enterprise's Australian counterpart) | ~5 KB |
| Synthetic policy doc | (1) RBNZ AML/CFT Act 2009 — sanctions screening, channel-independent obligations, threshold reporting above NZD $10,000, originator information requirements; (2) AUSTRAC correspondent banking obligations — the enterprise must provide originator information to the enterprise's Australian counterpart; AUSTRAC AML/CTF Programme requires documenting the correspondent arrangement; (3) Payment Services Regulations 2021 (DIA) — registration requirement for new payment service types; (4) RBNZ FX Transaction Reporting — net settlement of NZD/AUD position = FX transaction, not exempt because settlement is internal. DELIBERATELY OMITS: SWIFT correspondent bank agreement clause and JPMorgan Chase notification obligation (C5 — withheld for model testing) | ~8 KB |
| **Estimated total** | | **~23 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
