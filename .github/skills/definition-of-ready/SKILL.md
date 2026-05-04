---
name: definition-of-ready
description: >
  Final gate check before a story is handed to the coding agent. Runs hard blocks
  (H1–H9, H-E2E, H-NFR through H-NFR3) and warnings (W1-W5), determines oversight level, and produces a coding
  agent instructions block when all hard blocks pass. Blocks are unambiguous - all
  must pass, no exceptions. Warnings require explicit acknowledgement. Use when
  test plan and review are complete and someone says "is this story ready",
  "definition of ready", "ready to code", or moves past /test-plan.
triggers:
  - "is this story ready"
  - "definition of ready"
  - "ready to code"
  - "DoR"
  - "can we start coding"
  - "assign to coding agent"
---

# Definition of Ready Skill

## Entry condition check

Before asking anything, verify:

1. Story artefact exists at `artefacts/[feature]/stories/[story-slug].md`
2. Review report exists showing PASS (no unresolved HIGH findings)
3. Test plan exists at `artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
4. AC verification script exists at `artefacts/[feature]/verification-scripts/[story-slug]-verification.md`

If not met:

> ❌ **Entry condition not met**
> Missing: [specific item]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 - Confirm the story

State what was found:

> **Story loaded:** [story title]
> **Review:** PASS - Run [N], [date]
> **Test plan:** [n] tests covering [n] ACs
> **Verification script:** [n] scenarios
>
> Running definition-of-ready check on this story.
> Reply: go - or name a different story

Read `.github/context.yml` before evaluating oversight:

- `mapping.governance.gates`: if a mapped gate corresponds to DoR sign-off,
  use its org label in output (keep `definition-of-ready` wording as canonical)
- `mapping.stage_aliases`: include org-stage alias in completion guidance

---

## Step 2 — Contract proposal

Before running the checklist, the coding agent must produce a Contract Proposal. This shifts DoR from a self-certification gate to a negotiated contract reviewed before any implementation begins.

Present the following to the story author for review:

> **Contract Proposal — [story title]**
>
> **What will be built:**
> [In implementation terms — not a restatement of ACs. Name the specific components, functions, or UI changes that will be created or modified.]
>
> **What will NOT be built:**
> [Explicit scope boundary. Name at least one behaviour that is out of scope for this story and why.]
>
> **How each AC will be verified:**
> | AC | Test approach | Type |
> |----|---------------|------|
> | [AC 1 summary] | [specific test: e.g. unit test on X function, E2E via Y flow] | unit / integration / E2E |
>
> **Assumptions:**
> [Any assumptions about system behaviour, data state, third-party behaviour, or user context not stated in the story.]
>
> **Estimated touch points:**
> Files: [list], Services: [list], APIs: [list]

---

## Step 3 — Contract review

Review the Contract Proposal against the story ACs and test plan.

For each mismatch between proposed implementation and stated AC — flag as a **hard block**:

> ❌ **Contract mismatch — hard block**
> AC: [AC text]
> Proposed approach: [what the contract says]
> Issue: [specific mismatch — e.g. "contract verifies via unit test but AC requires observable UI behaviour"]
>
> Revise the Contract Proposal before proceeding.

If no mismatches:

> ✅ **Contract review passed** — proposed implementation aligns with all ACs.

The hard blocks (H1–H13) run after contract review passes, not instead of it.

Output format: **CONTRACT PROPOSAL → CONTRACT REVIEW → CHECKLIST → READY/BLOCKED**

---

## Hard blocks - H1 onwards

All must pass. No exceptions. Run each check and record PASS or FAIL.

| # | Check | Source |
|---|-------|--------|
| H1 | User story is in As / Want / So format with a named persona | Story |
| H2 | At least 3 ACs in Given / When / Then format | Story |
| H3 | Every AC has at least one test in the test plan | Test plan |
| H4 | Out-of-scope section is populated - not blank or N/A | Story |
| H5 | Benefit linkage field references a named metric | Story |
| H6 | Complexity is rated | Story |
| H7 | No unresolved HIGH findings from the review report | Review |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | Test plan |
| H8-ext | Cross-story schema dependency check: if the story's Dependencies block lists at least one upstream story (not "None"), the DoR contract must include a `schemaDepends: [field1, field2]` declaration. Check each declared field against `pipeline-state.schema.json` — if any declared field is absent, fire as a hard block: "H8-ext FAIL: [field] declared in schemaDepends is not present in pipeline-state.schema.json. Add the field to the schema or correct the schemaDepends declaration before sign-off." If the story's Dependencies block is "None", pass with: "H8-ext: no upstream dependencies declared — schema check not required." | DoR contract + pipeline-state.schema.json |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | Story + Architecture guardrails |
| H-E2E | If any AC in the test plan is typed `CSS-layout-dependent` AND no E2E tooling is configured AND no `RISK-ACCEPT` is recorded in /decisions for this gap - block sign-off | Test plan + Decisions |
| H-NFR | NFR profile exists at `artefacts/[feature]/nfr-profile.md` — or story has explicit `NFRs: None — reviewed [date]` field | NFR profile / Story |
| H-NFR2 | Any compliance NFR with a named regulatory clause has documented human sign-off | NFR profile |
| H-NFR3 | Data classification field in NFR profile is not blank | NFR profile |
| H-NFR-profile | NFR profile presence check (B1-enforce): if the story's NFR section is not "None" or blank, check that `artefacts/[feature]/nfr-profile.md` exists. If absent, fire as a hard block: "H-NFR-profile FAIL: story declares NFRs but no feature NFR profile exists at artefacts/[feature]/nfr-profile.md. Create the NFR profile (run /definition Step 7) before sign-off." If the story's NFR section is "None" or blank, skip this check. | Story + NFR profile |
| H-GOV | Governance approval check: `## Approved By` section in the discovery artefact must contain ≥1 non-blank named entry. Read the artefact directly from the file system (not pipeline-state.json). Presence-only check per ADR-017. See H-GOV detail section below. | Discovery artefact |
| H-ADAPTER | Injectable adapter wiring check (D37): if the story introduces one or more injectable adapters (`setX()` functions), each adapter must have (a) an explicit AC scoping the production wiring in the server/wiring module, (b) the stub default must throw (not return null/empty — silently safe-looking returns mask misconfiguration), and (c) the implementation plan must name the wiring as a separate task from the handler task. If any adapter lacks a wiring AC, fire as hard block: "H-ADAPTER FAIL: adapter `setX` is introduced by this story but no AC scopes its production wiring in server.js (or equivalent). Add a wiring AC before sign-off." | Story ACs + DoR contract |

