# Changelog

All notable changes to this repository will be documented in this file.

> **Date format convention (from 2026-04-10):** Inline date references in [Unreleased] entries use `YYYY-MM-DD HH:MM` when the time is known. Version tag release headers remain `YYYY-MM-DD` (keepachangelog standard). Entries before this convention are left as-is.

## [Unreleased]

### Added

- **spc.1/spc.2/spc.4/spc.5 — performance capture instrumentation (2026-~~-~~):** Four skill performance capture stories implemented. spc.1: `contexts/personal.yml` instrumentation block corrected to canonical 4-field schema (`enabled`, `experiment_id`, `model_label`, `cost_tier`). spc.2: `.github/templates/capture-block.md` added with 6-field metadata table, structural metrics, fidelity self-report, backward references, and operator review fields. spc.4: `workspace/experiments/README.md` added documenting experiment directory structure (`[experiment-id]/[model-label]-[YYYY-MM-DD]/artefacts/`) and manifest template with three-way consistency note. spc.5: `scripts/check-capture-completeness.js` added — scans artefact .md files for `## Capture Block` sections, checks 6 required fields, exits 0 when ≥80% complete, exits 1 when below threshold, skips when `instrumentation.enabled=false`. Learning D7 recorded: `--target vscode` minimal issue body causes empty agent PRs; `issue-dispatch/SKILL.md` default changed to `--target github-agent`. Test files for all four stories added (34 assertions total, all passing).

- **Phase 3 remaining stories implementation — p3.2b, p3.5, p3.6, p3.7, p3.8, p3.10, p3.11 (2026-04-19):** All 7 outstanding Phase 3 Tier 1 stories implemented; full `npm test` green. p3.2b: `scripts/attestation-publisher.js` (SHA-256 tamper-evidence), `.github/workflows/attestation-publisher.yml` (OIDC, no PAT), `tests/check-p3.2b-attestation.js`, `docs/MODEL-RISK.md` Q8 closed. p3.5: `scripts/validate-trace.ps1` (PowerShell 5.1+ trace validation, 5 checks, `--ci` flag), `tests/check-p3.5-validate-trace.js`. p3.6: `issue-dispatch/SKILL.md` `Closes #[issueNumber]` keyword + auto-close docs; `definition-of-ready/SKILL.md` forward-pointer; `tests/check-p3.6-dispatch.js`. p3.7: `src/trace-registry/getTraces.js`, `src/trace-registry/getTraces.test.js`, `.github/workflows/trace-aggregation.yml`, `tests/check-trace-registry.js`. p3.8: `src/approval-channel/adapters/teams-adapter.js` (HMAC-SHA256), `src/approval-channel/adapters/jira-adapter.js`, `tests/check-approval-adapters.js`. p3.10: `discovery/SKILL.md` EA registry Path A/B Step 0 block; `tests/check-discovery-skill.js`. p3.11: `src/improvement-agent/calibration.js` (CRLF-normalised YAML parser, estimation underrun detection), `src/improvement-agent/calibration.test.js`, fixtures. `package.json` test chain updated with all 8 new test files.

### Changed

- **`validate-trace.sh` + `trace-validation.yml` — trace CI fixes (2026-04-18):** Fixed three trace validation failures introduced by spc artefacts. (1) `test_plan_coverage`: validator now uses `testPlan.artefact` path directly from pipeline-state.json when populated, rather than recomputing the filename from the story slug — handles short test plan filenames like `spc.1-test-plan.md`. (2) `discovery_exists`: added `reference_dirs` key to `trace-validation.yml` and supporting skip logic in `validate-trace.sh` so reference-only directories (e.g. `2026-04-18-skills-platform-phase4-revised`) are not required to have a `discovery.md`. (3) `schema_valid`: corrected `track: tooling` to `track: library` in the spc feature entry of `pipeline-state.json` to satisfy the schema enum.

- **`copilot-instructions.md` — state and artefact updates no-PR rule (2026-04-17):** Added "State and artefact updates — no standalone PR required" rule to `## Coding standards`. Changes to `workspace/state.json`, `.github/pipeline-state.json`, and files under `artefacts/` are pipeline bookkeeping, not code. Rule: bundle into implementation PR when possible; for standalone checkpoint commits use a short-lived branch + immediate merge; never open a standalone draft PR for state-only changes. Operator one-time action flagged: configure GitHub Ruleset path bypass for `workspace/**`, `artefacts/**`, `.github/pipeline-state.json` to allow direct push.

- **`/improvement` write-backs — items 7+8 applied (2026-04-16):** Completion of outstanding improvement candidates. Item 7: `docs/conflict-resolution-guide.md` created with two PR merge conflict patterns (Pattern 1 — `package.json` sequential script additions; Pattern 2 — `.github/workflows/` filename collision). Item 8: `verify-completion/SKILL.md` gains a new `## Step 0 — Fresh-session check` positioned before Step 1, with trigger conditions (resuming prior session, state.json in-progress, prior completion claim), four-point independent verification protocol, and explicit session-boundary mismatch surfacing instruction. Story p3.22 story/test-plan/DoR artefacts created (14/14 DoR hard blocks pass).

- **`/improvement` write-backs — 6 learnings applied across 4 skill files (2026-04-16):** Improvement candidates extracted from `workspace/learnings.md` materialised into SKILL.md and instruction changes, each backed by a new retrospective story artefact (p3.18–p3.21) to satisfy the artefact-first rule. Changes: (1) `definition/SKILL.md` — D2-platform mandatory availability gate added; D1-prereq cross-codebase validation block added. (2) `definition-of-done/SKILL.md` and `definition-of-ready/SKILL.md` — schema-valid guardrail enum enforcement block added; invalid status/category synonyms listed with CI failure consequence. (3) `copilot-instructions.md` — state write-path safety added (atomic-replace via temp file; partial-write prevention for `workspace/state.json`). (4) `systematic-debugging/SKILL.md` — coupled-change workflow section added (5-step protocol for fixes spanning `script → schema → state → CI` layers). All 4 story/test-plan/DoR artefact chains pass 14/14 DoR hard blocks. Test suite: 38 passed, 7 failed — 7 failures are pre-existing (`check-p3.14-concepts-docs.js`; `docs/concepts/README.md` not yet created), zero regressions introduced.

### Added

- **Retrospective artefact coverage audit (2026-04-16):** Full audit of all 28 CHANGELOG versions (0.1.0 through [Unreleased]) against Phase 1 and Phase 2 artefact chains. Direction 1: all 8 Phase 1 and 13 Phase 2 production stories confirmed COMPLETE. Direction 2: 22 versions classified PRE-PIPELINE, 9/20 post-pipeline item groups covered by a story (45% coverage score), 11 BETWEEN-STORIES items identified (2 HIGH-risk: `/estimate` and `/issue-dispatch` skills). Full audit report at `workspace/retrospective-audit-2026-04-16.md`.

- **`workspace/learnings.md`** — new entry: "Pipeline coverage gap — between-stories changes and inline-chat structural reorganisation". Documents root causes A (inline chat sessions have no pipeline awareness) and B (between-cycle skill additions). Three-tier prevention mechanism: (1) copilot-instructions.md guard (this PR), (2) retrospective-story.md template (this PR), (3) `check-artefact-coverage.js` governance check (Phase 3 scope).

- **`.github/templates/retrospective-story.md`** — new template for retroactive artefact coverage of BETWEEN-STORIES items. Produces a minimal story with DoR focusing on test coverage and trace linkage rather than re-implementing existing code. Includes AC status classification (ALREADY-MET / NEEDS-TESTS / NEEDS-IMPLEMENTATION) and traceability linkage section.

### Changed

- **`.github/copilot-instructions.md` — Coding Standards section:** Artefact-first rule added. Any new SKILL.md file, `src/` module, or governance check script committed to master must have a corresponding story artefact committed to `artefacts/` before or alongside the implementation. Exception: documentation-only changes, typo fixes, and configuration changes that make no behavioural difference. For work that has already landed without a chain, use `retrospective-story.md`. This rule closes the pipeline gap documented in "spec immutability principle broken by out-of-band feature delivery" (learnings.md, 2026-04-14).

### Changed

- **Assurance gate trace commit — post-merge architecture (2026-04-13):** The gate no longer commits trace files back to the PR feature branch. Previously, the "Commit trace file" step would push `workspace/traces/` back to the PR HEAD, creating a branch-protection HEAD-chase loop: the gate passes → commits a trace → that commit becomes the new HEAD → branch protection requires the gate to re-run on the new HEAD → indefinitely. The fix separates evaluation from recording. The gate runs on the PR branch, evaluates, posts the PR verdict comment with trace hash and commit SHA, and uploads the trace as a GitHub Actions workflow artefact (`assurance-trace`). A new post-merge workflow (`.github/workflows/trace-commit.yml`) triggers on `push` to `master`, downloads the artefact from the most recent successful gate run, and commits the trace to `workspace/traces/` on master with message `chore: assurance trace [post-merge] <sha>`. Governance properties preserved: trace is durable (committed to master — permanent canonical history), linked (traceHash in PR comment cross-references the master trace entry), and maker/checker independent (evaluation workflow and recording workflow are separate, triggered by separate events). This change also brings the workflow into compliance with the existing architecture guardrail: "do not commit `workspace/traces/` in story branches." `permissions.contents` on `assurance-gate.yml` reverted from `write` to `read`. `assurance-gate.yml` `if: always()` restored on verdict-posting step.

- **Repo structure (feat/repo-tidy):** All human-readable reference docs and diagram assets moved out of repo root into `docs/` following modern engineering conventions. Root now contains only universal files: `README.md`, `CHANGELOG.md`, `package.json`, `.gitignore`, `.github/`, plus operational directories (`artefacts/`, `workspace/`, `src/`, `tests/`, `scripts/`, `standards/`, `product/`, `contexts/`, `fleet/`). `docs/diagrams/` holds all diagram source and image assets. `trace-validation-report.json` removed from git tracking (CI output, already gitignored). New governance check `check-docs-structure.js` added (12 checks, D1–D8 existence + R1–R4 root-absence). All SKILL.md/framework references and install scripts updated. Files moved: `HANDOFF.md`, `MODEL-RISK.md`, `ONBOARDING.md`, `skill-pipeline-instructions.md`, `feature-additions.md`, `pipeline-flow.drawio`, `diagram-preview.html`, `.github/pipeline-vis-example.png`, `.github/skills-pipeline-flow.jpg`.

- `.github/skills/levelup/` — renamed to `.github/skills/improve/` (skill name, triggers, SKILL.md frontmatter, and all cross-file references updated). Rename reflects iterative lean-improvement intent without requiring familiarity with gaming terminology. All `/levelup` references in docs, config, pipeline-state, suite.json, templates, and PR checklist updated to `/improve`. Historical CHANGELOG entries below retain original field names as written records of decisions made at the time.

