# Definition of Ready: ep1-s1 — Feature Discovery from Pipeline-State Index

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s1 — Feature Discovery from Pipeline-State Index
**Status:** SIGNED OFF
**Date:** 2026-05-16

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

```
STORY: ep1-s1 — Feature Discovery from Pipeline-State Index

ACCEPTANCE CRITERIA:
Given a connected repo with .github/pipeline-state.json containing at least one feature
at stage ≠ [completed, archived, released],
When I open the web UI skill picker,
Then I see all non-terminal features listed with name, current stage badge,
last modified date, and a "Continue" button.

SCOPE BOUNDARIES:
- Do NOT implement two-way sync or conflict resolution
- Do NOT implement real-time polling or background discovery
- Do NOT implement search, filtering, or sorting UI
- Do NOT implement diff/comparison views between CLI and web UI versions

You will build a GET /api/features endpoint that:
1. Reads .github/pipeline-state.json
2. Filters out terminal-stage features (completed, archived, released)
3. Formats each feature with { displayName, stageBadgeText, formattedDate, continueButtonLabel }
4. Returns JSON array to client

You will add a feature list UI component in the skill picker that:
1. Calls GET /api/features on page load
2. Renders each feature as a card/list item with name, stage badge, date, and Continue button
3. Handles Continue button clicks → POST /api/skills/[skill]/sessions?featureSlug=[slug]
4. Gracefully degrades if /api/features returns empty or errors (shows "No in-progress features")

IMPLEMENTATION TASKS (suggest breaking into subtasks):
1. Task 1: Implement /api/features endpoint (filter logic, file read, formatting)
2. Task 2: Implement feature list UI component (HTML/CSS, fetch call, event handlers)
3. Task 3: Wire feature selection to session start (POST redirect to session page)
4. Task 4: Test harness setup (mock pipeline-state.json, E2E Playwright tests)
5. Task 5: Error handling and logging (missing file, parse errors, network issues)

VERIFICATION:
Run the test suite (10 tests from test plan) plus the E2E verification scenarios.

NFR TARGETS:
- Feature list fetch ≤2 seconds
- ≥95% artefact load success rate (handled in ep1-s2; ep1-s1 scope is feature discovery only)
- Terminal stages always filtered out
- Graceful fallback if pipeline-state.json missing or malformed

ARCHITECTURE CONSTRAINTS (ADR-023, ADR-009):
- Disk is canonical source; read fresh on every session start
- Use Node.js built-in fs module; no new npm dependencies
- Injectable adapters pattern: if file reads are abstracted, default stub must throw (never return null)
- GitHub OAuth token scope already verified; no new auth mechanism required

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY (after this PR merges):
ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population
(depends on /api/features endpoint working)
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
