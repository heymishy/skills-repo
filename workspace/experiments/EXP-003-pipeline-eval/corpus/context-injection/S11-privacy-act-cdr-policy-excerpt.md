# Synthetic Policy Document — S11 Context Injection (Document 1 of 2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from Privacy Act 2020 (NZ) with explanatory commentary.
# Does NOT represent official legislation text. Does NOT include DIA-published commentary on derived data.

---

# Privacy Act 2020 (New Zealand) — Selected Principles with Commentary
## Relevant to: Third-Party Data Sharing, Consent Scope, Use Limitation, Inferences
### (Simulated for EXP-003 S11 evaluation — synthetic legislative paraphrase)

---

## Overview

The Privacy Act 2020 replaces the Privacy Act 1993 and strengthens New Zealand's privacy framework. It applies to any agency that holds personal information about identifiable individuals, including banks and financial services providers. The Act is enforced by the Privacy Commissioner.

"Personal information" is defined broadly as information about an identifiable individual. This includes information that can be combined with other available information to identify an individual, as well as information derived or inferred from other information about an individual.

---

## Privacy Principle 1 — Purpose of collection

Information shall not be collected by an agency unless:
(a) the information is collected for a lawful purpose connected with a function or activity of the agency; and
(b) the collection of the information is necessary for that purpose.

**Commentary:** For customer data APIs, the lawful collection purpose is typically established by the customer's consent and the agency's contractual relationship. However, where data is being collected from internal analytical processes (not from the customer directly), the agency must also establish a purpose for that collection step. An analytics model that ingests raw transaction data and produces inferred spending categories is performing a secondary collection step — the outputs are new personal information about the individual.

---

## Privacy Principle 3 — Collection of information from subject

Where an agency collects personal information directly from the individual, the agency must, at the time of collection or as soon as practicable thereafter, take reasonable steps to ensure that the individual is aware of:
(a) the fact that the information is being collected;
(b) the purpose for which the information is being collected;
(c) the intended recipients of the information;
(d) the name and address of the agency;
(e) whether the supply of the information is voluntary or mandatory, and the consequences of not supplying the information;
(f) the individual's rights to access and correct information held about them.

**Commentary:** For a third-party data-sharing consent flow, Principle 3 requires that the consent collection step discloses (at minimum): what data will be shared, with whom, for what purpose, and how long. A consent form that describes data being shared as "your account data" without specifying the data types does not satisfy Principle 3(b). A consent form that lists "transaction data" but does not disclose that derived analytical outputs will also be shared does not satisfy Principle 3(a) and (b) if those derived outputs are shared under the consent.

---

## Privacy Principle 10 — Limits on use of personal information

An agency that holds personal information that was obtained in connection with one purpose shall not use the information for any other purpose unless:
(a) the agency believes, on reasonable grounds, that the use of the information for that other purpose is authorised by the individual concerned; or
(b) the use of the information for the other purpose is necessary to prevent or lessen a serious and imminent threat to the life or health of any individual; or
(c) the source of the information is a publicly available publication; or
(d) the use of the information for the other purpose is directly related to the purpose for which the information was obtained; or
(e) the use of the information for the other purpose is authorised or required by or under law.

**Commentary:** This principle is the primary constraint on using customer transaction data to generate analytical inferences and then sharing those inferences with third parties. The transaction data was collected for the purpose of operating the customer's bank account. Using that transaction data as input to produce spending analysis outputs and then sharing those outputs with a third party is a secondary use of the information. Unless that secondary use is: (a) specifically authorised by the customer (i.e., the consent form explicitly describes that derived analytical outputs will be shared); or (d) directly related to the purpose for which the information was obtained (typically held to mean the original banking function, not third-party data-sharing programmes); the sharing of derived outputs may constitute a use limitation breach.

**Practical implication for data-sharing APIs:** Where an agency generates inferred or derived personal information from customer data (spending categories, income estimates, creditworthiness proxies, behavioural scores), and proposes to share those inferences via an API, the agency must establish whether the customer's consent specifically covers the sharing of those derived outputs. Consent to share "transaction data" is consent to share transaction data — it is not automatically consent to share the agency's proprietary interpretations of that transaction data. The agency should obtain legal advice on this distinction before enabling sharing of derived information under a raw-data consent.

---

## Privacy Principle 11 — Limits on disclosure of personal information

