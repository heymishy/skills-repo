# Definition of Ready: DoR per-story stage and journey completion screen (ougl.7)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-7-dor-and-journey-complete.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-7-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-7-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-7-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-3-perstory-routing.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
1. Extend `handlePostGateConfirm` in `journey.js` — story-mode branch continuation: when `getNextStage` returns `'definition-of-ready'` (i.e. after `review` completes), advance to next story via `advanceToNextStory`. If a next story exists → create `test-plan` session for next story (303 redirect). If no next story (null) → call `markJourneyComplete(journeyId)` and redirect 303 to `GET /journey/:id/complete`.
2. Extend `src/web-ui/modules/journey-store.js` with `markJourneyComplete(journeyId)` — sets `journey.complete === true` and `journey.completedAt = new Date().toISOString()`.
3. Add `handleGetJourneyComplete(req, res)` to `journey.js` — auth guard, looks up journey by ID, renders a completion screen via `renderShell` with journey summary (feature slug, number of completed stages, completion timestamp). All rendered values escape-HTML guarded.
4. Wire `GET /journey/:id/complete` in `server.js`.
5. Structured log event: `{event: 'journey_completed', journeyId, featureSlug, stageCount}` emitted on journey completion (M1 metric instrumentation signal).

**What will NOT be built:**
- GitHub auto-commit of artefacts on completion
- Email notification
- Journey replay or restart
- Visual styling of the completion screen

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T7.1 | Gate-confirm in story mode, review→DoR complete, no next story → 303 to `/journey/:id/complete` |
| AC2 | T7.2 | Gate-confirm in story mode, review→DoR complete, next story exists → 303 to next story's test-plan |
| AC3 | T7.3 | `GET /journey/:id/complete` → 200, HTML contains feature slug and stage count |
| AC4 | T7.4 | `markJourneyComplete` → `journey.complete === true`, `completedAt` non-null |
| AC5 | T7.5 | Log event `journey_completed` emitted when completion screen renders |
| AC6 | T7.6 | `GET /journey/:id/complete` unauth → 302 `/auth/github` |
| AC7 | T7.7 | `GET /journey/:id/complete` unknown journey → 404 |
| AC8 | T7.8 | Feature slug and stage count in completion HTML are escHtml-escaped |
| AC9 | T7.9 | Zero regressions: `npm test` passes |

---

## Contract Review

✅ **Contract review passed** — completion screen is purely a read operation (no writes). `markJourneyComplete` is idempotent. AC9 (zero regressions in npm test) is the full suite guard.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **non-engineer operator**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 9 ACs, all GWT (AC9 is npm test guard) |
| H3 | Every AC has ≥1 test | ✅ PASS | T7.1–T7.8 + npm test for AC9 |
| H4 | Out-of-scope populated | ✅ PASS | GitHub auto-commit, email, replay, visual styling excluded |
| H5 | Benefit linkage | ✅ PASS | M1 named (journey_completed instrumentation log) |
| H6 | Complexity rated | ✅ PASS | Epic 3: Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ PASS | All 9 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.6, ougl.2 (code deps). `schemaDepends: []` |
| H9 | Architecture constraints | ✅ PASS | `renderShell`/`escHtml` on all completion screen values. `advanceToNextStory` return value drives branching. M1 log via structured console.info. `req.session.accessToken`. |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout ACs. Completion screen content test inspects HTML string. |
| H-NFR | NFR profile | ✅ PASS | NFR-sec-eschtml, NFR-obs-journeycompleted in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created |
| H-GOV | Approved By | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters | ✅ PASS (N/A) | No new injectable production adapters. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | In nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | 0 MEDIUM | — |
| W4 | Verification script reviewed | ✅ | Reviewed by operator (Hamis). Domain expert. | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium (Epic 3 setting)
**Rationale:** Final story — delivers the journey completion signal (M1 metric instrumentation). If the branching logic in gate-confirm is incorrect, journeys will not complete or will loop. Must not break any prior story's tests.

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: DoR per-story stage and journey completion screen — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-7-dor-and-journey-complete.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-7-test-plan.md

Goal:
Make every test in tests/check-ougl7-dor-and-journey-complete.js pass (all currently fail).
Zero regressions across npm test. Do not add scope beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Extend src/web-ui/modules/journey-store.js: add markJourneyComplete(journeyId) — sets
  journey.complete = true, journey.completedAt = new Date().toISOString(). Idempotent.
- Extend handlePostGateConfirm in journey.js for story-mode, definition-of-ready stage:
    call advanceToNextStory(journeyId).
    If result (next slug) is non-null → create test-plan session for next story, 303 redirect to test-plan chat.
    If result is null (last story done) → call markJourneyComplete(journeyId), emit log event, 303 to /journey/:journeyId/complete.
- Add handleGetJourneyComplete(req, res) to journey.js:
    Auth guard → 302 /auth/github.
    Look up journey by ID → 404 if not found.
    Render HTML via renderShell. Include featureSlug, stageCount, completedAt — all via escHtml.
    Emit structured log: console.info(JSON.stringify({ event: 'journey_completed', journeyId, featureSlug: journey.featureSlug, stageCount: journey.completedStages.length }))
    Return 200 with HTML.
- Wire GET /journey/:id/complete in server.js → handleGetJourneyComplete.
- escHtml applied to ALL user-visible data interpolated into completion HTML (AC8).
- Architecture standards: read .github/architecture-guardrails.md. req.session.accessToken canonical.
- Run: node tests/check-ougl7-dor-and-journey-complete.js after each change.
- Run: npm test — ALL tests in the full suite must pass. This is AC9 and a gate for opening the PR.
- Open a draft PR when all tests pass — do not mark ready for review.
- If any pre-existing test regresses, treat it as a blocker before opening the PR.

Files in scope:
- src/web-ui/modules/journey-store.js — add markJourneyComplete
- src/web-ui/routes/journey.js — extend handlePostGateConfirm (definition-of-ready branch) + add handleGetJourneyComplete
- src/web-ui/server.js — wire GET /journey/:id/complete

Files out of scope:
- src/web-ui/routes/skills.js
- Any CSS or HTML template files
- Any test files (do not modify pre-existing tests)
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
