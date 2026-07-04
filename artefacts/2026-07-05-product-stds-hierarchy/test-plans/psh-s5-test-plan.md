# Test Plan: psh-s5 — Product context injection into skill sessions

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s5.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s5-review-1.md (PASS, clean)
**Test file:** `tests/check-psh-s5-context-injection.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. `getProductContext` adapter mocked. `buildSystemPrompt` function tested in isolation with injected mock adapter. No real DB calls. Concurrent session test uses two independent adapter instances.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — 5 named sections injected in order before SKILL.md | Unit | `buildSystemPrompt includes 5 product context sections before SKILL.md content` |
| AC1 — sections in declared order | Unit | `product context sections appear in correct order: Mission, Tech Stack, Constraints, Roadmap, Architecture Guardrails` |
| AC2 — content from DB only (not session.artefactContent) | Unit | `product context comes from adapter return value, not from session object` |
| AC3 — NULL product_id: no injection, no error | Unit | `buildSystemPrompt with null product_id proceeds without product context sections` |
| AC4 — D37 stub throws without wiring | Unit | `getProductContext throws adapter-not-wired error when setProductContextAdapter not called` |
| AC5 — D37 production wiring | Unit | `server.js wires setProductContextAdapter before HTTP server starts` |
| AC6 — concurrent sessions get correct product context | Unit | `two concurrent buildSystemPrompt calls with different productIds receive correct respective contexts` |

**Total tests: 7** (all unit)

---

## Gap Table

No gaps. All ACs testable via unit tests with mocked adapter.

---

## Unit Tests

### T1: `buildSystemPrompt includes 5 product context sections before SKILL.md content`
**AC:** AC1
**Precondition:** `getProductContext('prod-1')` mocked to return `{ mission: 'M', techStack: 'T', constraints: 'C', roadmap: 'R', architectureGuardrails: 'AG' }`. Skill content = `'# SKILL CONTENT'`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', skillContent: '# SKILL CONTENT' })`.
**Expected result:** Returned prompt string contains all 5 sections: `## Product Context — Mission` (with `M`), `## Product Context — Tech Stack` (with `T`), `## Product Context — Constraints` (with `C`), `## Product Context — Roadmap` (with `R`), `## Product Context — Architecture Guardrails` (with `AG`). All 5 appear before `# SKILL CONTENT`.

### T2: `product context sections appear in correct order`
**AC:** AC1 ordering
**Precondition:** Same as T1.
**Action:** `buildSystemPrompt(...)`. Split result on `## Product Context`.
**Expected result:** Section order is Mission → Tech Stack → Constraints → Roadmap → Architecture Guardrails. `indexOf('Mission') < indexOf('Tech Stack') < ... < indexOf('Architecture Guardrails') < indexOf('SKILL CONTENT')`.

### T3: `product context comes from adapter return value, not from session object`
**AC:** AC2
**Precondition:** Adapter mocked. Session object includes `artefactContent = 'wrong-content'` and `productContext = 'also-wrong'`. Adapter returns `{ mission: 'correct-mission' }`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', session: { artefactContent: 'wrong-content', productContext: 'also-wrong' }, skillContent: '' })`.
**Expected result:** Prompt includes `correct-mission`. Does NOT include `wrong-content` or `also-wrong`.

### T4: `buildSystemPrompt with null product_id proceeds without product context sections`
**AC:** AC3
**Precondition:** Adapter spy installed but should not be called.
**Action:** Call `buildSystemPrompt({ productId: null, skillContent: '# SKILL' })`.
**Expected result:** Returns prompt containing `# SKILL`. No `## Product Context —` section present. Adapter spy NOT called. No error thrown.

### T5: `getProductContext throws adapter-not-wired error when setProductContextAdapter not called`
**AC:** AC4
**Precondition:** Module freshly loaded with no `setProductContextAdapter` call.
**Action:** Call `getProductContext('any-id')`.
**Expected result:** Throws `Error` with message `'Adapter not wired: productContext. Call setProductContextAdapter() before use.'`

### T6: `server.js wires setProductContextAdapter before HTTP server starts`
**AC:** AC5
**Precondition:** Test imports the server module (or the wiring initialisation block). Real Anthropic/DB adapters replaced with test stubs.
**Action:** Trigger the server initialisation sequence.
**Expected result:** `getProductContext('test-id')` does not throw the adapter-not-wired error. The wired implementation is called instead.

### T7: `two concurrent buildSystemPrompt calls with different productIds receive correct respective contexts`
**AC:** AC6
**Precondition:** Adapter returns context for `prod-A` → `{ mission: 'Mission A' }` and `prod-B` → `{ mission: 'Mission B' }`. Both calls started without awaiting the other.
**Action:** `Promise.all([buildSystemPrompt({ productId: 'prod-A', ... }), buildSystemPrompt({ productId: 'prod-B', ... })])`.
**Expected result:** First result contains `Mission A`, not `Mission B`. Second result contains `Mission B`, not `Mission A`. No cross-contamination.

---

## NFR Tests

### T-NFR1: `getProductContext invoked exactly once per buildSystemPrompt call`
**NFR:** Performance (≤1 DB round-trip)
**Precondition:** Adapter is a spy.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', ... })` once.
**Expected result:** Spy call count = 1.

### T-NFR2: `buildSystemPrompt propagates DB error — does not silently return empty context`
**NFR:** Correctness (error propagation)
**Precondition:** Adapter mocked to throw `Error('DB connection lost')`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', ... })`.
**Expected result:** Error propagates — function throws or returns a rejected promise with `'DB connection lost'`. Does NOT return a prompt string with empty product context sections.
