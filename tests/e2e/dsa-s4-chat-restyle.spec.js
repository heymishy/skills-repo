// dsa-s4-chat-restyle.spec.js — E2E coverage for dsa-s4 (restyle the
// skill-session chat page -- src/web-ui/views/chat-view.js +
// src/web-ui/routes/skills.js's live-chat handler -- to match DESIGN.md's
// design tokens).
// Story: artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
// Plan (Task 1): artefacts/2026-09-18-design-system-adoption/plans/dsa-s4-plan.md
//
// AC1/AC2: computed CSS custom-property values on the live skill-session
// chat page (/skills/:name/sessions/:id/chat) match DESIGN.md's token
// tables exactly, in both dark and light mode. Mirrors dsa-s1's/dsa-s2's/
// dsa-s3's own established token-verification pattern (same 13-token set,
// same `window.swToggleTheme()` toggle mechanism, same
// `getComputedStyle(document.documentElement)` read) -- re-confirmed by a
// fresh read of src/web-ui/utils/html-shell.js's `:root` / `[data-theme="dark"]`
// blocks at this story's own Task 1 time, not copied blindly.
//
// Session seeding reuses cams-s1-chat-artefact-responsive.spec.js's own
// createJourney() helper verbatim (duplicated here, not imported -- matching
// that file's own stated "no cross-file run-order coupling" convention):
// POST /api/journey creates a fresh journey + live chat session and returns
// its /skills/:name/sessions/:id/chat location, which is the real live chat
// page this story restyles.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

// ── Real light/dark token tables (src/web-ui/utils/html-shell.js) ─────────
// Re-confirmed by direct read of html-shell.js's :root (line ~434) and
// [data-theme="dark"] (line ~454) blocks at Task 1 time (2026-09-19).

const TOKEN_NAMES = [
  '--bg', '--surface', '--ink', '--ink-2', '--muted', '--muted-2', '--muted-3',
  '--accent', '--accent-soft', '--accent-ink', '--success', '--warn', '--danger'
];

const LIGHT_TOKENS = {
  '--bg':           '#FAFAFA',
  '--surface':      '#FFFFFF',
  '--ink':          '#14171A',
  '--ink-2':        '#3F454C',
  '--muted':        '#6B7280',
  '--muted-2':      '#52585F',
  '--muted-3':      '#3A3F45',
  '--accent':       '#2563EB',
  '--accent-soft':  '#EFF4FF',
  '--accent-ink':   '#1D4ED8',
  '--success':      '#15803D',
  '--warn':         '#B45309',
  '--danger':       '#B91C1C'
};

const DARK_TOKENS = {
  '--bg':           '#0B0D10',
  '--surface':      '#0E1013',
  '--ink':          '#F5F6F7',
  '--ink-2':        '#B4BAC2',
  '--muted':        '#9AA1AB',
  '--muted-2':      '#6B7280',
  '--muted-3':      '#454B54',
  '--accent':       '#3B82F6',
  '--accent-soft':  '#152238',
  '--accent-ink':   '#93C5FD',
  '--success':      '#34D399',
  '--warn':         '#F59E0B',
  '--danger':       '#F87171'
};

// ── Helpers ─────────────────────────────────────────────────────────────

async function readTokens(page) {
  return page.evaluate(function(names) {
    var s = getComputedStyle(document.documentElement);
    var out = {};
    names.forEach(function(n) { out[n] = s.getPropertyValue(n).trim(); });
    return out;
  }, TOKEN_NAMES);
}

// Same mechanism as dsa-s1's/dsa-s2's/dsa-s3's own specs: calls the exact
// global function the real .sw-theme-toggle button's onclick invokes
// (html-shell.js's SHELL_JS), so the toggle under test is byte-for-byte
// identical to a real click.
async function ensureTheme(page, theme) {
  for (var i = 0; i < 3; i++) {
    var current = await page.evaluate(function() {
      return document.documentElement.getAttribute('data-theme');
    });
    if (current === theme) return;
    await page.evaluate(function() { window.swToggleTheme(); });
  }
  var finalTheme = await page.evaluate(function() {
    return document.documentElement.getAttribute('data-theme');
  });
  if (finalTheme !== theme) {
    throw new Error('Could not set theme to ' + theme + ' via swToggleTheme(), got ' + finalTheme);
  }
}

