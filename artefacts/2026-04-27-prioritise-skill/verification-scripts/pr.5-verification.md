# AC Verification Script: pr.5 — Output format, rationale enforcement, extension point, and artefact save

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
**Script author:** Copilot
**Date:** 2026-04-27
**Review status:** Pre-code sign-off — reviewer is confirming the described behaviour is the *correct* behaviour before coding begins

---

## Purpose

1. **Pre-code sign-off** — confirm that output format, save behaviour, and extension point are correctly defined before implementation.
2. **Post-merge smoke test** — complete a full `/prioritise` session end-to-end and verify the saved artefact.
3. **Delivery review** — structured walkthrough for stakeholders, ideally reviewing an actual saved artefact.

---

## Setup

- Requires a complete scoring session (WSJF or RICE) with at least 3 items.
- For scenario 3 (divergence section), you need a multi-framework session (WSJF + RICE).
- For scenario 4 (rationale warning), deliberately skip rationale for one item.
- The saved artefact will be written to disk — confirm the path before saving.
- Reset between each scenario.

---

## Scenario 1 — Output includes all required sections

**AC covered:** AC1
**Risk:** 🟢

**Steps:**
1. Complete a full WSJF scoring pass on 3–4 items with rationale provided for each.
2. Request the output artefact.
3. Review the output.
4. Verify it contains:
   - A rankings section listing items in descending score order
   - Scores for each item
   - Rationale for each item
   - Session metadata — at minimum: date and framework used
5. Verify each section is clearly headed.

**What broken looks like:** The output is a plain ranked list with no scores, no rationale, and no session metadata.

**Pre-code check:** Read the output format section of SKILL.md. Confirm all four required elements are present.

---

## Scenario 2 — Missing rationale triggers warning with fill offer

**AC covered:** AC2
**Risk:** 🟢

**Steps:**
1. Complete a scoring pass, but skip the rationale question for one item (respond "skip" or provide no rationale text).
2. Request the output artefact.
3. Verify the output highlights the item with missing rationale — it should show "[rationale not provided]" or equivalent warning text.
4. Verify the skill offers to let you fill in the rationale before saving — e.g. "Item X is missing a rationale — would you like to add one before we save?"
5. Say "no" — verify the skill proceeds to save with the placeholder intact.

**What broken looks like:** The output silently omits rationale for the item without any warning, or the skill blocks the save until rationale is provided.

**Pre-code check:** Read the missing-rationale handling section of SKILL.md. Confirm warning and offer-to-fill instructions.

---

## Scenario 3 — Divergence section present in multi-framework output

**AC covered:** AC3
**Risk:** 🟢

**Steps:**
1. Run both WSJF and RICE passes on the same 3–4 items.
2. Request the output artefact.
3. Verify the output contains a divergence section — a section specifically addressing items where WSJF and RICE rankings disagreed.
4. Verify the divergence section names the specific items that diverged and explains why.
5. Run a single-framework session (WSJF only). Request the output artefact. Verify the divergence section is absent.

**What broken looks like:** The divergence section appears even in single-framework output, or it is absent even when two frameworks were run with divergent results.

**Pre-code check:** Read the multi-framework output section of SKILL.md. Confirm divergence section is conditioned on multi-framework pass.

---

## Scenario 4 — Default save path suggested, operator confirmation required

**AC covered:** AC4
**Risk:** 🟢

**Steps:**
1. Complete a scoring session.
2. Request to save the artefact.
3. Verify the skill suggests a default path beginning with `artefacts/prioritise-` followed by a date and topic slug.
4. Verify the skill asks "Shall I save here, or would you like to change the path?" — it does NOT write the file before confirming.
5. Respond with an alternative path. Verify the skill accepts it.
6. Respond with "yes" to the suggested path. Verify the file is written.

**What broken looks like:** The skill writes the artefact file immediately when "save" is first mentioned, without suggesting a path and awaiting confirmation.

**Pre-code check:** Read the save behaviour section of SKILL.md. Confirm default path pattern and confirm-before-write instruction.

---

## Scenario 5 — Clean exit after save

