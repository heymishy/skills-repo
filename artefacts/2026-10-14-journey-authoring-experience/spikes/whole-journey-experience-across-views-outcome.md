# Spike Outcome: The whole journey experience across all 3 views (Canvas / Customer experience / Delivery)

**Opened:** 2026-10-14 | **Scope:** Standard | **Steps taken:** 5 (synthesis of 4 existing research artifacts from this epic and its parent — `cjm-best-practice-outcome.md`, `post-release-cx-visual-gap-outcome.md`, `cx-interaction-design-polish-outcome.md`, `discovery.md` for this feature — plus 2 fresh web searches: Miro's own view-switching/linking limitations for flowchart-vs-journey-map data, and tab-vs-toggle UX pattern research for multi-view dashboards)
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-14-journey-authoring-experience/spikes/whole-journey-experience-across-views-outcome.md`
**Trigger:** Operator, after seeing the `jae-s1`/`jae-s2`/`jae-s3` mockup and asking how the Canvas view fits in: "I want to revisit the whole cx across all views for this, based on our research on best practice. How should the whole journey experience feel and go."

---

## Outcome: CONFIRM the 3-view structure, NAME one real gap (Delivery), ARTICULATE a holistic narrative

### What was found

1. **The 3-view tab structure (Canvas / Customer experience / Delivery) is already the right interaction pattern — confirmed by fresh research, not just inherited assumption.** Tab-vs-toggle UX research converges on: tabs are correct specifically when sections are "peer" (same hierarchy level), content-dense enough to warrant a full panel swap, and mutually exclusive — exactly this app's own 3 views. Toggles are for 2-4 short, equal-weight, INLINE-switching options (e.g. list vs. chart of the same small dataset) — a worse fit here, since each of these 3 views is itself a dense, scrollable surface, not a short inline swap. This directly validates the `sw-canvas-view-toggle-btn` row's own already-tab-like behavior; nothing found here calls for replacing it with a different switching mechanism.

2. **Even Miro — the mature tool the ORIGINAL `cjm-best-practice` spike cited as proof that swimlane and flowchart views "coexist... as distinct, linked views, not forced into one merged visual" — does not actually have a clean, built-in way to switch between a flowchart view and a journey-map view of the SAME underlying data.** A fresh, targeted search found this is an open feature request in Miro's own community forum, not a solved pattern users can point to. This matters for calibrating ambition: this app's own 3-tab structure, switching between 3 full perspectives on the same stage data with zero extra clicks to re-link anything, is already ahead of what a widely-used, mature tool natively offers. It reinforces finding 1 rather than contradicting it — it does NOT mean "go further than tabs," it means "don't manufacture anxiety that tabs are a primitive stopgap; they are a genuinely good answer to a problem even Miro hasn't fully solved."

3. **A real, honest gap: the Delivery view has never been design-reviewed, at all, this entire session.** Every spike and story this session (`jcx-s3` through `jcx-s7`, `jae-s1` through `jae-s3`) has focused on Canvas vs. Customer experience. Delivery (`Map feature`/`Add placeholder` buttons, coverage/health badges) was explicitly scoped OUT of `jcx-s6`'s own redesign ("Delivery tab is explicitly out of scope — it keeps its own existing vertical-stack layout") and has stayed untouched since. This is not a oversight to apologize for — it was a deliberate, named scope boundary each time — but if the operator's own ask is "the WHOLE journey experience," Delivery is the one view this spike cannot honestly claim has been researched or improved at all.

4. **A holistic narrative frame, synthesized from all 4 prior research artifacts, not invented fresh:** each of the 3 views has a distinct, defensible JOB, and the authoring experience should feel like moving through them in a natural progression, not like 3 unrelated tools bolted together:
   - **Canvas = the skeleton.** Shape the SEQUENCE — add, reorder, reposition stages. Spatial, fast, minimal data entry. This is where `jae-s1`'s template and `jae-s2`'s guided creation actually start paying off, since "+ Add stage" is reachable from here and the panel opens automatically.
   - **Customer experience = the story.** Fill in and present the EMPATHY content — emotion, actions, touchpoints, pain points, opportunities, persona. The artifact you'd put in front of a room. This is what `jcx-s6`/`jcx-s7` already rebuilt into a real swimlane journey map, and where `jae-s3`'s suggestions reduce blank-field friction.
   - **Delivery = the plan.** Bridge empathy to execution — connect journey stages to real engineering work (mapped features, placeholder triggers, coverage health). The one view this spike confirms has never been held to the same bar as the other two.

   This 3-stage frame ("skeleton → story → plan") is grounded directly in the `cjm-best-practice` spike's own foundational finding (journey map = empathy/stakeholder artifact; flow/process diagram = what-the-system-does artifact — Nielsen Norman Group's own distinction) PLUS this tool's own deliberate, already-confirmed extension (engineering-delivery chrome layered on top of standard CJM practice, named as a scoped departure in that same original spike, not a gap).

### Reasoning

The operator's own ask ("how should the whole journey experience feel and go") is best answered by confirming what's already structurally right (the 3-tab split, now backed by fresh research rather than just the original spike's own citation) rather than inventing a bigger redesign that nothing found here actually calls for. The one place this spike cannot honestly claim completeness is Delivery — naming that gap directly is more useful than silently implying "the whole experience" has been covered when one-third of it genuinely hasn't been looked at.

---

## If CONFIRM + gap

**What needs to change:** Nothing structural. No new view, no tab-to-toggle change, no merging of Canvas and Customer experience (the exact anti-pattern the original spike already ruled out, now further reinforced by the Miro finding).

**Suggested direction, prioritized:**

- **Keep `jae-s1`/`jae-s2`/`jae-s3` exactly as scoped.** They are the right next step for the "skeleton" and "story" stages of the narrative above; nothing found here changes their own ACs.
- **Name Delivery as a real, separate future discovery candidate — not folded into `jae`'s current scope.** A dedicated spike on the Delivery view's own UX (has it ever been compared to the same kind of reference bar `jcx-s3`-`jcx-s7` were judged against? does "No coverage ✕ / Needs metrics ⚠" read clearly? does it feel like "the plan" in the narrative above, or still like a generic list?) is the natural next piece of "the whole journey experience," but it is a genuinely separate body of research — this spike does not have enough fresh material on Delivery specifically to responsibly scope it now.
- **Adopt the "skeleton → story → plan" framing as documentation, not new code.** Worth capturing in `product/mission.md` or this feature's own discovery as the stated mental model for why 3 views exist and what each is for — useful for onboarding a new team member to the tool's own design intent, costs nothing to write down, prevents a future spike from re-litigating "should these 3 views be merged" from scratch.

**Not recommended:** Expanding `jae`'s current MVP scope to include Delivery. The discovery/benefit-metric/stories already written are scoped and reviewed against Canvas+Customer-experience's own authoring flow; Delivery is a different view with a different job and deserves its own dedicated research, not a late addition squeezed into an already-passed review.

**Return to:** Operator decision below on whether to (a) proceed to `/test-plan` for `jae-s1`-`s3` as already scoped, and (b) separately schedule a future Delivery-focused spike/discovery.

---

## Sources

- `spikes/cjm-best-practice-outcome.md` (parent feature, 2026-10-11) — journey-map-vs-flow-diagram distinction (NN/g), swimlane+canvas coexisting as distinct linked views in mature tools (Miro), engineering-delivery framing named as a deliberate, scoped extension
- `spikes/post-release-cx-visual-gap-outcome.md` (parent feature, 2026-10-13) — the structural gap that became `jcx-s6`
- `spikes/cx-interaction-design-polish-outcome.md` (parent feature, 2026-10-14) — visual polish, authoring-flow defects, save-feedback research, dedicated-tool deep dive, internal-consistency check
- `discovery.md` (this feature, 2026-10-14) — guided creation / smarter defaults / template MVP scope, Canvas/Delivery both explicitly out of scope
- Miro community forum + Gend.co's own UX guide to journey mapping in Miro (fresh web search) — confirms no clean built-in flowchart-to-journey-map view-switching even in a mature tool
- Tab vs. toggle UX pattern research — saasui.design, Ceros component library, UX pattern references (fresh web search) — confirms tabs are the correct pattern for 3 peer, content-dense, mutually-exclusive views

---

## Discovery fields resolved

No discovery-field changes for `jae` itself — this spike confirms the existing scope boundary (Canvas/Delivery out of scope) rather than changing it. If a future Delivery-focused discovery is opened, it should reference this spike's own "skeleton → story → plan" framing and its own named gap (finding 3) as its starting context.
