# Decision Log: 2026-04-19-skills-platform-phase4

**Feature:** Skills Platform — Phase 4: Distribution, Structural Enforcement, and Non-Technical Access
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Last updated:** 2026-04-19

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-04-19 | ASSUMPTION | discovery/clarify**
**Decision:** Spike D (Teams compatibility) requires a working Teams bot prototype, not a research verdict alone — but scope may be deferred to a later phase if implementation complexity proves too high.
**Alternatives considered:** (A) Research verdict only — cited Teams docs and C7 constraint, no prototype. (B) Prototype required, no deferral path. (C) Working prototype as Phase 4 target, with explicit deferral option if complexity warrants.
**Rationale:** A working prototype is the highest-confidence validation of C7 fidelity in a Teams surface, and aligns with the Phase 4 goal of validating non-technical access rather than just designing for it. However, Teams bot provisioning requires an Azure/MS trial account (external dependency) and may reveal complexity that changes the cost/value equation. The deferral option preserves momentum — if the prototype proves unexpectedly complex, the scope can shift to a Phase 4.1 or Phase 5 story without blocking the rest of Phase 4.
**Made by:** heymishy (operator) — confirmed during /clarify session
**Revisit trigger:** If Azure/MS account provisioning is delayed beyond Phase 4 spike window, or if initial Teams bot spike reveals that C7 fidelity cannot be achieved without architectural work that exceeds Phase 4 capacity.
---

---
**2026-04-19 | ASSUMPTION | discovery/clarify**
**Decision:** Azure/MS trial or development account is a hard prerequisite for Spike D and is an external dependency not within the team's direct control.
**Alternatives considered:** (A) Assume account exists or can be created trivially. (B) Treat as a prerequisite and flag explicitly so it does not silently block Spike D.
**Rationale:** Teams bot provisioning requires an active Azure subscription. If provisioning is assumed and not tracked, Spike D can reach implementation-ready state and then stall on account access — a waste of spike capacity. Flagging it explicitly surfaces the dependency at planning time.
**Made by:** heymishy (operator) — confirmed during /clarify session
**Revisit trigger:** When Azure/MS account is confirmed provisioned — at that point this assumption is resolved and Spike D is unblocked.
---

---
**2026-04-19 | ARCH | discovery/clarify**
**Decision:** The C11 ADR gate (no persistent hosted runtime without ADR) applies at consumer shipment, not during Phase 4 spike exploration. Spike B2 may evaluate and prototype orchestration-based enforcement mechanisms freely; the ADR is required before any such mechanism ships to consumers.
**Alternatives considered:** (A) ADR gate applies inside Phase 4 — Spike B2 cannot recommend orchestration without completing the ADR first. (B) ADR gate at consumer shipment only — Spike B2 explores freely (chosen). (C) ADR not triggered at all during Phase 4 because spikes produce prototypes, not production deployments.
**Rationale:** Option B gives the spike programme maximum freedom to evaluate the full mechanism design space without creating a blocking ADR story inside Phase 4. The C11 constraint exists to protect the platform's multi-toolchain portability intent — that intent is not threatened by a prototype that has not yet been deployed to consumers. The gate is correctly applied at the point of consumer exposure, not at the point of investigation.
**Made by:** heymishy (operator) — confirmed during /clarify session
**Revisit trigger:** If a Spike B2 prototype is proposed for direct consumer use within Phase 4 — at that point the ADR gate reactivates immediately before any shipment proceeds.
---

---

## Architecture Decision Records

<!-- No ADRs raised for Phase 4 at discovery stage. Log entries above cover the in-flight decisions. ADRs will be raised at /definition if any mechanism choices meet the structural decision threshold. -->

