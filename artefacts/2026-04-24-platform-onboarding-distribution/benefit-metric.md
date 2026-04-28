# Benefit Metric: Platform Onboarding, Distribution, and Brownfield Adoption

**Discovery reference:** `artefacts/2026-04-24-platform-onboarding-distribution/discovery.md` (Approved 2026-04-28)
**Date defined:** 2026-04-28
**Metric owner:** Platform maintainer (Tier 1 and Tier 2 measurement); first non-engineering adopter (Tier 1 M3 evidence)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative delivers user-facing value (Tier 1) AND validates three product hypotheses about tooling, governance model design, and onboarding architecture (Tier 2). A session can produce Tier 2 learning (hypothesis confirmed or invalidated) even if the Tier 1 targets are not yet measurable — but both tiers must be tracked from the start. Tier 2 results feed directly into Phase 5 WS1–WS7 scoping decisions; they are not optional.

---

## Tier 1: Product Metrics (User Value)

### M1: Time-to-first-skill-run (onboarding speed)

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed clock time from a new consumer opening the repository for the first time (post-clone) to completing their first skill run (receiving a `/start` orientation output). Measured on a git-native VS Code setup that already has Copilot access — excludes IT procurement time, which is a separate constraint. |
| **Baseline** | Not yet established. Will measure the current `ONBOARDING.md`-guided flow on first available consumer onboarding session before releasing `/start`. Expected to be >15 minutes based on the 8-step documented process and the absence of a concierge orientation step. |
| **Target** | Under 2 minutes from repository open to first `/start` output. This is a hard product constraint stated in the discovery artefact, not a stretch goal. |
| **Minimum validation signal** | Under 10 minutes on first attempt, with the consumer not needing to re-read `ONBOARDING.md` after running `/start`. If this minimum is not achieved, the `/start` skill design must be revised before shipping. |
| **Measurement method** | Platform maintainer times a new consumer (or runs a fresh-context self-test) on the delivered `/start` skill. Measured on first onboarding session post-delivery, then on the next 2 distinct consumers. Report elapsed time and whether the consumer contacted the platform team. |
| **Feedback loop** | If M1 target (under 2 minutes) is not met on first consumer: treat as a skill design failure. Identify which step took longest. Revise `/start` output and re-measure. If minimum signal (under 10 minutes, no re-read) is not met: stop and run systematic debugging before any further onboarding. |

---

### M2: Platform team support contacts per onboarding event

| Field | Value |
|-------|-------|
| **What we measure** | Number of times a new consumer contacts the platform maintainer (via any channel — Slack DM, GitHub issue, Teams message) to ask "what do I do next?" or equivalent orientation questions during their first session after running `/start`. |
| **Baseline** | Not formally measured. Current state: every documented onboarding has required at least one orientation exchange with the platform maintainer. Baseline is effectively >0 per onboarding. Will confirm with the next 1–2 pre-`/start` onboarding sessions if any occur before delivery. |
| **Target** | 0 platform team contacts per onboarding event for orientation questions (questions about pipeline state, what to do next, how to start). Technical setup questions (IT access, Copilot approval) are excluded — those are not onboarding skill failures. |
| **Minimum validation signal** | ≤1 contact per onboarding, where the contact is a genuine ambiguity not covered by `/start` rather than a repeat of something `/start` already answered. |
| **Measurement method** | Platform maintainer notes any inbound orientation questions after each new consumer's first session. Self-reported by consumer on request. No tooling required — observation only. |
| **Feedback loop** | If any contact is "what do I do next after `/start`?": the specific gap is logged and `/start` SKILL.md is updated before the next onboarding. If contacts are consistently about a single topic: that topic becomes a `/start` improvement story. |

---

