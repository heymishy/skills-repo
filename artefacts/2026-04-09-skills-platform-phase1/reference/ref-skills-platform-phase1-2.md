# Reference: Skills Platform — Phase 1 and Phase 2 Planning

**Document type:** Discovery reference material — delivery phases  
**Drop into:** `artefacts/2026-04-09-skills-platform-phase1/reference/`  
**Read alongside:** `ref-skills-platform-operating-model.md`, `ref-skills-platform-standards-model.md`  
**Last updated:** 2026-04-09 (Managed Agents + context window patterns)

> **Note for the discovery skill:** This document defines what to build in Phase 1 and Phase 2. Do not generate stories for Phase 3 or Phase 4 deliverables.

---

## Context: what exists and what the gap is

### What the prototype proved

The seven-story prototype demonstrated a working three-agent SDLC governance loop with:
- Falsifiable policy criteria — assurance verdict is deterministic against defined criteria
- Cryptographic prompt hash verification — instruction set tied to output artefact
- Append-only decision trace log — agent decisions immutable after the fact

Stories S1–S5 are complete with 57+ passing tests. The pattern is sound.

### The scale gap

The prototype cannot scale. It is currently:
- **Single-tenant** — operating from a personal GitHub repo
- **Manually operated** — assurance agent runs on demand, not as CI gate
- **Platform-coupled** — CI logic Bitbucket-specific, tracker calls Jira-specific, hardcoded throughout
- **Non-distributable** — other squads cannot consume skills without forking, severing the update channel
- **Not observable** — traces exist locally; no cross-team registry, drift detection, or contribution flow
- **Harness not self-improving** — failures fixed manually; no systematic trace-to-improvement loop
- **No context window management** — no structured checkpoint pattern; sessions rely on compaction

---

## Adoption path

**Subset** — adopt skills and standards relevant to current delivery context only.
**Augment** — add capabilities as delivery context expands.
**Progressive** — move from subset to full adoption across delivery cycles.

The designs-in-hand variant also applies: squads arriving with existing discovery artefacts can enter at Phase B without running Phase A again.

---

## Phase 1 — Foundation, distribution, and self-improving harness

**Outcome:** A platform team can maintain the skills platform and at least two squads can consume skills without forking. The assurance agent runs as an automated CI gate. The improvement loop is operational. Context window management is structural. At least three core discipline standards are live.

### P1.1 — Distribution infrastructure and progressive skill disclosure

Squads that fork the platform repo lose their update channel. The distribution model must allow consumption and updates without forking.

Deliverables:
- Versioned skill package model — skills released as a consumable package
- Tribe/squad override model — squads extend and configure without modifying platform files
- `copilot-instructions.md` as the always-on base layer — assembled from core + domain + squad layers
- On-demand skill loading — skills requested at story start (`/load skill-name`) and injected on demand
- **Progressive skill disclosure pattern** — formalised phase-sequenced loading as the primary context management mechanism for the inner loop. Documented as an authoring requirement: each skill must declare which phase it loads in. The pattern is: base layer at session start → discovery skills at story context → implementation skills at implementation start → review/assurance skills at those phases.

  **Authoring risk:** This pattern depends on every skill author implementing phase declarations correctly. A skill that loads eagerly at session start rather than on-demand breaks the pattern without any structural enforcement. With 34 skills this drift is likely. Platform maintainers must audit skill load declarations as part of the PR review process, and the `copilot-instructions.md` always-on base layer itself consumes non-trivial context before any skill loads — the net context saving from progressive disclosure may be less than the pattern implies.

### P1.2 — Surface adapter model (foundations)

The platform cannot assume git-native delivery. Phase 1 establishes the adapter interface and the `context.yml` declaration path. EA registry integration is a Phase 2 enhancement — the adapter works the same either way.

