# Discovery: Governed Distribution, Onboarding, and Brownfield Adoption

<!--
  Produced by /discovery skill — 2026-04-30.
  Covers three inter-dependent initiatives scoped as one discovery.
  Downstream artefacts (benefit-metric, epics, stories, test plans, DoR) are
  produced as DISTINCTLY SEPARATE artefacts per initiative.
  Initiative 3 (governance model prerequisite) is the sequencing constraint:
  its stories must be delivered before any Initiative 1 surface work begins.
-->

**Status:** Draft — awaiting approval
**Created:** 2026-04-30
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot / platform maintainer

---

## Problem Statement

The skills platform cannot currently be adopted by cross-functional teams without three compounding blockers being present simultaneously.

**Blocker 1 — No version pinning (Gap G0a / G14).** There is no lockfile, no `init`/`fetch`/`pin`/`verify` CLI contract, and no named release concept. A consuming squad running `/bootstrap` today pulls from HEAD with no reproducibility guarantee. If the platform team merges a breaking SKILL.md change, all consuming squads silently degrade at their next sync. This blocks regulated or enterprise adoption where reproducibility of the delivery process is a compliance requirement.

**Blocker 2 — No non-git, non-technical entry path (Gap G0b).** The only supported onboarding path today requires VS Code, git, and familiarity with the pipeline phase sequence. A business analyst, delivery lead, or product manager who wants to run the outer loop cannot start without engineering assistance. The platform instructs but does not orient: there is no `/where-am-i` concierge that tells a first-time user what to do next given where they are. This does not mean "build a web UI" — it means the CLI and skill layer lack the orientation contract.

**Blocker 3 — No brownfield entry path (Gap G17).** Teams with existing codebases, existing stories, or live systems have no structured entry point. The pipeline assumes greenfield: run `/bootstrap`, start at `/discovery`. A team arriving with a repo full of code, partial documentation, or working software has no supported path to adopt the platform without abandoning their existing investment. This is the majority of real-world teams.

**Root cause across all three (REDESIGN signal 3 — critical).** The outer loop skills (`/discovery`, `/benefit-metric`) are structurally engineer-executable. Non-technical input is advisory, not required. Discovery artefacts can be — and routinely are — produced by a single engineer without business or domain input. This means the governance quality that the platform promises is structurally absent from day one. Attribution fields (who contributed, who reviewed, who approved) are not required fields. The DoR hard block `H-GOV` (which would enforce attribution coverage before a story reaches implementation) does not exist. Until Initiative 3 ships, all onboarding work recruits teams into a governance model that does not enforce what it claims to enforce.

---

## Who It Affects

**Platform consumers — engineer adopters on brownfield codebases.** Engineers arriving with existing code and no artefacts. They want to adopt the platform's delivery model but have no supported path in. They hit the absence of brownfield entry (Gap G17) immediately.

**Platform consumers — non-technical outer loop participants.** Business analysts, product managers, delivery analysts, SMEs who want to run or contribute to the outer loop but cannot do so without engineering assistance. They hit Gap G0b: no orientation skill, no non-git distribution model, no `/where-am-i` concierge.

**Platform consumers — tech leads on regulated or enterprise teams.** Tech leads who need reproducibility guarantees before adopting. They hit Gap G0a/G14: no lockfile, no version pinning, no release channel. They cannot commit to the platform if the version they test against and the version they run in production may silently diverge.

**Platform maintainer.** Responsible for platform adoption and quality. Currently unable to provide onboarding paths that match the actual adoption contexts. Recruits teams into a governance model whose attribution requirement is un-enforced at DoR.

**Non-technical stakeholders as discovery contributors.** BAs, business leads, domain experts who should be named contributors on discovery artefacts but are currently absent from the process because the skills do not require their presence. Their absence degrades discovery quality in ways that surface only later in delivery as scope drift or AC rework.

---

## Why Now

Three independent signals have converged to make this the next platform priority.

