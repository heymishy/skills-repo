# Definition of Ready Checklist

## Definition of Ready: Feature picker: read pipeline-state.json and render feature list in modal

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md
**Contract proposal:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep2-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## Contract review

✅ **Contract review passed** — the proposed implementation (one new "Map feature" button per stage card, one new server-rendered picker modal with an explicit success/failure distinction, client-side filtering reusing the existing repo-picker pattern) aligns with all 4 ACs and the test plan's own AC-coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 4 ACs covered, no gaps |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 — Feature-to-stage mapping adoption |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `review/ep2-s1-review-1.md` — PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, gap table "None" |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `prStatus`, `dodStatus` (both present in `pipeline-state.schema.json`) — dependencies `ep1-s2` and `ep5-s1` both show `prStatus: "merged"`, `dodStatus: "complete"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Story cites ADR-016 (two-file state authority) and ADR-029 (local filesystem canonical) directly — both genuinely applicable, not fabricated; no HIGH findings in the current review run |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC matches any trigger pattern — confirmed in the test plan's own Step 3a analysis |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No dedicated NFR profile file required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline — same established handling as every prior story in this feature |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Product Owner / Operator — 2026-10-08 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | `_repoRootAdapter` is an existing, already-wired, non-throwing adapter — not a new D37 injectable introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema change (reads the existing `pipeline-state.json`, writes nothing) |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent; the picker modal reuses `products.js`'s own existing CSS custom-property pattern (`var(--line)`, `var(--surface)`, etc.) — no new hardcoded colors |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | 5-M1 (AC1 wording) and 5-M2 (filter client/server ambiguity) both resolved directly, not accepted as risk — see `decisions.md` D10 | Resolved, not RISK-ACCEPTed |
| W4 | Verification script reviewed by a domain expert | ✅ | Reviewed and signed off by the operator this session (see Sign-off below) | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

No RISK-ACCEPTs required — both MEDIUM findings were resolved, not accepted.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Silent fallback — three-path test coverage requirement" (line 50) — **does NOT apply as written**: that section covers routes that silently fall back to a default with no error shown. This story deliberately does the opposite (AC3 requires a *visible* error, not a silent fallback) — noted here so the coding agent doesn't mistake AC3's design for the pattern this section describes. The comparable rigor this story does follow: both read-failure modes (ENOENT-style throw, invalid JSON) get their own dedicated test, matching this standard's spirit of one test per failure mode even though the target behavior differs.
- Tenant scoping — not applicable to this story's own query (no Postgres access at all); the mapping records `ep2-s2` introduces later will need it, not this story's read-only feature list.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Feature picker: read pipeline-state.json and render feature list in modal -- artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s1-test-plan.md

Goal:
Make every unit test in the test plan pass (7 tests). No E2E spec is
required for this story. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (add a new "Map feature"
  button per stage card in handleGetJourneyCanvas's stagesHtml
  rendering, and a new feature-picker modal embedded in the canvas
  page), and a NEW test file tests/check-ep2-s1-feature-picker.js.
- New import required: var _repoRootAdapter = require('../adapters/repo-root');
  at the top of journeys.js (this adapter already exists and is already
  used by products.js -- do not create a new one).
- Read pipeline-state.json via: _repoRootAdapter.getRepoRoot(req) ->
  path.join(repoRoot, '.github', 'pipeline-state.json') ->
  fs.readFileSync(path, 'utf8') -> JSON.parse(...), all wrapped in a
  single try/catch.
- CRITICAL: do NOT reuse products.js's own existing silent-fallback
  convention (catch -> { features: [] }) verbatim. AC3 requires a
  VISIBLE, distinct error state when the read or parse fails -- the
  catch block must set a flag (e.g. loadError: true) that the modal's
  rendering branches on, producing the exact text "Features could not
  be loaded. Check that pipeline-state.json exists." This must be
  visually/textually different from the empty-list state shown when
  the read succeeds but pipeline-state.json genuinely has zero
  features -- the two states must never be conflated.
- The filter input must be client-side only (oninput handler filtering
  already-rendered DOM nodes by data-slug/data-name attributes) --
  reuse products.js's own rpc-picker-search / rpcFilterRepoPicker()
  pattern as the direct structural model (role="listbox", per-item
  data-* attributes, an empty-state paragraph toggled by the same
  filter function). No new server round trip on each keystroke.
- The modal's Close button and any Escape-key handling must be pure
  client-side visibility toggles -- no fetch, no POST, nothing written
  anywhere. This story introduces no save/mapping mechanism at all
  (that is ep2-s2's own scope).
- The "Map feature" button goes on each stage card only -- do NOT add
  any entry point in a "Delivery view," which does not exist yet
  (ep2-s3's own scope).
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. ADR-016 (two-file state authority) and ADR-029
  (local filesystem is canonical for artefact content) both apply --
  read pipeline-state.json via fs.readFileSync from the local checkout,
  never cache or duplicate feature metadata in Postgres.
- Open a draft PR when the unit tests pass -- do not mark ready for
  review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High (per the parent epic's own "Human Oversight Level: High" declaration — `artefacts/2026-10-05-customer-journey-as-first-class/epics/feature-mapping-and-delivery-view.md`)
**Sign-off required:** Yes — named human sign-off before assigning to the coding agent.
**Signed off by:** Hamish King — Product Owner / Operator — 2026-10-09. Confirmed the AC verification script (`artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep2-s1-verification.md`) correctly describes the intended behaviour and approved proceeding to the coding agent.
