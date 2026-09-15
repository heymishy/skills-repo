# Definition of Ready — ep2-s4: Concurrent Write Merge for Artefact Edits

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep2-s4 — Concurrent Write Merge for Artefact Edits
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A three-way merge algorithm that detects when two team members submit save requests for the same artefact within 100ms of each other, merges their edits automatically by comparing the base version against each user's version, and returns the merged result to both clients. The system records which lines came from which user in a `feature_edits` table with line-by-line attribution (lineAttributions JSON). Both users see the merged content immediately without a page refresh or conflict error.

**What will NOT be built:**
- Optimistic conflict resolution (showing the conflict to the user; accepting one version wholesale without merge)
- Real-time co-editing cursors or presence within the artefact editor
- Handling merge conflicts that require human intervention (assume three-way merge succeeds; hard conflicts deferred)
- Complex conflict resolution UI or manual merge workflows

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Concurrent detection within 100ms | Unit test on request timestamp logic; integration test with mocked concurrent requests | unit + integration |
| AC2: Three-way merge correctness | Unit test on merge algorithm with known base/user-A/user-B versions; E2E test verifying both clients receive identical merged content | unit + integration + E2E |
| AC3: feature_edits record with attribution | Unit test on record creation and JSON lineAttributions field; integration test verifying accuracy of line-to-user mapping | unit + integration |

**Assumptions:**
- The merge algorithm can be implemented as a pure function (no side effects during merge computation)
- Both clients are capable of receiving streamed/pushed updates (SSE or websocket) without polling
- The base version of any artefact is always available in the database or file storage for the merge to reference
- Merge conflicts (e.g., both users delete the same line) are rare enough that failing gracefully with an error is acceptable for MVP; hard conflicts do not need automatic resolution

**Estimated touch points:**
Files: `src/web-ui/modules/merge-artefact-edits.js` (new: three-way merge algorithm), `src/web-ui/routes/features.js` (PUT `/api/features/{featureId}/artefacts/{name}/save` handler — modify to detect concurrency and call merge), `src/web-ui/public/editor.js` (modify save handler to listen for merged-content SSE events)
Services: Postgres (`feature_edits` table write), Node.js HTTP server (concurrent detection and merge orchestration), SSE stream for client push
APIs: PUT `/api/features/{featureId}/artefacts/{name}/save` (modified to return merged content); SSE stream `/api/features/{featureId}/artefacts/{name}/merged` (new, streaming merged content to clients)

---

## Contract Review

**Mismatch check:**
- AC1 (concurrent detection within 100ms) → proposed approach: timestamp-based detection at the route handler level, requests queued if they arrive within the window ✅
- AC2 (three-way merge correctness) → proposed approach: dedicated `mergeArtefactEdits(base, userA, userB)` function that combines both edits and returns a unified result; both clients notified via SSE ✅
- AC3 (feature_edits record with line attribution) → proposed approach: POST request creates `feature_edits` row with operation: "merge" and lineAttributions JSON after merge completes ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Team collaborator — any role editing an artefact) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (12 tests: 3 unit + 3 integration + 3 E2E + 3 NFR, all ACs covered) |
| H4 | Out-of-scope section populated | ✅ PASS (3 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Synchronous team access" exists in benefit-metric.md coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 3) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (12 tests across unit, integration, E2E, and NFR categories; all ACs covered; no gaps identified) |
| H8-ext | Schema dependency check | ✅ PASS (feature_edits table referenced; base version availability assumed; no external dependencies on undelivered upstream stories) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-028 — canonical builder `mergeArtefactEdits()` referenced; no conflicting constraints) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (all ACs are logic-based; no CSS-layout-dependent verification required) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16"; all NFRs are performance gates, not compliance/regulatory) |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable — no compliance NFRs) |
| H-NFR3 | Data classification | ✅ PASS (not applicable — no sensitive data classified) |
| H-NFR-profile | NFR profile presence | ✅ PASS (no NFR profile required; performance NFRs stated inline in story) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md contains Approved By section with non-blank entry) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters in this story) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

No W1–W5 warnings apply to this story.

---

## Oversight Level

**Oversight:** High