### Fixed

- **`.github/pipeline-state.schema.json` and `.github/pipeline-state.json` — Phase 3 schema compliance (2026-04-15):** Trace validation surfaced pre-existing schema mismatches in the Phase 3 feature shape. Fixes applied: (1) added missing `"track": "library"` to the `2026-04-14-skills-platform-phase3` feature in `.github/pipeline-state.json`; (2) relaxed epic `required` fields from `["slug", "name", "status"]` to `["slug", "name"]` because Phase 3 epics do not uniformly store `status`; (3) changed `epics[].stories[].items.type` from only `"object"` to `["object", "string"]` so Phase 3 slug-only story references (e.g. `"p3.2a"`) validate while object-form stories continue to validate against existing `properties`.

- **`scripts/validate-trace.sh` — `check_unresolved_blockers` string-slug guard (2026-04-15):** Phase 3 epics store story references as string slugs (e.g. `"p3.2a"`) in their `stories` arrays rather than full story objects. The `check_unresolved_blockers` Python snippet called `story.get('slug', 'unknown')` on each story without checking type, raising `AttributeError: 'str' object has no attribute 'get'` and failing the Trace Validation CI check on every PR touching these artefacts. Fix: add `if not isinstance(story, dict): continue` guard, matching the same pattern already used in `check_test_plan_coverage`.

- **`scripts/validate-trace.sh` — `check_test_plan_coverage` three-bug fix (2026-04-15):** (1) Phase 3 stores string slugs (e.g. `"p3.1a"`) in `epic.stories[]`, not story objects — calling `.get()` on a string raised `AttributeError`, crashing the check on every PR touching `.github/skills/**`. (2) Phase 3 story slugs are short (`p3.1a`) while filenames use the full name (`p3.1a-trace-commit-observability-test-plan.md`) — path construction was wrong even if (1) were fixed. (3) The `python3 ...; if [[ $? -eq 0 ]]` pattern is unsafe under `set -euo pipefail` — a non-zero Python exit kills the script before the `if` runs. Fix: collect story objects from `feature.stories[]` first (Phase 3+ style), falling back to epic-nested objects (Phase 1/2 style); derive the file slug from the story's `artefact` path basename; convert to `if python3 ...; then` syntax.

- `.github/workflows/assurance-gate.yml` — `permissions.contents` upgraded from `read` to `write`; "Commit trace file" step added after gate run (ran with `if: always()`) to `git add workspace/traces/`, commit with `[ci skip]` message, and push back to the PR branch ref via `HEAD:${{ github.head_ref }}`. Fixed gap where trace JSONL files were written to runner filesystem during gate execution but discarded on runner exit. This was a necessary intermediate step (required for p1.8 AC3 evaluation and p2.11/p2.12 DoR gate clearance) that has since been superseded by the post-merge architecture described in Changed above (2026-04-12; superseded 2026-04-13)

### Added

- `.github/copilot-instructions.md` — restored lean `## Coding agent start (GitHub Actions)` section (4-step orient + PR draft/stop rules). `applyTo: "**"` in `.github/instructions/` is VS Code Copilot Chat only; the GitHub Actions coding agent reads `copilot-instructions.md` exclusively, so orientation content must remain there. `agent-orientation.instructions.md` is retained for VS Code context. Pointer sentence in Platform change policy updated accordingly.

- `workspace/learnings.md` — Phase 3 D-batch seed: copilot-instructions.md base layer reduction analysis — 5 sections identified for removal/relocation (~204 lines), ideal target ~270 lines, P1.1 progressive skill disclosure alignment; grep-verified evidence (templates table: 10 matches across 4 SKILL.md files; artefact tree: in discovery/SKILL.md; coding agent orientation: 0 matches in any SKILL.md); 5 ordered Phase 3 action items with pre-conditions (2026-04-12)
- `.github/copilot-instructions.md` — token optimisation: removed 4 verbose HTML developer-note comment blocks (header, active-context, DOGFOODING, architecture-governance — none were agent instructions); compressed DOGFOODING NOTE to 1-line inline comment; removed coding-standards example block (placeholder retained); compressed SUPERSEDED tool-integrations comment to 1 line; removed `/checkpoint` "When to invoke" subsection (word-for-word repeat of the "During a session" bullet above it); fixed factual error "5 governance checks" → accurate label. 537 → 473 lines. No functional content removed (2026-04-12)
- `.github/copilot-instructions.md` — new "expand abbreviations and codes on first use" standard added to Artefact writing standards section: first-use descriptor rule (write full name in brackets — e.g. `T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit)`, `E2 (/estimate pass 2 — refined at definition)`), action-item rule (never bare code in pendingActions or DoR instructions), skill-artefact rule (first reference in any SKILL.md or skill-generated artefact must include full name), scope statement (Phase 3 onwards; legacy Phase 1/2 artefacts not retroactively updated); sourced from Phase 2 learnings entry (2026-04-12)
- `workspace/learnings.md` — Phase 2 finding: "abbreviations and codes without descriptors block human follow-through" — root cause, four examples (T3M1 / E1/E2/E3, AC3, MM1), 4-rule standard, scope statement, and action referencing copilot-instructions.md write-back (2026-04-12)
- `.github/skills/estimate/SKILL.md` — new skill: progressive estimation across E1 (at /discovery), E2 (at /definition), and E3 (at /levelup); E1 records rough focus-time forecast; E2 refines once story count and complexity are known with compact `byStory` schema; E3 derives phase boundaries from `workspace/state.json` cycle timestamps, computes deltas and flow improvement findings, and appends a row to `workspace/estimation-norms.md`; null-guard: if E1 skipped, E3 writes actuals-only baseline row with no delta table (2026-04-11)
- `.github/skills/estimate/SKILL.md` — amended (premium requests derivation improvements from Phase 1 actuals): (1) E1 prompt: adds optional gauge-at-start % recording — enables `(gaugeNow − gaugeAtStart) × quota` subtraction at E3 without CSV; `gaugeAtStart: null` added to e1 schema; E1 confirm message shows gauge reading or "not recorded — CSV fallback at E3"; (2) E3c: replaces ambiguous "before/after" with explicit 3-tier derivation order: gauge subtraction (most accurate), CSV report (lags ~1 day), gauge estimate; formula shown inline; (3) E3c: `coding_agent_premium_request` SKU (inner loop agent) noted as separate from `copilot_premium_request` (outer loop chat); optional `outer:[n] inner:[n]` split reply; `premiumRequestsSplit` field added to actuals schema (2026-04-11)
- `.github/skills/estimate/SKILL.md` — amended (premiumRequests tracking, optional Copilot Pro field): `premiumRequestsForecast` added to E1 and E2 schemas (null default, skippable); optional follow-up request-count question added to E3c after engagement fraction; `premiumRequestsActual` in actuals schema; `requests-forecast` and `requests-actual` columns added to results.tsv rows; YAML estimation-norms fields added; optional premium requests baseline in calibrated suggestions after 3+ features with request data (dispatch-timing note included); E3 completion output shows request count if non-null (2026-04-11)
- `.github/skills/estimate/SKILL.md` — amended (integrate `scripts/parse-session-timing.js` into E3 flow): E3b now runs the parser as the primary JSONL reconstruction method — outputs actual focus time with idle gaps excluded automatically at the `--max-gap` threshold (default 15 min); E3c is now confirmatory rather than estimative — shows computed engagement fraction and asks operator to confirm or adjust the idle threshold (`ok` or `--max-gap N`), replacing the four-option engagement fraction selection when parser data is available; manual four-option fallback retained for when parser is unavailable or JSONL not accessible; skill description updated to reflect computed actuals model; `workspace/learnings.md` entry added documenting tool validation against Phase 1 manual reconstruction (2026-04-12)
- `scripts/parse-session-timing.js` — new utility: zero-dependency Node.js parser for Copilot Chat JSONL transcript files; extracts per-session and aggregate focus time, model time, tool time, idle-gap exclusion; `--summary` auto-discovers all workspace transcript directories; `--detail` shows per-prompt timeline; `--max-gap N` configures idle threshold (default 15 min); validated against Phase 1 manual reconstruction (~13h match) (2026-04-12)

- `.github/skills/estimate/SKILL.md` — amended (11 improvements): (1) schema: calendar-days + engagement-fraction replace per-phase hours; outerLoopFocusH derived as totalCalendarH × fraction; never asks operator to recall hours; (2) tier-1/2/3 derivation source priority with per-phase source reporting; (3) JSONL session reconstruction — session count, lengths, operator message count; (4) single engagement-fraction multiple-choice question as the only operator input per feature; (5) explicit null-guard for skipped estimates; (6) story-count and engagement-fraction columns added to results.tsv rows; (7) Phase 1 bootstrap case with explicit already-compiled session map handling; (8) Phase 2+ startedAt/completedAt ISO datetime requirement in State update; (9) calibrated suggestions grouped by engagement fraction band reading from results.tsv; (10) trigger tightened: "how are we tracking vs estimate" replaced with "how did we go"; (11) auto-invocation note added (2026-04-11)

- `.github/skills/issue-dispatch/SKILL.md` — new skill: creates GitHub issues for DoR-signed-off stories to trigger the GitHub Copilot coding agent; `--target vscode` (minimal stub) and `--target github-agent` (rich inlined body with implementation tasks, decisions, file touchpoints, non-negotiable rules, and artefacts reference table); records `issueUrl`, `dispatchedAt`, `dispatchTarget` in pipeline-state.json (2026-04-10)
- `.github/skills/persona-routing/SKILL.md` — new skill: routes DoR sign-off notifications to configured non-engineer approval channels; Phase 2 implementation supports `github-issue` approval via `/approve-dor` comment workflow and writes `dorStatus: "signed-off"` with approver metadata to pipeline-state.json via adapter pattern (ADR-004) (2026-04-12)
- `standards/software-engineering/core.md` — added cross-platform MUST: test all check scripts on Linux-equivalent paths before committing; use `process.platform` guards for Windows-specific behaviour; never assume `bash` resolves to Git Bash on Windows — CI runs on Linux (2026-04-12)

### Changed

