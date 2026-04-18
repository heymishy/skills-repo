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

**Action:** Add a learnings-write step to `/definition` skill exit sequence. Flag for pipeline improvement in next `/improve` run post-merge.

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

**Action:** Add dependency chain validation check to `/definition` SKILL.md prerequisite story section. Flag for `/improve` post-merge.

### Observed — 2026-04-09

**Circumstance:** /checkpoint triggered at ~61% context. Compaction fired during the write, not at 75% as the guideline states.

**Root cause:** The 75% guideline was calibrated against message-heavy phases (conversation, clarification). File-read-heavy phases (definition, review) fill the Tool Results bucket faster than the Messages bucket. By the time the Messages bucket shows ~61%, the Tool Results bucket may already be near threshold. The effective safe working window is lower.

**Finding:** Revise /checkpoint guidance: invoke at 55–60% for file-read-heavy phases (definition, review, trace). The 75% guideline remains appropriate for conversation-only phases. Distinguish the two cases in the checkpoint documentation.

**Action:** Update /checkpoint invocation guidance in `copilot-instructions.md` or the relevant skill. Flag for `/improve` post-merge.

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

**Action:** Add numbered exit sequence to /checkpoint skill or copilot-instructions.md. Flag for `/improve` post-merge.

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

**Action:** Update `/review` SKILL.md state update section to add the incremental-write-per-story instruction. Flag for `/improve` post-merge. Candidate eval scenario for `workspace/suite.json` (P1.6) once that story is implemented.

---

## Pipeline gap — untestable documentation is a scope anti-pattern

### Observed — 2026-04-10

**Circumstance:** Review and test-plan phases surfaced that the Bitbucket Pipelines equivalent requirement (in p1.3 AC6, p1.1 Architecture Constraints, and discovery.md) was present in every artefact layer — but the dogfood context has no Bitbucket environment to run it against. The constraint was written at discovery as a forward-looking portability requirement and propagated faithfully through definition, review, and test-plan. It was caught at the test-plan stage when the verification script made it concrete: "Open the CI configuration file and look for two sections — one for GitHub Actions, one for Bitbucket Pipelines."

**Finding:** When a required artefact output cannot be tested in the delivery environment, it is unreliable by definition. Writing a Bitbucket YAML section without a live Bitbucket environment is informed speculation — it may be syntactically plausible but is functionally unverified. Propagating such a constraint through the full pipeline (story → review → test-plan) adds scope without adding assurance value.

**Pipeline diagnosis:** The discovery skill correctly identified the long-term portability requirement. The gap is that an untestability filter was not applied at definition time. Before writing a story AC or architecture constraint that requires a non-available environment or platform, the definition skill should ask: "Can this be tested in the delivery context?" If no, it should flag the constraint for deferral rather than embedding it as a story AC.

**Proposed check for definition SKILL.md:** Before writing any AC or architecture constraint that depends on an external platform, tool, or environment, verify: "Is this platform/environment available in the delivery context?" If not: defer the AC/constraint to the phase where it becomes testable; log a SCOPE decision; add a revisit trigger. Do not embed unverifiable ACs in stories.

**Action:** Add testability-filter check to `/definition` SKILL.md AC-writing section. Flag for `/improve` post-merge.

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

---

## Delivery stability gap — uncertain model routing under rate limits vs inherent change complexity

### Observed — 2026-04-15 10:55

**Circumstance:** A change set that initially looked simple (trace validation fix) expanded into multiple dependent fixes: runtime script assumptions, schema compatibility across phase shapes, and CI path differences. During the same window, there was uncertainty about whether agent behavior changed because of model routing (for example, fallback from Sonnet to Auto/Codex under rate limiting) versus the task itself being genuinely high-coupling.

**What was learned:**
- Treat model-routing uncertainty as an operational risk signal, not as a root-cause conclusion.
- When a fix chain crosses `script -> schema -> state data -> CI`, classify it early as a coupled-change workflow and switch to stricter verification steps.
- Even when behavior feels "messy," the controlling factor is often hidden coupling in contracts and validators, not only model quality.

**Next-time improvement protocol:**
1. **Baseline snapshot before edits:** capture current failing check logs, schema validation result, and a quick map of touched contracts (`state`, `schema`, `validator script`).
2. **Single-axis fix loops:** change one contract layer at a time, then re-run only the closest validator before moving on.
3. **Dual-path hypothesis logging:** explicitly track two hypotheses in notes: (A) execution/model variability, (B) code/data coupling; only promote one after evidence.
4. **Guard against shape drift:** when one phase stores object arrays and another stores slug arrays, prefer schema compatibility patterns that preserve existing test navigation paths.
5. **CI parity check early:** run local checks with the same assumptions as CI (including schema toolchain) before final push.

**Action:** For future CI-fix stories, start with a short "coupling map" in working notes and enforce one-layer-at-a-time validation to reduce thrash when model behavior or routing is uncertain.

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

**Action:** Add a cross-story schema dependency check to the DoR skill: when a story references a file produced by another story, require the consuming story to document the exact fields it reads. Propagate those field requirements back to the producing story's DoR contract as explicit output schema constraints. Flag for `/improve` post-merge.

---

---

## /improve candidate — state.json write path must be atomic-replace, not append

### Observed — 2026-04-11 (p1.5 DoD session start)

**Circumstance:** At the start of the 2026-04-11 session, `workspace/state.json` contained a spurious duplicate JSON fragment beginning at position 5555 — immediately after the valid closing brace of the JSON object. The `check-workspace-state.js` test returned `state-json-valid FAIL` with "Unexpected non-whitespace character after JSON at position 5555." The valid JSON was intact (no data loss); the fragment was removed by truncating to the last valid `}`.

**Root cause (likely):** A previous `/checkpoint` or phase-boundary state write used an append operation (or a replace that did not truncate the trailing content) rather than a full atomic overwrite. The result was two concatenated JSON objects — a valid root object followed by a stale or partial duplicate. This would occur if the write path used `fs.appendFileSync` or a non-truncating `replace_string_in_file` that matched less than the full file content.

**Finding:** Any state write mechanism that does not guarantee atomic full-file replacement is structurally unsafe for a single-file JSON state store. Partial writes, appends, and in-place non-truncating replacements will all produce unparseable JSON under the right failure conditions. The schema mechanism itself is sound — the content was correct and complete. Only the write path is at risk.

**Required fix for Phase 2:** The state.json write path (however it is implemented — shell, Node.js, or agent tool call) must always:
1. Write to a temp file in the same directory
2. Atomically rename the temp file over the target (`mv state.json.tmp state.json`)
3. Verify the written file is valid JSON before confirming success

Alternatively, if using `create_file` or similar tools that overwrite the full file, ensure the write includes the complete JSON object, not a delta.

**Action:** Flag as /improve candidate. Add write-path safety requirement to the platform's state management conventions in `copilot-instructions.md` or a Phase 2 story. Eval scenario candidate: "given a state.json that contains two concatenated JSON objects, the check-workspace-state.js test must detect and report it as invalid." (This scenario now exists in the Phase 1 regression history — add it to `workspace/suite.json` if not already covered.)

---

## Pipeline gap — cross-session output verification via second AI session (manual quality layer)

### Observed — 2026-04-11

**Circumstance:** The operator confirmed that a pattern has emerged during Phase 1 delivery: complex or high-stakes outputs (DoD artefacts, pipeline-state.json updates, skill outputs) are being copied to a second independent chat session running the same model (Claude Sonnet 4.6) for verification before being accepted. This is an informal but high-value quality layer — it catches errors that the generating session misses due to confirmation bias or context drift.

**Finding:** This is a form of independent review that the pipeline does not currently formalise. It is structurally similar to the "second pair of eyes" operator step in the oversight model, but applied at the AI output level rather than the artefact level. Its effectiveness depends entirely on the operator remembering to do it and having context available in the verification session.

---

## Pipeline gap — spec immutability principle broken by out-of-band feature delivery

### Observed — 2026-04-14 (HANDOFF.md Section 7 porting session)

**Circumstance:** While writing Section 7 of HANDOFF.md — the upgrade-path agent index — the operator attempted to trace every feature in the current repo back to a Phase 1 or Phase 2 artefact (DoR, contract, test plan). This exercise surfaced that certain features in the repo do not have a corresponding artefact chain. The `/estimation` skill was noted as a concrete example: it was delivered without a discovery artefact, benefit-metric, stories, test-plan, or DoR. It exists in the codebase but cannot be referenced in Section 7 because there is no spec to link to.

**The spec immutability principle (from README):** The artefacts directory contains pipeline inputs — discovery artefacts, stories, test plans, DoR checklists, verification scripts, and review reports. These files are the specification that governs what gets built. They are read-only inputs for the coding agent. The principle implies a one-to-one correspondence: every feature in the codebase must trace back to an artefact chain. A feature with no artefact chain is untraceable, and therefore cannot be reproduced, ported, or validated by an agent reading the spec.

**The practical failure mode:** When an upgrade-path agent reads Section 7 and works through the story index, it builds a repo that matches the spec. Any feature that was never in the spec will be absent from the resulting repo — silently, with no error. The operator then has to reconcile by hand, which is exactly the friction that the pipeline was designed to eliminate.

**Root cause:** The pipeline has no enforcement mechanism that prevents a change from landing on master without a corresponding artefact chain. Changes can be made to SKILL.md files, scripts, and src/ directly via PR without going through discovery → definition → DoR. The artefact convention is advisory, not structural.

**What is needed:** A governance rule that any new feature — including skill additions, new src/ modules, and new check scripts — must follow the full artefact chain before the implementation is merged. The rule must apply to README-level primitives, design principles, and skill behaviours, not just to functional stories. The `/estimation` skill is the canonical example of what happens when this rule is absent.

**Proposed rule (for `copilot-instructions.md` or a new governance gate):**

> **Artefact-first rule:** Every new feature, skill, or behavioural change merged to master must have a corresponding artefact chain (discovery → benefit-metric → story → test-plan → DoR) committed to `artefacts/` before the implementation file is merged. A PR that adds or modifies a SKILL.md file, a src/ module, a check script, or a `.github/skills/` file without a linked DoR story is out-of-process. Exception: documentation-only changes, typo fixes, and configuration changes that make no behavioural difference do not require a full chain. The governance gate for this rule should check that any changed SKILL.md or src/ module has a corresponding committed test-plan artefact that covers its ACs.

