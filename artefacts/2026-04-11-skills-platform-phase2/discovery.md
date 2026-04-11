# Discovery: Skills Platform — Phase 2: Scale, Observability, and Self-Improving Harness

**Status:** Draft — awaiting approval
**Created:** 2026-04-11
**Approved by:** — (pending)
**Author:** Copilot / Hamish

---

## Problem Statement

Phase 1 delivered a working, dogfooded platform foundation: a governed delivery pipeline, a git-native surface adapter, an automated CI assurance gate, a watermark regression guard, context-window checkpoint management, a living eval regression suite, three anchor discipline standards, and model risk documentation. The platform operates correctly and is self-verifiable.

The gap is scale. Phase 1 cannot support more than one squad or one delivery surface. Specifically:

- **Only git-native delivery is supported.** Five surface adapter types (IaC, SaaS-API, SaaS-GUI, M365-admin, manual) have no adapter and cannot be governed by the platform. Squads using non-git-native surfaces cannot adopt without building their own adapter.
- **The improvement loop does not exist.** Harness failures identified during delivery are fixed manually. No systematic mechanism extracts failure patterns, proposes SKILL.md diffs, or runs a challenger pre-check before human review. The platform cannot improve itself.
- **Observability is local-only.** There is no cross-squad registry, no CI-generated fleet aggregate, no drift detection, and no persona-appropriate routing (engineers see pipeline state in VS Code; approvers, PMs, and executives have no surface). A platform team trying to support 10+ squads has no visibility of the fleet state without querying each squad's repo individually.
- **Agent instruction format is hard-coded to GitHub.** The assembly script always emits `.github/copilot-instructions.md`. Non-GitHub environments (Bitbucket, Jenkins-hosted agents, enterprise AAIF-compliant tooling) need `AGENTS.md` format. This forecloses adoption for any squad not using GitHub-native inner loop tooling.
- **CI topology is validated on GitHub Actions only.** The Bitbucket Pipelines equivalent was deferred from Phase 1 on testability grounds. Enterprise squads running Bitbucket Pipelines cannot adopt the CI gate until this is validated.
- **Only 3 of 11 discipline standards are live.** The remaining 8 disciplines (data, UX, security-extended, regulatory, infrastructure, DevOps, product, ML/AI) have no POLICY.md floor, meaning squads in those disciplines operate without governance guardrails.
- **Pipeline evolution debt from Phase 1 is unresolved.** Eight identified improvement candidates (D1–D9 batch + B1-enforce) require deliberate pipeline evolution stories before the harness improves itself.

This compounds in a multi-squad context: a squad that cannot find their surface type, cannot see fleet health, and operates in a discipline without standards, hits three adoption blockers simultaneously. Phase 2 resolves all of these.

---

## Who It Affects

**Platform maintainers** — currently operating with zero fleet visibility and manual-only harness improvement. Cannot support a second squad without knowing their pipeline state or surface type.

**Squad leads / tech leads** — squads on IaC, SaaS-GUI, SaaS-API, M365-admin, or manual delivery surfaces cannot adopt the platform. Squads on Bitbucket Pipelines cannot adopt the CI gate.

**Approvers and non-engineer stakeholders** — benefit-metric sign-off, DoR sign-off, and DoD review today require opening VS Code. Non-engineer approvers (PMs, risk leads, compliance) need a persona-appropriate approval surface reachable in their tooling (Jira, Confluence, Slack/Teams).

**Engineers on discipline teams** — security, data, UX, regulatory, infrastructure, DevOps, product, and ML/AI engineers currently operate without a POLICY.md floor for their discipline. Any story in those disciplines has no governance baseline to assurance-check against.

**The improvement loop itself** — the platform's own quality degradation is the long-term risk. Without an improvement agent, the harness drifts from actual delivery patterns over time and accumulated failures go unaddressed.

---

## Why Now

