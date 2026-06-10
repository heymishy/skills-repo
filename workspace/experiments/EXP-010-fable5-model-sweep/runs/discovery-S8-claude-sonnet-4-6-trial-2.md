# Discovery Report: Automated Regulatory Reporting Pipeline

---

## Executive Summary

This pipeline addresses a well-defined operational problem with clear regulatory stakes. The core opportunity is sound: replacing manual extraction and reconciliation with an automated pipeline that pre-populates regulatory returns while preserving human sign-off authority. The audit trail requirement and the normalisation layer are the two areas that need the most rigorous design attention before build begins. Several clarifying questions must be resolved before a solution architecture can be finalised with confidence.

---

## 1. What We Are Actually Building

It is worth being precise about the scope boundary, because getting this wrong creates either over-engineering or a compliance gap.

The pipeline is **a data preparation and staging tool, not a regulatory submission tool.** The output is a reviewed and approved file that a human analyst then submits. This distinction matters for how you design the approval workflow, how you characterise the system to regulators, and where liability sits if a submitted figure is later queried.

The three functional layers are:

1. **Extraction** — read-only API connections to core banking, treasury, and card platforms pulling defined field sets on a scheduled basis
2. **Transformation** — reconciliation logic and the normalisation layer applied to extracted data, with every step logged
3. **Staging and review** — pre-populated return presented to analysts for review, challenge, and approval before any submission action

The normalisation layer deserves specific framing: you are codifying existing manual judgment into deterministic rules. That is a sensible goal, but it carries an obligation to document the rules with the same precision you would apply to the returns themselves. If an RBNZ examiner asks why a figure was adjusted, "the system did it" is not an acceptable answer. "The system applied rule N-04, which corrects a known timing mismatch in core banking field CB-1173 introduced during the 2019 migration, as documented in our transformation register" is.

---

## 2. What Is Well-Understood

The following are sufficiently clear to proceed with design decisions:

**The submission schedule is fixed and unambiguous.** The 20th of each month for RBNZ prudential returns is a hard external constraint. Your internal sign-off deadline exists to give buffer before the 20th. The pipeline should be designed around working backwards from the 20th with explicit buffer days built in, not around replicating the existing 6–8 day cycle.

**The three source systems are known.** Core banking, treasury, and card platforms are identified. Read-only API access is the intended integration pattern, which is the right choice — it eliminates any risk of the pipeline writing back to source systems and simplifies security review.

**Analysts retain approval authority.** This is clearly stated and should be treated as a design constraint, not a variable. The pipeline does not submit. It prepares. An analyst approves. A human submits. This sequence should be enforced technically, not just by policy.

**The audit trail is non-negotiable.** Both regulators require source-to-submission traceability. This means the audit trail is not a reporting feature you add at the end — it is a first-class output of the pipeline that needs to be designed in from the beginning.

**The normalisation rules are currently implicit.** They exist as analyst knowledge and Excel steps. Part of the project work is making them explicit, documented, and reviewable before they are encoded.

---

## 3. Critical Gaps That Must Be Resolved

The following questions are not edge cases. They affect fundamental design decisions.

---

### 3.1 API Readiness of the Three Source Systems

**The question:** Do all three source systems currently expose stable, documented, read-only APIs that return the specific fields required for the regulatory returns? Or is API access assumed or aspirational?

**Why it matters:** If any source system requires a custom API build, a database query workaround, or a file-based extract as a substitute, the integration complexity and timeline change materially. A flat-file extract from a legacy system is not the same as an API connection — it introduces its own reconciliation and freshness questions.

**What you need to find out:** For each of the three systems, confirm whether an API exists today, who owns it, whether it requires authentication changes to grant the pipeline read access, what the field coverage is against the regulatory return requirements, and what the SLA is for data availability after month-end close.

---

### 3.2 The Completeness and Precision of the Normalisation Rules

**The question:** Have the normalisation rules been fully documented in a form that can be reviewed, challenged, and encoded as deterministic logic? Or do they currently exist as analyst judgment applied case by case?