### M3: Non-engineering outer loop attribution rate

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one discovery or benefit-metric artefact produced after this feature is delivered has a populated `approved-by` entry from a non-engineering role (BA, product manager, business lead, UX researcher, or equivalent). This is a binary metric at MVP: either it has happened or it has not. |
| **Baseline** | 0% — no attribution fields exist in current `/discovery` or `/benefit-metric` templates. No artefact currently has an `approved-by` section. Every discovery artefact produced to date has been engineer-authored with no named non-engineering sign-off. |
| **Target** | At least 1 artefact with a populated `approved-by` non-engineering entry within 60 days of this feature being DoD-complete. The artefact must be a real delivery artefact (not a test or dogfood run), produced by a cross-functional pair. |
| **Minimum validation signal** | The H-GOV hard block fires at least once in CI on an engineer-only artefact — demonstrating that the block is real and not bypassed — within 30 days of delivery. This validates the structural gap is visible even before a cross-functional pair has produced a passing artefact. |
| **Measurement method** | Platform maintainer inspects `approved-by` fields in all new discovery and benefit-metric artefacts committed to any consuming repository after delivery. For the minimum signal: CI logs from the assurance gate will record H-GOV block events. |
| **Feedback loop** | If M3 minimum signal (H-GOV block fires at least once) is not observed within 30 days: investigate whether the DoR check is running and whether teams are bypassing it. If M3 target (1 cross-functional artefact) is not met within 60 days: run the bounded attribution model test (open question 2 from discovery) — stakeholder resistance to `approved-by` is the most likely cause. |

---

### M4: Consumer-side lockfile integrity (pin/verify round-trip)

| Field | Value |
|-------|-------|
| **What we measure** | Whether a consumer who has run `pin` can subsequently run `verify` and receive a deterministic pass/fail result within a single terminal command — no manual file inspection, no diff tooling, no platform team assistance. |
| **Baseline** | 0% — `pin` and `verify` are unimplemented stubs in `src/enforcement/cli-adapter.js`. No consumer can run either command with real behaviour today. |
| **Target** | `verify` returns a deterministic pass/fail within 5 seconds on any machine that has run `pin`. The output names any drifted files by path and hash. No additional tooling required. |
| **Minimum validation signal** | `pin` writes a lockfile that is parseable JSON, `verify` reads it and compares it to on-disk state, and the result is consistent across two independent runs on the same machine (no flakiness). |
| **Measurement method** | Platform maintainer runs the pin/verify round-trip on a clean checkout of a consuming repository after delivery. Timed. Result (pass/fail/error) recorded. Repeated after intentionally drifting one skill file to confirm the fail path works. |
| **Feedback loop** | Any flakiness or non-determinism in verify output is a P0 defect — the lockfile integrity model has no value if the result varies. If the 5-second target is not met: profile and fix before shipping; a slow verify will be bypassed in practice. |

---

## Tier 2: Meta Metrics (Hypothesis Validation)

### MM1: `/start` concierge hypothesis — does a single-turn orientation change onboarding behaviour?

| Field | Value |
|-------|-------|
| **Hypothesis** | A consumer who runs `/start` as their first action after cloning knows what to do next without reading `ONBOARDING.md`, and this reduces both time-to-first-skill-run and platform team support load compared to the current documentation-first approach. |
| **What we measure** | Whether a consumer who ran `/start` first proceeded directly to a skill run without re-reading `ONBOARDING.md` (observed behaviour) AND whether they reported knowing what to do next at the end of their first session (self-report). |
| **Baseline** | Hypothesis not yet validated. Current onboarding is documentation-first; no comparison data for concierge-first. |
| **Target** | On at least 2 out of 3 first-session onboardings: consumer proceeds directly from `/start` to first skill run without re-reading ONBOARDING.md, and self-reports knowing what to do next. |
| **Minimum signal** | 1 of 3 onboardings meets the target. Fewer than 1 invalidates the hypothesis and requires `/start` redesign before WS0.7 surface work. |
| **Measurement method** | Platform maintainer observes or records (with consent) new consumer first sessions. At session end, asks: "Did you know what to do after running `/start`? Did you need to re-read any documentation?" Two-question self-report. |

---

### MM2: H-GOV hard block hypothesis — does a structural DoR block change outer loop composition?

