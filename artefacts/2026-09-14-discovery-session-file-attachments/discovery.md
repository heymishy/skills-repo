# Discovery: Broader document/image attachment support for skill sessions

**Status:** Approved
**Date:** 2026-09-14
**Track:** Standard (this needs discovery → benefit-metric → definition, not short-track — see Complexity Rating)

---

## 1. Problem Statement

Operators working through a skill session (`/discovery`, `/ideate`, etc.) in the live web app have exactly one way to bring outside material into a session: the `sdg.1` "Ground this feature in strategy" upload modal (`journey.js`'s `handleGetReferenceModal`), which accepts only `.md` files, up to 1MB each, UTF-8 text, and only as a one-time gate shown before `/ideate`/`/discovery` starts. There is no way to attach an image (a screenshot, a whiteboard photo, a diagram), a PDF (an existing spec, a vendor doc), or any other document format, and no way to add a reference file mid-conversation once a session is already underway. An operator found this gap first-hand on 2026-09-14 while working through a real "Multi-User Role Sessions" discovery session — they had supporting material they wanted the assistant to see and had no way to provide it.

## 2. Who It Affects

- **Primary:** heymishy, the sole operator of this repo's skills platform today, whenever they have non-markdown reference material (screenshots, PDFs, diagrams) relevant to a feature they're scoping.
- **Secondary:** any future multi-tenant operator of this platform (the app already has real tenant-scoped sessions and a cross-tenant isolation gate) — this gap applies identically to them.

## 3. Why Now

Directly surfaced this session while auditing real production usage friction (alongside two related, now-fixed findings: `fsdn-s1`'s feature-slug bug and `lasr-s1`'s LLM-agent reliability fix, both merged/PR'd 2026-09-14). This is the third and largest of that same investigation — deliberately NOT bundled into a short-track fix because, unlike the other two, it carries real open architecture questions rather than a single well-understood root cause.

## 4. MVP Scope

**Resolved via /clarify (2026-10-04)** — narrowed and confirmed:

1. Extend the existing `sdg.1` upload modal to accept a small additional set of formats (e.g. `.pdf`, `.png`, `.jpg`) alongside `.md`, still as a one-time pre-session gate. The operator also types a short text description of each non-`.md` file at upload time — the model sees the description (injected into context the same way `.md` reference content is today), not automated OCR/extraction output.
2. Uploaded binary files are stored outside git, in a non-git-tracked `workspace/attachments/`-style directory — not the git-backed artefact folder.
3. Each upload is capped at a per-file size limit and verified by real file-type sniffing (magic bytes), not just the extension.
4. Separately, allow adding a reference file mid-conversation (not just before the first turn) — this is a materially different UI/UX surface (the existing modal is a one-time gate, not an in-chat affordance) and may warrant being split into its own follow-on story rather than bundled with (1)-(3). The exact split is `/definition`'s job.

Full automated OCR/text-extraction remains a real, named future enhancement (see Out of Scope) — deferred, not rejected.

## 5. Out of Scope

- Deciding the exact MVP file-type list or the mid-conversation (not just pre-session) upload UX now — that is `/definition`'s job once benefit and constraints are clear.
- Any change to the existing `.md`-only, pre-session-gate behavior in this discovery document itself — no code changes are made by this artefact.
- Video, audio, or any format requiring more than text-extraction/OCR-class processing.
- **Automated OCR/text-extraction from images or PDFs** — resolved via `/clarify` (2026-10-04) to a narrower MVP (storage + operator-typed description); real extraction remains a named future enhancement once this smaller slice proves valuable.

## 6. Assumptions and Risks

~~[ASSUMPTION] Non-text formats will need a conversion/extraction step...~~ **Resolved via /clarify (2026-10-04):** No — MVP is narrowed to storage + a manual operator description, not automated OCR/text-extraction. The operator uploads the file and types a short description; the model sees the description, not extracted content. Full OCR/extraction deferred to a later follow-on if real usage shows it's needed.
~~[ASSUMPTION] Storing uploaded binary files may need a different storage decision...~~ **Resolved via /clarify (2026-10-04):** Confirmed — uploaded files live outside git, in a new non-git-tracked `workspace/attachments/`-style directory, matching this repo's existing `workspace/` convention for operational (non-artefact) files. Not the git-backed artefact folder.
~~[ASSUMPTION] Accepting arbitrary uploaded files may need basic content-safety handling...~~ **Resolved via /clarify (2026-10-04):** Confirmed — MVP requires a per-file size cap plus real file-type sniffing (magic-byte verification, not just trusting the extension), matching this app's existing security posture (e.g. the skill-name allowlist pattern in `web-ui-patterns.md`). No malware scanning in MVP.
- **Risk:** if the underlying LLM/model call already has real per-call latency and reliability sensitivity (see `lasr-s1`, this same day), adding a new parsing/extraction step (e.g. an OCR call) introduces a new potential failure and latency point that needs its own reliability consideration, not just a feature-complete one.

## 7. Directional Success Indicators

- **Indicator:** an operator can attach a screenshot or PDF to a `/discovery` session and have its content meaningfully inform the session's output (measured qualitatively at first — this is a solo-operator repo without usage-volume metrics yet, per this session's own `2026-09-13-analytics-observability-gaps` discovery finding that revenue/usage instrumentation is itself a known, separate gap).
- **[UNKNOWN BASELINE]** — no current measurement exists for how often the operator is blocked by this gap; the MVP Scope decision at `/definition` should include how this will be tracked going forward (this discovery deliberately does not invent a fabricated baseline number).

## 8. Constraints

- Whatever storage/parsing approach is chosen must not conflict with `lasr-s1`'s newly-fixed LLM-call reliability posture (this session, same day) — any new call added to the discovery-session request path (e.g. an OCR/extraction call) should be evaluated against the same Fly suspend/resume risk class that `lasr-s1` just closed for the core LLM call.
- Must respect this app's existing multi-tenant isolation posture (`bri-s3.4`'s Cross-Tenant Isolation Repeat Gate) — any new shared resource (e.g. a shared upload-processing queue or cache) introduced by this feature needs the same tenant-scoping discipline already applied elsewhere.

