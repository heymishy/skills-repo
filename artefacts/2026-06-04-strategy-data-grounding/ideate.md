# Ideation Artefact — Strategy and Data Grounding for Pipeline Sessions

**Feature slug:** 2026-06-04-strategy-data-grounding
**Session date:** 2026-06-04
**Lenses run:** D (Product strategy framing), B (Assumption inventory)
**Recommended next step:** /discovery scoped to Phase 1 (automatic strategy referencing in /ideate and /discovery)

---

## Lens D — Product strategy framing

### Opportunity assessment

| Question | Signal | Confidence |
|----------|--------|-----------|
| Problem | Strategy context is scattered across PowerPoints, Excel, and Power BI — not linked to the pipeline. Each ideation and discovery session starts from scratch with no grounding in organisational strategy, market positioning, or data. | Strong |
| Customer | Pipeline operators — solo developers and team leads — running /ideate and /discovery sessions in the web UI or VS Code skills pipeline. | Strong |
| Metric | Reduced rework at discovery and benefit-metric stages; faster time-to-grounded-scope. No baseline yet — to be defined at /benefit-metric. | Uncertain |
| Alternatives | Manual paste of strategy content into the session, reliance on mental model, or skip entirely. All unstructured and unlinked to the pipeline. | Strong |
| Differentiation | The pipeline already owns the ideation and discovery entry point. Native automatic injection of strategy context beats context-switching to a separate tool. No competitor in this space does this. | Strong |
| Timing | Two converging signals: pipeline outer loop is mature enough that input quality is now the highest-leverage improvement; web UI is mature enough to support additional context injection at session start. | Strong |
| Channel | Same channel as the rest of the pipeline — web UI skill sessions and VS Code skills pipeline sessions. No separate tool to open or configure. | Strong |
| MVP threshold | Load a strategy file (markdown format for Phase 1), surface relevant content automatically during /ideate and /discovery sessions, work for at least one real strategy format without operator intervention. | Reasonable |
| Risk | Format normalisation for Excel/Power BI (high), data source authentication (high), relevance matching without vector DB (medium). MVP scoped to markdown sidesteps the two high-feasibility risks. | High |

**Recommendation: PROCEED**

Rationale: The problem is real and unaddressed. The channel is already built. The differentiation is structural — no other tool in the pipeline operator's workflow does this. The high-risk items (format normalisation, data source auth) are explicitly out of Phase 1 scope. Starting with markdown strategy files gives a working, validatable v1.

**Phase 2 scope (out of Phase 1):** A dedicated `/strategy` skill for guided strategy creation, analogous to `/ideate`. Phase 2 references and creates strategy content; Phase 1 only references it.

---

## Lens B — Assumption inventory

### Full assumption register

| ID | Assumption | Type | Risk if wrong | Known-ness | Priority |
|----|-----------|------|--------------|------------|----------|
| A1 | Operators want strategy context surfaced automatically during ideation and discovery sessions rather than having to request it manually. | Desirability | Medium | Unknown-unknown | 🔴 Test first — RISK-ACCEPT |
| A2 | The primary frustration operators experience is that strategy context is not available at session start, not that the strategy itself is poorly formed. | Desirability | Medium | Unknown-unknown | 🟡 Test before build |
| A3 | A markdown-first MVP that defers Excel and Power BI integration still delivers enough value for operators to validate whether automatic strategy injection is useful. | Viability | Medium | Unknown-unknown | 🟡 Test before build |
| A4 | Once Phase 1 is validated, there will be appetite and capacity to build the /strategy skill as Phase 2. | Viability | Low | Unknown-unknown | 🟢 Accept |
| A5 | Strategy content stored in markdown files can be injected into the skill session system prompt without exceeding the context window budget. | Feasibility | Medium | Known-unknown | 🟡 Test before build |
| A6 | Strategy content in varied formats (Excel, PowerBI, PPTX, markdown) can be normalised into injectable context without significant data loss. | Feasibility | High | Known-unknown | 🔴 Test first — RISK-ACCEPT |
| A7 | Data sources like Excel and Power BI can be read by the skills pipeline without requiring complex OAuth or service account setup. | Feasibility | High | Known-unknown | 🔴 Test first — RISK-ACCEPT |
| A8 | Relevant strategy content can be surfaced for a given skill session using simple keyword or metadata matching, without requiring a vector database or semantic search infrastructure. | Feasibility | Medium | Known-unknown | 🟡 Test before build |
| A9 | Strategy content loaded into skill sessions does not contain personally identifiable information or commercially sensitive data that creates a data governance or privacy risk. | Ethical | Low | Known-unknown | 🟢 Accept |

### RISK-ACCEPT register (assumptions accepted without testing)

The following assumptions are accepted as risks and will proceed to /discovery without a test:

- **A1 (auto-inject wanted):** Suggested test was a one-session operator interview or data proxy check against /ideate Q5/Q6 answer quality. Accepted without test — RISK-ACCEPT.
- **A6 (format normalisation):** Suggested test was a manual PowerPoint-to-markdown export injected into a test session. Accepted without test — RISK-ACCEPT. MVP scoped to markdown only to mitigate.
- **A7 (data source auth):** Suggested test was a spike attempting to read one Excel file via existing token flow. Accepted without test — RISK-ACCEPT. MVP scoped to local markdown files only to mitigate.

### Suggested experiments (deferred, not discarded)

**A1 — "Auto-inject wanted":**
- Interview: show an operator a mock session where strategy context appears in the first model turn unprompted. Ask: did that help, distract, or feel irrelevant?
- Data proxy: check whether /ideate Lens D Q5/Q6 questions are answered well today without strategy context.

**A6 — "Format normalisation":**
- Prototype: take one real PowerPoint strategy deck, export to markdown manually, inject into a test /ideate session. Does the model use it coherently?

**A7 — "Data source auth":**
- Spike: attempt to read one Excel file from OneDrive/SharePoint URL using the existing GitHub token flow.

---

## How this feeds the pipeline

| Output | Feeds |
|--------|-------|
| Lens D PROCEED verdict + opportunity framing | /discovery — rationale section, scope framing, MVP boundary |
| Assumption register (A1–A9) | /discovery — assumptions section; A1/A6/A7 RISK-ACCEPTs → /decisions |
| Phase 2 scope boundary (/strategy skill) | /benefit-metric — out-of-scope clarification; roadmap reference |

---

## Scope boundary (Phase 1 only)

**In scope for Phase 1:**
- Automatic referencing of existing strategy content during /ideate and /discovery sessions
- Markdown format strategy files
- Web UI skill sessions and VS Code skills pipeline sessions

**Out of scope for Phase 1 (Phase 2+):**
- Guided strategy creation (/strategy skill)
- Excel, Power BI, PowerPoint format support
- Cloud data source authentication (OneDrive, SharePoint)
- Semantic search or vector database infrastructure