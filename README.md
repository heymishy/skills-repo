# Skills Pipeline

An agentic SDLC pipeline for GitHub Copilot. Structures the full software delivery lifecycle — from raw idea through to production release — using a set of Copilot skills that enforce quality gates, produce traceable artefacts, and route work to the coding agent only when it is properly defined.

Designed to work for a single developer shipping a small feature and equally for a large multi-team programme running a 2-year migration.

---

## Pipeline flow

```mermaid
flowchart TD
    START([Start session]) --> WF

    WF["/workflow\nPipeline navigator"]
    WF --> RT{What type\nof work?}

    RT -->|Bug / small fix /\nbounded refactor| ST_TP
    RT -->|New feature /\nuser-facing scope| DISC
    RT -->|Unknown blocking\nprogress| SPIKE
    RT -->|Large programme /\nmigration / rewrite| PROG
    RT -->|Org architecture /\ninterface registry| EAR

    %% ─── SHORT TRACK ───────────────────────────────────────────
    subgraph SHORT["⚡ Short Track"]
        ST_TP["/test-plan\nWrite failing tests"]
        ST_DOR["/definition-of-ready\nGate check"]
        ST_ICL["Inner coding loop\nsee below"]
    end
    ST_TP --> ST_DOR --> ST_ICL

    %% ─── STANDARD PIPELINE ─────────────────────────────────────
    subgraph STANDARD["📋 Standard Pipeline"]
        DISC["/discovery\nStructure the problem"]
        BM["/benefit-metric\nDefine measurable outcomes"]
        DEF["/definition\nEpics + stories\nArch constraints scan\nMigration detection"]
        REV["/review\nCategories A–E\nQuality gate"]
        TP["/test-plan\nTechnical tests +\nAC verification script\n+ E2E / layout detection"]
        DOR["/definition-of-ready\nH1–H9 + H-E2E hard blocks\nCoding instructions"]
        DOD["/definition-of-done\nPost-merge AC coverage\n+ CSS gap audit trail"]
        TR["/trace\nFull chain\ntraceability report"]
    end

    DISC -->|Approved| BM
    BM -->|Metrics active| DEF
    DEF -->|Stories written| REV
    REV -->|No HIGH findings| TP
    TP -->|Tests written failing| DOR
    DOR -->|Sign-off| ICL_BS
    BC -->|PR merged| DOD
    DOD --> TR

    %% ─── INNER CODING LOOP ─────────────────────────────────────
    subgraph ICL["🔄 Inner Coding Loop"]
        ICL_BS["/branch-setup\nIsolated worktree\nClean baseline"]
        ICL_IP["/implementation-plan\nBite-sized task plan"]
        ICL_SE["/subagent-execution\nor /tdd per task"]
        ICL_IR["/implementation-review\nSpec + quality check"]
        ICL_VC["/verify-completion\nAll ACs · 0 failures"]
        BC["/branch-complete\nDraft PR"]
    end

    ICL_BS --> ICL_IP --> ICL_SE --> ICL_IR
    ICL_IR -->|Issues found| ICL_SE
    ICL_IR -->|Clean| ICL_VC --> BC

    ST_ICL -.->|expands to| ICL_BS

    %% ─── INNER LOOP SUPPORT ─────────────────────────────────────
    subgraph INNER_SUP["🛠️ Inner Loop Support"]
        TDD["/tdd\nRED-GREEN-REFACTOR\nenforcement"]
        SDBG["/systematic-debugging\n4-phase root cause\nprocess"]
    end

    ICL_SE -.->|per task| TDD
    ICL_SE -.->|blocked / failing| SDBG
    SDBG -.->|unblocked| ICL_SE

    %% ─── PROGRAMME TRACK ───────────────────────────────────────
    subgraph PROGRAMME["🏗️ Programme Track"]
        PROG["/programme\nWorkstream registration\nDependency mapping\nPhase gates · Consumer registry"]
        WS1["Workstream A\nstandard pipeline"]
        WS2["Workstream B\nstandard pipeline"]
        WSN["Workstream N…"]
        PG{Phase gate}
        MR["/metric-review\nRe-baseline at\nphase gates"]
    end

    PROG --> WS1 & WS2 & WSN
    WS1 & WS2 & WSN --> PG
    PG -->|All clear| MR
    MR -->|Next phase| PG
    PG -->|Complete| REL

    %% ─── SUPPORTING SKILLS ─────────────────────────────────────
    subgraph SUPPORT["🔧 Supporting Skills"]
        SPIKE["/spike\nScoped investigation\nPROCEED / REDESIGN / DEFER"]
        DEC["/decisions\nRunning log + ADRs\nFeature + repo level"]
        RE["/reverse-engineer\nExtract business rules\nfrom legacy code"]
      EAR["/ea-registry\nApplication + interface registry\nquery · contribute · audit"]
        CM["/coverage-map\nVisual AC coverage map\ngap type · risk level"]
        RS["/record-signal\nRecord benefit metric\nsignal on demand"]
        IDEATE["/ideate\nOpportunity · Assumption · Market scan\nStrategy framing · JTBD (Torres + Cagan + Moesta)"]
    end

    REV -->|Genuine unknown| SPIKE
    DEF -->|Genuine unknown| SPIKE
    SPIKE -->|PROCEED| REV
    SPIKE -->|REDESIGN| DEF

    DEC -.->|Any decision point| STANDARD
    RE -.->|Feeds context| DISC
    EAR -.->|dependency context| DISC
    EAR -.->|dependency context| DEF
    RE -.->|contributes findings| EAR
    TP -.->|suggests after last story| CM
    TR -.->|calls| CM
    DOD -.->|on demand| RS
    CM -.->|gap visibility| DOR

    %% ─── RELEASE ───────────────────────────────────────────────
    subgraph REL_BOX["🚀 Release"]
        REL["/release\nRelease notes · Change request\nDeployment checklist\nCompliance bundle"]
    end

    DOD -->|DoD complete| REL

    %% ─── ARCHITECTURE GOVERNANCE ────────────────────────────────
    AG[("🏛️ architecture-\nguardrails.md\nPatterns · ADRs · Constraints")]
    AG -.-> DEF
    AG -.-> REV
    AG -.-> DOR
    AG -.-> TR

    %% ─── REFERENCE MATERIALS ────────────────────────────────────
    REF[("📁 reference/\nScoping docs · Business cases · OKRs")]
    REF -.-> DISC
    REF -.-> BM
    REF -.-> DEF

    %% ─── STYLING ───────────────────────────────────────────────
    classDef skill fill:#2d6a9f,stroke:#1a4971,color:#fff
    classDef gate fill:#b45309,stroke:#92400e,color:#fff
    classDef inner fill:#166534,stroke:#14532d,color:#fff
    classDef support fill:#6d28d9,stroke:#4c1d95,color:#fff
    classDef prog fill:#0f766e,stroke:#0d544c,color:#fff
    classDef store fill:#374151,stroke:#1f2937,color:#fff

    class DISC,BM,DEF,REV,TP,DOD,TR,WF skill
    class ST_TP,ST_DOR,ST_ICL skill
    class DOR gate
    class ICL_BS,ICL_IP,ICL_SE,ICL_IR,ICL_VC,BC inner
    class TDD,SDBG inner
    class SPIKE,DEC,RE,EAR,CM,RS,IDEATE support
    IDEATE -.->|enriches| DISC
    IDEATE -.->|feeds assumptions| DEC
    class PROG,MR,WS1,WS2,WSN prog
    class REL skill
    class AG,REF store
```

