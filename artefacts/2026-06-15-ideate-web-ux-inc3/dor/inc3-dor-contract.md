# DoR Contract: inc3 — Reduce clarifying question frequency

**Story:** inc3
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Contract date:** 2026-06-15
**Signed off by:** Hamish King

---

## Files permitted to change

| File | Change type |
|------|------------|
| `.github/skills/ideate/SKILL.md` | Modify — additive only; add "## Conversation cadence" instruction block before "## Step 1 — Load context" |
| `tests/check-inc3-question-cadence.js` | Create — 4 new tests |
| `package.json` | Modify — extend test chain |
| `artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc3-cadence-verification.md` | Create — human-authored after live session |

## Files NOT permitted to change

- `src/web-ui/routes/skills.js`
- `src/web-ui/views/chat-view.js`
- Any existing SKILL.md content (lens steps, assumption/condition sections)
- `tests/check-iwu*.js` or `tests/check-inc2.1*.js` — zero modifications

## Schema dependencies

None. inc3 is independent of inc4.

## Human oversight

Human review and merge required for SKILL.md. Verification session ≤7 days post-merge.
