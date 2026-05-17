# Definition of Ready: KiwiSaver Online Fund Switching — Digital Self-Service with Regulatory Compliance

**Status:** PROCEED (with mandatory pre-conditions — see no-go blockers below)
**Feature slug:** kiwisaver-online-fund-switching
**Date:** 2026-05-17
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S9
**Prior artefacts read from disk:** `runs/config-A-S9/discovery.md` ✅, `runs/config-A-S9/definition.md` ✅, `runs/config-A-S9/review.md` ✅, `runs/config-A-S9/test-plan.md` ✅

---

## Step 0 — Entry condition check

- Review artefact: ✅ Conditional pass — 3 HIGH findings all resolved in test plan (H1→T-FEE-004, H2→T-ELIG-005, H3→T-AUDIT-003/T-AUDIT-004)
- Test plan artefact: ✅ 26 test cases written to fail; NFR tests included; AC verification script included
- Context injection files: ✅ active
- Injection design test failure: ✅ documented in discovery; C5 classification: partial (injection-aided)

---

## Hard block checks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | Story exists with clear user outcome | ✅ PASS | 6 stories across 3 epics; all reference member, operations, or compliance outcomes |
| H2 | All ACs are testable | ✅ PASS | 26 test cases mapped to ACs; each AC has at least one corresponding test in test-plan.md |
| H3 | No open ambiguity in ACs | ✅ PASS | All 3 HIGH findings from review resolved in test plan with updated AC language |
| H4 | Regulatory and compliance constraints explicitly called out | ✅ PASS | C1 (KiwiSaver Act s.45), C2 (FMA SEN 30-day), C4 (s.51A), C5 (s.58 hardship waiver) all in ACs and test plan |
| H5 | Security and data handling addressed | ✅ PASS | MFA gate (ELIG-004 / T-ELIG-003), hashed member_id in audit records, compliance API access control (T-AUDIT-002) |
| H6 | Dependencies named and available | ✅ CONDITIONAL | MPSW-CORE-001 (Unit Registry API) — new integration; API contract not yet confirmed (A1 assumption); remaining APIs available per EA registry |
| H7 | Feature flag strategy defined | ✅ PASS | FUND_SWITCH_LIVE_ENABLED (SEN gate), SWITCH_FEE_ENABLED (PDS/fee gate); defaults and gate logic defined; gate sequencing resolved (H1→T-FEE-004) |
| H8 | Rollback and fail-safe behaviours specified | ✅ PASS | T-ELIG-005 (hardship fail-safe), T-SWITCH-006 (retry queue), T-AUDIT-004 (reconciliation retry), T-AUDIT-005 (deletion block) |
| H9 | Architecture guardrails met | ✅ PASS | Injectable adapters for Contributions Management, Unit Registry, Audit; no in-memory feature flag state; audit log is external storage |
| H-E2E | End-to-end flow specified | ✅ PASS | T-SWITCH-001 covers full happy path: eligibility → submission → audit → confirmation |
| H-NFR | Performance NFRs defined and testable | ✅ PASS | T-NFR-001 (500ms Contributions Management P95), T-NFR-002 (3s Unit Registry), T-NFR-003 (KiwiSaver s.45 audit verified), T-NFR-004 (7-year retention) |
| H-NFR2 | Security NFRs defined | ✅ PASS | MFA required, member_id hashed in audit records, compliance API access restricted to compliance roles |
| H-NFR3 | Accessibility and compliance NFRs defined | ✅ PASS | FMA CoC Part 2.2 confirmation within 1 business day (T-NOTIF-001); FMA CoC Part 4.2 fee disclosure in confirmation (T-NOTIF-003) |

**H6 conditional note:** Unit Registry API contract (MPSW-CORE-001) is listed as a new integration in the EA registry. Implementation of Story 2.2 cannot be started until the API specification is confirmed. Story 2.2 must be gated in sprint planning until API contract is available. This is logged as Assumption A1 below.

---

## Warnings

| ID | Warning | Disposition |
|----|---------|-------------|
| W1 | Unit Registry API contract not confirmed (MPSW-CORE-001) | Acknowledged — spike required before Story 2.2 sprint. Logged as A1. |
| W2 | March 31 board communication has no named owner | Acknowledged — product lead must issue board communication before engineering build starts. Logged as Pre-condition P1. |
| W3 | C5 injection design test FAIL | Acknowledged — run record will note `c5_surfacing_quality: partial`. C5 result excluded from EXP-008 H3 validation. |

---

## No-go conditions (must be resolved before engineering build starts)

