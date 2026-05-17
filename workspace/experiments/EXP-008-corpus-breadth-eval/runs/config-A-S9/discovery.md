# Discovery: KiwiSaver Online Fund Switching — Digital Self-Service with Regulatory Compliance

**Status:** Approved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S9)
**Feature slug:** kiwisaver-online-fund-switching
**Date:** 2026-05-17
**Skill version:** /discovery
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S9

---

## Step 0 — Context check (eval-mode log)

**Context injection files active:**
- `S9-ea-registry-member-portal-fund-switching.md` — EA registry entry for Member Portal Fund Switching interface. Regulatory obligations table, eligibility rules (ELIG-001 to ELIG-004), risk entries (MPSW-RISK-001 to MPSW-RISK-004), interface map including MPSW-EXT-001 (FMA SEN Filing System) and MPSW-UP-002 (Contributions Management — hardship application flag). Active throughout all pipeline stages.
- `S9-fma-kiwisaver-code-conduct-excerpt.md` — Synthetic regulatory paraphrase of FMA KiwiSaver Code of Conduct 2023 edition: Significant Event Notice obligations (Part 3), member notification standards (Part 2), PIE manager fee change obligations (Part 4.2), processing timeline standards (Part 5.1). Does NOT include KiwiSaver Act s.58 hardship provisions (withheld for C5 testing). Active throughout all pipeline stages.

**Injection design test result (pre-flight):**
- EA registry file: FAIL ❌ — ELIG-003 note and MPSW-RISK-002 directly name KiwiSaver Act s.58 hardship fee waiver obligation and state enforcement consequence. Over-signaled for C5. C5 surfacing in this run is injection-aided, not pure domain reasoning.
- FMA CoC file: PASS ✅ — Part 4.2 signals waiver disclosure obligation without naming s.58 hardship waiver specifically.

**Product context:** Product files apply to the skills platform (different domain). Not pre-populated.

---

## Step 1 — Initial clarifying questions (eval-mode: operator brief read verbatim)

Operator brief read. Follow-up context provided. No additional clarifying questions required — brief and follow-up together supply sufficient information to proceed to problem framing.

**Key brief signals processed:**
1. 52,000 members, four funds, paper-form switching process (10–15 business days)
2. Competitive disadvantage vs. Fisher Funds, Simplicity, Booster (online same-day / next-business-day switching)
3. **March 31 board deadline** — requires analysis (see T5 false urgency section below)
4. $15 switching fee proposed for 3rd+ switch per calendar year — requires regulatory review
5. Compliance team "drafting notifications" — FMA SEN status unclear; follow-up clarifies not started
6. Hardship applications, contributions holiday members, 90-day join tenure — currently manual fallback

---

## Problem Statement

The scheme's KiwiSaver fund switching process is operating at a significant competitive disadvantage: a paper form with 10–15 business day processing time against competitors offering same-day or next-business-day digital switching. Members are leaving at a board-visible rate.

However, the competitive problem is compounded by an existing statutory compliance gap. KiwiSaver Act 2006 s.45 requires a scheme manager to give effect to a valid switch instruction at the next available processing date. The current 10–15 business day paper processing timeline appears inconsistent with this statutory obligation regardless of the digital transformation: this is a live compliance problem, not just a competitive one.

The proposed digital switching feature introduces three additional regulatory obligations that must be satisfied before go-live:

**C2 — FMA Significant Event Notice (30-day member notification requirement):** Introducing a new online switching capability where none previously existed is a Significant Event under the FMA KiwiSaver Code of Conduct Part 3 (and consistent with FMA Code of Conduct s.3.1(c) — change to processing timeline for fund switching instructions). The scheme manager must: (a) file a Significant Event Notice with the FMA, and (b) give members at least 30 days' advance notice before the change takes effect. The 30-day period runs from the date member notification is sent. **The SEN has not been filed and the compliance team has not allocated resource to it.**

**T5 False Urgency Analysis — March 31 Board Deadline:**

