# Synthetic Regulatory Policy Document — S8 Context Injection
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# This document simulates excerpts from two real regulatory sources for evaluation purposes.
# It does NOT represent official RBNZ or FMA policy.

---

# Part A: RBNZ Prudential Reporting Standards
## Relevant Excerpts — Return Accuracy, Submission Timeliness, and Methodology Changes
### (Simulated for EXP-003 S8 evaluation)

---

## Section 1 — Scope and Purpose

The Reserve Bank of New Zealand (RBNZ) requires registered banks and deposit-taking institutions to submit regular prudential returns as a condition of registration. These returns inform the RBNZ's supervision activities and are used to produce public financial statistics.

Prudential returns are statutory documents. The figures submitted in each return must accurately represent the institution's financial position as at the reporting date, calculated in accordance with the method definitions prescribed in these Standards. Institutions may not apply non-standard adjustments to reported figures without prior written notification to the RBNZ.

These Standards apply to all returns submitted under the Reserve Bank of New Zealand Act 2021 and the Deposit Takers Act 2023.

---

## Section 2 — Return Accuracy and Figure Derivation

**2.1 Prescribed methodology**

Each return form specifies the field definitions and derivation methodology for every reported figure. Institutions must follow the prescribed derivation methodology for each field. Where an institution uses an internally developed calculation that differs from or supplements the prescribed methodology (including any adjustments applied to source system data before populating a return field), the institution must notify the RBNZ in writing before that adjusted methodology is first used in a submitted return.

The notification requirement in section 2.1 applies regardless of whether the institution believes the adjustment is immaterial. The RBNZ determines materiality for disclosure purposes; institutions do not self-certify materiality exemptions.

**2.2 Adjustments to source data**

If an institution applies any transformation, normalisation, or correction to source system data before populating a return field, this constitutes a methodology adjustment for the purposes of section 2.1. The notification obligation is triggered by:

(a) the first use of the adjusted methodology in a submitted return; or
(b) any change to an adjustment that has previously been notified and approved.

Institutions that have been applying unapproved adjustments to source data in submitted returns are required to self-disclose to the RBNZ's prudential reporting team. The RBNZ will assess whether a retroactive methodology review is required. Failure to self-disclose when the institution becomes aware that an unapproved adjustment has been applied may be treated as a failure to meet the general disclosure obligation under s.93 of the Reserve Bank of New Zealand Act 2021.

**2.3 Automated reporting systems**

Where a registered institution implements an automated system that produces or assists in producing prudential returns, the institution must ensure:

(a) The system applies only approved, documented, and change-controlled derivation logic;
(b) Every transformation step applied to source data is logged with sufficient detail to reconstruct the figure derivation for any submitted return on request;
(c) The log is retained for a minimum of seven years from the date of the return to which it relates;
(d) The log can be produced in full within five business days of a written request from the RBNZ;
(e) The system is subject to the institution's standard IT governance and change control procedures, and changes to transformation logic follow the technology change notification requirements in BS11.

---

## Section 3 — Submission Deadlines

**3.1 Monthly prudential returns**

Monthly prudential returns must be submitted by the 20th calendar day of the month following the reporting period end date. Where the 20th falls on a weekend or public holiday, the submission deadline is the next business day.

Failure to meet the submission deadline without prior written notice and approval from the RBNZ prudential reporting team constitutes a reporting default. A reporting default:
- Triggers a written notice from the RBNZ to the institution's chief financial officer;
- Is recorded in the RBNZ's supervisory records and may be referenced in the institution's supervisory risk assessment;
- If repeated (three or more defaults in a rolling 12-month period), may trigger an unscheduled supervisory review.

**3.2 Informal extension requests**

Institutions may request an informal extension of up to five business days by contacting the RBNZ prudential reporting team in writing before the submission deadline. Extensions are granted at the RBNZ's discretion and are not a right. Repeated extension requests are noted in supervisory records.

---

## Section 4 — Technology Risk Notification (BS11 cross-reference)

Under RBNZ Outsourcing and Technology Risk Policy (BS11), registered banks and deposit-taking institutions must notify the RBNZ of material changes to technology systems that support regulated activities, including systems used to produce or submit prudential returns.

**4.1 Notification threshold**

A change is material for BS11 notification purposes if it:
(a) Alters the way in which data is extracted from source systems for a return field;
(b) Introduces, modifies, or removes a transformation or calculation step that affects a submitted figure;
(c) Changes the system, technology, or process used to prepare, validate, or submit a return;
(d) Replaces a manual process with an automated process (or vice versa) where either process affects a submitted figure.

**4.2 Notification timing**

The institution must notify the RBNZ at least **30 business days** before implementing a material change. The notification must include:
- Description of the change and its scope;
- The return(s) and specific fields affected;
- Before-and-after examples of the derivation methodology;
- Evidence of internal governance approvals (change control sign-off, independent review);
- Planned implementation date and rollback plan.

