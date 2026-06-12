# Discovery Report — Trans-Tasman Fast Payments (NZ→AU)

**Pipeline stage:** Discovery / Intake Analysis
**Status:** ⚠️ Proceed with discovery — **3 stated assumptions challenged**, regulatory scope likely understated
**Recommended next gate:** Regulatory & prudential feasibility spike before any build commitment

---

## 1. Intake Summary (restated for validation)

| Element | As stated |
|---|---|
| Problem | NZD $4.2M annual revenue leakage to Wise/remitters; SWIFT channel slow (1–2 days) and expensive ($18–25) |
| Mechanism | Off-SWIFT proprietary routing via group treasury books; AU counterpart credits recipient; end-of-day net settlement between entities |
| Customer promise | ≤2hr settlement, <$5 fee, payments ≤$10,000 |
| Scope | NZ→AU only, phase 1; pilot then rollout |
| Timeline | 6-month build |

**Immediate framing inconsistency to resolve:** the brief says **"enterprise retail customers"** but the loss narrative ("family or business connections in Australia") and the pricing/limit structure ($5 / $10k cap) describe a **retail remittance product**. These have materially different conduct obligations, fraud profiles, and AML/CFT risk ratings. → **Open Question #1.**

---

## 2. Challenged Assumptions (flagged before risk register)

### 🚩 Assumption 1: "RBNZ AML/CFT threshold reporting" covers reporting obligations
Likely a factual error in the brief. Under the AML/CFT Act 2009, **prescribed transaction reports for international wire transfers (≥ NZD $1,000) go to the NZ Police Financial Intelligence Unit via goAML — not RBNZ**. RBNZ is your AML/CFT *supervisor*, not the report recipient. If the team's mental model of the reporting pipeline is wrong at intake, the compliance sign-off referenced in the brief needs re-verification. Critically: **routing off SWIFT does not change the legal character of the transaction — it remains an international wire transfer / cross-border value transfer**, regardless of internal settlement mechanics.

### 🚩 Assumption 2: "Existing AML/CFT process covers the requirements"
This is the highest-risk assumption in the brief. Specific gaps:

- **New product risk assessment is mandatory before launch.** The AML/CFT Act requires reporting entities to assess the ML/TF risk of new products, services, and delivery channels *prior to introduction*, and update the AML/CFT programme accordingly. "Extend the same screening logic" is not a substitute — this is a new delivery channel with a new risk profile (faster, cheaper, lower-friction = more attractive for illicit flows).
- **Travel rule / wire transfer information.** SWIFT messages carry structured originator/beneficiary fields that your existing screening tools consume. A proprietary channel must **replicate full FATF R.16 / s27 data carriage** end-to-end, including what the AU entity receives. This is a build requirement, not a config change.
- **AUSTRAC obligations on the AU side.** The Australian counterpart crediting recipients from a cross-border instruction will almost certainly trigger **IFTI reporting to AUSTRAC** and AU-side sanctions screening obligations. The brief is silent on the AU entity's compliance position — NZ compliance comfort does not cover this.
- **Screening within a 2-hour SLA.** Current screening operates inside a 1–2 day window. Real-time/near-real-time sanctions screening with a 2-hour customer promise requires: automated hit triage, an exceptions workflow that fits the SLA, and a defined customer experience for held payments (what does the customer see at hour 2 when a payment is in sanctions review?). This is a significant operational design probl