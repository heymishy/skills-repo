# Synthetic Policy Document — S2 Context Injection (Document 2 of 2)
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from CCCFA responsible lending guidance and FMA algorithmic accountability expectations.
# Does NOT represent official legislative text. Does NOT constitute legal advice.

---

# Part A — Credit Contracts and Consumer Finance Act 2003 (CCCFA)
## Reasonable Inquiry Obligations — Automated Credit Decisioning
### (Simulated for EXP-003 S2 evaluation — synthetic regulatory paraphrase)

---

## Overview

The Credit Contracts and Consumer Finance Act 2003 (CCCFA) imposes obligations on creditors (including banks) to make reasonable inquiries before advancing credit to a borrower. These obligations apply regardless of whether the credit decision is made by a human analyst or by an automated system.

The Commerce Commission (now MBIE and FMA for responsible lending) has produced guidance on how automated systems can satisfy the reasonable inquiry standard. Key principles are summarised below.

---

## Section 9C — Responsible Lending Obligations

**Paraphrase (not verbatim legislation):**

A creditor must, before entering into a consumer credit contract:
- Make reasonable inquiries about the borrower's financial situation (income, expenses, existing financial obligations) and their financial objectives;
- Take reasonable steps to verify that information where verification is practicable;
- Make an assessment of whether the credit and the credit terms are suitable for the borrower.

The reasonable inquiry obligation is a process obligation — the creditor must demonstrate that adequate information was obtained and assessed, not merely that the system produced an outcome.

**Implication for automated decisioning:** An automated credit assessment system that processes transaction data and bureau data to produce a lending decision must be able to produce a documented methodology showing that the system's inputs and outputs satisfy the same information-gathering standard as a human inquiry. A system that produces a decision based on a subset of the relevant financial picture (e.g., bank transaction history but not declared fixed expenses) does not satisfy s.9C unless the methodology demonstrates that the missing information was either verifiable by proxy or that its absence was itself assessed.

---

## Responsible Lending Code — Automated Affordability Assessment

**From the Responsible Lending Code (synthetic paraphrase):**

*7.6 — Automated assessment systems*

Where a creditor uses an automated system to assess a loan application:

(a) The system must be designed to gather the information that a reasonable human inquiry would gather.

(b) The creditor must be able to demonstrate that the system's assessment methodology is adequate to meet the responsible lending standard.

(c) The creditor's legal and compliance team must review the methodology before the system is used for credit decisions.

(d) Where the system cannot gather required information (e.g., where a customer does not bank primarily with the lender and transaction history is incomplete), the system must escalate the application for human review rather than issue an automated decision.

(e) A creditor cannot satisfy s.9C solely by demonstrating that the system exists. The creditor must be able to demonstrate that the system's outputs are reliable and that the inputs assessed are sufficient for the credit decision being made.

**Note on audit trail:** The Responsible Lending Code requires that a record of the reasonable inquiry is kept. For automated systems, this means the system must log the inputs considered and the decision rationale in a manner that can be retrieved for audit, dispute resolution, or regulatory review.

---

## CCCFA Key Risk Points for Automated Lending

| Risk area | Obligation | Status trigger |
|-----------|-----------|----------------|
| Methodology sign-off | Legal and compliance must confirm that automated transaction assessment satisfies s.9C reasonable inquiry standard before system goes live | Required pre-go-live |
| Incomplete financial picture | System must identify and escalate applications where transaction history is insufficient or unreliable | Technical design requirement |
| Audit trail | System must retain logs of inputs considered and decision rationale per application, retrievable for 7 years | Technical design requirement |
| Bias and fairness | System must not make decisions on the basis of characteristics that are proxies for protected grounds (e.g., postcode as proxy for ethnicity) | See Part B below |

---

## Part B — FMA Algorithmic Accountability — Expectations for Algorithmic Decision-Making in Regulated Financial Services
### (Simulated for EXP-003 S2 evaluation — synthetic regulatory paraphrase)

---

## Overview