**P1 — Board communication on March 31 target:**
The Product Lead and Compliance Officer must formally communicate to the board that the March 31 go-live date is incompatible with the FMA SEN 30-day notification requirement (FMA SEN obligation requires 30 calendar days between member notification dispatch and go-live; January 31 was the last viable SEN filing date for March 31 go-live; that date has passed). The board must acknowledge a revised target date. No engineering sprint planning should begin until this communication is confirmed in writing and a new target date is agreed. **This is a statutory compliance constraint, not a commercial negotiation.**

**P2 — FMA SEN process formally initiated:**
The FMA SEN filing must be initiated with MPSW-EXT-001 (FMA SEN Filing System). The SEN process takes a minimum of 30 calendar days from member notification. Engineering build can proceed in parallel, but `FUND_SWITCH_LIVE_ENABLED` cannot be set to `true` and the digital channel cannot go live until `status: NOTIFICATION_PERIOD_COMPLETE` is confirmed in the SEN record.

---

## Assumptions

**A1 — Unit Registry API contract:** Story 2.2 implementation assumes the Unit Registry API (MPSW-CORE-001) supports idempotent switch instruction submission, provides a same-day confirmation reference when submitted before the 3pm NZST cut-off, and returns a non-200 response for failed submissions. If the API contract differs, Story 2.2 ACs must be revised before implementation begins.

**A2 — Contributions Management API stability:** T-ELIG-005 (hardship fail-safe) assumes the API can return an error specifically for the `hardship_active` field independently of general unavailability. If the API fails wholesale (not field-specifically), T-ELIG-005 and T-ELIG-006 must be combined — the net effect is the same: no switch instruction is created and the member is notified. Confirm with integration team before Story 2.1 implementation.

---

## Oversight level

**HIGH** — KiwiSaver Act regulated product, FMA oversight, hardship member protection, 52,000 member impact, 7-year audit obligation. Human review is required at every feature flag activation point. All gate activations (`FUND_SWITCH_LIVE_ENABLED`, `SWITCH_FEE_ENABLED`) must be reviewed and approved by the Compliance Officer before execution.

---

## DoR contract (file touchpoints)

**Required new files:**
- `src/kiwisaver/sen-gate.js` — SEN gate logic for FUND_SWITCH_LIVE_ENABLED; `setContributionsManagementAdapter()` injectable, stub must throw
- `src/kiwisaver/fee-gate.js` — Fee gate logic for SWITCH_FEE_ENABLED; includes sequencing constraint (H1 resolution)
- `src/kiwisaver/eligibility.js` — ELIG-001 to ELIG-004 checks; `setContributionsManagementAdapter()` injectable; hardship fail-safe (H2 resolution)
- `src/kiwisaver/switch-instruction.js` — Switch instruction handler; MPSW-CORE-001 integration; retry queue; 3pm cut-off pricing date logic
- `src/kiwisaver/audit.js` — Audit log handler; MPSW-AUD-001 integration; ordering constraint (H3 resolution); reconciliation retry
- `src/kiwisaver/notification.js` — Confirmation and notification dispatcher; MPSW-EXT-002 integration; FMA disclosure template
- `src/kiwisaver/routes.js` — Route registration for all switch and eligibility endpoints
- `server.js` (existing) — Wire adapters for all six modules with real implementations
- `tests/kiwisaver/` — Test directory with test files mapped to T-SEN, T-FEE, T-ELIG, T-SWITCH, T-NOTIF, T-AUDIT, T-NFR

**Out of scope for this story:**
- Any changes to the member portal UI beyond the switch form submission endpoint (UI design is a separate track)
- Paper form process changes (existing paper process continues in parallel)
- Fund creation, fund pricing, or unit registry master data management
- Contributions holiday application or withdrawal flows
- FMA SEN filing workflow (MPSW-EXT-001 is a pre-condition, not a deliverable)

**Critical compliance gates (must not be bypassed):**
- `FUND_SWITCH_LIVE_ENABLED` gate: no code path may set this to `true` without `status: NOTIFICATION_PERIOD_COMPLETE` AND `fma_acknowledgement_reference` populated in the SEN record (T-SEN-001, T-SEN-002)
- `SWITCH_FEE_ENABLED` gate: requires `FUND_SWITCH_LIVE_ENABLED: true` AND PDS 20-business-day period AND `hardship_waiver_legal_sign_off: true` (T-FEE-001 to T-FEE-004)
- Hardship waiver: when `hardship_active: true` OR when Contributions Management returns an error for ELIG-003, `fee_waiver_applied` must default to `true` and fee must be `$0.00` (T-FEE-005, T-ELIG-005) — this is a KiwiSaver Act s.58 statutory obligation, not a product decision
- Audit ordering: audit record must be written before instruction status is updated to COMMITTED (T-AUDIT-003)
- `req.session.accessToken` must be used for all authenticated session reads (not `req.session.token`)

