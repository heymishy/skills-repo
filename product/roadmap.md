# Product Roadmap

## Adoption path

Squads adopt incrementally. Named patterns: **Subset** (current context only) → **Augment** (add as context expands) → **Progressive** (validate each addition before the next). The designs-in-hand variant applies for squads arriving with existing discovery artefacts — enter at Phase B without running Phase A.

---

## Phase 1–2 — Foundation, distribution, and self-improving harness

**Outcome:** A platform team can maintain the skills platform and at least two squads can consume skills without forking. The assurance agent runs as an automated CI gate. The improvement loop is operational. Context window management is structural. At least three core discipline standards are live.

### Phase 1 deliverables (summary)

- **Distribution + progressive skill disclosure** — versioned skill package model, tribe/squad override model, `copilot-instructions.md` as assembled base layer, on-demand skill loading, phase-sequenced progressive disclosure as formal context management pattern
- **Surface adapter model (foundations)** — `execute(surface, context) → result` interface; two-path surface type resolution (`context.yml` Path B in Phase 1; EA registry Path A in Phase 2); multi-surface declaration support; DoD criteria by surface type; git-native reference implementation
- **Assurance agent as CI gate** — CI-triggered assurance, `inProgress`→`completed` trace emission, structural CI gate checks (hash, agent independence, trace transition, watermark)
- **Watermark gate** — `workspace/results.tsv`, two-check gate logic, regression alert
- **`workspace/state.json` + `workspace/learnings.md`** — dual purpose: cross-session continuity and mid-session checkpoint; durable structured state separated from rendered context view; phase boundary ownership table; `/checkpoint` human override
- **Living eval regression suite** — `workspace/suite.json` auto-growing from assurance agent failure patterns
- **Standards model Phase 1** — software engineering, security engineering, quality assurance core standards + POLICY.md floors
- **Model risk documentation** — `MODEL-RISK.md` for regulatory audit readiness
- **Designs-in-hand workflow variant** — entry path for squads with existing discovery artefacts

### Phase 2 deliverables (summary)

- **Full platform adapter model** — remaining five surface adapters; **EA registry integration (Path A)** — automatic surface type classification and cross-platform dependency detection; Path B squads unaffected
- **Improvement agent** — stateless session design, two signal types (failure + staleness), queryable trace interface, challenger pre-check before human review
- **Cross-team observability** — skill usage registry, drift detection, contribution channel
- **Remaining discipline standards** — 8 remaining disciplines at core tier; domain-tier standards for pilot domains
- **Estimation calibration loop** — actual vs estimated velocity, calibration gaps to outer loop, EVAL.md estimation dimension

---

## Phase 3 — Enterprise scale and autoresearch

**Outcome:** 50 teams consuming the platform. Improvement loop operates at cross-team scale. Autoresearch runs continuously. Queryable trace interface promotes to cross-team registry.

### Phase 3 themes

- **Cross-team autoresearch** — improvement agent reads cross-team traces; failure and staleness patterns aggregate across squads; impact-ranked proposals
- **Cross-team trace registry** — squad-level queryable `getTraces(filter)` interface promotes to platform-level registry with squad/tribe/domain dimensions; OpenTelemetry standard adopted; `standards-composition` span added
- **Standards autoresearch** — recurring standards exceptions surface to CoP leads as proposed floor adjustments; CoP co-owner approval gate
- **Estimation calibration EVAL dimension** — real delivery records as corpus; calibration proposals from improvement agent
- **EA registry live integration** — live query at discovery; cross-platform dependency tracking
- **Squad-to-platform contribution flow** — governed contribution process distinct from platform engineer publish flow
- **Compliance monitoring report** — audit agent periodic attestation; platform team and risk function review

---

## Phase 4 — Multi-surface structural enforcement and second-line independence

**Status: ✅ Complete (all 27 stories DoD as of 2026-04-21)**

**Outcome:** Agent execution is structurally mediated — not merely instructed — across all primary delivery surfaces. A shared governance package (ADR-013) provides three operations (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) that every surface adapter calls. No surface reimplements governance logic independently. A risk function or independent CoP co-owns the assurance-gate SKILL.md files, making second-line independence a structural fact rather than a claim. The distribution model reaches squads without forking.

