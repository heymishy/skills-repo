# Decisions: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

---

## RISK-ACCEPT: AC6 (real backlog clearance) cannot be verified by a local automated test

**Date:** 2026-09-05
**Context:** No real Neon database or real backlog is available in this local test environment -- whether this fix actually clears the currently-existing 2260+ tenant backlog can only be confirmed by a real CI or scheduled purge run.
**Decision:** AC1-AC5 (the query-shape and chunking logic) are covered by automated tests against a fake DB. AC6 (does the real backlog actually clear) is confirmed via mandatory manual observation of the next real run's own log output.
**Rationale:** Matches the established precedent this session for real-deploy-dependent behaviour. Given this story's own stated urgency (an active, growing production data-hygiene problem), this check is treated as load-bearing, not optional -- explicitly named as such in the DoR contract's own Coding Agent Instructions.
