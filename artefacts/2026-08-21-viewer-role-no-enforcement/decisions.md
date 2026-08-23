# Decision Log: viewer-role-no-enforcement

**Feature:** Viewer role has no actual write-blocking enforcement
**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Last updated:** 2026-08-22

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-22 | SLICE | definition**
**Decision:** Risk-first slicing strategy — `vrne-s1` builds the shared viewer-write-block gate and proves it against the highest-value route group (Products + Features/journeys) first; `vrne-s2`/`vrne-s3`/`vrne-s4` extend proven-safe coverage to progressively lower-traffic route groups (Skill sessions, Credits/billing, edge cases).
**Alternatives considered:** Vertical slice (each story a thin end-to-end slice), walking skeleton (mechanism-only first story with no real route wired), user journey (stories follow a viewer-role person's chronological path through the app).
**Rationale:** The biggest technical unknown here is whether a new write-blocking gate can be layered onto the existing role model without breaking legitimate `engineer`/`product` access — a risk the discovery itself names explicitly. Risk-first directly targets that unknown before committing to full route coverage.
**Made by:** Hamish King (Founder/Operator), via `/definition`
**Revisit trigger:** None — sequencing is locked once `vrne-s1` proves the mechanism.
---

**2026-08-22 | SCOPE | definition**
**Decision:** All 4 candidate route groups identified in the `/definition`-time codebase audit (Products + Features/journeys, Skill sessions, Credits/billing, and edge cases — agency client creation/invite plus artefact annotations) are in MVP scope, each covered by its own story. Team-management routes were confirmed already fully `requireAdmin`-gated and excluded entirely — no story needed there.
**Alternatives considered:** A narrower MVP covering only the highest-value group (Products + Features) with the rest deferred to a follow-up feature.
**Rationale:** Discovery's own MVP scope item 1 explicitly deferred full route enumeration to `/definition` ("this is the real open question this discovery needs to resolve"). The full codebase audit (via an Explore agent) found no route group not worth closing — Skill sessions in particular represent the highest real-cost write action in the app. Operator confirmed the full 4-group scope via explicit multi-select rather than a narrower default.
**Made by:** Hamish King (Founder/Operator), via `/definition`
**Revisit trigger:** None — scope is locked for this feature's 4 stories.
---

**2026-08-22 | ARCH | review**
**Decision:** `src/web-ui/middleware/require-admin.js` will be refactored to export a shared, reusable role-resolution helper (e.g. `resolveRole(req)`) that both `requireAdmin` and the new viewer-write-block gate call, rather than each gate independently reading `req.session.role` and calling the live-role adapter. This refactor is an explicit sub-task of `vrne-s1`, not an incidental side effect.
**Alternatives considered:** Accept a scoped duplication of the session-role-read + live-role-check logic inside the new gate file, matching `requireAdmin`'s existing shape without touching it.
**Rationale:** Raised as review finding `1-M1` on `vrne-s1`: the story's own Architecture Constraint asserted reuse of `requireAdmin`'s live-role-resolution call, but `require-admin.js`'s current exports (`requireAdmin`, `setLogger`, `setGetCurrentRole`) provide no separable resolver to reuse as written. Duplication was rejected because the two gates could silently drift apart over time (e.g. a future security fix to the live-role-check landing in one gate but not the other) — the same drift risk this repo has already paid for once with `requireAdmin`'s own `tir-s9`/`lrtc-s1` history of the live-role-check logic evolving incrementally. A shared resolver keeps both gates observing identical role-resolution behaviour by construction.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via `/decisions` following `/review` finding `1-M1`
**Revisit trigger:** None — resolved. `vrne-s1`'s implementation plan must include the `require-admin.js` refactor as a named task, distinct from the new gate's own task, mirroring CLAUDE.md's own injectable-adapter-rule discipline (wiring and consuming code are separate tasks).
---

**2026-08-22 | SCOPE | review**
**Decision:** `vrne-s2`'s two carved-out Skill session routes (`canvas-edit`, `assumption-confirm`) are added to MVP scope as explicit ACs, rather than narrowing the epic's Goal wording to accept a permanent gap. `vrne-s2`'s story and the parent epic's "every real write action" claim now match.
**Alternatives considered:** Keep the carve-out as originally written and revise the epic's Goal paragraph to explicitly acknowledge these two routes remain unenforced by design.
**Rationale:** Raised as review finding `1-M1` on `vrne-s2`: the story's own carve-out silently contradicted the epic's unqualified completeness claim, and would have left the benefit-metric's Tier 3 target ("0 remaining unenforced routes in the enumerated set") permanently unreachable for the Skill sessions group without anyone deciding that on purpose. Closing the gap (rather than accepting it) matches this feature's own reason for existing — closing a role that silently promised more than it delivered; leaving a second, smaller version of exactly that gap inside the fix itself would be a poor outcome. The routes are low-cost to add (no new mechanism, same gate, same route file).
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via `/decisions` following `/review` finding `1-M1`
**Revisit trigger:** None — resolved. `vrne-s2`'s story updated with 2 additional ACs; see story file.
---

---
**2026-08-22 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceed to DoR sign-off for all 4 `vrne` stories without a separate domain-expert review of the AC verification scripts (W4 warning, all 4 stories).
**Alternatives considered:** Pause sign-off until the operator personally walks through all 4 verification scripts against a running instance before assigning to the coding agent.
**Rationale:** Matches the precedent already established for `jatg-s1`'s own W4 acceptance this session. The ACs across all 4 stories mirror an already-proven, low-ambiguity pattern (`requireAdmin`'s existing fail-closed structure) — each scenario is a direct, mechanically-derived reproduction (viewer denied / non-viewer unaffected / denial logged), not a subjective judgment call. `vrne-s4`'s AC5 in particular is a direct regression guard against the exact kind of over-correction a domain-expert review would be checking for (the additive-not-replacing org-type check).
**Made by:** Hamish King (Founder/Operator), via `/definition-of-ready`
**Revisit trigger:** None — accepted for this feature's 4 stories.
---