Phase 1 is complete and merged. The baseline is stable and the dogfood signal is live. This is the earliest possible moment to extend:

1. **Phase 1 established the assurance loop.** The CI gate (P1.3), watermark guard (P1.4), and eval suite (P1.6) now produce a signal. That signal is what the improvement agent consumes — it cannot exist before the assurance loop is generating structured traces.
2. **Fleet registry and observability are blocked on Phase 1 completion.** Per-squad `pipeline-state.json` files only exist once squads are running the platform — which requires Phase 1 distribution (P1.1) to be live. Phase 2 P2.3 is directly unblocked by Phase 1 being complete.
3. **Pipeline evolution debt is accumulating.** Eight Phase 1 learnings entries (D1–D9 + B1-enforce) document harness gaps that will affect every Phase 2 story if not resolved early. D1 (dependency chain validation) and D8 (cross-story schema dependency requirement in DoR) are the highest-priority early Phase 2 stories.
4. **p1.8 AC3 (T3M1 evidence record) is deferred pending the first real inner loop story through the P1.3 CI gate.** The first Phase 2 inner loop story processed through the P1.3 gate automatically closes this open item.
5. **Copilot gauge at Phase 2 start: 86.7% of 300 monthly quota.** Monthly reset expected before inner loop work begins (May 1). Outer loop (discovery through DoR) must be completed this session and the next within ~40 remaining requests this quota period.

---

## MVP Scope

The minimum scope for Phase 2 to deliver its stated outcome (10+ squads consuming; improvement loop operational; full surface model available):

**P2.1 — Full platform adapter model**
- Five remaining surface adapters: IaC, SaaS-API, SaaS-GUI, M365-admin, manual — each implementing the `execute(surface, context) → result` interface established in P1.2
- POLICY.md floor variants for surface-specific expressions where the git-native floor is not applicable
- EA registry integration (Path A) — surface type resolved via EA registry query at Phase A start; `context.yml` Path B remains valid and unchanged
- AGENTS.md adapter (ADR-005) — assembly script branches on `vcs.type` and `agent_instructions.format` in `context.yml`; emits `AGENTS.md` for non-GitHub environments, `.github/copilot-instructions.md` for GitHub; content is format-agnostic

**P2.2 — Improvement agent**
- Improvement agent SKILL.md — reads traces via queryable interface; identifies failure and staleness patterns; proposes SKILL.md diffs; applies anti-overfitting gate; updates `state.json`
- Two signal types: failure signal (fix proposals) and staleness signal (removal proposals)
- Queryable trace interface — filter by surface type, date range, failure pattern; designed to promote to cross-team registry in Phase 3 without schema changes
- Challenger pre-check (human-assisted in Phase 2) — improvement agent writes synthetic story spec and proposed SKILL.md to `workspace/proposals/`; maintainer runs dev agent session + assurance session manually; result recorded in proposal before merge
- Trace-to-diff pipeline — reads traces, clusters failures, proposes targeted diff to `workspace/proposals/`

**P2.3 — Cross-team observability**
- Per-squad fleet registry files: `fleet/squads/{id}.json` pattern (not a single shared file — each squad owns its registration entry)
- CI-generated `fleet-state.json` aggregation — CI job collects live `pipeline-state.json` from each registered squad and writes the aggregate; primary source for pipeline-viz fleet view
- `registry_mode` progression in `context.yml` — controls whether a squad is registered, publishing, or consuming fleet state
- Persona channel routing — Confluence/Jira integration for non-engineer approval interfaces; Slack/Teams notifications for approval-stage actions; approval surface reachable outside VS Code
- Channel hint tags (IDE / approval / agent / blocker) on next-action items — presentational layer already in Phase 1 viz; Phase 2 wires routing to these tags

**P2.4 — Remaining discipline standards**
- Eight remaining disciplines at core tier: data, UX, security-extended, regulatory, infrastructure, DevOps, product, ML/AI
- Domain-tier standards for at least three pilot domains
- All standards follow the `standards/index.yml` routing and POLICY.md floor pattern established in P1.7

