# DoD: inc2.2 — SKILL.md condition marker instruction

**Story:** inc2.2
**Feature:** 2026-06-15-ideate-web-ux-inc2
**DoD date:** 2026-06-15
**Signed off by:** Hamish King

---

## Acceptance criteria status

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `CONDITION-JSON` instruction section present in SKILL.md | DONE |
| AC2 | All four fields (`id`, `text`, `type`, `source`) documented | DONE |
| AC3 | All three type values (`constraint`, `dependency`, `outcome`) named with definitions | DONE |
| AC4 | Concrete `---CONDITION-JSON---` example present | DONE |
| AC5 | "When to emit" guidance present (distinguishes conditions from assumptions) | DONE |
| AC6 | Human-in-the-loop verification: ≥4-turn live session confirms markers are emitted | DONE |

## Test results

- `check-inc2.2-condition-marker-instruction.js`: **11 passed, 0 failed**
- AC6 verification artefact: `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md`

## Files changed

| File | Change |
|------|--------|
| `.github/skills/ideate/SKILL.md` | "Condition markers (inc2.1)" section added after ASSUMPTION-JSON section (additive only) |
| `tests/check-inc2.2-condition-marker-instruction.js` | New — 11 assertions covering AC1–AC5 |
| `package.json` | Test chain extended |

## Commit

`0f36923` — `feat(inc2.2): SKILL.md condition marker instruction + automated tests`

## Verification

Live session conducted 2026-06-15 by Hamish King. 10+ turns in /ideate on 2x2 workshop grid topic. Two condition cards emitted (`transcript-timestamp-correlation` — constraint, `markdown-outer-loop-structure` — outcome). Conditions panel populated correctly. See verification artefact for full details.

## Concurrent fix

Marker text appearing in chat stream (cosmetic bug) was identified during verification and fixed in the same session: `handlePostTurnStreamHtml` now strips both `---ASSUMPTION-JSON---` and `---CONDITION-JSON---` patterns from `chunk` display events before emitting to the client.
