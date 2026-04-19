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
**2026-04-19 | RISK-ACCEPT | /review**
**Decision:** Accept the So-that clause metric-naming gap (finding 1-M1 from /review) across all 18 affected stories without rewriting each clause. Proceed to /test-plan per story with this gap acknowledged.
**Finding reference:** Review finding 1-M1 (MEDIUM) — "So-that clause does not name the benefit metric directly." Identified in 18/24 stories. Affected stories: p4-spike-a, p4-spike-b1, p4-spike-b2, p4-dist-lockfile, p4-dist-install, p4-dist-commit-format, p4-dist-upstream, p4-enf-decision, p4-enf-package, p4-enf-mcp, p4-enf-cli, p4-enf-schema, p4-enf-second-line, p4-nta-surface, p4-nta-gate-translation, p4-nta-artefact-parity, p4-nta-standards-inject, p4-nta-ci-artefact.
**Evidence this is acceptable:** Every affected story has a fully populated Benefit Linkage section that names the metric explicitly and explains the mechanism by which the story moves it. The So-that clause describes the delivery outcome (what the operator gets), not the metric movement — this is a documentation precision gap, not a substance gap. The /review score for the E (Architecture) category was 5/5 for all 24 stories; the only systemic finding was this clause-level wording choice.
**Alternatives considered:** (A) Rewrite So-that clauses for all 18 stories to name the metric — e.g. "So that M2 (consumer confidence) is measurable before E3 stories begin." Technically correct but adds bureaucratic noise to the user story voice. (B) Accept the gap with explicit RISK-ACCEPT (chosen) — clause quality does not affect testability, implementation direction, or AC completeness. Benefit linkage section serves the traceability function.
**Rationale:** The gap affects documentation completeness, not implementation quality. All 24 stories PASS /review with 0 HIGH findings. Rewriting 18 So-that clauses would delay /test-plan start with no quality benefit to the coding agent or to AC testability. The benefit-metric section is the canonical traceability link; the So-that clause is narrative framing.
**Made by:** heymishy (operator) — 2026-04-19
**Revisit trigger:** If a future /review run or DoR check flags So-that metric-naming as a hard block (not currently the case — it is a MEDIUM, not a HIGH); or if a story's ACs are challenged for lacking metric traceability (use the Benefit Linkage section as the authoritative reference, not the So-that clause).
---