- `.github/templates/definition-of-done.md` — added "DoD Observations" section (cross-story runtime failures, NFR gaps, /levelup candidate tagging guidance) and "Operator Verification Prompt" section (5-question canned prompt for second-session spot-check: AC evidence, deferred ACs, metric signal, unblocked follow-ups, outcome verdict consistency). Source: Phase 1 D9 learnings item, operator-directed pre-Phase-2 promotion (2026-04-11)
- `.github/skills/issue-dispatch/SKILL.md` — amended: added governance sync non-negotiable rule (run `check-governance-sync.js` before any commit touching governance-gates.yml, check scripts, or standards entries; mutual update invariant stated explicitly) and cross-platform non-negotiable rule (all `.github/scripts/` must run on Windows and Linux; `process.platform === 'win32'` guards; never hardcode shell paths) (2026-04-12)
- `.github/workflows/copilot-setup-steps.yml` — split governance check into dedicated "Pre-implementation governance check" step that runs before "Verify baseline": emits `::error::` annotation with exact mismatch instructions when governance-gates.yml and DEFAULT_GOVERNANCE_GATES in pipeline-viz.html are out of sync; fails fast before agent writes any code (2026-04-12)
- `package.json` — minimal package with `test` script chaining the 5 governance checks (viz-syntax, governance-sync, skill-contracts, pipeline-artefact-paths, changelog-readme); zero external dependencies (2026-04-10)
- `.github/workflows/copilot-setup-steps.yml` — GitHub Copilot coding agent setup workflow; installs Node.js + Python, runs `npm test` and `validate-trace.sh --ci` as baseline verification before agent starts work (2026-04-10)
- `.github/instructions/pipeline.instructions.md` — artefact protection instruction for coding agent; `applyTo: "**"` guards `artefacts/`, `.github/skills/`, `.github/templates/` against agent modification (2026-04-10)
- `tests/check-workspace-state.js` — governance check implementing automatable unit and NFR tests from p1.5 test plan: schema validation for `workspace/state.json` and checkpoint documentation check for `.github/copilot-instructions.md` (p1.5, 2026-04-10)
- `package.json` — `tests/check-workspace-state.js` added to `npm test` chain (p1.5, 2026-04-10)

### Changed

- `copilot-instructions.md` — "Ending a session" section replaced with explicit 5-step exit sequence: (1) write learnings to `workspace/learnings.md`, (2) write checkpoint block to `workspace/state.json`, (3) git add artefact files, (4) commit with standard message format, (5) confirm commit hash and hook results. Replaces implicit 3-item prose list. Source: Phase 1 /levelup — session-end commit is load-bearing recovery point for next session; must be a named sequenced instruction, not inferred from prose (2026-04-11)
- `standards/software-engineering/core.md` — three new requirements from Phase 1 /levelup: atomic-replace pattern for mutable state files (A1); package.json conflict resolution via `git log origin/master` check (A3); list existing files before writing to shared directories e.g. `.github/workflows/` (A4) (2026-04-11)
- `standards/quality-assurance/core.md` — two new requirements from Phase 1 /levelup: consuming story must document exact schema fields required from a producing story at DoR time (A2); NFR guardrail entries must be created at branch-setup time, not deferred (B1) (2026-04-11)
- `standards/index.yml` — outcome-orientation authoring note added as YAML comment: standards requirements must state what result is enabled or prevented, not just what structure is required (B2) (2026-04-11)
- `.github/architecture-guardrails.md` — ADR-005 added: agent instructions format (copilot-instructions.md vs AGENTS.md) is a surface adapter concern driven by `vcs.type` in `context.yml`; AGENTS.md is the vendor-neutral AAIF standard; revisit trigger: Phase 2 p1.1-equivalent distribution story (C1) (2026-04-11)
- `.github/skills/discovery/SKILL.md` — added E1 estimate prompt before State update: invites operator to run `/estimate` (E1 mode) or skip after approval; skip writes `e1: null` to state.json (2026-04-11)
- `.github/skills/definition/SKILL.md` — added E2 estimate prompt after Completion output: prompts operator to run `/estimate` (E2 mode) once story count and complexity are known (2026-04-11)
- `.github/skills/improve/SKILL.md` — added Category E (Estimation actuals) to Step 2: mandatory if E1 or E2 is present; run E3 even if both null to write actuals-only baseline row (2026-04-11)
- `.github/copilot-instructions.md` — Estimation model section updated: replaced 6-line signals-only entry with E1/E2/E3 model description referencing `/estimate` skill and `workspace/estimation-norms.md` calibration table; retained complexity/scope/oversight signals as inputs (2026-04-11)
- `artefacts/2026-04-09-skills-platform-phase1/decisions.md` — ARCH entry added: phase timestamps standardised to ISO datetime with `startedAt`/`completedAt` per cycle block from Phase 2 onwards; enables automated actuals derivation in /estimate E3 tier-1 source (2026-04-11)

 with 4-step orient-structure-verify-PR pattern; placed before existing "What the coding agent should NOT do" section (2026-04-10)
- `bootstrap/SKILL.md` — redacted organisation name in example prompt ( → "Org x") to avoid embedding real client names in the template
- `copilot-instructions.md` — added dogfooding comment to `## Product context` block flagging the filled-in prose as temporary and reminding post-Phase 4 cleanup to restore the generic placeholder
- `review/SKILL.md` — added per-story incremental state write instruction to mandatory state update section; state is now written after each story's report file is created, before the next story is loaded (dogfood gap finding 2026-04-10 session 5)
- `copilot-instructions.md` — `/checkpoint` threshold updated from 75% to 55% for file-read-heavy phases (definition, review, test-plan, trace, inner loop); added explicit threshold note to "During a session" section. Source: Phase 1 dogfood signal — compaction consistently fires at ~60% in file-read-heavy phases because Tool Results bucket fills faster than Messages bucket (2026-04-10)
- `product/constraints.md` — constraint #14 updated with 55% effective threshold and dogfood rationale
- `product/decisions.md` — `/checkpoint` escape valve threshold updated to phase-aware 55%/75%
- `copilot-instructions.md` — added dedicated `/checkpoint` convention section documenting when to invoke (before reaching compaction pressure, not at it), what is written to `workspace/state.json`, and 60-second completion expectation; updated inline threshold bullet to use explicit "not at it" language (p1.5, 2026-04-10)
- `workspace/state.json` — fixed malformed JSON (trailing orphaned tokens removed); `lastUpdated` updated to ISO 8601 datetime format; `cycle.discovery.completedAt` field added per schema (p1.5, 2026-04-10)

---

## [0.7.0] — 2026-04-12

### Added

- `README.md` — rebuilt from platform actuals: mission and intent (3 paragraphs from confirmed delivery), problems-solved (5), core principles (6), primitives table (5), pipeline overview with Mermaid flowchart LR (outer loop blue, inner loop teal, gate nodes amber), skills reference table (38 skills, 4 groups), assurance and traceability section with T3M1 honest 3/8 disclosure and sample trace block, standards model with 3-tier Mermaid diagram, delivery surfaces table (6 types all ✅), fleet and multi-team operation, phase delivery status table (Phase 1 ✅ Phase 2 ✅ Phase 3 ⏳ Phase 4 ⏳), known gaps callout block (T3M1 3/8, single approval channel, E3 medium-low confidence, Windows validator missing), getting started (4 steps + enterprise details block), ADR table (ADR-001–006), contributing, footer with links to HANDOFF.md, architecture-guardrails.md, and MODEL-RISK.md. No marketing language; every claim traceable to a delivered artefact or named gap.

---

## [0.6.2] — 2026-04-11

### Added

#### `.github/scripts/viz-functions.js` — pure-function extraction from `pipeline-viz.html`

- CommonJS module exporting all testable logic as pure functions with zero DOM dependencies: `normalizeData`, `gateStatus` / `evaluateGate`, `storyNextSkill`, `featureActionMeta`, `channelLabel`, `computeFleetSummary`, `buildExportJSON`, `buildExportCSV`, and all transitive helpers (`allStories`, `hasHighFindings`, `isReleaseReady`, `featureAgeMinutes`, `formatAge`, `stageRank`, `hasReachedStage`, `loopType`, `stageLabel`, `firstStorySlug`, `firstEpicSlug`, `csvEscape`).
- New `computeFleetSummary(fleetState)` function — aggregates `repos[]` into `{ total, drifted, platformVersion, lastSyncedAt }`; graceful no-op on null/missing input.
- New `buildExportJSON(state, fleet)` and `buildExportCSV(state)` pure data builders — browser-independent equivalents of `exportPipelineJson()` / `exportStoriesCsv()` (return strings, no Blob/DOM).
- `evaluateGate` is an alias for `gateStatus` aligned to the public API name; accepts `opts.gates` and `opts.strictPolicy` parameters replacing global variable reads.
- Browser inline functions in `pipeline-viz.html` are **not removed** — `viz-functions.js` is a parallel extraction for test use; the viz remains fully self-contained (ADR-001).

#### `.github/scripts/check-viz-behaviour.js` — behavioural test suite

- 25 scenarios across 7 function groups: `normalizeData` (4), `evaluateGate` (5), `storyNextSkill` (5), `featureActionMeta` (4), `channelLabel` (2), `computeFleetSummary` (3), `buildExportJSON` / `buildExportCSV` (2).
- Zero external dependencies; follows existing `[check-name]` prefix and `✓ / ✗` pass/fail harness pattern.
- Covers: slug normalisation, gate state transitions, DoR sign-off logic, stale-processing detection, channel hint routing, fleet drift counting, and export round-trip validity.

### Changed

- `package.json` — `check-viz-behaviour.js` appended to end of `npm test` chain (14th check).
- `.git/hooks/pre-commit` — `check-viz-behaviour.js` added after `check-governance-sync.js`.

---

## [0.6.1] — 2026-04-11

### Added

#### `pipeline-viz.html` — PURPOSE comment block

- HTML comment block immediately after `<title>` documents audience (platform maintainer, solo operator, squad tech lead), explicit out-of-scope surfaces (fleet dashboard, non-engineer approval, real-time ops), fleet file source note, and ADR-001 self-contained constraint reference.

#### `pipeline-viz.html` — ⬇ Export button

- `exportPipelineJson()` — serialises `allData` + `_fleet` (when loaded) to `pipeline-export-{date}.json` via `Blob` + `URL.createObjectURL`; no server request.
- `exportStoriesCsv()` — writes story-level rows (slug, name, feature, stage, health, dor/pr/dod status, lastUpdated) to `pipeline-stories-{date}.csv`.
- ⬇ Export button appended to summary bar; silent (no-ops) when no state is loaded; triggers both downloads on click.

#### `pipeline-viz.html` — channel hint tags on next-action rows

- `channelLabel()` helper maps `ide / approval / agent / blocker` to display strings.
- `featureActionMeta()` return objects gain a `channel` field: `blocked` → `blocker`; processing stages → `agent`; `benefit-metric` / `definition-of-ready` human stages → `approval`; all other human stages → `ide`; `done` → `null` (no tag shown).
- `.channel-tag` CSS: four variants (ide/approval/agent/blocker) with colour-coded border + background matching existing palette tokens.
- Channel tag rendered inline in the next-action row after the action text.

#### `pipeline-viz.html` — decisions.md note in governance panel

- Paragraph added below "Pipeline authority skills" details block: clarifies that per-feature decisions live in `artefacts/[feature]/decisions.md` and structural decisions are promoted to Active ADRs in `architecture-guardrails.md`.

