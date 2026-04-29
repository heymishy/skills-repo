# Enterprise Handoff: Skills Platform Phase 1 + Phase 2 + Phase 3 + Phase 4

**Document type:** Enterprise handoff bundle
**Prepared:** 2026-04-12
**Updated:** 2026-04-29 — `/reverse-engineer` SKILL.md evolution v2: Q0 outcome gate, stack-specific reading plans (Spring/Struts 2/ACE-IIB/COBOL/large-test-suites), multi-pass corpus management with corpus-state.md protocol, sub-agent coordination model, ESB dependency detection + reading plan sub-output, corpus convergence criterion (6 conditions, 2:1 VERIFIED:UNCERTAIN), Outputs +7 (ESB reading plan) +8 (corpus-state.md), outcome-aware artefact emphasis section, updated completion statement. CHANGELOG.md and HANDOFF.md updated.
**Updated:** 2026-04-23 — validate-trace.sh improvements: track-aware `check_discovery_exists` (auto-exempts `short`/`defect`/`library`/`spike` tracks from discovery gate); `check_schema_valid` now surfaces all violations inline via `Draft7Validator.iter_errors()`. No artefact chain — committed directly as a governance fix (improvement to existing script, not a new governed artefact type). See Section 8 pending items.
**Updated:** 2026-04-22 (2) — Cross-dashboard UX consistency delivered: site-nav on all 4 pages, canvas filter persistence + overflow dropdown, MdEditorOverlay Save button (server-gated) on all pages, graceful offline fallback. Review.html latent bugs fixed. Story artefacts updated: cv.1 (AC12–14), dr.1 (AC12), me.1 (AC11–12). Test suites extended: check-me1 18/18, check-cv1 20/20, check-dr1 14/14. See Section 8 pending items.
**Updated:** 2026-04-22 — me.1 dashboard markdown editor delivered; MdViewer full-screen responsive layout; acc.1 and sr.1 short-tracks completed. See Section 8 pending items.
**Updated:** 2026-04-21 (2) — Phase 5/6 roadmap published; product/ docs updated with Phase 4 actual delivery scope, enforcement architecture, competitive positioning, and G19 intentional gap note. See Section 8.
**Updated:** 2026-04-21 (1) — Phase 4 fully DoD-complete — all 27 stories including E5 Platform Observability & Measurement. PRs #176 and #177 merged and traced. See Sections 6.8–6.15 and Phase 4 story tables.
**Prepared by:** Platform maintainer (Hamish)
**Status:** Phases 1–4 DoD-complete. Phase 5 (WS0–WS7) and Phase 6 (WS8–WS11) roadmapped. src.1 implementation draft PR #182 pending CI pass + merge. src.1 SKILL.md-only additions pending draft PR #178.

---

## 8. Phase 5/6 Roadmap Context — 2026-04-21

### Phase 5 workstreams (roadmapped)

Phase 4 narrowed scope: three originally-scoped items (operational domain standards, agent identity layer, policy lifecycle management) were deferred. They are now formally placed in Phase 5/6. The full workstream detail — dependency sequencing, gap audit (19 gaps), competitive positioning, and MVP tracks A/B/C — is in [`artefacts/phase5-6-roadmap.md`](../artefacts/phase5-6-roadmap.md).

| WS | Title | Entry condition |
|----|-------|----------------|
| WS0 | Phase 4 completion (distribution, non-technical channel) | Phase 4 DoD-complete ✅ — ready |
| WS1 | Harness infrastructure (hook events, capability manifest) | WS0 distribution complete |
| WS2 | Subagent isolation (oversight enforcement, capability manifest) | WS1 hooks live |
| WS3 | Context governance (context budget, session compression) | WS1 hooks live |
| WS4 | Spec integrity (verbatim instruction record) | WS0 complete, data governance model resolved |
| WS5 | Platform intelligence (signal-driven improvement cycle) | WS1 hooks, improvement agent Phase 2 |
| WS6 | Human capability (adoption, assessment, playbooks) | WS0 non-technical channel, T3M1 full trail |
| WS7 | Operational domain standards (cloud, GenAI, infra floors) | WS0 distribution, Phase 4 standards model |

### Phase 6 workstreams (roadmapped — entry conditions from Phase 5)

| WS | Title | Entry condition |
|----|-------|----------------|
| WS8 | Policy lifecycle management | Phase 5 WS1 hooks, WS5 intelligence signal |
| WS9 | Agent identity layer + G19 verbatim instruction record | Phase 5 WS4 spec integrity, WS2 subagent isolation |
| WS10 | Second model review capability | Phase 5 WS5 intelligence |
| WS11 | Enterprise federation + OST visualisation | Phase 5 WS6 adoption programme |

### Product/ docs updated 2026-04-21

Four product-context files were updated to reflect Phase 4 delivery actuals and the Phase 5/6 roadmap:

- [`product/roadmap.md`](../product/roadmap.md) — Phase 4 section replaced with accurate delivery scope + explicit scope-narrowing note. Phase 5 (WS0–WS7) and Phase 6 (WS8–WS11) sections added with workstream summaries and entry conditions.
- [`product/tech-stack.md`](../product/tech-stack.md) — Phase 4 enforcement architecture section added: shared governance package 3-operation contract (ADR-013), enforcement spoke adapter table (p4-enf-mcp vs p4-enf-cli), formal pipeline-state.json fields, Phase 5 vocabulary forward-reference table.
- [`product/mission.md`](../product/mission.md) — Collaboration surface extended with product/BA and UX discipline entry points and Phase 5 WS0 non-technical channel note. Layer 1/2/3 competitive positioning added to "What the platform is not".
- [`product/constraints.md`](../product/constraints.md) — Constraint 5 extended with G19 intentional gap note: verbatim per-invocation instruction assembly record is an explicit scope boundary deferred to Phase 6 WS9.

### Delivered since 2026-04-21

- **Cross-dashboard UX consistency (2026-04-22):** `<nav className="site-nav">` added to all four dashboard pages (CSS in `extra-views.css`; inline in `review.html`). Canvas filter state persisted to `localStorage` key `cv-filter`; chips switch to search-input + select dropdown when `features.length > 8`. `MdEditorOverlay` Save button on all four pages, conditional on `serverUp` (10-second poll). `callSave(filePath, content)` and `REVIEW_SERVER` constant added to all four pages. Graceful fallback: Save absent when `review-server.js` offline. Latent `review.html` bugs fixed (`callSave` undefined, `MdEditorOverlay` broken params, missing `saveLabel` state). `extra-views.css` linked from `canvas.html` and `pipeline.html`. Tests: check-me1 18/18, check-cv1 20/20, check-dr1 14/14. Story artefacts updated: cv.1 (AC12–14), dr.1 (AC12), me.1 (AC11–12). Test plans updated: cv.1 (T16–T20), dr.1 (T14), me.1 (T11–T18).

- **me.1 — Dashboard markdown editor (2026-04-22):** `MdEditorOverlay` component (split-pane editor with live preview, Copy, Download, Escape-to-close) wired into `ArtefactDrawer` in `pipeline.html` and `MdViewer` in `index.html`. `MdViewer` simultaneously made full-screen and responsive (`inset:0` fade-in, `clamp` padding, centred prose, `@media ≤640px` breakpoint). 14 governance checks pass (`tests/check-me1-dashboard-editor.js`). Artefact chain at `artefacts/2026-04-22-dashboard-md-editor/`.
- **acc.1 — Artefact-first governance gate (2026-04-21):** `tests/check-artefact-coverage.js` live in CI. `artefact-coverage-exemptions.json` with 25 baseline exemptions. 8/8 self-tests pass.
- **sr.1 — Status report section headers extracted to template (2026-04-21):** `.github/templates/status-report.md` created. `scripts/generate-status-report.js` reads headers from template with graceful fallback. 5/5 self-tests pass.

### Delivered since 2026-04-22

- **validate-trace.sh — track-aware discovery check + schema violation diagnostics (2026-04-23):** `check_discovery_exists` rewritten as a Python subprocess reading `track` from `pipeline-state.json`; features with `track: short`, `defect`, `library`, or `spike` are auto-exempted from the `discovery_exists` gate — no manual `reference_dirs` maintenance needed for pipeline-tracked features. Failure messages include track name and registration status. `check_schema_valid` upgraded from `jsonschema.validate()` (first-error-only, silenced) to `Draft7Validator.iter_errors()` — prints all violations with field path + message inline in CI log. `.github/trace-validation.yml` gains `tracks_without_discovery` config list; `2026-04-21-skill-routing-cli-tools` removed from `reference_dirs`. **No dedicated artefact chain** — committed directly to master as a governance fix to an existing script (same precedent as 2026-04-20 slug/id fix).

### Pending items as of 2026-04-23

- **src.1 — skill-routing-cli-integration implementation** — Draft PR #182 (`feature/src.1-skill-routing-cli-integration`) rebased onto master 2026-04-23; schema violations that caused CI failure resolved. Awaiting CI pass (trace validation, schema check) and merge. Two pre-existing assurance-gate failures (`workflow-yaml-uses-pinned-immutable-ref`, `download-uses-https-not-http`) are unrelated to this story and will continue to fail until resolved separately.

- **src.1 SKILL.md additions** — `workflow/SKILL.md` (generate-status-report.js callout at session start) and `improve/SKILL.md` (record-benefit-comparison.js Benefit Measurement callout). Draft PR #178 open — awaiting review and merge. Platform change policy prohibits direct commit to master for SKILL.md files.

### Delivered since 2026-04-29

- **p11 feature complete -- all 7 stories DoD-complete (2026-04-29):** p11.1 (welcome message), p11.2 (Q1 entry question), p11.4 (context.yml reading), p11.6 (workflow trigger), and p11.7 (pipeline state lookup from `/start`) all DoD-complete. Epic `p11-onboarding-lockfile` marked complete. PR #221 merged 2026-04-29 (`.github/skills/start/SKILL.md` + `.github/scripts/check-skill-contracts.js`). 12/12 governance tests pass. MM3 evidence note added to pipeline-state.

- **`/reverse-engineer` SKILL.md evolution v2 (2026-04-29):** Q0 outcome gate (Enhancement reference / Modernisation / Both) added as hard entry condition. Stack-specific reading plans added for Spring/Spring Boot Java, Struts 2, IBM ACE/IIB (ESB dependency detection + reading plan sub-output), COBOL, and large test suites. Multi-pass corpus management protocol: four pass types (INITIAL/EXTEND/DEEPEN/VERIFY), `corpus-state.md` written at every pass end. Sub-agent coordination model added. Corpus convergence criterion (6 conditions including 2:1 [VERIFIED]:[UNCERTAIN] gate on PARITY REQUIRED rules). Outcome-aware artefact emphasis section (SaaS fit scoped to B/C; `[CHANGE-RISK]` flags for Both). Outputs +7 (ESB reading plan) +8 (`corpus-state.md`). Completion statement extended with pass type, corpus state, and outcome-conditional routing. Committed directly to master as a governed skill evolution (platform maintainer action; `check-skill-contracts.js` contract unchanged).

### Pending items as of 2026-04-29

- **src.1 — skill-routing-cli-integration implementation** — Draft PR #182 (`feature/src.1-skill-routing-cli-integration`) rebased onto master 2026-04-23; schema violations that caused CI failure resolved. Awaiting CI pass (trace validation, schema check) and merge. Two pre-existing assurance-gate failures (`workflow-yaml-uses-pinned-immutable-ref`, `download-uses-https-not-http`) are unrelated to this story and will continue to fail until resolved separately.

