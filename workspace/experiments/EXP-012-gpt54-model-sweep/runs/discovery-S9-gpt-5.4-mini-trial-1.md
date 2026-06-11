Got it. I’ll treat this as a discovery intake and identify the key product, compliance, operational, and delivery constraints that matter for shaping the solution.

## What I’m hearing

You want to deliver an **online KiwiSaver fund switching feature** in the member portal, enabling members to:

- choose a target fund,
- confirm the switch,
- receive a confirmation including an estimated processing date,
- and have the instruction committed to the unit registry **same business day where possible**.

The key business drivers are:

- reduce member attrition to competitors who already offer online switching,
- improve member experience,
- and avoid complaints / closures around the March 31 unit price cutoff.

## Hard deadline

The **non-negotiable delivery date is 31 March**, specifically to support members who want to switch before the **3pm March 31 cut-off** for same-period processing.

That means the solution needs to be live, tested, and operationally ready before that date, including:

- member portal functionality,
- registry integration / processing workflow,
- customer communications,
- compliance notifications,
- and operational support arrangements.

## Initial assumptions / flags to validate

There are a few statements in your description that may need legal/compliance confirmation before they are treated as requirements:

1. **FMA notification and advance member notice**
   - You’ve said this is a standard documentation step.
   - This should be confirmed with compliance/legal, as the exact notice obligations and timing may affect the release plan.

2. **$15 switching fee for >2 switches/year**
   - This may be commercially sensible, but it needs explicit review against:
     - KiwiSaver rules,
     - scheme rules / PDS,
     - fee disclosure obligations,
     - and fairness / customer treatment expectations.
   - Also important: whether the fee applies automatically in the portal or is assessed later.

3. **Manual fallback for edge cases**
   - You mentioned:
     - very recent joiners,
     - contribution holiday members,
     - members with active hardship applications.
   - We should validate whether these groups are actually eligible to switch online, blocked entirely, or allowed with special handling.
   - “Operations will handle manually” is workable only if the portal clearly routes them correctly and the SLA is acceptable.

## Likely product / workflow requirements

At a minimum, the feature will likely need:

- eligibility checks before allowing submission,
- display of available funds,
- confirmation of cut-off timing and effective date,
- audit trail of member instruction,
- registry submission workflow,
- confirmation email / portal receipt,
- exception handling for ineligible members,
- and support for fee calculation and disclosure if the fee is included.

## Key discovery questions

To move this into a buildable scope, I’d want to confirm:

### 1) Eligibility and rules
- Who is eligible to switch online?
- Are there any lockouts for:
  - new members,
  - members in contributions holiday,
  - hardship / significant financial hardship cases,
  - deceased estates / managed accounts / minors?
- Can members switch between any of the four funds freely?
- Any limits on frequency or timing of switches beyond the fee rule?

### 2) Pricing / fee treatment
- Is the $15 fee:
  - charged immediately,
  - charged only after the third switch,
  - or charged at a later registry cycle?
- Does the fee need to be disclosed before confirmation?
- Is there an annual free-switch allowance already in the scheme rules?
- Does the fee apply to all switch types or only member-initiated online switches?

### 3) Operational processing
- What system is the “unit registry”?
- Is there an API/integration available, or will this be batch/upload based?
- What is the current same-day processing cut-off internally?
- What is the fallback when the registry is unavailable?
- Who reviews failed/exception cases?

### 4) Member experience
- Should the member see:
  - an immediate “switch submitted” confirmation,
  - a projected effective date,
  - or both?
- Should we show a warning about unit price cut-off timing?
- Do members need to acknowledge market movement / investment risk before confirming?
- Should the confirmation be sent via email, portal message, SMS, or all three?

### 5) Compliance / legal
- What exact member notices are required before launch?
- Are there any wording requirements for switch instructions, fee disclosure, or processing times?
- Does the online process need to satisfy any “cooling off” or explicit consent requirements?
- Are there record-retention requirements for switch instructions and confirmations?

### 6) Delivery constraints
- What is the latest acceptable release date before 31 March?
- Is there a need for a staged rollout or feature flag?
- What testing, UAT, and sign-off windows are available?
- Is there contingency if integration slips?

## Risks I’d call out now

- **Cut-off timing risk:** if the registry submission isn’t same-day reliable, members may miss the 3pm March 31 cutoff.
- **Compliance risk:** fee disclosure and notice requirements may affect the design and timeline.
- **Eligibility risk:** manual handling of edge cases may create inconsistency or complaints if not tightly defined.
- **Operational risk:** if switching volume spikes near quarter-end, the ops team may be overwhelmed unless the workflow is automated and monitored.
- **Reputational risk:** any mismatch between “instant” expectation and actual processing date could create dissatisfaction.

## Suggested next step

I’d recommend turning this into a short discovery brief with:

1. **Business objective**
2. **In-scope user journeys**
3. **Eligibility rules**
4. **Compliance constraints**
5. **Operational workflow**
6. **Systems / integrations**
7. **Launch date and release plan**
8. **Open questions / assumptions**

If you want, I can convert this into a structured **discovery output**:
- problem statement,
- goals,
- assumptions,
- risks,
- MVP scope,
- and a prioritized list of questions for stakeholders.