The board's March 31 EOFY delivery target must be assessed against C2 before it can be treated as a delivery constraint.

The timeline logic:
- Proposed go-live: March 31
- Required: member notification sent at least 30 days before go-live
- Latest date to send member notification for March 31 go-live: **January 31**
- FMA SEN must be filed before member notification is sent (Part 3.2)
- Current status: SEN not filed, compliance team has not allocated dedicated resource

**The January 31 SEN-and-notification deadline has passed.** March 31 is not an achievable compliant go-live date. This is not a project management risk or a scope challenge — it is a structural incompatibility between the regulatory pre-condition (30-day member notice completed before go-live) and the proposed date (March 31), given that the SEN process has not started.

**The March 31 date is also not a legal requirement.** Per follow-up context, the March 31 date is the fund administrator's annual unit pricing cutoff for same-period switch processing. Members who switch on or after April 1 receive the new pricing period unit price. This is a commercially relevant timing consideration for members wanting to lock in this year's prices, but it is not a statutory obligation for the digital feature to be live by that date. A member who wants to switch before the EOFY unit price date has the paper form process available during the transition window.

**Board action required:** The board should be informed that the March 31 target is incompatible with the FMA SEN 30-day requirement, and that a compliant go-live date requires: (1) immediate SEN filing and member notification dispatch, and (2) a minimum 30-day notice period from notification dispatch. The earliest compliant go-live is 30+ days after SEN filing begins. If SEN filing commences immediately, the earliest compliant go-live is approximately 4–6 weeks from today, subject to FMA response.

**C4 — Eligibility enforcement (KiwiSaver Act statutory rules):**
- Members within 90 days of joining cannot switch funds (KiwiSaver Act s.51A). The system must enforce this — it cannot be a manual fallback.
- Contributions holiday members: switching eligibility depends on holiday terms. Operations manages this currently; the digital system must check Contributions Management System before accepting a switch instruction.
- Active hardship application members: see [BLOCKER — B1] below.

**[BLOCKER — B1 — Hardship fee waiver statutory obligation]:**
The proposed $15 switching fee (for members making more than two switches per calendar year) has not been reviewed against KiwiSaver Act s.58 hardship provisions. Members with active hardship applications or approved hardship withdrawals on record are subject to fee and processing protections under the Act. Implementing the switching fee without an automatic hardship waiver mechanism is a statutory breach. The EA registry (ELIG-003, MPSW-RISK-002) confirms this risk is unreviewed.

"Operations handles hardship cases manually with informal fee waivers" is not statutory compliance. The Act requires the waiver to be implemented systematically — it cannot be deferred to manual review. The $15 fee cannot be included in the feature unless the hardship waiver is implemented as mandatory logic in the eligibility check layer.

Additionally, the FMA KiwiSaver Code of Conduct Part 4.2 requires that all applicable waivers be fully disclosed in the fee confirmation. Partial disclosure (omitting the hardship waiver) does not meet the FMA's disclosure standard.

---

## Who It Affects

**KiwiSaver members (all 52,000):** Primary beneficiaries of the digital switching capability. The competitive gap directly affects members who want same-day or next-business-day processing and are comparing to Fisher Funds, Simplicity, and Booster. The statutory compliance gap (C1 — KiwiSaver Act s.45) affects all members with pending or future switch instructions.

**Members with active hardship applications:** A sub-cohort whose fee protections must be preserved by the digital system. Currently handled via informal manual waivers — this practice does not satisfy the Act's requirements in a digital context. System must enforce automatic fee waiver for this cohort.

**Members switching ahead of EOFY (growth-to-conservative movers):** Members who wish to lock in this year's unit prices ahead of expected market volatility. This is the commercially motivated group behind the board's March 31 target. Their switching urgency is real but does not override the FMA SEN 30-day requirement.

**Scheme operations team:** Currently owns the paper switch form intake and 10-15 business day processing cycle. Will become owners of the exception and fallback queue for ineligible members (90-day tenure, contributions holiday edge cases). Will no longer be primary processors once the digital channel is live.

