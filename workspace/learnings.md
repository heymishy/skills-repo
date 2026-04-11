# workspace/learnings.md

Platform dogfood signal log. One entry per metric measurement event. Populated during Phase 1 delivery. This file is the human-readable view; the canonical measurement records live in `artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md` under each metric's evidence section.

**Date format convention (from 2026-04-10):** Use `YYYY-MM-DD HH:MM` (24-hour local) for all `### Observed —` and `### Invocation —` headings. Date-only is insufficient when multiple entries are written on the same day. Entries written before this convention was introduced are left as-is.

---

## MM3 — /checkpoint mid-phase write

### Invocation 1 — 2026-04-09

**Circumstance:** Deliberate test invocation at a natural mid-phase break. User invoked `/checkpoint` between epic 3 and epic 4 during the `/definition` outer loop stage.

**What happened:**
- Agent received `/checkpoint`, read `workspace/state.json`, and began writing the definition section.
- Context compaction fired during write execution.
- The `replace_string_in_file` call completed successfully before compaction closed the session.
- Session ended — not via a clean agent "I am done, goodbye" exit, but via context compaction reaching its threshold and compressing the session.

**Sub-condition results:**

| Sub-condition | Result | Notes |
|---------------|--------|-------|
| (1) Terminates within 60 seconds | Partial pass | Session ended within window but via compaction, not clean exit |
| (2) Phase section fully populated | Pass | All definition fields present: status, slicing strategy, epic counts, story slugs, resumeInstruction |
| (3) New session resumed correctly | TBD | Test on next session open |

**Verdict:** Above floor (write completed, session ended, all required fields present). Below full target (compaction fired rather than clean terminate — sub-condition 1 not fully satisfied by intended mechanism).

**Gap:** The `/checkpoint` convention says "invoke at 75% context threshold" but provides no guidance on how much headroom is needed for the write itself to complete before the threshold triggers compaction. Late-invoked checkpoint races compaction. Fix: add documentation note that `/checkpoint` should be invoked with enough remaining context that the write can complete cleanly — not at the exact compaction threshold.

**Action:** Update `/checkpoint` note in `copilot-instructions.md`. Test sub-condition 3 on next session open. If sub-condition 3 passes, proceed to invocation 2 to test clean-exit path deliberately.

---

## Pipeline gap — learnings.md not written at definition phase completion

### Observed — 2026-04-09

**Circumstance:** `/definition` phase completed fully (4 epics, 10 stories, NFR profile, scope check, coverage matrix update, both state files updated). Session then continued into a pre-/review quality gate check at operator request.

**What was missed:** The definition skill does not have a mandatory "write learnings signal" step in its exit sequence. `workspace/learnings.md` was not updated during the definition run — the phase completed with no learnings written even though several reusable observations occurred during story writing.

**Observations that should have been written:**
- Risk-first slicing in a 4-epic, 10-story set with nested dependencies (P1.3 → prototype fixes) forces you to front-load prototype fix stories that have no direct metric coverage. This is correct but creates a coverage matrix gap that must be explicitly reconciled rather than filled by natural decomposition.
- Scope accumulator ratio 1.25 (10 stories / 8 MVP items) with 2 non-counting prototype fix stories is a clean signal. Any ratio above 1.3 without named prerequisite justification should be a definition review flag.
- NFR profile generation should happen before benefit-metric coverage matrix reconciliation, not after. NFR constraints on stories (e.g. results.tsv append-only, credentials structural) sometimes reveal that a story cannot achieve its metric without an additional constraint AC. Catching this before the coverage pass avoids a re-pass.
- Standards model story (P1.7) required loading a reference file (`ref-skills-platform-standards-model.md`) that was not listed in the skill's read list. If a story's domain requires external reference material, that material should be surfaced at epic planning time, not discovered mid-story.

**Action:** Add a learnings-write step to `/definition` skill exit sequence. Flag for pipeline improvement in next `/levelup` run post-merge.

---

## Definition skill gap — prerequisite stories written without dependency chain validation

### Observed — 2026-04-09

**Circumstance:** Epic 1 (Prototype Test Suite Stabilisation) was written during `/definition` based on two RISK-ACCEPT entries in `decisions.md` from the discovery phase. The RISK-ACCEPTs stated that prototype test failures must be resolved before P1.3 can enter DoR. The definition skill accepted this as written and created two prerequisite stories.

**What was wrong:** P1.3 (assurance CI gate) targets the skills repo, not the prototype repo. The platform is dogfooding itself — the CI gate runs on skills repo PRs. The prototype is a proof-of-concept that validated the three-agent pattern; its test failures have zero impact on the skills repo's test suite or P1.3 delivery. The two stories had no metric trace and no actual dependency on the target repository.

**Root cause:** The definition skill did not validate the dependency chain before writing prerequisite stories. It read named prerequisites from discovery artefacts and wrote stories without asking: does each prerequisite story trace to a deliverable that traces to a metric in the target repository?

**Proposed check for definition SKILL.md:** Before writing any prerequisite story flagged from discovery, verify:
1. Does the prerequisite exist in the same target repository as the stories that depend on it?
2. Does resolving the prerequisite trace to at least one metric in the benefit-metric artefact via a story that is in scope?
3. If the prerequisite was flagged as a RISK-ACCEPT against a different codebase (e.g. a proof-of-concept repo), is that codebase actually the delivery target for this feature?

