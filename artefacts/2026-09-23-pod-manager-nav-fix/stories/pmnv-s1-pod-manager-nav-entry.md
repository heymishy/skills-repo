## Story: Add Pod Manager to the sidebar nav

**Epic reference:** None — short-track (found via live operator poking at staging during ep4-s1's Definition of Done, `new-feature-2b74a292`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner or feature lead**,
I want **Pod Manager reachable from the sidebar, the same way every other admin-adjacent page is**,
So that **I can create and manage pods without already knowing to type `/admin/pods/manager` directly into the address bar**.

## Benefit Linkage

**Metric moved:** Direct UX-defect fix (short-track, no formal benefit-metric artefact) — found live during `ep4-s1`'s Definition of Done (operator: *"And I didn't see any way to access it from ui, other than assigning a existing pod"*). Investigation (this session, logged in `workspace/capture-log.md` 2026-09-23) confirmed: `/admin/pods/manager` has never had a sidebar nav entry, in any story since `ep1-s1` first shipped it. It is the single, complete, authoritative source of every sidebar item (`NAV_ITEMS` in `src/web-ui/utils/html-shell.js`) — confirmed by direct read, not inference. This is the exact same "API shipped, UI never wired" pattern this file's own code comments document happening twice before (`admin-credits`, `admin-mock-gateway`) and being fixed both times with a `NAV_ITEMS` entry. Pod Manager, the oldest of the three, never got the same fix.

**How:** Add one `NAV_ITEMS` entry for Pod Manager, in the main (non-account) section alongside the existing `org-kanban` entry — pods are tenant/org-wide, not scoped to a single product, so they belong with `Org board`, not inside the account-settings bottom section.

## Architecture Constraints

- **No new route, no new handler.** `GET /admin/pods/manager` already exists (`server.js`, `ep1-s1`) and is fully functional — confirmed live on staging during `ep4-s1`'s validation (real pod creation, real roster, real Save flow all work correctly). This story only adds the missing nav entry pointing at it.
- **Access level must match the real route's own guard, not be invented.** `/admin/pods/manager` (and `/api/pods/create`, `/api/pods`) are wrapped in `authGuard` only — no `requireAdmin`/`requireNonViewer` wrapper (confirmed by direct read of `server.js`'s route registration). The new nav entry must therefore be visible to every authenticated user, **not** `adminOnly: true` — an `adminOnly` entry pointing at a non-admin-gated route would be a real, new inconsistency this story must not introduce.
- **`check-b2-account-nav.js`'s existing dangling-link regression test** (`pathRegisteredInServer`, checks every `NAV_ITEMS` href resolves to a real route in `server.js`) already covers this new entry automatically — no new regression-check machinery needed, only confirmation the existing one still passes (it will, since the route is already real and registered).

## Dependencies

- **Upstream:** `ep1-s1` (Pod Manager itself, merged months ago) — this story only completes its nav wiring.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given any authenticated, non-viewer user, When the sidebar renders, Then a "Pod Manager" nav item is present in the main (non-account) section, alongside "Org board".

**AC2:** Given the "Pod Manager" nav item, When inspected, Then its `href` is `/admin/pods/manager` and it is **not** marked `adminOnly` (visible to every authenticated user, matching the real route's own `authGuard`-only access level).

**AC3:** Given a non-admin authenticated user, When the sidebar renders, Then "Pod Manager" is still present (regression guard distinguishing this from `admin-credits`/`admin-mock-gateway`, which ARE correctly `adminOnly`).

**AC4:** Given the existing `check-b2-account-nav.js` dangling-link regression suite, When re-run after this change, Then it still passes — the new entry's `href` resolves to a real, registered `server.js` route.

## Out of Scope

- **Any change to `/admin/pods/manager`'s own page content, the Pod Manager UI itself, or `ORG_ROSTER`'s hardcoded-fixture nature.** That is a separate, larger concern (logged in `workspace/capture-log.md`, 2026-09-23) requiring its own `/discovery` pass, not this story.
- **Any change to the pod-assignment UI shipped by `ep4-s1`** (the "⚙ Pods" per-feature-row button and modal) — unaffected by this story.
- **Restructuring the sidebar's main vs. account sections** beyond adding this one entry — `renderSidebar`'s existing section logic is reused unchanged.

## NFRs

- **Correctness:** The nav item must render identically regardless of `isAdmin` (unlike `admin-credits`/`admin-mock-gateway`, which are conditionally rendered).
- **No regression to `ep1-s1`/`b2`/`alrf-s7`'s existing nav/Pod-Manager behavior** — `check-b1-nav-fix.js`, `check-b2-account-nav.js`, and `check-ep1-s1-pod-creation.spec.js` must remain green, unmodified.

## Complexity Rating

**Rating:** 1 — a single, well-understood fix mirroring an already-proven pattern (`b2`'s own `NAV_ITEMS` addition for `admin-mock-gateway`), touching one array literal in one file.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
