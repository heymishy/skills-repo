---
name: review
description: >
  Reviews story artefacts for quality, completeness, traceability, and scope
  discipline. Produces structured findings with HIGH/MEDIUM/LOW severity.
  On re-runs, produces a diff showing exactly what changed. HIGH findings block
  progression to /test-plan. Use when stories exist and someone says "review the
  stories", "check the definition", "quality check", "re-review", or moves past
  definition. Run per story or per epic batch.
triggers:
  - "review the stories"
  - "check the definition"
  - "quality check"
  - "are these stories good"
  - "review this epic"
  - "re-review"
  - "findings"
---

# Review Skill

## Evaluator stance

Approach this review as a sceptical senior engineer whose default assumption is that issues exist. Your job is to find them, not to confirm the work is good.

Lead with findings. Structure all output as: **FINDINGS → SCORE → VERDICT**, never the reverse. Do not open with praise or a summary of what was done well.

If you are running this as an agent evaluating your own prior outputs — apply extra scrutiny. The failure mode to avoid is confirming quality rather than testing it.

---

## Entry condition check

Before asking anything, verify:

1. At least one story artefact exists in `artefacts/[feature]/stories/`
2. Parent epic artefact exists
3. Benefit-metric artefact exists (for metric linkage validation)
4. Discovery artefact exists (for scope validation)

If not met:

> ❌ **Entry condition not met**
> [Specific issue]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 — Confirm scope and re-run status

**Session recovery check:** Before listing stories, scan `artefacts/[feature]/review/` for existing artefacts matching `[story-slug]-review-N.md`. Stories with a matching artefact are already reviewed — exclude them from the scope unless the operator explicitly requests re-review. Detection is by file presence only — not session logs, not timestamps. If all stories already have artefacts, inform the operator and ask whether to re-review any.

State what was found first:

> **Stories found for review:**
> - [story title] — [previous review: Run N, PASS/FAIL / no previous review]
> - [story title] — [previous review: Run N, PASS/FAIL / no previous review]
>
> [If any have previous reviews:]
> This is a re-run for [n] stories. I'll produce a diff against the previous
> report showing what changed.
>
> Review all stories, or a specific one?
> Reply: all — or name the story

Before Step 2, read `.github/context.yml` and apply policy overlays:

- `mapping.stage_aliases` / `mapping.artefact_aliases`: include org terms in
  headings while preserving canonical story/template references
- `optimization.token_policy`: keep the main report concise and move deep evidence
  details to appendices where possible

---

## Step 2 — Confirm review categories

> **Which review categories should I run?**
>
> A — Traceability: can every story be traced back to a metric and discovery?
> B — Scope discipline: do stories stay within declared MVP and out-of-scope?
> C — AC quality: are ACs testable, specific, Given/When/Then?
> D — Completeness: are all template fields populated with real content?
> E — Architecture compliance: do stories comply with guardrails, ADRs, and the pattern library?
>
> 1. All five (default — recommended)
> 2. C and D only (short-track stories)
> 3. Custom — I'll specify
>
> Reply: 1, 2, or 3

---

## Step 3 — Run the review

### Scoring scale (apply to all criteria)

Each of the four primary criteria (Traceability, Scope integrity, AC quality, Completeness) is scored 1–5. A score below 3 on any criterion is an automatic FAIL.

| Score | Meaning |
|-------|---------|
| 5 | No issues found |
| 4 | Minor issues, no rework needed |
| 3 | Issues present but addressable without story rework |
| 2 | Issues require story rework — FAIL |
| 1 | Fundamental problem, blocks definition entirely — FAIL |

**If any criterion scores 1 or 2:** list specific line-level issues — quote the exact line, state the problem. General observations do not qualify. The output must be actionable enough for the author to fix without further clarification.

---

### Category A: Traceability

For each story:
- Story references parent epic ✓/✗
- Story references discovery artefact ✓/✗
- Story references benefit-metric artefact ✓/✗
- "So that..." connects to a named metric, not just a feature ✓/✗
- Benefit linkage field contains a real mechanism sentence ✓/✗
- Metric exists in benefit coverage matrix ✓/✗

