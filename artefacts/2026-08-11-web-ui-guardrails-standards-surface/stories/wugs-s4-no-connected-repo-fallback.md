## Story: Show org-level guardrails/standards even when a product has no connected repo

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead whose product hasn't connected a GitHub repo yet**,
I want **to still see my tenant's org-level guardrails/standards, with a clear prompt to connect a repo for product-level content**,
So that **the feature is useful during onboarding, not just after a repo is connected** (per `decisions.md`'s SCOPE entry resolving this exact question during `/clarify`).

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** The target for M1 is "100% of active products... render a populated, correctly-delineated view" — without this story, any product without a connected repo would show a broken or empty page instead of a correct partial view, which the metric's target explicitly requires this story to prevent.

## Architecture Constraints

- **Reuses `wugs-s2`/`wugs-s3`'s existing branching** — the product-level section already has a "not found in this repo" state (`wugs-s2` AC3); this story adds the *no repo at all* case as a distinct, explicit state (not the same as "repo exists but empty"), and reuses the existing repo-connection UI entry point (`rpc-s1`/`prc-s2.1`'s "Connect a repo" flow) for the prompt — no new connection mechanism invented.
- **Consistent with `rapp-s2`'s nav-wiring fix** — the empty product-level state still renders inside the full page shell with working nav, not a bare fragment.

## Dependencies

- **Upstream:** `wugs-s2`, `wugs-s3` must both be complete (this story composes their existing states).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product with no `repo_owner`/`repo_name` set, When the guardrails/standards view is rendered, Then the product-level section shows a "connect a repo to see product-level guardrails/standards" prompt, distinct from `wugs-s2`'s "none found in this connected repo" state — the two must be visually/textually distinguishable, not the same empty-state copy.

**AC2:** Given a product with no connected repo, When the view is rendered, Then the org-level section (from `wugs-s3`) still renders normally — the whole feature is not blocked or hidden.

**AC3:** Given the "connect a repo" prompt is shown, When clicked, Then it navigates to the existing repo-connection flow (`rpc-s1`/`prc-s2.1`) — reusing the existing entry point, not a new one.

**AC4:** Given a product connects a repo after previously showing the fallback state, When the guardrails/standards view is next loaded, Then it shows `wugs-s2`'s normal product-level content — the fallback state is not sticky/cached past the repo connection.

## Out of Scope

- **Changes to the repo-connection flow itself** — reused as-is.
- **Auto-prompting a repo connection anywhere else in the product UI** — this story's prompt lives only within the guardrails/standards view.

## NFRs

- **Performance:** None beyond `wugs-s2`/`wugs-s3`'s existing targets.
- **Security:** None new.
- **Accessibility:** The "connect a repo" prompt is a real link/button, keyboard-accessible — not a non-interactive text hint.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — composes two already-built states, no new mechanism.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)
