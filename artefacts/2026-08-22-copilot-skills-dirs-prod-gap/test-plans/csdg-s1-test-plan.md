# Test Plan: Verify and wire the correct skills directory for this repo's own production deployment (csdg-s1)

**Story:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md
**Track:** Short-track

---

## Investigation results (AC1, AC2) — performed live, not automated

**AC1:** `flyctl secrets list -a skills-framework` confirmed `COPILOT_SKILLS_DIRS` is NOT set in production. Real bug, not a test-only gap.

**AC2:** Reproduced live against `https://skills-framework.fly.dev`, authenticated via the operator's real GitHub session (signed in through `/auth/github`, no credentials typed — existing GitHub session cookie carried the OAuth flow through automatically):
- `POST /api/skills/benefit-metric/sessions` → `400 {"error":"SKILL_NOT_FOUND"}`
- `POST /api/skills/infra-definition/sessions` → also `400 {"error":"SKILL_NOT_FOUND"}` — a finding the story itself did not anticipate: `.github/skills/` no longer exists in this repo at all (`pisd-s1`, PR #753, 2026-08-22, consolidated every skill including `infra-definition`/`infra-plan`/`infra-review` into root `skills/`), so the story's original "must not regress `.github/skills/`'s distinct purpose" tradeoff (AC4) no longer applies — there is nothing left at `.github/skills/` to protect.

## Test Cases (AC3, AC4, AC5)

| Test | AC | Type | Description |
|------|----|------|-------------|
| AC3.1 | AC3 | Unit | Root `skills/` present, no `COPILOT_SKILLS_DIRS` set → resolves from root `skills/`, not `.github/skills/` |
| AC4 | AC4 | Unit | `infra-definition`/`infra-plan`/`infra-review` (now real entries under root `skills/`) resolve correctly alongside every other skill — no regression |
| AC5 (no root skills/) | AC5 | Unit | Fresh consumer repo (no root `skills/`, only `.github/skills/`) → falls back to `.github/skills/` exactly as before — the documented bootstrap contract is unchanged |
| AC5 (explicit override) | AC5 | Unit | An explicit `COPILOT_SKILLS_DIRS` override still always wins, even when root `skills/` exists |
| Sanity | — | Integration | Run against this actual repo checkout (not a synthetic temp dir) with no env var set — confirms 51 real skills resolve, including `benefit-metric` and `infra-definition` |

## Fix approach chosen (per story's own "implementer decides" wording)

A code-level default-resolution change in `src/adapters/skill-discovery.js`'s `listAvailableSkills`, not a `COPILOT_SKILLS_DIRS` Fly secret. Rationale: (1) more robust — self-documenting in code rather than a hidden operational secret that could be lost/unset again; (2) avoids an agent making a live production infrastructure change (`flyctl secrets set`) without a human directly reviewing it; (3) `.github/skills/` no longer existing at all removes any regression risk the original tradeoff worried about.

## Out of Scope (per story)

- `handlePostSkillSessionHtml` (form-urlencoded/browser-UI path) — unaffected, not touched.
- Any change to root `skills/`'s own contents.
- Broader audit of every other `listAvailableSkills`/`COPILOT_SKILLS_DIRS` reference beyond this one function's resolution logic.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
