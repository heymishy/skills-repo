# Test Plan: psh-s10 — Standards injection into skill sessions

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s10.md
**Review reference:** artefacts/2026-07-05-product-stds-hierarchy/review/psh-s10-review-1.md (PASS, clean)
**Test file:** `tests/check-psh-s10-standards-injection.js`
**Date:** 2026-07-05

---

## Test Data Strategy

**Strategy:** Synthetic. `getActiveStandards` adapter mocked. `buildSystemPrompt` tested in isolation. No real DB calls.

**Sensitivity:** None.

---

## AC Coverage Table

| AC | Test type | Test name |
|----|-----------|-----------|
| AC1 — standards section with named subsections injected | Unit | `buildSystemPrompt includes ## Standards and Patterns with ### subsections` |
| AC2 — opted-out standard absent from injection | Unit | `opted-out standard not present in Standards section` |
| AC3 — no section when no active standards | Unit | `buildSystemPrompt omits Standards section entirely when no active standards` |
| AC4 — D37 stub throws | Unit | `getActiveStandards throws adapter-not-wired error without setStandardsAdapter` |
| AC5 — D37 production wiring | Unit | `server.js calls setStandardsAdapter before accepting connections` |
| AC6 — injection ordering: Product Context → Standards → SKILL.md | Unit | `product context sections precede Standards section which precedes SKILL.md content` |

**Total tests: 6** (all unit)

---

## Gap Table

No gaps.

---

## Unit Tests

### T1: `buildSystemPrompt includes ## Standards and Patterns with ### subsections`
**AC:** AC1
**Precondition:** `getActiveStandards('prod-1', 'org-1')` mocked to return `[{ name: 'Coding Guide', content: 'Use tabs' }, { name: 'API Patterns', content: 'REST first' }]`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', tenantId: 'org-1', skillContent: '# SKILL' })`.
**Expected result:** Prompt includes `## Standards and Patterns`. Under it: `### Coding Guide` with content `Use tabs`, and `### API Patterns` with content `REST first`. Both subsections appear before `# SKILL`.

### T2: `opted-out standard not present in Standards section`
**AC:** AC2
**Precondition:** `getActiveStandards` mocked to return only `[{ name: 'Coding Guide', content: 'Use tabs' }]` (opted-out standard not in the return — the adapter implements the opt-out exclusion).
**Action:** Call `buildSystemPrompt(...)`.
**Expected result:** Only `### Coding Guide` appears. The opted-out standard is absent. No empty subsection placeholder.

### T3: `buildSystemPrompt omits Standards section entirely when no active standards`
**AC:** AC3
**Precondition:** `getActiveStandards` mocked to return `[]`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', tenantId: 'org-1', skillContent: '# SKILL' })`.
**Expected result:** Prompt does NOT contain `## Standards and Patterns`. Not even an empty section. `# SKILL` follows directly after product context sections (if any).

### T4: `getActiveStandards throws adapter-not-wired error without setStandardsAdapter`
**AC:** AC4
**Precondition:** Module freshly loaded with no `setStandardsAdapter` call.
**Action:** Call `getActiveStandards('prod-1', 'org-1')`.
**Expected result:** Throws `Error` with message `'Adapter not wired: standards. Call setStandardsAdapter() before use.'`

### T5: `server.js calls setStandardsAdapter before accepting connections`
**AC:** AC5
**Precondition:** Server initialisation block with real DB stubs.
**Action:** Trigger server initialisation.
**Expected result:** `getActiveStandards('test-id', 'test-org')` does not throw adapter-not-wired error. The wired implementation is called.

### T6: `product context sections precede Standards section which precedes SKILL.md content`
**AC:** AC6
**Precondition:** `getProductContext` mock returns context. `getActiveStandards` mock returns 1 standard. Skill content = `'# SKILL'`.
**Action:** Call `buildSystemPrompt({ productId: 'prod-1', tenantId: 'org-1', skillContent: '# SKILL' })`. Find positions of sections.
**Expected result:** `indexOf('## Product Context — Mission') < indexOf('## Standards and Patterns') < indexOf('# SKILL')`. No standards content appears before any Product Context section.

---

## NFR Tests

### T-NFR1: `getActiveStandards called exactly once per buildSystemPrompt call`
**NFR:** Performance (≤1 DB round-trip)
**Precondition:** Adapter is a spy.
**Action:** Call `buildSystemPrompt(...)` once.
**Expected result:** Spy call count = 1.

### T-NFR2: `DB error propagates — buildSystemPrompt does not silently omit standards`
**NFR:** Correctness (error propagation)
**Precondition:** `getActiveStandards` mocked to throw `Error('Connection refused')`.
**Action:** Call `buildSystemPrompt(...)`.
**Expected result:** Error propagates — function throws or rejects with `'Connection refused'`. Does NOT silently omit the Standards section and return a partial prompt.
