---
name: reverse-engineer
description: >
  Extracts business rules, data contracts, interface behaviour, and hidden logic from legacy
  codebases through structured six-layer analysis. Supports stack-specific reading plans
  (Spring/Spring Boot Java, Struts 2, IBM ACE/IIB ESQL, COBOL), multi-pass corpus management
  across sessions and sub-agents, and outcome-aware artefact emphasis (Enhancement reference,
  Modernisation, or Both). Produces a reverse-engineering report conforming to
  templates/reverse-engineering-report.md, and optionally a vendor Q&A tracker.
  Use when someone says "reverse engineer this", "extract the rules", "document this legacy
  system", "what does this code do", or "extract business logic from".
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

Establish before proceeding. **Q0 must be answered before Q1--Q6. Do not begin extraction until Q0 is confirmed.**

**Q0 -- Intended outcome (hard gate -- ask first)**
> "What is the intended use of this extraction?
>
> A) **Enhancement reference** -- this system stays; the extraction feeds a new feature or change that must understand current behaviour without breaking it.
>
> B) **Modernisation** -- this system is being replaced or substantially rewritten; the extraction feeds /modernisation-decompose and a replacement programme.
>
> C) **Both** -- the extraction serves as reference for near-term changes while a longer-horizon modernisation is planned in parallel.
>
> Reply: A, B, or C -- this determines which outputs are produced and where emphasis goes."

> **[If outcome B or C confirmed]** Your downstream skill after this extraction is `/modernisation-decompose`. It reads the corpus produced here to map bounded contexts and candidate feature boundaries. Keep this in mind during extraction — recording module boundaries and inter-module dependencies in Layer 1 and Layer 3 will make the decompose step faster. Convergence criteria for handing off to `/modernisation-decompose` are defined at the end of this skill.

Then establish:

1. **Codebase access** -- can the agent read the relevant files?
   If not: "Share the files, point me to the directory, or paste key modules."

2. **Scope** -- full system, specific module, or particular capability?
   If unclear: "What is the scope of this extraction?"

3. **Modernisation target** -- what is the legacy being replaced with?
   Determines whether vendor extracts and Q&A tracker are produced.

4. **Programme context** -- active programme with a known target, or exploratory?

Ask only for what is missing. Do not ask all four at once.

---

## Pass planning and corpus management

At the start of any extraction run, establish:

**Pass type** -- one of:
- `INITIAL` -- first pass on this system; no corpus exists yet
- `EXTEND` -- corpus exists; this pass adds a new bounded context or module
- `DEEPEN` -- corpus exists; re-reads a previously extracted area to resolve [UNCERTAIN] items
- `VERIFY` -- corpus exists; adds [VERIFIED] ratings from new information (domain expert session, test suite read, counterparty confirmation)

**Pass scope** -- record explicitly: which modules/bounded contexts are in scope; which layers are being run; what this pass is expected to establish that previous passes did not.

**Corpus state** -- if EXTEND/DEEPEN/VERIFY: read `artefacts/[system-slug]/corpus-state.md` before starting and state current coverage and confidence profile.

**At the end of every pass**, write `corpus-state.md` (create on INITIAL, update on subsequent passes):
- Modules covered (list)
- Module coverage % (modules read / total identified in Layer 1)
- Rule count by confidence: [VERIFIED] / [PROBABLE] / [UNCERTAIN]
- Rule count by disposition: PARITY REQUIRED / MIGRATION CANDIDATE / REVIEW / RETIRE (pending)
- Interface count: obvious / hidden / [UNCERTAIN]
- Layers completed per module
- Unresolved [UNCERTAIN] items requiring human input (summarised)
- Recommended next pass type and scope
- `lastRunAt` timestamp

[DESIGN DECISION: Four pass types chosen over freeform labelling to keep corpus-state.md machine-readable and to give the orchestrator a deterministic language for pass sequencing. Alternative: freeform text. Rejected because it prevents automated convergence checking.]

---

## Coordination model

> "This skill can be run by a single operator across multiple sessions, or by an orchestrating agent coordinating parallel sub-agent passes on different bounded contexts. In either model:
>
> - Each pass reads `corpus-state.md` before starting
> - Each pass writes `corpus-state.md` after completing
> - Parallel passes on different modules do not conflict
> - Parallel passes on the same module do conflict -- coordinate to avoid overwriting
> - The orchestrating operator or agent is responsible for convergence assessment -- no individual pass declares the corpus complete"

**If you are a sub-agent in an orchestrated extraction:**
- Your scope is defined by the orchestrator -- read it from the pass instruction
- Read `corpus-state.md` first; do not re-extract what is already [VERIFIED]
- Write only your assigned module's contribution to `corpus-state.md` (merge, do not overwrite)
- Flag cross-module dependencies you discover to the orchestrator -- do not follow them yourself unless instructed
- Your completion statement is addressed to the orchestrator, not the end user

