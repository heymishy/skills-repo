# DoR Contract Proposal: Rebuild the standards DB cache from git content

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.2.md

## What will be built

A cache-rebuild adapter (ADR-012 adapter-shaped, testable independent of live GitHub calls) that: updates the `standards` table row in the same request as a `prc-s3.1` write, can fully reconstruct the table from git content given an empty table, and performs read-time reconciliation so out-of-band git edits (e.g. via IDE) are reflected on next read.

## What will NOT be built

`standardsList`'s actual route wiring to this cache — `prc-s3.3`. Real-time push-based sync — explicitly out of scope per discovery.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Trigger a prc-s3.1 write, assert cache row updates same-request | Integration |
| AC2 | Empty table + populated mocked git content across 2 products, assert full rebuild | Integration |
| AC3 | Stale cache + changed mocked git content, assert read reflects current content | Integration |

## Assumptions

Read-time reconciliation is a lightweight check (e.g. a content hash/ETag comparison), not a full content re-fetch on every read — per the NFR test's own performance requirement.

## Estimated touch points

Files: new cache-rebuild adapter module
Services: GitHub Contents API (read), Postgres (`standards` table)
APIs: `GET /repos/{owner}/{repo}/contents/standards/` (directory listing + content read)
