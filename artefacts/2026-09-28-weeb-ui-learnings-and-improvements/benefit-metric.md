# Discovery: Web UI Learnings and Improvements Integration

**Status:** Approved
**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Discovery started:** 2026-09-28
**Skill:** /discovery

---

## Problem statement

The web UI skill launcher currently presents all skills as equally valid starting points, when in practice only a small subset are valid entry points to a new pipeline run (discovery, ideate, reverse-engineer, and similar — the rest are chained stages that require prior artefacts to exist). This creates a cluttered, misleading dashboard experience where operators must already know which skills are valid starts.

More critically, the platform's self-improvement loop — which accumulates signals across 12 distinct sources in the workspace and framework directories — has no surfacing mechanism in the web UI. Today, improvement signals are only accessible via CLI or IDE-based harness sessions, making the platform's core self-improving promise invisible to web UI users. A key differentiating feature of the platform is silently missed by anyone using the primary delivery surface.

The two problems are related: the dashboard needs a clearer, more intentional UX that both rationalises the skill entry points, surfaces improvement signals as actionable seeds, and provides access to the full `/improve` skill execution path — a single integrated experience rather than disconnected flows.

---

## Who it affects

**Primary persona: Solo operator (you, today)**
Uses the web UI as the primary interface for pipeline sessions. Currently must context-switch to Claude Code or IDE harness to access the improvement loop or run `/improve`. Knows the system well enough to work around the limitation, but the workaround adds friction and means improvement ideas are only captured and actioned when the operator happens to be in a CLI session. The self-improvement loop's existence is invisible to anyone who has never left the web UI.

**Primary persona: Future team members and tenants**
Will encounter the web UI as their primary or only interface. Will have no awareness that a self-improvement loop exists unless it is surfaced explicitly. Without this feature, the platform's core promise — that delivery signal feeds back into future work — is invisible to them. Multi-tenant deployments in particular will expect all critical workflows to be accessible via the web UI.

**Secondary persona: Enterprise governance / risk function**
Needs visibility into how the platform's own skill library is maintained and improved. The improvement loop evidence (proposals, traces, ADR history) is currently hidden from the web UI, making it impossible to audit the platform's own governance without CLI access. Regulated environments may require this visibility as a compliance audit control.

---

## Current state

**Skill launcher:** All 41+ skills are presented equally as primary CTAs in the launcher. No distinction between entry-point skills (discovery, ideate, reverse-engineer, spike) and chained skills (definition, test-plan, DoR, DoD, trace, improve, etc.).

**Improvement signal sources (complete inventory):**
1. `workspace/capture-log.md` — session-level signals (decisions, learnings, assumptions, patterns, gaps) with structured 5-field schema; ~15–25 entries per 3-day delivery cycle
2. `workspace/learnings.md` — aggregated, phase-indexed view of capture-log entries
3. `workspace/proposals/` — improvement agent proposed diffs to SKILL.md files, each with evidence/, rationale.md, precheck.md; typically 1–3 per cycle
4. `workspace/suite.json` — living eval regression suite entries added from failure/staleness signals; typically 0–2 new per cycle
5. `workspace/results.tsv` — performance watermark history (skill-set-hash, surface-type, suite-pass-rate, full-score, gate-verdict); one entry per gate run (~3–5 per cycle)
6. `workspace/traces/` — queryable JSONL trace files from assurance agent execution; one file per session
7. `.github/architecture-guardrails.md` — repo-level Active ADRs; candidates for update from per-feature decisions
8. `artefacts/[feature]/decisions.md` — per-feature architectural decisions; candidates for promotion to repo-level ADRs
9. `artefacts/[feature]/dod/` — Definition of Done observations (findings, gaps, follow-up actions); typically 0–3 per story
10. `artefacts/[feature]/reference/` — research and reference materials (spike outcomes, vendor assessments)
11. `workspace/estimation-norms.md` — calibration data (actual vs estimated velocity, complexity deltas); one entry per feature
12. `.github/pipeline-state.json` — implicit signal source via feature/story health transitions and metric signals

