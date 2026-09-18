## Definition of Ready: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18 (re-run following story scope expansion — see decisions.md for the full architecture-correction trail)

---

## Contract Proposal

**What will be built:**
1. Updated CSS custom-property values in `src/web-ui/utils/html-shell.js`'s `:root`/dark-mode blocks (`--green`/`--amber`/`--red` → `--success`/`--warn`/`--danger` rename, plus all color hex values matching `DESIGN.md`'s token tables).
2. Markup/layout changes in `src/web-ui/routes/artefact.js`'s `handleArtefactRoute` — the REAL render path (`renderArtefactToHTML` + `renderShellWithNav`, NOT `views/artefact-view.js`'s dead-code `renderArtefact`) — to match `DESIGN.md`'s "Artefact/document viewer" layout pattern.
3. A real, functional Sign-off sidebar card: server-side status detection at render time (call the existing, already-tested `detectExistingSignOff(markdown)` from `adapters/sign-off-writer.js` against the already-fetched markdown), rendering either an active "Sign Off" button (not yet signed off) or the approver/date (already signed off, per AC6). A new client-side script wires the button to the existing, real `POST /sign-off` endpoint (`handleSignOff`, unmodified), handling all its real response shapes (200/400/401/409/429).
4. A real, functional Comments sidebar card backed by NEW infrastructure: a new comments module (new table, migration function, `createComment`/`listCommentsForResource`, modeled on `modules/agency-client-comments.js`'s real structure but WITHOUT its `org_id`/`org_type` scoping), two new CSRF-guarded routes (create/list, modeled on `handleCreateAgencyComment`/`handleListAgencyComments` in `routes/products.js`), the migration wired at server startup via `_userRolesPool` (matching the real `migrateAgencyClientGrantsSchema` precedent), and a client-side script for posting/listing.
5. The new client-side script (Sign-off + Comments interactions) and its static route, landing in the same commit (pairing lesson from `ep2-s1`'s own missed-route bug, already established elsewhere in this feature).

**What will NOT be built:**
Any change to `handleSignOff`'s own existing backend logic (rate limiting, path validation, GitHub commit mechanics, 409-duplicate detection) — reused exactly as-is. Any change to `handleArtefactRoute`'s existing injectable adapters (`setFetcher`, `setJourneyStore`, `setLogger`). Reuse of `modules/agency-client-comments.js` — deliberately not reused (org-scoping mismatch, see Architecture Constraints). Comment editing/deletion (append-only MVP). The light/dark toggle mechanism itself.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout + real functional sidebar cards) | Playwright: structural + interactivity assertions | E2E |
| AC4 (no regression) | Playwright: re-run 4 pre-existing specs | E2E |
| AC5 (sign-off button sends real POST) | Playwright: `page.route` call-observation (request-sending only — see Coverage gaps); manual scenario for the full success round trip | E2E + Manual |
| AC6 (already-signed-off shows approver, not button) | Unit: `detectExistingSignOff` fixture tests + render-logic integration test | Unit |
| AC7 (comments list + empty state) | Unit + Integration + E2E | Unit/Integration/E2E |
| AC8 (comment submission persists, no reload) | Unit + Integration + E2E | Unit/Integration/E2E |

**Assumptions:**
`handleArtefactRoute` (not `renderArtefact`) is the real render target (confirmed via direct trace). `handleSignOff`/`detectExistingSignOff` are correctly understood from direct code read. The new comments module correctly omits org-scoping (confirmed via direct trace of `agency-client-comments.js`'s real call sites, all requiring a `clientOrgId`/`agencyOrgId` this product's general users don't have). `_userRolesPool` and `_pshPool` share the same real `DATABASE_URL` (confirmed via direct trace) — a table migrated via one is visible via the other.

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/artefact.js`, `src/web-ui/server.js`. New files: a new comments module (e.g. `src/web-ui/modules/artefact-comments.js`), a new client-side script (e.g. `src/web-ui/public/artefact-sidebar.js`) and its static route. Services: Postgres (new `comments`-equivalent table, migrated via `_userRolesPool`). APIs: 2 new routes (create/list comments), 0 new routes for sign-off (fully reused).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 8 ACs, no mismatches. This Contract is grounded in substantially deeper real-code investigation than a typical first-pass DoR (3 rounds of direct tracing: the real render path, the real sign-off endpoint's response shapes, the real comments-module precedent and why it's deliberately not reused) — all fully documented in `decisions.md`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Dual persona ("a beta user... and... Hamish King") — flagged LOW in `/review` run 2, not a block |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC8 all covered (20 tests total) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 7 genuine items, expanded for the new functional scope |
| H5 | Benefit linkage field references a named metric | ✅ | "Visual consistency across the 4 real screens" — note: AC5-AC8's own functional rationale is documented but doesn't trace to a *separate* metric; RISK-ACCEPTed in `decisions.md` ([2-M1]/[2-M2]) |
| H6 | Complexity is rated | ✅ | Rating: 2 (revised up from 1, reasoned in the story itself) |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings, review PASS run 2 |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 1 gap (AC5's real GitHub-write success/409 round trip — External-dependency type, explicitly acknowledged with a manual scenario, matching this codebase's own established precedent for `POST /sign-off` testability) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Extensively populated (7 distinct constraint entries, each grounded in a direct code trace); Category E scored 5/5 in review run 2 |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ | AC5's manual portion is an External-dependency gap, not CSS-layout-dependent — H-E2E's specific trigger condition doesn't apply; Playwright is configured regardless |
| H-NFR | NFR profile exists or story has "NFRs: None" | ✅ | `artefacts/2026-09-18-design-system-adoption/nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has documented human sign-off | ✅ | No compliance NFRs — `regulated: false`, N/A |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Public" declared (feature-level NFR profile; this story's own NFRs section additionally names Security/Audit requirements specific to the new comments feature) |
| H-GOV | Discovery `Approved By` populated, non-engineering-only | ✅ | Same discovery artefact — already confirmed |

**H8-ext:** No upstream dependencies declared — "Upstream: None" — schema check not required.

**H-ADAPTER:** The new comments module's `createComment`/`listCommentsForResource` functions take `pool` as an explicit argument (matching `agency-client-comments.js`'s own real, documented precedent: "no D37 injectable adapter here... an internal adapter over the existing DB pool, not a swappable external integration") — NOT a D37-style injectable `setX()` adapter. Not applicable.

**H-INF / H-MIG:** `hasInfraTrack`/`hasMigrationTrack` both absent — skipped. (Note: this story DOES add a real Postgres migration, but via the established `migrateXSchema(pool).then()/.catch()` fire-and-forget startup pattern every other module in this codebase uses — not the `/infra-plan` or `/schema-migration-review` gated track those flags trigger. Confirmed this is the correct, lighter-weight path by matching precedent: `migratePodsSchema`, `migratePodAssignmentsSchema`, `migrateFeatureCollaboratorsSchema`, and `migrateAgencyClientGrantsSchema` all use this exact same pattern with neither flag set.)

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 3 MEDIUM findings from `/review` run 2 ([2-M1], [2-M2], carried-forward [1-M2]) already logged as RISK-ACCEPT in `decisions.md` | Already done, see `decisions.md` |
| W4 | Verification script reviewed by a domain expert | ✅ | — | Operator confirmed the original script; the amended script (version 2) adds 4 new scenarios for the new functionality, not yet re-confirmed by the operator — flagging this explicitly rather than silently assuming carry-forward approval |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | The 1 gap (AC5 manual portion) is explicitly typed and mitigated, not "UNCERTAIN" |

**W4 resolution:** the amended verification script (version 2) has 4 new scenarios (5-8) beyond what the operator already confirmed for version 1. Recommend a quick operator confirmation of the new scenarios specifically before coding begins, matching this codebase's own W4 discipline — noting this as an open item rather than silently treating the original "OK verified scripts" confirmation as covering scope that didn't exist yet at that time.

---

## Oversight level

**Oversight:** Medium (inherited from parent epic — "Visual Restyle Rollout")
**Rationale:** Real, already-shipped, in-production screen with real users; this story now also introduces real new backend functionality (a new database table, 2 new routes) — human review at PR is warranted, not full autonomous merge, more so than the original narrower restyle-only scope.

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md

Goal:
Make every test in the test plan pass. This story has two real parts:

PART A -- Visual restyle: update src/web-ui/utils/html-shell.js's
:root/dark-mode CSS custom-property blocks to match DESIGN.md's token tables
exactly (including renaming --green/--amber/--red to --success/--warn/--danger).
Restyle src/web-ui/routes/artefact.js's handleArtefactRoute (the REAL render
path -- do NOT touch views/artefact-view.js's renderArtefact, confirmed dead
code, never dispatched) to match DESIGN.md's "Artefact/document viewer" layout
pattern and the Skills Platform - Artefact Viewer.dc.html reference mock.