/** Create a fresh journey with the given startSkill and return its live chat page location + journeyId. */
async function createJourney(page, featureName, startSkill) {
  const createCsrfToken = await getCsrfToken(page.request, '/journey', 'journey home page');
  const createRes = await page.request.post('/api/journey', {
    form: { featureName: featureName, startSkill: startSkill, _csrf: createCsrfToken },
    maxRedirects: 0
  });
  expect(createRes.status(), 'POST /api/journey').toBe(303);
  const location = createRes.headers()['location'];
  const chatHtml = await (await page.request.get(location)).text();
  const journeyIdMatch = chatHtml.match(/\/api\/journey\/([0-9a-f-]+)\/gate-confirm/);
  const journeyId = journeyIdMatch ? journeyIdMatch[1] : null;
  expect(journeyId, 'journeyId should be resolvable from the chat page').toBeTruthy();
  return { location, journeyId };
}

// ── AC1/AC2: token tables ──────────────────────────────────────────────

withAuth('dsa-s4 AC1: dark-mode chat page computed tokens match DESIGN.md', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Dark Token Chat', 'discovery');
  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });

  await ensureTheme(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(DARK_TOKENS);
});

withAuth('dsa-s4 AC2: light-mode chat page computed tokens match DESIGN.md', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Light Token Chat', 'discovery');
  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });

  await ensureTheme(page, 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const tokens = await readTokens(page);
  expect(tokens).toEqual(LIGHT_TOKENS);
});

// ── AC1/AC2 (chat-view.js style-rule battery) ──────────────────────────
//
// AC1/AC2's own root-level token table (above) can pass even when this
// story's real work -- hardcoded hex values buried inside chat-view.js's
// per-selector rule bodies (chips, badges, assumption cards, risk dots,
// etc.) -- is entirely unfixed: those custom properties are always defined
// correctly by html-shell.js regardless of what any single page's own
// <style> block does with them. This battery targets the actual page-level
// rules Task 1 edits: it injects marker elements matching each selector
// into the REAL, already-loaded live chat page (so the real, server-served
// <style> tag is what's under test, not a reconstruction of it), then reads
// getComputedStyle. A hardcoded hex is theme-invariant -- it produces the
// same computed value in dark and light mode -- while a real token diverges
// between the two. That divergence (or lack of it, pre-fix) is what makes
// this a meaningful RED before Task 1 and GREEN after.

const MARKER_HTML = [
  '<div id="dsa-s4-marker-root" style="position:absolute;top:-9999px;left:-9999px">',
  '<span class="chip-ok" id="m-chip-ok">x</span>',
  '<span class="chip-warn" id="m-chip-warn">x</span>',
  '<span class="ac-badge ac-badge-green" id="m-badge-green">x</span>',
  '<span class="ac-badge ac-badge-amber" id="m-badge-amber">x</span>',
  '<div class="assumption-card" data-state="confirmed" id="m-ac-confirmed"><span class="assumption-card-text" id="m-ac-confirmed-text">x</span></div>',
  '<div class="assumption-card" data-state="flagged" id="m-ac-flagged"><span class="assumption-card-text" id="m-ac-flagged-text">x</span></div>',
  '<span class="ac-type-tag ac-type-desirability" id="m-type-desirability">x</span>',
  '<span class="ac-type-tag ac-type-viability" id="m-type-viability">x</span>',
  '<span class="ac-type-tag ac-type-feasibility" id="m-type-feasibility">x</span>',
  '<span class="ac-type-tag ac-type-ethical" id="m-type-ethical">x</span>',
  '<span class="ac-risk-dot ac-risk-high" id="m-risk-high"></span>',
  '<span class="ac-risk-dot ac-risk-medium" id="m-risk-medium"></span>',
  '<span class="ac-risk-dot ac-risk-low" id="m-risk-low"></span>',
  '<span class="ci-type-tag ci-type-constraint" id="m-ci-constraint">x</span>',
  '<span class="ci-type-tag ci-type-dependency" id="m-ci-dependency">x</span>',
  '<span class="ci-type-tag ci-type-outcome" id="m-ci-outcome">x</span>',
  '<button class="btn-confirm btn-confirmed-state" id="m-btn-confirmed-state">x</button>',
  '<button class="btn-flag btn-flagged-state" id="m-btn-flagged-state">x</button>',
  '<div class="dm-cx dm-cx--l" id="m-dm-l">x</div>',
  '<div class="dm-cx dm-cx--m" id="m-dm-m">x</div>',
  '<div class="dm-cx dm-cx--h" id="m-dm-h">x</div>',
  '<div class="sw-chat-insight" id="m-insight">x</div>',
  '<div class="sw-chat-confirm" id="m-confirm">x</div>',
  '<div class="cv-diagram-error-box" id="m-diagram-error">x</div>',
  '</div>'
].join('');

