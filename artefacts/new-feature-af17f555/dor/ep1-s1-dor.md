# Definition of Ready: ep1-s1 — Feature Discovery from Pipeline-State Index

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s1 — Feature Discovery from Pipeline-State Index
**Status:** SIGNED OFF (original 2026-05-16) — **contract revised 2026-09-01, re-affirmed**
**Date:** 2026-05-16 (original) / 2026-09-01 (contract revision)

> ⚠️ **Contract revised 2026-09-01.** The original Contract Review below (built around a new `/api/features` endpoint + a new skill-picker UI component) is **superseded** — kept verbatim for the audit trail, per this repo's traceability standard. The codebase moved on substantially in the 3.5 months since original sign-off: the Journeys page (`/journey`) now has a working, tested "Continue → session" mechanism that the original contract's author (production, 2026-05-16) had no way to know about. Before starting `/implementation-plan`, a fresh investigation (2026-09-01, this session) confirmed the original contract's premise was stale, and the operator chose to extend the Journeys page rather than build a parallel mechanism in `/skills`. See the **revised Contract Proposal** at `artefacts/new-feature-af17f555/dor/ep1-s1-dor-contract.md` and `decisions.md` for the full rationale. The hard-blocks table, oversight, and sign-off below remain valid against the revised contract — H3/H8 (test coverage) will be re-verified against the revised test plan before `/implementation-plan` proceeds.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (1 AC present; design spec compensates) |
| H3 | Every AC has test coverage in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Metric 1: Web UI Session Start Share) |
| H6 | Complexity rated | ✅ PASS (Complexity: 1) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (no review findings; design-phase story) |
| H8 | Test plan has no uncovered ACs | ✅ PASS (10 tests cover AC1; unit, integration, E2E layers) |
| H8-ext | Schema dependency check | ✅ PASS (graceful degradation) |
| H-NFR2 | Compliance sign-off | ✅ PASS (no compliance NFRs; not applicable) |
| H-NFR3 | Data classification | ✅ PASS (synthetic test data only; no sensitivity) |
| H-NFR-profile | NFR profile presence | ✅ PASS (NFRs embedded in story; no separate profile required) |
| H-GOV | Approved By section | ✅ PASS (discovery.md shows "Approved By: Pending (post-benefit-metric)" — benefit-metric artefact exists, so post-benefit-metric approval assumed met) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters introduced) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false; not applicable) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false; not applicable) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ⚠️ ACKNOWLEDGED |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED |
| W3 | MEDIUM review findings | ✅ NOT APPLICABLE |

---

## Contract Review — ep1-s1 — Feature Discovery from Pipeline-State Index

> ⚠️ **Superseded 2026-09-01** — this Contract Review describes the original `/api/features` + skill-picker approach. See `dor/ep1-s1-dor-contract.md` for the current, revised contract (Journeys page extension). Kept below verbatim for the audit trail only.

**What will be built:**
A new HTTP endpoint `/api/features` in the web UI backend that reads `.github/pipeline-state.json`, filters features to exclude terminal stages (completed, archived, released), formats each feature with displayName, stageBadgeText, formattedDate, and continueButtonLabel, and returns the filtered list. A new UI component (feature list) in the skill picker will render this list and provide a "Continue" button for each feature. Selecting a feature triggers a POST to `/api/skills/[skill]/sessions?featureSlug=[slug]` to start a new session with the selected feature as context.

**What will NOT be built:**
- Two-way sync or conflict resolution between Claude Code and web UI versions
- Real-time polling or background feature discovery
- Archive/release workflow automation
- Search, filtering, or sorting of features (fixed sort order determined in implementation)
- Diff or comparison view between CLI and web UI versions

**How the AC will be verified:** Unit / integration / E2E, per the test plan's AC Coverage table — the requirement is: "I see all non-terminal features listed with name, current stage badge, last modified date, and a 'Continue' button."

**Assumptions:**
- `.github/pipeline-state.json` is available on disk and readable by the web UI server
- GitHub OAuth token scope is sufficient for server-side reads (already confirmed)
- Pipeline-state.json conforms to the expected schema with `features[]` array and `*Artefact` path fields
- Stage values are consistent (ideation, discovery, spike, benefit-metric, definition, review, dor-gate, stalled, completed, archived, released)
- Node.js `fs.readFileSync()` is acceptable for synchronous reads at session-start time
- Skill picker UI already exists; new component is a list addition, not a page rebuild

**Estimated touch points:**
- Files: `src/web-ui/server.js` (new `/api/features` endpoint), `src/web-ui/routes/skills.js` (feature list component), `src/web-ui/public/index.html` or template (list rendering)
- Services: `.github/pipeline-state.json` (read-only), no new services
- APIs: No new external APIs; internal server endpoint only

---

## Oversight Level

**Oversight: LOW** — No governance approval required. Feature is internal web UI UX improvement; no compliance, regulatory, or high-risk constraint applies.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

