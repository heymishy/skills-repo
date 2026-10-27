# ppc-s7 — Record an in-app sign-off decision on captured evidence — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Let a tenant Product Owner record an Approve/Needs-changes decision directly on the capture-evidence page, tied to their identity, a timestamp, and the exact AC coverage snapshot they saw — closing the gap `benefit-metric.md`'s Metric 2 already claimed to measure but never actually recorded.
**Branch:** `feature/ppc-s7`
**Worktree:** `.worktrees/ppc-s7`
**Test command:** `node scripts/run-all-tests.js` (full suite); existing coverage this story must not regress: `tests/check-ppc-s1-ui-layer.js`, `tests/check-ppc-s1-playback-evidence-route.js`, `tests/check-ppc-s6-dashboard-shell-parity.js`

---

## File map

```
Modify:
  src/web-ui/routes/playback-evidence.js  — new _renderSignOffHtml render function;
                                              new handlePostSignOff handler; wire
                                              sign-off area into handleGetPlaybackEvidence's
                                              bodyContent, near the existing coverage line
  src/web-ui/adapters/journey-store-pg.js — add `signOff` to _sanitise()'s allowlist (fdn-s1)
  src/web-ui/server.js                    — register POST /products/:id/playback-evidence/:slug/sign-off

Create:
  tests/check-ppc-s7-sign-off-recording.js — AC1-AC6 coverage
```

**Reused, unmodified:** `req.session.login || req.session.userId` identity pattern (`admin-credits.js`'s own `adminId` precedent); `_resolveJourney` (already scopes by `tenant_id`+`product_id`, satisfies AC5 with no new access-control code); `_csrf.csrfGuard`/`_csrf.csrfField` (`handlePostCaptureTarget`'s own precedent); `_escapeHtml`; `_journeyStore.setJourneyFields` (`ppc-s1`'s `setCaptureTarget`/`ppc-s2`'s `captureAllDuration` precedent for writing to `journeys.data`).

---

## Task 1: Render the sign-off area — no prior decision (AC1, AC6)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s7-sign-off-recording.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('T1 (AC1): no prior decision -- shows Approve (primary) and Needs changes (destructive) buttons plus a comment field', function() {
  var html = pe._renderSignOffHtml(/* journey with no signOff */ { signOff: null }, /* csrfToken */ 'tok', /* coverageSnapshot */ '0 of 1');
  assert.ok(html.indexOf('Approve') !== -1);
  assert.ok(html.indexOf('Needs changes') !== -1);
  assert.ok(/class="[^"]*btn-primary[^"]*"/.test(html) || html.indexOf('sw-btn-primary') !== -1);
  assert.ok(/class="[^"]*btn-destructive[^"]*"/.test(html) || html.indexOf('sw-btn-destructive') !== -1);
  assert.ok(html.indexOf('<textarea') !== -1 || html.indexOf('<input') !== -1);
});
test('T3 (AC6): empty state reads "No decision recorded yet", distinct from Approved badge markup', function() {
  var html = pe._renderSignOffHtml({ signOff: null }, 'tok', '0 of 1');
  assert.ok(html.indexOf('No decision recorded yet') !== -1);
  assert.ok(html.indexOf('sw-badge--success') === -1);
});
```

- [ ] **Step 2: Implement**
  - New pure function `_renderSignOffHtml(journey, csrfToken, currentCoverageSnapshot)` in `playback-evidence.js`, placed near `_renderSummaryHtml`/`_coverageSummaryHtmlForAcs`.
  - No-decision branch: "No decision recorded yet" text, two plain `<form method="POST" action=".../sign-off">` submissions (one per button, `status` hidden input or two distinct submit buttons named `status`), `_csrf.csrfField(csrfToken)` in each, an optional `<textarea name="comment">`.
  - Button classes follow `DESIGN.md`'s existing primary/destructive variant classes (grep `html-shell.js`'s shared CSS for the real class names before inventing new ones — reuse, don't invent).
  - Leave the existing-decision branch as a TODO for Task 3; this task only needs the `!journey.signOff` path correct.

- [ ] **Step 3: Verify tests pass (T1, T3)**

- [ ] **Step 4: Commit** — `feat(ppc-s7): render sign-off area for a feature with no recorded decision (AC1, AC6)`

---

## Task 2: Handle the sign-off submission (AC2, AC5)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`, `src/web-ui/adapters/journey-store-pg.js`, `src/web-ui/server.js`
- Test: `tests/check-ppc-s7-sign-off-recording.js`

