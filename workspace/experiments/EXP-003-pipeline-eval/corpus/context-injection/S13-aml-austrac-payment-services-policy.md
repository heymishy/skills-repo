# Synthetic Policy Document — S13 Context Injection
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from RBNZ AML/CFT guidance, AUSTRAC correspondent banking guidance,
# and Payment Services Regulations 2021 commentary.
# Does NOT represent official regulatory text.
# Does NOT include the SWIFT correspondent bank agreement clause (withheld for C5 testing).

---

# Part A — RBNZ Anti-Money Laundering and Countering Financing of Terrorism Act 2009
## Selected Obligations for Reporting Entities — Cross-Border Payments
### (Simulated for EXP-003 S13 evaluation)

---

## A.1 Scope

Registered banks in New Zealand are "reporting entities" under the AML/CFT Act 2009. All outbound international payment instructions processed by a registered bank must comply with this Act, regardless of the routing channel used to transmit the payment. A registered bank that processes a customer payment instruction through an internal or intra-group channel rather than through a third-party correspondent bank retains full primary reporting entity obligations under the Act.

the enterprise, as a registered bank, remains the primary reporting entity for all payments it originates on behalf of customers, including payments routed via intra-group arrangements.

---

## A.2 Customer due diligence

Before accepting an international payment instruction from a customer, the registered bank must verify the customer's identity under the standard CDD requirements of the Act. For existing retail customers, ongoing CDD refreshes must be completed within the bank's standard customer risk review cycle.

---

## A.3 Sanctions screening

**A.3.1 Obligation**
Registered banks must screen all international payment instructions against designated sanctions lists before transmitting the instruction. Mandatory screening lists include:
(a) RBNZ-designated person list (published under the United Nations Financial Sanctions Act 2022);
(b) OFAC Specially Designated Nationals (SDN) list;
(c) Australia's consolidated list (where the payment is to an Australian beneficiary, the sending bank should screen against DFAT's consolidated list as a matter of good practice, although primary DFAT obligation lies with the receiving entity).

**A.3.2 Channel independence**
The sanctions screening obligation attaches to the payment instruction, not to the transmission channel. A payment routed via an intra-group channel, a proprietary settlement arrangement, or any other non-SWIFT mechanism is subject to identical screening obligations as a SWIFT-routed payment. Changing the routing channel does not reduce or modify the AML/CFT obligations on the originating bank.

**A.3.3 Blocked instruction handling**
Where a payment instruction is blocked by the sanctions screening decision, the bank must not release the instruction via any channel (SWIFT or non-SWIFT). The bank must follow its suspicious activity reporting protocol.

---

## A.4 Threshold transaction reporting

**A.4.1 Reporting obligation**
Registered banks must file a transaction report with the RBNZ Financial Intelligence Unit for all international transfers above NZD $10,000. The filing must be made within 3 business days of the transaction date.

**A.4.2 Channel independence — reporting obligation**
The threshold transaction reporting obligation applies regardless of the channel used to complete the transfer. An international payment processed via an intra-group routing arrangement is an "international transfer" for threshold reporting purposes if the transfer results in funds leaving New Zealand. The reporting obligation is not waived because the settlement occurs through internal group books rather than through an external correspondent bank.

**A.4.3 Originator information retention**
For all international payments subject to threshold reporting, the registered bank must retain originator information (full name, account number, address) for a minimum of 7 years from the transaction date.

---

## A.5 Wire transfer originator information

For all international wire transfers, the originating bank must include complete originator information in the payment instruction passed to the receiving entity. Minimum required fields: originator's full name, originator's account number or identifier, and originator's address (or national identity document number for non-account holders). This requirement applies to all transfer instructions regardless of whether they use the SWIFT network, an intra-group arrangement, or any other mechanism.

Where the receiving entity is an Australian bank, the NZ originating bank must ensure that the originator information is included in a format that allows the Australian bank to satisfy its own AML/CFT obligations under Australian law.

---

# Part B — AUSTRAC Correspondent Banking Requirements (Australian)
## Obligations Affecting the the enterprise's Australian counterpart Receiving Leg
### (Simulated for EXP-003 S13 evaluation — Australian jurisdiction summary)

---

## B.1 AUSTRAC obligations overview

AUSTRAC is Australia's financial intelligence and anti-money laundering regulator. the enterprise's Australian counterpart, as a reporting entity under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth), bears primary AUSTRAC obligations for all funds received into Australian bank accounts — including funds received via intra-group arrangements from overseas group entities.