**4.3 Relationship to section 2.1 notifications**

A BS11 technology notification does not substitute for a section 2.1 methodology notification, and vice versa. Where a technology change also involves a methodology change (e.g., automating a previously manual normalisation step changes how a figure is derived), both notifications are required.

---

## Section 5 — Record Retention

All records related to prudential return preparation, including source data extracts, transformation logs, analyst review records, approval records, and submission confirmations, must be retained for a minimum of seven years from the submission date of the return to which they relate.

Records must be stored in a manner that ensures:
(a) They cannot be altered after the return is submitted;
(b) They are accessible to RBNZ examiners within five business days of written request;
(c) They are protected from accidental or deliberate deletion.

---

---

# Part B: FMA Regulatory Returns Guide 2022
## Audit Trail Standards and Producibility Requirements
### (Simulated for EXP-003 S8 evaluation)

---

## Section 1 — Overview

This guide applies to financial market participants required to submit regulatory returns to the Financial Markets Authority (FMA) under the Financial Markets Conduct Act 2013 and the Financial Reporting Act 2013. It sets out the standards the FMA expects for the accuracy, audit trail, and producibility of regulatory returns.

---

## Section 2 — Audit Trail Requirements

**2.1 What constitutes a complete audit trail**

A complete audit trail for a regulatory return must allow the FMA to trace every submitted figure back to its original source data and understand every adjustment or transformation applied along the way. A complete audit trail comprises:

(a) **Source data log** — the source data as extracted from the source system, including the extraction timestamp, the system and version from which data was extracted, and the identity of the process or person that extracted it;

(b) **Transformation log** — for each transformation applied to source data before populating a return field:
- The transformation rule ID and rule version;
- The exact logic applied (sufficient to reproduce the result independently);
- The identity of the person or automated process that approved the transformation rule;
- The date and version of approval;
- The input and output values for that specific return period;

(c) **Review and approval log** — a record of who reviewed the pre-populated return, any comments or corrections made during review, and the final approval signature of the designated responsible officer before submission;

(d) **Submission confirmation** — the submission timestamp, submission reference number from the FMA gateway, and the identity of the user who submitted.

**2.2 Automated systems**

Where the return is prepared using an automated system, the audit trail requirements in section 2.1 apply to the automated system's outputs. The automated system must:
- Produce a machine-readable log in a format that can be exported for FMA review;
- Ensure the log is immutable after the return is submitted (write-once or equivalent);
- Retain all log entries for a minimum of seven years.

**2.3 Methodology documentation**

In addition to the audit trail, the institution must maintain documentation describing:
- The derivation methodology for each return field (i.e., the rules by which source data is transformed into a submitted figure);
- Any deviations from the FMA-prescribed methodology and the basis for approval of those deviations;
- The governance process by which the methodology is reviewed and updated.

This documentation must be current (reflecting the methodology in use for the most recent submitted return) and must be producible within five business days of an FMA request.

---

## Section 3 — Producibility Standard

**3.1 Five business day obligation**

For any return submitted in the preceding seven years, the institution must be able to produce the complete audit trail set out in section 2.1 within **five business days** of a written request from the FMA.

"Produce" means: provide a complete, legible, exportable record to the FMA examination team, sufficient for the team to independently verify the accuracy of any specific submitted figure.

**3.2 Systematic failures**

Where the FMA determines that an institution cannot produce an audit trail for a submitted return, or that the audit trail produced is incomplete, the FMA may:
- Issue a formal notice requiring remediation within a specified period;
- Treat the failure as a disclosure deficiency under the Financial Reporting Act 2013;
- Include the finding in the institution's supervisory risk rating.

---

## Section 4 — Change Management for Return Preparation Systems

**4.1 Control over derivation logic**

Any logic used to derive a figure for inclusion in a regulatory return must be subject to the institution's formal change management process. This applies to:
- Software or automated transformation logic;
- Excel-based calculations or macros;
- Manual calculation procedures described in process documentation;
- Any combination of the above.

Derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy the FMA's requirements for a complete audit trail (section 2.1(b)), because the FMA cannot verify the transformation log without a documented and controlled version of the rule that was applied.

**4.2 Legacy and informal logic**

Where an institution has been using informal or undocumented logic (e.g., an analyst-maintained spreadsheet calculation) to derive a return figure, and that logic is now being incorporated into a system or automated pipeline, the institution must:

(a) Document the logic as it currently exists, with sufficient precision for independent reproduction;
(b) Subject the documented logic to independent technical review to confirm it accurately represents the calculation that has been applied to historical returns;
(c) Obtain governance sign-off from the responsible officer, confirming the logic is accurate and approved;
(d) Notify the FMA under section 2.1 of this guide and, where applicable, notify the RBNZ under BS11, before the formalised logic is used in a submitted return;
(e) Retain the documented legacy logic alongside the formalised version for audit trail completeness.

---

*End of synthetic policy document — EXP-003 S8 context injection*
