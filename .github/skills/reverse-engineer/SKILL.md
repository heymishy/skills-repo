---
name: reverse-engineer
description: >
  Extracts business rules, data contracts, interface behaviour, and hidden logic from legacy
  codebases through structured six-layer analysis. Produces a reverse-engineering report
  conforming to templates/reverse-engineering-report.md, and optionally a vendor Q&A tracker.
  Use when someone says "reverse engineer this", "extract the rules", "document this legacy system",
  "what does this code do", or "extract business logic from". Designed for modernisation
  and replacement programmes. Works on any language.
triggers:
  - "reverse engineer this"
  - "extract the rules"
  - "document this legacy system"
  - "what does this code do"
  - "extract business logic"
  - "analyse this codebase"
  - "modernisation spike"
---

# Reverse Engineer Skill

## Entry condition check

Establish before proceeding:

1. **Codebase access** -- can the agent read the relevant files?
   If not: "Share the files, point me to the directory, or paste key modules."

2. **Scope** -- full system, specific module, or particular capability?
   If unclear: "What is the scope of this extraction?"

3. **Modernisation target** -- what is the legacy being replaced with?
   Determines whether vendor extracts and Q&A tracker are produced.

4. **Programme context** -- active programme with a known target, or exploratory?

Ask only for what is missing. Do not ask all four at once.

---

## Contextual questions

Ask before reading the code. One or two at a time -- not as a form.

**Q1 -- Known pain points and undocumented behaviour**
> "Are there known areas where the system's behaviour is complex, poorly understood,
> or known to be problematic? Anything it does that isn't documented anywhere --
> workarounds, edge cases, rules that exist only in the code?
> These are the highest-value extraction targets."

**Q2 -- Regulatory context**
> "What regulatory frameworks apply?
> (e.g. RBNZ BS11, PCI DSS, AML/CFT, CCCFA, Visa/Mastercard scheme rules)
> This determines how aggressively I flag regulatory sensitivity."

**Q3 -- Interface landscape**
> "What do you know about the systems this integrates with -- even roughly?
> Anything known upfront helps find hidden interfaces that don't appear
> in API definitions: shared database tables, file drops, polling patterns."

**Q4 -- Target platform constraints**
> "Are there known gaps in the target platform -- behaviours you already
> suspect it may not support? These go straight to the vendor Q&A tracker."

**Q5 -- Previous extraction attempts**
> "Has anyone documented this system before, even partially?
> Existing docs or specs help calibrate confidence ratings."

**Q6 -- Production incidents**
> "Has this system caused production incidents or surprises?
> Rules that only emerge under load or at edge of business hours
> are exactly what Layer 2B is designed to find."

State a reading plan once answers are collected, then proceed.

---

## Extraction -- six layers

Work through layers in order. Announce each layer before starting it.

---

### Layer 1 -- Structure scan

*Always do this first. Prevents wasted effort reading the wrong modules.*

Identify: entry points, major modules, configuration files, test files,
batch job definitions, scheduled tasks, property files.

Produce from structure alone:
- Draft of Section 1 (system overview)
- Interface map skeleton -- what external system names appear?
- Prioritised module reading list for Layer 2

State the plan before proceeding:
> "Structure scan complete. Prioritising [modules]. Estimated [n] rule categories.
> Hidden interface scan will focus on [patterns]. Proceeding to Layer 2A."

---

### Layer 2A -- Explicit business rules

Read: conditional logic, validation functions, calculation methods, state machine
transitions, routing decisions, threshold comparisons, eligibility rules, limit
checks, fee and pricing logic.

For each rule: extract ? assign confidence ? flag sensitivity ?
assign provisional disposition ? note source file and function.

Focus on business meaning. Flag magic numbers explicitly:
> "Threshold: 10000 -- source unknown. Could be regulatory, a product limit,
> or a legacy default. [UNCERTAIN] -- verify with domain expert."

---

### Layer 2B -- Hidden business rules

*These are the rules most commonly discovered post-cutover. Do not skip.*

Look specifically for rules disguised as something else:

- **Error handling paths** -- exception handlers frequently contain business decisions.
  "On insufficient funds, apply X." "On timeout, route to Y." These are business rules
  disguised as error handling.

- **Date and calendar logic** -- business-day calculations, cut-off times, rate-effective
  dates, interest accrual triggers. Flag every date calculation as a candidate rule.

