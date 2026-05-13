# Verification Script: p4-nta-standards-inject

**Story:** p4-nta-standards-inject — Standards injection for non-technical roles
**Test file:** `tests/check-p4-nta-standards-inject.js`

## Pre-conditions

- Node.js ≥ 18 available
- `src/teams-bot/standards-injector.js` implemented
- Run from repository root

## Commands

```bash
node tests/check-p4-nta-standards-inject.js
```

## Expected output

```
[p4-nta-standards-inject] T1 — module exists and exports injectStandards
  ✓ T1a: src/teams-bot/standards-injector.js exists
  ✓ T1b: module loads without error
  ✓ T1c: exports injectStandards as function

[p4-nta-standards-inject] T2 — sidecar present → standardsContent + standardsInjected: true
  ✓ T2a: standardsContent is non-empty string
  ✓ T2b: standardsInjected is true

[p4-nta-standards-inject] T3 — standards before question (C7 ordering)
  ✓ T3: standardsContent is separate field (ordering contract met)

[p4-nta-standards-inject] T4 — no HTTP/HTTPS fetch in source (C5)
  ✓ T4a: no require('http')
  ✓ T4b: no require('https')
  ✓ T4c: no fetch( in source

[p4-nta-standards-inject] T5 — sidecar unavailable → standardsInjected: false
  ✓ T5a: standardsContent is null
  ✓ T5b: standardsInjected is false

[p4-nta-standards-inject] T6 — unavailability note contains guidance
  ✓ T6a: note contains "sidecar not installed"
  ✓ T6b: note contains "skills-repo init"

[p4-nta-standards-inject] T7 — product-manager role → product standards only
  ✓ T7: no security/engineering content for product-manager

[p4-nta-standards-inject] T8 — risk-reviewer role → review standards only
  ✓ T8: no product/engineering content for risk-reviewer

[p4-nta-standards-inject] T-NFR1 — no standards content in log calls (MC-SEC-02)
  ✓ T-NFR1: no console.log with standardsContent

[p4-nta-standards-inject] T-NFR2 — no hardcoded standards paths (ADR-004)
  ✓ T-NFR2: no hardcoded standards file paths

[p4-nta-standards-inject] Results: N passed, 0 failed
```

## AC coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3 |
| AC2 | T4 (no HTTP fetch) |
| AC3 | T5, T6 (graceful fallback) |
| AC4 | T7, T8 (role scoping) |
| NFR | T-NFR1, T-NFR2 |