### Phase 4 themes delivered

- **Shared governance package (ADR-013)** — three-operation contract: skill resolution and hash verification, gate evaluation and state advance, verified trace write. Two enforcement spoke adapters: `p4-enf-mcp` for VS Code and Claude Code surfaces; `p4-enf-cli` for regulated and CI contexts.
- **Distribution foundation (Theme B partial)** — `sync-from-upstream.sh/ps1`, assurance gate hash check, `secretRef` credential pattern. Full versioned lockfile and `upgrade` command deferred to Phase 5 (see scope narrowing note below).
- **Second-line organisational independence (Theme F)** — CoP co-ownership model for assurance-gate SKILL.md changes; risk function reviewer designation; independent assurance agent review path.
- **Spike programme** — Spike B1 (MCP boundary structural or conventional), Spike B3 (LangGraph vs Foundry for non-technical channel), Spike C (distribution architecture sub-problems), Spike D (interaction model for non-technical disciplines).

### Phase 4 scope narrowing — items deferred to Phase 5 and Phase 6

Phase 4 was narrowed to the three architectural survival problems — structural enforcement mediation, distribution update channel, and second-line independence — when scoping confirmed that attempting full distribution versioning, the non-technical channel, and operational domain standards in the same phase exceeded safe delivery scope. The following committed Phase 4 items are carried into Phase 5 as WS0:

- **Distribution completion (Theme B remainder: 4.B.4–4.B.9)** — versioned lockfile, `upgrade` command, upstream authority model, non-git consumer distribution, Phase 3 migration path, CI-native artefact attachment.
- **Non-technical discipline channel (Theme C: 4.C.1–4.C.4)** — interaction surface, plain-language gate translation, artefact parity, discipline standards injection. Gated on Spike D output.

The following originally-labelled Phase 4 items are delivered in Phase 5 and Phase 6:
- **Operational domain standards** — Phase 5 (WS7): incident response, change management, capacity planning; requires multi-surface distribution to reach operational participants.
- **Agent identity layer** — Phase 6 (WS9): signed identity per agent execution traceable to model version and instruction-set version; requires Phase 5 sidechain transcript (WS2.3) and lockfile model (WS4.3).
- **Policy lifecycle management** — Phase 6 (WS8): POLICY.md floor change lifecycle; requires Phase 4 Theme F proven in operation and Phase 5 improvement signal derivation (WS5.4).

*Note: Challenger model previously listed as Phase 4 ADR candidate — moved to Phase 2 as agent composition.*

---

## Phase 5 — Harness infrastructure, spec integrity, platform intelligence, and distribution completion

**Status: 🟡 Active — Web UI workstreams delivered; model evaluation in definition**

### Phase 5 workstreams delivered (as of 2026-05-14)

The web-UI layer is the primary Phase 5 delivery to date. These workstreams are complete or at definition-of-done stage:

- **Web UI — model-first chat architecture (mfc.1–2)** — Replaced the earlier form-based Q&A flow. The model now receives the full SKILL.md as system prompt and drives the entire conversation. Express-less Node.js HTTP server; injectable adapters (D37/ADR-009); GitHub Copilot Chat Completions API integration. ✅ Released
- **Web UI — streaming live draft (wusl.1–2)** — Animated thinking dots, SSE streaming for artefact content after `---ARTEFACT-START---`, progressive draft panel updates. ✅ Released
- **Web UI — dynamic skill questions (dsq.1–5)** — Dynamic question generation, section confirmation loops, post-session clarify gate. ✅ Released
- **Web UI — guided outer loop (ougl.1–7)** — Full outer loop (discovery through DoR) navigable via the web UI. ✅ Released
- **Web UI — outer loop extensions (owle.1–6)** — Benefit metric, review, definition-of-done, trace skills exposed via web UI. ✅ Released
- **Web UI — session management (wsm.1–3)** — Session persistence, resume, and history. wsm.2 and wsm.3 complete-with-deviations (follow-up stories needed). ✅ Released (with deviations)
- **Web UI — copilot execution layer (wuce, 35 stories)** — Per-answer model response in skill HTML flow; injectable `skill-turn-executor.js` module. 📋 At definition-of-done stage
- **Web UI — session wizard / copilot chat parity (wucp.0–4)** — Context auto-loader, slash command router, session start wizard. 📋 In definition