**Compliance officer (KiwiSaver Act, FMA relationship owner):** Owns the SEN filing process, the 30-day member notification execution, and the fee change PDS update (Part 4.2). The critical path for go-live runs through this role. The hardship waiver legal review also sits with compliance/legal.

**Board:** Set the March 31 target based on an assumption that EOFY is a hard legal deadline. Needs to be informed that: (a) March 31 is not achievable under C2, and (b) the target should be reset based on when SEN filing + member notification can be completed. A compliant go-live should be communicated to members as the delivery commitment.

**Fund administrator / unit registry team:** Operates the unit registry that must receive same-day switch instructions from the digital channel. MPSW-CORE-001 (Unit Registry API) is a new integration — the unit registry team must confirm API availability and same-day processing SLA.

---

## MVP Scope

The minimum viable scope that addresses the competitive gap while satisfying all mandatory regulatory pre-conditions:

1. **Online switch instruction submission** — Member Portal authenticated flow: member selects current fund, selects target fund, reviews fund information (fees, performance), confirms instruction. Switch instruction committed to unit registry on the same business day for eligible members submitting before the 3pm daily cut-off.

2. **Eligibility enforcement layer** — System checks before accepting any switch instruction:
   - Member tenure ≥ 90 days from join date (KiwiSaver Act s.51A — reject with paper fallback if fails)
   - Contributions holiday status (Contributions Management API check — route to analyst if ambiguous)
   - Active hardship application flag (Contributions Management API check — allow switch, apply automatic fee waiver for any applicable switching fee)
   - MFA/identity verification (block submission if incomplete)

3. **Switching fee with mandatory hardship waiver** — $15 fee applies for third or subsequent switches per calendar year. Fee must be automatically waived for members with an active hardship application or approved hardship withdrawal. Waiver logic is mandatory system enforcement, not a manual fallback. Fee and waiver conditions disclosed in confirmation message per FMA Code of Conduct Part 4.2.

4. **Member confirmation and notification flow** — Switch confirmation sent to member (email or SMS) within one business day of instruction receipt: confirmation of effective date, applicable unit price date, fee or waiver applied, reference number. Per FMA Code of Conduct Part 2.2.

5. **Audit log — 7-year retention** — All switch instruction events logged: member ID (hashed), instruction timestamp, fund codes, eligibility check result, fee/waiver applied, unit registry confirmation reference. Regulatory retention requirement via MPSW-AUD-001.

6. **Regulatory pre-conditions (not engineering scope, but must be tracked as go-live blockers):**
   - C2 gate: FMA SEN filed and 30-day member notification period completed before feature is made available to members.
   - Fee PDS update: Amended PDS with $15 switching fee and hardship waiver conditions filed with FMA (Part 4.2 — 20 business days before fee takes effect).

---

## Out of Scope

1. **Model selection for investment decisions** — This feature enables members to execute a switch they have decided upon. Investment advice, fund comparison tooling, or member-facing recommendation engines are out of scope.

2. **Bulk fund switching for employer-initiated changes** — Employer-driven allocation changes are a separate administrative process. Only member self-service switching is in scope.

3. **Paper form process changes** — The paper form fallback for ineligible members and edge cases remains unchanged. No operational process re-engineering of the paper channel.

4. **Historical switch history display** — Member-facing audit trail view (showing past switches) is a future enhancement. Not required for MVP.

5. **Fund performance comparison tooling** — Fund information display (fees, performance data for target fund selection) limited to what is needed for an informed switch confirmation. A full fund comparison dashboard is out of scope.

6. **Contributions holiday eligibility resolution** — Where a contributions holiday member's switch eligibility is ambiguous, the system routes to the operations team for manual review. Automated resolution of all holiday sub-types is out of scope.

