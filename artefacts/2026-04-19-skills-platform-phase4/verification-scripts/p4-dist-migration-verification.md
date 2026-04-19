# Verification Script: p4-dist-migration

**Story:** Migration path for existing fork consumers
**Operator scenarios:** Run after documentation deliverable is written to confirm guide completeness.

---

## Scenario 1 — Guide exists and has required structure

**Run:** `node tests/check-p4-dist-migration.js`
**Expected:** All tests pass. Guide has pre-migration checklist, `skills_upstream` config step, `skills-repo verify` final step, Spike C reference, and confirm-and-verify sequence.

---

## Scenario 2 — Full migration walkthrough (Craig / Thomas)

**Setup:** Existing fork consumer repo (has forked SKILL.md files in source tree).
**Run:** Follow every step in `docs/migration-guide.md` from top to bottom.
**Expected:**
1. No errors during the migration steps.
2. `skills-repo verify` at the final step exits zero.
3. `find . -name "SKILL.md" -not -path "./.skills-repo/*"` returns zero results.
4. `git log` shows no commits removed or altered.

---

## Scenario 3 — Artefact history intact (AC2)

**Setup:** Consumer has artefacts under `artefacts/` predating the migration.
**Run:** After completing migration, `git log --oneline artefacts/`
**Expected:** All artefact commits present, unaltered. Migration adds no new commits to artefact history.

---

## Scenario 4 — Post-migration CI passes (AC4)

**Run:** `npm test` in the consumer repo immediately after migration.
**Expected:** All tests pass. No failures attributable to the migration.

---

## Scenario 5 — NFR: No credentials instructed

**Run:** Manually review `docs/migration-guide.md` for any step that asks the consumer to add credentials, tokens, or MS 365 tenant IDs to their repository.
**Expected:** No such step exists. Authentication, if needed, references OS credential store or environment variable, not a committed file.