#### `artefacts/2026-04-09-skills-platform-phase1/decisions.md` — three Phase 2 pre-discovery ARCH entries

- Fleet file loading architecture: `fleet-state.json` (CI-generated aggregate) primary; `fleet-registry.json` (static registration list) fallback; both optional.
- Viz scope definition: single-repo platform maintainer tool; explicit not-a-fleet-dashboard / not-a-non-engineer-approval-surface scope documented in PURPOSE comment.
- Channel hint tag design decision: `channel` field on `featureActionMeta()` return; approval stages vs ide stages; Phase 2 routing first step rationale.

### Changed

#### `pipeline-viz.html` — `loadFleetRegistry()` fleet-state.json primary

- Replaces single `fleet-registry.json` fetch with a two-candidate fallback loop: `['fleet-state.json', 'fleet-registry.json']`; breaks on first successful response.
- Comment block updated to document `fleet-state.json` as CI-generated aggregate vs `fleet-registry.json` as static registration list.

---

## [0.6.0] — 2026-04-11

### Added

#### `/estimate` integration in pipeline-viz.html

- `ESTIMATE_INVOCATIONS` constant declares E1 / E2 / E3 trigger points (discovery exit, definition exit, levelup Category E).
- `renderLoopStructure()` gains CI platform context and phase roadmap context chips; reads `config.ci` and `config.phases` from `pipeline-state.json` when present.
- `featureActionMeta()` — `humanStageActions` for `discovery` and `definition` now surface the `/estimate` invocation note.
- `storyNextSkill()` — merged path now reads `/definition-of-done · then /levelup (runs /estimate E3)`.
- Summary bar: estimation stat chip added (reads `estimate.actuals.outerLoopFocusH` and `estimate.actuals.premiumRequestsActual`; shows `—` when absent).

#### Fleet registry stat in summary bar (7a)

- `loadFleetRegistry()` async function: fetches `fleet-registry.json` alongside `pipeline-state.json`; silently omits on HTTP error or file:// origin.
- `fleetData` state variable; `loadState()` calls `loadFleetRegistry()` in parallel with `loadSkillMetadata()`.
- Summary bar renders repo count + platform version chip only when fleet registry loaded successfully. No placeholder UI when absent.

#### ADR-005 in governance gates

- Added `{ id: 'ADR-005', … }` entry to `DEFAULT_GOVERNANCE_GATES` with `section: 'Active ADRs'`; surfaces in governance/guardrails panel alongside architecture-guardrails.md auto-fetch results.
- ADR-005 records: agent instructions format (`copilot-instructions.md` vs `AGENTS.md`) is a surface adapter concern driven by `vcs.type` in `context.yml`.

### Changed

#### `renderLoopStructure()` — CI platform and phase roadmap context

- Outer loop band header now includes: CI platform label (from `config.ci.primary`), Phase 2 target label (`config.ci.phase2`), agent instructions format tip (`config.ci.agentInstructionsFormat`, labelled ADR-005).
- Phase roadmap chips rendered from `config.phases` map; complete phases shown with ✓ + date, upcoming phases with →, others muted. All fields optional — strip omitted when `config.phases` absent.

---

## [0.5.18] — 2026-04-09

### Changed

#### Repo structure — user-facing directories moved to root

Established a consistent convention: user-facing directories (`artefacts/`, `contexts/`, `product/`) live at repo root; pipeline machinery stays under `.github/`.

**`product/` moved from `.github/product/` to repo root:**
- `product/` physically moved to root
- References updated in `copilot-instructions.md`, `feature-additions.md`, `tests/smoke-tests.md`, `config.yml`
- Skills updated: `benefit-metric/SKILL.md`, `discovery/SKILL.md`, `clarify/SKILL.md`, `definition/SKILL.md`
- Install scripts updated: `scripts/install.ps1`, `scripts/install.sh`

**`.github/contexts/` duplicate removed:**
- Canonical location is root `contexts/` — used by all install/sync scripts
- `.github/contexts/` was an identical duplicate; deleted
- Fixed stale `.github/contexts/` references in `.github/context.yml` and `skill-pipeline-instructions.md`

**`.github/artefacts/` leftover removed:**
- Root `artefacts/` is and has always been canonical (per CHANGELOG entry at 0.5.12)
- `.github/artefacts/` was a stale leftover; deleted along with its contents (moved to correct location)

**`files/` orphaned directory removed:**
- `files/constraints.md`, `files/roadmap.md`, `files/tech-stack.md`, `files/decisions.md` → moved to `product/` (replacing placeholder templates with real platform content)
- `files/ref-skills-platform-standards-model.md` → moved to `artefacts/2026-04-09-skills-platform-phase1/reference/`
- `files/` removed

---

## [0.5.17] — 2026-04-02

### Added

#### Guardrails compliance matrix

A new sub-panel in the governance view showing per-feature compliance with individual guardrails, ADRs, patterns, anti-patterns, NFRs, and compliance framework items.

**Data layer:**
- `pipeline-state.schema.json` — added `guardrails[]` array on feature objects with fields: `id`, `category` (mandatory-constraint, adr, nfr, compliance-framework, pattern, anti-pattern), `label`, `status` (met, not-met, na, excepted, not-assessed), `evidence`, `exception`, `assessedBy`, `assessedAt`
- `architecture-guardrails.md` — added `Guardrails Registry` section with a parseable `yaml guardrails-registry` fenced code block containing 24 entries (12 mandatory constraints, 4 ADRs, 5 patterns, 6 anti-patterns — matches existing guardrails document)
- `templates/architecture-guardrails.md` — added template version of the registry with example entries

**Visualiser (`pipeline-viz.html`):**
- "Guardrails" toggle button in governance controls — opens/collapses the compliance matrix
- Registry fetch: parses the `yaml guardrails-registry` block from `architecture-guardrails.md` at runtime (no build step, consistent with ADR-001)
- Dynamic items: NFR and compliance-framework guardrails from `feature.guardrails[]` and `config.governance.complianceFrameworks` appear automatically — not in the static registry
- Table: rows grouped by section, columns per feature, status badges (met ✓ / not-met ✗ / N/A · / excepted ⚠ / not-assessed ?)
- Category filter pills to narrow by guardrail type
- Summary counters (met, not-met, excepted, N/A, not-assessed)
- CSV export of the full guardrails compliance matrix

**Skills updated to write `feature.guardrails[]` state:**
- `/review` — writes guardrail entries after Category E evaluation (met/not-met based on findings)
- `/definition` — seeds `guardrails[]` with not-assessed entries from the registry at story creation time
- `/definition-of-ready` — updates guardrail entries from H9 and H-NFR/H-NFR2/H-NFR3 checks
- `/definition-of-done` — updates NFR guardrail entries from Step 5 verification outcomes
- `/trace` — updates guardrail entries from architecture compliance check; added registry-sync check that flags prose IDs missing from the YAML block as LOW findings
- `/workflow` — reconciliation seeds missing guardrails from registry and compliance frameworks
- `/discovery` — seeds compliance-framework guardrail entries from context.yml at feature creation

**Registry sync safeguards:**
- `architecture-guardrails.md` and `templates/architecture-guardrails.md` — added "IMPORTANT: Keep this registry in sync" instruction inside the Guardrails Registry comment block, reminding authors to update YAML entries when prose sections change
- Trace gate artefact path — added `artefactFallbacks` generating date-prefixed candidates (`[date]-trace.md`) for the last 14 days, matching the `trace/[date]-trace.md` naming convention

---

## [0.5.16] — 2026-04-02

### Changed

#### Rename README.md → skill-pipeline-instructions.md

README.md previously held the pipeline documentation, which caused merge conflicts when consumer repos synced from upstream (every repo has its own README.md). The pipeline docs now live in `skill-pipeline-instructions.md`, freeing README.md for each consumer repo's own project documentation.

**Updated across all sync/install/bootstrap surfaces:**
- `scripts/sync-from-upstream.ps1` — diff and checkout paths
- `scripts/sync-from-upstream.sh` — PATHS array
- `scripts/install.ps1` — step 1 core files, upstream block sync_paths, sync instructions
- `scripts/install.sh` — step 1 core files, upstream block sync_paths, sync instructions
- `.github/copilot-instructions.md` — sync command example
- `.github/scripts/check-changelog-readme.js` — advisory now checks `skill-pipeline-instructions.md`
- All 4 context.yml files (`contexts/personal.yml`, `contexts/work.yml`, `.github/contexts/personal.yml`, `.github/contexts/work.yml`) — `sync_paths` updated

---

## [0.5.15] — 2026-04-01

### Added

#### Full-pipeline governance gates

The governance matrix now covers the complete pipeline lifecycle — from discovery through release — instead of only steps 4–9.

**5 new gates:**
- **Discovery** — tracks artefact approval; passes once feature progresses past discovery stage, or when `feature.discoveryStatus === 'approved'`
- **Benefit Metric** — checks `feature.metrics` array seeded by `/benefit-metric` skill; shows metric count when defined
- **Definition** — verifies epics and stories exist; shows epic/story counts
- **Architecture** — architecture guardrails compliance (Category E of `/review`); supports direct `feature.architectureStatus` evidence or falls back to review status proxy
- **Decisions** — risk acceptances and scope decisions logged; supports `feature.decisionsLogged` evidence or DoR stage proxy

Gate order now follows the pipeline: Discovery → Benefit Metric → Definition → Review → Architecture → Test Plan → DoR → Decisions → Verify → DoD → Trace → Release (12 gates total).

### Fixed

#### Artefact link 404s in governance matrix

Artefact links are now hidden when a gate status is N/A. Previously, clicking an artefact link for a gate the feature hadn't reached yet would open the markdown viewer to a 404 error because the file doesn't exist yet.

#### `firstEpicSlug()` helper

Added `firstEpicSlug(feature)` helper for the Definition gate artefact path resolution, matching the existing `firstStorySlug()` pattern.

---

## [0.5.14] — 2026-04-01

### Improved

#### Programme concept applied consistently across all viz views

Programme membership is now surfaced in every view, not just governance:

- **Feature cards** — purple 📦 badge showing programme name in the meta row
- **Summary bar** — programme count with member feature count when programmes exist
- **Story drawer** — programme shown in context section when feature belongs to one
- **Filter bar** — new Programme filter dropdown (auto-hides when no programmes defined); includes "No programme" option
- **Action queue** — programme badge next to feature name for programme members
- **Outcomes view** — features grouped under programme headers with phase indicators; standalone features shown separately below
- **Board / Loop lanes** — programme member count in loop lane meta; feature cards show programme badge
- **Story map toolbar** — programme badge shown alongside feature slug
- **Loop structure** — programme count indicator when programmes exist
- **CSV export** — new `programme` column in governance CSV
- **normalizeData** — auto-resolves `feature.programme` backlinks from `programme.workstreams[]` on load

---

## [0.5.13] — 2026-04-01

