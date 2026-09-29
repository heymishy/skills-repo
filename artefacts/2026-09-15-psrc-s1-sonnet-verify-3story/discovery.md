# Discovery: Route governance-critical skills to Sonnet by default

**Status:** Approved
**Date:** 2026-09-29 (originally started 2026-09-15, stalled mid-write, resumed here)
**Feature slug:** 2026-09-15-psrc-s1-sonnet-verify-3story

---

## Problem statement

This feature was originally opened on 2026-09-15 as a narrow "throwaway verification" of whether Sonnet 4.6 fixes a real bug: `claude-haiku-4-5` was observed failing to emit `---ARTEFACT-START---` / `---ARTEFACT-END---` markers reliably on `test-plan`, `definition-of-ready`, and `review` — the same three skills, per `src/web-ui/config/model-routing.js`'s own `DEFAULT_SONNET_SKILLS = ['discovery', 'ideate']`, that (along with `design` and `definition`) default to `claude-haiku-4-5` in production and staging today. The original discovery draft, and every downstream artefact (`definition.md`, `design.md`, `review.md`), was left empty — the investigation stalled before a decision was ever made or deployed.

This resumed discovery is informed by new, concrete evidence gathered on 2026-09-29 while shipping an unrelated feature (`tab-s1`, tenant-admin-bootstrap) through the real web UI: a live PostHog trace of that session showed `test-plan` and `definition-of-ready` each completing in a single, suspiciously shallow LLM turn (`done:true` on turn 1) — with no conversational elicitation at all — only for both to then be silently restarted from scratch by the operator, this time taking 6 and 2 real turns respectively to actually complete properly. Every single generation across that entire session (`design`, `definition`, `review`, `test-plan`, `definition-of-ready`) ran on `claude-haiku-4-5`, confirmed directly via the `$ai_generation` event properties in PostHog — there is no model-routing config anywhere that routes any of these 5 skills to Sonnet by default; the mechanism to do so (`WUCE_MODEL_OVERRIDE_<SKILL>`) was built in `psrc-s1` (2026-09-15) specifically to enable this, but no override was ever actually set as a Fly secret on either `wuce-staging` or production (`skills-framework`).

The real, now-doubly-confirmed problem: Haiku is unreliable on the governance-critical skills that gate what ships (`design`, `definition`, `review`, `test-plan`, `definition-of-ready`) — not just on artefact-marker syntax (the original 2026-09-15 finding) but on task completion depth itself (the new 2026-09-29 finding). A skill silently reporting `done:true` after one shallow turn is a worse failure mode than a marker-emission glitch: it lets a genuinely incomplete test plan or DoR sign-off pass through the pipeline's own gates undetected, until a human operator happens to notice and manually restarts it.

---

## Who it affects

Any operator running the outer-loop pipeline through the real web UI (`skills-framework.fly.dev` / `wuce-staging.fly.dev`) — currently a small, solo/near-solo user base (Hamish King, platform owner and first beta user), but this directly affects the reliability of every governed artefact (test plans, DoR sign-offs, definitions, designs, reviews) produced through the web UI, which downstream feeds real coding-agent dispatches and real PRs.

---

## Why now

Two independent, concrete incidents (2026-09-15 marker-emission failures; 2026-09-29 shallow-completion failures on the exact same skill set) now exist for the identical root cause (Haiku routing on governance-critical skills), six weeks apart, with the fix mechanism already built and sitting unused. Leaving this unresolved means a third incident is a when, not an if — and each one costs real operator time (a full restart of test-plan and DoR, as happened on 2026-09-29) without ever being visible as a tracked defect, since nothing currently alerts on it.

---

## MVP scope