**If any hard block fails - stop immediately:**

> ❌ **BLOCKED - [n] hard block(s) failed**
>
> [For each failed block:]
> H[n] [Check name]: [specific issue]
> Fix: [exactly what needs to happen]
>
> Resolve these and re-run /definition-of-ready.
> Reply: done - and I'll re-run the check

---

### H-GOV — Governance approval detail

<!-- h-gov-block -->

Read the discovery artefact directly from the file system (`artefacts/[feature]/discovery.md`). Do not read from pipeline-state.json. Locate the `## Approved By` section and evaluate all four cases:

**AC1 (PASS):** `## Approved By` section exists and has ≥1 non-blank named entry → H-GOV passes, DoR checklist continues.

**AC2 (FAIL — empty section):** `## Approved By` section exists but is empty (no entries present):

> ❌ **H-GOV FAIL — Approved By section is empty**
> The `## Approved By` section in the discovery artefact exists but contains no entries.
> Resolution: add a named approver to the `## Approved By` section in the discovery artefact before sign-off.

**AC3 (FAIL — absent section):** `## Approved By` section is not present in the discovery artefact:

> ❌ **H-GOV FAIL — Approved By section is missing**
> The discovery artefact does not contain an `## Approved By` section.
> Resolution: update the discovery artefact using the `.github/templates/discovery.md` template, which includes the required `## Approved By` section.

**AC4 (FAIL — engineer-only entries):** All entries in `## Approved By` are engineering-role names (e.g. "Lead Engineer", "Tech Lead", "Developer"):