---

## How it works

Each skill is a `SKILL.md` file with YAML frontmatter that Copilot uses for automatic invocation. You say a natural phrase — "I have an idea", "review the stories", "is this story ready" — and the right skill activates. Each skill asks clarifying questions, produces a structured artefact, and tells you exactly what to do next.

All artefacts are saved to `.github/artefacts/[feature-slug]/` so nothing lives only in a chat window.

---

## Tracks

### Short track
For bugs, small fixes, and bounded refactors. Three steps.
```
/test-plan → /definition-of-ready → inner coding loop
```

### Standard pipeline
For new features and user-facing scope.
```
/discovery → /benefit-metric → /definition → /review → /test-plan → /definition-of-ready → inner coding loop → /definition-of-done → /trace
```

### Two-loop operating model
Treat the pipeline as two linked loops:

- **Outer loop**: discover, define, invoke delivery, release/deploy, monitor, measure, learn
- **Inner loop**: setup, plan, build/test, quality review, verify completion, branch/PR completion

Use `/loop-design` to formalise this model and define a **swappable inner-loop contract**
at the skill-library operating-model level.
That lets teams keep the default inner loop in this repo or map an alternative
skill pack/toolchain while preserving entry/exit contracts and evidence gates.

### Cross-cutting policy model

`/loop-design`, `/token-optimization`, and `/scale-pipeline` are meta-level design
skills for the library itself. `/token-optimization` and `/org-mapping` are also
consumed as policy overlays by core execution skills.
Their outputs are intended to be consumed directly by core pipeline steps via
`.github/context.yml` overlays:

