# Inner Loop Framework Audit

**Produced:** 2026-06-13
**Author:** EXP-036/037 prep — inner loop eval programme design
**Source:** All inner loop SKILL.md files read in full

---

## 1. Pipeline Chain Analysis

The inner loop consists of five sequenced skills that execute after DoR sign-off and end with a PR ready for human merge, which then triggers /definition-of-done.

### Chain diagram

| Stage | Skill | Consumes | Produces | State fields written |
|-------|-------|----------|----------|----------------------|
| 0 | /definition-of-ready | Story + test plan + review report + discovery (H-GOV) | DoR artefact with Proceed: Yes + Coding Agent Instructions block | `story.stage="definition-of-ready"`, `dorStatus="signed-off"/"blocked"`, `health` |
| 1 | /branch-setup | DoR artefact (Proceed: Yes) | Git worktree + confirmed clean baseline | `feature.stage="branch-setup"`, `story.stage="branch-setup"`, `health`, `blocker` if baseline fails |
| 2 | /implementation-plan | DoR artefact + test plan + AC verification script + `.github/context.yml` | `artefacts/[feature]/plans/[story-slug]-plan.md` (tasks with complete code, TDD steps, file paths) | `story.stage="implementation-plan"`, `story.tasks[]`, `story.health`, `feature.updatedAt`, epic `status` |
| 3 | /subagent-execution | Implementation plan + DoR artefact + story artefact + architecture guardrails | Committed code on feature branch; updated plan (checkmarks) | `story.stage="subagent-execution"`, `story.tasks[].tddState` (not-started→red→green→refactor→committed), `story.testPlan.passing`, `story.health`, `feature.updatedAt` |
| 4 | /verify-completion | Test suite (fresh run) + AC verification script + git log | Evidence report (tests pass + ACs verified + scope clean) | `story.stage="verify-completion"`, `story.acVerified`, `story.acTotal`, `story.testPlan.passing`, `story.verifyStatus`, `feature.updatedAt` |
| 5 | /branch-complete | verify-completion pass (this session) | Draft PR | `story.prStatus="draft"/"merged"`, `story.prUrl`, `story.stage="branch-complete"`, `story.testPlan.passing`, `story.acVerified`, `feature.updatedAt`, epic `status` |
| 6 | /definition-of-done | Merged PR + story artefact + test plan + DoR artefact | DoD artefact with COMPLETE/COMPLETE WITH DEVIATIONS/INCOMPLETE verdict | `story.stage="definition-of-done"`, `dodStatus`, `releaseReady`, `health`, `metrics[x].signal` |

---

## 2. Entry/Exit Condition Audit

### /branch-setup
- **Entry condition:** DoR artefact at `artefacts/[feature]/dor/[story-slug]-dor.md` with `Proceed: Yes`
- **Checkable programmatically?** Yes — file existence + string search for `Proceed: Yes`
- **Exit condition:** Worktree exists at chosen path; `npm test` (or equivalent) passes with 0 failures
- **Observable?** Yes — worktree path verifiable; test output is deterministic
- **If entry not met:** Hard block with specific message; invites /definition-of-ready
- **Skip path:** None — hard gate

