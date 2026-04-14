# Benefit Metric: Skills Platform — Phase 3: Governance Hardening, T3M1 Close, and Enterprise Scale

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Date defined:** 2026-04-14
**Metric owner:** Hamish (platform maintainer)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Phase 3 continues the dogfood delivery model: the platform team delivers Phase 3 using the pipeline it is hardening, simultaneously validating that governance improvements are real rather than nominal. Tier 1 metrics track platform capability outcomes — specifically the T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) gap closure, the enterprise readiness signal, and the governance gate integrity improvements. Tier 2 meta-metrics track what the Phase 3 delivery itself validates about the pipeline: estimation calibration continuity from Phase 2, and whether the test/governance hardening stories (Priority 1) reduce the silent-failure rate observed during Phase 2 delivery.

Tier 3 metrics apply: Phase 3 explicitly targets regulated-enterprise audit readiness. The T3M1 obligation is a compliance metric — it represents the hard entry condition for any audit-readiness claim to a risk function, and it is measurable only by a named external reviewer.

---

## Tier 1: Product Metrics (Platform Capability)

### M1 — T3M1 audit question coverage

| Field | Value |
|-------|-------|
| **What we measure** | Count of MODEL-RISK.md audit questions answered 8/8 by an independent non-engineering reviewer outside the platform engineering reporting line, answering from the trace alone without engineering assistance. |
| **Baseline** | 3/8 at Phase 2 close (Q1, Q3, Q4 answered; Q2, Q5, Q6, Q7, Q8 open). Recorded in MODEL-RISK.md. |
| **Target** | 8/8 — all questions answered, result on record in MODEL-RISK.md with reviewer name, role, date, and per-question verdict. |
| **Minimum validation signal** | 6/8 — at least Q2 and Q7 answered (trace fields present and independently verifiable), even if Q8 (tamper-evidence registry) is still in progress. Below floor: fewer than 5/8 at Phase 3 close. |
| **Measurement method** | Hamish (platform maintainer) arranges an independent review session. The reviewer is given only the repository URL and the trace files — no engineering walkthrough or assisted interpretation. Reviewer records their verdict per question. Result committed to MODEL-RISK.md. |
| **Feedback loop** | If fewer than 8/8 at Phase 3 close: each unanswered question becomes a named carry-forward item in Phase 4 backlog with the specific gap documented. No audit-readiness or regulated-enterprise adoption claim may be made until 8/8 is on record. |

---

### M2 — Assurance gate substantive signal (completedAt duration)

| Field | Value |
|-------|-------|
| **What we measure** | The time delta between `startedAt` and `completedAt` in production assurance gate traces. A delta >5ms confirms that real substantive checks ran; a delta of 1–2ms indicates structural-only check theatre. |
| **Baseline** | Phase 2 actuals: `completedAt` 1–2ms after `startedAt` on production traces. Confirmed by adversarial audit 2026-04-12. |
| **Target** | All post-Phase-3 production traces show `completedAt` >50ms after `startedAt` on a standard CI runner. |
| **Minimum validation signal** | At least one post-Phase-3 trace showing `completedAt` >5ms — confirming at least one substantive check ran. |
| **Measurement method** | Hamish (platform maintainer) inspects `workspace/traces/` after the first Phase 3 story merge. Duration calculated from trace timestamps. Spot-checked on each subsequent Phase 3 PR, recorded in `workspace/results.tsv`. |
| **Feedback loop** | If delta remains ≤5ms after Priority 1B stories are merged: the substantive check implementation did not execute. Treat as a DoD failure for that story. |

---

### M3 — Post-merge silent failure detection rate (trace-commit observability)

| Field | Value |
|-------|-------|
| **What we measure** | Whether `npm test` (including the new `check-trace-commit.js` script) detects a stale or missing `origin/traces` branch within the next test run after a failed post-merge workflow. |
| **Baseline** | Phase 2: 4 silent failures across PRs #51, #52, #56. Each went undetected until manual inspection. Detection time: hours to days. |
| **Target** | Any post-merge workflow failure that leaves the traces branch stale is detected by `npm test` within the next run on master (typically the next PR open/update event). Zero silent failures persisting beyond one CI cycle. |
| **Minimum validation signal** | `check-trace-commit.js` is present in the `npm test` suite and exits 1 when `origin/traces` has no commits in the last 24 hours. Confirmed by running `npm test` on the post-merge state. |
| **Measurement method** | Hamish verifies `check-trace-commit.js` presence and exit behaviour after Priority 1A story is merged. Observable in CI logs on subsequent PRs. |
| **Feedback loop** | If a future trace-commit failure goes undetected by `npm test`: the script's staleness threshold or branch check is incorrect. Treated as a Priority 1A DoD failure; fix before next PR merges. |