The Financial Markets Authority (FMA) has published guidance on algorithmic accountability for financial institutions using algorithmic or automated decision-making in regulated activities. The guidance applies to all uses of algorithmic models that produce customer-facing outputs affecting a customer's access to financial products or services.

The guidance is not a formal legislative instrument — it is the FMA's statement of expectations. Financial institutions that operate within the FMA's regulatory perimeter (which includes all registered banks and licensed financial advisers offering personal lending) are expected to meet these standards or be able to justify any deviation.

---

## FMA Algorithmic Accountability Principles

### Principle 1 — Governance

Financial institutions using algorithmic models in customer-facing decisions must have a model governance framework that covers:
- Model lifecycle (development → validation → deployment → ongoing monitoring → retirement)
- Decision authority for model changes (minor tuning vs. material change)
- Escalation path for model performance or fairness issues

**Expectation:** The governance framework must be documented and approved by a senior governance body (e.g., Credit Risk Committee or equivalent) before the model is deployed in a customer-facing capacity.

### Principle 2 — Independent Validation

Models used in credit decisions or other regulated financial decisions must be independently validated before deployment and at material change or retraining events.

**Independent validation** means validation conducted by a party that did not develop the model. This may be an internal model validation team that operates separately from the model development team, or an external validator. The validation must assess:
- Model methodology and appropriateness for the intended use case
- Model performance on a holdout dataset
- Model performance across demographic segments (fairness testing)
- Model documentation adequacy

**Expectation:** The validation report must be provided to the FMA on request and must be included in the model governance record.

### Principle 3 — Fairness and Demographic Disparity

Financial institutions must test algorithmic models for demographic fairness before deployment and at regular intervals thereafter. Where a model produces materially different outcomes for customers with the same risk characteristics but different demographic attributes, the institution must:

(a) Document the disparity finding;

(b) Investigate the source of the disparity (data bias, proxy variable, structural issue);

(c) Determine whether the disparity is explainable by legitimate risk-related factors or constitutes discriminatory treatment;

(d) Where the disparity is not fully explained by legitimate risk factors, take remediation action before or alongside deployment;

(e) Disclose the finding and remediation plan to the FMA in a timely manner.

**Expectation on disclosure:** The FMA expects proactive disclosure of known demographic disparity findings where the disparity may affect customer access to regulated financial products. A financial institution that identifies a disparity finding internally and does not disclose it to the FMA, while continuing to deploy the model in customer-facing decisioning, creates material regulatory risk for the institution.

**Note on materiality:** The FMA considers a demographic disparity of 5% or greater in approval rates at comparable risk levels to be presumptively material pending investigation. An institution must demonstrate that a disparity at this level is explained by legitimate risk-related factors; it cannot assume that a statistical difference is non-material without that analysis.

### Principle 4 — Model Documentation

Institutions must maintain adequate documentation for all models used in regulated decisions, including:
- Model purpose and scope
- Training data description (vintage, sources, selection criteria)
- Model methodology (algorithm type, key variables, variable derivation)
- Known limitations
- Validation status and validation history
- Performance monitoring methodology and monitoring history

**Expectation:** The FMA may request model documentation as part of a review or investigation. Institutions should ensure documentation is current and retrievable within 5 business days of a request.

---

## FMA Key Risk Points for Algorithmic Lending Models

| Risk area | FMA expectation | Trigger |
|-----------|-----------------|---------|
| Independent validation | Must occur before deployment; FMA may request validation report | Pre-go-live |
| Demographic disparity ≥5% | Presumptively material; disclosure to FMA expected; remediation required before continued deployment | Identified disparity finding |
| No remediation + continued deployment | Highest risk profile — regulatory enforcement action foreseeable | Undisclosed/unremediated disparity in live model |
| Model retraining | Material changes (including retraining on new data) trigger validation and disclosure review | At each retraining event |
| CCCFA overlap | Models used in automated credit decisions must satisfy both CCCFA reasonable inquiry (MBIE/Commerce Commission) and FMA algorithmic accountability expectations | For any personal lending automated model |
