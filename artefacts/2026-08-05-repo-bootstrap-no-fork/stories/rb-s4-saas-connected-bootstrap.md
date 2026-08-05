## Story: Bootstrap an existing repo from a DoR-approved SaaS artefact

**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e2-saas-connected-bootstrap-and-outer-loop.md
**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Domain:** [api, security] — story's scope clearly touches both: it consumes a REST API from the SaaS backend and handles an authentication credential end to end.

## User Story

As a **SaaS-hosted consumer reaching the outer-loop/inner-loop boundary**,
I want to **run the bootstrap command against my own existing repo and have it fetch my already-DoR-approved artefact and pipeline-state from the SaaS**,
So that **I can start the inner loop against real, already-approved scope without forking or cloning the platform to get there**.

## Benefit Linkage

**Metric moved:** SaaS-to-inner-loop conversion rate
**How:** This story is the entire mechanism the metric measures — completing it is what makes conversion from a DoR-approved SaaS artefact to a running inner loop possible at all.

## Architecture Constraints

- **`product/constraints.md` #12** (credentials are structural, never in the agent's environment) — the credential used to authenticate to the SaaS API must live in a secrets store (or be passed via an interactive, non-logged prompt at invocation time), never written to a file, environment variable the agent can read, or committed artefact.
- **`product/constraints.md` #11** (no persistent agent runtime dependency) — the only network dependency this story introduces is a single request/response to the existing SaaS API; no new persistent service is required.
- **Platform-availability note (D2-platform applied):** No existing SaaS endpoint currently exports a DoR-approved artefact + pipeline-state bundle for external consumption (`src/web-ui/routes/artefact.js`'s `handleArtefactRoute` renders artefact content for in-app viewing only, not an authenticated external-fetch contract). **This story's scope explicitly includes building that minimal export endpoint** — it is within this same codebase's delivery control, not a wait on an external vendor, so the D2-platform gate's deferral requirement does not apply. AC4 verifies the endpoint's own behaviour directly; the CLI's consumption of it is verified by AC1–AC2.
- **Reuse, not reimplementation (ASSUMPTION-invalidated, see `decisions.md` 2026-08-05):** `scripts/platform-fetch.js` already establishes the "fetch from a source, write to target, log the fetch" pattern this story needs — just against a local directory source today. This story's CLI-side fetch logic should follow the same shape (resolve source, copy/write content, write a fetch-log entry under `workspace/`) rather than inventing an unrelated fetch mechanism, even though the source here is a SaaS API endpoint rather than a local directory.
- **Injectable adapter rule (D37, found at /definition-of-ready):** Both the CLI's credential-resolution/fetch logic and the new export endpoint's data-access logic need to be swappable for testing (per `src/web-ui/routes/artefact.js`'s existing `setFetcher` precedent) without hitting a real network call or prompt. Per D37: the stub default MUST throw (`Adapter not wired: <name>. Call set<Name>() with a real implementation before use.`), never silently return empty/fake data. AC5 below scopes the production wiring explicitly.

## Dependencies

- **Upstream:** rb-s1, rb-s2, rb-s3 (the bootstrap mechanism this story wires into must exist first)
- **Downstream:** rb-s5 (optional outer-loop install) applies to this entry point as well as the fresh-repo one

## Acceptance Criteria

**AC1:** Given a user has a DoR-approved feature in the SaaS and an existing local repo, When they run the bootstrap command with a flag identifying that feature's slug, Then the command authenticates to the SaaS API using a credential supplied via secure prompt (never a plain environment variable or committed file) and fetches that feature's DoR-approved artefact and pipeline-state entry.

**AC2:** Given the fetch succeeds, When the command completes, Then the local repo contains the full skill set and registry (per `rb-s2`) plus the fetched artefact and pipeline-state entry written to their conventional paths (`artefacts/[slug]/...`, `.github/pipeline-state.json`), ready for `/branch-setup` to consume immediately.

**AC3:** Given the user's credential does not have access to the requested feature slug, When the command attempts the fetch, Then it returns a clear 403-equivalent error naming the access problem — it does not silently fall back to a fresh-repo bootstrap or fabricate placeholder content.

**AC4:** Given the export endpoint has been implemented and a feature is DoR-approved, When a request is made with a credential valid for that feature's tenant, Then the endpoint returns 200 with the artefact content and pipeline-state entry matching exactly what the SaaS UI itself shows for that feature — no divergent or stale copy.

**AC5:** Given the export endpoint's data-access logic is exposed via an injectable adapter (e.g. `setExportDataSource(fn)`, mirroring `artefact.js`'s existing `setFetcher` pattern), When the adapter has not been explicitly wired to a real implementation, Then calling it throws `Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.` — it never silently returns null, empty, or placeholder data. The production wiring (`setExportDataSource(realExportDataSource)` in `server.js`) is verified by a test asserting two different DoR-approved features resolve to two different, individually-correct artefact/pipeline-state payloads — not merely that a function reference was assigned.

## Out of Scope

- Building anything beyond the minimal export endpoint needed for this story (e.g. a general-purpose public API for third-party integrations) — that would be a separate, much larger initiative.
- The optional full-outer-loop install flag — `rb-s5`.

## NFRs

- **Performance:** Fetch-and-materialize completes in under 15 seconds under normal network conditions.
- **Security:** Credential never logged, never written to disk in plaintext, never included in any error message; fetch uses HTTPS only.
- **Accessibility:** Not applicable — CLI tool.
- **Audit:** The SaaS-side export endpoint logs each fetch (who, which feature slug, when) — this is the first point in this feature where a SaaS-side audit record exists, since it is real user-identified access to artefact content.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