1. Route `design`, `definition`, `review`, `test-plan`, and `definition-of-ready` to Sonnet by default, using the already-built `WUCE_MODEL_OVERRIDE_<SKILL>` per-skill override mechanism (`psrc-s1`) — no new routing code required, this is a configuration decision plus deployment.
2. Set the corresponding `WUCE_MODEL_OVERRIDE_*` Fly secrets on **both** `wuce-staging` and production (`skills-framework`) — the 2026-09-15 investigation never got this far; the mechanism existing in code but absent from both environments' real secrets is the actual reason this bug recurred on 2026-09-29 despite the fix already being shippable.
3. A lightweight, ongoing guard against silent drift: a check (CI or a startup log assertion) that surfaces when a governance-critical skill's *actual* resolved model diverges from the intended Sonnet default — so a future accidental removal of a Fly secret, or a manually-set `WUCE_FAST_MODEL` blanket override, is caught rather than silently reintroducing this exact bug a third time. This is the concrete answer to "avoid this again," not just "fix it again."

---

## Out of scope

1. Changing `discovery`/`ideate`'s existing Sonnet default (unaffected, already correct).
2. Any change to the `HAIKU_BLOCKED_SKILLS` safety invariant (`discovery`'s Haiku-fabrication guard) — untouched.
3. Retroactively re-running or repairing any artefact that was produced under the Haiku-shallow-completion bug before this fix ships (e.g. `tab-s1`'s own test-plan/DoR artefacts were already manually redone and are not affected — no cleanup needed there).
4. A general cost/latency analysis of Sonnet vs. Haiku across the whole skill library — this feature is scoped specifically to the 5 governance-critical skills with a demonstrated reliability problem, not a blanket model-routing policy change. *(Flagged for a possible future `/token-optimization` review — logged in capture-log.md, not pursued here.)*
5. Building any NEW model-routing code or mechanism — `psrc-s1`'s existing override mechanism is reused as-is, unmodified.

---

## Assumptions and risks

- **[ASSUMPTION]** Sonnet 4.6 reliably avoids both the marker-emission failure (2026-09-15) and the shallow-completion failure (2026-09-29) on these 5 skills. Not yet re-verified after this discovery's own resumption — the original 2026-09-15 investigation's own verification stories (`psrc-verify-s1/s2/s3`) never actually ran. This feature's own Story 1 exists specifically to re-confirm this before the Fly secrets are set.
- **[ASSUMPTION]** Routing 5 additional skills to Sonnet meaningfully increases real per-session token cost and latency versus Haiku. Not quantified yet — flagged as a Tier 2/3 metric consideration at `/benefit-metric`, not blocking this feature, since reliability on governance-gating skills is judged the higher priority than the cost delta for this solo-operator repo's current usage volume.
- **[RISK]** The drift-guard (MVP scope item 3) could itself become a maintenance burden or a source of false positives if not scoped carefully (e.g. it must not fire on a deliberate, intentional `WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-haiku-4-5` set by a future operator for a specific reason) — addressed at `/definition` by making the guard check "does the intended default match what's actually resolved," not "is any override present," so a deliberate override is never flagged as drift.

---

## Directional success indicators

1. Zero future incidents of a governance-critical skill (`design`/`definition`/`review`/`test-plan`/`definition-of-ready`) silently completing in a single suspiciously-shallow turn, as measured by a `skill_turn` PostHog trace showing `done:true` on `turnIndex:1` for one of these 5 skills with no operator-initiated restart following it.
2. `WUCE_MODEL_OVERRIDE_<SKILL>` secrets for all 5 skills present and correct on both `wuce-staging` and production, confirmed via `fly secrets list`.
3. The drift-guard fires correctly in a deliberate test (temporarily unsetting one override) and stays silent under normal operation.

---

## Constraints

- Must reuse `psrc-s1`'s existing `WUCE_MODEL_OVERRIDE_<SKILL>` mechanism exactly as built — no new routing code.
- Must not weaken or bypass `HAIKU_BLOCKED_SKILLS` (`discovery`'s fabrication-risk guard, EXP-021) — this feature does not touch that invariant at all.
- Fly secrets must be set on both `wuce-staging` and production (`skills-framework`) — a staging-only fix would leave the exact same bug live in production, which is itself the mistake `psrc-s1`'s override mechanism was built to allow avoiding (scoped rollout) but which the 2026-09-15 investigation never actually exercised.

---

## Contributors

Hamish King — Platform Owner, first beta user

## Reviewers

Hamish King — Platform Owner

## Approved By

Hamish King — Platform Owner — 2026-09-29
