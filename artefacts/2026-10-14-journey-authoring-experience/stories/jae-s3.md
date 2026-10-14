## Story: Extend the discovery-artefact-scan suggestion pattern to stage-level fields

**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-guided-creation.md
**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Benefit-metric reference:** artefacts/2026-10-14-journey-authoring-experience/benefit-metric.md
**Domain:** [web-ui, ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **the stage-edit panel to suggest starting text for `customer_actions` and `pain_points`, drawn from a linked feature's own discovery artefact, when one exists**,
So that **I'm filling in a field with a reviewable starting point instead of writing every field from a blank textarea — directly closing this feature's own M2 (fields populated without manual prompting), using the exact mechanism `jcx-s4`'s persona suggestions already proved out, not a new AI-generation system**.

## Benefit Linkage

**Metric moved:** M2 — Fields populated without manual prompting
**How:** `jcx-s4`'s own persona-suggestion mechanism (deterministic, scans linked features' own `discovery.md`) already demonstrated that a click-to-fill suggestion meaningfully reduces blank-field friction for the persona card. This story extends the identical pattern to the 2 stage-level fields with the most directly-extractable source material (a discovery.md's own "Problem Statement" section maps naturally to `customer_actions`/`pain_points`), closing the same kind of gap M2 measures at the stage level.

## Architecture Constraints

- **Constraint — reuse over invention (ADR-026).** This story adds exactly one new sibling function to the EXISTING `src/web-ui/adapters/persona-scanner.js` (`extractProblemStatement`, matching `extractWhoItAffects`'s own established raw-text-under-a-heading pattern precisely) and one new route-level function (`getFieldSuggestions`, mirroring `getPersonaSuggestions`'s own existing shape — same `journeys` table query for `feature_slug`s tied to the journey's `product_id`, same `repoRoot`-scoped file reads). No new table, no new query shape beyond what `getPersonaSuggestions` already performs, no new npm dependency.
- **No LLM/AI generation.** Per `discovery.md`'s own confirmed `/clarify` decision, this story is the deterministic-scan MVP slice; real LLM-based generation is an explicitly separate, later fast-follow story — not built here, and the Architecture Constraint boundary here is as important as the functional one.
- **Raw text only, same as `jcx-s4`'s own established principle.** Suggestions are the discovery artefact's own raw prose, never auto-split, reformatted, or summarized — the operator reviews and edits before it becomes real field content, exactly as `jcx-s4`'s persona suggestions already work. No parsing beyond "extract the text under this heading."
- **Security (reused, not re-derived):** `extractProblemStatement`, like `extractWhoItAffects`, performs zero database queries — it is a pure file-read function. The DB query (`journeys` table, `feature_slug` lookup) happens exactly once, in `getFieldSuggestions`, mirroring `getPersonaSuggestions`'s own existing security posture exactly.

## Dependencies

- **Upstream:** `jae-s2` (guided creation opens the panel automatically — this story's suggestions appear inside that same panel) should be merged first per the chosen user-journey slicing, though this story's own suggestion mechanism works identically whether the panel was opened automatically or via a manual click; no hard technical dependency, sequenced per epic ordering.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey stage whose journey has a `product_id`, and a feature linked to that same product whose `discovery.md` has a non-empty "Problem Statement" section, When the stage-edit panel opens, Then the `customer_actions` and `pain_points` fields each show a suggestion button (if their own value is currently empty) displaying the raw "Problem Statement" text, mirroring `jcx-s4`'s own `sw-persona-suggestion-btn` markup/behaviour pattern exactly (same button styling convention, same click-to-fill-the-field behaviour, same "never auto-splits or reformats" rule).

**AC2:** Given the operator clicks a suggestion button from AC1, When clicked, Then the corresponding field's own textarea is filled with the exact raw suggestion text (not auto-saved) — the operator must still blur the field (or otherwise trigger the existing autosave) for it to actually save, exactly as every other field in this panel already works.

**AC3:** Given a stage whose journey has no `product_id`, or has a `product_id` with no linked feature carrying a readable `discovery.md`, When the panel opens, Then no suggestion button appears for either field — this returns an empty result, not an error, mirroring `getPersonaSuggestions`'s own already-established "no match is not an error" behaviour exactly.

**AC4:** Given a field that ALREADY has a real, non-empty value (whether from `jae-s1`'s template, a prior manual edit, or an earlier accepted suggestion), When the panel opens, Then no suggestion button appears for that field — suggestions are only ever offered for genuinely empty fields, never presented as an option to overwrite existing real content.

**AC5:** Given a cross-tenant/cross-product scenario (a journey whose `product_id` belongs to a different tenant's product than the one making the request), When `getFieldSuggestions` runs, Then it returns the SAME tenant-scoped result `getPersonaSuggestions` already returns for this exact scenario — no new cross-tenant data exposure, verified directly rather than assumed identical.

## Out of Scope

- **Any LLM/AI-generated suggestion content** — explicitly deferred as a separate fast-follow story per `decisions.md`'s own confirmed `/clarify` decision; this story is the deterministic-scan mechanism only.
- **Suggestions for any field other than `customer_actions`/`pain_points`** — `description`, `touchpoints`, `channel`, `emotion`, `opportunities`, and `moment_of_truth` get no suggestion mechanism in this story; the 2 chosen fields map most directly onto a discovery.md's own "Problem Statement" section's actual content, per this story's own benefit linkage. Extending to other fields (with a different source section) is a natural, separate future story if this mechanism proves valuable.
- **Any change to `jcx-s4`'s own existing persona-suggestion mechanism itself** — this story adds a parallel, sibling mechanism; `getPersonaSuggestions`/`extractWhoItAffects` are read, not modified.
- **Combining or deduplicating a persona suggestion and a field suggestion when both draw from the same linked feature** — each mechanism surfaces independently; no cross-referencing logic between them in this story.

## NFRs

- **Performance:** None beyond existing route bounds — reuses `getPersonaSuggestions`'s own already-proven query/file-read cost profile, same scale (number of linked feature slugs per product, typically small).
- **Security:** AC5 directly verifies no new cross-tenant exposure; `extractProblemStatement` remains a pure file-read function with zero DB access, matching `extractWhoItAffects`'s own existing security posture exactly.
- **Accessibility:** WCAG 2.1 AA — the new suggestion buttons reuse `jcx-s4`'s own already-accessible `sw-persona-suggestion-btn` markup/CSS pattern (native `<button>`, no custom widget), so no new accessibility work is needed beyond confirming the reuse is exact, not a near-miss.
- **Audit:** None — no new mutating action; accepting a suggestion still goes through the SAME existing per-field PATCH/autosave path every other field edit already uses.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
