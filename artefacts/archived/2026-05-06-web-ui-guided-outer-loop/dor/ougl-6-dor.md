# Definition of Ready: Per-story stage routing (ougl.6)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-6-perstory-stage-routing.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-6-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-6-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-6-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-3-perstory-routing.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
1. Extend `src/web-ui/modules/journey-store.js` with three new functions: `setStoryList(journeyId, storySlugArray)`, `getCurrentStory(journeyId)` → `{slug, index}` or null, `advanceToNextStory(journeyId)` → next story slug or null (if last story completed).
2. Add `handleGetStories(req, res)` and `handlePostStories(req, res)` to `src/web-ui/routes/journey.js`, exported and wired at `GET /journey/:id/stories` and `POST /api/journey/:id/stories` in `server.js`.
3. Extend the `handlePostGateConfirm` story-mode branch: when `session.mode === 'story'` (set by `handlePostStories` when it creates the story session), the gate-confirm handler routes `test-plan → review` (instead of `test-plan → definition-of-ready`). After `review` completes, it advances to the next story via `advanceToNextStory`.
4. Story slug validation: `handlePostStories` validates each slug against the regex `/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i` before storing. Invalid slugs → 400.

**What will NOT be built:**
- Automatic slug parsing from story artefact file names
- Parallel/concurrent story processing
- Skip-story UI
- `review → definition-of-ready` transition (ougl.7)

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T6.1 | `GET /journey/:id/stories` → HTML form with pre-populated slug list (if set) |
| AC2 | T6.2 | `POST /api/journey/:id/stories` with slugs → sets story list on journey; redirects 303 to first story's test-plan session |
| AC3 | T6.3 | `getCurrentStory` → correct current story object |
| AC4 | T6.4 | `advanceToNextStory` → advances to next; returns next slug |
| AC5 | T6.5 | `advanceToNextStory` on last story → returns null |
| AC6 | T6.6 | Gate-confirm in story mode: `test-plan → review` → 303 to review session |
| AC7 | T6.7 | Gate-confirm in story mode: after `review` completes → advance to next story, 303 to next story's test-plan |
| AC8 | T6.8 | Invalid slug format → 400 from `handlePostStories` |
| AC9 | T6.9 | Zero regressions in full `npm test` |

**Note on AC6:** "story mode" is determined by `session.mode === 'story'` field set when creating sessions from `handlePostStories`. The gate-confirm branch for story mode differs from feature mode.

---

## Contract Review

✅ **Contract review passed** — review noted AC6 is a compound AC (captures test-plan→review transition AND its condition). The test T6.6 separates condition check (session.mode === 'story') from redirect target. Complexity manageable.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **non-engineer operator**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 9 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T6.1–T6.9 |
| H4 | Out-of-scope populated | ✅ PASS | Auto-slug parsing, parallel, review→DoR, skip UI excluded |
| H5 | Benefit linkage | ✅ PASS | MM1 named |
| H6 | Complexity rated | ✅ PASS | Epic 3: Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ PASS | All 9 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.5, ougl.2 (code deps). `schemaDepends: []` |
| H9 | Architecture constraints | ✅ PASS | Slug validation regex, gate-confirm story-mode branch, `req.session.accessToken`, zero new npm deps, ADR-011 additive extension. |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout ACs |
| H-NFR | NFR profile | ✅ PASS | NFR-sec-slugvalidation in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created |
| H-GOV | Approved By | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters | ✅ PASS (N/A) | No new injectable production adapters. test-isolation setters only (default = real). |

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
**Rationale:** Extends the gate-confirm handler branching logic (set in ougl.5) with a new story-mode path. Risk of incorrect branching conditions causing session creation in wrong mode.

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Per-story stage routing — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-6-perstory-stage-routing.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-6-test-plan.md

Goal:
Make every test in tests/check-ougl6-perstory-stage-routing.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Extend src/web-ui/modules/journey-store.js: add setStoryList(journeyId, storySlugArray),
  getCurrentStory(journeyId) → { slug, index } or null,
  advanceToNextStory(journeyId) → next story slug or null (null if all stories done).
  Story list is stored on the journey object as { stories: [], currentStoryIndex: 0 }.
- Add to src/web-ui/routes/journey.js:
    handleGetStories(req, res): auth guard, GET /journey/:id/stories, HTML form listing current story slugs.
    handlePostStories(req, res): auth guard, validate slugs with /^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i,
      call setStoryList, create first story's test-plan session (mode: 'story'), redirect 303.
  Slug validation failure → 400.
  Invalid slug format rejects the entire payload.
- Extend handlePostGateConfirm in journey.js: add story-mode branch.
  session.mode === 'story' → test-plan stage → review stage (NOT definition-of-ready).
  After review completes → call advanceToNextStory.
  If next story exists → create test-plan session for next story, 303 to test-plan chat.
  If no next story (null) → defer to ougl.7 (journey complete) — for now return 303 /journey/:id/stories or a placeholder.
- Wire GET /journey/:id/stories and POST /api/journey/:id/stories in server.js.
- Slug validation allowlist regex: /^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i
- Architecture standards: read .github/architecture-guardrails.md. req.session.accessToken canonical field.
- Run: node tests/check-ougl6-perstory-stage-routing.js after each change.
- Run: npm test for full suite regression check.
- Open a draft PR when all tests pass.

Files in scope:
- src/web-ui/modules/journey-store.js — add setStoryList, getCurrentStory, advanceToNextStory
- src/web-ui/routes/journey.js — add handleGetStories, handlePostStories; extend handlePostGateConfirm
- src/web-ui/server.js — wire GET/POST /journey/:id/stories routes

Files out of scope:
- src/web-ui/routes/skills.js
- Any HTML template or CSS files
- Any test files
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