Deliverables:
- **Surface adapter interface** — `execute(surface, context) → result` is the contract between the brain and any delivery surface. The brain never branches on surface type internally. All surface-specific complexity lives behind the adapter.
- **Two-path surface type resolution** — both paths are permanently valid and treated as equally authoritative:
  - Path A (EA registry): surface type queried from registry at Phase A start — Phase 2 deliverable
  - Path B (`context.yml` declaration): squad declares `delivery-surface` in `context.yml`; this is the Phase 1 path and a permanent valid alternative to the registry
- **Multi-surface declaration** — `context.yml` supports `delivery-surface: [git-native, saas-gui]`; discovery skill creates separate DoD gates per surface type
- **DoD criteria variant by surface type** — assurance agent applies the correct DoD gate for the declared surface type
- **git-native adapter implementation** — Phase 1 delivers the git-native adapter as the reference implementation; other surface adapters in Phase 2

### P1.3 — Assurance agent as automated CI gate

Deliverables:
- CI-triggered assurance agent — fires on PR open/update, runs the three-agent loop, gates merge
- `inProgress`→`completed` trace emission — trace emitted during execution before each step completes; partial traces from crashed sessions are recoverable
- **Structural CI gate checks** — the CI gate independently enforces these regardless of what the SKILL.md says or what the agent reports:
  - Agent independence: assurance session ≠ dev session
  - Trace transition: valid `inProgress`→`completed` transition present
  - Watermark gate: full score ≥ watermark in `results.tsv`
- **Audit CI gate checks** — the CI gate records these; they detect what happened but do not prevent a determined actor with repo write access from bypassing them:
  - Hash verification: assembled SKILL.md set hash matches platform registry — flags accidental drift and distribution integrity failures; see ADR-003 for tamper scope
- Gate result surfaced in PR — verdict and trace hash visible in PR without opening a separate tool

### P1.4 — Watermark gate

The assurance agent's gate prevents regression while allowing improvement.

Deliverables:
- `workspace/results.tsv` — performance tracking file. Columns: timestamp, skill-set hash, surface type, eval suite pass rate, full test score, gate verdict
- Watermark gate logic — two checks: (1) eval suite pass rate ≥ threshold (default 80%); (2) full score ≥ best score in `results.tsv` for this skill/surface combination
- Regression alert — score drop below watermark flagged before human reviews the PR

### P1.5 — `workspace/state.json` and `workspace/learnings.md` — context continuity and checkpoint

<!-- ADDED: 2026-04-09 (consolidated from prior P1.5; dual purpose formalised) -->

`workspace/state.json` serves two purposes:
1. **Cross-session continuity** — structured record written at session end; new session reads and resumes
2. **Mid-session checkpoint** — written at each phase boundary during execution; enables clean resume after a crash or intentional exit before context limit

These are the same file and the same write operation. The phase boundary write is the checkpoint. End-of-session state is the last phase boundary write of that session.

`workspace/learnings.md` is a rendered view generated from `state.json` at session start, optimised for the agent's context window. The two concerns are separated:
- `state.json` — durable, structured, machine-readable, the source of truth; survives session crashes unchanged
- `learnings.md` — rendered, human-readable, regenerated from `state.json`; can be restructured as context engineering improves without touching the durable record

**`state.json` schema:**

```json
{
  "cycle": {
    "discovery": { "problemStatement": "", "benefitMetric": {}, "surfaceType": "" },
    "spike": { "recommendation": "", "decision": "" },
    "stories": [{ "id": "", "ac": [], "estimate": 0, "surface": "" }],
    "readiness": { "gate": "pass|fail", "blockers": [] }
  },
  "execution": {
    "storyId": "",
    "skillSetHash": "",
    "phase": "implementation|review|assurance",
    "status": "inProgress|completed",
    "traceRef": ""
  }
}
```

**Phase boundary skills that own a checkpoint write:**

| Phase | Skill | Writes |
|---|---|---|
| Discovery | discovery | `state.cycle.discovery` |
| Spike | spike | `state.cycle.spike` |
| Story decomposition | story-decomp | `state.cycle.stories` |
| DoR gate | dor-gate | `state.cycle.readiness` |
| Story start | bootstrap | `state.execution` (inProgress) |
| Story completion | trace | `state.execution` (completed) |
| Improvement cycle end | improvement-agent | `state.improvement` |

