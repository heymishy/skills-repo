## Test Plan: rpca-s2-hotfix1 — deriveSelectorFromSpec anchors on the AC-specific inline mention, not any mention

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — found at `/definition-of-done` for `rpca-s2`. `deriveSelectorFromSpec`'s "find the first occurrence of the AC id, then the nearest following `page.locator(...)`" heuristic silently returns the SAME wrong selector for every AC in a spec file whose header comment names multiple ACs together (e.g. `tests/e2e/jcx-s3-emotion-curve.spec.js`'s own header: `// jcx-s3-emotion-curve.spec.js -- E2E coverage for AC1, AC2, AC3 of story`). Confirmed directly against that real file: `deriveSelectorFromSpec(content, 'AC1')`, `deriveSelectorFromSpec(content, 'AC2')`, and `deriveSelectorFromSpec(content, 'AC3')` all returned the identical selector `.sw-emotion-curve-point--negative circle` — AC1's own selector, silently wrong for AC2 and AC3.
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Root cause and fix

The original regex `new RegExp('\\b' + acId + '\\b')` matches the AC id's bare first occurrence anywhere in the file — including a shared header comment naming several ACs at once. Both real-world conventions sampled at this epic's own `/clarify` place the AC id directly before a closing parenthesis when it names ONE specific AC inline next to its own test or assertion (`(fpd-s4 AC3)`, `(AC1)`) — only a shared header listing several ACs together (`AC1, AC2, AC3 of story`) lacks the immediately-following `)`. The fix tightens the anchor regex to `\\b` + acId + `\\)` — requiring the acId to be immediately followed by `)` — which matches every real per-AC inline convention sampled, and correctly skips past a shared multi-AC header listing to each AC's own actual test block.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A spec file naming multiple ACs in one shared header comment resolves each AC to its own distinct, correct selector, not a shared wrong one | 1 test | — | — | — | — | 🟢 |
| AC2 | The existing single-AC-per-file convention (fpd-s4-style) is unaffected — same selector as before the fix | 1 test | — | — | — | — | 🟢 |

No gaps. Pure local logic, no real secret/network needed.

## Test Data Strategy

**Source:** Synthetic (modelled on the real `jcx-s3-emotion-curve.spec.js` shared-header shape) + real file (`tests/e2e/fpd-s4-caption-sync.spec.js`, read directly from disk) | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: a shared multi-AC header no longer collapses every AC to the same selector

- **Verifies:** AC1
- **Action:** Build a fixture spec file modelled on `jcx-s3-emotion-curve.spec.js`'s own real shape — one shared header line naming AC1/AC2/AC3 together, then three separate test blocks each with its own `(ACn)`-suffixed title and its own distinct `page.locator(...)` call. Call `deriveSelectorFromSpec` for AC1, AC2, and AC3.
- **Expected result:** Three distinct selectors returned, each matching its own test block's own locator — not the same selector three times.

### AC2: the existing single-AC-per-file convention still resolves correctly

- **Verifies:** AC2
- **Action:** Read the real `tests/e2e/fpd-s4-caption-sync.spec.js` file from disk and call `deriveSelectorFromSpec(content, 'AC3')`.
- **Expected result:** Returns `{acId: 'AC3', selector: '.playback-ac__video'}` — unchanged from before the fix.

## Out of Scope

- Changing `loadManualFallback` or `buildCaptureList` — neither is affected by this bug; `buildCaptureList` calls `deriveSelectorFromSpec` unchanged and benefits from the fix automatically.

## Test Gaps and Risks

None.