**Scope of the gap in the current repo:** The following are known or suspected to lack a full artefact chain: `/estimation` skill, `/decisions` skill (partial — some ACs exist but the test-plan is incomplete), any SKILL.md file added via direct commit after the Phase 2 delivery window without a matching DoR. A full audit should be run before onboarding the first Westpac squad to establish a clean traceability baseline.

**Action:** Add the artefact-first rule to `copilot-instructions.md` under Coding Standards. Add a governance gate check (`check-artefact-coverage.js` or equivalent) that flags any SKILL.md in `.github/skills/` or module in `src/` that has no corresponding DoR artefact file. Flag for Phase 3 scope or a short-track story. Record as a pre-Westpac-onboarding prerequisite.

**Why it matters:** As AI-generated pipeline outputs become longer and more complex, the probability that any single session misses an error grows. A structured verification step — even a lightweight prompt in a second session — provides a consistent quality floor that doesn't depend on operator vigilance under time pressure.

**Proposed formalisation options (for /improve consideration):**
1. **Lightweight:** Add a "verification prompt" to the DoD, test-plan, and review skill output sections — a short prompt the operator can paste to a second session to check for missed ACs, scope deviations, or state write errors.
2. **Moderate:** Add a "verify-output" sub-step to the DoR or verify-completion skill that explicitly invites operator verification before sign-off.
3. **Structural (Phase 2+):** Add a named `/verify-output` skill or convention that formalises the second-session check as a sequenced pipeline step with a defined scope (what to check, how to surface findings).

**Relationship to existing skills:** `/implementation-review` provides spec compliance + code quality review between task batches — this gap is analogous but at the pipeline-output level (artefacts, state files) rather than the code level.

**Action:** Flag for /improve. Consider adding a brief "verification prompt" field to the DoD artefact template — a canned prompt the operator can run in a second session to spot-check the DoD output. This makes the verification pattern explicit and repeatable without requiring a new skill at this stage.

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

**Action:** Check decisions.md before Phase 2 discovery. Flag for /improve.

---

## DoD observation gap — p1.6 cross-story schema dependency not captured at DoD time

### Observed — 2026-04-11 (post p1.4 DoD session, cross-referenced against merge learnings log)

**Circumstance:** The cross-story schema dependency failure (p1.4 watermark-gate.js requiring `skillSetHash` and `surfaceType` fields from `workspace/suite.json` authored by p1.6) was captured in `workspace/learnings.md` under "Cross-story schema dependency — producing story did not know consuming story's schema requirements." However, this entry was written as a general pipeline gap during the Phase 1 inner loop learnings log — not as a specific p1.6 DoD observation in the DoD artefact itself.

**The gap:** The p1.6 DoD artefact (`dod/p1.6-living-eval-regression-suite-dod.md`) should contain an explicit observation flagging that p1.6 was the producing story for `workspace/suite.json`, that the schema it produced did not include the fields required by p1.4, and that this caused a live CI failure on p1.4's PR. Without this observation in the p1.6 DoD artefact, the /trace and /improve skills reading p1.6's DoD chain will not surface the schema contract gap as a p1.6-specific finding — it will remain only in the general learnings log, where it is harder to connect back to the producing story.

**Why the DoD artefact is the right place:** The DoD artefact is the canonical record of what shipped and what was observed at ship time. A schema gap that caused a peer story's CI failure is a material observation about p1.6's delivery — it belongs in p1.6's DoD alongside the other observations, not only in a shared learnings file. When /trace runs post-Phase-2, it should be able to read p1.6's DoD and find the cross-story contract note without having to scan learnings.md.

**Required action:** Add a "Cross-story schema contract gap" observation to the p1.6 DoD artefact before running /improve. The observation should record: (1) p1.6 authored `workspace/suite.json` without the `skillSetHash` and `surfaceType` fields; (2) p1.4's `watermark-gate.js` required those fields at runtime; (3) the gap caused a CI failure resolved by adding the two fields to `suite.json` in PR #16; (4) the fix is in master as of 2026-04-11.

**Finding:** DoD artefact observations are under-specified as a category. The DoD template says "Observations and /improve candidates" but does not explicitly instruct the agent to record cross-story runtime failures discovered after the producing story's merge. Add this as a named observation type in the DoD template.

**Action:** Amend p1.6 DoD artefact before /improve. Flag template gap for /improve write-back to `templates/definition-of-done.md`.

---

## Platform tooling — `scripts/parse-session-timing.js` for E3 actuals derivation

### Observed — 2026-04-12

**Context:** E3 actuals for Phase 1 were derived manually by cross-referencing `.jsonl` transcript filenames and git commit timestamps. This was medium-low confidence (±1h per session) and required about 20 minutes of manual reconstruction work. The manual approach also required guessing the engagement fraction (what % of session time was active keyboard work vs idle), which introduced a second estimation step on top of the first.

**Tool created:** `scripts/parse-session-timing.js` — zero-dependency Node.js parser for Copilot Chat JSONL transcript files. Replaces manual reconstruction and the engagement fraction question with computed actuals.

**What the tool computes per session and in aggregate:**
- `Focus` — sum of inter-prompt gaps ≤ `--max-gap` threshold (default 15 min). Represents active reading + composing time.
- `Span` — wall-clock session time (first to last event)
- `Model` — total model generation time (turn_start → turn_end)
- `Tools` — total tool execution time (within-turn windows only)
- `Idle excluded` — gaps > threshold (overnight, agent runs, context switches) — not counted as focus

**Why the idle-gap threshold matters:** Sessions where the agent runs for hours (inner loop, overnight) show enormous span but minimal actual focus time. Without the threshold, a 14-hour session where the operator spent 1 hour working would look like 14h of focus. With `--max-gap 15`, only the active bursts count; the 13h autonomous run is excluded. The threshold can be adjusted with `--max-gap N` — 15 min is the default, which proved accurate against the Phase 1 manual reconstruction.

**Phase 1 validation:** Parser output matched the manually-derived ~13h focus figure within ~1h margin. Session `cc177d7f` (README rebuild + parser development): 4h7m focus out of 23h span, with 14 idle gaps (18h43m) correctly excluded as overnight inner-loop execution. This gives confidence the parser is reliable.

**Impact on E3 flow:** The `/estimate` SKILL.md E3b step now uses the parser as the primary method. E3c (engagement fraction question) is now a confirmatory `ok` step when parser data is available — it shows the computed fraction and asks if the idle threshold looks right. The "one guess question" is replaced by a computed confirmation. Engagement fraction becomes an output of the tool, not an input from the operator.

---

## Artefact-first enforcement — inline framework changes without a story artefact break spec-is-truth

### Observed — 2026-04-16 (retrospective artefact coverage audit; ADR-011 adoption; stories p3.15, p3.16, p3.17)

**Circumstance:** A structured audit of the post-pipeline CHANGELOG against committed artefact chains (discovery → benefit-metric → story → test-plan → DoR) revealed that 11 of 20 post-pipeline item groups had no formal story artefact at all. Two were HIGH-risk (the `/estimate` skill and the `/issue-dispatch` skill — fully operational, customer-facing capabilities delivered with zero pipeline coverage). The remainder were a mix of structural decisions, UI enhancements, and governance check scripts. Coverage score at audit time: 45%.

The root cause was not operator carelessness — it was the absence of any enforcement mechanism. The pipeline has an "artefact-first" convention in the README but no gate that fires when a SKILL.md file, `src/` module, or governance check script is committed without a corresponding DoR artefact. Changes can — and did — land on master silently. The first signal that coverage had drifted was the manual audit, not a failing CI check.

**The spec-is-truth principle:** The artefacts directory is the specification. Every feature in the codebase that is not in the spec is untraceable — it cannot be reproduced by an agent reading the spec, it cannot be ported, and it cannot be validated by /trace. When an AI agent (or a human) makes an inline framework change without going through the pipeline, the spec and the codebase diverge. This is not a process inconvenience: it is a structural failure of the traceable delivery model. The whole value proposition of the pipeline is that the spec is the complete, authoritative, machine-traversable record of what was built and why.

**What makes this failure mode dangerous for AI-assisted delivery:** A coding agent given a task will look at the DoR artefact and the spec. If a capability exists in the codebase that has no artefact, the agent has no signal that it exists or that its behaviour is intentional. The agent may duplicate it, conflict with it, or silently rely on it without understanding its contract. The more inline changes accumulate without artefacts, the more the codebase-as-delivered diverges from the codebase-as-specified — and the more agent outputs become unreliable. This compounds at machine speed.

**What "spec is truth" means as an operational principle:**
1. **The artefact is the mandate.** An agent or operator implementing something without a signed-off DoR is operating outside the mandate. The implementation may be correct, but it is ungoverned — there is no AC list that defines what "correct" means, no scope contract that bounds what the implementation is allowed to touch, and no human sign-off that approved the work.
2. **Inline changes to the framework are the highest-risk category.** A change to a SKILL.md file, a governance check script, or a `src/` module changes the rules by which future work is evaluated. A governance check committed without a story has no authoritative specification for what it checks or when it should fire. A SKILL.md change committed without a story has no test plan — there is no evidence that it was tested against the failure patterns it was meant to address.
3. **The retrospective path exists but is a last resort.** The `retrospective-story.md` template and ADR-011 provide a structured repair path for items that slipped through. Using the retrospective path has real cost: the covering artefacts are written post-delivery, so the ACs are described-as-implemented rather than defined-before-implementation. The spec-first discipline is lost even if the traceability is partially recovered.

**Resolution applied — 2026-04-16:**
- ADR-011 adopted in `.github/architecture-guardrails.md`: artefact-first rule formalised as a hard architectural constraint for all new SKILL.md files, `src/` modules, and governance check scripts. Retrospective path explicitly defined.
- Rule added to `.github/copilot-instructions.md` Coding Standards section — visible to the coding agent at every DoR orientation.
- ADR-011 and anti-pattern AP-11 added to architecture-guardrails.md ADR table, anti-patterns table, full ADR entry, and machine-readable YAML block.
- ONBOARDING.md updated with "Artefact-first rule (ADR-011)" subsection — visible to new squad members.
- README.md ADR table updated with ADR-011.
- Retrospective stories p3.15 (/estimate skill), p3.16 (/issue-dispatch skill), and p3.17 (feat/repo-tidy docs structure and check-docs-structure.js) raised and signed off (DoR signed 2026-04-16). Coverage score moves from 45% toward the Phase 3 exit criterion of 80%.

