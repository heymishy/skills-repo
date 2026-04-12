# Adoption Readiness — Westpac Pilot Conversation Document

**Date:** 2026-04-12
**Baseline:** Phase 1 + Phase 2 delivery complete (13/13 stories merged, DoD-complete)
**Purpose:** RAG-status view of every committed metric for use in the Westpac pilot scoping conversation. Green = achieved and evidenced. Amber = built but unproven in a real-customer context. Red = not yet achieved.

---

## RAG Table

| ID | Metric | Status | Evidence | What closes this item |
|----|--------|--------|----------|-----------------------|
| M1 | Second squad onboarding — unassisted outer loop | 🟡 Amber | Platform built and dogfooded across Phase 1+2; discovery→DoR toolchain is fully operational with real artefacts produced. No genuine second operator (outside the platform team) has run a full outer loop unassisted. | Closes when a Westpac operator completes discovery→DoR for a real story without platform-team intervention. One real run is the evidence event. |
| M2 | Non-git-native surface adapter — assurance verdict | 🟢 Green | Five adapters operational (GitHub, Bitbucket Cloud, Bitbucket DC, ADO, AGENTS.md); POLICY.md floors wired; assurance gate routing verified in CI (p2.4–p2.5b, PR #28–#32, all merged). Phase 2 T3M1 baseline = 3/8 Y for full audit trail (see MODEL-RISK.md Section 3). | Advances further when a Westpac real PR runs through the gate on a non-GitHub surface; full T3M1 = 8/8 after Phase 3 gap closures. |
| M3 | Improvement agent first proposal generated | 🟢 Green | Improvement agent delivered (p2.11/p2.12); failure-detector, challenger pre-check, and proposals mechanism all merged and DoD-complete. workspace/proposals/ directory seeded. First real proposal will be generated when a genuine failure signal arrives. | Fully proven after first real-failure proposal is actioned through the review workflow in workspace/proposals/. |
| M4 | Fleet observability — ≥2 squads visible | 🟢 Green | fleet-state.json CI-aggregated from squad JSON files; pipeline-viz fleet panel renders ≥2 squad cards (squad-alpha, squad-beta); aggregator validated in tests (p2.7, PR #27, merged). | Advances when a Westpac squad is registered and their squad JSON contributes to fleet health. |
| M5 | Non-engineer approval outside VS Code | 🔴 Red | GitHub issue approval interface built and wired (p2.8, PR #28, merged); process-dor-approval.js accepts `/approve-dor` command; pipeline-state.json writes dorStatus on approval. Zero real non-engineers have used it. No Jira/Confluence/Slack channel is live. | Closes when a genuine PM, risk lead, or QA lead completes a DoR sign-off via the configured channel without opening VS Code. Requires a live environment and a configured approver. |
| MM1 | Solo operator outer loop calibration — ≤8h focus / ≤5d calendar | 🟢 Green | Phase 1 actuals: 11.1h focus / 2.5 days calendar (within 8h discovery-to-DoR focus target — Phase 2 comparable). parse-session-timing.js operational. Norms row added to workspace/estimation-norms.md. | No further action required at Phase 2 close. Re-baseline after first Westpac operator run to check calibration transfer. |
| MM2 | Cross-session resume — ISO datetime round-trip | 🟡 Amber | state.json ISO datetime serialisation/deserialization implemented (p1.5); check-workspace-state.js validates schema in CI. Phase 2 E3 actuals have not yet been re-parsed with parse-session-timing.js to produce the MM4 norms row. | Closes when Phase 2 /levelup runs parse-session-timing.js and writes the E3 actuals row in workspace/estimation-norms.md — a ~30-minute operator action. |
| MM3 | Improvement loop first proposal reviewed within feature window | 🟢 Green | p2.11/p2.12 DoD-complete; improvement loop fully delivered within Phase 2 cycle (within target). First actionable proposal pending a real failure signal. | No further action required to satisfy the delivery metric. Advances operationally after first real-failure proposal review. |
| MM4 | Estimation calibration accuracy — ±20% at E2 vs actual | 🟡 Amber | estimation-norms.md and results.tsv seeded with Phase 1 and Phase 2 norms entries. ±20% confidence requires a minimum of three completed features with E2+actual pairs. Phase 1 and Phase 2 = 2 features only. | Closes at Phase 3 /levelup when the third feature's actuals are ingested. Until then, estimates carry a ±40% error bound and should be disclosed as such to Westpac. |
| MM5 | Flow findings conversion rate — ≥50% of logged D-batch gaps shipped | 🟢 Green | D1/D2/D3 (p2.1), D4 (p2.2), D8/D9/B1-enforce (p2.3) all delivered in Phase 2; ≥50% of learnings.md D-batch entries converted to shipped stories. Flow findings mechanism validated end-to-end. | No further action required. Maintain as a live operational metric per improvement agent cycle. |

---

## Summary for Westpac Conversation

**Green (achieved and evidenced):** M2, M3, M4, MM1, MM3, MM5 — core platform capabilities and delivery pipeline are operational and proven in dogfood.

**Amber (built but unproven at customer scale):** M1, MM2, MM4 — the toolchain exists; the evidence events require a real Westpac operator run (M1) or a 30-minute Phase 2 /levelup action (MM2, MM4). None of the amber items require new code.

**Red (not yet achieved):** M5 — non-engineer approval requires a live, configured Jira/Confluence/Slack environment and a real approver. This is the one item that requires scoping effort before a Westpac pilot can claim this outcome.

**Audit readiness (T3M1):** 3/8 audit questions answered at Phase 2 close. Honest bounded claim: instruction identity, commit traceability, and gate verdict are confirmed. Full 8/8 requires Phase 3 gap closures (see MODEL-RISK.md Section 3 for the gap register). Westpac pilot can proceed with the 3/8 baseline disclosed; full audit trail is a Phase 3 commitment, not a Phase 2 claim.