**Rationale:** The three-way merge algorithm is a complex algorithmic component with high failure risk if edge cases are mishandled (e.g., overlapping edits, boundary conditions, hard conflicts). Concurrent request detection and lineAttributions accuracy directly affect the correctness of concurrent collaboration — the core value proposition. Multiple components (route handler, merge algorithm, SSE push, client state update) must coordinate without failure. This complexity warrants human awareness before dispatch.

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Concurrent Write Merge for Artefact Edits (ep2-s4)**
**Feature slug:** new-feature-2b74a292
**Oversight level:** High (share with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Susan saves a revised AC for story S1 at the same moment Darren saves a revised architecture constraint for the same story, When both save requests hit the server within 100ms of each other, Then the server detects this as a concurrent edit rather than processing them as two independent sequential saves.

**AC2:** Given a concurrent edit has been detected, When the three-way merge runs (base + Susan's version + Darren's version), Then the merged result contains both Susan's AC revision and Darren's architecture constraint change, and both Susan and Darren see the merged version immediately.

**AC3:** Given the merge has completed, When feature_edits is inspected, Then a record exists with operation: "merge" and lineAttributions correctly showing which lines came from Susan and which from Darren.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/modules/merge-artefact-edits.js` — new file: pure function `mergeArtefactEdits(baseContent, userAContent, userBContent)` that performs three-way merge and returns `{ merged, lineAttributions }` where lineAttributions is a JSON object mapping line numbers to user IDs
- `src/web-ui/routes/features.js` — PUT `/api/features/{featureId}/artefacts/{name}/save` handler (modify existing): detect concurrent requests (timestamp within 100ms), queue both for merge if concurrent, call `mergeArtefactEdits()`, write to `feature_edits` table, push merged content to both clients via SSE

**Files you MUST NOT modify:**
- Feature presence sidebar (ep2-s1)
- Stage list rendering (ep2-s2)
- Sign-off modal / approval flow (ep2-s3)
- Feature creation or pod assignment flow (ep1-s1 through ep1-s3)

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All merge operations tenant-scoped via `req.session.tenantId`; feature_edits record includes tenantId
- **ADR-028 (Canonical builder):** `mergeArtefactEdits()` is the ONLY place merge logic lives — no re-derivation of merge rules in other files
- **Concurrent detection window:** exactly 100ms (not 99, not 101 — this is the AC boundary)
- **Merge success rate:** ≥99% (1 hard conflict per 100 runs is acceptable; hard conflicts fail gracefully with error, not crash)

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable (e.g., "Merge conflict detected — unable to auto-merge")
- Concurrent requests must not produce silent data loss

**From `.github/standards/web-ui/POLICY.md`:**
- All data writes are durable (written to disk/database before response sent to client)
- Client push notifications (SSE) must be reliable; if a client misses a notification, resync is available via GET

### Implementation Specification

**`mergeArtefactEdits(baseContent, userAContent, userBContent)` function:**
- Input: three strings (base version, user A's version, user B's version)
- Output: `{ merged: string, lineAttributions: { lineNum: userId, lineNum: userId, ... } }` or throw with error code (e.g., `MERGE_CONFLICT_HARD`)
- Algorithm: standard three-way merge (compute line-by-line diffs: base→A and base→B; apply non-overlapping changes; mark hard conflicts as errors)
- Line attribution: track which lines in the merged output came from baseContent (no attribution needed), userAContent (attribute to userA), or userBContent (attribute to userB)
- Edge case: if both users delete the same line, this is a hard conflict — throw error, do not auto-resolve
- Edge case: if one user deletes a line and the other edits it, this is a hard conflict — throw error

**PUT `/api/features/{featureId}/artefacts/{name}/save` handler (modified):**
- Extract `tenantId`, `userId` from `req.session`
- Extract `content` (new artefact content) from request body
- Read base version from database or file storage
- Check if another save request for this artefact arrived within the last 100ms (query a request queue or use an in-memory timestamp buffer)
- If another request is pending (concurrent edit detected):
  - Read the other user's content from their in-flight request
  - Call `mergeArtefactEdits(base, this_user_version, other_user_version)`
  - On success: save merged content to disk/DB, write `feature_edits` record (operation: "merge", lineAttributions, both user IDs)
  - On error (hard conflict): return HTTP 409 with error message; do NOT save, do NOT advance
  - Push merged content to both clients via SSE stream `/api/features/{featureId}/artefacts/{name}/merged`
- If no concurrent request detected (normal sequential save):
  - Save content to disk/DB, write `feature_edits` record (operation: "save", userId only, no merge)
  - Return HTTP 200 with saved content
- Return HTTP 200 only on successful save (merged or sequential) — HTTP 409 or 500 on error

**`feature_edits` table schema (ensure migration exists):**
- `id` (PK), `featureId`, `artefactName`, `userId`, `timestamp`, `operation` (enum: "save" | "merge"), `editHash` (SHA-256 of content), `mergedWith` (nullable: JSON array of user IDs if operation="merge"), `lineAttributions` (nullable: JSON object if operation="merge"), `tenantId`

**SSE stream for merged content:**
- Route: `/api/features/{featureId}/artefacts/{name}/merged` (GET)
- Payload (per event): `{ merged: string, lineAttributions: {...}, mergedAt: timestamp, userIds: [userId1, userId2] }`
- Lifetime: stream stays open for 30 seconds or until client closes; client reconnects if needed
- Guarantee: every client that sent a concurrent save request receives the merged content within 500ms of merge completion

### Test Coverage

- **Unit tests:** 3 (AC1 concurrent detection logic, AC2 three-way merge correctness on known test cases, AC3 lineAttributions accuracy)
- **Integration tests:** 3 (full concurrent merge flow including route handler + DB write + SSE push, merge success rate + edge cases, tenant isolation on merges)
- **E2E tests:** 3 (concurrent detection in browser with two simulated clients, merged result visible to both clients without refresh, feature_edits record queryable post-merge)
- **NFR tests:** 3 (merge latency ≤1s, lineAttributions accuracy within 1 character, ≥99% success rate across 100 random test cases)
- **Total:** 12 tests; all ACs covered

### NFRs

- Merge completes within 1s
- Line-level attribution is accurate to within 1 character of intended scope
- Merge success rate ≥99% (hard conflicts fail gracefully, not with crash)
- Concurrent request detection has no false negatives (all requests within 100ms are paired)
- Both clients see identical merged content (no divergence after merge push)
- Merged content persists to disk/DB before any response is sent

### Success Criteria for Definition of Done

- All 3 ACs passing (verified by manual test against AC verification script)
- No unhandled exceptions in browser console or server logs during concurrent edits
- Tenant isolation verified (all DB queries include `WHERE tenantId = ?`)
- `feature_edits` record correctly created with operation: "merge" and accurate lineAttributions
- Both clients receive merged content via SSE within 500ms of merge completion
- Merge success rate verified at ≥99% across automated edge-case test suite (100+ concurrent scenarios)
- Hard conflicts fail gracefully with HTTP 409 and error message (not silent data loss)
- ep2-s1 presence sidebar already loaded and functional
- ep2-s2 role-filtered stage list already loaded
- ep2-s3 approval modal and signature already working

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: High — share with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.