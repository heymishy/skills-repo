## Story: Deferred-item record mechanism (generalized schema)

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **register a deferred item as a structured record, typed distinctly from an incident but sharing the same mechanism**,
So that **`tfhc-s1` and the C1-vs-Option-C contradiction become real records instead of notes nobody revisits, without building a second, parallel mechanism alongside initiative 4's incident records**.

## Benefit Linkage

**Metric moved:** Deferred-item record mechanism existence
**How:** This story is the only place this metric's binary target (both seeded cases exist as structured, correctly-typed records) can be delivered.

## Architecture Constraints

- **Generalizes, does not duplicate, initiative 4's incident-record schema** (`itar-s1`) — per the discovery's own resolved decision (additive, since neither feature has implementation yet). Adds a `type` field (`incident` | `deferred-item`) to the same record shape, plus deferred-item-specific fields: `source` (discovery-out-of-scope | risk-accept | unmeasured-benefit-metric | capture-log | backlog-thread), a human-readable `revisitCondition` (free text — confirmed during discovery that every real `Revisit trigger` in this repo's history is free-form prose, never a parseable condition), and `linkedFeature`/`linkedStory`.
- **Reuse check (ADR-026):** the existing `INCIDENT` entity (from `itar-s1`) already covers most of this shape — this is confirmed as a genuine extension of that entity, not a new, separate one. The `type` discriminator field is the mechanism that keeps one schema serving two record kinds.
- **File location**: generalizes `workspace/incidents.json` (established by `itar-s1`) in place — the filename is historical, not renamed, since nothing is implemented yet and renaming would only add churn with no functional benefit; the schema's `type` field is what actually generalizes it, not the file path.
- **Dependency on initiative 4**: this story cannot be implemented before `itar-s1` (the incident-record schema it generalizes) ships — recorded as an explicit Dependency below, not just prose in the discovery.

---CANVAS-JSON: {"type":"data-model","title":"Data model (refreshed — generalized from itar-s1's INCIDENT entity)","content":{"mermaid":"erDiagram\n    RECORD {\n        string id PK\n        string type\n        string trigger\n        string summary\n        string tags\n        string priorIncidentLinks\n        string status\n        string triageSummary\n        string confirmationStatus\n        string source\n        string revisitCondition\n        string linkedFeature\n        string linkedStory\n        timestamptz createdAt\n        timestamptz updatedAt\n    }"}}---

## Dependencies

- **Upstream:** `itar-s1` (initiative 4's incident-record schema and `workspace/incidents.json` mechanism, which this story generalizes in place rather than duplicates).
- **Downstream:** ddft-s2, ddft-s3, ddft-s4, ddft-s5 all build on this generalized schema.

## Acceptance Criteria

**AC1:** Given `itar-s1`'s record mechanism exists, When this story's patch lands, Then every existing record field remains valid and a new `type` field is added (defaulting existing/future incident records to `"incident"`), plus `source`, `revisitCondition`, `linkedFeature`, and `linkedStory` fields that apply specifically when `type: "deferred-item"`.

**AC2:** Given the `tfhc-s1` pipeline-integrity failure (a real, currently-unfixed, out-of-scope C3 finding that has fired on every integrity check this session), When it is registered, Then a structured record is created with `type: "deferred-item"`, `source: "risk-accept"` or equivalent, and a `revisitCondition` describing what would need to be true to act on it — a real seeded case, not synthetic test data.

**AC3:** Given the C1-vs-Option-C fork-distribution contradiction (the documented disagreement between `.github/architecture-guardrails.md`'s constraint C1 and `skills/bootstrap/SKILL.md`'s Option C, logged in `workspace/capture-log.md` on 2026-11-08), When it is registered, Then a structured record is created with `type: "deferred-item"`, `source: "backlog-thread"` or equivalent, and a `revisitCondition` matching the real deferral already logged ("deferred to a broader `product/` refresh later").

**AC4:** Given both seeded records exist, When a direct check confirms their presence and typing, Then both are found correctly typed as `deferred-item` (not accidentally `incident`) — the binary existence check this metric's target requires.

## Out of Scope

- Fixing `tfhc-s1` itself — only correctly registering and surfacing it is in scope.
- Resolving the C1-vs-Option-C contradiction — same boundary.
- Backfilling any other historical `decisions.md`/`capture-log.md` entry beyond these 2 seeded cases.

## NFRs

- **Performance:** Not applicable — a small, infrequent, append-only file write, same as `itar-s1`.
- **Security:** Same `MC-SEC-02` constraint as `itar-s1` — no credentials or tokens in record content.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** The two seeded real records are themselves the audit trail proving this mechanism works against real history, not fixtures.

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