PART B -- Real new Sign-off/Comments functionality (this is genuinely new
functionality, not restyle -- see decisions.md for the full investigation that
led here):
1. Sign-off card: in handleArtefactRoute, after fetching the markdown, call
   the existing detectExistingSignOff(markdown) function (adapters/sign-off-
   writer.js) to determine sign-off status at render time. Render an active
   "Sign Off" button if null, or the approver/date if already signed off.
   Wire a new client-side script to POST /sign-off (the existing, unmodified
   handleSignOff endpoint) on button click, handling all its real response
   codes (200 success -> update card without reload; 400/401/409/429 -> show
   an appropriate message, do not silently fail).
2. Comments card: build a new comments module (new table + migration
   function + createComment/listCommentsForResource, modeled on
   modules/agency-client-comments.js's real structure but WITHOUT org_id/
   org_type scoping -- this product's users don't have agency/client
   relationships). Wire the migration at server.js startup via
   _userRolesPool, matching the exact migrateAgencyClientGrantsSchema
   pattern (fire-and-forget .then()/.catch(), not hasMigrationTrack-gated).
   Add 2 new CSRF-guarded routes (create/list), modeled on
   handleCreateAgencyComment/handleListAgencyComments in routes/products.js.
   Wire the same new client-side script to list comments on page load and
   post new ones without a full reload.

Constraints:
- Reuse and extend the existing CSS custom-property architecture -- do not
  introduce a parallel styling mechanism.
- Do NOT modify handleSignOff's own backend logic (routes/sign-off.js) --
  reuse it exactly as it already works.
- Do NOT reuse modules/agency-client-comments.js directly -- it requires a
  real org_id/org_type this product's users don't have. Build new, simpler
  infrastructure instead.
- New comment endpoints MUST be CSRF-guarded (authGuard + csrfGuard), matching
  the real, established pattern at the existing /api/agency/comments and
  /client/comments routes in server.js.
- Escape comment body content before rendering (XSS prevention, matching this
  codebase's own _escapeHtml convention).
- The new client-side script and its static route must land in the SAME
  commit (client-script + static-route pairing lesson, already established
  elsewhere in this feature).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share the DoR artefact with tech lead awareness (operator is both roles in this solo-operator context). W4 flags the amended verification script's 4 new scenarios as not yet explicitly re-confirmed — recommend a quick operator look before /branch-setup proceeds further, though this does not block DoR sign-off itself.
**Signed off by:** Not required (Medium oversight)