- [ ] **Step 1: Write the failing tests**

```javascript
test('T4 (AC2): writes signOff to journeys.data with resolved identity and ISO timestamp', async function() {
  var req = makeReq(tenantId, productId, featureSlug, { session: { login: 'alice' }, body: { status: 'approved', comment: 'looks good' } });
  await pe.handlePostSignOff(req, res, null, pool);
  var journey = store.getJourneyByTenantProductSlug(tenantId, productId, featureSlug);
  assert.strictEqual(journey.data.signOff.status, 'approved');
  assert.strictEqual(journey.data.signOff.by, 'alice');
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(journey.data.signOff.at));
});
test('T5 (AC2 regression guard): identity resolves via login||userId, never accessToken', async function() {
  var req = makeReq(..., { session: { userId: 'u-1', accessToken: 'decoy-token' }, body: { status: 'approved' } });
  await pe.handlePostSignOff(req, res, null, pool);
  assert.strictEqual(journey.data.signOff.by, 'u-1');
  var src = fs.readFileSync('src/web-ui/routes/playback-evidence.js', 'utf8');
  var signOffFnSrc = src.slice(src.indexOf('async function handlePostSignOff'), src.indexOf('async function handlePostSignOff') + 2000);
  assert.ok(signOffFnSrc.indexOf('accessToken') === -1);
});
test('T6 (AC2): coverageSnapshot reflects AC coverage at moment of decision', async function() {
  // fixture: 5 of 7 ACs have a screenshot/video
  await pe.handlePostSignOff(req, res, null, pool);
  assert.strictEqual(journey.data.signOff.coverageSnapshot, '5 of 7');
});
test('T11 (AC5): cross-tenant sign-off request is denied, no write occurs', async function() {
  var req = makeReq(tenantB, productIdOfTenantA, featureSlug, {...});
  await pe.handlePostSignOff(req, res, null, pool);
  assert.strictEqual(res._status, 404);
  // tenant A's journey unchanged
});
test('T12 (NFR): exactly one additional journey-store write per submission', async function() { /* call-count spy on setJourneyFields */ });
```

- [ ] **Step 2: Implement**
  - New `handlePostSignOff(req, res, _next, pool)`: `_csrf.csrfGuard` first (cheap-reject precedent from `handlePostCaptureTarget`), then `_resolveJourney(req, pool)` — this alone satisfies AC5, no new access-control code.
  - Validate `body.status` is `'approved'` or `'needs-changes'`; 400 otherwise.
  - Identity: `var by = String((req.session && (req.session.login || req.session.userId)) || 'unknown');` — exact `admin-credits.js` pattern, never `req.session.accessToken`.
  - Coverage snapshot: reuse `computeAcCoverageSummary`'s underlying counts (already computed earlier in `handleGetPlaybackEvidence` for the coverage line — compute the same way here from a fresh `_getDodAcList` call) to produce the "N of M" string.
  - Write: `_journeyStore.setJourneyFields(journey.journeyId, { signOff: { status, by, at: new Date().toISOString(), comment: _escapeComment(body.comment), coverageSnapshot } });` — store the raw comment; escaping happens at render time (Task 3), not at write time, so the stored data stays the source of truth.
  - `journey-store-pg.js`: add `signOff: journey.signOff || null,` to `_sanitise()`'s allowlist (fdn-s1 rule) — one line, same pattern as every prior `ppc-s*` addition in that file.
  - `server.js`: register `POST /products/:productId/playback-evidence/:featureSlug/sign-off` immediately after the existing `capture-all` route, same `req.params` + `authGuard` + `_pshPool` pattern as every sibling route.
  - Redirect-on-form-submission vs JSON-on-API-call: reuse `_isFormSubmission(req)` exactly as `handlePostCaptureTarget` does.

- [ ] **Step 3: Verify tests pass (T4, T5, T6, T11, T12)**

