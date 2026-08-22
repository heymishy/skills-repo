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

## Architecture Decision Records

<!-- None yet — the require-admin.js resolver refactor (see ARCH entry above) is scoped and small enough to remain a log entry, not a full ADR. Promote to an ADR here if the refactor surfaces a broader reusable-middleware pattern worth applying beyond this feature. -->
