# E2E smoke job: triage of the failing specs (2026-11-20)

Read-only investigation. Nothing in `src/`, `tests/` or the workflows was changed. It follows section 2 of `purge-and-e2e-tail-diagnosis-2026-11-20.md`, which found that the "Playwright E2E smoke tests" job hides failing specs behind `continue-on-error: true`.

## Method

The Playwright JSON report (`pw-report-json` artefact) of the six most recent E2E runs on pull requests (44474260052, 44475721583, 44580666379, 44581765692, 44591354884, 44597141322, 2026-11-19), counting per test how often it failed. The error messages come from the newest run (44597141322: 249 passed, 17 failed, 25 skipped, 155 s). A claim is marked **confirmed** only where the cause was read in the source; everything else is a **hypothesis** from the error text and needs a look at the spec and the page.

## Result: 24 distinct tests fail at least once in six runs, and they fall into two groups

**Failing in all six runs (13 tests, consistent, so not flakes):** these are broken, not intermittent.

| Spec | What fails | Cause | Confidence |
|---|---|---|---|
| `fpux.1-visual-consistency-theme` AC2a, AC2b | Expected light ink `rgb(24, 24, 27)` and dark surface `rgb(28, 28, 26)`; the page renders `rgb(20, 23, 26)` and `rgb(14, 16, 19)` | Test rot. The spec pins the old palette (`--ink` `#18181B`, dark `--surface` `#1C1C1A`); `src/web-ui/utils/html-shell.js` lines 460 and 480 now define `--ink: #14171A` and dark `--surface: #0E1013`. | **Confirmed** |
| `fpd-s4-caption-sync` | `.playback-ac__video` not found (no element at all) | Test rot or a removed feature: the selector matches nothing. | Hypothesis |
| `jcx-s6-swimlane-grid` AC1 | Expected 3 `.sw-cx-grid-cell--header`, found 6 | The header markup is emitted from two places in `src/web-ui/routes/journeys.js` (lines 981 and 1277), so a second grid or a duplicated render matches the selector. Either the spec is stale or the page renders the grid twice. | Hypothesis, needs a look |
| `ep1-s4-stage-selector` scenario 2 | Expected 0 "Move back to Benefits" links, found 2 | A second copy of the stage navigation (for example a mobile or secondary nav) matches the selector, or the disabled state no longer removes the link. | Hypothesis |
| `ep1-s3-stage-panel-focus-management` | `#sw-stage-panel` keeps class `sw-stage-panel` and `aria-hidden="true"` after the open action | The panel does not open: either the trigger no longer opens it (a real defect in a keyboard-accessibility feature) or the trigger changed. | Hypothesis, possible real defect |
| `frsr-s1-feature-row-session-resume` (2 tests) | `a.pvc-item-link` is found but is **hidden** | The row link exists but is not visible. One of the two tests is "keyboard-activatable (not mouse-only)", so a hidden link may be a real accessibility regression, or the restyle made the link a visually hidden overlay. | Hypothesis, possible real defect |
| `bri-s3.6-auth-journey` AC1 | First-time GitHub login lands on `/dashboard`, expected `/welcome` | Either the first-login detection changed (a behaviour defect) or the test user already exists in the shared database so it is no longer a first login. | Hypothesis, possible real defect |
| `bmau-s1-bulk-assign-rerender` | 30 s test timeout | Not known. | Unknown |
| `wuce18-keyboard-nav` | 30 s test timeout on "keyboard user can reach all nav links via Tab" | Not known; may be linked to the duplicated navigation seen in `ep1-s4`. | Unknown |
| `spdr-s2-metric1-timing` | Expected 10 completed filter, sort and dismiss rounds, got 9, in all six runs | A performance guard that counts rounds; consistently 9, so not random. | Hypothesis |
| `ep3-s1-regression` | `waitForURL('**/skills/definition/sessions/**')` times out after 10 s | The flow no longer navigates to that URL after the form submit. | Hypothesis |

**Failing in 5 of 6 runs (3 tests):** `dsa-s2-dashboard-restyle` AC7 (both tests) and `s3.2-within-column-reorder` AC3. The dashboard greeting reads `3 in-progress sessions` where the test expects 2, and `1 in-progress session` where it expects 0. Both counts are off by the same kind of amount, which points to **leakage between tests** (the same `e2e-tester` user sees journeys created by other specs) rather than to a defect in the count. Hypothesis.