- **Configuration files** -- fee tables, rate tables, routing priority lists, limit
  matrices. Often the most complete rule documentation in the system, and the most
  commonly missed in a code-only extraction.

- **Batch job logic** -- end-of-day processing, statement generation, regulatory
  reporting runs. These contain rule logic that never runs in the normal transaction
  path and is invisible to anyone reading only the API layer.

- **Commented-out and disabled code** -- extract into the Dead/Disabled Rules appendix.
  They may represent: a rule intentionally retired, a rule disabled for a legacy platform
  limitation (must be re-enabled in target), a superseded workaround, or a rule nobody
  dared delete. Each requires a human disposition decision.

- **Test files** -- test names and assertions are a partially verified rule catalogue.
  Where tests exist and pass, use them to validate extracted rules and uprate to [VERIFIED].
  Where a critical-looking rule has no tests, flag the gap explicitly.

---

### Layer 3 -- Interface contracts

*Scope underestimation is the most common interface failure mode.*
*Use a systematic pattern scan -- not just API definitions.*

**Step 1: Obvious interfaces**
API definitions, documented clients, service registries, WSDL/OpenAPI specs,
message queue configuration, service mesh entries.

**Step 2: Hidden interface pattern scan**

| Pattern | Where to look | Why it's missed |
|---------|--------------|-----------------|
| Shared database tables | Tables written here, referenced in other system configs; schema grants; cross-schema queries | Never in API definitions |
| File exchange | Outbound file writes to shared paths; inbound file polling; scheduled imports | Batch-layer -- invisible in service discovery |
| Database polling | SELECT loops or scheduled queries against tables owned by another system | Looks like a query, is actually an integration |
| Undocumented callbacks | Webhook registrations, event subscriptions buried in startup config | Registered once, never documented |
| Implicit timing contracts | Downstream systems expecting this system's batch to finish before starting | Not a formal interface -- a de facto coupling |
| Shared caches | Redis/Memcached keys shared across system boundaries | Breaks silently when key format changes |
| Hardcoded host references | Direct connections not routed through a service registry | Won't appear in any interface registry |

For each interface found -- obvious or hidden:
- Record in Section 3 (interface contracts)
- Note how it was found
- Hidden interfaces require counterparty confirmation before rating [VERIFIED]

**Step 3: Confidence per interface**
- Formal contract (spec, schema, agreed format) ? [VERIFIED]
- Format inferable from code, unspecified ? [PROBABLE]
- Counterparty or format unknown ? [UNCERTAIN] ? risk register item

---

### Layer 4 -- Regulatory and compliance rules

*The failure mode here is not missing the rule -- it is misinterpreting it.*

For every candidate regulatory rule, capture both of these separately:

**What the code does** -- neutral, literal description. No interpretation.
What values, conditions, outcomes. Nothing more.

**What regulation this appears to implement** -- suggested basis only.
Mark explicitly as SUGGESTED. Do not present as confirmed.

A compliance specialist can then assess the code behaviour directly against
the current regulation -- without having to trust the extraction's interpretation.
The code may be wrong. The regulation may have been amended. The implementation
may be stricter or looser than required.

Flag every item as [REGULATORY] REGULATORY. Every item requires named human verification
before being used as a requirement input to a vendor, coding agent, or pipeline skill.

Use this format for each item:

```
WHAT THE CODE DOES:
[Literal description -- values, conditions, outcomes. No interpretation.]

WHAT REGULATION THIS APPEARS TO IMPLEMENT (SUGGESTED):
[Regulation name / clause if identifiable. Mark as SUGGESTED.]
[If unknown: "Regulatory basis unknown -- appears to be a compliance gate."]

IMPLEMENTATION GAP RISK:
[Specific reason to doubt the code correctly implements the regulation.
If none identified: "No specific gap risk identified -- verification still required."]

VERIFICATION REQUIRED FROM: [Compliance / Legal / specific role]
VERIFIED BY: [Name] | DATE: | NOTES:
```

---

### Layer 5 -- Data model and ownership

Read: schema definitions, ORM mappings, data access patterns,
write vs read access per system, foreign key relationships to external data.

Focus on ownership and dependency -- not column-level detail.

