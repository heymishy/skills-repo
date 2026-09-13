## Story: Require verification-strength tagging and a live UI-evidence gate at /verify-completion and /definition-of-done

**Epic reference:** None — short-track (process/governance-file fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope is a direct finding from a 2026-09-12/13 pipeline-state DoD-triage sweep
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator relying on a `COMPLETE` DoD verdict to mean the shipped behaviour genuinely works, not just that its tests pass**,
I want **`/verify-completion` and `/definition-of-done` to require a real browser check, Playwright evidence, or an explicit RISK-ACCEPT before any browser-observable AC can be marked satisfied, and to require every AC's evidence to be tagged with how rigorously it was actually checked**,
So that **a DoD verdict stops silently hiding the difference between "the code runs" and "the real-world effect genuinely happened," which this session found twice on already-shipped, already-`COMPLETE` stories**.

## Benefit Linkage

**Metric moved:** None formal — process/governance fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes two real findings from the 2026-09-12/13 sweep: (1) `tgid-s1`'s DoD closed `COMPLETE` on unit-test evidence alone for a claim about a real, external PostHog side-effect — only a live check (requested separately by the operator) confirmed it, and also surfaced a real, unrelated blocker (PostHog's Group Analytics addon not subscribed) no unit test could ever find. (2) `wusl-s2`'s DoD closed `COMPLETE` on unit-test evidence alone for a claim about surviving a real server restart — the first live-verification attempt tested the wrong scenario entirely, and only a second, corrected attempt (a real multi-turn LLM session, restarted for real) actually proved the claim. Separately, applies an existing, already-approved but unapplied proposal (`workspace/proposals/2026-08-29-verify-completion-improve-proposal.md`, `status: accepted` as of this story) for UI-rendering diffs specifically — that proposal sat `pending_review` for two weeks with no gate anywhere enforcing it, itself direct evidence for why this fix needs to be a hard gate, not documentation.

## Architecture Constraints

- **`skills/verify-completion/SKILL.md` and `skills/definition-of-done/SKILL.md` only** — both are pure conversational-instruction files (Markdown consumed by a model), not executable application code. No `src/`, `scripts/`, or route-handler changes.
- **`.github/scripts/check-skill-contracts.js` must be updated in the same PR** to guard the new required strings in both files — this repo's own established convention (see `evcg-s1`) for any SKILL.md content change, so a future edit can't silently drop the new gate.
- Follow the exact conditional-step pattern already proven for the existing "Route/handler E2E coverage check" in `/verify-completion` — a named trigger condition, an explicit N/A path when the trigger doesn't apply, and a completion-report line surfacing the result. Do not invent a new instructional shape.
- No change to `/branch-complete` or any other skill in this pass — out of scope, see below.

## Dependencies

- **Upstream:** None — both target files exist and are independently editable.
- **Downstream:** None known. `/branch-complete` already references `/verify-completion`'s E2E check "by reference" (per `evcg-s1` AC4) rather than duplicating it; the same pattern means no `/branch-complete` change is needed for this story's own new section.

## Acceptance Criteria

**AC1:** Given a diff that adds, removes, or changes markup, CSS, or client-side script altering what is visually rendered or interactable in a browser, When `/verify-completion` is run, Then it requires one of: a real browser check, Playwright evidence asserting visible state (not just DOM presence), or an explicit RISK-ACCEPT in `decisions.md` — and blocks proceeding to Step 4/`/branch-complete` if none exists.

**AC2:** Given a diff that touches no rendered UI output, When `/verify-completion` is run, Then the live browser render check is stated as explicitly N/A and does not run unconditionally.

**AC3:** Given any AC being assessed in `/definition-of-done`'s Step 2, When its evidence is recorded, Then a verification-strength tag (`unit` / `integration-real-code` / `live-verified` / `production-observed`) must be recorded alongside it, and an AC whose only evidence is `unit`/`integration-real-code` but whose claim is about an external, real-world effect must not be marked ✅ without either performing the live check or recording a Follow-up Action naming the specific gap.

**AC4:** Given an AC in `/definition-of-done` whose satisfaction depends on browser-observable behaviour, When it is being marked ✅, Then the same three-option gate as AC1 (real browser check / Playwright evidence / RISK-ACCEPT) applies — it cannot be marked ✅ on `unit`/`integration-real-code` evidence alone.

**AC5:** Given both SKILL.md files' new sections, When `node .github/scripts/check-skill-contracts.js` is run, Then it passes with the new required strings present for both `verify-completion` and `definition-of-done`.

## Out of Scope

- `/branch-complete` or any other skill file — this story only touches the two named skills.
- Retroactively re-verifying any already-closed story against this new gate (that's what the operator-requested live checks on `tgid-s1`/`wusl-s2` already did, manually, ahead of this story).
- The two structural, cross-cutting proposals also raised in the same sweep (a scheduled PR-state reconciliation job; a structured follow-up-action registry) — recorded separately as ADR-030/ADR-031 in `.github/architecture-guardrails.md`, not part of this story's own diff.

## NFRs

- **Performance:** N/A — instructional text only, no runtime behaviour change.
- **Security:** N/A.
- **Accessibility:** N/A — this change is about how UI accessibility/visibility is *verified*, not the UI itself.
- **Audit:** N/A — no new audit surface.

## Complexity Rating

**Rating:** 1 — two well-scoped, additive instruction-file edits following an already-proven pattern (`evcg-s1`'s own Route/handler E2E coverage check), plus updating one already-established contracts registry.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