- token/model policy -> `/implementation-plan`, `/subagent-execution`, `/review`, `/verify-completion`, `/release`
- org language/governance mapping -> `/definition-of-ready`, `/release`, `/workflow`, and report output headings

This keeps day-to-day execution aligned without needing to run extra skills every time.

**Inner coding loop** (expands Step 7):
```
/branch-setup → /implementation-plan → /subagent-execution (or /tdd per task) → /verify-completion → /branch-complete
```
Support skills throughout: `/tdd`, `/systematic-debugging`, `/implementation-review`

### Programme track
For large initiatives, multi-team migrations, library rewrites, and multi-phase programmes. Runs the **full standard pipeline per workstream** (including the inner coding loop per story) with a coordination layer above.

**Use the programme track only when at least one of these signals applies:**

| Signal | Threshold |
|--------|----------|
| Multiple teams | 2 or more separate delivery teams |
| Cross-team hard dependencies | One team cannot start until another delivers a specific artefact or contract |
| Formal phase gates | Stakeholder, governance, or regulatory sign-off required before proceeding |
| Consumer migration | Shared service or library being replaced with downstream adopters |
| Multi-phase timeline | Delivery spans more than one quarter with interim checkpoints |

If none of these apply, use the standard pipeline with multiple epics — `/definition` handles that natively without the coordination overhead.

```
/programme (setup + qualification) → [per workstream: full standard pipeline] → /metric-review at phase gates
```

**Programme track — detailed flow:**

```mermaid
flowchart TD

    %% ─── QUALIFICATION GATE ────────────────────────────────────
    QUAL["Qualifying questions\nsee criteria below"]
    QUAL --> QD{Programme\ntrack needed?}

    QD -->|"Single team\nno phase gates\nno cross-team deps"| NOTRACK["Use standard pipeline\nwith multiple epics\n/discovery → ... → /trace"]
    QD -->|"2+ teams OR\nformal phase gates OR\nconsumer migration"| SETUP

    %% ─── PROGRAMME SETUP ───────────────────────────────────────
    subgraph SETUP["🏗️ /programme — Setup"]
        P1["Register workstreams + teams"]
        P2["Define phase gates + timeline"]
        P3["Map cross-workstream dependencies"]
        P4["Consumer registry\n(library/service rewrite only)"]
        P1 --> P2 --> P3 --> P4
    end

    P4 --> WS_NOTE["/programme outputs a suggested\nworkstream start order\nbased on dependencies"]

    WS_NOTE --> WSA & WSB

    %% ─── WORKSTREAM A ───────────────────────────────────────────
    subgraph WSA["Workstream A — full standard pipeline"]
        direction TB
        A1["/discovery\n/benefit-metric"]
        A2["/definition\nepics + stories"]
        A3["/review\n/test-plan\n/definition-of-ready"]
        A4["Inner coding loop\nper story:\n/branch-setup → /implementation-plan\n/subagent-execution → /implementation-review\n/verify-completion → /branch-complete"]
        A5["/definition-of-done\n/trace"]
        A1 --> A2 --> A3 --> A4 --> A5
    end

    %% ─── WORKSTREAM B ───────────────────────────────────────────
    subgraph WSB["Workstream B — full standard pipeline"]
        direction TB
        B1["/discovery\n/benefit-metric"]
        B2["/definition\nepics + stories"]
        B3["/review\n/test-plan\n/definition-of-ready"]
        B4["Inner coding loop\nper story"]
        B5["/definition-of-done\n/trace"]
        B1 --> B2 --> B3 --> B4 --> B5
    end

    %% ─── CROSS-WORKSTREAM DEPENDENCY ───────────────────────────
    DEP(["cross-workstream\ndependency gate\ntracked in /programme"])
    A2 -.->|"A must produce\nAPI contract"| DEP
    DEP -.->|"unblocks\nB /definition"| B2

    %% ─── PHASE GATE ─────────────────────────────────────────────
    A5 & B5 --> PG

    subgraph PGBLOCK["Phase gate cycle"]
        PG{Phase gate}
        MR["/metric-review\nre-baseline metrics\nrevise targets if needed"]
        PG -->|"All criteria met"| MR
        MR -->|"Start next phase"| PG
    end

    PG -->|"Programme complete"| REL

    %% ─── RELEASE ────────────────────────────────────────────────
    REL["/release\nRelease notes\nChange request\nCompliance bundle\n(regulated/migration)"]

    %% ─── HEALTH VIEW ─────────────────────────────────────────────
    HEALTH["/programme\nHealth view —\ncross-workstream status\nDependency health\nPhase progress"]
    HEALTH -.->|"can be run\nat any time"| PGBLOCK

    %% ─── STYLING ────────────────────────────────────────────────
    classDef skill fill:#2d6a9f,stroke:#1a4971,color:#fff
    classDef inner fill:#166534,stroke:#14532d,color:#fff
    classDef gate fill:#b45309,stroke:#92400e,color:#fff
    classDef prog fill:#0f766e,stroke:#0d544c,color:#fff
    classDef note fill:#374151,stroke:#1f2937,color:#fff
    classDef redirect fill:#6b7280,stroke:#374151,color:#fff

    class P1,P2,P3,P4 prog
    class A1,A2,A3,A5,B1,B2,B3,B5 skill
    class A4,B4 inner
    class PG gate
    class MR,HEALTH prog
    class REL skill
    class QUAL,WS_NOTE note
    class NOTRACK redirect
```

