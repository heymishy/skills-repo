# Discovery: Status Report Template Extraction

**Feature slug:** 2026-04-21-status-report-template
**Discovery date:** 2026-04-21
**Status:** Approved — proceeding to short-track

---

## Problem

`scripts/generate-status-report.js` hardcodes section headers for both daily and weekly reports (e.g. "In-Flight Stories", "Pipeline Funnel"). Operators who want to customise report section names must edit the script directly, which is a governed file. Externalising headers into a template file (`.github/templates/status-report.md`) makes customisation safe without touching script logic.

## MVP scope

- Create `.github/templates/status-report.md` with clearly delimited section header definitions
- Refactor `generate-status-report.js` to read section headers from the template at startup
- Behavioural output of the reports is unchanged — only the header text becomes configurable

## Short-track rationale

Infrastructure quality improvement. No new user-facing capability. No schema changes. Short-track appropriate.