### /implementation-plan
- **Entry conditions:**
  1. DoR artefact with `Proceed: Yes` at canonical path
  2. Test plan at `artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
  3. Worktree exists (branch-setup must have run)
- **Checkable programmatically?** Yes — three file existence checks
- **Exit condition:** Plan file saved at `artefacts/[feature]/plans/[story-slug]-plan.md`; pipeline-state.json updated with tasks array
- **Observable?** Yes — plan file existence; pipeline-state.json `story.tasks` array non-empty
- **If entry not met:** Hard block listing the missing artefact; user must fix
- **Skip path:** None

### /subagent-execution
- **Entry conditions:**
  1. Implementation plan at `artefacts/[feature]/plans/[story-slug]-plan.md`
  2. Worktree exists with clean baseline
- **Checkable programmatically?** Yes — plan file existence; worktree path accessible
- **Exit condition:** All tasks checked off in plan; two-stage review passed for all tasks; `story.tasks[].tddState = "committed"` for all tasks
- **Observable?** Yes — plan checkmarks + pipeline-state.json tasks
- **If entry not met:** Hard block; lists missing item
- **Skip path:** If no subagents available, operator uses /tdd task-by-task instead

### /verify-completion
- **Entry conditions:** (implicit) implementation complete; test suite runnable; AC verification script exists
- **Checkable programmatically?** Partially — AC verification script file existence is checkable; "test suite runnable" requires actually running it
- **Exit condition:** All ACs ✅; all tests passing; scope check complete; pipeline-state.json written
- **Observable?** Yes — verifyStatus field + acVerified count
- **If entry not met (failing tests):** Hard stop — do not proceed to Step 2; must fix failures first
- **Skip path:** None — iron law: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"

### /branch-complete
- **Entry condition:** /verify-completion must have passed in this session
- **Checkable programmatically?** Partially — can check pipeline-state.json `story.verifyStatus = "passed"`, but "this session" is not machine-verifiable across session boundaries
- **Exit condition:** Draft PR opened (or branch merged locally); worktree cleaned up
- **Observable?** Yes — prStatus field; prUrl field
- **If entry not met:** Hard block: "Run /verify-completion first"
- **Skip path:** None for PR path; Option 3 (keep) and Option 4 (discard) are alternative exits

---

## 3. pipeline-state.json Schema Audit

Fields extracted from all five inner loop SKILL.md mandatory state update sections:

| Field | Written by | Read by | Type | Risk |
|-------|-----------|---------|------|------|
| `feature.stage` | branch-setup, definition (outer) | visualiser | string | Low |
| `feature.health` | branch-setup, verify-completion (via story propagation) | visualiser | "green" / "amber" / "red" | Low |
| `feature.updatedAt` | ALL inner loop skills (parent propagation) | visualiser staleness timer | ISO datetime | **CONFLICT RISK**: all five skills write this — race condition in concurrent worktrees |
| `story.stage` | branch-setup, implementation-plan, subagent-execution, verify-completion, branch-complete | visualiser, branch-complete entry check | string enum | Low |
| `story.health` | branch-setup, subagent-execution (amber/red if stuck), verify-completion | visualiser | "green" / "amber" / "red" | Low |
| `story.updatedAt` | ALL inner loop skills | visualiser | ISO datetime | Low |
| `story.blocker` | branch-setup (baseline fail), subagent-execution (task stuck), verify-completion (fail) | visualiser | string or null | Low |
| `story.tasks[]` | implementation-plan (creates), subagent-execution (updates tddState) | visualiser, subagent-execution step 1 | array of {id, name, tddState, file} | **GAP RISK**: implementation-plan writes tasks; subagent-execution re-reads and must not overwrite with stale array |
| `story.tasks[].tddState` | subagent-execution | visualiser | "not-started" / "red" / "green" / "refactor" / "committed" | Low |
| `story.tasks[].file` | implementation-plan (creates) + subagent-execution (re-initialises at step 1) | visualiser (clickable link) | artefact path string | **INCONSISTENCY RISK**: both skills set this; must match |
| `story.testPlan.passing` | subagent-execution (per-task update), verify-completion (final count), branch-complete (confirmed count) | CI audit comment, visualiser | integer | **CONFLICT**: three skills write this; branch-complete must use verify-completion's confirmed count |
| `story.acVerified` | verify-completion, branch-complete | DoD, visualiser | integer | Low |
| `story.acTotal` | test-plan (outer loop), verify-completion | DoD | integer | Low |
| `story.verifyStatus` | verify-completion | branch-complete entry check | "passed" / "failed" / "running" | Low |
| `story.prStatus` | branch-complete | DoD, visualiser | "draft" / "open" / "merged" | Low |
| `story.prUrl` | branch-complete | visualiser | URL string | Low |
| `story.dorStatus` | definition-of-ready (outer) | branch-setup (implicit entry check) | "signed-off" / "blocked" | Low |
| `story.dodStatus` | definition-of-done (outer post-inner) | release gate | "complete" | Low |
| `epic.status` | branch-setup, implementation-plan, subagent-execution, branch-complete (all via parent propagation rule) | visualiser | "not-started" / "in-progress" / "complete" | **CONFLICT RISK**: recomputed from all stories by any skill that runs; concurrent worktrees may compute stale totals |

**Key risks identified:**

1. **Concurrent worktree write conflict** (HIGH): `feature.updatedAt` and epic `status` are recomputed by every inner loop skill. In a fan-out scenario (multiple stories executing in parallel worktrees), each skill reads `origin/master` before writing — this is the fetch-before-write safety rule documented in all five skills. Failure to follow this rule (e.g. using the worktree file directly) causes silent overwrites of other stories' state.

2. **tasks[] stale array risk** (MEDIUM): implementation-plan writes `story.tasks[]`. subagent-execution reads the plan at Step 1 and re-initialises `tasks[]` before the dispatch loop. If the subagent-execution reads a stale pipeline-state.json (not from origin/master), it may overwrite tasks from a concurrent story.

3. **testPlan.passing three-write conflict** (LOW): Acceptable — each write increases the counter. The branch-complete write is the final authoritative count (from verify-completion) and is what CI reads. As long as all writes fetch from origin/master first, the last write wins with the correct value.

---

## 4. Artefact Path Audit

All artefact paths extracted from inner loop SKILL.md files, verified for consistency:

| Artefact | Created by | Read by | Path pattern |
|----------|-----------|---------|-------------|
| DoR artefact | /definition-of-ready | branch-setup, implementation-plan, subagent-execution, branch-complete (PR body) | `artefacts/[feature]/dor/[story-slug]-dor.md` |
| DoR contract | /definition-of-ready | (reference) | `artefacts/[feature]/dor/[story-slug]-dor-contract.md` |
| Test plan | /test-plan | implementation-plan, verify-completion | `artefacts/[feature]/test-plans/[story-slug]-test-plan.md` |
| AC verification script | /test-plan | verify-completion, branch-complete (PR body ref) | `artefacts/[feature]/verification-scripts/[story-slug]-verification.md` |
| Implementation plan | /implementation-plan | subagent-execution | `artefacts/[feature]/plans/[story-slug]-plan.md` |
| Story artefact | /definition | subagent-execution (ACs), branch-complete (PR body) | `artefacts/[feature]/stories/[story-slug].md` |
| Architecture guardrails | /bootstrap (one-time) | subagent-execution (code quality reviewer) | `.github/architecture-guardrails.md` |
| Context.yml | (operator config) | implementation-plan (Step 1.5), subagent-execution (policy overlays), verify-completion, branch-complete | `.github/context.yml` |
| PR artefact | /branch-complete → GitHub | /definition-of-done | GitHub PR URL (external) |
| DoD artefact | /definition-of-done | /release | `artefacts/[feature]/dod/[story-slug]-dod.md` |

**Path consistency check result:** All path patterns are self-consistent. The only external dependency is the GitHub PR, which is referenced by URL (not a local file path). No inconsistencies found between the path a skill writes and the path a downstream skill reads.

**Note:** subagent-execution uses `story.tasks[].file` from pipeline-state.json (set to the plan path) as a clickable link in the visualiser — this must match the actual plan path at `artefacts/[feature]/plans/[story-slug]-plan.md`.

---

## 5. Constraint Propagation Audit

### The regulated constraint chain

For a high-severity regulated constraint (e.g., RBNZ BS11 from S10, SWIFT correspondent clause from S13):

```
Discovery artefact
  └── Constraints section: "C5 — SWIFT correspondent bank agreement requires prior
      written notification before routing transactions outside agreed SWIFT channel"
         │
         ▼
