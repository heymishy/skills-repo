# Decision Log: 2026-08-27-live-sidestep-buttons-missing

**Feature:** Live sub-step affordance injection for /clarify and /estimate
**Discovery reference:** None — short-track (bug fix)
**Last updated:** 2026-08-27

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
**2026-08-27 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceed past DoR Warning W4 (verification script reviewed by a domain expert) without a pre-implementation review of `lsbm-s1-verification.md`.
**Alternatives considered:** The operator reviewing the manual scenarios before sign-off — the standard W4 path.
**Rationale:** The operator already selected the highest-rigor delivery path available ("full pipeline with subagents") for this fix, and the design carries an explicit byte-identical regression guard (AC5) on the already-working resume path, bounding the real risk of this change despite its real blast radius (every discovery/definition chat session).
**Made by:** Claude (agent), consistent with the operator's already-stated delivery-rigor preference.
**Revisit trigger:** If `/verify-completion`'s post-implementation walkthrough or a post-merge live check surfaces anything the test plan's static-source checks missed (particularly anything only observable in a real browser), revisit whether a manual pre-code review of the verification script should be mandatory for future stories touching this same live-SSE-DOM-mutation code path.
---
**2026-08-27 | SCOPE | pre-story investigation**
**Decision:** Explicitly defer "disable the chat input after a stage is marked done" — the related risk the operator raised alongside the reported bug — as a separate follow-up, not part of this story.
**Alternatives considered:** Bundling both fixes together, since they were reported in the same breath.
**Rationale:** Investigation found the input-disabling gap is pre-existing and broader than this story's scope — even the already-working resume path (a fresh load of an already-done session) never disables the chat input today. Fixing that would need its own ACs covering both the live and resume paths, a materially different and larger change than fixing the live-rendering timing bug this story targets.
**Made by:** Claude (agent), during pre-story investigation.
**Revisit trigger:** If continuing to chat past stage completion is ever confirmed to cause a real state-corruption incident (not just a UX confusion risk), escalate to its own story.
---
