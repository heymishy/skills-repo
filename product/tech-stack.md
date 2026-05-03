# Product: Skills Platform — Tech Stack and File Structure

**Document type:** Product reference — technical architecture and file layout  
**Last updated:** 2026-04-09 (Managed Agents patterns integrated)

---

## Architectural framing

The skills platform is a file-system-native governed instruction delivery system. No proprietary runtime, no hosted service, no vendor dependency in the critical path. Every structural element is a file in a git repository.

### Harness engineering vocabulary

The field has coalesced around "harness engineering" as the practice of configuring everything around an agent — system prompt, tools/MCPs, context, sub-agents — to improve reliability. SKILL.md files are the primary harness surface. The four configuration levers:

1. **System prompt** — `copilot-instructions.md` (always-on) and SKILL.md files (phase-sequenced progressive loading)
2. **Tools / MCPs** — MCP server configuration in `context.yml`; credentials in secrets store, never in configuration files
3. **Context** — `context.yml` and assembled standards documents; delivery surface classification injected at story start
4. **Sub-agents** — dev / review / assurance / improvement agent roles, each with a distinct SKILL.md

"Skills pipeline" and "governed instruction delivery" remain the primary vocabulary for stakeholder and regulatory audiences. "Harness engineering" is the engineering-layer vocabulary for contributors and the improvement loop.

---

## Repository structure

### Platform repository (core tier)

```
skills-platform/
├── copilot-instructions.md          # Always-on base layer
├── skills/
│   ├── core/                        # Core SKILL.md files — platform maintainer owned
│   │   ├── discovery.md
│   │   ├── spike.md
│   │   ├── bootstrap.md
│   │   ├── tdd.md
│   │   ├── release.md
│   │   ├── benefit-metric.md
│   │   ├── token-optimization.md
│   │   ├── trace.md
│   │   └── ... (34 skills total)
│   └── POLICY.md                    # Core policy floors
├── standards/
│   ├── index.yml                    # Routing table
│   ├── software-engineering/
│   │   ├── core.md
│   │   └── POLICY.md
│   ├── security-engineering/
│   │   ├── core.md
│   │   └── POLICY.md
│   ├── quality-assurance/
│   │   ├── core.md
│   │   ├── saas-gui-variant.md
│   │   ├── manual-variant.md
│   │   └── POLICY.md
│   └── ... (all 11 disciplines)
├── surfaces/
│   ├── interface.md                 # execute(surface, context) → result contract
│   ├── git-native.md               # Reference implementation
│   ├── iac.md
│   ├── saas-api.md
│   ├── saas-gui.md
│   ├── m365-admin.md
│   └── manual.md
├── workspace/
│   ├── state.json                   # Durable structured state — dual purpose
│   ├── learnings.md                 # Rendered view — generated from state.json
│   ├── suite.json                   # Living eval regression suite
│   ├── results.tsv                  # Performance watermark history
│   ├── traces/                      # Assurance agent traces (queryable)
│   └── proposals/                   # Improvement agent proposed diffs
├── MODEL-RISK.md
├── decisions.md
└── context.yml
```

---

## Surface adapter interface <!-- ADDED: 2026-04-09 -->

The brain's relationship to any delivery surface is through a uniform interface. The brain never branches on surface type internally.

**Contract:**
```typescript
execute(surface: SurfaceType, context: StoryContext) → AdapterResult

type SurfaceType = 'git-native' | 'iac' | 'saas-api' | 'saas-gui' | 'm365-admin' | 'manual'

type AdapterResult = {
  status: 'complete' | 'blocked' | 'failed'
  evidence: string[]          // verification evidence for DoD gate
  traceRef: string            // reference to execution trace
  dodGate: DoDGateResult
}
```

Each file in `surfaces/` is the implementation of this interface for that surface type. The assurance agent receives an `AdapterResult` — it does not know which surface produced it. Surface-specific complexity is entirely behind the adapter.

---

## `standards/index.yml` — routing table

```yaml
version: "1.0"
disciplines:
  software-engineering:
    core: standards/software-engineering/core.md
    policy-floor: standards/software-engineering/POLICY.md
    injection-points: [tdd, bootstrap, release, review]
  security-engineering:
    core: standards/security-engineering/core.md
    policy-floor: standards/security-engineering/POLICY.md
    injection-points: [release, review, assurance]
  quality-assurance:
    core: standards/quality-assurance/core.md
    policy-floor: standards/quality-assurance/POLICY.md
    surface-variants:
      saas-gui: standards/quality-assurance/saas-gui-variant.md
      manual: standards/quality-assurance/manual-variant.md
    injection-points: [tdd, release, assurance]
```

---

## `context.yml` — context configuration

