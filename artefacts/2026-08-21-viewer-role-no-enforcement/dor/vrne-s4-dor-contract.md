# Contract Proposal: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md`
**Date:** 2026-08-22

## What will be built

- `src/web-ui/routes/agency-provisioning.js` updated to call `requireNonViewer` (from `vrne-s1`) at `POST /agency/clients/new` (`:132`) and `POST /agency/clients/:id/invite` (`:196`), added **after** the existing `org_type === 'agency'` check succeeds — additive, not replacing.
- `src/web-ui/routes/annotation.js` updated to call `requireNonViewer` at `POST /api/artefacts/:slug/annotations` (`:52`).

## What will NOT be built

- No change to the existing `org_type === 'agency'` check's own logic or ordering relative to other checks — the new role gate is inserted after it, never replacing or reordering it.
- No change to `/journey/wizard`'s missing auth check, `/api/admin/promotions/:id/approve`/`reject`, or `/organisations/convert` — all explicitly out of scope per the story's own Out of Scope section.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 1 unit test, mock `role='viewer'` + `org_type='agency'`, assert 403 + client-creation function never invoked | unit |
| AC2 | 1 unit test, same pattern for invite | unit |
| AC3 | 1 unit test, mock `role='viewer'`, assert 403 on annotation route | unit |
| AC4 | 2 unit tests (`engineer`, `admin` at Agency org), assert `next()` called | unit |
| AC5 | 2 unit tests (any role at non-Agency org), assert still-403 attributable to the pre-existing org-type check specifically, not the new role gate | unit |
| AC6 | 1 unit test (injectable test logger) | unit |

## Assumptions

- Same code-level (not schema-field-level) dependency on `vrne-s1`. `schemaDepends: []`.
- The existing `org_type === 'agency'` check function is separately callable/spyable so AC5's test can distinguish which check produced the denial.

## Estimated touch points

**Files:** `src/web-ui/routes/agency-provisioning.js` (2 call sites), `src/web-ui/routes/annotation.js` (1 call site)
**Services:** None external.
**APIs:** None new.
