# Epic: Viewer-role people are actually restricted to read-only access

**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/benefit-metric.md`
**Slicing strategy:** Risk-first — the biggest technical unknown is whether a new write-blocking gate can be layered onto the existing role model without breaking legitimate `engineer`/`product` access (a risk the discovery itself names explicitly). Story 1 builds the shared gate mechanism and proves it against the highest-value routes first, de-risking the pattern before rolling it out further. Stories 2–4 then extend proven-safe coverage to progressively lower-traffic route groups.

## Goal

A person assigned the `viewer` role can browse and read everything in the product exactly as before, but every real write action across Products, Features/journeys, Skill sessions, Credits/billing, and the identified edge-case routes returns a real, tested denial instead of silently succeeding. `engineer`, `product`, and `admin` roles see zero change in their own access. The gap between what "viewer" implies (read-only) and what it has actually enforced since the role was introduced (nothing) is closed.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    subgraph existing[Existing pattern]\n        RA[middleware/require-admin.js]\n    end\n    subgraph new[New in this epic]\n        RNV[middleware/require-non-viewer.js]\n    end\n    RNV -. reuses live-role adapter .-> RA\n    RNV --> PROD[routes/products.js]\n    RNV --> JRN[routes/journey.js]\n    RNV --> SKL[routes/skills.js]\n    RNV --> BIL[routes/billing.js]\n    RNV --> AGP[routes/agency-provisioning.js]\n    RNV --> ANN[routes/annotation.js]\n    PROD -.vrne-s1.-> S1[Products + Features routes]\n    JRN -.vrne-s1.-> S1\n    SKL -.vrne-s2.-> S2[Skill session routes]\n    BIL -.vrne-s3.-> S3[Credits/billing routes]\n    AGP -.vrne-s4.-> S4[Edge-case routes]\n    ANN -.vrne-s4.-> S4"}}---

## Out of Scope

- **Team-management routes** — already fully `requireAdmin`-gated; nothing to change there (confirmed via full codebase audit at `/definition`).
- **A generalised permission/RBAC framework** — this epic adds one additional role check (deny-if-viewer) alongside the existing `requireAdmin` pattern; it does not redesign the role model itself or introduce fine-grained per-route permission configuration.
- **Auditing whether any real production tenant currently has a viewer-role person** — a separate, potentially urgent investigation the discovery flagged but explicitly did not resolve; not part of implementation scope.
- **Low-traffic personal-preference routes** (`/settings/theme-toggle-clicked`, `/settings/locale-preference`) — these write personal UI preferences and analytics events, not tenant data; excluded from all 4 stories as not meaningfully write-shaped in the sense `viewer` implies restriction from.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Viewer role actually enforces read-only access | 0% of any write action blocked | 100% of the enumerated write-action set returns a real denial for a viewer-role session | Each story wires the shared gate to a route group and adds a test asserting denial |
| Enumerated viewer-role write actions blocked (Tier 3 risk-reduction) | All enumerated routes currently unenforced | 0 remaining unenforced routes in the enumerated set | Same mechanism — each story reduces the count of unenforced routes to 0 for its group |

## Stories in This Epic

- [ ] vrne-s1: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes
- [ ] vrne-s2: Wire the viewer-write-block gate to Skill session routes
- [ ] vrne-s3: Wire the viewer-write-block gate to Credits/billing routes
- [ ] vrne-s4: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This is a security/access-control change touching many real routes across the app. Matches the oversight level already used for this session's other access-control fixes (`jatg-s1`, `lrtc-s1`) — not High, since the pattern (mirror `requireAdmin`'s existing, already-proven fail-closed structure) is well-understood and low-ambiguity, but not Low either, given the risk of over-broadly gating a route that should stay open.

## Complexity Rating

**Rating:** 2
**Rationale:** Some ambiguity in route enumeration was resolved at `/definition` via a full codebase audit and an explicit operator scope decision, but the underlying mechanism (mirror `requireAdmin`'s fail-closed, live-role-checked pattern) is well-understood and already proven in this codebase.

## Scope Stability

**Stability:** Stable — the route enumeration was confirmed via direct codebase audit (not assumption) and the operator explicitly chose the full candidate set (Products/Features, Skill sessions, Credits/billing, edge cases) at `/definition`. Team-management was confirmed out of scope (already admin-gated). Low risk of scope drift during implementation.