HIGH: any broken reference or missing metric linkage
MEDIUM: benefit linkage vague but metric referenced
LOW: coverage matrix not yet updated

**Traceability score (1–5):** [score] — [one-line justification. If score < 3: list specific line-level issues.]

### Category B: Scope discipline

For each story:
- Story doesn't implement anything in epic out-of-scope ✓/✗
- Story doesn't implement anything in discovery out-of-scope ✓/✗
- Story's own out-of-scope section names at least one excluded behaviour ✓/✗
- Scope additions have an approved scope note ✓/✗

HIGH: story implements something explicitly out of scope
MEDIUM: out-of-scope section is "N/A" or missing
LOW: scope note present but not linked back to discovery

**Scope integrity score (1–5):** [score] — [one-line justification. If score < 3: list specific line-level issues.]

### Category C: AC quality

For each AC:
- Given/When/Then format ✓/✗
- Describes observable behaviour, not implementation ✓/✗
- Independently testable ✓/✗
- Uses "does/returns/displays" not "should" ✓/✗
- Edge cases have own AC, not sub-bullets ✓/✗
- Minimum 3 ACs per story ✓/✗

HIGH: fewer than 3 ACs, or not in Given/When/Then
MEDIUM: ACs use "should" or describe implementation
LOW: edge cases in sub-bullets

**AC quality score (1–5):** [score] — [one-line justification. If score < 3: list specific line-level issues.]

### Category D: Completeness

For each field against `.github/templates/story.md`:
- User story in As/Want/So format ✓/✗
- Named persona — not "a user" ✓/✗
- Benefit linkage populated ✓/✗
- Out of scope populated — not blank, not "N/A" ✓/✗
- NFRs populated or "None — confirmed" ✓/✗
- Complexity rated ✓/✗
- Scope stability declared ✓/✗

HIGH: user story missing or persona is generic
MEDIUM: NFRs blank or benefit linkage missing
LOW: complexity or scope stability not rated

**Completeness score (1–5):** [score] — [one-line justification. If score < 3: list specific line-level issues.]

---

### Overall score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | [1–5] | PASS / FAIL |
| Scope integrity | [1–5] | PASS / FAIL |
| AC quality | [1–5] | PASS / FAIL |
| Completeness | [1–5] | PASS / FAIL |

**Verdict:** PASS — all criteria scored 3 or above | FAIL — [n] criteria below threshold

### Category E: Architecture compliance

Requires `.github/architecture-guardrails.md`. If the file is not found:

> ⚠️ No `architecture-guardrails.md` found — Category E skipped.
> Create `.github/architecture-guardrails.md` to enable this check.
> Run `/bootstrap` or copy from `.github/templates/architecture-guardrails.md`.

For each story:
- Architecture Constraints field is populated (not blank) ✓/✗
- Story's implementation path doesn't violate a named approved pattern ✓/✗
- Story's implementation path doesn't use a listed anti-pattern ✓/✗
- All applicable repo-level ADRs in the Active ADRs section are referenced or respected ✓/✗
- Story NFRs align with mandatory constraints in guardrails ✓/✗

HIGH: story ACs require implementation that explicitly violates a named guardrail, mandatory constraint, or Active ADR
MEDIUM: an applicable ADR exists but isn't referenced in Architecture Constraints field; or the field is blank
LOW: pattern library or style guide component preferred but not specified in Architecture Constraints

---

## Full report output format

Conforms to `.github/templates/review-report.md`.
Save to `artefacts/[feature]/review/[story-slug]-review-[N].md`.

**Write timing — mandatory:** Write each story's artefact to disk immediately after completing that story's review — before loading or reading the next story. Do not hold findings in memory and batch-write at session end. If the session ends mid-review, all reviewed stories must already have persisted artefacts on disk.

