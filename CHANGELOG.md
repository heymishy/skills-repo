# Changelog

All notable changes to this repository will be documented in this file.

## [Unreleased]

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
