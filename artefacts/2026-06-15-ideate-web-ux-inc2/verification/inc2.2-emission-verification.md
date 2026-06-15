# inc2.2 Emission Verification

**Story:** inc2.2
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Verification date:** 2026-06-15
**Conducted by:** Hamish King
**Session topic:** 2x2 impact/effort workshop grid web app

---

## Session summary

Live /ideate session run in web UI — 10+ turns covering full Lens A (opportunity mapping). The session explored:
- Facilitator write-up burden (1–2 hrs post-session)
- Teams transcript upload + timestamp correlation as debate capture mechanism
- Three opportunity clusters: facilitation burden, participant voice, downstream context quality
- Dual output surfaces: visual (participant) + markdown (outer loop)

## AC6 verification result: PASS

### Condition markers emitted

The model spontaneously emitted `---CONDITION-JSON---` markers at appropriate points in Lens A without prompting. Two condition cards appeared in the **Conditions panel**:

| id | type | text |
|----|------|------|
| `transcript-timestamp-correlation` | constraint | "Grid interaction events must be timestamped in a format that can be correlated with Teams transcript timestamps for the context linkage feature to work." |
| `markdown-outer-loop-structure` | outcome | "The markdown export must follow a structure the outer loop pipeline can parse — item name, axis position, contributor, and rationale excerpt as minimum fields per item." |

Both cards rendered in the Conditions panel (above Assumptions panel) with correct type-tag colour coding (constraint = red, outcome = green).

### Emission point

Markers were emitted at the end of the full opportunity map (Cluster 3 synthesis), which is appropriate — the model identified concrete constraints after sufficient context was established.

## Issues observed

1. **Markers visible in chat stream (fixed separately):** The raw `---ASSUMPTION-JSON---` and `---CONDITION-JSON---` marker text appeared in the assistant chat bubble alongside the cards. Fix: strip markers from `chunk` display events in `handlePostTurnStreamHtml`. Implemented in the same session.

2. **Too many clarifying questions:** The skill asked a high number of sequential questions across Lens A. Not a blocking issue for this story but a future UX improvement.

3. **Chat streaming UX:** Streaming text to a chat bubble for a structured lens output is suboptimal — the opportunity map and clusters would benefit from a visual canvas rendering rather than inline text. Flagged for Cluster 5 / future increment planning.

## Conclusion

AC6 is satisfied. `---CONDITION-JSON---` markers are emitted by the model at appropriate points during ideation. The conditions panel populates correctly. Emission quality is appropriate (2 genuine constraints/outcomes identified in a 10+ turn session on a well-scoped topic).

inc2.2 is eligible for definition-of-done.
