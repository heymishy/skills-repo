# Implementation Plan: wuce.20 — Feature artefact index HTML view

**Date:** 2026-05-04
**Branch:** feature/wuce.20-artefact-index-html-view
**Test file:** tests/check-wuce20-artefact-index-html.js
**Total tests:** 17

---

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/utils/artefact-labels.js` | CREATE | getLabel(type) with static mapping |
| `src/web-ui/routes/features.js` | EXTEND | Content-type negotiation in handleGetFeatureArtefacts(); add setListArtefacts setter; fix auth redirect; add route field to audit log |
| `tests/check-wuce20-artefact-index-html.js` | CREATE | 17 tests |
| `package.json` | EXTEND | Append `&& node tests/check-wuce20-artefact-index-html.js` |

---

## Task 1 — Create artefact-labels.js (RED → GREEN for T15, T16)

**File:** `src/web-ui/utils/artefact-labels.js`

```js
'use strict';

const TYPE_LABELS = {
  'dor':            'Ready Check',
  'benefit-metric': 'Benefit Metric',
  'test-plan':      'Test Plan',
  'discovery':      'Discovery'
};

function getLabel(type) {
  return TYPE_LABELS[type] || type || 'Artefact';
}

module.exports = { getLabel };
```

---

## Task 2 — Extend features.js (RED → GREEN for T1–T14, T17)

Changes to `handleGetFeatureArtefacts()`:

1. Add `setListArtefacts(fn)` setter at module level
2. Change unauthenticated response to 302 → /auth/github (AC6 / T12)
3. Add `route: '/features/:slug'` to audit log (T17)
4. Add content-type negotiation:
   - Accept includes 'text/html' → renderShell wrapping artefact list HTML
   - Otherwise → JSON unchanged

HTML rendering logic:
- Call getLabel(artefact.type) for plain-language labels
- Use escHtml() from html-shell.js on all values
- Call renderArtefactItem() for each li, then insert date
- Zero artefacts → empty-state message, no <ul>

---

## Task 3 — Create test file (T1–T17)

17 tests covering all ACs. Uses inline mock via setListArtefacts setter.

---

## Task 4 — Extend package.json test chain

Append: `&& node tests/check-wuce20-artefact-index-html.js`
