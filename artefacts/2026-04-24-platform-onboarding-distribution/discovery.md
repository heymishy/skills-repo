# Discovery: Platform Onboarding, Distribution, and Brownfield Adoption

**Status:** Approved
**Created:** 2026-04-28
**Approved by:** Operator, 2026-04-28
**Author:** Copilot (from reference synthesis — `artefacts/2026-04-24-platform-onboarding-distribution/reference/ref-onboarding-distribution-discovery-input.md`)

---

## Problem Statement

Platform adoption across non-engineering disciplines is structurally blocked at three distinct layers that compound each other:

**Layer 1 — Environment gate:** The outer loop (discovery through definition-of-ready) requires VS Code, git credentials, and GitHub Copilot extension approval to be present on the consumer's device before any pipeline activity can begin. In enterprise environments this represents 1–4 weeks of IT procurement overhead and technical configuration that is outside the control of a BA, product manager, or business lead. No path exists to run discovery or contribute attributed input without a local git setup.

**Layer 2 — Governance dysfunction:** Even where environment access is solved, the outer loop can be executed entirely by a single engineer with no structural requirement for non-technical input. The `/discovery` and `/benefit-metric` templates have no required attribution fields. A discovery artefact with no named business stakeholder passes DoR sign-off today. This makes non-technical contribution advisory rather than authoritative — which is indistinguishable, from the outside, from a pipeline that does not require non-technical input at all. Senior stakeholders who resist formalising discovery governance (because the informal governance model currently protects their deniability) have no incentive to engage with a platform that does not force the question.

**Layer 3 — No brownfield entry path:** Teams with existing codebases, partially-built features, or prior discovery processes have no explicit, low-overhead route into the pipeline. The current documented entry (clone + `docs/ONBOARDING.md`) assumes a greenfield starting point. Teams with working code, written stories, or shipped features face a "start from scratch" barrier that has no structured alternative.

The consequence of all three layers together: the platform's claim to cross-discipline governance is rhetorical. WS0 (the distribution and onboarding workstream) is the explicit entry condition for every Phase 5 workstream (WS1–WS7). Until it is delivered, Phase 5 is reachable only by the platform maintainer.

## Who It Affects

**Business analysts / delivery analysts:** Want to own the outer loop — run discovery, define benefit metrics, write acceptance criteria — without requiring an engineer as a co-author or translator. Currently blocked by Layer 1 (environment gate) and Layer 2 (outer loop treats their input as advisory). This is the primary adopter population for Initiative 3.

**Product managers / product owners:** Need to run the outer loop end-to-end as the named owner of business value definition. Currently blocked by the same structural gaps as BAs. The most likely first non-engineering persona to adopt once Layer 2 is fixed, because they already have a job-to-be-done around governance records.

**Senior business stakeholders (sponsors, business leads):** Are the sign-off population for discovery and benefit-metric artefacts. Currently not named in any pipeline artefact — their involvement is optional and unverified. The attribution model in Initiative 3 must offer bounded accountability they will accept. Their resistance is the primary adoption friction in Cluster 5 of the ideation analysis.

**Platform consumers with existing codebases (brownfield teams):** Engineering teams or squads who have written code, produced discovery notes, or shipped features but have not yet adopted the pipeline. Blocked by Layer 3 — no entry path exists for their context. Initiative 2 addresses this through three entry patterns (A: story-level TDD entry; B: reverse-engineer → discovery; C: retrospective story for shipped code).

**Platform maintainer:** Bears the cost of all three layers — every non-adoption is a manual support interaction. The `/start` concierge skill and one-command install path directly reduce this support surface.

## Why Now

**WS0 is the entry condition for every Phase 5 workstream.** WS1 (harness infrastructure), WS2 (subagent isolation), WS3 (context governance), WS4 (spec integrity), WS5 (platform intelligence), WS6 (human capability), and WS7 (operational domain standards) all carry `WS0 distribution complete` as their entry condition. Every week WS0 is not delivered is a week Phase 5 cannot start for any consumer who is not the platform maintainer.