### Model evaluation capability (2026-05-10)

A structured evaluation programme for the skill library has been initiated as a Phase 5 capability:

- **EVAL.md specification format** — per-skill evaluation rubrics with corpus cases and scoring dimensions; `/model-sweep` SKILL.md; `scripts/run-model-sweep.js` for programmatic Layer 2 sweeps
- **EXP-001 (discovery skill evaluation)** — Layer 1 manual sweep comparing `claude-sonnet-4-6` vs `claude-opus-4-6` across 5 corpus cases. Run-3 complete (T2/T4 final verdicts); run-3b planned for T1/T3/T5
- **EXP-002b (constraint surfacing evaluation)** — Complete; T5 constraint surfacing baseline established (0.490–0.562)
- **EXP-003 (end-to-end pipeline evaluation)** — Pending; will cover constraint propagation fidelity across the full discovery → definition → test-plan → DoR chain

**Outcome:** Every governance property the platform claims — enforcement tier, execution isolation, context scope, spec integrity, cross-team intelligence, dynamic checklist composition — has a specific, inspectable mechanism. A risk examiner can trace any agent execution to a versioned, hash-pinned instruction set, a specific model version, and a human approval record. Non-technical discipline participants (product managers, business analysts, UX practitioners) have a governed delivery channel with artefact parity. Operational domain standards (incident response, change management, capacity planning) are live on at least one non-engineering surface.

### Phase 5 workstreams (sequenced by dependency order)

- **WS0 — Phase 4 completion track (first; blocks all other WS)** — distribution versioning and lockfile, upgrade command, upstream authority resolution, non-git consumer distribution, Phase 3 migration path, CI-native artefact attachment, non-technical channel build. Gated on Phase 4 Themes A and F stable and Spike D complete.
- **WS1 — Harness infrastructure** — hook event schema (pre-tool, post-tool, turn-start, turn-end), enforcement tier declaration in SKILL.md, structural multi-layer context budget management, hook consumer interface. Maps to ref doc 5.E (agent behaviour observability).
- **WS2 — Subagent isolation** — capability manifest per skill, deny-list enforcement, structural sidechain transcript, permission tier declaration in context.yml. Gated on Spike B1 verdict and WS1.1.
- **WS3 — Context governance** — context scope declaration, context boundary trace record, practitioner review gate (governance evidence record, `oversightLevel: high` trigger, no auto-pass in regulated profile), session continuity protocol.
- **WS4 — Spec integrity** — spec drift detection (scheduled CI), pre-flight artefact validation, lockfile-backed skill hash assertion, iteration cap and doom loop detection. Maps to ref doc 5.F (skills drift observability). WS4.2 and WS4.3 depend on WS0.1 lockfile.
- **WS5 — Platform intelligence** — assumption card schema (typed by Desirability/Usability/Feasibility/Viability/Ethical/Scalability/Legal), delivery-to-assumption feedback loop, cross-team trace query interface (resolves ADR-004 tension), improvement signal derivation from cross-team patterns. Maps to ref doc 5.H (cross-team trace registry).
- **WS6 — Human capability** — dynamic DoR checklist composition (tagged blocks, context.yml composition rules, default matches current static list), brownfield onboarding path, maturity-gated skill disclosure, comprehension checkpoints (learning record, no pipeline consequence).
- **WS7 — Operational domain standards** — incident response, change management, capacity planning. Encodes the same encode→gate→trace pattern as software delivery standards. WS7.2 (change management) gated on WS0.7 non-technical channel reaching operational participants.

**Phase 5 MVP (minimum set for entry value):** WS0 distribution track (WS0.1–WS0.3, WS0.5, WS0.6) + WS1 hook events (WS1.1–WS1.4) + WS4 spec integrity items (WS4.1, WS4.2, WS4.4). This closes distribution, enforcement tier, hooks, compaction, spec drift, pre-flight validation, and doom loop detection.

---

## Phase 6 — Policy lifecycle, agent identity, second model review, and enterprise federation

