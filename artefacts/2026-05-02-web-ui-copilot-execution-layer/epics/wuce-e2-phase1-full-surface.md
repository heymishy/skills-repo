## Epic: Phase 1 — Full read and action surface

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** User journey

## Goal

A non-technical stakeholder — programme manager, business lead, BA, SME, or product owner — can log in and immediately see a personalised view of all features awaiting their attention, navigate to any feature artefact and read it in plain prose, understand what phase a feature is in and what is blocking it, and perform any pending sign-off or annotation action without engineer assistance. The full Phase 1 user journey is complete: from first login to attributed governance contribution, end-to-end, in a browser.

## Out of Scope

- Any skill execution or guided question flows — that is Epic 3 and 4
- Real-time multi-user collaborative editing — explicitly deferred (discovery out-of-scope item 1)
- Teams/Slack notification adapters — separate phase (WS0.4)
- Non-GitHub SCM repos — deferred (discovery out-of-scope item 3)
- User management, role assignment, or admin console — simple GitHub identity model only in Phase 1
- Artefact schema or pipeline-state.json structural changes — no new fields beyond those introduced in Epic 1

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| P1 — Non-engineer self-service sign-off rate | Established by Epic 1 baseline | ≥80% of eligible sign-offs via web | Action queue surfaces outstanding sign-offs directly — no engineer needed to route them |
| P3 — Non-technical attribution rate | Established by Epic 1 baseline | ≥90% of approved discovery artefacts | Attribution step is surfaced as a guided action in the sign-off flow |
| P4 — Status self-service rate | 0% | ≥9/10 status questions self-serviced | Programme manager status view delivers this directly |
| P5 — Sign-off wait time | Establishing baseline | ≥30% reduction | Action queue makes pending sign-offs visible without waiting for engineer to chase |
| M2 — Phase 1 stakeholder activation rate | 0% | ≥60% within 30 days of launch | Full Phase 1 experience gives every invited stakeholder a reason to activate |

## Stories in This Epic

- [ ] wuce.5 — Personalised action queue (pending sign-offs and annotations)
- [ ] wuce.6 — Multi-feature navigation and artefact browser
- [ ] wuce.7 — Programme manager pipeline status view
- [ ] wuce.8 — Annotation and comment on artefact sections

## Human Oversight Level

**Oversight:** High
**Rationale:** Customer-facing surface presenting governance records. Incorrect rendering or attribution errors could produce a false governance record. Human review required at each story PR.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