**Prompts the agent should treat as artefact-first triggers — flag these as potential inline changes requiring a story:**
- "add a check for X to the governance suite"
- "update the skill to also handle Y"
- "add a new skill for Z"
- "move these files / restructure the directory"
- "add a new module that does W"
- Any implementation request targeting `.github/skills/`, `src/`, `tests/`, or `scripts/` that does not reference a DoR artefact slug in the task description

**Concrete detection heuristic:** If a user prompt contains no reference to a story slug (e.g. `p3.x`, `p2.x`) and the requested change would touch a SKILL.md file, a `src/` module, or a check script, the agent should pause and ask: "Is there a DoR artefact for this change? If not, this is an inline framework change that requires a story first per ADR-011."

**Action:** Add a spec-is-truth check to the `/definition-of-ready` H9 block — when a story touches `.github/skills/`, `src/`, or `tests/`, confirm that this DoR is the authoritative artefact for the change and that no prior implementation exists on master without a corresponding DoR. Flag for `/improve` and as a candidate `check-artefact-coverage.js` governance gate under Phase 3.

**Usage:**
```powershell
# All sessions (auto-discovered across workspace storage)
node scripts/parse-session-timing.js --summary

# Single session with per-prompt detail
node scripts/parse-session-timing.js path/to/session.jsonl --detail

# Adjust idle-gap threshold (default 15 min)
node scripts/parse-session-timing.js --summary --max-gap 30
```

**Transcript location:** `%APPDATA%\Code\User\workspaceStorage\[hash]\GitHub.copilot-chat\transcripts\[sessionId].jsonl`

**Action:** `/estimate` SKILL.md updated — E3b now references this tool as primary method. E3c now confirmatory (not estimation). This becomes standard practice for all future E3 actuals derivation.

---

---

## Pipeline coverage gap — between-stories changes and inline-chat structural reorganisation

### Observed — 2026-04-16 (retrospective artefact coverage audit)

**Circumstance:** A full retrospective audit of the repository CHANGELOG (all 28 versions, 0.1.0 through [Unreleased]) was conducted against the Phase 1 and Phase 2 artefact chains. The audit found that approximately 45% of post-pipeline CHANGELOG item groups (9 of 20) trace back to a formal story. The remaining 55% (11 item groups) are BETWEEN-STORIES — committed after the pipeline start date (2026-04-09) with no covering story in any phase.

**Two root causes identified:**

**Root cause A — Inline chat sessions:** VS Code inline Copilot chat has no pipeline awareness. The canonical example is CHANGELOG version 0.5.18 (2026-04-09): a structural directory reorganisation (moving `product/`, `contexts/`, `artefacts/`, `files/` to the repo root) was committed through an inline chat session with no discovery → story → DoR chain. Inline chat is always available regardless of whether a story is open, and it produces no artefact footprint.

**Root cause B — Between-cycle skill additions:** New skills (`/estimate`, `/issue-dispatch`) and utility scripts (`scripts/parse-session-timing.js`) were created between story cycles without a full artefact chain. These are HIGH-risk items because they are functional pipeline primitives that cannot be reproduced from spec by an upgrade-path agent — the spec simply does not include them. The artefact-first rule was not yet enforced when these were added.

**The practical failure mode (confirmed in HANDOFF.md Section 7 port):** When an upgrade-path agent reads the story index and rebuilds the repo from spec, any BETWEEN-STORIES feature is silently absent from the result. The operator must reconcile by hand, which is the friction the pipeline was designed to eliminate. `/estimate` and `/issue-dispatch` are the two confirmed casualties.

**Full audit results:** See `workspace/retrospective-audit-2026-04-16.md`.

**HIGH-risk BETWEEN-STORIES items confirmed:**
1. `/estimate` skill — full SKILL.md delivered without any artefact chain (no discovery, no story, no DoR, no test plan)
2. `/issue-dispatch` skill — same pattern

**Prevention mechanisms (three tiers, ordered by effort):**

**Tier 1 (immediate, this PR):** Guard line added to `.github/copilot-instructions.md` — any new SKILL.md file, `src/` module, or governance check script committed to master must have a corresponding story artefact. This makes the violation visible in every agent's context, even if it does not structurally prevent it.

**Tier 2 (retroactive coverage, this PR):** New template `.github/templates/retrospective-story.md` provides a lightweight story format for work that has already landed without a chain. It produces a minimal DoR with the committed code as the known implementation and focuses artefact work on test coverage and trace linkage. Use for LOW and MEDIUM risk BETWEEN-STORIES items.

**Tier 3 (structural, Phase 3 scope):** A `check-artefact-coverage.js` governance check that queries `.github/skills/` and `src/` for modules with no corresponding DoR artefact and fails `npm test` if any are found. Proposed under "spec immutability" entry above. Once implemented, HIGH-risk BETWEEN-STORIES additions become a CI failure before merge. Target: Phase 3 short-track story.

**Coverage score at time of audit:** 45% (9/20 post-pipeline item groups covered by a story). Target after Tier 3: ≥90% (exemptions for LOW-risk documentation and tooling edits via a governed opt-out marker).

**Action:** Tier 1 and Tier 2 implemented in this PR (`docs/retrospective-audit-learnings`). Tier 3 scoped as a Phase 3 short-track story. The two HIGH-risk items (`/estimate`, `/issue-dispatch`) are candidates for retroactive retrospective stories using the new template.

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

**Action:** Update `/definition-of-ready` SKILL.md exit sequence to mandate `git push` confirmation and add `/issue-dispatch` forward pointer. This closes D6 in the D-batch. Log as a Phase 2 /improve candidate for write-back to `.github/skills/definition-of-ready/SKILL.md`.

---

## Pipeline gap D7 — `--target vscode` minimal issue body produces empty agent PRs; `--target github-agent` must be the default

### Observed — 2026-04-18 (spc.1–spc.5 inner loop dispatch)

**Circumstance:** Five stories (spc.1–spc.5) for the `2026-04-18-skill-performance-capture` feature were dispatched via `/issue-dispatch` using the default `--target vscode` mode. All 5 GitHub Copilot coding agent runs produced only a single empty "Initial plan" commit with zero file changes. Each story's PR was merged with no deliverable implemented.

**Root cause:** The `--target vscode` issue body is a minimal 5-line stub listing only artefact paths. It contains no task list, no concrete file touchpoints, no implementation context, and no AC details. When the GitHub Copilot SWE agent receives this body, it has insufficient context to determine what to build. The agent writes a plan comment and opens a PR, but the plan contains no actionable steps because the issue body provided no actionable steps. The agent's PR is then reviewed and merged as-not-implemented.

**The structural failure:** `--target vscode` was designed for the VS Code inline chat agent, which has access to the full workspace filesystem and can read artefact files directly. The GitHub Copilot SWE agent (GitHub Actions) clones the repo at assignment time but has no session continuity — it infers its task only from the issue body. A minimal stub that says "read artefact/x.md" requires the agent to discover, read, parse, and execute from artefact files without any scaffolding. In practice, the agent stalls and produces empty output rather than discovering the full task chain.

**Recovery applied:** `git merge origin/feature/p3-remaining-stories` — recovered all 39 artefact files that were only on the feature branch; all 5 deliverables implemented manually in operator session.

**D-batch classification:** D7 — default dispatch target produces unusable agent output. Structural fix is changing the SKILL.md default.

| ID | Gap | Fix location |
|----|-----|-------------|
| D3 | learnings-write step missing from skill exits | Multiple SKILL.md exit sequences |
| D5 | /checkpoint missing from numbered exit sequence | /definition-of-ready SKILL.md |
| D6 | /issue-dispatch not prompted after all-PROCEED batch | /definition-of-ready SKILL.md exit + push gate |
| **D7** | **`--target vscode` minimal body produces empty agent PRs** | **`/issue-dispatch` SKILL.md Step 2 default** |

**Structural fix applied:** `/issue-dispatch` SKILL.md Step 2 default changed from `--target vscode` to `--target github-agent`. The `--target vscode` option is retained but requires explicit opt-in. A warning note added explaining when `--target vscode` is appropriate (only when operator confirms the agent runtime reads artefact files independently, e.g. VS Code inline chat with full workspace access).

**Rule for future dispatch decisions:**
- **`--target github-agent`** (default): use for all standard inner loop dispatches. Inlines Coding Agent Instructions, AC list, file touchpoints, and implementation context from DoR artefacts into the issue body. The agent can complete the task from the issue body alone without reading additional files.
- **`--target vscode`** (opt-in): use only when the agent runtime is VS Code inline chat with confirmed access to the full workspace. Requires the operator to verify the agent can read artefact files during the session. Not appropriate for GitHub Actions / SWE agent runs.

**Action:** `/issue-dispatch` SKILL.md Step 2 default updated to `--target github-agent` in this session. Log as a Phase 3 /improve candidate for validation that the change holds across future dispatch runs.

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

**Action:** Add a note to the `/issue-dispatch` SKILL.md Step 5 command block specifying that body file write and `gh issue create` must be separate terminal calls in PowerShell environments. Log as a Phase 2 /improve candidate.

---

## Assurance gate trace files not persisted — GitHub Actions `contents: read` prevents git push back to branch

### Observed — 2026-04-12

**Circumstance:** `workspace/traces/` contained only `.gitkeep` despite the assurance gate having run on multiple PRs. The gate workflow writes a JSONL trace file to `workspace/traces/` on the Actions runner during each PR check, and the "Post verdict to PR" step reads that file to include the verdict and trace hash in the PR comment. However, the trace file is ephemeral — it exists on the runner only for the duration of the job and is discarded when the runner terminates. The repo always shows only `.gitkeep`.

**Root cause:** `.github/workflows/assurance-gate.yml` had `permissions: contents: read`. GitHub Actions requires `contents: write` to push any changes back to the repository. With `read` only, any attempt to run `git push` inside the workflow would fail with a 403. There was also no commit step — the workflow had no instruction to stage or commit the trace files at all.

**Impact:** p1.8 AC3 was blocked — it requires a real committed trace to evaluate the 8 MODEL-RISK audit questions against. p2.11 and p2.12 DoR dispatch gates were also blocked — both require `workspace/traces/` to contain at least one real Phase 2 inner loop trace file. Without committed traces, both gates can never clear regardless of how many agent PRs run.

**Fix applied (2026-04-12):**
1. Changed `permissions.contents` from `read` to `write` in `assurance-gate.yml`
2. Added "Commit trace file" step after "Run assurance gate" and before "Post verdict to PR":
   - `if: always()` — runs even if gate verdict is `fail`
   - `git config user.name/email` as `github-actions[bot]`
   - `git add workspace/traces/`
   - `git diff --cached --quiet || git commit -m "chore: assurance gate trace [ci skip]"` — skips commit if nothing staged
   - `git push origin HEAD:${{ github.head_ref }}` — pushes to the PR branch ref