**Outcome:** The platform's governance chain is complete end-to-end: every POLICY.md floor change has a governed lifecycle with CoP review and measurement; every agent execution is signed with a traceable identity; an independent second model provides human approvers with a challenger assessment at DoR sign-off; cross-organisation trace federation enables platform-level benchmarking. The platform's regulator audit claim shifts from "we have governance processes" to "you can replay exactly what happened."

### Phase 6 workstreams (entry conditions from Phase 5)

- **WS8 — Policy lifecycle management** — POLICY.md floor change lifecycle (proposal → CoP review → staged rollout → measurement → retire or promote), improvement agent integration via WS5.4 signals, standards autoresearch extending the Phase 3 autoresearch loop to POLICY.md content. Entry: Theme F proven in operation + WS5.4 delivered.
- **WS9 — Agent identity layer** — execution identity record (model version, instruction-set version from WS4.3 lockfile hash, timestamp, surface), model version attribution in improvement signals. Entry: WS2.3 sidechain transcript + WS4.3 lockfile stable + WS5.3 trace query delivered.
- **WS10 — Second model review** — challenger trigger at DoR sign-off boundary (independent assessment, informs not blocks), challenger calibration over time. Entry: WS9 agent identity delivered + WS1.4 hook consumer interface stable.
- **WS11 — Enterprise federation and OST visualisation** — cross-organisation trace federation with pseudonymisation model, Opportunity Solution Tree connected graph visualisation (requires WS5 assumption cards at 3-team-scale adoption). Entry: WS5.3 adopted by 3+ squads + WS9.1 data governance model.

---

## Commercialisation track — wuce SaaS beta path

**Status: 🟡 Active — pre-launch, no live paying customers yet**

This track is parallel to, not part of, the Phase 1–6 platform-maturity numbering above. Phases 1–6 track the skills-platform's own governance maturity (distribution, enforcement, autoresearch, policy lifecycle); this track is the go-to-market path for `wuce` — the hosted, commercial delivery surface of that same platform (the web-UI layer, §Web UI layer in `tech-stack.md`) — reaching its first real beta customers.

**Outcome:** wuce operates safely as a real product with paying, external teams — not just a solo-operator tool — with tenant isolation, per-person roles, a rehearsal environment before production, and deterministic coverage of the flows that would cost the business its first customers' trust if broken.

### Shipped

- **Multi-auth** — GitHub OAuth, Google OAuth, email/password (`2026-07-01-landing-auth-billing`, merged 2026-07-05)
- **Billing** — Stripe checkout, webhook, billing portal (`2026-07-01-landing-auth-billing`); several post-merge fixes (form-parsing, plan-limit gating, GitHub OAuth first-login bug) landed 2026-07-06–09
- **Multi-tenancy foundation (ADR-025)** — application-layer tenant_id scoping across 6 phases: authz guard, identity resolution, storage scoping, Postgres/Redis persistence, rate-limit isolation, security hardening (`2026-06-22-wuce-multi-tenancy`)
- **Admin role + billing-gate bypass** — role-based access foundation (`2026-07-03-admin-role-panel`, arl-s1–s4)
- **Per-person roles across auth providers (`2026-07-09-team-identity-roles`)** — DoD-complete (8/8 stories, 2026-07-13), admin/engineer/product/viewer role model, schema validated for real at 100-member scale (tir-s6, re-verified against real Postgres 2026-07-14). **Known open gap, fix in flight:** a real defect (`tir-s9`) meant teammates sharing one tenant via GitHub-org allowlist could resolve to the wrong person's role — root cause was `server.js`'s `getRoleForTenant` wiring discarding the caller's per-person identity and always resolving against the shared tenant ID instead. Fix is implemented and independently verified (7/7 new tests pass, proven to fail against pre-fix code), pending PR.
- **Beta infra epics 1–2 (`2026-07-09-beta-readiness-infra`)** — feature flags (PostHog, tenant-targeted) and staging-environment code/config (Fly + Neon + Upstash) DoD-complete (2026-07-14). Epic 3 (E2E journey coverage) is 5/6 merged; the 6th (`bri-s3.3`, multi-user-within-tenant journey) is blocked on `tir-s9` above.

### Immediate blockers to first beta (as of 2026-07-14)