## 8a. Clarify Recommendation

Per this document's own Assumptions and Risks section, 3 `[ASSUMPTION]` items are recorded above and have not yet been confirmed. Recommend running `/clarify` against this discovery document before proceeding to `/benefit-metric`, specifically on:
1. Whether a conversion/extraction pipeline (OCR/PDF-text-extraction) is genuinely required for the MVP, or whether a narrower first cut (e.g. PDF/image storage + manual operator description, no automated extraction) would satisfy the immediate need at far lower complexity.
2. Whether uploaded binary reference files should live in the git-backed artefact folder (today's `.md` pattern) or in a separate, non-git storage location given size/history-bloat concerns.
3. What minimum content-safety handling (size caps, type sniffing) is acceptable for a first cut versus what can be deferred.

## Contributors

- heymishy — Operator
- Claude (agent) — investigation, root-cause correlation with `fsdn-s1`/`lasr-s1`, discovery drafting

## Reviewers

(none yet)

## Approved By

Hamish King — Operator — 2026-10-04

## Clarification log

[2026-10-04] Clarified via /clarify:
- Q: Is automated OCR/text-extraction needed for MVP, or would storage + a manual operator description suffice?  A: Narrower MVP — storage + operator-typed description. Full OCR/extraction deferred.
- Q: Where should uploaded binary files live?  A: Outside git, in a non-git-tracked `workspace/attachments/`-style directory, not the git-backed artefact folder.
- Q: What minimum content-safety handling is needed for MVP?  A: Per-file size cap + real file-type sniffing (magic bytes), matching this app's existing security posture. No malware scanning in MVP.
