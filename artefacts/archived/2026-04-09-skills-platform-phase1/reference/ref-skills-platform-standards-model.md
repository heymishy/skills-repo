# Reference: Skills Platform — Multi-Discipline Standards Model

**Document type:** Discovery reference material — standards model  
**Drop into:** `artefacts/2026-04-09-skills-platform-phase1/reference/`  
**Read alongside:** `ref-skills-platform-phase1-2.md`  
**Last updated:** 2026-04-09 (SKILL.md authoring principles; living EVAL.md)

---

## Purpose of this document

The skills platform governs delivery across eleven contributing disciplines. This document defines the standards model: how discipline standards are structured at each of the three tiers, who owns them, how they are composed and injected into the pipeline, and what each discipline's standards govern.

---

## The standards inheritance model

The standards model mirrors the skill inheritance model exactly. Same three-tier structure, same composition mechanics, same POLICY.md floor concept. Squads cannot weaken POLICY.md floors defined at a higher tier.

### Three tiers

**Core (platform repo)** — platform maintainer co-owns with CoP leads. Defines universal baselines. POLICY.md sets the floor no domain or squad can go below.

**Domain (domain repo)** — domain tech lead co-owns with CoP domain SMEs. Defines domain-specific additions. Cannot weaken core POLICY.md floors.

**Squad (consumer repo)** — squad tech lead owns. Defines squad-specific implementation details. Cannot weaken domain or core POLICY.md floors.

### Composition model

At invocation: core standard → domain extension → squad specification → POLICY.md floors validated → injected as one composed standards document. The agent receives one coherent document assembled from three layers.

### Routing — `standards/index.yml`

Maps story context (surface type, discipline tags, domain) to the correct standards files. The discovery skill reads this index to determine which standards apply. It is the authoritative routing table.

```yaml
disciplines:
  software-engineering:
    core: standards/software-engineering/core.md
    policy-floor: standards/software-engineering/POLICY.md
  quality-assurance:
    core: standards/quality-assurance/core.md
    policy-floor: standards/quality-assurance/POLICY.md
    surface-variants:
      saas-gui: standards/quality-assurance/saas-gui-variant.md
      manual: standards/quality-assurance/manual-variant.md
```

---

## SKILL.md authoring principles <!-- ADDED: 2026-04-09 -->

These principles apply to all SKILL.md files and EVAL.md scenarios authored for the platform. They are the authoring standard platform maintainers apply when reviewing proposed skills and proposed improvements from the improvement agent.

### Outcome-oriented, not workaround-oriented

**The core rule:** Instructions must state what the outcome must be, not why the model currently needs reminding.

A workaround-oriented instruction encodes a current model behaviour and goes stale as models improve. An outcome-oriented instruction states the required outcome and remains valid regardless of model capability changes.

| Type | Example | Problem |
|---|---|---|
| Workaround-oriented | "Because the model tends to skip the failing test step, always explicitly remind it to write a failing test before implementation." | Encodes current model weakness. When the model improves, this instruction is dead weight — token cost with no governance value. |
| Outcome-oriented | "A failing test must exist and be committed before any implementation code is committed." | States the required outcome. Correct when the model needs the reminder; still correct when it doesn't. |

**The diagnostic test:** "If this model behaviour improved tomorrow — if the model reliably did this without prompting — would this instruction still be correct?" If yes, it is outcome-oriented and will age well. If no, it is workaround-oriented and will become dead weight.

**The staleness relationship:** Workaround-oriented instructions are the primary source of the staleness signal the improvement agent detects. An instruction consistently over-satisfied by a large margin is likely a workaround the model no longer needs. The improvement agent flags it; the platform team applies the diagnostic test before removing it.

### EVAL.md scenarios follow the same principle

EVAL scenarios must test whether the outcome was achieved, not whether the agent followed a specific procedural path to get there. A scenario that passes only when the agent performs a specific sequence of steps is workaround-oriented. A scenario that passes when the outcome is present — regardless of how the agent produced it — is outcome-oriented.

### Diagnostic checklist for SKILL.md review

Before merging any new or modified SKILL.md instruction:

- [ ] Does this instruction state an outcome, or a workaround for a known model behaviour?
- [ ] If the model improved past the behaviour this instruction addresses, would the instruction still be correct?
- [ ] Is there an EVAL.md scenario that tests the outcome (not the procedure)?
- [ ] Has the anti-overfitting self-reflection test been applied? ("If the specific task disappeared, would this still improve the harness?")

**Human process control limitation:** This checklist is a reviewer judgment call applied under time pressure. Under velocity pressure — when the platform is most in use — a platform maintainer reviewing a PR will likely focus on whether the instruction makes sense, not whether it is outcome-oriented by this definition. The checklist degrades exactly when it matters most. Mitigation: the challenger pre-check (Phase 2) provides an independent signal; making the checklist a required PR template field (not optional) creates a reviewable audit trail of whether it was applied.

---

## Confirmed disciplines — 11 in scope