Definition → Step 4a (regulated constraint propagation check)
  └── Story Architecture Constraints field: "C5: SWIFT correspondent agreement —
      this story's implementation scope activates the non-SWIFT routing channel"
  └── Story AC: "Given the non-SWIFT routing is activated, When the channel goes live,
      Then JPMorgan Chase must have received written notification [named constraint,
      approving authority, gate condition]"
         │
         ▼
Test-plan → NFR test for AC
  └── NFR test: "T_NFR_1: correspondent bank notification letter exists at
      artefacts/ttp/notifications/jpmorgan-notification.md before routing is activated"
         │
         ▼
DoR → H-NFR2 (compliance NFR with named regulatory clause has human sign-off)
  └── Architecture Constraints field populated ✅ (H9)
  └── NFR sign-off documented (H-NFR2 gate)
  └── Coding Agent Instructions block includes: "CONSTRAINT: C5 (SWIFT correspondent
      agreement) must appear as a passing NFR test before this PR is merged"
         │
         ▼
Implementation-plan → IP5 (NFR and constraint inheritance)
  └── Task X: "Implement notification tracking for C5 (correspondent bank agreement)"
      Step 3: "Create `src/payments/correspondent-notification-tracker.js`"
      Step 4: NFR test step: verify notification document path exists
      Expected output: "test: correspondent notification logged ✅"
         │
         ▼
Subagent-execution → implements Task X with two-stage review
  └── Spec reviewer: confirms C5 notification step implemented per DoR instruction
  └── Code quality reviewer: confirms implementation is traceable to the AC
         │
         ▼
Verify-completion → AC verification script
  └── Scenario for correspondent bank AC: "Confirm notification_log.json exists at
      [path] and contains JPMorgan Chase entry with date and reference number"
  └── NFR verification: NFR-1 test passes (notification documented before routing)
         │
         ▼
