## Decisions — dssc-s1: fix missing CSRF token on dashboard "Run a skill" start forms

### GAP — H-GOV, short-track has no discovery artefact (2026-10-24)

Same recurring short-track gap as `pcr-s1` / `p35tf-s1` / `cptr-s1` / `jgcc-s1` / `csdl-s1`. No discovery artefact exists — short-track skips `/discovery` by design. This is the 6th occurrence of this exact gap; the standing revisit trigger (a `/definition-of-ready` SKILL.md revision adding an explicit short-track branch to H-GOV) remains overdue and is reaffirmed here rather than raised again as a 7th ad-hoc note.

### ARCH — Root cause confirmed via real `fly logs`, refuting the prior stale-session-cache hypothesis (2026-10-24)

**Context:** While live-verifying `css-s1`'s merged journey-sync mechanism against real staging infrastructure, clicking "Start →" on the dashboard's Discovery skill card produced a consistent, 100%-reproducible `403 Forbidden` (3/3 attempts, fresh page loads each time).

**Decision:** Root-caused directly via `flyctl logs` (now authenticated and working in this session, unlike `csdl-s1`'s own investigation) rather than guessing. The diagnostic logging `csdl-s1` added specifically for this class of bug showed: `csrf_token_generate` and `csrf_guard_check` both on the SAME machine ID, SAME session ID, with `expectedPrefix` correctly matching the generated token — but `submittedPrefix: "(empty)"` on every attempt. This definitively refutes any cross-machine stale-session-cache theory (the leading, unconfirmed hypothesis `csdl-s1` was investigating for a *different* form, the in-chat gate-confirm button) for THIS form. The actual cause is structural and simple: `src/web-ui/views/dashboard-view.js`'s `renderDashboard()` never embeds a `_csrf` hidden field in any skill-start `<form>`, and neither `dashboard.js`'s `handleDashboard` nor `products.js`'s `handleGetDashboard` ever generates or passes a token into it.

**Rationale:** This is a genuinely different, previously-undiscovered bug from the one `jgcc-s1` already fixed (the in-chat gate-confirm form) and the one `csdl-s1` was investigating (same gate-confirm form, a since-still-unresolved residual mismatch). It affects the dashboard's own entry point — the very first click a user makes — which is a more severe/visible defect than either prior one. Confirmed via code reading that `jgcc-s1`'s own fix was scoped only to the gate-confirm form, never touched `dashboard-view.js`.

**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct `fly logs` evidence during live verification, 2026-10-24)
**Revisit trigger:** None — root cause is fully confirmed by direct evidence, not a hypothesis requiring later validation.

### SCOPE — Fix both `handleDashboard` and `handleGetDashboard` call sites, not just the one observed failing (2026-10-24)

**Decision:** Although the reproduced failure was observed via `products.js`'s `handleGetDashboard` (the path serving `/dashboard` whenever `DATABASE_URL` is set, which is true on both staging and production), this story fixes BOTH call sites of the shared `renderDashboard()` view — `dashboard.js`'s `handleDashboard` is fixed too, even though it was not directly observed failing in this session.

**Alternatives considered:** Fix only `handleGetDashboard`, since that's the confirmed-broken path on real deployed environments.

**Rationale:** `handleDashboard` has the exact same code-level gap (confirmed by reading it directly — `renderDashboard({...})` called with no `csrfToken` field, same as `handleGetDashboard`). It is only not currently exercised on staging/production because `DATABASE_URL` happens to be set there, but it remains the fallback path for any environment where it is not (e.g. certain local/dev configurations) and is exercised directly by existing tests (`check-dsa-s2-dashboard-wiring.js`). Leaving it unfixed would be knowingly shipping the identical bug into any environment that takes that branch — not a reasonable scope boundary given the fix is a single additional line.

**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None.

### RISK-ACCEPT — W4, verification script not independently reviewed (2026-10-24)

**Decision:** Accept W4 (verification script reviewed by a domain expert) as unreviewed-by-a-second-person before dispatch, matching the same accepted pattern used for every other feature this session (solo-maintainer repo, no second domain expert available).

**Alternatives considered:** Blocking DoR sign-off until a second reviewer works through the verification script.

**Rationale:** Same established, repeatedly-accepted pattern as every prior feature in this session (`css-s1`, `ppc-s1`-`s3`, etc.) — Hamish King holds both the platform-maintainer and product-owner roles.

**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If a second team member with domain expertise joins this repo's delivery process, reinstate W4 as a real blocking review step.