If any check fails: flag to operator with a summary of the dependency chain gap before writing the story. Do not write the story on the assumption that the discovery artefact's named prerequisites are fully validated.

**Resolution:** Epic 1 and both stories voided 2026-04-09. SCOPE decision recorded in `decisions.md`. Plan now 3 epics, 8 stories, scope ratio 1.0.

**Action:** Add dependency chain validation check to `/definition` SKILL.md prerequisite story section. Flag for `/levelup` post-merge.

### Observed — 2026-04-09

**Circumstance:** /checkpoint triggered at ~61% context. Compaction fired during the write, not at 75% as the guideline states.

**Root cause:** The 75% guideline was calibrated against message-heavy phases (conversation, clarification). File-read-heavy phases (definition, review) fill the Tool Results bucket faster than the Messages bucket. By the time the Messages bucket shows ~61%, the Tool Results bucket may already be near threshold. The effective safe working window is lower.

**Finding:** Revise /checkpoint guidance: invoke at 55–60% for file-read-heavy phases (definition, review, trace). The 75% guideline remains appropriate for conversation-only phases. Distinguish the two cases in the checkpoint documentation.

**Action:** Update /checkpoint invocation guidance in `copilot-instructions.md` or the relevant skill. Flag for `/levelup` post-merge.

---

## Pipeline gap — session-end commit is an agent initiative, not a named checkpoint step

### Observed — 2026-04-09

**Circumstance:** During checkpoint, the agent staged and committed all untracked artefacts (21 files, full definition phase output). This was correct behaviour — artefacts were committed with a descriptive message and hooks passed. However, it was not an explicitly instructed step; the agent inferred it from the session-end protocol comment in `copilot-instructions.md`.

