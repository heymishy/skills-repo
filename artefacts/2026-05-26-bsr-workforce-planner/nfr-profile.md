# NFR Profile — BSR Workforce Planner

**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## Data Classification

**Classification:** Internal / Private
**Rationale:** `workforce/roster.json` contains real person names, roles, teams, start/end dates, and skills. This data is personal information in the context of employment. The data is stored only in the private repo. No data is transmitted externally. All dashboard reads are local file reads within the same repo directory. No external API calls are made.

---

## Compliance NFRs

None — no regulatory clauses apply to this internal workforce planning tool (not processing financial data, health data, or data subject to specific regulatory obligations such as GDPR enforcement in this context). This is confirmed by the discovery artefact.

---

## NFR Inventory

| Story | NFR category | Statement | Testable? | Test type |
|-------|-------------|-----------|-----------|-----------|
| wfp.1 | Performance | Ingest 200-row xlsx in <10s on developer laptop | ✅ | Unit (timing) |
| wfp.1 | Security | No PII in stdout beyond counts | ✅ | Unit (stdout capture) |
| wfp.1 | Integrity | Failed write removed; no truncated JSON left | ✅ | Unit (mocked write failure) |
| wfp.2 | Integrity | Atomic write (temp file + rename) | ✅ | Unit (fs call inspection) |
| wfp.2 | Security | No PII in stdout beyond confirmation message | ✅ | Unit (stdout capture) |
| wfp.3 | Performance | `workforce-map` completes for 200 people / 20 initiatives in <15s | ✅ | Unit (timing) |
| wfp.3 | Security | No PII in stdout beyond names already in allocation input; `initiative-map.json` in private repo is accepted posture | ✅ | Unit (stdout capture) |
| wfp.3 | Integrity | Non-zero exit if `initiative-map.json` write fails; no partial file left | ✅ | Unit (mocked fs error) |
| wfp.4 | Performance | Profile-match + net-new run within overall <15s for 200 people / 20 initiatives | ✅ | Unit (timing) |
| wfp.4 | Security | No PII beyond person names (already in allocation input) in stdout | ✅ | Unit (stdout capture) |
| wfp.5 | Performance | Roster view renders 500 records with no visible lag (modern browser) | ✅ | E2E (Playwright render timing) |
| wfp.5 | Accessibility | Filter controls and search field have visible labels; table headers are `<th>`; min contrast ratio 4.5:1 | Partial — contrast is manual (Untestable-by-nature) | Unit (class/structure) + Manual |
| wfp.5 | Security | No network calls to external origins | ✅ | Unit (static analysis of fetch calls) |
| wfp.6 | Performance | Allocation matrix renders 50 initiative rows without visible lag | ✅ | E2E (Playwright render timing) |
| wfp.6 | Accessibility | `<th>` headers; colour indicators supplemented with text labels | ✅ | Unit (structure check) |
| wfp.6 | Security | No network calls to external origins | ✅ | Unit (static analysis) |
| wfp.7 | Performance | Both views render <2s for 50 initiatives | ✅ | E2E (Playwright render timing) |
| wfp.7 | Accessibility | Gap badges and leadership gap indicators use colour + text label; `<th>` headers | ✅ | Unit (structure check) |
| wfp.7 | Security | No network calls to external origins | ✅ | Unit (static analysis) |
| wfp.9 | Performance | File import processes 500-row xlsx in <10s; auto-derive across 30 portfolio slugs and 200-person roster completes in <15s | ✅ | Unit (timing — large fixture only; skip in normal CI) |
| wfp.9 | Security | No PII written to stdout or logs beyond names already present in input file or roster | ✅ | Unit (stdout capture) |
| wfp.9 | Integrity | All three modes use atomic file write (temp file + rename); interrupted write does not corrupt existing allocation-input.json | ✅ | Unit (temp-rename verification) |
| wfp.9 | Usability | Guided mode prompts display initiative slug, claimed FTE, and product group before each question; operator never asked to recall context from memory | Partial | Unit (prompt string content) + Manual |
| wfp.10 | Performance | Tag scoring runs within the wfp.9 auto-derive budget (under 15s total for 30 slugs and 200-person roster) | ✅ | Unit (timing — covered by wfp.9 budget) |
| wfp.10 | Correctness | Coverage score formula: coveredTags.length / requiredTags.length where coveredTags = intersection(requiredTags, union of all squad member skills arrays); score = 0.0 when requiredTags non-empty and no squad member has any matching skill | ✅ | Unit (arithmetic verification) |
| wfp.10 | Observability | Every tag-scored entry includes _matchScore (0.0–1.0); net-new entries below threshold include _suggestedSquad; product-group fallback entries carry neither field | ✅ | Unit (field presence checks) |

---

## Untestable-by-nature gaps

| Gap | Story | Risk level | Mitigation |
|-----|-------|-----------|-----------|
| Minimum contrast ratio 4.5:1 for roster view text | wfp.5 | 🟡 Low — internal tool used by Head of Engineering; not public-facing | Manual visual check in wfp.5-verification.md Scenario 9 |

---

## Human sign-off requirement

No compliance NFR with a named regulatory clause exists — H-NFR2 passes for all stories.