**Why it matters:** If the rules are not fully explicit, you cannot build a transformation layer — you can only build a partial one, which is potentially more dangerous than the manual process because it creates an illusion of completeness. Encoding incomplete or ambiguous rules also means the first time an edge case appears, the pipeline will either produce a wrong figure silently or require manual intervention that defeats the purpose.

**What you need to find out:** Ask the senior analysts to walk through every normalisation step they currently apply, document each one as a discrete rule with inputs, logic, and output, identify any steps where they exercise judgment rather than applying a fixed formula, and determine whether those judgment-based steps can be converted to rules or whether they require a different handling pathway.

**A specific risk to flag:** The 2019 migration artefacts are described as rounding differences and timing mismatches. These are not the same problem. Rounding differences are typically deterministic and encodable. Timing mismatches may depend on which period a transaction is attributed to, which can vary. If the timing mismatch correction involves any period-attribution logic, that logic needs explicit regulatory defensibility review before it is automated.

---

### 3.3 Regulatory Acceptance of Automated Transformation

**The question:** Have RBNZ and FMA been informed or consulted about the intent to automate the data preparation process, including the normalisation layer? Is there any requirement to notify or seek acceptance from either regulator before changing how returns are prepared?

**Why it matters:** The obligation to submit accurate returns sits with the regulated entity regardless of how the returns are prepared. However, some regulators take a view on material changes to internal reporting processes, particularly where automated transformation is applied to submitted figures. Given that RBNZ has already been informally engaged twice about deadline pressures, your relationship manager may already have a view on what, if anything, needs to be disclosed.

**What you need to find out:** Check your current regulatory reporting obligations and any undertakings made to RBNZ or FMA about your reporting methodology. Confirm with your compliance team whether the introduction of an automated transformation layer, specifically the normalisation step, constitutes a material change that requires notification. This is not a build decision — it is a compliance and legal decision that should be made before the build begins.

---

### 3.4 The Approval Workflow Design

**The question:** Who approves the pre-populated return, under what conditions, and what happens when an analyst disagrees with a pipeline-generated figure?

**Why it matters:** The pipeline produces a pre-populated return. An analyst reviews it. But the review step needs to be more specifically designed than "analyst looks at it and approves." If an analyst identifies a figure they believe is wrong, what is the process? Can they override a transformation? If they override, how is that recorded in the audit trail? Can they submit an override without escalation? Is there a second-reviewer requirement for overrides?

**What you need to find out:** Map the current approval process, including who has sign-off authority, what the escalation path is for disputed figures, and whether the existing internal sign-off deadline is governed by policy or by a specific control framework. The pipeline approval workflow needs to replicate or improve on this — it cannot simply replace the final email chain with a button.

---

### 3.5 The FMA Quarterly Returns

**The question:** The problem statement focuses primarily on the RBNZ monthly cycle. What is the scope for the FMA quarterly returns, and are they in scope for the initial build?

**Why it matters:** The 40% time estimate and the deadline miss frequency both reference the monthly RBNZ cycle. The FMA quarterly returns may have different data requirements, different field mappings, different reconciliation logic, and a different submission mechanism. Building for both in parallel increases complexity. Building for RBNZ first and FMA second is a reasonable phasing decision, but it should be an explicit decision rather than an assumption.

**What you need to find out:** Confirm whether FMA returns are in scope for the initial build. If yes, identify whether the data requirements overlap substantially with the RBNZ returns or are largely distinct. If the overlap is high, building both together may be efficient. If the overlap is low, phasing is almost certainly the right approach.

---

### 3.6 The Audit Trail Implementation

**The question:** What specific form must the audit trail take to satisfy both RBNZ and FMA traceability requirements, and who has confirmed this?

**Why it matters:** "Complete audit trail of every transformation" is a requirement, but requirements need to be specified before they can be built. An audit trail could mean an immutable log file, a queryable database table, a human-readable PDF report attached to each submission package, or all three. The format, retention period, access controls, and the ability to produce the trail on demand during a supervisory review all need to be defined.

