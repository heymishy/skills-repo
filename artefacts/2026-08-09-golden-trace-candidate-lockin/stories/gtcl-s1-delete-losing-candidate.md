## Story: Lock the golden-trace demo to one candidate and delete the other

**Epic reference:** None — short-track (bounded follow-up, DoD-flagged gap)
**Discovery reference:** None — short-track skips discovery; scope is the DoD-confirmed gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [ui]

## User Story

As an **operator responsible for what actually ships to a public landing page**,
I want **the golden-trace demo to render exactly one, deliberately-chosen real feature's content, with no unused comparison scaffolding left in production code**,
So that **the page matches what `lphf-s1`'s own AC3 and `decisions.md` D2 committed to — a one-time build-time selector that resolves to a single choice, not a permanent dual-content toggle**.

## Benefit Linkage

**Metric moved:** Direct correctness/scope-closure fix (short-track, no formal benefit-metric artefact) — found during `/definition-of-done` for `lphf-s1` (2026-08-09): `src/web-ui/content/golden-trace-content.js` still contains both `CANDIDATES.kanban` and `CANDIDATES.diagram`, plus the live `ACTIVE_CANDIDATE` toggle, in production code. `lphf-s1`'s AC3 explicitly required the losing candidate's content deleted entirely before merge, and `decisions.md` D2 explicitly frames this as "no lasting toggle, config flag, or content-management capability ships to production" — both violated as currently shipped.

**How:** Direct source inspection confirms the mechanism is exactly as originally built (`ACTIVE_CANDIDATE = 'kanban'`), with `diagram` never removed. `decisions.md` D2 itself does not record which candidate was actually chosen or why — it only documents the *mechanism* for comparing them, with the actual choice explicitly deferred to "tracked via `lphf-s1` AC3." That tracking never closed. `kanban` (`interactive-kanban-boards`/`s3.1`) has been the active, live-rendering candidate since merge, with no negative signal against it — but no explicit, reasoned decision confirming it as the deliberate winner (as opposed to simply being whatever value was set during implementation) exists anywhere in this repo's artefacts.

## Architecture Constraints

- **This story makes the actual selection decision, not just the deletion.** A one-line note comparing the two candidates against the original discovery framing (which persona/objection each answers, which reads more concretely "real" to a skeptical outside visitor) must be logged in this feature's own `decisions.md` before deleting anything — closing the D2 revisit trigger properly, not just mechanically removing code.
- **No change to the page's other 4 hero cards, the demo's 4-frame rendering structure, or `landing.html`'s CSS.** This story touches only `golden-trace-content.js`'s content object and the `ACTIVE_CANDIDATE` selector mechanism itself.
- **No D37/adapter concern:** `ACTIVE_CANDIDATE` is a plain build-time constant, not an injectable adapter.

## Dependencies

- **Upstream:** `lphf-s1` (already merged, PR #683) — this story closes its own AC3 gap.
- **Downstream:** None known. No other story reads `CANDIDATES.diagram` or `ACTIVE_CANDIDATE` directly (confirmed via grep — only `golden-trace-content.js` itself and its own test file reference these symbols).

## Acceptance Criteria

**AC1:** Given both candidates' content and the original discovery framing (which persona/objection each answers), When the selection decision is made, Then it is logged in `artefacts/2026-08-08-landing-page-hero-features/decisions.md` as a new entry closing D2's revisit trigger — naming the winner and the reasoning, not just restating that a mechanism existed.

**AC2:** Given the selection decision from AC1, When `src/web-ui/content/golden-trace-content.js` is inspected after this story ships, Then only the winning candidate's content remains — the losing candidate's `prompt`/`discovery`/`dor`/`shipped` strings are deleted entirely, not commented out or left dead.

**AC3:** Given only one candidate remains, When `renderGoldenTraceHtml()` is inspected, Then the `ACTIVE_CANDIDATE` selector mechanism and the `CANDIDATES` lookup object are removed or collapsed to the single remaining candidate's content directly — no toggle, flag, or dead selection code remains reachable in production.

**AC4:** Given the existing `tests/check-lphf-s1-golden-trace-demo.js` test suite, When re-run after this change, Then it still passes — updated as needed to reflect the single-candidate structure (its own AC2, "flip a config value between the two candidates," is retired along with the mechanism it tested, and should be replaced with an equivalent regression guard confirming the remaining candidate's content renders correctly).

**AC5:** Given the live, deployed landing page, When rendered after this story merges and deploys, Then the golden-trace demo section's rendered content is byte-identical to what it rendered before this change (assuming `kanban` is confirmed as the winner in AC1) — this is a code-cleanup story, not a content change, so the visible page must not visibly change as a result.

## Out of Scope

- **Re-opening the choice of which feature to use as the demo entirely** (e.g. proposing a third candidate). This story closes the existing, already-scoped two-candidate comparison D2 set up — not a new comparison process.
- **Any visual/content change to the 4-frame demo's presentation.** Only the content-selection mechanism is touched.

## NFRs

- **Performance:** Negligible — removing a lookup/branch is strictly cheaper, not measurably so at this scale.
- **Security:** None identified.
- **Accessibility:** Not applicable — no markup/structure change (AC5 requires byte-identical rendered output).
- **Audit:** Improves — closes an open decision-tracking gap (D2's revisit trigger) that has been sitting unresolved since merge.

## Complexity Rating

**Rating:** 1 — a content-selection decision (one paragraph of reasoning) plus a mechanical deletion; no new logic.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
