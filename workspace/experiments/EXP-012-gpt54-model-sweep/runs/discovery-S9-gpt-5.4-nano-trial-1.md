## /discovery — Delivery & Solution Outline (Fund Switch via Member Portal)

### 1) Objective & “board-critical” delivery constraint
**Primary success criteria:** be able to submit a fund-switch instruction via the member portal and have it **committed to the unit registry on the same business day** where possible, with the **board-defined delivery date of 31 March (3pm cut-off)** for same-period (same unit price date) processing.

**Non-negotiable:**  
- Go-live must occur **before 31 March 3pm** so members can switch and have the instruction captured for the correct unit price period.  
- Confirmation should include an **estimated processing date** (and ideally whether the switch is “in time for 31 March processing” based on submission timestamp).

---

### 2) Proposed member journey (what the portal does)
**Member selects target fund → confirms switch → submits instruction → receives confirmation**

Key portal behaviors:
1. **Eligibility check in the moment** (returns “auto-switch available” vs “manual review”).
2. **Submission timestamp captured** at the moment of request (timezone + cut-off logic).
3. **Immediate acknowledgement**:
   - “We’ve received your switch request at HH:MM on DD/MM/YYYY.”
   - “Estimated processing: [date]”
   - “Submitted before/after the 31 March 3pm cut-off (if applicable).”
4. Provide **reference number** and audit trail link (where appropriate).

---

### 3) Operational / systems behavior (what “instant where possible” means)
To meet the board requirement, the portal submission must reliably result in:

- **Same-business-day commit to the unit registry** (or equivalent canonical data store / ledger interface), *when eligible and no exception flags are triggered*.
- If the unit registry cannot be updated until an external batch window, then “instant where possible” becomes:
  - commit to an **instruction queue** by a defined cutoff, and
  - the queue is **picked up and written to the unit registry on the same business day**.

**Critical capability:** deterministic cut-off handling (especially for 31 March at 3pm):
- If submitted **before cut-off** on a business day → eligible for “same-period processing”
- If submitted **after cut-off** → next-period processing

---

### 4) Eligibility & edge cases (scoped approach)
You indicated several edge cases likely handled manually today. Discovery suggests implementing an **eligibility engine** with explicit exception pathways.

**Minimum exception flags to support upfront:**
- Very recently joined members
- Members on **contributions holiday**
- Members with **active hardship applications**

**Pattern:**
- Portal performs a quick eligibility check:
  - If “eligible for online switching” → execute online path + registry commit.
  - If “ineligible/needs review” → show message:
    - “Your request requires manual processing”
    - “We will contact/track via existing operational workflow”
    - (Optionally) “estimated timeline aligns to paper process 10–15 business days” until you can shorten it.

This reduces support burden during the year-end peak.

---

### 5) Fee rule ($15 for >2 switches per calendar year)
Implement fee logic as part of the online flow:
- Determine member’s **switch count this calendar year** at time of submission.
- If count ≥ 2 already, then **charge $15** for this switch (or charge on execution date—your policy choice).
- Confirmation should clearly show:
  - whether the fee applies,
  - and the **when/where** it will be deducted.

**Discovery question to confirm (important for compliance/accounting):**
- Is the fee charged at **submission** or at **execution/registry commit**?
- Does the count include switches that were rejected/failed, or only successfully processed switches?

---

### 6) Compliance / FMA notifications & member notice
You’re already aligned on:
- notifying the Financial Markets Authority
- providing members **advance notice before go-live**
- compliance team drafting documentation

Discovery recommendation: treat compliance deliverables as **schedule drivers** because of:
- review/approval cycles
- potential “no go live until notification windows are satisfied”

**Key artifact checklist (you likely already have internally):**
- FMA notification draft + rationale for changes
- member communication pack (plain-English + how to use portal)
- “year-end cut-off” messaging and process transparency
- treatment of exceptions (manual fallback) and service levels

---

### 7) Year-end cut-off mechanics (what must be decided early)
To reliably meet 31 March, you need explicit system/business rules:

**A. Time handling**
- Confirm the timezone used for “3pm cut-off” (e.g., NZT).
- Ensure the portal submission timestamp is captured server-side, not browser-side.

**B. Cut-off test cases**
- “Submitted at 2:59pm” eligible
- “Submitted at 3:00pm exactly” — define inclusive/exclusive boundary
- “Submitted at 3:01pm” — next-period

**C. Operational coverage**
- Ensure the unit registry commit pathway (or queue pickup) is staffed and controlled around that date.
- Plan for failover: retries, idempotency, audit logs.

---

### 8) Non-happy paths & support readiness (likely to matter at year-end)
You should anticipate support tickets for:
- “I submitted but got processed later”
- “I was unsure of the cut-off”
- “My request says manual processing—why?”
- “Fee charged unexpectedly”

Discovery actions:
- portal must show clear status messaging
- provide a **timeline** view: Submitted → Committed to registry → Processed → Unit price applied
- ensure support teams can look up by reference number

---

### 9) Integration & delivery strategy (high level)
Recommended delivery approach:
1. **Phase 1 (must-have for 31 March):** eligibility + submission + commit-to-registry + confirmations + cut-off correctness + compliance-go-live readiness.
2. **Phase 2 (stabilise/optimise):** better UX, richer status tracking, reduce exception rates if possible.
3. **Keep paper fallback** for all exception categories.

**Dependency to surface immediately:** what system is the “unit registry” write target, and what interfaces exist today (API vs batch vs file transfer)? The answer determines how you meet “same business day commit.”

---

### 10) Discovery questions (to unblock scope and architecture)
To progress, I’d ask you to confirm:
1. **Unit registry integration method:** is there an existing API / interface? Or must writes be batched?
2. **Same business day definition:** is it “before 5pm cut-off” internally, or truly “any time until 11:59pm”?
3. **Fee implementation policy:** charge at submission or when executed?
4. **Switch count logic:** does “>2 switches” count only successful switches or all attempts?
5. **Hardship/contributions holiday rules:** are they binary (always manual) or do they vary by status/timing?
6. **Data needed for eligibility:** do you already have reliable flags in a member profile service?
7. **Confirmation content requirements:** what exactly must be said (compliance wording)?
8. **Idempotency requirement:** if the portal is clicked twice, must it create two switches or detect duplicates?

---

## Next step
If you want, I can turn this into a **discovery workplan** with:
- a draft **epics/features list** (portal + backend + integrations + compliance communications),
- a **risk register** specifically for 31 March cut-off,
- and a **target release timeline** that treats compliance notification + testing as schedule drivers.

To do that, answer just the top 2–3 integration questions: **how the unit registry is written today**, and whether you can guarantee “same business day commit” via API or only via batch.