**What you need to find out:** Ask your compliance team to specify the audit trail requirements in functional terms: what must be traceable, to what level of granularity, in what format, for how long, accessible by whom, and producible within what timeframe if a regulator requests it. This specification should be reviewed by someone with direct knowledge of RBNZ and FMA examination expectations before it is used as a build requirement.

---

## 4. Risks Worth Naming Explicitly

**The normalisation layer as a permanent fixture.** Encoding the 2019 migration artefact corrections as a permanent transformation layer is described as eliminating a manual step. It is worth considering whether "permanent" is the right framing. If the underlying source system data is ever cleaned or migrated again, a permanent normalisation layer could over-correct. The layer should have explicit review triggers — system upgrades, platform migrations, audit findings — rather than being treated as set-and-forget.

**The 40% time estimate.** Analysts estimate 40% of their time goes to extractable and reconcilable steps. This estimate is valuable for prioritisation but should not be taken as a guarantee of capacity recovery. Automated pipelines frequently reveal data quality issues that were previously absorbed silently by experienced analysts. There may be a period post-implementation where analyst time on the pipeline is higher than expected before it stabilises.

**Single points of failure in the schedule.** If the pipeline fails on the 18th of the month, you have two days to resolve it before the RBNZ submission deadline. The existing 6–8 day manual process gives some recovery time by distributing work. The pipeline concentrates risk into the execution window. Failure handling, alerting, and a documented manual fallback process need to be part of the design, not afterthoughts.

**Analyst deskilling over time.** If analysts spend three years approving pre-populated returns without doing the extraction and reconciliation manually, their ability to detect a plausible-but-wrong pipeline output will degrade. This is a known risk in automated regulatory processes and worth building mitigations into the operating model — periodic manual spot-checks, rotation of the review responsibility, and explicit training on what the pipeline is doing and why.

---

## 5. Recommended Next Steps

Sequenced in order of dependency:

1. **Conduct API readiness interviews** with the owners of all three source systems. Produce a field coverage matrix against the regulatory return requirements. This single step will determine whether the project is feasible on the assumed timeline.

2. **Run a normalisation rule extraction workshop** with the senior analysts. Document every current normalisation step. Classify each as deterministic (encodable), judgment-based (needs a decision on handling), or ambiguous (needs further investigation). Do not begin design of the transformation layer until this is complete.

3. **Obtain a compliance determination** on whether the normalisation layer constitutes a material change requiring regulatory notification. This is a short, specific question for your compliance team and legal counsel. It should not be deferred.

4. **Specify the audit trail requirements** in functional terms with the compliance team. This specification should be written before the pipeline architecture is finalised because the audit trail affects how transformation steps are logged throughout the entire pipeline.

5. **Make an explicit scope decision on FMA quarterly returns.** Document the decision and the rationale. If phasing, define what the phase-two trigger is.

6. **Design the analyst approval workflow** including override handling, escalation paths, and the technical mechanism for recording approvals as part of the submission audit trail.

None of these steps require any build work. They are all discovery and definition work that will either confirm the project is ready to move into design or surface issues that, if left unresolved, will create expensive rework later.

---

## 6. What This Project Is Not

It is worth being direct about one framing risk in the current problem statement. The project is described partly in terms of reducing analyst time and eliminating manual steps. Both are valid outcomes. But for a regulatory reporting pipeline, the primary design objective should be **accuracy and traceability of submitted figures**, with efficiency as a consequence of a well-designed system rather than the primary goal.

A pipeline that submits faster but produces figures an analyst cannot fully explain to a regulator is worse than the current manual process. The approval step, the audit trail, and the normalisation documentation are not compliance overhead added to an efficiency project — they are the project's core deliverables.

---

*Discovery complete. Build should not commence until the six gap areas in Section 3 have been resolved and documented.*