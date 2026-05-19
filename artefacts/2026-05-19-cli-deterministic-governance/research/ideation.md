# Ideation Artefact

**Feature:** 2026-05-19-cli-deterministic-governance
**Date:** 2026-05-19
**Artefact path:** `artefacts/2026-05-19-cli-deterministic-governance/research/ideation.md`
**Lenses run:** A (partial), B (full), D (full)
**Pipeline state signal:** proceed (with 3 open questions — see below)

---

## Context loaded

| Artefact | Status at time of ideation |
|----------|--------------------------|
| discovery.md | not yet written |
| benefit-metric.md | not yet written |
| Stories | none yet |
| Reference materials | `src/enforcement/cli-adapter.js`, `src/enforcement/governance-package.js`, `.github/governance-gates.yml`, EXP-001 through EXP-008 experiment results, 8 SKILL.md files (all outer-loop skills) |

**Session note:** This ideation session ran to pre-architecture depth. Steps 1–5 produced: a full skills audit (298 items across 8 skills), a CLI subcommand design, a skill surgery specification, a testing strategy, and a DoR-equivalent gate check. The ideation artefact records the opportunity, assumptions, and strategy framing. The full session output (all five steps in detail) is the authoritative reference for `/discovery` inputs.

---

## Lens A — Opportunity map

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

Pipeline advancement is provably governed without reliance on model judgment — producing a tamper-evident, CLI-written audit trail that satisfies enterprise compliance requirements for regulated software delivery.

### Opportunity tree

```
Outcome: Audit trail integrity for regulated enterprise SDLC delivery

├── Cluster 1: Gate logic is invisible and untested
│   ├── Pain point: H1–H9 DoR hard blocks live in SKILL.md prose —
│   │   they look like enforcement but are never tested as code
│   ├── Pain point: CI audit comment post-mortem (ci-audit-comment-bugs.md)
│   │   is the exact same pattern — inline logic that tests only grep for
│   │   the string, not the logic; all 4 CI bugs were in logic no test touched
│   └── Unmet need: A "gate passed" claim in pipeline-state.json needs to be
│       written by deterministic code, not model output
│
├── Cluster 2: State writes are model-controlled
│   ├── Pain point: Every skill's "State update — mandatory final step" is
│   │   currently executed by the model; the model can and does make errors
│   │   (schema violations, wrong enum values, missing fields)
│   ├── Pain point: EXP-003 Config C (Haiku on regulated stories CPF 0.675
│   │   vs 0.90 threshold) — root cause is regulated constraint propagation
│   │   (Step 4a definition) failing; this is a deterministic check, not a
│   │   judgment gap, running in model context
│   └── Desire: State transitions should be atomic and schema-valid by
│       construction, not by model self-discipline
│
├── Cluster 3: No audit trail exists
│   ├── Unmet need: No trace.jsonl today — no way to replay the pipeline
│   │   and verify that each stage advance was preceded by a valid artefact
│   ├── Unmet need: An auditor cannot tell whether pipeline-state.json was
│   │   written by a model or by a governance check
│   └── Desire: Chain-hash trace entries that make post-hoc tampering
│       detectable (same principle as blockchain append-only ledger applied
│       to pipeline advancement)
│
└── Cluster 4 (emerging): Skills are longer than they need to be
    └── Desire: SKILL.md files that contain only cognitive/judgment content
        are cheaper to evaluate, easier to improve, and clearer to read
```

### Opportunity prioritisation

| Opportunity | Importance | Current satisfaction | Priority |
|------------|-----------|---------------------|----------|
| Gate logic is executable and tested | High | Low (currently in prose) | 🟢 Top |
| State writes are atomic and schema-valid by construction | High | Low (model-controlled) | 🟢 Top |
| Audit trail is tamper-evident | High | Low (no trace exists) | 🟢 Top |
| SKILL.md files contain only judgment content | Medium | Low (~670 lines of deterministic prose) | 🟡 Watch |

### Top opportunity — seed solutions

> **Opportunity:** Gate logic is executable and tested

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|--------------------|--------------------------|--------------------|
| Extract all deterministic checks into a Node.js `skills validate` CLI command with typed exit codes | Moves gate enforcement from prose to executable code that can be tested with fixtures | High — `governance-package.js` + `cli-adapter.js` already provide the structural pattern |
| Add a pre-advance session token (validate → token → advance) to prevent post-validate edits from bypassing gate checks | Closes the "validate now, edit, advance later" attack window | Medium — requires HMAC key management |
| Append-only `trace.jsonl` with chain-hash `prev_sha` per entry | Provides tamper-evident advancement record | High — pure Node.js append operation |

---

## Lens B — Assumption inventory

*Framework: Teresa Torres — assumption mapping*

### Assumptions extracted

