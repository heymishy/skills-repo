# Definition of Done: cdg.6 — `skills advance` epic-nested lookup, dot-notation field writes, integer coercion, and harness wiring rule

**PR:** https://github.com/heymishy/skills-repo/pull/358 | **Merged:** 2026-05-24
**Story:** cdg.6
**Feature artefact:** artefacts/2026-05-19-cli-deterministic-governance/
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Step 1 — PR and story confirmation

| Item | Status | Detail |
|------|--------|--------|
| PR merged | ✅ | PR #358 merged to master at c3a3902 |
| Story artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.6.md |
| DoR artefact exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.6-dor.md |
| Test plan exists | ✅ | artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.6-test-plan.md |

---

## Step 2 — AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Epic-nested story found and updated in place | ✅ | T1 (check-cdg6-advance-enhancements.js): `skills advance` updates cdg-epic-nested story in `epics[0].stories[0]`; exit 0; no phantom entry in `feature.stories[]` | Automated test — 34/34 pass | None |
| AC2 — Flat story lookup unchanged | ✅ | T3: flat story in `feature.stories[]` updated correctly; exit 0 | Automated test | None |
| AC3 — Story not found creates flat entry | ✅ | T4: missing story creates entry in `feature.stories[]`; exit 0 | Automated test | None |
| AC4 — Dot-notation single-level field write | ✅ | T5–T7: `parent.child=value` sets `story[parent][child]`; existing siblings preserved; exit 0 | Automated test | None |
| AC5 — Integer coercion | ✅ | T8–T9: `passing=34` writes `34` (number, not string) to JSON | Automated test | None |
| AC6 — Prototype pollution guard | ✅ | T10–T11: `__proto__=x`, `a.__proto__=x` → exit 8, stderr message, file unchanged | Automated test | None |
| AC7 — copilot-instructions.md harness wiring rule | ✅ | T12 (governance chain): `.github/copilot-instructions.md` contains `skills advance` rule in Coding Standards section; T13: manual verification of rule text | Automated test (T12) + operator verification | None |

**ACs satisfied: 7/7**

---

## Step 3 — Test suite verification

| Suite | Tests | Result |
|-------|-------|--------|
| check-cdg6-advance-enhancements.js | 34 | ✅ All pass |
| Full npm test (master, post-merge) | All suites | ✅ Exit 0 |

Test evidence: `34 passed, 0 failed` from `node tests/check-cdg6-advance-enhancements.js` run on branch `feature/cdg.6` at commit `16a137f` immediately before PR merge. Full `npm test` exit 0 on master at `c3a3902`.

---

## Step 4 — Scope compliance

All changes are within scope per the DoR contract:
- ✅ `src/enforcement/cli-advance.js` — modified (epic-nested lookup, dot-notation, coercion, guard)
- ✅ `tests/check-cdg6-advance-enhancements.js` — created (34 assertions, T1–T13)
- ✅ `.github/copilot-instructions.md` — modified (harness wiring rule added to Coding Standards)
- ✅ `package.json` — modified (test chain extended)
- ✅ `CHANGELOG.md` — modified (cdg.6 entry under ### Added)

Out-of-scope files not touched: `bin/skills`, `src/enforcement/cli-validate.js`, schema files, any artefact under `artefacts/`.

---

## Step 5 — Metric signal

**cdg feature metric:** `skills advance` harness rule now governs all agent post-merge pipeline-state writes. Self-validation: the post-merge update for cdg.6 (`prStatus=merged stage=definition-of-done`) was performed using `node bin/skills advance 2026-05-19-cli-deterministic-governance cdg.6 ...` — the first field update to exercise the epic-nested lookup path in production. Exit 0, correct output.

---

## Step 6 — Open items

None. All ACs satisfied. No deferred items. No HIGH review findings. Pipeline-state updated to `stage=definition-of-done`, `prStatus=merged`.