async function injectMarkers(page) {
  await page.evaluate(function(html) {
    document.body.insertAdjacentHTML('beforeend', html);
  }, MARKER_HTML);
}

async function readMarkerStyles(page) {
  return page.evaluate(function() {
    function styleOf(id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor };
    }
    return {
      chipOk:            styleOf('m-chip-ok'),
      chipWarn:          styleOf('m-chip-warn'),
      badgeGreen:        styleOf('m-badge-green'),
      badgeAmber:        styleOf('m-badge-amber'),
      acConfirmed:       styleOf('m-ac-confirmed'),
      acConfirmedText:   styleOf('m-ac-confirmed-text'),
      acFlagged:         styleOf('m-ac-flagged'),
      acFlaggedText:     styleOf('m-ac-flagged-text'),
      typeDesirability:  styleOf('m-type-desirability'),
      typeViability:     styleOf('m-type-viability'),
      typeFeasibility:   styleOf('m-type-feasibility'),
      typeEthical:       styleOf('m-type-ethical'),
      riskHigh:          styleOf('m-risk-high'),
      riskMedium:        styleOf('m-risk-medium'),
      riskLow:           styleOf('m-risk-low'),
      ciConstraint:      styleOf('m-ci-constraint'),
      ciDependency:      styleOf('m-ci-dependency'),
      ciOutcome:         styleOf('m-ci-outcome'),
      btnConfirmedState: styleOf('m-btn-confirmed-state'),
      btnFlaggedState:   styleOf('m-btn-flagged-state'),
      dmL:               styleOf('m-dm-l'),
      dmM:               styleOf('m-dm-m'),
      dmH:               styleOf('m-dm-h'),
      insight:           styleOf('m-insight'),
      confirm:           styleOf('m-confirm'),
      diagramError:      styleOf('m-diagram-error')
    };
  });
}