---

## Contextual questions

Ask before reading the code. One or two at a time -- not as a form.

**Q1 -- Known pain points and undocumented behaviour**
> "Are there known areas where the system's behaviour is complex, poorly understood,
> or known to be problematic? Anything it does that isn't documented anywhere --
> workarounds, edge cases, rules that exist only in the code?
> These are the highest-value extraction targets."

**Q2 -- Regulatory context**
> "What regulatory frameworks apply to this system?
> List any that are relevant (e.g. PCI DSS, GDPR, HIPAA, SOX, AML/CFT,
> or any jurisdiction-specific financial, health, or data-protection standards).
> If your repo has a `context.yml`, the `compliance.frameworks` list is used
> automatically — only describe frameworks here if they are not yet configured.
> This determines how aggressively I flag regulatory sensitivity."

**Q3 -- Interface landscape**
> "What do you know about the systems this integrates with -- even roughly?
> Anything known upfront helps find hidden interfaces that don't appear
> in API definitions: shared database tables, file drops, polling patterns."
>
> "If your organisation maintains an EA registry repository, should I feed
> extracted application/interface candidates into `/ea-registry` after this run
> as unverified entries for owner review?"

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

**After completing the structural inventory, detect the tech stack and switch into the appropriate reading plan (see Stack-specific reading plans below). State which reading plan(s) are active before proceeding.**

State the plan before proceeding:
> "Structure scan complete. Stack detected: [Spring Boot Java / Struts 2 + ACE/IIB / COBOL / other]. Active reading plan(s): [list]. Prioritising [modules]. Estimated [n] rule categories. Hidden interface scan will focus on [patterns]. Proceeding to Layer 2A."

---

#### Stack-specific reading plans

Apply when the stack is detected in Layer 1. Multiple plans may be active simultaneously (e.g. Struts 2 + ACE/IIB + COBOL).

**Spring / Spring Boot Java**
Scan and inventory:
- `@Scheduled` methods -- batch rule locations
- `@Aspect` classes -- cross-cutting rule locations (fee application, audit, limit enforcement)
- `@ConditionalOnProperty` / `@Profile` annotations -- active feature flags that may encode business decisions
- Custom `@Validator` / `ConstraintValidator` implementations -- field-level rules as annotations
- `@Transactional` boundary map -- service methods that are atomic business units ("these three things either all happen or none do")
- Spring XML configs (pre-Boot era) -- bean definitions may contain rule configuration
- `application.yml` / `application.properties` sections -- fee tables, rate tables, limit matrices, routing priorities

**Struts 2**
Scan and inventory:
- `struts.xml` -- namespace/action/result mappings encode workflow transition rules; interceptor stack definitions encode cross-cutting compliance rules
- `*-validation.xml` files -- field-level validation rules per Action; business rules in XML that a code-only read misses entirely
- Action class hierarchy -- identify shared base Action classes as high-density rule locations
- Custom Interceptor implementations -- in banking/financial apps these are where authorisation, audit, and session rules live

**IBM ACE / IIB** *(trigger: MQ connection factory references or queue name constants appear in Java or Struts layer)*

> "[ESB DEPENDENCY DETECTED] Queue references found in Java/Struts layer. Rule logic for these interactions almost certainly lives in an IBM ACE or IIB message flow project, not in this codebase. The following queues were found: [list]. Extraction cannot be considered complete without reading the ACE project. Confidence ratings for these interfaces are capped at [UNCERTAIN] until ACE project is read."

Produce as a sub-output -- **ESB reading plan** (`artefacts/[system-slug]/extracts/esb-reading-plan.md`):
- Queue names found, classified as request/reply/error/DLQ where determinable
- ACE/IIB project files to read: `.msgflow`, `.esql`, `.subflow`, project config files
- ESQL priority targets: transformation logic files, routing condition files, error handling subflows

**COBOL** *(trigger: `.cbl`/`.cob`/`.CBL` source files present, or MQ interactions suggest COBOL backends)*
Scan and inventory:
- `EVALUATE` statements -- densest rule locations; treat each `WHEN` clause as a candidate business rule
- `PERFORM` paragraphs with business-domain names (`CALCULATE-INTEREST`, `APPLY-FEE`, `CHECK-LIMIT`) -- read fully
- `COPY` member inventory -- list all `COPY` members; treat each as a potential shared rule library and interface contract
- `FILE SECTION` definitions -- batch interface contracts; record field names, types, and positions as de-facto message format specification
- `88`-level condition names -- named business states; extract as domain vocabulary and candidate rule triggers

