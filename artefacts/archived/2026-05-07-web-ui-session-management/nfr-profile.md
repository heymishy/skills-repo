# NFR Profile — 2026-05-07-web-ui-session-management

**Feature:** Web UI Session Management (wsm.1–wsm.3)
**Discovery reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Created by:** /definition-of-ready
**Date:** 2026-05-08

---

## Data Classification

**Classification:** Internal tooling — operator-authored pipeline artefacts and session turn history.
**PII handled:** Session turn content may contain operator-authored text (delivery artefact text, story ACs, etc.). No external PII, no credentials.
**Special constraint:** `accessToken` (GitHub OAuth token) stored in `req.session.accessToken` MUST NEVER be written to disk at any point (wsm.1 AC2). This is a hard security constraint.
**Regulated scope:** Non-regulated (`.github/context.yml: regulated: false`).
**Data residency:** Local filesystem (`SESSION_STORE_PATH`) — single server instance only.

---

## Compliance NFRs

None. No named regulatory clauses apply. No human compliance sign-off required.

---

## NFR Items

| ID | Category | Description | Coverage | Status |
|----|----------|-------------|----------|--------|
| NFR-sec-no-accesstoken-disk | Security | `accessToken` MUST NOT be written to the session store file. Serialiser strips it before every write. Verified by reading the file after write and asserting no `accessToken` key. | wsm.1 AC2 + T2 | Met by test |
| NFR-sec-ownership-serverside | Security | Journey ownership is verified server-side using the GitHub login stored in the session. `ownerId` is never accepted from the client request body. Spoofed `ownerId` in request body is ignored. | wsm.2 AC7 + T8 | Met by test |
| NFR-sec-viewer-restriction | Security | Viewer users (authenticated but not the owner) cannot submit turns. POST to turn endpoint as viewer returns 403. | wsm.2 AC7 + T3 | Met by test |
| NFR-rel-session-write-failure | Reliability | A single session file write failure (disk full, permissions) must not crash the server. Error is logged at ERROR level; mutation completes in memory. | wsm.1 T7 | Met by test |
| NFR-rel-invalid-json-startup | Reliability | A corrupt session file in SESSION_STORE_PATH must not prevent server startup. Invalid files are logged at WARN and skipped. | wsm.1 T4 | Met by test |
| NFR-perf-viewer-sync | Performance | Viewer state updates visible within 5 seconds of owner completing a turn (polling or SSE). | wsm.2 AC1 + T4 | Met by test |
| NFR-perf-viewer-fanout | Performance | Viewer SSE / polling must add no more than 50ms median latency to owner turn submissions. | wsm.2 NFR | Smoke test |
| NFR-consistency-needs-review | Consistency | `needs-review` flag propagation (wsm.3) and the disk write (wsm.1) occur atomically in the same synchronous operation. A crash after memory update but before disk write must not leave an inconsistent journey. | wsm.3 NFR | Met by design (synchronous write in same request cycle) |
| NFR-nodeps-wsm | Zero new npm dependencies | All wsm stories: zero new npm packages. Node built-ins only (`fs`, `path`, `crypto`, `os`). | All story architecture constraints | Met by constraint |

---

## Sign-off

**Compliance review required:** No — non-regulated scope.
**Security review:** NFR-sec items verified by automated test (ACs explicitly require them). Special attention: NFR-sec-no-accesstoken-disk is a hard security constraint with explicit test coverage.
**Data classification sign-off:** Hamis — 2026-05-08 (sole operator, non-regulated personal repo).