### Improved

#### Governance scope: programme-level view

The governance scope toggle now cycles through three levels: **Feature → Epic → Programme**.

- **Programme scope** aggregates all workstream features belonging to a programme into a single governance row. Gate status is evaluated across all stories from all member features — if any workstream has HIGH review findings, the programme row shows fail.
- Programme membership is resolved via `programme.workstreams[]` (array of feature slugs on the programme entry) with fallback to `feature.programme` (backlink slug on each feature).
- When no programmes are defined in `pipeline-state.json`, programme scope falls back to feature scope gracefully.
- Row meta shows workstream count (e.g. "3 workstreams") instead of stage label.
- `/programme` skill updated to write `workstreams: [feature-slugs]` on programme creation and set `programme: "slug"` on each member feature.

---

## [0.5.12] — 2026-04-01

### Improved

#### Governance view: compact criteria, resolved artefact links, scope toggle

Three UX improvements to the governance board based on first real-repo usage:

**Gate criteria reference collapsed.** The full SKILL.md descriptions were dominating the view. Gate criteria now display as compact chips (gate name + skill badge) with the full description in a native tooltip on hover. The full card grid is still accessible via an "Expand full gate criteria descriptions" toggle below. Header shortened from "Gate Criteria Reference" to "Gate Criteria".

**Artefact links resolve to files.** Gate status "artefact" links previously pointed to folders (`../artefacts/{slug}/review/`), which opened a directory listing rather than a readable file. They now resolve to the first story's specific artefact file (e.g. `{story-slug}-review-1.md`, `{story-slug}-test-plan.md`, `{story-slug}-dor.md`). Trace and release links were already file-specific and are unchanged.

**Scope toggle: feature vs epic.** New "Scope: Feature / Epic" button in governance controls. Feature scope (default) shows one matrix row per feature — unchanged from before. Epic scope shows one row per epic, with the feature name prefixed (`Feature → Epic`). Gate status in epic scope evaluates only stories within that epic, giving finer-grained governance visibility without changing the underlying gate logic.

---

## [0.5.11] — 2026-04-01

### Fixed

#### Governance view: dynamic gates, compliance context, and skill state evidence

Three-layer overhaul making the governance/compliance view adaptive to `context.yml` and `pipeline-state.json` configuration rather than hardcoded.

**L1 — Skill state writes (4 skills updated)**

- `/verify-completion` now writes `story.verifyStatus` (`"passed"` | `"failed"` | `"running"`) to pipeline-state.json. The governance gate reads this field directly instead of inferring from stage proximity.
- `/trace` now writes `feature.traceStatus` (`"passed"` | `"has-findings"`). The governance gate reads this field.
- `/discovery` now bridges compliance context from `context.yml` into `pipeline-state.json` at feature creation: `feature.regulated`, `feature.complianceProfile`, `feature.complianceFrameworks`, `feature.sensitiveDataCategories`. Also bridges `mapping.governance.gates` → `config.governance.gates`.
- `/workflow` reconciliation step 5 added: infers `verifyStatus`, `traceStatus`, `releaseReady`, compliance fields, and `config.governance` from artefact presence and context.yml when skills haven't written them yet. Also recomputes epic `status` from story states.

**L2 — Dynamic governance gates (viz)**

- `GOVERNANCE_GATES` renamed to `DEFAULT_GOVERNANCE_GATES` (immutable baseline of 7 gates).
- New mutable `activeGovernanceGates` variable used by all rendering, CSV export, skill metadata loading, and gate status functions.
- `normalizeData()` now reads `config.governance.gates` from pipeline-state.json:
  - Entries matching a default gate id override its `label`, `skill`, `skillPath`, `criteria`.
  - Entries with new ids are appended as custom gates.
  - If no config gates are defined, defaults are preserved.

**L3 — Compliance context banner (viz)**

- New banner appears at the top of the governance board showing repo-level compliance posture:
  - Regulated flag: 🔒 Regulated (amber) or 📋 Standard (muted)
  - Compliance framework badges (e.g. "PCI-DSS", "SOX", "HIPAA") from `config.governance.complianceFrameworks`
  - Sensitive data categories callout from `config.governance.sensitiveDataCategories`
  - Custom gates count badge when non-default gates are present
- New CSS classes: `.gov-compliance-banner`, `.compliance-badge` (with `.regulated`, `.standard`, `.framework`, `.sensitive`, `.custom-gates` variants).

---

### Implementation plan — porting to a work fork

This section is a standalone reference for porting these changes into a fork that does not have access to the upstream GitHub repo. Each step can be applied independently.

#### Step 1: Skill state writes

**`/verify-completion/SKILL.md`** — In the "State update — mandatory final step" section, add these fields to the story entry write:

```
verifyStatus: "passed"   — when ALL ACs have fresh green evidence
verifyStatus: "failed"   — when ANY AC has a red/no-evidence result
verifyStatus: "running"  — when verification is in progress (partial evidence)
```

**`/trace/SKILL.md`** — In the "State update — mandatory final step" section, add this field to the feature entry write:

```
traceStatus: "passed"       — when chain is complete with no broken links
traceStatus: "has-findings" — when broken links, orphans, or scope deviations exist
```

**`/discovery/SKILL.md`** — In the "State update — mandatory final step" section, after writing the feature entry, add two blocks:

1. **Compliance context bridge**: Read `context.yml` fields `meta.regulated`, `compliance.frameworks`, `compliance.sensitive_data_categories`. Write to the feature entry as `regulated` (boolean), `complianceProfile` (`"regulated"` or `"standard"`), `complianceFrameworks` (array), `sensitiveDataCategories` (array).

2. **Config governance bridge**: Read `context.yml` field `mapping.governance.gates`. If present, write to `config.governance.gates` in pipeline-state.json (top-level config object, not per-feature). Each gate entry should have: `id`, `label` (optional), `skill` (optional), `criteria` (optional).

**`/workflow/SKILL.md`** — Add reconciliation step 5 "Reconcile governance evidence fields" after the existing reconciliation steps. This step runs on every `/workflow` invocation and infers missing fields:

- `verifyStatus`: if missing but verification artefact files exist, set to `"passed"` or `"failed"`
- `traceStatus`: if missing but trace artefact files exist, set to `"passed"` or `"has-findings"`
- `releaseReady`: if missing but DoD artefact shows complete, set to `true`
- `regulated`, `complianceProfile`, `complianceFrameworks`, `sensitiveDataCategories`: bridge from `context.yml` if missing from feature entries
- `config.governance`: bridge `mapping.governance.gates` from `context.yml` if missing from config
- Epic `status`: recompute from story states (complete/in-progress/not-started)

#### Step 2: Viz — dynamic gate set

In `pipeline-viz.html`:

1. Rename `const GOVERNANCE_GATES = [...]` to `const DEFAULT_GOVERNANCE_GATES = [...]`
2. Add `let activeGovernanceGates = [...DEFAULT_GOVERNANCE_GATES];` immediately after
3. Find-and-replace all references to `GOVERNANCE_GATES` with `activeGovernanceGates` (~10 locations across `loadSkillMetadata`, `renderGovernance`, `gateStatus`, `exportGovernanceCsv`)
4. In `normalizeData()`, before `return data`, add gate override logic:
   - Read `data.config.governance.gates` array
   - For each entry matching a default gate id: merge label/skill/skillPath/criteria
   - For entries with new ids: append to `activeGovernanceGates` with sensible defaults
   - If no custom gates: reset to `[...DEFAULT_GOVERNANCE_GATES]`

#### Step 3: Viz — compliance context banner

In `pipeline-viz.html`:

1. Add CSS classes (`.gov-compliance-banner`, `.compliance-badge` variants) in the governance styles section
2. In `renderGovernance()`, before the `board.innerHTML` template, build a `complianceBannerHTML` variable reading from `allData.config`: regulated flag, `governance.complianceFrameworks` as badges, `governance.sensitiveDataCategories` as callout, custom gate count
3. Inject `${complianceBannerHTML}` as the first child in the `board.innerHTML` template

#### Step 4: Pipeline-state.json structure

Ensure your `pipeline-state.json` supports these fields:

```json
{
  "config": {
    "regulated": true,
    "governance": {
      "gates": [
        { "id": "review", "criteria": "Custom criteria text" },
        { "id": "cab-approval", "label": "CAB Approval", "skill": "/release", "criteria": "Change Advisory Board sign-off required" }
      ],
      "complianceFrameworks": ["PCI-DSS", "SOX"],
      "sensitiveDataCategories": ["PII", "financial"]
    }
  },
  "features": [
    {
      "slug": "example",
      "regulated": true,
      "complianceProfile": "regulated",
      "complianceFrameworks": ["PCI-DSS"],
      "sensitiveDataCategories": ["PII"],
      "traceStatus": "passed",
      "epics": [
        {
          "slug": "epic-1",
          "status": "complete",
          "stories": [
            {
              "slug": "story-1",
              "verifyStatus": "passed",
              "releaseReady": true
            }
          ]
        }
      ]
    }
  ]
}
```

#### Step 5: context.yml mapping

Ensure your `context.yml` contains the compliance fields that `/discovery` and `/workflow` will bridge:

```yaml
meta:
  regulated: true          # or false for non-regulated repos

compliance:
  frameworks: [PCI-DSS]
  sensitive_data_categories: [PII, financial]

mapping:
  governance:
    gates:
      - id: cab-approval
        label: CAB Approval
        skill: /release
        criteria: Change Advisory Board sign-off required before production deploy
```

---

## [0.5.10] — 2026-04-01

### Fixed

#### Inner loop skills: parent propagation for epic status and feature staleness

All 7 inner loop skills (`/branch-setup`, `/implementation-plan`, `/subagent-execution`, `/implementation-review`, `/verify-completion`, `/branch-complete`, `/tdd`) now include a **parent propagation** rule in their state update section:

- **Feature `updatedAt`** is updated on every state write — prevents the viz staleness timer from showing "STALE PROC" when only story-level timestamps were being refreshed.
- **Epic `status`** is recomputed from story states on every state write — set to `complete` when all stories are done, `in-progress` when any story has an active inner loop stage, `not-started` otherwise. Fixes the orange dot persisting on completed epics.
- `/branch-setup` now also sets story-level `health` and `updatedAt` (previously only set story `stage`).

---

## [0.5.9] — 2026-03-31

### Fixed

#### Pipeline viz: storyNextSkill inner loop awareness + color-coded task/test status

- **storyNextSkill** now returns the correct next-action for inner loop stages (`branch-setup`, `implementation-plan`, `subagent-execution`, `implementation-review`, `verify-completion`, `branch-complete`) instead of falling through to the DoR check.
- **Task bars** turn red when any task has `tddState: "red"` (actively failing). Label shows failing count (e.g. "3/4 (1 failing)").
- **Test progress bars** in the drawer turn red when `testPlan.failing > 0`, amber when partial but no explicit failures, green when all pass.
- **Stage dots** are hidden on done stories — they only display for active and queued inner-loop stories.
- Added `.progress-fill.failed` CSS class (`var(--red)`).

