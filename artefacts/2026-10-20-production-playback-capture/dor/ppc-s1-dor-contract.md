# DoR Contract Proposal: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md`
**Date:** 2026-10-21

---

## What will be built

- A new route module (e.g. `src/web-ui/routes/playback-review.js`) exposing:
  - `GET` — lists a feature's ACs, scoped by `req.session.tenantId` AND the feature's `product_id` (never `tenant_id` alone). "DoD-complete" is checked via `journeys.data.completedStages` containing a `definition-of-done` entry (confirmed literal string, `journey.js`/`products.js`).
  - `POST` — stores a capture target `{acId, url, selector}` into `journeys.data.captureTargets` (existing JSONB column, no schema migration).
  - `POST` — triggers single-AC capture: seeds a new, route-callable adapter (bridging `req.sessionId` to an authenticated Playwright page) with the current session, then calls the existing `captureAcScreenshots` (reused as-is) against the stored target.
- A **new** D37 adapter: `req.sessionId` → authenticated Playwright page. Confirmed at DoR this does not already exist (`rpca`'s own mechanism is CLI-only). Stub throws until wired in `server.js`; wiring verified by AC8's own behavioural test.
- **Extension** (not new) of `src/web-ui/adapters/artefact-commit-writer.js`'s `commitArtefact`/`realCommitArtefact` to accept base64-encoded binary content, so captured screenshots commit to the tenant's own connected repo via the existing GitHub Contents API path — never a local `fs.writeFileSync`, so the local path-traversal-guard pattern doesn't directly apply, but `artefactPath` is still derived only from validated `feature_slug`/`acId` values, never raw request input.

## What will NOT be built

- Automatic AC→screen target derivation (deferred fast-follow, `decisions.md` 2026-10-21 DESIGN entry).
- Looping across all ACs in one action (`ppc-s2`).
- Rate limiting the trigger endpoint (`ppc-s3`).
- Video capture, redaction, ffmpeg polish (epic-level out of scope).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Tenant+product scoping and `completedStages` check | unit + integration |
| AC2 | `captureTargets` write persists via real Postgres layer | unit + integration |
| AC3 | Cookie seeded from `req.sessionId`; navigates to stored target | integration (mocked Playwright) |
| AC4 | "Not set" state rendering | unit |
| AC5 | Inline screenshot render | unit + integration |
| AC6 | Cross-tenant `feature_slug` collision isolation | integration (seeded DB) |
| AC7 | Direct cross-tenant access blocked, no metadata leak | integration (seeded DB) |
| AC8 | New adapter: stub throws; wiring behaviourally verified | unit + integration |

## Assumptions

- `journeys.data.completedStages` entries using `skillName: 'definition-of-done'` is confirmed (not assumed) via direct code read of `journey.js`/`products.js` as the literal, consistently-used string.
- A tenant's product must already have a connected repo (`repo_owner`/`repo_name` set via `product-repo.js`) before this surface is reachable meaningfully — if not configured, the surface should show a "connect a repo first" state. Not currently a named AC; flagged here as an implementation assumption the coding agent should surface as a PR comment if it finds the surface is reachable with no connected repo and no graceful state.
- GitHub's Contents API accepts arbitrary base64 content regardless of text/binary origin — the existing `commitArtefact` mechanics generalise to binary without needing a structurally different API call, only a different encoding step before the PUT.

## Estimated touch points

**Files:** `src/web-ui/routes/playback-review.js` (new), `src/web-ui/adapters/artefact-commit-writer.js` (extend), a new session-to-Playwright adapter module (new, D37), `src/web-ui/modules/journey-store.js` / `journey-store-pg.js` (add `isDodComplete`/`captureTargets` helpers), `server.js` (route registration + new adapter wiring).
**Services:** Postgres (`journeys.data` JSONB), GitHub Contents API (tenant's own OAuth token), Playwright (headless capture).
**APIs:** New internal routes only; no new external API surface.

---

## Contract Review

Checked against all 8 ACs and the test plan — no mismatches found. AC8 was added during this DoR review specifically because the Contract Proposal process surfaced a real H-ADAPTER gap (the new session-to-Playwright adapter had no wiring AC) — the story, test plan, and verification script were all updated in place before this contract was finalised, not worked around.

✅ **Contract review passed** — proposed implementation aligns with all 8 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | "Tenant Product Owner" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 8 ACs |
| H3 | Every AC has ≥1 test | ✅ | Confirmed against `ppc-s1-test-plan.md` |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 1 — Self-service DoD validation adoption |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2 review: 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | "Coverage gaps: None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies = "None within this feature" → schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated; Category E in `/review` Run 1/2 found no HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md`, Status: Active |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ (N/A) | No compliance NFRs identified |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile exists when story declares NFRs | ✅ | Story has real NFRs; profile exists |
| H-GOV | `## Approved By` in discovery.md has ≥1 non-blank, non-engineering-only entry | ✅ | "Hamish King — Platform Owner — 2026-10-21" (read live from the file, not pipeline-state.json) |
| H-ADAPTER | New adapter has an explicit wiring AC, throwing stub, separate wiring task | ✅ | AC8, added during this DoR review |
| H-INF | Infra-plan gate | ✅ (skipped) | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ (skipped) | `hasMigrationTrack` absent |
| H-DESIGN | Design-token gate | ✅ (skipped) | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM remain after Run 2) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet walked through end-to-end by anyone before coding starts | RISK-ACCEPT — Hamish King, 2026-10-22, see `decisions.md` |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

Domain tags: `[web-ui, auth, security]`
Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/auth/auth-patterns.md`, `.github/standards/security/security-standards.md`

All three will be appended in full to the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth — artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules (require), matching this repo's existing src/web-ui/ convention.
- Reuse captureAcScreenshots and commitArtefact as-is for their existing behaviour;
  extend commitArtefact for base64 binary content rather than writing a parallel mechanism.
- Build the new session-to-Playwright adapter following the D37 pattern exactly:
  stub throws, setter exported, production wiring in server.js as its own task.
- Do NOT use the NODE_ENV=test auth-bypass fixture (seedTestSession/GET /test/session)
  anywhere in this story's capture path — ADR-018 requires the real req.sessionId only.
- Access-control check must filter by BOTH tenant_id AND product_id, never tenant_id alone.
- Do NOT reuse /playback's data path (journey-store.js's getJourneyByFeatureSlug) for
  any tenant-facing read in this story — confirmed cross-tenant leak risk.
- session_id must never appear in a response body or be logged.
- Video capture, redaction, ffmpeg polish, the full-feature loop, and rate limiting
  are explicitly out of scope — do not build them in this story's PR.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### From .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
[Full file content — injectable adapter pattern (D37/ADR-009), session token access
(req.session.accessToken canonical field), path traversal guard for disk writes
(not directly applicable here — this story commits via GitHub API, not local fs —
but the same path-validation discipline applies to artefactPath), and the other
sections of this file apply wherever relevant to routes/handlers touched by this story.]

### From .github/standards/auth/auth-patterns.md (domain: auth)
[Full file content — req.session.accessToken is the canonical OAuth token field
(distinct from req.sessionId, the session identifier used by this story's new
adapter); never req.session.token.]

### From .github/standards/security/security-standards.md (domain: security)
[Full file content — OWASP Top 10 mitigations; note the file's own "Known gaps"
section already documents that GET /features/:slug (handleGetFeatureArtefacts)
has no tenant-ownership check — this is the existing, independently-confirmed
reason this story does not reuse that route's data path.]
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Share the DoR artefact with the tech lead (no named tech lead configured for this solo-operator repo — operator's own explicit awareness confirmation stands in).
**Signed off by:** Hamish King (Platform Owner), 2026-10-22

**Definition of ready: PROCEED**
