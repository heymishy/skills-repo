## Story: Extend `buildSystemPrompt` with optional `priorArtefacts` handoff block

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-1-journey-foundation.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **platform maintainer**,
I want `buildSystemPrompt` to accept an optional `priorArtefacts` array and inject a `--- HANDOFF CONTEXT ---` block into the assembled system prompt,
So that any skill session started as part of a journey receives the prior stages' artefact content as context, enabling the model to produce coherent next-stage output without the operator re-explaining earlier decisions.

## Benefit Linkage

**Metric moved:** MM1 (Artefact quality parity — web UI trace pass rate ≥ VS Code baseline)
**How:** In a VS Code session, the operator accumulates context across stages manually. Without injecting prior artefacts, the web UI model starts each stage with no prior context, producing lower-quality artefacts. This story creates the injection mechanism that closes the quality gap.

## Architecture Constraints

- ADR-019 — Dynamic content is per-turn substitution only: the priorArtefacts block is injected once at session creation time (into systemPrompt), not re-injected per turn. The model receives it as part of the immutable system prompt. This is consistent with the existing assembly model.
- Additive change only: the new 4th parameter is optional. Callers that do not pass `priorArtefacts` receive identical output to today. No existing tests may be broken.
- Zero new npm dependencies: `fs`, `path`, string concatenation only.
- The `--- HANDOFF CONTEXT ---` block MUST appear before the `--- WEB UI PROTOCOL ---` section in the assembled string. The WEB UI PROTOCOL must always be the last section.

## Dependencies

- **Upstream:** None — this story has no upstream story dependency. It can start immediately.
- **Downstream:** ougl.2 (registerHtmlSession extension), ougl.5 (gate-confirm creates sessions with priorArtefacts).

## Acceptance Criteria

**AC1:** Given `buildSystemPrompt('discovery', '/session/path', '/repo/root')` is called without a 4th argument, when the function returns, then the result string does NOT contain the substring `--- HANDOFF CONTEXT ---`.

**AC2:** Given `buildSystemPrompt('benefit-metric', '/session/path', '/repo/root', [{path: 'artefacts/test/discovery.md', content: '# Discovery\n\nTest content.'}])` is called, when the function returns, then the result string contains the substring `--- HANDOFF CONTEXT ---`.

**AC3:** Given `priorArtefacts` contains one item with `path: 'artefacts/test/discovery.md'`, when the result is examined, then it contains the exact substring `--- PRIOR ARTEFACT: artefacts/test/discovery.md ---`.

**AC4:** Given `priorArtefacts` contains one item with `content: '# Discovery\n\nTest content.'`, when the result is examined, then the string `# Discovery\n\nTest content.` appears between the `--- PRIOR ARTEFACT:` header line and a `--- END PRIOR ARTEFACT ---` line.

**AC5:** Given `priorArtefacts` is provided with one item, when the result is examined, then the `--- HANDOFF CONTEXT ---` block appears BEFORE the `--- WEB UI PROTOCOL ---` section (i.e. `result.indexOf('--- HANDOFF CONTEXT ---') < result.indexOf('--- WEB UI PROTOCOL ---')`).

**AC6:** Given `priorArtefacts` contains two items (`discovery.md` and `benefit-metric.md`), when the result is examined, then both items each produce a distinct `--- PRIOR ARTEFACT: [path] ---` / `--- END PRIOR ARTEFACT ---` block, and both blocks appear within the `--- HANDOFF CONTEXT ---` section.

**AC7:** Given `buildSystemPrompt` is called with `priorArtefacts: []` (empty array), when the function returns, then the result does NOT contain `--- HANDOFF CONTEXT ---` (empty array is treated the same as no priorArtefacts — no handoff block injected).

**AC8:** Given an existing call site (`registerHtmlSession`) calls `buildSystemPrompt(skillName, sessionPath)` without the 4th argument, when the existing unit tests for `buildSystemPrompt` run (`npm test`), then all existing tests continue to pass (backward compatibility enforced by test suite passing green).

## Out of Scope

- Changing any existing behavior of `buildSystemPrompt` when called with 3 arguments — the 4th parameter is strictly additive.
- Validating or normalising artefact content (path traversal checks, length limits) — that is the gate-confirm handler's responsibility before calling `buildSystemPrompt`.
- Reading artefact files from disk inside `buildSystemPrompt` — the caller provides `content` pre-loaded. `buildSystemPrompt` only assembles strings.

## NFRs

- **Performance:** `buildSystemPrompt` is synchronous and called once per session creation. Adding string concatenation for priorArtefacts must not introduce noticeable latency (the operation is CPU-only, no I/O).
- **Security:** Prior artefact content is operator-produced markdown. It is injected verbatim into the system prompt. No HTML encoding or sanitisation is required (the system prompt is sent to the model API, not rendered as HTML). Path traversal characters in `pa.path` are NOT validated here — the gate-confirm handler is responsible for ensuring safe paths before calling this function.
