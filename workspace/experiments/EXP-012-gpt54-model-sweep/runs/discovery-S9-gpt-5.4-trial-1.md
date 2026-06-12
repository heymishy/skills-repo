Below is the /discovery output for the proposed **online KiwiSaver fund switching** feature.

---

# 1) Executive summary

You want to introduce **online fund switching in the member portal** for a 52,000-member KiwiSaver scheme spanning conservative, balanced, growth, and aggressive growth funds.

## Core business driver
- Current switching is **paper-based** and processed in **10–15 business days**
- Competitors offer **online, near-immediate switching**
- You are losing members and facing board pressure

## Target outcome
- Members can:
  - select a destination fund
  - confirm the switch online
  - receive confirmation and estimated processing date
- Operational objective:
  - **same-day commitment to the unit registry**
  - ideally “instant” where feasible

## Declared hard constraint
- **Go-live by 31 March**
- This is tied to:
  - unit pricing expectations
  - member sensitivity to locking in positions before the **3pm 31 March cut-off**
  - board commitment

## Important early warning
This initiative contains **material regulatory, operational, and delivery risk** that is currently understated.

The biggest issue is that the brief treats compliance notification and member notice as a “standard documentation step.” That may be incorrect in practice depending on:
- governing documents / product disclosure settings
- registry and manager operating model
- disclosure wording around switching and fees
- fair treatment obligations
- exact timing and content of notices
- whether introducing a fee requires broader legal updates than assumed

Also, the stated 31 March deadline is not merely a delivery milestone; it is a **market-sensitive operational cut-off event**. That sharply raises risk around:
- cut-off handling
- timestamp evidence
- unit price application logic
- queueing and same-day transmission
- outage procedures
- auditability
- complaints and disputes

---

# 2) Problem statement

Members cannot switch funds digitally, creating:
- poor customer experience
- slow operational turnaround
- competitive disadvantage
- avoidable attrition
- elevated manual processing load

The scheme needs a compliant, auditable online switching capability that:
- supports member self-service
- reduces processing delay
- handles cut-off rules correctly
- integrates with the unit registry
- protects members from incorrect or uninformed switches
- is live before the critical end-of-financial-year date

---

# 3) Goals and non-goals

## Goals
- Enable online switching between the four KiwiSaver funds
- Submit switch instructions electronically through the member portal
- Provide confirmation and estimated processing date
- Commit valid instructions to the registry on the **same business day**
- Reduce member attrition caused by poor digital experience
- Be operational before **31 March**
- Preserve fallback manual handling for exceptional cases

## Non-goals
- Full redesign of the portal
- Automated handling of all edge cases from day one
- Broader advice/personalisation capability
- Full retirement product switching capability beyond KiwiSaver fund changes
- Elimination of paper entirely on day one

---

# 4) Assumptions captured from the brief

These need validation.

- Members are already authenticated through the portal
- Registry integration can support same-day instruction submission
- Compliance notice obligations are straightforward and not on critical path
- Charging a **$15 fee after two switches per calendar year** is permissible with limited implementation effort
- Edge cases can be safely handled via manual fallback
- “Instant where possible” is technically and operationally realistic
- Existing terms/disclosures permit online execution and this fee model
- 31 March is feasible despite notice obligations and testing

---

# 5) Key stakeholders

## Internal
- Board
- Product / scheme management
- Operations
- Compliance
- Legal
- Technology / engineering
- Architecture / integration
- Registry operations / vendor management
- Customer service / complaints
- Risk
- Marketing / member communications

## External
- Members
- Unit registry provider
- Financial Markets Authority
- Potentially supervisor / trustee and other oversight parties depending on governance structure
- Print / mail / digital communications providers

---

# 6) Discovery findings: major themes

## A. This is not just a portal feature
It is an end-to-end transaction capability involving:
- authenticated member initiation
- eligibility checks
- cut-off logic
- fee logic
- advice / warning disclosures
- registry instruction submission
- confirmation generation
- exception handling
- audit records
- complaints defensibility