When in doubt about which track, run `/workflow` — it will route you.

---

## Skills

| Skill | Purpose | When to use |
|-------|---------|-------------|
| `/workflow` | Pipeline navigator and diagnostic | Start of every session; "what's next"; "why is this stuck" |
| `/discovery` | Structures a raw idea into a formal artefact | "I have an idea"; "we should build"; "there's a problem with" |
| `/benefit-metric` | Defines measurable success metrics | After discovery is approved |
| `/definition` | Breaks discovery into epics and stories | After benefit-metric is active |
| `/review` | Quality gate — finds gaps before test-writing | After stories exist |
| `/test-plan` | Writes failing tests + AC verification script; detects browser-layout-dependent ACs that require E2E or manual verification | After review passes |
| `/definition-of-ready` | Pre-coding gate — H1–H9 + H-E2E hard blocks; produces coding agent instructions | After test plan exists |
| `/branch-setup` | Creates isolated worktree, verifies clean baseline | After DoR sign-off |
| `/implementation-plan` | Writes bite-sized task plan from DoR + test plan | After branch ready |
| `/tdd` | RED-GREEN-REFACTOR enforcement per task | During any implementation task |
| `/subagent-execution` | Dispatches fresh subagent per task with two-stage review | When plan exists and subagents available |
| `/implementation-review` | Spec + quality review between task batches | Between tasks or before PR |
| `/verify-completion` | Evidence gate — run tests + walk ACs before claiming done | Before opening a PR |
| `/systematic-debugging` | 4-phase root cause debugging process | When any task or test gets stuck |
| `/branch-complete` | Opens a draft PR or merges locally; cleans up worktree | After verify-completion passes |
| `/definition-of-done` | Post-merge AC coverage validation; CSS-layout gap audit trail | After PR is merged |
| `/coverage-map` | Visual coverage map across all stories — what's tested, by what kind of test, where the gaps are | After test plans exist; suggested by `/workflow`; called by `/trace` |
| `/trace` | Full chain traceability report; flags CSS-layout gaps without RISK-ACCEPT | On demand or CI on PR open |
| `/record-signal` | Records a benefit metric signal without a full DoD run | When measurement data is available: "we got data", "record a signal" |
| `/decisions` | Records ADRs and in-flight decisions | At any pipeline decision point |
| `/ideate` | Structured product discovery — five lenses: opportunity mapping, assumption inventory, market scan, product strategy framing (Torres + Cagan), and jobs-to-be-done (Christensen / Moesta). Suggests lenses based on current pipeline stage and artefacts | Run at any point: blank-slate exploration, enrich an active discovery, or stress-test assumptions before definition |
| `/spike` | Scoped investigation for genuine unknowns | When a step is blocked by something unknown |
| `/ea-registry` | Maintains and queries an organisation-level application/interface registry; supports QUERY, CONTRIBUTE, AUDIT, and FEED modes | When you need app/interface inventory, dependency context, blast radius, or registry updates |
| `/loop-design` | Meta-level design skill that defines the library's outer/inner operating loops and swappable inner-loop contract | When shaping or evolving the skill library operating model |
| `/token-optimization` | Meta-level design skill that defines model-routing/token policy, consumed by core execution/review/release skills | When tuning library-wide cost/latency/token strategy without losing quality |
| `/org-mapping` | Defines terminology/governance mappings that are consumed by DoR/release/workflow and reporting outputs | When adopting pipeline terminology into enterprise process/governance language |
| `/scale-pipeline` | Designs how the full skills pipeline evolves at enterprise scale (versioning, governance, state, operating model) | When planning rollout/evolution of the skill system from 1-2 teams to 20-30 teams |
| `/reverse-engineer` | Extracts business rules from legacy code | When modernising or replacing a legacy system |
| `/programme` | Programme-level navigator for multi-team work | Large initiatives, migrations, library rewrites |
| `/metric-review` | Re-baselines benefit metrics at phase gates | Quarterly, at phase gates, or when targets are questioned |
| `/release` | Produces release notes, change request, deployment checklist | When stories are DoD-complete and ready to ship |
| `/bootstrap` | Scaffolds this pipeline in a new repository | First time setup |

