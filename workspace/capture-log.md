# Capture Log

Append-only. One entry per signal. Never truncate or overwrite prior entries.

---

- date: 2026-04-28
  session-phase: pre-discovery exploration
  signal-type: pattern
  signal-text: artefacts/baseline/ concept — a durable, versioned reference corpus that always represents the current known implementation state of all systems in scope. Distinct from in-flight feature artefacts (artefacts/[date]-[slug]/). Blank for greenfield; populated by /reverse-engineer runs for legacy systems; updated incrementally as implementation advances and DoD+release confirms new state. Stories pin to a baselineRef (ISO-8601 timestamp) so spec-drift is detectable. Applies to all repo types (general, not modernisation-only). Cross-repo: each framework repo maintains its own artefacts/baseline/ as a local projection; shared knowledge lives in the EA registry. baselineRef granularity: ISO-8601 timestamp (not just date — multiple runs per day must be distinguishable). Outer loop writes freely to artefacts/baseline/; inner loop updates after DoD+release confirmation. reference/ folder stays as feature-scoped raw input; baseline/ is the extracted, structured, cross-feature truth.
  source: operator-manual

- date: 2026-04-29
  session-phase: asd.1 post-merge bug sweep
  signal-type: pattern
  signal-text: "All four asd.1 bugs (ci_attachment gating, pipelineStories TDZ, epic-nested stories, wildcard slug) share the same root cause: inline JS inside github-script YAML actions is never executed by the test suite. Tests only grep YAML text for string presence — they cannot catch JS logic bugs, variable ordering bugs, or regex edge cases. Pattern: any logic inside a github-script action block is effectively untested. Structural fix needed: extract inline JS to a testable module (scripts/ci-audit-comment.js) that exports buildComment(inputs). Secondary finding: extractPRSlug must be tested against glob notation (artefacts/*/), multiple artefact path references in body, and backtick-wrapped paths — all occur in real agent-generated PR bodies."
  source: agent-auto

- date: 2026-04-29
  session-phase: sar.1 short-track
  signal-type: gap
  signal-text: Audit record slug resolution (sar.1) fixes the PR-blind heuristic but the ✅ ticks still mean "file exists and was hashable" not "correct artefacts for this story". Deferred idea — cross-check: after slug extraction, compare extracted slug against the slug recorded in .ci-artefact-staging/manifest.json at collect-time; if they differ, post a ⚠️ mismatch notice on the PR rather than silently showing potentially stale artefacts. This would close the remaining gap where a manual/hand-crafted PR body takes the first artefact path match which may be a "Related" reference rather than the primary feature. Also useful for detecting cases where the manifest was collected from a different feature branch. Candidate for a follow-on short-track story once sar.1 is merged and the manifest.json structure is confirmed stable.
  source: operator-manual

- date: 2026-04-30
  session-phase: rrc post-merge / integrity gate
  signal-type: pattern
  signal-text: "testPlan.passing lag — when a story is created, passing is initialised to 0 and never updated before the PR is opened. CI audit comment falls back to this stale value, displaying '0/N passing' and showing em-dash on every AC row. Fix: allPassingFallback in ci-audit-comment.js (display) + check-pipeline-state-integrity.js C1/C2/C3 checks (data). Prevention: always update testPlan.passing on master before or alongside opening/merging a PR."
  source: agent-auto

- date: 2026-04-30
  session-phase: rrc post-merge / integrity gate
  signal-type: gap
  signal-text: "Deferred scope leaves permanently failing governance checks. p3.3 (Gate structural independence) was partially implemented — AC2 and NFR depend on a skills-framework-infra repo that was never created. Two tests have been failing on every npm test run for multiple sessions. No mechanism exists to mark tests as known-deferred/SKIP without modifying check-assurance-gate.js (governed, needs story). Created known-deferred-checks.json as the data record; code change (read file + emit SKIP) requires a story. Prevention process rule: mark failing tests as pending in the same commit that records a deferral."
  source: agent-auto
