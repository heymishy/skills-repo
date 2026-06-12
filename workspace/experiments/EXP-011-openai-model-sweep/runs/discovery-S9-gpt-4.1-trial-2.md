Thank you for the detailed background and context. Here is a structured breakdown of your /discovery submission, with key requirements, constraints, and risks, alongside clear next steps for your online KiwiSaver fund switching feature:

---

## 1. **Core User Story**

**As a KiwiSaver member,**  
I want to switch my investment fund via the member portal,  
So I can take advantage of current market conditions and manage my savings with minimal waiting time.

---

## 2. **Functional Requirements**

**Minimum Viable Scope:**
- **Authenticated switching:** Only logged-in members can access switching.
- **Fund selection:** Members can view available funds and select a new fund (one of: conservative, balanced, growth, aggressive growth).
- **Instructions confirmation:** A confirmation step before final submission.
- **Estimated processing date:** Members receive a confirmation (on-screen and by email) with the date/time their switch will be processed, clearly noting if it is ‘same day’, ‘next business day’, or will take longer for any reason.
- **Real-time instruction capture:** System commits the switch instruction to the unit registry the same business day, before the 3pm March 31 processing cut-off.
- **Switch fee logic:** On the third and subsequent switches in a calendar year, a $15 fee is charged and displayed to the member before confirmation.
- **Audit and notification:** Switch events are logged (with timestamps and user IDs) and members receive a summary by email.
- **Edge case fallback:** If eligibility checks (e.g., member joined recently, on contributions holiday, or in hardship process) fail, member is prompted to submit a paper form with a clear explanation.
- **Compliance Messaging:** Include compliance-mandated notices in the flow as provided by legal/compliance.
- **Accessibility & Security:** The new feature should meet baseline accessibility (WCAG 2.1 AA) and security standards appropriate for financial transactions.

---

## 3. **Non-Functional & Delivery Constraints**

- **Deadline:** Must go live before 3pm, March 31 (absolute board mandate).
- **High reliability:** Zero room for failed or delayed instructions between March 25–31; fallback and manual exception reporting must be robust.
- **Integration:** Real-time, same-day integration with unit registry (for instruction capture & fund switch processing).
- **Notification readiness:** Compliance and member notification steps must be prepared and executed in-line with FMA/board requirements.
  
---

## 4. **Known Gaps/Risks**

- **Edge Cases:** Not fully scoped for new joiners, contributions holiday, hardship applicants — process must default them out with accuracy and empathy.
- **Fee Charging:** Switching fee logic must be absolutely clear and error-proof. Back-end system must reconcile fees against switch limit per calendar year.
- **Manual fallback:** Operations staff will need clear workflow/tracking for handling switch requests that arrive via paper forms.
- **Unit price deadlines:** If member submits close to 3pm March 31, system must provide unambiguous confirmation of cut-off status and reflect accurately on member dashboard/email.
- **Load considerations:** Expect high volumes near fiscal cut-off; performance testing for scale is required.
- **User communications:** Member comms must be proactive about new process, cut-off times, and fee introduction to avoid confusion/disputes.

---

## 5. **Comparative Analysis**

Your competitors (Fisher Funds, Simplicity, Booster) offer same or next-business-day switching with seamless online experiences. Absence of this feature is increasing member churn and is notable to board/investors.

---

## 6. **Key Next Steps / Recommendations**

### Immediate (This Week)
- **Workshops:** Hold requirements workshop with operations, compliance, IT, and unit registry team.
- **Draft user flow:** Wireframe the member switching journey, including edge-case handling and fee display.
- **Technical assessment:** Validate API and integration needs with unit registry vendor.
- **Risk review:** Product, ops, and compliance leads sign off emergency fallback/escalation plan for March 25-31.
- **Finalize compliance copy:** Ensure all regulatory/member notices are approved and ready.

### By Month End
- **Prototype and test:** Usability tests with a sample of real members.
- **Performance testing:** Simulate end-of-year load on the switching system.
- **Member comms:** Pre-go-live notification must be scheduled per FMA/board requirements.
- **Training:** Ensure operations staff are briefed on new SOPs and edge case fallback.

### Post Launch / BAU Handover
- **Monitor:** Near real-time dashboard for switch volumes and exceptions.
- **Feedback:** Set up rapid member feedback capture to catch UX or process snags ASAP.
- **Iterate:** Schedule a post-March cycle for feature enhancements (mobile app parity, bulk switching, additional member analytics, etc.).

---

## 7. **Summary Statement**

Launching online fund switching by 31 March is both a regulatory and member-expectation imperative. The go-live date is immovable; the delivery must prioritize simplicity, compliance, and reliability, with clear fallback and edge-case support. The fee and comms policies must be member-first, and every stage of the process should be tested for clarity, latency, and accessibility.

Would you like a breakdown of technical implementation options, sample user stories for engineering, or a draft FAQ for member communications?