**Human `/checkpoint` override:** the operator invokes `/checkpoint` when the hover indicator shows context approaching 75% before a natural phase boundary. The current phase-boundary skill writes its state and exits cleanly.

**Checkpoint write risk:** A session at 90%+ context attempting to write a complete `state.json` may itself fail or produce a truncated write — the write that matters most (just before the session dies) is also the one least likely to complete. The `/checkpoint` override at 75% is the real protection; the phase boundary write is only reliable when context is healthy. Operators should treat 75% as a hard exit threshold, not a warning level.

### P1.6 — Living eval regression suite (`workspace/suite.json`)

Deliverables:
- `workspace/suite.json` — living regression suite. Each entry: task ID, description, skill/surface combination, expected outcome, failure pattern it guards against
- Suite growth mechanic — new failure pattern triggers proposed addition to suite.json; platform team reviews and merges
- Regression guarantee — a scenario once added must pass on every subsequent assurance gate run

### P1.7 — Standards model — Phase 1 disciplines

Three anchor disciplines at core tier: software engineering, security engineering, quality assurance. `standards/index.yml` routing, POLICY.md floor pattern, and composition model established.

### P1.8 — Model risk documentation

`MODEL-RISK.md` must be present and auditable before the platform is used beyond the dogfood context.

---

## Phase 2 — Scale and observability

**Outcome:** 10+ squads consuming the platform. Full six-surface adapter model operational. Improvement loop producing measurable harness quality improvements. Challenger pre-check running before human review of proposed diffs.

### P2.1 — Full platform adapter model

Complete the five remaining surface adapters (IaC, SaaS-API, SaaS-GUI, M365-admin, manual), each implementing the `execute(surface, context) → result` interface established in Phase 1. Standards POLICY.md floor variants for surface-specific expressions.

**EA registry integration (Path A)** — Phase 2 delivers the EA registry query at Phase A start, providing automatic surface type classification and cross-platform dependency detection. Squads using `context.yml` Path B continue operating without change — registry integration is additive, not a migration requirement.

### P2.2 — Improvement agent

Deliverables:
- Improvement agent SKILL.md — reads traces via queryable interface; identifies failure and staleness patterns; proposes SKILL.md diffs; applies anti-overfitting gate; updates `state.json` and renders `learnings.md`
- **Stateless session design** — all state externalised to `workspace/` before session ends; session is disposable; single-cycle-per-session pattern <!-- ADDED: 2026-04-09 -->
- **Two signal types** — failure signal (fix proposals) and staleness signal (removal proposals); staleness metric: instruction over-satisfied by margin >2 quality dimensions on 5+ consecutive stories <!-- ADDED: 2026-04-09 -->
- **Queryable trace interface** — improvement agent queries `workspace/traces/` through a structured filter interface (by surface type, date range, failure pattern) rather than full directory scans. Interface designed to promote to cross-team trace registry in Phase 3 without schema changes. <!-- ADDED: 2026-04-09 -->
- **Challenger pre-check** — before a proposed diff goes to human review, the proposed SKILL.md is tested against a synthetic story using the dev → assurance agent sequence, and the result included in the proposal. **Implementation note for Copilot Agent mode:** one session cannot spawn another session — the improvement agent cannot auto-orchestrate this. In Phase 2 the pre-check is a human-assisted step: the improvement agent writes the synthetic story spec and the proposed SKILL.md to `workspace/proposals/`; the platform maintainer manually runs a dev agent session using the proposed SKILL.md, then runs assurance, and records the result in the proposal. Full automation of this step requires inter-session orchestration not available in the current runtime — this is a Phase 3 capability.
- Trace-to-diff pipeline — improvement agent reads traces, clusters failures, proposes targeted diff, writes to `workspace/proposals/`
- Human review workflow — PR containing proposed diff + failure traces + rationale + pre-check result