| Assumption | Type | Risk if wrong | Known-ness | Priority |
|-----------|------|--------------|------------|----------|
| 82% of skill logic items are deterministic (same answer every time regardless of model) | Feasibility | High — if many are actually judgment, the CLI can't encode them correctly | Evidence — full audit table of 298 items across 8 skills confirms 243 deterministic, 55 judgment | 🟢 Accept |
| The model can fix a failing artefact based on CLI validate error output in ≤3 retries | Feasibility | High — if models need >3 retries consistently, STUCK rate will be unacceptably high | Inference — based on correction loop experience in web UI; not yet measured for CLI-driven corrections | 🔴 Test first |
| The web UI backend can be adapted to call `skills validate`/`skills advance` as Node.js subprocesses without a major rewrite | Feasibility | High — if the backend needs major restructuring, Phase 2 (advance + state) is months not weeks | Guess — no assessment of `src/web-ui/` routes/server.js subprocess wiring cost has been done | 🔴 Test first |
| Removing H-block prose from DoR SKILL.md will not significantly degrade first-pass artefact quality | Desirability | Medium — if quality drops, more correction loop cycles needed, increasing latency | Inference — model can still use H-blocks as guidance even after enforcement moves to CLI | 🟡 Test before build |
| Node.js is the right implementation language (not Go, shell, Python) | Feasibility | Low — other languages would work but create a language boundary; Node.js reuses existing stack | Evidence — `governance-package.js`, `cli-adapter.js`, npm test suite all Node.js; no build step | 🟢 Accept |
| Operators in enterprise settings have Git installed and will accept `git config user.email` as audit identity | Viability | Medium — enterprise environments may have headless CI where git identity is a service account | Inference — standard assumption for Git-based tooling; verified in existing npm scripts | 🟡 Test before build |
| A per-repo `.github/.cli-secret` for HMAC token signing is an acceptable key management approach | Viability | Medium — enterprise security may require HSM-managed keys or centralised secret management | Inference — consistent with existing approach for other repo-local secrets | 🟡 Test before build |
| The audit trail value justifies the correction loop latency overhead (validate → fix → re-validate cycle) | Desirability | Low — platform operators have already accepted correction loop overhead in web UI harness | Evidence — web UI harness already runs a correction loop; this just makes it observable | 🟢 Accept |

### Test designs (for 🔴 assumptions)

**Assumption 1:** The model can fix a failing artefact based on CLI validate error output in ≤3 retries.

| Test approach | Description | What we'd observe if true | What we'd observe if false |
|--------------|-------------|--------------------------|---------------------------|
| Simulation | For each of the 8 surgically modified skills, produce a deliberately failing artefact and feed the CLI error output to the model as a correction prompt. Record how many iterations to clean validate. | Convergence in ≤2 iterations for all skills; 3 iterations for complex cases (DoR with multiple H-blocks failing) | One or more skills require >3 iterations even with targeted fix hints — MAX_RETRIES needs increasing or fix hints need improving |
| Data proxy | Review existing web UI correction loop session logs for current average iterations-to-pass on known failing artefacts | Average <2 iterations in existing logs — supports the ≤3 retries assumption | Average >2 iterations already — STUCK rate will be higher than acceptable |

**Decision:** Run the simulation experiment before merging skill surgery (Phase 3). Record convergence data per skill. If any skill exceeds 3 iterations consistently, improve fix hints before shipping.

---

**Assumption 2:** The web UI backend can be adapted to call `skills validate`/`skills advance` without major rewrite.

| Test approach | Description | What we'd observe if true | What we'd observe if false |
|--------------|-------------|--------------------------|---------------------------|
| Spike | Read `src/web-ui/server.js` and all route handlers that write to `pipeline-state.json`. Estimate lines of code that need to change. Map the subprocess call pattern (validate → receive exit code → invoke model or advance). | Change scope < 200 lines; clear integration points; subprocess pattern is already used elsewhere | Backend is tightly coupled to direct state writes; subprocess integration requires restructuring session management, error handling, or streaming architecture |

**Decision:** Run `/spike` scoped to "assess web UI backend refactoring cost for CLI subprocess integration" before Phase 2 begins. TTL: 2 sessions. Output: PROCEED with scope estimate or REDESIGN with alternative approach.

---

### RISK-ACCEPTs to log in `/decisions`

The following assumptions will be RISK-ACCEPTed and logged, enabling progression to Phase 1 while the 🔴 assumptions are being tested:
- Operator identity via `git config user.email` (accepted for Phase 1 — no auth required in validate-only phase)
- Per-repo `.github/.cli-secret` for HMAC (deferred to Phase 2 — Phase 1 has no tokens)
- DoR skill surgery quality regression (acknowledged; skill regression eval sweep required before Phase 3 merge)

---

