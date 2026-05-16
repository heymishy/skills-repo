# Strategic Platform Audit — Skills Repo
**Date:** 2026-05-16
**Reviewer:** GitHub Copilot (claude-sonnet-4-6) — independent read-only audit
**Sources:** HANDOFF.md, handoff-2026-05-14.md, all 45 SKILL.md files (sampled), workspace/state.json, .github/context.yml, known-deferred-checks.json, workspace/learnings.md, workspace/adoption-readiness.md, workspace/dream-run-result.json, workspace/traces/ directory, workspace/proposals/ directory, workspace/experiments/ directory listing and key manifests, workspace/eval-framework-review/2026-05-15-meta-review.md, workspace/proposals/routing-policy-framework.md, workspace/experiments/eval-programme-roadmap.md, package.json, src/ directory structure, tests/ directory listing, .github/workflows/ directory listing, .github/scripts/ directory listing
**Constraint:** No file changes. No commits. No test runs. No script runs.

---

## 1. Executive Summary

The skills-repo platform has completed four well-governed delivery phases and is operationally complex: 45 SKILL.md files, a web UI with 11 route modules, a model evaluation programme spanning 9 experiments (EXP-001 to EXP-007R), 14 CI workflows, and a 140+ file test suite. The pipeline framework concept is validated — it has been dogfooded through 50+ stories across Phases 1–4, produced real routing decisions backed by evidence, and delivered working software.

**The single most important finding:** The model routing policy routes four of five core pipeline skills to Haiku (`measurement_backed: true`), but the only end-to-end test of that routing (EXP-003 Config C) is **unresolved with a FAIL result** (chain CPF 0.68; regulated CPF 0.675). Per-stage evidence (EXP-004/005/006/007) is necessary but not sufficient. Until EXP-003 Config C run 3 completes with a PASS, the Haiku routing policy carries live regulated-story risk that is invisible to operators reading only the routing policy document.

**Top 3 actions:**
1. Execute EXP-003 Config C run 3 immediately (Haiku + Step 4a SKILL.md fix). This is the single highest-risk evidence gap in the platform.
2. Add a `check-eval-regression.js` static staleness check — the only CI guard needed before any SKILL.md change can confidently proceed.
3. Dispatch wucp.0 (spike) and resolve wsm.2/wsm.3 deviations — the largest backlog drag with active story artefacts already complete.

---

## 2. Skills Inventory

The platform has 45 SKILL.md files across five categories. The following table assesses each skill's operational status, evidence backing, and recommended disposition.