**Signal 1 — WS0 prerequisite gate.** All Phase 5 workstreams (WS1–WS7: peer reviewer agents, context governance, Teams bot, facilitation canvas, etc.) are gated on WS0 completion. WS0 is the lockfile + distribution + onboarding layer. Phase 5 cannot start until WS0 ships. The roadmap is blocked on this feature.

**Signal 2 — Dogfooding evidence.** The platform has delivered 11 features against itself. Every discovery artefact in that set was produced by a single engineer. No non-technical stakeholder contributed to any attribution section. The governance model claims cross-discipline delivery; the artefact record shows engineer-only delivery. The gap is now documented and demonstrable — Initiative 3 has evidence to act on.

**Signal 3 — Active brownfield adoption blocked.** Multiple teams have expressed interest in adopting the platform but cannot start because they have existing codebases and no supported entry path. Initiative 2's brownfield entry patterns (A: story-first via `/tdd`; B: code-first via `/reverse-engineer → /discovery`; C: no-history via retrospective story) were identified by surveying actual adoption blockers. Without them, the platform only serves greenfield teams — a minority of real-world contexts.

---

## MVP Scope

This discovery covers three initiatives in one artefact. Downstream artefacts are distinctly separate per initiative (see note at top). The MVP for this discovery is the union of the three initiative MVPs, delivered in initiative order (3 → 1 → 2).

**Initiative 3 MVP (prerequisite — must land first):**
- Required `contributors`, `reviewers`, and `approved_by` attribution fields in the `/discovery` SKILL.md output artefact template.
- Required attribution acknowledgement in `/benefit-metric` SKILL.md.
- New DoR hard block `H-GOV` (Definition of Ready Governance block): a story whose discovery or benefit-metric artefact carries an empty `Approved By` field fails `H-GOV` with a specific, actionable message identifying the attribution gap.
- The block must distinguish between "empty field" (fail) and "non-engineering approver present" (pass with metric signal).
- Observable MVP test: an engineer-only discovery artefact — one with no non-technical contributor listed — fails `H-GOV` at DoR with a message that names the gap.

**Initiative 1 MVP (onboarding — after Initiative 3):**
- `/where-am-i` concierge skill: reads current artefact state (or absence of artefacts) and tells the operator exactly which pipeline skill to run next and why.
- One-command install path: `npm run platform:init` (or equivalent) bootstraps the platform in a new repo without requiring the operator to navigate the pipeline manually.
- Lockfile contract: `platform-lock.json` (or equivalent) records the pinned skill SHA, version, and fetch timestamp. `platform:verify` checks pinned SHA against installed files.
- CLI stubs `init`, `fetch`, `pin`, `verify` are implemented (currently unimplemented stubs).
- Observable MVP test: a consuming team runs `/bootstrap` then `/where-am-i` and knows exactly what to do next without contacting the platform team.

**Initiative 2 MVP (brownfield entry — after Initiative 1):**
- Entry A (story-first): `/where-am-i` concierge detects existing stories with no discovery artefact and routes to `/tdd` as brownfield entry.
- Entry B (code-first): `/where-am-i` detects existing codebase with no stories and routes to `/reverse-engineer → /discovery` as brownfield entry.
- Entry C (no-history): concierge surfaces the retrospective story path for teams with delivered code and no prior artefacts.
- Observable MVP test: at least one non-engineering persona can be named as `contributors` in a real discovery artefact produced by a cross-functional pair running the platform together via the brownfield entry path.

---

## Out of Scope

- **Facilitation-native web UI (canvas).** The framing test (does "facilitation canvas" vs "lower-friction tool" framing change BA adoption response) must run before any design investment. Canvas work is Phase 5 WS6, explicitly deferred until the framing test confirms the hypothesis. Building canvas before the test is confirmed is scope waste per REDESIGN signal 4.

- **Teams bot deployment (WS0.7).** `src/teams-bot/bot-handler.js` exists; the spike verdict is PROCEED. However, WS0.7 is gated on WS0.4 (non-git consumer distribution model) AND on Initiative 3 (governance model prerequisite). Deploying a Teams bot channel into a pipeline whose outer loop does not enforce attribution would reproduce the governance failure mode the platform is designed to prevent. WS0.7 is a successor feature, not a story in this one.

