# DoR Contract: inc2.1 — Conditions panel

**Story:** inc2.1
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Contract date:** 2026-06-15
**Signed off by:** Hamish King

---

## Files permitted to change

| File | Change type |
|------|------------|
| `src/web-ui/routes/skills.js` | Modify — add parseConditionMarker, SSE emission, session storage, marker stripping |
| `src/web-ui/views/chat-view.js` | Modify — add #condition-items section, CSS, client-side conditionItem SSE handler |
| `tests/check-inc2.1-conditions-panel.js` | Create — 11 new tests |
| `package.json` | Modify — extend test chain |

## Files NOT permitted to change

- `src/web-ui/routes/journey.js` — no changes
- `.github/skills/ideate/SKILL.md` — inc2.2 scope only
- `tests/check-iwu*.js` — regression contract; zero modifications permitted
- Any other file not listed above

## Schema dependencies

None. inc2.1 is the first story in the increment.

## Gate-confirm instruction

When this story reaches definition-of-ready, advance it via the web UI gate-confirm button in the running server (not by direct pipeline-state.json edit). This generates the CDG T3M1 trace entry.
