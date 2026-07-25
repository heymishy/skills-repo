# Decisions: Feature Display Name & Progress Proxy

## Context (2026-07-25)

Live operator usage surfaced three related findings on the same session: (1) the "New feature" modal has no name-input field and there's no way to rename a feature afterward, resulting in kanban boards cluttered with `new-feature-<hex>`-style slugs; (2) the default "? Unknown" health badge / "No test data yet" coverage label shown for every brand-new feature reads as a broken state rather than early progress; (3) there is no feature-level edit/delete capability at all (product delete already exists).

This artefact folder covers findings (1) and (2), scoped as two independent short-track stories (`fdn-s1`, `fps-s1`). Finding (3) — feature delete/rename-as-a-settings-surface, product rename — was intentionally deferred: it involves separate product decisions (soft vs. hard delete, confirmation UX) not yet discussed with the operator.

## RESOLVED — `featureSlug` stays immutable; add a separate `displayName` field (2026-07-25)

**Context:** `featureSlug` is the real identifier behind disk artefact paths (`artefacts/<slug>/...`), `pipeline-state.json` keys, and every journey-store lookup. The operator's own framing of the naming gap ("no way to change / edit a name") could be read as "let the slug itself be edited."
**Decision:** `featureSlug` is never mutated. A new, independent `displayName` field is added — optional at creation, editable anytime after — rendered everywhere a feature's identity is shown, falling back to the raw slug when absent.
**Rationale:** Changing `featureSlug` post-creation means migrating artefact folders and rewriting `pipeline-state.json` keys across the whole pipeline — a structurally different and much riskier change than giving a feature a human-readable label. The operator confirmed this directly: "don't want to break a key."
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.

## RESOLVED — replace the "Unknown" health default with a pipeline-progress proxy, not a visual redesign (2026-07-25)

**Context:** Every brand-new feature (before it reaches `/test-plan`) shows `health: 'unknown'` → "? Unknown" and a coverage label of "No test data yet" — the operator's own report flagged this as uninformative and floated needing `/frontend-design` for it.
**Decision:** Scoped as a copy/logic fix, not a visual redesign: when `health === 'unknown'`, render stage-derived progress information (current stage, artefact count) instead of the bare "Unknown"/"No test data yet" wording — using the existing pill/label visual treatment (no new component, no new color). Real health signals (green/amber/red, computed from actual test/DoD data) are untouched.
**Rationale:** Operator agreed pipeline-progress framing is the right direction ("2 agree pipeline progress is good") without asking for a visual treatment change. `/frontend-design` stays available as a follow-on if the operator later wants the badge's visual design itself reworked, but isn't invoked for this bounded fix.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.
