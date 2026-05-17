# Review: Core Banking Loan Migration — LoanLedger-NZ Decommission

**Status:** Complete (eval-mode — EXP-008-corpus-breadth-eval / Config A / S10)
**Feature slug:** core-banking-loan-migration
**Date:** 2026-05-17
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S10
**Prior artefacts read:** discovery.md ✅, definition.md ✅

---

## Review findings

### HIGH findings (blocking — must be resolved before test-plan)

**H1 — Story 2.2 rollback gate undefined for partial-batch failures**

Story 2.2 AC2 states: "Any `FAILED_*` status triggers a rollback of the batch to LoanLedger-NZ." The story does not define: (a) the rollback mechanism (how does CoreBanking-NXT undo a partial batch write without corrupting already-migrated accounts from a prior batch?); (b) the maximum acceptable rollback duration during a cutover weekend (the 3-weekend window is time-constrained); (c) what happens to downstream interfaces that have already been re-pointed to CoreBanking-NXT if a rollback is required at Weekend 3. The absence of a rollback design makes the zero-tolerance FAILED_* gate untestable — a test cannot verify rollback succeeds if the rollback mechanism is not specified.

**Resolution required:** Add to Story 2.2 AC2: the rollback mechanism (transactional batch boundary definition, rollback command, verification that all CoreBanking-NXT writes from the failed batch are reversed), maximum rollback time SLA (e.g., rollback completes within 4 hours of failure detection), and the downstream interface switchback procedure if Weekend 3 rollback is triggered. This is a migration architecture decision that must be made before the test plan can test the rollback path.

**H2 — Story 1.2 missing RBNZ reporting gap for 3 custom report types — no fallback if custom development incomplete**

Story 1.2 AC1 gates parallel operation start on all 3 custom reports having `implementation_scope_confirmed: true`. However, the story does not address the scenario where custom development cannot be completed within the 12-month vendor deadline — this is a plausible risk (A2 in discovery). If the 3 custom report types are not producible from CoreBanking-NXT at cutover, RBNZ prudential reporting continuity would require continued submission from LoanLedger-NZ beyond the vendor support deadline. This scenario has no handling in any story.

**Resolution required:** Add to Story 1.2 a contingency AC or decision gate: "If custom development for all 3 report types cannot be confirmed complete by [6-month milestone], an escalation to the CRO and RBNZ Relationship Manager is triggered, and RBNZ must be notified of the reporting risk. The project cannot proceed to cutover without either: (a) confirmation all 3 report types are producible from CoreBanking-NXT, or (b) written RBNZ agreement on a post-cutover custom report delivery plan and interim reporting arrangement." This makes the risk explicit and testable.

**H3 — Story 3.1 PPSR legal opinion timing — no gate preventing cutover commencement before legal opinion**

Story 3.1 AC1 states the legal opinion must be obtained "before cutover proceeds." However, in the epic structure, Story 3.1 is in Epic 3 alongside the decommission story, which is sequenced after the migration stories. There is no gate in Story 2.2 (the migration story) that explicitly prevents commencing the staged weekend migration until the PPSR legal opinion is in hand. Given that the cutover is the point at which the 62,000 PPSR accounts move, the AC must gate the AC2 disposition schedule completion as a precondition for Story 2.2 AC1 (the baseline taken before weekend migration commences).

**Resolution required:** Add to Story 2.2 AC1: "before the weekend staged migration commences, the PPSR disposition schedule (Story 3.1 AC2) must be signed off by Legal Counsel." This creates the cross-story dependency gate that prevents the migration from proceeding without the legal opinion.

---

### IMPORTANT findings (should be resolved before DoR)

**I1 — Story 2.1 pilot sample is prescriptive on count but not on statistical representativeness**

Story 2.1 AC2 prescribes specific floor counts (3,000 personal, 4,000 home, 1,000 commercial, 500 arrears, 500 drawdown history). These are reasonable but the story does not define how the pilot sample is drawn. If the vendor selects the 10,000 accounts to maximise migration success (e.g., by selecting recently-originated accounts with minimal history), the pilot passes but does not predict the performance of the 280,000-account migration on the hardest cases (oldest accounts, most complex history, multi-drawdown commercial loans). Recommendation: specify that the pilot sample includes the oldest 500 accounts and the 500 most complex accounts (by drawdown event count) in each category.

**I2 — Story 1.1 AC3 governance flag implementation is ambiguous**

Story 1.1 AC3 references "the project governance tool" without specifying which system. If the project is using Jira, the gate would be a workflow guard; if GitHub Projects, a different mechanism. The AC says the gate is "enforced in the project governance tool and displayed in the compliance dashboard" but does not name the system or the technical enforcement mechanism. The coding agent will not know what to implement. Resolution: name the project governance system and the specific enforcement mechanism (e.g., "Sprint creation in Jira is blocked for Stories 2.x and 3.x via a pre-sprint hook that checks BS11_NOTIFICATION_STATUS = ACK_RECEIVED via API").