Data migration red flags to look for:
- Tables with writes from multiple systems -- shared ownership, migration risk
- Derived or calculated fields that are stored rather than computed -- may diverge post-migration
- Audit and history tables subject to regulatory retention requirements
- Soft-delete patterns -- what happens to this history at cutover?
- Sequences or auto-increment keys referenced by external systems -- cutover sequencing risk

---

### Layer 6 -- Proprietary logic and key IP

Review all extracted rules for commercially sensitive or differentiating logic.

Common examples: pricing algorithms, risk scoring models, relationship pricing tiers,
fraud heuristics, product eligibility matrices, credit decisioning logic,
customer segmentation rules.

Flag as [PROPRIETARY] PROPRIETARY. For each item note:
- Does the organisation want to preserve this exactly in the target?
- Or is modernisation an opportunity to redesign it?
- Is this currently embedded in the legacy platform -- meaning it may silently change
  in the new platform unless explicitly configured?

---

## Confidence rating discipline

Apply ratings honestly. Over-rating to produce a cleaner report is the most common
mistake. A report with 40% [UNCERTAIN] that accurately reflects uncertainty is more useful
than a polished report with falsely elevated ratings.

| Rating | Apply when |
|--------|-----------|
| [VERIFIED] Verified | Rule is explicit and unambiguous in code AND has test coverage confirming intent AND business meaning is documented or confirmed by a domain expert |
| [PROBABLE] Probable | Rule is clear in code AND intent is inferable from context or naming -- but NOT confirmed by a domain expert |
| [UNCERTAIN] Uncertain | ANY of: origin or intent unclear / appears to be a workaround or dead code / comments contradict implementation / threshold source unknown / no test coverage / found via hidden pattern scan and counterparty not yet confirmed |

**Every [UNCERTAIN] item must include a sentence stating the specific source of uncertainty.**
Not "purpose unclear" -- instead: "threshold value 10000 has no source comment and no
test coverage; unknown whether this is a regulatory threshold or a product default."

---

## Modernisation dispositions

Assign to every business rule and interface:

| Disposition | Meaning |
|-------------|---------|
| PARITY REQUIRED | Target must produce an identical outcome. Used for regulatory rules, scheme rules, contractual obligations, critical rules with known downstream dependencies. Parity test seeds sourced from these. |
| MIGRATION CANDIDATE | Behaviour must exist in target but may be implemented differently. Requires a design decision. |
| REVIEW | Unclear whether to preserve, redesign, or retire. Do not feed to pipeline until resolved. All [UNCERTAIN] items that cannot be retired unilaterally should be REVIEW. |
| RETIRE | Should not exist in target. [WARNING] Never assign unilaterally -- mark as REVIEW with retire rationale. A human must confirm. |

---

## SaaS platform fit assessment

For each PARITY REQUIRED rule and critical interface, assess against the target platform:

| Rating | Meaning | Requirement |
|--------|---------|-------------|
| [PASS] NATIVE | Platform handles this natively | Must state basis -- doc reference, vendor confirmation, or known capability. Not assumption. |
| [CONFIG] CONFIG | Platform handles this via configuration | Must state which config mechanism and confirm it is within the standard support envelope |
| [CUSTOM] CUSTOM | Requires custom development or platform extension | Flag as programme risk -- custom code has ongoing upgrade implications. Quantify scope. |
| [FAIL] GAP | Platform cannot handle this | Escalate immediately as HIGH programme risk. Document precisely for vendor. |
| [WARNING] UNKNOWN | Insufficient information to assess | Add to Vendor Q&A Tracker. Must be resolved before programme commitment. |

Be conservative. Prefer [WARNING] UNKNOWN over [PASS] NATIVE unless evidence is explicit.
A confident NATIVE that turns out to be a GAP costs weeks. An honest UNKNOWN costs one meeting.

---

## Outputs

State which outputs you are producing before starting.

| Output | When produced | Audience | Location |
|--------|--------------|----------|----------|
| 1. Full reverse engineering report | Always | Programme team, pipeline input | `artefacts/[system-slug]/reverse-engineering-report.md` |
| 2. Vendor functional requirements | If SaaS target | Vendor solution architect | `artefacts/[system-slug]/extracts/vendor-functional-requirements.md` |
| 3. Vendor Q&A tracker | If [WARNING] UNKNOWN items exist | Vendor -- ready to send | `artefacts/[system-slug]/extracts/vendor-qa-tracker.md` |
| 4. Architecture interface map | If interfaces found | Architecture / EA team | `artefacts/[system-slug]/extracts/architecture-interface-map.md` |
| 5. Compliance regulatory inventory | If regulatory rules found | Compliance / Legal | `artefacts/[system-slug]/extracts/regulatory-inventory.md` |
| 6. Parity test seed catalogue | If PARITY REQUIRED rules exist | Test team lead | `artefacts/[system-slug]/extracts/parity-test-seeds.md` |