---

### M4 — Enterprise approval channel: non-GitHub sign-off end-to-end

| Field | Value |
|-------|-------|
| **What we measure** | Whether a non-engineering approver can complete the DoR sign-off workflow entirely within their existing tooling (Teams or Jira) with no GitHub Issues involvement, and the result correctly appears as `dorStatus: "signed-off"` in `pipeline-state.json`. |
| **Baseline** | Phase 2: GitHub Issue adapter only. No enterprise channel adapter exists. Enterprise adoption blocked. |
| **Target** | At least one complete DoR sign-off executed end-to-end via a Teams or Jira adapter during Phase 3 delivery. Sign-off record in `pipeline-state.json` with the correct `approvalChannel` value. |
| **Minimum validation signal** | At least one enterprise adapter (Teams or Jira) unit-tested against a mock channel API with the full happy-path and a reject-path scenario, and a documented integration test plan with clear runbook for the full end-to-end test. |
| **Measurement method** | Hamish (platform maintainer) executes the adapter end-to-end test as part of DoD verification for the Priority 8 story. Records the approval channel value in `pipeline-state.json` and takes a screenshot of the Teams/Jira interaction. |
| **Feedback loop** | If the adapter unit tests pass but end-to-end integration fails: the integration gap is a DoD failure. Do not close the Priority 8 story until the end-to-end path is confirmed. |

---

### M5 — AGENTS.md adapter: non-GitHub inner loop validated

| Field | Value |
|-------|-------|
| **What we measure** | Whether the AGENTS.md surface adapter correctly routes inner loop instructions for a real non-GitHub agent (Cursor or Claude Code) through a complete story delivery: branch-setup to merged PR, including assurance trace generation. |
| **Baseline** | Phase 2: AGENTS.md adapter delivered but validated only against fixture mocks. No real non-GitHub agent delivery conducted. |
| **Target** | One complete story delivered end-to-end using a real non-GitHub inner loop tooling named at DoR time, with a merged PR and a valid assurance trace on `origin/traces`. |
| **Minimum validation signal** | AGENTS.md adapter resolves the non-GitHub tooling name correctly, produces a valid surface type classification, and the DoR handoff section renders correctly for the target agent format. Evidenced by the DoR artefact and a trace file from a partial run (at minimum: branch-setup through test plan). |
| **Measurement method** | Hamish conducts the validation run as the operator. Records the target agent name, the story slug, the PR URL, and the trace file path in the Priority 9 DoD artefact. |
| **Feedback loop** | Any adapter gap discovered during the validation run is an immediate Phase 3 story. The validation story (Priority 9) cannot close DoD until no adapter gaps remain. |

---

## Tier 2: Meta Metrics (Dogfood Pipeline Validation)

### MM1 — Estimation calibration continuity (Phase 3 E1→E3)

| Field | Value |
|-------|-------|
| **Hypothesis** | Phase 2 produced the first calibration data point (E3 actuals in `workspace/estimation-norms.md`). Phase 3 will improve estimation accuracy if those norms are applied at E1/E2 for Phase 3 stories. |
| **What we measure** | Percentage deviation between Phase 3 E2 estimates (refined at /definition) and E3 actuals (recorded post-merge). |
| **Baseline** | Phase 2 E3 actuals: recorded in `workspace/estimation-norms.md` and `workspace/phase2-actuals.md`. |
| **Target** | Phase 3 E2 estimates within 25% of E3 actuals for at least 70% of stories — improvement over Phase 2 baseline deviation. |
| **Minimum signal** | Phase 3 E2 estimates produced and recorded before coding begins. E3 actuals recorded at each story merge. Deviation calculated at Phase 3 close. |
| **Measurement method** | Hamish records Phase 3 E2 estimates in the /estimate artefact at /definition time. Records E3 actuals in `workspace/estimation-norms.md` as each story closes DoD. Deviation calculation at Phase 3 close. |

---

### MM2 — Outer loop self-sufficiency: Phase 3 delivery without documentation lookups

| Field | Value |
|-------|-------|
| **Hypothesis** | All Phase 3 outer loop stages (discovery through DoR) can be completed using only the platform's own artefacts and reference material, with no external documentation lookups or platform team assistance beyond what is already recorded in the repo. |
| **What we measure** | Count of blocking external lookups required during Phase 3 outer loop stages. A blocking lookup is any point where work stops pending information not available in the repo. |
| **Baseline** | Phase 2: zero blocking lookups during outer loop stages (established as MM1 in Phase 2 benefit-metric). |
| **Target** | Zero blocking lookups during Phase 3 outer loop stages. |
| **Minimum signal** | Any blocking lookup that occurs is immediately logged as a platform gap finding and fed to the improvement agent for the next cycle. Below floor: three or more blocking lookups during a single phase (discovery, definition, or DoR) — indicating a documentation gap significant enough to require a dedicated improvement story. |
| **Measurement method** | Hamish self-logs any lookup that blocks progress during Phase 3 outer loop work. Logged in `workspace/learnings.md` with the stage, the question, and whether the information was later found in-repo. |

