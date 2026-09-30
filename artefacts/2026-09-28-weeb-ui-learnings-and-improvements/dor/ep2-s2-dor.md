# Definition of Ready: Signal-to-session seeding bridge — CTA creates a seeded skill session

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-01

**Note:** AC6 (production wiring, D37) was added to the story at this DoR pass, after `/review` had already passed on the original 5 ACs — see `decisions.md` 2026-10-01 entry for the full rationale. It formalizes behaviour already described in AC1 and the story's own Architecture Constraints prose; it is not new scope.

---

## Contract Proposal

**What will be built:**
`handlePostSkillSessionHtml` (`src/web-ui/routes/skills.js:1218`) is extended to read optional hidden signal-context form fields (e.g. `signalSource`, `signalType`, `signalText`, `signalTimestamp`) from `req.body` — already populated by the existing `_csrf.csrfGuard(req, res)` call (confirmed by direct code read: `csrfGuard` sets `req.body = body`, the full parsed form object, as a side effect — no new body-reading code needed). When all 3 required fields (`source`/`type`/`text`) are present and valid, they are formatted into exactly one `priorArtefacts` entry and passed through to `_createSession(skillName, token, priorArtefacts)`. `skillsAdapter`'s `setCreateSession`/`_createSession` signature gains this additional optional 3rd parameter; the real wiring in `server.js` is updated to accept and forward it to `registerHtmlSession`'s own `priorArtefacts` option (confirmed real mechanism: `src/web-ui/routes/skills.js:2467`). The pre-existing `_createSession` stub default (currently `return { id: '' }`, confirmed non-conformant with D37) is corrected to throw, matching every other adapter default in the same file. When signal-context fields are absent (the existing `ep1-s3` primary/advanced CTA forms), behaviour is unchanged — `priorArtefacts` stays `undefined`, exactly as today.

**What will NOT be built:**
No confirmation of `/improve`'s own downstream execution/completion behaviour once seeded (explicitly out of this epic's MVP scope per `discovery.md`). No fix to `ep1-s1`'s non-deterministic `signal.id` (not needed by this story's client-side-content design). No signal-content editing/preview step before seeding.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real POST dispatch with signal fields; inspect created session's own `priorArtefacts`/system prompt | Unit (formatting) + Integration (real dispatch) |
| AC2 | Inspect response for redirect to the new session's chat view | Integration |
| AC3 | Real POST with `cta.skill: '/workflow'` (a real, confirmed-existing non-default value); confirm that skill launches, not `/improve` | Integration (same dispatch as AC1) |
| AC4 | Real POST with missing/malformed fields, or an unknown skill name | Unit (validation) |
| AC5 | Re-run `ep1-s3`'s own 9 existing tests unmodified against the extended endpoint | Integration (reuse) |
| AC6 | Same AC1/AC3 dispatch test — asserts genuine behavioural difference between two signal contexts, not merely that `setCreateSession` was called | Integration (shared) |

**Assumptions:**
`req.body` is reliably populated by the time `handlePostSkillSessionHtml`'s own code runs, since `csrfGuard` is always called first in the existing handler and always sets it as a side effect (confirmed by direct code read of `middleware/csrf.js`). `listAvailableSkills()`'s own real output is the correct validation source for "does this skill exist" (AC4), matching `_isAllowedSkillName`'s own existing real implementation in the same file.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (`handlePostSkillSessionHtml` extended, `_createSession`/`setCreateSession`/`defaultCreateSession` signature + stub fix), `src/web-ui/server.js` (real wiring of the new parameter, ~3 lines), `tests/check-ep2-s2-signal-seeding-bridge.js` (new).
Services: None new.
APIs: None new — extends the existing `POST /api/skills/[name]/sessions` contract additively.

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC6; no mismatch. The `req.body` reuse of `csrfGuard`'s own side effect (rather than a second body read) was confirmed by direct code read, avoiding a real risk (a second stream read on an already-consumed request would hang or return empty) that a less-grounded contract might have missed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 8/8 tests, 0 gaps, AC6 mapped to a shared existing test |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | "Metric 3 — Self-improvement loop accessibility (benefit-metric.md)" |
| H6 | Complexity rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies names `ep2-s1`/`ep1-s3` as upstream — `schemaDepends: ["prStatus", "dodStatus"]` declared; both fields confirmed present in `.github/pipeline-state.schema.json`. Note: `ep2-s1` has not yet reached `prStatus: merged`/`dodStatus: complete` at this DoR pass — H8-ext validates schema-field existence, not upstream completion state; implementation ordering (ep2-s1 before ep2-s2) is a Coding Agent Instructions concern, not a DoR blocker. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-022, ADR-023, D37 all explicitly cited and correctly applied; review Category E: no violations |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No AC or NFR is CSS-layout-dependent — no new rendered UI of its own |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares NFRs; profile present |
| H-GOV | Governance approval (discovery `Approved By`) | ✅ | "Hamish King — Operator / Product Owner — 2026-09-29" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | AC6 explicitly scopes production wiring; stub default fix named; wiring test is behavioural-correctness form (two different signal contexts → two different, individually-correct `priorArtefacts`), not a "was it called" check |
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
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — same standing item as every other story in this feature; recommend operator review before coding |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently (matches this feature's own established precedent).

---

## Oversight Level

**Epic oversight:** Medium (per `epics/signal-seeding-improve-loop-closure.md`) — "Signal seeding requires correct injection of signal context into the skill session model... Medium oversight ensures the session model handles signal seeds correctly before full closure." This is the story where that exact risk lives — DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signal-to-session seeding bridge — CTA creates a seeded skill session
Story artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md

IMPLEMENTATION ORDER: This story depends on ep2-s1's own rendered CTA
form (source/type/text/timestamp hidden fields) already existing.
Implement ep2-s1 first if it has not already merged.

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend handlePostSkillSessionHtml (src/web-ui/routes/skills.js) to read
  optional signal-context fields from req.body (already populated by the
  existing csrfGuard call -- do not add a second body read, it will hang
  on an already-consumed request stream).
- Format signal fields into exactly one priorArtefacts entry
  ({path, content}), per ADR-023 (artefact content injection, B-iii) --
  never full Q&A replay or a model-synthesised summary.
- One fresh, standalone session per seed, per ADR-022 (Option B) -- never
  a persistent multi-skill session.
- Do NOT re-fetch /api/signals server-side and look up a signal by id --
  signal.id is non-deterministic across calls (ep1-s1's own documented
  gap). Use only the form-submitted content directly.
- skillsAdapter.setCreateSession/_createSession signature gains an
  optional 3rd parameter (priorArtefacts). Fix the stub default
  (defaultCreateSession) to throw instead of silently returning
  {id: ''} -- matches every other adapter default in this file.
- When signal-context fields are absent, behaviour must be byte-identical
  to ep1-s3's own merged implementation -- run
  tests/check-ep1-s3-skill-launcher.js and
  tests/e2e/ep1-s3-launcher-layout.spec.js unmodified as a regression
  check; all must still pass.
- No new npm dependencies.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)