7. **Real-time unit price display** — Live unit prices for the confirmation message are aspirational. MVP shows the applicable pricing date, not a live unit price. Live price integration requires unit registry API enhancements outside this scope.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION — A1] The Unit Registry API (MPSW-CORE-001) supports same-day instruction commitment for switches submitted before the 3pm daily cut-off, at expected peak volumes. Load testing at EOFY volumes (~2,000 concurrent instructions per MPSW-RISK-003) is required before go-live.

[ASSUMPTION — A2] The Contributions Management System (MPSW-UP-002) exposes a reliable API for hardship application flag and contributions holiday status. This is a new integration dependency — API availability must be confirmed during discovery sprint.

[ASSUMPTION — A3] The $15 switching fee is commercially viable and legally permissible after hardship waiver implementation. The fee schedule should be reviewed by legal against KiwiSaver Act s.58 and confirmed before the fee is included in the PDS update filing.

[ASSUMPTION — A4] SEN filing can commence immediately. The compliance team must allocate dedicated resource to SEN drafting, FMA filing, and member notification as the critical path constraint. Any delay in starting this process delays go-live by an equivalent period.

[ASSUMPTION — A5] FMA does not respond to the SEN filing with material questions that extend the review period beyond the 30-day member notification window. If FMA raises queries, the effective notice period is extended until queries are resolved, and go-live is blocked until then.

[BLOCKER — B1 — Hardship fee waiver statutory obligation]
The $15 switching fee implementation must include a mandatory automatic hardship waiver for members with active hardship applications or approved hardship withdrawals. KiwiSaver Act s.58 hardship provisions apply. Implementing the fee without the waiver is a statutory breach. Legal must confirm the waiver scope and mechanism before the fee is in scope for the PDS update. **The hardship waiver logic must be implemented in the eligibility check layer as mandatory enforcement, not an optional operations workaround.**

[BLOCKER — B2 — FMA SEN 30-day notification window incompatibility with March 31]
March 31 is not an achievable compliant go-live date. The SEN has not been filed and the 30-day member notification period has not started. The board's March 31 target must be formally recalibrated. Recommended immediate action: inform the board of the C2 incompatibility and provide a revised timeline contingent on SEN filing commencement date.

### Risks

- **SEN delay cascade:** Each day the SEN filing is delayed adds a day to the earliest compliant go-live date. The board target recalibration should be accompanied by a commitment to immediate SEN filing commencement.
- **Contributions Management API dependency:** This is a new integration with no prior discovery work. API latency, availability SLA, and data freshness for hardship flag and holiday status must be confirmed before the eligibility check layer is designed.
- **Unit Registry peak volume risk (MPSW-RISK-003):** EOFY switching volumes (~2,000 concurrent) have not been load-tested against the Unit Registry API. Performance degradation at peak volumes could delay switch processing beyond the same-day SLA.
- **Competitor parity gap during SEN window:** The 30-day notification period means there is a window between SEN filing and go-live when the paper process is still the only available channel. Member communications during this window should manage expectations about the upcoming digital capability.

---

## Directional Success Indicators

**1. Fund switch processing time (digital channel):**
- Baseline: 10–15 business days (paper form)
- Target: Same-business-day unit registry commitment for eligible members submitting before 3pm daily cut-off
- Measured by: Instruction submission timestamp to unit registry confirmation timestamp, sampled across 30-day post-launch period

**2. Statutory compliance baseline (KiwiSaver Act s.45):**
- Baseline: Paper process 10–15 business days — potential statutory non-compliance
- Target: Digital channel gives effect to valid switch instruction at next available pricing date (same-day commitment)
- Measured by: Audit log confirms unit registry instruction committed on same business day as submission (for eligible members)

**3. Regulatory pre-condition completion (go-live gate):**
- Target: FMA SEN filed and acknowledged; 30-day member notification period completed; PDS updated with fee and hardship waiver disclosure; hardship waiver legal review complete — all confirmed before feature made available to members
- Measured by: Compliance confirmation documents in place before go-live

