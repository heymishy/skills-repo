# Definition of Ready Checklist

## Definition of Ready: Session start wizard for feature selection (wucp.4)

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.4.md
**Test plan reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.4-test-plan.md
**Verification script:** artefacts/2026-05-08-web-ui-copilot-chat-parity/verification-scripts/wucp.4-verification.md
**Assessed by:** GitHub Copilot
**Date:** 2026-05-09

---

## Contract Proposal — Session start wizard for feature selection

**What will be built:**
When the operator navigates to `/journey` and `session.activeFeatureSlug` is not set, a selection wizard is served showing all active (non-released, non-archived) features from `pipeline-state.json`. The operator selects a feature; the server validates the slug against the pipeline-state.json features allowlist, sets `session.activeFeatureSlug` and `session.stageIndex` (using `STAGE_INDEX[story.stage]`), then redirects to the journey view. If `session.activeFeatureSlug` is already set, the wizard is skipped.

A hardcoded `STAGE_INDEX` lookup table maps stage names to journey step numbers. Both `handleGetWizard()` and `handlePostWizardSelection()` are exported from journey.js and registered as routes in server.js.

**What will NOT be built:**
Git repository creation or workspace setup. Search or filter on the wizard. Archiving or releasing features. Multi-repo switching. Any cross-repo feature management.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|--------------|------|
| AC1: wizard intercepts unauthenticated/new session | T4.1 (no slug in session → wizard), T4.2 (slug set → skip wizard) | Unit |
| AC2: wizard lists features with stage label | T4.3 (active features listed), T4.4 (stage label present) | Unit |
| AC3: released/archived excluded; all excluded → "No active projects" | T4.5 (released excluded), T4.6 (archived excluded), T4.7 (all excluded → message) | Unit |
| AC4: selection sets session.activeFeatureSlug and stageIndex | T4.8 (slug set on selection), T4.9 (stageIndex set), T4.10 (STAGE_INDEX values exact) | Unit |
| AC5: pipeline-state.json absent → "No pipeline state found" | T4.11 (absent → message) | Unit |
| AC6: invalid slug in POST → HTTP 400 | T4.12 (invalid slug → 400), T4.13 (unknown slug → 400, no session write) | Unit |

