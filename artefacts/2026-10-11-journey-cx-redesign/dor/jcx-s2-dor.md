# Definition of Ready Checklist

## Definition of Ready: Placeholder mapping auto-converts to linked once its triggered discovery is approved

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Contract Proposal

**What will be built:**
A conversion-check mechanism that watches for a `discovery.md` whose `Status` field becomes `Approved` for a journey previously triggered from a placeholder mapping, then updates that mapping's `mapping_state` to `linked` and `feature_slug` to the real, approved feature's own slug. Implemented as a function callable both on-demand (e.g. when the operator views the stage) and potentially from a lightweight check during page load — exact trigger timing is an implementation detail, not pinned by any AC (the ACs specify the *outcome* of conversion, not *when* the check runs).

**What will NOT be built:**
No automatic cleanup/expiry of abandoned placeholders (AC4 explicitly requires they persist indefinitely). No bidirectional sync if the linked feature is later renamed.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real Postgres row assertion after simulating an approved discovery.md | integration |
| AC2 | Mock-pool zero-`UPDATE`-call assertion for an unapproved discovery | integration |
| AC3 | Two independent mappings, one approved one not, assert only one converts | integration |
| AC4 | Mock-pool assertion — no conversion-check call for an abandoned trigger | unit |

**Assumptions:**
The mechanism for detecting "this journey's discovery was triggered from this specific mapping" relies on the provenance record `jcx-s1`'s own trigger handler writes (per `jcx-s1`'s own NFR: "the created feature folder/artefact should record which journey stage it was triggered from"). This story's own implementation reads that same provenance record — no new provenance mechanism is introduced here.

**Estimated touch points:**
Files: `src/web-ui/routes/journeys.js` (new conversion-check function/handler)
Services: None
APIs: Likely folded into the existing `GET /journeys/:id` canvas route (checking conversion state on page load) rather than a new dedicated endpoint — confirmed as an implementation detail, not AC-pinned.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s2-test-plan.md`'s own AC coverage table |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s2-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | **schemaDepends:** `dorStatus` — dependency `jcx-s1` shows `dorStatus: "signed-off"` — satisfied |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-025, references `jcx-s1`'s own `mapping_state`/`feature_slug` contract |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is layout/position-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — reuses `jcx-s1`'s own `mapping_state` column, no new schema change |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed; same established pattern as every prior story | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No sections directly load-bearing beyond `jcx-s1`'s own already-cited path-traversal/shell-rendering notes, which this story does not introduce new instances of.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Placeholder mapping auto-converts to linked once its triggered discovery is approved -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s2-test-plan.md

Goal:
Make every test in the test plan pass (5 tests: 1 unit, 3 integration,
1 NFR). Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Constraints:
- Depends on jcx-s1 being merged first -- consumes its mapping_state
  column and trigger-provenance record. Do not reimplement or
  duplicate jcx-s1's own schema/provenance mechanism.
- feature_slug conversion: only overwrite it when mapping_state
  transitions to 'linked' -- never overwrite a placeholder's own name
  before that transition is confirmed (see jcx-s1's own Architecture
  Constraints on this exact dual-use).
- No automatic cleanup/expiry of an abandoned placeholder (AC4) --
  do not add a TTL, cron job, or similar; the mapping persists
  indefinitely by design.
- Ownership-check-before-mutation (D13): 404, not 403, for a
  cross-tenant mapping id.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. ADR-025 applies directly.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-11.