> ❌ **H-GOV FAIL — Approved By contains engineer-only entries**
> All entries in the `## Approved By` section are engineering roles. H-GOV requires at least one named non-engineering approver.
> This is distinct from an empty or absent section — entries are present but do not meet the governance requirement.
> Resolution: add a named non-engineering approver (e.g. product owner, business stakeholder) to the `## Approved By` section in the discovery artefact.

**AC5 — Trigger-to-check (benefit-metric "Attribution incomplete" note):**
If the benefit-metric artefact contains an "Attribution incomplete" note, this is a trigger-to-check signal only — not an automatic block. H-GOV performs a live read of the discovery artefact's `Approved By` field.
- If the live read finds `Approved By` is now corrected and substantively populated: H-GOV passes (the stale benefit-metric note does not permanently block this story). The required format is: `Name — Role — Date`
- If the live read finds `Approved By` is still empty or Pending: H-GOV fails with the standard fail message above.

**M1 metric signal:**
- When Approved By has text but the role is not clearly non-engineering: H-GOV passes — record M1 signal (role unverified for independent sign-off quality).
- When the approver title clearly identifies them as non-engineering (PM, product owner, business stakeholder): record positive M1 signal.

---

## Warnings - W1 to W5

Warnings do not block. Each requires explicit acknowledgement to proceed.

| # | Check | Source |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None - confirmed" | Story |
| W2 | Scope stability declared | Story |
| W3 | MEDIUM review findings acknowledged in /decisions | Review + Decisions |
| W4 | Verification script reviewed by a domain expert | Verification script |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | Test plan |

If any warnings apply, surface them one at a time:

> ⚠️ **Warning W[n]: [Check name]**
> Risk if proceeding: [what could go wrong]
>
> How do you want to handle this?
> 1. Resolve it now before proceeding
> 2. Acknowledge the risk and proceed — I'll invoke /decisions to log it
>
> Reply: 1 or 2

If the user chooses option 2, immediately invoke /decisions to log the RISK-ACCEPT entry before continuing to the next check. Do not defer the log until the end of the run.

---

## Oversight level

Check the parent epic for the oversight level:

**Low** - no sign-off required. Proceed directly to coding agent assignment.

**Medium** - tech lead awareness required (see `context.yml: roles.tech_lead`).
Share the DoR artefact before assigning. No formal sign-off needed.
Surface as:
> ⚠️ **Medium oversight** - share the DoR artefact with the tech lead
> before assigning to the coding agent.
> Confirmed you'll do this?
> Reply: yes

**High** - human sign-off required before assigning.
Surface as:
> 🔴 **High oversight** - named sign-off required.
> Who is signing off on this story?
> Reply: [name and role]
>
> Record their sign-off in the DoR artefact (name + date) before assigning.

---

## Standards injection

After warnings are acknowledged, check whether the story carries domain tags that
trigger coding standards:

1. Read the story's `domain` field (e.g. `domain: [api, auth]`)
2. Open `.github/standards/index.yml`
3. For each tag that matches a key in `standards:`, read the listed standards files
4. Include the full text of matching standards files in the Coding Agent Instructions block
   under a `## Applicable standards` section

If `.github/standards/index.yml` does not exist — skip silently. Standards injection
is optional enhancement, not a hard requirement.

If the story has no `domain` field — skip silently.

Surface what was found:

> **Standards injection:**
> Domain tags: [api, auth]
> Matched standards files: [list of files found]
>
> [If files found:]
> These will be appended to the coding agent instructions block.
>
> [If no files found for a tag:]
> Tag `[tag]` was not found in index.yml — no standards injected for that domain.

---

## Coding agent instructions block

Produced when all hard blocks pass. Written into the DoR artefact.

Conforms to the `## Coding Agent Instructions` section of `templates/definition-of-ready-checklist.md`.

Save DoR artefact to `artefacts/[feature]/dor/[story-slug]-dor.md`
conforming to `.github/templates/definition-of-ready-checklist.md`.

Save the approved Contract Proposal to `artefacts/[feature]/dor/[story-slug]-dor-contract.md`.

