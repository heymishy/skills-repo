# Pipeline Feature Additions
**heymishy/skills-repo — Proposed enhancements**
_Generated March 2026 · Based on landscape analysis across agent-os, spec-kit, tikalk/agentic-sdlc-12-factors, BMAD, egg, and community discussion_

---

## Overview

These 10 features are ordered by value-to-effort ratio across two tiers. Features 1–5 are high-value, lower-effort additions that close known gaps against the current public ecosystem. Features 6–10 are higher-effort, higher-strategic-value additions that would make the pipeline genuinely differentiated at enterprise scale.

---

## Tier 1 — High value, lower effort

---

### Feature 1: Standards injection before DoR

**Category:** Workflow enhancement
**Effort:** Low–medium (1–2 days)
**Analogues:** agent-os `/inject-standards`, tikalk 12 Factors (Factor II: Context Scaffolding)

#### What it is
A lightweight `standards/` directory added to the repo structure, with an `index.yml` mapping standards files to domains (e.g. API design, data access, auth, payments). A new step is added to `/definition-of-ready` that reads the domain tags on the story being prepared and injects the relevant standards files into the coding agent instructions block.

#### Why it matters
The current `/definition-of-ready` skill produces rich coding agent instructions — AC, test plan summary, constraints — but the agent picks up the story with no awareness of your architectural conventions, API response formats, or platform-specific patterns. This is the exact gap Agent OS was built to solve: the agent re-learns context that should already be known on every session. Injecting standards at the DoR boundary means the coding agent has codebase conventions as first-class context alongside the functional spec.

#### Implementation considerations
- Create `.github/standards/` directory with subdirectories by domain (e.g. `api/`, `data/`, `auth/`, `payments/`)
- Create `.github/standards/index.yml` mapping each file to domain tags and a one-line description
- Add a **Standards injection** section to `/definition-of-ready/SKILL.md`: read the story's domain/tech-stack tags, query `index.yml`, include the matching standards files in the coding agent instructions block
- Standards files should be concise — rule-first, code example, skip the obvious. They are context-window residents, not documentation
- Add a step to `/bootstrap/SKILL.md` to scaffold the `standards/` directory and a starter `index.yml`
- Optional: add `/index-standards` as a lightweight maintenance skill (scans for new files, prompts for descriptions, updates `index.yml`) — directly borrowed from Agent OS

#### Integration points
- `/definition-of-ready` — primary injection point
- `/bootstrap` — scaffold creation
- `/reverse-engineer` — can populate initial standards files from existing codebase patterns

---

### Feature 2: `/improve` retrospective extraction skill

**Category:** New skill
**Effort:** Medium (2–3 days)
**Analogues:** tikalk `agentic-sdlc-spec-kit` `/levelup.spec` (renamed here to `/improve`), CDR (contextual design record) pattern

#### What it is
A post-DoD skill invoked after a feature is merged and traced. It reviews the completed feature artefacts (discovery, definition, test-plan, trace), extracts reusable patterns and decisions, and either updates `copilot-instructions.md`, writes a new standards file, or appends an ADR. It turns the pipeline from a linear process into a learning system.

#### Why it matters
Currently the pipeline runs idea → done, with no feedback loop. Knowledge gained in one feature — an architectural decision, a tricky AC pattern, a domain constraint discovered during testing — stays in that feature's artefacts and doesn't inform the next one. The `/improve` skill closes this loop. Over time, running it consistently means the pipeline's standards base and instructions file reflect accumulated engineering knowledge rather than only the initial bootstrap state.

#### Implementation considerations
- Create `.github/skills/improve/SKILL.md`
- Entry condition: requires a completed `/trace` report and merged PR for the feature
- Process:
  1. Read the full artefact chain for the feature (discovery → trace)
  2. Identify: architectural decisions made, patterns applied, constraints discovered, AC patterns worth reusing, scope deviations and why
  3. Classify each finding as: (a) standards candidate → write/update a file in `standards/`, (b) ADR candidate → append to decision log, (c) copilot-instructions update → propose a diff to `copilot-instructions.md`, (d) no action
  4. Confirm with the user before writing anything
  5. Update `standards/index.yml` if new standards files are created