- **src.1 SKILL.md additions** — `workflow/SKILL.md` (generate-status-report.js callout at session start) and `improve/SKILL.md` (record-benefit-comparison.js Benefit Measurement callout). Draft PR #178 open — awaiting review and merge. Platform change policy prohibits direct commit to master for SKILL.md files.

---

## 1. What Was Delivered

### Phase 1 — Foundation (2026-04-09 → 2026-04-11)

8 stories delivered across 4 epics. All PRs merged (#1–#14 range). DoD-complete.

| Story | Title | Status |
|-------|-------|--------|
| p1.1 | Distribution infrastructure and progressive skill disclosure | DoD-complete |
| p1.2 | Surface adapter model — foundations (git-native, Path B) | DoD-complete |
| p1.3 | Assurance agent as automated CI gate | DoD-complete |
| p1.4 | Watermark gate | DoD-complete |
| p1.5 | `workspace/state.json` and session continuity | DoD-complete |
| p1.6 | Living eval regression suite (`workspace/suite.json`) | DoD-complete |
| p1.7 | Standards model — Phase 1 disciplines (software-eng, security-eng, QA) | DoD-complete |
| p1.8 | Model risk documentation (`MODEL-RISK.md`) | DoD-complete |

**Phase 1 outcome:** A governed, self-verifiable delivery pipeline operating at single-squad, git-native surface scope. Distribution via pull model. CI assurance gate live. Three anchor discipline standards in place. Model risk register signed and pre-read gating adoption.

### Phase 2 — Scale, Observability, and Self-Improving Harness (2026-04-11 → 2026-04-12)

13 stories delivered across 5 epics. All PRs merged (#28–#31, #38, #41–#48). DoD-complete.

| Story | Title | Epic | Status |
|-------|-------|------|--------|
| p2.1 | `/definition` skill improvements (D1/D2/D3) | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.2 | `/review` incremental state write | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.3 | DoR/DoD template improvements | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.4 | `AGENTS.md` adapter (non-GitHub inner loop support) | E2 — Full Surface Adapter Model | DoD-complete |
| p2.5a | IaC + SaaS-API surface adapters | E2 — Full Surface Adapter Model | DoD-complete |
| p2.5b | SaaS-GUI + M365-admin + manual surface adapters | E2 — Full Surface Adapter Model | DoD-complete |
| p2.6 | EA registry resolver (Path A, 3-field stub contract) | E2 — Full Surface Adapter Model | DoD-complete |
| p2.7 | Fleet registry CI aggregation | E3 — Fleet Observability and Personas | DoD-complete |
| p2.8 | Non-engineer approval interface (approval-channel adapter) | E3 — Fleet Observability and Personas | DoD-complete |
| p2.9 | 8 remaining discipline standards (POLICY.md floors) | E4 — Standards and CI Validation | DoD-complete |
| p2.10 | Bitbucket Pipelines CI topology validation | E4 — Standards and CI Validation | DoD-complete |
| p2.11 | Improvement agent — failure pattern detection and diff proposal | E5 — Self-Improving Harness | DoD-complete |
| p2.12 | Improvement agent — challenger pre-check and proposal review | E5 — Self-Improving Harness | DoD-complete |

**Phase 2 outcome:** Full surface adapter model (all 6 types). Non-engineer approval channel. Fleet observability. Bitbucket Pipelines topology validated. All 11 discipline POLICY.md floors live. Self-improving harness (improvement agent) operational. Non-GitHub inner loop (`AGENTS.md`) supported.

### Phase 3 — Governance Hardening and T3M1 Completion (2026-04-14 → current, in progress)

Phase 3 launched 2026-04-14. Primary objectives: close the five T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) gaps (Q2–Q8) identified in Phase 2, harden the assurance gate from structural file-existence checks to content-level governance substance, fix CI observability gaps, and validate the platform for enterprise-scale adoption. 28 stories defined; implementation stories complete as of 2026-04-19.

| Story | Title | Epic | Status |
|-------|-------|------|--------|
| p3.1a | Trace-commit observability | E1 — Test and Governance Hardening | DoD-complete |
| p3.1b | Assurance gate substantive checks | E1 — Test and Governance Hardening | DoD-complete |
| p3.1c | Test suite integrity | E1 — Test and Governance Hardening | DoD-complete |
| p3.1d | Bitbucket DC auth tests resolved | E1 — Test and Governance Hardening | DoD-complete |
| p3.1e | Agent behaviour observability register | E1 — Test and Governance Hardening | DoD-complete |
| p3.2a | T3M1 trace fields (Q2/Q5/Q6/Q7 schema + gate) | E2 — T3M1 Audit Gap Closure | DoD-complete |
| p3.2b | T3M1 tamper-evidence registry (Q8) | E2 — T3M1 Audit Gap Closure | DoD-complete |
| p3.3 | Gate structural independence (skills-framework-infra) | E3 — Enterprise Structural Controls | Outer loop defined — story dispatched, PR merged empty (D8) |
| p3.4 | Platform eval suite migration | E3 — Enterprise Structural Controls | Outer loop defined |
| p3.5 | PowerShell trace validation (`validate-trace.ps1`) | E4 — Cross-Platform and Windows | DoD-complete |
| p3.6 | Issue dispatch `Closes #[issueNumber]` auto-close | E5 — Pipeline Loop Closure | DoD-complete |
| p3.7 | Trace registry CI aggregation | E5 — Pipeline Loop Closure | DoD-complete |
| p3.8 | Approval-channel adapters (Teams + Jira) | E3 — Enterprise Structural Controls | DoD-complete |
| p3.9 | AGENTS.md compatibility matrix | E1 — Test and Governance Hardening | DoD-complete |
| p3.10 | EA registry Path A/B in `/discovery` | E3 — Enterprise Structural Controls | DoD-complete |
| p3.11 | Improvement agent calibration | E5 — Pipeline Loop Closure | DoD-complete |
| p3.12 | Cross-team trace federation | E3 — Enterprise Structural Controls | Outer loop defined — no DoR yet |
| p3.13 | Windows CI validator | E4 — Cross-Platform and Windows | Outer loop defined — story dispatched, PR merged empty (D8) |
| p3.14 | Concepts documentation | E1 — Test and Governance Hardening | Outer loop defined — tests failing (pre-existing) |
| p3.15 | `/estimate` skill — retrospective coverage | E1 — Test and Governance Hardening | DoR-signed-off |
| p3.16 | `/issue-dispatch` skill — retrospective coverage | E1 — Test and Governance Hardening | DoR-signed-off |
| p3.17 | Repo-tidy docs-structure — retrospective coverage | E1 — Test and Governance Hardening | DoR-signed-off |
| p3.18 | `/definition` skill quality gates (D2-platform gate, D1-prereq cross-codebase) | E1 — Test and Governance Hardening | DoD-complete |
| p3.19 | Guardrail enum enforcement in DoR/DoD | E1 — Test and Governance Hardening | DoD-complete |
| p3.20 | `workspace/state.json` write-path safety | E1 — Test and Governance Hardening | DoD-complete |
| p3.21 | Systematic-debugging coupled-change workflow | E1 — Test and Governance Hardening | DoD-complete |
| p3.22 | `/verify-completion` second-session check (Step 0) | E1 — Test and Governance Hardening | DoD-complete |

**Phase 3 outcome (2026-04-19):** All implementation stories DoD-complete. T3M1 advanced from 3/8 Y to 8/8 Y (Q8 closed by p3.2b — GitHub Artifact Attestation; see DEC-P3-002). Assurance gate upgraded to content-level governance substance checks. PowerShell trace validator live. Approval-channel adapters for Teams and Jira delivered. EA registry integrated into `/discovery`. Improvement agent calibration live. Issue dispatch auto-close loop closed. Agent behaviour observability register published. Remaining outer-loop-defined stories (p3.3, p3.4, p3.12, p3.14) require further delivery cycle.

**Updated T3M1 state (2026-04-19):** Q8 closed by p3.2b — all 8/8 audit questions now satisfied. Full T3M1 satisfaction unlocks the `MODEL-RISK.md` adoption gate for non-dogfood use.

### Short-track companion features delivered alongside Phase 3 (2026-04-18)

Three short-track features were delivered concurrently with Phase 3 inner loop work. Each followed the full short-track pipeline (test-plan → DoR → implementation). All PRs merged 2026-04-18.

#### Skill-performance-capture (spc.1–spc.5) — DoD-complete

Experiment instrumentation for multi-model performance comparison. Full artefact chain at `artefacts/2026-04-18-skill-performance-capture/`.

| Story | Title | Delivery |
|-------|-------|---------|
| spc.1 | `capture-block.md` template in `.github/templates/` | Template appended to phase artefacts when `instrumentation.enabled: true` in `context.yml` |
| spc.2 | `context.yml` instrumentation block | `experiment_id`, `model_label`, `cost_tier` fields; consumed by all skills at artefact write time |
| spc.3 | `copilot-instructions.md` Skill Performance Capture section | System-level instruction for when/how to append capture blocks; security constraint MC-SEC-02 for `fidelity_self_report` |
| spc.4 | `workspace/experiments/README.md` | Operator playbook for running Sonnet vs Opus comparison experiments |
| spc.5 | `scripts/check-capture-completeness.js` | Governance check verifying capture blocks are present on all instrumented artefacts |

**Experiment context files:** `contexts/experiment-sonnet-phase4.yml` and `contexts/experiment-opus-phase4.yml` — parallel experiment profiles for Phase 4 Sonnet vs Opus outer-loop comparison. Copy to `.github/context.yml` before each experiment run. These are telemetry label files only — model switching is an operator action (IDE model picker or API config); see memory note `experiment-model-switching.md`.

#### Pipeline-state-archive (psa.1) — DoD-complete

Compressed active pipeline state from 147 KB to 36 KB (75% reduction), resolving the D8 context budget exhaustion risk for the GitHub coding agent. Full artefact chain at `artefacts/2026-04-18-pipeline-state-archive/`.

Key deliverables (PR #171):
- `scripts/archive-completed-features.js` — `archive()` moves DoD-complete features to `.github/pipeline-state-archive.json`; supports Phase 3 partial archive (split completed from in-flight stories within same feature); `mergeState()` reconstitutes full view for dashboard rendering
- `.github/pipeline-state-archive.json` — Phase 1, Phase 2, and skill-performance-capture features archived; Phase 3 partially archived
- `dashboards/pipeline-viz.html` — `loadState()` fetches and merges archive on page load
- `.github/pipeline-state.schema.json` — `archive` pointer field added
- `tests/check-archive.js` — 25 tests (T1–T11 + NFR1/NFR2) all passing
- `tests/fixtures/archive-test-fixture.json` — synthetic 3-feature fixture

#### Dashboard v2 (dviz.1/dviz.2/dviz.3) — DoD-complete

Live data dashboard wiring and GitHub Pages deployment. Replaced hardcoded mock arrays in `index.html` with real pipeline-state data. Full artefact chain at `artefacts/2026-04-18-dashboard-v2/`. Delivered across two PRs (#158 + #159).

New files in `dashboards/` (PR #158):
- `pipeline-adapter.js` — fetches `.github/pipeline-state.json` at page load via `fetch()`; transforms pipeline-state shapes to `CYCLES`/`EPICS`/`PHASES`; handles Phase 2 `epics_batch2` and Phase 3 slug-only story patterns; dispatches `pipeline-loaded` CustomEvent for React remount
- `pipeline.html` — feature-scoped view with `?feature=<slug>` URL param; `LedgerBar`, `LeftCol`, `CenterCol`, `FooterBar` components; `ArtefactDrawer` (click story chip to browse artefact chain inline); default view set to `pipeline`
- `artefact-content.js` — artefact markdown content rendering layer
- `artefact-fetcher.js` — path builders and cache for story/feature `.md` artefact files
- `extra-data.js` — supplementary data layer for story enrichment
- `extra-views.css` — story state styles (`story-row-active`, `story-row-done`, `story-row-queued`), inner loop stage progress dots, epic progress summary bar, active-story auto-expand
- `md-renderer.js` — `MdViewer` component fetches and renders real `.md` artefacts from `artefacts/` inline in the dashboard
- `dashboards/README.md` — operator guide for local and GitHub Pages usage
- `tests/check-dashboard-viz.js` — 44 governance checks for dashboard file existence and adapter contract
- `tests/check-dviz1-adapter.js` — 10 governance checks (T1–T10) for `pipeline-adapter.js` wiring in `index.html` (added 2026-04-21 to complete DoD evidence)
- `tests/check-dviz2-pages-workflow.js` — 8 governance checks (T1–T8) for `.github/workflows/pages.yml` (added 2026-04-21 to complete DoD evidence)

GitHub Pages deployment (PR #159):
- `.github/workflows/pages.yml` — deploys `dashboards/` to GitHub Pages on push to master; static HTML/JS/CSS only, no build step

`dashboards/pipeline-viz.html` also moved from `.github/pipeline-viz.html` to `dashboards/pipeline-viz.html` in this batch (PR #158). All governance check paths, install scripts, and documentation updated (25 reference updates across 7 files).

#### Auditor trace report CLI (atr.1) — DoD-complete

CLI tool for auditors and platform maintainers to generate a full traceability report without running a Copilot session. Full artefact chain at `artefacts/2026-04-18-auditor-trace-report/`.

Key deliverables (PR #172):
- `scripts/trace-report.js` — `generateReport()` reads both `pipeline-state.json` and `pipeline-state-archive.json` (psa.1 merge pattern); walks all artefact paths; marks missing files as `MISSING`; correlates `workspace/traces/` JSONL for gate evidence (verdict, traceHash, check results); exits non-zero with available-slug list if feature not found
- `tests/check-trace-report.js` — 12 tests (T1–T11 + NFR1) all passing; covers active + archived features, gate evidence correlation, missing artefact handling, non-zero exit on unknown slug
- `tests/fixtures/trace-report-test-fixture.json` — synthetic test data

**Usage:** `node scripts/trace-report.js --feature <feature-slug>` — outputs Markdown to stdout.

---

## 2. Architectural Decisions (ADR-001 through ADR-006)

All ADRs are maintained in the live guardrails file: [`.github/architecture-guardrails.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/architecture-guardrails.md)

### ADR-001 — Single-file viz, no build step (Active, 2026-03-22)

`dashboards/pipeline-viz.html` is a self-contained single file. No build step, no runtime npm dependencies, no external CDN. Opens directly in any browser from a local clone. Revisit trigger: file grows beyond ~3,000 lines and maintainability is significantly impacted.

### ADR-002 — Gates must use evidence fields, not stage-proxy (Active, 2026-03-22)

Every governance gate in `evaluateGate()` must read at least one evidence field from `pipeline-state.json` (`reviewStatus`, `dorStatus`, `dodStatus`, etc.). Stage-only checks are permitted as a fallback only where no evidence field yet exists and must be marked with a `// TODO: replace with evidence field` comment. Prevents false-positive gate passes when a stage is manually set without running the corresponding skill.

### ADR-003 — Schema-first: fields defined before use (Active, 2026-03-22)

Any field written to `pipeline-state.json` by a skill, or read by the viz, must be added to `pipeline-state.schema.json` in the same commit. Schema is the contract between skills and viz. Prevents stale schema, broken validators, and silent field drift.

### ADR-004 — `context.yml` is the single config source of truth (Active, 2026-03-22)

`.github/context.yml` is the canonical config file. Skills read it for all org-specific labels, tool integrations, compliance frameworks, and regulated-flag status. Nothing org-specific is hardcoded in skill instruction text or viz JS constants. Enables same skill library to operate across GitHub personal, GitHub Enterprise, Bitbucket, Jenkins, and enterprise AAIF-compliant environments without modification.

### ADR-005 — Agent instructions format is a surface adapter concern (Active, 2026-04-11)

The assembly script emits `.github/copilot-instructions.md` when `context.yml` sets `vcs.type: github`, and `AGENTS.md` otherwise. Content is identical. `AGENTS.md` is the Linux Foundation AAIF vendor-neutral standard. This decision unlocks distribution to non-GitHub inner loop tooling (Bitbucket, Jenkins, Cursor, Claude Code) without per-platform forks. Delivered by p2.4.

### ADR-006 — Approval-channel adapter pattern for DoR sign-off (Active, 2026-04-12)

Channel wiring for DoR sign-off is selected from `.github/context.yml` and implemented in channel-specific adapters. The core write contract is channel-agnostic and always updates the same evidence fields: `dorStatus`, `dorApprover`, `dorChannel`. Phase 2 reference path: `approval_channel: github-issue` with `/approve-dor` event handling. Off the table: hardcoding one approval channel into DoR skill logic. Delivered by p2.8.

### DEC-P3-002 — Tamper-evidence registry: GitHub-only implementation (2026-04-15)

**Decision recorded in:** `artefacts/2026-04-14-skills-platform-phase3/decisions.md`

Story p3.2b (T3M1 Q8 — tamper-evidence registry) is implemented using **GitHub Artifact Attestation with OIDC-signed workflow identity** in this reference repository (`heymishy/skills-repo` on GitHub). This is Option A of ASSUMPTION-02, resolved 2026-04-15.

**Enterprise adopters on Bitbucket must implement Option B.** GitHub Artifact Attestation is not available outside GitHub.com / GHES. The required Option B path for Bitbucket environments:

| Requirement | Detail |
|---|---|
| Registry | Separate read-only registry repository (e.g. `[org]/trace-registry`) |
| Branch protection | No human write access; only the CI service account may push |
| Credential | CI service account token with write access to the registry repo only — not a personal access token |
| Publication step | One append-only commit per story merge; `tamperEvidence.registryRef` records the commit SHA |
| Auditor retrieval | `git log` on the registry repo is sufficient — no special tooling required |

This is a **known divergence between the dogfood instance and enterprise deployment.** Q8 evidence produced by the dogfood instance (Artifact Attestation records) is not directly portable to a Bitbucket deployment — the registry type and retrieval mechanism differ. The independent re-verification procedure (recompute SHA-256 of the trace file; compare to the registry entry) is identical for both options — only the retrieval step differs.

**Action required at enterprise pilot onboarding:** Implement Option B for the enterprise Bitbucket instance. Do not use the dogfood `tamperEvidence.registryRef` entries as enterprise audit evidence — they reference GitHub Artifact Attestation records retrievable only from GitHub.

---

## 3. Known Gaps

### 3.1 T3M1 — Trace readability for risk review: 8/8 audit questions satisfied ✅

**What T3M1 is:** `MODEL-RISK.md` defines eight audit questions that a risk reviewer must be able to answer from a trace alone, without engineering assistance. This is the governance readability test for the assurance trace. Full 8/8 satisfies the adoption gate for non-dogfood use.

**Baseline (recorded 2026-04-12):** T3M1 evaluated against the first real Phase 2 inner loop trace (`workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl`, story p2.4, PR #31). Result: **3/8 Y** — Q1 (model identity), Q3 (standards injected), Q4 (trace transition complete) satisfied.

**Updated state (2026-04-19):** Story p3.2a (PR #86, merged 2026-04-15) closed Q2/Q5/Q6/Q7. Story p3.2b (merged 2026-04-19) closed Q8 via GitHub Artifact Attestation. Current result: **8/8 Y**. Full T3M1 satisfaction achieved — the `MODEL-RISK.md` adoption gate is now unblocked for non-dogfood use.

| # | Question | Status | Delivery |
|---|---|---|---|
| Q1 | Model identity visible in trace | ✅ Satisfied | Phase 2 baseline |
| Q2 | `standardsInjected` hashes visible and verifiable | ✅ Closed | p3.2a — field added to trace schema; gate enforces presence for regulated stories |
| Q3 | Standards injected visible in trace | ✅ Satisfied | Phase 2 baseline |
| Q4 | Trace transition complete | ✅ Satisfied | Phase 2 baseline |
| Q5 | Watermark row visible (pass/fail reason) | ✅ Closed | p3.2a — `watermarkResult` field (pass/passRate sub-fields) added to trace schema |
| Q6 | `stalenessFlag` present in trace | ✅ Closed | p3.2a — boolean field added to schema |
| Q7 | Agent independence evidenced | ✅ Closed | p3.2a — `sessionIdentity` field (sessionId, agentType, startedAt) added to schema; gate blocks null for regulated stories |
| Q8 | Hash recomputation confirms no drift since approval | ✅ Closed | p3.2b — GitHub Artifact Attestation (reference implementation); enterprise Bitbucket path: separate read-only registry repo (see DEC-P3-002) |

**Test coverage:** `tests/check-t3m1-fields.js` — 13 tests across schema field presence, gate enforcement for regulated traces, gate pass-through for non-regulated traces, and `docs/MODEL-RISK.md` field documentation check. All 13 pass.

**Enterprise Bitbucket note:** The Q8 implementation in this reference repo uses GitHub Artifact Attestation, which is not available outside GitHub.com/GHES. Enterprise Bitbucket operators must implement Option B (separate read-only registry repository) — see DEC-P3-002 in Section 2.

**Artefacts:** `docs/MODEL-RISK.md` → Section 3 (T3M1 evidence block) and Section 4 (sign-off conditions). `tests/check-t3m1-fields.js` (13 automated checks). `artefacts/2026-04-14-skills-platform-phase3/dor/p3.2a-t3m1-trace-fields-dor.md` and `p3.2b-t3m1-tamper-evidence-registry-dor.md`.

### 3.2 Docker-gated tests skipped (p2.10 AC3/AC4/AC5)

**What was skipped:** p2.10 story (8 remaining discipline standards — POLICY.md floors) includes 3 tests marked `[PREREQ-DOCKER]` covering AC3 (standards composition under a Docker-isolated environment), AC4 (POLICY.md floor constraint enforcement via Docker-based runner emulation), and AC5 (CI pipeline integration with Docker daemon available).

**Why:** The standard GitHub Copilot coding agent runner does not have Docker daemon available. These 3 tests were accepted as deferred at DoD with the `[PREREQ-DOCKER]` marker. The 12 non-Docker tests in p2.10 all pass.

**Required action:** Execute the 3 deferred tests in a Docker-enabled runner or CI environment (e.g. self-hosted GitHub Actions runner with Docker, or `services: docker:dind` in a CI job). No code changes required — the tests exist and expect the Docker daemon path. Recommendation: create a separate CI job scoped to `tests/p2.10-docker/**` that requires `docker` service.

**Artefact:** [`artefacts/2026-04-11-skills-platform-phase2/dod/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-11-skills-platform-phase2/dod) — look for files prefixed `p2.10-`

### 3.3 D-batch pending skill-file writes (D10 + D10a)

Two pipeline evolution proposals were identified during internal delivery and logged in `workspace/learnings.md` (2026-04-12 D-batch entry). They have not been written to skill files because they require a proper story + DoR cycle.

**D10 — `/definition-of-ready` dispatch forward pointer:**
Add a forward pointer from the DoR all-PROCEED batch exit to `/issue-dispatch`, plus a mandatory `git push origin master` gate that must pass before dispatch. This closes a gap where DoR can sign off in state without the branch being pushed, causing the dispatch to fail with a "ref not found" error.
Target file: [`.github/skills/definition-of-ready/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/definition-of-ready/SKILL.md)

**D10a — `/issue-dispatch` PR body `Closes #[issue]` guidance:**
Add explicit guidance to the issue-dispatch SKILL.md instructing the PR body template to include `Closes #[issue-number]`. This enables automatic GitHub issue close on PR merge and completes the dispatch loop without a manual close step.
Target file: [`.github/skills/issue-dispatch/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/issue-dispatch/SKILL.md)

**Required action:** Create Phase 3 (or short-track) stories for D10 and D10a. Do not edit skill files directly without a test plan and DoR.

---

## 4. Enterprise Adaptation Path

This section documents the specific configuration and integration changes required to operate the platform in a Bitbucket/Jenkins enterprise environment (e.g. Bank or equivalent regulated financial-services org using non-GitHub tooling).

> **Enterprise operator notice — this reference repo is GitHub-native.**
> The `heymishy/skills-repo` reference operates on GitHub with GitHub Actions CI and the GitHub Copilot coding agent as the inner loop agent. If your enterprise instance runs Bitbucket, each of the following differences applies. Read this notice before Sections 4.1–4.5 to understand what must change in your fork before running any inner loop story.
>
> | Aspect | This reference repo | Your enterprise instance | Required action |
> |--------|---------------------|--------------------------|------------------|
> | VCS | GitHub | Bitbucket (Cloud or DC) | Set `vcs.type: bitbucket` in `.github/context.yml` before running any skill. |
> | Inner loop agent | GitHub Copilot coding agent | **Not available** — GitHub Copilot agent requires a GitHub.com or GHES repo | Use Cursor, Claude Code, or another AAIF-compliant tool that reads `AGENTS.md` at repo root. The inner loop instructions are identical — only the file name changes. |
> | Agent instructions file | `.github/copilot-instructions.md` | `AGENTS.md` at repo root | Run `scripts/assemble-copilot-instructions.sh` with `vcs.type: bitbucket` set; it emits `AGENTS.md`. Do not manually create `.github/copilot-instructions.md` — it will be ignored by non-GitHub tooling. |
> | Issue dispatch (`/issue-dispatch`) | Creates GitHub Issues to trigger coding agent | GitHub Issues not available | Skip `/issue-dispatch`. Trigger inner loop tasks manually in your chosen AAIF tool by pointing it at the DoR artefact. |
> | CI | GitHub Actions (`.github/workflows/`) | Bitbucket Pipelines (`bitbucket-pipelines.yml`) | Port the three workflow files (`assurance-gate.yml`, `trace-commit.yml`, `governance-sync.yml`) to Bitbucket Pipelines step syntax. The Node.js scripts they invoke are CI-agnostic — no changes to the scripts are required. |
> | Approval channel | `github-issue` (`/approve-dor` GitHub Actions workflow) | Not available | Set `approval_channel: jira`, `teams`, or `confluence` in `.github/context.yml`. Do **not** set `github-issue` — the GitHub Actions handler will not exist in a Bitbucket repo. |
> | Branch protection (`traces` branch) | GitHub branch ruleset: push allowed only from `trace-commit.yml` workflow identity | Bitbucket branch permissions | Create the `traces` branch and set a Bitbucket branch permission restricting pushes to the CI service account identity running the assurance gate step. The principle is identical; the mechanism is Bitbucket-specific. |
> | Raw artefact links in this document | `https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/[path]` | Bitbucket raw URL pattern | When distributing this handoff document internally, substitute: `https://bitbucket.org/[workspace]/[repo]/raw/master/[path]` for all raw links. |

### 4.1 VCS and CI topology: Bitbucket Pipelines

Set `vcs.type: bitbucket` in `.github/context.yml`. The assembly script (`scripts/assemble-copilot-instructions.sh`) will emit `AGENTS.md` at the repo root instead of `.github/copilot-instructions.md`. Content is identical — the format switch is the only change.

For CI: the Bitbucket Pipelines topology was validated in Phase 2 (p2.10). The CI gate triggers on `pull-request: opened, updated` events using the `bitbucket-pipelines.yml` equivalents of the GitHub Actions workflow defined in `.github/workflows/`. The same Node.js check scripts (`check-governance-sync.js`, `check-viz-syntax.js`, `check-skill-contracts.js`, `check-pipeline-artefact-paths.js`, `run-assurance-gate.js`) run identically — they are plain CommonJS with no GitHub-specific dependencies.

For Jenkins: set `tools.ci_platform: jenkins` in `.github/context.yml`. Adapt the pipeline definition to a `Jenkinsfile` using the same `npm test` entry point. The `validate-trace.sh` script requires Python 3 + `jsonschema` + `pyyaml` — these must be available on the Jenkins agent.

### 4.2 Agent instructions format: `AGENTS.md`

With `vcs.type: bitbucket` (or any non-`github` value), the assembled instructions file is written to `AGENTS.md` at the repo root. This is the Linux Foundation AAIF vendor-neutral standard consumed by Cursor, Claude Code, and other compliant inner loop tools. No content change is required — the format change is entirely driven by `vcs.type`.

For Cursor or Jetbrains AI Assistant: `AGENTS.md` at repo root is automatically picked up by both tools as the agent instruction file, provided the project is set to use agent mode.

### 4.3 Approval channel: enterprise adapters

The approval-channel adapter pattern (ADR-006) is configured in `.github/context.yml` under `approval_channel`. Available adapter values after Phase 2:

| `approval_channel` value | Mechanism | Required setup |
|---|---|---|
| `github-issue` | Approver posts `/approve-dor` as a comment on the linked GitHub issue; GitHub Actions workflow writes `dorStatus: signed-off` to `pipeline-state.json` | GitHub repo + Actions enabled |
| `jira` | Jira ticket status transitions to the configured approval status; webhook writes the dorStatus update | Jira webhook + pipeline-state write endpoint |
| `confluence` | Confluence page approval workflow; page macro writes dorStatus on approval | Confluence + REST API access |
| `slack` | Workspace slash command `/approve-dor [story-id]`; Slack app writes dorStatus | Slack app with write-back webhook |
| `teams` | Teams adaptive card approval; Power Automate flow writes dorStatus | Microsoft 365 + Power Automate |

For a Enterprise regulated environment: the recommended path is `approval_channel: jira` (where Jira Service Management is the change management tool) or `approval_channel: teams` (where Microsoft 365 is the standard approver surface). Both adapters write the same evidence fields (`dorStatus`, `dorApprover`, `dorChannel`) — the state contract and gate evaluation logic are unchanged.

**Enterprise RBAC note:** The write-back webhook or service account that updates `pipeline-state.json` must have repo write access scoped to the state file only. Do not grant broad repo write access to the approval adapter service account.

### 4.4 Regulated environment compliance flags

Set `governance.regulated: true` in `.github/context.yml` to enable the regulated-environment guardrail checks. This flag activates:
- Mandatory `/decisions` log entry for every story before DoR sign-off
- Stricter AC traceability requirements in `/review` (all ACs must map to a named compliance framework clause)
- PR body must include a change reference field (mapped to ServiceNow or Jira-SM ticket via `change_management.tool`)
- Audit NFR (traceable commit messages) is enforced as a CI gate check, not just a MUST standard

Set `change_management.tool: servicenow` (or `jira-sm`) and populate `change_management.base_url`, `change_management.assignment_group`, and `change_management.change_category` to enable the `/release` skill's automated change request body generation.

### 4.5 Standards extension: discipline tiers

The Phase 2 POLICY.md floor model is live for all 11 disciplines. For enterprise-specific domain extensions (e.g. APRA CPS 234 controls, internal security classification policy, RG 271 obligations), add entries under `standards/[discipline]/` using the established composition model:

```
standards/
  [discipline]/
    core.md           ← universal baseline MUST/SHOULD/MUST NOT requirements
    POLICY.md         ← minimum floor for this discipline; referenced at assurance gate time
```

Domain-tier extensions (squad-specific overrides) are declared in the squad's `context.yml` under `standards.domain_extensions`. The assurance agent's standards injection step reads `context.yml` and includes the declared domain extensions alongside the core standards in the trace's `standardsApplied` array.

---

## 5. Quick Reference

| Item | Path |
|------|------|
| Platform infrastructure repo | [`heymishy/skills-framework-infra`](https://github.com/heymishy/skills-framework-infra) — gate scripts, eval suite, governance enforcement. Read-only for delivery agents. |
| Pipeline state (live) | [`.github/pipeline-state.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/pipeline-state.json) |
| Architecture guardrails + ADRs | [`.github/architecture-guardrails.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/architecture-guardrails.md) |
| Context configuration | [`.github/context.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/context.yml) |
| Model risk register | [`docs/MODEL-RISK.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/MODEL-RISK.md) |
| Onboarding | [`docs/ONBOARDING.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/ONBOARDING.md) |
| Skills (all phases) | [`.github/skills/`](https://github.com/heymishy/skills-repo/tree/master/.github/skills) — one `SKILL.md` per subdirectory |
| Post-merge improvement skill | [`.github/skills/improve/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/improve/SKILL.md) (formerly `levelup/`) |
| Coding agent orientation | [`.github/instructions/agent-orientation.instructions.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/instructions/agent-orientation.instructions.md) |
| Standards index | [`standards/index.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/standards/index.yml) + [`standards/`](https://github.com/heymishy/skills-repo/tree/master/standards) |
| Phase 1 artefacts | [`artefacts/2026-04-09-skills-platform-phase1/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-09-skills-platform-phase1) |
| Phase 2 artefacts | [`artefacts/2026-04-11-skills-platform-phase2/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-11-skills-platform-phase2) |
| Estimation actuals | [`workspace/phase2-actuals.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/phase2-actuals.md) |
| State and checkpoint | [`workspace/state.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/state.json) |
| Eval regression suite | [`workspace/suite.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/suite.json) |
| Delivery traces | [`workspace/traces/`](https://github.com/heymishy/skills-repo/tree/master/workspace/traces) (files); `origin/traces` branch (permanent store) |
| Improvement proposals | [`workspace/proposals/`](https://github.com/heymishy/skills-repo/tree/master/workspace/proposals) |
| Adoption readiness (RAG) | [`workspace/adoption-readiness.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/adoption-readiness.md) |
| Phase 3 artefacts | [`artefacts/2026-04-14-skills-platform-phase3/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-14-skills-platform-phase3) |
| Phase 3 discovery | [`artefacts/2026-04-14-skills-platform-phase3/discovery.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/discovery.md) |
| Phase 3 benefit-metric | [`artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md) |
| Phase 3 decisions | [`artefacts/2026-04-14-skills-platform-phase3/decisions.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/decisions.md) |
| Phase 4 artefacts | [`artefacts/2026-04-19-skills-platform-phase4/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-19-skills-platform-phase4) |
| Phase 4 discovery | [`artefacts/2026-04-19-skills-platform-phase4/discovery.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-19-skills-platform-phase4/discovery.md) |
| Phase 4 decisions | [`artefacts/2026-04-19-skills-platform-phase4/decisions.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-19-skills-platform-phase4/decisions.md) |
| Phase 4 spike outputs | [`artefacts/2026-04-19-skills-platform-phase4/spikes/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-19-skills-platform-phase4/spikes) |
| CLI approach artefacts (Craig) | [`artefacts/2026-04-18-cli-approach/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-18-cli-approach) |
| T3M1 fields check (13 tests) | [`tests/check-t3m1-fields.js`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/tests/check-t3m1-fields.js) |
| Trace-commit check (12 tests) | [`tests/check-trace-commit.js`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/tests/check-trace-commit.js) |
| Conflict-resolution guide | [`docs/conflict-resolution-guide.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/conflict-resolution-guide.md) |
| Agent behaviour observability doc | [`docs/agent-behaviour-observability.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/agent-behaviour-observability.md) |
| Phase 4 backlog — agent behaviour | [`workspace/phase4-backlog-agent-behaviour-observability.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/phase4-backlog-agent-behaviour-observability.md) |
| Phase 4 backlog — second-model review | [`workspace/phase4-backlog-second-model-review.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/phase4-backlog-second-model-review.md) |
| Retrospective artefact audit (2026-04-16) | [`workspace/retrospective-audit-2026-04-16.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/retrospective-audit-2026-04-16.md) |
| Retrospective story template | [`.github/templates/retrospective-story.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/templates/retrospective-story.md) |
| Dashboard v2 artefacts | [`artefacts/2026-04-18-dashboard-v2/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-18-dashboard-v2) |
| Dashboard directory | [`dashboards/`](https://github.com/heymishy/skills-repo/tree/master/dashboards) — `index.html`, `pipeline.html`, `pipeline-adapter.js`, `pipeline-viz.html` (moved from `.github/`), plus supporting JS/CSS files |
| Pipeline-state archive | [`.github/pipeline-state-archive.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/pipeline-state-archive.json) — Phase 1, Phase 2, SPC, and partial Phase 3 archived features |
| Archive script | [`scripts/archive-completed-features.js`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/scripts/archive-completed-features.js) |
| Pipeline-state-archive artefacts | [`artefacts/2026-04-18-pipeline-state-archive/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-18-pipeline-state-archive) |
| Audit trace report CLI | [`scripts/trace-report.js`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/scripts/trace-report.js) — `node scripts/trace-report.js --feature <slug>` |
| Auditor-trace-report artefacts | [`artefacts/2026-04-18-auditor-trace-report/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-18-auditor-trace-report) |
| Skill-performance-capture artefacts | [`artefacts/2026-04-18-skill-performance-capture/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-18-skill-performance-capture) |
| Experiment context files | [`contexts/experiment-sonnet-phase4.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/contexts/experiment-sonnet-phase4.yml) / [`contexts/experiment-opus-phase4.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/contexts/experiment-opus-phase4.yml) |
| Capture block template | [`.github/templates/capture-block.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/templates/capture-block.md) |
| GitHub Pages workflow | [`.github/workflows/pages.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/workflows/pages.yml) |

**`traces` branch — ruleset note:** The `traces` branch is a permanent append-only branch that holds all CI assurance trace JSONL files. It is written exclusively by the `trace-commit.yml` GitHub Actions workflow (github-actions bot push) after each inner loop PR merge. No human direct-push is permitted; no PR is required to write to this branch. The branch ruleset should allow pushes only from the `trace-commit.yml` workflow identity. **Fleet fork operators (GitHub):** recreate the `traces` branch and matching branch ruleset on your fork before running any inner loop story. Without the branch and ruleset in place, the `trace-commit.yml` post-merge step will fail silently and traces will be lost. **Bitbucket operators:** create the `traces` branch and restrict pushes via Bitbucket branch permissions to the CI service account; the GitHub Actions ruleset does not apply. The Bitbucket Pipelines equivalent of `trace-commit.yml` performs the same append-and-push step using the Bitbucket Pipelines OIDC identity.

---

## 6. Phase 3 Initialisation (2026-04-13)

### 6.1 Entry condition met

T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) is on record in `MODEL-RISK.md` with Hamish sign-off 2026-04-12, outcome "approved with conditions", 3/8 Y baseline. Phase 3 /discovery is unblocked. The five T3M1 gap closures (Q2, Q5, Q6, Q7, Q8 — see Section 3.1) become Phase 3 story candidates.

**Raw artefact links for reconstruction** (use these if working from a fork, partial clone, or outside this repo):

| Artefact | Raw URL |
|----------|---------|
| MODEL-RISK.md (T3M1 evidence + sign-off) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/MODEL-RISK.md |
| Phase 1 discovery | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/discovery.md |
| Phase 1 benefit-metric | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md |
| Phase 1 decisions | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/decisions.md |
| Phase 1 p1.8 DoR (model risk story) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor.md |
| Phase 1 p1.8 DoR contract | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor-contract.md |
| Phase 2 discovery | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/discovery.md |
| Phase 2 benefit-metric | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md |
| Phase 2 decisions | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md |
| Phase 2 p2.4 DoR (T3M1 evaluation trace story) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor.md |
| Phase 2 p2.11 DoR (improvement agent) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.11-improvement-agent-trace-proposals-dor.md |
| T3M1 evaluation trace (p2.4 / PR #31) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/traces/workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl |

### 6.2 /levelup renamed to /improve

The post-merge learning extraction skill has been renamed from `/levelup` to `/improve`. The rename reflects iterative lean-improvement intent without requiring familiarity with gaming or level-up terminology. The skill directory moved from `.github/skills/levelup/` to `.github/skills/improve/`.

**Scope of rename:** SKILL.md frontmatter and body; `config.yml`; `.github/pipeline-state.json` (fields `lastImprove`, `improveNotes`); `workspace/suite.json` (task `s-improve`); `skill-pipeline-instructions.md`; `estimate/SKILL.md`; `bootstrap/SKILL.md`; `discovery/SKILL.md`; `README.md` (all 9 references); `workspace/adoption-readiness.md` (MM2, MM4); `.github/pull_request_template.md`; `.github/templates/definition-of-done.md`; `.github/architecture-guardrails.md`; `feature-additions.md`; `CHANGELOG.md`; `workspace/learnings.md` (forward-looking action items). Historical entries that record what ran at the time (e.g. session logs, Phase 2 /improve D-batch heading) retain the original `levelup` text as factual records.

### 6.3 D-batch: copilot-instructions.md slimmed

The `copilot-instructions.md` base layer has been slimmed from 473 lines to ~280 lines (D-batch items 1–5 from the 2026-04-12 learnings.md entry). Content removed:

| Item | What moved / removed | Where |
|------|---------------------|-------|
| D-batch 1 | Coding agent orientation (orient, structure, verify, PR-open steps; "What the coding agent should NOT do") | Extracted to `.github/instructions/agent-orientation.instructions.md` with `applyTo: "**"` |
| D-batch 2 | 34-row templates table (~49 lines) | Replaced with single sentence: "All artefact templates are in `.github/templates/` — each skill references its own template in its SKILL.md." |
| D-batch 3 | Artefact storage directory tree (~45 lines) | Replaced with 3-line naming convention statement |
| D-batch 4 | Context handoff protocol (~28 lines) | Replaced with 2-line instruction |
| D-batch 5 | Product context files table (~18 lines) | Replaced with 1-line pointer |

New `.github/instructions/agent-orientation.instructions.md` — scoped to GitHub Actions coding agent context. Contains: 4-step orientation (orient from artefacts, understand structure, verify baseline, open PRs as drafts), "When to stop" guidance, "What the coding agent should NOT do" (7 items, including: do not directly edit SKILL.md files, templates, or standards files).

### 6.4 Platform change PR policy (active from Phase 2 complete)

All changes to `.github/skills/`, `.github/templates/`, `standards/`, `.github/governance-gates.yml`, and `scripts/` must be merged via PR — not committed directly to the default branch. This policy is documented in `copilot-instructions.md` under "Platform change policy (Phase 2+)". It is a process control today, pending a CODEOWNERS rule for hard enforcement. The current branch (`feat/phase3-init-rename-improve`) is the first instance of this policy in practice.

### 6.5 Governed upward standards loop

When `/improve` identifies a pattern that warrants a SKILL.md update, the flow is:

1. `/improve` produces a `proposed-skill-update.md` diff in `workspace/proposals/` with rationale and confidence score.
2. Squad lead reviews the proposal and raises a PR against the fleet repo.
3. Platform team reviews and merges.
4. Consuming repos receive the update on their next skills sync (`.github/context.yml` `skills_upstream` configuration).

`/improve` does not edit SKILL.md files directly. The improvement agent's diff proposals follow the same path. This creates a single governed channel for all upward standards updates regardless of whether they originate from a human operator or the improvement agent.

### 6.6 README additions

Two new sections added to `README.md` in this Phase 3 init:

**"Current state vs structural controls"** — documents what is currently structural (artefact read-only instruction, DoR scope immutability, assurance gate CI, CODEOWNERS/branch protection, POLICY.md floors) vs what is currently process-assurance (DoR sign-off authority, T3M1 completeness, non-engineer approval channel, platform change governance). Clarifies the entitlements model: the platform validates the upstream chain; entitlements protect the act of merging. First explicit statement that "for the first time, the chain from story → feature → initiative → benefit hypothesis is machine-traversable."

**"Conceptual lineage"** — attribution table covering: tikalk agentic-sdlc-spec-kit, Karpathy autoresearch loop, Agent OS, BMAD Method, OpenHarness (HKUDS), NeoSigma auto-harness, AutoAgent (ThirdLayer), financial services maker/checker controls, IAM entitlements model. Novel (not derived) contributions listed explicitly: regulated-enterprise governance model, three-tier standards inheritance, surface-as-branching-dimension, benefit traceability at fleet scale, dog-fooding constraint as governance signal.

### 6.7 Adoption readiness current state

`workspace/adoption-readiness.md` is current as of 2026-04-13. Amber items:

- **M1** — requires a genuine second operator completing a full outer loop unassisted (enterprise pilot entry event).
- **MM2** — requires running `scripts/parse-session-timing.js` against Phase 2 transcripts to produce the E3 actuals row in `workspace/estimation-norms.md`. ~30-minute operator action, no new code required.
- **MM4** — closes at Phase 3 `/improve` when the third feature's actuals are ingested. Error bound until then: ±40%.

Red item: **M5** — non-engineer approval requires a live configured environment and a real approver. Requires scoping effort before enterprise pilot can claim this outcome.

---

### 6.8a Platform infrastructure repository created (2026-04-18)

**ASSUMPTION-01 confirmed.** The `skills-framework-infra` repository has been created at [`heymishy/skills-framework-infra`](https://github.com/heymishy/skills-framework-infra). This unblocks the p3.3 → p3.4 → p3.12 story chain.

**Name mapping:** The Phase 3 story artefacts (p3.3, p3.4, p3.12) reference `platform-infrastructure` as the repository name. The actual repository is `skills-framework-infra`. When implementing these stories, substitute `skills-framework-infra` wherever the artefacts say `platform-infrastructure`.

**Purpose:** Houses `run-assurance-gate.js` and all scripts it invokes, separated from the delivery repository so that delivery agents cannot modify the gate that evaluates their own work. Also houses `platform/suite.json` (eval regression suite) once p3.4 completes.

**Enterprise adopter action:** Any team adopting the skills framework must create an equivalent infrastructure repository in their own Git host. The repository must be configured with read-only access for delivery agent CI identities — no push, no create-branch, no delete. On GitHub, this is a repository visibility + collaborator permission setting. On Bitbucket, use repository permissions to restrict the CI service account to read access only.

**Phase 4 note:** The ref doc's Spike A (governance logic extractability and interface definition) may subsume or extend this repository as the governance package extraction progresses. The `skills-framework-infra` repo is the Phase 3 structural control; Phase 4 may evolve it into a broader governance package.

### 6.8 Phase 3 E1 batch: governance hardening stories delivered (2026-04-14 → 2026-04-19)

Phase 3 implementation stories p3.1a–p3.1e, p3.2a–p3.2b, p3.5–p3.11, and p3.18–p3.22 are all DoD-complete. Key deliverables:

- **p3.2b (T3M1 Q8):** GitHub Artifact Attestation using OIDC workflow identity. SHA-256 tamper-evidence for all assurance traces. `scripts/attestation-publisher.js` publishes attestations post-merge. T3M1 now 8/8 Y — adoption gate fully satisfied.
- **p3.5:** `scripts/validate-trace.ps1` — PowerShell 5.1+ trace validation with `--ci` flag; mirrors `validate-trace.sh` behaviour on Windows. `tests/check-p3.5-validate-trace.js` (8 tests).
- **p3.6:** `issue-dispatch/SKILL.md` updated with `Closes #[issueNumber]` keyword in PR body template — issues auto-close on PR merge. `definition-of-ready/SKILL.md` gains forward pointer to `/issue-dispatch`.
- **p3.7:** `src/trace-registry/getTraces.js` — trace aggregation module; `.github/workflows/trace-aggregation.yml` — CI workflow aggregating traces across registered repos.
- **p3.8:** `src/approval-channel/adapters/teams-adapter.js` (HMAC-SHA256 verified) and `jira-adapter.js` — enterprise approval channel adapters beyond `github-issue`.
- **p3.9:** `docs/agent-behaviour-observability.md` — AGENTS.md compatibility matrix and Phase 4 live-run backlog item.
- **p3.10:** `/discovery/SKILL.md` gains EA registry Path A/B Step 0 block — discovery now reads EA registry context when `ea_registry_authoritative: true`.
- **p3.11:** `src/improvement-agent/calibration.js` — CRLF-normalised YAML parser, estimation underrun detection, calibration loop integration.
- **p3.18–p3.22:** Eight `/improvement` write-backs across definition, DoR/DoD enum enforcement, state write-path safety, systematic-debugging, and verify-completion. All backed by retrospective story artefacts.

**Phase 3 remaining outer-loop-defined stories:** p3.3 (gate structural independence — `skills-framework-infra` integration), p3.4 (platform eval suite migration), p3.12 (cross-team trace federation), p3.14 (concepts documentation) — require a further delivery cycle. p3.3 and p3.13 were dispatched but PRs merged empty (D8 learning — issue dispatch `--target vscode` minimal body caused empty agent PRs; D7 learning recorded, default changed to `--target github-agent`).

---

## 7. Phase 4 — Distribution, Structural Enforcement, and Non-Technical Access (2026-04-19 → current)

### 7.1 Phase 4 scope

Phase 4 addresses three categories blocking adoption at scale:

1. **Distribution and sync:** consumers (Craig's work context, Thomas as independent senior engineer) hit repo structure collisions, commit provenance requirements, and update channel drift trying to onboard. The `git clone` + remote pull assumption has proven wrong for enterprise consumers.
2. **Structural enforcement with navigation flexibility:** Phase 3 dogfood evidence — an agent can read a skill verbatim, understand design intent, and still choose to violate the prescribed method. Post-hoc gate evaluation cannot detect this. Structural enforcement at invocation time is needed, without collapsing the multi-path navigation model.
3. **Non-technical access:** Product managers, BAs, and business leads work in Teams/Word/PowerPoint — currently cannot participate in governed delivery at all. Auditors need readable governance output without engineering assistance.

### 7.2 Phase 4 spike programme (complete)

All four spikes returned PROCEED verdicts as of 2026-04-20:

| Spike | Focus | Verdict | Key finding |
|-------|-------|---------|-------------|
| Spike A | Governance logic extractability | PROCEED | 3-operation enforcement package (resolve+hash, gate+advance, trace-write) extractable; outer loop remains instructional |
| Spike B1 | MCP tool-boundary enforcement | PROCEED | MCP boundary viable in VS Code+Copilot and Claude Code; P2 ambient bypass open item (deferred to p4-enf-decision) |
| Spike B2 | Craig's CLI enforcement / shared core | PROCEED | CLI MVP viable for regulated/CI surface; Mode 1 declarative SATISFIED; Mode 2 back-navigation PARTIAL (resolution path identified) |
| Spike C | Distribution model | PROCEED | All 4 sub-problems resolved: managed-paths collision avoidance, zero-commit install, upstream authority (`heymishy/skills-repo`), lockfile design |

ADR-013 (Phase 4 enforcement architecture) raised following Spike B1/B2 DoD — recorded in `.github/architecture-guardrails.md`.

### 7.3 Phase 4 outer loop status

- Discovery: approved 2026-04-19
- Benefit-metric: active
- 24 original stories (E1–E4): all DoD-complete as of 2026-04-20
- E5 epic (Platform Observability & Measurement): 3 new stories added 2026-04-20, all DoD-complete as of 2026-04-21
- Test plans: all written and verified
- Phase 4 pipeline-state.json stage: `definition-of-done`

### 7.4 Phase 4 open dependency: Spike D (Teams bot prototype)

Spike D requires a working Azure/Microsoft 365 account for Teams bot provisioning. This is an external dependency not under direct team control. Spike D cannot begin until the Azure/MS account is confirmed provisioned. Until then, the Teams non-technical access workstream (E4) is blocked. All other Phase 4 epics (E1 distribution, E2 structural enforcement, E3 CLI, E5 governance output) are unblocked.

### 7.5 Phase 4 artefact locations

| Artefact | Path |
|----------|------|
| Discovery | `artefacts/2026-04-19-skills-platform-phase4/discovery.md` |
| Benefit-metric | `artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md` |
| Decisions | `artefacts/2026-04-19-skills-platform-phase4/decisions.md` |
| Spike outputs | `artefacts/2026-04-19-skills-platform-phase4/spikes/` |
| DoR artefacts | `artefacts/2026-04-19-skills-platform-phase4/dor/` |
| Stories | `artefacts/2026-04-19-skills-platform-phase4/stories/` |
| Test plans | `artefacts/2026-04-19-skills-platform-phase4/test-plans/` |
| Craig's CLI discovery | `artefacts/2026-04-18-cli-approach/` |

### 7.6 Phase 4 E5 — Platform Observability & Measurement (added 2026-04-20)

Three new stories added to Phase 4 after the original 24 stories were DoD-complete. All DoD-complete as of 2026-04-21 (PRs #176 and #177 merged and traced).

| Story | Title | Implementation file | Tests | Status |
|-------|-------|---------------------|-------|--------|
| p4-obs-status | Generate pipeline status report (daily/weekly) | `scripts/generate-status-report.js` | `tests/check-p4-obs-status.js` (11 tests) | DoD-complete |
| p4-obs-archive | Story/epic archive toggle for viz and state file | `scripts/archive-completed-features.js` (extend) + `dashboards/pipeline-viz.html` + `.github/pipeline-state.schema.json` | `tests/check-p4-obs-archive.js` (12 tests) | DoD-complete |
| p4-obs-benefit | Benefit measurement expansion: platform vs traditional SDLC | `scripts/record-benefit-comparison.js` | `tests/check-p4-obs-benefit.js` (12 tests) | DoD-complete |

**Metrics moved:** M2 (Consumer confidence) — p4-obs-status and p4-obs-archive; MM-A through MM-D (meta-metrics experiment framework) — p4-obs-benefit.

Five governance hardening stories from the Phase 2 adversarial audit delivered in the first Phase 3 sprint. Each closes a specific test or observability gap identified before Phase 3 launched.

**p3.1a — Trace-commit observability** (PR #94, merged 2026-04-16): `tests/check-trace-commit.js` added to `npm test` with 12 tests asserting `origin/traces` branch health, trace file commit age within 24-hour window, and stale-branch failure mode. `/verify-completion` and `/trace` SKILL.md files gain "Traces Branch Health" diagnostic sections. Prior to this story a silent trace-commit workflow failure went undetected — four such silent failures occurred during Phase 2 (PRs #51, #52, #56) before the root-cause bug was fixed in PR #55. DoR: [`p3.1a-trace-commit-observability-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1a-trace-commit-observability-dor.md).

**p3.1b — Assurance gate substantive checks** (merged 2026-04-16): `run-assurance-gate.js` extended from file-existence to content-level checks: `workspace/state.json` `currentPhase` non-empty and `lastUpdated` ISO 8601 validated; `pipeline-state.json` `version` field and `features` array asserted; at least one artefact subdirectory under `artefacts/` required (not just the directory); `governance-gates.yml` `gates:` key present and non-empty; `completedAt: null` with `status: "completed"` detected and blocked. Closes the gap where an empty repo with four minimal files passed all four gate checks identically to a correct delivery. DoR: [`p3.1b-assurance-gate-substantive-checks-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1b-assurance-gate-substantive-checks-dor.md).

**p3.1c — Test suite integrity** (PR #85, merged 2026-04-15): Three suite integrity fixes: (1) `check-definition-skill.js` refactored to import from `src/definition-skill/` production path — eliminates test-only re-implementations that could diverge from production code. (2) `watermark-gate.js` enforces minimum `passRate` floor (default 0.70; configurable via `FLOOR_PASS_RATE`) on baseline creation — prevents a 0% pass rate floor from being stored. (3) `failure-detector.js` anti-overfitting gate counts check additions and removals separately — a proposal that removes one passing check and adds one new check is blocked, not warned. DoR: [`p3.1c-test-suite-integrity-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1c-test-suite-integrity-dor.md).

**p3.1d — Bitbucket DC auth tests resolved** (PR #78, merged 2026-04-15): The four permanently-skipped Bitbucket Data Center auth tests (app-password, OAuth, SSH key) resolved via Option B — formal manual test records in `tests/smoke-tests.md` with last-run date and result. `[PREREQ-DOCKER]` annotations replaced with `[MANUAL]` throughout. Decision logged in `artefacts/2026-04-14-skills-platform-phase3/decisions.md`. **Enterprise note:** this also supersedes the Section 3.2 Docker-deferred items for the DC auth test category. The Docker-deferred items in Section 3.2 relate to p2.10 standards composition tests — those remain open on a separate track. DoR: [`p3.1d-bitbucket-dc-auth-tests-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1d-bitbucket-dc-auth-tests-dor.md).

**p3.1e — Agent behaviour observability register** (PR #77, merged 2026-04-15): `docs/agent-behaviour-observability.md` produced with three candidate approaches and effort estimates. Phase 4 story registered in `workspace/phase4-backlog-agent-behaviour-observability.md`. No implementation — scoping and registration only. The three candidate approaches: (A) structured activity log emitted by the agent per task; (B) post-session diff audit comparing PR changeset to implementation plan; (C) CI-time comparison of declared file touchpoints (from DoR contract) against actual files changed in the PR. DoR: [`p3.1e-agent-behaviour-observability-register-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1e-agent-behaviour-observability-register-dor.md).

**CI script fix** (PR #82, merged alongside Phase 3 work): `scripts/validate-trace.sh` had three bugs when processing Phase 3 story artefacts: (1) `check_unresolved_blockers` called `.get()` on string slugs — Phase 3 epics store story references as `"p3.1a"` strings, not objects; (2) `check_test_plan_coverage` had the same `AttributeError` plus wrong test plan file path construction for short slugs; (3) unsafe `python3 ...; if [[ $? -eq 0 ]]` pattern under `set -euo pipefail`. All three fixed. Script now handles mixed Phase 1/2 object-form stories and Phase 3+ string-slug stories.

### 6.9 T3M1 advanced to 7/8 — p3.2a delivered (PR #86, merged 2026-04-15)

Story p3.2a added four mandatory trace fields to the schema (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`) and wired gate enforcement that blocks merge of regulated stories when any field is null or absent. This closes T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) questions Q2, Q5, Q6, and Q7 in a single delivery. See the updated Section 3.1 table for the current 7/8 breakdown. Q8 (tamper-evidence registry) is targeted by p3.2b — see DEC-P3-002 in Section 2 for the GitHub Artifact Attestation vs. separate registry-repo decision and the enterprise Bitbucket path.

`docs/MODEL-RISK.md` updated with field-level entries for all four fields: field name, MODEL-RISK question answered (Q2/Q5/Q6/Q7), expected reviewer observations, and schema reference.

New test file: `tests/check-t3m1-fields.js` — 13 tests (schema field presence ×5, gate enforcement for regulated traces ×4, gate pass-through for non-regulated traces ×3, MODEL-RISK field documentation check ×1). All 13 pass.

DoR: [`p3.2a-t3m1-trace-fields-dor.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2a-t3m1-trace-fields-dor.md) | Contract: [`p3.2a-t3m1-trace-fields-dor-contract.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2a-t3m1-trace-fields-dor-contract.md)

### 6.10 /improvement run: eight write-backs applied (PRs #99 and #100, 2026-04-16)

An /improvement run against `workspace/learnings.md` produced eight write-back items. Each was backed by a retrospective story artefact (p3.18–p3.22) satisfying the artefact-first rule, with all story/test-plan/DoR chains passing 14/14 DoR hard blocks.

| Item | Change | Story | PR |
|------|--------|-------|-----|
| 1 | `definition/SKILL.md` — D2-platform mandatory availability gate added | p3.18 | #99 |
| 2 | `definition/SKILL.md` — D1-prereq cross-codebase validation block added | p3.18 | #99 |
| 3 | `definition-of-done/SKILL.md` + `definition-of-ready/SKILL.md` — schema-valid guardrail enum enforcement; invalid status/category synonyms listed with CI failure consequence | p3.19 | #99 |
| 4 | `copilot-instructions.md` — state write-path safety added (atomic-replace via temp file; partial-write prevention for `workspace/state.json`) | p3.20 | #99 |
| 5–6 | `systematic-debugging/SKILL.md` — coupled-change workflow section added (5-step protocol for fixes spanning `script → schema → state → CI` layers) | p3.21 | #99 |
| 7 | `docs/conflict-resolution-guide.md` created — two PR merge conflict patterns (Pattern 1: `package.json` sequential script additions; Pattern 2: `.github/workflows/` filename collision) | p3.22 | #100 |
| 8 | `verify-completion/SKILL.md` — new `## Step 0 — Fresh-session check` positioned before Step 1, with trigger conditions and four-point independent verification protocol | p3.22 | #100 |

### 6.11 Retrospective artefact coverage audit (PR #87, 2026-04-16)

Full audit of all 28 CHANGELOG versions (0.1.0 through [Unreleased]) against Phase 1 and Phase 2 artefact chains. Findings: all 8 Phase 1 and 13 Phase 2 production stories confirmed COMPLETE. 22 CHANGELOG versions classified as pre-pipeline (no story artefact expected). 11 between-stories items identified; 2 rated HIGH-risk — the `/estimate` and `/issue-dispatch` skills were added between delivery cycles without pipeline entries. Full audit report: [`workspace/retrospective-audit-2026-04-16.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/retrospective-audit-2026-04-16.md).

**Retrospective stories created to close coverage gaps:** p3.15 (`/estimate` skill), p3.16 (`/issue-dispatch` skill), p3.17 (repo-tidy docs structure). All DoR-signed-off; dispatched to coding agent.

**Artefact-first rule** formally codified in `copilot-instructions.md` Coding Standards section: any new SKILL.md file, `src/` module, or governance check script committed to master must have a corresponding story artefact committed to `artefacts/` in the same commit. Exception: documentation-only changes, typo fixes, and configuration changes with no behavioural difference. For work that has already landed without a chain, use the new `.github/templates/retrospective-story.md` template (also added in this PR).

### 6.12 Phase 4 backlog registered

Two Phase 4 forward-looking items registered during Phase 3:

**Agent behaviour observability** (`workspace/phase4-backlog-agent-behaviour-observability.md`): The platform currently has no mechanism for auditing what actions a coding agent took during a session — which tools were called, which files were modified, whether actions were consistent with the implementation plan. Three candidate approaches documented in `docs/agent-behaviour-observability.md`. No approach selected; Phase 4 design decision.

**Second-model review — formal maker/checker** (`workspace/phase4-backlog-second-model-review.md`): All Phase 1–3 governance review is single-model. During Phase 3 validation a manual second-model check pattern (pasting agent output to a second model for independent review) caught issues the primary agent did not surface. Two candidate implementations: Option A — a `/second-opinion` skill invoked at defined pipeline checkpoints (before DoR sign-off, before merge approval); Option B — `--second-model` flag on `/review` and `/verify-completion` that triggers a second API call for divergence detection. Phase 4 design decision.

**Forward-referenced item (not yet written):** `workspace/phase4-backlog-governance-integrity-test-scripts.md` is referenced by `workspace/phase4-backlog-second-model-review.md` but has not yet been created.

### 6.13 External contributor — PR #98 (held pending operator decision)

PR #98 (`craigfo:feature/productise-cli-and-sidecar`) is held pending operator decision. Two components require separate resolution paths:

**Part 1 — TypeScript CLI MVP:** A TypeScript CLI and engine consolidation proposal. Hold reason: TypeScript has not been accepted as a tech-stack boundary for CLI-tier code in `product/tech-stack.md`. Required operator action: (1) decide whether TypeScript is accepted for CLI-tier code and update `product/tech-stack.md` if yes; (2) if yes, ask contributor to rebase onto current master and confirm `npm test` passes before re-evaluating the PR for import.

**Part 2 — Engine-consolidation proposal:** Full pipeline engine replacement. This is out-of-scope for a direct PR import without a pipeline entry. Required path: contributor submits standalone /discovery → /benefit-metric pipeline entry as Phase 4 scope before any implementation begins.

**Metric signal recorded (PR #102, 2026-04-16):** An independent full outer loop run by the external contributor was observed and recorded as a benefit metric signal. MM2 (E2 (unassisted outer loop replication) — rate metric) is on-track. CR1 (adoption confidence rating) and M1 (independent operator outer loop completion) remain at-risk — require the contributor to complete `docs/MODEL-RISK.md` 8/8 audit questions with name, date, and role on record before CR1/M1 can move to on-track.

---

## 7. Story Implementation Reference (Upgrade-Path Agent Index)

This section is the entry point for an agent upgrading a working pre-Phase-1 baseline to the full Phase 1 + Phase 2 feature set. CHANGELOG.md and this document provide the architectural context and decision rationale; the DoR (Definition of Ready) artefacts and test plans are the authoritative implementation spec and acceptance criteria for each story.

### Pre-Phase-1 baseline state

Before applying p1.1, verify your repo is in this exact state. Applying stories to a repo that already has partial implementations will cause contract conflicts.

| File / path | Expected state before p1.1 |
|-------------|---------------------------|
| `workspace/state.json` | Does not exist |
| `.github/workflows/` | No `assurance-gate.yml`, no `trace-commit.yml`, no `governance-sync.yml` |
| `src/surface-adapter/` | Does not exist — no `execute()` interface |
| `standards/` | No `POLICY.md` files in any subdirectory |
| `config.yml` | No `skills` array |
| `workspace/suite.json` | Does not exist |
| `docs/MODEL-RISK.md` | Does not exist |
| `fleet-state.json` | Does not exist |

### Reading order for an upgrade-path agent

1. Read [CHANGELOG.md](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/CHANGELOG.md) in full for the "what" and "why" across all stories.
2. Verify the baseline state table above. If any file listed as "does not exist" is already present with a different shape, stop and reconcile before proceeding — do not assume story contracts will hold if structural files already exist.
3. Work through each story in the table below, in phase and story-ID order (p1.1 → p1.8, then p2.1 → p2.12). Respect the "Depends on" column — do not start a story until every listed dependency is DoD-complete and its tests pass.
4. For each story: read the DoR (scope contract + Coding Agent Instructions block), then the DoR contract (exact file touchpoints + out-of-scope constraints), then the test plan (failing tests you must make pass). For p2.6 onwards there is no separate contract file — the DoR contains the full spec, including a "What will be built / What will NOT be built" section equivalent to the contract.
5. **Manual-only ACs are not covered by `npm test`.** Several test plans contain ACs marked `Manual` only (e.g. p1.1 AC2 — live distribution cycle observation; p1.3 AC4 — reviewer inspects GitHub PR UI; p1.5 AC3a — stopwatch during live `/checkpoint` invocation). `npm test` covers only the automated unit/integration layer. Check each test plan's AC coverage table for rows where only `Manual` is ticked; those require operator validation after the automated layer passes.
6. **Do not run `npm test` mid-stream.** The 22-check suite validates structural completeness of the full repo (skill-contracts expects 37 skills; pipeline-paths expects 14 paths and 32 reader links; workspace-state requires both `cycle.discovery` and `cycle.benefitMetric` blocks). Running it after a single story will produce expected failures because downstream artefacts do not yet exist. Run `npm test` only at the two gate points: (a) after all Phase 1 stories are applied — must be 22/22 before starting Phase 2; (b) after all Phase 2 stories are applied — final gate.
7. **p2.6 requires a decisions log entry before any code is written.** Read [decisions.md — ASSUMPTION-02 and RESOLUTION-ASSUMPTION-02](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md) before implementing p2.6. The DoR was initially BLOCKED because the EA registry field names (`technology.hosting`, `owner`) had not been confirmed. ASSUMPTION-02 confirmed them from the live registry schema at `https://github.com/heymishy/ea-registry` (commit `7d9edae`). The field names in the DoR and test plan already reflect the resolved values — but reading the resolution ensures you understand why `surfaceType` and `teamId` do not appear in the test fixtures.

**Raw URL pattern for fork operators:**
- GitHub: `https://raw.githubusercontent.com/[owner]/[repo]/refs/heads/master/[path]`
- Bitbucket: `https://bitbucket.org/[workspace]/[repo]/raw/master/[path]`

### Phase 1 Stories

p1.3–p1.8 are independent of each other and can be applied in any order after p1.1 and p1.2. p1.2 must come after p1.1 due to the shared `context.yml` schema coordination point (explicitly stated in the p1.2 contract).

| Story | Title | Depends on | DoR | Contract | Test plan |
|-------|-------|-----------|-----|----------|-----------|
| p1.1 | Distribution infrastructure and progressive skill disclosure | — (start here) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.1-distribution-progressive-disclosure-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.1-distribution-progressive-disclosure-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.1-distribution-progressive-disclosure-test-plan.md) |
| p1.2 | Surface adapter model — foundations (git-native, Path B) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.2-surface-adapter-model-foundations-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.2-surface-adapter-model-foundations-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.2-surface-adapter-model-foundations-test-plan.md) |
| p1.3 | Assurance agent as automated CI gate | p1.1, p1.2 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.3-assurance-agent-ci-gate-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.3-assurance-agent-ci-gate-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.3-assurance-agent-ci-gate-test-plan.md) |
| p1.4 | Watermark gate | p1.2, p1.3 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.4-watermark-gate-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.4-watermark-gate-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.4-watermark-gate-test-plan.md) |
| p1.5 | `workspace/state.json` and session continuity | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.5-workspace-state-session-continuity-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.5-workspace-state-session-continuity-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.5-workspace-state-session-continuity-test-plan.md) |
| p1.6 | Living eval regression suite (`workspace/suite.json`) | p1.3 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.6-living-eval-regression-suite-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.6-living-eval-regression-suite-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.6-living-eval-regression-suite-test-plan.md) |
| p1.7 | Standards model — Phase 1 disciplines (software-eng, security-eng, QA) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.7-standards-model-phase1-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.7-standards-model-phase1-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.7-standards-model-phase1-test-plan.md) |
| p1.8 | Model risk documentation (`MODEL-RISK.md`) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.8-model-risk-documentation-test-plan.md) |

**Phase 1 gate:** Run `npm test` (22/22 expected) before proceeding to Phase 2. If any check fails, fix it before starting p2.1 — Phase 2 stories build on top of Phase 1 structural files and will behave incorrectly if the Phase 1 baseline is broken.

### Phase 2 Stories

Stories p2.1–p2.5b each have a separate DoR contract file. Stories p2.6–p2.12 were delivered under a streamlined DoR process — the DoR file is the complete spec; no separate contract file was produced. All Phase 2 stories depend on all Phase 1 stories being DoD-complete; the "Depends on" column lists cross-Phase-2 dependencies only.

| Story | Title | Depends on | DoR | Contract | Test plan |
|-------|-------|-----------|-----|----------|-----------|
| p2.1 | `/definition` skill improvements (D1/D2/D3) | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.1-definition-skill-improvements-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.1-definition-skill-improvements-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.1-definition-skill-improvements-test-plan.md) |
| p2.2 | `/review` incremental state write | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.2-review-incremental-write-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.2-review-incremental-write-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.2-review-incremental-write-test-plan.md) |
| p2.3 | DoR/DoD template improvements | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.3-dor-dod-template-improvements-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.3-dor-dod-template-improvements-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.3-dor-dod-template-improvements-test-plan.md) |
| p2.4 | `AGENTS.md` adapter (non-GitHub inner loop support) | p1.1 (assembly script), p1.2 (surface adapter) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.4-agents-md-adapter-test-plan.md) |
| p2.5a | IaC + SaaS-API surface adapters | p1.2 (`execute()` interface) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5a-iac-saas-api-adapters-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5a-iac-saas-api-adapters-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.5a-iac-saas-api-adapters-test-plan.md) |
| p2.5b | SaaS-GUI + M365-admin + manual surface adapters | p1.2 (`execute()` interface), p2.5a | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5b-saas-gui-m365-manual-adapters-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5b-saas-gui-m365-manual-adapters-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.5b-saas-gui-m365-manual-adapters-test-plan.md) |
| p2.6 ¹ | EA registry resolver (Path A) | p1.2 (`execute()` interface), p2.5a, p2.5b | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.6-ea-registry-path-a-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.6-ea-registry-path-a-test-plan.md) |
| p2.7 | Fleet registry CI aggregation | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.7-fleet-registry-ci-aggregation-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.7-fleet-registry-ci-aggregation-test-plan.md) |
| p2.8 | Non-engineer approval interface (approval-channel adapter) | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.8-persona-routing-non-engineer-approval-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.8-persona-routing-non-engineer-approval-test-plan.md) |
| p2.9 | 8 remaining discipline standards (POLICY.md floors) | p1.7 (Phase 1 standards model) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.9-discipline-standards-remaining-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.9-discipline-standards-remaining-test-plan.md) |
| p2.10 | Bitbucket Pipelines CI topology validation | p1.3 (CI gate exists to port) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.10-bitbucket-ci-validation-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.10-bitbucket-ci-validation-test-plan.md) |
| p2.11 | Improvement agent — failure pattern detection and diff proposal | p1.3 (CI gate trace files), p1.6 (suite.json) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.11-improvement-agent-trace-proposals-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.11-improvement-agent-trace-proposals-test-plan.md) |
| p2.12 | Improvement agent — challenger pre-check and proposal review | p2.11 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.12-improvement-agent-challenger-skill-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.12-improvement-agent-challenger-skill-test-plan.md) |

**¹ p2.6 — ASSUMPTION-02 resolution required before implementation.** The DoR was initially BLOCKED because the EA registry field names had not been confirmed. Read [decisions.md — ASSUMPTION-02 and RESOLUTION-ASSUMPTION-02](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md) before writing any code. The resolved field mapping is: `technology.hosting` (enum `saas`/`cloud`/`on-prem`/`hybrid`) → surface type; `owner` → squad identifier; `adapter_override` in `context.yml` (not in registry schema) → granular surface type override for `saas-gui` and `m365-admin`. The DoR and test plan fixtures already reflect these resolved values — reading the resolution log explains why `surfaceType` and `teamId` do not appear anywhere in the implementation.

**Phase 2 gate:** Run `npm test` (22/22 expected). All checks must pass before claiming Phase 2 complete. Note: the 3 `[PREREQ-DOCKER]` tests in p2.10 are deferred — they require a Docker-enabled runner (see Section 3.2). The remaining 19 automated checks will all pass without Docker.

### Phase 3 Stories

Phase 3 stories are grouped into the governance hardening batch (p3.1x), the T3M1 audit gap closure batch (p3.2x), retrospective coverage stories (p3.15–p3.17), and /improvement write-backs (p3.18–p3.22). 18 stories defined; 11 DoD-complete as of 2026-04-17. Stories p3.3–p3.14 are defined in the Phase 3 outer loop (stories/ folder) but have no DoR artefacts yet — they are in the inner loop queue for the next Phase 3 sprint.

**All Phase 3 stories depend on all Phase 1 and Phase 2 stories being DoD-complete.** The "Depends on" column lists cross-Phase-3 dependencies only.

Stories p3.1a–p3.1e and p3.2a/p3.2b each have a separate DoR contract file. Retrospective and improvement stories (p3.15–p3.22) use a streamlined DoR — no separate contract file.

| Story | Title | DoD? | Depends on | DoR | Contract | Test plan |
|-------|-------|------|-----------|-----|----------|-----------|
| p3.1a | Trace-commit observability | ✅ PR #94 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1a-trace-commit-observability-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1a-trace-commit-observability-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.1a-trace-commit-observability-test-plan.md) |
| p3.1b | Assurance gate substantive checks | ✅ | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1b-assurance-gate-substantive-checks-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1b-assurance-gate-substantive-checks-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.1b-assurance-gate-substantive-checks-test-plan.md) |
| p3.1c | Test suite integrity | ✅ PR #85 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1c-test-suite-integrity-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1c-test-suite-integrity-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.1c-test-suite-integrity-test-plan.md) |
| p3.1d | Bitbucket DC auth tests resolved | ✅ PR #78 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1d-bitbucket-dc-auth-tests-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1d-bitbucket-dc-auth-tests-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.1d-bitbucket-dc-auth-tests-test-plan.md) |
| p3.1e | Agent behaviour observability register | ✅ PR #77 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1e-agent-behaviour-observability-register-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.1e-agent-behaviour-observability-register-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.1e-agent-behaviour-observability-register-test-plan.md) |
| p3.2a | T3M1 trace fields — Q2/Q5/Q6/Q7 schema and gate | ✅ PR #86 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2a-t3m1-trace-fields-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2a-t3m1-trace-fields-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.2a-t3m1-trace-fields-test-plan.md) |
| p3.2b ² | T3M1 tamper-evidence registry — Q8 | ⏳ in progress | p3.2a | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2b-t3m1-tamper-evidence-registry-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.2b-t3m1-tamper-evidence-registry-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.2b-t3m1-tamper-evidence-registry-test-plan.md) |
| p3.15 | `/estimate` skill — retrospective coverage | ⏳ DoR-signed | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.15-estimate-skill-retrospective-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.15-estimate-skill-retrospective-test-plan.md) |
| p3.16 | `/issue-dispatch` skill — retrospective coverage | ⏳ DoR-signed | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.16-issue-dispatch-skill-retrospective-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.16-issue-dispatch-skill-retrospective-test-plan.md) |
| p3.17 | Repo-tidy docs-structure — retrospective coverage | ⏳ DoR-signed | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.17-repo-tidy-docs-structure-retrospective-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.17-repo-tidy-docs-structure-retrospective-test-plan.md) |
| p3.18 | `/definition` skill quality gates | ✅ PR #99 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.18-definition-skill-quality-gates-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.18-definition-skill-quality-gates-test-plan.md) |
| p3.19 | Guardrail enum enforcement in DoR/DoD | ✅ PR #99 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.19-guardrail-enum-enforcement-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.19-guardrail-enum-enforcement-test-plan.md) |
| p3.20 | `workspace/state.json` write-path safety | ✅ PR #99 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.20-state-write-safety-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.20-state-write-safety-test-plan.md) |
| p3.21 | Systematic-debugging coupled-change workflow | ✅ PR #99 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.21-debugger-coupling-map-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.21-debugger-coupling-map-test-plan.md) |
| p3.22 | `/verify-completion` second-session check + conflict-resolution-guide | ✅ PR #100 | — | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/dor/p3.22-verify-completion-second-session-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/test-plans/p3.22-verify-completion-second-session-test-plan.md) |

