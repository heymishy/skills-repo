## Test Plan: Activate domain-tag standards injection at story authoring time

**Story reference:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | /definition prompts for domain when code matches a known domain | 2 | — | — | 1 | — | 🟢 |
| AC2 | Single domain injects full matching standards file content | 2 | 2 | — | — | — | 🟢 |
| AC3 | Multiple domains inject all matching files, not just the first | 2 | 1 | — | — | — | 🟢 |
| AC4 | No-domain behaviour fully preserved (regression guard) | 2 | — | — | — | — | 🟢 |
| AC5 | Unmatched/typo'd domain surfaces a clear warning | 3 | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|-----------------------------|----------|
| Whether `/definition`'s prompt text is actually followed by a real future authoring session (vs. just existing in the skill instructions) | AC1 | Untestable-by-nature | A SKILL.md's own instruction text can be asserted to exist and be well-formed, but whether a future session actually follows it is a behavioural outcome outside this test suite's reach | Manual — confirmed at the next `/definition` run for a web-ui-touching story; log the outcome in this feature's decisions.md |

---

## Test Data Strategy

**Source:** Fixtures — synthetic story artefacts with varying `domain` field values, plus the real (already-merged) `web-ui-patterns.md` and `security-standards.md` content for injection-content assertions.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture story touching `src/web-ui/routes/*.js` with no `domain` field set | Fixture | None | |
| AC2 | Fixture story with `domain: [web-ui]` | Fixture | None | |
| AC3 | Fixture story with `domain: [web-ui, security]` | Fixture | None | |
| AC4 | Fixture story with no `domain` field (regression case) | Fixture | None | |
| AC5 | Fixture story with `domain: [web-uis]` (typo) | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — /definition's skill instructions mention the domain field
- **Verifies:** AC1
- **Precondition:** `skills/definition/SKILL.md` content
- **Action:** Read the file, search for a `domain` field prompt/mention in the story-authoring section
- **Expected result:** The instructions explicitly mention prompting for or considering a `domain` tag
- **Edge case:** No

### U2 — /definition's domain prompt references the actual index.yml keys, not a hardcoded stale list
- **Verifies:** AC1
- **Precondition:** `skills/definition/SKILL.md` content + `.github/standards/index.yml` content
- **Action:** Confirm the SKILL.md instructs reading `index.yml`'s keys dynamically (or lists them in a way that's kept in sync), rather than hardcoding a domain list that could drift
- **Expected result:** No hardcoded domain list that duplicates `index.yml`'s own keys without a sync mechanism
- **Edge case:** Yes

### U3 — domain matching resolves a single domain to its standards file path
- **Verifies:** AC2
- **Precondition:** Fixture story with `domain: [web-ui]`, real `index.yml`
- **Action:** Call the DoR standards-matching function with the fixture
- **Expected result:** Returns `['.github/standards/web-ui/web-ui-patterns.md']`
- **Edge case:** No

### U4 — matched standards file content is read and included verbatim
- **Verifies:** AC2
- **Precondition:** Same fixture as U3
- **Action:** Run the full Standards injection step
- **Expected result:** The DoR artefact's Coding Agent Instructions block contains the full text of `web-ui-patterns.md` (or a clearly-delimited inclusion of it), not just a file-path reference
- **Edge case:** No

### U5 — multiple domains resolve to all matching files
- **Verifies:** AC3
- **Precondition:** Fixture story with `domain: [web-ui, security]`
- **Action:** Call the domain-matching function
- **Expected result:** Returns both `web-ui/web-ui-patterns.md` and `security/security-standards.md` paths
- **Edge case:** No

### U6 — no-domain story produces the exact existing "skipped silently" message
- **Verifies:** AC4 (regression guard)
- **Precondition:** Fixture story with no `domain` field
- **Action:** Run the Standards injection step
- **Expected result:** DoR artefact's Standards injection section reads exactly "Story has no `domain` field — skipped silently" — byte-for-byte unchanged from current behaviour
- **Edge case:** No

### U7 — no-domain story's Coding Agent Instructions block is unaffected
- **Verifies:** AC4
- **Precondition:** Same fixture as U6
- **Action:** Run full DoR
- **Expected result:** No standards content appears in the Coding Agent Instructions block — identical output to before this story
- **Edge case:** Yes

### U8 — unmatched domain value surfaces a clear warning, not a silent no-op
- **Verifies:** AC5
- **Precondition:** Fixture story with `domain: [web-uis]` (typo, not a real `index.yml` key)
- **Action:** Run the Standards injection step
- **Expected result:** DoR artefact records a warning naming `web-uis` as unmatched, distinct from the "no domain field" message
- **Edge case:** Yes

### U9 — unmatched domain among otherwise-valid domains still injects the valid ones
- **Verifies:** AC5
- **Precondition:** Fixture story with `domain: [web-ui, web-uis]` (one valid, one typo'd)
- **Action:** Run the Standards injection step
- **Expected result:** `web-ui-patterns.md` is still injected; a warning names only `web-uis` as unmatched
- **Edge case:** Yes

### U10 — case-sensitivity / whitespace handling on domain values
- **Verifies:** AC5
- **Precondition:** Fixture story with `domain: [ Web-UI ]` (whitespace + case variant of a real key)
- **Action:** Run the Standards injection step
- **Expected result:** Either normalises and matches `web-ui` correctly, or treats it as unmatched with a clear warning — whichever the implementation chooses, it must not silently produce a different, undocumented third behaviour
- **Edge case:** Yes

---

## Integration Tests

### IT1 — end-to-end DoR run with a single real domain produces a usable instructions block
- **Verifies:** AC2
- **Components involved:** `/definition-of-ready` skill logic, `index.yml`, `web-ui-patterns.md`
- **Precondition:** A realistic fixture story (modelled on an actual past web-ui story, e.g. pr-s3) with `domain: [web-ui]`
- **Action:** Run the full DoR flow
- **Expected result:** The resulting DoR artefact's Coding Agent Instructions section includes the blended-aggregation rule text (confirming this session's own `/improve` addition is genuinely reachable)

### IT2 — end-to-end DoR run with multiple domains
- **Verifies:** AC3
- **Components involved:** Same as IT1, plus `security-standards.md`
- **Precondition:** Fixture story with `domain: [web-ui, security]`
- **Action:** Run the full DoR flow
- **Expected result:** Both files' content present in the instructions block, clearly attributed to their source file

---

## NFR Tests

### None — confirmed with story owner

No NFRs beyond the Audit requirement, which is covered by U4/U5/IT1/IT2 asserting the DoR artefact records which domain(s) matched and which file(s) were injected.

---

## Out of Scope for This Test Plan

- Testing whether a future `/definition` session actually follows the new prompt in practice — see Coverage gaps table above; handled as a manual follow-up check, not an automated test.
- Retroactive testing against all 184 historical stories — out of scope per the story's own Out of Scope section.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The domain-matching/injection logic in `/definition-of-ready` has never been exercised in this repo's history — a latent bug could exist that only surfaces once a real domain value is set | 0/184 stories have ever set `domain`, so this code path is unverified in practice despite existing since `index.yml` was written | IT1/IT2 specifically use realistic fixtures (modelled on a real past story) rather than only synthetic minimal ones, to maximise the chance of catching a latent bug now rather than in a future feature |
