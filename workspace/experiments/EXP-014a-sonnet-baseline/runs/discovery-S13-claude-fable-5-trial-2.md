# Discovery Pipeline: Trans-Tasman Fast Payment Channel (NZ → AU)

---

## 1. Problem & Opportunity Framing

**Stated problem:** Customers with AU connections are routing payments through Wise and remittance providers because the SWIFT channel is slow (1–2 days) and expensive ($18–25). Estimated revenue leakage: NZD $4.2M/year.

**Discovery flags on the framing itself:**

- **Validate the $4.2M.** Is this measured (observed outbound flows to Wise/remitters from customer accounts) or estimated? If measured, we can also derive transaction size distribution, frequency, and customer segments — all critical inputs to pricing and the $10K cap decision.
- **Clarify the target segment.** The brief says "enterprise retail customers." Retail vs. SME/business customers carry materially different conduct obligations, fraud profiles, and AML risk ratings. Lock this down before solution design.
- **Validate the competitive hypothesis.** Wise settles many AUD payments in minutes and charges ~0.4–0.6% with mid-market FX. A $5 flat fee + 2-hour settlement is only competitive if our **FX margin** is also competitive. The fee is not the whole price — **where is FX conversion happening, at what spread, and is the spread part of the recovered revenue?** This is currently unstated and may be the real unit economics of the feature.

---

## 2. Proposed Mechanism (Restated)

Customer instruction processed in NZ → settled across group treasury books → AU counterpart credits recipient → end-of-day net settlement between entities. Sub-$10K only; SWIFT for larger amounts; NZ→AU one-way for phase 1.

This is functionally an **intra-group correspondent/book-transfer model** — the same mechanism Wise uses (local-in, local-out, no cross-border message per transaction). That's why it's fast and cheap. It's also why the regulatory analysis is different from the SWIFT channel, not an extension of it.

---

## 3. Assumptions Register (Risk-Rated)

| # | Assumption in the brief | Risk | Why it needs challenge |
|---|---|---|---|
| A1 | "Existing AML/CFT process covers the requirements" | **Critical** | See §4. The existing controls are built around SWIFT message formats and a single-jurisdiction obligation set. This channel changes both. |
| A2 | "Standard notifications process" suffices for regulators | **Critical** | Routing customer payments across group treasury books with a related party likely engages RBNZ **connected exposures (BS8)** limits and potentially **outsourcing (BS11)** and standalone-capability requirements. These can require approval or condition-of-registration analysis — not notification. AU-side, AUSTRAC and APRA exposure of the counterpart must be assessed by the AU entity, not assumed. |
| A3 | 6-month build | High | Plausible for the technical build; almost certainly not for dual-jurisdiction regulatory engagement + new screening integration + pilot. Treat 6 months as the engineering estimate only. |
| A4 | $10K cap with SWIFT above | High | Creates an obvious **structuring incentive** (customers splitting $25K into 3 payments to save ~$60 and gain speed). Needs velocity/aggregation monitoring by design, and the cap itself needs AML sign-off. |
| A5 | "2-hour settlement" as customer promise | Medium | Sanctions/fraud hits will hold a percentage of payments. The promise needs to be framed as "typically within 2 hours" with designed exception paths, or it becomes a conduct/fair-dealing issue. |
| A6 | One-way flow is simpler | Medium | One-directional flow means the AU entity accumulates a persistent net position against NZ. Confirm treasury can fund/settle a structurally one-way book daily, and that this fits within related-party exposure limits **intraday**, not just at EOD. |
| A7 | $4.2M leakage is recoverable | Medium | Some customers left for FX rates, app experience, or multi-currency features — not just fee/speed. Needs customer research, not inference. |

---

## 4. Regulatory & Compliance Deep-Dive (the core discovery risk)

The statement "compliance is comfortable that the existing AML/CFT process covers the requirements" should be treated as a **hypothesis to test**, because the channel changes three things:

**4.1 Message format and the travel rule.** SWIFT messages natively carry ordering/beneficiary customer information (wire transfer information requirements under the AML/CFT Act). A proprietary routing channel must **replicate this data carriage by design** — originator name, account, address/ID info travelling with every instruction, available to the AU entity. This is a build requirement, not a policy statement.

**4.2 Prescribed Transaction Reporting.** International wire transfers of **NZD $1,000 or more** are reportable to the NZ FIU — not just large transactions. Confirm the new channel's trans