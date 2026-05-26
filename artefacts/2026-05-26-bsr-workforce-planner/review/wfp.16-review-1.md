# Review: wfp.16 — Natural-language workforce query via GPT-4o
**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot / Hamish King
**Story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.16.md

---

## FINDINGS

**1-M1 (MEDIUM) — Epic forward-link gap** *(shared with wfp.12–wfp.16)*
`wfp-planning-dashboard.md` does not list wfp.16. See wfp.12 1-M1.

**1-M2 (MEDIUM) — AC5: production wiring verification has no named mechanism**
AC5 states "a smoke test confirms the adapters are non-stub after server initialisation." The module's adapter variables (`_workforceQueryExecutor`, `_workforceQueryExecutorStream`) are private by default. Without a named verification mechanism — either an exported `__getAdapters()` introspection function (test-only, guarded by `NODE_ENV === 'test'`) or a subprocess server start — the test author has no way to implement this AC. This is a test-plan blocker.
_Recommended action:_ Specify the mechanism. Recommended: export `__getAdapters()` from the route handler module, guarded by `if (process.env.NODE_ENV === 'test') module.exports.__getAdapters = () => ({ executor: _workforceQueryExecutor, streamExecutor: _workforceQueryExecutorStream })`. Alternatively, document this as a RISK-ACCEPT at DoR and verify only via integration smoke test.

**1-M3 (MEDIUM) — AC7: `allocation-input.json` fallback behaviour not specified**
AC7 (Tier 2) includes `workforce/allocation-input.json` alongside `initiative-map.json` when keywords suggest proposed-allocation queries. No Phase 1 or Phase 2 story produces this file — it will not exist at runtime for Phase 2. The story does not specify fallback behaviour for an absent `allocation-input.json`, creating a `fs.readFileSync` crash risk or silent context omission.
_Recommended action:_ Either (a) remove `workforce/allocation-input.json` from AC7 and add it to Out of Scope as a Phase 3 candidate, or (b) add to AC7: "If `workforce/allocation-input.json` does not exist, it is silently omitted from the Tier 2 context with no error (same fallback pattern as absent `initiative-map.json` in AC7)."

**1-L1 (LOW) — AC2 request body shape missing `includeTier2` field**
AC2 documents the request body as `{ "message": "...", "history": [...], "includeFullRoster": false }`. The `includeTier2` field is only mentioned in AC7. A test author writing a fixture from AC2 would omit `includeTier2`, potentially writing tests that silently pass without exercising the Tier 2 toggle path.
_Recommended action:_ Update AC2 body shape to include `"includeTier2": false` as a documented field. AC7 already uses this field — AC2 should declare it.

**1-L2 (LOW) — DoR pre-check boxes unchecked**

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — all reference fields; M1 named; benefit linkage gives specific query examples that replace manual cross-reference |
| Scope integrity | 5 | PASS — no persistence; no multi-user threads; Tier 3 test-mode exclusion explicit; `src/web-ui/` modification explicitly excluded |
| AC quality | 3 | PASS — 10 ACs, most well-specified; AC5 lacks testability mechanism (1-M2); AC2 body shape incomplete (1-L1) |
| Completeness | 4 | PASS — all template fields; D37 stub-throws contract in Architecture Constraints; complexity 3 rated |

---

## VERDICT

**PASS with fixes ✅⚠ — Run 1**

0 HIGH, 3 MEDIUM (epic gap; AC5 testability mechanism; allocation-input.json fallback), 2 LOW. 1-M2 and 1-M3 should be resolved before /test-plan to prevent test authorship blockers. 1-M1 (epic gap) is shared and can be resolved in a single epic update pass covering all five stories.
