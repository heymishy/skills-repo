# Product Mission

## What this product does and for whom

The skills platform is an open-framework, governed software delivery pipeline that enables teams to deliver traceable, high-quality software across all contributing disciplines — from a single developer on a personal project to many teams and communities of practice across a regulated enterprise.

The platform works by encoding delivery standards, quality gates, compliance requirements, design standards, security controls, and discipline-specific practices as versioned, hash-verified instruction sets (SKILL.md files and standards files) that AI agents execute against. Teams run a structured outer loop — discovery through definition-of-ready — that builds complete, validated context drawing on standards from all relevant disciplines. An inner loop then executes that context, with the level of human involvement calibrated to the team's maturity and the risk profile of the work. Real production outcomes and delivery actuals feed back into the pipeline, creating an empirical improvement cycle grounded in actual usage rather than assumptions. Over time, the platform's harness — the SKILL.md files and evaluation suite — improves itself from its own delivery signal, with human approval retained at every change gate.

---

## Personas

### Primary: Developer / engineer
Runs the pipeline daily. Uses the outer loop to define work with the help of an AI assistant. Uses the inner loop to implement. Benefits from consistent, well-specified stories, automated governance checks, and a traceable audit trail without additional overhead.

### Primary: Tech lead / squad lead
Owns delivery governance for a squad. Defines squad-level overrides within tribe bounds. Reviews governance-flagged exceptions escalated by the assurance agent. Signs off on the Definition of Ready. Accountable for benefit metric targets.

### Primary: Platform maintainer
Owns the core skill library, the registry, and the mandatory update channel. Reviews contribution proposals from tribes and squads. Reviews proposed SKILL.md diffs from the improvement agent before merge. Manages the platform-level autoresearch cycle.

### Secondary: UX designer
Contributes design artefacts to the outer loop (wireframes, design tokens, component specs). Participates in Phase A discovery for UI-surface stories. Owns the design system at the domain or platform tier.

### Secondary: UX researcher
Contributes user research signal to benefit metric definition and outcome measurement in the outer loop. Provides the empirical basis for UX-facing POLICY.md floors.

### Secondary: Product manager / business analyst
Owns benefit metric definition, story AC quality, and outcome measurement. Participates in Phase A discovery. Signs off on story readiness from a business value perspective. CoP co-owner for product management and business analysis standards.

### Secondary: CoP leads and discipline teams
Co-own domain and core standards for their discipline (security, data, quality, regulatory, design, etc.). Review and approve standards changes at the core tier alongside platform maintainers.

---

## Success outcomes

A platform consumer who has completed onboarding can:

1. **Run the full outer loop unassisted** — self-directed, single session, without help from the platform team. This is also a pipeline dogfood: onboarding itself is a set of stories the pipeline runs to verify itself.

2. **Adopt in subset** — a squad running git-native delivery only can adopt the platform with the software engineering and quality assurance standards, without being blocked by disciplines or surface types not yet relevant to them.

3. **Augment progressively** — as the squad's delivery context expands (e.g. takes on IaC work, or a regulatory-tagged epic), they add the relevant discipline standards and surface adapter without forking or disrupting their existing pipeline.

4. **Trust the governance output** — a risk or compliance stakeholder reviewing the assurance trace can answer, without engineering assistance: what instruction set governed this action, which standards applied, which model produced the output, was the output validated, and was any regression detected.

5. **Improve the harness without breaking it** — the improvement loop surfaces proposed SKILL.md diffs to the platform team with failure evidence, rationale, and an anti-overfitting check. The platform team can review, accept or reject, and merge — knowing the change has been gated against the living regression suite before it reaches them.

---

## Collaboration surface

The platform is the collaboration surface between disciplines, not a replacement for discipline expertise. It creates structured entry points for:

- Design into the delivery pipeline (design artefact required at Phase B DoR for UI stories)
- Security into the delivery pipeline (OWASP floor applied at assurance gate, not as an afterthought)
- Regulatory into the delivery pipeline (compliance traceability AC required for regulatory-tagged stories)
- Quality into the delivery pipeline (test plan required before implementation begins)
- Product management and business analysis into the delivery pipeline (benefit metric, story AC quality, and outcome measurement owned by product and BA personas; governed by discipline standards injected at DoR boundary)
- UX design and research into the delivery pipeline (design system artefacts and user research signal reference at Phase B discovery; UX researcher provides empirical basis for UX-facing POLICY.md floors)

Discipline experts own their standards at the relevant tier. The platform delivers those standards to the agent at the point of execution.

**Non-technical channel (Phase 5 WS0):** Product managers, business analysts, UX practitioners, and other non-git-native participants currently require either VS Code or a git-native workflow to participate in governed delivery. Phase 5 WS0 delivers a governed channel for non-technical disciplines — with artefact parity (the chain produced via the non-technical channel is structurally identical to the chain produced via engineering surfaces) and plain-language gate translation (DoR hard blocks expressed as discipline-appropriate questions). All discipline entry points above will be reachable from the non-technical channel once WS0 is delivered.

---

## What the platform is not

<!-- UPDATED 2026-11-08: the visibility/planning boundary (first bullet) is revised to
     reflect four new initiatives now going into discovery: (1) an agentic patch->build->
     test->deploy->monitor pipeline with chat notifications, (2) an incident-triage-and-
     respond agent, (3) a unified kanban/backlog visibility surface spanning reactive +
     proactive work, extending the existing src/web-ui/views/kanban-view.js rather than
     building a new UI, and (4) revival of the already-built but never-adopted /programme
     skill. See each initiative's own discovery.md for full rationale; this file records
     the resulting mission-level boundary change, not the initiatives' own scope. These
     are deliberate expansions into new, outward-facing territory, not a continuation of
     recent delivery — the last several weeks of real shipped work (inner-loop-cycle-
     efficiency, bcfx-s1, fixture-hardening-fast-follows, test-suite-infra-refactor) has
     been inward-facing CI/pipeline reliability hardening, not customer-facing incident
     or deploy-monitoring work. That hardening is why the platform is ready to take this
     on, not evidence that it has already started. -->

