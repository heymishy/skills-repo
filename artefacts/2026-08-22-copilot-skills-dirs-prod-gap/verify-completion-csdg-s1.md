# Verify Completion: Verify and wire the correct skills directory for this repo's own production deployment (csdg-s1)

**Story:** artefacts/2026-08-22-copilot-skills-dirs-prod-gap/stories/csdg-s1-verify-and-wire-skills-dir-in-production.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | `flyctl secrets list -a skills-framework`: `COPILOT_SKILLS_DIRS` not present — real bug, not test-only |
| AC2 | ✅ | Live, authenticated (real GitHub OAuth session) requests against `https://skills-framework.fly.dev`: `POST /api/skills/benefit-metric/sessions` → `400 SKILL_NOT_FOUND`; `POST /api/skills/infra-definition/sessions` → also `400 SKILL_NOT_FOUND` (a finding beyond the story's own hypothesis — `.github/skills/` no longer exists at all) |
| AC3 | ✅ | New `AC3.1` test: root `skills/` present, no env var set → resolves from root `skills/` |
| AC4 | ✅ | New `AC4` test: `infra-definition`/`infra-plan`/`infra-review` resolve correctly alongside every other skill, no regression |
| AC5 | ✅ | New `AC5` tests: fresh consumer repo (no root `skills/`) falls back to `.github/skills/` unchanged; explicit `COPILOT_SKILLS_DIRS` override still always wins |

**New test file:** `tests/check-csdg-s1-root-skills-dir-default.js` — 4/4 passing.
**Existing test file re-run unmodified:** `tests/skill-discovery.test.js` — 18/18 still passing (zero regression).
**Sanity check against this real repo checkout** (not synthetic): 51 real skills resolve correctly with no env var set, including `benefit-metric` and `infra-definition`.

## Full suite

`NODE_ENV=test npm test`: 639 files run, 3 failed — `tests/check-bjs-s1-billing-journey-staging-safe.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-s6.1-cache-scope-session-threading.js`. Identical to the 3 pre-existing failures confirmed on `ibg-s1`/`vcb-s1`/`csgc-s1`'s branches earlier this session. **0 new failures.**

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
