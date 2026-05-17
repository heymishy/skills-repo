# Discovery: Automated Regulatory Reporting Pipeline — RBNZ Prudential and FMA Returns

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config B / S8)
**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-opus-4-6 (Config B — Opus front-loaded)
**Run:** EXP-008 Config B S8

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S8-ea-registry-regulatory-reporting-pipeline.md` — EA registry PROPOSED entry for Regulatory Reporting Pipeline. Interface map: read-only upstream sources CoreBanking-GL (RRPL-UP-001), TreasuryLedger (RRPL-UP-002), CardPlatform (RRPL-UP-003); downstream submission interfaces RBNZ Reporting Portal (RRPL-DN-001), FMA Submission Gateway (RRPL-DN-002); audit and governance interfaces PostgreSQL immutable audit log (RRPL-AUD-001), Finance SharePoint analyst review workflow (RRPL-AUD-002). Regulatory obligations table calls out: RBNZ Prudential Reporting Standards (prescribed return formats and field definitions), monthly submission deadline (20th of month), BS11 s.4.2 (material change to systems producing regulatory reports requires 30-business-day advance notification — material change definition includes any change to data processing systems that affect reported figures), FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 s.3.4 (audit trail producible within 5 business days), and FMA methodology change disclosure (any change to how a reported figure is derived requires disclosure to FMA). Risk register: RRPL-RISK-001 (TreasuryLedger vendor has no regulatory-data REST API in standard offering — manual CSV extract remains the only treasury data path; severity HIGH), RRPL-RISK-002 (normalisation transformation exists only in an Excel macro written and maintained by one analyst; no independent review of the transformation logic is on record; this transformation changes figures that appear in regulatory returns; severity HIGH — single-author transformation; no independent review on record), RRPL-RISK-003 (RBNZ has not been notified that normalised figures rather than raw source figures have been submitted in prudential returns; severity HIGH). Change control procedure: any change to transformation logic requires Jira Finance Change Board request, business owner approval (Finance Operations Manager), independent technical review, legal/compliance sign-off, RBNZ BS11 notification ≥30 business days, UAT test evidence, CAB approval before production.
- `S8-rbnz-fma-policy-doc.md` — Synthetic excerpt from RBNZ Prudential Reporting Standards and FMA Regulatory Returns Guide 2022. RBNZ part: s.2.1 prescribed methodology — institutions following internally developed calculations differing from or supplementing prescribed methodology (including any adjustment applied to source system data before populating a return field) must notify RBNZ in writing before the adjusted methodology is first used in a submitted return; RBNZ determines materiality — institutions do not self-certify materiality exemptions. s.2.2 explicitly classifies any transformation, normalisation, or correction applied to source data before populating a return field as a methodology adjustment under s.2.1; notification trigger is (a) first use in a submitted return or (b) any change to a previously approved adjustment; institutions that have been applying unapproved adjustments are required to self-disclose; failure to self-disclose may be treated as a failure of the s.93 general disclosure obligation under the Reserve Bank of New Zealand Act 2021. s.2.3 automated reporting systems must: (a) apply only approved, documented, change-controlled derivation logic; (b) log every transformation step with sufficient detail to reconstruct figure derivation; (c) retain logs for 7 years from return date; (d) produce logs to RBNZ within 5 business days; (e) subject to institution's standard IT governance and BS11 technology change notification requirements. s.3.1 monthly submission deadline 20th calendar day; reporting default = written notice to CFO + supervisory records + ≥3 defaults in 12 months may trigger unscheduled supervisory review. s.4.1 BS11 cross-reference; s.4.2 BS11 notification ≥30 business days before implementing material change (which includes automation of previously manual normalisation step affecting reported figures); s.4.3 BS11 notification and s.2.1 methodology notification are independent — both required when both technology and methodology change. s.5 record retention 7 years. FMA part: s.2.1 complete audit trail = source data log (extraction timestamp, system version, identity of extracting process/person), transformation log (rule ID, rule version, exact logic sufficient for independent reproduction, identity of approver, date and version of approval, input and output values per period), review and approval log (who reviewed, comments/corrections, final approval signature of designated responsible officer), submission confirmation (timestamp, submission reference number, identity of submitter). s.2.2 automated systems must produce machine-readable, immutable (write-once or equivalent) logs retained 7 years. s.2.3 methodology documentation must describe derivation methodology for each return field, deviations from FMA-prescribed methodology with approval basis, governance process for methodology review; current and producible within 5 business days. s.3.1 5-business-day producibility obligation for any return in preceding 7 years; "produce" means provide a complete, legible, exportable record sufficient for independent verification. s.3.2 systematic failures may be treated as disclosure deficiency under Financial Reporting Act 2013. s.4.1 derivation logic for return figures must be subject to formal change management — explicitly applies to "Excel-based calculations or macros"; derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy FMA's requirements for a complete audit trail. s.4.2 legacy and informal logic being incorporated into a system or automated pipeline must be: (a) documented with sufficient precision for independent reproduction; (b) subject to independent technical review confirming the documented logic accurately represents the calculation applied to historical returns; (c) responsible officer governance sign-off; (d) FMA notification under s.2.1 and where applicable RBNZ notification under BS11 before the formalised logic is used in any submitted return; (e) documented legacy logic retained alongside formalised version for audit completeness.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated for this domain feature.

**EA registry signals active (the four directly material to constraint reasoning):**
- RRPL-RISK-002 (HIGH): single-author normalisation transformation, no independent review on record, changes figures appearing in regulatory returns.
- RRPL-RISK-003 (HIGH): RBNZ has been receiving normalised figures without being notified that a transformation has been applied to raw source data.
- RRPL-RISK-001 (HIGH): TreasuryLedger has no regulatory-data API in vendor's standard offering — manual CSV extract is the only path.
- BS11 s.4.2 / Change control procedure: any change to transformation logic affecting reported figures requires independent technical review, compliance sign-off, RBNZ BS11 notification ≥30 business days before production, and CAB approval.

---

## Problem Statement

The finance operations team produces RBNZ monthly prudential returns and quarterly FMA regulatory reports through a manual process. Three senior analysts extract data from core banking, treasury, and card source systems, reconcile the figures in Excel, and submit completed returns via the RBNZ Reporting Portal and the FMA Submission Gateway. The cycle consumes 6–8 business days per month. The internal sign-off deadline is missed on average once per quarter, the team has twice required informal extensions from its RBNZ relationship manager, and senior analysts estimate 40% of their time goes to extraction and reconciliation steps they believe are automatable. The operational case for automation is clear: a pre-populated return file with analyst review and human sign-off, drawing from read-only APIs and producing an immutable audit trail, would compress the cycle, reduce analyst error risk, and eliminate the dependency on informal regulatory extension requests.

The opportunity is not, however, a straightforward "build a pipeline" problem. It is bounded — and gated — by a regulatory disclosure and governance position the enterprise has not yet resolved. The team proposes to formalise an existing manual normalisation step into the pipeline as a permanent transformation layer. That normalisation was written in 2019 as an Excel macro by one senior analyst during the source system migration, has never been independently reviewed, has no change-control history, has no test suite, and is comprehensible only to its original author. It has nevertheless been applied to every prudential return submitted since 2019. Two regulatory positions follow from this. First, under RBNZ Prudential Reporting Standards s.2.2, any transformation applied to source data before populating a return field is a methodology adjustment under s.2.1 — and an institution may not self-certify that an adjustment is immaterial. The enterprise has therefore been submitting prudential returns with an unnotified methodology adjustment for approximately seven years, and s.2.2 creates an explicit self-disclosure obligation now that the team is aware of it. Second, under FMA Regulatory Returns Guide 2022 s.4.2, legacy informal logic — explicitly including analyst-maintained spreadsheet calculations — being incorporated into an automated pipeline must be documented for independent reproduction, independently reviewed, governed by sign-off, and notified to both FMA and RBNZ before the formalised logic is used in any submitted return.

The deeper governance question is what supervisory consequence follows if the normalisation is encoded into the automated pipeline without first resolving these positions. The Excel macro fails every test that RBNZ s.2.3 and FMA s.4.1 set for derivation logic in an automated regulatory pipeline: it is not documented to a reproducible standard, it is not version-controlled, it has no independent review, it has no test evidence, and its institutional knowledge sits with one person. Encoding it into a regulated return pipeline — even with a faithful transcription — would formalise a non-compliant derivation pathway, would extend the historical disclosure gap into a forward-looking one, and would create a position the enterprise could not defensibly hold under RBNZ supervisory review or FMA examination. A supervisory finding here would not merely concern audit trail completeness; it would concern the institution's control over derivation logic for figures it has been submitting under statutory obligation. The single-author concentration (the macro author leaving the team would render the rule set unverifiable) compounds this into a key-person risk that becomes a key-system risk the moment the macro becomes a pipeline component.

The problem is therefore two-layered, and the layers must be resolved in order:

1. **Operational efficiency gap.** The manual cycle is slow, error-prone, and dependent on informal regulatory accommodations. Automation is the correct direction.
2. **Pre-existing regulatory disclosure and governance gap.** The normalisation logic targeted for automation has never been disclosed to RBNZ, has never been independently reviewed, has no change-control history, has no test suite, and depends on one person's knowledge. This gap is a precondition of build scope: it must be resolved through a formal governance and disclosure process before the normalisation transformation can be part of any pipeline producing figures intended for regulatory submission.

Treating layer 1 without resolving layer 2 would convert a historical compliance gap into a forward-looking automated one and create an indefensible supervisory position.

---

## Who It Affects

**Finance operations analysts (primary users).** Currently spend 40% of their cycle time on extraction and reconciliation. Under the proposed model their role moves to review and sign-off of pre-populated returns. They retain final approval authority before any return is submitted — this is a non-negotiable regulatory and operational requirement, and the pipeline must not contain any pathway that bypasses human approval.

**Compliance Officer (regulatory disclosure owner).** Owns the regulatory relationship with RBNZ and FMA. Responsible for: filing the RBNZ s.2.1 methodology notification; managing the s.2.2 historical self-disclosure (which creates a Reserve Bank of New Zealand Act 2021 s.93 disclosure exposure if unhandled); coordinating the BS11 s.4.2 technology change notification; submitting the FMA methodology change notification per s.4.2; and signing off the `NORMALISATION_LAYER_APPROVED` deployment configuration that gates the transformation engine.

**Finance Operations Manager (build sponsor and governance approver).** Business owner for the pipeline. Accountable for ensuring all compliance preconditions are resolved before build scope is committed to engineering. Joint signatory (with Compliance Officer) on the normalisation logic governance sign-off required by FMA s.4.2(c).

**CFO / designated finance officer (statutory submitter).** Signs off every return before submission. The RBNZ s.3.1 reporting default notice is addressed to the CFO; pipeline reliability directly affects the CFO's regulatory exposure. The pipeline must produce auditable per-period sign-off records attributable to the CFO or their delegated signatory.

**Independent Technical Reviewer (governance role to be appointed).** A finance or risk function staff member other than the original macro author, mandated by FMA s.4.2(b) to review the documented normalisation logic and confirm it accurately represents the calculation applied to historical returns. This is a defined governance role, not a developer review.

**RBNZ relationship manager and FMA prudential / market conduct contacts (external recipients).** Recipients of the s.2.1 methodology notification, the historical self-disclosure, the BS11 s.4.2 technology change notification, and the FMA s.4.2 formalisation notification. RBNZ has explicitly indicated in past extension requests that the supervisory relationship is tracking the enterprise's reporting reliability.

**Treasury Operations (manual data provider).** Continues to produce the treasury CSV extract for the foreseeable future — TreasuryLedger has no regulatory-data API. Required to provide explicit per-cycle reporting-period confirmation as part of ingestion.

**Internal Audit (downstream consumer).** Read-only consumer of the immutable audit log; the audit trail must satisfy internal audit evidentiary requirements as well as FMA producibility standards.

---

## MVP Scope

The minimum deliverable that achieves the operational efficiency objective while satisfying every mandatory compliance precondition:

1. **Source data extraction from CoreBanking-GL and CardPlatform via read-only REST APIs.** Read-only service accounts; write scopes excluded from token issuance. Per-run source data log capturing system, interface ID (RRPL-UP-001/003), API version, extraction timestamp (ISO 8601 with timezone), reporting period, field inventory, and SHA-256 hash of the extracted payload before any transformation step begins.

2. **Treasury data ingestion via versioned manual CSV extract.** TreasuryLedger has no regulatory-data API in the vendor's standard offering (RRPL-RISK-001), so the pipeline ingests treasury data from a manually produced CSV with a defined, version-controlled schema. Per-period reporting-coverage confirmation by treasury operations is captured as a documented approval artefact (Jira Finance Change Board task ID or SharePoint document ID) and stored in the audit log ingestion record; email-only confirmation is rejected.

3. **Versioned, change-controlled normalisation transformation layer — gated.** The transformation engine reads normalisation rules only from the version-tagged repository specification produced in Epic 1 Story 1.2 (initial tag `normalisation-rules-v1.0.0`). Activation in any environment processing returns intended for submission is gated on the `NORMALISATION_LAYER_APPROVED` deployment flag, which is set to `true` only by the Compliance Officer when (a) the independent review report and governance sign-off documents are filed with their SharePoint document IDs referenced in deployment configuration, and (b) the FMA s.4.2 formalisation notification has been submitted.

4. **Pre-populated return file generation for RBNZ BS2, BS3, BS7 and the FMA Statistical Return.** Files generated only in RBNZ-prescribed formats; format conformance validated against a stored specification before staging; the return file carries traceable references back to its source data extract run ID and transformation log run ID.

5. **Analyst review, sign-off, and submission workflow via SharePoint staging.** Pre-populated return staged in SharePoint (RRPL-AUD-002) for designated analyst review. Submission to RBNZ Reporting Portal (RRPL-DN-001) or FMA Submission Gateway (RRPL-DN-002) requires explicit identity-attributed sign-off from the designated finance officer or delegated signatory; the system contains no auto-submission pathway. Sign-off identity, timestamp, and any amendments recorded in the review and approval log.

6. **Immutable, write-once audit trail meeting FMA s.2.1 and RBNZ s.2.3 standards.** PostgreSQL immutable log (RRPL-AUD-001) capturing for each return period: source data log, transformation log (rule ID, rule version, human-readable logic description sufficient for independent reproduction, identity of approver of the rule version, input and output values, pipeline run ID, ISO 8601 timestamp), review and approval log (reviewer identity, comments, final sign-off identity and timestamp), submission confirmation (timestamp, gateway submission reference number, submitter identity). 7-year retention; producible to RBNZ or FMA in machine-readable, exportable form within 5 business days of written request.

**Compliance preconditions — not engineering scope but tracked as delivery blockers (Epic 1):**

- **B1 / C1+C4 — RBNZ s.2.1 methodology notification + s.2.2 historical self-disclosure.** Compliance Officer files the s.2.1 notification covering the normalisation methodology, the affected return fields (BS2, BS3, BS7), before/after derivation examples, and the historical application since 2019. The s.2.2 self-disclosure is included in or accompanies the notification. RBNZ written acknowledgement is required before any production run that includes the normalisation layer; if RBNZ initiates a retroactive methodology review, production go-live is blocked pending RBNZ's written outcome.

- **B1 / C1 — BS11 s.4.2 technology change notification.** Compliance Officer files the BS11 notification with RBNZ at least 30 business days before planned production go-live. A pre-deployment CI/CD gate verifies the deployment date is ≥30 business days after the notification date stored in deployment configuration.

- **B2 / C5 — Normalisation logic independent review, documentation, change control, and FMA notification.** The Excel macro is documented to FMA s.4.2(a) precision; an Independent Technical Reviewer (not the original author) signs the review report per s.4.2(b); Finance Operations Manager and Compliance Officer jointly sign the governance approval per s.4.2(c); the rule set is version-controlled in the engineering repository at tag `normalisation-rules-v1.0.0`; the FMA s.4.2(d) formalisation notification is submitted; the legacy Excel macro is retained alongside the formalised version per s.4.2(e).

- **B3 / C2 — Pre-launch audit trail producibility drill.** The Compliance Officer runs a dry submission cycle in UAT, then exercises the 5-business-day producibility process for the simulated return period, confirming the audit log can be exported in machine-readable form, is legible, and is sufficient for an independent reviewer to verify any submitted figure. The drill outcome is filed as a signed Compliance Officer record. Production go-live is blocked until this drill is successfully demonstrated.

---

## Out of Scope

1. **Normalisation rule remediation.** If the independent technical review concludes that the normalisation rules are incorrect, or have been incorrectly applied in historical returns, fixing the rules and managing any retroactive regulatory disclosure of past errors is a separate governance initiative — not pipeline delivery scope.

2. **TreasuryLedger vendor API engagement.** Commissioning a treasury vendor regulatory-data API is out of scope. Treasury data continues to flow via manual CSV extract through this MVP.

3. **FMA Annual Financial Statements return automation.** The FMA Annual Financial Statements return has a different production cycle and is a follow-on scope item. This MVP covers RBNZ monthly prudential returns (BS2, BS3, BS7) and the FMA Statistical Return.

4. **Return form redesign.** Returns are generated only in RBNZ-prescribed formats. No changes to return form structure, field definitions, or submission formats are in scope; if a prescribed methodology changes via RBNZ Standards update, that is consumed as a configuration change, not a system redesign.

5. **Automated submission without human approval.** Any pathway that removes, defers, or bypasses the analyst / designated officer sign-off is out of scope. The pipeline contains no auto-submit code path.

6. **Retroactive correction of historical submitted returns.** If the RBNZ self-disclosure triggers a methodology review identifying historical submission errors, correction of those historical submissions is managed by Compliance under their regulatory correspondence process, not by this delivery.

7. **Real-time intra-day reporting.** Scope is the monthly cycle and the quarterly cycle. Real-time prudential reporting (not currently required for the enterprise) is out of scope.

8. **Use of the pipeline by other returns or other regulators.** Scope is the named RBNZ and FMA returns only. Repurposing the platform for AML/CFT transaction reporting, AUSTRAC, or any other regulator is a separate scope item.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION — A1] CoreBanking-GL (RRPL-UP-001) and CardPlatform (RRPL-UP-003) read-only REST APIs expose every mandatory return field at adequate data quality and timeliness for the monthly cycle. Confirmation requires a per-field mapping review by source-system owners before Story 2.1 build. If a required field is missing or quality-deficient, the gap must be raised as a new derivation step — which would itself trigger an additional s.2.1 methodology notification.

[ASSUMPTION — A2] RBNZ will acknowledge the s.2.1 notification and the s.2.2 historical self-disclosure on a timeline compatible with the planned production go-live. The assumption may be invalidated if RBNZ initiates a retroactive methodology review; in that case go-live is suspended pending RBNZ written outcome. UAT-environment build work may continue during a review period but production activation cannot.

[ASSUMPTION — A3] The FMA s.4.2(d) formalisation notification does not require prior FMA written acknowledgement before the formalised logic may be used in a submitted return. The policy text states the notification must be made "before the formalised logic is used in a submitted return" but does not specify that prior acknowledgement is required. To be confirmed by Compliance with FMA contact during notification preparation; if FMA requires prior acknowledgement, the timeline extends.

[ASSUMPTION — A4] The pipeline run, treasury CSV preparation, format validation, analyst review, and CFO sign-off can complete within enough days each month to leave at least 2 business days of analyst review headroom before the 20th-of-month RBNZ deadline. The current 6–8-day manual cycle suggests this is achievable, but the assumption is load-tested only after the first three production cycles.

[ASSUMPTION — A5] The independent technical reviewer (FMA s.4.2(b)) can be appointed from existing Finance Risk or Internal Audit staff with sufficient subject matter knowledge of the source systems. If no qualified internal reviewer is available, an external review engagement is required and adds calendar time to the Story 1.2 gate.

[ASSUMPTION — A6] The original macro author remains available through the Story 1.2 documentation period. Their departure mid-process would invalidate the documentation-by-author step of FMA s.4.2(a); the s.4.2 path would then require a more involved reverse-engineering effort. The risk is heightened by RRPL-RISK-002.

### Blockers

[BLOCKER — B1 — RBNZ disclosure gap: prospective notification, BS11 technology notification, and historical self-disclosure all required before production.] Three RBNZ-side disclosures are in scope. (i) Prospective s.2.1 methodology notification covering the normalisation transformation now being formalised. (ii) BS11 s.4.2 technology change notification filed ≥30 business days before production go-live; the automation of a previously manual normalisation step affecting reported figures meets the s.4.2(b) and s.4.2(d) materiality definitions. (iii) Historical self-disclosure per s.2.2 covering the period from 2019 to present during which normalised figures were submitted without notification — this is an active obligation the moment the team becomes aware of it (and the enterprise is now aware). Failure to self-disclose may be treated as a s.93 disclosure failure under the Reserve Bank of New Zealand Act 2021. **Production go-live is blocked on RBNZ written acknowledgement of items (i) and (iii), and on the ≥30-business-day clock for item (ii).**

[BLOCKER — B2 — Normalisation logic governance gap: encoding the Excel macro without independent review, documentation, change control, FMA notification, and a test suite would create an indefensible supervisory position.] RRPL-RISK-002 describes the macro's status: single-author, no independent review on record, no change-control history. Three further factual elements compound this and are not stated in any injection source — they follow from the operational situation and from RBNZ s.2.3 / FMA s.4.1 read together: (a) no test suite covers the macro, so no evidence exists of correct execution under representative inputs; (b) the rules are comprehensible only to the original author, creating institutional key-person risk that becomes a key-system risk the moment the macro is encoded as a pipeline component; (c) encoding the macro into a regulated return pipeline transforms a historical compliance gap into a forward-looking automated one — under supervisory review the institution would have to defend not the absence of controls (an audit finding) but the active deployment of derivation logic into a regulated pipeline despite known absence of controls (a control failure). The remediation pathway is fixed by FMA s.4.2: documentation for independent reproduction, independent technical review, governance sign-off, FMA and (via BS11) RBNZ notification, and retention of legacy artefact. To this we add a constructed control — a test suite producing evidence that the version-tagged rule set executes as documented — to bring the formalised logic into compliance with the RBNZ s.2.3 / FMA s.4.1 "approved, documented, change-controlled derivation logic" standard. **Production go-live of the normalisation transformation is blocked until all five FMA s.4.2 steps are complete, the rule set is version-controlled in the repository, the test suite is passing, and the `NORMALISATION_LAYER_APPROVED` flag is set by the Compliance Officer.**

[BLOCKER — B3 — Pre-launch audit trail producibility must be demonstrated.] FMA s.3.1 sets a 5-business-day producibility standard against "any return in the preceding seven years." For a new pipeline the standard cannot be assumed — it must be demonstrated. Compliance Officer runs a producibility drill in UAT covering a simulated submission cycle and confirms machine-readable, legible, exportable production. **Production go-live is blocked until the producibility drill is signed off.**

---

## Success Indicators

1. **Cycle time.** Monthly return cycle compressed from 6–8 business days to ≤2 business days of human time (analyst review and CFO sign-off), with the remaining cycle absorbed by automated extraction, transformation, format validation, and audit logging.

2. **Submission reliability.** Zero missed internal sign-off deadlines per quarter. The RBNZ 20th-of-month deadline met for every cycle without informal extension requests for at least two consecutive quarters following go-live.

3. **Audit trail producibility.** Any RBNZ or FMA written request for audit trail for a return in the preceding 7 years satisfied within 5 business days, in machine-readable exportable form, with a transformation log entry per FMA s.2.1(b) criteria for every figure in the submitted return. Producibility demonstrated in pre-launch drill (B3) and re-tested annually thereafter.

4. **Governance position resolved.** Normalisation logic documented to FMA s.4.2(a) precision, independently reviewed, version-controlled, test-evidenced, governance-signed, FMA-notified, and BS11-notified to RBNZ — single-author indefensible position closed before any production run includes the normalisation layer.

5. **Regulatory disclosure complete.** RBNZ s.2.1 methodology notification and s.2.2 historical self-disclosure filed and acknowledged; BS11 s.4.2 technology change notification filed ≥30 business days before production go-live; FMA s.4.2 formalisation notification filed; no s.93 disclosure exposure remains open at go-live.

6. **No regulatory finding in the first supervisory review post go-live.** Demonstrable absence of findings against derivation logic, audit trail completeness, or methodology disclosure in the next RBNZ supervisory review or FMA examination cycle covering the post-go-live period.

---

<!-- CPF-TRACE
stage: /discovery
model: claude-opus-4-6
config: B

constraints_identified:
- C1: RBNZ Prudential Reporting Standards — prescribed return formats and field definitions; monthly submission deadline 20th calendar day with reporting-default consequences; s.2.1 prior written notification before any internally developed or adjusted derivation methodology is first used in a submitted return; s.2.2 transformation/normalisation/correction applied to source data classified as methodology adjustment + self-disclosure obligation for unapproved historical adjustments + s.93 disclosure failure exposure; s.2.3 automated reporting system requirements (approved change-controlled logic; transformation log with reconstruction depth; 7-year retention; 5-business-day producibility; subject to BS11); s.3.1 reporting-default mechanics; BS11 s.4.2 material technology change notification ≥30 business days before implementation; s.4.3 BS11 and s.2.1 notifications independent — both required when both technology and methodology change; s.5 7-year record retention; immutability requirement [operator brief: deadline + extensions + audit trail "non-negotiable"; follow-up context: prior approval explicit; EA registry: BS11 s.4.2 obligation, RRPL-RISK-003 historical non-disclosure, change control procedure; policy doc: full s.2/s.3/s.4/s.5 text]
- C2: FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 — complete audit trail: source data log (extraction timestamp, system version, identity of extracting process/person), transformation log (rule ID, rule version, exact logic sufficient for independent reproduction, identity of approver of rule version, input/output values), review and approval log (reviewer, comments, final signature), submission confirmation; s.2.2 immutable (write-once or equivalent) machine-readable logs; s.2.3 methodology documentation current and producible; s.3.1 5-business-day producibility for any return in preceding 7 years — "produce" defined as complete, legible, exportable, sufficient for independent verification; s.3.2 systematic producibility failure may be treated as disclosure deficiency; s.4.1 derivation logic must be subject to formal change management — explicitly includes Excel macros; undocumented/unversioned/unreviewed logic does not satisfy audit trail completeness; 7-year retention [operator brief: "non-negotiable" + 5-business-day in follow-up; EA registry: RRPL-AUD-001 immutable PostgreSQL audit log; policy doc: full FMA Part B]
- C3: Human sign-off mandatory before submission — designated analyst/finance officer approval required before any dispatch to RBNZ or FMA; no auto-submission pathway; sign-off must be identity-attributed and timestamped in review and approval log [operator brief: "Analysts retain sign-off authority — the pipeline does not submit directly to regulators without human review and approval" — explicit; reinforced in FMA s.2.1(c) review and approval log component]
- C4: Normalisation constitutes a material figure-derivation change — embedding the correction layer into a regulated return pipeline is a methodology adjustment per RBNZ s.2.2 (transformation/normalisation/correction applied to source data before populating a return field); also a BS11 s.4.2 material change (automation of previously manual normalisation step affecting reported figures meets s.4.2(b) and s.4.2(d) thresholds); the operator brief frames the normalisation positively but s.2.2 makes the regulatory classification unambiguous [operator brief frames positively; counter-classification follows from policy doc s.2.2 + BS11 s.4.2 + EA registry RRPL-RISK-003 confirming historical non-disclosure]
- C5: Normalisation logic governance gap — unreviewed single-author 2019 Excel macro with no change-control history, no test suite, no second-reviewer verification, and comprehensibility concentrated in one person; encoding into a regulated return pipeline creates an indefensible supervisory position because the institution would be actively deploying derivation logic into a regulated automated pathway despite known absence of every control standard set by RBNZ s.2.3 and FMA s.4.1; key-person risk becomes key-system risk on encoding [HIDDEN — surfaced by compositional reasoning across follow-up context (Excel macro, single analyst 2019, no formal review, analyst is only person who fully understands the rules), EA registry RRPL-RISK-002 (HIGH — single-author, no independent review on record), and FMA s.4.1 + s.4.2 read together as the obligation framework. Three elements added by model reasoning and NOT in any injection source: (a) "no test suite" gap and its implication for RBNZ s.2.3 "approved" standard; (b) supervisory consequence framing — encoding transforms a historical audit gap into a forward-looking active control failure; (c) key-person → key-system risk conversion on encoding. None of the injection files state these — they follow from reading the situation against the standards. C5 is held distinct from C4: C4 is the regulatory classification of normalisation as a methodology adjustment requiring disclosure; C5 is the governance and control adequacy of the specific rule set being formalised.]

constraints_carried_forward:
- C1: Problem Statement (RBNZ s.2.1 methodology notification, s.2.2 historical self-disclosure, s.93 exposure); Who It Affects (Compliance Officer, RBNZ relationship manager); MVP Scope item 6 (RBNZ s.2.3 audit trail standards: 7-year retention, 5-business-day producibility, immutability); Compliance Preconditions B1 (RBNZ s.2.1 + s.2.2 + BS11 s.4.2); Blocker B1; Success Indicators 3 and 5
- C2: Problem Statement (FMA audit trail, FMA examination); Who It Affects (Compliance Officer, Independent Technical Reviewer); MVP Scope item 6 (FMA s.2.1 components — source data log, transformation log with rule ID/version/logic/approver/input/output, review and approval log, submission confirmation; s.2.2 immutability; s.3.1 5-business-day producibility); Compliance Precondition B3 (pre-launch producibility drill); Blocker B3; Success Indicator 3
- C3: MVP Scope item 5 (analyst review and identity-attributed sign-off, no auto-submission pathway); Out of Scope item 5 (any pathway removing or bypassing sign-off is excluded); Success Indicator 1 (analyst review and CFO sign-off as the remaining human time component)
- C4: Problem Statement (normalisation as methodology adjustment under s.2.2; encoding extends historical gap forward); Compliance Precondition B1 (B1 includes the methodology classification, not only the technology one); Blocker B1; Success Indicator 5
- C5: Problem Statement (full second-layer treatment — single-author, no review, no change control, no test suite, comprehensibility concentration); Who It Affects (Independent Technical Reviewer named as defined governance role per FMA s.4.2(b)); MVP Scope item 3 (NORMALISATION_LAYER_APPROVED deployment flag gating activation); Compliance Precondition B2 (full FMA s.4.2 five-step path plus constructed test-suite control); Blocker B2; Assumption A5 (independent reviewer availability); Assumption A6 (original author availability through documentation period); Success Indicator 4

constraints_not_carried: none — all five constraints identified, distinguished, and carried forward through problem statement, scope, blockers, and success indicators

c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Compositional reasoning across three signals: follow-up context (Excel macro, single analyst 2019,
  no formal review, analyst is only person who fully understands the correction rules); EA registry
  RRPL-RISK-002 (HIGH severity, single-author, no independent review on record, transformation
  changes figures appearing in returns); FMA policy doc s.4.2 (legacy informal logic — explicitly
  including analyst-maintained spreadsheet calculations — being incorporated into automated pipeline
  must be documented, independently reviewed, governance-signed, FMA-notified and RBNZ-notified,
  with legacy artefact retained). Three model-inferred elements not present in any injection source:
  (a) the absence of a test suite as a distinct gap relative to RBNZ s.2.3 "approved" standard for
  automated systems; (b) the supervisory consequence framing — encoding the macro converts a
  historical audit-trail gap into a forward-looking active control failure that the institution
  could not defensibly hold under RBNZ supervisory review or FMA examination; (c) the key-person
  to key-system risk conversion that occurs at the moment of encoding. C5 surfaced as explicit
  [BLOCKER — B2] with the full FMA s.4.2 five-step remediation path plus the constructed test-suite
  control, and operationalised as the NORMALISATION_LAYER_APPROVED deployment flag in MVP Scope item 3.

c5_surfacing_quality_self_assessment: full
c5_surfacing_quality_notes: >
  Held distinct from C4 (regulatory classification of normalisation as methodology adjustment) so
  that the governance/control adequacy question (C5) is reasoned independently of the disclosure
  question (C4). Three model-inferred elements (test-suite gap; supervisory-consequence framing;
  key-person to key-system conversion) carry the constraint beyond what injection content directly
  supports. Operationalised through a named deployment-time gate (NORMALISATION_LAYER_APPROVED
  flag) with explicit owner (Compliance Officer) — surfacing translated into an enforceable control,
  not only a written observation.
-->
