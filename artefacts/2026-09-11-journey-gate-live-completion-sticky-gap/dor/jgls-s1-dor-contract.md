# Contract Proposal — The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion

**Story:** `artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/stories/jgls-s1-fix-live-completion-gate-not-sticky.md`
**Date:** 2026-09-11

---

**What will be built:**
In `src/web-ui/routes/skills.js`, `showCommitLink()`'s `wrap.style.cssText` assignment (~line 3845, currently `"padding:10px 12px 2px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"`) will have `position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500` appended — the identical positioning properties already present on `journeyPanel`'s `.sw-journey-gate` div (~line 4593), applied via `wnl-s2`.

**What will NOT be built:**
No refactor unifying the two gate-rendering code paths (`journeyPanel` and `showCommitLink()`) into one shared function. No change to either function's trigger conditions, content, or non-positioning styling.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test extracts `showCommitLink`'s embedded script source from a rendered chat page, asserts `wrap.style.cssText` contains the sticky properties | Unit |
| AC2 | Same extraction, asserts existing layout properties (`padding`, `display`, `align-items`, `gap`, `flex-wrap`) unchanged | Unit |
| AC3 | Unit test reads `skills.js` source directly, compares the positioning substring between both style strings | Unit |

**Assumptions:**
- `journeyPanel`'s own sticky properties (`wnl-s2`, already merged) are correct and unchanged by this story — reused as the source of truth to copy from, not re-derived.
- No other code path renders this same "Continue to next stage" control (confirmed by reading `skills.js` — only these two occurrences of `sw-journey-gate`-equivalent markup exist, plus the `definition-of-ready`-specific "View journey complete" link at line 4573, which is a different action entirely and out of scope per the story).

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (one line changed, ~line 3845), `tests/` (one new unit test file).
Services: None.
APIs: None.