### P2.3 — Cross-team observability

Skill usage registry, drift detection, contribution channel for squads proposing upstream improvements.

### P2.4 — Remaining discipline standards

Remaining 8 disciplines at core tier. Domain-tier standards for at least three pilot domains.

### P2.5 — Estimation calibration loop

Actual vs estimated velocity comparison per story and skill set. Calibration gaps surfaced to outer loop Phase A review. EVAL.md dimension added for estimation accuracy tracked in the watermark.

> **STATUS: Delivered ahead of schedule — story decomposition not required.**
> The `/estimate` skill was delivered during Phase 1 /levelup (commit `a3c83c4`, amended `547299d`). It implements E1/E2/E3 progressive estimation using calendar time + engagement fraction derivation, JSONL session reconstruction, `workspace/estimation-norms.md` normalisation table, and per-band calibrated suggestions. Phase 1 baseline actuals are recorded in `workspace/state.json` and `workspace/results.tsv`.
> Two benefit metrics to add to the Phase 2 benefit-metric artefact: **MM4** — estimation calibration accuracy (E2 error below 20% by feature 3, measured automatically from results.tsv); **MM5** — flow findings conversion rate (≥50% of logged findings actioned within 2 features).
> Do not story-decompose P2.5 — the skill is live. Discovery should note MM4 and MM5 as Phase 2 measurement additions only.

---

## Runtime selection

**Dogfooding (personal GitHub):** GitHub Copilot coding agent async. Correct for overnight inner loop.

**Enterprise Bitbucket:** CI-triggered agent step via Bitbucket Pipelines. No async equivalent. Platform adapter must not assume GitHub Actions primitives.

**Token budget:** GitHub Copilot Pro+ (~1,500 requests/month). Phase 1+2 approximately 26 weeks at moderate pace.

---

## Sequencing and dependencies

1. P1.1 (distribution + progressive disclosure) before P1.7 (standards) — composition depends on tiered package model
2. P1.2 (adapter interface) before P2.1 (full adapters) — interface established in Phase 1; implementations in Phase 2
3. P1.3 (CI gate + structural checks) before P1.4 (watermark gate) — watermark extends the gate
4. P1.5 (state.json) can begin immediately — no blocking dependencies; needed early for dogfooding
5. P1.6 (living suite) after P1.3 (CI gate) — suite grows from real gate runs
6. P2.2 (improvement agent) after P1.6 (living suite) + P1.4 (watermark) — improvement agent needs both to operate
7. Challenger pre-check in P2.2 after P2.2 base improvement agent is stable

---

## What the discovery skill should do with this document

1. Use Phase 1 deliverable list as the primary story decomposition input
2. Scope stories to Phase 1 only
3. Classify each story's delivery surface using the EA registry
4. Apply Phase B per-story DoR gate before releasing stories to inner loop queue
5. Flag deliverables where surface type is ambiguous — need outer loop resolution before decomposition

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-09 | P1.1: progressive skill disclosure pattern added as formal deliverable | §P1.1 |
| 2026-04-09 | P1.2: surface adapter interface `execute(surface, context) → result` as primary deliverable; git-native as Phase 1 reference implementation | §P1.2 |
| 2026-04-09 | P1.3: structural CI gate checks enumerated; inProgress trace state added | §P1.3 |
| 2026-04-09 | P1.5: state.json dual purpose formalised (cross-session + mid-session checkpoint); state/rendering separation; full schema; phase boundary ownership table; /checkpoint override | §P1.5 |
| 2026-04-09 | P2.2: stateless session design; two signal types; queryable trace interface; challenger pre-check moved from Phase 4 ADR to Phase 2 deliverable | §P2.2 |
| 2026-04-09 | Scale gap: context window management added to list | §Scale gap |
| 2026-04-07 | P1.4 watermark gate; P1.5 learnings.md (original); P1.6 living suite; P2.2 improvement agent (initial) | §P1.4, §P1.5, §P1.6, §P2.2 |