**² p3.2b — DEC-P3-002 required before implementation.** Read [decisions.md — DEC-P3-002](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-14-skills-platform-phase3/decisions.md) before writing any code. The tamper-evidence registry is implemented using GitHub Artifact Attestation with OIDC-signed workflow identity in the reference repository (Option A). Enterprise operators on Bitbucket must implement Option B (see DEC-P3-002 and Section 2 of this document for the full constraint table). The DoR and test plan already reflect the resolved approach — reading the decision log explains why the implementation diverges between the reference repo and enterprise deployments.

**Stories p3.3–p3.14** (defined in outer loop, no DoR yet): gate structural independence (p3.3), eval anti-gaming controls (p3.4), Windows-native trace validator (p3.5), pipeline-evolution dispatch (p3.6), cross-team trace registry (p3.7), enterprise approval channel adapters (p3.8), AGENTS.md compatibility matrix (p3.9), EA registry live integration (p3.10), estimation calibration eval (p3.11), squad contribution flow (p3.12), compliance monitoring report (p3.13), concepts documentation (p3.14). These remain in-scope for Phase 3 completion. View story definitions at: [`artefacts/2026-04-14-skills-platform-phase3/stories/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-14-skills-platform-phase3/stories).

**Phase 3 gate (in progress):** Run `npm test` after all Phase 3 stories are applied. T3M1 must reach 8/8 Y (Q8 requires p3.2b to be DoD-complete) before the Phase 3 exit criterion is satisfied. See `workspace/adoption-readiness.md` for current RAG status across all benefit metrics.