**2026-08-22 | RISK-ACCEPT | branch-setup**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js`'s single baseline failure in the `vrne-s1` worktree as a pre-existing environmental flake, not a real regression, and proceed.
**Alternatives considered:** Investigate and fix before starting implementation (per `/branch-setup`'s option 1).
**Rationale:** The test's own internal `spawnSync` call to `pwsh` uses a 30s timeout; on this machine `pwsh`'s startup + `validate-trace.ps1`'s full run occasionally exceeds that window (confirmed directly: re-running the identical `pwsh -File scripts/validate-trace.ps1 --ci` with a 60s timeout in the same worktree returns `6 passed, 0 warnings, 0 failed`). Not a code defect in this feature's own changes — no file this feature touches is related to trace validation.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), via `/branch-setup`
**Revisit trigger:** If this recurs across multiple stories/sessions, consider raising the test's own internal timeout (currently hardcoded to 30000ms in `tests/check-p3.5-validate-trace.js`) as a small, separately-scoped fix.
---

---

**2026-08-23 | RISK-ACCEPT | branch-setup (vrne-s2)**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js`'s single baseline failure in the `vrne-s2` worktree as the same pre-existing environmental flake already accepted for `vrne-s1`, and proceed.
**Alternatives considered:** Investigate and fix before starting implementation.
**Rationale:** Identical signature to `vrne-s1`'s own branch-setup RISK-ACCEPT above (`pwsh`'s startup + `validate-trace.ps1`'s full run occasionally exceeding the test's own 30s internal timeout on this machine) — 535 files run, 1 failed, no other files affected. Not a code defect in `vrne-s2`'s own scope.
**Made by:** Claude (agent), via `/branch-setup`, first real post-`loop-design` inner loop run — this story's own execution is being used to measure the `loop-design.md` Tier-2 meta-metrics (commits/task ratio, false-wait incident count, local full-suite run count, wall-clock/task) against `vrne-s1`'s pre-fix baseline.
**Revisit trigger:** Same as `vrne-s1`'s entry — if this recurs across further stories/sessions, raise the test's own internal timeout.
---