---

### MM3 — Priority 1 hardening: reduction in governance check failures per story

| Field | Value |
|-------|-------|
| **Hypothesis** | The Priority 1 test/governance hardening stories address known structural vulnerabilities in the assurance chain. After they merge, the rate of governance check failures per Phase 3 story should be lower than the Phase 2 baseline. |
| **What we measure** | Count of `npm test` failures (excluding PREREQ-DOCKER skips) per story merged during Phase 3, compared to the Phase 2 baseline. |
| **Baseline** | Phase 2: rate of `npm test` failures per story is not formally recorded but was non-zero (trace-commit workflow failures, completedAt schema gap discovered post-merge). Establishing Phase 3 baseline from first PR onwards. |
| **Target** | Zero `npm test` failures (excluding PREREQ-DOCKER skips) on master after any Phase 3 story merges. No post-merge governance gap discovered via manual inspection for any Phase 3 story (the pattern that caused Phase 2's silent failures). |
| **Minimum signal** | `npm test` is run on master immediately after each Phase 3 story merge and the result is recorded. Any failure results in an immediate fix story before the next story proceeds. |
| **Measurement method** | Hamish runs `npm test` after each Phase 3 story merge. Results recorded in `workspace/results.tsv`. Count of failures per story tracked. Compared to Phase 2 post-merge failure count at Phase 3 close. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

### CR1 — T3M1 independent validation on record (audit entry condition)

| Field | Value |
|-------|-------|
| **Obligation source** | `ref-skills-platform-phase3.md` §Entry conditions: "T3M1 independent validation complete" is a hard entry condition for any audit-readiness claim. No adoption-readiness claim may be stated externally or to any risk function until this condition is met. |
| **Metric** | 8/8 MODEL-RISK.md audit questions answered by a named, independent non-engineering reviewer on record. |
| **Target** | Binary: 8/8 on record with reviewer name, role, date, and per-question verdict. |
| **Validated by** | Hamish (platform maintainer) confirms the reviewer is outside the platform engineering reporting line and received no engineering assistance during the review. |
| **Sign-off required at DoR** | No — T3M1 is a human-gated external action that cannot be a story AC. However, the Phase 3 stories that produce the trace fields (Priority 2) are required before an independent reviewer can answer Q2, Q5, Q6, Q7, Q8. These stories must therefore be DoD-complete before the external review is scheduled. |

---

### CR2 — Gate structural independence: agent cannot weaken its own gate

| Field | Value |
|-------|-------|
| **Obligation source** | `ref-skills-platform-phase3.md` §Gate structural independence: "This gap must be closed before Phase 3 adoption at regulated-enterprise scale." |
| **Metric** | `run-assurance-gate.js` and all invoked check scripts are in a separate repository to which delivery agents have no write access. The CI workflow validates the gate script's SHA-256 checksum before execution. |
| **Target** | Binary: gate structural independence confirmed. CI workflow fetches gate script from pinned immutable ref and validates checksum. Delivery repository contains only a thin shim. |
| **Validated by** | Hamish (platform maintainer) confirms repository write access separation and checksum validation in the Priority 3 DoD artefact. |
| **Sign-off required at DoR** | Yes — the DoR for Priority 3 story must confirm that ASSUMPTION-01 (separate repository feasibility) is resolved before coding begins. |

---

## Metric Coverage Matrix

*To be populated by /definition when stories are created.*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — T3M1 audit question coverage | Priority 2 stories (trace fields + tamper-evidence registry) | Gap — stories not yet written |
| M2 — Assurance gate substantive signal | Priority 1B (gate content checks) | Gap — stories not yet written |
| M3 — Post-merge silent failure detection | Priority 1A (check-trace-commit.js) | Gap — stories not yet written |
| M4 — Enterprise approval channel | Priority 8 | Gap — stories not yet written |
| M5 — AGENTS.md adapter validation | Priority 9 | Gap — stories not yet written |
| MM1 — Estimation calibration continuity | All Priority 1–13 stories (via /estimate E2→E3) | Covered by process |
| MM2 — Outer loop self-sufficiency | Phase 3 outer loop execution | Covered by process |
| MM3 — Priority 1 hardening failure reduction | Priority 1A–1D stories | Gap — stories not yet written |
| CR1 — T3M1 on record | Priority 2 stories (prerequisite); external review (not a story) | Partial — prerequisite stories not yet written |
| CR2 — Gate structural independence | Priority 3 | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and the spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