withAuth('dsa-s4 AC1 (chat-view.js rules): dark-mode marker battery resolves to real dark tokens, not stale hardcoded hex', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Dark Marker Battery', 'discovery');
  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });
  await ensureTheme(page, 'dark');
  await injectMarkers(page);
  const s = await readMarkerStyles(page);

  // rgb() equivalents of the real dark-mode tokens (from html-shell.js, confirmed above).
  const SUCCESS = 'rgb(52, 211, 153)', SUCCESS_SOFT = 'rgb(15, 35, 24)';
  const WARN    = 'rgb(245, 158, 11)', WARN_SOFT    = 'rgb(42, 32, 17)';
  const DANGER  = 'rgb(248, 113, 113)', DANGER_SOFT = 'rgb(42, 20, 22)';
  const ACCENT  = 'rgb(59, 130, 246)', ACCENT_SOFT  = 'rgb(21, 34, 56)', ACCENT_INK = 'rgb(147, 197, 253)';
  const SURFACE_2 = 'rgb(22, 26, 31)', INK_2 = 'rgb(180, 186, 194)';

  expect(s.chipOk.bg, 'chip-ok bg').toBe(SUCCESS_SOFT);
  expect(s.chipOk.color, 'chip-ok color').toBe(SUCCESS);
  expect(s.chipOk.border, 'chip-ok border').toBe(SUCCESS);

  expect(s.chipWarn.bg, 'chip-warn bg').toBe(WARN_SOFT);
  expect(s.chipWarn.color, 'chip-warn color').toBe(WARN);
  expect(s.chipWarn.border, 'chip-warn border').toBe(WARN);

  expect(s.badgeGreen.bg, 'ac-badge-green bg').toBe(SUCCESS_SOFT);
  expect(s.badgeGreen.color, 'ac-badge-green color').toBe(SUCCESS);
  expect(s.badgeAmber.bg, 'ac-badge-amber bg').toBe(WARN_SOFT);
  expect(s.badgeAmber.color, 'ac-badge-amber color').toBe(WARN);

  expect(s.acConfirmed.border, 'assumption-card confirmed border').toBe(SUCCESS);
  expect(s.acConfirmed.bg, 'assumption-card confirmed bg').toBe(SUCCESS_SOFT);
  expect(s.acConfirmedText.color, 'assumption-card confirmed text color').toBe(SUCCESS);
  expect(s.acFlagged.border, 'assumption-card flagged border').toBe(DANGER);
  expect(s.acFlagged.bg, 'assumption-card flagged bg').toBe(DANGER_SOFT);
  expect(s.acFlaggedText.color, 'assumption-card flagged text color').toBe(DANGER);

  // ac-type-desirability (purple) is a DOCUMENTED EXCEPTION -- kept as its
  // original hardcoded hex, theme-invariant, since it must stay visually
  // distinct from ac-type-viability's blue in the same badge legend and
  // DESIGN.md defines no purple token. Assert it stays fixed and distinct.
  expect(s.typeDesirability.bg, 'ac-type-desirability bg (documented exception)').toBe('rgb(237, 233, 254)');
  expect(s.typeDesirability.color, 'ac-type-desirability color (documented exception)').toBe('rgb(55, 48, 163)');

  expect(s.typeViability.bg, 'ac-type-viability bg').toBe(ACCENT_SOFT);
  expect(s.typeViability.color, 'ac-type-viability color').toBe(ACCENT_INK);
  expect(s.typeViability.bg, 'ac-type-viability must be visually distinct from ac-type-desirability').not.toBe(s.typeDesirability.bg);

  expect(s.typeFeasibility.bg, 'ac-type-feasibility bg').toBe(SUCCESS_SOFT);
  expect(s.typeFeasibility.color, 'ac-type-feasibility color').toBe(SUCCESS);
  expect(s.typeEthical.bg, 'ac-type-ethical bg').toBe(SURFACE_2);
  expect(s.typeEthical.color, 'ac-type-ethical color').toBe(INK_2);

  expect(s.riskHigh.bg, 'ac-risk-high bg').toBe(DANGER);
  expect(s.riskMedium.bg, 'ac-risk-medium bg').toBe(WARN);
  expect(s.riskLow.bg, 'ac-risk-low bg').toBe(SUCCESS);

  expect(s.ciConstraint.bg, 'ci-type-constraint bg').toBe(DANGER_SOFT);
  expect(s.ciConstraint.color, 'ci-type-constraint color').toBe(DANGER);
  expect(s.ciDependency.bg, 'ci-type-dependency bg').toBe(ACCENT_SOFT);
  expect(s.ciDependency.color, 'ci-type-dependency color').toBe(ACCENT_INK);
  expect(s.ciOutcome.bg, 'ci-type-outcome bg').toBe(SUCCESS_SOFT);
  expect(s.ciOutcome.color, 'ci-type-outcome color').toBe(SUCCESS);

  expect(s.btnConfirmedState.bg, 'btn-confirmed-state bg').toBe(SUCCESS_SOFT);
  expect(s.btnConfirmedState.color, 'btn-confirmed-state color').toBe(SUCCESS);
  expect(s.btnFlaggedState.bg, 'btn-flagged-state bg').toBe(DANGER_SOFT);
  expect(s.btnFlaggedState.color, 'btn-flagged-state color').toBe(DANGER);

  expect(s.dmL.color, 'dm-cx--l color').toBe(SUCCESS);
  expect(s.dmM.color, 'dm-cx--m color').toBe(WARN);
  expect(s.dmH.color, 'dm-cx--h color').toBe(DANGER);

  expect(s.insight.border, 'sw-chat-insight border').toBe(ACCENT);
  expect(s.confirm.border, 'sw-chat-confirm border').toBe(WARN);

  expect(s.diagramError.border, 'cv-diagram-error-box border').toBe(DANGER);
  expect(s.diagramError.bg, 'cv-diagram-error-box bg').toBe(DANGER_SOFT);
  expect(s.diagramError.color, 'cv-diagram-error-box color').toBe(DANGER);

  // dead --teal/--teal-soft token (unused anywhere in the codebase) is removed.
  const tealValue = await page.evaluate(function() {
    return getComputedStyle(document.documentElement).getPropertyValue('--teal').trim();
  });
  expect(tealValue, '--teal should no longer be defined (unused, removed)').toBe('');
});