**P2.5 — CI adapter validation**
- Bitbucket Cloud: YAML syntax validation and pipeline-shape tests (available via free trial account — validates structure without enterprise environment)
- Bitbucket Data Center (Docker): full auth topology tests (app passwords, OAuth, SSH key validation); Docker DC is the local validation path for auth-dependent ACs
- CI topology assumption (Jenkins vs Bitbucket Pipelines native) must be validated before any CI gate adapter story reaches DoR — recorded as an open ASSUMPTION in decisions.md 2026-04-11

**P2.6 — Pipeline evolution stories (Phase 1 debt)**
- D1/D2/D3 batch — `/definition` skill improvements: dependency chain validation, testability-filter check, explicit learnings-write step at skill exit
- D4 — `/review` skill improvement: incremental-write-per-story rather than post-run batch
- D7/D8/D9 + B1-enforce batch — template and DoR improvements: cross-story runtime failure observation type (D7, already actioned — verify), DoR contract cross-story schema dependency requirement (D8), DoD verification prompt field (D9), NFR guardrail presence enforcement (B1-enforce)

---

## Out of Scope

- **Phase 3 capabilities — inter-session orchestration and full challenger automation.** The challenger pre-check in Phase 2 is human-assisted. Fully automated challenger orchestration (one agent session auto-spawning another and recording the result without human involvement) requires inter-session orchestration not available in the current runtime. This is explicitly a Phase 3 capability.
- **Enterprise Bitbucket Data Center shared environment.** Docker-based local DC is the Phase 2 validation path for auth topology. A shared enterprise DC environment is deferred until confirmed available. Confirmed via decisions.md ASSUMPTION 2026-04-11.
- **Production fleet deployment to 10+ squads.** Phase 2 delivers the distribution, observability, and adapter infrastructure to support 10+ squads. Actual onboarding of 10+ squads and fleet rollout occur post-Phase-2.
- **ML/AI safety and fairness standards beyond POLICY.md floor.** The Phase 2 ML/AI discipline standard covers the POLICY.md floor pattern. Detailed ML safety frameworks, model cards, and fairness evaluation tooling are deferred to a specialist standards workstream.
- **`pipeline-viz.html` refactored into a build-step application.** The viz remains a no-build-step, no-server, self-contained HTML file (ADR-001). Any refactor to a build-based SPA is out of scope for Phase 2 and requires a separate ADR to supersede ADR-001.
- **Phase 2.5 estimation calibration loop.** Delivered ahead of schedule during Phase 1 `/levelup` (commit `a3c83c4`). The `/estimate` skill with E1/E2/E3 progressive estimation, `workspace/estimation-norms.md` normalisation table, and Phase 1 baseline actuals are already live. MM4 and MM5 are added to the Phase 2 benefit-metric artefact; no implementation story is needed.

---

## Assumptions and Risks

**A1 — GitHub Actions is the only validated CI surface for Phase 2 planning.** Bitbucket Pipelines remains deferred per the 2026-04-10 SCOPE decision. All Phase 2 stories that reference CI topology assume GitHub Actions as the sole target until the enterprise Bitbucket environment is confirmed. Revisit at Phase 2 kick-off or when a Bitbucket environment is confirmed. (Recorded in decisions.md 2026-04-11.)

**A2 — Bitbucket Cloud (syntax/shape) and Bitbucket DC (auth topology) are distinct testing tiers.** Cloud validates YAML structure and basic run behaviour. DC is required for full auth topology tests (app passwords, OAuth, SSH key resolution). These are not interchangeable. P2.5 stories must specify which tier applies to each AC. (Recorded in decisions.md 2026-04-11.)

**A3 — Challenger pre-check is human-assisted in Phase 2.** One Copilot session cannot spawn another. The improvement agent writes the synthetic story spec and proposed SKILL.md to `workspace/proposals/`; the platform maintainer manually runs a dev agent session + assurance, then records the result. Full automation is a Phase 3 capability.

