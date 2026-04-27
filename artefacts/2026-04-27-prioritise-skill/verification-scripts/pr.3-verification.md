# AC Verification Script: pr.3 — Multi-pass orchestration and divergence detection

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.3.md
**Script author:** Copilot
**Date:** 2026-04-27
**Review status:** Pre-code sign-off — reviewer is confirming the described behaviour is the *correct* behaviour before coding begins

---

## Purpose

1. **Pre-code sign-off** — confirm that tie-breaking and divergence behaviour is correctly defined before implementation begins.
2. **Post-merge smoke test** — run a live `/prioritise` session and check each scenario.
3. **Delivery review** — structured walkthrough for stakeholders.

---

## Setup

- Have 4–5 fictional candidate items ready.
- Run a full scoring pass with both WSJF and RICE to set up scenarios 2 and 3 (a second-pass prompt should only appear if the first pass produced a tie, or if you explicitly request a second framework pass).
- Scenarios are independent — reset between each.

---

## Scenario 1 — Tie detected: three resolution options offered

**AC covered:** AC1
**Risk:** 🟢

**Steps:**
1. Complete a WSJF scoring pass on 3–4 items and deliberately score two items identically (assign the same scores across all WSJF dimensions).
2. Observe the final ranked list.
3. Verify the skill identifies the tied items explicitly by name — e.g. "Items X and Y have identical WSJF scores."
4. Verify it offers exactly three resolution options:
   - Run a tiebreaker pass with another framework
   - Manually reorder the tied items
   - Accept this as a deliberate draw
5. Verify it does not auto-resolve the tie on your behalf.

**What broken looks like:** The skill silently places the tied items in an arbitrary order without flagging the tie, or it resolves the tie unilaterally (e.g. "I'll put X first").

**Pre-code check:** Read the tie detection section of SKILL.md. Confirm all three options are present.

---

## Scenario 2 — Divergence flagged when rank shifts two or more positions

**AC covered:** AC2
**Risk:** 🟢

**Steps:**
1. Run a WSJF pass and record the rankings (write them down).
2. Request a RICE pass on the same items.
3. Observe whether the skill compares rankings across frameworks.
4. Verify: if an item shifts 2 or more positions between WSJF rank and RICE rank, the skill flags it explicitly.
5. Verify: if an item shifts only 1 position, the skill does NOT flag it as a divergence.

**What broken looks like:** The skill flags every rank difference including single-position shifts, or it never flags any divergence even when an item moves from rank 1 to rank 4.

**Pre-code check:** Read the divergence threshold section of SKILL.md. Confirm the threshold is two or more positions and minor reorders are excluded.

---

## Scenario 3 — Divergence explanation names the specific model difference

**AC covered:** AC3
**Risk:** 🟡 (quality gap — requires domain judgment)

**Steps:**
1. Continue from scenario 2 (WSJF + RICE run, at least one divergence flagged).
2. Observe the divergence explanation the skill provides.
3. Verify the explanation references the specific reason why WSJF and RICE would rank the same item differently — it should name one of:
   - WSJF's characteristic: "WSJF prioritises job-size efficiency — smaller high-value items score higher."
   - RICE's characteristic: "RICE weights Confidence, which penalises uncertain outcomes more than WSJF does."
4. Verify the explanation is specific enough that a non-engineer could understand why the frameworks disagree.

**What broken looks like:** The explanation says only "WSJF and RICE prioritise different things" without naming what specifically differs. This scenario is a quality check — it cannot be fully automated.

**Pre-code check:** Read the divergence explanation instruction in SKILL.md. Review whether the wording would produce clear, model-specific explanations. Flag any vague language for the implementer.

---

## Scenario 4 — Three resolution options offered after divergence

**AC covered:** AC4
**Risk:** 🟢

**Steps:**
1. Continue from scenario 2/3 (divergence flagged).
2. Observe the resolution offer.
3. Verify all three options are present:
   - Accept one framework's ranking as the primary output
   - Manually reorder the divergent items
   - Run a third framework as a tiebreaker
4. Verify the skill waits for your selection — it does not proceed on your behalf.

**What broken looks like:** The skill presents fewer than three options, or it says "I recommend accepting WSJF" and proceeds without asking.

**Pre-code check:** Read the divergence resolution offer section of SKILL.md. Confirm operator choice is explicit.

---

## Scenario 5 — No second-pass prompt when one pass runs cleanly with no tie

**AC covered:** AC6
**Risk:** 🟢

**Steps:**
1. Run a single WSJF pass on 3 items where no two items have tied scores.
2. Observe the skill's output.
3. Verify the skill presents the ranked list and offers to save or proceed — it does NOT ask "Would you like to run a second framework pass?" unprompted.
4. Verify a second framework pass can still be requested manually (type "run a RICE pass" — the skill should accept this).

**What broken looks like:** After every single-pass completion, the skill prompts "Want to run another framework for comparison?" regardless of whether there's a reason to.

**Pre-code check:** Read the single-pass completion instruction in SKILL.md. Confirm no unsolicited second-pass prompt.

---

## Summary checklist

| Scenario | AC | Status |
|----------|-----|--------|
| 1 — Tie detected, three options offered | AC1 | ☐ PASS / ☐ FAIL |
| 2 — Divergence flagged at ≥2 position shift | AC2 | ☐ PASS / ☐ FAIL |
| 3 — Divergence explanation names model difference | AC3 🟡 | ☐ PASS / ☐ FAIL |
| 4 — Three resolution options after divergence | AC4 | ☐ PASS / ☐ FAIL |
| 5 — No unsolicited second-pass prompt | AC6 | ☐ PASS / ☐ FAIL |
| AC5 (divergence preserved in record) | AC5 | Checked by pr.5 verification script scenario 3 — divergence section appears in saved artefact |

All scenarios must pass before this story is considered done.
