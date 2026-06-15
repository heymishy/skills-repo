# Benefit Metric: ideate-web-ux-inc3

**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## M1 — Session turn efficiency (inc3)

**Metric:** Ratio of substantive-content turns to clarifying-question turns in a /ideate session.

**Current state:** ~1:1 (observed in live session — model asked a question on nearly every turn).

**Target:** ≤1 clarifying question per lens step (across a full Lens A session of ~5 steps, ≤5 questions total regardless of session length).

**Measurement:** Human judgement in live verification session. Count turns containing a question mark directed at the user vs turns producing substantive lens output.

**Minimum:** Noticeable reduction from baseline — facilitator does not feel interrogated.

---

## M2 — Canvas block render fidelity (inc4)

**Metric:** Proportion of `canvasBlock` SSE events that render correctly in the canvas panel (no parse errors, correct block type, content matches model output).

**Target:** 100% render fidelity in test suite; ≥95% across a live session (some blocks may be partially formed).

**Measurement:** Automated — `canvasBlock` event count vs rendered block count in test suite.

---

## MM1 — CDG T3M1 signal

Feature-level: first gate-confirm via web UI journey for this feature contributes to T3M1 close (first chain-hash trace entry). See CDG feature DoD.