**I3 — Downstream interface re-pointing not explicitly gated**

The discovery mentions 8 interfaces that must be re-pointed from LoanLedger-NZ to CoreBanking-NXT at cutover (LLNZ-UP-001, LLNZ-UP-002, LLNZ-UP-003, LLNZ-DN-001 through LLNZ-DN-005). None of the 5 stories contains explicit ACs for testing that each re-pointed interface produces correct outputs after cutover. Story 2.2 covers account-level data integrity but does not cover interface-level post-cutover smoke tests. Recommendation: add interface smoke test ACs to Story 2.2 or create a Story 2.3 for interface re-pointing and post-cutover integration testing.

---

### LOW findings (informational)

**L1 — Story 1.1 does not model the 'SUPERVISORY_CONCERN_RAISED' state**

Story 1.1 AC1 includes `notification_status = SUPERVISORY_CONCERN_RAISED` in the enum but no AC or test defines what happens when RBNZ raises a supervisory concern (project pause? escalation? workflow?). This enum value is left as a placeholder. Before test-plan, define the workflow that fires when this status is set.

**L2 — Assumption A6 (board governance approvals) — not surfaced in any story**

Discovery Assumption A6 states that the BS11 notification requires formal board committee resolution reference (BS11 s.4.3(d)) and that this documentation may not exist yet. Story 1.1 AC5(d) references "governance approvals (board or board committee resolution reference)" as a checklist item, but there is no AC that gates notification filing on this documentation being confirmed. If board resolution reference is missing, the notification is incomplete per BS11 s.4.3. The test plan should include a test confirming the checklist blocks submission when governance approval documentation is not confirmed.

---

## Review summary

| Finding ID | Severity | Story affected | Status |
|-----------|----------|---------------|--------|
| H1 | HIGH | Story 2.2 | Requires resolution — rollback mechanism and SLA |
| H2 | HIGH | Story 1.2 | Requires resolution — reporting fallback for custom report delay |
| H3 | HIGH | Story 3.1, 2.2 | Requires resolution — PPSR gate on migration commencement |
| I1 | IMPORTANT | Story 2.1 | Should resolve — pilot sample representativeness |
| I2 | IMPORTANT | Story 1.1 | Should resolve — governance tool identification |
| I3 | IMPORTANT | Story 2.2 | Should resolve — interface re-pointing tests |
| L1 | LOW | Story 1.1 | Informational — SUPERVISORY_CONCERN_RAISED workflow |
| L2 | LOW | Story 1.1 | Informational — board approval gate |

**Review verdict:** 3 HIGH findings. Stories pass with resolutions integrated into the test plan and DoR contract. The 3 HIGH findings are resolved below for the test-plan stage.

---

## HIGH finding resolutions (for test-plan carry-through)

**H1 resolution (Story 2.2):**
The rollback mechanism is defined as follows. Each weekend migration runs within a transactional batch boundary scoped to the accounts in that weekend's batch. If any account in a batch receives a `FAILED_*` reconciliation status, the batch is atomically reversed using the CoreBanking-NXT batch transaction rollback API before any re-pointing of downstream interfaces for that batch. Maximum rollback SLA: 4 hours from failure detection. For a Weekend 3 rollback, downstream interfaces (LLNZ-UP-002, LLNZ-DN-002, LLNZ-DN-004) that were re-pointed for Weekends 1 and 2 remain on CoreBanking-NXT; only Weekend 3 batch accounts revert to LoanLedger-NZ shadow mode. The rollback plan is documented in the migration runbook and verified in Story 2.1 pilot testing.

**H2 resolution (Story 1.2):**
An escalation gate is added to Story 1.2: if custom development for all 3 report types is not confirmed complete by the 6-month milestone (parallel operation start), the RBNZ Relationship Manager triggers an escalation to the CRO and notifies RBNZ of the reporting risk. The project cannot proceed to cutover without: (a) confirmation that all 3 report types are producible from CoreBanking-NXT, or (b) written RBNZ agreement on an interim reporting arrangement. This gate is enforced by adding `reporting_completeness_confirmed: boolean` as a cutover-gate field alongside Story 1.2 AC5.

**H3 resolution (cross-story):**
Story 2.2 AC1 is amended to include: "Before the weekend staged migration commences, the PPSR disposition schedule (Story 3.1 AC2) must be completed and signed off by Legal Counsel. No weekend migration batch may commence without this sign-off confirmed." This creates the explicit dependency gate between PPSR legal obligations and migration commencement.
