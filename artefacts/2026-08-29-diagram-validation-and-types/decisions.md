# Decision Log: diagram-validation-and-types

**Feature:** Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types
**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Last updated:** 2026-08-29

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-29 | SCOPE | discovery/clarify**
**Decision:** Cut workflow and lifecycle diagram types from this feature's MVP scope; keep sequence.
**Alternatives considered:** (1) Ship all three new types (workflow, sequence, lifecycle) as originally scoped at discovery. (2) Rescope workflow/lifecycle away from the meta-pipeline (to "a process/entity the feature itself introduces") and keep them, conditionally emitted.
**Rationale:** Originally scoped workflow ("DoR→DoD sequence") and lifecycle ("a story's journey through pipeline-state.json phases") were meta-pipeline concepts already covered live by the existing kanban board — genuinely redundant, caught by the operator during `/clarify`. Rescoping them onto "the feature being built" (matching System Architecture/Program Design/Data Model's own convention) removed the redundancy, but exposed that emission would be conditional and rare, and no concrete anticipated use case could be named for either. Sequence was kept because it maps to a concept the platform's own architecture already frequently involves (SSE turns, auth, cache fallback), not a speculative one.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a future feature's own design genuinely introduces a multi-step process or a stateful domain entity worth diagramming, revisit adding workflow/lifecycle at that point, scoped to that concrete case — not speculatively ahead of one.
---

---
**2026-08-29 | RISK-ACCEPT | definition-of-ready (S1-S5)**
**Decision:** Accept DoR Warning W4 (verification script reviewed by a domain expert) as unresolved pre-code for all 5 stories (S1-S5) — proceed to the coding agent without a pre-code human walkthrough of the 5 verification scripts.
**Alternatives considered:** (1) Pause DoR and walk through all 5 scripts before signing off any story.
**Rationale:** The verification scripts (`templates/ac-verification-script.md`) are explicitly designed to serve three moments without modification — pre-code sign-off, post-merge smoke test, and delivery review. Given solo-operator context and no separate domain expert available, the operator will use the scripts as the post-merge smoke test instead of a pre-code gate — this is one of the script's designed uses, not a workaround. Matches the identical precedent already established in this session for `revise-earlier-stage`'s own 4 stories.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a post-merge smoke test run against any of the 5 scripts finds a scenario that reveals the AC itself was wrong (not just the implementation), treat that as evidence the pre-code walkthrough would have caught it — reconsider skipping W4 for future stories.
---

---
**2026-08-29 | ARCH | definition-of-ready (S1)**
**Decision:** Add a minimal client-side console-log listener for S1's new `canvasDiagnostic` SSE event, beyond what the original Contract Proposal specified.
**Alternatives considered:** (1) Leave S1's diagnostic as a pure SSE-level event with no client-side consumer at all.
**Rationale:** Without any client-side consumer, the SSE event would reach the browser but produce no observable signal to the operator — directly contradicting the story's own stated purpose ("so that I understand exactly what went wrong instead of the diagram silently never appearing at all"). This also resolves the open gap flagged in `nfr-profile.md` ("confirm whether the diagnostic needs a visible operator-facing surface beyond logs"). Kept deliberately minimal (console only) — a full rendered UI treatment remains S2's scope for the mermaid-syntax failure mode specifically.
**Made by:** Claude (agent), during S1's DoR contract review
**Revisit trigger:** If real usage shows operators need more than a console log to notice a malformed-marker failure (e.g. it's routinely missed), revisit with a lightweight visible UI element as a follow-up story.
---

---
**2026-08-29 | DESIGN | definition-of-ready (S5)**
**Decision:** Add the new Sequence diagram type's SKILL.md instruction to `skills/design/SKILL.md` only (alongside System Architecture), not `skills/definition/SKILL.md`.
**Alternatives considered:** (1) Add it to both SKILL.md files, matching the story's own ambiguous "during /design or /definition" phrasing literally.
**Rationale:** System Architecture (an architectural/technical concept) already lives in `/design`; Data Model and Program Design (data shape and file-tree/call-stack) live in `/definition` — two structurally different concern groupings. A Sequence diagram (component interaction over time) is closer in kind to System Architecture than to either `/definition`-hosted type, making `/design` the natural single home. Since `/design` is optional (Step 2.5) and Sequence emission is itself conditional, a feature that skips `/design` simply never gets a Sequence diagram — consistent with the story's own "conditional, not unconditional" framing, not a gap.
**Made by:** Claude (agent), during S5's DoR contract review
**Revisit trigger:** If a feature that skips `/design` entirely (going straight to `/definition`) is later found to genuinely need a Sequence diagram, revisit adding the instruction to `/definition`'s SKILL.md too.
---

---
**2026-08-29 | RISK-ACCEPT | branch-setup (S1)**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js` as a pre-existing failure in the S1 worktree's baseline (565 files run, 1 failed) and proceed with implementation rather than blocking on it.
**Alternatives considered:** (1) Investigate and fix this failure before proceeding with S1.
**Rationale:** This exact file is already documented as a known, repo-wide flake — RISK-ACCEPTed 4 times across every worktree in the `revise-earlier-stage` feature (res-s1 through res-s4), and now confirmed a 5th time here in a completely different feature's own worktree. Re-run standalone (`node tests/check-p3.5-validate-trace.js`) and passed cleanly (5/5), confirming a flake rather than anything specific to this worktree or feature.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** Same as `revise-earlier-stage`'s own entries — if this file starts failing in a way that correlates with actual code changes, or blocks CI. Given 5 occurrences across two unrelated features now, this is a strong, standing signal that a dedicated short-track story to root-cause `tests/check-p3.5-validate-trace.js` is overdue — already recommended once in `revise-earlier-stage`'s own decisions.md and not yet actioned.
---

---
**2026-08-29 | ARCH | implementation-plan (S1)**
**Decision:** Introduce a new `parseCanvasBlockDiagnostic(text)` function that returns `{ok:true, block}` or `{ok:false, reason, detail}`; make `parseCanvasBlock(text)` a thin wrapper (`return r.ok ? r.block : null`) preserving its exact existing return contract for every current caller.
**Alternatives considered:** (1) Change `parseCanvasBlock` itself to return a richer object instead of `null` on failure.
**Rationale:** `parseCanvasBlock` has a second existing caller — `extractCanvasBlocksFromTurns` (durable-history reconstruction) — which does `if (parsed) { blocks.push(parsed); }`. A richer failure object would be truthy, so alternative (1) would silently push a diagnostic object into `blocks` as if it were a real canvas block on every historical parse failure — a real regression discovered only by reading the second call site, not by the story/test-plan alone (neither named this caller explicitly). The new-function approach keeps `parseCanvasBlock`'s contract byte-identical for `extractCanvasBlocksFromTurns` and every other existing caller, while giving the new SSE scan-loop call site (the only one that needs diagnostic detail) a distinct function to call instead.
**Made by:** Claude (agent), during S1's implementation planning
**Revisit trigger:** If a future story needs diagnostic detail from `extractCanvasBlocksFromTurns`'s own call site too, extend it to call `parseCanvasBlockDiagnostic` directly at that point — do not retrofit `parseCanvasBlock` itself.
---

---
**2026-08-29 | DESIGN | implementation-plan (S1)**
**Decision:** Reuse `skills.js`'s own pre-existing injectable `_logger`/`setLogger()` convention (already used throughout the file, e.g. `_logger.info('session_started', {...})`) for S1's diagnostic audit-log call, rather than importing `drift-comparator.js`'s separate `setLogger`/`_logEvent` mechanism as the DoR contract's wording implied.
**Alternatives considered:** (1) Follow the DoR contract's literal wording and reuse `drift-comparator.js`'s logger convention instead.
**Rationale:** `skills.js` already has its own established, actively-used logger convention in the same file S1 modifies — reusing it needs zero new imports and matches every other audit-log call site in this file. `drift-comparator.js`'s logger is a separate module's own convention, irrelevant here; the DoR contract's reference to it was imprecise, corrected during implementation planning rather than carried into the code.
**Made by:** Claude (agent), during S1's implementation planning
**Revisit trigger:** None expected — straightforward correction.
---

---
**2026-08-29 | SCOPE | subagent-execution (S1, Task 1)**
**Decision:** Removed `'sequence'` from S1's `TYPE_ALLOW` implementation, which had been included by mistake in the implementation plan's own Task 1 code (both the shipped code and the plan artefact have been corrected).
**Alternatives considered:** (1) Leave `'sequence'` in TYPE_ALLOW since it is harmless today (no skill emits it yet) and S5 would need to add it anyway.
**Rationale:** S1's own story text (AC2, Out of Scope) is written against the *existing* 7-type allowlist; adding `'sequence'` is explicitly S5's scope, not S1's. This was a genuine drafting error in the implementation plan (introduced before this session's context-window summarization boundary), caught only by re-checking the subagent's diff against the story artefact rather than trusting the plan file at face value — the plan itself is not infallible just because it was reviewed at Step 4 of `/implementation-plan`. Left uncaught, S1 would have silently pre-enabled a type with no renderer until S5, and every future story reading this decisions.md or the plan artefact would see a scope boundary that didn't match the actual code.
**Made by:** Claude (agent), during S1 subagent-execution, verifying Task 1's output
**Revisit trigger:** None expected -- S5 will add `'sequence'` back to TYPE_ALLOW itself, as originally scoped.
---

---
**2026-08-29 | ARCH | subagent-execution (S1, Task 2)**
**Decision:** Add a server-side `_escSseDiagnosticText()` helper and apply it to the `canvasDiagnostic` SSE payload's `detail` field only (not the audit-log call, which keeps raw text).
**Alternatives considered:** (1) Leave the SSE payload unescaped, on the reasoning that no other SSE emitter in this file (`chunk`, `conditionItem`, `draftChunk`, etc.) escapes its text either. (2) Escape at the `parseCanvasBlockDiagnostic` source instead of at the SSE-write call site.
**Rationale:** The implementation-plan's own Task 2 test (`diagnosticTextIsEscapedBeforeSsePayload`, from S1's test plan's NFR-Security row) explicitly requires this, independent of what other SSE emitters in the file do — a real, deliberately-scoped NFR the plan's Step 3 code failed to satisfy when first drafted. Caught only because the dispatched subagent ran the test rather than assuming the plan's code was correct, and reported the literal failure instead of silently "fixing" it itself (which risked stepping on Task 3's own edit to the same `else` branch). Escaping only at the SSE-write call site (not at the source or in the audit log) keeps `_logger`'s recorded `detail` at full fidelity for debugging, while satisfying the NFR at the one point that actually reaches an untrusted rendering surface.
**Made by:** Claude (agent), verifying and fixing S1 Task 2's subagent output
**Revisit trigger:** If a future story needs the same escaping for another SSE emitter in this file, extract `_escSseDiagnosticText` into a shared, more generically-named helper at that point — do not do so speculatively now.
---

---
**2026-08-29 | RISK-ACCEPT | branch-setup (S2)**
**Decision:** Acknowledge `tests/check-p3.5-validate-trace.js` as a pre-existing failure in S2's worktree baseline (566 files run, 1 failed) and proceed with implementation rather than blocking on it.
**Alternatives considered:** (1) Investigate and fix this failure before proceeding with S2.
**Rationale:** Same known, repo-wide flake already RISK-ACCEPTed 5 times across `revise-earlier-stage` (res-s1 through res-s4) and S1 of this feature. Re-run standalone (`node tests/check-p3.5-validate-trace.js`) and passed cleanly (5/5), confirming a flake rather than anything specific to this worktree.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** This is now the 6th occurrence across 3 unrelated features/stories (`revise-earlier-stage` ×4, S1 of this feature, S2 of this feature). The standing recommendation to root-cause this file with a dedicated short-track story is now overdue by a wide margin — every additional occurrence without action increases the risk that a REAL regression in this file gets waved through as "the known flake" without genuine investigation.
---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
