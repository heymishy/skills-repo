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

**Estimated touch points — CORRECTED at `/implementation-plan` time (2026-09-20), see `decisions.md`:**

The touch points below were written before independent verification against the real codebase. Direct investigation at `/implementation-plan` time found the assumed route, file, and client-side AJAX/SSE layer did not exist — corrected here rather than silently reinterpreted. Original text preserved in `decisions.md` for audit trail.

Files: `src/web-ui/modules/merge-artefact-edits.js` (new: three-way merge pure function — unchanged from original), `src/web-ui/modules/concurrent-edit-buffer.js` (new: in-memory per-journeyId+stageName save-request buffer with injectable clock, modeled on the existing `modules/presence-store.js` pattern), `src/web-ui/modules/feature-edits.js` (new: `feature_edits` table bootstrap + record-writing function, modeled on `modules/artefact-comments.js`), `src/web-ui/adapters/fake-test-db.js` (modify: add narrow query-shape branches for `feature_edits` INSERT/SELECT, same companion-fix requirement `dsa-s1` already established for `artefact_comments`), `src/web-ui/modules/artefact-merge-broadcast.js` (new: in-memory pub/sub registry so a merge triggered by one request can push to every open SSE connection for that journeyId+stageName, not just the two requests involved), `src/web-ui/routes/journey.js` (modify the REAL save handler `handlePostJourneyStageArtefact` — not `features.js`, which has no artefact-save route at all — to branch on JSON vs form-encoded body: JSON requests run the new concurrency-detect → merge → record → broadcast flow and respond with JSON; existing form-encoded requests keep their current redirect behavior unchanged, for backward compatibility with any caller not yet updated), plus a new `GET /api/journey/:journeyId/stage/:stageName/artefact-merged` SSE route in `journey.js`/`server.js` subscribing to the broadcast registry, `src/web-ui/public/artefact-edit-merge.js` (new client script — `editor.js` does not exist; the real edit-mode markup, `journey.js` line ~1180, is a plain `<form method="POST">` with a full-page redirect-GET on save today, with zero AJAX. This new script intercepts the form submit, POSTs JSON via `fetch`, and opens an `EventSource` against the new SSE route to receive pushed merge updates)
Services: Postgres (`feature_edits` table write, existing pool), Node.js HTTP server (in-memory concurrent-detection buffer + in-memory SSE broadcast registry — single-instance assumption, matching this codebase's own existing `presence-store.js` precedent), SSE stream for client push (new, modeled on `handleGetJourneyPresenceStream`'s existing SSE header/write/cleanup convention — but event-driven-on-merge rather than that handler's own periodic-interval-poll pattern, since a merge is triggered by an unrelated concurrent request, not a timer)
APIs: `POST /api/journey/:journeyId/stage/:stageName/artefact` (the real, existing save route — modified to add a JSON-body branch alongside its existing form-encoded behavior); `GET /api/journey/:journeyId/stage/:stageName/artefact-merged` (new SSE stream, replaces the DoR's originally-assumed `/api/features/{featureId}/artefacts/{name}/merged` path — this feature has no `featureId`-based artefact routes; everything is `journeyId`+`stageName`-scoped in the real code)

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

### Touch Points (Binding Contract) — CORRECTED 2026-09-20, see decisions.md

**Files you MUST modify/create (real, independently verified against the current codebase — do not rely on the section below unmodified from this point forward, only this corrected list):**
- `src/web-ui/modules/merge-artefact-edits.js` — new file: pure function `mergeArtefactEdits(baseContent, userAContent, userBContent)` that performs three-way merge and returns `{ merged, lineAttributions }` where lineAttributions is a JSON object mapping line numbers to user IDs. Throws with `code: 'MERGE_CONFLICT_HARD'` on an unresolvable overlap.
- `src/web-ui/modules/concurrent-edit-buffer.js` — new file: in-memory buffer keyed by `journeyId + ':' + stageName`, recording each incoming save's `{userId, content, timestamp}`; exposes a check for "was there another save for this key within the last 100ms" plus an injectable `_now()`/`setNow()` matching `modules/presence-store.js`'s own established pattern exactly (needed for AC1's own test-plan requirement: "Mock clock or timestamp control for precise 100ms window simulation").
- `src/web-ui/modules/feature-edits.js` — new file: `migrateFeatureEditsSchema(pool)` (idempotent `CREATE TABLE IF NOT EXISTS`, modeled on `modules/artefact-comments.js`'s own `migrateArtefactCommentsSchema`) plus a `recordEdit(pool, {...})` writer function.
- `src/web-ui/adapters/fake-test-db.js` — modify: add narrow query-shape branches for `feature_edits` INSERT/SELECT (this codebase's fake in-memory DB, used whenever `DATABASE_URL` is unset, needs an explicit branch per table's exact query shape — the generic catch-all returns empty rows and breaks any caller reading `result.rows[0]`, the exact same gap `dsa-s1` hit and fixed for `artefact_comments`).
- `src/web-ui/modules/artefact-merge-broadcast.js` — new file: in-memory pub/sub keyed by `journeyId + ':' + stageName` (`subscribe(key, res)`, `unsubscribe(key, res)`, `publish(key, payload)`) so a merge triggered by one request's arrival can push to every open SSE connection for that journey+stage, not just the two requests that triggered it.
- `src/web-ui/routes/journey.js` — modify `handlePostJourneyStageArtefact` (the REAL save handler — NOT `features.js`, which has no artefact-save route at all in this codebase): branch on request `Content-Type`. Existing form-encoded (`application/x-www-form-urlencoded`) requests keep their current behavior unchanged (write file, 302 redirect) — do not regress this path. New `application/json` requests run: read base content from disk, check `concurrent-edit-buffer` for a recent other-user save on the same key, if concurrent call `mergeArtefactEdits()`, write the (merged or plain) content to disk, call `feature-edits.recordEdit()`, call `artefact-merge-broadcast.publish()` for this key, respond with JSON `{content, merged: bool, lineAttributions}`. Also add a new SSE route (`GET /api/journey/:journeyId/stage/:stageName/artefact-merged`, wired in `server.js` matching the existing `handleGetJourneyPresenceStream` route-wiring pattern) that subscribes to `artefact-merge-broadcast` for that key and pushes each `publish()`'d payload as an SSE `data:` event.
- `src/web-ui/public/artefact-edit-merge.js` — new client script (there is no pre-existing `editor.js` anywhere in this codebase). Intercepts the edit-mode `<form>`'s submit event (`preventDefault()`), POSTs the textarea content as JSON via `fetch()` to the same save URL, updates the textarea with the response's `content` on success, and opens an `EventSource` against the new SSE route on page load to receive pushed merge updates from a concurrent save triggered by the OTHER user's request. Wired into `journey.js`'s edit-mode render via a new `<script src="/public/artefact-edit-merge.js"></script>` tag, matching the existing `<script src="/public/presence-sidebar.js"></script>` inclusion convention.

**Files you MUST NOT modify:**
- Feature presence sidebar (ep2-s1)
- Stage list rendering (ep2-s2)
- Sign-off modal / approval flow (ep2-s3)
- Feature creation or pod assignment flow (ep1-s1 through ep1-s3)
- The existing form-encoded request-handling branch of `handlePostJourneyStageArtefact` — its current behavior (write file, 302 redirect) must remain byte-for-byte unchanged for any caller that doesn't send `Content-Type: application/json`

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