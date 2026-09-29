# Design: Route governance-critical skills to Sonnet by default

**Definition reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/definition.md

---

## Applicability

This feature is backend/operational configuration — a model-routing decision plus deployment plus a startup log check. There is no rendered UI, no user-facing visual surface, and no new data model. `/design` is being completed here only to close out the originally-stubbed artefact chain per the operator's explicit request, not because this feature has meaningful design-system surface area.

## Data model

None. No new tables, no schema change. `psrc-s1`'s existing `model-routing.js` module and its `WUCE_MODEL_OVERRIDE_<SKILL>` Fly-secret mechanism are reused entirely as-is.

## UI/UX

Not applicable — no rendered UI. The only observable surface is:
1. `fly secrets list` output (operator-facing CLI, not this platform's own UI).
2. Server startup log lines (`psrc-verify-s3`'s drift guard) — operator-facing via `fly logs`, not a UI.

## Interaction pattern

Not applicable.

## Accessibility

Not applicable — no rendered UI.

## Decision

No design artefact beyond this note is warranted. Proceeding directly to `/review` of the definition/stories already written.