- **Peer reviewer agents and capability manifest (WS1–WS3).** Phase 5 workstreams WS1 (harness infrastructure, hook events), WS2 (subagent isolation), and WS3 (context governance) are sequenced after WS0 completion. They are out of scope for this feature.

- **The regulated dogfood story as a deliverable.** Running this platform's own Phase 5 delivery under the governance model redesigned by Initiative 3 is a desirable constraint (it will appear as an NFR in Initiative 3 stories) but is not a story in this feature. The dogfood constraint is a forcing function for quality, not a separate deliverable.

- **Azure DevOps consumer distribution adapter (WS0.4).** The ADO channel adapter is part of WS0.4, which is a successor to the lockfile/init work in Initiative 1. The lockfile schema must be forward-compatible with ADO consumers, but the adapter itself is out of scope here. Initiative 1 must leave the schema open for it.

- **Multi-team fleet-level lockfile synchronisation (WS4).** WS4 (spec integrity and verbatim instruction assembly record) is Phase 6. The lockfile schema introduced in Initiative 1 must not conflict with WS4 requirements, but WS4 implementation is explicitly deferred.

---

## Assumptions and Risks

**Assumption 1 — Attribution governance is sufficient to change behaviour.** We are assuming that making attribution fields required at DoR will cause cross-functional teams to actually include non-technical contributors, rather than adding a token name to clear the block. Risk: teams clear the block with minimal compliance. Mitigation: M3 (non-engineering outer loop attribution rate) is a measurement metric, not a one-time gate — it will surface gaming.

**Assumption 2 — The three brownfield entry patterns cover the actual distribution of incoming teams.** Entry A (story-first), B (code-first), and C (no-history) are derived from surveying teams who expressed interest in adoption. Risk: the actual distribution differs — e.g. most teams have partial discovery artefacts, which none of the three patterns covers cleanly. Mitigation: validate with 3–5 actual brownfield team interviews before finalising Initiative 2 stories.

**Assumption 3 — The lockfile schema can be made forward-compatible with WS4 without a full WS4 design.** We are assuming the minimum lockfile fields (skill SHA, version, fetch timestamp, source URL) are stable enough to not require replacement when WS4 arrives. Risk: WS4 requires fields or constraints that conflict with the Initiative 1 schema. Mitigation: read `artefacts/phase5-6-roadmap.md` WS4 description before finalising lockfile schema; note incompatibilities as explicit constraints in Initiative 1 stories.

**Assumption 4 — `/where-am-i` can be implemented as a skill without a new pipeline stage.** We are assuming the concierge skill can read artefact state (presence/absence of discovery.md, benefit-metric.md, pipeline-state.json entries) and route correctly without requiring a new `pre-discovery` pipeline stage. Risk: the routing logic is too complex for a skill and requires infrastructure. Mitigation: scope the skill as a read-only navigator that outputs a recommended next step; do not attempt to execute the step automatically.

**Assumption 5 — H-GOV can be implemented as a hard block without schema changes.** The DoR hard block `H-GOV` checks for a non-empty `Approved By` field. We are assuming this check can be implemented as a text-presence test in the SKILL.md instruction set without requiring a machine-readable attribution schema. Risk: free-text attribution fields are too ambiguous to validate reliably. Mitigation: define a required format for the `Approved By` field in the template (Name — Role — Date) and validate all three sub-fields are present.

---

## Directional Success Indicators

- A first-time consumer (no prior platform experience) runs `/bootstrap` and `/where-am-i` and reaches their first skill invocation without contacting the platform team. Time-to-first-skill-run target: under 2 minutes.
- An engineer-only discovery artefact fails DoR with a specific `H-GOV` message naming the attribution gap. Zero ambiguity about what is missing or how to resolve it.
- At least one non-engineering persona (BA, delivery lead, product manager) is named as a contributor in a real discovery artefact produced in production use — not in a test run.
- The platform can be pinned to a named version. A `platform:verify` check confirms the installed skills match the locked SHA. A version mismatch produces a specific, actionable error.
- A brownfield team with an existing codebase reaches a supported entry path in one concierge interaction, without abandoning their existing investment.
- Zero orientation contacts to the platform team from teams who have run `/bootstrap` in the measurement window following this feature's release.