---

## [0.5.8] — 2026-03-31

### Improved

#### Pipeline viz: inner loop UX — story state distinction, stage progress dots, epic summary bar, auto-expand

Five improvements to the inner loop visualisation:

**Story state distinction.** Stories in a feature card now carry a visual state class: `story-row-active` (teal border + tinted background, story name highlighted) for stories currently being executed; `story-row-done` (reduced opacity) for completed stories; `story-row-queued` (muted) for stories waiting at definition-of-ready. Active work is immediately scannable without hunting through a uniform list.

**Inner loop stage progress dots.** Each story in an inner loop stage now shows a row of 6 dots next to its stage badge, representing the six inner loop stages (branch-setup → implementation-plan → execution → impl-review → verify → branch-complete). Filled dots show completed stages; the current stage dot pulses teal. This gives spatial context at a glance — users can see both where a story is and how far it has to go.

**Epic progress summary.** The epic header now shows a summary line — "N/M done · K active" when in progress, "✓ all done" when complete — and a 3px teal progress bar below the header row. No need to expand an epic to judge its status.

**Docs section hidden in inner loop cards.** The "Docs" section in feature cards listed outer-loop artefact links (story files, test plans, DoR). In inner loop stages these are redundant — the same links are accessible from each story row via the drawer. Hiding them reduces noise and makes the task-level content the primary focus of the card.

**Active stories auto-expanded on load.** When state data is loaded, any inner loop feature with active stories automatically opens: the feature card, the containing epic, and the task list for each active story. No manual clicking required to see what's currently in flight.

---

## [0.5.7] — 2026-03-31

### Fixed

#### /implementation-plan, /subagent-execution, /tdd: task state writes enforced earlier and `file` field made consistent

Three related gaps caused the visualiser to show 0 tasks throughout story execution even when implementation was complete:

1. `/implementation-plan` Step 5 (Save and hand off) did not explicitly call out the `pipeline-state.json` write as part of that step — it was only mentioned in the "mandatory final step" section at the end, making it easy to defer. Step 5 now references the write directly and includes it in the completion output.

2. `/subagent-execution` initialised the `tasks` array only in the "mandatory final step" section, meaning it was treated as a post-execution housekeeping item rather than a pre-loop requirement. Task initialisation is now in Step 1 (before the first subagent is dispatched) and Step 2d (after each task commits) has an explicit state update instruction.

3. `/tdd` and `/subagent-execution` were missing the `file` field on each task entry. Without it the visualiser cannot render clickable task links. Both now include `"file": "artefacts/[feature-slug]/plans/[story-slug]-plan.md"` in the task schema. `/tdd` also gained a guard: if starting TDD directly without a prior /implementation-plan run, it creates the tasks array at that point.

---

## [0.5.6] — 2026-03-31

### Fixed

#### Pipeline viz: TDD task links now open in the markdown viewer instead of the browser

Task link anchors were missing the `drawer-link` CSS class. The `openMdViewer` click interceptor only fires on `a.drawer-link` elements, so task links fell through to normal browser navigation — opening the raw `.md` file in the Live Server tab. Added `drawer-link` to both the inline task list and drawer task list anchor elements so they are caught by the interceptor and open in the built-in markdown viewer like all other artefact links.

---

## [0.5.5] — 2026-03-31

### Fixed

#### sync-from-upstream: consumer scripts/ and tests/ no longer overwritten on sync

The sync script previously included `scripts/` and `tests/` in both the diff-check and `git checkout` paths. This meant a sync from upstream would silently overwrite any local customisations a consumer repo had made to their own sync scripts or test fixtures. Both paths have been removed from the sync scope — skills, templates, viz, workflows, and governance files continue to sync as before; local `scripts/` and `tests/` are left untouched.

---

## [0.5.4] — 2026-03-31

### Fixed

#### Pipeline viz: TDD task links resolve correctly when paths are repo-root relative

Task `file` paths written to `pipeline-state.json` by skills are stored as repo-root-relative (`artefacts/feature/plans/...`). The viz is served from `.github/`, so bare-relative paths resolved to `.github/artefacts/...` — a 404. A new `resolveArtPath()` helper prepends `../` to any path that isn't already absolute, protocol-relative, or `../`-anchored. Applied to task links in both the inline task list and the story drawer.

#### Pipeline viz: story drawer now shows both per-story and combined review links

The review link in the story drawer was hardcoded to `${storySlug}-review-1.md`. Projects that produce a combined `all-stories-review-1.md` instead got a 404. The drawer now renders both links so either format is reachable.

---

## [0.5.3] — 2026-03-31

### Fixed

#### Pipeline viz: inner loop now shown as upcoming before a feature enters it

In loop-grouped view, the inner loop lane was entirely hidden until at least one feature had entered a branch-setup or later stage. Users couldn't see the inner loop layout while features were waiting at DoR.

Fix: when one or more features have all stories signed off at DoR but haven't yet run `/branch-setup`, the inner loop lane renders in preview mode — dashed border, reduced opacity, "upcoming" label in the header, and meta text shows "N stages · awaiting entry" instead of "0 active". All inner loop stage columns are shown as empty placeholders so users can see the full sequence before entering it.

#### Pipeline viz: actionable warning when inner loop feature has no story data

When a feature is at an inner loop stage (branch-setup through branch-complete) but its epics contain no stories, the feature card now shows an amber warning with the exact JSON structure needed to fix the pipeline-state.json, rather than silently showing empty epic rows with "No stories". The warning prompts `/workflow` to reconcile or manual story entry.

---

## [0.5.2] — 2026-03-31

### Changed

#### /clarify is now supply-push, not demand-pull

Previously `/clarify` was only invoked when the user explicitly asked for it — it had no mechanism to be recommended proactively.

- **`/discovery` approval gate** now offers `/clarify` as the default first option before sign-off, rather than immediately asking for approval. Option 2 skips it with quality checks listed inline.
- **`/workflow`** now checks discovery artefacts for thinness signals (empty assumptions, fewer than 2 out-of-scope items, vague MVP scope words, `Draft` status) and actively routes to `/clarify` when any signal fires. "Skip with acknowledged risk" routes to `/decisions` for a RISK-ACCEPT log entry. The note saying `/clarify` is "optional" is removed.
- **`/clarify` completion** now checks whether any assumptions were added or materially changed during the session. If yes, prompts to invoke `/decisions` (category: ASSUMPTION) before proceeding to `/benefit-metric`.
- **`/decisions` invocation table** updated: new row for `/clarify` → assumption added or materially changed → ASSUMPTION.

---

## [0.5.1] — 2026-03-31

### Changed

#### /decisions baked into the DoR → inner coding loop boundary
- `/definition-of-ready` warning handler now says "I'll invoke /decisions to log it" and includes an explicit instruction to call the skill immediately rather than deferring to end of run
- Completion output now prompts to run `/decisions` if any warnings were acknowledged, with step `0` of the inner coding loop explicitly calling it as a reminder
- `copilot-instructions.md` pipeline table updated: new row `6.5 /decisions` with entry condition "DoR complete (if warnings ack'd)" and exit condition "RISK-ACCEPTs logged"
- README mermaid diagram updated: new `DOR_DEC` node between `/definition-of-ready` and `/branch-setup`; standard pipeline text updated to include the step

### Added

#### Pre-commit CHANGELOG + README guard (`check-changelog-readme.js`)
- New pre-commit check: if skill SKILL.md, template, `copilot-instructions.md`, or `scripts/` files are staged, CHANGELOG.md must also be staged (hard block)
- If those same files are staged but README.md is not, a non-blocking advisory is printed
- Wired into `.git/hooks/pre-commit` alongside the existing four checks

---

## [0.5.0] — 2026-03-30

### Added

#### Markdown formatting toolbar in pipeline visualiser
- New format bar in the viz markdown editor (Edit tab): **B**, **I**, **S**, **H2**, **H3**, **• List**, **1. List**, **[ ] Check**, `` `code` ``, ` ```block``` `, **🔗 Link**, **— Rule**
- Ctrl+B / Ctrl+I keyboard shortcuts wired to bold/italic
- **⇥ Reflow** button joins hard-wrapped paragraph lines back into single lines while leaving headings, lists, fenced code blocks, and tables untouched

#### Standards domain placeholder files
- Created `.github/standards/api/api-design.md`, `auth/auth-patterns.md`, `data/data-standards.md`, `security/security-standards.md`, `payments/payments-standards.md`, `ui/ui-standards.md` — each is a commented placeholder with examples ready to fill in; injected by `/definition-of-ready` when a story's domain tag matches

#### Install scripts: 4-question setup prompts
- Both `install.ps1` and `install.sh` now ask 4 questions during install instead of 2:
  1. Product context → written to `copilot-instructions.md`
  2. Coding standards → written to `copilot-instructions.md`
  3. Agent runtime (Copilot / Claude Code / Cursor / other) → writes `agent.instruction_file` in `context.yml`
  4. EA registry (none / default / custom URL) → writes `ea_registry_repo` + `ea_registry_authoritative` in `context.yml`
- Standards domain files (`api`, `auth`, `data`, `security`, `payments`, `ui`) are now copied to the target repo during install
- Sync scripts (`sync-from-upstream.ps1`, `sync-from-upstream.sh`) are now copied to the target repo during install — previously missing from bootstrapped repos

### Fixed

#### Artefact writing standard — no hard-wrapped prose
- Added **Artefact writing standards** section to `copilot-instructions.md`: paragraphs must be written as single unbroken lines; no mid-sentence `\n`. Fixes LLM-generated files rendering with broken line breaks in VS Code.

#### Draft viewer flow
- Draft viewer explanation clarified: drafts save to `localStorage` only; **📦 VS Code** opens the file on disk; **✨ Suggest** copies a Copilot diff prompt to clipboard

---

## [0.4.0] — 2026-03-29

### Added

#### Sync helper scripts
- New `scripts/sync-from-upstream.ps1` and `scripts/sync-from-upstream.sh` — single-command skill sync for any repo with `skills-upstream` configured. Fetches upstream, shows a diff summary of what will change, applies changes to shared paths (skills, templates, viz, scripts, workflows), and commits with a dated message. Skips `artefacts/`, `contexts/`, `context.yml`, `pipeline-state.json`, and `config.yml`. Supports `--DryRun` / `--dry-run` flag to preview without applying.

### Fixed

