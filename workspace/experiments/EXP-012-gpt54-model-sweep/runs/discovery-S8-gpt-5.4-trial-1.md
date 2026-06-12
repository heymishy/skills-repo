Below is the /discovery output for the opportunity described.

```yaml
discovery:
  title: "Automated regulatory reporting pipeline for RBNZ prudential and FMA quarterly returns"
  one_liner: "Automate extraction, normalisation, reconciliation, and return pre-population for regulatory reporting while preserving analyst review and full audit traceability."

  summary:
    current_state: "Three senior analysts manually extract data from core banking, treasury, and card platforms, reconcile figures in Excel, apply manual normalisation corrections, and upload completed returns to the RBNZ Reporting Portal and FMA gateway."
    problem: "The process takes 6–8 business days per monthly cycle, consumes substantial senior analyst capacity, creates recurring deadline pressure, and has already resulted in informal extension requests to RBNZ."
    proposed_state: "A read-only API-based pipeline automatically extracts required fields, applies formalised normalisation logic and reconciliation rules, generates a pre-populated return file, and records a complete audit trail for analyst review and approval prior to submission."

  business_context:
    industry: "Financial services / banking"
    function: "Finance operations, regulatory reporting, compliance"
    stakeholders:
      - "Senior analysts"
      - "Finance operations team"
      - "Compliance team"
      - "RBNZ relationship management / prudential supervision"
      - "FMA reporting stakeholders"
      - "Technology / data engineering teams"
    regulatory_bodies:
      - "Reserve Bank of New Zealand (RBNZ)"
      - "Financial Markets Authority (FMA)"

  process_snapshot:
    frequency:
      monthly: "RBNZ prudential returns"
      quarterly: "FMA regulatory reports"
    current_cycle_time_business_days: "6–8"
    systems_in_scope:
      - "Core banking system"
      - "Treasury platform"
      - "Card platform"
    current_tools:
      - "Excel"
      - "RBNZ Reporting Portal"
      - "FMA online submission gateway"
    human_controls:
      - "Analyst review before submission"
      - "Analyst sign-off authority retained"

  pains_and_risks:
    pains:
      - "High manual effort from senior analysts"
      - "Repeated extraction and reconciliation work across multiple systems"
      - "Manual Excel-based reconciliation is time-consuming and brittle"
      - "Manual normalisation step introduces operational friction"
      - "Internal sign-off deadline missed on average once per quarter"
      - "Compliance team experiences deadline pressure"
    risks:
      - "Regulatory submission deadline miss may attract formal RBNZ notice"
      - "Late submission may trigger unscheduled supervisory review"
      - "Manual correction steps increase risk of analyst error"
      - "Insufficient traceability would fail regulator expectations"
      - "Legacy migration artefacts create persistent data quality issues"

  quantified_signals:
    analyst_count: 3
    monthly_cycle_time_days:
      min: 6
      max: 8
    internal_deadline_miss_rate: "Approximately once per quarter"
    informal_extensions_requested_from_rbnz: 2
    analyst_time_on_automatable_steps_percent: 40

  opportunity:
    type: "Regulatory reporting automation with human-in-the-loop approval"
    key_capabilities:
      - "Read-only API integration to source systems"
      - "Automated extraction of required reporting fields"
      - "Formalised transformation / normalisation layer"
      - "Automated reconciliation logic"
      - "Pre-populated return generation"
      - "End-to-end audit trail and lineage"
      - "Analyst review and approval workflow"
    in_scope:
      - "Data extraction from three source systems"
      - "Transformation and normalisation of legacy artefacts"
      - "Reconciliation automation"
      - "Return file generation for RBNZ and FMA reporting"
      - "Audit logging and traceability"
    out_of_scope:
      - "Fully autonomous regulator submission without human approval"
      - "Changing regulatory filing obligations"
      - "Source system remediation of 2019 migration artefacts"

  decisioning_and_human_judgement:
    human_in_the_loop: true
    human_decisions:
      - "Review pre-populated return outputs"
      - "Approve/sign off before submission"
      - "Investigate exceptions or reconciliation breaks"
    automated_decisions:
      - "Apply predefined extraction rules"
      - "Apply formalised normalisation transformations"
      - "Execute reconciliation logic"
      - "Populate return templates/files"

  data_and_transformation:
    source_systems:
      - name: "Core banking"
        access: "Read-only API"
      - name: "Treasury"
        access: "Read-only API"
      - name: "Card platform"
        access: "Read-only API"
    transformation_requirements:
      - "Normalise legacy rounding differences"
      - "Correct timing mismatches originating from 2019 migration"
      - "Preserve explainability of every adjustment"
    lineage_requirement: "Every submitted figure must be traceable back to source data with all intermediate transformations and adjustments recorded."

  compliance_and_controls:
    non_negotiable_requirements:
      - "Complete audit trail of every transformation applied before return generation"
      - "Traceability from submitted figure to source data"
      - "Explainability of all adjustments"
      - "Human review and approval before submission"
    submission_deadlines:
      rbnz: "20th of each month for prior month"
    consequences_of_failure:
      - "Formal notice from RBNZ"
      - "Potential unscheduled supervisory review"

  value_hypotheses:
    efficiency:
      - "Reduce manual extraction and reconciliation effort"
      - "Free senior analysts from approximately 40% automatable work"
      - "Shorten reporting cycle duration"
    risk_reduction:
      - "Lower probability of internal sign-off deadline misses"
      - "Reduce analyst error in normalisation and reconciliation"
      - "Improve compliance posture through stronger auditability"
    control_improvement:
      - "Standardise transformation logic"
      - "Improve repeatability and evidencing for regulators"

  likely_success_metrics:
    operational:
      - "Monthly reporting cycle time reduced from 6–8 business days"
      - "Reduction in analyst hours spent on extraction/reconciliation"
      - "Reduction in deadline misses"
    control:
      - "100% traceability for submitted figures"
      - "Audit logs available for all transformations"
      - "Exception rates and unresolved reconciliation items tracked"
    regulatory:
      - "Zero late RBNZ submissions"
      - "No extension requests"
      - "Faster response to regulator queries"

  delivery_considerations:
    dependencies:
      - "API availability and reliability from all three source systems"
      - "Clear mapping of required regulatory fields"
      - "Codification of existing analyst normalisation logic"
      - "Agreement on audit trail design and retention"
      - "Template/file format requirements for RBNZ and FMA returns"
    implementation_risks:
      - "Implicit analyst knowledge may be hard to fully codify"
      - "Legacy data issues may surface edge cases during automation"
      - "Audit trail may be inadequate if lineage is not designed upfront"
      - "Return formats or regulator requirements may change"
    change_management:
      - "Analysts need confidence in automated outputs"
      - "Parallel run period likely required against manual process"
      - "Approval workflow should preserve existing accountability"

  discovery_assessment:
    problem_clarity: "High"
    business_impact: "High"
    regulatory_criticality: "High"
    automation_feasibility: "Medium-High"
    control_requirements_complexity: "High"
    overall_discovery_signal: "Strong candidate for automation, provided auditability and codification of normalisation logic are addressed from the outset."

  recommended_next_questions:
    - "What exact RBNZ and FMA return templates, schemas, and submission file formats are in scope?"
    - "What are the current reconciliation rules and exception thresholds used by analysts?"
    - "How is the normalisation logic currently documented, if at all?"
    - "What source-level keys and timestamps are available to support lineage and timing mismatch correction?"
    - "What evidence format does compliance require for audit trail review?"
    - "What volume of exceptions typically remains after manual reconciliation?"
    - "Are there any fields that still require judgement-based adjustments rather than deterministic rules?"
    - "What are the API constraints, refresh cadences, and access controls for each source system?"
    - "How long must audit records be retained for regulatory purposes?"
    - "What internal sign-off workflow and segregation-of-duties controls must be preserved?"
```

If useful, I can also convert this into:
1. a problem statement,
2. a business case,
3. a PRD-ready discovery brief, or
4. an AI/Digital suitability assessment.