**Why `[ci skip]` in commit message:** Prevents the push from triggering a new workflow run loop. The assurance gate fires on `pull_request` with type `synchronize` — a commit pushed back to the PR branch would re-trigger it. The `[ci skip]` convention suppresses that re-trigger.

**Pattern:** Any GitHub Actions workflow that must persist artefacts back to the triggering branch needs: (1) `permissions: contents: write`, (2) an explicit commit step, (3) `[ci skip]` in the commit message if the workflow triggers on `synchronize`, and (4) a `--quiet || commit` guard to avoid empty commits.

**Action:** When authoring new workflows that write output artefacts, include this pattern by default. Add to `.github/architecture-guardrails.md` or standards as a workflow authoring requirement. Log as a Phase 2 /improve candidate.

---

## Tool-use gap D9 — GitHub Actions `actions/checkout@v4` on `pull_request` events leaves runner in detached HEAD

### Observed — 2026-04-12

**Circumstance:** After D8 fix (contents: write + commit step) was applied, the "Commit trace file" step still failed with "fetch first" push rejection on subsequent gate runs. The workflow showed the commit succeeding locally (`[detached HEAD 8a45dc8]`) but the push failing because the remote had newer commits.

**Root cause:** `actions/checkout@v4` for `pull_request` events does NOT check out the PR branch — it checks out the synthetic merge commit at `refs/pull/N/merge` in detached HEAD state. This means:
1. Any commit made in the step is on a detached HEAD, not on the branch ref
2. `git push origin HEAD:branch` pushes the detached HEAD commit on top of whatever the runner fetched at checkout time — which may be behind the branch tip if the agent or another step has pushed since
3. `git pull --rebase` in detached HEAD does not reliably integrate new branch commits before the push

**Fix:** Add `ref: ${{ github.head_ref }}` and `fetch-depth: 0` to the `actions/checkout@v4` step. This forces checkout to the actual PR branch by name with full history, placing the runner on the branch ref in normal (non-detached) state from the start. All subsequent `git add`, `git commit`, and `git push` operations then work against the real branch.

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    ref: ${{ github.head_ref }}
    fetch-depth: 0