#### Skills review findings (11 total — `203142e`)
- **C1** `subagent-execution/SKILL.md`: fixed mojibake encoding for em dashes, arrows, ✅, and ❌ using Node.js split/join (PowerShell `Set-Content` was silently truncating the file)
- **H1** `ideate/SKILL.md`: removed 5 duplicate unquoted lens menu lines
- **H2** `branch-setup/SKILL.md`: added PowerShell `Test-Path` equivalents to Steps 2 and 4
- **H3** `branch-complete/SKILL.md`: added PowerShell here-string variant for `gh pr create`
- **H4** `bootstrap/SKILL.md`: added 9 missing templates to the creation list; updated total count 36 → 45
- **M1** `definition-of-ready/SKILL.md`: updated YAML description from `H1-H8` to `H1–H9, H-E2E, H-NFR through H-NFR3`
- **M2** `contexts/personal.yml` + `contexts/work.yml`: added `skills_upstream:` block to both context profiles
- **M3** `copilot-instructions.md`: added `## Product context files` section documenting the four `.github/product/` files and which skills read them
- **M4 + L2** `copilot-instructions.md`: added `spike-output.md` and `nfr-profile.md` rows to the template table
- **L1** `pipeline-state.json`: updated stale timestamp to `2026-03-29T00:00:00Z`

#### Pipeline visualiser (`e21cd25`, `3193c5e`, `08bb96a`)
- **Artefact link paths**: fixed 27 `\`artefacts/\`` template literals to `\`../artefacts/\`` — links were resolving to `.github/artefacts/` instead of the repo-root `artefacts/` folder
- **Undefined story labels**: story name in Docs links and story rows now falls back to `story.title` then `story.slug` when `story.name` is absent, preventing "undefined" labels when agents write `title` instead of `name`
- **Review docs — combined file support**: review stage Docs links now always include an "All stories review" link (`all-stories-review-1.md`) in addition to per-story links, supporting the pattern where `/review` saves a single combined review file

#### Install scripts (`5dc3b19`)
- Changed default `UpstreamStrategy` from `none` to `remote` in both `install.ps1` and `install.sh` — new installs now automatically wire the `skills-upstream` remote without requiring an explicit flag

#### `/definition` state update (`b502cd0`)
- `slicingStrategy` is now written to the feature in `pipeline-state.json` so the viz strategy dropdown works
- Clarified that stories must be nested inside each epic's `stories[]` array; replaced the ambiguous two-bullet instruction with an explicit JSON example showing the correct nested structure

---

## [0.3.0] — 2026-03-28

### Added

#### Bootstrap wrapper scripts
- New `scripts/bootstrap-new-repo.ps1` and `scripts/bootstrap-new-repo.sh` — thin wrappers that clone skills-repo to a temp directory, run the installer against a target repo, and clean up. Reduces setup to a single one-liner.
- `bootstrap-new-repo.sh` uses a `trap` for guaranteed cleanup on failure.

#### Upstream sync strategy (install scripts + bootstrap skill)
- `scripts/install.ps1`: new `-UpstreamStrategy none|remote|fork` and `-UpstreamUrl` parameters; post-install block adds `skills-upstream` git remote and writes a `skills_upstream:` block to `context.yml`
- `scripts/install.sh`: equivalent `--upstream-strategy` / `--upstream-url` flags and bash upstream remote setup block
- `bootstrap/SKILL.md`: new Step 3d — interactive three-option remote/upstream prompt (A: simple re-install, B: git remote, C: enterprise fork)

#### Agent awareness of upstream remote
- `copilot-instructions.md` template: new **Skills pipeline maintenance** section — agent reads `context.yml → skills_upstream:` when asked to check or sync upstream updates; includes copy-paste sync commands and guidance for when remote is null
- `contexts/personal.yml`: `skills_upstream:` block pre-populated with `heymishy/skills-repo` as default upstream; `strategy: none` until user wires the remote
- `contexts/work.yml`: `skills_upstream:` block with `repo: null` placeholder showing expected org fork URL format; `fork_of:` pre-set to `heymishy/skills-repo`

### Fixed

- `install.ps1`: replaced all non-ASCII characters (`✓`, `✗`, `→`, `—`, `━`) in string literals with ASCII equivalents (`[OK]`, `[FAIL]`, `->`, `-`, `===`) — PowerShell 5.1 reads UTF-8 files without a BOM as Windows-1252, causing `E2 9C 93` (`✓`) to decode as a right-double-quote and break all string literals from line 70 onwards
- `bootstrap-new-repo.ps1`: replaced `` `e[...m `` ANSI escape helpers (PS 7+ only) with `Write-Host -ForegroundColor` (PS 5.1 compatible)

### Changed

- README: new **Getting started** section near the top with step-by-step instructions (create repo, install, fill placeholders, choose profile, commit, run `/workflow`, pull future updates)
- Install prompt UX: both scripts now explain *why* each placeholder is needed, show an example, and note that both values can be changed later in `copilot-instructions.md`

---

## [0.2.0] — 2026-03-28

### Added — Feature additions batch (`a94faa6`, `4dec711`, `d104381`, `6f40c2f`)

#### F1 — Standards injection before DoR
- Created `.github/standards/index.yml` — maps standards files to domains (API, data, auth, payments, etc.)
- Updated `/definition-of-ready/SKILL.md` with a **Standards injection** section: reads story domain tags, queries `index.yml`, and injects matching standards files into the coding agent instructions block
- Updated `/bootstrap/SKILL.md` to scaffold the `standards/` directory and starter `index.yml` on init

#### F2 — `/levelup` retrospective extraction skill
- New skill: `.github/skills/levelup/SKILL.md` — reads the completed artefact chain post-merge and extracts reusable patterns, ADRs, and copilot-instructions updates. Entry condition: merged PR + completed `/trace` report
- Added `[ ] /levelup run post-merge` checkbox to `.github/pull_request_template.md`

#### F3 — Timestamped per-feature artefact structure
- Enforced `artefacts/YYYY-MM-DD-{feature-slug}/` naming convention across `/bootstrap`, `/discovery`, and all downstream skills
- Updated `/discovery/SKILL.md` to create the timestamped folder as its first output
- Updated `copilot-instructions.md` artefact storage section to document the convention with a worked example

#### F4 — Structured `/spike` output format
- New template: `.github/templates/spike-output.md` — structured fields: uncertainty addressed, options evaluated, recommendation, constraints confirmed, discovery fields resolved, remaining unknowns
- Updated `/spike/SKILL.md`: Step 0 reads the parent discovery artefact to identify the specific unknowns the spike is resolving; added explicit **Discovery handoff** step that maps spike findings back to open fields in `discovery.md`; spike output saved to `artefacts/[feature]/spikes/[spike-slug]-output.md`

#### F5 — Distribution mechanism (install scripts)
- New file: `config.yml` — install profile config defining default options, required placeholders, and included skill set
- New script: `scripts/install.sh` — bash installer for Linux/macOS; copies all skills, templates, standards, and product context to a target repo; conditionally copies the GitHub Actions trace-validation workflow only when the target repo's `context.yml` declares `ci: github-actions`
- New script: `scripts/install.ps1` — PowerShell equivalent for Windows; same conditional CI logic

#### F6 — Persistent product context layer
- New directory: `.github/product/` with four starter files: `mission.md`, `roadmap.md`, `tech-stack.md`, `constraints.md`
- Updated `/discovery/SKILL.md` to read `product/` files at session start for scope validation and constraint pre-population
- Updated `/benefit-metric/SKILL.md` to read `mission.md` and `roadmap.md` when evaluating Tier 1 metric candidates
- Updated `/bootstrap/SKILL.md` to scaffold the `product/` directory with annotated starters and prompt for initial population

#### F7 — Scale-adaptive complexity routing
- Updated `/workflow/SKILL.md` with a **Complexity assessment** section: classifies work as micro, standard, or complex based on change surface area, systems touched, regulatory scope, and AC requirement. Routes micro → skip to DoR; standard → full pipeline; complex → full pipeline + mandatory ADR + EA registry check + auto-trace post-merge

#### F8 — `/clarify` skill
- New skill: `.github/skills/clarify/SKILL.md` — runs between `/discovery` and `/benefit-metric`; identifies scope boundary, integration assumption, constraint gap, and user journey questions; asks max 3–5 targeted questions; updates the discovery artefact with answers; blocks progress if blocking questions remain unresolved
- Updated `/workflow/SKILL.md` to include `/clarify` as Step 1a after discovery approval (skippable on explicit override)

#### F9 — Outer-loop CI traceability enforcement
- New workflow: `.github/workflows/trace-validation.yml` — GitHub Actions CI check on PR open/update; validates artefact folder presence, story references, AC-to-test-plan coverage, benefit-metric Tier 1 presence, and DoR hard-blocks
- New script: `scripts/validate-trace.sh` — standalone bash + Python3 trace validation script; runs same 5 checks as the CI workflow; supports `--ci` flag for machine-readable JSON report output and `--check [name]` for single-check runs
- New config: `.github/trace-validation.yml` — per-check `hard_fail` toggles and PR label exemptions (e.g. `hotfix`, `chore`)
- Updated `/trace/SKILL.md` CI usage section with platform-specific integration snippets for GitHub Actions, Jenkins/CloudBees, GitLab CI, Azure Pipelines, and local/no-CI runs

#### F10 — NFRs as first-class tracked artefacts
- New template: `.github/templates/nfr-profile.md` — structured sections for Performance, Security, Data residency & privacy, Availability & resilience, Compliance, and NFR acceptance criteria
- Updated `/definition/SKILL.md` — Step 7 generates feature-level NFR profile; aggregates story-level NFRs; saves to `artefacts/[feature]/nfr-profile.md`
- Updated `/definition-of-ready/SKILL.md` — added hard blocks H-NFR (profile exists or explicitly none), H-NFR2 (compliance clauses have sign-off), H-NFR3 (data classification not blank)
- Updated `/benefit-metric/SKILL.md` — added **Tier 3: Compliance / risk reduction** metric class (regulatory adherence, audit trail completeness, security posture, data governance)
- Updated `/definition-of-done/SKILL.md` — added NFR AC confirmation step
- Updated `/trace/SKILL.md` — added NFR orphan check: flags NFRs in `nfr-profile.md` with no matching story reference, and vice versa; flags compliance NFRs without documented sign-off as HIGH findings

### Fixed — Post-implementation validation (`a94faa6`)
- **`scripts/validate-trace.sh` — JSON report generation**: replaced broken bash-array-to-Python interpolation (`${PASSES[*]:-[]}`) with env-var-passing pattern (`PASSES_STR`, `WARNINGS_STR`, `FAILURES_STR`) and a quoted heredoc (`<<'PYTHON'`), preventing shell expansion inside the Python block
- **`scripts/validate-trace.sh` — schema shape mismatch**: `check_test_plan_coverage` and `check_unresolved_blockers` both iterated `features` as a dict with `.items()`; the actual schema has `features` as an array with stories nested at `epics[].stories[]`. Both checks rewritten to match the real schema
- **`scripts/install.sh` / `scripts/install.ps1`**: the `.github/workflows/trace-validation.yml` file was never included in the install step; added conditional copy logic that only installs it when the target repo's `context.yml` declares `ci: github-actions`, with a warning for all other CI platforms pointing to the trace SKILL.md
- **Encoding issues in skill files** (`d104381`, `6f40c2f`): removed bad character encoding in multiple SKILL.md files; fixed hyphen/dash encoding artefacts (`4dec711`)
- **Artefacts directory location** (`a94faa6`): moved `artefacts/` out of `.github/` to repo root to align with convention; updated all skill references accordingly

---

### Added
- **Pipeline visualizer — in-viz markdown editor, Phase 1–4** (`pipeline-viz.html`): full read/edit/diff workflow for pipeline artefacts directly inside the visualizer, across four shipped phases:
  - **Phase 1** (`7e1d336`): Preview / Markdown tabs, `localStorage` draft save + reset, status chip, and a keyboard guard in the raw editor.
  - **Phase 2** (`a94af45`): Template-aware validation panel (story AC format, benefit-metric placeholders, test-plan AC coverage, DoR checklist progress) and a story AC form editor with add/delete AC rows.
  - **Phase 3** (`8f3049d`): Inline diff view (LCS, capped 250 k cells), unified-patch copy, and conflict detection (FNV-1a hash of original text on save; warns on reopen if the file on disk has diverged).
  - **Phase 4** (`010ef67`): "📦 VS Code" button (constructs `vscode://file/…` URI), "✨ Suggest" button (copies a ready-to-paste Copilot chat prompt containing the full diff), Drafts panel (scans `localStorage` for all saved drafts, lists artefact type + Open/Discard per entry with a live count badge), and viewer keyboard shortcuts (`d` = diff tab, `s` = save draft, `Esc` closes draft list before closing viewer).
