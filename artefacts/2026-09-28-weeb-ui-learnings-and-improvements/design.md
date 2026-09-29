# Design: Web UI Learnings and Improvements Integration

**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Design started:** 2026-09-28
**Status:** Draft
**Skill:** /design

---

## Solution architecture

### System topology

The web UI adds two integrated components to the existing `src/web-ui/` architecture:

1. **Signals aggregator module** (`src/web-ui/modules/signals-aggregator.js`)
   - Reads 12 workspace signal sources (capture-log.md, learnings.md, proposals/, suite.json, results.tsv, traces/, decisions.md, DoD observations, estimation-norms.md, archived references, pipeline-state.json)
   - Normalizes all signals to a common `Signal` object shape
   - Returns aggregated, sortable signal array keyed by `source` and `type`
   - Uses injectable file-read adapter (D37 pattern) with throwing stub for production isolation

2. **Signals panel route handler** (`src/web-ui/routes/signals.js`)
   - On-demand (no caching) — calls signals-aggregator on every GET request
   - Parses workspace files synchronously (acceptable performance <150ms for solo operator)
   - Returns JSON (`GET /api/signals`) for dashboard consumption, or renders HTML view
   - Handles parse errors gracefully — signals that fail to parse are surfaced as "parse error" signal type rather than silently dropped

3. **Skill launcher redesign** (`src/web-ui/skill-launcher.js` — enhanced)
   - Shows only 5 primary CTAs: `/discovery`, `/ideate`, `/reverse-engineer`, `/spike`, `/improve`
   - `/improve` is labeled distinctly (e.g., "Improvement cycle: Analyze signals & propose changes")
   - All chained skills (`/clarify`, `/estimate`, `/modernisation-decompose`, and 27+ others) are hidden entirely — they require a prior session to be meaningful
   - Launcher remains available as a secondary affordance for advanced operators who want to run any skill directly (backward compatible)

4. **Signals-to-session bridge** (route handler in `src/web-ui/routes/skills.js` — extended)
   - When a signal CTA is clicked, a new skill session launches with that signal injected as `priorArtefacts` in the system prompt
   - Signal is normalized to `{ path: 'signal-seed', content: '<signal summary>' }` and passed to `buildSystemPrompt(skill, repoPath, webUiConfig, priorArtefacts)`
   - Model's first turn is contextualized around the signal — no "what would you like to work on?" preamble
   - Session follows the normal skill session flow from there (one session per skill, structured handoff via ADR-022 Option B)

### Data model — Signal object shape

All 12 signal sources normalize to a common `Signal` object:

```typescript
interface Signal {
  id: string                    // unique key: `${source}-${index}` or UUID
  source: string                // 'capture-log' | 'learnings' | 'proposals' | 'suite' | 'traces' | 'decisions' | 'dod-follow-up' | 'estimation' | 'archived-ref' | 'pipeline-state' | 'parse-error'
  type: string                  // 'gap' | 'assumption-invalidated' | 'pattern' | 'decision' | 'proposal' | 'follow-up' | 'error' | ...
  text: string                  // human-readable summary (1–2 sentences)
  timestamp: ISO8601            // when the signal was recorded
  cta: {
    label: string               // e.g., "Review proposal", "Address gap", "Seed discovery"
    skill: string               // skill to launch: 'improve' | 'definition' | 'decisions' | 'discovery' | ...
    seedContext?: string        // signal content to inject as priorArtefacts
  }
  context?: {
    relatedStory?: string       // feature slug or story ID if applicable
    featureSlug?: string        // which feature this signal belongs to
    severity?: 'low' | 'medium' | 'high'
    metadata?: Record<string, any>
  }
}
```

### Signal sources and parsing

| Source | Signal type examples | Parse method | CTA target |
|--------|---|---|---|
| `workspace/capture-log.md` | `signal-type: gap`, `assumption-invalidated`, `decision`, `pattern` | YAML 5-field schema extraction | `/improve` (default) or `/definition` (gap) |
| `workspace/learnings.md` | aggregated entries from capture-log | read as summary prose | `/improve` |
| `workspace/proposals/` | improvement proposals to SKILL.md | directory walk + rationale.md read | `/improve` (review/merge path) |
| `workspace/suite.json` | new eval suite entries | JSON parse + failure/staleness signal type | `/improve` |
| `workspace/results.tsv` | watermark regression or gate fail | TSV parse + flag as performance signal | `/improve` |
| `workspace/traces/` | assurance agent traces | JSONL read + gate-verdict extraction | `/improve` (trace analysis) |
| `artefacts/[feature]/decisions.md` | architectural decisions | regex extraction of ARCH entries | `/decisions` (promote to repo-level ADR) |
| `artefacts/[feature]/dod/` | DoD observations, follow-up actions | parse structured follow-up registry | seed skill based on action type |
| `workspace/estimation-norms.md` | calibration data, velocity deltas | CSV/table parse + flag as estimation signal | `/estimate` (if chained) or `/improve` |
| `artefacts/[feature]/reference/` | spike outcomes, vendor assessments | markdown metadata extraction | contextual (depends on reference type) |
| `.github/pipeline-state.json` | feature/story health transitions, metric signals | JSON parse + state-change detection | `/improve` |
| Parse errors | any of the above that fail to parse | exception caught + logged | `/improve` (surface as "parse error" type) |

