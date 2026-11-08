# Discovery: Incident Triage and Respond

**Status:** Draft
**Created:** 2026-11-08
**Author:** Claude Sonnet 5 (conversational discovery session with operator)

---

## EA Registry Check

`architecture.ea_registry_authoritative: true` in `.github/context.yml`. No EA registry entry exists for `workspace/state.json`'s incident-tracking surface, `src/web-ui/`'s incident view, or the broader triage mechanism this initiative builds — proceeding without blast-radius data. This does not block discovery.

---

## Problem Statement

Initiative 2 (CI/CD, Observability & Hardening Automation) stops at detection and alerting — "something needs attention, here's what." Nothing today turns that alert into a human-actionable response: no triage against prior incidents, no drafted summary, and — once a fix is made via the existing short-track pipeline (`/test-plan → /definition-of-ready → coding agent → /definition-of-done`) — no confirmation that the deployed fix actually resolved the original symptom. This gap is real today even without initiative 2's alerts: the only existing precedent is `productionErrorInvestigation` in `workspace/state.json`, a manual, paused, ad-hoc investigation that stumbled onto a real, confirmed, still-unfixed `tenant_admin_bootstrap_failed` bug — in code adjacent to the fully-delivered, DoD-complete `tenant-admin-bootstrap` feature, proving that even a governed pipeline delivery can leave a production defect with no triage step at all. Initiative 4 covers triage, response drafting, and post-fix confirmation — not fix implementation itself, which already has a home.

## Who It Affects

