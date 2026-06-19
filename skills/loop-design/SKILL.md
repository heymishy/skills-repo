---
name: loop-design
description: >
   Defines and operationalises a two-loop delivery model for evolving the whole
   skill library: outer loop (discover, define, release, monitor, measure, learn)
   and inner loop (build, test, validate). Supports a swappable inner loop by
   defining an explicit slot contract so teams can keep this repo's default
   implementation or map an alternative skill pack/toolchain.
---

# Loop Design Skill

## Entry condition

None. Can run at any stage.

---

## Purpose

Turn the skills system into an explicit two-loop operating model with:
1. Outer loop stages and feedback cadence
2. Inner loop execution contract (tooling-agnostic slots)
3. Mapping for either default inner loop skills or a custom replacement pack

This is a **meta-level design skill** for the library operating model, not a
per-feature delivery step.

---

## Step 1 — Define outer loop

Capture and confirm the outer loop stages for this environment:
- Discover
- Define
- Deliver (invokes inner loop)
- Release/Deploy
- Monitor
- Measure outcomes
- Learn and re-plan

Confirm where each stage starts and ends in your current governance language.

---

## Step 2 — Define inner loop contract (swappable)

Define these mandatory slots so the inner loop can be swapped safely:
- Setup slot
- Plan slot
- Build/Test slot
- Quality review slot
- Completion verification slot
- Branch/PR completion slot

For each slot record:
- Required input contract
- Required output contract
- Minimum evidence required

---

## Step 3 — Choose inner loop implementation

Present two options:
1. **Default pack (this repo):**
   `/branch-setup -> /implementation-plan -> /subagent-execution or /tdd -> /implementation-review -> /verify-completion -> /branch-complete`
2. **Custom pack:**
   Map external skills/tools to each slot while preserving contracts and evidence gates.

If custom pack selected, produce an explicit slot mapping table and compatibility risks.

---

## Step 4 — Feedback loop wiring

Define how inner loop results feed outer loop decisions:
- Failures and defects -> discovery/definition adjustments
- Delivery metrics -> benefit-metric updates
- Runtime signals -> record-signal/metric-review

Include cadence and ownership for each feedback path.

---

## Output artefact

Use template: `.github/templates/loop-design.md`

Save to:
- Feature scope: `artefacts/[feature-slug]/loop-design.md`
- Programme scope: `artefacts/[programme-slug]/loop-design.md`

---

## State update — mandatory final step

Update `.github/pipeline-state.json` with:
- `updatedAt` now
- notes indicating loop model selected and inner-loop mode (`default` or `custom`)

Closing message must include: `Pipeline state updated ✅`