**2026-08-23 | ARCH | CI (post-merge-of-loop-design, pre-merge-of-vrne-s1)**
**Decision:** Add `'user'` to `require-non-viewer.js`'s `ALLOWED_ROLES` allowlist (now `['admin', 'engineer', 'product', 'user']`), and fix `tests/check-vrne-s1-server-wiring.js`'s `viewerSession()` fixture to use a real seeded `e2e-viewer` identity (via `/test/seed-multi-user-roles`) instead of an unseeded `tenantId: 't1'`/`login: 'viewer@test'` pair.
**Alternatives considered:** Leave `ALLOWED_ROLES` as `['admin', 'engineer', 'product']` and instead change the signup flow to assign one of those three roles to a brand-new tenant's first user.
**Rationale:** PR #755's "Cross-tenant isolation spec — 20x repeat, zero-tolerance" CI check failed 20/20 with `POST /products/new` returning 403 instead of 200 for a freshly-signed-up tenant. Root cause: `routes/auth-email.js`'s signup handler sets `req.session.role` via `modules/user-roles.js`'s `getRoleForTenant`, which is documented to fall back to the literal string `'user'` when no `team_memberships` row exists yet — i.e. every single-person tenant's first session, the majority real-world case (`tenantId === email`, no team-management action taken). `AC3`'s own text (`vrne-s1-gate-and-products-features.md`) only enumerated `engineer`/`product`/`admin` as the roles that must not regress, borrowing that list from `team-management.js`'s `VALID_ROLES` (`['admin','engineer','product','viewer']`, scoped to invited multi-person-tenant team members) without checking it against the actual default role a brand-new signup receives — a discovery/definition-phase gap this story's own `/review` and `/test-plan` also did not catch, since `check-vrne-s1-require-non-viewer.js`'s unit tests never included `'user'` in either the allowed-roles table or the fail-closed table. Rejected changing the signup flow instead, because `'user'` is the intentional, documented system-wide default (not a bug to route around) and every other code path in this repo already treats it as a legitimate, distinct role from `'viewer'`. Separately, fixing `ALLOWED_ROLES` alone caused `check-vrne-s1-server-wiring.js`'s 33 AC1/AC2 tests to start failing `next() must not be called for viewer` — its `viewerSession()` fixture used an identity (`tenantId: 't1'`, `login: 'viewer@test'`) that was never seeded into the fake in-memory `team_memberships` table, so the live role-resolution adapter (wired process-wide by `server.js`'s bootstrap, which every call in this file goes through even the "isolated" ones) fell through to the same `'user'` default for a DIFFERENT reason (unresolvable identity, not a real viewer) — these 33 tests were passing before only by coincidence (both `'viewer'` and the fallback used to be denied alike), never actually exercising a real `'viewer'`-role resolution. Fixed by seeding a real `e2e-viewer` identity via the same `/test/seed-multi-user-roles` route the story's own integration test already used, matching this repo's own established "seed a real role, don't weaken the gate" precedent (`jsvr-s1` AC3, this same session).
**Made by:** Hamish King (Founder/Operator) + Claude (agent), diagnosing a live CI failure on PR #755
**Revisit trigger:** None — resolved. If a distinct role value beyond `admin`/`engineer`/`product`/`user`/`viewer` is ever introduced (e.g. a billing-only or read-write-limited role), `ALLOWED_ROLES` must be revisited explicitly rather than assumed to inherit team-management.js's `VALID_ROLES` list.
---

**2026-08-23 | RISK-ACCEPT | subagent-execution (vrne-s2, Task 6 code-quality review)**
**Decision:** `vrne-s2`'s isolated `requireNonViewer`-only unit tests (all 9 tests added across Tasks 1-6, covering AC1/AC2/AC3) are accepted as-is, without adding a per-route spy on the underlying cost-incurring function (model call, artefact commit, skill execution) for every one of the 9 tested routes. Real-wiring proof is instead delivered by Task 10's 2 real-`router()`-dispatch integration tests (one Pattern-A route, one Pattern-B route) plus the grep-count checks already run at each GREEN task (2/4/6/8) — not a spy per route.
**Alternatives considered:** Add a spy-based assertion to each of the 9 isolated tests, mocking the relevant handler's inner cost function and asserting it is never invoked, as the test plan's own wording literally calls for ("the critical assertion for AC1–AC3 ... a 403 alone doesn't prove no cost was incurred").
**Rationale:** Raised twice by the Task 4 and Task 6 code-quality reviewer dispatches (Task 6's review explicitly declined a plain ✅, citing this as an "Important" issue): the isolated tests would still pass 9/9 if the actual wiring in `server.js`/`skills.js` were reverted, since they only call `requireNonViewer` directly. This is a real, correctly-identified gap relative to the test plan's literal text — but it is the exact same shape `vrne-s1` shipped and had DoD-accepted: `check-vrne-s1-server-wiring.js`'s own header comment explicitly documents that its 33 route-label tests "do NOT by themselves prove these routes are wired," and compensates with ONE real-dispatch integration test for one representative route from each group, not 33 individual spies. `vrne-s2`'s plan (Task 10, already written and reviewed at DoR) follows the identical model — 2 integration tests (one per wiring pattern, since `vrne-s2` unlike `vrne-s1` has 2 distinct wiring patterns not 1) plus the grep-count evidence already gathered at Tasks 2/4/6/8. Per-route spying across all 9-11 tested routes would be new, heavier coverage than the story's own established sibling precedent, not a restoration of an assumed baseline.
**Made by:** Claude (agent), during `/subagent-execution`, following the Task 6 code-quality reviewer's explicit offer to "defer with a tracked gap noted in the story/test-plan" as an alternative to fixing immediately
**Revisit trigger:** If Task 10's integration tests do not land as planned (e.g. if the story reaches `/verify-completion` without them), this RISK-ACCEPT is void and the gap must be closed before DoR-equivalent sign-off for merge. Re-check at Task 10 completion and again at `/verify-completion`.
---

## Architecture Decision Records

<!-- None yet — the require-admin.js resolver refactor (see ARCH entry above) is scoped and small enough to remain a log entry, not a full ADR. Promote to an ADR here if the refactor surfaces a broader reusable-middleware pattern worth applying beyond this feature. -->