```yaml
squad: "payments-core"
tribe: "payments"
domain: "payments"
# delivery-surface: declared here (Path B) or resolved from EA registry (Path A - Phase 2+)
# Both paths are permanently valid. Multi-surface: delivery-surface: [git-native, saas-gui]
delivery-surface: "git-native"
regulatory-frameworks: [RBNZ, PCI-DSS]
discipline-tags: [software-engineering, security-engineering, regulatory-compliance]

design:
  design-system: "xxx"
  accessibility-level: "WCAG-2.1-AA"

security:
  secret-scanning: "trufflehog"
  dependency-scanning: "trivy"
  owasp-target-level: "OWASP-Top-10-2021"

quality:
  coverage-threshold: 80
  e2e-framework: "playwright"

regulatory:
  pci-dss-level: "Level-1-SAQ"
  rbnz-model-risk: true
```

---

## Workspace primitives

### `workspace/state.json` — durable state and checkpoint <!-- ADDED: 2026-04-09 -->

Dual purpose: (1) cross-session continuity — written at session end so a new session can resume; (2) mid-session checkpoint — written at each phase boundary so a crashed or intentionally-exited session leaves recoverable state. Same file, same write, both purposes served by every phase boundary write.

```json
{
  "cycle": {
    "discovery": {
      "problemStatement": "",
      "benefitMetric": { "metric": "", "baseline": 0, "target": 0, "timebound": "" },
      "surfaceType": "git-native",
      "completedAt": "2026-04-09T09:00:00Z"
    },
    "spike": {
      "recommendation": "",
      "decision": "",
      "completedAt": null
    },
    "stories": [],
    "readiness": { "gate": "pass|fail|pending", "blockers": [] }
  },
  "execution": {
    "storyId": "",
    "skillSetHash": "",
    "phase": "implementation|review|assurance",
    "status": "inProgress|completed",
    "traceRef": ""
  },
  "improvement": {
    "cycleId": "",
    "tracesAnalysed": 0,
    "failurePatternsFound": 0,
    "stalenessSignalsFound": 0,
    "proposalsWritten": [],
    "pendingHumanInput": [],
    "status": "inProgress|completed"
  }
}
```

**Phase boundary ownership:**

| Phase | Skill | Writes |
|---|---|---|
| Discovery | discovery | `state.cycle.discovery` |
| Spike | spike | `state.cycle.spike` |
| Story decomposition | story-decomp | `state.cycle.stories` |
| DoR gate | dor-gate | `state.cycle.readiness` |
| Story start | bootstrap | `state.execution` (inProgress) |
| Story completion | trace | `state.execution` (completed) |
| Improvement cycle | improvement-agent | `state.improvement` |

### `workspace/learnings.md` — rendered view <!-- ADDED: 2026-04-09 -->

Generated from `state.json` at session start. Optimised for the agent's context window. Not the source of truth — `state.json` is. Can be restructured as context engineering improves without touching the durable record.

```markdown
# Session context — {date}

## Last completed phase
[Read from state.cycle]

## Active story
[Read from state.execution if status = inProgress]

## Improvement cycle status
[Read from state.improvement]

## Pending human input
[Read from state.improvement.pendingHumanInput]

## Next action
[Derived from state]
```

### `workspace/suite.json` — living eval regression suite

```json
{
  "suite": [
    {
      "id": "suite-001",
      "description": "TDD skill must produce failing test before implementation",
      "skill": "tdd",
      "surface": "git-native",
      "expected": "failing-test-present-before-implementation-commit",
      "failurePattern": "agent implemented first, added tests after",
      "signalType": "failure",
      "added": "2026-04-07",
      "addedBy": "assurance-agent"
    }
  ]
}
```

`signalType` is either `failure` (added from failure signal) or `staleness` (added from staleness signal — guards against re-introduction of a removed constraint).

### `workspace/results.tsv` — performance watermark

```
timestamp	skill-set-hash	surface-type	suite-pass-rate	full-score	gate-verdict
2026-04-09T09:00:00Z	sha256:abc123	git-native	0.92	0.87	pass
2026-04-09T14:30:00Z	sha256:def456	git-native	0.94	0.89	pass
```

Watermark for a given skill/surface combination = highest `full-score` recorded. Any run scoring below watermark fails the gate.

### `workspace/traces/` — queryable trace interface <!-- ADDED: 2026-04-09 -->

Traces are written as JSONL files during execution (not on completion). Each trace has an `inProgress` state that transitions to `completed` on clean exit.

The improvement agent queries traces through a structured filter interface — not full directory scans:

```typescript
getTraces(filter: {
  surface?: SurfaceType
  skill?: string
  signalType?: 'failure' | 'staleness'
  after?: ISO8601Date
  before?: ISO8601Date
  minMargin?: number   // for staleness queries: minimum over-satisfaction margin
}) → TraceRecord[]
```

