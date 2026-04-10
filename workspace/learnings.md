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

## Cross-story schema dependency — producing story did not know consuming story's schema requirements

### Observed — 2026-04-11

**Circumstance:** PR #16 (p1.4 watermark gate) passed all local `npm test` checks but failed CI with: `[watermark-gate] ERROR: suite.json missing or invalid field: skillSetHash`. The `workspace/suite.json` file was authored by the p1.6 agent (living eval regression suite) and contained `version`, `description`, and `scenarios` fields. The p1.4 `watermark-gate.js` runtime required two additional fields that p1.6 never wrote: `skillSetHash` (string, git tree hash of `.github/skills/`) and `surfaceType` (string, e.g. `"github-copilot"`).

**Root cause:** At DoR time, p1.4 specified that it would read `workspace/suite.json` but did not specify the exact schema it required. The p1.6 DoR scoped the suite.json output but had no visibility into p1.4's read-side schema requirements. The two stories were written and reviewed independently; the schema dependency was never made explicit in either DoR or test-plan.

**Finding:** When story A writes an artefact consumed by story B, the consuming story (B) must specify its required schema in the DoR or test-plan — not just the file path. The producing story (A) must then include those fields in its scope. If A ships first without the required fields, B will fail at runtime even when both stories pass their own tests in isolation.

**Fix applied:** Added `skillSetHash: "a1604b2e14cfb6627a0dabe3bdfabab658be8ffd"` (git tree hash of `.github/skills/` at Phase 1 delivery) and `surfaceType: "github-copilot"` to `workspace/suite.json`.

**Action:** Add a cross-story schema dependency check to the DoR skill: when a story references a file produced by another story, require the consuming story to document the exact fields it reads. Propagate those field requirements back to the producing story's DoR contract as explicit output schema constraints. Flag for `/levelup` post-merge.

---

*More signals will be added here as Phase 1 dogfood run progresses.*