**Assumptions:**
wucp.1 is implemented and `session.activeFeatureSlug` is populated by the end of wucp.1 (the session wizard populates it on first access; context-autoloader reads it in subsequent turns). Route registration for GET /journey and POST /journey/wizard is added to server.js. `renderShell()` from html-shell.js used for wizard HTML.

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js` (wizard handler exports), `src/web-ui/server.js` (GET /journey + POST /journey/wizard route registration).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS | "As a platform operator starting a new web UI session" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1: T4.1–T4.2; AC2: T4.3–T4.4; AC3: T4.5–T4.7; AC4: T4.8–T4.10; AC5: T4.11; AC6: T4.12–T4.13. 2 untestable-by-nature gaps handled as manual verification scenarios (keyboard navigation, visual feedback). |
| H4 | Out-of-scope section populated | ✅ PASS | Git repo creation, search, archiving, multi-repo all named |
| H5 | Benefit linkage references a named metric | ✅ PASS | M3 (outer loop completeness) and MM2 (unassisted replication) |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 |
| H7 | No unresolved HIGH findings from review | ✅ PASS | Review PASS — 0 HIGH, 3 MEDIUM, 2 LOW |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 6 ACs covered. Gap table: 2 "Untestable-by-nature" gaps (keyboard navigation T4.G1, visual selection feedback T4.G2) — handled as manual scenarios in verification script |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Upstream dependency on wucp.1 (session.activeFeatureSlug). schemaDepends: [] — the dependency is on a server-side session variable, NOT a pipeline-state.json schema field. No pipeline-state.json schema fields are depended upon. H8-ext absent-field check: not applicable. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS | wucp.1 dependency declared, journey coexistence, no npm deps, path traversal note (see RISK-ACCEPT wucp.4-W3-4-M2 in decisions.md — ADR reference corrected in contract). Security constraint: slug from POST body validated against pipeline-state.json allowlist before session write. |
| H-E2E | CSS-layout-dependent ACs with no E2E and no RISK-ACCEPT | ✅ PASS | Untestable-by-nature gaps are DOM-behaviour gaps (keyboard navigation, visual selection state), NOT CSS layout dependencies (visual alignment, responsive breakpoints, scroll behaviour, pixel rendering). B2 classification: not required. W4 acknowledgement and manual verification script scenarios are sufficient. |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-08-web-ui-copilot-chat-parity/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ PASS | No compliance regulatory clauses |
| H-NFR3 | Data classification field not blank | ✅ PASS | "Public / Internal — no personal data" |
| H-NFR-profile | NFR profile present for story with NFRs | ✅ PASS | Profile covers wucp.4 slug validation and response time |
| H-GOV | Approved By section in discovery artefact | ✅ PASS | "Hamish King — Platform Owner — 2026-05-09" |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ PASS | No injectable adapters introduced. handleGetWizard() and handlePostWizardSelection() are plain handler functions. D37 not triggered. |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Security (slug validation), performance (<300ms) present |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ ACKNOWLEDGED | 3 MEDIUM findings logged as RISK-ACCEPTs: wucp.4-W3-4-M1 (benefit-metric.md matrix gap — deferred to DoD), wucp.4-W3-4-M2 (wrong ADR reference — corrected in contract), wucp.4-W3-4-L1 (AC4 embedded values — intentional, tested directly). |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED | 2 manual gaps in gap table (keyboard navigation, visual feedback). Operator to review verification script. Medium oversight — tech lead awareness before assignment. |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ ACKNOWLEDGED | 2 "Untestable-by-nature" gaps: T4.G1 (keyboard navigation) and T4.G2 (visual selection feedback). Manual verification script covers both. B2 CSS-layout classification not required (not CSS layout dependencies). Accepting because the automated test suite covers all AC correctness conditions. |

---

## Standards Injection

Domain tags: not declared on story. Web-UI patterns injected proactively because the story modifies `src/web-ui/routes/journey.js` and `src/web-ui/server.js`, and the slug validation constraint directly corresponds to the skill-name allowlist validation pattern in `web-ui-patterns.md`.

Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Session start wizard — artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.4.md
Test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.4-test-plan.md
Test file: tests/check-wucp4-session-wizard.js (20 tests, all currently FAILING)
Contract: artefacts/2026-05-08-web-ui-copilot-chat-parity/dor/wucp.4-dor-contract.md

Goal:
Make every test in tests/check-wucp4-session-wizard.js pass (20 tests, currently all
failing). Do not add scope beyond what the tests and ACs specify.

Upstream dependency: wucp.1 must be implemented before this story goes live.
`session.activeFeatureSlug` is set by this story's wizard and read by wucp.1's
buildSystemPrompt() extension. The two can be implemented in parallel but must both
be present before end-to-end testing.

Primary implementation — add to src/web-ui/routes/journey.js:

  STAGE_INDEX
    Hardcoded lookup table — implement EXACTLY these values (AC4 and T4.10 assert them):
    {
      discovery: 0,
      'benefit-metric': 1,
      definition: 2,
      review: 3,
      'test-plan': 4,
      'definition-of-ready': 5,
      'branch-setup': 6,
      'implementation-plan': 7,
      'subagent-execution': 8,
      'verify-completion': 9,
      'branch-complete': 10,
      'definition-of-done': 11
    }
    Export STAGE_INDEX so tests can assert values directly.
    Stage name not in map: default to stageIndex 0.

  handleGetWizard(req, res)
    Called when GET /journey arrives and session.activeFeatureSlug is not set.
    Reads pipeline-state.json from repo root.
    If pipeline-state.json absent: serves "No pipeline state found." message (AC5).
    Filters features to active only (exclude released and archived features) (AC3).
    If all features are inactive: serves "No active projects found." message (AC3).
    For each active feature: include slug and current stage label in the wizard HTML.
    Uses renderShell() from html-shell.js for HTML response.

  handlePostWizardSelection(req, res)
    Receives POST /journey/wizard with { featureSlug } in request body.
    MANDATORY security (AC6): validate featureSlug against the pipeline-state.json
    features allowlist BEFORE any session write. Invalid slug → HTTP 400, no session mutation.
    Valid slug: set session.activeFeatureSlug = featureSlug (AC4)
    Set session.stageIndex = STAGE_INDEX[activeStory.stage] ?? 0 (AC4)
    Redirect to /journey (wizard completes, journey view takes over)

Route registration in src/web-ui/server.js:
  GET /journey  → if session.activeFeatureSlug not set: handleGetWizard
                  if session.activeFeatureSlug set:     existing journey handler
  POST /journey/wizard → handlePostWizardSelection

IMPORTANT — duplicate exports in journey.js:
journey.js has TWO module.exports = {} blocks (~line 1261 and ~line 1298).
The SECOND block is the live one. Add STAGE_INDEX, handleGetWizard,
handlePostWizardSelection to the SECOND block only. Do NOT fix the duplicate —
wsm.4 (PR #339) owns that fix.

Constraints:
- Touch: src/web-ui/routes/journey.js (wizard exports), src/web-ui/server.js (route wiring)
- Do NOT touch: skills.js, any test file, artefacts/
- No new npm dependencies
- req.session.accessToken is canonical — never req.session.token
- Use renderShell() from src/web-ui/utils/html-shell.js for all HTML responses
  (this ensures consistent shell HTML; import the module, do not inline HTML)
- pipeline-state.json is read at request time (not cached at startup)

Architecture standards: read .github/architecture-guardrails.md before implementing.
Open a draft PR when tests pass — do not mark ready for review.
Oversight: Medium — share DoR artefact with tech lead before any milestone.
If you encounter ambiguity: add a PR comment and stop.

## Applicable standards

Source: .github/standards/web-ui/web-ui-patterns.md

### Feature slug allowlist validation (directly applicable)
Feature slugs from POST body MUST be validated against the pipeline-state.json
features list before any session write. Never trust a user-provided slug directly.
Invalid slug → HTTP 400. This prevents session poisoning.

### Injectable adapter pattern (D37 — not applicable here)
No adapters introduced by this story. Plain handler functions.

### Session token access
req.session.accessToken is canonical. Never req.session.token.

### Shared shell module
src/web-ui/utils/html-shell.js provides renderShell(). Use for all HTML responses.
escHtml() is available for HTML-encoding user-visible values (feature slugs, labels).

### Stack constraints
No new npm dependencies. No Express. All session state via req.session.*.
```

---

## DoD actions required after merge

1. Update `artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md`:
   - M3 (Metric 3 — outer loop completeness rate) row: add wucp.4 contribution (session start wizard — correct feature context selection, required for M3 dogfood cycle validity)
   - MM2 (Meta-metric 2 — unassisted replication rate) row: add wucp.4 contribution (session start wizard — eliminates manual slug entry, reducing friction in unassisted cycle)
   - Authority: benefit-metric.md living document exception (pipeline instructions). Only the evidence section fields are updated, not the primary metric definition.

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Pending operator confirmation