---

## Templates

All structured artefacts conform to templates in `.github/templates/`. Skills reference templates — they never embed format blocks inline.

| Template | Used by |
|----------|---------|
| `epic.md` | `/definition` |
| `story.md` | `/definition` — standard user-facing stories |
| `migration-story.md` | `/definition` — migration, cutover, parallel-run, consumer migration stories |
| `benefit-metric.md` | `/benefit-metric` |
| `discovery.md` | `/discovery` |
| `test-plan.md` | `/test-plan` |
| `ac-verification-script.md` | `/test-plan` |
| `definition-of-ready-checklist.md` | `/definition-of-ready` |
| `review-report.md` | `/review` |
| `definition-of-done.md` | `/definition-of-done` |
| `trace-report.md` | `/trace` |
| `decision-log.md` | `/decisions` |
| `architecture-guardrails.md` | `/review` (Category E), `/definition` (Step 1.5), `/definition-of-ready` (H9) |
| `reference-index.md` | `/discovery`, `/benefit-metric`, `/definition` — indexes source documents |
| `consumer-registry.md` | `/programme` — tracks adoption for library/service rewrites |
| `coverage-map.md` | `/coverage-map` — coverage map artefact (per-AC detail + gap register) |
| `ideation.md` | `/ideate` — opportunity map, assumption inventory, market scan, strategy framing |
| `spike-outcome.md` | `/spike` — spike outcome artefact (PROCEED / REDESIGN / DEFER) |
| `metric-review.md` | `/metric-review` — benefit metric health check at phase gates |
| `programme.md` | `/programme` — programme structure and health snapshot |
| `implementation-plan.md` | `/implementation-plan` — task-by-task TDD plan for coding agents |
| `implementation-review.md` | `/implementation-review` — spec compliance and code quality report |
| `compliance-bundle.md` | `/release` — evidence catalogue for regulated or audited releases |
| `loop-design.md` | `/loop-design` — two-loop model and swappable inner-loop contract |
| `token-optimization.md` | `/token-optimization` — model-routing and token budget plan |
| `org-mapping.md` | `/org-mapping` — pipeline-to-organisation terminology and governance map |
| `scale-pipeline.md` | `/scale-pipeline` — enterprise scale operating model and rollout plan |
| `verify-completion.md` | `/verify-completion` — test suite results and AC verification table |
| `release-notes-technical.md` | `/release` |
| `release-notes-plain.md` | `/release` |
| `change-request.md` | `/release` |
| `deployment-checklist.md` | `/release` |
| `reverse-engineering-report.md` | `/reverse-engineer` |
| `vendor-qa-tracker.md` | `/reverse-engineer` |