- [ ] **Step 4: Commit** — `feat(ppc-s7): handle sign-off submission, write to journeys.data.signOff (AC2, AC5)`

---

## Task 3: Render an existing (and possibly stale) decision (AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s7-sign-off-recording.js`

- [ ] **Step 1: Write the failing tests**

```javascript
test('T2 (AC3, XSS): escapes <script> and double-quote in the stored comment on render', function() {
  var journey = { signOff: { status: 'approved', by: 'alice', at: '2026-10-27T00:00:00.000Z', comment: '<script>alert(1)</script>"', coverageSnapshot: '7 of 7' } };
  var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
  assert.ok(html.indexOf('<script>alert') === -1);
  assert.ok(html.indexOf('&lt;script&gt;') !== -1);
});
test('T7 (AC3): existing decision renders a status badge plus escaped who/when/comment/coverage', function() {
  var html = pe._renderSignOffHtml(journey, 'tok', '7 of 7');
  assert.ok(html.indexOf('alice') !== -1);
  assert.ok(html.indexOf('sw-badge--success') !== -1 || html.indexOf('Approved') !== -1);
});
test('T8 (AC4): stale decision (recorded at 5 of 7, now 7 of 7) stays visible, explicitly labelled with the ORIGINAL snapshot', function() {
  var html = pe._renderSignOffHtml({ signOff: { status: 'approved', coverageSnapshot: '5 of 7', ... } }, 'tok', /* currentCoverageSnapshot */ '7 of 7');
  assert.ok(html.indexOf('5 of 7') !== -1);
});
test('T9 (AC4, negative): never renders a bare "Approved" with no coverage qualifier when snapshots differ', function() {
  assert.ok(!/Approved(?!\s+against)/.test(html.replace(/<[^>]+>/g, ' ')));
});
```

- [ ] **Step 2: Implement**
  - Extend `_renderSignOffHtml(journey, csrfToken, currentCoverageSnapshot)`: branch on `journey.signOff` presence.
  - Existing-decision branch: status badge (`--success`/`--danger` token classes per `DESIGN.md`'s badge convention), then `escHtml()`-wrapped `by`/`at`/`comment`, then the coverage line — always phrased as "`<Approved|Needs changes>` against `<signOff.coverageSnapshot>` ACs", using the *recorded* snapshot, not the live one. Compare `signOff.coverageSnapshot !== currentCoverageSnapshot` only to decide whether to additionally flag it as stale (e.g. a small "(new evidence captured since this decision)" note) — AC4 requires the original snapshot always shown, staleness flagging is additive, not a replacement.
  - Wire into `handleGetPlaybackEvidence`: `bodyContent = summaryHtml + coverageSummaryHtml + signOffHtml + _renderPlaybackEvidenceHtml(...)` — "near the existing coverage line" per AC3's own wording, computed from the same `acs`/coverage data already in scope at that point in the handler (no second fetch).

- [ ] **Step 3: Verify tests pass (T2, T7, T8, T9)**

- [ ] **Step 4: Commit** — `feat(ppc-s7): render recorded sign-off decision, stale-snapshot labelling (AC3, AC4)`

---

## Task 4: NFR tests, design-token check, full suite

**Files:**
- Test: `tests/check-ppc-s7-sign-off-recording.js`

- [ ] **Step 1: Write the remaining NFR test**

```javascript
test('T13 (NFR-Accessibility): sign-off markup emits only form/button/textarea, no inline JS event handlers', function() {
  var html = pe._renderSignOffHtml({ signOff: null }, 'tok', '0 of 1');
  assert.ok(!/on(click|submit|change)=/.test(html));
});
```

- [ ] **Step 2: Run `node scripts/check-design-tokens.js src/web-ui/routes/playback-evidence.js --design-md artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`** (H-DESIGN self-check, `hasDesignSystemTrack: true`) — fix any non-token color before proceeding.

- [ ] **Step 3: Run full suite** (`node scripts/run-all-tests.js`) — confirm 0 new failures against the recorded baseline (4 pre-existing, unrelated: `ic-s1`/`ic-s3`/`ic-s4` canvas tests, `pcr-s1` test runner).

- [ ] **Step 4: Commit** — `test(ppc-s7): NFR coverage + design-token check (AC1-AC6 complete)`