| Field | Value |
|-------|-------|
| **Hypothesis** | Making engineer-only outer loop execution produce a visible DoR failure (H-GOV block) will structurally increase the rate of non-engineering participation in discovery artefacts, compared to the current advisory model where non-technical input is optional. |
| **What we measure** | Whether the H-GOV hard block fires in practice (technical validation) AND whether teams respond by adding non-engineering attribution rather than by bypassing the block or having an engineer fill in the field with a placeholder. |
| **Baseline** | H-GOV block does not exist. No DoR check on attribution. Current non-engineering attribution rate in discovery artefacts: 0%. |
| **Target** | Within 90 days of delivery: at least 1 artefact has genuine non-engineering attribution (not an engineer filling in a non-engineering persona name as a workaround), and zero documented cases of teams bypassing H-GOV via the `H-GOV-exempt` or equivalent workaround path. |
| **Minimum signal** | H-GOV block fires at least once (proves the mechanism works) AND at least 1 team asks "how do we satisfy H-GOV?" rather than "how do we skip it?" — demonstrating the block is creating pull for non-engineering participation rather than resistance. |
| **Measurement method** | Platform maintainer monitors: (a) CI logs for H-GOV block events; (b) GitHub issues or Slack messages asking about H-GOV resolution; (c) any PRs that attempt to modify or skip the H-GOV check. |

---

### MM3: Brownfield routing hypothesis — does `/start` correctly identify and route brownfield context?

| Field | Value |
|-------|-------|
| **Hypothesis** | A consumer who arrives at the repository with an existing codebase, stories, or shipped features can run `/start`, receive the correct entry pattern routing (A, B, or C), and proceed to their first pipeline action without hitting a "start from scratch" prompt. |
| **What we measure** | Whether `/start` correctly identifies brownfield context on the first two brownfield onboarding sessions it handles, and whether the routed entry pattern (A/B/C) was the correct one for that consumer's actual context (validated by the consumer at the end of their first session). |
| **Baseline** | No brownfield routing exists. Current state: any brownfield consumer who follows `ONBOARDING.md` is prompted to run `/discovery` from scratch, which does not reflect their actual context. |
| **Target** | On 2 of 2 brownfield onboarding sessions: `/start` correctly identifies brownfield context without a false positive on a greenfield session, and the consumer confirms the routing was appropriate. |
| **Minimum signal** | `/start` correctly distinguishes a brownfield context (has `src/` with content, or has prior artefacts) from a greenfield context (empty repo) on at least one observed session. |
| **Measurement method** | Platform maintainer runs `/start` against a test repository with representative brownfield state (existing code, no pipeline artefacts) and a clean greenfield repository. Records whether routing was correct for each. Validated on next real brownfield consumer onboarding. |

---

## Metric Coverage Matrix

| Metric | Contributing Stories | Status |
|--------|---------------------|--------|
| M1 — Time-to-first-skill-run | p11.5 (init/fetch enable the guided flow), p11.6 (/start greenfield orientation), p11.7 (/start brownfield routing) | linked |
| M2 — Support contacts per onboarding | p11.6 (/start greenfield — zero-contact orientation), p11.7 (brownfield routing prevents misdirection contacts) | linked |
| M3 — Non-engineering attribution rate | p11.1 (discovery attribution fields), p11.2 (benefit-metric attribution fields), p11.3 (H-GOV hard block enforcement) | linked |
| M4 — Lockfile pin/verify round-trip | p11.4 (lockfile schema + pin/verify implementation) | linked |
| MM1 — `/start` concierge hypothesis | p11.6 (/start SKILL.md — hypothesis becomes testable once skill exists) | linked |
| MM2 — H-GOV hard block hypothesis | p11.3 (H-GOV hard block — hypothesis is testable once block exists) | linked |
| MM3 — Brownfield routing hypothesis | p11.7 (/start brownfield routing — hypothesis is testable once routing exists) | linked |

---

**Status:** Active
**Next step:** /definition