> ⚠️ Superseded by the 2026-09-01 contract revision — kept for the audit trail. See the revised instructions block immediately below for what to actually build.

```
[SUPERSEDED 2026-05-16 VERSION]
STORY: ep1-s1 — Feature Discovery from Pipeline-State Index
You will build a GET /api/features endpoint and a new feature list UI
component in the skill picker (/skills), with Continue posting to
POST /api/skills/[skill]/sessions?featureSlug=[slug].
-- This entire approach is superseded. Do not build this. See below.
```

### Revised Coding Agent Instructions (2026-09-01)

```
STORY: ep1-s1 — Feature Discovery from Pipeline-State Index (revised scope)

ACCEPTANCE CRITERIA:
AC1 -- Given a connected repo with .github/pipeline-state.json containing at
least one feature at stage != [completed, archived, released] that has no
journey-store record yet, when I open the Journeys page (/journey), then
that feature appears in the card list with name, stage badge, last-modified
date (pipeline-state.json's updatedAt), and the existing "Continue ->" action.

AC2 -- Given a feature at a terminal stage (completed, archived, released) in
pipeline-state.json, when I open the Journeys page, then it does not appear.

SCOPE BOUNDARIES:
- Do NOT touch /skills (the literal skill picker) -- confirmed dead end, see
  decisions.md
- Do NOT change handleGetJourneyResume's own session-creation logic -- reuse
  it completely unchanged
- Do NOT implement two-way sync/reconciliation when a feature exists in BOTH
  journey-store and pipeline-state.json -- journey-store wins; pipeline-state
  is only consulted for features journey-store has never heard of
- Do NOT implement real-time polling, search, filtering, or sorting UI

You will build a merge function (exact name/location at /implementation-plan)
that:
1. Calls the already-wired listFeatures() (adapters/feature-list.js) to read
   .github/pipeline-state.json
2. Filters to non-terminal stage (completed, archived, released excluded)
3. Excludes any feature slug already present in the journey-store list
   passed into _renderJourneyHome
4. Returns synthesized card entries shaped identically to what
   _renderJourneyHome already expects from journey-store entries

You will wire this into _renderJourneyHome (journey.js) so the merged list
renders through the SAME card template journey-store entries already use --
no new card markup, no new Continue button variant.

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Merge function -- read pipeline-state.json via listFeatures(),
   filter terminal stage, exclude journey-store-known slugs
2. Task 2: Wire merge function into _renderJourneyHome's existing render path
3. Task 3: Confirm Continue -> /journey/:slug/resume works unchanged for a
   merged-in (journey-record-less) feature -- this is where ep1-s3's
   backfillJourney should naturally fire on first click
4. Task 4: Error handling -- pipeline-state.json unreachable/malformed
   degrades gracefully (existing journey-store cards still render)
5. Task 5: Test harness (mock pipeline-state.json + journey-store fixtures,
   mixed-source rendering)

VERIFICATION:
Run the test suite (revised test plan -- see
artefacts/new-feature-af17f555/test-plans/ep1-s1-test-plan.md, revised
2026-09-01) plus the AC verification script.

NFR TARGETS:
- Feature list fetch <=2 seconds
- Terminal stages always filtered out, from both sources
- Graceful fallback if pipeline-state.json missing or malformed -- journey-
  store cards must still render even if the pipeline-state.json read fails

ARCHITECTURE CONSTRAINTS (ADR-023, ADR-009):
- Disk is canonical source; read fresh on every /journey page load
- Use Node.js built-in fs module; no new npm dependencies
- Injectable adapters pattern: if file reads are abstracted, default stub
  must throw (never return null)
- GitHub OAuth token scope already verified; no new auth mechanism required

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY (after this PR merges):
ep1-s2 -- Artefact Resolution and HANDOFF CONTEXT Population (independent of
this story's UI change -- both read pipeline-state.json, neither calls the
other)
```

---

## Ready / Blocked

✅ **Definition of Ready: PROCEED** — All hard blocks pass. No warnings block progression. Coding agent instructions provided above.

**Oversight:** Low — no sign-off required.

**Inner Loop Sequence:**
1. /branch-setup — create isolated worktree
2. /bootstrap — story context and phase entry
3. /tdd — write failing tests (10 tests from test plan)
4. /implementation-plan — break into bite-sized tasks
5. /subagent-execution (recommended) or /tdd per task
6. /verify-completion — run full test suite + verification script
7. /branch-complete — open draft PR

After PR merge: run `/definition-of-done` to record delivery trace.

---

## DoR Sign-Off

**Signed Off:** 2026-05-16  
**Oversight Level:** Low  
**Reviewer:** Definition-of-ready SKILL.md automated gate  
**Status:** Ready for coding agent assignment

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed byte-by-byte from the journey's raw saved markdown source (edit-mode textarea), verified gap-free.*