This interface is designed to promote to the Phase 3 cross-team trace registry without schema changes. Additional filter dimensions (squad, tribe, domain) are added in Phase 3 without breaking existing queries.

### `workspace/proposals/` — improvement agent proposed diffs

Each proposal is a directory containing:
- `diff.md` — proposed SKILL.md change
- `evidence/` — failure or staleness traces that motivated it
- `rationale.md` — improvement agent's analysis
- `precheck.md` — challenger pre-check result (Phase 2+)
- `selfReflection.md` — anti-overfitting gate result

---

## Decision trace schema

```json
{
  "traceId": "uuid",
  "storyId": "PROJ-123",
  "agentRole": "assurance",
  "timestamp": "2026-04-09T09:00:00Z",
  "status": "inProgress|completed",
  "skillSetHash": "sha256:abc123",
  "standardsInjected": [
    "software-engineering/core.md@v1.2",
    "security-engineering/core.md@v1.1"
  ],
  "surfaceType": "git-native",
  "gateVerdict": "pass",
  "evalSuitePassRate": 0.92,
  "fullScore": 0.87,
  "watermarkDelta": "+0.02",
  "stalenessFlags": [],
  "policyFloorChecks": [
    { "floor": "automated-test-suite-required", "result": "pass" }
  ]
}
```

---

## MCP server configuration <!-- UPDATED: 2026-04-09 -->

The Atlassian toolchain integration uses the community `mcp-atlassian` server. Credentials are never in `context.yml` — they live in the secrets store and are fetched by the proxy at call time.

```yaml
# context.yml — reference secret name, not the credential
mcp:
  atlassian:
    type: url
    server: mcp-atlassian
    auth: secrets-store
    secretRef: BITBUCKET_PAT          # Name of secret in Bitbucket pipeline secrets
    bitbucket-url: https://bitbucket.org
    jira-url: https://jira.org
```

The PAT value never appears in any tracked file. The MCP proxy fetches it from the secrets store at call time using the `secretRef` name.

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-09 | Surface adapter interface section added — `execute(surface, context) → result` contract | §Surface adapter (new) |
| 2026-04-09 | `surfaces/interface.md` added to repository structure | §Repository structure |
| 2026-04-09 | `workspace/state.json` — dual purpose formalised; full schema with cycle/execution/improvement layers; phase boundary ownership table | §state.json |
| 2026-04-09 | `workspace/learnings.md` — reframed as rendered view generated from state.json | §learnings.md |
| 2026-04-09 | `workspace/traces/` — queryable `getTraces(filter)` interface; inProgress trace state | §traces |
| 2026-04-09 | `workspace/proposals/` — precheck.md added to proposal directory | §proposals |
| 2026-04-09 | `workspace/suite.json` — `signalType` field added (failure vs staleness) | §suite.json |
| 2026-04-09 | Decision trace — `status`, `stalenessFlags` fields added | §Decision trace |
| 2026-04-09 | MCP configuration — credentials moved to secrets store; `secretRef` pattern replaces inline credential | §MCP |
| 2026-04-07 | Harness engineering vocabulary; workspace/ directory; workspace primitives initial set | All |
| 2026-04-21 | Phase 4 enforcement architecture section added — shared governance package (ADR-013), enforcement spoke adapters, `pipeline-state.json` formal fields | §Phase 4 enforcement (new) |

---

## Phase 4 enforcement architecture <!-- ADDED: 2026-04-21 -->

Phase 4 introduces a shared governance package (ADR-013) that all enforcement surface adapters call through. No surface reimplements governance logic independently.

### Shared governance package — three-operation contract

```javascript
// All operations are pure: no side effects beyond the outputs described.
// Called by every surface adapter in exactly this sequence.

resolveAndVerifySkill(skillName, lockfileEntry)
// → { skillPath, contentHash, verified: boolean }
// Reads the SKILL.md at the resolved path, computes SHA-256, compares to lockfileEntry.hash.
// Returns verified: false (not an exception) on mismatch — adapter decides whether to block.

evaluateGateAndAdvance(storyId, gateId, evidenceFields, pipelineState)
// → { verdict: 'pass' | 'fail' | 'warn', advancedTo: phase | null, gateRecord }
// Reads evidence fields from pipelineState for the named gate. Does not check stage alone (ADR-002).
// Writes the gate record to pipelineState in-memory. Caller persists.

writeVerifiedTrace(tracePayload, destination)
// → { traceRef: string, written: boolean }
// Writes a completed trace entry with hash, model version, standards injected, gate verdict.
// destination is 'workspace/traces/' for in-flight; 'traces/' branch for post-merge.
```

### Enforcement spoke adapters

