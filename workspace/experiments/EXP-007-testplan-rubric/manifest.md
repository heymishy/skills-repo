# EXP-007 — /test-plan skill rubric experiment (Test Coverage Fidelity)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-007-testplan-rubric |
| experiment_type | skill-rubric-tcf |
| created | 2026-05-15 |
| operator | heymishy |
| status | scaffolded — runs not yet executed |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual, VS Code model selector) |
| trigger | new-skill-rubric — /test-plan corpus cases newly created, first eval run |
| skills_swept | test-plan |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4, T5 |

## Hypothesis

Haiku (0.33× cost) can replace Sonnet as the default model for /test-plan while achieving TCF = 1.00 across adversarial cases with zero categorical fails (no AC omitted; no browser-layout AC misclassified as unit test). If confirmed, the `/test-plan` routing row is updated from `claude-sonnet-4-6 provisional` to `claude-haiku-4-5` with `measurement_backed: true`. If Haiku omits any AC on any case, or classifies a browser-layout-dependent AC as unit/integration, it is disqualified from /test-plan use regardless of weighted score.

**Secondary question:** Does Haiku hallucinate — generating tests that assert behaviour not grounded in any AC? A model that achieves 100% AC coverage but fabricates implementation-level assertions on regulated inputs (e.g. asserting specific encryption algorithms not stated in the ACs) provides a false sense of coverage and may mislead the coding agent.

## Primary metric: Test Coverage Fidelity (TCF)

$$TCF = \frac{\text{ACs with at least one correctly classified, runnable test or manual scenario}}{\text{total ACs in the story}}$$

**TCF threshold:** 1.00. A model that omits any AC — producing no test and no manual scenario in the verification script — is disqualified from production /test-plan use regardless of its weighted score on other dimensions.

**Categorical fail conditions:**
1. Any AC with no test and no manual scenario (D1 = 0.0 on that AC) → `compliant = false`
2. A browser-layout-dependent AC classified as a unit or integration test on T3 → `compliant = false` (same failure as B2 DoR violation — the coding agent will write an unmaintainable DOM-simulation test)
3. A fabricated HIGH-stakes regulatory assertion on T5 that implies compliance coverage beyond the ACs → D3 categorical fail

## Corpus design

The five cases span a clean baseline, an NFR-bearing story, a browser-layout-dependent AC, an untestable external-system AC, and a regulated PCI story. Each case is a story artefact; the judge scores coverage completeness, classification accuracy, hallucination rate, and output completeness independently.

| Case | Label | Planted challenge | Primary dimension tested | Categorical fail condition |
|------|-------|-------------------|--------------------------|---------------------------|
| T1 | Payment confirmation email — clean baseline | 4 GWT ACs, all unit-testable; no E2E, no NFR complexity | D1 (coverage completeness) | Any AC omitted |
| T2 | Session timeout — performance NFR | 3 GWT ACs + explicit performance NFR (p99 < 200ms @ 100 concurrent) | D4 (NFR test coverage) | NFR test absent |
| T3 | Backlog drag-and-drop — browser-layout ACs | 3 ACs; AC1 and AC3 require real browser rendering for drag-drop target | D2 (test type classification) | AC1 or AC3 classified as unit/integration |
| T4 | Fraud detection — untestable external AC | 3 ACs; AC2 asserts external system's internal receipt — not testable from app layer | D3 (hallucination suppression) | AC2 has a fabricated integration test asserting external system internals |
| T5 | Card payment — regulated PCI story | 4 ACs; PCI DSS constraint; test data must not include real PANs; hallucination trap on encryption | D3 (hallucination suppression) + D5 (dual output) | Fabricated encryption/compliance assertion not grounded in any AC |

**Corpus location:** `.github/skills/test-plan/corpus/`

---

## Case detail — T1: Payment confirmation email — clean baseline

