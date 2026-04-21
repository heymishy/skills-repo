# DoR: sr.1 — Status report template extraction

**Story:** sr.1
**Feature:** 2026-04-21-status-report-template
**DoR status:** Signed off
**Review findings:** 0 HIGH, 0 MEDIUM
**Oversight level:** Low

---

## Hard block checklist (15/15 PASS)

- [x] H1–H15 — All standard hard blocks pass. Short-track story, additive only, no external deps, no schema changes, graceful fallback on missing template file, tests written (failing) before implementation.

---

## Coding Agent Instructions

You are implementing **sr.1: Status report template extraction**.

**What to build:**

1. `.github/templates/status-report.md` — template file with `[daily]` and `[weekly]` sections listing section headers as `sectionN=Header Text` lines.

2. Refactor `scripts/generate-status-report.js` — add `loadReportTemplate(rootDir)` function that reads and parses the template. `generateDailyReport` and `generateWeeklyReport` use parsed headers if available, fall back to hardcoded defaults if template is missing.

3. `tests/check-srt1-status-report-template.js` — governance tests (5 tests).

4. Update `package.json` — append `&& node tests/check-srt1-status-report-template.js`.

**Definition of Done:** `npm test` passes. Daily and weekly report output with default template is identical to pre-refactor output.