**Finding:** The session-end commit is load-bearing (it's the recovery point for the next session) but it's currently implicit. An agent that reads the protocol less carefully may skip it, or commit at the wrong granularity, or commit with an uninformative message. The commit step should be a named, sequenced item in the /checkpoint exit sequence — not inferred from prose.

**Proposed checkpoint exit sequence (explicit):**
1. Write learnings signal(s) to `workspace/learnings.md`
2. Write checkpoint block to `workspace/state.json` with `resumeInstruction`
3. Stage all untracked artefact files produced this session (`git add artefacts/[feature]/...`)
4. Commit with message format: `chore: [phase] checkpoint [feature-slug] — [one-line summary]`
5. Confirm commit hash and hook results in closing message

**Action:** Add numbered exit sequence to /checkpoint skill or copilot-instructions.md. Flag for `/levelup` post-merge.

---

## Pipeline gap — /review skill self-checkpointed correctly but from emergent behaviour, not instruction

### Observed — 2026-04-10

**Circumstance:** During the /review run across 8 stories, the agent wrote progress to `workspace/state.json` and `pipeline-state.json` at session end rather than incrementally after each story. It did not lose any review outputs because all 8 stories were completed in a single short session, but the checkpoint was a session-level write, not a per-story write.

**What was correct (and fragile):** The agent ultimately preserved the correct state. But this happened because the session stayed within context bounds and the agent inferred that state management was appropriate at exit. It was not instructed to write state after each story.

**The structural gap:** The /review skill's state update section says "after producing a review report, update the story entry in pipeline-state.json." It does not say "do this immediately after writing the report file, before loading the next story." An agent under context pressure — or one that interprets "after" as "after all stories" — will batch the writes. Batched writes are fragile: if the session ends mid-review (context compaction, user interruption, tool failure), all progress since the last explicit write is lost.

**Required fix:** Add an explicit incremental-write instruction to the /review skill's state update section:

> After writing each story's review report file, immediately write that story's entry to `pipeline-state.json` and `workspace/state.json` — before loading or reading the next story. Do not batch state writes to the end of the review run. Each story's state must be durable before the next story begins.

This makes the self-checkpoint structural: it will happen reliably across models and sessions because it is an explicit sequenced instruction, not an inferred best practice. A model that skips it is non-compliant with the skill, not merely less helpful.

---

## Pipeline gap — context pressure causes earlier-than-expected session boundaries

### Observed — 2026-04-10 (session 6, immediately post MEDIUM-ack git commit)

**Circumstance:** Cross-session continuity worked correctly across all six sessions covering discovery, benefit-metric, definition, and review. The checkpoint pattern worked when invoked. The review skill produced precise, actionable findings on first run. The pipeline is functioning end-to-end.

**Pattern:** The single consistent friction point across every session has been context pressure causing earlier-than-expected session boundaries. Every session has effectively ended at 50–60% of its intended working scope rather than 75%. Tool Results content — file reads, search output, command output — accumulates faster than the Messages bucket. The effective safe working window is smaller than the pipeline currently assumes.

**Compaction trigger event:** Session 6 ended via context compaction immediately after the MEDIUM-acknowledgement git commit. The agent's last visible output was the start of a state.json update instruction — the compaction fired mid-sentence: "also update the checkpoint pendingActions now that the MEDIUM acknowledgements are done: Compacted conversation." At that point, the only remaining action was proceeding to `/test-plan`. No work was lost, but the session closed at approximately 50% of intended daily scope.

**Why this matters:** This affects every phase, but file-read-heavy phases (definition, review, trace) are most vulnerable. Loading 6–8 artefacts per review story fills the Tool Results bucket faster than conversation-heavy phases do. The pipeline's throughput per session is approximately half of what the design assumes. Each `/test-plan` run will face the same pressure — loading a story, its review report, the benefit-metric coverage row, and architecture guardrails before writing a single test is already 3–4 large file reads.

**Impact on P1.1 (progressive disclosure):** P1.1 directly addresses this by replacing eager full-skill loads with on-demand progressive disclosure. The before/after context footprint comparison should be treated as a primary metric for P1.1, not a secondary one. The dogfood run has generated a concrete, measurable cost to compare against.

**Priority:** This is the most important gap finding from the Phase 1 dogfood run. It is the first item the improvement loop should address once P1.1 and P2.2 are delivered.

**Candidate improvements:**
- Calibrate session scope planning: assume 55–60% effective window for file-read-heavy phases
- Token optimisation audit: identify which artefact reads can be replaced by targeted searches or summary reads
- Per-session throughput tracking: measure stories/phase-steps completed per session as a P1.1 before-baseline

**Action:** Log as a primary eval scenario for P1.6 (living eval regression suite). Track per-session throughput as a P1.1 baseline metric.

**Why this matters for eval:** The /review skill's "mandatory final step" is already present but is framed as a post-run batch operation. It should be re-framed as a per-story invariant. An eval scenario guarding this should test: "given a review session that is interrupted after story N of M, then stories 1..N are durably recorded in state."

**Action:** Update `/review` SKILL.md state update section to add the incremental-write-per-story instruction. Flag for `/levelup` post-merge. Candidate eval scenario for `workspace/suite.json` (P1.6) once that story is implemented.

---

## Pipeline gap — untestable documentation is a scope anti-pattern

### Observed — 2026-04-10

**Circumstance:** Review and test-plan phases surfaced that the Bitbucket Pipelines equivalent requirement (in p1.3 AC6, p1.1 Architecture Constraints, and discovery.md) was present in every artefact layer — but the dogfood context has no Bitbucket environment to run it against. The constraint was written at discovery as a forward-looking portability requirement and propagated faithfully through definition, review, and test-plan. It was caught at the test-plan stage when the verification script made it concrete: "Open the CI configuration file and look for two sections — one for GitHub Actions, one for Bitbucket Pipelines."

**Finding:** When a required artefact output cannot be tested in the delivery environment, it is unreliable by definition. Writing a Bitbucket YAML section without a live Bitbucket environment is informed speculation — it may be syntactically plausible but is functionally unverified. Propagating such a constraint through the full pipeline (story → review → test-plan) adds scope without adding assurance value.

**Pipeline diagnosis:** The discovery skill correctly identified the long-term portability requirement. The gap is that an untestability filter was not applied at definition time. Before writing a story AC or architecture constraint that requires a non-available environment or platform, the definition skill should ask: "Can this be tested in the delivery context?" If no, it should flag the constraint for deferral rather than embedding it as a story AC.

**Proposed check for definition SKILL.md:** Before writing any AC or architecture constraint that depends on an external platform, tool, or environment, verify: "Is this platform/environment available in the delivery context?" If not: defer the AC/constraint to the phase where it becomes testable; log a SCOPE decision; add a revisit trigger. Do not embed unverifiable ACs in stories.

**Action:** Add testability-filter check to `/definition` SKILL.md AC-writing section. Flag for `/levelup` post-merge.

---

---

## PR merge conflict — sequential check-script additions cause recurring package.json conflicts

### Observed — 2026-04-11

**Circumstance:** PRs #15 (p1.3) and #16 (p1.4) both had conflicting `package.json` files. Each agent branch was created from a master snapshot that predated the merges of p1.6 and p1.7. Those later merges each added a new script to the `package.json` test chain (`check-suite.js` and `check-standards-model.js` respectively). Because the agent branches preceded those merges, both branches were missing the newer scripts.

**Root cause:** Each inner-loop story branch is created once at branch-setup time. Any check script merged to master after that point is absent from the branch. With 8 stories delivered sequentially, each new check script added to master creates a potential conflict for every open branch.

**Finding:** This is a structural property of the inner loop model, not a one-off error. Every story that adds a check script to `package.json` will produce this exact conflict in every unresolved branch created before that script was merged. The resolution pattern is deterministic: resolve to the full delivery-order chain including all scripts that exist on master, plus any new script introduced by the current branch. Verify by running `npm test` locally before pushing.

**Action:** Document this pattern in the inner loop conflict resolution guide. When resolving any `package.json` conflict in a story branch, always check `git log origin/master --oneline -- package.json` to find all scripts added since the branch point. Include them all.

---

## PR merge conflict — agent workflow filename collision

### Observed — 2026-04-11

**Circumstance:** PR #16 (p1.4 watermark gate) had a second conflict: `assurance-gate.yml` under `.github/workflows/`. The p1.4 agent had written the watermark gate workflow to `assurance-gate.yml` — the same filename the p1.3 agent had used for the assurance gate. When PR #15 (p1.3) was merged before PR #16, the two branches produced an add/add conflict on the same file.

**Root cause:** The p1.4 agent named the workflow file `assurance-gate.yml` by proximity — it was the closest prior workflow it had context for. It did not check what workflow files already existed in `.github/workflows/` before writing its own. No validation step in the inner loop requires the agent to verify it is writing to a unique filename.

**Finding:** Workflow filename collisions are silent scope errors: the agent that resolves the conflict must know the intended content of both files to pick the correct one for each name. The `check-watermark-gate.js` script also had a hardcoded reference to `assurance-gate.yml` that had to be corrected to `watermark-gate.yml` after the rename.

**Resolution pattern:** (1) `git checkout origin/master -- .github/workflows/assurance-gate.yml` — restore master's p1.3 version. (2) Create `.github/workflows/watermark-gate.yml` with the watermark content from the branch. (3) Fix any hardcoded path references in the corresponding check script.

**Action:** Add a pre-conflict-resolution step: `Get-ChildItem .github/workflows/` (or `ls .github/workflows/`) to inventory existing workflow files before resolving any workflow add/add. Add to inner loop conflict resolution guide. Consider adding a DoR check or implementation-plan instruction that requires the agent to list existing workflow filenames before writing a new one.

---

## Estimation actuals — Phase 1 baseline (MM1 signal)

### Observed — 2026-04-11

**Source:** Copilot chat transcript timestamps (`.jsonl` session files) cross-referenced against git commit log. Timestamps are UTC; AEST = UTC+10.

**Session map — 9 sessions across 3 days:**

| # | AEST window | Git commits in window | Pipeline work | Focus time |
|---|-------------|-----------------------|---------------|------------|
| 1 | Apr 9 10:36–14:50 | baseline, clean-up, workspace scaffold | Repo audit, pre-Phase 1 setup | ~1.5h |
| 2 | Apr 9 12:55–20:21 | definition complete, gap findings | `/definition` all 8 stories | ~2.5h |
| 3 | Apr 9 18:22–22:42 | gap findings, Epic 1 voided | Gap triage, Epic 1 voided | ~1h |
| 4 | Apr 10 05:03–07:19 | review partial (5/8) | `/review` first pass | ~1h |
| 5 | Apr 10 05:20–09:01 | review complete, Bitbucket defer, checkpoint | `/review` all 8 + Bitbucket scope decision | ~1.5h |
| 6 | Apr 10 07:05–09:40 | mediums fixed, test-plans, DoR p1.5/p1.3/p1.4 | `/test-plan` all 8 + `/definition-of-ready` first 3 | ~1.5h |
| 7 | Apr 10 07:41–10:01 | context-pressure gap finding, DoR p1.1/p1.2/p1.6/p1.7 | `/definition-of-ready` next 4 | ~1h |
| 8 | Apr 10 09:59–Apr 11 00:23 | DoR p1.8 + all 8 agent PRs #10–#18 merged | DoR p1.8 + full inner loop (~14h window, agent-autonomous) | ~1h human |
| 9 | Apr 11 04:52–08:18 | all 8 DoDs + /levelup + residual items | All DoDs + `/levelup` + thread closures | ~2h |

**Note on sessions 4–7:** These are concurrent, not sequential. Four parallel Copilot chat windows ran simultaneously Apr 10 05:00–10:00 AEST. Five hours of calendar time cleared review, test-plans, and all 8 DoRs in parallel. The original pipeline model assumed these phases are sequential.

**Note on session 8:** The 14-hour window (Apr 10 09:59 to Apr 11 00:23) delivered all 8 inner-loop PRs. Human involvement was approximately 1 hour (DoR p1.8 + dispatching agents + reviewing and merging PRs). The remaining time was autonomous agent execution with zero human check-ins per cycle.

**Totals:**

| Measure | Value |
|---------|-------|
| Calendar span (first commit to /levelup complete) | ~46h (Apr 9 13:11 → Apr 11 08:18) |
| Union of open-session time | ~35h |
| Operator focus time (excluding autonomous agent execution) | ~13h |
| Inner loop autonomous time | ~14h (session 8) |

**Calibration findings:**

**Finding 1 — Parallel outer loop:** Sessions 4–7 overlap confirms the outer loop phases (review, test-plan, DoR) can run concurrently across multiple chat windows. The original throughput model treated them as strictly sequential. Five hours of calendar time cleared all 8 stories through three phases simultaneously. The effective per-story cost for review+test-plan+DoR was approximately 37 minutes of human focus time, not the 2–3 hours a sequential estimate would imply.

**Finding 2 — Autonomous inner loop:** Session 8 is the most significant number. The estimate model assumed 12–20 minutes of human check-in per story cycle (dispatching, reviewing, merging). The actual was effectively zero once dispatched — 8 PRs merged with ~1 hour total human time across the window. The inner loop is not a human-attended cycle; it is a dispatch-and-merge operation.

**Finding 3 — Phase 2 revised estimate:**

| Phase | Original model | Actual Phase 1 | Phase 2 estimate |
|-------|---------------|----------------|-----------------|
| Setup + discovery + benefit-metric | Not modelled | ~1.5h | ~1h |
| Definition (8 stories) | ~8h | ~3.5h (sessions 2–3) | ~3h |
| Review + test-plan + DoR (8 stories, parallel) | ~16h | ~5h calendar / ~5h focus | ~4h focus |
| Inner loop (8 stories, autonomous) | ~4–6h human | ~1h human / 14h calendar | ~1h human |
| DoDs + /levelup | Not modelled | ~2h | ~2h |
| **Total focus time** | **~28–30h** | **~13h** | **~11h** |
| **Calendar span** | **~5–7 days** | **~2.5 days** | **2–3 days** |

**Finding 4 — Programme-level compression:** Original pipeline model projected 26 weeks for Phase 1+2 combined. Phase 1 actual: ~2.5 calendar days, ~13h focus. If Phase 2 is similar scope (8 stories), revised projection: ~5–6 calendar days total, ~26h focus for both phases. That is a **5–8× calendar compression** against the original model.

---

## Pipeline gap — DoD/DoR skills write non-schema guardrail values, breaking agent PR baseline check

### Observed — 2026-04-12 (Phase 2 Wave 1a inner loop)

**Circumstance:** Two Copilot agent PRs (#28 p2.1, #29 p2.2) failed the `Trace Validation` CI check with `Process completed with exit code 1`. The `validate-trace.sh --ci` `check_schema_valid` step is a hard-fail. Root cause: `pipeline-state.json` contained guardrail `status` and `category` values that are not in the schema enum.

**Invalid values written by DoD and DoR skills:**

| Field | Invalid value | Schema-valid replacement | Source |
|-------|--------------|--------------------------|--------|
| `status` | `"pass"` | `"met"` | Phase 1 DoD — 12 NFR guardrails |
| `status` | `"deferred"` | `"not-assessed"` | Phase 1 DoD — 1 NFR guardrail |
| `status` | `"no-breach"` | `"met"` | Phase 2 DoR — 9 MC/ADR/PAT/AP guardrails |
| `status` | `"not-applicable"` | `"na"` | Phase 2 DoR — 3 guardrails |
| `status` | `"has-finding"` | `"not-met"` | Phase 2 DoR — 3 guardrails |
| `category` | `"performance"`, `"security"`, `"audit"` | `"nfr"` | Phase 1 DoD — 5 guardrails |

**Why it surfaced here:** The baseline validation failure only appears when the Copilot agent's `copilot-setup-steps` workflow runs `validate-trace.sh --ci` against the PR branch. Local `npm test` does not run the trace script. The broken state was on master before fix — every subsequent agent PR would fail the same check until fixed.

**Fix applied (2026-04-12):**
1. Fixed `pipeline-state.json` on master: all 22 invalid field values corrected (commit `6f61b08`)
2. Merged master into PR #28 branch (`54fbc3e`) — Trace Validation re-triggered ✓
3. Merged master into PR #29 branch (`87df4f5`) — Trace Validation re-triggered ✓

**Required fix — DoD and DoR SKILL.md files:** Both skills must reference the schema enum when writing guardrail entries. The schema-valid values for the `status` field are: `"met"`, `"not-met"`, `"na"`, `"excepted"`, `"not-assessed"`. The valid `category` values are: `"mandatory-constraint"`, `"adr"`, `"nfr"`, `"compliance-framework"`, `"pattern"`, `"anti-pattern"`.

Add to the guardrail-writing section of both skills:

> When writing `status`, use only schema-valid values: `met`, `not-met`, `na`, `excepted`, `not-assessed`. Do not use informal synonyms (`pass`, `fail`, `deferred`, `no-breach`, `not-applicable`, `has-finding`). When writing `category`, use only: `mandatory-constraint`, `adr`, `nfr`, `compliance-framework`, `pattern`, `anti-pattern`. Subcategories (`performance`, `security`, `audit`) must be written as `nfr`.

**Also required:** Add `validate-trace.sh --ci` (or a schema-only subset) to the local pre-commit check or `npm test` suite, so schema errors are caught before push rather than only on agent PR baseline validation.

**Metric relevance:** This entry is primary evidence for MM1 (solo operator, outer loop elapsed time). The before-baseline for MM1 was the original model estimate. Phase 1 actuals now establish the empirical baseline. Phase 2 will be the first test of whether the baseline is repeatable.

**Action:** Record Phase 1 focus time (~13h, ~2.5 days calendar) as the MM1 before-baseline in `benefit-metric.md` MM1 evidence section. Compare Phase 2 actuals against this baseline at the end of Phase 2.

---

## Cross-story schema dependency — producing story did not know consuming story's schema requirements

### Observed — 2026-04-11

**Circumstance:** PR #16 (p1.4 watermark gate) passed all local `npm test` checks but failed CI with: `[watermark-gate] ERROR: suite.json missing or invalid field: skillSetHash`. The `workspace/suite.json` file was authored by the p1.6 agent (living eval regression suite) and contained `version`, `description`, and `scenarios` fields. The p1.4 `watermark-gate.js` runtime required two additional fields that p1.6 never wrote: `skillSetHash` (string, git tree hash of `.github/skills/`) and `surfaceType` (string, e.g. `"github-copilot"`).

**Root cause:** At DoR time, p1.4 specified that it would read `workspace/suite.json` but did not specify the exact schema it required. The p1.6 DoR scoped the suite.json output but had no visibility into p1.4's read-side schema requirements. The two stories were written and reviewed independently; the schema dependency was never made explicit in either DoR or test-plan.

**Finding:** When story A writes an artefact consumed by story B, the consuming story (B) must specify its required schema in the DoR or test-plan — not just the file path. The producing story (A) must then include those fields in its scope. If A ships first without the required fields, B will fail at runtime even when both stories pass their own tests in isolation.

**Fix applied:** Added `skillSetHash: "a1604b2e14cfb6627a0dabe3bdfabab658be8ffd"` (git tree hash of `.github/skills/` at Phase 1 delivery) and `surfaceType: "github-copilot"` to `workspace/suite.json`.

**Action:** Add a cross-story schema dependency check to the DoR skill: when a story references a file produced by another story, require the consuming story to document the exact fields it reads. Propagate those field requirements back to the producing story's DoR contract as explicit output schema constraints. Flag for `/levelup` post-merge.

---

---

## /levelup candidate — state.json write path must be atomic-replace, not append

### Observed — 2026-04-11 (p1.5 DoD session start)

**Circumstance:** At the start of the 2026-04-11 session, `workspace/state.json` contained a spurious duplicate JSON fragment beginning at position 5555 — immediately after the valid closing brace of the JSON object. The `check-workspace-state.js` test returned `state-json-valid FAIL` with "Unexpected non-whitespace character after JSON at position 5555." The valid JSON was intact (no data loss); the fragment was removed by truncating to the last valid `}`.

**Root cause (likely):** A previous `/checkpoint` or phase-boundary state write used an append operation (or a replace that did not truncate the trailing content) rather than a full atomic overwrite. The result was two concatenated JSON objects — a valid root object followed by a stale or partial duplicate. This would occur if the write path used `fs.appendFileSync` or a non-truncating `replace_string_in_file` that matched less than the full file content.

**Finding:** Any state write mechanism that does not guarantee atomic full-file replacement is structurally unsafe for a single-file JSON state store. Partial writes, appends, and in-place non-truncating replacements will all produce unparseable JSON under the right failure conditions. The schema mechanism itself is sound — the content was correct and complete. Only the write path is at risk.

**Required fix for Phase 2:** The state.json write path (however it is implemented — shell, Node.js, or agent tool call) must always:
1. Write to a temp file in the same directory
2. Atomically rename the temp file over the target (`mv state.json.tmp state.json`)
3. Verify the written file is valid JSON before confirming success

Alternatively, if using `create_file` or similar tools that overwrite the full file, ensure the write includes the complete JSON object, not a delta.

**Action:** Flag as /levelup candidate. Add write-path safety requirement to the platform's state management conventions in `copilot-instructions.md` or a Phase 2 story. Eval scenario candidate: "given a state.json that contains two concatenated JSON objects, the check-workspace-state.js test must detect and report it as invalid." (This scenario now exists in the Phase 1 regression history — add it to `workspace/suite.json` if not already covered.)

---

## Pipeline gap — cross-session output verification via second AI session (manual quality layer)

### Observed — 2026-04-11

**Circumstance:** The operator confirmed that a pattern has emerged during Phase 1 delivery: complex or high-stakes outputs (DoD artefacts, pipeline-state.json updates, skill outputs) are being copied to a second independent chat session running the same model (Claude Sonnet 4.6) for verification before being accepted. This is an informal but high-value quality layer — it catches errors that the generating session misses due to confirmation bias or context drift.

**Finding:** This is a form of independent review that the pipeline does not currently formalise. It is structurally similar to the "second pair of eyes" operator step in the oversight model, but applied at the AI output level rather than the artefact level. Its effectiveness depends entirely on the operator remembering to do it and having context available in the verification session.

**Why it matters:** As AI-generated pipeline outputs become longer and more complex, the probability that any single session misses an error grows. A structured verification step — even a lightweight prompt in a second session — provides a consistent quality floor that doesn't depend on operator vigilance under time pressure.

**Proposed formalisation options (for /levelup consideration):**
1. **Lightweight:** Add a "verification prompt" to the DoD, test-plan, and review skill output sections — a short prompt the operator can paste to a second session to check for missed ACs, scope deviations, or state write errors.
2. **Moderate:** Add a "verify-output" sub-step to the DoR or verify-completion skill that explicitly invites operator verification before sign-off.
3. **Structural (Phase 2+):** Add a named `/verify-output` skill or convention that formalises the second-session check as a sequenced pipeline step with a defined scope (what to check, how to surface findings).

**Relationship to existing skills:** `/implementation-review` provides spec compliance + code quality review between task batches — this gap is analogous but at the pipeline-output level (artefacts, state files) rather than the code level.

**Action:** Flag for /levelup. Consider adding a brief "verification prompt" field to the DoD artefact template — a canned prompt the operator can run in a second session to spot-check the DoD output. This makes the verification pattern explicit and repeatable without requiring a new skill at this stage.

---

## Pipeline gap — decisions.md cross-session continuity check needed before Phase 2 discovery

### Observed — 2026-04-11 (post p1.4 DoD session)

**Circumstance:** During the p1.4 DoD run, context compacted mid-write. Two specific decisions.md entries that were to be logged in that session — "CI topology ASSUMPTION: GitHub Actions as primary CI surface" and "AGENTS.md adapter ARCH: surface-adapter model handles non-git agent surfaces" — may not have been written before compaction fired. The p1.4 DoD artefact was committed, but the decisions.md state was not explicitly confirmed after the compaction event.

**Risk:** If either entry is absent, Phase 2 discovery starts with an incomplete decision log. The CI topology assumption is load-bearing for any Phase 2 story that touches multi-surface CI; the AGENTS.md adapter decision constrains the surface-adapter extension model. Discovering an absent entry mid-Phase-2 discovery causes a back-fill that breaks traceability (the decision appears to have been made after discovery, not before).

**Required pre-Phase-2 action:** Before starting Phase 2 discovery, open `artefacts/2026-04-09-skills-platform-phase1/decisions.md` and verify both entries are present:
1. CI topology ASSUMPTION entry (should reference GitHub Actions as primary surface, Bitbucket deferred)
2. AGENTS.md adapter ARCH decision (should reference surface-adapter model, non-git surface handling)

If either is missing: add it with today's date as a carry-forward entry, reference the original decision context (p1.4 DoD session), and note the gap in the commit message.

**Finding:** Compaction mid-write creates a silent decisions.md gap — there is no diff to alert the next session that a write was incomplete. The only reliable detection method is an explicit check at phase-boundary time before the next skill run that depends on decisions.md as input.

**Proposed pipeline fix:** Add a decisions.md completeness check to the Phase 2 discovery entry condition: "before starting /discovery or /definition for a new phase, verify decisions.md contains all entries flagged in the preceding phase's DoD observations and learnings log."

**Action:** Check decisions.md before Phase 2 discovery. Flag for /levelup.

---

## DoD observation gap — p1.6 cross-story schema dependency not captured at DoD time

### Observed — 2026-04-11 (post p1.4 DoD session, cross-referenced against merge learnings log)

**Circumstance:** The cross-story schema dependency failure (p1.4 watermark-gate.js requiring `skillSetHash` and `surfaceType` fields from `workspace/suite.json` authored by p1.6) was captured in `workspace/learnings.md` under "Cross-story schema dependency — producing story did not know consuming story's schema requirements." However, this entry was written as a general pipeline gap during the Phase 1 inner loop learnings log — not as a specific p1.6 DoD observation in the DoD artefact itself.

**The gap:** The p1.6 DoD artefact (`dod/p1.6-living-eval-regression-suite-dod.md`) should contain an explicit observation flagging that p1.6 was the producing story for `workspace/suite.json`, that the schema it produced did not include the fields required by p1.4, and that this caused a live CI failure on p1.4's PR. Without this observation in the p1.6 DoD artefact, the /trace and /levelup skills reading p1.6's DoD chain will not surface the schema contract gap as a p1.6-specific finding — it will remain only in the general learnings log, where it is harder to connect back to the producing story.

**Why the DoD artefact is the right place:** The DoD artefact is the canonical record of what shipped and what was observed at ship time. A schema gap that caused a peer story's CI failure is a material observation about p1.6's delivery — it belongs in p1.6's DoD alongside the other observations, not only in a shared learnings file. When /trace runs post-Phase-2, it should be able to read p1.6's DoD and find the cross-story contract note without having to scan learnings.md.

**Required action:** Add a "Cross-story schema contract gap" observation to the p1.6 DoD artefact before running /levelup. The observation should record: (1) p1.6 authored `workspace/suite.json` without the `skillSetHash` and `surfaceType` fields; (2) p1.4's `watermark-gate.js` required those fields at runtime; (3) the gap caused a CI failure resolved by adding the two fields to `suite.json` in PR #16; (4) the fix is in master as of 2026-04-11.

**Finding:** DoD artefact observations are under-specified as a category. The DoD template says "Observations and /levelup candidates" but does not explicitly instruct the agent to record cross-story runtime failures discovered after the producing story's merge. Add this as a named observation type in the DoD template.

**Action:** Amend p1.6 DoD artefact before /levelup. Flag template gap for /levelup write-back to `templates/definition-of-done.md`.

---

*More signals will be added here as Phase 1 dogfood run progresses.*

---

## Pipeline gap D6 — /issue-dispatch not automatically prompted at /definition-of-ready batch completion

### Observed — 2026-04-12

**Circumstance:** Phase 2 outer loop completed fully across 2 batch sessions (all 13 stories: reviewed, test-planned, DoR-signed-off). Operator then manually invoked `/issue-dispatch --target github-agent` as a separate, explicitly-remembered command to begin inner loop Wave 1a (p2.1–p2.5a).

**The gap:** `/definition-of-ready` has no exit-sequence step that prompts the operator to run `/issue-dispatch` once all stories in a batch reach `PROCEED` status. The operator must remember the skill exists, choose wave segmentation, and specify the dispatch target independently. This is a human memory dependency with no pipeline guardrail — the same category as D3 (learnings-write step missing from skill exits) and D5 (/checkpoint numbered exit sequence gap).

**Step 0 preflight consequence:** On first invocation, 5 commits from the entire outer loop (reviews, test plans, DoR batch 1 + batch 2) had not been pushed to `origin/master`. The SKILL.md Step 0 rule correctly blocked issue creation. This prevented throwaway agent runs against a stale clone — but also revealed that the outer loop has no "push gate". Commits can accumulate locally without the push being mandated as a precondition for any step until Step 0 of `/issue-dispatch` catches it.

**Root cause — two sequential gaps:**

1. `/definition-of-ready` exit sequence ends at "commit pipeline-state.json" with no forward pointer to the inner loop kick-off. There is no instruction to push before closing, and no prompt to run `/issue-dispatch`.
2. Because the push gate is absent from the outer loop exit, all outer loop artefacts sit locally invisible to the GitHub Copilot coding agent at assignment time. The coding agent clones at assignment time — uncommitted local state does not exist from its perspective.

**D-batch classification:** This is a **D6** pipeline evolution pattern — a skill exit sequence gap where the transition to the next pipeline phase is not surfaced to the operator at the natural handoff point. The full D-batch is:

| ID | Gap | Fix location |
|----|-----|-------------|
| D3 | learnings-write step missing from skill exits | Multiple SKILL.md exit sequences |
| D5 | /checkpoint missing from numbered exit sequence | /definition-of-ready SKILL.md |
| **D6** | **/issue-dispatch not prompted after all-PROCEED batch** | **/definition-of-ready SKILL.md exit + push gate** |

**Proposed fix — /definition-of-ready SKILL.md exit sequence:**

Add the following steps after the existing "commit pipeline-state.json" step:

> **Step N — Push before closing:** Run `git push origin master` and confirm success. The coding agent assigned to any story in this batch clones the remote at assignment time — any commit that has not been pushed is invisible to the agent.
>
> **Step N+1 — Dispatch prompt:** If all stories in this batch have `dorStatus: "signed-off"`, prompt: "All stories in this batch are DoR-ready. Next step: `/issue-dispatch --target github-agent` to create inner loop issues. Specify wave segmentation if dispatching a subset."

**Proposed fix — pipeline-state.json pendingActions:**

After a DoR batch commit, write an explicit `pendingActions` entry to `workspace/state.json`:

```json
"pendingActions": [
  "git push origin master — required before any /issue-dispatch run",
  "Run /issue-dispatch --target github-agent for Wave 1a (p2.1–p2.5a)"
]
```

**Action:** Update `/definition-of-ready` SKILL.md exit sequence to mandate `git push` confirmation and add `/issue-dispatch` forward pointer. This closes D6 in the D-batch. Log as a Phase 2 /levelup candidate for write-back to `.github/skills/definition-of-ready/SKILL.md`.

---

## Tool-use gap — duplicate GitHub issues created by combined heredoc+gh-issue-create PowerShell calls

### Observed — 2026-04-12

**Circumstance:** During Wave 1a dispatch, `gh issue create` was inadvertently invoked twice for each of p2.2, p2.3, p2.4, and p2.5a. Each story ended up with two open issues: one with an odd number (the canonical: 19, 21, 23, 25, 27) and one with an even number (the duplicate: 20, 22, 24, 26). Issue #20 was already closed by the time the operator noticed; #22, #24, #26 required manual closure.

**Root cause:** For each story after p2.1, the issue body was written to a temp file AND `gh issue create --body-file` was invoked in a single multi-statement PowerShell command (combined heredoc + Out-File + gh issue create). PowerShell parsed and ran the heredoc assignment, wrote the file, and ran `gh issue create` — creating one issue. The agent then issued a second standalone `gh issue create` call (intended as the "actual" execution after confirming the file was written), creating a duplicate.

**Pattern:** The `$body = @'...'@; $body | Out-File ...; gh issue create ...` one-liner ran the creation silently (heredoc output masked the URL), then the explicit second `gh issue create` call confirmed with a visible URL — which the agent recorded as the canonical number. Hence the canonical issues are the even-offset ones the agent "saw" (21, 23, 25, 27), two higher than the silently-created originals (20, 22, 24, 26).

**Correct canonical issue numbers — Wave 1a:**

| Story | Canonical issue | Duplicate (closed) |
|-------|----------------|-------------------|
| p2.1 | #19 | none |
| p2.2 | #21 | #20 (already closed) |
| p2.3 | #23 | #22 (closed 2026-04-12) |
| p2.4 | #25 | #24 (closed 2026-04-12) |
| p2.5a | #27 | #26 (closed 2026-04-12) |

**Fix — /issue-dispatch SKILL.md Step 5:** When using `gh issue create` in PowerShell, never combine the body-file write and the `gh issue create` call in the same multi-statement command. Separate them into two distinct terminal calls: (1) write the body file; (2) run `gh issue create --body-file`. This eliminates the silent-then-explicit double-execution pattern.

**Action:** Add a note to the `/issue-dispatch` SKILL.md Step 5 command block specifying that body file write and `gh issue create` must be separate terminal calls in PowerShell environments. Log as a Phase 2 /levelup candidate.