**Large test suites** *(trigger: test file count > ~200 files or > ~2,000 test methods)*
Apply efficient reading strategy:
- Priority scan: test class names containing `Rule`, `Policy`, `Limit`, `Fee`, `Eligibility`, `Threshold`, `Calculation`, `Validation`, `Restriction` -- read these first
- Assertion extraction: `@Test` methods asserting specific values (`assertEquals(10000, result)`) are candidate rule verifications -- extract value and condition, uprate the corresponding Layer 2A rule to [VERIFIED] if found
- Test gap map: for every PARITY REQUIRED rule from Layer 2A, note whether a corresponding test exists; untested rules are higher-risk even if the code is clear
- Dead test scan: `@Ignore`, `@Disabled`, commented-out test methods -- add to dead/disabled rules appendix with "test disabled" flag

[DESIGN DECISION: Large test suite threshold at ~200 files/~2,000 methods -- below which individual reading is feasible in one pass. Calibrate from first trial run. Alternative: no threshold. Rejected due to overhead for small suites.]

*(Extension point for other stacks: add a reading plan block here following the same checklist format. Do not implement until the stack is confirmed as in-scope.)*

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

**Stack-specific Layer 2B additions:**
- *Spring*: `@Aspect` advice methods (especially `@Around` and `@AfterThrowing` -- cross-cutting rule logic). `@EventListener` / `ApplicationListener` implementations -- asynchronous business rules triggered by domain events.
- *Struts 2*: `*-validation.xml` files (read here if not inventoried in Layer 1). Interceptor `intercept()` method bodies.
- *COBOL*: `EVALUATE` `WHEN OTHER` clauses -- default handling paths that often encode the most brittle rules.

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

If `/ea-registry` is available in the current skill pack, include a handoff list
for registry contribution:
- application candidates (name, slug, owner/domain if known)
- interface candidates (source, target, type/subtype, criticality)
- verification caveats and evidence links

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

*Applies to Modernisation (B) and Both (C) outcomes only. Skip for Enhancement reference (A).*

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

## Outcome-aware artefact emphasis

**Enhancement reference (A):**
- Emphasis on Layer 2B (hidden rules breakable by a change) and Layer 3 (interfaces affected by a change)
- Parity test seeds scoped to the affected bounded context only
- No vendor functional requirements, no SaaS fit assessment
- Completion statement routes to: "Use as reference input for /discovery for [feature name]"
- `corpus-state.md` records scope as `enhancement-reference`

**Modernisation (B):**
- Full six-layer extraction; all outputs produced; SaaS fit assessment mandatory
- Completion statement routes to: "Run /modernisation-decompose once convergence criteria are met"

**Both (C):**
- Run as Modernisation but add `[CHANGE-RISK]` flag on rules and interfaces a near-term change is most likely to interact with
- Completion statement produces two routing options:
  - Immediate: "Use [CHANGE-RISK] flagged section as reference for /discovery for [near-term feature]"
  - Deferred: "Run /modernisation-decompose once convergence criteria are met"

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
| 7. ESB reading plan | If ACE/IIB dependency detected | Integration team | `artefacts/[system-slug]/extracts/esb-reading-plan.md` |
| 8. Corpus state | Always (create on INITIAL, update on subsequent passes) | Orchestrator / next pass agent | `artefacts/[system-slug]/corpus-state.md` |
| 9. Discovery seed | INITIAL or DEEPEN pass, when Q0 is not DEFER | Platform maintainer / /discovery operator | `artefacts/[system-slug]/discovery-seed.md` |

### Output 9 — discovery-seed.md

Produce at the end of any INITIAL or DEEPEN pass. **Not produced when Q0 outcome is DEFER.**

Structured to mirror the `/discovery` template. Include four sections:

| Section | Derived from |
|---------|-------------|
| System name | Target system identified in Q1 |
| Problem framing | Known failure modes and REVIEW-disposition rules in the corpus |
| Known constraints | All PARITY REQUIRED rules (use `L<layer>-<seq>` rule-id format, e.g. `L1-001`) |
| Personas | User types identified during Layer 2 analysis |

The seed is a draft discovery artefact — the /discovery operator refines it, not the agent.

**Vendor extracts (outputs 2, 3):** no internal confidence ratings, no code references,
no regulatory detail. Written for a vendor solution architect.

**Compliance inventory (output 5):** intent vs implementation format throughout.
No confidence ratings, no code references. Written for compliance / legal.

**Parity test seeds (output 6):** Given/When/Then format. Source rule ID included.
Sourced only from PARITY REQUIRED rules rated [VERIFIED] or [PROBABLE].

---

## Corpus convergence criterion

The corpus is ready for /modernisation-decompose when ALL of the following hold:

