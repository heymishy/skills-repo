# Spike Outcome: Best-practice grounding for the Feature Playback Demo Package

**Opened:** 2026-10-14 | **Scope:** Standard | **Steps taken:** 5 web searches across 3 topic clusters (demo/acceptance practice, automated capture tooling, async video/accessibility)
**Done condition met:** Yes — 7 sources across 5 independent clusters, synthesized below
**Brief:** `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/spikes/best-practice-grounding-brief.md`
**Artefact path:** `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/spikes/best-practice-grounding-outcome.md`

---

## Outcome: REDESIGN — the core concept is well-grounded; the MVP scope has one material gap (accessibility) and one assumption resolves more specifically than the discovery currently frames it

### What was found, mapped to the discovery's own 4 open assumptions

**1. "Playwright can drive screenshot capture against staging" — CONFIRMED as established best practice, with a concrete refinement.** Playwright's `page.screenshot()`/`locator.screenshot()` and video-recording options are a standard, well-documented mechanism for exactly this ([BrowserStack guide](https://www.browserstack.com/guide/playwright-screenshot)). Industry guidance is specific about WHERE automation pays off: "the best candidates for automation are screenshots where the product state is repeatable with high cost of staleness... known routes, stable UI targets" ([dev.to — what to automate and what to review](https://dev.to/jakexkim/playwright-screenshots-for-documentation-what-to-automate-and-what-to-review-3h44)). Playwright MCP tooling now auto-generates full visual documentation (CSS-highlighted interactions, organized/named screenshots) from a single prompt ([debbie.codes](https://debbie.codes/blog/automate-your-screenshot-documentation-with-playwright-mcp)). Critically, every source agrees automation does **not** remove editorial responsibility — a human still confirms each captured state is correct before the package ships. **Refinement:** the MVP should automate capture specifically at AC-mapped, stable UI states (which this platform's own DoR/DoD process already names per-AC), with mandatory human review before the package is marked complete — this sharpens, not just confirms, the discovery's existing "skill guides the engineer, does not author from scratch" framing.

**2. "The feature's E2E test suite can serve as the video script" — PARTIALLY RESOLVED, and resolves AWAY from raw E2E test content.** The discovery's own risk ("some E2E tests are too low-level or terse") is validated by evidence-based release-note tooling practice: the pattern that works is pulling **structured, already-curated evidence** (PRs, issue trackers, DoD-style artefacts) rather than raw test code or memory ([Tessl release-notes skill](https://tessl.io/registry/skills/github/jscraik/Agent-Skills/release-notes) — "collecting evidence... drafting the smallest useful notes with evidence for each claim... not inventing notes from memory"). This platform already produces exactly this kind of structured evidence per story — the DoD's own AC Coverage table and Metric Signal section (see any `dod/*.md` artefact from this session, e.g. `jae-s3-dod.md`). **Refinement:** script the walkthrough from the DoD's own AC-coverage table and benefit-metric evidence, not from raw E2E spec file content — closes this assumption with a specific answer the discovery currently leaves open.

**3. "Chrome's built-in recording or a Node equivalent is an acceptable video capture mechanism" — CONFIRMED as sound in principle; the specific tool choice correctly stays out of this spike's scope.** Narrated screen recording is an established, effective async-documentation pattern generally ([Atlassian/Loom — project walkthroughs](https://www.atlassian.com/software/loom/resources/guides/use-cases/project-walkthrough)). No source surfaced a regulated-environment-specific restriction on screen-recording tooling choice — this remains correctly flagged (per the spike's own out-of-scope boundary) as a question needing named compliance sign-off if/when a regulated tenant adopts this skill, not resolved here.