- The skill should be lightweight and opinionated — it should produce one or two concrete outputs per run, not a comprehensive review. Better to extract one good pattern than to produce a long report nobody acts on
- Trigger suggestion: add to PR template as a checkbox — "[ ] `/improve` run post-merge"

#### Integration points
- `/trace` — prerequisite
- `/decisions` — ADR output target
- `/standards/` — primary output target
- `copilot-instructions.md` — secondary output target

---

### Feature 3: Timestamped per-feature artefact structure

**Category:** Structural convention
**Effort:** Low (half a day — naming convention + bootstrap update)
**Analogues:** Agent OS `agent-os/specs/{timestamp-slug}/`, spec-kit per-feature spec folders

#### What it is
A naming convention enforced by `/bootstrap` and the pipeline skills: every feature generates artefacts into a timestamped folder under `artefacts/`, e.g. `artefacts/2026-03-23-payment-retry-logic/`. The folder contains all artefacts for that feature: discovery, benefit-metric, epic, stories, test-plan, trace, and the DoD report.

#### Why it matters
Currently `artefacts/` is a flat `.gitkeep`. As the pipeline is used across multiple features in parallel and over time, artefacts have no home, no history, and no relationship to each other. Timestamped folders give `/trace` a natural output home, give `/reverse-engineer` a structured history to query, and mean the repo tells its own story over time — anyone can look at `artefacts/` and understand what was built, when, and why. This is also the foundation for Feature 9 (outer-loop CI traceability), which needs to know where to find artefacts for a given PR branch.

#### Implementation considerations
- Convention: `YYYY-MM-DD-{feature-slug}/` under `artefacts/`
- Feature slug: kebab-case, derived from the discovery artefact title, max 40 chars
- Contents per folder:
  ```
  discovery.md
  benefit-metric.md
  epic.md
  stories/
    story-{n}.md
  test-plan.md
  ac-verification-script.md
  definition-of-ready-checklist.md
  trace.md
  dod-report.md
  ```
- Update `/bootstrap` to document this convention
- Update `/discovery` to create the folder and `discovery.md` as its first output
- Update all downstream skills to write into the feature's artefact folder rather than a generic location
- Update `/trace` to read from the feature folder and write `trace.md` there
- The folder name becomes the canonical feature identifier referenced in PR descriptions and the decision log

#### Integration points
- `/bootstrap` — convention documentation and `artefacts/.gitkeep` scaffold
- `/discovery` — folder creation
- All pipeline skills — write outputs into feature folder
- `/trace` — reads from and writes to feature folder
- Feature 9 (CI traceability) — CI reads from feature folder via PR branch reference

---

### Feature 4: Structured `/spike` output format feeding `/discovery`

**Category:** Skill enhancement
**Effort:** Low (1 day — update existing skill + add handoff template)
**Analogues:** spec-kit `/speckit.clarify`, 12 Factors Factor I (intent-driven development)

#### What it is
A formal spike output template with defined fields, and an explicit handoff step that populates the open/unknown fields in a `/discovery` artefact. Spike findings stop being a research dump and become a structured input to the discovery process.

#### Why it matters
Spikes are run to resolve uncertainty before committing to a definition. Currently the spike produces findings that likely live in an ad hoc doc, and the connection back to the discovery artefact that spawned the spike is informal. A structured output format makes the spike a first-class SDLC citizen: the uncertainty that motivated the spike is explicitly resolved, the options evaluated are recorded (with the chosen option and rationale), and the discovery artefact's open fields are populated as a direct output of the skill run.

#### Implementation considerations
- Add a spike output template to `.github/templates/spike-output.md`:
  ```
  ## Spike: {title}
  ## Uncertainty addressed
  ## Options evaluated
  | Option | Pros | Cons | Verdict |
  ## Recommendation
  ## Constraints confirmed
  ## Discovery fields resolved
  <!-- Map spike findings back to open fields in the parent discovery artefact -->
  ## Remaining unknowns (if any)
  ```
- Update `/spike/SKILL.md` to:
  1. Begin by reading the parent discovery artefact and identifying the specific unknowns the spike was tasked with resolving
  2. Produce output in the structured template format
  3. End with an explicit step: "Update the following fields in `discovery.md`:" — mapping spike findings to discovery fields
  4. Write the spike output into the feature's artefact folder as `spike-{slug}.md`