| Discipline | Tiers | Phase | Core owner | Domain owner | Squad owner |
|---|---|---|---|---|---|
| Software engineering | All 3 | 1–2 | Platform maintainer | Domain tech lead | Squad tech lead |
| Design / UX | All 3 | 1–2 | Platform maintainer + CX design team | CX design team | Squad tech lead |
| Security engineering | All 3 | 1–2 | Platform maintainer + Cyber | Cyber domain SME | Squad tech lead |
| Data engineering / classification | All 3 | 1–2 | Platform maintainer + Data CoP | Data CoP domain SME | Squad tech lead |
| Platform / infrastructure | All 3 | 1–2 | Platform maintainer | Domain tech lead | Squad tech lead |
| Performance engineering | All 3 | 1–2 | Platform maintainer + Quality CoP | Quality CoP | Squad tech lead |
| Quality assurance / test | All 3 | 1–2 | Platform maintainer + Quality CoP | Quality CoP | Squad tech lead |
| Technical writing / docs | All 3 | 1–2 | Platform maintainer + Quality CoP | Quality CoP | Squad tech lead |
| Product management | All 3 | 1–2 | Platform maintainer + Product Mgmt | Product lead | Squad PM |
| Business analysis | All 3 | 1–2 | Platform maintainer | Domain BA lead | Squad tech lead |
| Regulatory / compliance | All 3 | 1–2 | Platform maintainer + Risk & Compliance | Risk & Compliance | Squad tech lead |

---

## Per-discipline summary

### Software engineering
Governs code structure, language standards, testing requirements, dependency management, API design patterns. Core POLICY.md floor: automated test suite required for all git-native stories; coverage threshold defined at domain level.

### Design / UX
Governs accessibility standards (WCAG compliance level), design system component usage, UX pattern library, responsive design requirements. Core POLICY.md floor: accessibility check required before release; design system components used in preference to custom where available.

### Security engineering
Governs OWASP compliance, secret scanning, dependency vulnerability policy, authentication and authorisation patterns. Core POLICY.md floor: no high or critical OWASP findings without accepted risk; secrets never committed to source control.

### Data engineering / classification
Governs data classification tagging, PII handling requirements, data lineage documentation, schema versioning. Core POLICY.md floor: PII fields tagged at model level; data classification declared in story context before delivery begins.

### Platform / infrastructure
Governs IaC patterns, cloud resource tagging, network security group standards, infrastructure change management. Core POLICY.md floor: all infrastructure changes via IaC; no manual console changes in production-equivalent environments.

### Performance engineering
Governs performance budgets, load testing requirements, latency SLO definitions, capacity planning documentation. Core POLICY.md floor: performance budget defined for customer-facing changes; load test evidence required before release.

### Quality assurance / test engineering
Governs test pyramid requirements, E2E test coverage standards, test data management, regression suite maintenance. Core POLICY.md floor: test plan required before implementation begins; automated regression suite must not shrink without approved justification.

### Technical writing / documentation
Governs API documentation standards, runbook format, decision record requirements. Core POLICY.md floor: ADR required for architectural decisions; runbook required for new operational procedures.

### Product management
Governs benefit metric format, story AC standards, MVP scope definition, outcome measurement. Core POLICY.md floor: benefit metric must be measurable and time-bounded; AC must be testable without ambiguity.

### Business analysis
Governs requirements traceability, domain modelling conventions, stakeholder sign-off requirements. Core POLICY.md floor: requirements must trace to a business outcome; ambiguous requirements are a DoR blocker.

### Regulatory / compliance
Governs regulatory traceability AC format, evidence requirements per framework (RBNZ, PCI DSS, AML/CFT), compliance bundle content, model risk documentation. Core POLICY.md floor: regulatory-tagged stories must include compliance traceability AC.

---

## POLICY.md floors and surface-type variants

Some POLICY.md floors have surface-type-specific variants. The floor applies to all surfaces; its expression differs.

Example — "automated test suite required":
- git-native: unit + integration + E2E tests in CI pipeline
- IaC: policy-as-code tests (e.g. Checkov) in CI pipeline
- SaaS-GUI: manual test checklist with screenshot evidence
- Manual: execution record with sign-off

---

## Standards release process

Standards files are versioned alongside SKILL.md files. Same approval process applies: PR review by platform maintainer and CoP co-owner, gated against active EVAL.md suite, merged with `decisions.md` entry.

---

## Living EVAL.md — standards evaluation <!-- ADDED: 2026-04-07 -->

The EVAL.md suite for standards is not static. Each time the assurance agent identifies a new standards compliance failure pattern, it adds the scenario to `workspace/suite.json`. This scenario becomes a permanent regression case.

### Acceptance criteria for standards changes

1. **Existing EVAL suite** — all scenarios in `workspace/suite.json` must pass at or above the current watermark
2. **Authoring principles check** — proposed instruction is outcome-oriented (diagnostic checklist applied)
3. **Anti-overfitting gate** — self-reflection test applied
4. **Human review** — platform maintainer and CoP co-owner confirm no POLICY.md floor is silently weakened

---

## Open questions

1. Do POLICY.md floors enumerate surface-type variants explicitly, or use a "surface-appropriate implementation" clause?
2. Standards discovery: `standards catalog` command in CLI, or onboarding dry-run surfaces the composed set?
3. For disciplines where CoP co-ownership is domain-tier only, who is the core-tier co-owner beyond the platform maintainer?

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-09 | Added SKILL.md authoring principles — outcome-oriented vs workaround-oriented, diagnostic test, EVAL.md corollary, review checklist | §SKILL.md authoring (new) |
| 2026-04-07 | Added living EVAL.md — auto-growing regression suite, acceptance criteria, anti-overfitting gate | §Living EVAL.md |
