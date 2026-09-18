# Decisions: Design System Adoption

## `dsa-s5` DoR W3: 1 MEDIUM review finding acknowledged as RISK-ACCEPT (2026-09-18)

**Context:** `dsa-s5`'s `/review` run (run 1) found 1 MEDIUM finding: [1-M1] AC5 mixes an observable outcome with a verification-method clause — the same recurring pattern applied consistently to this governance story too, not exempted from scrutiny.
**Decision:** RISK-ACCEPT, proceed to DoR sign-off without story rework.
**Rationale:** Same reasoning as `dsa-s1`–`dsa-s4`'s equivalent RISK-ACCEPTs — closes out this recurring pattern's acknowledgement across all 5 stories in this feature consistently.
**Story:** dsa-s5 — no AC change.

## `dsa-s4` DoR W3: 1 MEDIUM review finding acknowledged as RISK-ACCEPT (2026-09-18)

**Context:** `dsa-s4`'s `/review` run (run 1) found 1 MEDIUM finding remaining after the AC5 process-instruction finding was fixed during the same review: [1-M1] AC4 describes a verification method rather than a sharply observable outcome — same recurring pattern.
**Decision:** RISK-ACCEPT, proceed to DoR sign-off without story rework. The test plan and DoR contract both name the real 15 specs (with the 2 `@real-staging`-tagged ones explicitly flagged as residual risk, not silently accepted), closing the practical ambiguity.
**Rationale:** Same reasoning as `dsa-s1`/`dsa-s2`/`dsa-s3`'s equivalent RISK-ACCEPTs — applied consistently, including to this story's own higher-risk status.
**Story:** dsa-s4 — no AC change.

## `dsa-s3` DoR W3: 1 MEDIUM review finding acknowledged as RISK-ACCEPT (2026-09-18)

**Context:** `dsa-s3`'s `/review` run (run 1) found 1 MEDIUM finding remaining after the route-file ambiguity was resolved during the same review: [1-M1] AC4 describes a verification method rather than a sharply observable outcome — same recurring pattern.
**Decision:** RISK-ACCEPT, proceed to DoR sign-off without story rework. The test plan and DoR contract both name the real spec (`wuce23-skill-launcher-landing.spec.js`) and the real precise target file (`templates/landing.html`, confirmed via direct trace through `public.js`), closing the practical ambiguity.
**Rationale:** Same reasoning as `dsa-s1`/`dsa-s2`'s equivalent RISK-ACCEPTs.
**Story:** dsa-s3 — no AC change.

## `dsa-s2` DoR W3: 1 MEDIUM review finding acknowledged as RISK-ACCEPT (2026-09-18)

**Context:** `dsa-s2`'s `/review` run (run 1) found 1 MEDIUM finding: [1-M1] AC4 describes a verification method ("verified by running pre-existing test coverage") rather than a sharply observable outcome — same recurring pattern as `dsa-s1`'s [1-M2].
**Decision:** RISK-ACCEPT, proceed to DoR sign-off without story rework. The test plan's own implementation already names the real spec file (`psh-s4-dashboard-layout.spec.js`) this AC covers, closing the practical ambiguity.
**Rationale:** Same reasoning as `dsa-s1`'s equivalent RISK-ACCEPT — cosmetic/precision issue, not a functional gap.
**Story:** dsa-s2 — no AC change.

## `dsa-s1` DoR W3: 2 MEDIUM review findings acknowledged as RISK-ACCEPT (2026-09-18)

**Context:** `dsa-s1`'s `/review` run (run 1) found 2 MEDIUM findings: [1-M1] the User Story's "So that" clause reads as beta-feedback framing while Benefit Linkage names visual-consistency as the moved metric; [1-M2] AC4 describes a verification method ("verified by running pre-existing test coverage") rather than a sharply observable outcome. Neither is severe enough to warrant rewriting the story before DoR sign-off.
**Decision:** RISK-ACCEPT both, proceed to DoR sign-off without story rework. [1-M1]: the conceptual link (visual restyle → positive impression) is real even if not literally worded to cite the metric name; a future reader can trace it via the Benefit Linkage field, which is correct. [1-M2]: AC4's own test-plan implementation already names the exact 4 real pre-existing spec files it covers (`artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js`), closing the practical ambiguity even though the story-level AC text itself stays general.
**Rationale:** Both findings are cosmetic/precision issues, not functional gaps — the test plan's own concreteness already substantively addresses [1-M2]'s underlying concern.
**Story:** dsa-s1 — no AC change.

## `/definition` scope-accumulator ratio flag reviewed — confirmed intentional, not drift (2026-09-18)

**Context:** `/definition`'s scope accumulator flagged a 5 stories / 3 MVP items ratio (≈1.67, above the 1.5 threshold) after story decomposition. Investigated before asking the operator: MVP item 1 ("restyle the product's real web-ui screens") was deliberately split into 4 independently-demoable, per-screen vertical-slice stories (`dsa-s1`–`dsa-s4`) per the operator's own chosen slicing strategy (vertical slice). MVP item 2 ("implement dark and light mode") is folded into each of those same 4 stories, not a separate story. MVP item 3 ("wire the design system into governance") is `dsa-s5` alone. So 5 stories genuinely cover exactly 3 MVP items with zero scope additions beyond what discovery already approved — the raw ratio is misleading, not evidence of creep.
**Decision:** Operator confirmed option 1 ("Intentional — update discovery to reflect expanded scope"). `discovery.md`'s MVP Scope section was updated to explicitly name the 4-story vertical-slice split of item 1, the folding of item 2 into those same 4 stories, and the `dsa-s5` mapping for item 3 — so the discovery artefact and the real story decomposition stay in sync for any future reader.
**Rationale:** Matches this repo's own standing discipline (established repeatedly across other features this session) of never silently absorbing a scope-accumulator or DoR-architecture mismatch — surface it, get an explicit operator decision, and record the reasoning here rather than letting the discrepancy sit unexplained between artefacts.
**Story:** Feature-level (all 5 stories) — no AC change; discovery.md updated to match the real decomposition.