**A4 — Per-squad fleet files use `fleet/squads/{id}.json` pattern, not a single shared file.** A single shared `fleet-registry.json` is a merge-conflict sink as squad count grows. Each squad owns its own registration file. CI aggregates them into `fleet-state.json`. (Recorded in decisions.md 2026-04-11.)

**A5 — EA registry integration (Path A) is additive.** Squads using `context.yml` Path B continue operating without change. Registry integration is not a migration requirement for existing squads.

**A6 — `standards/index.yml` Phase 1 schema is extensible without breaking changes.** Recorded as provisional in decisions.md 2026-04-09; must be confirmed when 8 additional disciplines + domain-tier entries are added during P2.4 story decomposition.

**R1 — Copilot premium quota.** 86.7% of 300 monthly quota used at Phase 2 start (~40 remaining). Outer loop sessions this quota period consume from this remainder. Monthly reset expected May 1. Inner loop work will use the refreshed quota. Risk: if outer loop extends beyond May 1 context, tracking gauge subtraction against two quota periods becomes complex.

**R2 — Improvement agent anti-overfitting gate may be difficult to formalise.** The staleness signal (instruction over-satisfied by margin >2 quality dimensions on 5+ consecutive stories) requires subjective quality dimension scoring. Without an automated dimension scorer, this gate relies on human judgment — weakening the systematic improvement guarantee.

**R3 — p1.8 AC3 (T3M1 evidence record) is deferred pending first real inner loop story through P1.3.** The first Phase 2 inner loop story processed through the P1.3 CI gate closes this automatically. This is a known open item, not a risk to Phase 2 delivery.

---

## Directional Success Indicators

- A second squad can adopt the platform and run the full outer loop without contacting the platform team — this is also a pipeline dogfood pass
- The improvement agent proposes at least one SKILL.md diff from a real failure pattern observed during Phase 2 delivery, with a challenger pre-check result included
- A non-engineer approver completes a DoR sign-off without opening VS Code
- At least one IaC or SaaS surface adapter produces a passing assurance verdict on a real PR
- The fleet viz shows ≥2 squad states without manual data entry
- The pipeline evolution debt batch (D1/D2/D3, D4, D8/D9/B1-enforce) is cleared — each item has a passing test before implementation

---

## Constraints

- **Update channel must not be severed.** No distribution model that requires forking. (product/constraints.md C1)
- **POLICY.md floors are non-negotiable.** New discipline standards may not weaken a higher-tier floor. Domain and squad configurations may only strengthen. (product/constraints.md C2)
- **Spec immutability.** The improvement agent may not modify story specs, AC, POLICY.md floors, or DoR/DoD criteria. It may propose diffs to SKILL.md files and additions to `workspace/suite.json` only. (product/constraints.md C3)
- **Human approval gate on all instruction set changes.** No SKILL.md, POLICY.md, or standards file merged without human review. Regardless of improvement agent confidence level. (product/constraints.md C4)
- **AGENTS.md format adoption is governed by `vcs.type` in `context.yml`.** Content is format-agnostic; format is an adapter concern only. The three-tier skill content must not branch on format internally.
- **CI topology assumption must be validated before CI gate adapter stories reach DoR.** Any Phase 2 story touching CI topology is gated on the ASSUMPTION entries in decisions.md 2026-04-11 being resolved.
- **`state.json` cycle blocks must include `startedAt`/`completedAt` ISO datetimes from Phase 2 onwards.** Replaces date-only `completedDate` used in Phase 1. (decisions.md 2026-04-11 ARCH)
- **Copilot quota: ~40 premium requests remaining this period (resets May 1).** Discovery through DoR must be scoped to complete within two quota periods where the outer loop falls in the current period.

---

**Next step:** Human review and approval → /benefit-metric