**Failing in 1 to 3 of 6 runs (8 tests, intermittent):** `ep1-s2-product-default-pod` (3), `dsa-s1-artefact-viewer-restyle` AC8, `ic-s4-keyboard-node-movement`, `pnfc-s1-new-feature-choice` AC2 (2 each), `s1.1-board-advance-action` (2), `ic-s2-canvas-drag-position`, `jae-s5-delivery-swimlane-grid`, `pnfc-s1` AC3 (1 each). Likely ordering, timing or shared-state flakes; not investigated.

## What this means

1. **The job gives no signal today.** About 17 tests fail on every run and the step is `continue-on-error`, so a new break in any of these 24 tests cannot be told from the existing ones. The reliability of the other 249 passing tests is unaffected.
2. **Most of the consistent failures look like specs that were not updated when the UI changed** (the design-system restyle changed colours, markup and the number of nav copies). One cause is confirmed (`fpux.1`).
3. **Three failures could be real defects in keyboard accessibility or first-login behaviour** (`ep1-s3`, `frsr-s1`, `bri-s3.6`). They are the ones worth looking at first because a user could be affected, not just a test.
4. **Time cost is small now.** With 17 failures the whole job takes about 155 s, the step median is about 165 s; the old 880 s tail came from a period with 56 to 59 failures. Fixing these will save little time; the value is the signal.

## Suggested stories (each is the operator's call; none is started)

- **E2E triage 1, restore the signal for the confirmed rot:** update `fpux.1` to the current tokens (read them from the CSS, or assert on the variable names, not hex values); decide per spec whether `fpd-s4` is still a feature.
- **E2E triage 2, the three possible real defects** (`ep1-s3`, `frsr-s1`, `bri-s3.6`): open each page, decide defect or stale spec, and write a bug story for any defect.
- **E2E triage 3, test isolation** (`dsa-s2` counts, `s3.2`, and the intermittent group): give each spec its own user or clean its data.
- **E2E gate, later:** once the list is short, move the known-failing specs into a named allowlist and drop `continue-on-error`, so a new failure turns the job red. This is the step that makes the job a gate; it needs the operator's agreement because it changes what blocks a merge.

## Update: the three possible defects, investigated (2026-11-20)

Method: ran the specs locally against the test-mode server (`NODE_ENV=test`, `E2E_LOCAL_SUITE=true`), instrumented temporary copies of two specs to list every element the selector matches with its hidden ancestors (the copies were deleted), and bisected the order dependence. No tracked file was changed. The full local run also created 113 untracked `artefacts/*e2e*` folders (the specs write real folders into the repository); only those, checked against a snapshot taken before the runs, were removed.

| Spec | Verdict | Evidence |
|---|---|---|
| `ep1-s3-stage-panel-focus-management` | **Stale selector, not a product defect (confirmed)** | The journey page renders the stage Edit link three times (`.sw-cx-swimlane-grid`, `.sw-delivery-swimlane-grid` and the main view). The first two sit inside `display:none` containers; the spec clicks `.first()`, a hidden one, so nothing opens. With `.sw-stage-edit:visible` the spec passes. |
| `frsr-s1-feature-row-session-resume` (2 tests) | **Stale selector, not a product defect (confirmed)** | The product page now has tab panels (`#pvc-tab-panel-module`, `#pvc-tab-panel-all`), so `a.pvc-item-link` matches three links; `.first()` is the one inside the hidden "module" panel. One visible link exists with a real size and position. The fix is the same `:visible` (or scoping to the active panel). The keyboard-activation half of that test has not been run against the visible link. |
| `jcx-s6-swimlane-grid`, `ep1-s4-stage-selector` | **Same cause, strongly supported, not individually confirmed** | `jcx-s6` finds 6 header cells where 3 are expected, which is two grids of three; the header markup is emitted by two code paths in `routes/journeys.js` (lines 981 and 1277) and the other view is hidden. `ep1-s4` fails with counts of 4 where 0 is expected, and scenarios 1 and 3 also fail locally. |
| `bri-s3.6-auth-journey` AC1 | **Order dependent, cause not found** | Passes alone and with `bri-s3.2`, `bri-s3.4` or `bri-s3.5` before it. Fails (lands on `/dashboard`) when `bri-s3.3-multi-user-tenant-journey` runs before it on the same server (reproduced with one worker), and fails in the full local run, as in all six CI runs. `bri-s3.3` seeds `team_memberships` and `person_identities` through `/test/seed-multi-user-roles` and sets `TENANT_ORG_ALLOWLIST` in the test process. `handleAuthCallback` (`routes/auth.js` lines 436 to 443) skips the first-login check when the resolved role is admin and the grant did not just happen, which would send the user to `/dashboard`. Why the role resolves to admin after `bri-s3.3` has not been traced. Whether this is a test-isolation problem or a role-resolution defect is still open. |

