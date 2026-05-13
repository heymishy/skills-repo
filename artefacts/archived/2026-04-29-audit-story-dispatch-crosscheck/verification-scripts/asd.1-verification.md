# Verification Script: asd.1 — Audit gate story dispatch cross-check

**Story reference:** `artefacts/2026-04-29-audit-story-dispatch-crosscheck/stories/asd.1-audit-story-dispatch-crosscheck.md`
**When to run:** After merge of the implementation PR. Smoke-test each scenario in order.

---

## Scenario 1 — extractStorySlug unit tests all pass

**What to check:** The automated test suite passes for this story.
**Command:**
```bash
node tests/check-asd1-story-crosscheck.js
```
**Expected:** All 9 tests PASS, exit code 0.

---

## Scenario 2 — Next real PR audit comment shows dispatch cross-check note

**What to check:** After this implementation merges, open or re-trigger any subsequent PR that has a `stories/` path in its Chain references table (any dispatched p11 story PR will do).
**Where to look:** GitHub PR → "Governed Delivery Audit Record" comment → Acceptance Criteria section → story header line.
**Expected (if dispatch record exists in pipeline-state):** Story header shows `Dispatch verified ✅ · Issue #N` with the correct issue number.

---

## Scenario 3 — PR with no story path shows no dispatch note

**What to check:** A PR whose body has no `stories/` path (e.g. a manual fix PR without a full chain references table) should not show a broken dispatch note.
**Where to look:** GitHub PR → "Governed Delivery Audit Record" comment → Acceptance Criteria section header.
**Expected:** No dispatch note line appears (silently absent). The gate does not fail.

---

## Scenario 4 — Fallback ⚠️ shows for unregistered story

**What to check:** If a PR claims a story slug that is not in pipeline-state.json for that feature, the gate should surface a warning.
**How to test:** Temporarily edit a PR body to reference a non-existent story path and re-run CI (or inspect the code path manually).
**Expected:** Audit comment shows `⚠️ p99.1 not found in pipeline-state` (or equivalent) — gate result is unaffected (still passes/fails on governance, not on this check).