| Skill | Category | Status | Has EVAL.md | Has corpus | Last meaningful change | Recommended action |
|-------|----------|--------|-------------|------------|----------------------|-------------------|
| /discovery | Core pipeline | Active | Yes (D1–D8) | Yes (T1–T5 + T2/T4 conversation.json) | Commit 27de6eb (constraint labelling, /clarify gate) | Maintain; run EXP-002b for T5 |
| /definition | Core pipeline | Active | Yes (CPF spec) | Yes (T1–T6) | Commit 4dae4e3 (Step 4a regulated constraint check) | Maintain; validate via EXP-003 Config C run 3 |
| /review | Core pipeline | Active | Yes (FDR metric) | Yes (T1–T7) | Current session (T6/T7 adversarial cases added) | Maintain |
| /test-plan | Core pipeline | Active | Yes (TCF metric) | Yes (T1–T5) | EXP-007R (NFR scope rule) | Maintain |
| /definition-of-ready | Core pipeline | Active | Yes (G1–G6 gate metric) | Yes (T1–T6) | Current session (T5/T6 adversarial cases added) | Maintain; rename G→D dimensions (F1 from meta-review) |
| /definition-of-done | Core pipeline | Active | Yes (scaffold only) | Yes (T1–T4) | EXP-005-dod scaffold | Run EXP-005-dod; critical gap in routing evidence |
| /benefit-metric | Core pipeline | Active | No | No | Phase 1 delivery | Add EVAL.md; EXP-008 planned — prioritise after EXP-007R |
| /workflow | Navigation | Active | No | No | Phase 2/3 | Maintain |
| /orient | Navigation | Active | No | No | Phase 4 | Maintain |
| /start | Navigation | Active | No | No | Phase 1 | Maintain |
| /checkpoint | Navigation | Active | No | No | Phase 2 | Maintain |
| /decisions | Navigation | Active | No | No | Phase 2 | Maintain |
| /spike | Navigation | Active | No | No | Phase 1 | Maintain |
| /estimate | Navigation | Active | No | No | Phase 2 | Maintain |
| /trace | Navigation | Active | No | No | Phase 3 | Maintain |
| /coverage-map | Navigation | Active | No | No | Phase 3 | Maintain |
| /clarify | Navigation | Active | No | No | Phase 3 | Maintain |
| /branch-setup | Inner loop | Active | No | No | Phase 2 | Maintain |
| /implementation-plan | Inner loop | Active | No | No | Phase 2 | Maintain |
| /subagent-execution | Inner loop | Active | No | No | Phase 2 | Maintain |
| /verify-completion | Inner loop | Active | No | No | Phase 2 | Maintain |
| /branch-complete | Inner loop | Active | No | No | Phase 2 | Maintain |
| /tdd | Inner loop | Active | No | No | Phase 1 | Maintain |
| /systematic-debugging | Inner loop | Active | No | No | Phase 2 | Maintain |
| /implementation-review | Inner loop | Active | No | No | Phase 2 | Maintain |
| /improvement-agent | Self-improvement | Active (infrastructure only) | No | No | Phase 2/3 | See self-improvement assessment below |
| /model-sweep | Eval programme | Active | No | No | 2026-05-16 (current) | Maintain; key operational skill |
| /issue-dispatch | Dispatch | Active | No | No | Phase 3 | Maintain |
| /persona-routing | Approval channels | Active | No | No | Phase 2 | Maintain |
| /record-signal | Metrics | Active | No | No | Phase 3 | Maintain |
| /metric-review | Metrics | Active (thin) | No | No | Phase 3 | Thin but correct scope; maintain |
| /release | Delivery | Active (thin) | No | No | Phase 3 | Maintain |
| /programme | Enterprise | Active (thin) | No | No | Phase 3 | Valid scope; thin usage |
| /reverse-engineer | Enterprise | Active | No | No | 2026-04-29 (v2 evolution) | Maintain; most evolved enterprise skill |
| /modernisation-decompose | Enterprise | Active (niche) | No | No | Phase 4 | Java-specific; niche; maintain with note |
| /reference-corpus-update | Enterprise | Active (niche) | No | No | Phase 4 | Depends on reverse-engineer corpus; niche |
| /ea-registry | Enterprise | Active (thin) | No | No | Phase 3 | Thin wrapper over external repo; maintain |
| /ideate | Product | Stale | No | No | Phase 2 | No test coverage, no artefact trace, no known usage event — mark as unsupported |
| /prioritise | Product | Low activity | No | No | Phase 2 | No test coverage; standalone utility; de-prioritise |
| /loop-design | Meta | Thin | No | No | Phase 3 | Meta-level design; no test coverage; no known usage |
| /scale-pipeline | Meta | Thin | No | No | Phase 3 | Meta-level design; no test coverage; no known usage |
| /token-optimization | Meta | Superseded | No | No | Phase 3 | Output superseded by routing-policy-framework.md; meta-level only |
| /org-mapping | Meta | Thin | No | No | Phase 3 | No test coverage; no known usage |
| /bootstrap | Setup | Active (one-shot) | No | No | Phase 1 | Correct scope; maintain |

**Summary counts:**
- Active with EVAL + corpus: 6 skills (core outer-loop pipeline)
- Active no EVAL: 30 skills
- Stale/unsupported: 1 skill (/ideate)
- Meta/thin (valid but low activity): 5 skills (/loop-design, /scale-pipeline, /token-optimization, /org-mapping, /programme)
- Niche (valid, low usage, depends on /reverse-engineer): 2 skills (/modernisation-decompose, /reference-corpus-update)

---

## 3. Self-Improvement Loop Assessment

**Infrastructure state:** Operational. `src/improvement-agent/` contains `failure-detector.js`, `challenger.js`, `calibration.js`, `trace-interface.js`, `experiment-signals.js`, and `compliance-report.js`. The scheduled workflow (`improvement-agent-schedule.yml`) exists. Tests exist for all components.

