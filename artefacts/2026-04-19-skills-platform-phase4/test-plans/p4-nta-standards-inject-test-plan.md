# Test Plan: p4-nta-standards-inject — Standards injection for non-technical roles

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-standards-inject.md
**Epic:** E4 — Non-technical access
**Dependency:** Spike D PROCEED verdict required; p4-nta-surface must be complete

## Scope

Tests verify that standards content is injected before question text (C7 ordering), sourced from the local sidecar without HTTP fetch (C5), degraded gracefully when sidecar unavailable (AC3), and scoped to the participant's declared discipline role (AC4). No external log calls with standards content (MC-SEC-02).

**Implementation module:** `src/teams-bot/standards-injector.js`

---

## Test Cases

### T1 — Module exists and exports injectStandards

**Type:** Unit
**Check:** `src/teams-bot/standards-injector.js` exists and exports `injectStandards` as a function.

### T2 — Sidecar present → returns standardsContent and standardsInjected: true

**Type:** Unit
**Given:** A temporary sidecar directory containing a standards file `product/discovery-quality.md` with non-empty content. Path provided via `sidecarRoot` option.
**When:** `injectStandards({ step: 'problem-statement', role: 'product-manager', sidecarRoot: tmpDir })` is called.
**Then:** Returns `{ standardsContent: string, standardsInjected: true }` where `standardsContent` is non-empty.

### T3 — Standards content before question (C7 ordering contract)

**Type:** Unit
**Given:** Valid sidecar and call parameters.
**When:** Result examined.
**Then:** Result has `standardsContent` as a separate field (not appended to question text) — the ordering contract (standards first, question second) is reflected in the return shape, not mixed into a single string.

### T4 — No HTTP/HTTPS fetch in source (C5 — local sidecar only)

**Type:** Static / source scan
**Check:** Source of `standards-injector.js` does not contain `http.get`, `https.get`, `fetch(`, `require('http')`, `require('https')`, or `require('node-fetch')`.

### T5 — Sidecar unavailable → standardsInjected: false

**Type:** Unit — AC3
**Given:** `sidecarRoot` points to a non-existent directory.
**When:** `injectStandards` is called.
**Then:** Returns `{ standardsContent: null, standardsInjected: false, note: string }` — does not throw.

### T6 — Unavailability note contains required guidance text

**Type:** Unit — AC3
**Given:** Sidecar unavailable (per T5 conditions).
**When:** Result `note` field examined.
**Then:** `note` contains "sidecar not installed" (case-insensitive) AND "skills-repo init" (case-insensitive).

### T7 — role: product-manager → only product standards injected

**Type:** Unit — AC4
**Given:** Sidecar with multiple discipline directories: `product/`, `security/`, `software-engineering/`.
**When:** `injectStandards({ role: 'product-manager', step: '...', sidecarRoot: tmpDir })` called.
**Then:** Returned `standardsContent` does not include content from `security/` or `software-engineering/` directories.

### T8 — role: risk-reviewer → only review/risk standards injected

**Type:** Unit — AC4
**Given:** Sidecar with `product/`, `quality-assurance/`, and `security/` directories.
**When:** `injectStandards({ role: 'risk-reviewer', step: '...', sidecarRoot: tmpDir })` called.
**Then:** Returned `standardsContent` does not include content from `product/` or `security-engineering/` directories that are outside the risk-reviewer scope.

### T-NFR1 — No standards content in external log calls (MC-SEC-02)

**Type:** Static / source scan
**Check:** Source does not contain `console.log(` or `console.error(` with `standardsContent`, `content`, or `standards` variable references.

### T-NFR2 — No hardcoded standards file paths (ADR-004)

**Type:** Static / source scan
**Check:** Source does not contain hardcoded paths like `standards/product/discovery-quality.md` as string literals — paths are derived from `sidecarRoot` (which comes from `context.yml`) and the role mapping.

---

## Verification script

`artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-nta-standards-inject-verification.md`

## Test file

`tests/check-p4-nta-standards-inject.js`

## Pass criteria

All 12 test assertions pass with 0 failures. TDD red baseline: all fail before `src/teams-bot/standards-injector.js` is implemented.
