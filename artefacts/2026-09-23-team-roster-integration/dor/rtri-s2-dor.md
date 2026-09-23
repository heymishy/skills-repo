# Definition of Ready: Wire pod-manager.html's member picker to the real roster

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Test plan reference:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s2-test-plan.md
**Contract:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s2-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 7 ACs. The contract also resolves Run 3's LOW finding [3-L1] by explicitly recording the AC5 role-tab treatment decision (hidden, not disabled/repurposed) rather than leaving it open into implementation.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "product owner or feature lead assigning a pod" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7/7 covered (6 unit, 3 integration — some ACs covered by both) |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage names a metric | ✅ | "Real pod membership" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 3: PASS, 0 HIGH, 1 LOW (acknowledged, resolved in contract) |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream `rtri-s1` — `schemaDepends: ["reviewStatus", "testPlan", "stage"]` declared in contract; all 3 fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025/026 + pod-role/team-role distinction; review Architecture compliance score 5 (Run 3) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ | No layout-dependent ACs — N/A |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-23-team-roster-integration/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance frameworks apply — N/A |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Operator/Product Owner — 2026-09-23" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter — client-side script, no server-side I/O adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings in any review run | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-24 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | 1 acknowledged gap (AC5 role-tab treatment), resolved in this contract, not left UNCERTAIN | — |

---

## Standards injection

**Domain tags:** `web-ui`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Appended to the Coding Agent Instructions block below.

---

## Oversight level

**Epic oversight:** Low (per `epics/real-team-roster.md`) — no sign-off required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire pod-manager.html's member picker to the real roster — artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
Test plan: artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Replace `ORG_ROSTER` in `src/web-ui/public/pod-manager.html` with a
  `fetch('/api/team/members')` call in `openModal()`, populating a new
  `realRoster` array shaped `[{identity, role}, ...]`.
- `renderRoster()`: render by `identity`, reuse `buildNameRoleSpan`'s existing
  safe-DOM-construction (createElement/textContent) — do NOT reintroduce
  string-concatenation into innerHTML anywhere (MC-SEC-01, AC6).
- AC5's role-tab treatment for the "Available" panel is DECIDED (see DoR
  contract): hide the role-tabs entirely for "Available" when populated from
  the real roster — do not disable them or repurpose them, and do not leave
  this undecided.
- AC7: add an inline pod-role selector (`<select>` populated from the existing
  `VALID_ROLES` constant, plus Confirm/Cancel) shown in place of a row's "Add"
  button when clicked. The selector's chosen value — never `u.role` from the
  fetch response — is what gets passed into `addMember`. Cancelling reverts
  the row with no side effects.
- Never read the real roster's `role` field into `roleId` anywhere — it is a
  different vocabulary (team permission role, not pod role). This is a
  security/correctness-adjacent constraint, not a style preference — a test
  in the plan deliberately uses a roster fixture with `role: 'admin'` (not a
  valid pod role) to catch a bug that copies it through.
- `pod_members.role_id`/`user_id` write path (`POST /api/pods/create`,
  `pod-store.js`) is UNCHANGED — do not modify it.
- `ep4-s1`'s `feature-collaborator-store.js`/`pod-assignment-store.js` are
  UNCHANGED — AC4 verifies this, do not "fix" anything there even if it
  looks improvable; if AC4's test actually fails, stop and add a PR comment
  rather than modifying ep4-s1's code (scope-note escalation per the story's
  own Out of Scope).
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Sections directly applicable to this story:]

- **Shared shell module — escHtml():** N/A directly (this story is a client-side
  script, not a server-rendered HTML route), but the SAME principle applies to
  `pod-manager.html`'s own DOM construction: never build HTML via string
  concatenation for identity-bearing content — this story's AC6 already
  requires `createElement`/`textContent`, which is this codebase's client-side
  equivalent of `escHtml()`'s server-side rule.
- **HTML render function unit test pattern:** apply the same 3-point minimum
  (happy path, XSS injection, empty/null data) already reflected in this
  story's own test plan (AC1, AC6, AC3 respectively).
- **Stack constraints:** No new npm dependencies — Node.js built-ins /
  standard browser APIs only. No new client-side framework or library.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read
  in full before implementing.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
