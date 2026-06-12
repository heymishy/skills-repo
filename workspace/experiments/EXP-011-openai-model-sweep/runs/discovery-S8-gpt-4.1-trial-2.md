Thank you for this comprehensive description of your current regulatory reporting process and your objectives for automation. Below is a summary of your current pain points, solution vision, and key requirements, as well as some potential next steps and discovery-focused clarifying questions.

---

## 1. **Current State – Pain Points**

**Process:**
- Data extracted separately from core banking, treasury, and card platforms  
- Three senior analysts manually reconcile and normalise data in Excel  
- Manual population of RBNZ and FMA returns  
- Submissions occur via respective online portals  
- Entire process takes 6–8 business days/month  
- Occasional missed deadlines, creating compliance pressure (including requests for submission extensions)

**Key Issues:**
- 40% of analyst time spent on extraction and reconciliation
- Manual steps are slow and error-prone, especially normalisation to resolve legacy system artefacts
- Incomplete audit trail, increasing risk for regulatory review

---

## 2. **Target State – Solution Vision**

**The Automated Pipeline Will:**
- Connect to all three source systems (core banking, treasury, card) via read-only APIs
- Extract all required data fields automatically
- Apply standardised reconciliation logic  
- Apply a formalised, permanent normalisation transformation layer (to handle legacy data artefacts)  
- Output pre-populated returns for analyst review (human approval before regulatory submission)
- Create a complete, immutable audit trail of all transformations/adjustments, to meet RBNZ and FMA traceability requirements

---

## 3. **Key Requirements**

| Requirement                                  | Description                                                                                      |
|-----------------------------------------------|--------------------------------------------------------------------------------------------------|
| API connectivity                             | Secure, read-only extraction from legacy and modern source systems                               |
| Data mapping & transformation                | Configurable mapping, reconciliation logic, and formalised normalisation routines                |
| Auditability & traceability                  | Full audit trail of all data transformations, adjustments, and user activities                   |
| Human review, not auto-submission            | Analysts retain authority to review/approve returns before submission                            |
| Compliance with monthly/quarterly deadlines  | Outputs must be available in time for sign-off and official submission without deadline miss     |

---

## 4. **Discovery Questions & Next Steps**

To progress to formal solution design, some clarification may be useful:

### **a. Source Systems & Integration**
- Are the three systems currently capable of supplying the needed data via APIs, or will API development be required (especially for older/legacy or 3rd-party systems)?
- Are there any access limitations, permission boundaries, or data privacy considerations that will impact extraction?

### **b. Data Mapping and Normalisation**
- Can your analysts currently document (or have they already documented) the reconciliation and normalisation logic — including all edge cases from the legacy artefacts?
- Are there change management implications if normalisation rules need to be updated periodically (e.g., due to regulatory changes)?

### **c. Audit Trail Details**
- What is the preferred mechanism for audit logging – e.g., database audit tables, versioned data lake, or file-based audit logs?
- Are you required to retain audit information for a certain period, or is it only upon request? Should the system support easy retrieval for ad hoc regulatory audits?

### **d. Output & User Experience**
- What file formats do the RBNZ/FMA portals accept (e.g., Excel, XML, CSV, XBRL), and should the pipeline output be formatted identically?
- Will analysts need a dashboard/UI to review and approve the returns, view audit logs, and make minor corrections?

### **e. Security & Compliance**
- Who will own system administration, and how should access to sensitive data and pipeline logs be governed?
- Are there internal or external security standards (e.g., ISO 27001) that must be reflected in the pipeline architecture?

### **f. Timing, Phased Delivery, and Change Management**
- Is a phased approach acceptable (e.g., automate certain returns or source systems first), or must all components launch together?
- What is your target go-live timeline, given compliance risk and resourcing?

---

## 5. **Potential Benefits**

- Reduce cycle time from 6–8 days to potentially 2–3 by automating extraction, reconciliation, and normalisation  
- Slash manual error risk and standardise compliance with RBNZ/FMA requirements  
- Allow reallocation of up to 40% of senior analysts' time to higher-value activities  
- Strengthen defensibility in regulatory scrutiny by producing robust, transparent audit logs

---

## 6. **Risks & Considerations**

- If API connectivity proves difficult, integration timelines may extend
- Normalisation logic must be codified with precision; poor translation of business rules may force analysts back “onto Excel”
- The audit trail must strike a balance between detail and usability for fast troubleshooting
- User adoption: user testing and clear feedback loops will be key to achieving full confidence from analysts

---

## **Next Steps**

1. **Workshop with Analysts:** To map current manual steps and codify all normalisation logic and edge cases
2. **Technical Deep Dive:** With IT/infrastructure team to assess API readiness and security considerations
3. **Regulator Engagement:** Validate proposed audit trail approach with compliance team/regulatory liaison
4. **Solution Prototyping:** Identify or shortlist technology stack/platform for pipeline build

---

If you’re ready, I can help develop a high-level architecture diagram, an initial requirements document, or draft a sample functional specification for the automated pipeline.

**Let me know which next step would be most helpful, or if you would like assistance prioritising requirements or preparing for discovery workshops.**