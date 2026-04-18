# Decision Log: 2026-04-18-cli-approach

<!--
  PURPOSE: Records the reasoning behind human judgment calls made during the pipeline.

  Artefacts record WHAT was decided.
  This log records WHY, by WHOM, and what was considered and rejected.

  This is the document you read six months later when someone asks:
  "Why did we do it this way?" or "Who agreed to skip that?"

  Written to by: pipeline skills (at decision points) and humans (during implementation).
  Read by: retrospectives, audits, onboarding, future work on this feature.

  To evolve this format: update templates/decision-log.md and open a PR.
-->

**Feature:** CLI approach for AI-assisted workflow
**Discovery reference:** `artefacts/2026-04-18-cli-approach/discovery.md`
**Last updated:** 2026-04-18

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

<!-- Pipeline appends entries here as decisions are made. Most recent at the bottom. -->

---

**2026-04-18 | SCOPE | discovery (/clarify)**
**Decision:** Theme F (second-line organisational independence — phase4-5 Problem 3) informs this feature; this feature does not deliver Theme F's governance controls. This feature's outputs (workflow declaration structure, per-node verification contract fields, optional `executorIdentity` trace field) become Theme F inputs, but dual-authority approval routing, RBNZ-ready documentation, and the second-line governance model itself remain Theme F deliverables.
**Alternatives considered:** (A) In scope as deliverables — initially taken under /clarify Q2; pulled back as over-claim. (B) Adjacent / coupled — named but not claimed. (C) Explicitly out-of-scope. Final position adopts the "informs" framing — closer to B than A or C, but with explicit input-to-Theme-F coupling named.
**Rationale:** Q2's initial Option A over-claimed scope. Theme F is heymishy's parallel workstream. This feature's maker/checker claim holds on its own structural merits (hash-verified envelope, declared-path artefact landing, trace schema aligned with existing gate); Theme F composes where the consuming organisation's governance bar requires both structural and organisational controls. Delivering Theme F from this feature would cross-scope with a parallel workstream and inflate /definition's decomposition.
**Made by:** Operator (craigfo), 2026-04-18, during /clarify Q4 directive.
**Revisit trigger:** If Theme F's delivered governance model imposes specific shape constraints on this feature's outputs (contract structure, declaration structure, trace fields) not anticipated by this discovery. Or if an auditor's position collapses the "informs, not delivers" distinction (e.g. demands this feature deliver the second-line routing itself).

---

**2026-04-18 | ASSUMPTION | discovery (/clarify)**
**Decision:** Assumption 1 (auditors accept consumer-side evaluation) is not conditional on Theme F's progress. Structural correctness stands on its own technical merits; Theme F composes where a regulated-context governance bar requires both structural and organisational controls. One genuinely unvalidated piece retained: auditor position on whether evaluation must run under their direct control, not just recording.
**Alternatives considered:** Keep A1 as originally worded ("joint validation with Theme F" — too strong a coupling; makes this feature's success dependent on heymishy's parallel workstream). Drop A1 entirely ("over-corrects; leaves a real unvalidated auditor-position question unflagged").
**Rationale:** Theme F pull-back (Q4 directive) requires the assumption to match the new scope boundary. Joint-validation wording was an over-claim of Theme F coupling; the CLI's structural claim is independently validatable via hash verification, trace schema, and assurance-gate re-verification. The narrow unvalidated piece (auditor position on direct control) is kept because it's genuinely open and not resolved by Theme F.
**Made by:** Operator (craigfo), 2026-04-18, during /clarify Q4 directive.
**Revisit trigger:** First regulated consumer engagement where an auditor explicitly rejects consumer-side evaluation regardless of recorder independence. Or where Theme F's delivered governance model resolves the auditor-position question.

---

**2026-04-18 | ASSUMPTION | discovery (/clarify)**
**Decision:** Adopt Assumption 8 — Spike A (governance logic extractability) lands adequately: either a shared governance-package core emerges, or evidence that separate per-mechanism implementations are the pragmatic path. If Spike A produces a third outcome that reshapes mechanism identity itself, this feature's framing re-runs.
**Alternatives considered:** Leave the Spike A contingency implicit (less auditable; surfaces only at /review). Make the feature hard-conditional on a specific Spike A outcome (too strong — this feature can proceed under either of Spike A's two recognised outcomes; only a third unexpected outcome reshuffles framing).
**Rationale:** This feature is framed as the reference implementation for Spike B2, which assumes Spike A has completed. Naming the Spike A contingency as an explicit assumption makes the dependency auditable at /benefit-metric and /definition. Treats the two anticipated Spike A outcomes (success / separate-implementations) as equally valid for this feature to proceed.
**Made by:** Operator (framing surfaced in /clarify prompt; absorbed into discovery 2026-04-18). Logged during /clarify.
**Revisit trigger:** Spike A completion, interim report, or any signal that Spike A's direction is one of the two anticipated outcomes rather than a third.

---

## Architecture Decision Records

<!-- No ADRs yet for this feature. Structural decisions with long-term implications go here. -->