- If a spike reveals the discovery artefact needs significant revision, the skill should prompt: "This spike changes the problem framing. Re-run `/discovery` with these findings as input?"
- Multiple spikes per feature are supported — each gets its own timestamped file

#### Integration points
- `/discovery` — parent artefact; receives updates from spike handoff
- `/benefit-metric` — may also need updating if spike changes the problem scope
- Feature 3 artefact folder — spike output written here

---

### Feature 5: Distribution mechanism (install script)

**Category:** Operational tooling
**Effort:** Low–medium (1 day)
**Analogues:** tikalk `specify init --team-ai-directives`, BMAD `npx bmad-method install`, Agent OS `project-install.sh`

#### What it is
A bash/PowerShell install script that pulls the current skills pipeline from `heymishy/skills-repo` and runs bootstrap in a target repo. A single command sets up the full pipeline in any new or existing repository.

#### Why it matters
Right now bootstrapping a new repo requires manually copying files or running the `/bootstrap` skill from inside that repo. Across 220 engineers and multiple repos, this is a significant friction point. A one-liner install script means the pipeline can be propagated at org scale without tribal knowledge of how to set it up. It also enables the concept of a enterprise-namespaced fork (`org-nz/sdlc-skills`) with internal standards, copilot instructions, and product context pre-loaded — so every new repo gets the full enterprise engineering conventions by default, not a blank template.

#### Implementation considerations
- Create `scripts/install.sh` (bash) and `scripts/install.ps1` (PowerShell) at repo root
- Install flow:
  1. Clone or curl the skills-repo
  2. Check if `.github/skills/` already exists (if yes: offer to skip existing files or overwrite)
  3. Copy all skills, templates, and `copilot-instructions.md` to the target repo
  4. Prompt for the two required placeholders (project name, tech stack summary)
  5. Confirm and write
- Add a `config.yml` at repo root defining: default profile, required placeholders, which skills to include (allows lightweight installs that skip e.g. `/reverse-engineer` for greenfield repos)
- README: add a one-liner `curl -fsSL https://raw.githubusercontent.com/heymishy/skills-repo/master/scripts/install.sh | bash` install command
- For enterprise internal use: maintain a private fork with `standards/` pre-populated, `product/` context for each domain, and a `copilot-instructions.md` that references enteprise's tech radar and API standards

#### Integration points
- `/bootstrap` — called by the install script after file copy
- `config.yml` — new file, controls install profile
- Feature 1 (`standards/`) — install script copies standards base
- Feature 6 (product context) — install script can pull product context from an org-level source

---

## Tier 2 — Higher effort, higher strategic value

---

### Feature 6: Persistent product context layer

**Category:** New artefact layer
**Effort:** Medium (2–3 days)
**Analogues:** Agent OS `agent-os/product/`, BMAD Analyst agent brief, spec-kit constitution

#### What it is
A set of persistent product-level markdown files that live in `product/` (repo root) and are injected into `/discovery` and `/benefit-metric` at the start of each feature. These files capture the product's strategic goals, known constraints, architectural decisions, tech stack, and roadmap — context that should inform every feature's problem framing and metric selection but is currently re-established from scratch each session.

#### Why it matters
Every `/discovery` session currently starts cold. Benefit-metric tier detection has to infer strategic alignment without knowing the product's actual goals. For an enterprise payments context, decisions like "we are replacing system x", "we are committed to open standard by [date]", "our architecture requires all new services to use [standard]" are permanent context that should shape every feature's framing automatically. Persistent product context also reduces the variability between discovery sessions run by different team members — the product intent is explicit and shared, not inferred.

#### Implementation considerations
- Create `product/` directory (repo root) with starter files:
  - `mission.md` — product purpose, target users, strategic goals
  - `roadmap.md` — current initiatives, committed deliverables, known constraints
  - `tech-stack.md` — architectural standards, platform decisions, integration patterns, what's being decommissioned
  - `constraints.md` — regulatory obligations, non-negotiable NFRs, security and data classification requirements