**The delivery engineer responding to an alert** — the same person who merges code and (per initiative 2) receives CI/CD, production-defect, and vulnerability alerts. Today, when something fires, they start from zero: no prior-incident context, no summary, no record of what's already been tried. Trying to accomplish: open either the web UI or a harness session and get a triage summary with prior-incident links already assembled, decide if it's actionable, and hand off into the existing short-track pipeline with that context attached — then later confirm the fix actually resolved it, without manually re-checking logs themselves. (Given `context.yml`'s `meta.scope: personal`, this is deliberately one persona — the dual web-UI/harness requirement is the same person choosing a surface depending on context, not a second type of person.)

## Why Now

Three things converge:

1. **Platform readiness, just reached** — same precondition as the other four initiatives in this tranche: `inner-loop-cycle-efficiency` just completed, hardening CI/pipeline reliability, freeing capacity to look at a gap that's existed unaddressed for a while.
2. **Initiative 2 is about to make this gap active, not just theoretical.** Once CI/CD, production-defect, and vulnerability alerts start actually firing (initiative 2, approved, not yet built), there will be real signals with nothing downstream to receive them. This initiative isn't blocked on initiative 2 shipping first — it can start now against the manual `productionErrorInvestigation` precedent — but the sequencing risk of leaving it until after initiative 2 ships is real: alerts firing into a void for even a short window defeats the purpose of building them.
3. **This session found live, current evidence the gap matters today, not hypothetically.** The `productionErrorInvestigation` entry in `workspace/state.json` is a real, currently-paused, ad-hoc investigation; the `tenant_admin_bootstrap_failed` bug it found is real, confirmed, and still unfixed. And it sits in code adjacent to `tenant-admin-bootstrap` — a feature that went through the entire governed pipeline (discovery through DoD, 3 stories, all merged) — proving that full pipeline compliance alone doesn't prevent this specific failure mode. That's a sharper argument for urgency than a hypothetical future risk.

## MVP Scope

A 4-story MVP, consistent with the widened-slice pattern already used for initiatives 1–3:

1. **Incident record mechanism** — a structured, durable incident log (replacing today's only precedent, the ad-hoc `productionErrorInvestigation` note in `workspace/state.json`). Each record captures: what triggered it, what's known, prior-incident links, status. Designed artefact-source-agnostic from the start, same pattern as initiative 2's story 3.
2. **Triage drafting** — given an incident record (created manually for now, or later fed by initiative 2's alerts once those exist), search prior incident records and `decisions.md` for matches, and draft a triage summary: what's known, what's been tried before, suggested next step. Available via harness/Claude Code.
3. **Web UI rendering — the first real slice of initiative 1's visibility surface**, scoped specifically to incident records. Rather than a standalone view, this story extends `kanban-view.js` (or the equivalent route) to render incident records as its first real content, ahead of initiative 1's own implementation timeline.
4. **Handoff + post-fix confirmation** — a lightweight handoff that attaches the triage summary's context when a story enters the existing short-track pipeline (`/test-plan → /definition-of-ready → coding agent`) — no new fix/test/promote mechanics. Once that story reaches DoD, re-run the original triggering check and update the incident record to confirmed/not-confirmed, closing the loop.

**Delivery surface:** stories 1, 2, and 4 are harness/Claude Code-only. Story 3 is the one web UI story — it pulls in design-system compliance (constraint #9, `hasDesignSystemTrack: true`), unlike initiatives 2 and 3.

## Out of Scope

1. **Fix implementation itself** — already established; uses the existing short-track pipeline (`/test-plan → /definition-of-ready → coding agent`) unchanged. This initiative hands off context, it doesn't reimplement fix/test/promote mechanics.
2. **Automated alert generation** (CI/CD notifications, production-log scanning, vulnerability detection) — that's initiative 2's job. This initiative consumes alerts once they exist, or manually-reported incidents until then; it doesn't build detection itself.
3. **The rest of initiative 1's visibility surface beyond incident records** — story 3 builds the first slice, scoped specifically to incident records. Reactive-work rendering of short-track stories, the `decisions.md` rollup, and the load rollup remain initiative 1's own future stories, not duplicated here.
4. **Long-term or delayed re-measurement of whether a fix held** (weeks later, trend-level) — that's initiative 5's post-DoD follow-through territory. Story 4's post-fix confirmation is a single, immediate re-check right after DoD, not ongoing tracking.
5. **Automated incident classification, severity scoring, or auto-escalation** — story 2 drafts a summary for a human to read and decide on; it doesn't auto-prioritize or auto-assign without human review.
6. **Non-Teams notification channels** — same precedent as initiative 2; only Teams has real scaffolding (`teams-adapter.js`) to extend.

## Assumptions and Risks

[ASSUMPTION — requires /clarify before scope is locked] Story 4's post-fix confirmation can fall back to a manual confirm step when no automated check exists yet — true today, since initiative 2 hasn't shipped. Needs confirming this fallback is acceptable for the MVP rather than blocking story 4 on initiative 2's build.

[ASSUMPTION — requires /clarify before scope is locked] Matching a new incident against prior incident records and `decisions.md` (story 2) will surface genuinely relevant prior context, not noisy false matches. An irrelevant "similar prior incident" is worse than none — it wastes the responder's time and can mislead, not just fail to help.

[ASSUMPTION — requires /clarify before scope is locked] Building story 3 (the first slice of initiative 1's visibility surface) under initiative 4's own artefact chain won't create ownership or governance confusion when initiative 1 later runs its own `/definition` for the rest of its surface. `CLAUDE.md`'s Artefact-first rule ties UI behavioural changes to a story artefact — need to confirm which feature's chain story 3 belongs to structurally, not just conceptually.

**Known constraint, not an assumption:** story 3 pulls in design-system compliance (constraint #9, `hasDesignSystemTrack: true`) — already established, not open.

**What could make this not worth building:** if production defects stay as infrequent as they've been so far, the overhead of maintaining a structured incident-record mechanism could exceed the toil it saves compared to just continuing ad-hoc notes in `workspace/state.json`. This initiative is worth it specifically because initiative 2's upcoming alerts are expected to raise incident frequency above what ad-hoc tracking can handle — if that doesn't materialize, this is a real risk worth revisiting, not a hypothetical one.

## Directional Success Indicators

1. **Incident record mechanism (story 1).** Baseline: 0 structured incident records exist today — only one known ad-hoc note (`productionErrorInvestigation` in `workspace/state.json`), paused and unstructured. Target: every new production-defect investigation from this point forward creates a structured incident record instead of an ad-hoc note. Measured via: count of structured records vs. new ad-hoc `workspace/state.json` notes going forward — target is zero new ad-hoc notes once this ships.
2. **Triage drafting (story 2).** Baseline: 0% of incidents get an auto-drafted summary with prior-incident context today — every investigation starts from scratch (confirmed: `productionErrorInvestigation` has no such summary). Target: 100% of new incident records get an auto-drafted triage summary attempt (prior-incident matches + suggested next step), even if some drafts turn out low-confidence. Measured via: count of incident records with a triage summary attached vs. total records created.
3. **Web UI rendering (story 3).** Baseline: 0 incident records are visible in any web UI today — neither the mechanism nor the rendering surface exists yet. Target: incident records render in the web UI, confirmed end-to-end with at least one real record. Measured via: a direct check that the extended `kanban-view.js` route renders ≥1 incident record without error.
4. **Handoff + post-fix confirmation (story 4).** Baseline: 0% of fixes get any post-deploy confirmation today — the still-unfixed `tenant_admin_bootstrap_failed` bug is the live proof: even if it were fixed tomorrow, nothing would check that the fix actually worked. Target: 100% of incidents that reach a merged fix get a confirmation status recorded (automated re-check where initiative 2's detection exists, manual confirm otherwise per the Assumptions section). Measured via: count of DoD-complete stories that originated from an incident record, cross-checked against whether each has a confirmation status set.

## Constraints

**Design-system compliance applies here** (constraint #9) — unlike initiatives 2 and 3, story 3 touches `src/web-ui/`. It needs `hasDesignSystemTrack: true` on its `pipeline-state.json` entry, and compliance against `DESIGN.md` is enforced at `/definition-of-ready` via the `H-DESIGN` gate (`dsa-s5`, `scripts/check-design-tokens.js`).

**"Not a persistent agent runtime"** (#11) — stories 1, 2, and 4 must be triggered/bounded (created on demand, run as part of a CI job or short-track pipeline step), never a standing watcher — same basis applied across every initiative in this tranche.

**Credentials are structural** (#12) — if story 2 or 4 eventually posts triage summaries or confirmations via initiative 2's Teams adapter once that's built, the same rule applies: any token lives in a secrets store, never the agent's own environment. Not yet active since the adapter doesn't exist, but binding once it does.

**Structural governance preferred over instructional** (#13) — `/definition` should design story 1/2/4 so a test can verify a record or summary was actually created (e.g. an assertion that an incident record exists with a populated triage field), not just trust an instruction that it happened.

**Process constraint — artefact ownership for story 3:** since story 3 is the first slice of initiative 1's visibility surface built under initiative 4's own chain, `/definition` needs to resolve which feature's artefact trail it formally belongs to — ties directly to the open assumption above, not yet settled here.

**EA registry Path B**, same as initiatives 1–3 — no existing entry for this repo's pipeline tooling.

No time/budget/team-capability constraints identified beyond these.

## Contributors

- Hamish King — Platform Owner — 2026-11-08

## Reviewers

- [None yet]

## Approved By

[Pending]

---

**Next step:** /clarify