### UX flow — Signal to skill session

1. **Dashboard renders signals panel** — displays sorted signal list (most recent first, or by severity/source)
2. **Operator clicks signal CTA** (e.g., "Review proposal: async retry error handling")
3. **Skill session launches** with signal injected:
   - `POST /api/skills/:name/sessions` with `seedSignal: <Signal object>` in body
   - Route handler converts signal to `{ path: 'signal-seed', content: '<signal summary>' }` and includes in `priorArtefacts`
   - `buildSystemPrompt(skill, repoPath, webUiConfig, [priorArtefacts])` assembles full prompt with signal context baked in
4. **Model's first turn** is contextualized (e.g., "I see a proposal was flagged for async retry error handling. Let me ask: which component owns this logic?")
5. **Operator answers** — normal skill session flow from there
6. **Session completes** — artefact is written and saved; signals panel re-renders on next dashboard refresh (per ADR-030 reconciliation, but UI-side this is on-demand)

### Skill launcher redesign

**Primary CTAs (always shown):**
- Discovery (icon: light bulb or document)
- Ideate (icon: brainstorm or network)
- Reverse-engineer (icon: magnifying glass or circuit)
- Spike (icon: pin or experiment)
- Improve (icon: trending up or refresh, distinct section label: "Improvement cycle")

**Hidden entirely:**
- All 27+ chained skills — `/clarify`, `/estimate`, `/definition`, `/test-plan`, `/review`, `/dor`, `/implementation-plan`, `/tdd`, `/subagent-execution`, `/verify-completion`, `/trace`, `/decisions`, `/benefit-metric`, `/modernisation-decompose`, and all others

**Backward compatibility:**
- Advanced operators who need to run a chained skill can still do so by navigating to `/skills` or using a direct `/skills/:name/session` link — the launcher is simplified, not the underlying skill system

### Non-functional requirements

- **Performance:** Signal aggregation and parsing must complete in <200ms for solo operator scale (<2MB workspace). No caching (on-demand per request). Scale inflection point for caching: >10 dashboard refreshes/min or >10MB workspace (Phase 5 performance story).
- **Graceful degradation:** Parse errors on individual signal sources do not block the entire panel — failed sources are surfaced as "parse error" signal entries, and parsing continues for remaining sources.
- **Accessibility:** Signal entries are screen-reader accessible (semantic HTML, ARIA labels for CTAs). CTA buttons are keyboard navigable.
- **Multi-tenant safety:** Signal sources are read from the current repo's workspace only (per ADR-025 tenant scoping). Multi-tenant deployment with per-tenant workspace isolation is deferred.

---

## UX / interaction design

### Entry point — Signals panel location

The signals panel is integrated into the existing dashboard. **Placement decision pending UX design review**, but likely options:
- **Option 1:** Prominent panel above the skill launcher ("Improvement signals & next steps" section)
- **Option 2:** Right sidebar, persistent across all dashboard views
- **Option 3:** Dedicated sub-tab on the dashboard ("Signals" alongside "Skills", "Features", "Journey")

The signals panel is always available; the operator can browse and act on signals at any time, not just at session start.

### Signal entry rendering

Each signal entry shows:
- **Signal text** (1–2 sentence summary)
- **Source tag** (e.g., "capture-log", "proposal", "dod-follow-up") — color-coded or icon-coded
- **Type badge** (e.g., "gap", "assumption-invalidated", "proposal") — color-coded by severity/type
- **Timestamp** (when recorded)
- **CTA button** (e.g., "Seed discovery", "Review proposal", "Address gap")

Example rendering:

```
┌─────────────────────────────────────────────────────┐
│ IMPROVEMENT SIGNALS & NEXT STEPS                     │
├─────────────────────────────────────────────────────┤
│ [capture-log] [gap] 2026-09-28 11:42 AM             │
│ Missing error handling in async task retry logic     │
│ → [Seed /definition]                                │
├─────────────────────────────────────────────────────┤
│ [proposals] [proposal] 2026-09-28 10:15 AM          │
│ Improve: async-retry-gap — extend test coverage     │
│ → [Review proposal]                                 │
├─────────────────────────────────────────────────────┤
│ [dod-follow-up] [follow-up] 2026-09-27 16:30 PM    │
│ Close gap in csd-s5: add integration test for...    │
│ → [Seed /test-plan]                                │
└─────────────────────────────────────────────────────┘
```

### Model behavior on signal seed