- Update `/discovery` to read `product/` files at the start of each session and use them to validate scope, identify alignment, and pre-populate constraint fields
- Update `/benefit-metric` to read `mission.md` and `roadmap.md` when evaluating Tier 1 metric candidates — strategic alignment should be assessable against explicit product goals, not inferred
- Update `/bootstrap` to scaffold `product/` with annotated starters and prompt for initial population
- Product context files are living documents — update them when strategy changes, not just at bootstrap. Add a note to `/decisions` ADR template: "Does this decision require an update to `product/`?"
- For an enterprise internal fork: pre-populate these files with engineering strategy, payments platform context, and known regulatory constraints

#### Integration points
- `/discovery` — reads `product/` for scope validation and constraint pre-population
- `/benefit-metric` — reads `mission.md`/`roadmap.md` for Tier 1 alignment
- `/bootstrap` — scaffolds `product/` directory
- Feature 5 (install script) — can pull product context from org-level source on install

---

### Feature 7: Scale-adaptive complexity routing

**Category:** Workflow enhancement
**Effort:** Medium (2–3 days — routing logic + graduated skill variants)
**Analogues:** BMAD scale-domain-adaptive framework, 12 Factors dual execution loops (Factor V)

#### What it is
A graduated complexity assessment at the `/workflow` entry point that routes work to one of three pipeline depths: **micro** (single skill, no artefacts), **standard** (current full pipeline), or **complex** (extended pipeline with architecture review, EA registry check, and mandatory ADR gate). The assessment is based on explicit signals: change surface area, number of systems touched, regulatory scope, and user-facing impact.

#### Why it matters
The current pipeline has a binary short-track for bugs/fixes/refactors and a full pipeline for everything else. In practice, most work sits on a spectrum — a 2-point story in a well-understood domain shouldn't generate the same overhead as a multi-epic initiative touching payments infrastructure. Graduated routing reduces friction for the majority of work while ensuring complex, high-risk changes get the full governance chain. It also makes the pipeline more adoptable for teams new to it — the micro path is a low-risk entry point that builds familiarity before the full process is required.

#### Implementation considerations
- Update `/workflow/SKILL.md` with a **Complexity assessment** section before routing:
  - Micro signals: single file change, no integration touch, no AC required, zero regulatory scope
  - Standard signals: feature work, 1–3 systems touched, AC required, no new architectural decisions
  - Complex signals: new integration, architectural decision required, regulatory scope, multiple epics, EA registry impact, > N story points
- Routing outcomes:
  - **Micro**: skip to `/definition-of-ready` directly (or just code)
  - **Standard**: current full pipeline (discovery → benefit-metric → definition → review → test-plan → DoR → code → DoD → trace)
  - **Complex**: full pipeline + mandatory `/decisions` ADR before `/definition`, EA registry review step in `/definition`, architecture NFR gate in DoR, `/trace` auto-triggered post-merge
- Add a complexity override — team lead can explicitly escalate or de-escalate the routing decision
- Document the routing logic in `copilot-instructions.md` so the agent applies it consistently

#### Integration points
- `/workflow` — primary routing logic update
- `/definition` — receives EA registry check flag for complex routing
- `/decisions` — mandatory for complex routing
- `/definition-of-ready` — extended checks for complex routing
- `/trace` — auto-triggered for complex routing

---

### Feature 8: `/clarify` skill between discovery and definition

**Category:** New skill
**Effort:** Medium (1–2 days)
**Analogues:** spec-kit `/speckit.clarify`, Agent OS shaping questions in `/shape-spec`

#### What it is
A lightweight skill that runs after `/discovery` and before `/benefit-metric` + `/definition`, surfacing implicit assumptions, unresolved constraints, and scope boundary ambiguities. It asks a small number of targeted questions and gets explicit answers before the definition pass begins — reducing the rework that happens when `/review` flags issues that should have been caught earlier.

#### Why it matters
The `/review` skill frequently identifies issues that originate in incomplete or ambiguous discovery artefacts: unclear out-of-scope decisions, unstated assumptions about how a system behaves, open questions about integration constraints. Moving these catches upstream — to a dedicated clarify step — reduces the back-and-forth in the review phase and produces a cleaner definition. It's also the natural place to reconcile the incoming idea against the product context layer (Feature 6) and flag any conflicts before story writing begins.