**Write completeness — required fields:** Each per-story artefact must contain, at minimum: story slug, review date, findings list (may be empty — an explicit empty findings list is a valid complete write), severity level for each finding (HIGH/MEDIUM/LOW), and recommended action for each finding. A file missing any required field is a partial write, not a complete write.

**Output order is mandatory: FINDINGS → SCORE → VERDICT**
Never open with positive observations or a summary of what was done well.

1. **FINDINGS** — all issues, severity-labelled, specific (quote the line)
2. **SCORE** — per-criterion 1–5 scores with one-line justifications
3. **VERDICT** — PASS or FAIL with a single sentence explaining the outcome

If any criterion scores below 3, the VERDICT must be FAIL and each sub-threshold criterion must list specific line-level issues — not general observations.

Finding IDs: `[Run]-[Severity]-[Sequence]` e.g. `1-H1`, `1-M1`, `2-L1`

When a finding is resolved, reference it by its original run ID in the diff.
This creates a searchable history: "finding 1-H1 was opened in run 1, resolved in run 2."

---

## Diff output (re-runs only)

For re-runs (N > 1): prepend the Review Diff section defined in
`.github/templates/review-report.md` before the finding sections,
comparing this run's findings to the previous run.

---

## Completion output

**If PASS:**

> **Review PASSED ✅ — Run [N]**
>
> [n] HIGH: none | [n] MEDIUM: [n] (acknowledge in /decisions if proceeding)
>
> Ready to run /test-plan for [story title]?
> Reply: yes — or review another story first

**If FAIL:**

> **Review FAILED ❌ — Run [N]**
>
> [n] HIGH finding(s) must be resolved before /test-plan.
>
> Oldest open finding: [ID] — [description]
>
> Want me to walk through each HIGH finding with specific fix guidance?
> Reply: yes — or I'll fix them and re-run /review

---

## What this skill does NOT do

- Does not fix stories — identifies findings for human or /definition to address
- Does not run /test-plan
- Does not make scope decisions — flags issues, humans decide
- Does not review code — pre-coding artefact review only

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

**Write per story, not per run.** After writing each story's review report file, immediately update that story's entry in `pipeline-state.json` and `workspace/state.json` — before loading or reading the next story. Do not batch state writes to the end of the review run. Each story's state must be durable before the next story begins. This is a sequenced invariant, not an optional best practice: if the session ends mid-review, all reviewed stories must already be recorded in state.

After producing a review report, for each story reviewed update the story entry in `.github/pipeline-state.json` in the **project repository**:

- Set `stage: "review"`, `updatedAt: [now]`
- Set `reviewStatus: "passed"` if no HIGH findings, `"has-findings"` if any remain
- Set `highFindings: [count]`
- Set `health: "green"` if passed, `"red"` if HIGH findings remain, `"amber"` if MEDIUM only

**Guardrails compliance update:** After completing Category E, update the feature-level `guardrails[]` array in `pipeline-state.json`. Read the `Guardrails Registry` block from `.github/architecture-guardrails.md` (the `yaml guardrails-registry` fenced code block). For each guardrail item in the registry that was evaluated during Category E:

- If the guardrail is satisfied by all stories: add/update `{ "id": "[guardrail-id]", "category": "[category]", "label": "[label]", "status": "met", "evidence": "[finding reference or 'No violations found']", "assessedBy": "/review", "assessedAt": "[now]" }`
- If a HIGH or MEDIUM finding references the guardrail: set `"status": "not-met"`, with `"evidence"` citing the finding ID
- If the guardrail is not applicable to the feature scope: set `"status": "na"`
- Do not remove existing guardrail entries written by other skills — merge by `id`, updating `status`, `evidence`, `assessedBy`, and `assessedAt`

The guardrails array is read by the pipeline visualiser Guardrails Compliance Matrix panel.

**Human review note:** If a human resolves findings and re-approves stories outside a skill session, update `reviewStatus` and `highFindings` manually in `pipeline-state.json`, or run `/workflow` to reconcile.