**4. "Engineers are willing to narrate or annotate a screen recording" — REFRAMED from a binary into a spectrum best practice already supports.** Current tooling narrows this gap rather than forcing a choice: AI transcription can auto-generate a written doc directly from an unnarrated or lightly-narrated recording ([Atlassian/Loom AI workflows](https://loom.com/blog/loom-ai-workflows)), and screen+webcam vs. screen-only recording is itself a configurable choice, not an all-or-nothing commitment ([Atlassian/Loom — project walkthrough guide](https://www.atlassian.com/software/loom/resources/guides/use-cases/project-walkthrough)). **Refinement:** the MVP should not force a narration decision up front — allow silent or lightly-narrated recording with auto-generated transcript/annotation as the default, removing the forced binary the discovery currently implies.

### A fifth, material finding the discovery does NOT currently name at all

**Video accessibility (WCAG AA) is a real, documented requirement this discovery's own NFR/Constraints section is silent on.** Multiple independent accessibility sources agree: prerecorded video requires captions, and audio-only content requires a transcript, as a baseline accessibility standard — not an optional nicety ([UC Office of the President — transcripts/captions guidelines](https://www.ucop.edu/electronic-accessibility/_files/transcripts-captions-guidelines.pdf); [Castify — video accessibility best practices](https://www.castify.com/blog/video-accessibility-best-practices)). This platform has enforced WCAG 2.1 AA rigorously on every single story shipped this session (`jae-s1` through `jae-s4` each carry an explicit Accessibility NFR line; `MC-A11Y-01`/`MC-A11Y-02` guardrails are checked at every DoR). A demo-package feature that ships video content with no caption/transcript requirement would be a real, avoidable accessibility gap — inconsistent with how every other feature in this codebase has been built. This is the primary reason for the REDESIGN call rather than a plain PROCEED: it is not a reason to abandon the concept, but it is a scope correction that must happen before `/clarify`, not discovered later at `/definition-of-ready`.

---

## If REDESIGN

**What needs to change in the discovery before `/clarify` runs:**

1. **Add an explicit Accessibility NFR/constraint:** any generated video must have auto-generated (then reviewable) captions, and the package must include a text transcript — not left as an unstated assumption.
2. **Resolve assumption 2 concretely:** the walkthrough script is sourced from the feature's own DoD artefact (its AC Coverage table and Metric Signal section), not from raw E2E test file content.
3. **Resolve assumption 4 concretely:** narration is optional by default; auto-transcription (not a forced human-narration decision) is the MVP's own baseline mechanism for turning a recording into structured, searchable documentation.
4. **Sharpen the screenshot-automation boundary (assumption 1):** automate capture at AC-mapped, stable UI states only; human review remains mandatory before a package is considered complete — this is a refinement of existing MVP scope language, not new scope.

**Not recommended:** Abandoning the automated-capture approach in favor of fully manual demo prep. Every automation source confirms Playwright-driven capture at stable, repeatable UI states is both viable and standard practice — the discovery's instinct to use existing Playwright tooling (already a devDependency, no new npm dependency per ADR-011) is correct and should not be walked back.

**Return to:** `/clarify` should run next, but with the discovery amended per points 1–3 above first — otherwise `/clarify`'s own 4 questions would be asked against a framing that's already missing a real NFR.

---

## Sources

- [GitScrum — Sprint Review Best Practices](https://docs.gitscrum.com/en/how-to/sprint-review-best-practices) — demo-as-feedback-session framing, stakeholder sign-off practice
- [BrowserStack — How to Capture Screenshots and Videos Using Playwright](https://www.browserstack.com/guide/playwright-screenshot) — core Playwright capture mechanism
- [dev.to (Jake Kim) — Playwright screenshots for documentation: what to automate and what to review](https://dev.to/jakexkim/playwright-screenshots-for-documentation-what-to-automate-and-what-to-review-3h44) — automation boundary (stable UI targets), editorial-review requirement
- [debbie.codes — Automate Your Screenshot Documentation with Playwright MCP](https://debbie.codes/blog/automate-your-screenshot-documentation-with-playwright-mcp) — modern automated visual-documentation workflow
- [Atlassian/Loom — Project walkthrough guide](https://www.atlassian.com/software/loom/resources/guides/use-cases/project-walkthrough) — async video walkthrough practice, screen+webcam vs. screen-only
- [Loom — AI workflows](https://loom.com/blog/loom-ai-workflows) — auto-transcription reducing the narration-decision burden
- [Tessl registry — release-notes skill](https://tessl.io/registry/skills/github/jscraik/Agent-Skills/release-notes) — evidence-backed documentation generation pattern (structured evidence over raw artefacts or memory)
- [UC Office of the President — Guide to Transcripts and Captions](https://www.ucop.edu/electronic-accessibility/_files/transcripts-captions-guidelines.pdf) — WCAG caption/transcript baseline requirement
- [Castify — Video accessibility best practices](https://www.castify.com/blog/video-accessibility-best-practices) — supplementary accessibility guidance

---

## Discovery handoff

| Field | Changed? | New value / clarification |
|-------|----------|---------------------------|
| Problem statement | No | Unchanged — the acceptance-loop gap framing holds |
| MVP scope | Yes | Add: captions + transcript generation as part of the video output; script sourced from the DoD artefact's own AC-coverage/metric evidence, not raw E2E test content; narration is optional, not a forced decision |
| Assumptions | Yes | Assumption 2 and 4 resolve concretely (see above) rather than staying open; assumption 1 confirmed with a sharpened automation boundary; assumption 3 (tooling choice) stays open, correctly deferred to `/definition` |
| Known risks | Yes | Add: shipping video content with no caption/transcript mechanism is an accessibility gap inconsistent with this platform's own established WCAG 2.1 AA practice |
| Technical constraints | Yes | Add: video output must include machine-generated (human-reviewable) captions and a text transcript, consistent with the existing "no proprietary format" constraint |

**Re-run /discovery?** Not required — these are additive refinements to the existing MVP scope/assumptions/constraints sections, not a change to the problem framing or who it affects. Recommend applying the amendments directly to `discovery.md` (still in Draft status, not yet approved) rather than a full re-discovery pass.