---
**2026-04-19 | ARCH | spike-a**
**Decision:** Governance logic is extractable into a shared enforcement package scoped to the story-execution boundary. The package implements 3 operations — skill-resolution with hash-verification (combined), gate-evaluation with guarded state-advancement (combined), and verified trace-writing (chain-validated) — that all delivery surfaces (VS Code/MCP, CLI, Teams bot, orchestration) invoke. The outer loop (discovery through epic decomposition) remains instructional and operator-navigated. The enforcement package has no opinion about outer-loop ordering or navigation.
**Alternatives considered:** (A) Full 5-operation package covering skill-resolution, hash-verification, gate-evaluation, state-advancement, and trace-writing as separate operations — the original `/definition` hypothesis. Rejected: the decomposition was generated during story writing, not derived from code analysis. Investigation showed the operations are naturally paired (resolve+hash, gate+advance) and that separating gate-evaluation from state-advancement is the exact vulnerability Phase 3 exposed. (B) No shared package — each surface implements its own governance logic independently. Rejected: leads to divergent enforcement behaviour across surfaces, making the audit trail inconsistent and 4.B.9 (audit evidence accessibility for non-technical readers) unachievable. (C) Full orchestration layer — the package controls the entire pipeline flow including outer-loop navigation. Rejected: collapses the multi-path navigation model the platform depends on and violates the design philosophy of keeping governance light and only enforcing what is non-negotiable.
**Rationale:** The codebase investigation confirmed that the existing governance operations are already stateless, mostly pure functions with I/O cleanly separated from logic. No persistent runtime is required (C11 satisfied). The 3-operation boundary maps precisely to the non-negotiable audit requirements: C5 (hash-verified skills), gate-before-advance (Phase 3 violation prevention), and full-chain trace (audit trail integrity including programme-level provenance). Operations that don't meet the bar "if an agent can skip this, the audit trail is broken" stay instructional. The package must be configurable via `context.yml` (ADR-004) — which gates exist, what chain requirements apply per track, what the hash algorithm is — so that enforcement rules can evolve over time without hardcoded logic.
**Made by:** heymishy (operator, investigator) + claude-sonnet-4-6 (agent, analysis support)
**Revisit trigger:** If Spike B1 or Spike B2 reveal that any of the 3 operations cannot be invoked from their surface adapter without structural changes to the operation interface, or if `p4-enf-package` implementation discovers that the 3-operation boundary is insufficient to prevent a specific class of audit trail compromise that the investigation did not anticipate.
---

---
**2026-04-20 | ARCH | spike-b1**
**Decision:** MCP (Model Context Protocol) tool-boundary enforcement is the reference implementation mechanism for the VS Code and Claude Code interactive operator surfaces. The 3-operation enforcement package interface established by Spike A (resolveAndVerifySkill, evaluateGateAndAdvance, writeVerifiedTrace) is fully invocable through MCP tool calls without interface changes. C11 (no persistent hosted runtime) is satisfied by the stdio-transport subprocess model. PROCEED verdict issued for Spike B1 with one noted limitation: P2 (context injection exclusivity) is PARTIAL — the MCP tool delivers skill content correctly, but ambient bypass (Copilot agent reading SKILL.md directly from the workspace) was not empirically blocked or tested; this is an open item for p4-enf-mcp implementation. E3 story p4-enf-mcp proceeds to DoR with both Spike A package interface and this Spike B1 output as required architecture constraint inputs.
**Alternatives considered:** (A) VS Code extension direct invocation (no MCP) — the skill enforcement operations run as extension commands or direct function calls inside a VS Code extension. Considered during investigation. Rejected for B1 scope: while technically feasible, it bypasses the MCP tool boundary that is the surface's standard integration point for AI agents, and would require a separate adapter design outside the MCP protocol. This may resurface in p4-enf-decision as an alternative if MCP adoption rate for non-Copilot surfaces is insufficient. (B) Remote MCP server (hosted/cloud endpoint) — the enforcement package runs as a hosted API endpoint that VS Code connects to via HTTP transport. Rejected: violates C11 directly (persistent hosted runtime); introduces network dependency that breaks offline operator workflows. (C) REDESIGN verdict — MCP C11 incompatibility identified, surface class requires a different mechanism. Not warranted: investigation confirmed that stdio-transport subprocesses (VS Code and Claude Code model) are session-scoped and not persistently hosted. The C11 risk entered as a spike concern did not materialise. (D) Skill-as-API-endpoint — expose each skill as a `POST /skills/<name>` HTTP endpoint; the API wrapper owns hash verification, gate checking, and trace writing; SKILL.md files are not committed to the consumer repo. Raised during spike review. Not evaluated in this spike. Recorded for p4-enf-decision: stronger P2 exclusivity story (ambient bypass disappears if SKILL.md is absent from the workspace), but C11 risk from a locally hosted HTTP server process. Viable if implemented via VS Code extension that owns server lifecycle. See spike-b1-output.md alternative mechanism section.
**Rationale:** The MCP protocol's call/response model maps directly onto the enforcement package interface: each enforcement operation is a discrete tool call with typed parameters and a typed response, making hash-at-execution-time observable and auditable at the tool boundary. C11's intent — no infrastructure the operator does not control — is satisfied because the MCP server process is a child process of the IDE session, not an independent service. P1 through P4 fidelity properties are all SATISFIED: hash verification is a precondition of skill content delivery (P1), skill body is delivered only via tool response not ambient injection (P2), trace entries are emitted per invocation with full artefact chain validation (P3), and single-turn interaction is structurally enforced by the MCP call/response protocol (P4).
**Made by:** heymishy (operator, investigator) + claude-sonnet-4-6 (agent, analysis support)
**Revisit trigger:** If p4-enf-mcp implementation cannot close the P2 ambient bypass (Copilot reading SKILL.md directly) via workspace configuration or file relocation — at that point evaluate the skill-as-API-endpoint alternative before shipping; or if p4-enf-decision determines a different mechanism provides better cross-surface consistency for the interactive surface class; or if a non-VS Code/non-Claude-Code interactive surface emerges that MCP does not natively support; or if MCP protocol changes break the stdio-transport subprocess lifecycle assumption.
---