1. **`tir-s9`** — merge the shared-tenant role-resolution fix (built and verified, PR pending).
2. **`bri-s3.3`** — once `tir-s9` merges, re-run `/definition-of-ready` and build the multi-user journey spec that was blocked on it.
3. **Live infrastructure provisioning** — none of Fly (`wuce-staging` app), Neon (staging branch), Upstash (staging Redis), or PostHog (staging project) have been created yet; all shipped code assumes they exist. Manual, operator-only step per each story's own DoR contract.
4. **`bri-s1.4`** — `identifyTenantGroup()` is built and tested but never called from a live request path, so PostHog dashboard group records are never populated (found at DoD sweep, 2026-07-14). Lower severity than 1–3; doesn't block onboarding, does block accurate tenant-group analytics from day one.

### Path to beta

1. Clear the 4 blockers above.
2. First beta customer(s) onboarded as a real team (not solo), exercising the per-person role model for the first time outside of test data.
3. Beta feedback informs the deferred items below — none of them block first beta, but real usage should decide which to prioritize next, not upfront guesswork.

### Deferred past first beta (from discovery Out-of-Scope sections)

- Self-serve team/org creation and invite flow (`team-identity-roles`)
- Per-seat/usage-based Stripe billing (`team-identity-roles`)
- Full feature-access matrix across every screen, beyond the one proven role-gated feature (`team-identity-roles`)
- Multi-team switching UX (schema supports it; UI doesn't yet) (`team-identity-roles`)
- Self-serve staging, multi-region/HA staging, canary/blue-green deploys (`beta-readiness-infra`)
- Full production monitoring/alerting overhaul (`beta-readiness-infra`)
- LLM evals, A/B flag testing, span-level pipeline events, frontend group analytics (`posthog-llm-analytics`)
- Self-serve signup/waitlist, profile pages, email/magic-link invites, org onboarding wizard, interactive tutorial (`beta-entry-experience`)

### Flagged for reconsideration (deferred for schedule reasons, not low value — reviewed 2026-07-14)

A cross-feature scope review found several deferred items that read as genuinely low-priority in isolation but become real gaps once paying customers and real usage exist. None block first beta; all are worth revisiting once beta traffic makes them concrete rather than hypothetical:

- **Cross-tenant prompt-cache leak mitigation is incomplete, not just deferred** (`wuce-multi-tenancy` Decision 8) — the cache-scope embedding logic exists but session threading into the call stack was never activated, so cache entries are not reliably scoped per tenant. This is a live, unclosed cross-tenant data-boundary gap, not a nice-to-have — worth its own fix-forward story before beta, not just a "revisit later" note.
- **CSRF tokens on POST endpoints** (`security-perf-hardening`) — deferred as a separate story; matters more once billing/admin forms are reachable by paying customers.
- **Distributed rate limiting is in-process-only** (`wuce-multi-tenancy` Decision 7, echoed in `security-perf-hardening`) — fine solo, breaks the moment Fly scales beyond one machine.
- **Self-serve team invite flow** (`team-identity-roles`) — every beta customer today requires the operator to manually add teammates, direct friction on the exact thing beta is testing.
- **No audit log of admin credit top-ups** (`admin-role-panel`) — matters once real money moves and a customer disputes a balance.
- **GitHub OAuth users can't get admin, only email-auth users can** (`admin-role-panel`) — inconsistent with the primary auth path, likely to surface as a support request.
- **Session-ID rotation on privilege escalation** (`security-perf-hardening`) — more relevant now that per-person roles exist and can change mid-session.
- **Full production monitoring/alerting overhaul** (`beta-readiness-infra`) — staging rehearsal doesn't cover live incident detection once real customer traffic exists.

---

## What is not on the roadmap

- The platform does not generate design artefacts — it references and validates them
- The platform does not replace Jira, Confluence, or project management tooling
- The platform does not host a persistent agent runtime
- The platform does not make compliance decisions — it produces compliance evidence for human review
- The platform does not provide continuous discovery tooling, product strategy visualisation, or OKR management (OST visualisation in Phase 6 is a data query view, not a product strategy tool)
- The platform does not manage POLICY.md floors autonomously — the improvement loop proposes; humans review and approve at every stage without exception