**Vendor extracts (outputs 2, 3):** no internal confidence ratings, no code references,
no regulatory detail. Written for a vendor solution architect.

**Compliance inventory (output 5):** intent vs implementation format throughout.
No confidence ratings, no code references. Written for compliance / legal.

**Parity test seeds (output 6):** Given/When/Then format. Source rule ID included.
Sourced only from PARITY REQUIRED rules rated [VERIFIED] or [PROBABLE].

---

## Completion statement

> "Reverse engineering complete for [system name].
>
> Extraction summary:
> - [n] business rules -- [n] PARITY REQUIRED, [n] MIGRATION CANDIDATE, [n] REVIEW, [n] RETIRE (pending confirmation)
> - [n] interfaces -- [n] obvious, [n] found via hidden pattern scan (not previously registered)
> - [n] regulatory rules -- [n] suggested basis identified, [n] basis unknown
> - [n] dead/disabled rules in appendix
> - SaaS fit -- [n] [PASS] NATIVE, [n] [CONFIG] CONFIG, [n] [CUSTOM] CUSTOM, [n] [FAIL] GAP, [n] [WARNING] UNKNOWN
> - [n] modernisation risk items
>
> Confidence: [n] [VERIFIED], [n] [PROBABLE], [n] [UNCERTAIN]
> [WARNING] [n] items require human verification before use as requirements.
>
> Outputs produced:
> 1. Full report ? artefacts/[system-slug]/reverse-engineering-report.md
> 2. Vendor functional requirements ? extracts/vendor-functional-requirements.md
> 3. Vendor Q&A tracker ? extracts/vendor-qa-tracker.md ([n] questions)
> 4. Architecture interface map ? extracts/architecture-interface-map.md
> 5. Compliance regulatory inventory ? extracts/regulatory-inventory.md
> 6. Parity test seed catalogue ? extracts/parity-test-seeds.md
>
> Recommended immediate actions:
> 1. Send vendor Q&A tracker to [vendor] -- resolve [WARNING] UNKNOWN items before programme commitment
> 2. Domain expert session on [UNCERTAIN] business rules -- confirm, correct, or retire
> 3. Compliance review of regulatory inventory -- verify intent vs implementation for each item
> 4. Architecture review of hidden interface findings -- [n] interfaces not previously registered
>
> Run /discovery using the pre-populated input in Section 9 of the full report
> once [UNCERTAIN] items have been reviewed and regulatory items verified."

---

## Quality checks before finalising

**Business rules**
- Every rule has a confidence rating -- none unrated
- Every [UNCERTAIN] has a specific uncertainty sentence
- Dead/disabled rules are in the appendix -- not silently omitted

**Interfaces**
- Both obvious and hidden pattern scan completed and stated
- Every hidden interface flagged explicitly
- Every [UNCERTAIN] interface is in the risk register

**Regulatory**
- Every [REGULATORY] item has both "what the code does" and "suggested regulatory basis" fields
- No regulatory basis presented as confirmed without explicit evidence
- Implementation gap risk noted for every item

**SaaS fit**
- Every [PASS] NATIVE has a stated basis -- not assumed
- Every [WARNING] UNKNOWN has a corresponding vendor Q&A tracker entry
- Every [FAIL] GAP is in the risk register as HIGH

**Outputs**
- Vendor extracts contain no confidence ratings or code references
- Regulatory inventory uses intent vs implementation format throughout
- Parity test seeds are in Given/When/Then -- not implementation descriptions

---

## What this skill does NOT do

- Does not confirm regulatory compliance -- extracts and flags for verification
- Does not make RETIRE decisions unilaterally -- flags and requires human confirmation
- Does not replace a technical due diligence or formal architecture review
- Does not produce a migration runbook or cutover plan
- Does not access production systems -- reads code and configuration files only
- Does not guarantee extraction completeness -- states explicitly what was and was not read
- Does not contact the vendor -- produces the Q&A tracker for your team to send