---

## Completion output

> ✅ **Definition of ready: PROCEED - [story title]**
>
> Hard blocks: [n]/[n] passed
> Warnings: [n] acknowledged / [n] resolved
> Oversight: [Low / Medium / High]
>
> [If any warnings were acknowledged during this run:]
> ⚠️ **Outstanding decisions to log** — run /decisions now to record the RISK-ACCEPTs above before starting the inner loop.
> Reply: done - or run /decisions for me

> [If Low:]
> Assign the story to the coding agent using the instructions block in the DoR artefact.
>
> **Inner coding loop order:**
> 0. /decisions — log any RISK-ACCEPTs from this DoR run (if not already done above)
> 1. /branch-setup - create isolated worktree, verify clean baseline
> 2. /implementation-plan - write bite-sized task plan from this DoR
> 3. /subagent-execution (recommended) or /tdd per task
> 4. /verify-completion - run full test suite + walk through AC verification script
> 5. /branch-complete - open draft PR (never mark ready for review)
>
> Support skills available throughout: /tdd, /systematic-debugging, /implementation-review
>
> **Dispatch to GitHub agent:** After sign-off, run `/issue-dispatch` to create the GitHub issue for the coding agent. The dispatch skill automatically generates a `Closes #[issueNumber]` line in the PR description — this causes GitHub to auto-close the dispatch issue when the PR is merged. You do not need to add the Closes keyword to the PR body manually.
>
> [If Medium:]
> Share the DoR artefact with the tech lead, then begin the inner coding loop above.
>
> [If High:]
> Obtain sign-off from [name], record it in the DoR artefact, then begin the inner coding loop above.
>
> After the PR is merged: run /definition-of-done.
> Reply: understood - or I have a question about the instructions block

---

## What this skill does NOT do

- Does not fix story or test plan artefacts - identifies issues and stops
- Does not assign to the coding agent - that is a human action
- Does not run the coding agent
- Does not approve the PR
- Does not override a BLOCK - all hard blocks must pass

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** after producing the DoR output, for each story:

- If all hard blocks pass: set `stage: "definition-of-ready"`, `dorStatus: "signed-off"`, `health: "green"`, `updatedAt: [now]`
- If any hard block fails: set `dorStatus: "blocked"`, `health: "red"`, `blocker: "[first failing block description]"`, `updatedAt: [now]`

**Guardrails compliance update:** After evaluating H9 (Architecture Constraints), H-NFR, H-NFR2, and H-NFR3, update the feature-level `guardrails[]` array:

- For H9: update guardrail entries whose `id` matches any guardrail referenced in story Architecture Constraints fields. Set `"status": "met"` if H9 passed, `"status": "not-met"` if H9 failed, with `"assessedBy": "/definition-of-ready"`.
- For H-NFR: if an NFR profile exists, read its items and add/update entries with `"category": "nfr"` in the guardrails array. Each NFR item becomes a guardrail entry: `{ "id": "NFR-[slug]", "category": "nfr", "label": "[NFR label]", "status": "met" or "not-met", "assessedBy": "/definition-of-ready", "assessedAt": "[now]" }`
- Merge by `id` — do not remove existing entries from other skills.
- **Schema-valid guardrail values only.** When writing `status`, use only: `met`, `not-met`, `na`, `excepted`, `not-assessed`. Do not use informal synonyms (`pass`, `fail`, `deferred`, `no-breach`, `not-applicable`, `has-finding`). When writing `category`, use only: `mandatory-constraint`, `adr`, `nfr`, `compliance-framework`, `pattern`, `anti-pattern`. Subcategories (`performance`, `security`, `audit`) must be written as `nfr`. These values are validated by `validate-trace.sh --ci` — invalid values cause hard CI failures on agent PRs.

**Human sign-off note:** DoR requires explicit human sign-off. When a human confirms "Proceed", update `dorStatus: "signed-off"` in the state file if not already set, or run `/workflow` to reconcile.

> **Capture signal:** Write ambiguities, blocker causes, or scope decisions to `workspace/capture-log.md` (source: agent-auto).
