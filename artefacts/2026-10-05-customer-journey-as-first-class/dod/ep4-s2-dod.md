# Definition of Done: Navigation and entry points: "Journeys" nav link and product page link

**PR:** [#964](https://github.com/heymishy/skills-repo/pull/964) | **Merged:** 2026-10-09T00:32:30Z
**Story:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
**Test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-05-customer-journey-as-first-class/dor/ep4-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "Journeys" nav link on every page, targets `/customer-journeys`. `check-ep4-s2-nav-and-product-link.js` (NAV_ITEMS entry + renders on an unrelated `active` page) + real local browser render (pre-merge) + **real staging confirmation (2026-10-09):** `wuce-staging.fly.dev` sidebar shows "Journeys" as the active item while on `/customer-journeys` | `unit` + `live` (local + staging) | None |
| AC2 | ✅ | "View journey" link on a product with an associated journey, targets earliest by `created_at`. `check-ep4-s2-nav-and-product-link.js` (href assertion + ordering shape) + **real staging confirmation (2026-10-09):** created a real journey ("ep4-s2 staging live-verify journey") associated to the "new product" product via the live `/customer-journeys` "New journey" modal, reloaded `/products/aa191807-...`, confirmed a real `<a href="/journeys/ad917c33-...">View journey</a>` link appeared and navigated correctly to that journey's canvas page | `unit` + `live` (staging, full click-through) | None — no local pre-merge check was possible for this AC specifically (no seeded local product-journey pairing under `fake-test-db`); staging confirmation closes that gap |
| AC3 | ✅ | No link when product has no associated journey. `check-ep4-s2-nav-and-product-link.js` (absence assertion) + **real staging confirmation:** a different product ("new product", before the AC2 journey was created) rendered the header button row with no "View journey" link present | `unit` + `live` (staging) | None |
| AC4 | ✅ | Nav link keyboard-reachable, WCAG 2.1 AA. `check-ep4-s2-nav-and-product-link.js` (real `<a href>` shape assertion) + real local browser render + **real staging confirmation:** `read_page` accessibility tree on the live page shows the Journeys item as a genuine `link` element (`href="/customer-journeys"`), not a JS-only control | `unit` + `live` (local + staging) | None |

**Live verification beyond the test plan (real Chrome, staging, post-merge, 2026-10-09):** Confirmed the deploy-restart session-logout pattern recurred a 5th time this session (`ep1-s3`, `pfi-s1`, `ep1-s4`, `ep4-s1`, now `ep4-s2`) — re-authenticated, then walked the full flow live: `/customer-journeys` list (nav link active + highlighted), created a real journey scoped to a real product via the "New journey" modal's product picker, confirmed the resulting "View journey" link on that product's page with the correct `href`, clicked through to the journey canvas, and separately confirmed a product with no journey renders no link. All 4 ACs now have genuine staging evidence, not just unit tests plus a local render check.

---

## Scope Deviations

None. Implementation matches the DoR contract exactly: one new `NAV_ITEMS` entry (`id: 'journeys'`, `href: '/customer-journeys'`, main section), one new scoped query in `handleGetProductView`, one new trailing parameter (`firstJourneyId`, appended last per the DoR's explicit 18-call-site constraint) on `_renderProductView`. The two pre-existing regression-test corrections (`check-pan-s1-product-aware-navigation.js` U6.1, `check-wuce18-html-shell.js` T3.1) were discovered and corrected during implementation, not scope creep — logged in `decisions.md` D9 with full before/after rationale.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6.
**Tests passing in CI:** All pass; confirmed in PR #964's CI and independently re-run against merged master (`npm test`: 727 files, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (nav link present + target) | ✅ | ✅ | |
| AC1 (renders on unrelated active page) | ✅ | ✅ | |
| AC2 (link present + correct href) | ✅ | ✅ | |
| AC2 (ordering shape — `ORDER BY created_at ASC LIMIT 1`) | ✅ | ✅ | |
| AC3 (no link when no journey) | ✅ | ✅ | |
| AC4 (real `<a href>`, keyboard reachable) | ✅ | ✅ | |

**Gaps:** None. Both local and staging live verification completed within this session — no deferred follow-up for any AC.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Shared-surface-module story requirement (architecture-guardrails.md anti-pattern) | ✅ | This story is itself the required story artefact for the `NAV_ITEMS`/`html-shell.js` change |
| Tenant scoping | ✅ | New `customer_journeys` lookup scoped by `product_id`, whose tenant ownership is already verified upstream in `handleGetProductView` before this story's query runs |
| No new npm runtime dependencies | ✅ | Reuses existing `NAV_ITEMS`/`_renderNavLink` and header-button-row patterns |
| WCAG 2.1 AA | ✅ | Both new links are real `<a href>` elements inherited from existing rendering mechanisms — no new keyboard-handling code; confirmed via accessibility tree on live staging |
| Positional-argument test-file safety (18 existing `_renderProductView` callers) | ✅ | `firstJourneyId` appended as the last (18th) parameter; full suite run confirmed zero silent misalignment |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Journey adoption | No (pre-feature) | **Now fully measurable** — this story completes the `navigation-entry-points-and-journey-list` epic: the journey list page (`ep4-s1`) is now discoverable from every page via nav, and from a product's own page when it has an associated journey. The feature is no longer URL-only. |

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with unit-test evidence, a pre-merge local real-browser render check, AND a full post-deploy staging confirmation completed within this same session (including a genuine create → link-appears → navigate click-through for AC2, which had no local pre-merge equivalent). No gap remains on any AC. No scope deviations beyond the two pre-existing regression-test corrections, both logged in `decisions.md` D9. CI fully green. `npm test` on master: 727 files, 0 failed.

Two pre-existing, unrelated CI workflow failures were observed on the merge commit and investigated — neither blocks this DoD:
1. **Trace Commit** workflow failed with a shell quoting bug: the squash-merge commit message contains double-quoted text (`"Journeys"`, `"View journey"`) that isn't escaped before being embedded in the workflow's own shell script, producing `line 1: journey product-page link (ep4-s2) (#964)... No such file or directory` (exit 127). This is a pre-existing pipeline-tooling defect, triggered by this PR's own commit-message wording, not an application code defect.
2. **Improvement Agent — Scheduled Dreaming** failed with a GitHub ruleset rejection (`GH013`, "Changes must be made through a pull request") when it tried to push trace files directly to `master`. This indicates master's branch protection now requires all changes via PR, which this bot's own direct-push workflow no longer satisfies — a ruleset/bot-permissions mismatch, unrelated to this story's code.

**Follow-up actions:**
1. Extend `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — still the single largest recurring gap across this feature (now affects `ep1-s3`, `ep1-s4`, `ep4-s1`, and this story's own local-verification attempts identically).
2. Fold the deploy-timing + session-logout diagnostic (`gh run view <run-id> --json jobs`, not aggregate workflow status, plus the expected re-authentication step) into a shared skill instruction — now confirmed recurring a 5th time this session.
3. **New, this story:** fix the `Trace Commit` workflow's shell-quoting defect (commit message interpolated unescaped into a bash script) — any future commit message containing double quotes will reproduce this failure. Separately, investigate the `Improvement Agent — Scheduled Dreaming` workflow's push-to-master failure against the newer branch-protection ruleset (`GH013`) — likely needs either a path-based bypass (as already configured for `workspace/**`/`artefacts/**`/`.github/pipeline-state.json`, per CLAUDE.md's "State and artefact updates" section) extended to cover this bot's own commit paths, or a PR-based flow for its output.

---

## DoD Observations

1. **AC2 had no viable local pre-merge check** — unlike `ep4-s1`'s read-heavy list page, confirming "a product with an associated journey shows a working link" required a real product-journey pairing with a real `id`, which `fake-test-db.js`'s empty-result fallback cannot produce. The unit test covered the shape (mock `firstJourneyId` → correct `href`), but the genuine click-through (create journey for a product → link appears → link navigates to the right canvas) was only provable live, post-deploy, on staging. This is the same underlying `fake-test-db.js` gap already logged for `ep1-s3`/`ep1-s4`/`ep4-s1`, now confirmed to also constrain pre-merge *confidence* on AC coverage, not just E2E spec execution.
2. **This is the fifth time this feature has hit the deploy-timing + session-logout pattern.** The diagnostic (check `gh run view <run-id> --json jobs`, not the aggregate `waiting` status; expect to re-authenticate) is now well-established in this session but still manual each time — Follow-up action 2 above proposes folding it into a shared skill instruction so future sessions don't have to re-derive it.
3. **Two unrelated CI workflow failures surfaced on this story's merge commit** (`Trace Commit`, `Improvement Agent — Scheduled Dreaming`) that trace to pipeline-tooling defects, not this story's code — both are genuinely new findings (not previously logged in this feature's `decisions.md` or `workspace/capture-log.md`) and worth a dedicated look outside this story's own scope, since they will recur on every future commit with a quoted-text commit message or every future direct-push attempt by that bot.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Navigation and entry points:
\"Journeys\" nav link and product page link" (ep4-s2). Check:
1. Does every AC row have a concrete evidence reference (test name,
   observable behaviour, or live Chrome confirmation)?
2. Is treating the two CI workflow failures (Trace Commit,
   Improvement Agent — Scheduled Dreaming) as non-blocking, pre-existing
   pipeline-tooling defects correct, given neither touches this story's
   own changed files?
3. Is the outcome verdict (COMPLETE) consistent with the AC rows, given
   this story closes with full staging confirmation on all 4 ACs within
   the same session as the merge (no deferred pendingActions item)?
4. Should Follow-up action 3 (fixing Trace Commit's shell-quoting defect
   and investigating the Scheduled Dreaming ruleset conflict) become its
   own short-track story now, or wait for a dedicated pipeline-maintenance
   pass?
```
