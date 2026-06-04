## Story: Add ---ASSUMPTION-JSON--- marker emission instruction to ideate/SKILL.md

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-skillmd-tuning.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want the `/ideate` skill to emit `---ASSUMPTION-JSON: {...}---` markers consistently throughout each session including after turn 6+,
So that assumption cards appear reliably in the web UI regardless of session length (M1, MM1).

## Benefit Linkage

**Metric moved:** MM1 — Marker emission rate in real multi-turn sessions (≥70% target); M1 — Assumption card render reliability
**How:** Without this instruction, the SKILL.md does not explicitly direct the model to emit markers, and emission in multi-turn sessions is unreliable (model context drift is the known risk at turn 6+). Spike A2 confirmed 100% emission in clean-context single-turn; this story adds the production instruction and verifies multi-turn reliability. MM1 (≥70% in a real ≥6-turn session) is the DoD entry condition.

## Architecture Constraints

- **GOVERNED FILE — ADR-011 (Artefact-first rule):** `.github/skills/ideate/SKILL.md` is a governed file under `.github/skills/`. Changes require a PR reviewed by the operator. This story must follow the full pipeline chain (story → test-plan → DoR) before implementation. This story artefact satisfies the artefact-first requirement.
- **Platform change policy (copilot-instructions.md):** SKILL.md changes must be merged via PR — not committed directly to master. This story is delivered via a separate branch.
- Marker protocol (ADR-018): `---ASSUMPTION-JSON: {"id": "...", "text": "...", "type": "...", "risk": "...", "knowness": "..."}---` — the instruction must specify this exact format with the marker on its own line in model output
- Feature flag: when this story merges, `session.assumptionCardsEnabled` is set to `true` in the default session initialisation in `src/web-ui/` — assumption cards are enabled for all sessions from this point
- **DoD entry condition (human-in-the-loop):** AC3 requires a real operator multi-turn session (≥6 turns before Lens B). This AC cannot be verified by automated CI alone. The session evidence must be recorded at `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` before this story may be marked DoD-complete.

## Dependencies

- **Upstream:** iwu.3, iwu.4, and iwu.5 must all be merged before this story proceeds to implementation — the full card pipeline must exist so that AC3 (real multi-turn session verification) can observe actual card emission in the web UI, not just log scraping
- **Downstream:** None — this is the final story in the feature delivery

## Acceptance Criteria

**AC1:** Given the updated `ideate/SKILL.md` is committed, when the instruction text is read, then it contains an explicit instruction to emit `---ASSUMPTION-JSON: {"id": "...", "text": "...", "type": "...", "risk": "...", "knowness": "..."}---` for every assumption surfaced in prose during Lens B, with the marker on its own line in the model output.

**AC2:** Given the SKILL.md instruction is committed, when a clean-context single-turn Lens B run replicating Spike A2 conditions (12 assumptions in scope) is performed, then the emission rate is ≥70% (at minimum 9 of 12 markers emitted as `assumptionCard` SSE events received by the browser).

**AC3 [Human-in-the-loop DoD entry condition]:** Given the SKILL.md instruction is committed, when a real operator session with ≥6 turns of conversation before Lens B is run and assumption markers are counted, then the emission rate is ≥70%. This AC requires a real operator session — it cannot be verified by automated CI alone. Record session evidence (turn count, emission count, rate %) at `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` before this story may be marked DoD-complete. If the emission rate is <70%, revise the instruction text and repeat.

**AC4:** Given this story is merged, when `session.assumptionCardsEnabled` is checked during web-ui session initialisation, then it defaults to `true` — assumption cards are enabled for all sessions post-merge.

## Out of Scope

- SKILL.md changes to any skill other than `ideate/SKILL.md`
- Clusters 3, 5, 6 SKILL.md tuning (deferred to post-MVP per discovery)
- Changes to `src/web-ui` server code — all server-side and browser-side changes are in iwu.2–iwu.5
- Multi-session comparison or session export features

## NFRs

- **None identified beyond DoD entry condition** — SKILL.md is plain instruction text; no runtime performance or security considerations beyond those of the SKILL.md format itself

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** The instruction text change is straightforward. The complexity is in the delivery gate: AC3 requires a real multi-turn session and the model may exhibit context drift at turn 6+. If AC3 fails, the instruction must be revised before merge. Human-in-the-loop DoD is a delivery risk, not a scope risk.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