- date: 2026-05-03
  session-phase: inner-loop wave 3 (wuce.9-12)
  signal-type: gap
  signal-text: "PR Governed Delivery Audit Record shows all feature stories' ACs (not just the story under review) because the issue-dispatch template renders the full feature audit view. This is noisy for reviewers who only care about the current story's ACs. UX improvement: scope the audit record to the specific story being reviewed, or add a collapsible section for the full feature view. Not blocking merge — candidate improvement story for a future wave."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "package.json conflict markers survive silently when the resolution one-liner is chained after Set-Location in PowerShell — node exits 0 without writing. All CI gates then crash with SyntaxError. Fix: always run the one-liner as a standalone terminal call, then immediately confirm with node -e 'require(./package.json)'. This is now D28."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "testPlan.status: 'verified' is not in the pipeline-state schema enum. Valid value is 'all-passing'. This caused schema_valid: FAILED on Trace Validation for all 4 Wave 3 stories. Prevention: run full schema scan locally before every pipeline-state commit. This is now D29."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "pipeline-state.json rebase conflicts follow the same pattern as package.json cascading conflicts (D17/D30): multiple PR merges advance origin/master while local commits accumulate. Resolution one-liner: take origin/master as base, Object.assign only the changed story indices from REBASE_HEAD. Prevention: push pipeline-state commits immediately, never accumulate."
  source: agent-auto
- date: 2026-05-04
  session-phase: inner-loop wuce post-delivery bug triage
  signal-type: pattern
  signal-text: "Injectable adapter stubs that return null/empty silently mask production misconfiguration across wuce.23-25. Four adapters (getNextQuestion, submitAnswer, getCommitPreview, commitSession) were never wired in server.js; unit tests passed because they injected test doubles. The fix is threefold: stubs must throw not return empty, DoR must have explicit AC for production wiring, and implementation-plan must name the wiring task separately. This is now D37."
  source: agent-auto

- date: 2026-05-05
  session-phase: dsq inner-loop — post-PR-open investigation
  signal-type: gap
  signal-text: "Story check scripts written by implementation agent but not registered in npm test chain. All 5 dsq check scripts (tests/check-dsq*.js) existed and passed when run directly, but none were in package.json scripts.test. CI showed SUCCESS on all PRs because existing tests passed; the new tests were simply never run. Root cause: /implementation-plan tasks stop at 'write the test file' without an explicit 'register in package.json' step; DoR H5/H6 check test existence not registration; no governance check caught unregistered files. Structural fix: tests/check-test-registration.js governance check + known-deferred-checks.json pendingTestFiles for TDD pre-committed stubs. Also found 3 older check files (check-p4-obs-*.js) with the same gap. This is now D38."
  source: agent-auto

- date: 2026-05-17
  session-phase: EXP-008 Config C S2 — /discovery complete; /definition pending
  signal-type: decision
  signal-text: "CDM-RISK-001 in S2-ea-registry-lending-origination.md carried the severity label 'CRITICAL — regulatory and reputational risk' at the time all three S2 /discovery runs (Config A, B, C) executed. This label pre-answered c5_surfaced without requiring independent model reasoning, violating the CONVENTIONS.md injection design test ('can the injection file content alone answer the judge's c5_surfaced question without any reasoning from the model?'). Label softened post-run to 'HIGH — model performance finding; escalation status unknown'. All three run records annotated with injection_correction and c5_surfacing_quality: partial. Manifest c5_surfaced boolean remains true — C5 was surfaced — but S2 c5_surfacing_quality results for Config A and B should be interpreted with the over-signal caveat when comparing against Config C /definition onward and Config D (which use the corrected file). The historical impurity does not invalidate CPF or AQ scores; it narrows the confidence of cross-config C5 surfacing rate comparisons at S2 specifically."
  source: agent-auto

- date: 2026-05-06
  session-phase: review — 2026-05-06-web-ui-guided-outer-loop
  signal-type: gap
  signal-text: "Systemic gap in definition artefacts: Complexity rating (1/2/3) and Scope stability (Stable/Unstable) were absent from all 7 ougl stories. These fields are defined in the estimation model in copilot-instructions.md and should be set at /definition time. Estimated root cause: the /definition SKILL.md does not explicitly list these fields as mandatory story-level fields in its output checklist. They are defined in a separate 'Estimation model' section of the instructions. Consider adding a /review Category D check for these fields or adding them to the story template."
  source: agent-auto

- date: 2026-05-06
  session-phase: review — 2026-05-06-web-ui-guided-outer-loop
  signal-type: gap
  signal-text: "Review finding ougl.3 1-M1: story AC7 referenced sessionManager.createSession which does not exist in the codebase. The story author named a function from another framework/convention rather than the actual session-creation call chain (registerHtmlSession, createJourney, setActiveSession, linkSessionToJourney). Pattern: when error-condition ACs describe 'the thing that throws', they tend to name a plausible-sounding function rather than the actual one. Fix at /review time: any error-condition AC that names a specific function as the failure point should be verified against the actual codebase during review."
  source: agent-auto