1. Layer 1 complete for the full system (full module inventory exists)
2. Layer 2A + 2B complete for all in-scope modules (or explicitly deferred with reason)
3. Layer 3 complete -- no [UNCERTAIN] interfaces whose counterparty is completely unknown (unknown format is acceptable; unknown existence is not)
4. No ESB dependency flags outstanding (ACE project read, or explicitly deferred with RISK-ACCEPT)
5. [VERIFIED]:[UNCERTAIN] ratio >= 2:1 across PARITY REQUIRED rules
6. All [REGULATORY] items have at least a SUGGESTED regulatory basis

If convergence is not met, the completion statement must say so explicitly and recommend the specific next pass type.

> **[Outcomes B and C]** When ALL convergence criteria are met, the corpus is ready for `/modernisation-decompose`. Run it immediately — do not start writing stories or decomposing manually. `/modernisation-decompose` reads the corpus artefacts and Layer 1 module inventory and produces the candidate feature boundaries in a single structured pass.

[DESIGN DECISION: 2:1 ratio on PARITY REQUIRED rules is a calibration target for first two trials, not a validated gate. Treat as adjustable after real extraction runs. Do not enforce as a hard gate until calibrated.]

---

## Completion statement

> "Reverse engineering complete for [system name] -- Pass type: [INITIAL/EXTEND/DEEPEN/VERIFY].
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
> Corpus state: [convergence met / not yet met -- [n] criteria outstanding]
> [If not met: "Recommended next pass: [EXTEND/DEEPEN/VERIFY] -- [specific scope]"]
>
> Outputs produced:
> 1. Full report ? artefacts/[system-slug]/reverse-engineering-report.md
> 2. Vendor functional requirements ? extracts/vendor-functional-requirements.md
> 3. Vendor Q&A tracker ? extracts/vendor-qa-tracker.md ([n] questions)
> 4. Architecture interface map ? extracts/architecture-interface-map.md
> 5. Compliance regulatory inventory ? extracts/regulatory-inventory.md
> 6. Parity test seed catalogue ? extracts/parity-test-seeds.md
> 7. ESB reading plan ? extracts/esb-reading-plan.md [if produced]
> 8. Corpus state ? artefacts/[system-slug]/corpus-state.md
>
> Recommended immediate actions:
> 1. [If ESB outstanding]: Read ACE/IIB project using ESB reading plan before committing confidence ratings on flagged interfaces
> 2. Send vendor Q&A tracker to [vendor] -- resolve [WARNING] UNKNOWN items before programme commitment
> 3. Domain expert session on [UNCERTAIN] business rules -- confirm, correct, or retire
> 4. Compliance review of regulatory inventory -- verify intent vs implementation for each item
> 5. Architecture review of hidden interface findings -- [n] interfaces not previously registered
>
> [If outcome A]: Use as reference input for /discovery for [feature name].
> [If outcome B]: Run /modernisation-decompose once convergence criteria are met.
> [If outcome C -- immediate]: Use [CHANGE-RISK] flagged section as reference for /discovery for [near-term feature]. [Deferred]: Run /modernisation-decompose once convergence criteria are met."

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

**Corpus state**
- `corpus-state.md` written or updated for this pass (INITIAL = create, others = update)
- Pass type, scope, and `lastRunAt` recorded

**VERIFY pass**
- If any PARITY REQUIRED rule was added, retired, or had its disposition changed since the last pass: update Output 9 (discovery-seed.md) to reflect the change.

**Stack-specific**
- If Spring detected: `@Aspect`, `@Scheduled`, `@Transactional` inventory produced
- If Struts 2 detected: `struts.xml` and `*-validation.xml` reads included
- If ACE/IIB detected: ESB dependency flag raised; ESB reading plan produced; affected interfaces capped at [UNCERTAIN]
- If COBOL detected: `EVALUATE` and `PERFORM` paragraphs inventoried; `COPY` members listed

---

## What this skill does NOT do

- Does not confirm regulatory compliance -- extracts and flags for verification
- Does not make RETIRE decisions unilaterally -- flags and requires human confirmation
- Does not replace a technical due diligence or formal architecture review
- Does not produce a migration runbook or cutover plan
- Does not access production systems -- reads code and configuration files only
- Does not guarantee extraction completeness -- states explicitly what was and was not read
- Does not contact the vendor -- produces the Q&A tracker for your team to send
- Does not declare corpus convergence -- the orchestrating operator or agent does; no individual pass claims the corpus is complete

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` for the relevant feature after the report is produced:

- Set `reverseEngineerStatus: "complete"`, `updatedAt: [now]`
- If vendor Q&A tracker was produced: set `vendorQATrackerCreated: true`
- If any FAIL gaps were found: set `health: "amber"` and list the first gap in `blocker`

