# Discovery: In-Flight Learning Capture

**Status:** Approved
**Created:** 2026-04-28
**Approved by:** heymishy, 2026-04-28
**Author:** Copilot

---

## Problem Statement

During pipeline sessions, valuable delivery signals — decisions taken, assumptions validated or invalidated, implementation learnings, mid-session pattern discoveries — emerge continuously but are only ever captured at session end via `/checkpoint`, or after the fact via `/record-signal`. If context compaction fires before checkpoint (observed threshold: 55–60% of context window, confirmed across 8+ sessions in Phase 1–3), or if the session ends abruptly, those signals are lost permanently. There is no lightweight mechanism that records signals *as they arise*, before context pressure strikes.

The gap is structural: `/checkpoint` is a session-end batch write; `/record-signal` handles benefit-metric measurements only; `workspace/learnings.md` is written reactively at the end of a session or when an operator explicitly adds to it. None of these fire proactively during the working phase of a session.

`workspace/learnings.md` currently has 25+ entries. At least five of them explicitly document signal loss caused by context compaction or session end before the learning was durable. Two (D-context-threshold, context-pressure-gap) name this as the most consequential gap found in the Phase 1 dogfood run.

---

## Who It Affects

**Platform maintainers and operators** (primary): Anyone running the pipeline who makes decisions, validates assumptions, or observes patterns mid-session. Currently: every delivery session generates learning signal that the pipeline either captures at the end (if it gets that far) or loses entirely.

**The improvement loop** (secondary consumer): `/improve`, the improvement agent, and `workspace/learnings.md` all depend on learning signal as input. Thin or missing signal means the platform's self-improvement cycle runs on an incomplete picture of what actually happened during delivery.

---

## Why Now

Three converging forces make this the right moment:

1. **Empirical evidence is mature.** Phase 1–3 have produced a concrete loss record: five learnings.md entries documenting signal lost to compaction or session end. The before-baseline is established; it can now be measured against.

2. **P6a (`/prioritise`) just shipped.** The first re-prioritisation run using the skill will itself generate learning signal. Without this feature, that signal is lost at the same 55% threshold it always was. The new skill creates an immediate, observable test case.

3. **The improvement loop needs feeding.** The improvement agent's next cycle is scheduled after Phase 4 WS0 completes. If the learning signal between now and then is thin, the agent's proposals will be under-informed. Fixing the capture mechanism before the next improvement cycle is the correct sequencing.

---

## MVP Scope

The MVP delivers two layers of capture:

**Layer 1 — Structural agent self-recording (80% of expected capture volume):** Woven instruction in `copilot-instructions.md` and a new `/capture` section added to all relevant SKILL.md files (at minimum: `/checkpoint`, `/definition`, `/review`, `/test-plan`, `/definition-of-ready`, `/tdd`, `/systematic-debugging`, `/implementation-review`). Instruction pattern: "Whenever you make a non-trivial decision, validate or invalidate an assumption, observe a reusable pattern, or identify a gap — write it immediately to `workspace/capture-log.md` before continuing. Do not defer to session end." The agent appends structured entries without waiting for operator input.

**Layer 2 — Operator `/capture` command (20% of expected capture volume):** A named invocation that any operator can use at any point in a session: `/capture [signal text]`. Appends a timestamped structured entry to `workspace/capture-log.md`. Used when the operator notices something the agent missed, or wants to flag a signal more precisely.

**`workspace/capture-log.md` schema (minimal):** Each entry: `date`, `session-phase`, `signal-type` (one of: decision / learning / assumption-validated / assumption-invalidated / pattern / gap), `signal-text`, `source` (agent-auto / operator-manual). Rolling append-only file. Summarised into `workspace/learnings.md` by `/checkpoint` at session end.

**`/checkpoint` bridge:** At session end, `/checkpoint` reads `capture-log.md` entries since the last checkpoint and promotes durable ones to `workspace/learnings.md`. Temporary entries that are superseded or retracted are not promoted.

---

## Out of Scope

- **Replacing `/checkpoint`:** Checkpoint remains the session-end state write. This feature captures signals *between* checkpoints, not instead of them.
- **Writing back to story specs, ACs, or discovery artefacts:** Captured signals write to `workspace/` only. Spec immutability (product constraint 3) prohibits automated agents from modifying specs, ACs, or POLICY.md floors.
- **Automated benefit-metric signal recording:** Metric evidence (M1/M2/M3 etc.) remains the scope of `/record-signal`. `/capture` handles the wider class of operational signals — decisions, learnings, patterns, gaps — not metric measurements.
- **Structural API hooks (context-threshold triggers):** No VS Code or Copilot API exposes a context-threshold event. Threshold-based auto-trigger is not implementable as a structural hook today. The 80% capture goal is achieved through instruction-based agent recognition, not API hooks.
- **Cross-session signal aggregation or search UI:** `capture-log.md` is a plain-text append file. No query interface, no dashboard integration in MVP.
- **Automated signal quality scoring or deduplication:** Entries are written as-is. Curation is a human action at checkpoint time.

---

## Assumptions and Risks

**A1 — Instruction-based self-recording is reliable enough for 80% coverage:** We assume that a well-placed, explicit instruction in `copilot-instructions.md` and SKILL.md files will cause agents to self-record consistently across sessions and models. Risk: model variation or context pressure may cause the instruction to be deprioritised. Mitigation: the operator `/capture` layer provides a fallback; and the `/checkpoint` session-end path remains unchanged.

**A2 — `capture-log.md` append pattern is durable under partial session failures:** A flat append-only file is simpler and more failure-resistant than a structured JSON store. Risk: concurrent sessions (multiple chat windows in parallel, as seen in Phase 1) may interleave appends. Mitigation: each entry is timestamped and self-contained; interleaved entries are readable even if unordered.

**A3 — The most valuable signals are recognisable by the agent without prompting:** The instruction "whenever you make a non-trivial decision..." assumes the agent can classify its own actions as signal-worthy or not. Risk: the agent may over-capture (noise) or under-capture (misses). Mitigation: the operator layer corrects under-capture; `/checkpoint` curation filters noise before promotion to `workspace/learnings.md`.

**A4 — The primary value is in the capture habit, not the schema:** The structured schema is a minimal scaffold. The actual value is the discipline of writing signals before context pressure arrives. If the schema turns out to be wrong, it can be evolved without changing the core habit.

---

## Directional Success Indicators

- After 3 pipeline sessions post-delivery: `workspace/capture-log.md` contains entries from at least 2 sessions without the operator manually invoking `/capture`.
- `/checkpoint` at session end reports "N new captures promoted to learnings.md" rather than "no new learnings."
- `workspace/learnings.md` entry count grows at a faster rate per session than before this feature shipped.
- No learning signal is documented as "lost to compaction" in learnings.md after delivery.

---

## Constraints

- **No new npm dependencies** — `capture-log.md` is a plain markdown file; no parser or structured store required.
- **No changes to `pipeline-state.json` schema** — this is a SKILL.md + `copilot-instructions.md` change with a new workspace convention file. ADDITIVE classification.
- **No changes to story specs, ACs, or POLICY.md floors** — spec immutability constraint applies.
- **Artefact-first rule (ADR-011):** This discovery artefact is the required prerequisite for any implementation. No SKILL.md or `copilot-instructions.md` change may be merged before the DoR is signed off.
- **3-story budget** (from WSJF scoring, JS=3). MVP must fit within this.

---

**Next step:** Human review → /benefit-metric
