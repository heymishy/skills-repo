# NFR Profile: ideate-web-ux-inc3

**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## Performance

- inc3: no performance impact (SKILL.md text change only)
- inc4: `canvasBlock` SSE events must be parsed and rendered within ≤200ms of receipt (client-side); no new network round-trips

## Security

- inc3: no attack surface change
- inc4: `canvasBlock` JSON content must be HTML-escaped before DOM insertion (OWASP A03 — same standard as assumption cards and condition items)
- inc4: `---CANVAS-JSON---` marker extraction uses same buffer pattern as assumption/condition markers — no eval, no innerHTML with unescaped model content

## Accessibility

- inc4: canvas blocks must be keyboard-navigable; block type conveyed by text label not colour only (WCAG SC 1.4.1, SC 2.1.1); canvas panel must have `role="region"` and `aria-label`

## Governed files

- inc3: `.github/skills/ideate/SKILL.md` — governed file, requires human review and merge

## Design gate (inc4)

- inc4 is blocked on a `/frontend-design` artefact before definition-of-ready. Canvas layout, block types, and spatial interaction must be designed before implementation is scoped.

## Regression

- All existing iwu tests (62 assertions across iwu1–iwu6) must pass unmodified
- inc2.1 test suite (30 assertions) must pass unmodified
