# Skills Platform Onboarding Guide

**Platform:** Skills-based SDLC governance pipeline  
**Audience:** Squad tech leads and engineers adopting the platform

---

## Required Reading Before Proceeding

> **Required reading before running any inner loop stories:**
>
> Read **[MODEL-RISK.md](MODEL-RISK.md)** before proceeding with platform adoption or running any inner loop stories.
>
> `MODEL-RISK.md` documents the AI governance risks inherent in this platform, the eight audit questions that the assurance trace must answer, and the adoption gate criteria. The platform is not cleared for non-dogfood use until `MODEL-RISK.md` has been reviewed and signed off.
>
> This is not an optional reference — it is a required pre-read for every tech lead and engineer adopting the platform.

---

## Platform Overview

The skills platform is a governed SDLC pipeline for GitHub Copilot Agent mode. It structures delivery from discovery through to release using versioned skill instruction sets, automated CI gates, and an auditable trace.

For full pipeline documentation, see [`skill-pipeline-instructions.md`](skill-pipeline-instructions.md).

---

## Adoption Checklist

Before running any inner loop stories, confirm:

- [ ] `MODEL-RISK.md` read and understood — governance risks and audit question mappings reviewed
- [ ] `MODEL-RISK.md` sign-off record completed by designated reviewer (required before non-dogfood use)
- [ ] Repository bootstrapped with platform skills (see `skill-pipeline-instructions.md` — Getting started)
- [ ] `.github/context.yml` configured for your org/team context
- [ ] `pipeline-state.json` initialised for your feature

---

## Inner Loop Instructions

Once the adoption checklist above is complete and `MODEL-RISK.md` is signed off, the inner loop sequence for each story is:

1. `/branch-setup` — creates an isolated git worktree and verifies a clean baseline
2. `/implementation-plan` — produces a task-by-task plan with file paths and TDD steps
3. `/subagent-execution` (or `/tdd` per task) — executes the implementation plan
4. `/implementation-review` — reviews implementation against story ACs
5. `/verify-completion` — verifies all ACs pass and the DoD criteria are met
6. `/branch-complete` — finalises the branch and opens a draft PR

Run `/workflow` at the start of each session — it reads `pipeline-state.json` and tells you which skill to run next.

---

## Support and Questions

- Full pipeline documentation: [`skill-pipeline-instructions.md`](skill-pipeline-instructions.md)
- Risk and governance: [`MODEL-RISK.md`](MODEL-RISK.md)
- Pipeline state and feature tracking: [`.github/pipeline-state.json`](.github/pipeline-state.json)