#### Implementation considerations
- Create `.github/skills/clarify/SKILL.md`
- Entry condition: completed discovery artefact exists
- Process:
  1. Read the discovery artefact
  2. Read `product/` context (if Feature 6 is implemented) — flag any conflicts with strategic goals or known constraints
  3. Identify and categorise open questions:
     - **Scope boundary** — what is explicitly out of scope and why?
     - **Integration assumptions** — which system behaviours are assumed but not confirmed?
     - **Constraint gaps** — any regulatory, security, or data classification questions not addressed?
     - **User journey assumptions** — any unstated assumptions about how users will interact?
  4. Present maximum 3–5 targeted questions (not a comprehensive review — if there are more, prioritise the blocking ones)
  5. Update the discovery artefact with the answers
  6. Produce a one-line clarify summary: "Clarification complete. [N] open questions resolved. Discovery artefact updated."
- The skill should decline to write definition artefacts if any blocking questions remain unresolved
- Position in pipeline: `/discovery` → **`/clarify`** → `/benefit-metric` → `/definition`
- Update `/workflow` to include `/clarify` as a standard step (can be skipped on explicit override for well-understood work)

#### Integration points
- `/discovery` — reads and updates the discovery artefact
- `/benefit-metric` — runs after clarify confirms discovery is complete
- `/definition` — benefits from a clarified discovery artefact
- `/review` — should see fewer upstream issues
- Feature 6 (product context) — clarify reconciles discovery against `product/`

---

### Feature 9: Outer-loop CI traceability enforcement

**Category:** Infrastructure / automation
**Effort:** Medium–high (2–4 days — GitHub Actions + trace validation script)
**Analogues:** egg gateway enforcement, 12 Factors Factor IX (traceability), 12 Factors Factor VI (quality gates), Microsoft agentic SDLC article outer-loop CI pattern

#### What it is
A GitHub Actions workflow that runs on every PR open/update and validates the traceability chain: story references a discovery artefact, AC in the PR template maps to a test plan, no metric orphans exist (every benefit-metric has a corresponding AC), and the feature's artefact folder is present. This enforces your quality gates at the merge boundary rather than relying on anyone to remember to run `/trace`.

#### Why it matters
Your `/trace` skill is powerful but manually invoked. In a team of 220 engineers, relying on voluntary skill invocation means the traceability chain is only as strong as the most disciplined team member on a given day. Automating a lightweight trace validation as a CI check means the pipeline's quality guarantees are structural rather than behavioural — closer to egg's philosophy that "the agent cannot bypass controls because the capabilities don't exist in its environment." It also makes the pipeline visible and auditable to people who aren't running skills in Copilot — a tech lead, an architect, or an auditor can see at a glance whether the PR is traceable.

#### Implementation considerations
- Create `.github/workflows/trace-validation.yml`
- Validation checks (fail PR if):
  - PR description does not reference a story file in `artefacts/`
  - Referenced story file does not have a linked discovery artefact
  - Story AC count does not match test-plan AC count (within tolerance — exact match not required, but gross mismatches flagged)
  - Benefit-metric file exists but has no Tier 1 metric defined
  - DoR checklist exists but has unchecked hard-block items
- Validation checks (warn PR, not fail):
  - `/trace` report not yet present in feature folder
  - Spike output referenced in discovery but spike artefact not found
- Output: a PR comment summarising traceability status — green tick per check or description of what's missing
- The validation script should be a standalone Python or bash script in `scripts/validate-trace.sh` so it can also be run locally
- Configuration: a `trace-validation.yml` config at repo root allowing teams to set which checks are hard-fail vs warning, and to exempt certain PR labels (e.g. `hotfix`, `chore`)
- This pairs with Feature 3 (timestamped artefact folders) — the CI check reads from the feature folder structure

#### Integration points
- Feature 3 (artefact folders) — CI reads from feature folder
- PR template — CI validates PR description references
- `/trace` — CI check is a lightweight version of what `/trace` does in-session
- `/definition-of-ready` — DoR checklist is a CI validation input
- `/benefit-metric` — metric presence validated by CI

---

### Feature 10: NFRs as first-class tracked artefacts

**Category:** Artefact layer + workflow enhancement
**Effort:** High (3–4 days — new template, skill updates, DoR extension)
**Analogues:** No direct public equivalent — this is a genuinely differentiated capability for regulated environments

