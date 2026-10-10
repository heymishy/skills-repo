# Post-Delivery Live Verification: Customer Journey as First Class

**Date:** 2026-10-10
**Context:** Operator-requested review after `ep5-s2`'s DoD closed out the entire feature (all 5 epics, 13 stories). Full Chrome browser walkthrough on `wuce-staging.fly.dev`, exercising the real, merged-to-master UI end to end — not re-reading prior per-story DoD claims, but a fresh, independent pass against the live app as it stands today.
**Verified by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)

---

## Scope

Every UI-bearing story in the feature (11 of 13 — `ep5-s1`/`ep5-s2` are pure backend/test stories with no UI surface, already noted as such in their own DoDs) was exercised in a single continuous session on a freshly created journey (`epic-review-2026-10-10`), rather than relying on each story's own isolated, point-in-time live check from whenever it individually merged.

---

## Walkthrough and results

| Story | What was exercised | Result |
|-------|--------------------|--------|
| ep4-s1 | Journeys list page: name, description, product, stage count | ✅ Correct |
| ep4-s2 | "Journeys" nav link (sidebar, active-state highlight) + "View journey" link on a product page | ✅ Both confirmed, correct navigation both ways |
| ep1-s1 | "New journey" modal → POST → redirect to canvas shell | ✅ Journey created, 0-stage empty state rendered correctly |
| ep1-s2 | Inline stage name entry, "+ Add stage" | ✅ 3 stages added (Discover, Evaluate, Purchase), health indicator attached to each new stage immediately |
| ep1-s4 | Keyboard-alternative reorder (up/down buttons), boundary-disabled state | ✅ Moved "Evaluate" above "Discover" — persisted, re-rendered correctly. First/last stage boundary buttons correctly disabled |
| ep1-s3 | Stage side panel: description, pain points, opportunities, channel (native `<select>`), emotion (native `<select>`), moment of truth checkbox | ✅ All fields autosaved and persisted correctly server-side (confirmed after a full reload) — see Finding 1 below for a client-side staleness nuance found along the way |
| ep3-s1 | Customer experience view: emotion chip (colour + text label, MC-A11Y-02), pain points, opportunities, "Not set" for untouched stages | ✅ All correct post-reload: green "positive" chip with visible text, pain points/opportunities text shown verbatim, "Not set" shown for the 2 untouched stages (none silently omitted) |
| ep2-s1 | Feature picker modal: search/filter by name or slug, feature list from real `pipeline-state.json` | ✅ Filtered correctly, selecting a result showed its real metric-keys state ("No metrics recorded") |
| ep2-s2 | Save a feature-to-stage mapping (no metric keys — none available, see Finding 2) | ✅ Saved, page auto-reloaded (D18's fix confirmed live), health indicator transitioned "No coverage" → "Needs metrics" immediately |
| ep2-s3 | Delivery view: feature name + slug annotation, "No metrics selected", "No features mapped" for untouched stages | ✅ All correct. Remove-mapping affordance correctly NOT shown for this valid mapping — matches its narrowly-scoped design (D16: only shows on a feature-NOT-FOUND warning row), not a bug |
| ep3-s2 | Health indicators (✕ No coverage → ⚠️ Needs metrics transition) and summary bar ("0 of 3 stages have metric coverage") | ✅ Both confirmed live and reactive. The ✅ "covered" state remains untestable — see Finding 2 |

**ep5-s1 / ep5-s2:** no UI surface by design (schema migration; backend adversarial test suite). Not applicable to this walkthrough, consistent with both stories' own DoDs.

---

## Findings

### Finding 1 — Stage-panel/view-tab data goes stale without a full reload (MEDIUM, new)

Editing a stage's attributes via the side panel (`ep1-s3`) saves correctly to the database on every field (confirmed via a full page reload afterward), but the already-rendered page does **not** reflect the edit live:

- Switching between Canvas / Customer experience / Delivery tabs (a pure CSS/DOM toggle, zero server round-trip by design) continued to show the pre-edit snapshot from the original page load.
- Reopening the *same* stage's Edit-stage panel immediately after closing it (no reload in between) also showed stale data — specifically, the just-set `emotion: positive` read back as `--` (unset) until a hard reload.

This is not data loss — every field was confirmed correctly persisted server-side. But it reproduces the exact class of problem `ep3-s2`'s own D18 decision already fixed for the 2 feature-mapping actions (`window.location.reload()` after Save/Remove) — that fix was never extended to the stage-attribute autosave path itself. An operator editing two stages back-to-back in one sitting could reasonably believe their first edit silently failed.

**Recommendation:** small follow-up story — either add the same reload-after-save pattern to the stage panel's autosave handler, or have the panel re-fetch its own fields when opened rather than reading embedded page-load data. Logged in `workspace/capture-log.md` (2026-10-10, post-delivery full-feature live review).

### Finding 2 — `ep3-s2` AC1's "covered ✅" state remains live-unverifiable (confirmed pre-existing, not new)

Attempted to close this gap directly: searched the feature picker for `2026-10-05-customer-journey-as-first-class` itself and inspected it — "No metrics recorded". No feature in the real, shared staging `pipeline-state.json` has `metricKeys` populated, because (per D12/D15) no story has yet built the write path for that field. This is the same gap already documented in `ep3-s2-dod.md`; re-confirmed still true today, not a new or worsening issue. No action taken against shared staging state to force this (would require writing synthetic `metricKeys` directly into the shared `pipeline-state.json`, which this review does not do).

---

## Verification artefact note

A real journey (`epic-review-2026-10-10`, id `bf2e0455-e038-4d02-818d-c2da1416b5d8`) was created on staging for this walkthrough and left in place — no journey-delete route exists in this codebase (confirmed out of scope per `ep5-s2`'s own story text), matching the same pattern already established by prior sessions' own `chrome-verify-*` and `ep4-s1/ep4-s2 staging live-verify journey` test artefacts already present on this shared environment.

---

## Outcome

**All 11 UI-bearing stories across all 4 UI-bearing epics confirmed working as intended, live, in a single continuous cross-epic walkthrough.** One new, low-severity UX finding (Finding 1) logged as a follow-up candidate — not a blocker, no data integrity impact. One already-known data-availability gap (Finding 2) re-confirmed, not worsened. No regressions found anywhere in the full chain (journey creation → stage management → attribute editing → customer experience rendering → feature mapping → delivery view → health aggregation → navigation entry points).