---

## Artefact storage

```
.github/artefacts/[feature-slug]/
  reference/                        ← source documents (scoping decks, business cases, OKRs)
    reference-index.md
  discovery.md
  benefit-metric.md
  decisions.md
  epics/
  stories/
  review/
  test-plans/
  verification-scripts/
  dor/
  dod/
  trace/
  coverage/                         ← generated by /coverage-map
    coverage-map.md
    coverage-map.html
  research/                         ← generated by /ideate
    ideation.md
```

For programme-track work, the programme artefact and consumer registry live at:
```
.github/artefacts/[programme-slug]/
  programme.md
  consumer-registry.md             ← library/service rewrite programmes only
```

---

## Architecture governance

`.github/architecture-guardrails.md` is the live source of truth for:
- Pattern library and style guide references
- Reference implementations
- Approved patterns and anti-patterns
- Mandatory constraints (security, accessibility, data, observability)
- Repo-level ADR register

Skills that enforce it: `/review` (Category E), `/definition` (Step 1.5), `/definition-of-ready` (H9 hard block), `/trace` (compliance check), and the coding agent instructions block.

---

## Pipeline visualiser

`.github/pipeline-viz.html` is a single-file SPA that reads `pipeline-state.json` and renders the current state of every feature in the pipeline.

![Pipeline visualiser — stage view and outcomes view](docs/pipeline-viz.png)

**Views:**
- **Stage view** — feature cards arranged by pipeline stage, with health colour, test progress bar, task progress bar, and loop score badge
- **Outcomes view** — per-feature benefit panels showing each metric, signal status (🟢 on-track / 🟡 at-risk / 🔴 off-track), evidence, and contributing stories

**Features:**
- Keyboard shortcut `o` toggles the Outcomes view
- Inline metric editing — click ✏️ Edit on any metric row to update signal, evidence, and date
- ⬇ Download button exports the updated `pipeline-state.json` (turns green when unsaved edits exist)
- Test progress bar reads `testPlan.passing` from `pipeline-state.json` — `/tdd` and `/subagent-execution` update this field after every task commit so the bar advances in real time during implementation
- Auto-polls `pipeline-state.json` every 10 seconds **only while a pipeline is actively running** (a feature at `branch-setup`, `implementation-plan`, `subagent-execution`, or `verify-completion`) — the timer stops itself when no active features remain, so there is zero overhead at rest

**Running it:**
Open with VS Code Live Server or any local HTTP server. Works on GitHub Pages. Falls back to a file-drop zone when opened directly from `file://` (fetching local files is blocked by browsers).

---

## Toolchain configuration

All toolchain settings live in `.github/context.yml`. Skills read this file at runtime instead of hard-wiring tool names, frameworks, or platform assumptions into prompts.

### Switching profiles

Two ready-to-use profiles ship with the pipeline:

| Profile | When to use |
|---------|-------------|
| `contexts/personal.yml` | GitHub-hosted personal or small-team project, no ITSM, no governance |
| `contexts/work.yml` | Enterprise project — Atlassian stack, regulated environment, CAB change process |

Activate a profile by copying it to `.github/context.yml`:

```bash
# Personal / open-source
cp .github/contexts/personal.yml .github/context.yml

# Enterprise / regulated
cp .github/contexts/work.yml .github/context.yml
```

Then edit the fields in `context.yml` to match your actual repo before committing.

### What context.yml controls

