Thank you for the detailed context. Here’s an analysis of what you’ve shared, structured around user needs, regulatory requirements, competitive benchmarks, technical and operational constraints, delivery imperatives, and open risks. This will help crystallize your /discovery phase and set the basis for planning, breakdown, and next steps.

---

## 1. **User Needs**

- **Primary Need:**  
  Members want fast, convenient, and predictable fund switching, especially ahead of key financial dates (31 March).
- **Pain Points:**  
  - Slow (10–15 day) manual process currently.
  - Inconvenience of paper forms.
  - Risk of missing key switch cut-off (leading to member anxiety or dissatisfaction).
- **Expectations (Shaped by Competitors):**  
  - Online switching via portal.
  - Same-day or next-business-day execution.
  - Transparent confirmation and turnaround times.

---

## 2. **Regulatory/Compliance Requirements**

- Advance notification to the FMA before launch.
- Advance member notification about the new process.
- Ensure the switching feature and process align with KiwiSaver Scheme rules (switching limits, fees, disclosures, etc.).
- Maintain the integrity and auditability of switch instructions (record-keeping, time-stamping, etc).
- Edge cases (recent joiners, hardship, contributions holidays) need special handling/clear member comms.

---

## 3. **Competitive Benchmarking**

- **Standard:**  
  - Fisher Funds, Simplicity, Booster: fully online fund switches, implemented via portal/app.
  - Processing times: typically same business day or next business day.
- **Features members see as “industry standard”:**  
  - Immediate switch submission and confirmation.
  - Transparent communication on status and timing.
  - Clear information on any limitations or wait periods.

---

## 4. **Business/Operational Constraints**

- **Non-negotiable deadline:**  
  - Must go live **before 31 March** (cut-off 3pm) to avoid reputational, retention, and regulatory risk.
- **Hybrid processing (majority digital, some manual):**  
  - Ops team ready to handle edge/ineligible cases manually via fallback.
- **Switch Fee policy:**  
  - 2 free switches per year; $15 fee for excessive switching (standard in market).
  - Process and comms integration needed so members are aware **before** confirming switch #3+.

---

## 5. **Functional Breakdown (Initial Scope for Discovery)**

### **Core Flows**
- **Authenticated portal experience for member:**
  - Select source/current fund, select target fund.
  - Receive eligibility check (some members may be routed to “paper/manual” fallback).
  - Review any switching fee information.
  - Confirm and submit switch.
- **Back-end processing:**
  - Commit switch instruction to unit registry (preferably same business day; at minimum timestamped for end-of-day batch).
  - System calculates and applies switching fee if eligible.
  - Generate confirmation to member (including estimated processing/completion date).

### **Member Communications**
- Real-time confirmation in portal.
- Email confirmation (triggered automatically).
- Advance notification campaign (website, email, and—if required by law—postal).

### **Edge Cases**
- Members ineligible for instant online switch (recent joiners, contributions holiday, hardship, etc.): clear portal messaging and seamless routing to manual fallback.
- System must identify and block/reroute these members pre-submission to avoid confusion.

---

## 6. **Risks and Unknowns / To be Further Scoped**

- **Integration with unit registry (core platform):**  
  - Can the system process same-day instructions? What’s current capacity and what enhancements are required?
- **Eligibility logic (edge / ineligible cases):**  
  - Automated identification of ineligible member states (recent joiners, on hardship, on holiday).
- **Fee System:**  
  - How to track switches per year across different switching channels (online and paper)?
- **Notification/Comms:**  
  - FMA notified in time with final production/launch plan.
  - Members receive sufficient notice (lead time for campaign).
- **Contingency plans:**  
  - Fallback comms/process in the event of delays to go-live before 31 March.
- **Post-launch Operations:**  
  - Monitoring for high switch volumes and exception handling.

---

## 7. **Success Criteria**

- **Member-facing:**  
  - Feature live *before* 31 March, with proper cut-off logic.
  - Members able to switch funds online; receive clear, timely confirmation.
  - Edge cases handled gracefully.
- **Internal:**  
  - FMA and board satisfied with compliance.
  - Operations team not overloaded with exceptions post-launch.
  - Switch volumes managed without significant processing backlog.

---

## 8. **Next Steps / Recommendations**

1. **Technical Feasibility Assessment:**  
   - Quickly assess integration with registry for same-day commits.
   - Confirm UI/portal build timeline against 31 March deadline.

2. **Process/Edge Case Mapping:**  
   - Define and document all member states that require fallback/manual process.

3. **Policy & Fee Integration:**  
   - Finalize fee logic and calendar-tracking for switch history.

4. **Change & Stakeholder Management:**  
   - Finalize regulatory/compliance notifications.
   - Draft and review member notification content early.
   - Prepare call centre/operations scripts for expected queries.

5. **Testing and Contingency:**  
   - Develop robust QA test plan (esp. for edge cases, high-traffic scenarios close to cut-off).
   - Prepare contingency comms/process should systems fail near deadline.

---

**Summary Assessment:**  
This is a critical deliverable with both technical and operational dependencies. Your “go-live-before-31-March” is non-negotiable. Minimize scope to only what’s necessary for compliance and competitive parity. Defer or manually handle complex edge cases until after initial launch. Focus on core experience, transparent communications, and containment of operational risk. Plan now for a contingency in case you hit delays—communicate this plan as early assurance to stakeholders and board.

Let me know what level of detail you need next: user journeys, technical architecture options, comms drafts, project phasing, or something else.