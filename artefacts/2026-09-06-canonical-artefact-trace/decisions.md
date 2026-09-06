# Decision Log: 2026-09-06-canonical-artefact-trace

**Feature:** Canonical Artefact Trace
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Last updated:** 2026-09-06

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
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** Disk-based artefact reads are confirmed safe for this deployment's own dogfooding case (container's own checkout, always present at deploy time); for the multi-tenant SaaS case (`WUCE_TENANT_ROOT_BASE`), no populator/sync mechanism was found in `src/` or `scripts/` — this remains genuinely unconfirmed, so the canonical builder must support a distinct "not yet synced" state rather than assuming disk is always ready.
**Alternatives considered:** Assume disk is always available everywhere (rejected — direct code inspection found no sync mechanism for the multi-tenant path, so this would be an unverified assumption baked into the design); block MVP scope until the multi-tenant sync mechanism is fully traced (rejected — out of proportion to this feature's own scope, which is the web-UI rendering slice; the multi-tenant sync question is a separate, pre-existing gap this feature doesn't need to resolve to ship).
**Rationale:** Direct grep of `WUCE_TENANT_ROOT_BASE` found only consumers (`as-built-diagrams.js`, `as-built-system-architecture.js`), no clone/sync job. Rather than guess, the design accommodates the uncertainty explicitly (a named "not yet synced" state) instead of assuming it away.
**Made by:** Hamish King — Platform Owner (via /clarify Q1, option C: "uncertain, worth a quick spike/check")
**Revisit trigger:** If a multi-tenant sync/clone mechanism is found or built elsewhere, revisit whether the "not yet synced" state is still needed or can be simplified away.
---

---
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** The canonical builder will attempt to infer story grouping from disk structure (filename/directory patterns) for a feature with zero `pipeline-state.json` registration, but will always show the "unregistered" visual flag regardless of whether inference succeeded.
**Alternatives considered:** Never attempt inference, just show an ungrouped flat list for any unregistered feature (rejected — throws away real, recoverable structure for features like `phase4` where filename patterns clearly indicate story grouping); attempt inference and treat a successful inference as equivalent to real registration, no flag (rejected — this is exactly the "false confidence" failure mode the assumption itself named as a risk).
**Rationale:** Inference is a best-effort UX improvement, not a substitute for real registration — conflating the two would recreate a milder version of the same "silently trust unverified structure" problem this whole feature exists to close.
**Made by:** Hamish King — Platform Owner (via /clarify Q2, option C)
**Revisit trigger:** If inference proves unreliable enough in practice to actively mislead operators, revisit toward the "always flat, never infer" alternative.
---

---
**2026-09-06 | ASSUMPTION | /clarify**
**Decision:** No performance safeguard (file-count cap, depth limit, etc.) is needed for the canonical builder's directory walk in the MVP.
**Alternatives considered:** Add a defensive file-count ceiling with a "truncated" fallback regardless of proven need (rejected as unnecessary insurance once measured) — considered as option C in the /clarify question but not chosen once B's empirical check produced a clear answer.
**Rationale:** Empirically measured directly against this repo: `phase4` (205 files, the single largest feature found in the audit) walks in 6ms; the *entire* `artefacts/` tree (4,955 files, every feature combined) walks in 229ms, and the canonical builder only ever walks one feature's subtree. This is not a close call — no safeguard is justified by the data.
**Made by:** Hamish King — Platform Owner (via /clarify Q3, option B: "needs a quick empirical check")
**Revisit trigger:** If a future feature's artefact directory grows by more than an order of magnitude beyond `phase4`'s 205 files, re-measure before assuming the same conclusion still holds.
---

---

## Architecture Decision Records

This feature's structural decision was written directly as a repo-level ADR (not a feature-scoped one) since it constrains all future features, not just this one — see **ADR-028** in `.github/architecture-guardrails.md` ("A derived structure needs exactly one canonical builder — every consumer reads from it, none re-derive it"), added 2026-09-06 during this feature's own discovery, at the operator's explicit request.

---
