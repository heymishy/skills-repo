# Definition of Ready Checklist

## Definition of Ready: Add a placeholder feature to a journey stage, triggering a new seeded discovery

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01QZrWGeUJn2RfzDjVPZFwLC)
**Date:** 2026-10-11

---

## Contract Proposal

**What will be built:**
A new `handlePostPlaceholderFeature` handler in `src/web-ui/routes/journeys.js` (POST `/journeys/:id/stages/:stageId/placeholder-features`), a new `handleTriggerPlaceholderFeature` handler (POST `/journeys/:id/stages/:stageId/placeholder-features/:mappingId/trigger`), and a new `adapters/discovery-seeder.js` module (plain functions, no injectable adapter — see Architecture Constraints) that creates `artefacts/[feature-slug]/` and writes a seeded `discovery.md` with Section 1 populated from the stage's own context. `server.js`'s own inline migration block gains a new `ALTER TABLE feature_customer_journey_stage_mappings ADD COLUMN IF NOT EXISTS mapping_state TEXT NOT NULL DEFAULT 'linked'` statement, matching the established inline-migration convention from `ic-hotfix1`.

**What will NOT be built:**
No richer discovery seeding beyond Section 1 (confirmed via `/clarify` Option A). No finer-grained permission tier — uses the same `requireNonViewer` check every other mutating route in `server.js` already uses.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock-pool `INSERT` call-shape assertion (unit) + real Postgres row assertion (integration) | unit, integration |
| AC2 | Real handler call, assert real `artefacts/` folder + `discovery.md` content on disk | integration |
| AC3 | Mock-pool cross-tenant 404 + zero-mutation assertion | integration |
| AC4 | Mock-pool assertion — both rows present after sequential creation | unit |
| AC5 | Rendered-HTML class/label assertion | unit |

**Assumptions:**
The feature-folder name is derived from the operator-provided placeholder name (slugified) — exact slugification rules (lowercase, hyphenate, strip special characters) are an implementation detail not pinned by any AC; the path-traversal guard (NFR) is what actually matters for safety, not the specific slug format.

**Estimated touch points:**
Files: `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`, `src/web-ui/adapters/discovery-seeder.js` (new)
Services: None (local filesystem + Postgres only)
APIs: 2 new routes (above)

---

## Contract Review

✅ **Contract review passed** — the proposed implementation (2 new handlers, 1 new adapter module, 1 inline migration addition) aligns with all 5 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `jcx-s1-test-plan.md`'s own AC coverage table — all 5 covered |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 3, Unstable |
| H7 | No unresolved HIGH findings | ✅ | `review/jcx-s1-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps per `jcx-s1-test-plan.md`'s own Coverage gaps section |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: "None — this is the first story in the epic" — no upstream dependency declared |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-025, ADR-011, and the `feature_slug` dual-use note added during `/review` Run 2 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is typed `CSS-layout-dependent` — AC5 is a DOM-attribute (class/label) check, not layout/position |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-11-journey-cx-redesign/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — "Hamish King — Platform Owner — 2026-10-11" (added as a dedicated section before this DoR run, matching `2026-10-10-infinite-canvas`'s own established structure) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | Confirmed N/A in Architecture Constraints — plain `fs` operations, no swappable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — this is a new nullable-default column addition (`ic-hotfix1`-style inline migration), not a breaking migration |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable (highest-uncertainty story in the epic — flagged, not hidden) | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet reviewed by a human domain expert — same pattern as every prior story in this repo's history at this exact pipeline point; reviewed at `/verify-completion` per established convention | Hamish King (acknowledged, proceeding) |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps at all | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Path traversal guard for disk writes** — directly applicable to the trigger's own feature-folder creation (NFR already named in the story: `path.resolve` + `startsWith(repoRoot)`, HTTP 400 on violation, dedicated test required — already covered by this story's own NFR test).
- **Every `renderShell()` caller MUST supply the Products-nav sidebar data** — the placeholder/trigger UI renders within the existing Customer experience tab's own `renderShellWithNav` call; no new shell-rendering call site is introduced by this story, so no new risk here, but worth confirming during implementation that the existing call site isn't duplicated.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a placeholder feature to a journey stage, triggering a new seeded discovery -- artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
Test plan: artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s1-test-plan.md

Goal:
Make every test in the test plan pass (7 tests: 3 unit, 3 integration,
1 NFR). Do not add scope, behaviour, or structure beyond what the
tests and ACs specify.

Constraints:
- Add mapping_state (TEXT NOT NULL DEFAULT 'linked') to
  feature_customer_journey_stage_mappings via server.js's own inline
  migration block (ALTER TABLE ... ADD COLUMN IF NOT EXISTS),
  matching the established ic-hotfix1 convention -- this is the ONLY
  correct place; scripts/migrate-schema-journeys.js is never copied
  into the deployed image (Dockerfile's own COPY allowlist).
- feature_slug on a placeholder row holds a free-text NAME, not a
  resolvable slug, until jcx-s2's own conversion step runs. Never
  query/join feature_slug against pipeline-state.json features
  without first checking mapping_state = 'linked'.
- No injectable adapter -- the trigger's folder-creation and
  discovery.md-seeding are plain fs operations, tested directly
  against real fs state (see test plan AC2).
- Path traversal guard is MANDATORY on the trigger's feature-folder
  creation: path.resolve() + startsWith(repoRoot + path.sep), HTTP
  400 (not 500) on violation, do not log the offending path value.
- Ownership-check-before-mutation (D13): 404, not 403, for a
  cross-tenant stage id -- matches handlePostFeatureMapping's own
  established pattern exactly (read src/web-ui/routes/journeys.js
  directly before implementing, do not assume).
- AC5's placeholder styling must use the exact class name
  sw-mapping--placeholder and the literal text "Placeholder" --
  pinned by the AC itself after /review Run 2's own revision.
- Architecture standards: read .github/architecture-guardrails.md and
  .github/standards/web-ui/web-ui-patterns.md's own "Path traversal
  guard for disk writes" section before implementing.
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