**Access today:** All 12 sources are CLI/IDE-only. No web UI affordance exists to browse, search, or act on any of them. `/improve` skill is CLI/IDE-only.

---

## Why now

The web UI is the primary delivery surface for Phase 5 and beyond. As the platform moves from solo-operator CLI usage toward multi-user, multi-tenant web delivery, any capability that is CLI-only becomes a hidden feature. The self-improving loop is not an optional enhancement — it is described in the product mission and roadmap as a core differentiator. Leaving it web-UI-invisible while positioning the platform for broader adoption creates a gap between the platform's promise and what users actually experience. Regulated environments and governance audits will also require this loop to be auditable from the web UI.

---

## MVP scope

A single integrated dashboard experience that:

1. **Rationalises the skill launcher** — surfaces only valid entry-point skills (discovery, ideate, reverse-engineer, spike, and any others confirmed as standalone starts) rather than all skills. Chained skills are not shown as primary CTAs, or are visually distinguished as requiring a prior session.

2. **Surfaces improvement signals as seeds** — reads from the complete 12-source inventory (prioritised: capture-log, learnings, proposals, suite additions, per-feature decisions, DoD follow-ups, estimation norms) and presents actionable items that can seed a new short-track or full pipeline run.

3. **Provides a clear call to action per signal** — each improvement signal entry has a CTA that pre-populates or launches a new skill session. Examples:
   - A `signal-type: gap` entry from capture-log seeds a `/definition` session with that gap as context.
   - A `workspace/proposals/` entry (improvement proposal) surfaces as "Review and merge" with a link to the proposal artefact.
   - A `signal-type: assumption-invalidated` entry seeds a `/decisions` or `/review` session.
   - A DoD observation's follow-up action seeds a new discovery or scoped `/definition` session.

4. **Exposes the full `/improve` skill execution path** — the `/improve` skill is runnable from the web UI, making the complete self-improvement loop (signal surfacing → analysis → improvement proposal → human review) available without CLI access. This is a first-class capability in the dashboard, not just a launcher shortcut.

5. **Maintains backward compatibility** — the skill launcher remains available for advanced operators who want to run any skill directly; the entry-point rationalization and signal surfacing are additive layers, not replacements.

The MVP is integrated into the existing dashboard UX — not a separate page or modal — with a clear, prominent entry point that communicates "Improvement loop & next steps" or similar.

---

## Out of scope

- **Automated signal extraction or AI summarisation of workspace files** — the MVP reads and surfaces existing structured content; it does not run a model pass over workspace files to generate new improvement proposals outside of the `/improve` skill itself.
- **Modification of the capture-log or learnings format** — the MVP consumes existing file formats as-is; format changes are a separate concern.
- **Admin or tenant-level configuration of which signals are surfaced** — the MVP uses a fixed, comprehensive set of signal sources; per-tenant configuration is deferred.
- **Automated scheduling of `/improve` runs** — the MVP exposes `/improve` as an operator-triggered action; scheduled or CI-triggered improvement runs are deferred.
- **Cross-repo signal aggregation** — the MVP surfaces signals from the current repo/workspace only; cross-team or cross-org signal rollup is deferred to Phase 6 (enterprise federation).

---

## Constraints

- **No new npm runtime dependencies** — per the web UI architecture constraint (tech-stack.md), the implementation must use built-in Node.js modules only for any server-side file reading.
- **Single-file HTML viz pattern is preserved** — if the dashboard UX changes touch `dashboards/pipeline-viz.html`, the single-file, no-build-step constraint (ADR-001) applies.
- **Artefact-first rule (ADR-011)** — any new `src/` modules, route handlers, or dashboard behavioural changes introduced by this feature require a story artefact before or alongside implementation.
- **Design system reference** — UI changes should align with the design system reference in `context.yml`.
- **Injectable adapter rule (D37)** — any new server-side modules that read workspace files or execute skill sessions must follow the injectable adapter pattern with throwing stubs.
- **Multi-tenant scope safety** — signal sources (workspace files) are currently per-repo. MVP assumes all signals are read from the current repo's workspace; multi-tenant isolation is deferred (each tenant has its own workspace, or MVP is scoped to solo-operator/single-tenant only).

