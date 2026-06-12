# /discovery session — Legacy loan ledger decommission

I've read your context. This is a high-stakes, time-bound, heavily constrained migration — not an exploration of a new capability. Let me check for regulatory and reference context before we proceed.

---

## Step 0 — Regulatory and reference context check

You've mentioned:
- **RBNZ regulatory reporting** — I need to surface this early
- **7-year credit contract retention** (CCCFA)
- **NZ jurisdiction** (loan accounts, RBNZ relationship)

Before I ask clarifying questions, I want to flag **what your organisational context (context-regulated.yml) tells me this discovery must address:**

### Regulatory frameworks already in scope:

1. **RBNZ BS11 (Outsourcing/Material Systems Change)**
   - Migration or replacement of a core banking system is a *material change* under BS11
   - You must notify RBNZ **at least 30 business days before any irreversible project activity begins**
   - "Irreversible activity" includes starting data migration tooling, infrastructure provisioning, test data loads — not just go-live
   - Your 12-month vendor deadline does not trigger an exception to BS11; the 30-day window must be opened *before* you begin any preparation work
   - **Action:** If you haven't filed a BS11 notification with RBNZ yet, this must happen immediately upon project greenlight — not at go-live

2. **CCCFA (Credit Contracts and Consumer Finance Act 2003)**
   - Credit records must be retained for **7 years from the date the contract ends**, not from origination
   - Your legal team is correct — closed loan records migrated during this initiative must be preserved for the full retention period
   - **Risk:** If the legacy system is decommissioned before the retention clock expires on all closed contracts, you must have auditable proof that all records are preserved in the new platform
   - **Action:** Before decommissioning legacy infrastructure, you need a signed-off retention verification process

3. **RBNZ regulatory reporting** (the reports you mentioned)
   - Format, field definitions, and submission frequency are prescribed by RBNZ
   - Your RBNZ relationship team sign-off on report equivalence is not optional — it's a gate
   - **Action:** Before cutover, RBNZ must have formally confirmed that the new platform's reports meet RBNZ specifications

4. **SWIFT correspondent bank agreement** (if applicable)
   - If this new core platform will handle cross-border payment settlement or intra-group FX netting, the bilateral correspondent agreement with your clearing bank may require written notification before you route live transaction volume through the new platform
   - This is independent of RBNZ notification — both are required
   - **Action:** Before cutover, confirm with your Treasury team whether the correspondent bank agreement permits live routing through the new platform; if not, seek amendment or exception

---

## Clarifying questions before we scope

I have enough context to write a discovery artefact, but I need to confirm three things:

### **1. RBNZ notification status**

Have you already filed or opened a BS11 material change notification with RBNZ? Or does this discovery assume that notification will be filed as part of project initiation?

**Reply:** yes, already filed — or no, needs to happen at project greenlight — or uncertain, needs clarification

---

Once I have that answer, I'll ask two follow-ups about scope boundaries and then we'll move to the full discovery structure.