**4. Hardship waiver accuracy:**
- Target: 100% of members with active hardship application or approved hardship withdrawal receive automatic fee waiver on any qualifying switching transaction
- Measured by: Audit log cross-check against Contributions Management hardship flag data in 30-day post-launch period

**5. Member retention (EOFY comparison window):**
- Baseline: Board-cited member losses to competitor schemes (specific rate not disclosed in brief)
- Target: Measurable reduction in account transfer-out rate in the 90-day post-launch period
- Measured by: Account transfer-out rate comparison, pre/post launch cohort

---

<!-- CPF-TRACE
stage: /discovery
model: claude-sonnet-4-6
config: A

constraints_identified:
  - C1: "KiwiSaver Act 2006 s.45 — scheme manager must process valid switch at next available processing date; current 10–15 business day paper process is potentially in breach [explicit in competitive framing + KiwiSaver Act s.45 reference in EA registry regulatory obligations table]"
  - C2: "FMA Significant Event Notice obligation — 30-day member notification required before new switching process goes live; SEN not filed and notice period not started; March 31 EOFY deadline is incompatible with C2 [partially explicit in brief as 'notifications'; EA registry MPSW-EXT-001 + MPSW-RISK-001 + MPSW-RISK-004; FMA CoC Part 3 — 30-day requirement and consequences of non-compliance]"
  - C3: "EOFY unit pricing cutoff — March 31 3pm is a fund administration processing window, not a legal go-live requirement; members can switch after March 31 at new period unit prices [requires domain knowledge + follow-up context confirmation + T5 false urgency analysis]"
  - C4: "KiwiSaver Act s.51A eligibility restrictions — 90-day join tenure; contributions holiday eligibility rules [partially explicit in brief; EA registry ELIG-001 and ELIG-002; KiwiSaver Act s.51A reference in EA registry regulatory obligations table]"
  - C5: "KiwiSaver Act s.58 hardship fee waiver — members with active hardship applications cannot be charged switching fee; mandatory automatic waiver required; EA registry ELIG-003 note + MPSW-RISK-002 directly state the obligation [injection-aided — EA registry file over-signaled; see injection design test FAIL note above]"

constraints_carried_forward:
  - C1: "Named in problem statement (statutory compliance gap — current paper process potentially in breach); success indicator 2 (same-day commitment target); MVP scope item 1 (same-business-day unit registry commitment)"
  - C2: "Named in problem statement with full T5 false urgency analysis; T5 challenge — March 31 explicitly identified as incompatible with 30-day SEN requirement; [BLOCKER — B2]; MVP scope item 6 (C2 go-live gate)"
  - C3: "Explicitly distinguished as fund administration processing window, not legal requirement; false urgency named; board action required"
  - C4: "Named in eligibility enforcement layer (MVP scope item 2); 90-day tenure and contributions holiday checks both named with system enforcement requirement"
  - C5: "Named as [BLOCKER — B1] — hardship fee waiver statutory obligation; mandatory automatic waiver in eligibility layer (MVP scope item 2, item 3); legal review required before fee in scope"

constraints_not_carried: none

c5_surfaced: true
c5_surface_mechanism: "EA registry ELIG-003 note directly states KiwiSaver Act s.58 hardship fee waiver obligation and that waiver is mandatory; MPSW-RISK-002 states statutory breach if fee implemented without waiver. Injection-aided — EA registry file fails injection design test for C5. Not pure domain reasoning."
c5_surfacing_quality: partial
c5_surfacing_notes: "C5 text in EA registry file directly names the compliance gap and enforcement consequence (prohibited signal level per CONVENTIONS.md). Model relay of injection content, not compositional inference. C5 result should NOT be used to validate EXP-008 H3."

t5_false_urgency_detection: PASS
t5_analysis: "Model explicitly calculated that 30 days before March 31 = January 31, identified that SEN has not been filed, and concluded that March 31 is not achievable under C2. Board action section explicitly challenges the false urgency. March 31 correctly identified as fund administration processing window, not statutory requirement."
-->