When a signal is injected as `priorArtefacts`, the model is not explicitly told "you received a seed" — it simply has that context in its system prompt, similar to ADR-023's artefact-content injection pattern. The model's first turn is contextualized, but conversational and natural (not robotic "I acknowledge signal X").

Example first turn for a seeded `/improve` session:

> "I see a proposal was raised to improve async-retry error handling in the task queue. Let me understand the current state: is this proposal addressing a gap that was flagged in capture-log, or is it a new opportunity discovered during review?"

The signal context is invisible infrastructure — the operator sees the skill's normal conversational flow, just informed by the signal.

---

## Key decisions and open questions

**Decided:**
- Signal shape is a normalized `Signal` object, not per-source shapes (aligns with codebase patterns: journey-state aggregation, skill-turn-executor normalization)
- On-demand signal parsing (no caching for MVP) — acceptable performance for solo operator; deferred as Phase 5 performance story if scale inflection is hit
- Skill launcher shows only 5 primary CTAs (discovery, ideate, reverse-engineer, spike, improve); all chained skills hidden
- Signals-to-session integration uses Option A (signal injected as `priorArtefacts` in system prompt) — invisible infrastructure, no separate flow for `/improve`
- `/improve` is a primary entry point in the launcher (distinct section) — first-class citizen, not hidden
- Signal parsing is graceful — parse errors are surfaced as signal entries, not silent failures

**Open questions (pending /clarify or /definition):**
- **Signals panel placement:** Which dashboard location best balances discoverability with clutter? (Option 1: above launcher | Option 2: sidebar | Option 3: sub-tab)
- **Signal filtering/sorting:** MVP shows all signals sorted by timestamp; should operators be able to filter by source, type, severity, or feature slug? Deferred or MVP?
- **Bulk actions:** Should operators be able to select multiple signals and batch-seed a session, or is one-at-a-time the right model? (Deferred — MVP is one CTA per signal)
- **Signal dismissal:** Should operators be able to dismiss a signal from the panel (mark as "reviewed" or "not actionable") without launching a session? Or does every signal require a session? (Deferred or TBD in definition)
- **Signals for archived/closed features:** Should signals from archived or completed features be shown, or hidden by default? (TBD — depends on use case; deferred to definition)

---

## Deferred to /definition or /decisions

- **Signals panel exact placement** on dashboard (UX design decision)
- **Signal filtering/sorting UI** (MVP may be unsorted list; filtering deferred)
- **Bulk signal seeding** (one-at-a-time is MVP; batch operations deferred)
- **Signal dismissal/marking as reviewed** (may be deferred or a lightweight implementation)
- **Caching layer** (deferred to Phase 5 performance story when scale inflection is hit)
- **Multi-tenant signal isolation** (MVP assumes single workspace per deployment; per-tenant variant deferred)
- **Scheduled `/improve` runs** (MVP is operator-triggered only; scheduled/CI-triggered deferred)
- **Cross-repo signal aggregation** (MVP is single-repo only; cross-team/org aggregation is Phase 6)

---

## Assumptions

[ASSUMPTION] The 12 signal sources listed are complete and representative of improvement-loop signal production — audit during /clarify confirmed this list.

[ASSUMPTION] Standalone entry-point skill list (discovery, ideate, reverse-engineer, spike, improve) is stable and can be hardcoded in the launcher — confirmed no other skills are valid cold-start entry points.

[ASSUMPTION] Signal parsing (capture-log YAML, proposals directory, DoD markdown) can be robust with basic file I/O and string parsing — no complex parsing library needed.

[ASSUMPTION] `/improve` skill can run via existing web UI session model without new execution architecture — unconfirmed; may require spike if `/improve` has multi-turn or multi-file-read patterns that stress the session model.

[ASSUMPTION] Signal sources are accessible from the current repo's workspace — per ADR-025, multi-tenant isolation assumes each tenant has separate workspace or MVP is scoped to solo-operator/single-tenant only.

---

## Architecture guardrails and constraints (from product context)

- **No new npm runtime dependencies** (tech-stack.md constraint) — use built-in Node.js modules only
- **Single-file HTML viz pattern preserved** (ADR-001) — if dashboard HTML is touched, no external dependencies
- **Artefact-first rule (ADR-011)** — new `src/` modules and route handlers require story artefacts before or alongside implementation
- **Injectable adapter rule (D37)** — any file-read or external-dependency logic must use injectable setters with throwing stubs
- **Canonical Signal shape pattern** — mirrors journey-state and skill-turn-executor normalization patterns in existing codebase
- **ADR-022 (multi-skill orchestration)** — if signals panel orchestrates multiple skill launches, use Option B (per-skill sessions with structured handoff), not Option A (single session spanning multiple skills)
- **ADR-023 (handoff schema)** — use artefact-content injection (Option B-iii) for signal-to-session handoff, not Q&A replay or model-synthesised summaries
- **ADR-024 (journey GET response shape)** — if signals panel interacts with journey state, respect the documented contract

---