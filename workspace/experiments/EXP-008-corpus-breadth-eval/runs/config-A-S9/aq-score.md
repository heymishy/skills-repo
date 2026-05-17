## AQ Score — S9 — Config A

> **STATUS: INVALID — REQUIRES INDEPENDENT JUDGE SESSION**
> This AQ score was produced in the same session that generated the artefacts (2026-05-17).
> Self-scoring is not valid per the EXP-008 judge protocol. A separate claude-sonnet-4-6
> judge session must score this run before the AQ result is recorded as final.
> Provisional dimension notes are preserved below for judge reference.
> `aq_status: requires_sonnet_judge_scoring`

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Problem framing | 2 | Discovery names both a regulatory gap (KiwiSaver Act s.45 — current paper process cannot meet same-day registry commitment obligation) and a business gap (52,000 members cannot self-serve online; paper process costs cited), with scoped personas (52,000 members, operations team, compliance officer, board, fund administrator), and measurable success indicators including "switch processing time from 10–15 business days to same-day" and "regulatory pre-condition completion" as explicit tracked outcomes. |
| Scope discipline | 2 | MVP scope is bounded in the discovery with 6 explicit items, and the DoR contract names five explicit out-of-scope exclusions (member portal UI design, paper form process changes, fund creation/pricing, contributions holiday application flows, FMA SEN filing workflow); the Step 4a scope accumulator in definition.md confirms 6 stories vs 6 MVP items with no drift. |
| Story testability | 2 | All ACs across 6 stories have unambiguous pass/fail conditions: Story 1.1 AC3 specifies exact field conditions (`status: NOTIFICATION_PERIOD_COMPLETE` AND `fma_acknowledgement_reference` populated); Story 2.1 AC3 specifies `hardship_active: true → fee_waiver_applied: true` with no language requiring interpretation; T-ELIG-005 (H2 resolution) specifies the exact API error scenario and the expected boolean output. |
| NFR specificity | 2 | All NFRs name specific measurable thresholds: T-NFR-001 specifies P95 ≤ 500ms under 200 concurrent requests to Contributions Management API; T-NFR-002 specifies 3-second Unit Registry API response; T-NFR-003 verifies KiwiSaver Act s.45 same-day pricing compliance via 30-day audit log sample; T-NFR-004 specifies 7-year minimum retention with exact deletion workflow. |
| DoR gate quality | 2 | DoR contract gates both C1 (KiwiSaver Act s.45, via FUND_SWITCH_LIVE_ENABLED gate and T-SWITCH-002) and C2 (FMA SEN 30-day, via P2 no-go condition naming FMA SEN initiation as a go/no-go condition), names responsible parties (Product Lead + Compliance Officer for P1, Compliance Officer for gate activations), and the test plan includes adversarial cases: T-ELIG-005 (hardship API unavailability fail-safe), T-SEN-003 (FMA query blocks go-live), T-AUDIT-005 (deletion attempt blocked), and T-SWITCH-006 (Unit Registry timeout retry queue). |

**AQ raw: 10/10 = 1.00**
**Proposed AQ: 1.00** — pending operator review

### Scoring notes

All five dimensions scored 2 without close calls. The primary risk point was Dimension 4 (NFR specificity): the story does not name a specific regulatory clause for the audit write latency NFR (T-AUDIT-001: "within 5 seconds"), which could have warranted a score of 1; however, T-NFR-003 separately provides a KiwiSaver Act s.45 compliance NFR with audit-trail verification, and the audit write latency is stated as a specific threshold (5 seconds) rather than a vague directive, meeting the rubric at Score 2. Note: the C5 injection design test FAIL documented in discovery means the C5 propagation result carries `c5_surfacing_quality: partial` — this is a CPF tracking note, not an AQ deduction; AQ measures artefact executability, not constraint detection purity.
