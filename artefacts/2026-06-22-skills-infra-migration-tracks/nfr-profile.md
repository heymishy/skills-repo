# NFR Profile — Skills Infrastructure and Schema-Migration Pipeline Tracks

**Feature:** skills-infra-migration-tracks
**Date:** 2026-06-25
**Status:** Active

---

## Performance

- `check-pipeline-state-integrity.js` (extended by shr.1) must complete in under 5 seconds on a pipeline-state.json with 30+ features
- Skills (infra-definition, infra-review, infra-plan, schema-migration-plan, schema-migration-review) are human-paced interactive sessions — no latency SLA; completion time is measured as M1 (under 30 minutes for full infra track)
- No other performance targets identified

## Security

- Skill instruction texts for inf.1, inf.2, inf.3, mig.1, mig.2 must include explicit warnings against pasting credentials, tokens, or production connection strings into plan/preview attachment fields or migration command fields
- Path-traversal guard (CLAUDE.md ougl) must be applied to `ops/`-prefixed artefact paths in shr.2 — `path.resolve(artefactPath).startsWith(path.resolve(repoRoot) + path.sep)` must hold for all `ops/` paths
- Trace records (inf.5, mig.4) must store artefact path and SHA-256 hash only — no artefact content, no migration SQL, no infra plan text
- No credentials, tokens, or personal data in pipeline-state.json or any committed artefact (MC-SEC-02)

## Data Classification

**Internal** — artefacts produced by the infra and migration tracks may describe infrastructure topology (tier names, resource types, blast-radius scope) and migration SQL. No PII. No production credentials (actively prohibited by security NFR above). Artefacts are committed to the repository and accessible to anyone with repo access.

## Data Residency

Not applicable — all artefacts are local filesystem files committed to the repository. No cloud storage, no external service.

## Availability SLA

Not defined — the skills platform is a local/offline tool. No uptime requirement.

## Compliance Frameworks

None — no regulatory clause NFRs identified in discovery. No PCI-DSS, GDPR, SOX, or HIPAA scope in this feature.

## NFRs with Named Regulatory Clauses

None — human sign-off at DoR is not required on regulatory grounds. Standard medium-oversight PR review applies.

---

## NFR Coverage per Story

| Story | Performance | Security | Notes |
|-------|-------------|----------|-------|
| shr.1 | integrity check ≤5s | fields are paths only | |
| shr.2 | N/A | path-traversal guard for ops/ paths | |
| inf.1 | N/A | no-credentials warning in skill text | |
| inf.2 | N/A | secrets check in review checklist | |
| inf.3 | N/A | no-credentials warning | |
| inf.4 | N/A | finding text must not expose artefact content | |
| inf.5 | N/A | SHA-256 hash only in trace record | disk-canonicity rule |
| mig.1 | N/A | no-credentials warning in skill text | |
| mig.2 | N/A | no-credentials check in review checklist | |
| mig.3 | N/A | finding text must not expose migration SQL | |
| mig.4 | N/A | SHA-256 hash only in trace record | disk-canonicity rule |
| mig.5 | N/A | warning against production connection strings in template | |