**AC covered:** AC5
**Risk:** 🟢

**Steps:**
1. Complete a scoring session and save the artefact (confirm with "yes").
2. Observe the skill's next message.
3. Verify the skill ends the session cleanly — e.g. "Artefact saved to [path]. Session complete."
4. Verify the skill does NOT prompt for further actions — it should not ask "Would you like to score more items?" or "Start another session?"

**What broken looks like:** After saving, the skill continues prompting for additional scoring actions, or offers to "run another pass" unprompted.

**Pre-code check:** Read the clean-exit section of SKILL.md. Confirm the session terminates after save confirmation.

---

## Scenario 6 — Framework abbreviations expanded on first use in artefact

**AC covered:** AC7
**Risk:** 🟢

**Steps:**
1. Complete a WSJF scoring session and save the artefact.
2. Open the saved artefact.
3. Verify:
   - "WSJF" is expanded on first use — e.g. "Weighted Shortest Job First (WSJF)"
   - "RICE" is expanded on first use — e.g. "Reach, Impact, Confidence, Effort (RICE)"
   - "MoSCoW" is expanded on first use if it appears
4. Verify that after the first expansion, the abbreviation alone is acceptable in subsequent references.

**What broken looks like:** The artefact uses "WSJF" throughout without ever expanding it, leaving a non-engineer reader unable to understand the acronym.

**Pre-code check:** Read the abbreviation expansion section of SKILL.md. Confirm all three framework abbreviations are required to be expanded on first use.

---

## Scenario 7 — Extension point section present and actionable

**AC covered:** AC8
**Risk:** 🟢 (quality check for clarity of guidance)

**Steps:**
1. Open the completed SKILL.md at `.github/skills/prioritise/SKILL.md`.
2. Find the extension point section.
3. Verify the section exists with a clear heading.
4. Verify the section describes at least one concrete step for adding a new scoring framework in a future version — e.g. "To add a new framework: (1) add a new section following the WSJF section template, (2) add it to the framework selection prompt, (3) add a new entry to `CONTRACTS[]` in `check-skill-contracts.js`."
5. Assess: would a new engineer be able to follow this guidance without needing to read additional files? If yes → PASS.

**What broken looks like:** The extension point section says only "Future frameworks can be added" with no actionable guidance.

**Pre-code check:** Read the extension point section of SKILL.md. Flag any guidance that is too vague to act on.

---

## Scenario 8 — Contract check passes with `prioritise` entry

**AC covered:** AC6
**Risk:** 🟢

**Steps:**
1. Ensure the implementation is complete (SKILL.md written, `prioritise` entry added to `CONTRACTS[]` in `.github/scripts/check-skill-contracts.js`).
2. Run in terminal:
   ```
   node .github/scripts/check-skill-contracts.js
   ```
3. Verify exit code 0.
4. Verify the output includes a passing entry for `prioritise`.

**What broken looks like:** Exit code non-zero, or `prioritise` is not in the output.

**Pre-code check:** Confirm `check-skill-contracts.js` has a `prioritise` entry in its `CONTRACTS[]` array before marking this scenario ready.

---

## Summary checklist

| Scenario | AC | Status |
|----------|-----|--------|
| 1 — Output includes rankings, scores, rationale, metadata | AC1 | ☐ PASS / ☐ FAIL |
| 2 — Missing rationale triggers warning + fill offer | AC2 | ☐ PASS / ☐ FAIL |
| 3 — Divergence section present in multi-framework, absent in single | AC3 | ☐ PASS / ☐ FAIL |
| 4 — Default save path suggested, confirmation required | AC4 | ☐ PASS / ☐ FAIL |
| 5 — Clean exit after save | AC5 | ☐ PASS / ☐ FAIL |
| 6 — Abbreviations expanded on first use | AC7 | ☐ PASS / ☐ FAIL |
| 7 — Extension point section present and actionable | AC8 | ☐ PASS / ☐ FAIL |
| 8 — Contract check passes (`node .github/scripts/check-skill-contracts.js`) | AC6 | ☐ PASS / ☐ FAIL |

All scenarios must pass before this story is considered done.
