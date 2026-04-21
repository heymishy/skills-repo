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

**Outcome:** Agent execution is structurally mediated — not merely instructed — across all primary delivery surfaces. A shared governance package (ADR-013) provides three operations (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) that every surface adapter calls. No surface reimplements governance logic independently. A risk function or independent CoP co-owns the assurance-gate SKILL.md files, making second-line independence a structural fact rather than a claim. The distribution model reaches squads without forking.

### Phase 4 themes delivered (or in-flight)

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

## What is not on the roadmap

- The platform does not generate design artefacts — it references and validates them
- The platform does not replace Jira, Confluence, or project management tooling
- The platform does not host a persistent agent runtime
- The platform does not make compliance decisions — it produces compliance evidence for human review
- The platform does not provide continuous discovery tooling, product strategy visualisation, or OKR management (OST visualisation in Phase 6 is a data query view, not a product strategy tool)
- The platform does not manage POLICY.md floors autonomously — the improvement loop proposes; humans review and approve at every stage without exception
