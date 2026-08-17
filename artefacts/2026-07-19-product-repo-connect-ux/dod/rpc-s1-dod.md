# Definition of Done: Give every product a UI path to connect or create a GitHub repo

**PR:** #508 "rpc-s1: Add UI affordance to connect GitHub repo on product page" (commit `2a9224ce`, 2026-07-20), followed same day by hotfix PR #510 "hotfix(rpc-s1): fix syntax error breaking every repo-connect button" (commit `de00d19c`, 2026-07-20) | **Merged:** 2026-07-20 (confirmed via `git log`)
**Note on PR reference:** the task brief for this DoD pass cited PR #680 — that commit (`83033573`, "das-s3: Backfill already-completed stage artefacts on repo connection") is a later, unrelated story that further modified `handlePostProductRepoCreate`/`_applyRepoChange`, not the PR that shipped rpc-s1. The correct merge PR, found via `git log --all --grep`, is #508 + hotfix #510.
**Story:** artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — unconnected product shows a "Connect repo" affordance | Yes | `U1: renders a Connect-repo affordance when repo_owner/repo_name are null` — asserts `"Connect GitHub repo"` heading and `id="rpc-repo-form"` present | Unit test, `check-rpc-s1-connect-repo.js` | None |
| AC2 — create-new-repo path reaches `handlePostProductRepoCreate`, page shows the created repo | Yes | `IT1: create-new-repo form submission reaches handlePostProductRepoCreate and the page subsequently shows the created repo` — asserts the UPDATE params persist `['github', 'newowner', 'my-new-repo', 'prod-1']` and the subsequent render shows `newowner`/`my-new-repo` with no leftover Connect-repo prompt | Integration test, `check-rpc-s1-connect-repo.js` | None |
| AC3 — connect-existing-repo path reaches `handlePutProductEdit`'s repo-association logic, page shows the connected repo | Yes | `IT2: connect-existing-repo form submission reaches handlePutProductEdit's repo-association path and the page subsequently shows the connected repo` — asserts UPDATE params `['github', 'existingowner', 'existingrepo', 'prod-2']` and the subsequent render shows both values | Integration test, `check-rpc-s1-connect-repo.js` | None |
| AC4 — connected product shows repo info, never alongside a redundant connect prompt | Yes | `U2: hides Connect-repo affordance and shows repo info when repo_owner/repo_name are set` — asserts absence of `"Connect GitHub repo"` and `id="rpc-repo-form"`, presence of `octocat`/`Hello-World` | Unit test, `check-rpc-s1-connect-repo.js` | None |

**Additional coverage beyond the 4 ACs:**
- `IT3: repo owner/name containing HTML special characters are escaped via _escapeHtml (MC-SEC-01)` — covers the story's own NFR-Security constraint.
- `IT4: inline <script> block compiles without a SyntaxError` — a regression test written specifically because of the hotfix (PR #510) that shipped ~1 hour after the original merge; a missing brace in `rpcSubmitCreate`/`rpcSubmitConnect` had silently broken every button handler in production with zero client errors visible server-side. This test now guards against a repeat of that exact failure mode.

All 6 tests in `check-rpc-s1-connect-repo.js` passed on fresh re-run (2026-08-17): U1, U2, IT1, IT2, IT3, IT4.

## Scope Deviations

- **Out of scope items honoured, not defects:** repo disconnection and pre-connection content validation (e.g. `pipeline-state.json` presence) are both explicitly named out of scope in the story text and are not implemented — accepted as declared, not a gap.
- **NFR-Accessibility test plan item not shipped as a standalone automated test.** The test plan (`rpc-s1-test-plan.md`) specifies an NFR test ("Accessibility — new form controls are keyboard-navigable and labelled") but the shipped `check-rpc-s1-connect-repo.js` contains no dedicated accessibility assertion — only U1, U2, IT1–IT4 exist. Direct code read of `src/web-ui/routes/products.js` (lines ~850–876) confirms the underlying markup does satisfy the requirement: `rpc-connect-owner`, `rpc-connect-repo`, and `rpc-create-name` inputs are each wrapped in a `<label>` and additionally carry an `aria-label`. This is a test-coverage gap relative to the test plan's own promise, not a functional accessibility defect — the behaviour appears correctly implemented, just not independently asserted by an automated check.
- **PR reference correction:** see the PR line above — the task brief's source PR number (#680) pointed at a later, unrelated story; corrected via `git log`.

## Test Plan Coverage

`check-rpc-s1-connect-repo.js`: **6 passed, 0 failed** (freshly re-run 2026-08-17), covering U1, U2, IT1, IT2, IT3, IT4 — all AC-mapped unit/integration tests in the test plan (AC1–AC4) plus the NFR-Security test (IT3) executed. The plan's NFR-Accessibility test was not implemented as a discrete automated check (see Scope Deviations); no other gaps listed in the test plan (`Coverage gaps: None`, `Test Gaps and Risks: None`).

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | N/A per story (UI-only, reuses existing handlers) | — |
| Security (MC-SEC-01) | Met | IT3 confirms `_escapeHtml` escaping of untrusted repo owner/name values |
| Accessibility | Likely met, unverified by automated test | Manual code read confirms `<label>` + `aria-label` on all new inputs; no dedicated automated assertion (see Scope Deviations) |
| Audit | N/A per story (relies on existing handler logging) | — |

## Metric Signal

No dedicated benefit-metric artefact exists for this story — it is explicitly short-track (per its header, discovery and benefit-metric steps were skipped). The story's own Benefit Linkage section states it unblocks product-rollup epic's Metric 1 and Metric 2 (product shape visible, freshness visible/refreshable) for manually-created products by closing a UI gap to an already-working backend. No standalone metric tracking or dashboard signal was found or expected for this story in isolation.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Add a dedicated automated accessibility assertion (label/tabindex checks) for the `rpc-*` form controls to close the gap between the test plan's stated NFR-Accessibility test and what actually shipped in `check-rpc-s1-connect-repo.js`. Low priority — the underlying markup already appears compliant on manual inspection.

## DoD Observations

Shipped same-day as a same-story hotfix (PR #510) for a syntax error that had silently broken every button on the new form in production with no visible error — `IT4` was added specifically to prevent recurrence and is a good regression-test pattern worth reusing for other inline-`<script>`-emitting render functions in this file.