**CI artefact attachment (WS0.6) is now complete** — the last WS0 predecessor is delivered (PR #190, DoD confirmed). There are no upstream blockers remaining within WS0.

**The governance model gap is now structurally visible.** Phase 4 delivered the CLI adapter stubs and the assurance gate harness. The gap they expose — engineer-only outer loop that produces artefacts without attribution — was deferred in Phase 4 as out of scope. It cannot be deferred again: WS0.7 (non-technical channel) and any surface investment that follows will reproduce the same adoption failure mode if the outer loop skill redesign (Initiative 3) is not delivered first.

**Ideation analysis is complete and has a PROCEED verdict.** The ideation artefact at `artefacts/2026-04-23-non-technical-channel/research/ideation.md` (pass 4) reached a PROCEED recommendation with four REDESIGN signals that are constraints on this discovery, not options to evaluate.

## MVP Scope

The MVP for this feature is validated by three observable outcomes, each corresponding to an initiative:

**MVP-1 (Initiative 1 — Seamless onboarding):** A new consumer clones the repository, follows `docs/ONBOARDING.md`, and can run a single skill — `/start` — to receive a guided, conversational orientation in under two minutes: what the pipeline is, where they currently are in it, and exactly what their next action is, with no documentation reading beyond that point. No platform team contact required. The skill detects entry context (fresh repo with no artefacts, in-progress pipeline state, or brownfield codebase) and routes accordingly.

The name `/start` is intentional: it is the most intuitive first command for a consumer who has just cloned the repo and has no prior pipeline context. It replaces the current pattern of reading through `ONBOARDING.md` to determine what to do next.

Includes: the `/start` concierge skill SKILL.md; the real implementation of `init`, `fetch`, `pin`, and `verify` commands in `src/enforcement/cli-adapter.js` against a defined lockfile schema; the lockfile schema itself (forward-compatible with WS4 spec integrity).

**MVP-2 (Initiative 3 — Governance prerequisite):** An engineer-only discovery artefact fails DoR sign-off with a clear attribution gap message. Specifically: the `/discovery` template gains required `contributors`, `reviewers`, and `approved-by` sections; the `/benefit-metric` template gains required attribution for metric ownership and reviewer; the `/definition-of-ready` skill gains hard block H-GOV that checks `approved-by` is populated with at least one non-engineering role entry; a bounded attribution model decision is documented (artefact-level vs section-level sign-off).

**MVP-3 (Initiative 2 — Brownfield entry, secondary):** The `/start` skill detects brownfield context and routes to the correct entry pattern: Entry A (`/tdd [story-slug]` for teams with stories), Entry B (`/reverse-engineer` wrapper for teams with code but no artefacts), or Entry C (retrospective story template for shipped code). Each entry pattern is formally surfaced as a documented, guided onboarding path — not just a hidden capability.

MVP scope is bounded by the five open questions in section 6 of the reference document. Where an open question is unresolved, the story scopes to the decision, not the implementation of both options.

## Out of Scope

- **Teams bot deployment (WS0.7):** `src/teams-bot/bot-handler.js` exists and the spike verdict is PROCEED, but deployment is gated on WS0.4 (non-git consumer distribution model) AND on the governance model prerequisite from Initiative 3. Deploying a bot surface before the outer loop skills require non-technical attribution would reproduce the same adoption failure mode. WS0.7 is a subsequent feature — its entry condition is this feature's completion.

- **Facilitation-native web UI (canvas):** The hypothesis that a BA running a live workshop would produce a pipeline artefact as a byproduct must be tested before any design investment. The framing test (does "facilitation canvas" framing change the BA's adoption response compared to "lower-friction tool") has not been run. This is a Phase 5 WS6 candidate, not a story in this feature.

- **Peer reviewer agents (Phase 5 WS1/WS2/WS3):** WS1 (harness infrastructure, hook events, capability manifest), WS2 (subagent isolation), and WS3 (context governance) are all sequenced after WS0 completion. They are Phase 5 successor work, not stories in this feature.

- **Regulated dogfood story:** Running this platform's own Phase 5 delivery as a dogfood instance under the governance model being redesigned in Initiative 3 is a valid constraint — not a story. It will appear as an NFR or acceptance criterion in the stories that emerge from this feature's definitions, not as a standalone deliverable.

- **Plain-language gate translation layer (WS0.8) and artefact parity (WS0.9):** These are Phase 5 subsequent workstreams that depend on Initiative 3 being complete. They are explicitly sequenced after this feature.

- **Multi-tenancy or fleet-level onboarding automation:** Out of scope for this feature. Fleet management is handled via `fleet-state.json` and the `/scale-pipeline` skill. The concierge and lockfile work here is single-repository scope.

## Assumptions and Risks

**Assumptions:**

- The `/start` concierge skill can be implemented entirely within the SKILL.md instruction set — it does not require a new CLI command or backend service. A conversational skill that reads `workspace/state.json` and `artefacts/` is sufficient for MVP-1.
- The lockfile schema can be defined in a way that is forward-compatible with WS4 (spec integrity / verbatim instruction assembly record). This requires reading the WS4 workstream description in `artefacts/phase5-6-roadmap.md` before finalising the schema. If WS4 has incompatible constraints, a spike is required before lockfile implementation.
- Senior stakeholders will accept artefact-level sign-off (name on the whole document) as the minimum bounded attribution model, even if section-level attribution is preferable for SMEs. If neither model is acceptable to the target stakeholder population, WS0.7 surface investment is premature and this feature's scope must be revised.
- The non-git consumer distribution model (WS0.4) does not have blocking ADO environment constraints that would change the lockfile or `init`/`fetch` design. If ADO consumers need a distribution mechanism that is not `sync-from-upstream.sh`, this is a scope addition.
- Initiative 3 (governance model prerequisite — outer loop skill redesign) does not require a story artefact chain of its own to justify changes to SKILL.md files under `.github/skills/`. Per the artefact-first rule in `copilot-instructions.md`, any behavioural change to a SKILL.md file requires a story artefact chain. This feature will produce that chain.

**Risks:**

- **Accountability avoidance:** Senior stakeholders may resist the `approved-by` field even in artefact-level form. If the bounded attribution model test (open question 2) returns a negative result, the H-GOV hard block cannot be enforced without triggering active resistance from the sign-off population. Mitigation: run the bounded attribution test early in the definition phase, before scoping the H-GOV implementation.
- **Lockfile schema lock-in:** A lockfile schema designed without WS4 constraints may require a migration story in Phase 6. Mitigation: read WS4 workstream description before finalising schema; define the schema as a versioned document so migration can be handled without a lock-in breaking change.
- **Initiative 3 creates a pipeline violation:** Changing `/discovery`, `/benefit-metric`, and `/definition-of-ready` SKILL.md files requires a story artefact chain first (per artefact-first rule). This is a self-referential constraint — we are using the pipeline to govern a change to the pipeline. Mitigation: the stories produced by this feature's definition phase are the artefact chain for Initiative 3 SKILL.md changes.
- **Brownfield entry path diversity:** If the open question survey (Q3 — which entry pattern is most common) reveals that most brownfield teams do not fit Entry A, B, or C cleanly, the concierge routing logic will need a fourth pattern. Mitigation: scope the concierge skill to detect and route; allow it to fall back to `/workflow` if no pattern matches.

## Directional Success Indicators

- A new consumer completes onboarding (clone repo → follow `ONBOARDING.md` → run `/start` → first skill run) in under two minutes without a support interaction with the platform team. Target: zero platform team contacts per onboarding event.
- An engineer-only discovery artefact produces a visible DoR hard block at H-GOV. The block message names the missing attribution field and explains what is required to resolve it.
- At least one non-engineering persona (BA, product manager, or business lead) is named in the `approved-by` field of a real discovery artefact produced by a cross-functional pair running the pipeline together.
- A consumer who has run `pin` can run `verify` and receive a pass/fail result against their lockfile within a single terminal command. No filesystem inspection required.
- The platform maintainer receives zero "what do I do next?" support questions from a new consumer who has run `/start` in their first session.

## Constraints

**Technical:**
- No new npm dependencies in `src/enforcement/cli-adapter.js` or its lockfile implementation (Node.js built-ins only per ADR constraint pattern established in WS0.6).
- Lockfile schema must be defined as a versioned document forward-compatible with WS4 (spec integrity). Read `artefacts/phase5-6-roadmap.md` WS4 description before finalising.
- SKILL.md changes to `/discovery`, `/benefit-metric`, and `/definition-of-ready` must be delivered via PR with story artefact chain (artefact-first rule, `copilot-instructions.md`).
- The `/start` concierge skill is a SKILL.md instruction set, not a CLI command or backend service. It reads `workspace/state.json` and `artefacts/` directory state. The sub-2-minute target is a time constraint on the skill design: `/start` must produce an actionable next step within a single conversational turn, not a multi-step interview.

**Process:**
- Initiative 3 (governance model prerequisite) must be scoped and stories defined before Initiative 1 surface work begins. Initiative 3's output — redesigned attribution fields and H-GOV hard block — is an entry condition for Initiative 1 stories.
- The bounded attribution model decision (artefact-level vs section-level sign-off) is an open question that must be answered in the definition phase before H-GOV is implemented. The `/decisions` skill should record the outcome as a formal ADR.

**Sequencing:**
- WS0.7 (Teams bot deployment) is a subsequent feature gated on this feature's completion. It must not be included in stories here.
- The five parallel experiments described in the ideation artefact (`artefacts/2026-04-23-non-technical-channel/research/ideation.md`) are framing tests, not engineering deliverables. Their results inform the definition phase but are not acceptance criteria for this feature's stories.

**Dependency:**
- `artefacts/phase5-6-roadmap.md` — WS4 lockfile schema constraints (must be read before lockfile schema is defined).
- `product/constraints.md` G19 intentional gap note — verbatim instruction assembly record scope boundary.

---

**Next step:** Approved ✅ → /benefit-metric