- **Is now a visibility and planning surface for engineering work — reactive and proactive — but still not a general-purpose project management tool.** The platform extends `src/web-ui/views/kanban-view.js` — the real, already-shipped kanban renderer behind `/dashboard?view=board`, `/org/kanban`, and `/products/:id/kanban` (today 100% forward-looking: features, stories, phases, health) — to also surface reactive operational work (incidents, patches, hotfixes) alongside it, in one place, rather than standing up a separate PM system. This is a deliberate reversal of this file's original "not Jira" framing (see the initiative-specific discovery artefacts for rationale). It does **not** take on general sprint-velocity tracking, stakeholder-report generation, or any other Jira capability that isn't grounded in this platform's own governed artefacts (pipeline-state.json, DoD, decisions.md, incident records) — anything shown in the visibility surface must trace back to a real governed artefact, not a freeform ticket field. Discovery for this specific surface decides exactly where that line sits.
- Not a code generator — it governs what code generation must meet, not what code to generate
- Not a design tool — it references and validates design artefacts; it does not produce them
- Not a compliance management system — it produces compliance evidence; it does not manage compliance programmes
- **Still not a persistent agent runtime** — this constraint is unchanged and is explicitly binding on the new reactive-work initiatives too. The agentic CI/CD pipeline (patch → build → test → deploy → monitor) and the incident-triage-and-respond agent must be designed as CI/CD- or event-triggered executions (a webhook, a scheduled check, a CI job, a chat-command invocation) on top of existing infrastructure — not as a new always-on hosted agent service, listener process, or persistent message queue. "Monitor" and "review telemetry" mean triggered, bounded checks that read existing observability data and exit, not a standing watch process. Any initiative whose design requires a persistent runtime has failed this constraint and must be redesigned, not grandfathered in.
- Not a second-line control in isolation — the platform provides second-line-style automation; organisational second-line independence requires the risk function to independently review the assurance agent's SKILL.md, not just its outputs
- Not a Layer 1 AI coding assistant — the platform governs the execution layer (GitHub Copilot, Claude Code, Cursor) rather than replacing it. The three market layers are distinct: Layer 1 (AI coding assistants: Copilot, Claude Code, Cursor, Kiro), Layer 2 (single-project specification frameworks: GitHub Spec Kit, Vistaly), Layer 3 (enterprise fleet governance: this platform, GitLab Duo Agent Platform, Harness.io). The platform operates at Layer 3, layered on top of Layer 1 tools, without requiring a platform migration or commercial runtime subscription.

---

## Reactive and operational work (added 2026-11-08)

Alongside the existing forward-looking outer/inner loop, the platform is extending into reactive operational work — the other half of a daily engineer's actual workload, which the pipeline has not previously modelled at all. The four initiatives below sit at different distances from what already exists in the codebase; each distance is noted so discovery starts from the real baseline, not an assumed one.

- **Patch/deploy/monitor automation:** an agentic flow covering patch announcement, chat notification (Slack/Teams), build, test-environment run, deploy, and post-deploy monitoring — triggered by CI/CD events, not a new runtime. Real scaffolding to extend already exists: `.github/workflows/deploy-group-auto-rerun.yml`, `staging-deploy.yml`, and `e2e.yml`. Chat notification does not yet exist in the outbound direction — `src/approval-channel/adapters/teams-adapter.js` only handles *inbound* Teams webhook clicks (approving a DoR via an Adaptive Card). Sending a chat notification out is new work, not an extension of that adapter, though its HMAC-verification and channel-dispatch pattern (`approval-channel/index.js`) is a reasonable model to follow.
- **Incident triage and response:** an agent that reviews telemetry and observability data, checks prior incidents and their fixes for a matching pattern, drafts a summary, and posts it to the incident channel — with a human engineer firmly in the loop for the consequential step (promoting an already-lower-environment-tested fix to production and monitoring it). This is second-line-style automation (see "What the platform is not," above) — it drafts and surfaces, a human decides and acts on anything production-facing. This is genuinely greenfield: no incident, error-tracking, or alerting code exists anywhere in `src/` today (PostHog is wired, but for analytics/flags, not incidents), and the monitoring/alerting/log-aggregation rows in this document's "Tool integrations" table are placeholders — those `context.yml` keys are unpopulated in the real config. Discovery for this initiative has to start by choosing a real telemetry/incident source, not by wiring to an existing one.
- **Unified visibility:** both of the above, plus the existing forward-looking story backlog, surfaced together in one view by extending `src/web-ui/views/kanban-view.js` (see the revised "What the platform is not" entry above) so an engineer's daily reality — a mix of planned story work and reactive operational work — is visible in one place instead of two separate systems. Note `dashboards/pipeline-viz.html` is explicitly deprecated and is not part of this surface; `kanban-view.js` and the separate, simpler static mock in `dashboards/index.html` are the two real candidates, and discovery should confirm which one this initiative targets.
- **`/programme` revival:** the programme-level navigator (cross-workstream dependencies, phase gates, consumer registries) was already built for exactly this kind of multi-initiative coordination but has seen negligible real adoption. Revisiting *why* it was never used is itself part of this initiative's own discovery, not assumed to be a tooling gap — the skill's own design already respects every constraint in this file.

Each of these is its own `/discovery` artefact; this section records the mission-level "this is now in scope" decision that unlocks them, not their individual design.
