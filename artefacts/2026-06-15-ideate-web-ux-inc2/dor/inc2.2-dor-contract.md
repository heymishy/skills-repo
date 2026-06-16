# DoR Contract: inc2.2 — SKILL.md condition marker instruction

**Story:** inc2.2
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Contract date:** 2026-06-15
**Signed off by:** Hamish King

---

## Files permitted to change

| File | Change type |
|------|------------|
| `.github/skills/ideate/SKILL.md` | Modify — additive only; add condition marker instruction section after existing ASSUMPTION-JSON section |
| `tests/check-inc2.2-condition-marker-instruction.js` | Create — 5 new tests |
| `package.json` | Modify — extend test chain |
| `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md` | Create — human-authored after live session |

## Files NOT permitted to change

- `src/web-ui/routes/skills.js` — inc2.1 scope only
- `src/web-ui/views/chat-view.js` — inc2.1 scope only
- `tests/check-iwu*.js` — zero modifications permitted
- Any existing SKILL.md content

## Schema dependencies

`inc2.1` — conditions panel must be delivered and merged before inc2.2 is verified (the conditions panel must exist for the live verification session to confirm emission).

## Human oversight

This story requires human review and merge of the SKILL.md PR. Coding agent prepares the change; platform maintainer (Hamish King) reviews and merges.
