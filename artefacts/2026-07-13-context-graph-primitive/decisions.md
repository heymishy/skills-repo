# Decision Log: context-graph-primitive

**Feature:** Context Graph Primitive — Structural Codebase Context for Outer/Inner Loop
**Discovery reference:** artefacts/2026-07-13-context-graph-primitive/discovery.md
**Last updated:** 2026-07-13

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
**2026-07-13 | ASSUMPTION | /clarify**
**Decision:** The tree-sitter-structural-extraction-vs-persistent-runtime-dependency question (constraint #11: no hosted agent service, no persistent message queue) is left explicitly open rather than resolved during /clarify — routed to `/spike` before `/definition` locks sub-feature (a)'s implementation approach. Of the 4 assumptions flagged at /discovery, this is the 1 that was not resolved this session; the other 3 (shared graph schema, artefact-governance model fit, from-scratch semantic layer quality) were resolved and are recorded directly in the discovery artefact's Assumptions and Risks section.
**Alternatives considered:** (a) Assume tree-sitter parsing is a one-shot CLI/library invocation (the common case for tree-sitter bindings) and proceed to /definition without a spike — rejected because this repo's specific environment (Windows, per this session) and the specific vendoring mechanism (git submodule vs npm dependency vs vendored source copy) have not been confirmed, and constraint #11 is a hard platform constraint, not a soft preference — getting this wrong would mean designing sub-feature (a)'s story set around an architecture that turns out to be non-compliant. (b) Resolve it definitively within /clarify itself by researching tree-sitter's execution model in the abstract — rejected because /clarify's own scope explicitly excludes investigation-requiring items ("does not run a spike — if a clarification requires investigation, route to /spike").
**Rationale:** This is exactly the class of question /clarify is designed to surface rather than force-resolve: a genuine unknown that requires hands-on investigation (vendoring an actual tree-sitter binding and confirming its invocation behaviour on this platform), not a judgment call that can be made from information already in hand. Forcing an answer now risks locking /definition's story decomposition around an unverified architectural assumption.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via /clarify, 2026-07-13.
**Revisit trigger:** Resolved once `/spike` runs and reports PROCEED (confirms one-shot invocation, no persistent-runtime dependency), REDESIGN (confirms a persistent-runtime pattern is unavoidable, requiring sub-feature (a)'s scope to change), or DEFER. This decision is superseded by that spike's outcome, not revisited independently.
---

---

## Architecture Decision Records

<!-- Add further ADRs as ADR-001, ADR-002 etc. -->
