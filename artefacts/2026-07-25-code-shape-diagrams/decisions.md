# Decision Log: 2026-07-25-code-shape-diagrams

**Feature:** Code Shape Diagrams (System Architecture, Program Design, Data Model) — outer-loop design + inner-loop as-built, with drift check
**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Last updated:** 2026-07-25

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
**2026-07-25 | ARCH | discovery/clarify**
**Decision:** As-built Data Model diagrams derive their ground truth from static parsing of the repo's actual committed SQL/migration files, not live-database introspection, for the MVP.
**Alternatives considered:** (a) live database introspection at generation time — more accurate but requires DB access from wherever the diagram gets built, and introduces a runtime dependency the static approach avoids; (b) re-prompting an agent to describe from memory what it thinks it built — rejected outright in discovery as carrying the same unreliability as prose and defeating the purpose of an as-built record.
**Rationale:** Static parsing needs no live DB connection, is simpler to implement and test, and directly answers what schema changes a story's commits actually contain — which is the question the drift check needs answered. Live-DB introspection is deferred as a later confirmation/validation step once the static mechanism has real usage evidence.
**Made by:** Hamish King, Founder/Operator (discovery /clarify session, 2026-07-25)
**Revisit trigger:** If static parsing proves unreliable in practice (e.g. migrations applied out of order, or schema changes made outside tracked migration files) such that the as-built diagram materially disagrees with the real deployed schema.
---

**2026-07-25 | ARCH | discovery**
**Decision:** The `product/tech-stack.md` Web UI constraint — "zero new npm dependencies" — is explicitly relaxed for this feature. A new dependency (a mermaid rendering library) is permitted.
**Alternatives considered:** Hand-rolling a minimal diagram renderer using only existing built-ins (`https`, `fs`, `path`, `os`, `crypto`) to preserve the zero-dependency constraint — not seriously pursued; the cost of maintaining a bespoke rendering engine for sequence/component/entity-relationship diagrams was judged far higher than the cost of one well-established, widely-used client-side dependency.
**Rationale:** The zero-dependency rule exists to keep the Web UI layer simple and dependency-free for its original scope (a thin HTTP server with no framework). Diagram rendering is a genuinely new capability class this constraint wasn't written to anticipate, and mermaid is a mature, client-side-only library — it doesn't touch the server's own "zero Express dependency" architecture.
**Made by:** Hamish King, Founder/Operator (discovery session, 2026-07-25)
**Revisit trigger:** If the added dependency introduces a real maintenance or security burden (e.g. frequent breaking changes, unpatched vulnerabilities) disproportionate to the value delivered.
---