**Setup:** Story for sending a transactional confirmation email after a successful payment. Four well-formed GWT ACs. All are testable at unit or integration level. No NFRs, no PCI scope, no browser-layout dependency. Synthetic test data (mock payment objects).

**What the model must do:** Produce a technical test plan covering all four ACs with correctly classified unit/integration tests, plus an AC verification script. Tests must be written to fail (TDD discipline).

**Pass condition:** All 4 ACs covered; test runner confirmed from package.json (not assumed); both outputs present; verification script mirrors the 4 ACs.

**Fail condition:** Any AC has no test; test runner hardcoded as Jest or pytest without reading package.json; verification script absent.

---

## Case detail — T2: Session timeout — performance NFR

**Setup:** Story for automatic session invalidation after 30 minutes of inactivity. Three GWT ACs plus one explicit performance NFR: "Session expiry check must run within 200ms (p99) under 100 concurrent users." NFR is in the story's Non-Functional Requirements section.

**What the model must do:** Cover all three ACs AND write at least one test or test description targeting the p99 performance NFR. The performance test does not need to be fully executable (a load test scaffold noting the tool and scenario is acceptable), but the NFR must appear in the test plan with a runnable description.

**Pass condition:** 3 ACs covered; at least one performance test or load test entry explicitly citing the 200ms / p99 / 100 concurrent NFR; both outputs present.

**Fail condition:** NFR section absent from test plan; performance NFR mentioned in "out of scope" rather than tested; ACs covered but NFR invisible.

---

## Case detail — T3: Backlog drag-and-drop — browser-layout-dependent ACs

**Setup:** Story for prioritising backlog items by dragging and dropping story cards. Three ACs: AC1 and AC3 involve dragging a card and verifying its rendered position relative to other cards — this requires CSS layout resolution that DOM simulation environments (jsdom/happy-dom) cannot provide. AC2 tests persistence on page refresh, which can be tested at integration level without a browser.

**What the model must do:** Flag AC1 and AC3 as browser-layout-dependent (E2E required). Write a unit/integration test for AC2. Write E2E test descriptions (Playwright or equivalent) for AC1 and AC3. Must NOT write a unit/integration test using jsdom, fireEvent, or simulate for AC1 or AC3.

**Pass condition:** AC1 and AC3 flagged as E2E-required; E2E test descriptions present for AC1 and AC3; unit/integration test for AC2; both outputs present; verification script has manual flag for AC1 and AC3 if no E2E tool configured.

**Categorical fail condition:** AC1 or AC3 described as a unit test using `fireEvent`, `simulate`, `trigger`, or jsdom — a DOM simulation test on a drag-drop target will not catch CSS layout failures. This is a pipeline integrity failure identical to B2 DoR violation.

---

## Case detail — T4: Fraud detection event — untestable external AC

**Setup:** Story for publishing payment events to a fraud detection system. Three ACs: AC1 tests that an event message is published to the fraud detection topic (verifiable via a mock/spy on the message publisher). AC2 tests that the fraud detection system receives and correctly parses the event — this assertion requires access to the external system's internal state, which is not testable from the application layer. AC3 tests that events are queued on topic unavailability.

**What the model must do:** Write unit/integration tests for AC1 and AC3. Recognise that AC2 cannot be asserted at the application layer and route it to the verification script as a manual integration step. Must NOT fabricate an integration test that asserts the fraud detection system's internal receipt behaviour.

**Pass condition:** AC1 and AC3 have runnable unit/integration tests; AC2 has a manual scenario in the verification script noting it requires end-to-end environment verification; both outputs present; no test asserts the external system's parsing behaviour.

**Categorical fail condition:** A test appears for AC2 that asserts something like `fraudSystem.lastReceived.amount === 100` or equivalent — fabricating access to the external system's state. This hallucinates a test that cannot pass without mocking the external system in a way that provides no real integration evidence.

---

## Case detail — T5: Card payment — regulated PCI story

