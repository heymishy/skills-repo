# Implementation Plan: Bootstrap a newly created repo with the skills framework

**Story:** prc-s2.2
**Feature:** 2026-07-14-product-repo-config
**Date:** 2026-07-15
**Tasks:** 4

## File Map

| File | Purpose | Type |
|------|---------|------|
| src/web-ui/modules/repo-bootstrap.js | Bootstrap orchestration using GitHub Git Data API | New |
| 	ests/check-prc-s2.2-bootstrap-repo.js | Integration tests for all 4 ACs | New |
| src/web-ui/routes/products.js | Wire bootstrap call after repo creation | Modify |
| src/web-ui/server.js | Wire real GitHub API implementation | Modify |

## Task 1: Bootstrap module with API tests

Create src/web-ui/modules/repo-bootstrap.js implementing GitHub Git Data API (tree/blob/commit) orchestration.
Create 	ests/check-prc-s2.2-bootstrap-repo.js with 4 integration tests:
- AC1: Commits framework content under operator identity
- AC2: API-only path (tree/blob/commit) genuinely invoked  
- AC3: Output structure matches platform-init.js COPY_DIRS
- AC4: Fallback (if used) respects user token

Expected test output: All 4 tests pass

## Task 2: Wire implementation in server.js

Add production wiring of ealBootstrapRepo via setBootstrapAdapter in src/web-ui/server.js

Expected output: No module errors on server startup

## Task 3: Integrate with product creation

Call ootstrapRepo in src/web-ui/routes/products.js after repo creation succeeds

Expected output: Bootstrap commit SHA returned in response

## Task 4: Verify and commit

Run targeted tests, check for conflict markers (D40), commit all changes

Expected output: All tests pass, 0 failures