```

---

## Pipeline gap D8 — `--target github-agent` rich issue body still produces empty PRs from GitHub Copilot coding agent (2nd occurrence)

### Observed — 2026-04-18 (p3.3 #163/PR #166, p3.13 #164/PR #165)

**Circumstance:** Two stories (p3.3 and p3.13) were dispatched via `/issue-dispatch` using `--target github-agent` — the structural fix introduced by D7. Both issue bodies were comprehensive: full AC lists, implementation task breakdowns, file touchpoints (CREATE/MODIFY/EXTERNAL), non-negotiable rules, and artefact reference tables. Both issues were assigned to the GitHub Copilot coding agent. Both PRs (#165, #166) were merged. Both had **0 additions, 0 deletions, 0 changed files**.

**This is the second occurrence.** D7 (spc.1–spc.5) was attributed to `--target vscode` minimal issue bodies giving the agent insufficient context. The fix was to switch the default to `--target github-agent` with rich inlined bodies. That fix does not address this occurrence — the bodies were rich and complete. The agent still produced empty PRs.

**Why this happened — analysis of likely causes:**

1. **Agent plan-without-execute pattern.** The GitHub Copilot coding agent follows a two-phase pattern: (a) read the issue, write a plan comment, create a branch; (b) execute the plan by making code changes. In both D7 and D8, the agent completed phase (a) but not phase (b). PR #166's description explicitly ticked all 5 ACs and listed implementation details — the agent understood the spec. It just didn't write any code. This suggests the agent's execution phase is either timing out, hitting a context limit, or encountering a blocker it doesn't surface.

2. **Repo complexity / orientation failure.** The skills-repo has ~700+ files across deeply nested artefact directories, dashboard files, standards, and governance scripts. The agent's `.github/instructions/agent-orientation.instructions.md` directs it to read `workspace/state.json`, DoR artefacts, and run `npm test` + `validate-trace.sh` before changing anything. If the agent spends its budget on orientation reads (state.json is large, pipeline-state.json is 2400+ lines), it may exhaust its execution budget before making changes.

3. **External repo dependency (p3.3 specifically).** p3.3 required creating files in `heymishy/skills-framework-infra` (an external repo) AND modifying the delivery repo. The agent may not have permissions or capability to push to a second repository, causing it to stall silently.

4. **No test failure to drive TDD.** The issue bodies described what tests to write, but the tests didn't exist yet on master. The agent couldn't run a red-green cycle because there was nothing red to start from. For stories that require creating new test files and new source files from scratch, the agent may need pre-committed failing test stubs.

5. **Operator merged without reviewing file changes.** The empty PRs were merged because the PR descriptions looked complete (all ACs ticked, well-formatted body). The merge gate (human review) didn't catch that 0 files were changed. This is a process gap independent of the agent.

**Resolution options for future dispatch — by agent runtime:**

| Runtime | Strengths | Weaknesses for this pattern | When to use |
|---------|-----------|---------------------------|-------------|
| **GitHub Copilot coding agent** (current) | Autonomous, no operator time, creates own PR | Empty PR pattern (D7, D8), no way to inspect mid-execution, black box when it stalls, cannot push to external repos | Simple single-repo stories with clear file paths; stories where failing tests already exist on master |
| **VS Code Copilot agent** (this session pattern) | Full workspace context, operator can monitor and intervene, can read all artefact files, can run tests interactively | Requires operator focus time, not fully autonomous, single-threaded (one story at a time) | Complex stories, external repo dependencies, stories requiring orientation across many files, stories where the agent needs mid-execution guidance |

---

## D9 — Short-track features must still have discovery.md for trace validation

**Date:** 2026-04-18
**Detected at:** CI on PR #169 (trace validation hard-fail)
**Severity:** Medium (blocks PR merge until fixed)

**What happened:** The `2026-04-18-pipeline-state-archive` feature was created as a short-track (story originated from D8 learning, not a formal `/discovery` run). Story, test plan, review, and DoR artefacts were all created correctly — but no `discovery.md` was written. The `check_discovery_exists` hard-fail check in `scripts/validate-trace.sh` requires every directory under `artefacts/` (not listed in `.github/trace-validation.yml` `reference_dirs`) to have a `discovery.md`. CI failed.

**Root cause:** The operator/agent workflow for short-track features assumed that "short-track = skip discovery" meant no discovery *artefact* was needed. In reality, `copilot-instructions.md` says short-track is `/test-plan → /definition-of-ready → coding agent` — it skips the formal `/discovery` *skill run*, but the trace validation CI check doesn't distinguish between formal and short-track features. Every feature directory needs a discovery.md on disk regardless of how it was initiated.

**Fix applied:** Created a minimal `discovery.md` (Status: Approved) for the archive feature, modelled on the dashboard-v2 short-track discovery format.

**Preventive rule:** When creating any new feature directory under `artefacts/`, always create a `discovery.md` — even for short-track features. The discovery can be minimal (problem statement, MVP scope, Status: Approved) but must exist to pass trace validation. Alternatively, add the directory to `reference_dirs` in `.github/trace-validation.yml` if it genuinely isn't a feature (e.g. reference packages, docs-only directories).
| **Claude Code** (CLI agent) | Deep context window, strong multi-file editing, can be given explicit tool access, good at TDD cycles, can be pointed at specific repos | Requires local setup / API key, no native GitHub PR integration (manual PR step), operator must monitor terminal | Stories requiring deep codebase understanding, large refactors, stories touching 5+ files |
| **Cursor** (AI IDE) | Visual file context, inline diff review, multi-model support, composer mode for multi-file changes | Requires operator presence in Cursor IDE, not automatable for batch dispatch, no headless mode | Interactive implementation sessions, stories where the operator wants to pair with the agent, UI-heavy or layout work |

**Recommended dispatch strategy going forward:**

1. **Pre-dispatch validation gate:** Before dispatching to the GitHub agent, check: (a) Do failing tests already exist on master? (b) Is the story single-repo only? (c) Are ALL target file paths within the delivery repo? If any answer is no, dispatch to VS Code agent or Claude Code instead.

2. **Post-merge empty-PR check:** Add a governance check (or manual checklist item) that verifies `changedFiles > 0` before merging any agent PR. Could be a GitHub Actions check: `gh pr view $PR --json changedFiles --jq '.changedFiles'` must be > 0.

3. **Pre-committed failing test stubs:** For stories dispatched to the GitHub agent, commit the test file stubs (with `test.todo()` or `test.skip()`) to master BEFORE assigning the issue. This gives the agent a red starting point.

4. **Tiered dispatch model:**
   - **Tier 1 (GitHub agent):** Single-repo, tests pre-committed, clear file CRUD, no external dependencies
   - **Tier 2 (VS Code / Claude Code):** Multi-repo, complex orientation, no pre-existing tests, external dependencies
   - **Tier 3 (Operator direct):** Governance infrastructure changes, SKILL.md modifications, cross-cutting refactors

**Actions:**
- [ ] Add empty-PR merge guard to assurance gate workflow or PR template checklist
- [ ] Add pre-dispatch validation checklist to `/issue-dispatch` SKILL.md
- [ ] Re-dispatch p3.3 and p3.13 via VS Code agent (operator session) or Claude Code
- [ ] Consider pre-committing failing test stubs for remaining stories dispatched to GitHub agent (p3.4, p3.12)

**Pattern:** Any workflow that must push commits back to the PR branch must include `ref: ${{ github.head_ref }}` + `fetch-depth: 0` on checkout. Without these, the runner is in detached HEAD at the merge commit — commits succeed locally but pushes will be rejected whenever the branch has advanced since the workflow started.

---

## Definition skill — story count may be disproportionate for tooling/instrumentation features

### Observed — 2026-04-18

**Circumstance:** `/definition` for the `2026-04-18-skill-performance-capture` feature produced 5 stories for what is architecturally a config schema addition + a Markdown template + an instruction text addition + a directory convention + a check script. The operator flagged that 5 stories feels heavyweight relative to other features of similar complexity.

**Hypothesis:** The /definition skill's default decomposition is calibrated for user-facing feature work (stories = independently shippable slices of user value). For tooling/instrumentation features with no UI and no external consumers, user stories impose overhead that doesn't match the verification model — there is no "operator tries to do X and can/can't" demarcation between most of these stories.

**Not confirmed yet** — this may be correct decomposition for a governed pipeline (each story = one change to a governed file type, independently reviewable). But worth checking at /review whether story boundaries feel artificial or add overhead rather than reduce it.

**Action:** At /review, note whether story boundaries for spc.1–spc.5 feel natural or manufactured. If 3 stories would have covered the same scope without losing reviewability, flag as a calibration signal for the definition skill. Consider a future heuristic: for features where all stories touch the same 1–2 file types with no external persona consuming intermediate output, a single "thin feature" story may be more appropriate than vertical slices.

**Action:** Add to `.github/architecture-guardrails.md` as a workflow authoring guardrail. Log as Phase 2 /improve candidate.

---

## Tool-use gap D10 — git push rejection not always resolved by pull --rebase in CI; prefer explicit branch checkout

### Observed — 2026-04-12

**Circumstance:** Multiple iterations of adding `git pull --rebase origin ${{ github.head_ref }}` before the push in the "Commit trace file" step continued to fail with "Updates were rejected because the remote contains work that you do not have locally." The simple rebase loop did not resolve the problem on its own.

**Root cause:** The rebase instruction assumes the runner is on the correct branch. When checkout leaves the runner in detached HEAD (D9), `git pull --rebase origin branch` fetches and rebases onto the remote tip — but the local HEAD is still the detached commit, not the branch. The push `origin HEAD:branch` then attempts to push a detached HEAD commit on top of the rebased state, which may still be rejected if there is any mismatch.

**Lesson:** In CI, `git pull --rebase` is not a substitute for being on the correct branch. The correct fix is upstream: ensure the checkout step puts the runner on the actual branch (D9 fix). Once on the branch, a simple `git push` without any pull/rebase is sufficient — the runner already has the branch tip because `fetch-depth: 0` pulled full history.

**Pattern:** When debugging CI push rejections, check `git status` output for "HEAD detached at" before assuming the rebase logic is the problem. Detached HEAD is invisible in workflow logs unless you add `git status` debug output.

**Action:** Include `git status` in debug steps for any workflow that commits back to a branch. This surfaces detached HEAD immediately and prevents iterating on the wrong fix.

---

## Phase 2 dogfood finding D11 — `__dirname`-based absolute paths break on CI runners with different filesystem roots

### Observed — 2026-04-12

**Circumstance:** p2.5a IaC and SaaS-API adapter tests failed in CI with the "governance checks setup" failure. Running `node .github/scripts/check-surface-adapter.js` locally reproduced 6 failures: `iac-policy-floor-trace-confirms-source-file`, `iac-policy-floor-routing-resolves-to-iac-policy-file`, same two for `saas-api`, and both findings-vocabulary tests. The agent had stored `trace.policySource` using the absolute path from `module.exports._policyPath` (constructed with `path.join(__dirname, '..', '..', '..', 'standards', 'iac', 'POLICY.md')`). On the CI runner, this resolved to a container-internal absolute path that did not match the expected relative string `"standards/iac/POLICY.md"`. With `policySource` failing the contains-check, the file-existence guard returned early (status: error, findings: []), which in turn caused the findings-vocabulary tests to fail as a cascade.

**Root cause:** `__dirname` produces an absolute path rooted at the process's working directory on the machine where the module loads. Local developer path and CI runner path differ. Any string comparison against the relative path `"standards/iac/POLICY.md"` fails on either machine when the stored value is absolute. Additionally, the early-return on missing policy file silently caused downstream vocabulary tests to fail without indicating the real cause.

**Fix applied:** Added `_repoRoot = path.join(__dirname, '..', '..', '..')` and replaced `policySource: policyPath` with `path.relative(_repoRoot, policyPath).replace(/\\/g, '/')` in both `iac.js` and `saas-api.js`. All 31 tests pass.

**Standard to adopt (Flag for /improve → core.md):**
> MUST use `path.relative(repoRoot, absolutePath).replace(/\\/g, '/')` when storing file paths in `trace` or `state` output fields. Absolute paths constructed with `__dirname` are machine-specific and break on CI runners or any environment with a different filesystem root. Repo-relative forward-slash paths are portable.

**Scope:** Applies to all surface adapters (`src/surface-adapter/adapters/*.js`), the improvement agent (`src/improvement-agent/`), and any future module that writes file-system paths into structured output consumed by tests or audit tooling.

**Action:** Flag for Phase 2 `/improve` run — add as a new `MUST` to `standards/software-engineering/core.md`. Until then, the fix is documented here as the authoritative pattern reference.

---

## Phase 2 /improve D-batch log — 2026-04-12 16:58

**Context:** Category D proposals captured during the Phase 2 /improve run. Per instruction, these are logged as a batch and not written directly into skill files in this pass.

| Batch item | Proposal | Target for future write |
|---|---|---|
| D10 (dispatch transition) | Add `/issue-dispatch` forward pointer and required `git push origin master` gate to `/definition-of-ready` exit sequence when all stories in a batch are signed off | `.github/skills/definition-of-ready/SKILL.md` |
| D10a (dispatch close-loop) | Add PR body guidance to include `Closes #[issue]` for dispatched story issues so merge auto-closes the canonical tracking issue | `.github/skills/issue-dispatch/SKILL.md` and PR body template guidance |

**Status:** Logged for pipeline-evolution write-back; no direct skill-file modification in this /improve step.

---

## Phase 2 inner loop CI learnings — 2026-04-12

### [ci skip] in commit message prevents workflow trigger

**Circumstance:** A commit to a PR branch included `[ci skip]` in the message — standard git convention to suppress CI runs for housekeeping commits. GitHub Actions honours `[ci skip]` and `[skip ci]` by skipping all workflow runs for that push event.

**What went wrong:** The commit was intended to re-trigger the assurance gate after a fix was applied. Because the message contained `[ci skip]`, no workflow run was created. The PR appeared stuck with no new CI status — the fix was correct but produced no passing gate.

**Rule:** Never include `[ci skip]` or `[skip ci]` in a commit message on a PR branch when the intent is to trigger CI. Use these strings only on documentation-only or housekeeping commits pushed directly to `master` where no CI gate run is expected or desired.

---

### Job re-run uses cached workflow, not current master — push a new commit

**Circumstance:** After a workflow failure, the operator used GitHub's "Re-run all jobs" button to retry the CI run. The re-run picked up the workflow YAML as it existed at run-creation time (the SHA when the run was first triggered), not from the current `master`.

**What went wrong:** A fix had been pushed to the workflow YAML itself between the original failure and the re-run. The re-run executed the old, unfixed workflow. The fix appeared not to work until a fresh commit to the PR branch triggered a new run that loaded the updated workflow.

**Rule:** When a workflow YAML has been modified and the intent is to validate the fix against CI, push a new commit to the PR branch — do not use "Re-run all jobs." Re-run always replays the workflow from the run's original creation SHA.

---

## General design principle — governance constraints must be visible at the moment of action

### Observed — 2026-04-12 (Phase 1+2 close synthesis)

**Pattern synthesised from:** non-schema guardrail values gap (pipeline-state.json `status`/`category` enums), testability filter gap (untestable Bitbucket AC propagated through full pipeline), cross-story schema dependency gap (p1.6 did not know p1.4's read-side schema), and the D-batch pipeline exit-sequence gaps (D3/D5/D6).

**Principle:** A governance constraint is only effective if it is visible at the exact moment a decision is made. Constraints buried in reference documents, schema files, or downstream stories are systematically ignored — not through negligence, but because agents (and humans) operate in bounded context windows. They read what is immediately in front of them and write what feels locally consistent.

**Three forms this failure takes:**
1. **Schema constraints not in the writing skill.** The pipeline-state.json guardrail enum values were defined in the JSON schema but not quoted in the DoD or DoR skill files. Skills wrote informal synonyms (`pass`, `deferred`, `no-breach`) because the valid values were not stated at the point of writing. Fix: embed the enum inline in the SKILL.md writing instruction, not just in an external schema file.
2. **Testability constraints not evaluated at story-writing time.** The definition skill wrote Bitbucket-requiring ACs without asking "can this be tested in the delivery context?" The filter existed conceptually (discovery flagged Bitbucket as portability requirement) but was not applied at AC-writing time because there was no SKILL.md step requiring it. Fix: make the testability question a mandatory filter at the AC sentence level in `/definition`, not a review-phase catch.
3. **Consuming schema not visible to producing story.** p1.6 wrote `workspace/suite.json` without knowing that p1.4 would require `skillSetHash` and `surfaceType` at runtime, because p1.4's DoR did not surface its read-side schema to the producing story's scope. Fix: when a story references a file produced by another story, the consuming story's required schema must be written into the producing story's DoR contract — not just verified at integration time.

**General formulation:** Any constraint that a skill must respect must be quoted, inline, at the point in the SKILL.md where the constrained decision is made. Linking to an external file, appendix, or reference document is not sufficient — agents navigate forward in a file and do not re-read sections they have passed. The constraint must appear in the same paragraph as the instruction it constrains.

**Application to pipeline evolution:** When adding a new schema field, enum value, or naming convention to any platform artefact, the first write-back target is the SKILL.md step that authors that field — not just the schema file or governance doc.

**Action:** Use this principle as the evaluation criterion when reviewing D-batch proposals. Before accepting a proposal that adds a new constraint, ask: "Is this constraint visible at the moment of action in the skill that is most likely to violate it?" If not, add it there before (or instead of) adding it to a reference document.

---

## Adversarial audit synthesis — RBNZ-framed challenges and bounded governance claim

### Observed — 2026-04-12 (Phase 1+2 close — governance honest-scope assessment)

**Context:** Before the Ent. pilot conversation, the platform's governance claims were tested against RBNZ-style regulatory audit challenges — the seven hardest questions a risk-function reviewer would ask about an AI-governed delivery pipeline in a regulated context.

**The seven challenges and the platform's current honest answers:**

| # | Challenge | Honest answer | Phase 3 path |
|---|-----------|---------------|-------------|
| 1 | Can you prove what instruction set governed each AI action? | `traceHash` is present in Phase 2 traces and verifiable against git history. Provable for all merged Phase 2 PRs. | Complete — no gap. |
| 2 | Can you prove which standards applied? | `standardsInjected` field is not yet populated in real traces — hash reconciliation not wired into CI trace write. Not provable at Phase 2 close. | p1.7/p2.1 gate enhancement (Phase 3). |
| 3 | Can you prove AI independence from human prompting at audit time? | Three-agent structure is procedural, not structural (see R1). CI validates separate trace entries exist but not genuine session independence. Not provable from trace alone. | Phase 3 CI gate story — validate entry count + session timestamp gap. |
| 4 | Can you prove no regression from previous delivery cycles? | Watermark gate (p1.4) is operational; `results.tsv` contains pass/baseline rows. Regression detection is live. Provable. | Complete — no gap. |
| 5 | Can you prove a non-engineer approved the delivery specification? | Non-engineer approval interface (p2.8) is built and tested. No real non-engineer has used it yet (M5 not-started). Not provable from a real-world event. | Live pilot with a real non-engineer approver. |
| 6 | Can you prove that improvement to the AI instruction set was human-reviewed before adoption? | `workspace/proposals/` contains diff proposals with challenger pre-check results; PR merge is the human review gate. Provable for any actioned proposal in Phase 2. | Complete once first proposal is actioned. |
| 7 | Can you prove the governance applied on day N is the same governance that was reviewed and approved? | Hash is in the trace; recomputation against git history is possible but not automated in audit tooling. Manual recomputation only. | Phase 3 — automate hash drift check in assurance gate. |

**The bounded governance claim:** The platform can honestly claim automated, auditable governance for challenges 1, 4, and 6. Challenge 2 is architecturally designed and will close in Phase 3. Challenges 3, 5, and 7 are open gaps requiring Phase 3 delivery and/or live pilot evidence. The platform cannot claim full RBNZ-equivalent control assurance at Phase 2 close. It can claim a materially stronger governance posture than unstructured AI use, with a credible and costed path to full assurance.

**What this means for the pilot conversation:** The honest framing is "structured governance with verified traceability for 3 of 7 regulatory challenges, and a Phase 3 roadmap for the remaining 4." Overclaiming full regulatory compliance at this stage would produce an adversarial review outcome. The bounded claim is both more credible and more defensible.

**Action:** Use this table as the governance claim calibration reference for the Ent. pilot conversation. Update the table when Phase 3 delivers. Do not advance the claim beyond what the evidence record supports.

---

## Operational pattern — High model rate limit: 45-minute window, Auto model as structured-work fallback

### Observed — 2026-04-12 (Phase 2 inner loop delivery)

**Circumstance:** During the Phase 2 delivery cycle, the primary model (Claude Sonnet 4.6 via GitHub Copilot) hit the "High" rate limit — a per-period cap distinct from the monthly token budget. The limit is enforced at the API level; newly started turns receive a rate-limit error and the session cannot proceed with the primary model.

**Pattern observed:**
- Rate limit duration: approximately 45 minutes from first refusal before the quota refreshes.
- The error surfaces as a session-level refusal, not a token depletion warning — the limit hits without prior degradation signal.
- The "Auto" model (Copilot's automatic model routing, which uses available capacity across the model pool) is not subject to the same per-model limit. It degrades gracefully to available capacity and continues supporting structured pipeline work.

**What Auto model is suitable for during a rate-limit window:**
- Reading and summarising artefacts
- Writing learnings.md entries and workspace/state.json updates
- Reviewing pipeline-state.json for consistency
- Producing structured markdown artefacts (DoD, checkpoint, adoption-readiness)
- Any task where the output format is highly constrained (the Auto model follows structured templates reliably)

**What Auto model is less suitable for:**
- Complex multi-file implementation plans requiring deep codebase reasoning
- Novel architecture decisions where reasoning quality matters more than formatting
- Any task where the operator has found Auto outputs require heavy correction

**Operational procedure:**
1. When rate-limit error appears: note the approximate time, switch to Auto model.
2. Continue structured pipeline work (artefacts, state writes, learnings) in Auto for up to 45 minutes.
3. After 45 minutes: try a short test turn in the primary model to confirm quota has refreshed.
4. Resume primary model for higher-reasoning tasks.

**Why this matters for session planning:** The rate-limit window is 45 minutes of potentially wasted calendar time if the operator stops work. Recognising Auto as a reliable fallback for structured work converts the window from a blocker to a usable period. In practice, most outer-loop pipeline work (artefact writing, state management, checkpoint) falls in the Auto-suitable category.

**Action:** Record as an operational pattern. No SKILL.md write-back required — this is runtime operating procedure. Reference in any future operator guide or ONBOARDING.md update.

---

### Phase 2 finding — inner loop automation displacement is the dominant outer-loop efficiency signal

**Date:** 2026-04-12
**Context:** Phase 2 E3 actuals vs E2 forecast. E2 forecast: ~30h outer loop (13 stories × 2.3h/story Phase 1 norm). E3 actuals: ~1h outer loop (medium-low confidence, JSONL unavailable). Premium requests actual: 68 vs ~322 forecast — an ~80% reduction. Inner loop: agent-autonomous for all 13 stories, 0 human implementation sessions required.

**Finding:** When the inner loop is fully agent-autonomous, operator outer-loop focus approaches a structural minimum — not a calibration gap. The E2 forecast based on Phase 1 norms overstates outer-loop effort because Phase 1 had significant human implementation time mixed into the engagement figure. The Phase 1 norm of ~2.3h/story conflates outer-loop planning/artefact work with human inner-loop time; once the inner loop is autonomous, only the former remains.

**Implication for estimation norms:** The correct Phase 2 estimate baseline is not `storyCount × focusHPerStory` but rather `storyCount × outerLoopOnlyH/story` — approximately 0.08h/story when the inner loop is fully autonomous. This is not a freak result; it is the automation dividend.

**Implication for the E2 model:** `/estimate` E2 should fork its forecast on the expected automation level:
- Inner loop human-assisted → use Phase 1 norm (~1.4h outer-loop/story at 28% engagement)
- Inner loop agent-autonomous → use Phase 2 norm (~0.08h outer-loop/story at 25% engagement, medium-low confidence; revise after telemetry-path E3 is available)

**Action:** Note in `estimation-norms.md` that the Phase 2 entry is the automation-displacement baseline. Update `/estimate` E2 instructions at Phase 3 to include the automation-level fork. **Phase 3 story candidate:** Add inner-loop automation level as an E2 input field, with a calibrated low-automation vs high-automation h/story norm.

---

### T3M1 honest gap — 5 of 8 audit questions unanswered at Phase 2 close

**Date:** 2026-04-12
**Context:** p1.8 AC3 — T3M1 acceptance test evaluated against first real Phase 2 inner loop trace (story p2.4, PR #31, trace `workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl`).

**Result:** 3/8 Y. The 5 unanswered questions and their Phase 3 fill targets:

| # | Question | Gap reason | Phase 3 target |
|---|---|---|---|
| Q2 | `standardsInjected` hashes visible and verifiable in trace | Hash reconciliation not yet wired into CI trace write | p1.7 / p2.1 gate enhancement |
| Q5 | Watermark row visible in PR (pass/fail reason surfaced) | Watermark gate does not yet emit result to PR comment | p1.4 PR reporting story |
| Q6 | `stalenessFlag` present in trace for this skill version | Skill-version staleness field not in trace schema | Phase 3 schema story |
| Q7 | Agent independence evidenced by three separate trace entries | CI does not validate entry count or cross-session independence | Phase 3 CI gate story |
| Q8 | Hash recomputation confirms no drift since approval | Hash drift check not yet wired into assurance gate CI step | Phase 3 assurance story |

**Implication for adoption gate:** `MODEL-RISK.md` Section 4 sign-off is conditional on re-evaluation after all 5 gaps are resolved. Full 8/8 is required before any regulated-enterprise adoption . Tracked in `MODEL-RISK.md` Section 3 T3M1 evidence block.

---

### Phase 3 platform improvement candidate — Windows-native trace validator (`validate-trace.ps1`)

**Date:** 2026-04-12
**Context:** `/trace` validation is currently implemented via `scripts/validate-trace.sh`. In Windows shell contexts, execution depends on Git Bash/WSL path translation and Python launcher behaviour, which caused avoidable execution failures during Phase 2 closeout.

**Proposal:** Add `scripts/validate-trace.ps1` as a first-class PowerShell equivalent of `validate-trace.sh`, with parity for:

- check set (`schema_valid`, `discovery_exists`, `discovery_approved`, `test_plan_coverage`, `unresolved_blockers`)
- `--ci` style machine-readable output (`trace-validation-report.json`)
- non-zero exit code on hard-fail checks
- single-check targeting equivalent to `--check`

**Why this matters:** Windows-native validation removes shell/launcher variability and makes `/trace` reproducible for operators running in PowerShell-only enterprise environments (including likely Enterprise desktop baselines).

**Phase 3 closure condition:** `scripts/validate-trace.ps1` exists, CI parity tests pass against the same fixture set as `validate-trace.sh`, and both scripts produce equivalent pass/fail results on the same repo state.

---

### Phase 2 finding — abbreviations and codes without descriptors block human follow-through

**Date:** 2026-04-12
**Context:** Phase 2 closeout review. References throughout pipeline artefacts, skill outputs, and human-oriented action items used codes alone — e.g. `T3M1`, `AC3`, `E2`, `E3`, `MM1` — without an inline descriptor. A second operator reading these references cannot follow the chain without separately looking up what each code means.

**Examples observed:**
- `T3M1` (Tier 3, Meta-metric 1 — the independent non-engineer audit question) appeared in MODEL-RISK.md, learnings entries, and the validation playbook without explanation on first use in each document
- `E1 / E2 / E3` (/estimate skill estimation passes: E1 = rough at discovery, E2 = refined at definition, E3 = actuals at /improve) appeared in estimation-norms.md and learnings entries with no inline gloss
- `AC3` (Acceptance Criterion 3 from the story's AC list) appeared in DoD observations and pipeline-state.json action items without the criterion text quoted
- `MM1 / MM2 / MM4` (meta-metrics from the benefit-metric artefact: MM1 = outer-loop unassisted replication, MM2 = …) appeared in the validation playbook metric sections without the metric name spelled out alongside

**Root cause:** The pipeline was written by a single operator with full context. Abbreviations that are obvious to the author are opaque to a second operator following a reference cold.

**Standard going forward:**
1. **First use in any human-oriented document** (artefact, playbook, DoD, learnings entry, action item): write the full descriptor in brackets after the code — e.g. `T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit)`, `E2 (/estimate pass 2 — refined at definition)`, `AC3 (Acceptance Criterion 3: <criterion text>)`.
2. **Subsequent uses in the same document:** code alone is acceptable once the descriptor has appeared.
3. **Human-oriented action items** (pendingActions in state.json, DoD observations, DoR instructions): never use a bare code in an action item — always include enough text that the action is self-describing without cross-referencing another file.
4. **Skill outputs and artefact headings:** the first reference to any metric code, AC code, or estimation pass code in a skill-generated artefact must include the full name. This applies in SKILL.md instruction files and in the artefacts those skills produce.

**Scope of remediation:** Legacy artefacts from Phase 1 and Phase 2 are not retroactively updated — the cost is prohibitive and the artefacts are finalised. The standard applies from Phase 3 delivery onwards and to any new human-oriented documents (e.g. `docs/validation-playbook.md`) being written now.

**Action:** Add this standard to `.github/copilot-instructions.md` Artefact writing standards section before Phase 3 /discovery runs. Reference this entry as the signal source.

---

### Phase 2/3 boundary finding — copilot-instructions.md base layer contradicts P1.1 progressive skill disclosure design

**Date:** 2026-04-12
**Context:** Post-optimisation review of copilot-instructions.md (473 lines after commit `135221b` — down from 537 lines). User identified that 473 lines is still too long for an always-on base layer given the P1.1 progressive skill disclosure design: skills load on demand, not all context in the base layer.

**P1.1 design intent:** The ideal base layer carries only always-needed context: product context · session start hook · pipeline table · checkpoint convention · estimation model reference · artefact writing standards · pipeline state mandatory write rule · architecture standards links. Everything else should live in the individual SKILL.md file that needs it.

**Verification — grep analysis of .github/skills/\*\*:**

| Search | Result | Implication |
|--------|--------|-------------|
| `artefacts/[YYYY-MM-DD` | 2 matches in `discovery/SKILL.md` lines 214/216 | Artefact naming convention IS in its SKILL.md — the 45-line directory tree in base layer is duplicate content |
| `templates/story.md\|epic.md\|test-plan.md` | 10 matches across `definition/SKILL.md`, `review/SKILL.md`, `test-plan/SKILL.md`, `bootstrap/SKILL.md` | Every skill that uses a template references its template directly — the 49-line templates table in base layer is redundant |
| Coding agent orientation keywords | 0 matches in any SKILL.md | The 64-line "GitHub Copilot coding agent — project orientation" + "What the coding agent should NOT do" sections have no SKILL.md home — they are the largest single candidate for relocation |

**Sections identified for Phase 3 D-batch removal or relocation:**

| Section | Lines (actual) | Action | Evidence |
|---------|---------------|--------|----------|
| `## Templates` (34-row table) | 49 | Remove from base layer — each skill references its own template in its SKILL.md | 10 grep matches across 4 SKILL.md files |
| `## Artefact storage` (directory tree) | 45 | Compress to 3-line naming-convention statement — full tree is in discovery/SKILL.md | 2 matches in discovery/SKILL.md lines 214/216 |
| `## Context handoff protocol` | 28 | Compress or merge into session start — covered by per-skill artefact paths and the session start hook | The canonical file list is per-skill knowledge |
| `## GitHub Copilot coding agent — project orientation` + `## What the coding agent should NOT do` | 64 | Relocate to a new agent-scoped instructions file (e.g. `.github/instructions/agent-orientation.instructions.md`) — only applies in GitHub Actions execution context, wastes context in every interactive VS Code session | 0 matches in any SKILL.md |
| `## Product context files` (4-row table) | 18 | Compress to 1-line pointer — skills that read these files (/discovery, /benefit-metric) will know from their own SKILL.md | Coverage by individual skills |

**Total moveable: ~204 lines. Current: 473 lines. Target after Phase 3 D-batch: ~270 lines.**

**Phase 3 D-batch action items:**
1. Extract "GitHub Copilot coding agent — project orientation" + "What the coding agent should NOT do" (~64 lines) to `.github/instructions/agent-orientation.instructions.md` with appropriate `applyTo` scoping. Verify the GitHub Actions agent still receives this context before removing from base layer.
2. Remove the 34-row templates table (~49 lines) from the base layer. Replace with a single sentence: "All artefact templates are in `.github/templates/` — each skill references its own template in its SKILL.md."
3. Compress the artefact storage directory tree (~45 lines) to 3 lines stating the naming convention. The full tree lives in `discovery/SKILL.md`.
4. Compress or merge the context handoff protocol (~28 lines) into the session start section — the "read artefact folder before writing code" instruction belongs in SESSION START and in the coding agent orientation, not as a standalone section.
5. Compress the product context files table (~18 lines) to a 1-line pointer to `product/`.

**Pre-condition for Phase 3 D-batch execution:** Verify that each target section is fully covered in the relevant SKILL.md or a new scoped instructions file before removing from the base layer. Do not remove without a verified landing zone. Risk: agent context gaps if migration is incomplete.

---

## `feat/repo-tidy` architectural fix learnings — 2026-04-13

**Context:** PR #50 (`feat/repo-tidy`) fixed an infinite-loop flaw in the assurance gate introduced during Phase 1 delivery. The gate was committing trace files back to PR branches from within the required-check workflow — causing the commit to trigger a new required-check run, which committed again, indefinitely. The fix restructured the gate into two separate workflows with separate permissions and separate trigger events. These learnings generalise beyond the specific fix.

---

### Architectural — Evaluation workflows and write-back workflows must be separate triggers with separate permission scopes

**Date:** 2026-04-13

**Circumstance:** The assurance gate workflow (`assurance-gate.yml`) was structured as a single workflow triggered by `pull_request` events. It evaluated the PR, then committed a trace file back to the PR branch using `git push origin HEAD:${{ github.head_ref }}`. This push generated a new `synchronize` event on the pull request, which re-triggered the same workflow, which committed again — a structural loop, not an implementation error.

**Root cause:** The workflow conflated two logically distinct roles — evaluation (read, assess, surface verdict) and persistence (write artefact to repository). Giving a single workflow both roles creates a structural self-triggering hazard whenever the workflow fires on the same event type that a push to the branch would generate (`synchronize`).

**Why it generalises:** This is not a GitHub-specific failure. Any pipeline where an evaluation step can write to the evaluated artefact risks a loop or a contaminated evaluation record — the evaluator modifying its own input. The structural constraint is: **the gate that evaluates a change must not have write authority over the target it evaluates, and must not be the workflow that persists the audit record.** These are separate responsibilities and must be structurally separated.

**The correct pattern for CI audit records in a protected-branch environment:**
1. `pull_request` trigger → evaluate → upload GitHub Actions artifact → post verdict comment → exit (`contents: read` permission only)
2. `push` to main trigger → download artifact from gate run → commit audit record to main → exit (`contents: write` permission; separate workflow; separate event)

This is the enterprise-standard maker/checker pattern: the gate that signs off and the workflow that writes the permanent record are operationally independent. A gate with `contents: read` cannot produce the audit record even if the code attempted it — the permission scope is the enforcement mechanism, not just a convention.

**Implication for future gates:** When adding any new governance gate to the platform or to fleet repos, the design question is: "Does this gate need to persist a record? If yes, that persistence must be a separate post-merge workflow, not a step inside the gate itself." Start from `contents: read` and escalate only when a clear, reviewed justification exists.

**Action:** Add this constraint to `.github/architecture-guardrails.md` as a named workflow authoring guardrail. The principle (separate evaluation from persistence; separate trigger from commit) is the generalised form — more useful than "don't commit from a required check."

---

### Architectural — Branch protection surfaces latent structural violations; add it early in fleet repos

**Date:** 2026-04-13

**Circumstance:** The assurance gate's commit-back pattern had been present since Phase 1 delivery. It was only discovered to be a structural loop when branch protection was added to the platform repo — specifically when required checks were configured and the loop (previously just wasteful) became an infinite cycle that blocked PRs.

**Finding:** Branch protection is not just a safety mechanism — it is a structural test. A workflow architecture that works without branch protection may fail structurally under it, because branch protection enforces invariants (required check per SHA, no direct push to main) that expose conflicts hidden by looser settings.

**Implication for fleet deployment:** Consuming squad repos that adopt the platform should add branch protection during onboarding, not after the pipeline is mature. A structural flaw in a workflow that ships to 20 repos is 20× harder to fix than one caught in a single onboarding repo. The cost of finding architectural issues early (during setup) is far lower than the cost of finding them at scale.

**Operational rule:** Any new platform repo should have branch protection (required checks, restrict direct push to main) configured before the first story enters the inner loop. If branch protection is deferred, the onboarding is not structurally complete.

**Action:** Add to the `/branch-setup` or `/bootstrap` skill a mandatory "verify branch protection is configured before dispatching inner loop" check. At minimum, document this requirement in `ONBOARDING.md` as a day-1 platform setup step.

---

### Architectural — Post-merge trace on main is a stronger audit record than a trace on a feature branch

**Date:** 2026-04-13

**Circumstance:** The post-merge `trace-commit.yml` workflow commits the assurance trace to `master` after PR merge, not to the feature branch as the old architecture did.

**Why this is a positive governance property, not just a technical implementation detail:** Feature branches have a defined lifecycle — they are created, used, and deleted. A trace committed only to a feature branch may be pruned from history when the branch is deleted, depending on git history retention configuration. `master` (or `main`) is permanent by convention and typically backed by stronger retention policy in regulated environments. An audit record on `master` is retrievable years later without branch retention special-casing.

**The governance framing:** The assurance trace is an audit artefact — evidence that a specific governance check ran, passed, and evaluated specific content. Audit artefacts should be committed to the permanent record, not to the ephemeral working branch. This is the same principle that governs where change management records, compliance certificates, and deployment logs are stored: the permanent ledger, not the working copy.

**Action:** Add this framing to `MODEL-RISK.md` as an explicit positive governance property of the two-workflow architecture when describing the post-merge trace commit pattern.

---

### Implementation — `[ci skip]` suppresses status reporting and is incompatible with protected required checks

**Date:** 2026-04-13

**Circumstance:** A commit message containing `[ci skip]` was used to suppress re-triggering of the assurance gate after a trace file was committed back to the PR branch. GitHub Actions honours `[ci skip]` by skipping all workflow runs for that push event — including the `Post verdict to PR` step that surfaces the gate result. With no gate run on the latest SHA, the required check shows "Waiting for status to be reported" indefinitely.

**Why `[ci skip]` is the wrong tool here:** Its purpose is to suppress workflow runs for commits that are purely non-functional (documentation, whitespace, etc.) where CI is unnecessary. It is a blunt-instrument: it suppresses all workflows, including required ones that must report back to branch protection. When a commit is on a branch with required checks, `[ci skip]` converts "CI ran and the commit is covered" to "CI never ran, SHA has no status" — which GitHub treats identically to a failing check.

**The right fix:** Do not use `[ci skip]` to break a self-triggering loop. The loop is the structural problem; `[ci skip]` is a workaround that introduces a different failure mode. The structural fix is the two-workflow separation described above — the gate never commits to the branch, so there is nothing to suppress.

**Generalised principle:** Never use `[ci skip]` on a branch where required checks are enforced. The only safe use of `[ci skip]` is on commits pushed directly to `main`/`master` for housekeeping purposes where no gate or required check applies.

---

### Implementation — GitHub branch protection evaluates required checks per HEAD SHA; any branch commit resets the requirement

**Date:** 2026-04-13

**Circumstance:** After pushing commit `60d8768` (the architectural fix) to `feat/repo-tidy`, the PR still showed "Waiting for status to be reported" even though the gate had previously passed on the prior HEAD. A second empty commit (`48a6745`) was required to trigger a new gate run.

**Root cause:** GitHub branch protection requires a passing check result specifically on the current HEAD SHA. A check that passed on SHA A does not satisfy the requirement for SHA B, even if A and B differ only in metadata. When `git pull --ff-only` fast-forwarded through a bot commit (`e46d876`) before our push, GitHub's per-SHA tracking required a fresh check on the new HEAD.

**Why this matters:** This behaviour is expected and correct by design — it ensures the check that signed off on a PR actually evaluated the code that is being merged, not a prior version. But it is non-obvious and causes confusion when: (a) a bot commits to the PR branch (resetting the requirement), or (b) a push that looked like a fast-forward from the user's perspective is actually a SHA change in GitHub's tracking.

**The `git commit --allow-empty` pattern:** An empty commit is the correct way to force a `synchronize` event on a PR when GitHub has not picked up a previous push as requiring a new check run. `git commit --allow-empty -m "ci: trigger <gate> on <sha>"` creates a minimal new SHA with no content change, generates a `synchronize` event, and causes the required check to run without introducing any code change.

**Known-behaviour documentation:** Add to the platform's known GitHub Actions behaviours reference: "Required check status is per-SHA. Any commit to the PR branch — including bot commits — creates a new HEAD SHA and resets the required check requirement to 'waiting'. Use `git commit --allow-empty` to re-trigger the check without a code change."

---

### Implementation — Artifact handoff between workflows has a timing dependency; monitor early post-merge trace runs

**Date:** 2026-04-13

**Circumstance:** `trace-commit.yml` (post-merge workflow) finds the assurance gate artifact by querying `listWorkflowRuns` + `listWorkflowRunArtifacts` for the most recent completed gate run against the merged SHA. This introduces a timing dependency: the gate run must be complete and its artifact must exist before `trace-commit.yml` executes. If the gate run is still in progress when the push-to-main event fires (unlikely but possible), or if the artifact has expired (retention-days: 7), `trace-commit.yml` will fail to find the artifact and exit without committing.

**Why this is acceptable risk:** The gate verdict is committed to the PR comment (permanent) regardless of whether `trace-commit.yml` succeeds. The trace commit is an additional quality record — its absence is an observable gap, not a silent failure. The artifact retention window (7 days) is sufficient for any normal merge cadence.

**Monitoring instruction:** For the first 3–5 post-merge uses of `trace-commit.yml`, check the GitHub Actions tab after each PR merge to confirm: (a) the workflow ran, (b) it found the artifact (no "artifact not found" log line), (c) a `chore: assurance trace [post-merge]` commit appears on `master`. If any run fails, note which step failed — this distinguishes timing issues from API query logic errors.

---

### Implementation — Silent test scripts are invisible in test summaries; document them explicitly

**Date:** 2026-04-13

**Circumstance:** `check-changelog-readme.js` produced no stdout output during the `npm test` run, because it exits cleanly with no output when no files are staged (its only relevant condition in a non-pre-commit context). This caused it to be omitted from the test run summary table, creating an apparent "22 vs 23 suite" discrepancy that required investigation to resolve.

**Finding:** A test script that produces no output on a passing run is functionally invisible in any summary that counts output lines or suite headers. It is present in the 22-count but indistinguishable from "didn't run" from the output alone.

**Pattern to avoid:** When writing governance check scripts, include at minimum one line of stdout output on a passing run — e.g. `[check-name] SKIP — no staged files (outside pre-commit context)`. This makes the script visible in run output without changing its exit behaviour. A test that is silent on pass is harder to audit than one that confirms it ran.

**Generalised principle:** CI check output should be auditable from the log alone. A passing run that leaves no trace in the log creates ambiguity about whether it ran at all. This applies to any governance check, not just changelog validators.

---

### Governance — Maker/checker independence is now structurally enforced via permission scope separation

**Date:** 2026-04-13

**Circumstance:** Old architecture: single workflow with `contents: write` performed both evaluation (assurance gate logic) and write-back (git push trace file). New architecture: gate workflow has `contents: read` only; post-merge workflow has `contents: write` only; they are triggered by separate events (`pull_request` vs `push` to main).

**Why this is a meaningful governance property, not just a technical implementation detail:** Maker/checker independence is a core principle in regulated environments — the party that creates a record and the party that approves/audits it must be independent. In the old architecture, the same workflow execution context that ran the evaluation also wrote the record, using the same credentials and permission scope. The gate could theoretically modify its own output between evaluation and persistence. In the new architecture, the gate cannot write anything — the permission scope prevents it at the infrastructure level, not by code convention. The write-back workflow has no evaluation logic. These are provably independent.

**The audit-ready framing:** When describing the assurance architecture in MODEL-RISK.md or a governance submission, the permission separation should be stated explicitly: "The evaluation workflow (assurance-gate.yml) is granted `contents: read` only. It cannot modify the repository. The persistence workflow (trace-commit.yml) fires post-merge on main and has `contents: write`. It has no evaluation logic. These are structurally separate workflows triggered by separate events with non-overlapping permission grants."

**Action:** Add this framing to `MODEL-RISK.md` Section 2 (architecture description) and Section 4 (governance properties) when updating for the feat/repo-tidy changes.

## Workflow health visibility gap � post-merge trace-commit failures (PR #53�#57)

### Observed � 2026-04-13

**Circumstance:** PR #51 and #52 post-merge trace-commit.yml workflows failed silently. Workflow exited with code 1, but no alert or visible signal. Root cause discovered only when manually verifying traces branch state.

**Primary root cause:** trace-commit.yml checked \git rev-parse --verify origin/traces\ BEFORE doing \git fetch origin\. Stale local refs meant remote branch detection always failed. When traces branch existed remotely, push rejected with "fetch first" error. Fixed in PR #55 by moving \git fetch origin\ to start of script.

**Contributing gap:** No automated test/verification validates post-merge workflows complete successfully. \/verify-completion\ skill does not check workflow health. \/trace\ skill does not validate traces branch state. No governance gate prevents silent workflow failures.

**Four gaps identified for Phase 3 (backlog story scope � do not implement now):**

| Gap | Item | Phase 3 Scope |
|-----|------|---------------|
| (1) | No governance assertion | Implement check-trace-commit.js: assert traces branch exists, has =1 recent entry, report workflow success rate |
| (2) | No post-merge health check | Add /verify-completion skill warning to check Actions tab for trace-commit.yml; OR add post-merge health-check.yml workflow |
| (3) | /trace skill does not validate traces branch | Update /trace skill to check origin/traces exists, list recent entries, detect trace-commit failures |
| (4) | No defensive docs in skills | Update /verify-completion SKILL.md: add "Post-merge workflow verification" section directing users to check Actions tab or \git log origin/traces\ |

**Decision:** Post-Phase-2 work. Document as Phase 3 backlog story with all four AC items, acceptance criteria, and learnings linkage. Register for Phase 3 /discovery intake.

**Action:** Create \workspace/phase3-backlog-trace-commit-observability.md\ story file with full AC list. Register in workspace/state.json for Phase 3 discovery.

---

### Dispatch strategy - large plan stories should run in VS Code agent mode

**Date:** 2026-04-15

**Circumstance:** Story p3.2a was dispatched to the GitHub cloud agent and repeatedly produced only an "Initial plan" commit, then cancelled with no implementation. The implementation plan file was very large and the run consistently stopped before task execution.

**Learning:** For stories with long implementation plans and multi-file TDD tasks, dispatch should target VS Code agent execution instead of GitHub cloud agent execution. The local VS Code agent can iterate with stable context and complete RED-GREEN-REFACTOR loops without cloud run cancellation.

**Operational rule:** If a GitHub cloud agent run ends with planning-only output and no code changes, do not re-run the same target repeatedly. Re-dispatch the story as a VS Code agent task and continue from the existing plan artefact.

**Action:** Update dispatch guidance to prefer VS Code target for high-context stories (for example, p3.2a-scale plans) and reserve GitHub cloud agent dispatch for smaller bounded tasks.

---

## /improvement run � 2026-04-16

**Phase:** /improvement (write-back of outstanding learnings candidates)
**Scope:** 6 items applied to 4 target files; 4 retrospective stories created (p3.18�p3.21) to satisfy artefact-first rule before SKILL.md modifications

**Items applied:**

| # | Target file | Change |
|---|-------------|--------|
| 1 | .github/skills/definition/SKILL.md | Added D2-platform mandatory gate (platform-availability check before writing ACs) |
| 2 | .github/skills/definition/SKILL.md | Added D1-prereq cross-codebase validation before writing RISK-ACCEPT prerequisite stories |
| 3 | .github/skills/definition-of-done/SKILL.md | Added schema-valid guardrail enum reminder block after Merge-by-id instruction |
| 4 | .github/skills/definition-of-ready/SKILL.md | Added schema-valid guardrail enum reminder block after Merge-by-id instruction |
| 5 | .github/copilot-instructions.md | Added state write-path safety paragraph in /checkpoint section |
| 6 | .github/skills/systematic-debugging/SKILL.md | Added Coupled-change workflow section before ## Integration |

**Artefacts created:** p3.18, p3.19, p3.20, p3.21 � each with story, test-plan, and DoR in artefacts/2026-04-14-skills-platform-phase3/

**Items deferred to operator confirmation:** Item 7 (docs/conflict-resolution-guide.md) and Item 8 (second-session verification prompt) remain pending.

**Key learning this run:** The artefact-first rule (copilot-instructions.md Coding Standards) applies to SKILL.md modifications as much as to src/ or governance check scripts. The rule must be checked before applying any improvement write-back. Failure to do so would itself have been a governance violation.
