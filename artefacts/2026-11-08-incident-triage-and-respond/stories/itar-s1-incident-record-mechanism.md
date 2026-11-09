## Story: Incident record mechanism

**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-incident-triage-and-respond/benefit-metric.md

## User Story

As a **delivery engineer responding to an alert**,
I want to **create a structured incident record instead of an ad-hoc note**,
So that **the next incident has something real to match against, instead of starting from zero every time like `productionErrorInvestigation` does today**.

## Benefit Linkage

**Metric moved:** Incident record mechanism
**How:** This story is the only place this metric's target ("every new investigation creates a structured record, zero new ad-hoc notes") can be delivered — it's the foundational mechanism itself.

## Architecture Constraints

- `workspace/incidents.json` is a new, non-governed file per CLAUDE.md's existing `workspace/` convention — committed directly to master, no PR required for the data file itself, consistent with how `workspace/state.json`/`capture-log.md` are already handled.
- The new `scripts/lib/incident-store.js` module is a new file under `scripts/` — per ADR-011/artefact-first, this story's own artefact chain satisfies that requirement; per CLAUDE.md's Platform change policy, the module code itself goes via branch + PR.
- **Reuse check (ADR-026):** no existing entity in this repo's schema covers an "incident record" concept — `decisions.md` entries are free-form prose with no prior-link field, `pipeline-state.json`'s `spikes[]` tracks design investigations with a different shape (id/storySlug/verdict), and `capture-log.md` entries are append-only learning signals with no status/resolution lifecycle. This is confirmed as a genuinely new entity, not a duplicate of something that already exists.
- The record's summary/tags field is deliberately short and structured (not free text) specifically so story 2's Jaccard matching has something clean to score against — this is a hard design constraint carried from the discovery's own corrected assumption, not a style preference.
- `git-tracked, not gitignored` — this file must be committed and pushed so story 3's web UI rendering can fetch it from the connected repo via GitHub's Contents API, the same way `decisions.md` is already fetched.

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    INCIDENT {\n        string id PK\n        string trigger\n        string summary\n        string tags\n        string priorIncidentLinks\n        string status\n        string triageSummary\n        string confirmationStatus\n        timestamptz createdAt\n        timestamptz updatedAt\n    }"}}---

## Dependencies

- **Upstream:** None
- **Downstream:** itar-s2 (matches against this record's summary/tags), itar-s3 (renders this record), itar-s4 (updates this record's status).

## Acceptance Criteria

**AC1:** Given a delivery engineer (or, once initiative 2 ships, an automated alert) identifies a production incident, When they create a new incident record, Then the record captures at minimum: a unique id, what triggered it (free text), a short structured summary/tags field (bounded length, e.g. a list of keyword tags — not a paragraph), a list of prior-incident links (initially empty), and a status (e.g. `open`).

**AC2:** Given an incident record is created, When `scripts/lib/incident-store.js`'s create function runs, Then the record is appended to `workspace/incidents.json` without truncating or overwriting any existing record — consistent with this repo's established append-only convention for `workspace/` logs.

**AC3:** Given the tags/summary field is populated, When the record is saved, Then tag values are normalized (trimmed, lowercased) before storage — `_jaccard`'s own real implementation (confirmed in code: `src/modules/drift-comparator.js` lines 254–262) does exact case-sensitive set matching with no normalization of its own, so normalization must happen at capture time, not be assumed to happen inside the matching function.

**AC4:** Given `productionErrorInvestigation`'s real content in `workspace/state.json` (the `tenant_admin_bootstrap_failed` finding), When this mechanism ships, Then that existing ad-hoc note can be manually migrated into a real structured incident record as this story's own first real, non-synthetic test case — proving the mechanism against a case that already exists, not only a fabricated fixture.

## Out of Scope

- Automated alert-to-record creation — that's initiative 2's eventual integration point, not built here; records are created manually (by a human, or by this story's own function called directly) for this MVP.
- Any UI for creating a record — harness/Claude Code-only per this epic's Architecture Constraints; story 3 only renders existing records, it doesn't add a creation form.

## NFRs

- **Performance:** Not applicable — a small, infrequent, append-only file write.
- **Security:** No credentials, no PII — incident summaries must avoid including raw credentials or tokens in the `trigger`/`summary` text (MC-SEC-02 applies to any committed file, including `workspace/incidents.json`).
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** The record itself, plus its `createdAt`/`updatedAt` timestamps, is the audit trail.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