**Setup:** Story for processing a card payment at checkout. Four GWT ACs covering: payment gateway call and transaction reference return (AC1); no raw card data stored in the application database (AC2); field-level error on invalid card with no server-side card data exposure (AC3); payment marked pending on gateway timeout (AC4). PCI DSS NFR: "Card data must not be logged or persisted outside the payment gateway." Test data involves card numbers — PCI scope.

**What the model must do:** Cover all four ACs. Surface the PCI scope in the test data strategy section (flag that synthetic/fake card numbers must be used; no real PANs in test fixtures). Both outputs present. Must NOT fabricate assertions about encryption algorithms, key lengths, or HSM usage that are not stated in any AC.

**Pass condition:** All 4 ACs covered; test data strategy section present and flags PCI scope with synthetic card number requirement; both outputs present; tests are grounded in AC outcomes only.

**Categorical fail condition:** A test asserts something not in any AC, e.g. `expect(storageLayer.encrypt.algorithm).toBe('AES-256')` or `expect(auditLog.contains('PAN')).toBe(false)` without an AC requiring these checks. This is hallucination — the model is adding compliance assertions it inferred from the PCI constraint rather than from the ACs.

---

## Run procedure (Layer 1)

1. For each corpus case (T1–T5) and each model (Haiku, Sonnet), two trials:
   - Switch model selector to the target model
   - Paste corpus case story into a fresh chat window
   - Invoke `/test-plan` and step through Steps 1–4 using pre-determined answers (see interaction script below)
   - Save model output to `workspace/experiments/EXP-007-testplan-rubric/runs/[model]-T[n]-trial-[1|2].md`

2. After each run pair (one model, one case, two trials), judge both outputs using the judge prompt in EVAL.md

3. Save judge output to `workspace/experiments/EXP-007-testplan-rubric/judge/[model]-T[n]-trial-[1|2]-judge.md`

4. Record scores in the scorecard template below

### Pre-determined interaction script (same for both models, both trials)

To control for interactive variable answers, use the following fixed responses to skill prompts:

| Prompt | Fixed answer |
|--------|-------------|
| Ready to write the test plan for this story? | yes |
| What environment and framework applies? | 1 (use what's configured for this repo) |
| Where will test data come from? | 1 (synthetic — generated in test setup) except T5: answer 6 (mixed — I'll describe); follow up: "AC2 and AC3 involve card numbers. PCI scope applies — use fake card numbers only." |
| Any ACs you want to flag as potentially untestable? | T4 only: "AC2 — requires the external fraud detection system to have received and parsed the message. Not verifiable from the application layer." All others: none |

---

## Scorecard template

| Model | Trial | T1 D1 | T1 D3 | T1 D5 | T2 D1 | T2 D4 | T3 D1 | T3 D2 | T4 D1 | T4 D3 | T5 D1 | T5 D3 | T5 D5 | TCF | Compliant |
|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-------|-----|-----------|
| haiku-4-5 | 1 | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| haiku-4-5 | 2 | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| sonnet-4-6 | 1 | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| sonnet-4-6 | 2 | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

---

## Runs directory

`workspace/experiments/EXP-007-testplan-rubric/runs/` — model outputs (to be populated)

`workspace/experiments/EXP-007-testplan-rubric/judge/` — judge outputs (to be populated)

---

## Results (to be populated after runs)

| Model | TCF (avg) | Categorical fails | Recommended routing |
|-------|-----------|-------------------|---------------------|
| haiku-4-5 | — | — | — |
| sonnet-4-6 | — | — | — |

**Routing decision unlocked:** If Haiku TCF = 1.00 with zero categorical fails across both trials → update `/test-plan` routing row to `claude-haiku-4-5`, `measurement_backed: true`, `experiment_id: EXP-007-testplan-rubric`.

If Haiku has any categorical fail → routing stays `claude-sonnet-4-6` provisional; record specific failure mode for SKILL.md intervention consideration.
