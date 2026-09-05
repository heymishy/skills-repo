# AC Verification Script: Unify `/features/:slug`'s visual language across feature-level and per-story sections

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.1-unify-feature-page-visual-language.md
**Technical test plan:** artefacts/2026-09-05-feature-page-ux-redesign/test-plans/fpux.1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the platform (GitHub sign-in).
2. Open a feature page that has several stories grouped into phases — `2026-06-22-wuce-multi-tenancy` is a good example (20+ stories across 5 phases).
3. No special data setup needed — this is the same page you already use day to day.

**Reset between scenarios:** None needed — each scenario is a read-only visual check on the same page. Refresh the page between scenarios if you want a clean view.

---

## Scenarios

---

### Scenario 1: The whole page looks like one design, top to bottom

**Covers:** AC1

**Steps:**
1. Open the feature page for `2026-06-22-wuce-multi-tenancy`.
2. Scroll slowly from the top of the page (Benefit Metric, Decisions, Discovery, etc.) down through the phase groups (Phase 0, Phase 1, ...) at the bottom.

**Expected outcome:**
> You should not be able to point to a spot on the page and say "this is where the design changes." The cards, section titles, spacing, and borders should look the same style throughout — no plain, unstyled boxes partway down the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The page looks right in both light and dark mode

**Covers:** AC2

**Steps:**
1. On the same feature page, open Settings and switch the theme to Light. Return to the feature page.
2. Check that every phase group and story row is clearly readable — text, borders, and backgrounds all visible.
3. Switch the theme to Dark. Return to the feature page and repeat the check.

**Expected outcome:**
> In both Light and Dark mode, everything on the page is clearly visible — no invisible text, no white-on-white or black-on-black spots, no leftover light-mode colours showing through in dark mode (or vice versa).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: You can open a phase or story using only the keyboard

**Covers:** AC3

**Steps:**
1. Click once anywhere near the top of the page, then press Tab repeatedly until a phase name (e.g. "Phase 0 — Authorization Guard") is highlighted with a visible outline.
2. Press Enter.
3. Press Tab again until a story name (e.g. "p0.1") inside that phase is highlighted.
4. Press Enter (or Space).

**Expected outcome:**
> Each time you press Tab onto a phase or story name, you can clearly see which one is highlighted (a visible ring or outline around it — not just a colour change). Pressing Enter opens it, showing the artefacts inside; pressing it again closes it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Text is easy to read against its background

**Covers:** AC4

**Steps:**
1. Look closely at the phase and story names, and the artefact links inside them, in both Light and Dark mode.

**Expected outcome:**
> Every piece of text is comfortably readable against its background — no grey-on-grey or low-contrast text anywhere in the phase/story sections.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The "Delete this feature" button still works exactly as before

**Covers:** AC5 (regression guard)

**Steps:**
1. Open a feature page that shows a "Delete this feature" button (one you don't mind test-deleting, or cancel before confirming).
2. Click "Delete this feature".
3. When the confirmation popup appears, click Cancel.

**Expected outcome:**
> A confirmation popup appears asking you to confirm the deletion, exactly as it did before this change. Clicking Cancel leaves the feature untouched — nothing is deleted, and no error appears.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — One design, top to bottom | | |
| Scenario 2 — Light/dark mode readability | | |
| Scenario 3 — Keyboard access | | |
| Scenario 4 — Text contrast | | |
| Edge case — Delete button unchanged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