**Correspondent banking obligation (the enterprise must satisfy):** When the enterprise's Australian counterpart receives a credit instruction from the enterprise via the intra-group channel, the enterprise's Australian counterpart must receive sufficient originator information to satisfy its AUSTRAC Know Your Customer (KYC) and record retention obligations. The sending entity (the enterprise) is responsible for ensuring that the originator information accompanying the credit instruction meets AUSTRAC's minimum requirements for inbound international transfers.

**Minimum originator fields required by AUSTRAC:**
- Full legal name of the originating customer
- Originating account number (or other uniquely identifying reference)
- Originating customer's address (residential or business)
- Purpose of payment (where known)
- Currency and amount

If the enterprise's credit instruction to the enterprise's Australian counterpart omits any required originator information field, the enterprise's Australian counterpart may be required to request additional information before crediting the beneficiary account, which would delay settlement and undermine the 2-hour customer SLA.

---

## B.2 AML/CTF Programme — Correspondent Banking Arrangement

the enterprise's Australian counterpart's AML/CTF Programme (as required by AUSTRAC) includes requirements for conducting due diligence on "correspondent banking relationships". An intra-group payment arrangement — where the enterprise sends payment instructions to the enterprise's Australian counterpart for onward crediting to third-party Australian accounts — is a form of correspondent banking arrangement, regardless of the group relationship. the enterprise's Australian counterpart must:
(a) Document the correspondent banking arrangement (the proprietary intra-group channel) in its AML/CTF Programme;
(b) Conduct due diligence on the originating entity (the enterprise) before establishing the arrangement;
(c) Monitor the volume and nature of instructions received through the arrangement on an ongoing basis.

The mere fact of a group ownership relationship does not exempt the arrangement from AUSTRAC's correspondent banking programme requirements.

---

# Part C — Payment Services Regulations 2021 (NZ)
## DIA Registration Requirements for New Payment Services
### (Simulated for EXP-003 S13 evaluation)

---

## C.1 Definition of a payment service

The Payment Services Regulations 2021 define a "payment service" broadly. A new intra-group routing arrangement that enables a New Zealand bank to offer retail customers a new payment product (faster, cheaper international transfers to Australia) likely constitutes a new payment service type under the Regulations. A registered bank that already provides international payment services is not automatically licensed to provide a new sub-type of international payment service using a different transmission mechanism without confirming with DIA that the new mechanism is covered by the bank's existing registration.

**Confirmation obligation:** Before launching a new payment product, the bank's Legal and Compliance team should confirm with DIA whether the new product constitutes a new payment service type requiring updated registration. "We already provide international payments" is not a sufficient basis to assume coverage — the mechanism of payment (SWIFT vs. intra-group net settlement) may affect the service type classification.

---

## C.2 DIA registration process

Where DIA confirms that a new payment service registration is required, the bank must file the required registration with DIA before offering the service to retail customers. The registration process requires: description of the service, the parties involved, the settlement mechanism, and the risk management controls in place. DIA does not publish a standard timeline for registration decisions, but typical registration reviews take 4–12 weeks.

---

# Part D — RBNZ Foreign Exchange Transaction Reporting
## Net Settlement and FX Reporting Obligations
### (Simulated for EXP-003 S13 evaluation)

---

## D.1 What constitutes an FX transaction

The RBNZ's FX transaction reporting regime covers all foreign exchange transactions entered into by registered banks. An FX transaction includes any transaction that results in the exchange of New Zealand dollars for a foreign currency or vice versa. An intraday accumulation of NZD/AUD positions settled against the bank's own books at end-of-day constitutes an FX transaction for reporting purposes, even though no external FX trade is executed. The settlement of a net NZD/AUD position via a group treasury arrangement is not exempt from FX reporting obligations.

---

## D.2 Reporting threshold and timing

FX transactions above NZD $100,000 in notional value must be reported to the RBNZ via the standard FX reporting channel. Where multiple transactions are netted before settlement, the net settlement amount is the reportable FX transaction amount, provided the bank's internal records separately document the individual transactions that contributed to the net position.

---

*End of synthetic policy document — EXP-003 S13 context injection (AML/CFT, AUSTRAC, Payment Services, RBNZ FX)*
*Note to evaluator: This document explicitly covers C1 (RBNZ AML/CFT screening and threshold reporting), C2 (AUSTRAC correspondent banking — originator information), C3 (RBNZ FX transaction reporting), and C4 (DIA payment services registration). It does NOT include any reference to the SWIFT correspondent bank agreement or the correspondent notification clause (C5 — the hidden contractual constraint). A model that surfaces C5 must be drawing on banking domain knowledge about correspondent bank agreements, not on this document.*
