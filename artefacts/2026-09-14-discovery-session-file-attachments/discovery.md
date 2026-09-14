# Discovery: Broader document/image attachment support for skill sessions

**Status:** Draft — awaiting approval
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

Not yet defined — this is exactly what `/benefit-metric` and `/definition` need to resolve once this discovery is approved. Candidate shape, for the next stage to evaluate rather than treat as decided:

1. Extend the existing `sdg.1` upload modal to accept a small additional set of formats (e.g. `.pdf`, `.png`, `.jpg`) alongside `.md`, still as a one-time pre-session gate.
2. Separately, allow adding a reference file mid-conversation (not just before the first turn) — this is a materially different UI/UX surface (the existing modal is a one-time gate, not an in-chat affordance) and may warrant being split into its own follow-on story rather than bundled with (1).

## 5. Out of Scope

- Deciding the MVP file-type list, storage backend, or parsing pipeline now — that is `/definition`'s job once benefit and constraints are clear.
- Any change to the existing `.md`-only, pre-session-gate behavior in this discovery document itself — no code changes are made by this artefact.
- Video, audio, or any format requiring more than text-extraction/OCR-class processing.

## 6. Assumptions and Risks

- **[ASSUMPTION]** Non-text formats (images, PDFs) will need a conversion/extraction step (OCR for images, text extraction for PDFs) before the content can be injected into an LLM prompt the same way `.md` files are today — this is a real new processing pipeline, not just a wider `accept=` attribute on the existing upload input.
- **[ASSUMPTION]** Storing uploaded binary files (as opposed to today's plain-text `.md` reference files) may need a different storage decision than the current mechanism (which appears to write reference files directly into the repo checkout) — binary assets in a git-backed artefact folder have different size/history-bloat implications than small markdown files.
- **[ASSUMPTION]** Accepting arbitrary uploaded files (especially images/PDFs from an operator's own machine) may need basic content-safety handling (file-type sniffing beyond the extension, a size cap per file and per session, possibly malware scanning) that the current `.md`-only path does not need at all, since it already restricts to UTF-8 text.
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

Pending
