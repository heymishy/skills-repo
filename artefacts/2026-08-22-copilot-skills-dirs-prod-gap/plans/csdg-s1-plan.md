# Implementation Plan: Verify and wire the correct skills directory for this repo's own production deployment (csdg-s1)

**Story:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
**Test plan:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/test-plans/csdg-s1-test-plan.md
**DoR:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/dor/csdg-s1-dor.md

---

## Task 1: Live production investigation (AC1, AC2)

- `flyctl secrets list -a skills-framework` — confirmed `COPILOT_SKILLS_DIRS` not set.
- Signed in to `https://skills-framework.fly.dev` via existing GitHub OAuth session (operator-authorized).
- `POST /api/skills/benefit-metric/sessions` and `POST /api/skills/infra-definition/sessions` both confirmed live `400 SKILL_NOT_FOUND`.
- Found `.github/skills/` no longer exists at all (superseded by `pisd-s1`) — simplifies AC3's fix, removes AC4's original tradeoff concern.

**Status:** done (not code — recorded in test plan)

---

## Task 2: Default-resolution fix (AC3, AC4, AC5)

**Files:** `src/adapters/skill-discovery.js`

- `listAvailableSkills`: when `COPILOT_SKILLS_DIRS` is unset, prefer root `skills/` if it exists, else fall back to `.github/skills/`.
- New test file `tests/check-csdg-s1-root-skills-dir-default.js` covering AC3/AC4/AC5.
- Existing `tests/skill-discovery.test.js` (18 tests) re-run unmodified — 18/18 still pass.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
