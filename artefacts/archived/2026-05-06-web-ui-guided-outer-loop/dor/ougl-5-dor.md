# Definition of Ready: Gate-confirm handler for feature stages (ougl.5)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-5-gate-confirm-feature-stages.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-5-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-5-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-5-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-guided-journey-stages.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
Add `handlePostGateConfirm(req, res)` handler to `src/web-ui/routes/journey.js`. The handler processes `POST /api/journey/:journeyId/gate-confirm`. It: (1) authenticates, (2) looks up the journey and current active session, (3) validates `session.done === true` (else 400), (4) validates the artefact path is within the repo root (path traversal prevention — else 400), (5) writes `session.artefactContent` to `path.join(repoRoot, artefactPath)`, (6) reads back from disk, (7) calls `completeStage(journeyId, skillName, artefactPath)`, (8) determines the next stage via `getNextStage(skillName)`, (9) if next stage is `'test-plan'` → redirect 303 to `/journey/:journeyId/stories`, else (10) creates next session via `registerHtmlSession(newSid, nextSkillPath, nextSkillName, priorArtefacts)` with handoff content, sets journeyId on new session, redirects 303 to the new session's chat URL. Wire `POST /api/journey/:journeyId/gate-confirm` in `server.js`.

**What will NOT be built:**
- GitHub commit of the artefact
- Content editing within gate-confirm flow
- Per-story routing (ougl.6)
- Accepting journeyId from request body (param only)

**Architecture constraint — `_getRepoPath`:**
The function `_getRepoPath()` in `skills.js` is **not exported**. The handler MUST derive the repo root as:
```js
const repoRoot = path.resolve(__dirname, '../../..');
```
This resolves to the repo root directory (same behaviour as `_getRepoPath()`). The test plan uses `os.tmpdir()` as an injectable repoRoot for isolation.

**Review finding 1-L4 resolution:**
LOW finding from ougl.5 review ("ambiguity about `_getRepoPath` export") resolved above. The DoR contract now explicitly mandates `path.resolve(__dirname, '../../..')`. No story artefact modification needed.

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T5.1 | done:true, artefactContent non-null → file written at path.join(repoRoot, artefactPath) |
| AC2 | T5.2 | Read-back from disk (not from session.artefactContent) for priorArtefacts |
| AC3 | T5.3 | `registerHtmlSession` called with 4th arg priorArtefacts containing artefactPath |
| AC4 | T5.4 | New session journeyId === original journeyId |
| AC5 | T5.5 | New session systemPrompt contains `--- HANDOFF CONTEXT ---` |
| AC6 | T5.6 | discovery → benefit-metric → 303 `/skills/benefit-metric/sessions/[sid]/chat` |
| AC7 | T5.7 | done:false → 400 |
| AC8 | T5.8 | Unknown journeyId → 404 |
| AC9 | T5.9 | Unauth → 302 `/auth/github` |
| AC10 | T5.10 | getNextStage → 'test-plan' → 303 `/journey/:id/stories` |
| AC11 | T5.11 | Path traversal in artefactPath → 400, no file written |
| AC12 | T5.12 | Multiple prior stages → priorArtefacts contains all prior completed stages |

---

## Contract Review

✅ **Contract review passed** — write-then-read pattern prevents stale cache. Path traversal guard is AC-tested. Handoff block injection relies on ougl.1's `buildSystemPrompt` 4th-param extension. Review finding 1-L4 (LOW) resolved explicitly in this contract.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **non-engineer operator**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 12 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T5.1–T5.12 |
| H4 | Out-of-scope populated | ✅ PASS | GitHub commit, content editing, per-story routing, body-supplied journeyId excluded |
| H5 | Benefit linkage | ✅ PASS | MM1 + MM2 both named |
| H6 | Complexity rated | ✅ PASS | Epic 2: Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ PASS | All 12 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1, ougl.2, ougl.3, ougl.4 (code deps). `schemaDepends: []` |
| H9 | Architecture constraints | ✅ PASS | `path.resolve(__dirname, '../../..')` for repoRoot (NOT `_getRepoPath()` — not exported). Path traversal prevention. Write-then-read. ADR decision at artefacts/…/decisions.md. `req.session.accessToken`. |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No HTML output — redirect handler |
| H-NFR | NFR profile | ✅ PASS | NFR-sec-pathtraversal, NFR-obs-artefactsaved, NFR-atomicity-gateconfirm in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created |
| H-GOV | Approved By | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters | ✅ PASS (N/A) | Test-isolation setters in journey.js export `setRepoRoot`, `setRegisterHtmlSession`, etc. — default = real production implementation. No separate wiring step needed. D37 does not apply. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | In nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | 0 MEDIUM | — |
| W4 | Verification script reviewed | ✅ | Reviewed by operator (Hamis). Domain expert in this tooling. | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium (Epic 2 setting)
**Rationale:** First handler to perform disk writes and read-backs. Path traversal and file system safety must be correct. Handoff injection is the core ougl value delivery path.

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Gate-confirm handler for feature stages — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-5-gate-confirm-feature-stages.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-5-test-plan.md

Goal:
Make every test in tests/check-ougl5-gate-confirm-feature-stages.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add handlePostGateConfirm to src/web-ui/routes/journey.js. Export it. Wire POST /api/journey/:journeyId/gate-confirm in server.js.
- CRITICAL — repo root derivation: _getRepoPath() in skills.js is NOT exported. Do NOT attempt to import it.
  Derive repo root as: const repoRoot = path.resolve(__dirname, '../../..');
  For test isolation, export setRepoRoot(fn) from journey.js where default returns path.resolve(__dirname, '../../..').
- Path traversal prevention (AC11): Before any fs.writeFileSync, resolve the full write path and verify it starts with repoRoot.
  If !resolvedPath.startsWith(repoRoot), return res.status(400). Do NOT write the file.
- Write-then-read (AC2): After fs.writeFileSync, use fs.readFileSync to re-read the content for priorArtefacts. Do not use session.artefactContent directly.
- priorArtefacts (AC12): Collect ALL completedStages from the journey (not just the current one) and map each to { path: stage.artefactPath, content: fs.readFileSync(path.join(repoRoot, stage.artefactPath), 'utf8') }.
- done:false → 400. Unknown journeyId → 404. Unauth → 302 /auth/github.
- AC10: if getNextStage(skillName) === 'test-plan' → 303 redirect to /journey/:journeyId/stories. Do NOT create a new session.
- Otherwise: registerHtmlSession(newSid, nextSkillPath, nextSkillName, priorArtefacts), linkSessionToJourney(newSid, journeyId), setActiveSession, 303 to /skills/[nextSkill]/sessions/[newSid]/chat.
- Logging: emit structured info log { event: 'artefact_saved_to_disk', journeyId, skillName, artefactPath } after successful write.
- Architecture standards: read .github/architecture-guardrails.md. req.session.accessToken is canonical token field.
- Run: node tests/check-ougl5-gate-confirm-feature-stages.js after each change.
- Run: npm test for full suite regression check.
- Open a draft PR when all tests pass.

Files in scope:
- src/web-ui/routes/journey.js — add handlePostGateConfirm (and export setRepoRoot for test isolation)
- src/web-ui/server.js — wire POST /api/journey/:journeyId/gate-confirm

Files out of scope:
- src/web-ui/routes/skills.js
- Any test files
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
