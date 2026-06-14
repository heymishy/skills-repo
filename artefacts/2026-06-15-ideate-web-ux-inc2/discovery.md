# Discovery: /ideate Web UX — Increment 2 (Conditions Sidebar)

**Status:** Approved
**Created:** 2026-06-15
**Approved by:** Hamish King — Platform operator / tech lead — 2026-06-15
**Author:** GitHub Copilot (Claude Sonnet 4.6)
**Parent feature:** artefacts/2026-05-21-ideate-web-ux/ (Increment 1 — complete, definition-of-done 2026-06-15)

---

## Problem Statement

Increment 1 delivered three visible streams in the /ideate web session: context manifest (what was loaded), assumption cards (what the model believes but hasn't validated), and a live artefact draft. One stream from the Lens A opportunity map was deliberately deferred: **conditions**.

During /ideate sessions, the model surfaces two distinct types of output that shape downstream delivery:

1. **Assumptions** — things believed to be true but unvalidated. Now visible via `assumptionCard` SSE events. Operators can confirm or flag them in-session. Delivered in Increment 1.

2. **Conditions** — known constraints, dependencies, and conditions of satisfaction that bound the solution space. These are not uncertain the way assumptions are; they represent definite constraints that the product must accommodate: regulatory requirements, platform constraints, hard dependencies on other teams or systems, and outcome conditions that define what "success" looks like for the opportunity. Currently invisible during /ideate sessions.

The conditions stream is distinct from the assumptions stream because the interaction model is different: an assumption may be confirmed or flagged (uncertain → resolved), but a condition is not validated — it is **noted and carried forward** into /discovery and /definition. An unacknowledged condition does the same downstream damage as an unconfirmed assumption: the /definition stories end up constrained by something never made explicit at ideation time.

**Observed cost:** In the 2026-05-21-ideate-web-ux delivery, conditions-class output ("SKILL.md modifications require a separate governed pipeline story per Constraint 4", "no new runtime dependencies", "in-memory only for MVP") appeared in ideation text but were not surfaced structurally. They were later found in the discovery constraints section because the operator had to re-read the full ideation transcript to extract them — adding ~40 minutes of manual re-work. With a conditions sidebar, these would surface in real time alongside the artefact draft.

---

## Who It Affects

**Primary — Platform operator running /ideate** who needs to capture constraints and outcome conditions at the point they surface, not reconstruct them from transcript after the session. The conditions panel becomes the live feed for the "Architecture Constraints," "Dependencies," and "Conditions of Satisfaction" sections that /discovery requires. Operators copy from the panel into the discovery artefact instead of re-reading the thread.

**Secondary — /discovery and /definition authors** receiving a completed ideation artefact. Conditions that surfaced during ideation are now explicit in a structured list rather than buried in paragraph prose — reducing re-reading cost for downstream artefact authors.

---

## Why Now

1. **Assumption cards proved the pattern.** The `assumptionCard` SSE event + right-panel card pattern is live and used. Operators are now habituated to right-panel structured cards. Adding a second card type (conditions) has lower adoption friction now than it would in a later increment after the UI has been stable for months.

2. **Architecture is already extended.** The `---ASSUMPTION-JSON---` parser (`parseAssumptionMarker` in `skills.js`) and the SSE emission pipeline are in place. Adding `---CONDITION-JSON---` is a direct analogue: same parsing pattern, same SSE emission, new panel section.

3. **Governed SKILL.md change already cost a full story (iwu.6).** Rather than opening a third governed SKILL.md story to add `conditionItem` instruction later, absorbing it now as a story within Increment 2 keeps the SKILL.md governance overhead attached to the increment that benefits from it.

---

## Scope

### Primary — Cluster 6: Conditions sidebar

**What it delivers:**
- A new SSE marker format emitted by the ideate skill: `---CONDITION-JSON: {"id":"<kebab-slug>","text":"<condition as a plain declarative sentence>","type":"constraint|dependency|outcome","source":"operator|model"}---`
- A new SSE event type `conditionItem` emitted by `skills.js` when a `---CONDITION-JSON---` marker is parsed from the model stream
- A new `#condition-items` panel section in the /ideate chat shell right panel, rendered alongside `#assumption-cards`
- Condition items are displayed as cards with type badge (constraint / dependency / outcome) and source indicator. Unlike assumption cards, there is no confirm/flag interaction — conditions are noted and carried forward, not resolved
- `---CONDITION-JSON---` marker emission instruction added to `ideate/SKILL.md` (governed change, high oversight, separate story — same pattern as iwu.6)

**Panel layout (Increment 2):**
The right panel currently has two sections: `#assumption-cards` (top, `max-height:42%`) and `#draft-content` (bottom, `flex:1`). Increment 2 adds a third section: `#condition-items`. Layout becomes three stacked sections with configurable `max-height` values, all within the existing right-panel flex column.

**Interaction model:**
- Conditions accumulate in order of emission during the session
- No state mutation (no confirm/flag) — condition cards are read-only
- Conditions are persisted in `session.conditionItems[]` in the in-memory session store alongside `session.assumptionCards`
- No export endpoint needed in Increment 2 (noted as Increment 3 candidate)

### Out of Scope

- **Cluster 3 — Session recovery / resume:** Deferred. Requires disk persistence, new security surface. Not changed by Increment 2.

- **Cluster 5 — Structured input forms:** Requires UX design artefact before scoping. The interaction model for structured inputs (what the form looks like, how it integrates with the existing chat-first flow, how SKILL.md defines field schemas) needs design exploration before this can be correctly scoped as a delivery story. Increment 2 does not touch Cluster 5. A UX design artefact (`artefacts/2026-06-15-ideate-web-ux-inc2/ux-design/cluster5-input-forms-design.md`) and a separate discovery for Cluster 5 should be produced before scoping — likely using the `/frontend-design` skill to prototype the form UX first.

- **Condition export / copy-to-clipboard:** Noted as Increment 3 candidate. Conditions are visible in-session but not exportable in Increment 2.

- **Condition deduplication / merge:** If the model emits two conditions with the same text, both appear. Deduplication is not in scope.

- **Multi-panel resize / collapse:** Panel section resize is not in scope. The three-section layout uses fixed `max-height` values per section.

---

## Assumptions and Risks

**[ASSUMPTION] The model can reliably emit `---CONDITION-JSON---` markers at appropriate points during ideation, at a similar rate to `---ASSUMPTION-JSON---` markers.** This depends on the SKILL.md instruction quality. The iwu.6 experience (assumption marker instruction) shows that a well-placed instruction with a concrete example produces consistent emission. The same approach will be used for condition markers. The emission instruction story (inc2.2 — the SKILL.md story) includes a human-in-the-loop verification requirement, same as iwu.6.

**[ASSUMPTION] Three stacked panel sections are usable without panel resize controls.** If the conditions stream is dense (many conditions emitted), the conditions section may crowd out the assumptions section. The `max-height` constraint provides a scroll affordance but may feel cramped. Risk: medium. Mitigation: set conditions section to `max-height:30%` and assumptions to `max-height:30%`, leaving `40%` for draft. If UX proves problematic, panel resize becomes Increment 3 scope.

**[RISK] SKILL.md governed change requires a separate story and PR.** Same risk pattern as iwu.6. Mitigated by scoping the SKILL.md change as its own story (inc2.2) with human-in-the-loop verification artefact requirement, same as iwu.6.

---

## Directional Success Indicators

**Condition capture rate:** Operators can identify at least 1 condition surfaced during a typical ideation session without re-reading the transcript. Measurement: operator self-report after first 3 live sessions with the conditions panel active.

**Discovery constraint section fill rate:** Conditions that appeared in the panel are directly usable in the /discovery "Architecture Constraints" and "Dependencies" sections. Measurement: review whether conditions panel output is referenced in the immediately following /discovery artefact.

---

## T3M1 Gate Enforcement Note

This Increment 2 delivery will be the first feature to use the web UI gate-confirm path (`handlePostGateConfirm` in `journey.js`) with the CDG chain-hash trace wired. When inc2.1 reaches `definition-of-ready`, the operator will use the web UI gate-confirm button — not a direct pipeline-state.json edit — to advance the story. This will write the first feature-slug trace entry to `workspace/traces/2026-06-15-ideate-web-ux-inc2.trace.jsonl`, providing the evidence needed to close CDG T3M1.

---

## Constraints

- **Architecture:** Conditions panel must use the existing SSE streaming pattern (`handlePostTurnStreamHtml`). No new routes or model API dependencies.
- **Governed file:** `ideate/SKILL.md` modification requires its own pipeline story, full outer loop, and human-in-the-loop verification. Scoped as inc2.2.
- **Session persistence:** In-memory only, same as Increment 1. `session.conditionItems[]` lives in the in-memory `_sessionStore` Map.
- **No new npm dependencies.**
- **No changes to the CLI interaction model.**
- **Regression contract:** All existing iwu test suites (check-iwu1 through check-iwu6, 62 tests total) must pass unmodified.
