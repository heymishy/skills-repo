## Review: spft-s1 — Fix the Settings page's Profile tab so it actually renders instead of showing blank

**Story:** artefacts/2026-08-09-settings-profile-tab-fix/stories/spft-s1-settings-profile-tab-fix.md
**Reviewer:** Claude (agent), operator-directed — found via live browser exploration of the operator's real staging environment
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a directly observed, reproducible live symptom (default tab renders blank, confirmed via console/network inspection showing no JS errors and no failed fetch — a pure structural CSS bug) and names the exact root cause with line-level precision: a double-wrapped div where only the outer wrapper's id gets `--active` on load, and the tab-switching script's re-add-by-id logic can never reach the outer wrapper afterward either.

### Category B: Scope discipline

PASS. Out of scope explicitly excludes touching the three already-working tabs and `renderProfileTab`'s own content — the fix is confined to the wrapping structure in `renderSettingsPage`. The separate "No product" link bug is correctly excluded as its own story rather than bundled in.

### Category C: AC quality

PASS. 4 ACs, each Given/When/Then, each independently testable via direct HTML string inspection (no live-browser dependency needed, unlike `sdrg-s1`'s AC4/AC5 which needed the same lower-fidelity substitute). AC2 is a good regression-shape AC — it directly targets the "clicking away and back still doesn't fix it" symptom, not just the initial-load symptom. AC4 is an explicit non-admin regression guard, appropriate given the tab bar's admin-gated tabs.

### Category D: Completeness

PASS. NFRs correctly scoped down (accessibility non-regression, negligible performance) — appropriately light for a markup-structure fix with no new capability. Complexity rated 1, correctly — this is as close to mechanical as a real bug fix gets, given the root cause and correct target shape are both already fully known.

### Category E: Architecture compliance

PASS. No new pattern introduced — the fix explicitly converges Profile's markup shape onto the same single-div-per-tab convention every other tab already uses, rather than inventing a new wrapping mechanism. This is the correct fix shape: match the working precedent exactly, don't add a new abstraction to solve a structural duplication bug.

---

### Verdict

**PASS — 0 HIGH findings.** Minimal, well-understood short-track fix. Complexity 1 is justified — the story doesn't overstate the risk of a markup-shape correction with a clear, already-proven-correct target pattern sitting right next to the bug. Cleared to proceed to `/test-plan`.
