# Definition of Ready Checklist

## Definition of Ready: Create the target directory before writing strategy-metrics and file-backed ideas data

**Story reference:** artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md
**Test plan reference:** artefacts/2026-10-06-write-site-workspace-dir-audit/test-plans/wswda-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator completing a real /ideate or /discovery session, or using the file-backed ideas fallback" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table; AC2 covered via documented, logged RISK-ACCEPT (shared helper + call-site assertion) |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal benefit-metric moved (reliability fix); linkage stated directly in the story, matching `dswf-s1`'s own precedent for non-metric-moving short-track fixes |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review ran — short-track. Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | AC2's partial-coverage gap is explicitly documented and mitigated, not silently uncovered |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with confirmed root cause, real line numbers, 3 real precedent call sites; no review ran (short-track) so no Category E findings to check |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Pure Node module fix |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact — short-track. This story is itself the named follow-up from `dswf-s1`'s own DoD Observations, which the operator already explicitly asked to pick up ("Yes please", 2026-10-06). Logged in `decisions.md`. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter — `writeFileEnsuringDir` is a plain utility function, not an injectable adapter (no environment-dependent implementation swap) |
| H-INF / H-MIG / H-DESIGN | Infra/migration/design-token gates | ✅ N/A | None of these tracks apply |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption, matching `dswf-s1`'s own established precedent.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | AC2's gap is explained/mitigated, not "UNCERTAIN" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

- **Stack constraints:** No new npm dependency — `fs`/`path` are Node built-ins.
- No other section applies — internal module fix, no route/view/session change.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Create the target directory before writing strategy-metrics and file-backed ideas data
  — artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md
Test plan: artefacts/2026-10-06-write-site-workspace-dir-audit/test-plans/wswda-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies
- New file: src/web-ui/utils/fs-safe-write.js, exporting writeFileEnsuringDir(filePath, content, encoding)
- Route strategy-metrics.js's two writeFileSync calls (lines ~36, ~99) and
  features.js's _writeIdeasFile through this helper
- Do NOT touch the 3 existing precedent call sites (server.js, reference-validator.js,
  dismissed-signals-store.js) — already correct, out of scope
- Do NOT modify the Dockerfile
- Add new tests to a new tests/check-wswda-s1-mkdir-before-write.js file for the
  shared helper + call-site assertion; extend tests/check-sdg6-metrics-recording.js
  for the recordMetrics-direct test
- Open a draft PR when tests pass — do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
