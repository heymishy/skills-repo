# Skills Pipeline

An agentic SDLC pipeline for GitHub Copilot. Structures the full software delivery lifecycle — from raw idea through to production release — using a set of Copilot skills that enforce quality gates, produce traceable artefacts, and route work to the coding agent only when it is properly defined.

Designed to work for a single developer shipping a small feature and equally for a large multi-team programme running a 2-year migration.

---

## How it works

Each skill is a `SKILL.md` file with YAML frontmatter that Copilot uses for automatic invocation. You say a natural phrase — "I have an idea", "review the stories", "is this story ready" — and the right skill activates. Each skill asks clarifying questions, produces a structured artefact, and tells you exactly what to do next.

All artefacts are saved to `.github/artefacts/[feature-slug]/` so nothing lives only in a chat window.

---

## Tracks

### Short track
For bugs, small fixes, and bounded refactors. Three steps.
```
/test-plan → /definition-of-ready → coding agent
```

### Standard pipeline
For new features and user-facing scope.
```
/discovery → /benefit-metric → /definition → /review → /test-plan → /definition-of-ready → coding agent → /definition-of-done → /trace
```

### Programme track
For large initiatives, multi-team migrations, library rewrites, and multi-phase programmes. Runs the standard pipeline per workstream with a coordination layer above.
```
/programme → [per workstream: standard pipeline] → /metric-review at phase gates
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
| `/test-plan` | Writes failing tests + AC verification script | After review passes |
| `/definition-of-ready` | Pre-coding gate — produces coding agent instructions | After test plan exists |
| `/definition-of-done` | Post-merge AC coverage validation | After PR is merged |
| `/trace` | Full chain traceability report | On demand or CI on PR open |
| `/decisions` | Records ADRs and in-flight decisions | At any pipeline decision point |
| `/spike` | Timeboxed investigation for genuine unknowns | When a step is blocked by something unknown |
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

## Setting up in a new repository

Open Copilot in agent mode and run:

```
/bootstrap
```

This creates all skill files, templates, `copilot-instructions.md`, and the artefacts directory. It will ask for two things at the end: a product context paragraph and your coding standards. Takes around 5–10 minutes.

---

## Pipeline quality gates

| Gate | Skill | Blocks |
|------|-------|--------|
| Discovery approved | Human review | `/benefit-metric` |
| No HIGH review findings | `/review` | `/test-plan` |
| All ACs covered by tests | `/test-plan` | `/definition-of-ready` |
| H1–H9 hard blocks passed | `/definition-of-ready` | Coding agent |
| AC coverage confirmed | `/definition-of-done` | `/release` |
| Chain health reported | `/trace` | (informational) |
| Phase gate metric review | `/metric-review` | Programme phase progression |

---

## Repo structure

```
.github/
  copilot-instructions.md          ← master config loaded into every Copilot interaction
  pull_request_template.md         ← PR checklist with AC and chain traceability fields
  architecture-guardrails.md       ← live guardrails file (create from template)
  skills/                          ← 14 skill SKILL.md files
  templates/                       ← 21 artefact templates
  artefacts/                       ← generated pipeline artefacts (one folder per feature)
```
