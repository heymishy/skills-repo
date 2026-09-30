# Definition of Ready: Signals panel — render real signals in a web UI page

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Test plan reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-01

---

## Contract Proposal

**What will be built:**
A new pure render function (e.g. `src/web-ui/views/signals-panel-view.js`, exporting `renderSignalsPanel(signals)`) following `ep1-s3`'s `skill-launcher.js` pattern (server-side string concatenation, `escHtml` for all interpolated values, no client-side JS framework). A new route handler (e.g. `src/web-ui/routes/signals-panel.js`, `handleGetSignalsPanelHtml`), kept as its own module distinct from `ep1-s2`'s existing `routes/signals.js` (the JSON API route), wired via `renderShell`. Registered as `GET /signals` in `server.js`, guarded by the existing `authGuard`, matching the exact real registration pattern already used for `/skills` (`server.js` ~line 2996: `authGuard(req, res, async () => { await handleGetSignalsPanelHtml(req, res); })`). The handler calls `signals-aggregator.js`'s own `getSignals(repoPath)` function directly — the same synchronous function `ep1-s2`'s `handleGetSignals` already calls (confirmed by direct code read) — not a new HTTP round-trip and not a re-implementation of aggregation. Each signal renders as a list item with `text`/`source`/`type`, plus a **real** `<form method="POST" action="/api/skills/{cta.skill-name}/sessions">` containing hidden fields for the signal's `source`/`type`/`text`/`timestamp` and a submit button labeled with `cta.label` — the exact form shape `ep2-s2` depends on already existing (confirmed with the operator: submitting this form before `ep2-s2` is implemented creates a normal, non-seeded session, since the pre-`ep2-s2` endpoint simply ignores the extra hidden fields — not an error, a harmless walking-skeleton property). Parse-error signals (`type: 'parse-error'`) render with a distinguishing CSS class. New test file `tests/check-ep2-s1-signals-panel.js` and new E2E spec `tests/e2e/ep2-s1-signals-panel.spec.js` (Accessibility NFR only).

**What will NOT be built:**
No working seed-and-launch behaviour for the CTA click — the form exists and submits, but `ep2-s2`'s own extension of `handlePostSkillSessionHtml` is what makes it actually seed the session; until then it is functionally identical to `ep1-s3`'s own non-seeded launch. No signal filtering, sorting, dismissal, or bulk actions. No real-time/live-updating list. No pagination or grouping. No new npm dependency.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render function given a real-shaped fixture array; assert text/source/type present | Unit + Integration (real router dispatch against a stubbed aggregator seam) |
| AC2 | Render function given signals with default and non-default `cta`; assert each signal's own label renders | Unit |
| AC3 | Render function given an empty array; assert empty-state markup, no error | Unit |
| AC4 | Render function given a mixed fixture incl. `parse-error`; assert distinguishing class only on that item | Unit |
| AC5 | Dispatch unauthenticated request; assert redirect to sign-in | Integration |
| Accessibility NFR | Real browser; walk Tab order, assert non-empty accessible names | E2E (Playwright) |

**Assumptions:**
`getSignals(repoPath)` is synchronous and returns a plain array (confirmed by direct code read — no `await` at its own call site in `handleGetSignals`). The E2E webServer must have the real `listSkills`/signals-equivalent data path wired (matching the `WIRE_SKILL_ADAPTERS` lesson from `ep1-s3`'s own DoD) or the Accessibility E2E test will find an empty panel instead of real signals — this story's own E2E spec must confirm real data is present before asserting Tab order, not assume it.

**Estimated touch points:**
Files: `src/web-ui/views/signals-panel-view.js` (new), `src/web-ui/routes/signals-panel.js` (new), `src/web-ui/server.js` (route registration only, ~3 lines), `tests/check-ep2-s1-signals-panel.js` (new), `tests/e2e/ep2-s1-signals-panel.spec.js` (new).
Services: None new.
APIs: None new — consumes `ep1-s1`'s `getSignals()` function directly (not a new HTTP endpoint of its own on the data side); adds one new page route (`GET /signals`).

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC5 and the Accessibility NFR; no mismatch. The CTA-form-design question (real form vs. disabled placeholder) was confirmed with the operator before finalizing this contract — real form, inert backend until `ep2-s2`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "Solo operator (you, today)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 9/9 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage names a metric | ✅ | Metrics 2 and 3, both cited by name |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies names `ep1-s1`/`ep1-s2` as upstream — `schemaDepends: ["dodStatus", "prStatus"]` declared; both fields confirmed present in `.github/pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Real `Signal` shape and `getSignals()` reuse path named precisely; review Category E: no violations |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ | No AC is CSS-layout-dependent; the Accessibility NFR is, and is covered by a real E2E test — not a gap |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-28-weeb-ui-learnings-and-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence | ✅ | Story declares NFRs; profile present |
| H-GOV | Governance approval (discovery `Approved By`) | ✅ | "Hamish King — Operator / Product Owner — 2026-09-29" (same entry `ep1-s3`'s own DoR cited — discovery unchanged since) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No injectable adapter introduced or modified by this story — `getSignals()` is a plain function, not a `setX()` adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 1: 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet done | Script may not perfectly reflect real-world usage nuance | Pending — same standing item as `ep1-s1`/`ep1-s2`/`ep1-s3`; recommend operator review before coding |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently (matches `ep1-s1`/`ep1-s2`/`ep1-s3`'s own precedent for this feature).

---

## Oversight Level

**Epic oversight:** Medium (per `epics/signal-seeding-improve-loop-closure.md`) — "Signal seeding requires correct injection of signal context into the skill session model... Medium oversight ensures the session model handles signal seeds correctly before full closure." DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signals panel — render real signals in a web UI page
Story artefact: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New view module + route, following ep1-s3's skill-launcher.js pattern
  exactly (server-side string concat, escHtml, renderShell, no client JS
  framework, no new npm dependency).
- Consume signals-aggregator.js's real getSignals(repoPath) function
  directly (the same function ep1-s2's handleGetSignals already calls) --
  do not re-implement aggregation, do not add a new HTTP round-trip to
  /api/signals from within the same process.
- Register GET /signals in server.js guarded by the existing authGuard,
  matching the exact /skills registration pattern.
- Each signal renders a real <form method="POST"
  action="/api/skills/{cta.skill}/sessions"> with hidden fields for
  source/type/text/timestamp and a submit button labeled with cta.label --
  this form's target endpoint is not yet seed-aware (that's ep2-s2's own
  scope); submitting it now creates a normal, non-seeded session, which is
  expected and not a bug in this story.
- parse-error signals get a distinguishing CSS class, not applied to
  normal signals.
- Empty signal list shows a clear empty-state message, never a blank page
  or thrown error.
- The Accessibility NFR (keyboard Tab order) requires a real Playwright
  E2E test -- do not substitute a DOM-presence-only test for it. Before
  writing this test, confirm the E2E webServer's real signals data path is
  wired (do not assume -- ep1-s3's own DoD found a real, silent gap here
  once already for a different adapter).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)
