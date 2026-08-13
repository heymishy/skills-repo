# Definition of Done: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**PR:** https://github.com/heymishy/skills-repo/pull/727 | **Merged:** 2026-08-13
**Merge commit:** c26e363f
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s3-org-level-guardrails-view-with-seeding.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s3-org-level-guardrails-view-with-seeding-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s3-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: designateOrgRepo_noExistingRow_createsRowAndSeedsExactContent` asserts the exact INSERT params and the exact verbatim seed text (byte-level, confirmed in spec-compliance review) for both starter files, plus a PostHog `org_repo_designated` capture assertion | automated test (`tests/check-wugs-s3-org-level-guardrails-view.js`) | None |
| AC2 | ✅ | `AC2: handleGetGuardrailsView_orgRepoDesignated_showsRealContent` asserts the real designated-repo content appears AND the "no org repo designated" prompt is gone | automated test | None |
| AC3 | ✅ | `AC3: handleGetGuardrailsView_noOrgRepoDesignated_showsExplicitPrompt` asserts an explicit prompt with a real `/settings/org-repo` designation entry point, not a silent empty section | automated test | None |
| AC4 | ✅ | `AC4: handleGetGuardrailsView_twoProductsSameTenant_identicalOrgContent` — strengthened during final review to use two genuinely distinct product IDs (was inadvertently calling the same product twice at first) | automated test | See Deviation note below |
| AC5 | ✅ | `AC5: handleGetGuardrailsView_crossTenantIsolation_neverLeaksOtherTenantOrgRepo` — asserts positive presence of each tenant's own content and explicit absence of the other tenant's content/repo identifiers, both directions | automated test | None |

All 12 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-13: `12 passed, 0 failed`. Sibling stories `wugs-s2` (11/11), `wugs-s5` (13/13), `wugs-s6` (18/18) re-confirmed unaffected.

**Deviation on AC4:** the final story-level review found the AC4 test was calling `handleGetProductGuardrailsView` twice with the SAME product ID rather than two genuinely distinct products under the same tenant — it would have passed even under an accidental product-scoping bug, as long as that bug were self-consistent. Fixed within the same task batch (a dedicated fix dispatch added a second same-tenant product fixture and used two distinct product IDs); re-verified the strengthened test still passes, confirming the underlying implementation was already correctly tenant-scoped, not product-scoped. Recorded here per this repo's "record deviations even after they're fixed" convention.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped beyond the story's stated scope. Confirmed via diff review of the merged PR: no UI for re-designating the org repo after first set (Out of Scope item — the view still works with whatever is designated), no multi-level org hierarchy (Out of Scope item — flat tenant → single org repo only), no cross-repo aggregation as an org-level fallback (Out of Scope item, explicitly rejected in `decisions.md`'s ARCH entry #1).

One addition beyond the original 6-task plan, found during code-quality review rounds and shipped in the same PR before merge: `handlePostOrgRepoSettings` (the designation route handler) gained a CSRF guard, tenantId validation (404 on missing), and distinct 409/500 write-error handling — mirroring `wugs-s6`'s own review-fix round for the analogous `handlePostGuardrailsForm` handler. Also gated on `requireAdmin` (not plain `authGuard`), matching this codebase's convention for every other tenant-level mutating settings route — required updating two governed `requireAdmin`-enumeration checklist tests (`check-d2-banner-exit-permission-visibility.js`, `check-d4-nfr-security-review-and-hardening.js`) to include the new route, which correctly failed until updated (not weakened).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (plan baseline), plus 7 additional tests added during review rounds
**Tests passing in CI:** 12 / 12

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC3: no org repo designated — explicit prompt | ✅ | ✅ | 1 test |
| AC2: real designated-repo content shown | ✅ | ✅ | 1 test |
| AC4: identical org content across products | ✅ | ✅ | 1 test, strengthened during final review (see Deviation) |
| AC5: hard cross-tenant isolation | ✅ | ✅ | 1 test |
| AC1: first-time designation + exact seeding | ✅ | ✅ | 2 tests (1 in plan + 1 negative-case: missing repo_name rejected server-side) |
| Review-round additions (CSRF, tenantId, write-error handling) | ✅ | ✅ | 4 tests: CSRF 403, tenantId-missing 404, write-conflict 409, write-error 500 |
| Wiring: POST /settings/org-repo routed in server.js | ✅ | ✅ | 1 test |
| D2/D4 requireAdmin enumeration checklists | ✅ | ✅ | 2 governed cross-cutting tests updated (count + allowlist + route-specific wiring assertion) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no hard target, GitHub API latency accepted | ✅ (as scoped) | No performance regression test required; matches the story's own stated NFR |
| Security — MC-SEC-01 escaping for org-repo content | ✅ | Reuses `_renderPieceContent`'s existing `_escapeHtml` wrapping, same mechanism already tested by `wugs-s2` |
| Security — cross-tenant isolation is a hard NFR, covered by an explicit test | ✅ | `AC5` test doubles as the NFR test per the test plan's own note; asserts zero cross-tenant leakage both directions |
| Accessibility — same as `wugs-s2` | ✅ (N/A, no new UI beyond wugs-s2's patterns) | Reuses `_renderPieceContent` and the same labelled-form convention already established |
| Audit — org-repo designation audit-logged via PostHog | ✅ | `org_repo_designated` event with `tenant_id`/`repo_owner`/`repo_name`, asserted in the AC1 test |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes, as of this story's merge.**

`m1` ("Guardrail/standard visibility in the web UI") — this story delivers the org-level half of the view. Combined with `wugs-s2` (product-level, already merged), a tenant can now see the full org/product delineation the discovery names as core to the problem, for the first time.

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: the org-level view is now code-complete and live-reads real repo content, but first-time designation still requires an admin to actually use the new `/settings/org-repo` flow — no real tenant has done so yet as of this DoD.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After a real tenant admin designates an org repo | Org-level half of the view is code-complete; first real signal still pending |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Deviation:** AC4's test initially called the same product ID twice rather than two genuinely distinct products (see AC Coverage section above) — caught by the final story-level review and fixed within the same delivery, before merge. Not an implementation defect; the underlying tenant-scoping was already correct, the test just didn't prove it as rigorously as it should have.

**Follow-up actions:** None outstanding. This story shipped complete, including review-driven hardening (CSRF, tenantId validation, requireAdmin gating) that went beyond the original plan's literal ACs but was necessary for the designation route to be production-safe.

---

## DoD Observations

1. **This story's worktree branched from master before the prior story (`wugs-s6`) had fully wrapped up its own bookkeeping**, but by the time `wugs-s3`'s implementation began, `wugs-s6` had already merged — no cross-story integration issue arose here. Contrast with `wugs-s7` (merged separately, see its own DoD), whose worktree branched BEFORE `wugs-s3` merged and required a real merge-conflict resolution once both PRs were ready to land — a natural consequence of running two stories' inner loops concurrently across worktrees. Tag as a `/improve` candidate: when two stories in the same feature touch the same shared render functions (`_renderGuardrailsSection`, `handleGetProductGuardrailsView`) and their worktrees branch close together in time, expect a real merge conflict at whichever PR lands second — this is expected process friction, not a defect, but worth flagging to the operator proactively rather than as a surprise.
2. **Every code-quality review round on this story surfaced at least one real, legitimate finding** (Task 1's DRY duplication; Task 5's two Critical security gaps — missing CSRF guard, no tenantId validation before a DB insert; Task 6's two Important gaps — a redundant/buggy duplicate body-parser, and `authGuard` used where the codebase convention requires `requireAdmin`). None were rubber-stamped. This matches the pattern already observed on `wugs-s5`/`wugs-s6` in this same feature — recurring enough across the whole feature to suggest the two-reviewer-per-task discipline is earning its cost, not a candidate for streamlining.
3. **The governed `requireAdmin`-enumeration checklist tests** (`check-d2-banner-exit-permission-visibility.js`, `check-d4-nfr-security-review-and-hardening.js`) correctly caught this story's new admin-gated route as a real, intentional audit tripwire — they fail by design whenever a new `requireAdmin` call site is added anywhere in `server.js`, requiring a conscious update (count, allowlist, route-specific wiring assertion) rather than a silent pass-through. Confirms this cross-cutting governance pattern generalizes correctly to a brand-new feature area, not just the stories it was originally built for.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the AC4 test-strengthening deviation clearly distinguished from an implementation defect?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