```yaml
meta:
  name: "My project"
  scope: personal          # personal | team | programme
  regulated: false         # true → /release offers compliance bundle automatically

source_control:
  platform: github         # github | gitlab | bitbucket | azure-devops | other
  base_branch: main
  pr_command: "gh pr create --draft"

agent:
  instruction_file: "copilot-instructions.md"
  # GitHub Copilot → copilot-instructions.md
  # Claude Code    → AGENTS.md
  # Cursor         → .cursorrules

architecture:
  ea_registry_repo: "https://github.com/heymishy/ea-registry"
  ea_registry_local_path: "C:/Users/Hamis/code/ea-registry-repo"
  ea_registry_authoritative: true

optimization:
  token_policy:
    per_turn_soft_budget: 12000
    per_story_budget: 120000
    per_feature_budget: 800000
  routing:
    default_model_class: "balanced"
    escalation_model_class: "deep-reasoning"

mapping:
  stage_aliases: {}
  artefact_aliases: {}

scaling:
  maturity_level: "team"
  target_team_count: 2
  state_strategy: "per-repo-json"

runtime:
  language: typescript
  test_framework: jest     # jest | vitest | pytest | rspec | junit | mocha | other
  e2e_framework: playwright
  ci: github-actions

tools:
  project_management: github-issues
  monitoring: null
  artifact_registry: null

delivery:
  change_management:
    process: none          # none | informal | cab
    tool: null             # null | servicenow | jira-sm | other
```

Skills that read `context.yml`: `/release` (tool detection for CR body, deployment checklist, and release notes), `/branch-setup` (base branch), `/branch-complete` (PR command), `/definition-of-ready` (tech lead label), `/bootstrap` (profile selection and instruction file wiring), `/ea-registry` (authoritative registry repo/path targeting), `/token-optimization` (budget/routing policy), `/org-mapping` (aliases/governance mapping), `/scale-pipeline` (maturity and state strategy).

### EA registry canonical source

The EA registry now lives in its own repository:

- `https://github.com/heymishy/ea-registry`

Keep application/interface/domain registry data in sync by treating that repo as
authoritative (`architecture.ea_registry_authoritative: true`). Product repos
should consume dependency context via `/ea-registry` FEED mode instead of
duplicating registry YAML locally.

### Multi-runtime agent support

The pipeline works with any agent runtime that supports instruction files:

| Runtime | Instruction file | Set in context.yml |
|---------|-----------------|-------------------|
| GitHub Copilot | `copilot-instructions.md` | `agent.instruction_file: copilot-instructions.md` |
| Claude Code | `AGENTS.md` | `agent.instruction_file: AGENTS.md` |
| Cursor | `.cursorrules` | `agent.instruction_file: .cursorrules` |

`/bootstrap` writes the active-context pointer into whichever file is configured.

---

## Setting up in a new repository

Open your agent in agent mode and run:

```
/bootstrap
```

This creates all skill files, templates, the instruction file, and the artefacts directory. It will ask you to choose a context profile, then prompt for two things: a product context paragraph and your coding standards. Takes around 5–10 minutes.

---

## Pipeline quality gates

| Gate | Skill | Blocks |
|------|-------|--------|
| Discovery approved | Human review | `/benefit-metric` |
| No HIGH review findings | `/review` | `/test-plan` |
| All ACs covered by tests | `/test-plan` | `/definition-of-ready` |
| CSS-layout-dependent ACs resolved (E2E, manual+RISK-ACCEPT, or rewrite) | `/test-plan` Step 3a | `/definition-of-ready` H-E2E |
| H1–H9 + H-E2E hard blocks passed | `/definition-of-ready` | Coding agent |
| AC coverage confirmed | `/definition-of-done` | `/release` |
| Chain health reported | `/trace` | (informational — MEDIUM finding if CSS gaps unaccepted) |
| Phase gate metric review | `/metric-review` | Programme phase progression |

---

## Repo structure

```
.github/
  copilot-instructions.md          ← master config loaded into every agent interaction
  context.yml                      ← active toolchain profile (copied from contexts/)
  contexts/
    personal.yml                   ← profile: GitHub-native, no ITSM, no governance
    work.yml                       ← profile: enterprise Atlassian + regulated stack
  pull_request_template.md         ← PR checklist with AC and chain traceability fields
  architecture-guardrails.md       ← live guardrails file (create from template)
  pipeline-viz.html                ← pipeline visualiser (open in browser with a local server)
  skills/                          ← 32 skill SKILL.md files
  templates/                       ← 34 artefact templates
  scripts/                         ← generated helper scripts (e.g. coverage-map.js)
  artefacts/                       ← generated pipeline artefacts (one folder per feature)
```
