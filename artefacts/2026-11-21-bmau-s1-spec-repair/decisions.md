# Decisions: bulk-assign E2E spec repair (bmrp-s1)

## D1. Repair the spec by opening the group, not by changing the product (2026-11-21)

**Context:** `bmau-s1-bulk-assign-rerender.spec.js` fails at its first checkbox because product-view groups start collapsed (pdt-s1) and the spec never opens one; since ctab-s1 the collapsed body is `visibility: hidden`, so the checkbox is correctly not clickable.
**Decision:** the spec clicks the Unclassified header, waits for `aria-expanded="true"`, and then proceeds unchanged. Its stale "KNOWN GAP" header is replaced because module creation works in the harness (measured: the spec reaches the checkbox after creating the module with a 201).
**Rationale:** a user also has to open a group before ticking a box in it, so the spec now follows the real flow; the collapse and the `visibility` rule are intended behaviour (ctab-s1). Same repair as `frsr-s1` in esh-s1.
**Alternatives rejected:** `check({ force: true })` or dispatching the click on a hidden element (would hide a real accessibility regression); starting groups expanded (reverses pdt-s1); removing the spec (loses the only coverage of the bulk-assign re-render).
**Operator go-ahead (2026-11-21, "Start on spec work"):** start on the remaining spec failures; this one first because its cause was already known.