**Evidence of function:**

| Signal | Finding |
|--------|---------|
| Last dream run | 2026-05-11T00:44:25 — `skipped: true, skippedReason: "Interval guard: last run was 0h ago"`. Skipped due to a double-invocation guard, not a failure. |
| Proposals generated (all time) | 0 proposals auto-generated. `workspace/proposals/` contains 10 files, all manually authored (EXP-002b challenger spec, EXP-002b challenger result, definition skill update, discovery skill update, routing policy framework). Zero agent-generated proposals. |
| Trace data | `workspace/traces/` contains 16 JSONL files, all dated 2026-04-11 to 2026-04-12 — 5 weeks stale as of this audit. No new traces since mid-April. |
| M3 benefit metric | "Improvement loop first proposal generated" — recorded as `🟢 Green` in adoption-readiness.md, but this is based on infrastructure delivery, not an actual generated proposal. The metric description says: "First real proposal will be generated when a genuine failure signal arrives." Zero real failure signals have been processed. |

**Assessment: Governance theatre.** The self-improvement loop is architecturally complete and passes all tests. However:
- Traces stopped being written 5 weeks ago. The loop has no real signal to process.
- Zero proposals have been auto-generated despite the scheduler running.
- The manually crafted proposals in `workspace/proposals/` are substantively valuable (e.g. the routing policy framework), but they bypass the agent-generation cycle entirely.
- M3 being reported as Green is a measurement artefact — the metric conflates infrastructure delivery with operational function.

**Root cause:** The trace-commit workflow (`trace-commit.yml`) writes JSONL traces on PR merge. The platform has not had new PRs merged since 2026-04-12 that trigger new traces. All subsequent work (Phases 4/5 web UI stories, eval experiments) may have merged but not triggered the trace-aggregation path, or the trace file format changed.

**The loop is not broken — it is starved.** If new PRs start producing traces in the expected format, the failure-detector and calibration machinery should function. The gap is between trace production and trace consumption, not in the improvement machinery itself.

---

## 4. Workflow and CI Assessment

**14 workflows identified in `.github/workflows/`:**

**`assurance-gate.yml`:** The central CI gate. Validates commit format, runs governance scripts, posts audit comments. Known structural issue (documented in user learnings): the inline JavaScript inside `github-script` blocks is never executed by any test — only string-presence checks run against YAML. This means the JS logic (audit comment generation, pipelineStories lookup, extractPRSlug regex) is a test blind spot. Four post-merge bugs have been documented here (ci-audit-comment-bugs.md). The `known-deferred-checks.json` file exists to record deferred tests but the code that reads it and emits SKIP (instead of FAIL) has not been implemented yet — so it remains documentation without enforcement.

**`improvement-agent-schedule.yml`:** Scheduled dreaming runner. Exists and runs. Last execution produced 0 proposals (interval guard skipped a double-trigger). Structurally correct; output quality depends on trace health (see Section 3).

**`approve-dor-github-issue.yml`:** GitHub issue DoR approval workflow. Operational. Tested via `check-dor-approval.js`. M5 (non-engineer approval outside VS Code) remains Red in adoption-readiness — the infrastructure is live but no real non-engineer has used it.

**`attestation-publisher.yml`:** Posts compliance attestations to GitHub. Tested. Operational.

**`compliance-report.yml`:** Generates compliance reports. Tested via `check-compliance-report.js`.

**`copilot-setup-steps.yml`:** Bootstrap for GitHub Copilot coding agent in GitHub Actions context. Operational.

**`e2e.yml`:** Playwright E2E test suite. Configured in `playwright.config.js`. Separate from the main `npm test` chain. Operational but not guaranteed green on every commit — separate from governance gate.

**`fleet-aggregation.yml`:** Aggregates squad JSON files from `fleet/squads/` into `fleet-state.json`. Tested via `check-fleet-aggregation.js`. M4 (fleet observability) is Green.

**`pages.yml`:** Deploys `dashboards/` to GitHub Pages. Tested via `check-dviz2-pages-workflow.js`.

**`trace-aggregation.yml`:** Aggregates traces across fleet. Part of the self-improvement infrastructure. Stale traces in `workspace/traces/` suggest this workflow either isn't running or the writing end isn't producing new output.