- **Stage artefact links on active feature cards** (`1b366ec`): each open feature card now shows a `Docs` row listing clickable links to the current stage's artefact `.md` files (story, test-plan, DoR, epic, benefit-metric, etc.). Clicking opens the md viewer directly.
- **Test artefacts seeded** (`010ef67`): `ws-portal-modernisation` story, test-plan, and DoR artefacts added for browser testing.
- **README — simple pipeline flow diagram**: a linear `flowchart LR` covering the standard feature journey from idea to release, positioned before the full diagram.
- **Pipeline visualizer — Governance view** (`pipeline-viz.html`): new `🛡 Governance` tab (keyboard shortcut `v`) showing a 7-gate compliance matrix across all features. Gates reference their governing skill (`/review`, `/test-plan`, `/definition-of-ready`, `/verify-completion`, `/definition-of-done`, `/trace`, `/release`).
  - Gate-click filtering: click any failing-gate pill to filter the matrix to affected features only.
  - CSV export of the full governance matrix (`governance-matrix.csv`).
  - Strict policy mode: when enabled, `warn` statuses on regulated features are escalated to `fail`.
  - `complianceProfile: "regulated"` feature field drives strict policy targeting.
  - Added in `52c4b06`.
- **Live skill criteria loading** (`pipeline-viz.html`): governance view Gate Criteria Reference panel now fetches and parses YAML frontmatter `description:` from each gate's `SKILL.md` file at load time.
  - Covers all 7 gate skills plus `/workflow` and `/org-mapping` (pipeline authority skills, shown in collapsible section).
  - Per-card `live` (green) / `default` (grey) badge shows whether criteria came from the live file or the hardcoded fallback.
  - Summary badge shows how many of 7 skills loaded live.
  - Automatic: editing any SKILL.md description is reflected in the governance view on next page reload — no manual sync needed.
  - Silently falls back to hardcoded one-liner criteria when served over `file://` or if a file is unavailable.
  - Added in `52c4b06`.
- **Pipeline visualizer — Action state system** (`pipeline-viz.html`): action-state chips on every feature card (`human` / `processing` / `blocked` / `done`), stale processing detection (2-hour threshold), and an Action Queue panel pinned above the board (oldest-first, click-to-focus).
- **Pipeline visualizer — Guarded stage transitions** (`pipeline-viz.html`): `Move to X` buttons with per-gate guardrail blocking messages.
- **Sample data** (`pipeline-state.sample.json`): added `complianceProfile: "regulated"` to two existing features; added `payments-kms-key-rotation` regulated feature with a blocked DoR story to demonstrate strict policy escalation.

### Changed
- Renamed `Health` filter label to `Risk` in the visualizer header (with tooltip clarifying semantic difference from `Action` filter).
- `GOVERNANCE_GATES` constant now includes a `skillPath` field per gate pointing to the corresponding `SKILL.md` relative path.
- Added `META_SKILL_REFS` constant for pipeline-authority skills (`/workflow`, `/org-mapping`) that inform gate context but are not gate-checked themselves.

### Fixed
- Fixed invalid JSON prefix (`1. option{`) in `pipeline-state.sample.json` that prevented the visualizer from loading.
- Fixed stray closing brace in `pipeline-viz.html` (~line 1080) that caused `Uncaught SyntaxError: Unexpected token '}'` and broke the board render entirely.

### Removed
- **"Move to [stage]" button** (`f8b98a9`): removed from all feature cards. The button only mutated in-memory stage state; real stage transitions are driven by the skills, which write `pipeline-state.json` with proper guardrails and artefact creation. A UI shortcut that bypasses that is misleading. `canAdvanceFeature()`, the `advance-feature` event handler, and the `.next-action-btn` CSS are all gone.

---

### Added (governance first-principles — `7613069`, `ed25c15`)
- **`.github/context.yml`** — active pipeline config created from the personal profile. Activates all downstream skill config: tool integrations, compliance prompts, org-label gate mapping, token policy, and EA registry paths. Previously absent, causing all context-reading skills (`/review`, `/definition-of-ready`, `/release`, `/org-mapping`) to silently no-op.
- **`.github/architecture-guardrails.md`** — live guardrails file created with four repo-level ADRs: ADR-001 (single-file viz, no build step), ADR-002 (gates must use evidence fields, not stage-proxy), ADR-003 (schema-first: fields defined before use), ADR-004 (`context.yml` is the single config source of truth). Previously absent, silently disabling `/review` Category E, DoR hard block H9, and `/trace` architecture compliance walk.
- **`.github/governance-gates.yml`** — canonical gate definition file. Single source of truth for all 7 governance gates: IDs, labels, skill paths, pass criteria, artefact templates, and evidence field specs. Both `GOVERNANCE_GATES` in the viz and individual skill files are derived from this.
- **`.github/scripts/check-governance-sync.js`** — pre-commit validator that diffs gate IDs and order between `governance-gates.yml` and `GOVERNANCE_GATES` in `pipeline-viz.html`. Blocks commit if they diverge.
- **`pipeline-state.schema.json` — missing fields added**: feature-level `complianceProfile` (enum: standard/regulated), `regulated` (boolean), `coverageMapPath`, `coverageRisk`, `traceStatus`; story-level `verifyStatus`, `layoutGapsAtMerge`, `layoutGapsRiskAccepted`, `tasks[]` with `tddState` (not-started/committed/green/refactor/done); top-level `config` block (`config.regulated`, `config.strictPolicyDefault`).
- **README — pipeline flow image** (`8c790e6`): replaced linear mermaid diagram with `skills-pipeline-flow.jpg` (two-loop layout showing outer loop wrapping inner coding loop).
- **README — viz screenshot** (`8c790e6`): replaced placeholder `docs/pipeline-viz.png` with live `pipeline-vis-example.png`.

### Changed (governance first-principles)
- **`governanceStrictPolicy` now persists in `localStorage`**: survives page reload. Toggle state is remembered per browser.
- **`config.regulated` bridge**: `normalizeData()` now reads `allData.config.regulated` to set strict-policy default on first load (when no user preference is stored). Wiring path: `context.yml: meta.regulated` → skill writes `config.regulated` → viz reads on load.
- **Four stage-proxy gates replaced with evidence-field checks** (satisfies ADR-002):
  - `verify-completion` → reads `story.verifyStatus` (not-started/running/passed); stage fallback retained with `// TODO` comment.
  - `definition-of-done` → reads `story.dodStatus` only; removed `hasReachedStage` proxy.
  - `trace` → reads `feature.traceStatus` (not-run/passed/has-findings); now shows **fail** when findings exist.
  - `release` → requires `feature.stage === 'released'` AND `stories.every(s => s.releaseReady)`; warns if stage-only (no evidence).
- **DoR checklist template synced to SKILL.md**: Hard Blocks table now exactly matches H1–H9 + H-E2E; Warnings table matches W1–W5. Removed three rows that had diverged from the skill (upstream dependency check, discovery approved, benefit-metric active); added H6 (complexity rated), H9 (architecture constraints), H-E2E, W3 (MEDIUM findings acknowledged), W4 (verification script reviewed).
- **Pre-commit hook extended**: `.git/hooks/pre-commit` now runs `check-governance-sync.js` after `check-viz-syntax.js`.

---

---

- Added context-driven EA registry source-of-truth fields in profiles:
  - `architecture.ea_registry_repo`
  - `architecture.ea_registry_local_path`
  - `architecture.ea_registry_authoritative`
  - Added in `6c4e250`.
- Added four pipeline evolution skills:
  - `/loop-design`
  - `/token-optimization`
  - `/org-mapping`
  - `/scale-pipeline`
  - Added in `c9396f2`.
- Added four new templates:
  - `.github/templates/loop-design.md`
  - `.github/templates/token-optimization.md`
  - `.github/templates/org-mapping.md`
  - `.github/templates/scale-pipeline.md`
  - Added in `c9396f2`.

### Changed
- Refactored pipeline behavior to a hybrid model:
  - Keep strategic skills discrete (`/loop-design`, `/scale-pipeline`).
  - Embed token optimization and org-mapping policy overlays into core execution/review/release skills.
  - Implemented in `514e8ab`.
- Made release generation context-driven using `.github/context.yml` tool and governance fields.
  - Implemented in `d92b4cb`.
- Added explicit active-context mechanism and profile strategy (`.github/context.yml` + `contexts/*`).
  - Implemented in `7cccf81`, `a817c38`.

### Fixed
- Removed hardcoded toolchain and environment assumptions across skills for portability.
  - Implemented across `3d7e508`, `7cccf81`, `a817c38`.
- Updated docs for context-based configuration and live `testPlan.passing` visualizer progress behavior.
  - Implemented in `7bdb8b0`.

---

## [0.1.0] - 2026-03-20

### Initial tracked release notes baseline
- Bootstrapped and hardened the SDLC skill pipeline with structured artefacts, templates, and workflow/state conventions.
- Added enterprise architecture registry integration and context-driven portability model.
- Added pipeline evolution capability (loops, token optimization, org mapping, scale) and moved to hybrid embedded policy behavior in core skills.