## B. 31 March is a business-critical date with elevated legal and operational sensitivity
Any ambiguity about:
- whether submission occurred before or after 3pm
- which business date applies
- which unit price applies
- whether the instruction was successfully received
could create disputes, complaints, and reputational damage.

## C. Compliance and disclosure may be on the critical path
Three specific areas stand out:
1. **Advance notice to members**
2. **Regulatory / supervisory notification**
3. **Introduction of a new switching fee**

The fee especially may require:
- terms review
- PDS / disclosure review
- website and portal disclosure changes
- notice period validation
- customer communication planning
- customer service scripts
- complaints handling preparation

## D. Edge cases are more important than they appear
Recent joiners, contribution holiday cases, and hardship applications may not be niche if they affect:
- legal eligibility
- transaction timing
- status mismatches with registry data
- vulnerable members
- manual intervention volumes near 31 March

## E. “Instant switching” may be the wrong promise
In managed fund / KiwiSaver settings, “instant” can be misleading if:
- unit prices are struck later
- registry updates are batched
- confirmation is only of instruction receipt, not completed switch at a fixed price
- exceptions prevent completion

A better member promise may be:
- “Instruction received immediately”
- “Submitted to registry same business day if received before cut-off”
- “Processed using applicable cut-off and unit pricing rules”

---

# 7) Requirements

## Functional requirements

### Member journey
- Authenticated member can access “Switch funds”
- System displays:
  - current fund
  - available destination funds
  - explanatory information and warnings
  - any applicable fee information
  - cut-off timing and processing expectations
- Member selects destination fund
- Member reviews summary
- Member confirms instruction
- System records timestamp and submission reference
- System provides confirmation screen and confirmation message/email

### Eligibility and validation
- Validate member is eligible to switch online
- Check for exclusion scenarios, e.g.:
  - very recent join
  - hardship application in progress
  - account restrictions / incomplete setup
  - contribution holiday status if relevant
- If ineligible:
  - do not allow straight-through processing
  - direct to manual/paper fallback or service contact path

### Processing
- Determine applicable processing date based on:
  - business day
  - time of submission
  - 3pm cut-off
  - registry operating hours
- Create switch instruction in internal system
- Transmit to unit registry
- Receive acknowledgement / status where possible
- Update member-visible status

### Fee handling
- Count switches made in calendar year
- Apply $15 fee after two switches, if legally approved
- Show fee before confirmation
- Record fee assessment and collection mechanism
- Define whether fee is deducted from account, billed, or netted in transaction process

### Audit and evidence
- Store:
  - member identity
  - date/time submitted
  - disclosures presented
  - fee shown
  - confirmation action
  - target fund selected
  - instruction transmission status
- Support complaints and dispute resolution

### Notifications
- On-screen confirmation
- Email / secure message confirmation
- Estimated processing date
- Plain-language explanation of unit price timing and cut-off treatment

---

## Non-functional requirements
- High availability, especially around 31 March
- Accurate timestamping with trusted time source
- Strong auditability
- Secure authenticated transaction handling
- Capacity for traffic spikes around market volatility and end-of-year cut-off
- Clear error handling and retry logic
- Monitoring and operational dashboards
- Accessible member experience
- Fast enough performance to avoid abandonment during peak periods

---

# 8) Critical business rules to define

These are currently insufficiently specified.

- Exact cut-off time zone and canonical clock source
- What happens at **3:00:00pm** exactly
- Treatment of weekends and public holidays
- What “same-day commitment to registry” means operationally
- Whether registry acknowledgement is required before confirming success to member
- Distinction between:
  - instruction received
  - instruction accepted
  - switch processed
- Whether partial switches are allowed or only full-fund switches
- Whether members can switch repeatedly on the same day
- Whether pending switches block additional switches
- Fee counting rules:
  - what counts as a switch
  - reversals/cancellations
  - failed instructions
  - year boundary handling
- Treatment of members with pending contributions, withdrawals, or active applications
- Whether a member can cancel after submission
- Business continuity rule if portal or registry is unavailable before cut-off

---

# 9) Risks