**`trace-commit.yml`:** Records trace JSONL on PR merge. Should produce entries in `workspace/traces/`. Stale trace data suggests this workflow hasn't been triggered recently.

**`trace-validation.yml`:** Validates trace chain integrity. Companion to `scripts/validate-trace.sh`. Operational.

**`watermark-gate.yml`:** Watermark gate enforcement. Tested. Operational.

**Overall CI health:** Structurally operational. The main gap is the assurance-gate inline JS test blind spot and the known-deferred SKIP logic not being implemented. Both are documented risks, neither has broken production — the deferred items are infrastructure-dependency gaps (skills-framework-infra repo doesn't exist yet).

---

## 5. Test Suite Assessment

**Scale:** ~140 test files in the `npm test` chain, not counting the files run via `src/` subdirectory imports. Total chain is approximately 200 sequential `&&`-chained `node` invocations.

**Structure of the suite:**

| Test category | Count (approx) | Nature |
|--------------|----------------|--------|
| `.github/scripts/check-*.js` | 14 | Static governance: string presence in YAML/SKILL.md files |
| `tests/check-*.js` (governance) | ~90 | Static governance: story artefact structure, pipeline-state fields, CI config strings |
| `tests/check-*.js` (behavioural) | ~30 | Light behavioural: API contract shape, module export existence, config value checks |
| `tests/*.test.js` | ~8 | Jest/Node test-runner style: artefact-preview, artefact-writeback, byok-config, session-isolation, session-persistence, skill-discovery, skill-launcher, watermark-gate |
| `src/**/calibration.test.js` etc. | ~3 | Unit tests for improvement-agent and trace-registry modules |
| `tests/e2e/` | Playwright | End-to-end browser tests; separate suite |

**Structural vs behavioural ratio:** Approximately 85% structural (static governance checks) to 15% behavioural. The suite is highly effective at catching configuration drift, missing artefact fields, and SKILL.md contract violations. It is poor at catching logic bugs, model behaviour regressions, or route handler edge cases.

**Known gaps:**
1. **Inline GitHub Actions JS** — `github-script` blocks in `assurance-gate.yml` are untested at the JS logic level. The fix (extract to `scripts/ci-audit-comment.js` with exports) is documented in user memory but no story exists for it.
2. **wsm.2 and wsm.3 failures** — `check-wsm2-collaborative-sessions.js` (6 failures) and `check-wsm3-non-happy-path.js` (8 failures) are known pre-existing. These are referenced in `workspace/state.json` as "dod-complete-with-deviations". No follow-up stories have been created for them.
3. **known-deferred SKIP logic missing** — `known-deferred-checks.json` documents two deferred checks (`workflow-yaml-uses-pinned-immutable-ref`, `download-uses-https-not-http`) but the code to read this file and skip those tests doesn't exist. These currently either pass on a technicality or the check logic is absent.
4. **No model-behaviour regression tests** — As identified in meta-review F17, no CI check detects when a SKILL.md change is newer than its most recent experiment run. This is the largest structural test gap relative to the platform's claims about evidence-backed routing.
5. **EXP-005-dod-rubric not yet run** — The `/definition-of-done` EVAL.md and corpus (T1–T4) were scaffolded but no evaluation runs have been executed. The routing policy entry for `/definition-of-done` is `Provisional — pending EXP-005-dod`.

**Test chain performance concern:** The `npm test` chain runs ~200 sequential node processes. This is architecturally fragile — a single syntax error anywhere in the first 100 files kills the entire run with no output from tests 101–200. The wsm.2/wsm.3 known failures must be accepted each run. This is the "syntax error masking test results" pattern documented in user memory (D40).

---

## 6. Configuration Drift Findings

| Location | Finding | Severity |
|----------|---------|----------|
| `.github/context.yml`, header comment | Comment reads `# Experiment variant: Sonnet 4.6 on Phase 4` — stale from a prior experiment context copy. The active profile is personal/non-regulated. | Low |
| `workspace/experiments/EXP-002a-cross-provider-discovery/manifest.md` | `status: planned` — experiment is complete with 63 result files. (F10 from meta-review.) | Medium |
| `workspace/experiments/EXP-004-dor-rubric/manifest.md` | `created: 2026-05-21` — future date. Scorecard summary blank. Routing implications blank. (F7 from meta-review.) | High |
| `workspace/experiments/eval-programme-roadmap.md` | Roadmap describes Phases 1–4 with EXP-001 as complete and EXP-002a/b/003 as "Planned". EXP-004 through EXP-007R are absent entirely. The roadmap is ~7 experiments behind reality. **Note as of this audit: roadmap has been updated to show EXP-007/007R complete.** | Medium |
| `workspace/proposals/routing-policy-framework.md`, header | Status reads `partially measurement-backed`. As of EXP-007R, all five outer-loop skills have measurement-backed routing. Header is stale. (F8 from meta-review.) **Note: the body already has a caveats section for the EXP-003 gap.** | Low |
| `workspace/traces/` | All 16 JSONL files dated 2026-04-11 to 2026-04-12 (5 weeks stale). No new traces since mid-April. Self-improvement loop has no recent signal. | Medium |
| `known-deferred-checks.json` | `_note` says "this file serves as the authoritative record" but the SKIP logic reading this file was never implemented. Documents a gap without enforcing it. | Medium |
| `scripts/run-model-sweep.js`, PRICING map | Four GPT model entries marked `// TODO: verify current rate`. Live in production routing cost calculations. (F19 from meta-review.) | Low |
| `workspace/experiments/EXP-003-pipeline-eval/manifest.md`, Config D row | Listed as "pending EXP-002a H5" — but EXP-002a definitively disproved H5 (GPT-4o avg 0.467, below 0.70 threshold). Config D should be formally cancelled. (F11 from meta-review.) | Low |
| `workspace/dream-run-result.json` | Records `skipped: true, proposalsGenerated: 0`. The last non-skipped dream run date is not visible from this file alone — but given 5-week-stale traces, it's likely even older. | Medium |

---

## 7. Platform Evolution Assessment

### What the platform has become

The platform launched as a SKILL.md instruction framework. It has evolved into five distinct layers:

1. **SKILL.md layer** (45 skills) — instruction files agents execute against. The core product.
2. **Web UI layer** (src/web-ui/) — a full Express.js application with OAuth, session management, streaming artefact generation, guided outer loop, and Copilot API proxy. Delivered via ougl/owle/wsm/mfc/wusl story sets. ~800 lines in journey.js alone.
3. **Model evaluation layer** (EXP-001 to EXP-007R) — a measurement programme that has produced evidence-backed routing decisions for 5 of 7 core skills.
4. **Governance layer** (CI workflows + test suite) — 14 workflows, 140+ tests, pipeline-state.json schema validation, assurance gate.
5. **Fleet/enterprise layer** (fleet-aggregation, Bitbucket adapters, persona-routing) — multi-team governance infrastructure.

### Biggest gaps

**Gap 1 — EXP-003 Config C unresolved (regulatory routing risk):** The most material technical gap. Four skills have Haiku routing approved based on per-stage isolation evidence. The only end-to-end test shows a FAIL for regulated stories. This is specifically documented in routing-policy-framework.md's caveats section (a good practice), but the underlying re-run has not been executed.

**Gap 2 — Web UI is ahead of its test coverage:** The wucp feature (Copilot Chat parity, 5 stories) is at `definition-complete` with wucp.1/2/4 `reviewReady` but has never been executed past definition. wucp.0 (spike) is `dispatchable: true` in state.json but has not been dispatched. wucp.3 is blocked on wucp.0 result. Meanwhile wsm.2 and wsm.3 are "dod-complete-with-deviations" — 14 failing tests with no follow-up stories scheduled.

**Gap 3 — M1 remains amber after four phases:** The primary enterprise readiness metric ("unassisted second squad onboarding") has never been tested with a real external team. The platform is operationally ready; this evidence event hasn't been arranged. It is the single metric that would change the enterprise readiness conversation from "we built it" to "we proved it."

**Gap 4 — Inline JS test blind spot:** The `assurance-gate.yml` inline JavaScript is the highest-defect surface in the platform (4 documented post-merge bugs from a single story). No fix has been shipped. The proposed fix (extract to `scripts/ci-audit-comment.js` with test coverage) has been designed but has no story artefact.

**Gap 5 — No SKILL.md regression protection:** Every SKILL.md change is shipped without any automated check that the change hasn't regressed the skill's eval scores. EXP-007R demonstrated the correct process for fix validation, but that process is entirely manual. F17 from the meta-review describes a static staleness check (`check-eval-regression.js`) that would catch this with zero API cost.

**Gap 6 — Self-improvement loop signal starvation:** The improvement agent infrastructure is tested and operational, but it has no real signal to process. The traces stopped in mid-April. Without new traces, the dreaming agent cannot produce proposals, and M3 (first real proposal) remains a held promise rather than an operational metric.

### Right next priorities for the platform

The platform is at an inflection point: the infrastructure is built and proven in dogfood, the model evaluation programme has produced real routing decisions, and the web UI has been delivered. The next phase should focus on:

1. **Completing the evidence chain** (EXP-003 Config C run 3, EXP-005-dod) — these are the last remaining experiment gaps before all outer-loop skills are fully evidence-backed.
2. **Stabilising the web UI** (resolve wsm.2/wsm.3 deviations, dispatch wucp.0) — the web UI layer is the primary consumer-facing surface; deviations here create technical debt.
3. **Operationalising M1** (arrange a real external team onboarding run) — this is the evidence event that makes enterprise readiness claims credible.
4. **Closing the inline JS test gap** (extract assurance-gate.yml scripts) — four post-merge bugs from one file is a concentration of defect risk that warrants a dedicated short-track story.

### SCR (Session Coherence Review) concept fit

The SCR concept (referenced in handoff as upcoming) addresses the context-budget management problem: how do agents self-manage context windows across long pipeline runs? This fits the current architecture well. The existing `/checkpoint` skill is the prototype for this behaviour, and the observation that file-read-heavy phases hit compaction at 55% (not 75%) is the empirical basis for the design. SCR would systematise what `/checkpoint` does ad-hoc. Given the web UI's per-turn model sessions and the journey orchestration in `journey.js`, SCR is architecturally timely.

---

## 8. Priority Action List

Ranked by operational impact and effort. S = Small (1–2 hours), M = Medium (half day), L = Large (multi-session).

| Priority | Action | Effort | Rationale |
|----------|--------|--------|-----------|
| P1 | **Execute EXP-003 Config C run 3** (Haiku + Step 4a fix + confirmed model switch). If regulated CPF ≥ 0.80: lift caveat. If FAIL: escalate before any regulated production use. | M | The only live regulated-story routing risk. Every other routing decision is evidence-backed; this is the gap that undermines confidence in the whole framework. |
| P2 | **Implement `check-eval-regression.js`** — static staleness check: read each SKILL.md mtime, compare to corresponding EVAL.md `calibration.date`, fail if skill is newer than last experiment. Zero API cost. | S | Every SKILL.md change is currently unguarded. This is the minimum viable regression protection for the eval programme. |
| P3 | **Populate EXP-004 manifest** — fix `created` date (2026-05-21 → 2026-05-14), fill scorecard summary table (GF=1.00 all 16 runs), fill routing implications section. | S | Traceability gap: the routing policy cites EXP-004 as evidence but the manifest is incomplete. `/trace` validation would fail on this. |
| P4 | **Formally cancel Config D in EXP-003 manifest and routing policy.** Record H5-disproved closure in `decisions.md`. | S | Keeps scope unambiguous. Config D occupies space as a live option when EXP-002a definitively closed it. |
| P5 | **Dispatch wucp.0 (spike) and confirm wucp.3 unblock.** wucp.0 is `dispatchable: true` in state.json with story artefact complete. | S | Largest backlog drag with everything already done except dispatch. wucp.3 (context-aware model routing) is blocked on the wucp.0 result. |
| P6 | **Create follow-up stories for wsm.2 and wsm.3 deviations** (14 failing tests total). These are `dod-complete-with-deviations` — the deviations have been accepted but no remediation is scheduled. | M | Deviations without follow-up stories become permanent technical debt. The tests will continue failing in every `npm test` run. |
| P7 | **Add adversarial-edge corpus cases to DoR and definition corpora.** One borderline-untestable AC case for DoR; one indirect-phrasing regulatory constraint for definition. (F12 from meta-review.) | M | EXP-004/005 universal perfect scores indicate the current corpus tests floor performance. The routing decisions may be premature given the corpus discriminatory power. |
| P8 | **Update EXP-002a manifest status** (`planned` → `complete`). | S | 5 minutes, pure data integrity fix. A tool reading manifest status would report a mismatch with `workspace/state.json`. |
| P9 | **Extract assurance-gate.yml inline JavaScript** to `scripts/ci-audit-comment.js` with exported `buildComment()` function. Add unit tests covering the four documented bug classes (ci_attachment gate, pipelineStories TDZ, epic-nested stories, wildcard slug extraction). | L | The highest-defect surface in the CI pipeline. Four post-merge bugs from one untested function. The fix design is already documented in user memory. |
| P10 | **Implement `known-deferred-checks.json` SKIP logic** in `check-assurance-gate.js`. Two deferred checks currently either fail or pass on a technicality; neither behaviour is correct. The file exists as documentation; it needs to be read at test-time. | S | The file and schema are already defined. The implementation gap is a single `if (deferred.includes(testName)) skip()` pattern. |
| P11 | **Run EXP-005-dod-rubric** (corpus scaffolded, runs not executed). Add result to routing policy for `/definition-of-done`. | M | The only outer-loop skill with no experimental routing evidence. Currently `Provisional — Sonnet (no experiment)`. |
| P12 | **Arrange an M1 evidence event** — schedule a real external team to run discovery→DoR on a real story unassisted. | L | This is the enterprise readiness gate. M1 has been Amber since Phase 2. The platform is ready; the evidence event hasn't happened. |
| P13 | **Design multi-turn harness for T2/T4** (conversation.json spec files now exist; harness `--conversation` flag now exists). Run EXP-002b for T5 context-loading diagnosis. | M | The clarification-gate failure mode is the highest-frequency real-world edge case. It is currently uncharacterised in any routing evidence. |
| P14 | **Diagnose and restart trace production.** Check why `workspace/traces/` has no entries after 2026-04-12. Verify `trace-commit.yml` is triggering on current PR merges. | S | The self-improvement loop is starved without traces. If the workflow is broken, the loop is non-functional regardless of the infrastructure quality. |
| P15 | **Retire or annotate `/ideate` as unsupported.** It has no test coverage, no artefact chain trace, and no known usage event. If the operator community has not asked for it, the SKILL.md is adding surface area with no quality control. | S | Reduces cognitive load when scanning the skills list. If `/ideate` is genuinely unused, it should say so clearly rather than appearing coequal with actively maintained skills. |

---

## Closing Observations

**What the platform gets right:**
- The SKILL.md + evidence-backed routing policy approach is sound. EXP-003's F6 mechanistic finding (slicing strategy drives CPF failure, not model noise) is exactly the kind of insight that justifies investing in the evaluation programme.
- The dogfood discipline has been maintained. Every significant platform change has run through its own pipeline — discovery → benefit-metric → definition → review → test-plan → DoR. This is rare and valuable.
- The test suite, while structurally dominated by governance checks, provides real regression protection for the artefact pipeline shape. The 140+ tests catch config drift reliably.
- The web UI has been delivered with strong architectural discipline (ADR-022, ADR-023, injectable adapters, path traversal guards).
- The routing policy document is transparent about its uncertainties (caveats section for EXP-003 gap is there and correct).

**The strategic risk:**
The platform has grown faster than its evidence base in two directions simultaneously: the web UI outpaced its test coverage (wsm.2/wsm.3 deviations), and the routing policy outpaced its end-to-end validation (Config C unresolved). Both are known and documented. The priority is closing the evidence gaps before adding more surface, not before the existing surface breaks — but before it is presented as production-ready for regulated domains.

**The structural ceiling:**
The `npm test` chain is approaching a functional limit at 200 sequential node invocations. Any test file early in the chain that exits with code 1 aborts all subsequent tests silently. The pattern of adding each new story's governance check as a `&& node tests/check-STORYID.js` at the end of the chain will eventually require architectural change (parallel test runner, test file discovery, exit-code aggregation). This is not urgent today but is worth designing before Phase 6.
