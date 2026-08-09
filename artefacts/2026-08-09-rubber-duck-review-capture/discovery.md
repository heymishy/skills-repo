# Discovery: Rubber-Duck Review Capture

**Status:** Approved
**Created:** 2026-08-09
**Approved by:** Hamish King — Operator — 2026-08-09
**Author:** Copilot

---

## Problem Statement

Automated tests and code review confirm a story satisfies its written ACs, but real gaps still ship — either because the spec itself was too narrow (didn't anticipate how the feature would actually be used or how it'd look/behave in the full page context), or because the implementation technically matches the AC's letter but misses its intent. These gaps are invisible to unit tests, E2E tests, and even a careful DoD AC-by-AC review, because all of those check "does the code do what the AC says" — not "does this feel right when a human actually runs the real scenario end-to-end." They only surface when someone interacts with the shipped feature directly, running through it as a real user would. (This same session produced two concrete examples: a landing-page demo card whose "delete the losing option" AC was never actually verified against the deployed code, and a "learnings count" card whose AC was satisfied by every test but showed a wrong value on the real live page — both found only by directly checking the running feature, not by re-reading tests.)

## Who It Affects

**Any current user of the wuce SaaS platform** — encounters the gap directly, in the moment, as a confusing or subtly-wrong experience (a card showing an obviously-fake value, dead/leftover content, a feature that "works" per spec but doesn't behave the way the rest of the product implies it should). Cost when unresolved: erodes trust in the specific interaction and, cumulatively, in the platform's own credibility claim — notable given this platform's own landing page pitches "provable, not claimed" governance.

**Developer / operator running the outer loop** — encounters the gap late, typically at `/definition-of-done` or later (as happened twice in this same session), after the feature has already shipped and been live for days. Cost when unresolved: rework happens under worse conditions than if caught pre-merge — a follow-up story has to be scoped, reviewed, and shipped separately, and in the meantime a real user may have already hit the broken experience.

## Why Now

wuce is approaching its first real beta release (`product/roadmap.md`'s "Commercialisation track" — several blockers remain as of the roadmap's last update, first beta customer onboarding is the next milestone). At this stage, the product needs polished, marketable hero features that hold up under real scrutiny — not just AC-compliant code. The stakes of a silently-wrong shipped feature are higher now than earlier in the platform's life: this session's own two examples (both found in the just-shipped landing-page hero-features epic, whose entire purpose is to look trustworthy and polished to a skeptical first-time visitor) show the gap directly undermining the exact thing beta readiness depends on.

## MVP Scope

Two capture modes, both required for MVP:

1. **Human-narrated:** a person records a screen+voice walkthrough of a real, already-shipped feature, narrating observations as they interact with it. The recording is transcribed (speech-to-text), and an LLM pass over the transcript extracts structured findings (bugs, spec gaps, "this doesn't feel right" moments) rather than leaving a human to re-read a raw transcript.
2. **Agent-driven:** an AI agent autonomously drives the real, live feature via Playwright/Chrome browser tooling — the same class of tooling already available in this session — executing the real user scenario end-to-end and narrating its own observations as commentary while it goes. This mode is intended to run as part of CI (a post-merge or post-deploy job against a real running environment, similar in shape to this repo's existing `scenario-a-staging-e2e`/`scenario-b-staging-e2e` real-staging E2E jobs), not just as an ad-hoc manual session.

Both modes feed the same downstream mechanism: structured findings written into this platform's existing feedback surfaces (`workspace/capture-log.md` signals, DoD-observation-equivalent entries, or triggering a new short-track story when a real gap is confirmed) — not a separate, parallel reporting system.

**Findings output format (clarified via /clarify):** structured findings map directly onto this platform's existing artefact shapes — formatted as a ready-to-append `capture-log.md` entry (or DoD-observation-equivalent) rather than a general-purpose structured output requiring a separate translation step. This keeps the "extraction" step a thin, well-bounded mapping problem, not an open-ended classification problem.

**Trigger mechanism (clarified via /clarify):** optional, operator-triggered (e.g. `/rubber-duck-review`) — not a mandatory pipeline gate for MVP. The pipeline should proactively *suggest* running it when a story matches certain criteria (e.g. hero/customer-facing features), similar in spirit to how CSS-layout-dependent ACs trigger a classification prompt — a nudge, not a block; DoD does not fail if it's skipped. A mandatory gate for specific conditions (e.g. all hero features, or all pre-beta customer-facing stories) is a reasonable fast-follow once the tool's signal quality is proven, not part of this MVP.

## Out of Scope

- **Automatic story/PR creation from findings** — a human decides whether/how to act on what's surfaced, matching this platform's existing DoD-skill boundary and the human-approval-gate constraint. Auto-spawning stories from AI-inferred issues risks false positives cascading into wasted work.
- **Long-term storage or a playback/archive system for raw video/audio** — `product/constraints.md` already flags verbatim-content storage as an unresolved data-governance gap elsewhere in the platform; a narrated screen recording is an even richer PII surface. MVP transcribes and extracts, then discards the raw recording — no video archive.
- **Agent-driven mode covering every shipped feature on every PR/deploy** — full-surface automated coverage is a later scaling problem. MVP targets a small, curated set of scenarios (e.g. hero features/critical journeys), not blanket coverage.
- **Building bespoke screen-recording tooling** — reuse existing capture mechanisms (browser-native recording, OS screen capture, or the Claude-in-Chrome tooling already available) rather than building capture infrastructure from scratch.
- **Live/real-time use during active development** — this is post-ship verification of gaps that only surface in real usage, not a live pairing/coding-session tool.

## Assumptions and Risks

[ASSUMPTION] Speech-to-text transcription + LLM extraction will reliably produce useful, actionable structured findings rather than noise — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The agent-driven Playwright/Chrome-tooling review run can reliably find real issues (not just generate false positives, or miss real ones it navigates past) — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The tooling and workflow (recording, transcription, agent-driven runs, findings review) stay simple enough to actually use — not so complex or clunky that operators skip the step rather than benefit from it — unconfirmed, requires /clarify before scope is locked.

**What could make this not worth building:** if any of the above turn out false — extraction produces mostly noise, the agent-driven mode's findings are unreliable, or the workflow itself is too clunky to actually adopt — the initiative adds process overhead without the trust-building signal it's meant to produce, and could be worse than the current DoD-based manual-check pattern (which, as demonstrated in this same session, works when a human deliberately looks).

## Directional Success Indicators

**Where real gaps get first detected, by pipeline stage.** Baseline: `[UNKNOWN BASELINE]` — today, gaps of this shape (spec-technically-satisfied but experientially wrong) are found only opportunistically: via a DoD sweep that happens to check live deployed state (as happened twice in this session), or worse, via a real customer hitting it in production post-beta. No structured count exists because no dedicated detection mechanism exists yet. Target: an increasing share of real gaps are first caught via the new rubber-duck review process (human-narrated or agent-driven) — shifting detection earlier and cheaper, before DoD and well before a customer report. Measured via: tagging each confirmed real gap (in its DoD artefact or follow-up story) with where it was first detected — `rubber-duck-review` / `dod-sweep` / `production-incident` — and tracking the ratio over time.

## Constraints

- **No persistent agent runtime dependency** (`product/constraints.md` #11) — the agent-driven mode must run within existing CI/CD infrastructure (e.g. a GitHub Actions job, similar in shape to this repo's existing `scenario-a/b-staging-e2e` jobs), not require a separately-hosted, always-on agent service.
- **Credentials stay structural** (`product/constraints.md` #12) — if the agent-driven mode needs to authenticate against real staging (as this session's own `mgar-s1` CI-force-on step does via the `e2e-test-admin` identity), it must reuse the existing secrets-store pattern — never a credential hardcoded or handled in the agent's own context.
- **Real LLM API token cost, on every run** — both modes consume real tokens (transcription + extraction; an agent-driven Playwright review is itself an LLM-driven session). Directly relevant given this session's own `mgar-s1` work was specifically about preventing unintended token burn — this needs a bounded run frequency/scope (echoing the Out-of-Scope item on curated scenarios, not blanket coverage), not an open-ended cost.
- **Transient handling of recordings/screen content, even without long-term storage** — a screen recording or an agent's live browser session could incidentally show real tenant/user data mid-walkthrough. Even a "process then discard" flow needs a clear boundary on where that transient data goes and who/what can access it before it's discarded.
- **Team capability/behavioural adoption** — the human-narrated mode only produces value if someone actually does it; this is a process constraint as much as a technical one (related to the "workflow too clunky" risk already captured above).
- **Reuses existing LLM-invocation infrastructure (clarified via /clarify)** — the agent-driven mode is built on this codebase's existing `skill-turn-executor.js`-style invocation pattern, not a separate, purpose-built mechanism. This means it is subject to the same mock-gateway safety net (`mgar-s1`) as every other LLM-invoking path in this codebase — including the same real-token-cost risk that story's TTL/CI-force-on protections exist to bound.
- **Runs against real staging (clarified via /clarify)** — the agent-driven CI job follows the same pattern as `scenario-a/b-staging-e2e`: real data, real auth, inheriting existing staging infrastructure (the `e2e-test-admin` identity, the `mgar-s1` mock-gateway safety net, the deploy-group concurrency guard) rather than a separate, lighter-weight preview environment. Chosen for fidelity — this tool's entire value is finding gaps that only surface in real usage, so a lower-fidelity environment would undermine its own purpose.

## Contributors

- Hamish King — Operator

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Operator — 2026-08-09

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- Speech-to-text transcription + LLM extraction will reliably produce useful, actionable structured findings rather than noise
- The agent-driven Playwright/Chrome-tooling review run can reliably find real issues (not just generate false positives, or miss real ones it navigates past)
- The tooling and workflow stay simple enough to actually use — not so complex or clunky that operators skip the step

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Clarification log

[2026-08-09] Clarified via /clarify:
- Q: What should "structured findings extraction" actually produce — a list of flagged moments mapped directly onto this platform's existing artefact shapes, or a more general-purpose structured output that a separate step then has to translate?  A: Directly map to existing shapes (Option A) — output looks like a DoD-observation or `capture-log.md` entry, ready to append.
- Q: For the agent-driven mode, should it reuse this codebase's existing LLM-invocation infrastructure, or does it need a separate, purpose-built mechanism?  A: Reuse existing infrastructure (Option A) — `skill-turn-executor.js`-style invocation, subject to the same mock-gateway safety net.
- Q: Who actually triggers the human-narrated mode, and when — mandatory gate or optional/on-demand tool?  A: Optional/on-demand (Option B), but the pipeline should proactively suggest running it when a story matches certain criteria (e.g. hero/customer-facing features); a mandatory gate for specific conditions may be added later once signal quality is proven.
- Q: For the agent-driven CI job, real staging or a local/ephemeral preview environment?  A: Real staging (Option A) — same pattern as `scenario-a/b-staging-e2e`, for fidelity.

---

**Next step:** Human review and approval → /benefit-metric
