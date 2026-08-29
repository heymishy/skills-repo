# Decision Log: diagram-validation-and-types

**Feature:** Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Last updated:** 2026-08-29

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
**2026-08-29 | SCOPE | discovery/clarify**
**Decision:** Cut workflow and lifecycle diagram types from this feature's MVP scope; keep sequence.
**Alternatives considered:** (1) Ship all three new types (workflow, sequence, lifecycle) as originally scoped at discovery. (2) Rescope workflow/lifecycle away from the meta-pipeline (to "a process/entity the feature itself introduces") and keep them, conditionally emitted.
**Rationale:** Originally scoped workflow ("DoR→DoD sequence") and lifecycle ("a story's journey through pipeline-state.json phases") were meta-pipeline concepts already covered live by the existing kanban board — genuinely redundant, caught by the operator during `/clarify`. Rescoping them onto "the feature being built" (matching System Architecture/Program Design/Data Model's own convention) removed the redundancy, but exposed that emission would be conditional and rare, and no concrete anticipated use case could be named for either. Sequence was kept because it maps to a concept the platform's own architecture already frequently involves (SSE turns, auth, cache fallback), not a speculative one.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a future feature's own design genuinely introduces a multi-step process or a stateful domain entity worth diagramming, revisit adding workflow/lifecycle at that point, scoped to that concrete case — not speculatively ahead of one.
---

---
**2026-08-29 | RISK-ACCEPT | definition-of-ready (S1-S5)**
**Decision:** Accept DoR Warning W4 (verification script reviewed by a domain expert) as unresolved pre-code for all 5 stories (S1-S5) — proceed to the coding agent without a pre-code human walkthrough of the 5 verification scripts.
**Alternatives considered:** (1) Pause DoR and walk through all 5 scripts before signing off any story.
**Rationale:** The verification scripts (`templates/ac-verification-script.md`) are explicitly designed to serve three moments without modification — pre-code sign-off, post-merge smoke test, and delivery review. Given solo-operator context and no separate domain expert available, the operator will use the scripts as the post-merge smoke test instead of a pre-code gate — this is one of the script's designed uses, not a workaround. Matches the identical precedent already established in this session for `revise-earlier-stage`'s own 4 stories.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a post-merge smoke test run against any of the 5 scripts finds a scenario that reveals the AC itself was wrong (not just the implementation), treat that as evidence the pre-code walkthrough would have caught it — reconsider skipping W4 for future stories.
---

---
**2026-08-29 | ARCH | definition-of-ready (S1)**
**Decision:** Add a minimal client-side console-log listener for S1's new `canvasDiagnostic` SSE event, beyond what the original Contract Proposal specified.
**Alternatives considered:** (1) Leave S1's diagnostic as a pure SSE-level event with no client-side consumer at all.
**Rationale:** Without any client-side consumer, the SSE event would reach the browser but produce no observable signal to the operator — directly contradicting the story's own stated purpose ("so that I understand exactly what went wrong instead of the diagram silently never appearing at all"). This also resolves the open gap flagged in `nfr-profile.md` ("confirm whether the diagnostic needs a visible operator-facing surface beyond logs"). Kept deliberately minimal (console only) — a full rendered UI treatment remains S2's scope for the mermaid-syntax failure mode specifically.
**Made by:** Claude (agent), during S1's DoR contract review
**Revisit trigger:** If real usage shows operators need more than a console log to notice a malformed-marker failure (e.g. it's routinely missed), revisit with a lightweight visible UI element as a follow-up story.
---

---
**2026-08-29 | DESIGN | definition-of-ready (S5)**
**Decision:** Add the new Sequence diagram type's SKILL.md instruction to `skills/design/SKILL.md` only (alongside System Architecture), not `skills/definition/SKILL.md`.
**Alternatives considered:** (1) Add it to both SKILL.md files, matching the story's own ambiguous "during /design or /definition" phrasing literally.
**Rationale:** System Architecture (an architectural/technical concept) already lives in `/design`; Data Model and Program Design (data shape and file-tree/call-stack) live in `/definition` — two structurally different concern groupings. A Sequence diagram (component interaction over time) is closer in kind to System Architecture than to either `/definition`-hosted type, making `/design` the natural single home. Since `/design` is optional (Step 2.5) and Sequence emission is itself conditional, a feature that skips `/design` simply never gets a Sequence diagram — consistent with the story's own "conditional, not unconditional" framing, not a gap.
**Made by:** Claude (agent), during S5's DoR contract review
**Revisit trigger:** If a feature that skips `/design` entirely (going straight to `/definition`) is later found to genuinely need a Sequence diagram, revisit adding the instruction to `/definition`'s SKILL.md too.
---

---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
