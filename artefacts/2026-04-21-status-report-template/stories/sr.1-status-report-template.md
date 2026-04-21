# Story: sr.1 — Status report template extraction

**Story ID:** sr.1
**Feature:** 2026-04-21-status-report-template
**Complexity:** 1
**Scope stability:** Stable
**Human oversight:** Low

---

## User story

As a platform operator,
I want status report section headers to be defined in a template file rather than hardcoded in the script,
So that I can customise report structure without editing a governed script file.

---

## Acceptance criteria

**AC1 — Template file:** `.github/templates/status-report.md` exists and contains two clearly delimited sections: `[daily]` and `[weekly]`. Each lists the ordered section headers for that report type as a YAML-like key=value list (e.g. `section1=In-Flight Stories`).

**AC2 — Script reads template:** `generate-status-report.js` reads `.github/templates/status-report.md` at startup and parses the section headers for daily and weekly reports. If the template file does not exist, the script falls back to the existing hardcoded defaults (graceful degradation — no breaking change).

**AC3 — Report output unchanged:** When the template contains the same headers as the current hardcoded defaults, the generated report output is byte-for-byte identical to the current output. No behavioural change.

**AC4 — Tests:** `tests/check-srt1-status-report-template.js` includes governance tests: `template-file-exists`, `template-has-daily-section`, `template-has-weekly-section`, `script-reads-template`, `fallback-on-missing-template`.

**AC5 — package.json integration:** `package.json` test chain updated to include `node tests/check-srt1-status-report-template.js`.

---

## Out of scope

- Changing any section header content in the default template (must match current hardcoded values)
- Adding new report sections or report types
- Changing the report output format beyond the section headers
