# T3 — Solution masquerades as problem / claude-opus-4-6 / Run 3

**Date:** _pending_
**Model:** claude-opus-4-6
**Case:** T3-solution-masquerades-as-problem
**Experiment:** EXP-001-discovery-phase4-5
**Status:** partial — pass 1 complete, pass 2 not collected
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input (Pass 1)

```
/discovery — Implement transaction monitoring alerts for AML threshold breaches. We've had two near-misses in the last 90 days where transactions above the £10,000 threshold weren't flagged within the required window. FCA compliance review is scheduled for Q4. Current detection lag is 18+ hours.
```

---

## Pre-run checklist

- [ ] Fresh repo confirmed: `c:\Users\Hamis\code\test repo\skills-repo`
- [ ] `product/` absent or all files empty
- [ ] `workspace/state.json` reset to `{}`
- [ ] New chat window opened (no prior session history)

---

## Model response — Pass 1

Read skill [discovery](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/mission.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/constraints.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/product/tech-stack.md)

Read [](file:///c%3A/Users/Hamis/code/test%20repo/skills-repo/.github/context.yml)

**Discovery session — opening**

Product context files (`mission.md`, `constraints.md`, `tech-stack.md`) are present but empty, so I'll surface those fields through conversation. EA registry is authoritative in context.yml, but this looks like a system not yet in the local registry — I'll note "no EA registry entry found" in the artefact and proceed.

No reference folder exists yet for this feature.

---

From your prompt, I have enough to draft **Section 1 — Problem statement**:

> AML transaction monitoring currently has an 18+ hour detection lag for transactions breaching the £10,000 threshold. Two near-misses in the last 90 days where flagging did not occur within the regulatory window. The lag creates regulatory exposure (FCA reporting timeliness obligations) and operational risk (suspicious activity may continue undetected for nearly a day). FCA compliance review is scheduled for Q4, making remediation time-bound.

Does that capture it? Reply: **yes** — or correct me.

---

**Section 2 — Who it affects**

Who specifically experiences this problem? I need named personas, not generic "users". For each, what are they trying to accomplish when they hit it?

For example:
- The compliance officer trying to file a SAR (Suspicious Activity Report) within the regulatory window?
- The MLRO (Money Laundering Reporting Officer) accountable to the FCA?
- The transaction monitoring analyst working the alert queue?
- Someone else (engineering on-call, audit, customer ops)?

Reply: describe the people affected and what they're trying to do.
---

## Pass 1 assessment

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked before writing | PARTIAL | Drafted Section 1 first, then asked persona Q naming MLRO explicitly — did NOT ask about "near-miss" definition, "required window", volume, or source system |
| Load-bearing terms identified ("near-miss", "required window") | NO | "near-misses in the last 90 days" and "regulatory window" used verbatim without interrogating definitions |
| MLR 2017 / FCA regulatory framing surfaced | PARTIAL | Referenced "FCA reporting timeliness obligations" and "suspicious activity" — no MLR 2017 citation (Opus cited it explicitly in run-2) |
| Artefact produced without asking | NO | Stopped at persona Q — no full artefact produced |

**Finding:** Same regression as Sonnet — Opus also wrote Section 1 before clarifying load-bearing terms. However Opus named "MLRO" as a persona candidate in its question (stronger D2 signal than Sonnet). Pass 2 not collected — cannot score full artefact. Notable: run-2 Opus cited MLR 2017 explicitly; run-3 pass 1 did not.

---

## Follow-up input (Pass 2) — send only if model asked clarifying questions in pass 1

```
Here are the answers: near-miss = any transaction within 15% of a reporting threshold that was not flagged within the window, regardless of whether it eventually triggered a SAR; required window = rolling 24 hours (internal AML policy, not a specific FCA article); volume = approximately 2.3 million transactions per day across retail and business banking; source system = Finacle core banking platform, feeds to the data warehouse via a nightly batch job. Please continue and produce the full discovery artefact.
```

---

## Model response — Pass 2

_paste full model response here_

---

## Scoring (on Pass 2 artefact)

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 Problem framing | 0.22 | N/A | Pass 2 not collected |
| D2 Persona specificity | 0.15 | N/A | Pass 2 not collected |
| D3 MVP bounding | 0.22 | N/A | Pass 2 not collected |
| D4 Out-of-scope discipline | 0.15 | N/A | Pass 2 not collected |
| D5 Assumption quality | 0.13 | N/A | Pass 2 not collected |
| D6 Success observability | 0.08 | N/A | Pass 2 not collected |
| D7 Constraint completeness | 0.05 | N/A | Pass 2 not collected |
| **Weighted total** | | N/A | Deferred — pass 2 required |
| **Pass (≥ 0.70)** | | DEFERRED | |
| **Compliant** | | DEFERRED | |

Run-2 finding: Opus asked all 4 correct Qs and explicitly cited MLR 2017 framing. Expected to produce the highest-scoring artefact in the set. Watch for: structuring risk assumption (transactions just below £10k), MLRO persona, Finacle batch lag as constraint (18h detection lag sourced from nightly batch, not real-time streaming).