---

## Assumptions

[ASSUMPTION] The entry-point skill list (discovery, ideate, reverse-engineer, spike) is stable and can be hardcoded or configured in `context.yml` — requires confirmation before implementation.

[ASSUMPTION] The 12 signal sources listed above are complete and representative of improvement-loop signal production — full source inventory has been audited and documented.

[ASSUMPTION] Signals are surfaced per-repo/per-workspace (i.e. for the workspace the web UI is connected to) — unconfirmed for multi-tenant deployments where workspace files may not be co-located with the repo root.

[ASSUMPTION] The `/improve` skill can be executed via the existing web UI skill session model (one session per skill, structured handoff) without requiring a new execution architecture — unconfirmed; `/improve` may have multi-turn or multi-file-read patterns that stress the current session model differently from outer loop skills.

[ASSUMPTION] Signal parsing (especially capture-log YAML and proposals directory structure) can be robust with basic file I/O and string parsing — no complex parsing library needed to meet MVP quality bar.

**Risks:**
- If signal formats diverge or are inconsistent across sessions, parsing and presenting them cleanly may require normalisation work not anticipated in MVP scope.
- `/improve` may require access to workspace files and traces that the current web UI file-reading model does not support well — a spike may be needed before implementation begins.
- The "clear CTA" design requires a UX decision about how a seed pre-populates a skill session — this is a design question that should be resolved before implementation begins.
- Multi-tenant deployments may have workspace files in a location not accessible to the web UI server; MVP scope may need to be clarified or split between single-tenant and multi-tenant variants.

---

## Directional success indicators

**Skill launcher clarity:** 
- Baseline: all 41+ skills shown as equal CTAs (current state). 
- Target: only valid entry-point skills shown as primary CTAs; chained skills visually distinguished or accessible via secondary affordance. 
- Measured via: visual inspection + E2E spec asserting 4–6 entry-point skills are prominently shown and at least 2 chained skills are not shown as primary CTAs.

**Improvement signal surfacing:** 
- Baseline: 0 workspace signals surfaced in web UI (current state). 
- Target: all 12 signal sources are parsed and at least 1 signal from each source type (capture-log, learnings, proposals, suite, traces, decisions, DoD) is displayed per active feature. 
- Measured via: E2E spec asserting signal entries appear in the dashboard for each source type, and at least one CTA per source type launches a pre-populated skill session.

**Full `/improve` loop accessibility:** 
- Baseline: `/improve` requires CLI or Claude Code access (current state). 
- Target: an operator using only the web UI can surface improvement signals and run `/improve` to completion in a single browser session, producing a readable proposal output. 
- Measured via: operator walkthrough in a real browser session without CLI access; `/improve` skill session completes and produces a proposal artefact file that can be viewed/reviewed in the UI.

**Self-improvement loop closure (post-MVP impact):** 
- Baseline: improvement loop is CLI-only, rarely used (current state). 
- Target: the complete loop (signal → seed → session → proposal → merge/action) is executable end-to-end from the web UI; at least one real improvement proposal is produced via the web UI in the first 30 days after release, reviewed by operator, and acted on (merged or documented as deferred).
- Measured via: count of web-UI-sourced `/improve` sessions + count of merged proposals from those sessions.

---

## Attribution

**Contributors:**
- Hamish King — Operator / Product Owner — 2026-09-28

**Reviewers:**
- Pending

**Approved By:**
- Hamish King (self-approval as solo operator) — 2026-09-28

---

*Status: Approved — ready to proceed to /benefit-metric*