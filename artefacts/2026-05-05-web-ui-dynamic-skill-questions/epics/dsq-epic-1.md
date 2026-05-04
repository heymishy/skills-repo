## Epic: Adaptive web UI skill conversation

**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/benefit-metric.md
**Slicing strategy:** User journey — stories follow the operator's chronological path through a skill session (answer recorded → next question served → section confirmed → session closed with clarify prompt)

## Goal

Operators running skills via the web UI experience a conversation that adapts to their answers — the model generates each next question based on the full conversation so far rather than serving the mechanically-next item from a static list. By the end of this epic, a web UI skill session will complete with a section-structured artefact and a post-session prompt to run /clarify, giving operators the same quality of guided conversation they currently only get in VS Code.

## Out of Scope

- Full VS Code surface parity — this epic makes targeted improvements; a wholesale rewrite of the web UI to match every VS Code behaviour is not in scope
- Streaming/SSE question delivery — deferred; may be added in a later initiative once the dynamic question generation baseline is stable
- Multi-operator / collaborative sessions — single-operator sessions only
- Model selection UI — model is configured via environment variable, not a user-facing control

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| P1 — Skill session completion rate | TBD (2 weeks post-deploy) | > 50% | Adaptive questions reduce "felt irrelevance" — operators are less likely to abandon mid-session when questions build on prior answers |
| P2 — Web UI share of outer loop artefacts | 0% | > 25% within 8 weeks | Higher session quality increases operator confidence in the web UI surface; section-structured artefacts match VS Code output quality |
| M1 — Fallback invisibility rate | N/A | > 95% of fallback events invisible | dsq.1 implements silent fallback — operator sees next question regardless of whether dynamic generation succeeded |
| M2 — Model question adaptation rate | 0% | > 70% | dsq.1 is the direct delivery mechanism — the model-generated next question IS the adaptation |
| M3 — Context surfacing rate | TBD (2 weeks post-deploy) | > 60% | dsq.4 structures artefact by section, giving the model a template-grounded context for each section summary |

## Stories in This Epic

- [ ] dsq.1 — Dynamic next-question generation
- [ ] dsq.2 — Section confirmation loop
- [ ] dsq.3 — Post-session /clarify gate
- [ ] dsq.4 — Section-by-section artefact assembly

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Stories touch the session lifecycle and model call path in `src/web-ui/routes/skills.js`. Changes are server-side and user-visible. A human PR review is appropriate. Coding agent can proceed without interactive checkpoints — review happens at the PR stage.

## Complexity Rating

**Rating:** 2
<!-- Some ambiguity in dsq.2 (section boundary detection from SKILL.md) and dsq.4 (template-based assembly). Core MVP (dsq.1) is well understood. -->

## Scope Stability

**Stability:** Stable
<!-- dsq.1 (core MVP) is fully specified. dsq.2–dsq.4 are companion stories named in the approved discovery. No known external dependencies that could shift scope. -->
