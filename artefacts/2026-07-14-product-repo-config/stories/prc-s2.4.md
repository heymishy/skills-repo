## Story: Resolve journey.js's local artefact writes to the product's own repo

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **web UI operator running the outer loop**,
I want to **have every artefact written during a skill run (discovery.md, stories, test-plans, etc.) land in my product's own repo, not a shared ephemeral path**,
So that **the full outer-loop artefact set — not just sign-offs and annotations — is real, durable, and git-tracked**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** This is the largest remaining gap for Metric 1 — most outer-loop artefact writes (discovery.md, stories, test-plans, DoR files) go through `journey.js`'s `fs.writeFileSync` path, not the Contents API paths fixed in prc-s1.3/prc-s2.3. Without this story, Metric 1's "DoR-ready artefact set in the product's repo" claim is only partially true.

## Architecture Constraints

ADR-020: every write, including this one, must ultimately use the operator's own OAuth token; this story converts `journey.js`'s direct filesystem writes to go through the same Contents/Git Data API mechanism as prc-s2.2's bootstrap, not a local disk write at all. `repo-root.js`'s existing `WUCE_TENANT_ROOT_BASE` tenant-scoping mechanism is superseded by this story for repo-backed products — it was never activated in production and doesn't distinguish products within a tenant.

## Dependencies

- **Upstream:** prc-s1.1, prc-s1.2/prc-s2.1 (needs a configured repo), prc-s2.2 (reuses the batch-commit mechanism bootstrap introduced)
- **Downstream:** Epic 3's standards conversion builds on this same write mechanism.

## Acceptance Criteria

**AC1:** Given a product with a connected repo, When an outer-loop skill run writes an artefact (e.g. `discovery.md`), Then the content is committed to that product's repo via the Contents/Git Data API, not written to local disk.

**AC2:** Given the existing durable-backup behaviour (Postgres `artefacts` table via `journey-store-pg.js`), When this story ships, Then that backup write is unchanged — git is now the primary/canonical write, Postgres remains the durability backstop, not replaced.

**AC3:** Given a product with no connected repo, When an outer-loop skill run attempts to write an artefact, Then the write is rejected with a clear "this product has no repo configured" error before any skill session can begin — not discovered partway through a run.

**AC4:** Given multiple artefact writes happen across a single skill session (e.g. discovery.md, then later a story file), When each write completes, Then each lands as its own commit — not batched into one giant commit spanning an entire session — so git history remains a meaningful, readable record of the session's progression.

## Out of Scope

- Rewriting `journey.js`'s in-session read logic (mid-flow reads of already-written content) — this story only changes the write side; reads can still use whatever caching/local mechanism already exists as long as writes are git-canonical.
- Migrating already-in-flight sessions at deploy time.

## NFRs

- **Performance:** Each artefact write is a synchronous API call in the request path — acceptable within existing skill-turn latency budgets, but worth flagging as a real behavioural change from local disk writes (near-instant) to network calls (Contents API round-trip).
- **Security:** Fail-closed (AC3) is mandatory.
- **Accessibility:** Not applicable.
- **Audit:** Each commit is itself the audit trail — no separate logging needed beyond what git provides.

## Complexity Rating

**Rating:** 3
<!-- Touches the most call sites of any story in this feature — journey.js is 3700+ lines with many write call sites. -->
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