## 1. Regulatory / legal risk — High
The brief likely understates the work required for:
- FMA / oversight notifications
- member notice timing
- disclosure updates
- fee introduction
- ensuring member communications are not misleading

### Why this matters
If notice periods or disclosure updates are not complete before go-live, 31 March may be impossible regardless of build readiness.

---

## 2. Deadline risk — Very High
31 March is a fixed external deadline with high member expectation and no tolerance for slippage.

### Risk drivers
- legal/compliance dependencies
- registry integration complexity
- testing around cut-off scenarios
- member communications lead times
- end-of-year operational blackout/change constraints

---

## 3. Cut-off and pricing dispute risk — Very High
Disputes may arise over:
- submission time
- applicable unit price date
- whether same-day processing was achieved

### Consequence
- complaints
- remediation
- reputational damage
- board escalation

---

## 4. Fee implementation risk — High
The $15 fee appears simple but affects:
- product/legal settings
- member disclosures
- portal UX
- charging mechanics
- exceptions
- complaints

---

## 5. Registry integration risk — High
Same-day commitment depends on:
- registry interfaces
- cut-off windows
- acknowledgements
- exception management
- batch schedules

If registry capability is weaker than assumed, your stated service promise may not be achievable.

---

## 6. Operational fallback risk — Medium/High
If too many edge cases route to manual handling near 31 March, operations may be overwhelmed.

---

## 7. Member misunderstanding risk — Medium/High
Members may interpret “online switching” or “instant” as:
- immediate execution
- guaranteed same-day unit pricing
- no restrictions

This requires careful wording.

---

# 10) Constraints

## Hard constraints
- Must be live before **31 March**
- Must support processing around **3pm 31 March cut-off**
- Must align with legal/compliance obligations

## Likely constraints
- Registry vendor capabilities and release windows
- Member portal architecture
- Notice periods to members
- Change freeze / peak-period controls
- Limited time to fully automate edge cases

---

# 11) Dependencies

- Legal confirmation of switching process and fee permissibility
- Compliance review of notices and disclosures
- Registry provider capability and SLA confirmation
- Product sign-off on member wording
- Operations design for exceptions and fallback
- Customer support training
- Communications plan and member notice execution
- Production release governance before 31 March

---

# 12) Unknowns requiring urgent validation

These are the most important discovery gaps.

1. **Can the scheme legally introduce online switching without formal document updates beyond notification?**
2. **Does the $15 fee require a formal variation, updated disclosure, or notice period that makes 31 March unrealistic?**
3. **What are the registry’s actual same-day submission and acknowledgement capabilities?**
4. **What is the exact transaction model: immediate receipt only, same-day transmission, or same-day effective switching?**
5. **How are unit price date and cut-off rules currently defined in scheme operations?**
6. **How many members are likely to attempt switches in the final week of March?**
7. **What proportion of members fall into “manual fallback” edge cases?**
8. **What happens if the portal is unavailable on 31 March before 3pm?**
9. **What evidence standard is needed for disputes about cut-off timing?**
10. **Can the organisation safely deliver fee logic, edge-case handling, and registry integration by deadline, or is an MVP needed?**

---

# 13) Recommended MVP scope

Given the deadline, the best path is likely a tightly controlled MVP.

## MVP candidate
- Online switching for eligible members only
- Full-fund switches between the four funds
- Clear cut-off messaging
- Immediate confirmation of instruction receipt
- Same-business-day submission to registry for valid pre-cut-off instructions
- Manual handling for defined exceptions
- No “instant switch” promise
- Strong audit logging
- Controlled communications and support readiness

## Consider deferring from MVP
- Fee charging, unless legally and operationally straightforward
- Complex edge-case automation
- Switch cancellation/amendment
- Multiple same-day switches
- advanced status tracking beyond core milestones

### Important note
If the fee introduces legal or timing complexity, **defer the fee**. It is less important than meeting the 31 March online switching objective.

---

# 14) Delivery options

## Option A: Full feature by 31 March
Includes:
- online switching
- eligibility automation
- fee logic
- same-day registry commitment
- notifications
- exception handling
- complete comms