## Lens D — Product strategy framing

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|----------|--------|-----------|
| What problem will this solve? | Pipeline gates are defined in SKILL.md prose that is never executed as code — no enforcement verification exists; pipeline-state.json advancement is model-controlled and unauditable | Strong |
| For whom? | Platform operators delivering software in regulated enterprise environments where audit trail integrity is a compliance requirement; also any operator whose EXP-003-style CPF failures trace to deterministic checks running in model context | Strong |
| How will we measure success? | Gate bypass incident rate: 0 undetected bypasses/quarter; Audit trail completeness: 100% of DoR sign-offs have CLI-written trace; Regulated story definition CPF: ≥0.90 (from EXP-003 Config C baseline of 0.675) | Strong |
| What alternatives exist today? | Manual review (human checks artefacts before allowing advance), governance-package.js evaluateGate() (partial — 4 gates with basic checks), npm test governance checks (static file assertions, not live-artefact validation) | Strong |
| Why are we best suited? | We own the SKILL.md files, governance-package.js, and cli-adapter.js; we have the full skills audit; no external party can make this change; it is an internal platform evolution | Strong |
| Why now? | EXP-003 Config C failure provides concrete evidence of the live risk; the CI audit comment post-mortem (user memory) shows the exact same pattern (inline logic that looks like enforcement but isn't tested); web UI harness correction loop is already deployed and proves the pattern works | Strong |
| How will we reach operators? | It is built into the platform — operators using the pipeline automatically get CLI enforcement as the harness adopts it; no separate distribution needed | Strong |
| What must MVP demonstrate? | `skills validate` exits non-zero with a specific, actionable error when an artefact fails a deterministic check (exit codes 1–8); npm test continues to pass; no model invocation in CLI | Strong |
| What are the critical risk factors? | (1) Harness integration scope underestimated — web UI backend may require significant restructuring for Phase 2; (2) Correction loop convergence — model may not reliably fix CLI-reported errors in ≤3 retries after skill surgery; (3) DoR skill surgery may degrade first-pass CAI quality | High (risks 1 and 2), Medium (risk 3) |

### Recommendation

> **PROCEED — with phased delivery**
>
> Rationale: The problem is concrete (EXP-003 Config C, CI audit comment post-mortem), the solution is clearly scoped (243 deterministic items extracted from 8 skills into 7 CLI subcommands), and the existing codebase provides the structural foundation. Two of the three risk factors are resolvable before committing to their respective phases — Phase 1 (validate only) can ship before the harness integration spike completes.

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|--------|-------|-------|
| Opportunity map | `/discovery` | Opportunity clusters 1–3 define the problem statement and MVP scope for the discovery artefact |
| Assumption inventory (🔴 assumptions) | `/decisions` as RISK-ACCEPT entries | Assumptions 1 and 2 require test/spike before Phase 2; log in decisions.md |
| Strategy framing | `/discovery` rationale section | Confirms PROCEED with phased delivery — validates that the initiative should enter the formal pipeline |
| Audit data (298 items, 243 deterministic) | `/discovery` scope section, `/benefit-metric` M3 evidence | The 104 H-priority deterministic items are the core scope; the 139 M/L items are Phase 3+ |
| CLI design (Step 2), skill surgery (Step 3), testing strategy (Step 4), DoR gate check (Step 5) | Pre-architecture reference for `/definition` | These outputs go beyond typical ideation depth — treat as spike outputs feeding the formal pipeline; do NOT use as implementation spec without a `/definition` pass |

---

## Open questions

| Question | Blocking? | Owner | How to resolve |
|----------|-----------|-------|---------------|
| What is the web UI backend refactoring cost to support CLI subprocess invocation for advance + trace writes? (H7.1 from DoR gate check) | Yes — blocks Phase 2 | Platform operator | Run `/spike`: "Assess web UI backend refactoring cost for CLI subprocess integration" — TTL 2 sessions, output PROCEED with scope estimate or REDESIGN |
| Does the model reliably converge in ≤3 correction loop iterations when receiving CLI validate error output after SKILL.md surgery? (H7.2 from DoR gate check) | Yes — blocks Phase 3 (skill surgery) | Platform operator | Run correction loop simulation for each of 8 modified skills before merging surgery; record convergence data |
| What is the operator identity mechanism for trace events? Git commit author, env var, or authenticated principal? (H7.3 from DoR gate check) | No — can be decided without a spike | Platform operator | Decision: adopt `git config user.email` for Phase 1; re-assess at Phase 2 if enterprise auth is required; log in `decisions.md` |

---

## Session reference

The full 5-step pre-architecture output from this session (skill audit tables, CLI command specs, skill surgery specs, testing strategy, DoR gate check) was produced in the ideation conversation on 2026-05-19. It is not saved as a separate artefact file — this ideation.md is the durable record. The detailed outputs should be reproduced in the appropriate pipeline artefacts (`discovery.md`, then `/benefit-metric`, then `/definition` stories) as the initiative progresses through the formal pipeline.
