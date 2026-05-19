# Definition of Ready: Journey state store module and `registerHtmlSession` extension (ougl.2)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-2-journey-state-store.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-2-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-2-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-2-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-1-journey-foundation.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
1. New module `src/web-ui/modules/journey-store.js` — in-memory Map-backed store for journey state. Exported functions: `createJourney(featureSlug)`, `getJourney(journeyId)`, `setActiveSession(journeyId, sessionId, skillName)`, `getJourneyBySession(sessionId)`, `completeStage(journeyId, skillName, artefactPath)`, `getNextStage(skillName)`, `_clear()`.
2. Modify `registerHtmlSession` in `src/web-ui/routes/skills.js` — add `journeyId: null` field to the session object stored by `_setHtmlSession`. Add new exported function `linkSessionToJourney(sessionId, journeyId)` that sets `session.journeyId` on an existing session.

**What will NOT be built:**
- Persistent storage (no SQLite, no JSON file write)
- Session TTL or expiry
- `setStoryList`, `getCurrentStory`, `advanceToNextStory` (ougl.6)
- Any HTML or route changes

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T2.1 | `createJourney('slug')` → correct shape (journeyId, featureSlug, mode, etc.) |
| AC2 | T2.2 | `getJourney(id)` returns same object |
| AC3 | T2.3 | `setActiveSession` updates `activeSessionId` and `activeSkill` |
| AC4 | T2.4 | `getJourneyBySession(sid)` returns journey after `setActiveSession` |
| AC5 | T2.5 | `completeStage` adds `{skillName, artefactPath}` to `completedStages` |
| AC6 | T2.6 | `getNextStage` returns correct sequence |
| AC7 | T2.7 | 3-arg `registerHtmlSession` stores `journeyId: null` on session |
| AC8 | T2.8 | `linkSessionToJourney(sid, 'journey-xyz')` sets `session.journeyId` |
| AC9 | T2.9 | `_clear()` → `getJourney(anyId)` returns null |
| AC10 | npm test | Zero regressions in full test suite |

**Assumptions:**
- `journey-store.js` uses Node built-in `crypto.randomUUID()` for journey ID generation
- Module is CommonJS (`module.exports = { ... }`)
- No circular dependency: journey-store does not import skills.js

**Estimated touchpoints:**
- `src/web-ui/modules/journey-store.js` (CREATE)
- `src/web-ui/routes/skills.js` (modify `registerHtmlSession` + add `linkSessionToJourney` export)

---

## Contract Review

✅ **Contract review passed** — two independent changes (new module + skills.js extension). No circular dependency risk. No observable change to existing callers (new field on session is ignored by existing code). `linkSessionToJourney` is additive to module.exports.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **platform maintainer**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 10 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T2.1–T2.9 + npm test for AC10 |
| H4 | Out-of-scope populated | ✅ PASS | Persistence, TTL, setStoryList, HTML all excluded |
| H5 | Benefit linkage — named metric | ✅ PASS | M1 (as technical enabler for journey tracking) |
| H6 | Complexity rated | ✅ PASS | Epic 1: Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | No uncovered ACs | ✅ PASS | All 10 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Upstream: ougl.1 (code dep only). `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | New module at correct path, CommonJS, zero deps, ADR-011 (additive/extensible). |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No HTML output produced by this story |
| H-NFR | NFR profile or story-level NFRs | ✅ PASS | NFR-perf-journeystore, NFR-sec-journeyid, NFR-nodeps in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created this session |
| H-GOV | Approved By present | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters with wiring AC | ✅ PASS (N/A) | Story explicitly notes D37 does not apply. In-memory store has no external deps. `_clear()` is test-only. Default = real implementation. No server.js wiring step needed. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | In nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings acknowledged | ✅ (N/A) | 0 MEDIUM findings | — |
| W4 | Verification script reviewed | ✅ | Reviewed by operator (Hamis). Domain expert in this tooling. | — |
| W5 | No UNCERTAIN gaps | ✅ | All gaps: None | — |

---

## Oversight Level

**Oversight:** Medium (Epic 1 setting)
**Rationale:** `journey-store.js` is a new singleton in-memory store — bugs here corrupt journey state for all active sessions. `registerHtmlSession` change adds a field to the core session object — must not break existing HTML sessions.

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Journey state store module and registerHtmlSession extension — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-2-journey-state-store.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-2-test-plan.md

Goal:
Make every test in tests/check-ougl2-journey-state-store.js pass (all currently fail — module not found).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Create src/web-ui/modules/journey-store.js. File path is exact — do not place it elsewhere.
  CommonJS module.exports = { createJourney, getJourney, setActiveSession, getJourneyBySession,
  completeStage, getNextStage, _clear }.
  Journey IDs: crypto.randomUUID() (Node built-in — no uuid package).
  mode field: 'feature' (constant for now).
  completedStages: array of { skillName, artefactPath } objects.
  getNextStage sequence: discovery → benefit-metric → definition → test-plan → definition-of-ready → null.
  _clear(): resets the in-memory Map (test isolation only — no caller in production).
- Modify src/web-ui/routes/skills.js registerHtmlSession: add journeyId: null to the session object
  stored by _setHtmlSession. The function signature does NOT change (journeyId is always null at creation).
- Add linkSessionToJourney(sessionId, journeyId) function to skills.js and include it in module.exports.
  It finds the session via _getHtmlSession and sets session.journeyId = journeyId.
- D37 injectable adapter rule does NOT apply: no external dependencies, no production wiring step needed.
- Do NOT import journey-store.js from skills.js (no circular dependency risk, but also not needed for this story).
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Run: node tests/check-ougl2-journey-state-store.js after each change.
- Run: npm test for full suite regression check.
- Open a draft PR when all tests pass.

Files in scope:
- src/web-ui/modules/journey-store.js — CREATE
- src/web-ui/routes/skills.js — modify registerHtmlSession (add journeyId: null to session) + add linkSessionToJourney function and export

Files out of scope:
- src/web-ui/server.js
- src/web-ui/routes/journey.js (does not exist yet — created in ougl.3)
- Any HTML templates
- Any test files
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
