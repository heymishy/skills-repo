# Discovery: Automated Regulatory Reporting Pipeline — RBNZ and FMA Returns

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config C / S8)
**Feature slug:** regulatory-reporting-pipeline-automation
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config C — cost-optimised; /discovery stage is Sonnet)
**Run:** EXP-008 Config C S8

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**

- `S8-ea-registry-regulatory-reporting-pipeline.md` — EA registry PROPOSED entry for the Regulatory Reporting Pipeline. Upstream read-only interfaces: CoreBanking-GL (RRPL-UP-001 REST API), TreasuryLedger (RRPL-UP-002 REST API), CardPlatform (RRPL-UP-003 REST API). Downstream submission interfaces: RBNZ Reporting Portal (RRPL-DN-001) and FMA Submission Gateway (RRPL-DN-002), both requiring designated finance officer sign-off before submission. Audit governance interfaces: immutable PostgreSQL audit log (RRPL-AUD-001) logging every transformation step, and Finance SharePoint analyst review workflow (RRPL-AUD-002). Regulatory obligations table calls out: RBNZ Prudential Reporting Standards (prescribed formats and field definitions); monthly submission deadline 20th of month; BS11 s.4.2 (material change to data processing systems affecting reported figures requires ≥30 business days advance notification to RBNZ); FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 s.3.4 (full audit trail producible within 5 business days); FMA methodology change disclosure (any change to how a reported figure is derived requires FMA disclosure and, where material, prior FMA acknowledgement). Risk register: **RRPL-RISK-001** (HIGH — TreasuryLedger has no regulatory-data REST API in vendor's standard offering; manual CSV extract is the only treasury data path), **RRPL-RISK-002** (HIGH — "The normalisation transformation applied to source system fields exists only in an Excel macro written and maintained by one analyst. No independent review of the transformation logic is on record. This transformation changes figures that appear in regulatory returns."), **RRPL-RISK-003** (HIGH — "RBNZ has not been notified that normalised figures rather than raw source figures have been submitted in prudential returns. RBNZ has been receiving the submitted figures without visibility into the normalisation step applied to source data upstream of the return population."). Change control procedure: changes to transformation logic require Finance Change Board request, business owner approval (Finance Operations Manager), independent technical review, legal/compliance sign-off, RBNZ BS11 notification ≥30 business days before production, UAT evidence, and CAB approval.

- `S8-rbnz-fma-policy-doc.md` — Synthetic regulatory policy excerpt. RBNZ Prudential Reporting Standards: s.2.1 — institutions applying any internally developed calculation differing from or supplementing prescribed methodology (including any adjustment applied to source system data before populating a return field) must notify RBNZ in writing before that adjusted methodology is first used in a submitted return; RBNZ determines materiality — institutions may not self-certify materiality exemptions. s.2.2 — any transformation, normalisation, or correction applied to source data before populating a return field constitutes a methodology adjustment under s.2.1; notification trigger is (a) first use in a submitted return or (b) any change to a previously notified and approved adjustment; institutions that have been applying unapproved adjustments are required to self-disclose; failure to self-disclose when the institution becomes aware may be treated as failure of the general disclosure obligation under s.93 Reserve Bank of New Zealand Act 2021. s.2.3 — automated reporting systems must: (a) apply only approved, documented, change-controlled derivation logic; (b) log every transformation step with sufficient reconstruction depth; (c) retain logs 7 years from return date; (d) produce logs to RBNZ within 5 business days; (e) subject to BS11 technology change requirements. s.3.1 — monthly submission deadline 20th calendar day; reporting default = written notice to CFO, supervisory records entry, ≥3 defaults in 12 months may trigger unscheduled supervisory review. BS11 s.4.2 — material change notification ≥30 business days before implementation; automation of a previously manual normalisation step affecting reported figures explicitly meets the material change threshold; s.4.3 — BS11 and s.2.1 notifications are independent — both required when both technology and methodology change. FMA Regulatory Returns Guide 2022: s.2.1 — complete audit trail comprises source data log (extraction timestamp, system version, identity of extracting process/person), transformation log (rule ID, version, exact logic sufficient for independent reproduction, identity of approver, approval date, input/output values per period), review and approval log (reviewer, comments, final approval signature of responsible officer), submission confirmation (timestamp, reference number, submitter identity). s.2.2 — automated systems must produce machine-readable immutable (write-once or equivalent) logs retained 7 years. s.3.1 — 5-business-day producibility obligation for any return in the preceding 7 years; "produce" means a complete, legible, exportable record sufficient for independent verification. **s.4.1 — derivation logic for return figures must be subject to the institution's formal change management process; explicitly applies to Excel-based calculations or macros; derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy the FMA's requirements for a complete audit trail. s.4.2 — where an institution has been using informal or undocumented logic (e.g., an analyst-maintained spreadsheet calculation) to derive a return figure, and that logic is now being incorporated into an automated pipeline, the institution must: (a) document the logic with precision for independent reproduction; (b) subject it to independent technical review confirming accuracy against historical returns; (c) obtain governance sign-off from the responsible officer; (d) notify FMA and, where applicable, RBNZ before the formalised logic is used in any submitted return; (e) retain the documented legacy logic alongside the formalised version for audit completeness.**

**Key signals active:**
- RRPL-RISK-002: single-author Excel macro, no independent review on record — directly informs C5 governance gap
- RRPL-RISK-003: RBNZ has not been notified of normalised figure adjustments — directly informs C1 and C4 disclosure obligations
- FMA s.4.1 and s.4.2: legacy informal logic formalisation requirements — explicitly covers analyst-maintained spreadsheet calculations → converges with RRPL-RISK-002 to surface C5
- BS11 s.4.2: 30-business-day notification window — gates go-live timeline

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated for this domain feature.

---

## Problem Statement

The finance operations team currently produces the enterprise's RBNZ monthly prudential returns and quarterly FMA regulatory reports through a manual process that consumes 6–8 business days per monthly cycle. Three senior analysts extract data from three source systems — core banking, treasury, and card platforms — reconcile figures in Excel, and submit completed returns via the RBNZ Reporting Portal and the FMA Submission Gateway. The team misses its internal sign-off deadline on average once per quarter. The RBNZ relationship manager has been contacted twice for informal extensions. Senior analysts estimate they spend 40% of their time on extraction and reconciliation steps they believe could be automated.

The efficiency case for building an automated regulatory reporting pipeline is clear. However, the path to a production pipeline is bounded by a set of pre-existing regulatory disclosure and governance obligations that must be resolved before any automated pipeline produces or submits regulated figures. Two of these constraints are high-severity and require immediate compliance attention.

**First constraint — undisclosed normalisation methodology.** The team proposes to formalise an existing manual normalisation step into the pipeline as a permanent transformation layer. That normalisation was written in 2019 as an Excel macro by one senior analyst to correct rounding and timing mismatches introduced during the source system migration. Under RBNZ Prudential Reporting Standards s.2.2, any transformation, normalisation, or correction applied to source data before populating a return field constitutes a methodology adjustment requiring prior written RBNZ notification. The enterprise has applied this normalisation to every prudential return submitted since 2019. RBNZ has been receiving normalised figures without any notification that the raw source figures were adjusted upstream. This creates two obligations: (a) a section 2.1 notification must be filed before any pipeline encodes the normalisation; and (b) a section 2.2 historical self-disclosure must be filed because the institution is now aware it has been applying an unapproved methodology adjustment. Failure to self-disclose when the institution becomes aware may constitute a failure of the general disclosure obligation under s.93 of the Reserve Bank of New Zealand Act 2021.

**Second constraint — normalisation logic governance gap.** The normalisation macro exists only in an unreviewed Excel file maintained by one analyst. No independent review of its logic is on record. The analyst who wrote it is the only person who fully understands the correction rules. Under FMA Regulatory Returns Guide 2022 s.4.1, derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy FMA audit trail requirements — the FMA cannot verify the transformation log without a documented and controlled version of the rule applied. Under s.4.2, informal or undocumented logic being incorporated into an automated pipeline must be documented to independent reproduction precision, independently reviewed, governance-signed, and notified to both FMA and RBNZ before the formalised logic is used in any submitted return.

Encoding the macro as-is into the automated pipeline would not resolve these constraints — it would formalise them. A regulated automated pipeline running on single-author, unreviewed, undocumented derivation logic creates a position the enterprise cannot defensibly hold under a RBNZ supervisory review or FMA examination. The governance gap must be addressed as a precondition of activating the normalisation layer in production, not as a deferred parallel workstream.

The initiative has two layers that must be sequenced correctly:

1. **Operational automation (addresses the efficiency problem).** Automated extraction from source systems, reconciliation, audit trail logging, analyst review workflow, and RBNZ/FMA submission with human approval gate. This scope is achievable without the normalisation layer and can proceed to build immediately subject to regulatory notification obligations for the technology change.
2. **Normalisation governance resolution (pre-condition before the normalisation layer can go live).** Documentation of the macro logic, independent technical review, governance sign-off, and regulatory notification to both RBNZ and FMA. This is not a development task — it is a compliance and governance workstream that must run in parallel with the build and complete before the normalisation transformation engine is activated in any production submission.

---

## Who It Affects

**Finance operations analysts (primary users).** Currently spend 40% of their monthly cycle time on extraction and reconciliation. Under the automated pipeline model, their role shifts to reviewing pre-populated returns and exercising sign-off authority. Analyst review and approval before submission is non-negotiable — both operationally and under the FMA review-and-approval-log requirement (Regulatory Returns Guide 2022 s.2.1(c)).

**Compliance Officer (regulatory disclosure owner).** Responsible for filing: the RBNZ s.2.1 methodology notification for the normalisation; the RBNZ s.2.2 historical self-disclosure (and managing the s.93 Reserve Bank of New Zealand Act 2021 exposure); the BS11 s.4.2 technology change notification ≥30 business days before go-live; and the FMA s.4.2 methodology formalisation notification. The Compliance Officer is the sign-off authority for the normalisation governance gate — the normalisation layer may not be activated in production without their explicit written sign-off confirming all regulatory notification preconditions have been met.

**Finance Operations Manager (build sponsor and governance approver).** Business owner. Accountable for ensuring all compliance preconditions are met before engineering scope is committed. Must co-sign the normalisation logic governance approval per FMA s.4.2(c).

**CFO / Designated Finance Officer (statutory submitter).** Signs off every return before submission. RBNZ reporting default notices under s.3.1 are addressed to the CFO. Pipeline reliability and regulatory disclosure position directly affect the CFO's statutory exposure.

**Independent Technical Reviewer (governance role — to be appointed).** A person other than the original macro author, required by FMA s.4.2(b) to review the documented normalisation logic and confirm it accurately represents the calculation that has been applied to historical returns. This is a defined governance role — it is not a developer code review. If no qualified internal reviewer exists, external engagement is required before the normalisation layer can progress.

**RBNZ Relationship Manager (external).** Recipient of the s.2.1 methodology notification and the s.2.2 historical self-disclosure. Has tracked informal extension requests in supervisory records. The BS11 notification formally initiates the 30-business-day notification period.

**Treasury Operations (data provider).** TreasuryLedger does not offer a regulatory-data REST API in its vendor's standard offering (RRPL-RISK-001, HIGH). Treasury Operations must continue to provide manual CSV extracts and provide explicit per-cycle reporting-period confirmation as part of the ingestion workflow. Treasury API automation is out of scope for this release.

---

## Why Now

Three pressures have converged:

1. **Operational pain at threshold.** One missed deadline per quarter and two informal extension requests represent accumulated compliance risk. The compliance team is under pressure each cycle. A pipeline miss during a supervisory review period would carry elevated consequence, particularly given that the RBNZ relationship manager has already noted the extension history in supervisory records.

2. **Regulatory disclosure obligation is time-sensitive.** The enterprise is now aware that normalised figures have been submitted to RBNZ since 2019 without methodology notification. RBNZ s.2.2 requires self-disclosure. Every additional month of operation with a known undisclosed methodology adjustment worsens the s.93 exposure. Initiating the build without concurrently filing the disclosure would compound the position: it would signal to RBNZ (via the BS11 notification, which must reference the methodology change) that the enterprise is automating an undisclosed normalisation — a sequencing that would be difficult to explain in a supervisory context.

3. **Current process does not satisfy FMA audit trail requirements.** FMA expects a log of every transformation applied to source data, including the logic used, the version of that logic, who approved it, and when — producible within 5 business days. The current Excel-based process has no such log. The enterprise is operating outside this requirement every cycle. The pipeline is also the mechanism to remedy this gap, which gives the build additional regulatory urgency beyond the efficiency case.

---

## MVP Scope

The MVP delivers automated extraction, reconciliation, audit trail logging, and analyst review workflow — without the normalisation transformation layer, which is gated behind the governance preconditions in [BLOCKER — B1].

1. **Automated data extraction.** Read-only connections to CoreBanking-GL (RRPL-UP-001 REST API) and CardPlatform (RRPL-UP-003 REST API). TreasuryLedger data ingested via controlled manual CSV upload path (no vendor API available; manual path maintained for this release). All extractions timestamp-logged with source system version and extracting process identity.

2. **Automated reconciliation and return pre-population.** Field mapping, format validation, and pre-population of RBNZ and FMA return templates from extracted data. Reconciliation logic is limited to field-mapping and format derivation from approved source values — the normalisation transformation layer is excluded from this scope item and may not be activated in production until [BLOCKER — B1] is resolved and the compliance officer has filed the written sign-off record.

3. **Immutable audit trail.** Every transformation step logged to append-only PostgreSQL store with: source data version and extraction timestamp, transformation rule ID and version, approval record (approver identity and date), input and output values. Log is write-once after return submission. Retention: 7 years minimum from submission date. Export: full exportable log available within 5 business days of written RBNZ or FMA request (satisfying both RBNZ s.2.3(d) and FMA s.3.1 producibility obligations).

4. **Analyst review and approval workflow.** Pre-populated return file staged to Finance SharePoint (RRPL-AUD-002) for designated analyst review. Review comments, corrections, and final approval signature of the designated responsible officer captured per cycle. The submission pathway is gated on a complete, identity-attributed sign-off record — there is no automated submission pathway.

5. **RBNZ portal and FMA gateway submission.** Return dispatched to RBNZ Reporting Portal (RRPL-DN-001) and FMA Submission Gateway (RRPL-DN-002) only after sign-off record is complete. Submission confirmation (timestamp, reference number, submitter identity) logged in the audit trail.

6. **Deadline management.** Pipeline scheduled to complete extraction, pre-population, and staging for analyst review at least 3 business days before the RBNZ 20th-of-month deadline, providing an operational buffer.

**Compliance precondition (must be satisfied before go-live, not a build scope item):** BS11 s.4.2 technology change notification filed with RBNZ ≥30 business days before production deployment. Go-live date must account for this notification window.

---

## Out of Scope

- **Direct submission to RBNZ or FMA without analyst sign-off.** Analyst approval before submission is non-negotiable — both operationally required and mandated by FMA Regulatory Returns Guide 2022 s.2.1(c) (review and approval log). Any submission pathway without this gate is excluded.
- **Normalisation transformation layer in production before [BLOCKER — B1] preconditions are resolved.** The transformation engine may be developed and tested in UAT, but it may not be activated in production until: normalisation logic is documented to FMA s.4.2(a) precision; independent technical review is complete and signed off (FMA s.4.2(b)); governance sign-off from the responsible officer is obtained (FMA s.4.2(c)); FMA and RBNZ notifications have been filed (FMA s.4.2(d)); and the compliance officer has issued written production activation clearance. Deploying an unreviewed normalisation layer into a regulated return pipeline is excluded regardless of build completion status.
- **TreasuryLedger automated API extraction.** The vendor's standard offering does not include a regulatory-data REST API (RRPL-RISK-001, HIGH). Treasury data extraction via custom API development or vendor engagement is deferred to a future release.
- **Multi-regulator automated submission sequencing.** If RBNZ and FMA cycles overlap in the same month, the resolution of any sequencing conflict is a manual analyst decision. The pipeline does not implement automated cross-regulator submission scheduling.
- **Return form structure changes.** Changes to RBNZ or FMA prescribed return formats or field definitions are out of scope. The pipeline is built against the current return specifications.

---

## Assumptions and Risks

[ASSUMPTION] The RBNZ s.2.1 methodology notification and s.2.2 historical self-disclosure process timeline has not been assessed — the enterprise has not previously initiated a self-disclosure of this type to RBNZ. The time from filing to RBNZ acknowledgement could be weeks to months, and this timeline directly determines when the normalisation transformation layer can be activated in production. Unconfirmed; requires legal and compliance team to engage RBNZ before the normalisation layer scope can be committed.

[ASSUMPTION] The original macro author will remain available and cooperative through the FMA s.4.2(a) documentation phase. If the analyst leaves or is unavailable before the normalisation logic is documented to independent reproduction precision, the logic becomes irrecoverable. This is both a project risk and a pre-existing governance risk that should be treated as an immediate standalone action item, independent of the pipeline build decision.

[ASSUMPTION] An independent technical reviewer with sufficient finance systems and regulatory data processing expertise can be identified internally within the enterprise. FMA s.4.2(b) requires this reviewer to confirm that the documented logic accurately represents the calculation applied to historical returns — not merely to check code correctness. If no qualified internal reviewer exists, external engagement is required. Unconfirmed; resourcing must be confirmed before the normalisation governance workstream can be planned.

[ASSUMPTION] CoreBanking-GL and CardPlatform read-only REST APIs are stable, have documented integration specifications, and are available to new internal consumers. Technical feasibility must be validated with the respective platform teams before extraction layer design is committed.

**Risk 1 — BS11 notification window constrains go-live timing.** RBNZ BS11 s.4.2 requires at least 30 business days' advance notification before implementing a material change. Automating the regulatory reporting process is a material change. The project timeline must account for this window, which cannot begin until the notification is filed. If the BS11 notification is not filed promptly after build commences, the 30-business-day window will extend the go-live date beyond the minimum build timeline.

**Risk 2 — Independent review of normalisation logic may reveal discrepancies.** FMA s.4.2(b) requires an independent reviewer to confirm the documented normalisation logic accurately represents the calculation that has actually been applied to historical returns. If the independent review identifies discrepancies — e.g., that the macro logic does not match the enterprise's understanding of what was applied — a retroactive methodology review may be triggered by RBNZ. The scope, timeline, and regulatory consequence of a retroactive review are unknown at discovery stage and are a material risk to the overall project.

**Risk 3 — Supervisory sensitivity is elevated.** The RBNZ relationship manager has already noted the enterprise's informal extension history in supervisory records. Initiating the build and BS11 notification process while the s.2.2 self-disclosure is outstanding creates a sequencing question for the compliance team: the s.2.2 self-disclosure and the BS11 notification should be coordinated so the RBNZ receives a coherent and complete picture of the enterprise's position, rather than a technology notification that arrives before the methodology disclosure context.

---

## Directional Success Indicators

1. **Cycle time.** Monthly return cycle compressed from 6–8 business days to ≤2 business days of human review and sign-off time. Baseline: 6–8 business days (analyst-estimated). Target: ≤2 business days human time per monthly cycle. Measurement: audit log timestamps from extraction start to submission confirmation, cross-referenced with operator-reported cycle time.

2. **Submission deadline compliance.** Zero missed RBNZ internal sign-off deadlines per quarter; zero informal extension requests to RBNZ. Baseline: one missed deadline per quarter; two extension requests to date. Target: zero misses and zero extension requests in the four calendar quarters following production go-live. Measurement: audit log submission timestamps vs. RBNZ 20th-of-month deadline.

3. **Audit trail producibility.** Any RBNZ or FMA written request for audit trail for a return in the preceding 7 years satisfied within 5 business days in full exportable form. Baseline: current process has no automated audit log; producibility is unknown and presumed non-compliant. Target: 100% producibility rate within 5 business days. Measurement: pre-go-live producibility drill; annual retest thereafter.

4. **Normalisation governance gap closed before production activation.** Normalisation logic documented to FMA s.4.2(a) precision; independent technical review complete and signed; governance approval obtained; FMA and RBNZ notifications filed; compliance officer production activation clearance issued — all before the normalisation transformation layer is activated in any production submission. Baseline: zero governance controls on normalisation logic. Target: full FMA s.4.2 compliance evidenced before activation. Measurement: compliance officer checklist sign-off per s.4.2 steps.

5. **Regulatory disclosure obligations resolved before go-live.** RBNZ s.2.1 methodology notification filed and acknowledged; RBNZ s.2.2 historical self-disclosure filed; BS11 s.4.2 technology change notification filed ≥30 business days before production deployment; FMA s.4.2 normalisation formalisation notification filed. Baseline: none of these have been filed. Target: all five disclosure obligations met and documented before production go-live. Measurement: compliance officer records confirmed against each obligation.

---

## Constraints

**C1 — RBNZ Prudential Reporting Standards (regulatory)**
RBNZ monthly prudential returns must be submitted by the 20th calendar day of the following month. Missing the deadline constitutes a reporting default, triggers a written notice to the CFO, is recorded in supervisory records, and — if repeated three or more times in a rolling 12-month period — may trigger an unscheduled supervisory review. Any transformation, normalisation, or correction applied to source data before populating a return field is a methodology adjustment under s.2.2 requiring prior written RBNZ notification (s.2.1). The enterprise has been applying the normalisation adjustment since 2019 without notification — s.2.2 creates an explicit self-disclosure obligation now that the institution is aware of the gap. Failure to self-disclose may constitute a breach of the general disclosure obligation under s.93 of the Reserve Bank of New Zealand Act 2021. Automated reporting systems must apply only approved, documented, change-controlled derivation logic (s.2.3). BS11 s.4.2 requires ≥30 business days' advance notification before implementing any material change to a system that produces prudential returns — automation of the reporting pipeline is a material change. Where both a technology change and a methodology change occur, BS11 and s.2.1 notifications are independent obligations and both must be filed (s.4.3).

**C2 — FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 (regulatory)**
A complete audit trail must be maintained for every submitted return and must be producible within 5 business days of a written FMA request. The audit trail must include: source data log (extraction timestamp, system version, extracting process identity); transformation log (rule ID, rule version, exact logic sufficient for independent reproduction, approver identity, approval date, input and output values per return period); review and approval log (reviewer, comments/corrections, final approval signature of the designated responsible officer); submission confirmation (timestamp, FMA gateway reference number, submitter identity). Logs must be immutable (write-once or equivalent) and retained for a minimum of 7 years. Derivation logic — including Excel-based calculations and macros — must be subject to formal change management (s.4.1). Derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy FMA audit trail requirements. Informal or undocumented logic being incorporated into an automated pipeline must satisfy FMA s.4.2 preconditions before use in any submitted return.

**C3 — Human sign-off mandatory before submission (regulatory/operational)**
The designated analyst and responsible finance officer must review and approve every pre-populated return before it is submitted to RBNZ or FMA. There is no automated submission pathway. Sign-off must be identity-attributed and timestamped in the review and approval log. This constraint is non-negotiable — stated explicitly in the operator brief and reinforced by the FMA s.2.1(c) review and approval log requirement.

**C4 — Normalisation constitutes a material figure-derivation change (regulatory)**
Embedding the existing normalisation step into the automated pipeline as a transformation layer is a methodology adjustment under RBNZ s.2.2 (transformation applied to source data before populating a return field) and a material technology change under BS11 s.4.2 (automation of a previously manual process affecting reported figures meets the s.4.2(b) and s.4.2(d) material change thresholds). Both the RBNZ s.2.1 methodology notification and the BS11 technology change notification are required before the normalisation transformation layer can be activated in production. Neither notification has yet been filed. This constraint gates the normalisation layer activation — the layer may be built and tested in UAT, but may not go live until both notifications have been filed, the RBNZ notification period has elapsed, and the compliance officer has issued production activation clearance.

**C5 — Normalisation logic governance gap (hidden governance constraint)**
[BLOCKER — B1] The normalisation logic that the team proposes to formalise into the pipeline exists only as an unreviewed Excel macro written by one senior analyst in 2019. The analyst who wrote it is the only person who fully understands the correction rules. The macro has never been independently reviewed, has no change-control history, has no version record, and has no test verification. Under FMA Regulatory Returns Guide 2022 s.4.1, derivation logic that is not documented, not version-controlled, and not subject to independent review does not satisfy FMA audit trail requirements — because the FMA cannot verify the transformation log without a documented and controlled version of the rule that was applied. Under s.4.2, legacy informal logic — explicitly including analyst-maintained spreadsheet calculations — being incorporated into an automated pipeline must be: (a) documented with sufficient precision for independent reproduction; (b) subjected to independent technical review confirming the documented logic accurately represents the calculation applied to historical returns; (c) approved by a governance sign-off from the responsible officer; (d) notified to FMA and RBNZ before the formalised logic is used in any submitted return; and (e) retained alongside the formalised version for audit completeness. None of these preconditions are currently satisfied.

Encoding the macro as-is into the pipeline would not bring the normalisation logic into compliance — it would deploy a formally labelled but unreviewed and undocumented control into a regulated automated pathway. This creates a position indefensible under RBNZ supervisory review or FMA examination. Additionally, the single-author knowledge concentration represents a time-bounded governance risk: if the original analyst leaves the enterprise before the logic is documented to independent reproduction precision, the derivation basis for every prudential return submitted since 2019 becomes unverifiable — an irrecoverable audit trail gap. This risk exists regardless of whether the pipeline project proceeds, but the pipeline project makes it urgent because it creates an explicit decision point about whether to formalise unreviewed logic.

This constraint must be resolved through the FMA s.4.2 governance workstream as a precondition of activating the normalisation layer in production. It is not a build task — it is a compliance and governance obligation that runs in parallel with the engineering build.

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The RBNZ s.2.1 methodology notification and s.2.2 historical self-disclosure process timeline has not been assessed — the enterprise has not previously initiated a self-disclosure of this type to RBNZ.
- [ASSUMPTION] The original macro author will remain available and cooperative through the FMA s.4.2(a) documentation phase.
- [ASSUMPTION] An independent technical reviewer with sufficient finance systems and regulatory data processing expertise can be identified internally within the enterprise.
- [ASSUMPTION] CoreBanking-GL and CardPlatform read-only REST APIs are stable, have documented integration specifications, and are available to new internal consumers.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions will produce metrics that require revision after clarification.

---

## Attribution

**Contributors:**
- Finance Operations Team — problem owners and domain experts
- Compliance Officer — regulatory constraint holder (RBNZ and FMA obligations)
- EXP-008 eval operator — Config C, Story S8, 2026-05-17

**Reviewers:**
- Pending

**Approved By:**
- Approved (eval-mode — EXP-008-corpus-breadth-eval / Config C / S8)

---

<!-- CPF-TRACE
stage: /discovery
model: claude-sonnet-4-6
config: C
story: S8
experiment: EXP-008-corpus-breadth-eval

constraints_identified:
  - C1: RBNZ Prudential Reporting Standards — prescribed return formats and field definitions; monthly submission deadline 20th calendar day with reporting-default consequences (CFO notice, supervisory records, unscheduled review after 3 defaults in 12 months); s.2.2 any transformation/normalisation/correction applied to source data before populating a return field is a methodology adjustment requiring prior written RBNZ notification under s.2.1; institution may not self-certify materiality exemption; self-disclosure obligation for institutions that have been applying unapproved adjustments; failure to self-disclose may constitute s.93 Reserve Bank of New Zealand Act 2021 disclosure obligation breach; s.2.3 automated system requirements (approved change-controlled derivation logic; reconstruction-depth transformation log; 7-year retention; 5-business-day producibility to RBNZ; subject to BS11 IT governance); BS11 s.4.2 material change notification ≥30 business days before implementation (automation of previously manual normalisation step affecting reported figures explicitly meets material change threshold); s.4.3 BS11 and s.2.1 notifications are independent — both required when technology and methodology both change [operator brief: 20th-of-month deadline explicit, informal extensions noted, audit trail flagged as "non-negotiable"; follow-up context: RBNZ prior-approval requirement explicit, normalisation not disclosed to RBNZ; EA registry: RRPL-RISK-003 (RBNZ has been receiving normalised figures without notification), BS11 s.4.2 obligation and change control procedure; policy doc: full s.2/s.3/s.4]
  - C2: FMA Financial Reporting Act 2013 / Regulatory Returns Guide 2022 — complete audit trail: source data log (extraction timestamp, system version, extracting process identity), transformation log (rule ID, version, exact logic sufficient for independent reproduction, approver identity, approval date, input/output values per period), review and approval log (reviewer identity, corrections, final approval signature), submission confirmation (timestamp, reference number, submitter); s.2.2 immutable (write-once or equivalent) machine-readable logs; 7-year retention; s.3.1 5-business-day producibility obligation for any return in preceding 7 years; s.4.1 derivation logic including Excel-based calculations or macros must be subject to formal change management; undocumented/unversioned/unreviewed derivation logic does not satisfy FMA audit trail requirements; s.4.2 legacy informal logic formalisation preconditions [operator brief: "non-negotiable" audit trail requirement; follow-up context: FMA 5-business-day producibility explicit; EA registry: RRPL-AUD-001 PostgreSQL immutable audit log spec; policy doc: full FMA Part B including s.4.1 and s.4.2]
  - C3: Human sign-off mandatory before submission — designated analyst/finance officer approval required before any dispatch to RBNZ or FMA; no automated submission pathway permitted; sign-off must be identity-attributed and timestamped [operator brief: "Analysts retain sign-off authority — the pipeline does not submit directly to regulators without human review and approval" — explicit; reinforced by FMA s.2.1(c) review and approval log requirement]
  - C4: Normalisation constitutes a material figure-derivation methodology change — embedding the normalisation step into the automated pipeline is a methodology adjustment under RBNZ s.2.2 (transformation of source data before populating return fields) and a material technology change under BS11 s.4.2 (automation of previously manual process affecting reported figures meets both s.4.2(b) and s.4.2(d) thresholds); both s.2.1 methodology notification and BS11 technology change notification required before normalisation layer can go live; gates the second build phase [follow-up context: RBNZ prior-approval requirement not yet met; EA registry: RRPL-RISK-003 confirming normalisation not disclosed; policy doc: s.2.2 classification, s.4.2 notification requirement, s.4.3 independence of BS11 and s.2.1 notifications]
  - C5: [HIDDEN CONSTRAINT SURFACED] Normalisation logic governance gap — single-author 2019 Excel macro with no formal review, no change-control history, no version record, no test verification, comprehensibility concentrated in one person. FMA s.4.1 states explicitly that derivation logic not documented, not version-controlled, and not subject to independent review does not satisfy FMA audit trail requirements. FMA s.4.2 requires all five preconditions (documentation for independent reproduction, independent technical review, governance sign-off, FMA + RBNZ notification, legacy artefact retention) before formalised logic can be used in any submitted return. None are currently satisfied. Encoding the macro as-is into the pipeline deploys unreviewed single-author derivation logic into a regulated automated pathway — indefensible under RBNZ supervisory review or FMA examination. Single-author knowledge concentration creates a time-bounded irreversibility risk: if the original analyst leaves before documentation, all returns since 2019 become unverifiable. [Surfaced by compositional reasoning across: EA registry RRPL-RISK-002 (HIGH — normalisation exists only in a single-author Excel macro; no independent review on record; changes figures in regulatory returns) + FMA policy doc s.4.1 (Excel-based calculations and macros must be under formal change management; undocumented/unversioned/unreviewed logic fails audit trail requirements) + FMA s.4.2 (legacy informal logic — explicitly analyst-maintained spreadsheet calculations — formalisation preconditions) + follow-up context (Excel macro, one analyst 2019, no formal review, analyst is only person who fully understands correction rules)]

constraints_carried_forward:
  - C1: Problem Statement (RBNZ s.2.2 methodology adjustment obligation, self-disclosure, s.93 exposure); Why Now (disclosure clock rationale); Constraints section (full s.2.2, s.2.3, BS11 s.4.2, s.4.3 detail); Directional Success Indicators 2 and 5
  - C2: Problem Statement (FMA audit trail requirement not currently met, producibility gap); MVP Scope item 3 (immutable audit trail with full FMA s.2.1 components — source data log, transformation log with rule ID/version/logic/approver/input-output, review/approval log, submission confirmation; write-once; 5-business-day producibility); Constraints section (full FMA s.4.1, s.4.2 detail); Directional Success Indicator 3
  - C3: MVP Scope item 4 (analyst review and approval workflow, identity-attributed sign-off); Out of Scope (no direct submission without sign-off); MVP Scope intro (submission pathway gated on complete sign-off record)
  - C4: Problem Statement (normalisation as methodology adjustment under s.2.2, material change under BS11 s.4.2); Constraints section (both notifications required before normalisation layer can activate); MVP Scope (normalisation layer excluded from production until B1 resolved); Out of Scope (normalisation layer excluded); Directional Success Indicators 4 and 5
  - C5: Problem Statement (second layer — full normalisation governance gap treatment: single-author, no review, no change control, no test verification, indefensible supervisory position, time-bounded irreversibility risk); Who It Affects (Independent Technical Reviewer named as defined governance role per FMA s.4.2(b)); Constraints section [BLOCKER — B1] (full FMA s.4.1 and s.4.2 five-step precondition path); MVP Scope (normalisation layer gated, excluded from production until B1 resolved, compliance officer activation clearance required); Out of Scope (normalisation layer excluded until all s.4.2 preconditions met); Assumptions and Risks (ASSUMPTION re: macro author availability as standalone action item)

constraints_not_carried: none — all five constraints identified and carried forward through problem statement, scope, constraints section, and success indicators

c5_signal_sources:
  - ea_registry_injection: RRPL-RISK-002 (HIGH — normalisation transformation exists only in Excel macro, one analyst, no independent review on record; transformation changes figures appearing in regulatory returns)
  - policy_doc_injection: FMA s.4.1 (derivation logic not documented/versioned/independently reviewed fails FMA audit trail requirements; explicitly applies to Excel-based calculations or macros) + FMA s.4.2 (legacy informal logic — explicitly analyst-maintained spreadsheet calculations — formalisation preconditions: documentation, independent review, governance sign-off, FMA + RBNZ notification, legacy artefact retention)
  - follow_up_context: Excel macro written by one analyst 2019; no formal review; analyst is only person who fully understands correction rules
  - model_inference: time-bounded irreversibility risk framing (if original analyst leaves before documentation, all historical returns since 2019 become unverifiable — not stated in any injection source); deployment consequence framing (encoding converts historical informal practice into formally labelled but unreviewed control — indefensible distinction not directly stated in injection sources)

c5_surfaced: true
c5_surfacing_quality: full
c5_surfacing_quality_notes: >
  C5 surfaced as a named [BLOCKER — B1] with the full FMA s.4.1 and s.4.2 five-step
  precondition path explicitly cited and operationalised as a compliance officer
  production activation clearance gate. Held distinct from C4 (regulatory classification
  of normalisation as methodology change requiring RBNZ/FMA notification) so that the
  governance and control adequacy question (C5) is reasoned independently of the
  disclosure-and-notification question (C4). Three signal sources converge: EA registry
  RRPL-RISK-002 (HIGH severity), FMA policy doc s.4.1/s.4.2 (explicitly covers
  analyst-maintained spreadsheet calculations), and follow-up context (single analyst
  2019, no formal review). Two model-inferred elements extend beyond direct injection
  content: (a) the time-bounded irreversibility risk — if the original analyst leaves
  before documentation, all returns since 2019 become unverifiable; (b) the
  deployment-consequence framing — encoding the macro converts a historical informal
  practice into a formally labelled but unreviewed automated control, which is a
  qualitatively different and more exposed regulatory position.
-->

<!-- eval-mode: true -->