**Revised conclusion.** Of the three that looked like possible real defects, two (`ep1-s3`, `frsr-s1`) are stale selectors; nothing in the product is broken, but the same hidden-duplicate pattern very probably explains `jcx-s6` and `ep1-s4` too, which makes at least five of the 13 consistent failures one cause. Only `bri-s3.6` AC1 remains a possible defect, in login role resolution when a tenant has a seeded admin; it needs a trace through `routes/auth.js` and the test-mode adapters, not a change to the spec.

**Local run caveat.** The full local run (Windows, 195 s) had 39 failures against 17 on the CI runner, so about 20 extra failures are specific to this machine or to running the suite from the main checkout (for example `reference-upload`, `local/skill-flow-adapter-wiring`, `ep2-s2`). They were not investigated and are not evidence about CI.

**Suggested next stories:** (1) one selector-hygiene story for `ep1-s3`, `frsr-s1`, `jcx-s6`, `ep1-s4` and `fpux.1` (scope to the visible view, update the pinned colours), which should turn about 7 of the 13 consistent failures green and is all spec-side; (2) a separate investigation of `bri-s3.6` AC1 against `bri-s3.3`; (3) test isolation, as before.

## Update 2: `bri-s3.6` AC1 is a real defect in role resolution (2026-11-20)

**The failing spec is correct; the product is wrong.** A person who signs in to a tenant that already has members, and who has no membership of their own in it, is given the role of an arbitrary existing member of that tenant, in practice often the admin.

**Chain, all read in source and reproduced:**
1. The server under test runs with `TENANT_ORG_ALLOWLIST: 'e2e-shared-org'` (`playwright.config.js`), so every login in the suite lands in one shared tenant. `bri-s3.3` seeds an admin (`e2e-alice`) into it.
2. At login, `_bootstrapTenantAdmin` (`routes/auth.js` line 124) calls `resolveOrCreatePersonForIdentity`, so the new person now exists (a `people` row) but has **no** `team_memberships` row; the admin bootstrap does nothing because the tenant already has an admin.
3. `resolveRoleForPerson` (`modules/user-roles.js` line 154) finds the person, finds no membership for that person and tenant, and takes its "defensive fallback" (line 175): `resolveRoleForTenant`, which runs `SELECT role FROM team_memberships WHERE tenant_id = $1 LIMIT 1` (line 115) with no `ORDER BY`, so it returns an arbitrary teammate's role. The code comment calls this case one that "should not happen in normal operation"; step 2 makes it happen on every new sign-in to an existing tenant.
4. With the role resolved to `admin`, `handleAuthCallback` skips the first-login check (line 437) and redirects to `/dashboard` instead of `/welcome`. That is the symptom the spec catches.

**Direct reproduction** (scratchpad probe against `fake-test-db`, no server): seed `e2e-alice` as admin of `e2e-shared-org`; create a brand-new person with `resolveOrCreatePersonForIdentity`; call `resolveRoleForPerson` for that person in that tenant. Result: `admin`.

**Why it matters.** The same query runs against the real database in production wiring (`server.js` line 797). Any tenant shared by more than one person (the `TENANT_ORG_ALLOWLIST` mode, or any tenant where people are added) is exposed: a person with no membership row can receive another member's role, including admin. Whether the production deployment currently uses a shared tenant, and whether a membership row is always written before first sign-in on some other path, was not checked (no production configuration or data was read); both decide how exposed production is today. It is also why the history says this spec has failed since it was written: the earlier fix on this line (tir-s9) addressed which person is looked up, not what happens when the person has no row.

**Likely fix, for a story (not started):** when a person resolves but has no membership in the tenant, return the lowest-privilege default (`'user'`) instead of a tenant-wide lookup, and keep `resolveRoleForTenant` only for callers that have no person at all (or give it a deterministic order and no admin default). The story needs a test that signs in a no-membership person to a tenant with an admin and asserts `'user'`, plus the unchanged `bri-s3.6` spec, which then passes by itself.
