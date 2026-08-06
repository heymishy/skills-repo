## Story: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Epic reference:** artefacts/2026-08-06-durable-artefact-storage/epics/das-e1-durable-artefact-storage.md
**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-durable-artefact-storage/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As a **real SaaS operator running their own delivery pipeline through the hosted product**,
I want to **have each completed stage's artefact committed to my product's connected GitHub repo, not just the hosting container's local disk**,
So that **I can still resume and review my work via "Resume conversation" even after the app has been redeployed since I completed that stage**.

## Benefit Linkage

**Metric moved:** Cross-redeploy artefact durability (0% → 100%)
**How:** Completing this story means a completed stage's artefact is durably committed to the product's own repo at completion time, and the "Resume conversation" read path falls back to git when the local copy is missing — so the durability target is achieved by construction, not by hope.

## Architecture Constraints

- **ADR-023** (Disk canonicity rule): `priorArtefacts.content` used for cross-stage handoff context must be read from disk via `fs.readFileSync`, never from `session.artefactContent`. This story's local-disk write is unchanged and continues satisfying that rule — the git commit is additive, not a replacement.
- **ADR-025** (Multi-tenancy, application-layer `tenant_id` scoping): the git commit's owner/repo resolution must go through the same tenant_id-scoped `products` lookup `mtrr-s1`'s `ownerRepoForFeature` already built — no new isolation mechanism.
- **Existing precedent to reuse, not reinvent:** `src/web-ui/adapters/sign-off-writer.js`'s `commitSignOff(artefactPath, payload, token, owner, repo)` already implements the exact GitHub Contents API PUT mechanics this story needs (real user identity as commit author — never a service account, base64 content encoding, `sha` handling for updates, 409 conflict handling, fail-closed when `owner`/`repo` are missing). Generalise or directly reuse this pattern rather than writing a second, parallel commit helper.

## Dependencies

- **Upstream:** `mtrr-s1` (tenant-scoped repo resolution) — this story reuses `ownerRepoForFeature(slug, credential)` from `src/web-ui/adapters/export-data-source.js` directly. `[External: mtrr-s1 lives in artefacts/2026-08-06-multi-tenant-repo-resolution/, not this feature's own stories/ dir — merged as PR #670, confirmed by operator on 2026-08-06]`
- **Downstream:** None — Story 2 (repo-required gate) is not a hard technical dependent of this story; risk-first sequencing builds this story first for validation purposes, not because Story 2's code requires it.

## Acceptance Criteria

**AC1:** Given a product with a connected repo (`repo_owner`/`repo_name` set) completes a stage, When the stage's artefact is saved, Then the artefact content is committed to that product's repo at the same path convention already used for artefacts (`artefacts/<slug>/<stage>.md`), in addition to the existing local-disk write.

**AC2:** Given the git commit at stage-completion fails (GitHub API error, revoked token, rate limit), When this happens, Then the stage is NOT marked complete in the journey store, and the operator sees a clear, actionable error — never a silently "completed" stage with no durable backing.

**AC3:** Given a journey's local artefact file is missing (e.g. after a redeploy) but the corresponding git commit succeeded previously, When an operator visits the "Resume conversation" / stage-view route for that stage, Then the page renders the artefact content fetched from git instead of showing "No artefact content found."

**AC4:** Given a product has no connected repo (an existing repo-less product, out of scope for the gate per Story 2), When a stage completes, Then the local-disk write proceeds exactly as it does today — no git commit attempted, no error surfaced, no regression for existing repo-less products.

**AC5:** Given both the local artefact file is missing and the git fetch also fails (repo access revoked, network error), When an operator visits the stage-view route, Then the page shows a clear, honest "artefact not found" message — never a silent blank panel that looks like a working page.

## Out of Scope

- **Committing edited/re-saved artefact content to git.** The existing inline-edit flow (`?edit=true`, `POST /api/journey/:id/stage/:stage/artefact`) only writes to local disk today, and this story does not extend it to also commit to git — meaning edits made after the initial stage-completion commit remain only locally durable. This is a known, real gap deliberately deferred, not silently missed: flag as a follow-on story if edit-durability turns out to matter in practice.
- **Recovering already-orphaned journeys** — pre-launch staging data, not real customer artefacts (epic-level exclusion).
- **Any change to `mtrr-s1`'s own export-resolution logic** (`ownerRepoForFeature`, `export-data-source.js`) — that story is done and merged; this story only consumes it.

## NFRs

- **Performance:** The added git commit at stage-completion adds no more than ~2 seconds to stage-completion response latency, verified via the E2E test's own timing assertions.
- **Security:** The commit author is always the operator's own OAuth identity — never a service account (per `product/constraints.md` #12), matching `sign-off-writer.js`'s existing pattern exactly.
- **Accessibility:** Not applicable — no new UI in this story.
- **Audit:** The git commit itself is the audit trail (a real commit with a real author and timestamp) — no separate audit log needed for this story's write path.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
