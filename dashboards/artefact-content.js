// Realistic markdown content keyed by cycle + filename.
// Written as a single JS module attached to window so the Babel script can read it.
(function () {
  const MD = {};

  // ─────────────────────────────────────────────────────────────
  // cycle-0 · phase-3 · Skills Platform
  // ─────────────────────────────────────────────────────────────
  MD["cycle-0:discovery.md"] = `# Discovery · Skills Platform · Phase 3

> Governance hardening cycle. Scope: add tamper-evidence to the skill registry
> and wire state-schema enforcement into the inner loop.

## Problem

The skills platform can load a \`SKILL.md\` whose hash does not match the
committed registry. Silent drift is possible across worktrees when a
coding-agent picks up a stale skill-set.

## Users

- **Operator** — kicks off cycles via \`/discovery\` and needs assurance that
  the skill-set in play matches the signed registry.
- **Coding agent** — resolves skills at dispatch; must reject unknown hashes
  and surface a clean error the operator can action.
- **T3M1 independent reviewer** — non-engineering role. Needs a surface where
  they can verify the chain without reading code.

## Assumptions

| # | statement | status |
|---|---|---|
| ASSUMPTION-01 | Platform-infrastructure repo exists for governance artefacts | confirmed · 2026-04-14 |
| ASSUMPTION-02 | \`skillSetHash\` can be computed deterministically on CI | confirmed |
| ASSUMPTION-03 | Non-eng reviewer surface can piggyback on artefacts/ tree | confirmed |
| ASSUMPTION-04 | Compatibility matrix is within p3 scope | confirmed |

## Scope boundaries

**In scope**: \`workspace/state.json\` schema extension, registry signing,
per-dispatch hash verification, trace/ completeness.

**Out of scope**: key rotation, offline verification, cross-org sharing.

## Approval

Operator · 2026-04-14 · \`sha256:d41f8c7a\`
`;

  MD["cycle-0:benefit-metric.md"] = `# Benefit Metric · Phase 3

## Hypothesis

> If every dispatched skill-set is hash-verified against a signed registry,
> then silent drift between operator intent and agent execution drops to zero
> without adding measurable latency to \`/issue-dispatch\`.

## Metrics

| id | name | baseline | target | counter? |
|---|---|---|---|---|
| M1 | drift-events-per-cycle | 3.2/cycle | 0 | no |
| M2 | hash-verify p95 latency | — | ≤ 40ms | no |
| M3 | rollback-MTTR on drift | 52m | ≤ 5m | no |
| M4 | false-reject rate | — | ≤ 0.1% | no |
| M5 | operator-audit time per cycle | 14m | ≤ 3m | no |
| MM1 | operator approvals required | 2 | 1 | no |
| MM2 | trace completeness | 82% | 100% | no |
| MM3 | artefact chain integrity | 94% | 100% | no |
| CR1 | false-positive drift alarms | — | ≤ 1/mo | **counter** |
| CR2 | agent-dispatch rejection rate | — | ≤ 2% | **counter** |

## Measurement plan

- Metrics recorded on every \`/definition-of-done\` invocation
- Watermark registry stored at \`workspace/watermarks/M*.jsonl\`
- Counter-metrics (CR1, CR2) block \`/improve\` if breached

## sha

\`sha256:a07b2f90\` · signed 2026-04-14
`;

  MD["cycle-0:definition.md"] = `# Definition · Phase 3 · 7 epics · 18 stories

Risk-first slicing. Epics ordered by risk surface; stories within each epic
ordered by dependency chain.

## Epics

### e.p3.1 · State schema + suite registry · *low risk*
Extend \`pipeline-state.schema.json\` with \`schemaDepends\` and
\`suiteVersion\`. Five stories: p3.1a–p3.1e.

### e.p3.2 · T3M1 tamper-evidence registry · *medium risk*
Two stories. p3.2a lays the ledger; p3.2b wires the tamper check into
\`/issue-dispatch\`.

### e.p3.3 · Platform-infrastructure repo bootstrap · *high risk*
Gated on ASSUMPTION-01. Three stories, all at \`/definition-of-ready\`.

### e.p3.4 · Agent watermark compatibility · *medium risk*
Five stories. p3.5–p3.8 in flight (inner loop). p3.13 blocked on p3.7 + p3.2a.

### e.p3.5 · NFR profile + scope contracts · *low risk*
Three stories. p3.9 done, p3.10/p3.11 in flight.

### e.p3.6 · Governance harness for SKILL.md · *low risk*
Four stories, all DoD-complete.

### e.p3.7 · Trace completeness + audit · *low risk*
Four stories, all DoD-complete.

## Complexity

| complexity | count |
|---|---|
| 1 (trivial) | 9 |
| 2 (medium) | 6 |
| 3 (large) | 3 |

## NFR profile

Attached · \`artefacts/2026-04-14-skills-platform-phase3/nfr-profile.md\`.
`;

  MD["cycle-0:nfr-profile.md"] = `# NFR Profile · Phase 3

## Floors

- **software-eng** · \`sha256:1aa9fde8\`
- **security-eng** · \`sha256:2e7b0c11\`
- **quality-assur** · \`sha256:7c00a1f9\`

## Specific NFRs

- **latency** · hash-verify ≤ 40ms p95 (from M2)
- **integrity** · every dispatched skill-set has matching \`skillSetHash\`
- **observability** · every phase boundary emits a trace line
- **recoverability** · rollback on drift ≤ 5m (from M3)
`;

  MD["cycle-0:review-notes.md"] = `# Review · Phase 3

Cross-squad review held 2026-04-15. Reviewers: Platform + Governance.

## Pass

- Risk-first slicing honoured
- Counter-metrics declared
- Non-eng reviewer surface addressed in e.p3.3

## Follow-ups (closed)

1. ~~Clarify tamper-evidence semantics for first-run registry~~ → folded into p3.2a
2. ~~Confirm compatibility matrix scope~~ → ASSUMPTION-04 added

## Open

None.
`;

  MD["cycle-0:test-plan.md"] = `# Test Plan · Phase 3

Failing-AC verification script lives at \`tests/ac-verify/p3.sh\`.
38 governance checks registered · 42 scenarios in \`workspace/suite.json\`.

## Per-story coverage

| story | scenarios | red | green |
|---|---|---|---|
| p3.1a | 4 | ✓ | ✓ |
| p3.1b | 3 | ✓ | ✓ |
| p3.2a | 6 | ✓ | ✓ |
| p3.2b | 5 | ✓ | — |
| p3.5 | 4 | ✓ | — |
| p3.6 | 4 | ✓ | — |
| p3.7 | 5 | ✓ | — |
| p3.8 | 3 | ✓ | — |

## Runtime

Full suite: < 40s locally · < 80s on CI.
`;

  MD["cycle-0:dor.md"] = `# Definition of Ready · Phase 3

## Gate checks

- [x] Discovery approved · \`d41f8c7a\`
- [x] Benefit metrics bound · \`a07b2f90\`
- [x] Definition scoped · \`b51cc903\`
- [x] Test plan failing AC present · \`0fe73a81\`
- [x] NFR profile attached · \`5cb221d7\`
- [x] Policy floors locked
- [x] Scope contract SHA locked into DoR manifest

## Scope contract

\`\`\`
files:
  workspace/state.json
  workspace/suite.json
  standards/*/POLICY.md
  tests/ac-verify/p3.sh
  artefacts/2026-04-14-skills-platform-phase3/**
\`\`\`

## Approvals

- Operator · 2026-04-14

## Hash

\`sha256:c220bf4a\`
`;

  MD["cycle-0:trace.md"] = `# Trace · Phase 3 · draft

## Chain

\`discovery → benefit → definition → review → test-plan → dor → dispatch → inner → dod\`

## T3M1 questions

| q | status | by |
|---|---|---|
| Q1 | answered | operator |
| Q2 | outstanding | — |
| Q3 | answered | operator |
| Q4 | answered | operator |
| Q5 | outstanding | — |
| Q6 | outstanding | — |
| Q7 | outstanding | — |
| Q8 | outstanding | — |

## Status

Draft — awaiting inner-loop close on p3.2b, p3.5–p3.8, p3.10, p3.11.
`;

  MD["cycle-0:improve-notes.md"] = `# Improve notes · Phase 3

> Stale · not yet populated for this cycle. Extract pattern notes after
> \`/definition-of-done\` completes on the last 7 stories.

Placeholder.
`;

  // ─────────────────────────────────────────────────────────────
  // cycle-1 · phase-4 · Adapter ecosystem
  // ─────────────────────────────────────────────────────────────
  MD["cycle-1:discovery.md"] = `# Discovery · Adapter Ecosystem · Phase 4

## Problem

Approval signals arrive through bespoke code paths per channel — Jira, Slack,
email. The operator can't see the cross-channel DoR latency in one place, and
agents can't idempotently retry dispatches.

## Users

- **Operator** — fires \`/issue-dispatch\`; wants one path to wait on.
- **Approver** (non-engineer, Jira-native) — wants to sign-off without leaving
  Jira.
- **Coding agent** — dispatches the approval; must be idempotent + retry-safe.

## Scope

- In: Jira adapter, Slack adapter, ADR-006 compliance, idempotency + retry
- Out: email adapter (punt to phase 5), SSO rework

## Assumptions

| # | statement | status |
|---|---|---|
| ASSUMPTION-01 | ADR-006 adapter contract remains stable | confirmed |
| ASSUMPTION-02 | Jira REST v3 app-token path is sufficient | confirmed |
| ASSUMPTION-03 | Slack approvals route via \`app_mention\` event | confirmed |

## Hash

\`sha256:f1102bae\` · 2026-04-02
`;

  MD["cycle-1:benefit-metric.md"] = `# Benefit Metric · Phase 4

## Hypothesis

If a Jira approval maps 1:1 to a DoR signal, DoR sign-off latency drops by
75% for Jira-native squads without adding operator toil.

## Metrics

| id | name | baseline | target |
|---|---|---|---|
| M1 | DoR latency · Jira-native squads | 18m | ≤ 4m |
| M2 | DoR latency · Slack squads | 22m | ≤ 6m |
| M3 | adapter retry rate | — | ≤ 1% |
| M4 | operator interventions · dispatch | 0.6/cycle | ≤ 0.1 |
| CR1 | false-approval rate | — | 0 |

## sha

\`sha256:e3c1a5d8\`
`;

  MD["cycle-1:definition.md"] = `# Definition · Phase 4 · 4 epics

## e.p4.1 · Jira adapter · medium
Four stories. First story (p4.1a) is DoD; three in flight.

## e.p4.2 · Slack adapter · medium
Three stories. DoR review for p4.2a/b; test-plan in progress for p4.2c.

## e.p4.3 · ADR-006 compliance · low
Three stories. definition in progress.

## e.p4.4 · Idempotency + retry · medium
Two stories. p4.4a blocked on retry-contract ADR clarification.
`;

  MD["cycle-1:nfr-profile.md"] = `# NFR Profile · Phase 4

## Floors

- software-eng · \`sha256:1aa9fde8\`
- security-eng · \`sha256:2e7b0c11\`
- quality-assur · \`sha256:7c00a1f9\`

## Specific NFRs

- **idempotency** · every dispatch carries a stable \`dispatchId\`; duplicate
  deliveries are detected and coalesced
- **retry** · exponential backoff, cap 5, max window 5m
- **observability** · every adapter call emits a trace line with channel id
`;

  MD["cycle-1:test-plan.md"] = `# Test Plan · Phase 4 · draft

AC verification harness per adapter:

- \`tests/adapter/check-jira-adapter.js\`
- \`tests/adapter/check-slack-adapter.js\`

## Scenarios

| scenario | status |
|---|---|
| Jira · unknown action verb | red ✓ · green — |
| Jira · idempotent re-delivery | red ✓ · green — |
| Slack · \`app_mention\` ignored outside channel | red ✓ · green — |
| Retry · exponential backoff cap | red ✓ · green — |
`;

  MD["cycle-1:dor.md"] = `# Definition of Ready · Phase 4 · draft

## Gate checks

- [x] Discovery
- [x] Benefit metric
- [x] Definition
- [x] NFR profile
- [ ] Test plan (draft)
- [ ] Policy floors confirmed
- [ ] Scope contract locked

Still gathering the retry contract before DoR can sign.
`;

  MD["cycle-1:tdd-log.md"] = `# TDD log · p4.1b · live

**branch**: \`feat/p4-1b-jira-parse\`

## Tasks

1. ~~RED · parseJiraPayload rejects unknown action verb~~
2. ~~GREEN · minimum viable parser~~
3. REFACTOR · isolate verb enum · *in progress*
4. RED · idempotency path
5. GREEN + REFACTOR · idempotency path

## Verify

\`npm test -- jira-adapter\` · 4 green · 2 red (expected) · 0 skipped
`;

  // ─────────────────────────────────────────────────────────────
  // cycle-2 · phase-5 · Telemetry
  // ─────────────────────────────────────────────────────────────
  MD["cycle-2:discovery.md"] = `# Discovery · Telemetry · Phase 5

## Problem

Counter-metrics (CR1, CR2) are declared per cycle but their watermarks are
not versioned and non-eng reviewers can't see the dataflow.

## Users

- Operator · needs watermarks to survive cycle close
- T3M1 reviewer · needs a read-only surface for CR1/CR2

## sha

\`sha256:0d40c1a7\`
`;

  MD["cycle-2:benefit-metric.md"] = `# Benefit Metric · Phase 5

If watermarks are versioned and visible to non-eng, T3M1 sign-off time drops
from 22m to under 6m.

| id | name | baseline | target |
|---|---|---|---|
| M1 | T3M1 sign-off time | 22m | ≤ 6m |
| M2 | watermark retrieval latency | — | ≤ 100ms |
| CR1 | watermark write failures | — | 0 |
`;

  MD["cycle-2:definition.md"] = `# Definition · Phase 5 · draft

## Epics

### e.p5.1 · M1–M5 watermark recording · medium
### e.p5.2 · Counter-metric pipeline · low
### e.p5.3 · Estimation-norms calibration · low
### e.p5.4 · Non-eng reviewer surface · **high**

p5.4 is the risky one. Dataflow requires a new read-only artefact surface
that T3M1 can inspect without engineering tooling.
`;

  // ─────────────────────────────────────────────────────────────
  // cycle-3 · phase-6 · Runtime isolation
  // ─────────────────────────────────────────────────────────────
  MD["cycle-3:discovery.md"] = `# Discovery · Runtime Isolation · Phase 6 · draft

> Early-stage. Three assumptions still open.

## Problem

Agents share a node_modules graph with the operator process. A poisoned
transitive dep could compromise the governance chain.

## Assumptions

| # | statement | status |
|---|---|---|
| ASSUMPTION-01 | Agent can run in an isolated worktree subtree | **open** |
| ASSUMPTION-02 | Context budget tolerates isolation overhead | **open** |
| ASSUMPTION-03 | SKILL.md resolution still works across boundary | **open** |

## Users

- Operator · wants poison-blast radius bounded to the agent
- Platform · wants one isolation model to maintain
`;

  // ─────────────────────────────────────────────────────────────
  // Per-story notes — lightweight, per-phase
  // ─────────────────────────────────────────────────────────────
  function storyDoc(storyId, cycleId, phaseName, epic, state, blockerId, reason) {
    const flag = state === "blocked"
      ? `> **BLOCKED** · ${blockerId || "—"}\n>\n> ${reason || "Blocked awaiting upstream dependency."}`
      : state === "done"
        ? `> DoD complete · signed off`
        : state === "review"
          ? `> In review — awaiting operator sign-off`
          : `> In flight — coding agent working`;
    return `# ${storyId}

\`${cycleId}\` · ${epic} · currently at \`${phaseName}\`

${flag}

## What this story delivers

See \`definition.md\` for the parent epic's framing. This story carries one
vertical slice of that work to DoD.

## Current state

- phase · ${phaseName}
- state · ${state}
${blockerId ? `- blocker · \`${blockerId}\`` : ""}

## Links

- Epic · see \`definition.md\`
- DoR · see \`dor.md\`
- Test plan · see \`test-plan.md\`
`;
  }

  // Epic doc — synthesized from definition.md context
  function epicDoc(epic, cycle) {
    const storiesList = epic.stories.map(s =>
      `- \`${s.id}\` · ${s.phase} · ${s.state}${s.blockerId ? " · " + s.blockerId : ""}`
    ).join("\n");
    return `# ${epic.id} · ${epic.name}

\`${cycle.id}\` · ${cycle.tag} · **risk · ${epic.risk}**

## Stories (${epic.stories.length})

${storiesList}

## Framing

See \`definition.md\` for the full definition pass on this cycle. This epic
ships its stories through the 12-phase pipeline; each story lands at DoD
independently.
`;
  }

  window.MD = MD;
  window.storyDoc = storyDoc;
  window.epicDoc = epicDoc;
})();