---

## Constraints

**Sequencing constraint (hard).** Initiative 3 (governance model prerequisite) must be fully delivered — its stories merged — before any Initiative 1 surface work (the `/where-am-i` skill, `platform:init` command) begins implementation. The reason: any surface work that recruits teams into the governance model before `H-GOV` exists will create adoption debt. The ordering is enforced at DoR: Initiative 1 stories must list Initiative 3 as a prerequisite dependency.

**Platform change policy (hard).** SKILL.md changes (Initiative 3: `/discovery`, `/benefit-metric`, `/definition-of-ready` modifications; Initiative 1: new `/where-am-i` SKILL.md) must be merged via PR with platform team review. No direct commits to master for governed skill files. This is ADR-level policy and cannot be bypassed.

**Zero new npm dependencies (derived from p3.3 and ADR-009 precedent).** The CLI commands (`init`, `fetch`, `pin`, `verify`) and the lockfile implementation must use Node.js built-ins only. No new package.json runtime dependencies. YAML handling in workflows uses `yq` (already established by caa.2).

**No `contents: write` permission in GitHub Actions workflows (ADR-009).** The `platform:verify` CI step must not write to the repo. It is a read-only check that fails the gate or emits a warning.

**Spec immutability.** The improvement agent (and any automated process) cannot modify initiative story specs, ACs, DoR criteria, or POLICY.md floors. Human authorship and review are required at every change gate for governed files.

**Forward-compatibility obligation.** The lockfile schema introduced in Initiative 1 must not conflict with WS4 (Phase 6 spec integrity workstream). Read `artefacts/phase5-6-roadmap.md` WS4 description before finalising schema. Flag any incompatibilities as explicit constraints in Initiative 1 DoR artefacts.

---

## Contributors

- Platform maintainer — discovery operator and author

## Reviewers

- [Name — Role — to be filled before approval]

## Approved By

[Name — Role — Date — to be filled after human review]

---

## Initiative Sequencing (for downstream artefacts)

The three initiatives within this discovery are delivered in a fixed sequence. Each initiative produces **distinctly separate** downstream artefacts: separate benefit-metric, separate epics, separate stories, separate test plans, and separate DoR artefacts. They are grouped under one discovery solely because they share a common root problem and their MVPs are interdependent.

| Order | Initiative | Prerequisite | Governing constraint |
|-------|-----------|-------------|---------------------|
| 1 | **Initiative 3** — Governance model prerequisite | None | Must land before I1 and I2 surface work |
| 2 | **Initiative 1** — Seamless onboarding + lockfile | Initiative 3 complete | `/where-am-i` skill + `platform:init/fetch/pin/verify` CLI |
| 3 | **Initiative 2** — Brownfield entry | Initiative 1 complete | Entry A/B/C concierge routing |

**Artefact directory layout (proposed):**

```
artefacts/2026-04-30-governed-distribution-and-onboarding/
  discovery.md                          ← this file
  benefit-metric/
    initiative-3-governance-benefit-metric.md
    initiative-1-onboarding-benefit-metric.md
    initiative-2-brownfield-benefit-metric.md
  epics/
    initiative-3-epics.md
    initiative-1-epics.md
    initiative-2-epics.md
  stories/
    i3.1-attribution-fields-in-discovery.md
    i3.2-attribution-fields-in-benefit-metric.md
    i3.3-h-gov-dor-hard-block.md
    i1.1-where-am-i-concierge-skill.md
    i1.2-platform-init-cli.md
    i1.3-lockfile-schema-and-pin-verify.md
    i2.1-brownfield-entry-a-story-first.md
    i2.2-brownfield-entry-b-code-first.md
    i2.3-brownfield-entry-c-no-history.md
  test-plans/
    [one per story]
  dor/
    [one per story]
  dod/
    [one per story — post-merge]
```
