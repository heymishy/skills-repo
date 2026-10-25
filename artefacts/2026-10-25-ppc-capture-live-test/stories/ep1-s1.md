## Story: Run Live Capture Session and Confirm Durable Record
**Epic reference:** artefacts/2026-10-25-ppc-capture-live-test/epics/live-capture-verification.md
**Discovery reference:** artefacts/2026-10-25-ppc-capture-live-test/discovery.md
**Benefit-metric reference:** artefacts/2026-10-25-ppc-capture-live-test/benefit-metric.md
**Domain:** None
## User Story
As a **Platform operator / maintainer**,
I want **to run a live production session against the deployed playback-evidence capture mechanism and confirm that at least one structurally valid capture record is written to the configured GitHub repository storage path and is retrievable after the session completes**,
So that **I can trust the capture pipeline as a production signal source for the improvement loop**.
## Benefit Linkage
Capture record exists and is structurally valid post-session — completing this story produces the first confirmed production evidence that the capture pipeline functions end-to-end, moving the baseline from 0 records to ≥ 1.
## Architecture Constraints
ADR-020 — the capture mechanism writes to GitHub repository storage using the authenticated user's OAuth token (implemented in ppc-s1/s2/s3; this story does not modify that path). ADR-029 — the GitHub repository storage path is the canonical record; verification reads from there, not from an in-memory or session-local copy.
## Dependencies
None — ppc-s1/s2/s3 already deployed to production
## Acceptance Criteria
Given I am authenticated as the platform operator in the live production web UI and the ppc-s1/s2/s3 capture mechanism is deployed,
When I complete a discovery skill session that triggers the capture pipeline,
Then at least one file is written to the configured artefacts path in the GitHub repository, the file is a non-empty well-formed PNG image, and the GitHub commit completed successfully with no partial or failed write.

Given the capture record has been written to GitHub repository storage,
When I access the tenant-scoped screenshot route in the web UI,
Then the route returns and renders the same PNG file that was committed, confirming the record is retrievable via both verification surfaces.
## Out of Scope
- Verifying capture records for any session other than the one run during this verification exercise
- Evaluating the visual or semantic content of the captured screenshot
- Testing failure paths, retry logic, or error handling in the capture pipeline
## NFRs
None
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