- date: 2026-05-09
  session-phase: definition — 2026-05-08-web-ui-copilot-chat-parity
  signal-type: pattern
  signal-text: "Model switcher + quality comparison idea raised during wucp /definition: a UI-configurable model switch for operators when multiple models are available, with lightweight per-session quality tagging (thumbs up/down per turn or per session) and a simple comparison view. Lighter weight and more UX-friendly than the /experiment skill (which operates via context.yml switching). Explicitly out of scope for wucp — candidate for a separate discovery artefact. Potential feature slug: 2026-05-XX-web-ui-model-switcher."
  source: agent-auto
- date: 2026-05-24
  session-phase: definition
  signal-type: pattern
  signal-text: Risk-first slicing with explicit wave gates (Wave 1 foundation ? Wave 2 CI enforcement ? Wave 3 ADR compliance) is effective for governance architecture features where high-value stories (M2, M4) have hard prerequisites. The wave structure must be called out explicitly in both the benefit-metric priority signal AND the epic goal � without this, teams naturally treat Wave 1 documentation stories as the deliverable rather than the enabler.
  source: agent-auto
- date: 2026-05-25
  session-phase: improve
  signal-type: pattern
  signal-text: "STORY-PROPOSAL-1 cli-advance boolean coercion (B3): cli-advance.js should coerce \"true\"/\"false\" strings to boolean for fields the pipeline-state.schema.json defines as boolean type. Short-track (test-plan → DoR → implement, no discovery). Evidence: releaseReady field written as \"true\" string by advance harness; schema requires boolean; recurring schema validation errors across multiple features whenever a boolean field is advanced via CLI."
  source: operator-manual

- date: 2026-05-25
  session-phase: improve
  signal-type: pattern
  signal-text: "STORY-PROPOSAL-2 check-suite.js orchestrator (B1): replace raw &&-joined npm test chain in package.json with a check-suite.js orchestrator that reads the test list from package.json dynamically and runs each test, resolving the Windows MAX_PATH command-line length limit. Full outer loop (discovery → definition → implement). Evidence: npm test fails on Windows when test chain exceeds ~2000 chars; node wrapper workaround is unofficial and must be used manually each session."
  source: operator-manual

- date: 2026-06-05
  session-phase: ideate-web-ux (post-merge live testing)
  signal-type: decision
  signal-text: Beating GitHub Copilot chat UX is a critical success criterion for the web UI skill runner. The current turn-by-turn Q&A pattern feels clunky and slow compared to free-form conversation in VS Code — the web UI must feel more dynamic and less structured to justify itself as the preferred surface for skill execution.
  source: operator-manual

- date: 2026-06-16
  session-phase: inc5 /test-plan
  signal-type: gap
  signal-text: "inc5 (Canvas-JSON marker instruction in /ideate SKILL.md) is instruction-only — there is no code-level way to unit test whether the model actually follows a SKILL.md instruction at inference time, only whether the instruction text itself is present and well-formed. AC1 (Lens A cluster-tree marker), AC2 (Lens D table marker), and AC6 (one-marker-per-lens cadence) were all classified gap type Untestable-by-nature and pushed to manual verification scenarios in the AC verification script; AC1 and AC2 are a blocking DoD gate per the story's own entry condition, AC6 is not. This is a recurring shape for any story that adds model-instruction text rather than code: the test plan can only ever cover 'the instruction exists and is well-formed', never 'the model reliably obeys it' — that gap is permanent for this class of story, not a one-off oversight. Pattern worth reusing verbatim for any future SKILL.md-instruction-only story (e.g. inc3's question-cadence story already had the same shape with its T5 manual scenario)."
  source: agent-auto

- date: 2026-06-16
  session-phase: inc5 /definition-of-ready
  signal-type: gap
  signal-text: "inc5's story text states a literal dependency on \"inc4 at definition-of-done\", but inc4's pipeline-state stage was still verify-completion (its own DoD was never run) — yet the real functional prerequisite (inc4's code merged, parseCanvasBlock/canvasBlock pipeline live) was satisfied. H8-ext's schemaDepends check only verifies that declared fields (stage, dodStatus) exist in pipeline-state.schema.json, not that the upstream story's current value satisfies any condition — so this passed mechanically without surfacing the wording vs. reality gap. Handled this run via an explicit Assumptions-section note in the DoR contract rather than a hard block, since inc4's DoD was intentionally deferred pending inc5 by the story's own design (see inc5.md's \"Definition of done entry condition\" note). Pattern worth watching: any story whose Dependencies block names an upstream story's stage informally (\"at definition-of-done\") rather than checking the literal pipeline-state value can silently drift out of sync with reality; H8-ext's field-existence check does not catch this class of drift, only a human or agent reading both artefacts side-by-side does."
  source: agent-auto