#### What it is
Non-functional requirements elevated from embedded notes in definition artefacts to structured, tracked artefacts with their own lifecycle. Each feature's NFR profile is defined during `/definition`, validated at `/definition-of-ready`, and confirmed at `/definition-of-done`. NFRs are categorised into a Tier 3 class within the benefit-metric model — compliance and risk reduction benefits sit alongside existing customer and business outcome tiers.

#### Why it matters
All public frameworks handle NFRs poorly — they're buried in definition docs or absent entirely. For a regulated financial institution, performance SLAs, data residency requirements, security constraints, and audit logging obligations are as important as functional AC. Making them first-class artefacts with explicit DoR validation means: an engineer can't take a story into coding without a documented performance target; a security requirement can't be implied — it must be stated and confirmed; a data classification decision is recorded, not assumed. This is also the capability most likely to matter in an AI governance audit — "how do you ensure AI-assisted development respects your regulatory obligations?" is answered directly by the NFR artefact chain.

#### Implementation considerations
- Create `.github/templates/nfr-profile.md`:
  ```
  ## NFR Profile: {feature/story name}
  
  ### Performance
  - Response time target:
  - Throughput target:
  - Degradation threshold:
  
  ### Security
  - Data classification:
  - Auth/authorisation requirements:
  - Encryption at rest/transit:
  - Audit logging required: Y/N
  
  ### Data residency & privacy
  - Data sovereignty constraints:
  - Retention policy:
  - PII handling:
  
  ### Availability & resilience
  - RTO/RPO:
  - Dependency failure behaviour:
  
  ### Compliance
  - Regulatory obligations (RBNZ, PCI-DSS, etc.):
  - Relevant policies:
  - Review required: Y/N
  
  ### NFR acceptance criteria
  <!-- Testable AC for each NFR above -->
  ```
- Update `/definition/SKILL.md` to include an NFR profile step: for each epic/story set, generate a draft NFR profile from context (tech stack, domain tags, product constraints) and confirm with the user
- Update `/definition-of-ready/SKILL.md` to add hard-block NFR checks:
  - Data classification confirmed?
  - Performance targets documented?
  - Security constraints reviewed?
  - If compliance flag is set: regulatory review completed?
- Update `/benefit-metric/SKILL.md` to add a Tier 3 metric class:
  - **Tier 3: Compliance / risk reduction** — regulatory adherence, audit trail completeness, security posture improvement, data governance
  - Tier 3 metrics are tracked alongside Tier 1 (customer outcome) and Tier 2 (business outcome) in the benefit-metric artefact
- Update `/definition-of-done/SKILL.md` to include NFR verification: confirm each NFR AC was tested and passed
- Update `/trace/SKILL.md` to include an NFR orphan check: any Tier 3 metrics without corresponding NFR AC?
- Feature 9 (CI enforcement): add NFR profile presence as a validation check for complex-routed PRs

#### Integration points
- `/definition` — NFR profile generated here
- `/definition-of-ready` — hard-block NFR validation
- `/benefit-metric` — Tier 3 metric class added
- `/definition-of-done` — NFR AC confirmation
- `/trace` — NFR orphan check
- Feature 6 (product context) — `constraints.md` pre-populates NFR profile defaults
- Feature 7 (complexity routing) — complex routing triggers mandatory NFR profile; micro routing exempts it
- Feature 9 (CI enforcement) — NFR profile presence validated for complex PRs

---

## Implementation roadmap suggestion

| Phase | Features | Rationale |
|---|---|---|
| Phase 1 — Quick wins | 3, 4, 5 | Structural and naming changes; no new skills required; immediately improve usability |
| Phase 2 — Standards layer | 1, 2 | Build the standards directory with patterns from current codebase; add improve loop |
| Phase 3 — Product context + clarify | 6, 8 | Requires product context to be authored; clarify skill benefits from it |
| Phase 4 — Routing + CI | 7, 9 | Routing needs the full pipeline stable first; CI needs artefact structure from Phase 1 |
| Phase 5 — NFR layer | 10 | Most effort; builds on all prior features; highest strategic value for enterprise context |

---

_Sources: buildermethods/agent-os, github/spec-kit, tikalk/agentic-sdlc-spec-kit, tikalk/agentic-sdlc-12-factors, jwbron/egg, bmad-code-org/BMAD-METHOD, Microsoft Community Hub agentic SDLC article (Feb 2026), Martin Fowler SDD tools comparison_
