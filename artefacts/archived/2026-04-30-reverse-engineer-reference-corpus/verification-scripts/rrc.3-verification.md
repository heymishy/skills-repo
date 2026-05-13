# AC Verification Script: `/discovery` Reference Corpus Integration

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.3-discovery-integration.md`
**Technical test plan:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.3-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/discovery/SKILL.md`.
2. Optionally also open `.github/templates/discovery.md` to cross-reference the Constraints section heading.
3. No running application required — all scenarios are file review only.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1 — `/discovery` reads `discovery-seed.md` from the reference corpus

**Covers:** AC1

**Steps:**
1. Open `.github/skills/discovery/SKILL.md`.
2. Search for "discovery-seed".
3. Read the section that references it.

**Expected outcome:**
- `discovery-seed.md` is referenced in the SKILL.md.
- The instruction directs the operator to check for this file in `artefacts/[system-slug]/reference/`.
- If the file is present, the skill uses it to pre-populate the Problem framing section of the discovery.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 2 — Constraints are pre-populated into the existing Constraints section (not a new heading)

**Covers:** AC2, 3-L1

**Steps:**
1. In the discovery/SKILL.md, find the section referencing `constraint-index.md`.
2. Check whether it says to populate the existing `## Constraints` section (or equivalent).
3. Confirm that the text does NOT introduce a new section heading called "Known legacy constraints" (or anything similar that would create a separate section).

**Expected outcome:**
- The instruction references the existing Constraints section in the discovery artefact.
- The heading "Known legacy constraints" does NOT appear anywhere in the file.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 3 — Corpus check is conditional

**Covers:** AC3

**Steps:**
1. In the corpus-check instructions of discovery/SKILL.md, locate the guard condition.
2. Check for language like "if present", "if found", "when available", or "only if corpus exists".

**Expected outcome:**
The corpus check is explicitly conditional. The /discovery skill must work normally when no reference corpus has been extracted — no error, no empty section, no placeholder artefact required.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 4 — Operator can override pre-populated constraints

**Covers:** AC5

**Steps:**
1. In the corpus-check section of discovery/SKILL.md, look for an instruction about overriding.
2. Check that the operator is told they can review, edit, or override the pre-populated content.

**Expected outcome:**
The SKILL.md clearly states that pre-populated values are a starting point and the operator can confirm, edit, or override them. The discovery should not lock in the corpus content without operator review.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 5 — System-slug disambiguation is described

**Covers:** 3-L2

**Steps:**
1. Search discovery/SKILL.md for instructions about what to do when the operator has not specified a system name.
2. Check whether the skill asks the operator to clarify the system slug or name before attempting a corpus lookup.

**Expected outcome:**
The SKILL.md contains an instruction to prompt the operator for the system name/slug if it has not been provided. This prevents ambiguous corpus lookups (e.g. if there are multiple extracted corpora in the repo).

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 6 — Additions are proportionate in size

**Covers:** NFR

**Steps:**
1. In your terminal run: `wc -l .github/skills/discovery/SKILL.md`
   (Windows PowerShell: `(Get-Content .github/skills/discovery/SKILL.md).Count`)
2. Note the line count.

**Expected outcome:**
Line count ≤ 700. rrc.3 should add approximately 10–20 lines. A result significantly above the pre-implementation baseline (check git blame or prior review) warrants investigation.

**Pass / Fail:** _______  **Notes:** _______________________

---

## Summary

| Scenario | AC | Result |
|----------|----|--------|
| 1 — discovery-seed.md checked from reference corpus | AC1 | |
| 2 — Constraints in existing section, no new heading | AC2 / 3-L1 | |
| 3 — Check conditional, no error when corpus absent | AC3 | |
| 4 — Operator override instruction present | AC5 | |
| 5 — System-slug disambiguation present | 3-L2 | |
| 6 — Line count ≤ 700 | NFR | |

**Overall result:** [ ] Pass — all scenarios pass  [ ] Fail — see findings above
**Verified by:** _____________  **Date:** _____________