- date: 2026-06-17
  session-phase: ideate-web-ux (live testing, post-PR-385)
  signal-type: gap
  signal-text: "Live /ideate web UI session (10 turns) showed llm_duration_ms of 69122ms on turn 1, dropping to a 8868-17942ms range for turns 2-10. Right-panel canvas structure (Canvas / A-E lens pips) confirmed visible and correctly empty — inc5 (the marker-emission instruction) is not yet implemented, so no canvas content is expected at this stage; this is not a rendering defect. The latency pattern itself is unexplained: first-turn cost is ~4-8x later turns, consistent with a cold-start/connection-establishment cost on the Copilot-proxy path (skill-turn-executor.js getActiveModel() defaults to provider 'copilot' with no SKILL_EXECUTOR_PROVIDER override in .env), but this is a hypothesis, not confirmed — no instrumentation currently isolates connection-setup time from model-generation time. Even the steady-state 9-18s/turn range is slow relative to the 2026-06-05 decision-log success criterion ('beating GitHub Copilot chat UX is a critical success criterion... must feel more dynamic and less structured'). Out of scope for the inc3-inc4 epic (discovery.md explicitly excludes 'Backend model or routing changes'). Deferred per operator instruction to log and revisit later — candidate for a future discovery/spike artefact on turn-latency root cause (cold-start isolation, DEFAULT_TIMEOUT_MS=30000 vs observed 69122ms with no visible abort, DEFAULT_MAX_TOKENS=4096 effect on generation time)."
  source: operator-manual

- date: 2026-06-24
  session-phase: wuce-multi-tenancy inner loop / PR #392 fix
  signal-type: pattern
  signal-text: "Feature slug in pipeline-state.json must exactly match the artefacts/ directory name. Mismatched slug (2026-06-21-new-test-idea-001 vs actual dir 2026-06-21-rtp-receiving-integration/) caused the assurance gate 'Collect governed artefacts' step to exit 1 on every PR where the auto-resolver picked that feature — because trace-report.js --collect uses the slug, not the artefact field, to locate the directory."
  source: agent-auto

- date: 2026-06-24
  session-phase: wuce-multi-tenancy inner loop / PR #392 fix
  signal-type: pattern
  signal-text: "validate-trace.sh discovery_exists iterates ALL committed subdirectories in artefacts/, not only features registered in pipeline-state.json. Fragment directories (single-file staging artefacts — a lone benefit-metric.md, a lone review.md, a lone DoR doc) committed to git without a full discovery chain will hard-fail CI unless explicitly added to reference_dirs in .github/trace-validation.yml."
  source: agent-auto

- date: 2026-06-24
  session-phase: wuce-multi-tenancy inner loop / PR #392 fix
  signal-type: pattern
  signal-text: "Every task object in a story's tasks[] array in pipeline-state.json must include a tddState field — check-pipeline-state-integrity.js raises C4 for each task missing it. The tasks array is optional; if tracking tasks without tddState is needed, remove the array entirely rather than leaving bare task objects."
  source: agent-auto

- date: 2026-06-24
  session-phase: wuce-multi-tenancy inner loop / PR #392 fix
  signal-type: pattern
  signal-text: "testPlan.passing in pipeline-state.json must never exceed testPlan.totalTests — check-pipeline-state-integrity.js raises C2 and validate-trace.sh treats it as a hard-fail. Likely cause is passing count being incremented without totalTests being updated when the test plan was later revised."
  source: agent-auto

- date: 2026-06-25
  session-phase: review / skills-infra-migration-tracks
  signal-type: pattern
  signal-text: "ADR-017 mandates all new features use flat features[].stories[] in pipeline-state.json — but /definition generated epics[].stories[] nesting for this feature. The /review skill caught this as a MEDIUM finding (1-M1 on shr.1). The nesting structure triggers the B2 rule (state advances must be applied on master post-merge), adding implementation overhead across all 12 stories. Future /definition runs for features with logical epics should use flat stories[] in pipeline-state.json while keeping epic artefact files for documentation."
  source: agent-auto

