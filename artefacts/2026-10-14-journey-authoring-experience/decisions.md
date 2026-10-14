# Decisions: Journey authoring experience

---

**2026-10-14 | SCOPE | Operator override**
**Decision:** Proceed to scope and build the AI-generation fast-follow (`jae-s4`) now, overriding the original data-driven gate ("once the deterministic scan ships and has real usage data") confirmed via `/clarify` and re-confirmed in the `ai-generation-fast-follow-scoping-outcome.md` spike earlier the same day.
**Context:** The operator asked to action all 4 outstanding follow-ups from this feature together, and when presented with the choice to wait for `jae-s3`'s own real usage data vs. proceed now, explicitly chose to override the gate.
**Rationale:** This is the operator's own informed call, made with the original gate's reasoning already surfaced to them (the scoping spike's own "What was found" section). The underlying risk the gate was protecting against (building something that turns out to be unnecessary once the deterministic scan's real coverage is known) is accepted as a known trade-off, not overlooked.
**Made by:** Hamish King (Platform Owner), via direct `AskUserQuestion` reply.
**Revisit trigger:** None needed — this is a final decision, not a placeholder pending further confirmation.

---

---

**2026-10-14 | SCOPE | /clarify**
**Decision:** The AI/LLM-generated field-suggestion mechanism is explicitly sequenced as a fast-follow story, not an open "maybe" — the deterministic discovery-artefact-scan (extending `jcx-s4`'s own existing persona-suggestion pattern) ships as this MVP's own suggestion mechanism; a real LLM-based generation mechanism is named and planned as a separate next story once the deterministic mechanism's real coverage is known from usage.
**Context:** `/discovery` proposed building the cheaper, already-proven deterministic pattern first, but left open whether that alone would be considered "done" for MVP, or whether AI generation needed to ship alongside it.
**Rationale:** The deterministic scan reuses existing, already-shipped infrastructure (`jcx-s4`'s own discovery.md-scanning code) with zero new npm dependency and no LLM cost/accuracy/hallucination risk for empathy-sensitive content. AI generation is a materially bigger, costlier, riskier build that this app's existing LLM-gateway adapter infrastructure could support later — explicitly sequenced as a fast-follow rather than silently dropped or left ambiguous.
**Made by:** Claude (session), confirmed by Hamish King (Platform Owner) via `AskUserQuestion` during `/clarify`.
**Revisit trigger:** Once the deterministic scan ships and has real usage data, scope the AI-generation fast-follow as its own story — do not let it drift into an indefinitely-deferred "someday" item.

---

**2026-10-14 | SCOPE | /clarify**
**Decision:** MVP ships exactly one default starting-skeleton template for a brand-new journey (not a selectable template library).
**Context:** `/discovery` proposed a single skeleton as the smallest validatable slice, leaving open whether a small library (e.g. by product type) should ship from day one instead.
**Rationale:** Validating the single-template mechanism (does seeding a recognizable shape actually reduce the "blank list" friction the problem statement names) is cheaper and faster than building selection/customization UI for a library whose value is unproven. A library is a natural, lower-risk extension once the single-template mechanism is confirmed to work.
**Made by:** Claude (session), confirmed by Hamish King (Platform Owner) via `AskUserQuestion` during `/clarify`.
**Revisit trigger:** If usage data shows operators building visibly different journey shapes that the one default skeleton doesn't fit well, revisit toward a small library.

---

**2026-10-14 | DESIGN | /clarify**
**Decision:** MVP collapses today's two-step stage-creation flow (add name, separately find the Edit-stage affordance, separately fill 7 fields) into one guided action — but keeps the existing side-panel editing model unchanged. It does NOT adopt the bigger, deliberately-deferred inline-in-grid editing redesign (editing fields directly in the swimlane grid cells, matching Splice/QuestionPro/Figr's own convention) named in the `cx-interaction-design-polish` spike's own "Not recommended" section.
**Context:** The operator explicitly asked for "the bigger UX and CX upgrade... rethink the whole authoring experience end-to-end," which could plausibly have meant replacing the side-panel model itself. `/clarify` asked directly which boundary applied.
**Rationale:** Inline-in-grid editing is a genuinely bigger, reference-grounded idea, but an order of magnitude larger engineering effort than collapsing an existing two-step flow into one. The operator confirmed guided creation (keeping the side panel) is the right-sized scope for this MVP — the bigger redesign stays named and traceable as a deferred idea, not silently dropped, and can be revisited as its own future discovery if guided creation alone doesn't close enough of the gap.
**Made by:** Claude (session), confirmed by Hamish King (Platform Owner) via `AskUserQuestion` during `/clarify`.
**Revisit trigger:** If operator CX judgment of the guided-creation flow (this feature's own success indicator) still reads as "clunky" after it ships, revisit toward the bigger inline-in-grid redesign as a dedicated future discovery.

---

**2026-10-15 | DESIGN | Delivery-view redesign, P2 placement**
**Decision:** In the Delivery view's new swimlane grid (reusing `jcx-s6`'s grid mechanism per ADR-026), the "Map feature" and "Add placeholder" actions live inside the "Mapped features" cell for each stage column — not in a dedicated actions row.
**Context:** `delivery-view-design-outcome.md` (2026-10-14) found the Delivery view structurally identical to the pre-`jcx-s6` Customer-experience tab and recommended the same card-to-grid restructure, but left open where the two existing action affordances (`Map feature`, `Add placeholder`) land in the new grid — a dedicated row (closer to the traceability-matrix convention) or inline in the coverage-status cell (closer to today's per-card layout). This was explicitly flagged as needing an operator call before a story could be written.
**Rationale:** The actions change the contents of the cell they sit in (adding a mapped feature or a placeholder to that stage), so they belong next to what they change rather than in a separate row. This also gives an empty "No coverage" stage ("—") an immediate, co-located call to action, and lets the story keep the existing `.sw-stage-map-feature` / `.sw-stage-add-placeholder` classes and `data-stage-id` attributes as-is, so the feature-picker modal and placeholder-add-form JS need no changes — reducing story size. Trade-off accepted: the column needs a minimum width (~200px) to hold the list plus two buttons without clipping; the story must verify this against `jcx-s6`'s existing `gridTemplateColumns`.
**Made by:** Hamish King (Platform Owner), via direct reply to options presented by Claude (session).
**Revisit trigger:** If the "Mapped features" cell proves too cramped once built (verified during the story's own DoR/DoD), revisit toward a dedicated actions row.

---

**2026-10-15 | SCOPE | Operator override (jae-s5 review 1, finding 1-H1)**
**Decision:** The Delivery-view swimlane-grid redesign (epic `journey-authoring-delivery-view-grid`, story `jae-s5`) proceeds under this feature slug (`2026-10-14-journey-authoring-experience`), overriding this feature's own discovery.md Out of Scope boundary ("Any change to the swimlane grid's own rendering... display/mechanics layer... this discovery is scoped entirely to the pre-first-save authoring experience"). `jae-s5`'s own `/review` run 1 (`review/jae-s5-review-1.md`, finding 1-H1) flagged this as the same shape of scope expansion already made once this session for `jae-s4` (AI-generated suggestions — also named out of scope in this same discovery, and overridden with a logged decision above).
**Context:** The operator directed this work explicitly, twice, across this session: choosing the Delivery-view redesign as a priority item, then confirming its placement decision (see the P2 placement decision above). `/review`'s own scope-discipline check (Category B) surfaced that no equivalent override had been logged yet, unlike `jae-s4`'s.
**Rationale:** Same rationale shape as the `jae-s4` override: the operator's own direction, given with the original discovery boundary's purpose already understood (keeping `jae-s1`–`jae-s3` narrowly scoped to pre-first-save authoring, and protecting `jcx-s6`/`jcx-s7`'s already-shipped CX grid from being redone). The Delivery-view redesign is a materially different concern (reviewing delivery coverage, not creating a stage) that reuses, rather than redoes, the protected CX grid mechanism — the epic's own Out of Scope section (as corrected per finding 1-H2) commits to no observable change to the CX grid's own behaviour.
**Made by:** Hamish King (Platform Owner), via direct `AskUserQuestion` reply.
**Revisit trigger:** None needed — this is a final decision, not a placeholder pending further confirmation.

---

**2026-10-15 | RISK-ACCEPT | W4 — solo-operator, no second reviewer (first log for this feature)**
**Decision:** W4 (verification script reviewed by a domain expert distinct from the author) is risk-accepted for every story in this feature, per `architecture-guardrails.md`'s own "Solo operator / W4 RISK-ACCEPT posture" section — a uniform, repo-wide posture, not a per-story judgment. This is the first W4 log for this feature slug (`2026-10-14-journey-authoring-experience`); no individual entry is needed for `jae-s1`–`jae-s4` or any future story in this feature beyond this one.
**Context:** `jae-s5`'s own `/definition-of-ready` run surfaced W4 as applicable; checking `decisions.md` found no prior W4 entry logged for this feature despite 4 earlier stories already having passed DoR this session — an omission in those earlier runs, closed here rather than carried forward silently.
**Rationale:** This repository is operated by a single engineer (Hamish King); the operator is also the reviewer and final approver for every artefact in this pipeline. Per the architecture guardrail, human oversight for this operating context defaults to High for exactly this reason — not because any one story's complexity demands it.
**Made by:** Established repo-wide posture (`architecture-guardrails.md`), applied here per `/definition-of-ready`'s own W4 check.
**Revisit trigger:** If a second operator onboards or this repository moves into regulated-enterprise operation, per the guardrail's own stated trigger.

---

**2026-10-15 | RISK-ACCEPT | jae-s5 /branch-setup baseline flake**
**Decision:** `tests/check-pcr-s1-test-runner.js` failed in the `jae-s5` worktree's full-suite baseline run (`npm test`: 752/753 passed) but passed cleanly (14/14) when run standalone (`node tests/check-pcr-s1-test-runner.js`). Acknowledged as a pre-existing, full-suite-only ordering flake and not investigated further before proceeding — unrelated to `jae-s5`'s own scope (`src/web-ui/routes/journeys.js`), which this test file does not touch.
**Context:** `/branch-setup`'s own baseline-verification step requires explicit acknowledgement before proceeding past a failing baseline.
**Rationale:** The isolated run confirms the underlying check itself is correct; the failure only appears under full-suite execution, which points at shared state or ordering between test files (consistent with other test-runner side effects already observed this run, e.g. stray `artefacts/test-slug/`, `artefacts/2026-10-14-discovery/`, `workspace/test-tmp-inf5/`/`test-tmp-mig4/` left in the worktree by other test files) rather than a defect `jae-s5`'s own changes could have caused or will interact with.
**Made by:** Hamish King (Platform Owner), via direct `AskUserQuestion` reply.
**Revisit trigger:** If this same flake recurs across multiple stories' own baseline runs, it is worth a dedicated investigation into the full-suite's shared state/ordering, rather than re-acknowledging it story by story.
