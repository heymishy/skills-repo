Thank you for the detailed description of your current state, desired future state, and requirements for an automated regulatory reporting pipeline. Based on the information provided, here’s a structured synthesis to move forward with process discovery and solution evaluation:

---

## 1. **Current State Mapping**

**Stakeholders Involved**
- **Senior Analysts (3):** Manually extract, reconcile, normalise, prepare, and review reports.
- **Compliance Team:** Monitors sign-off, ensures audit readiness.
- **RBNZ & FMA Relationship:** Regulatory oversight.

**Current Systems**
- **Core banking system**
- **Treasury platform**
- **Card platform**

**Process Steps**
1. Data extraction (manual) from 3 systems.
2. Manual reconciliation (Excel).
3. Manual normalisation (fixing legacy artefacts).
4. Compilation/preparation of regulatory returns.
5. Upload via RBNZ & FMA online portals.
6. Analyst review and sign-off.

**Pain Points**
- 6–8 day cycle time per month.
- Consistent deadline pressure, frequent missed internal deadlines.
- Occasional need for extension requests.
- 40% of analyst time spent on repetitive tasks (extract/reconcile).
- Manual normalisation prone to error, introduces risk.
- Audit trail requirements met manually (risk of gaps).

---

## 2. **Target State and High-Level Requirements**

**Automated Pipeline Goals**
- Connect to 3 source systems via **read-only APIs**.
- Automate **data extraction** and **reconciliation**.
- Incorporate **formalised normalisation logic** (legacy artefacts handling).
- Output pre-populated return files for analyst review.
- **Human-in-the-loop** sign-off & submission.
- Generate a **complete, transparent audit trail** at every stage.
- Meet RBNZ (monthly, by 20th) and FMA (quarterly) deadlines without exception.

**Non-Negotiables**
- **Auditability:** Every transformation logged, versioned, explainable.
- **Security:** Read-only access, no direct submission to regulator.
- **Accuracy:** No loss of fidelity in data/logic transformation.

---

## 3. **Key Discovery Questions & Considerations**

To progress to solution architecture, we need to clarify:

### **Data & System Integration**
- **API Readiness:** Are all three source systems capable of providing the required fields via stable read-only APIs? Are there documented API specs?
- **Data Mapping:** Is a source-to-return data mapping already defined? If not, who owns this?
- **Frequency & Volume:** Are there any limitations on extraction time/day or data volumes?

### **Normalisation Logic**
- **Documentation:** Is the manual normalisation process fully codified, or is it tribal knowledge? (e.g., specific known rounding/timing artefacts per source)
- **Change Control:** Will normalisation logic require ongoing updates, and how will revisions be governed and tested?

### **Audit Trail**
- **Attribute Logging:** What audit details are needed (user, data version, timestamp, transformation performed)?
- **Data Lineage Tools:** Preference for standard data lineage tooling vs. custom audit logs?
- **Retention:** How long must audit data be stored?

### **Other**
- **Security & Access Control:** Who will have access to the pipeline, monitoring, and logs?
- **Business Continuity:** Fallback plan if pipeline is down near deadline?
- **Exception Handling:** Criteria/process for pipeline-flagged exceptions needing analyst review/correction.

---

## 4. **Sample Future-State Pipeline**

1. **Data Extraction Layer**  
   - Connect to all sources via secure APIs.
   - Extract only required fields, log extraction metadata.

2. **Transformation/Normalisation Layer**  
   - Apply codified reconciliation and normalisation logic.
   - Version and log all transformations.

3. **Audit & Lineage Layer**  
   - Record complete data flow, from raw extraction ➔ final output.
   - Allow analysts/regulators to view transformation history for any figure.

4. **Review & Sign-off Module**  
   - Analysts review pre-populated return.
   - Workflow for approvals, with electronic sign-off and comments as needed.

5. **Export & Submission**  
   - Generate output in regulator-prescribed format.
   - Analysts upload via existing portals (human-in-the-loop).

6. **Monitoring & Alerts**  
   - Proactive notifications of pipeline exceptions, data anomalies, or missed SLAs.

---

## 5. **Benefits & Expected Outcomes**

- Reduction of report preparation time (likely >40% time savings).
- Increase in deadline reliability and compliance confidence.
- Decreased analyst fatigue and error rates.
- Full, regulator-compliant audit and traceability.
- Operational resilience—analysts focus on review, not data wrangling.

---

## 6. **Risks & Dependencies**

- **Source system API dependency**
- **Accuracy of codified normalisation logic** (requires detailed knowledge transfer)
- **Change management** (analyst training, trust in new process)
- **Robustness of audit functionality** (regulator inspection-readiness)

---

## 7. **Recommended Next Steps**

1. **Discovery Workshops:**  
   - Detailed as-is process mapping with analysts.
   - Walkthrough of normalisation logic with examples.
   - Define data mapping and reconciliation edge cases.

2. **System Assessment:**  
   - Verify API access for all data sources.
   - Assess existing audit trail capabilities/tools.

3. **Initial Solution Design:**  
   - Draft architecture with placeholders for each pipeline component.
   - Identify build vs. buy opportunities for ETL, audit trail, data lineage.

4. **Proof of Concept:**  
   - Prototype extraction & reconciliation for one source system.
   - Demonstrate audit trail output for sample data.

5. **Iterative Build:**  
   - Full pipeline buildout.
   - UAT and compliance sign-off before production.

---

Does this summary capture your key challenges and requirements?  
Which area would you like to deep-dive into first (API integration, process mapping, audit trail, etc.)?  
Would it be useful to draft preliminary user stories or requirements for the pipeline stages?