withAuth('dsa-s4 AC2 (chat-view.js rules): light-mode marker battery resolves to real light tokens, not stale hardcoded hex', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Light Marker Battery', 'discovery');
  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });
  await ensureTheme(page, 'light');
  await injectMarkers(page);
  const s = await readMarkerStyles(page);

  // rgb() equivalents of the real light-mode tokens (from html-shell.js, confirmed above).
  const SUCCESS = 'rgb(21, 128, 61)', SUCCESS_SOFT = 'rgb(220, 252, 231)';
  const WARN    = 'rgb(180, 83, 9)', WARN_SOFT    = 'rgb(254, 243, 199)';
  const DANGER  = 'rgb(185, 28, 28)', DANGER_SOFT = 'rgb(254, 226, 226)';
  const ACCENT  = 'rgb(37, 99, 235)', ACCENT_SOFT  = 'rgb(239, 244, 255)', ACCENT_INK = 'rgb(29, 78, 216)';
  const SURFACE_2 = 'rgb(242, 243, 245)', INK_2 = 'rgb(63, 69, 76)';

  expect(s.chipOk.bg, 'chip-ok bg').toBe(SUCCESS_SOFT);
  expect(s.chipOk.color, 'chip-ok color').toBe(SUCCESS);
  expect(s.chipOk.border, 'chip-ok border').toBe(SUCCESS);

  expect(s.chipWarn.bg, 'chip-warn bg').toBe(WARN_SOFT);
  expect(s.chipWarn.color, 'chip-warn color').toBe(WARN);
  expect(s.chipWarn.border, 'chip-warn border').toBe(WARN);

  expect(s.badgeGreen.bg, 'ac-badge-green bg').toBe(SUCCESS_SOFT);
  expect(s.badgeGreen.color, 'ac-badge-green color').toBe(SUCCESS);
  expect(s.badgeAmber.bg, 'ac-badge-amber bg').toBe(WARN_SOFT);
  expect(s.badgeAmber.color, 'ac-badge-amber color').toBe(WARN);

  expect(s.acConfirmed.border, 'assumption-card confirmed border').toBe(SUCCESS);
  expect(s.acConfirmed.bg, 'assumption-card confirmed bg').toBe(SUCCESS_SOFT);
  expect(s.acConfirmedText.color, 'assumption-card confirmed text color').toBe(SUCCESS);
  expect(s.acFlagged.border, 'assumption-card flagged border').toBe(DANGER);
  expect(s.acFlagged.bg, 'assumption-card flagged bg').toBe(DANGER_SOFT);
  expect(s.acFlaggedText.color, 'assumption-card flagged text color').toBe(DANGER);

  // documented exception -- theme-invariant, same value as dark mode.
  expect(s.typeDesirability.bg, 'ac-type-desirability bg (documented exception)').toBe('rgb(237, 233, 254)');
  expect(s.typeDesirability.color, 'ac-type-desirability color (documented exception)').toBe('rgb(55, 48, 163)');

  expect(s.typeViability.bg, 'ac-type-viability bg').toBe(ACCENT_SOFT);
  expect(s.typeViability.color, 'ac-type-viability color').toBe(ACCENT_INK);

  expect(s.typeFeasibility.bg, 'ac-type-feasibility bg').toBe(SUCCESS_SOFT);
  expect(s.typeFeasibility.color, 'ac-type-feasibility color').toBe(SUCCESS);
  expect(s.typeEthical.bg, 'ac-type-ethical bg').toBe(SURFACE_2);
  expect(s.typeEthical.color, 'ac-type-ethical color').toBe(INK_2);

  expect(s.riskHigh.bg, 'ac-risk-high bg').toBe(DANGER);
  expect(s.riskMedium.bg, 'ac-risk-medium bg').toBe(WARN);
  expect(s.riskLow.bg, 'ac-risk-low bg').toBe(SUCCESS);

  expect(s.ciConstraint.bg, 'ci-type-constraint bg').toBe(DANGER_SOFT);
  expect(s.ciConstraint.color, 'ci-type-constraint color').toBe(DANGER);
  expect(s.ciDependency.bg, 'ci-type-dependency bg').toBe(ACCENT_SOFT);
  expect(s.ciDependency.color, 'ci-type-dependency color').toBe(ACCENT_INK);
  expect(s.ciOutcome.bg, 'ci-type-outcome bg').toBe(SUCCESS_SOFT);
  expect(s.ciOutcome.color, 'ci-type-outcome color').toBe(SUCCESS);

  expect(s.btnConfirmedState.bg, 'btn-confirmed-state bg').toBe(SUCCESS_SOFT);
  expect(s.btnConfirmedState.color, 'btn-confirmed-state color').toBe(SUCCESS);
  expect(s.btnFlaggedState.bg, 'btn-flagged-state bg').toBe(DANGER_SOFT);
  expect(s.btnFlaggedState.color, 'btn-flagged-state color').toBe(DANGER);

  expect(s.dmL.color, 'dm-cx--l color').toBe(SUCCESS);
  expect(s.dmM.color, 'dm-cx--m color').toBe(WARN);
  expect(s.dmH.color, 'dm-cx--h color').toBe(DANGER);

  expect(s.insight.border, 'sw-chat-insight border').toBe(ACCENT);
  expect(s.confirm.border, 'sw-chat-confirm border').toBe(WARN);

  expect(s.diagramError.border, 'cv-diagram-error-box border').toBe(DANGER);
  expect(s.diagramError.bg, 'cv-diagram-error-box bg').toBe(DANGER_SOFT);
  expect(s.diagramError.color, 'cv-diagram-error-box color').toBe(DANGER);
});