### Assessment
High risk. Likely unrealistic unless substantial groundwork already exists.

---

## Option B: MVP by 31 March, fee and complex cases later
Includes:
- eligible-member online switching
- same-day instruction submission
- manual fallback for exclusions
- clear confirmations and audit trail
- no switching fee at launch

### Assessment
Best balance of speed, risk, and member impact.

---

## Option C: Front-end capture by 31 March, partial back-office automation
Includes:
- online member submission
- operations-assisted same-day registry entry
- strong cut-off controls
- later straight-through integration

### Assessment
Potentially viable if registry integration timing is a blocker, but requires excellent operational discipline on 31 March.

---

# 15) Recommended approach

## Recommendation
Proceed with **Option B** unless legal or registry findings force Option C.

### Why
- maximizes chance of hitting 31 March
- reduces compliance complexity
- avoids fee-related delay
- still addresses the main competitive/member pain point
- preserves auditability and cut-off defensibility

---

# 16) Priority decisions needed this week

1. **Decide whether the switching fee is in or out for MVP**
   - Strong recommendation: **out**
2. **Confirm legal/compliance critical path**
   - exact notice obligations
   - timing
   - disclosure changes
3. **Confirm registry operational model**
   - same-day submission
   - batch times
   - acknowledgement
   - exception processing
4. **Define the member promise**
   - avoid “instant switch”
   - use precise operational wording
5. **Lock eligibility scope**
   - who can use online switching at launch
   - who is routed to paper/manual process
6. **Define cut-off rules precisely**
   - timestamp source
   - 3pm rule
   - outage contingency

---

# 17) Questions for stakeholder interviews

## Legal / Compliance
- What formal notices are required and what are the minimum lead times?
- Does online switching require updated disclosure documents?
- Can a switching fee be introduced by 31 March?
- Are there specific fair dealing concerns in how speed and timing are described?

## Operations
- How many switch requests occur monthly and in late March?
- What current exceptions exist and how often?
- Can operations absorb manual fallback volume at peak?
- What is the current source of truth for cut-off handling?

## Registry provider
- What interfaces exist for switch instructions?
- Can instructions be accepted same day up to/after 3pm?
- Is acknowledgement real-time or batch?
- How are failures and rejections communicated?

## Product / Member experience
- What member warnings are required before confirming a switch?
- Are partial switches needed?
- What status updates do members expect?

## Technology
- What portal capabilities already exist for authenticated transactions?
- Is there a workflow engine / case management tool for exceptions?
- How quickly can audit-grade timestamping and event logs be implemented?

---

# 18) Likely acceptance criteria for MVP

- Eligible authenticated members can submit a fund switch online
- Submission is timestamped and audit logged
- Member sees clear cut-off and processing information before confirming
- Pre-cut-off valid instructions are transmitted to the registry same business day
- Ineligible cases are prevented from STP and routed to manual path
- Member receives confirmation with reference number and estimated processing timing
- Support teams can view instruction status and audit evidence
- Tested scenarios include 31 March peak/cut-off behavior

---

# 19) Discovery conclusion

This is a **high-value, high-urgency** initiative with a genuine business case, but the current brief underestimates:
- compliance complexity
- fee-related impact
- cut-off/timekeeping risk
- registry dependency
- operational edge-case volume

The board’s **31 March** deadline is achievable only if you:
- sharply narrow MVP scope
- confirm legal/compliance obligations immediately
- avoid non-essential complexity, especially the fee
- define a precise and defensible service promise
- treat cut-off handling as the core design problem, not just portal UX

---

# 20) Suggested next-step output from discovery

If helpful, I can next produce any of these:

1. **A RAID log**
2. **An MVP scope / out-of-scope definition**
3. **A stakeholder interview plan**
4. **A delivery options paper for the board**
5. **A requirements backlog in epic/story format**
6. **A compliance and operational dependency checklist**
7. **A concise red-flags summary for executives**

If you want, I can turn this directly into a **board-ready discovery briefing** next.