---
**2026-04-19 | RISK-ACCEPT | /review**
**Decision:** Accept the So-that clause metric-naming gap (finding 1-M1 from /review) across all 18 affected stories without rewriting each clause. Proceed to /test-plan per story with this gap acknowledged.
**Finding reference:** Review finding 1-M1 (MEDIUM) — "So-that clause does not name the benefit metric directly." Identified in 18/24 stories. Affected stories: p4-spike-a, p4-spike-b1, p4-spike-b2, p4-dist-lockfile, p4-dist-install, p4-dist-commit-format, p4-dist-upstream, p4-enf-decision, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-enf-schema, p4-enf-second-line, p4-nta-surface, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject, p4-nta-ci-artefact.
**Evidence this is acceptable:** Every affected story has a fully populated Benefit Linkage section that names the metric explicitly and explains the mechanism by which the story moves it. The So-that clause describes the delivery outcome (what the operator gets), not the metric movement — this is a documentation precision gap, not a substance gap. The /review score for the E (Architecture) category was 5/5 for all 24 stories; the only systemic finding was this clause-level wording choice.
**Alternatives considered:** (A) Rewrite So-that clauses for all 18 stories to name the metric — e.g. "So that M2 (consumer confidence) is measurable before E3 stories begin." Technically correct but adds bureaucratic noise to the user story voice. (B) Accept the gap with explicit RISK-ACCEPT (chosen) — clause quality does not affect testability, implementation direction, or AC completeness. Benefit linkage section serves the traceability function.
**Rationale:** The gap affects documentation completeness, not implementation quality. All 24 stories PASS /review with 0 HIGH findings. Rewriting 18 So-that clauses would delay /test-plan start with no quality benefit to the coding agent or to AC testability. The benefit-metric section is the canonical traceability link; the So-that clause is narrative framing.
**Made by:** heymishy (operator) — 2026-04-19
**Revisit trigger:** If a future /review run or DoR check flags So-that metric-naming as a hard block (not currently the case — it is a MEDIUM, not a HIGH); or if a story's ACs are challenged for lacking metric traceability (use the Benefit Linkage section as the authoritative reference, not the So-that clause).
---