// ── AC1/AC2 (skills.js: nav-bar + journey-gate panel) ──────────────────
//
// Drives a real 2-stage journey (discovery -> benefit-metric) so both the
// real journey-stage-navigator strip (.sn-step--done once a stage is
// gate-confirmed) and the real journey-gate panel (#sign-off-error, shown
// while a stage is done but not yet gate-confirmed) render with real
// content on the same page, in one session -- avoiding a second full
// journey drive just to re-check the other theme.

async function driveStageToCompletion(page, skillName, sessionId, maxTurns) {
  maxTurns = maxTurns || 6;
  let lastResult = null;
  for (let i = 0; i < maxTurns; i++) {
    const res = await page.request.post(`/api/skills/${skillName}/sessions/${sessionId}/turn`, {
      data: { answer: i === 0 ? 'Begin the session.' : 'Continue.' }
    });
    expect(res.status(), `turn submission for ${skillName}`).toBe(200);
    lastResult = await res.json();
    if (lastResult.done) break;
  }
  expect(lastResult && lastResult.done, `${skillName} should complete within ${maxTurns} turns`).toBe(true);
  return lastResult;
}

function sessionIdFromChatPath(pathname) {
  const m = pathname.match(/\/skills\/[^/]+\/sessions\/([^/]+)\/chat/);
  return m ? m[1] : null;
}

async function gateConfirm(page, journeyId) {
  const csrfToken = await getCsrfToken(page.request, `/journey/${journeyId}/stage-review`, 'stage-review page');
  const res = await page.request.post(`/api/journey/${journeyId}/gate-confirm`, {
    form: { _csrf: csrfToken },
    maxRedirects: 0
  });
  expect(res.status(), 'gate-confirm').toBe(303);
  return res.headers()['location'];
}

withAuth('dsa-s4 AC1/AC2 (skills.js): nav-bar done-icon + journey-gate sign-off-error color match tokens in both themes', async ({ page }) => {
  const { location: loc1, journeyId } = await createJourney(page, 'DSA S4 Nav + Gate Panel', 'discovery');
  const sid1 = sessionIdFromChatPath(loc1);
  await driveStageToCompletion(page, 'discovery', sid1);
  const loc2 = await gateConfirm(page, journeyId);
  const sid2 = sessionIdFromChatPath(loc2);
  await driveStageToCompletion(page, 'benefit-metric', sid2);

  await page.goto(loc2);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });

  await expect(page.locator('.sn-step--done .sn-icon').first(), 'nav bar should show discovery as done').toBeVisible();
  await expect(page.locator('#sign-off-error'), 'journey-gate sign-off-error element should be present').toBeAttached();

  await ensureTheme(page, 'dark');
  let doneIconColor = await page.locator('.sn-step--done .sn-icon').first().evaluate((el) => getComputedStyle(el).color);
  let signOffErrorColor = await page.locator('#sign-off-error').evaluate((el) => getComputedStyle(el).color);
  expect(doneIconColor, 'dark: .sn-step--done .sn-icon color').toBe('rgb(52, 211, 153)');   // --success (dark)
  expect(signOffErrorColor, 'dark: #sign-off-error color').toBe('rgb(248, 113, 113)');      // --danger (dark)

  await ensureTheme(page, 'light');
  doneIconColor = await page.locator('.sn-step--done .sn-icon').first().evaluate((el) => getComputedStyle(el).color);
  signOffErrorColor = await page.locator('#sign-off-error').evaluate((el) => getComputedStyle(el).color);
  expect(doneIconColor, 'light: .sn-step--done .sn-icon color').toBe('rgb(21, 128, 61)');   // --success (light)
  expect(signOffErrorColor, 'light: #sign-off-error color').toBe('rgb(185, 28, 28)');       // --danger (light)
});

