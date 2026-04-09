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

Discipline experts own their standards at the relevant tier. The platform delivers those standards to the agent at the point of execution.

---

## What the platform is not

- Not a project management tool — it does not replace Jira, track sprint velocity, or generate reports for stakeholders
- Not a code generator — it governs what code generation must meet, not what code to generate
- Not a design tool — it references and validates design artefacts; it does not produce them
- Not a compliance management system — it produces compliance evidence; it does not manage compliance programmes
- Not a persistent agent runtime — it uses existing CI/CD infrastructure as the execution environment; it does not require a hosted agent service
- Not a second-line control in isolation — the platform provides second-line-style automation; organisational second-line independence requires the risk function to independently review the assurance agent's SKILL.md, not just its outputs