| Adapter | Surface | Mechanism | Delivery |
|---------|---------|-----------|----------|
| `p4-enf-mcp` | VS Code, Claude Code | MCP tool boundary — governance package called at tool invocation | Phase 4 |
| `p4-enf-cli` | Regulated contexts, CI | CLI prompt injection — governance package called at command entry point | Phase 4 |

Spike B1 verdict determines whether MCP boundary is structurally enforced or conventionally enforced. If B1 resolves unfavourably (boundary is bypassable), `p4-enf-mcp` isolation guarantees are scoped to CLI-first surfaces. Phase 5 WS2 (subagent isolation) accounts for both outcomes.

### `pipeline-state.json` formal fields added in Phase 4

Fields now declared in `pipeline-state.schema.json` (ADR-003 compliance):

| Field | Type | Purpose |
|-------|------|---------|
| `regulated` | boolean | Activates H-NFR2, H-NFR3 DoR hard blocks; restricts permission tiers |
| `complianceProfile` | `"standard" \| "regulated"` | Surface-level compliance profile; read by governance package |
| `dorStatus` | `"not-started" \| "in-progress" \| "signed-off"` | Gate evidence field for DoR (not stage-proxy — ADR-002) |

Field `oversightLevel: low/medium/high` is present in pipeline-state data as an informal convention. Phase 5 WS2 prerequisite promotes it to a formally declared schema field before WS2 and WS3.3 depend on it.

### Phase 5 additions (upcoming — not yet delivered)

The following Phase 5 primitives will be added to this section on delivery:

- **Hook event schema (WS1.1)** — typed pre-tool / post-tool / turn-start / turn-end event vocabulary; written to sidechain transcript by governance package.
- **Capability manifest in SKILL.md (WS2.1)** — declared required capabilities per skill; validated at invocation time against permission tier.
- **Consumer lockfile (WS0.1)** — per-release lockfile with per-skill hash pinning; read by `resolveAndVerifySkill` as the authoritative hash source at invocation time.
- **`oversightLevel` formal schema field (WS2 prerequisite)** — promoted from informal convention to declared field in `pipeline-state.schema.json`.

---

## E2E test infrastructure (wuce.17) <!-- ADDED: 2026-05-06 -->

The web UI feature (wuce) introduces a Playwright-based E2E test layer as a complement to the existing Node.js unit suite. This section documents the stack additions and the structural rules that govern E2E testing (ADR-018).

### E2E testing stack

| Layer | Tool | Scope |
|-------|------|-------|
| Unit + integration | Node.js `assert` / custom `async test()` helper | Backend logic, route handlers, adapters |
| E2E (browser) | Playwright `@playwright/test` (devDependency) | Full browser HTTP+DOM; verification of rendering, routing, and session lifecycle |

### File structure

```
playwright.config.js              # Runner config at repo root — testDir: 'tests/e2e'
tests/e2e/
├── fixtures/
│   └── auth.js                   # Auth bypass fixture (test.extend; NODE_ENV=test guard)
├── smoke.spec.js                 # Infrastructure smoke tests (2 tests)
├── skill-launcher.spec.js        # wuce.13 E2E specs (stubs → filled by E3/E4 subagents)
├── artefact-preview.spec.js      # wuce.14 E2E specs (stubs → filled by E3/E4 subagents)
├── artefact-writeback.spec.js    # wuce.15 E2E specs (stubs → filled by E3/E4 subagents)
└── session-persistence.spec.js   # wuce.16 E2E specs (stubs → filled by E3/E4 subagents)
```

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:e2e` | Run full E2E suite (Playwright, headless Chromium) |
| `npm run test:e2e:ui` | Open Playwright UI mode for local debugging |
| `npm test` | Unit + integration chain only — never includes Playwright |

### Auth bypass pattern

The auth bypass for E2E tests is a Playwright `test.extend` fixture in `tests/e2e/fixtures/auth.js`. It injects a synthetic session cookie (`{ userId: 'e2e-test-user', login: 'e2e-tester' }`) into each test request before `page.goto()`. The bypass is guarded by `NODE_ENV=test` and cannot be activated by configuration error in production environments. It does not modify any `src/` production files.

### CI integration

E2E tests run via `.github/workflows/e2e.yml` on pull_request events. The gate is opt-in (`audit.e2e_tests: true` in `context.yml`) and non-fatal (`continue-on-error: true`) in v1 — failures appear as a visible PR status signal but do not block merge. Playwright traces and screenshots on failure are uploaded via `actions/upload-artifact` with 7-day retention.

### Governing decision

ADR-018 (`.github/architecture-guardrails.md`): Playwright is the sole E2E framework. All browser-facing AC verification must be in `tests/e2e/`. The unit chain is immutable.
