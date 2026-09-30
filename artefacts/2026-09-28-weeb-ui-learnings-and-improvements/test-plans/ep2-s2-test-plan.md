## Test Plan: Signal-to-session seeding bridge — CTA creates a seeded skill session

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Test plan author:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-01

**E2E/browser-layout detection (Step 3a):** None of AC1–AC5 describe layout-position, computed-visual-style, or coordinate-dependent behaviour. This story introduces no new rendered UI of its own — it extends an existing POST endpoint (`ep1-s3`'s `/api/skills/[name]/sessions`) and a redirect. All 5 ACs are testable at unit/integration level (real object inspection, real router dispatch, response header/status assertions). No E2E test required for this story's own ACs.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | CTA click creates a seeded session with priorArtefacts | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Operator redirected into the live session | — | 1 test | — | — | — | 🟢 |
| AC3 | Correct skill launched, not hardcoded /improve | 1 test | — | — | — | — | 🟢 |
| AC4 | Seeding failure produces a clear error, no partial session | 1 test | — | — | — | — | 🟢 |
| AC5 | Non-seeded (ep1-s3) launches are byte-identical to today | — | 1 test (reuse) | — | — | — | 🟢 |
| AC6 | Production wiring (D37): setCreateSession forwards priorArtefacts, behavioural-correctness wiring test | — | 1 test (shared w/ AC1) | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — real-shaped `Signal` fixture objects (as confirmed in the story's own Architecture Constraints) submitted as hidden form-field values, matching how `ep2-s1`'s own rendered CTA form would actually submit them. No live signal aggregation or real `/api/signals` call needed for this story's own tests — that contract is `ep1-s1`/`ep1-s2`'s own, already covered by their own test plans.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | One signal's `source`/`type`/`text`/`timestamp` as form fields, plus `cta.skill` = `/improve` | Synthetic | None | Confirms the created session's own `priorArtefacts`/system prompt contains this content |
| AC2 | Same as AC1 | Synthetic | None | Confirms the response is a redirect to the new session's chat view |
| AC3 | Same shape, but `cta.skill` = `/workflow` (a real, confirmed-existing call site value from `signals-aggregator.js`'s `_parsePipelineState`, not an invented one) | Synthetic | None | Confirms the launched skill matches the signal's own `cta.skill`, not a hardcoded default |
| AC4 | Malformed/missing form fields; a `cta.skill` value naming a nonexistent skill (e.g. `/does-not-exist`) | Synthetic | None | Confirms a clear error and no session artefact is created |
| AC5 | No signal-context fields at all (the existing `ep1-s3` CTA shape) | N/A — reuses `ep1-s3`'s own existing fixtures | None | Confirms this story's endpoint extension is additive only |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Signal content is correctly formatted into a single priorArtefacts entry

- **Verifies:** AC1 (formatting half)
- **Precondition:** A signal's `source`/`type`/`text`/`timestamp` values, as they would arrive as form-field strings
- **Action:** Call the formatting function that turns these fields into a `priorArtefacts`-shaped entry
- **Expected result:** Returns exactly one `{path, content}` entry; `content` includes the signal's own `source`, `type`, and `text` values verbatim (not paraphrased, not truncated)
- **Edge case:** No

### A cta.skill naming a nonexistent skill is rejected before session creation

- **Verifies:** AC4
- **Precondition:** Form submission with `cta.skill` = a name not present in `listAvailableSkills()`'s own real output
- **Action:** Validate the submitted skill name against the real available-skills list
- **Expected result:** Validation fails with a clear error; the session-creation function is never called
- **Edge case:** Yes — the "skill doesn't exist" boundary

### Missing/empty signal-context fields produce a clear validation error, not a silent partial seed

- **Verifies:** AC4
- **Precondition:** Form submission with one or more of `source`/`type`/`text` empty or absent
- **Action:** Validate the submitted fields
- **Expected result:** Validation fails with a clear error naming which field is missing; no `priorArtefacts` entry is constructed from partial data
- **Edge case:** Yes

---

## Integration Tests

### Real router dispatch: POST with signal-context fields creates a session with real priorArtefacts

- **Verifies:** AC1 (behavioural half), AC3, AC6 (production wiring, behavioural-correctness form per D37 — this single test doubles as the AC6 wiring test since it already asserts two different signal contexts, via two different `/workflow` vs `/improve` dispatches across this test and the AC5 reuse test, produce different, individually-correct `priorArtefacts` contents, not merely that `setCreateSession` was called)
- **Components involved:** Extended `POST /api/skills/[name]/sessions` handler, `registerHtmlSession`, `skillsAdapter.setCreateSession`
- **Precondition:** Real router wired; session-creation's own filesystem/session-store side effects exercised for real (matching `ep1-s3`'s own `tests/check-ep1-s3-skill-launcher.js` "Integration" test convention — real handler dispatch, not a fully mocked router)
- **Action:** Dispatch a real POST to `/api/skills/workflow/sessions` with a signal's `source`/`type`/`text`/`timestamp` form fields (`cta.skill: '/workflow'`, the real, confirmed-existing non-default value)
- **Expected result:** A real session is created for `/workflow` (not `/improve`); inspecting that session's own stored `priorArtefacts`/system prompt shows the submitted signal content present — confirms genuine wiring, not merely that the request returned 200 (D37 behavioural-correctness requirement)

### Redirect into the newly created session's chat view

- **Verifies:** AC2
- **Components involved:** Same POST handler
- **Precondition:** Same as above, successful seeding
- **Action:** Inspect the HTTP response
- **Expected result:** Response is a redirect (matching the existing `ep1-s3` non-seeded redirect status/target pattern) to the new session's own chat view URL

### Non-seeded requests behave byte-identically to ep1-s3's own merged implementation

- **Verifies:** AC5
- **Components involved:** Same extended endpoint, `ep1-s3`'s own existing test suite
- **Precondition:** None — reuses `ep1-s3`'s own fixtures unmodified
- **Action:** Run `tests/check-ep1-s3-skill-launcher.js` and `tests/e2e/ep1-s3-launcher-layout.spec.js` unmodified against this story's extended endpoint
- **Expected result:** All 9 of `ep1-s3`'s own existing tests still pass with zero changes to their own assertions — confirms this story's extension is additive, not a regression

---

## NFR Tests

### No measurable latency regression versus ep1-s3's own session-creation baseline

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock comparison of session-creation time with and without a signal-context payload present, same underlying endpoint
- **Pass threshold:** No measurable regression (seeded vs non-seeded latency difference attributable only to the one additional `priorArtefacts` array entry, not a structural slowdown)
- **Tool:** `node tests/check-ep2-s2-signal-seeding-bridge.js`

### Signal-context form fields are server-validated before use

- **NFR addressed:** Security
- **Measurement method:** Confirm the validation tests above (AC4's own unit tests) reject malformed/unvalidated input before it reaches `priorArtefacts` construction or the model-facing system prompt
- **Pass threshold:** 100% of malformed-input cases rejected before reaching `buildSystemPrompt`
- **Tool:** `node tests/check-ep2-s2-signal-seeding-bridge.js`

---

## Out of Scope for This Test Plan

- Confirming `/improve`'s own downstream execution/completion behaviour once seeded — explicitly out of this epic's own MVP scope (see story's own Out of Scope section).
- Any test of `ep2-s1`'s own rendering — separate story, separate test plan; this plan assumes `ep2-s1`'s CTA form submits the fields described above, it does not re-test that `ep2-s1` renders them correctly.
- Fixing `ep1-s1`'s non-deterministic `signal.id` — not needed by this story's own design (full content passed client-side).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