**2026-07-25 | ASSUMPTION | discovery/clarify**
**Decision:** No additional cross-tenant access-control mechanism is needed for Data Model diagrams — the existing session/tenant scoping of the pipeline itself is treated as sufficient to guarantee an operator only ever sees diagrams generated from their own project.
**Alternatives considered:** Building an explicit scoping/permission check specifically for diagram visibility (e.g. tagging each diagram with a tenant ID and checking it against the viewer's session) — considered and rejected as unnecessary, since no code path was identified where a diagram could be generated for one tenant and displayed to another.
**Rationale:** The pipeline is something an operator runs against their own project; diagrams are generated from and displayed within the same session that authored the underlying artefacts. No separate read path exists. The one residual case (this repo's own SaaS backend schema, if ever diagrammed and shown to someone other than the platform admin) is out of this feature's scope.
**Made by:** Hamish King, Founder/Operator (discovery /clarify session, 2026-07-25)
**Revisit trigger:** If a future feature introduces a cross-tenant or admin-facing view that could surface another tenant's diagram (e.g. an admin panel showing any tenant's data model) — at that point this assumption needs its own explicit scoping rule.
---

**2026-07-25 | SCOPE | definition/review**
**Decision:** csd-s4's Data Model diagram generation step (AC4) prompts an explicit reuse-check against existing entities before finalising a diagram that introduces a new entity — added to MVP scope, not deferred.
**Alternatives considered:** (a) defer this to post-MVP, relying solely on csd-s6's drift-comparison step to catch non-optimal design after the fact — rejected, since catching it at design time (before implementation starts) is strictly cheaper than catching it after; (b) keep the AC as originally written without a formal scope note — rejected during `/review` (finding 1-M3), since this behaviour genuinely wasn't named in the original discovery MVP scope and deserved an explicit decision, not a silent addition.
**Rationale:** This is a natural, low-cost extension of ADR-026 (reuse an existing entity's shape rather than introducing a new one) applied at the earliest possible point — design time rather than only at the drift-check stage. `/review` surfaced this as a scope gap; the operator confirmed it should be added to MVP rather than removed.
**Made by:** Hamish King, Founder/Operator (review session, 2026-07-25)
**Revisit trigger:** If this prompt proves too disruptive to the `/design`/`/definition` session flow in practice (e.g. slows down every session even when no new entity is proposed), reconsider moving it to a lighter-weight, non-blocking suggestion instead of an explicit prompt.
---

---

**2026-07-25 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceeding to the inner coding loop for all 6 csd-e1 stories without a separate domain-expert review pass of the 6 AC verification scripts (DoR Warning W4).
**Alternatives considered:** Reviewing all 6 verification scripts before sign-off — rejected for now given solo-operator context; "domain expert" here would be the same person (Hamish King) reviewing their own spec, so the marginal value of a separate pass is lower than for a multi-person team, though not zero (a fresh read can still catch spec errors the author is blind to).
**Rationale:** Accepted risk: an AC verification script could contain a spec-level error (a scenario that reads correctly but describes the wrong behaviour) that isn't caught until post-merge smoke testing, later than ideal. Given the epic's own Medium oversight level already requires a pause for human review at PR time for every story, this residual risk is judged acceptable — a second real checkpoint exists downstream, just later in the loop than W4 would provide.
**Made by:** Hamish King, Founder/Operator (definition-of-ready session, 2026-07-25)
**Revisit trigger:** If post-merge smoke testing on any of these 6 stories reveals a verification-script defect that a pre-code review would plausibly have caught, revisit this decision for the remaining unstarted stories in the epic.
---

**2026-07-26 | ARCH | definition-of-done follow-up**
**Decision:** As-built System Architecture diagrams derive their ground truth from static detection of `require()` calls to a fixed allowlist of known external-service packages (`stripe`, `pg`, `ioredis`/`redis`, `@octokit/*`, `@anthropic-ai/sdk`, `posthog-node`) across this repo's real committed `src/` tree — not live network tracing, APM instrumentation, or a re-prompted agent's description of the architecture. Detected requires are resolved to a named service label (e.g. `require('stripe')` → "Stripe") and rendered as edges from the wiring file (predominantly `src/web-ui/server.js`, per this codebase's D37 injectable-adapter convention — most external clients are wired there even when consumed elsewhere) to each named external service.
**Alternatives considered:** (a) live network/APM tracing at runtime — more accurate about actual call volume and live topology, but requires a running, instrumented process and introduces exactly the kind of runtime dependency the Data Model decision (static migration parsing) already rejected for consistency; (b) deep transitive resolution through the D37 adapter-wiring pattern (tracing from every route handler through every injected adapter to the eventual external `require()`) — considered and deferred: more architecturally complete, but a materially larger scope than csd-s5's own Program Design call-graph extractor (which was deliberately kept to a minimal, real proof rather than a full production pipeline) and not necessary to satisfy csd-s5 AC2 / csd-s6 AC3, which only require flagging new/removed service-to-service edges, not full transitive call paths; (c) re-prompting an agent to describe the architecture from memory — rejected outright, same reasoning as the Data Model decision.
**Rationale:** A fixed-allowlist `require()` scan is real (never re-prompts an agent), directly verifiable against this repo's actual dependency usage, and produces the same mermaid `flowchart` edge shape `drift-comparator.js`'s `compareSystemArchitecture()` already expects (reusing `call-graph-extractor.js`'s existing require-edge-extraction approach, extended with an external-package allowlist instead of relative-path resolution) — no new comparison logic needed. Scoped deliberately narrow (wiring-file-to-service edges, not full transitive tracing) to match this epic's established pattern of shipping a real, honest MVP rather than a complete production pipeline, consistent with how csd-s5's Program Design extractor was scoped.
**Made by:** Hamish King, Founder/Operator (post-DoD follow-up, 2026-07-26)
**Revisit trigger:** If the allowlist-based approach misses a real external service integration added in a future feature (e.g. a new payment provider, a new LLM vendor) — the allowlist will need extending, or a more general detection heuristic (any `require()` of a package not already in `package.json`'s own internal `src/` tree) may be worth considering at that point.
---

## Architecture Decision Records

<!-- No ADR-level entries yet for this feature — the three decisions above were judged log-entry weight, not full-ADR weight, at discovery stage. Revisit at /definition if any of them prove to have wider structural implications than currently understood. -->