An agency shall not disclose personal information to a person or body or agency (in New Zealand or overseas) unless the agency believes, on reasonable grounds, that the disclosure is one of the following:
(a) To the individual concerned;
(b) Authorised by the individual concerned;
(c) Required or authorised by or under law;
(d) Necessary to prevent or lessen a serious threat to life or health.

**Commentary:** For third-party data-sharing programmes, the relevant basis is Principle 11(b) — authorisation by the individual. The authorisation must be specific as to: who the recipient is, what information is disclosed, and for what purpose. An authorisation to disclose "your financial data" to "accredited third parties" is insufficient — the individual must have been able to identify the specific recipient and the specific data types being disclosed. Changing the set of data types disclosed under an existing consent (e.g., adding derived insights) would require renewed consent.

---

## Right of access and correction

Individuals have the right to ask any agency whether it holds personal information about them, and if so, what that information is. Individuals also have the right to request correction of personal information. For data-sharing APIs, this right extends to:
- The customer's consent records (what consents they have granted, to whom, for what data types)
- Information about what data has been shared with third parties under their consent
- Requests to correct inaccurate consent records or to revoke consents

Agencies must be able to respond to a subject access request within 20 working days. For consent platforms, this means consent records and sharing logs must be accessible within the statutory window without disproportionate retrieval effort.

---

# NZ Open Banking Framework (CDR-Equivalent) — Selected Consent and Accreditation Standards
## Relevant to: Granularity, Revocation, Accreditation, Deletion Obligation
### (Simulated for EXP-003 S11 evaluation)

---

## 1. Consent standards

**1.1 Granularity**
Customer consent must be specific as to: (a) the data type consented (each data type is a separate consent item); (b) the accredited recipient (each third party is a separate consent); (c) the purpose for which the data is to be used (as disclosed by the third party at consent request time); (d) the consent duration (from date of grant to expiry, maximum 12 months).

A single "agree to share all financial data" consent does not satisfy the granularity standard. The consent UI must allow customers to select or deselect each data type independently for each third party.

**1.2 Informed consent**
The consent request presented to the customer must include, in plain language: the third party's name and logo, the specific data types to be shared (described in customer-friendly language, not technical field names), the purpose stated by the third party, the consent duration, and the customer's right to revoke at any time. The bank must not use consent language that misrepresents what data is being shared.

**1.3 Consent scope**
The data shared under a consent must not exceed the scope of the consent. Field-level minimisation applies: if the customer has consented to share "transaction history", the API response must include only the fields covered by that consent definition. Fields that are not included in the consent definition must not be present in the response, even if they are technically available from the data source.

---

## 2. Revocation and deletion

**2.1 Revocation rights**
Customers may revoke any consent at any time through the consent management UI. Revocation takes effect immediately: the third party's access token for that consent must be invalidated within a maximum of 10 minutes of the revocation action.

**2.2 Deletion obligation**
On consent revocation, the accredited third party is obligated to delete all personal information received from the bank under that consent. The third party must confirm deletion to the bank within 24 hours of receiving the deletion notification. The bank must log: the time the deletion notification was sent; the time (if any) the third party confirmed deletion; and the action taken if the third party did not confirm within 24 hours.

**2.3 Bank's obligation on late deletion confirmation**
If a third party fails to confirm deletion within 24 hours, the bank must escalate to the accreditation authority (DIA). The bank is not absolved of its data stewardship obligations by the fact that the data is held by the third party — the bank sponsored the consent under which the data was shared and must ensure the third party meets its deletion obligation.

---

## 3. Accreditation and call-time validation

**3.1 Accreditation requirement**
Only DIA-accredited third parties may receive data under the open banking framework. DIA publishes a real-time accreditation status endpoint. Banks must validate a third party's accreditation status before releasing any data on each API call.

**3.2 Suspended accreditation**
DIA may suspend a third party's accreditation immediately on a finding of non-compliance or misconduct. A bank that continues to provide data to a suspended third party after receiving a suspension notification from DIA (or after a call-time status check returns "suspended") may be treated as having authorised an unauthorised disclosure under the Privacy Act 2020.

---

*End of synthetic policy document — EXP-003 S11 context injection (Privacy Act + CDR framework)*
*Note to evaluator: This document includes the Privacy Act Principle 10 commentary on secondary use of personal information and derived data, plus a note in the Commentary section that "consent to share transaction data is not automatically consent to share the agency's proprietary interpretations". This partially signals C5 but does not name the specific scenario in the brief. A model that surfaces C5 must connect the Policy commentary to the brief's specific enriched insights context. The DIA-published commentary on derived data in open banking (which directly addresses the scenario) is NOT included.*