// ── AC1/AC2 (skills.js: "View journey complete" button token combo) ────
//
// The definition-of-ready-only "View journey complete" button is reachable
// only via a full ~8-stage journey drive (ideate..definition-of-ready),
// disproportionately expensive for a Task 1 color-substitution check. This
// verifies the CHOSEN substitution (color:var(--bg) on background:var(--ink),
// mirroring the established .sw-btn--primary pattern in html-shell.js line
// ~683, which already pairs these two tokens the same way for the same
// visual "dark bar" button) resolves to legible, distinct, correctly
// themed colors -- the source-level substitution itself is verified by code
// review against this same token pair.

withAuth('dsa-s4 AC1/AC2: "View journey complete" button token pair (var(--bg) on var(--ink)) is legible in both themes', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Journey Complete Btn', 'discovery');
  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });
  await page.evaluate(function() {
    document.body.insertAdjacentHTML('beforeend',
      '<a id="m-journey-complete-btn" style="display:inline-block;font-size:14px;font-weight:600;color:var(--bg);background:var(--ink);padding:8px 18px;border-radius:6px;text-decoration:none">View journey complete</a>'
    );
  });

  await ensureTheme(page, 'dark');
  let s = await page.locator('#m-journey-complete-btn').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  expect(s.bg, 'dark: button bg should be --ink (dark)').toBe('rgb(245, 246, 247)');
  expect(s.color, 'dark: button text should be --bg (dark)').toBe('rgb(11, 13, 16)');
  expect(s.color, 'dark: text must differ from background').not.toBe(s.bg);

  await ensureTheme(page, 'light');
  s = await page.locator('#m-journey-complete-btn').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { color: cs.color, bg: cs.backgroundColor };
  });
  expect(s.bg, 'light: button bg should be --ink (light)').toBe('rgb(20, 23, 26)');
  expect(s.color, 'light: button text should be --bg (light)').toBe('rgb(250, 250, 250)');
  expect(s.color, 'light: text must differ from background').not.toBe(s.bg);
});

// ── AC3 (toggle portion): Focused/Chat segmented control ───────────────
//
// Plan (Task 2): artefacts/2026-09-18-design-system-adoption/plans/dsa-s4-plan.md
// Drives a real 'ideate' session (its @mocked LLM-gateway fixture,
// tests/e2e/fixtures/llm-gateway/ideate.success.json, has a real 8-entry
// `responses` array -- lens A, B, C, D, then the final artefact turn -- so
// unlike 'discovery' (a single-response fixture that always completes on
// turn 1, confirmed by a throwaway debug spec run before writing this test)
// posting 2 real turns here leaves the session genuinely not-done, with 2
// real prior Q&A pairs AND a real pending currentQuestion (Lens B), which
// is the exact state this toggle/Focused rendering path is built from
// (chat-view.js's data.priorQA/data.currentQuestion/data.questionIndex/
// data.totalQuestions) via direct POST /turn calls (mirrors
// driveStageToCompletion's own page.request.post pattern above, but stops
// short of completion).

