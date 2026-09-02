# Decisions: Completed Stages Can Silently Lack Durable Git Backing

## 2026-09-02 — Scope expanded from observability-only to root-cause-and-fix, following /clarify

**Context:** The discovery originally scoped this as adding a distinguishing log signal for `das-s1`'s 3 possible stage-completion-commit outcomes, with two open, symmetric hypotheses for why `new-feature-af17f555`'s 8 artefacts never landed in git (genuinely repo-less at completion time, vs. a live bug in `das-s1`'s AC2 guard).

**Decision:** During `/clarify`, the operator (Hamish King) confirmed `new-feature-af17f555` was linked to the `skills-framework` product for the entire period its 8 stages completed. This rules out the "genuinely no-repo" hypothesis and elevates the AC2-guard-bug hypothesis to the leading, evidence-backed explanation. The operator then chose to expand this discovery's own MVP scope to include root-causing and fixing that guard bug directly, rather than splitting it into a separate follow-up discovery/story.

**Rationale:** With the no-repo hypothesis ruled out for a confirmed real case, "just add a log line" would ship a discovery layer on top of an actively broken safety guard — detecting the next occurrence without fixing the one already found. Fixing both together (root-cause the guard, restore its AC2 contract, add the distinguishing signal so any future regression is immediately visible) is one coherent piece of work rather than two sequential passes through the same code path.

## 2026-09-02 — Reuse ep1-s6's shared cross-channel instrumentation helper, don't build a parallel logging mechanism

**Context:** This discovery independently arrived at needing a fire-and-forget, structured, `[prefix]`-tagged log + PostHog signal for 3 distinguishable outcomes — the same shape of problem `new-feature-af17f555`'s `ep1-s5`/`ep1-s6` (merged PR #811, #812, 2026-09-01/02) had already solved for a different set of events (artefact-load errors, journey-backfill errors, stage-routing errors, plus 6 success events).

**Decision:** Implementation of this discovery's distinguishing signal must extend `_logCrossChannelEvent` (`src/web-ui/routes/journey.js`, the shared helper `ep1-s6` built) with new event types, rather than building a second, parallel logging mechanism.

**Rationale:** Two divergent logging shapes for what is conceptually the same kind of signal (a named event with base fields plus event-specific details, fire-and-forget to stdout + PostHog) would be pure duplication shipped one session apart from the original. `das-s1`'s call site already lives in `journey.js` itself, so reuse requires no cross-file require — strictly simpler than building something new.
