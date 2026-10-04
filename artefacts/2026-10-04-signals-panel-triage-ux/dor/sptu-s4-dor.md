# Definition of Ready Checklist

## Definition of Ready: Dismiss / mark-reviewed for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Test plan reference:** artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md
**Contract proposal:** artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s4-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7 ACs + CSRF requirement, 14 tests, full coverage |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 3 — Dismiss retention |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review run 1: 0 HIGH (1 MEDIUM, closed at /test-plan — see H9 note) |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `sptu-s2` (in-feature, real artefact at `artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md` — resolves) and `ep2-s1`/`ep2-s3` as `[External: ...]` — no `pipeline-state.schema.json` field dependency applies |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the full D37 rule application; review's one MEDIUM finding (1-M1, CSRF) is closed by two dedicated tests in the test plan, not merely acknowledged — Category E: 0 HIGH |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-04-signals-panel-triage-ux/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed present above |
| H-GOV | Discovery `## Approved By` non-blank, non-engineer-only | ✅ | "Hamish King — Operator / Product Owner — 2026-10-04" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | `setDismissedSignalsStore` is introduced. (a) AC5 is an explicit wiring AC. (b) Architecture Constraints state the stub default must throw, matching the exact `signals-aggregator.js` precedent. (c) the implementation plan — written next, at `/implementation-plan` — MUST name the `server.js` wiring as a task separate from the handler/adapter-definition task; carried forward explicitly into the Coding Agent Instructions below so this isn't left implicit. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | 1-M1 (CSRF) — closed by 2 dedicated tests in the test plan at `/test-plan` time, not merely acknowledged. 1-L1/1-L2 are LOW, non-blocking, noted for retrospective. | Closed, not just acknowledged — see `sptu-s4-test-plan.md`'s CSRF integration tests |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists | RISK-ACCEPT logged in `decisions.md`, 2026-10-04 entry (covers `sptu-s1`–`sptu-s4`) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | The one gap (dismiss-file staleness) is explained/mitigated, not "UNCERTAIN" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Injectable adapter pattern (D37/ADR-009):** Directly applicable — `dismissed-signals-store.js` introduces `setDismissedSignalsStore`. All 3 standards-file requirements (throwing stub, exported setter, separate production-wiring task) must be followed exactly as documented above and in the story's own Architecture Constraints.
- **Session token access:** N/A — the new routes rely on the existing session-auth guard already protecting `/signals`; no new `req.session.*` field is introduced.
- **Stack constraints:** No new npm dependency — `crypto` is a Node built-in. No Express.
- **HTML render function unit test pattern:** Assert specific fragments (Dismiss/Undismiss button markup, "no date"-style independent markers) — not full-HTML snapshot equality.
- **Client-side DOM patch vs. full reload:** Considered and found N/A — this page has no live in-progress client state (no SSE, no draft) to lose; a full server-rendered reload after the dismiss/undismiss POST matches the existing CTA-form precedent already on this exact page.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing; the D37 section in particular must be followed to the letter.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Dismiss / mark-reviewed for the signals panel — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md
Contract: artefacts/2026-10-04-signals-panel-triage-ux/dor/sptu-s4-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS, raw http.createServer — no Express, no new npm dependencies
- D37 is MANDATORY: the dismissed-signals-store adapter's stub default MUST
  throw, never return an empty/default list. The real server.js wiring MUST
  be a SEPARATE implementation-plan task from writing the handler/store module
  — do not bundle them into one task.
- The dismiss/undismiss stable key is computed server-side from source+type+text
  via crypto.createHash('sha256') — never trust a client-submitted key/hash directly.
- Both POST /signals/dismiss and POST /signals/undismiss MUST use this app's
  existing CSRF middleware (_csrf.generateCsrfToken/csrfField) — this closes
  review finding 1-M1; do not ship either route without it.
- filterSignals (sptu-s2) and the dismissed-set check compose in the SAME
  pre-pagination filter pass — do not add a second, parallel filtering path.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
