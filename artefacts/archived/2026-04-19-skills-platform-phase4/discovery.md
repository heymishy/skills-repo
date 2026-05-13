# Discovery: Skills Platform — Phase 4: Distribution, Structural Enforcement, and Non-Technical Access

**Status:** Approved
**Created:** 2026-04-19
**Approved by:** Hamish, 19-04-2026 17:28
**Author:** Hamish

---

## Problem Statement

The skills platform has three categories of problem that are blocking adoption and limiting reach at current scale.

**Distribution and sync:** Real-world consumers (Craig's work context, Thomas as an independent senior engineer) are hitting blockers trying to clone the repo, stay current as the platform evolves, and integrate it into their existing work without breaking their repo structure or commit provenance workflows. The original assumption — that a `git clone` plus a remote pull would be sufficient — has proven wrong. Repo structure collisions, enterprise traceability requirements (commit references), and update channel drift are all observed now, not theoretical. Each new consumer inherits the same walls unless this is fixed first.

**Structural enforcement with navigation flexibility:** The platform currently relies on the agent choosing to follow skills correctly — instructional governance. Phase 3 independent operator use produced direct evidence that an agent can read a skill verbatim, understand its design intent, and still choose to violate its prescribed method, producing schema-conformant output that hides the violation. Post-hoc gate evaluation cannot detect this. The platform needs structural enforcement — the agent must be constrained at invocation time, not just evaluated after the fact. However, enforcement must not collapse the multi-path navigation model the platform depends on: operators move forward, backward, regroup on prior steps, and iterate. A light track for small enhancements (add stories, ACs, tests quickly) is also needed.

**Non-technical access:** The standards model governs eleven disciplines including product management, business analysis, and business leadership. These roles currently cannot participate in governed delivery at all — the distribution surface is VS Code and git, which is inaccessible to people who work in PowerPoint, Word, Teams, and occasionally Jira or Confluence. The governance trail produced by the assurance gate is technically correct but unreadable to auditors and risk professionals without engineering assistance.

---

## Who It Affects

**Current consumers (experiencing the distribution and enforcement problems now):**
- Tech leads at work (Craig's context) — trying to onboard their squads onto the platform; hitting repo structure collisions and commit provenance issues with enterprise traceability standards
- Senior individual engineers on the open framework (Thomas and others) — trying to clone, install, and stay current; experiencing fork drift and sync friction

**New audience (currently excluded by the toolchain):**
- Product managers and product owners — work in PowerPoint, Word, and sometimes Confluence or Jira; not VS Code; currently cannot participate in governed delivery at all
- Business analysts — same toolchain profile; own AC quality and benefit metric definition in the standards model but cannot reach the pipeline
- Business leads — need to review and approve discovery, benefit metrics, and DoR contributions; currently have no interface that meets them where they work

**Downstream audience (needs readable governance output):**
- Auditors and risk professionals — need to consume the traceability and governance evidence chain without git access, tooling, or engineering assistance

---

## Why Now

Adoption momentum is building — the platform is generating interest and senior leads are actively trying to use it. Two have already hit blockers (Craig, Thomas). The trigger is not a regulatory deadline or a sprint milestone; it is the recognition that scaling further before fixing these problems will compound them. Solve it now while the consumer base is small and the cost of fixing is low; wait and each new consumer inherits the same walls.

---

## MVP Scope

1. **Distribution:** A mechanism for existing and new consumers to stay current with the platform as it evolves — pulling updates, seeing what changed, and integrating without breaking their existing repo structure or commit provenance workflow. Works alongside their existing git workflow and PR process. Specifically addresses: repo structure collision, commit provenance (install generates no commits), update channel drift (versioned releases with lockfile visibility), and the upstream authority question (resolved as a spike deliverable).

2. **Structural enforcement with navigation flexibility:** Spike the candidate mechanisms from the reference document (CLI prompt injection, MCP tool boundary, orchestration framework, structured output schema validation) to determine which combination delivers per-invocation skill fidelity while preserving the ability to move forward, backward, regroup on a prior step, and run a light track for small enhancements. Outcome is a committed mechanism design — not Craig's CLI in isolation, but a considered choice that also must be compatible with non-technical surfaces downstream. Craig's CLI work is an input and candidate reference implementation for one mechanism; the spike programme determines the full design.

   **Spike exit criteria (Phase 4 is not complete until all of these exist):**
   - **Spike A (distribution architecture):** Decision record — which distribution model (lockfile, versioned package, install-generates-no-commits) is adopted and why. No reference implementation required; architectural question must have a committed answer.
   - **Spike B1 (MCP tool boundary):** Reference implementation — working code demonstrating whether the MCP boundary is a genuine per-invocation enforcement point in VS Code + Copilot and Claude Code, or bypassable via direct file access alongside MCP tools. Decision alone is insufficient; the boundary claim must be demonstrated.
   - **Spike B2 (CLI enforcement / shared core):** Reference implementation — Craig's CLI navigation primitives (`navigate`, `back`, `advance --to=<step>`) integrated with or alongside a shared governance core. Must demonstrate that the CLI mechanism can coexist with MCP and orchestration paths, not only work in isolation.
   - **Spike C (upstream authority):** Reference implementation — a working prototype of the publishing layer (or a confirmed decision that direct upstream pull is sufficient), with commit provenance behaviour demonstrated end-to-end. Architectural question cannot be resolved by decision alone; the provenance behaviour must be shown working.
   - **Spike D (Teams compatibility):** Working implementation — a running Teams bot prototype that demonstrates the one-question-at-a-time pattern (C7) end-to-end. A decision record or research verdict is not sufficient; the pattern must be demonstrated in a real Teams environment. Requires an Azure/MS account for provisioning. Spike D is not complete until the bot runs and the C7 interaction pattern is validated against the live Teams surface.

3. **Non-technical access — working prototype at MVP:** Spike D delivers a running Teams bot prototype that demonstrates the one-question-at-a-time pattern (C7) end-to-end in a real Teams environment. An Azure/MS trial or development account must be provisioned before Spike D can begin. The working prototype validates that product managers, BAs, and business leads can participate in governed outer loop steps (discovery, benefit-metric, clarify, DoR contribution) via Teams without needing VS Code or git.

4. **Readable governance output:** The working Teams prototype inherently addresses governance readability — once the artefact chain is surfaced through a live Teams surface, consumability for auditors and risk professionals follows from the same design choices.

---

## Out of Scope

- **Jira and Confluence integration** — explicitly deferred. The non-technical surface is MS Teams first; Jira/Confluence are a later phase.
- **Operational domain standards** — the Phase 5 roadmap content (agent identity, policy lifecycle management, cross-team autoresearch) does not move into Phase 4 scope.
- **Replacing the VS Code + git path** — the existing technical operator experience stays intact. Phase 4 adds new surfaces and distribution mechanisms alongside it; it does not remove or deprecate the current path.
- **A production-ready Teams bot** — Phase 4 delivers a working prototype validated against C7. A hardened, consumer-facing Teams bot (full error handling, auth, admin deployment) is a subsequent delivery.

---

## Assumptions and Risks

**Assumptions (unvalidated — require spike resolution):**
- The MCP tool boundary is a genuine enforcement boundary in VS Code + Copilot and Claude Code — not bypassable via direct file access alongside MCP tools. This is unvalidated and is the primary Spike B1 question.
- A Teams-based surface can deliver the one-question-at-a-time conversational pattern (C7) with sufficient fidelity. The interaction model may degrade in a chat surface compared to a dedicated IDE.
- Craig's CLI PR is architecturally compatible with a shared governance package — not so CLI-specific that it cannot share a core with MCP or orchestration mechanisms. Spike A resolves this.

**Risks:**
- **Distribution is harder than it looks.** The original assumption was that `git clone` plus setting a remote and running a pull would be sufficient. Real-world adoption (Craig, Thomas) has shown this breaks on repo structure collision, commit provenance, and enterprise traceability requirements. The actual solution space requires architectural work — versioned packages, lockfile model, install-generates-no-commits — that may take longer than expected.
- **Mechanism selection without spikes is premature.** Committing to any single enforcement mechanism before the spikes complete risks building the wrong thing. Craig's CLI is valuable but must be evaluated in the context of the full mechanism design space — not adopted as the default before alternatives are assessed.
- **Non-technical surface adoption depends on behavioural change.** PMs and BAs need to change how they initiate and contribute to delivery work. The working Teams prototype (Spike D) validates the toolchain change; the workflow adoption risk remains.
- **Azure/MS account is a hard prerequisite for Spike D.** A trial or development Azure/MS account must be provisioned before Spike D can begin. If account provisioning is delayed, Spike D is blocked. Spikes A, B1, B2, and C are not blocked by this dependency.
- **Azure/MS account is a hard prerequisite for Spike D.** A trial or development Azure/MS account must be provisioned before Spike D can begin. If account provisioning is delayed, Spike D is blocked. Spikes A, B1, B2, and C are not blocked by this dependency.
- **Upstream authority is unresolved.** Whether `heymishy/skills-repo` is the direct authoritative upstream for consumers or whether an intermediate publishing layer exists affects the distribution architecture. This is a Spike C deliverable; design decisions that depend on it must wait.

---

## Directional Success Indicators

- Craig and Thomas can stay current with the platform as it evolves — pulling updates, seeing what changed — without breaking their existing repo structure or commit provenance workflow
- Both can contribute PRs back to the framework alongside their normal delivery work, not as a separate maintenance burden
- Craig and Thomas are confident enough in the sync and enforcement story to onboard their teams — the problem feels solved, not worked around
- A team member picked by Craig or Thomas can adopt the platform without hitting the walls Craig and Thomas hit
- (Working prototype, Phase 4) A non-technical participant (PM, BA, business lead) can interact with the platform via a running Teams bot prototype that demonstrates C7 one-question-at-a-time fidelity end-to-end — validated by Spike D working implementation

---

## Constraints

- **C1** (update channel never severed): any distribution model must allow consumers to receive platform updates without forking. Conservative pinning is permitted but must not become silent fork drift.
- **C4** (human approval gate): no change to SKILL.md, POLICY.md, or standards files may be merged without human review and explicit approval — regardless of mechanism.
- **C5** (hash-verified skill files): every SKILL.md delivered to an agent must be versioned and hash-verified. Lockfile pinning must preserve this across all distribution paths.
- **C7** (one question at a time): applies to any non-technical channel surface as strictly as to the VS Code path.
- **C11** (no persistent hosted runtime for enforcement): all enforcement mechanisms must operate locally. Azure Foundry as an orchestration service requires a formal ADR before adoption due to C11 conflict with the platform's multi-toolchain portability intent. **Phase 4 clarification:** the ADR gate applies at consumer shipment, not during spike exploration. Spike B2 may explore all candidate mechanisms — including orchestration frameworks — freely, and may produce a reference implementation once a candidate is identified. The ADR is required before any orchestration-based mechanism ships to consumers; that gate belongs to Phase 5 or the relevant release cycle.
- **Craig is a community contributor working in a fork** — his CLI work is a valuable input and reference implementation, but delivery timelines cannot depend on his availability. The spike programme must be able to proceed independently.
- **Upstream authority unresolved** — whether `heymishy/skills-repo` is the direct authoritative upstream or whether an intermediate publishing layer exists is a Spike C deliverable. Scope decisions that depend on this must wait for that spike output.
- **No hard timeline** — the trigger is adoption momentum, not a regulatory deadline. However, Craig and Thomas are blocked now, giving the distribution problem an implicit urgency floor.

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

2026-04-19 — Clarified via /clarify (Sonnet 4.6, operator: heymishy):
- Q: What are the spike outputs that must exist before Phase 4 is considered complete?  A: Mix — Spikes A and D are decision-only per original plan, but A is now decision record; Spikes B1, B2, and C require reference implementations. Spike exit criteria added to MVP scope item 2.
- Q: Does the C11 ADR gate apply within Phase 4 or at consumer shipment?  A: At consumer shipment only. Spike B2 may explore all mechanisms freely (including orchestration frameworks) and produce a reference implementation once a candidate is identified. ADR required before any orchestration mechanism ships to consumers.
- Q: What must Spike D (Teams compatibility) deliver for Phase 4 to be complete?  A: A working Teams bot prototype that demonstrates C7 one-question-at-a-time fidelity end-to-end in a real Teams environment. Requires an Azure/MS trial account. Research verdict alone is not sufficient.

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | discovery |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/discovery.md |
| run_timestamp | 2026-04-19T14:00:00Z |

> **Security note:** `model_label` is a descriptive string only. No API keys or credentials are included (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 21 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 8 |
| intermediates_produced | 8 |

**files_referenced:**

- .github/skills/discovery/SKILL.md
- product/mission.md
- product/constraints.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
- .github/context.yml
- .github/templates/discovery.md
- .github/templates/capture-block.md
- C:/Users/Hamis/code/ea-registry-repo/registry/applications/ (queried — no entry for skills platform)

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | All 8 sections produced; each confirmed by operator before proceeding |
| Scope adherence | 5 | One-question-at-a-time pattern followed throughout; no batching |
| Context utilisation | 4 | ref-skills-platform-phase4-5.md and PR #155 conversation both incorporated; EA registry queried but no entry found |

### Backward references

- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes
- target: product/constraints.md
  accurate: yes
- target: product/mission.md
  accurate: yes
- target: github.com/heymishy/skills-repo/pull/155
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