Branch-complete → PR body references:
  └── "ACs satisfied: ✅ AC1 (SWIFT correspondent notification confirmed)"
         │
         ▼
DoD gate → NFR check (Step 5)
  └── Checks NFR-1 evidence in PR description or test output
  └── If notification sign-off was NOT completed → D3 gap flagged → COMPLETE WITH DEVIATIONS
```

### Where constraints are most likely dropped or diluted

| Handoff point | Risk | Mechanism | Severity |
|---------------|------|-----------|----------|
| Discovery → Definition | HIGH | Step 4a requires manual per-story trigger check; if model skips 4a or applies feature-level check instead of per-story, constraint is not propagated to ACs | Critical for regulated stories |
| Definition → DoR (H-NFR2) | MEDIUM | NFR must have human sign-off documented; if sign-off is acknowledged as "warning" not hard block, it may proceed unsigned | Critical |
| DoR → Implementation-plan | HIGH | IP5 dimension (weight 0.10) — lowest weighted dimension in the rubric; a model optimising for other dimensions may compress the NFR implementation step | Critical — IP2 categorical fail if constraint is "fabricated" not skipped |
| Implementation-plan → Subagent | MEDIUM | Spec reviewer checks implementation vs spec; but if the plan task description is vague on the NFR step, reviewer may not catch the gap | Manageable with good task granularity |
| Subagent → Verify-completion | LOW | Verify-completion walks AC verification script scenario-by-scenario; if a scenario covers the NFR, it will be detected | Low if script was written correctly |
| Verify-completion → Branch-complete | LOW | Branch-complete re-runs tests and reports counts; constraint evidence in PR body is explicitly templated | Low |
| Branch-complete → DoD | MEDIUM | DoD's D3 (NFR verification) requires evidence in PR description or test output; if the NFR test was passing but evidence not in PR body, D3 may be marked gap | Medium |

**Primary failure point:** Implementation-plan is the highest risk handoff. The IP5 dimension's 0.10 weight means a model that scores 1.0 on IP1-IP4 can still pass at 0.75 even with IP5 = 0.0. This is the architectural reason EXP-038 tests IP5 specifically on HIGH difficulty cases.

**Secondary failure point:** Definition step 4a. If the C2 constraint is not in the story Architecture Constraints field, the DoR (H9) and the implementation-plan have nothing to propagate. Constraint dropped at source propagates as an omission through all downstream stages.

---

## 6. Model Routing Audit

### /subagent-execution model selection table (from SKILL.md)

| Role | Default recommendation |
|------|----------------------|
| Mechanical implementation (1–2 files, clear spec) | Fast/cheap model |
| Integration task (multi-file, pattern matching) | Standard model |
| Architecture, review, final review | Most capable available |

### Current context.yml routing configuration

```yaml
optimization:
  routing:
    default_model_class: "balanced"
    escalation_model_class: "deep-reasoning"
```

No specific model labels are set — `context.yml` uses class names only. The actual model selection is operator-controlled and not automated.

### Cross-reference with outer loop routing policy

From `workspace/proposals/routing-policy-framework.md` (cost-performance frontier section):
- **discovery** (non-regulated): Haiku pending EXP-021; Sonnet confirmed baseline
- **discovery** (regulated S-hard): Sonnet + context-regulated.yml (EXP-020 confirmed)
- **definition-of-done**: Haiku confirmed (EXP-015/016 validated)

For inner loop skills, no routing policy has been established yet. The /subagent-execution "most capable for review" recommendation suggests Sonnet for spec compliance and final review roles. Haiku may be viable for mechanical single-file tasks (IP1 category).

### Cost-quality tension points

1. **Mechanical vs integration classification**: The subagent-execution model selection is per-task, not per-skill. A story with 3 AC tasks might have 2 mechanical (Haiku) and 1 integration (Sonnet). Classification is model-made at dispatch time — this is a potential inconsistency source if the model misclassifies a task.

2. **Implementation-plan quality gates the whole cascade**: If the implementation plan is produced by a weaker model, all downstream subagents inherit a weaker spec. The cost saving on /implementation-plan is multiplied by the number of tasks dispatched. EXP-037 (Haiku for implementation-plan) is the critical frontier test for this.

3. **No routing policy for /verify-completion**: The skill requires running actual tests and walking the AC script — this is a HYBRID skill (deterministic gates + reasoning). Haiku may handle the gate checks (VG1-VG5) but the edge-case judgment (VR3) may require Sonnet. EXP-039 is designed to test this split.

---

*Saved to: workspace/proposals/inner-loop-framework-audit.md*