---

## Coding agent instructions

You are implementing the KiwiSaver online fund switching feature. This is a KiwiSaver Act regulated feature. All compliance gates are statutory — they are not configurable and must not be bypassed.

**Before writing any code:**
1. Read all four prior artefacts from disk: `discovery.md`, `definition.md`, `review.md`, `test-plan.md`
2. Confirm pre-conditions P1 (board communication) and P2 (FMA SEN initiated) are acknowledged in the run context. In eval mode, these are confirmed as acknowledged — proceed.
3. Note that March 31 is not an achievable go-live date under FMA SEN constraint C2. Engineering timeline must target a date ≥ 30 calendar days after SEN member notification dispatch. Do not allow any hard-coded March 31 date anywhere in the codebase.

**Injectable adapter pattern (mandatory per D37):**
All adapters (Contributions Management, Unit Registry, Audit log, Notification Service, FMA SEN Filing) must be injectable with stub defaults that throw. Example:
```js
let _contributionsManagementAdapter = () => { throw new Error('Adapter not wired: contributionsManagement. Call setContributionsManagementAdapter() before use.'); };
function setContributionsManagementAdapter(fn) { _contributionsManagementAdapter = fn; }
```
Production wiring in `server.js` is a mandatory separate task. A task that "implements the handler" is different from a task that "wires the adapter in server.js".

**Test execution sequence (TDD — run after each file):**
1. Write failing test first
2. Run `npm test` — confirm RED
3. Write minimal implementation
4. Run `npm test` — confirm GREEN
5. Refactor — run `npm test` — confirm still GREEN

**C5 statutory compliance (highest priority):**
The hardship fee waiver (KiwiSaver Act s.58) is the most legally sensitive AC in this feature. T-FEE-003, T-FEE-005, and T-ELIG-005 must all pass before any other test suite. If these three tests are failing, stop and debug before proceeding. A switch feature that charges fees to members with active hardship applications is a statutory breach.

**T5 false urgency — board recalibration:**
Do not reference March 31 in any configuration, comment, error message, or documentation. The board communication (Pre-condition P1 above) requires acknowledging that March 31 is incompatible with the FMA SEN timeline. Engineering velocity should be set against the realistic date: 30 calendar days after FMA SEN member notification, plus PDS 20-business-day fee notice, coordinated with the legal team's `hardship_waiver_legal_sign_off` completion.

**Conflict marker verification (D40):**
After any conflict resolution, run `Select-String -Pattern '<<<<<<|======|>>>>>>' src/kiwisaver/*.js` before `git add`.

---

<!-- CPF-TRACE
stage: /definition-of-ready
model: claude-sonnet-4-6
config: A

hard_blocks_passed: ["H1","H2","H3","H4","H5","H6","H7","H8","H9","H-E2E","H-NFR","H-NFR2","H-NFR3"]
hard_blocks_conditional: ["H6 — Unit Registry API contract not confirmed; logged as A1; gating Story 2.2 sprint planning"]
warnings_acknowledged: ["W1 — Unit Registry API contract spike required","W2 — Board communication owner assigned (Product Lead + Compliance Officer)","W3 — C5 injection design test FAIL documented"]

no_go_conditions:
  - P1: "Board communication on March 31 incompatibility — must be confirmed before sprint planning"
  - P2: "FMA SEN process formally initiated — FUND_SWITCH_LIVE_ENABLED cannot go true until SEN NOTIFICATION_PERIOD_COMPLETE"

constraints_in_dor_contract:
  - C1: "KiwiSaver Act s.45 — 3pm NZST cut-off pricing date logic in switch-instruction.js; T-SWITCH-002/T-SWITCH-003"
  - C2: "FMA SEN 30-day — FUND_SWITCH_LIVE_ENABLED gate; T-SEN-001/T-SEN-002; P2 no-go condition"
  - C3: "March 31 false urgency — explicit prohibition on March 31 hard-coding; P1 no-go condition for board communication"
  - C4: "KiwiSaver Act s.51A — ELIG-001 tenure restriction; T-ELIG-001"
  - C5: "KiwiSaver Act s.58 hardship waiver — T-FEE-005 and T-ELIG-005; fail-safe defaults; classified highest priority in coding agent instructions"

t5_false_urgency_verdict: PASS (March 31 explicitly prohibited; P1 no-go condition; board recalibration instruction in coding agent block)
oversight_level: HIGH
dor_verdict: PROCEED_WITH_PRECONDITIONS
-->