withAuth('dsa-s4 AC3 (toggle): Focused/Chat segmented control present, defaults to Chat, switching shows one question at a time', async ({ page }) => {
  const { location } = await createJourney(page, 'DSA S4 Focused Toggle', 'ideate');
  const sessionId = sessionIdFromChatPath(location);
  expect(sessionId, 'sessionId should be resolvable from the chat page location').toBeTruthy();

  // Two real turns into the ideate fixture's scripted 8-turn sequence (Lens
  // A, then Lens B) -- the session is still genuinely not done.
  for (let i = 0; i < 2; i++) {
    const res = await page.request.post(`/api/skills/ideate/sessions/${sessionId}/turn`, {
      data: { answer: 'Answer #' + (i + 1) + ' for the focused-toggle test.' }
    });
    expect(res.status(), `turn ${i + 1} submission`).toBe(200);
    const body = await res.json();
    expect(body.done, `turn ${i + 1} should not complete the ideate session yet`).toBe(false);
  }

  await page.goto(location);
  await page.locator('#chat-messages').waitFor({ state: 'visible' });

  // Segmented control present in the left-pane header (.sw-chat-head), with
  // both a "Focused" and a "Chat" option.
  const toggle = page.locator('#sw-mode-toggle');
  await expect(toggle, 'segmented control should be in .sw-chat-head').toBeVisible();
  await expect(page.locator('.sw-chat-head #sw-mode-toggle'), 'toggle should be inside .sw-chat-head specifically').toBeVisible();
  const chatBtn = page.locator('#sw-mode-btn-chat');
  const focusedBtn = page.locator('#sw-mode-btn-focused');
  await expect(chatBtn).toHaveText('Chat');
  await expect(focusedBtn).toHaveText('Focused');

  // Chat is the default active state -- full thread visible, Focused view hidden.
  await expect(chatBtn, 'Chat should be the default active state').toHaveClass(/sw-mode-btn--active/);
  await expect(focusedBtn, 'Focused should not be active by default').not.toHaveClass(/sw-mode-btn--active/);
  await expect(page.locator('#chat-messages'), 'full thread should be visible by default').toBeVisible();
  const chatMessageCountBefore = await page.locator('#chat-messages .sw-chat-msg').count();
  // 2 user answers + 1 Lens A assistant turn (answered) + 1 Lens B assistant
  // turn (the current, unanswered question) = 4. The very first user turn
  // has no preceding assistant question (nothing to render as a "Skill"
  // bubble for it -- see _renderChatPage's priorQA-pairing loop in
  // skills.js), so this is 4, not 5.
  expect(chatMessageCountBefore, 'full thread should contain the real prior turns + current question').toBeGreaterThanOrEqual(4);
  await expect(page.locator('#sw-focused-view'), 'Focused view should not be visible by default').toBeHidden();

  // Click Focused.
  await focusedBtn.click();
  await expect(focusedBtn, 'Focused should become active').toHaveClass(/sw-mode-btn--active/);
  await expect(chatBtn, 'Chat should no longer be active').not.toHaveClass(/sw-mode-btn--active/);
  await expect(page.locator('#sw-focused-view'), 'Focused view should now be visible').toBeVisible();
  await expect(page.locator('#chat-messages'), 'full thread should now be hidden').toBeHidden();

  // Only the current/most-recent unanswered question is shown.
  await expect(page.locator('#sw-focused-current-question .sw-focused-current-text'))
    .not.toBeEmpty();

  // A progress indicator ("Question X of Y" or equivalent) is present.
  await expect(page.locator('#sw-focused-progress-label')).toContainText(/Question \d+ of \d+/);

  // Prior answered turns are collapsed behind the progress indicator --
  // i.e. hidden by default, with a click-to-expand affordance.
  const priorToggle = page.locator('#sw-focused-prior-toggle');
  await expect(priorToggle, 'a way to expand previous answers should exist').toBeVisible();
  await expect(page.locator('#sw-focused-prior-list'), 'prior turns should be collapsed by default').toBeHidden();
  const priorItemCount = await page.locator('#sw-focused-prior-item, .sw-focused-prior-item').count();
  expect(priorItemCount, 'both prior turns should be present (collapsed) in the Focused view').toBe(2);

  // Click-to-expand: clicking the toggle reveals the prior list.
  await priorToggle.click();
  await expect(page.locator('#sw-focused-prior-list'), 'prior list should expand on click').toBeVisible();
  await expect(page.locator('.sw-focused-prior-item').first(), 'an individual prior answer should be expandable').toBeVisible();

  // Click Chat again -- full thread restored, underlying message data unchanged.
  await chatBtn.click();
  await expect(page.locator('#chat-messages'), 'full thread should be restored').toBeVisible();
  await expect(page.locator('#sw-focused-view'), 'Focused view should be hidden again').toBeHidden();
  const chatMessageCountAfter = await page.locator('#chat-messages .sw-chat-msg').count();
  expect(chatMessageCountAfter, 'underlying message data should be unchanged by the toggle').toBe(chatMessageCountBefore);
});