- date: 2026-06-29
  session-phase: review / wuce-multi-tenancy sprint stories s3.1–s5.1
  signal-type: pattern
  signal-text: "All five sprint operator-manual stories (s3.1, s3.2, s4.1, s4.2, s5.1) share the same five MEDIUM findings: missing Discovery reference link, missing Benefit-metric reference link, missing Benefit Linkage section, missing Architecture Constraints section, missing NFRs section. These are template compliance gaps consistently produced when /definition writes operator-manual infra stories without running through the full story template. The substance of the stories is sound — the gaps are all format-level. A story template checklist at write-time would prevent this class of finding from appearing in every review."
  source: agent-auto

---

- date: 2026-06-29
  session-phase: test-plan / 2026-06-29-beta-entry-experience
  signal-type: decision
  signal-text: "bee.3 AC7 (journey_created event placement): committed to GET /skills/:name/sessions/:id/chat as the placement — the first HTML page served after the POST-to-303 redirect that creates a journey. This was required to make AC7 independently testable at DoD without implementation-time ambiguity. Test T14 in check-bee3-posthog.js asserts this directly."
  source: agent-auto

---

- date: 2026-06-29
  session-phase: test-plan / 2026-06-29-beta-entry-experience
  signal-type: pattern
  signal-text: "bee.3 graceful degradation (typeof posthog guard): when POSTHOG_KEY is unset and the PostHog CDN snippet is omitted, ALL posthog.capture() and posthog.identify() calls must also be omitted server-side (conditional on POSTHOG_KEY), or each must be wrapped in typeof posthog !== 'undefined'. The server-side omission approach (simplest) means the test assertion is: no posthog. string in HTML when key is unset. This is a real runtime defect pattern (ReferenceError on page load) that was caught at review and resolved before test-plan."
  source: agent-auto

- date: 2026-07-01
  session-phase: definition / 2026-07-01-landing-auth-billing
  signal-type: decision
  signal-text: "Better Auth ESM/CJS incompatibility is treated as a known fact (not a risk to validate) — framed as a 3-path spike: Path A (dynamic import() wrapper), Path B (full ESM migration), Path C (roll-your-own OAuth via fetch()). Spike exits with a concrete recommendation, not just confirmation of the problem. Pattern: when an incompatibility is confirmed in external docs, reframe the spike as a path-selection decision rather than a feasibility question."
  source: agent-auto

- date: 2026-07-01
  session-phase: definition / 2026-07-01-landing-auth-billing
  signal-type: pattern
  signal-text: "Stripe raw body constraint: POST /webhook/stripe must be registered BEFORE any JSON body-parser middleware — the Stripe SDK's signature verification requires the raw, unparsed request body. Registering the route after body parsing silently breaks signature checks. This must be an explicit DoR architecture constraint on the webhook story, not just an implementation note."
  source: agent-auto

- date: 2026-07-01
  session-phase: definition / 2026-07-01-landing-auth-billing
  signal-type: decision
  signal-text: "Session schema migration strategy for Better Auth (paths A/B): forced re-auth on first post-migration login rather than transparent mapping. Simpler to implement; acceptable because there are no existing beta users. The decision is documented at story-level AC in lab-s1.3 — not deferred to implementation. Pattern: capture migration strategy as a story-level AC, not an implementation detail comment."
  source: agent-auto

---

- date: 2026-07-01
  session-phase: test-plan / 2026-07-01-landing-auth-billing
  signal-type: pattern
  signal-text: "AC testability classification: 'element visible' ACs split into two types — (1) 'exists in HTML source' (unit-testable, e.g. Continue with Google button DOM presence) vs (2) 'renders correctly at viewport' (CSS-layout-dependent, needs browser). Only the latter requires RISK-ACCEPT and manual smoke test."
  source: agent-auto

---

- date: 2026-07-01
  session-phase: test-plan / 2026-07-01-landing-auth-billing
  signal-type: pattern
  signal-text: "Stripe idempotency store must use INSERT ... ON CONFLICT DO NOTHING, not SELECT then INSERT. Test plan (lab-s3.4 IT2) asserts the SQL pattern directly. Pattern: assert the SQL pattern for idempotency, not only the behavioural outcome."
  source: agent-auto

- date: 2026-07-03
  session-phase: discovery / 2026-07-03-admin-role-panel
  signal-type: gap
  signal-text: "Pipeline skills (skills/*/SKILL.md) were not registered as Claude Code slash commands, so invoking /clarify or /discovery via the Skill tool failed every time. Fixed by generating .claude/commands/*.md stubs (one per skill) that read the corresponding SKILL.md. Pattern: pipeline skill invocation requires .claude/commands/ registration, not just SKILL.md files."
  source: operator-manual
