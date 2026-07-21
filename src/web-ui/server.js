'use strict';

// server.js — Node.js HTTP server entry point for web-ui
// Uses built-in http module — zero external npm dependencies.
// Session middleware, auth routes, health handler, and authGuard mounted here.

const http = require('http');
const https = require('https');
const { URL } = require('url');

const { sessionMiddleware }                                          = require('./middleware/session');
const { handleLanding }                                              = require('./routes/landing');     // bee.1
const { handleRoot, handleWelcome }                                  = require('./routes/public');      // lab-s1.2 / lab-s2.3
const { handleAuthGithub, handleAuthCallback, handleAuthGoogle, handleAuthGoogleCallback, handleLogout, authGuard } = require('./routes/auth');
const { handleArtefactRoute }                                        = require('./routes/artefact');
const { handleSignOff, handleArtefactRead }                             = require('./routes/sign-off');
const { healthCheckHandler }                                         = require('./routes/health');
const { validateRequiredEnvVars }                                    = require('./config/validate-env');
const { handleGetActions, handleDashboard }                          = require('./routes/dashboard');
const { handleGetFeatureArtefacts, handleGetIdeas, handlePostIdea, handleDeleteIdea } = require('./routes/features');
const { handlePostAnnotation }                                       = require('./routes/annotation');   // wuce.8
const { handleExecuteSkill }                                         = require('./routes/execute');        // wuce.9
const { handleGetSkills, handlePostSession, handlePostAnswer, handleGetSessionState, handleCommitArtefact, handleResumeSession, handleGetSkillsHtml, handlePostSkillSessionHtml, handleGetQuestionHtml, handlePostAnswerHtml, handleGetCommitPreviewHtml, handlePostCommitHtml, handleGetResultHtml, registerHtmlSession, htmlGetNextQuestion, htmlGetPreview, htmlCommitSession, htmlGetCompletePage, handleGetChatHtml, handlePostTurnHtml, handlePostTurnStreamHtml, handlePostAssumptionConfirm, handlePostCanvasEditHtml } = require('./routes/skills'); // wuce.13 / wuce.23 / wuce.24 / wuce.25 / dsq.3 / mfc.1 / mfc.3 / iwu.4 / dic.5
const { setLogger, setFetchOrgs, getFetchOrgs, setFetchOrgMembers, getOrgMembers } = require('./routes/auth'); // tir-s8: getOrgMembers/setFetchOrgMembers
const { setProviderAdapter, gitHubProviderAdapter, setGoogleUserInfoAdapter, _realFetchGoogleUserInfo } = require('./auth/oauth-adapter');  // lab-s1.3 provider registry wiring (D37 separate task)
const { setFetchPipelineState }                                      = require('./adapters/feature-list');
const { setFetchArtefactDirectory }                                  = require('./adapters/artefact-list');
const skillsAdapter                                                  = require('./adapters/skills');          // wuce.23 HTML form wiring
const { listAvailableSkills }                                        = require('../adapters/skill-discovery'); // wuce.23 skill list
const sessionManager                                                 = require('../modules/session-manager'); // wuce.23 session creation
const _path                                                          = require('path');                       // wuce.23 session ID extraction
const { handleGetJourney, handlePostJourney, handleGetJourneyResume, handleGetStageReview, handleGetReference, handlePostReference, handlePostReferenceUpload, handleGetReferenceModal, handleGetReferenceModalStart, handlePostReferenceModalSkip, handlePostGateConfirm, handleGetStories, handlePostStories, handleGetJourneyComplete, handleGetStageControls, handlePostEstimate, handlePostSpike, handlePatchSpike, handleGetTrace, handlePostDecisions, handlePostSideTripClarify, handleDeleteSideTrip, handleGetJourneyState, setPipelineStateWriter, setValidate, setWriteTrace, handleGetWizard, handleGetWizardBootstrapped, handlePostWizardSelection, handleJourneys, setListJourneys } = require('./routes/journey'); // ougl.3 / owle.1-6 / wucp.4 / sdg.1 / bee.2 / bri-s1.5
const pipelineStateWriterFactory                                     = require('./adapters/pipeline-state-writer'); // owle.6
const { setToolExecutor }                                            = require('./modules/tool-executor'); // wucp.3
const { setCreditsAdapter }                                          = require('./modules/credits');       // lab-s3.1
const { setPlanStateAdapter }                                        = require('./modules/tenant-plan');   // jlc-s1
const { migrateProductRepoColumns }                                  = require('./modules/product-repo');  // prc-s1.1
const { registerSelfAsProduct }                                       = require('./modules/platform-self-registration'); // pr-s1
const { setRepoAdapter, realCheckRepoAccess }                        = require('./adapters/repo-adapter'); // prc-s1.2 (D37 separate task)
const { setPipelineStateFetchAdapter, realFetchPipelineState }        = require('./adapters/pipeline-state-fetch-adapter'); // pr-s2
const { handlePostConnectRepo }                                      = require('./routes/product-repo');   // prc-s1.2
const { handlePostCheckout, handleGetBillingSuccess, handlePostStripeWebhook, setWebhookDbAdapter, handleGetBillingPortal, handleGetBillingPlanState } = require('./routes/billing'); // lab-s3.2 / lab-s3.4 / lab-s3.5 / bri-s3.5
const { setStripeAdapter }                                           = require('./modules/stripe-client');  // lab-s3.2
const { creditsGuard }                                               = require('./middleware/credits-guard'); // lab-s3.3
const { handleEmailSignup, handleEmailLogin, setUserDb }             = require('./routes/auth-email');       // lab-s2.2
const { setPasswordAdapter }                                         = require('./modules/password');         // lab-s2.2
const { setUserFlagsAdapter }                                        = require('./modules/user-flags');       // lab-s2.3
const { setGetUserRole, setGetRoleForTenant, getRoleForTenant, migrateTeamSchema, resolveRoleForPerson } = require('./modules/user-roles'); // arl-s1 / tir-s1 / tir-s7 / sec-perf-s2
const { migrateIdentityLinksSchema } = require('./modules/identity-links'); // tir-s2
const { handleStartGoogleLink, handleStartGithubLink, createLinkCallbackHandlers } = require('./routes/account-linking'); // tir-s2
const { createSettingsHandlers } = require('./routes/settings'); // c1
const { requireAdmin, setGetCurrentRole }                            = require('./middleware/require-admin'); // arl-s2 / sec-perf-s2
const { adminCreditsGet, adminCreditsPost }                          = require('./routes/admin-credits');     // arl-s3
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handleGetProductRoadmap, handlePostProductSync, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handleDeleteProduct, handlePostProductRepoCreate, handlePutProductEdit, handleGetProductModules, handlePostProductModule, handlePutProductModule, handleDeleteProductModule, handlePutEpicModule } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2 / prc-s2.1 / prc-s4.1 / pr-s3 / a1 / a2 / a5
const { setModulesAdapter } = require('./adapters/modules-adapter'); // a1
const { setGenerateProductDraft }                                    = require('./adapters/product-draft');      // psh-s3
const { setCreateRepoAdapter, realCreateRepo }                       = require('./adapters/repo-adapter');       // prc-s2.1
const { setProductContextAdapter }                                   = require('./product-context-adapter');      // psh-s5
const { setStandardsAdapter }                                        = require('./standards-adapter');             // psh-s10
const { setPostHogFlagsAdapter }                                     = require('./modules/posthog-flags');          // bri-s1.1
const { initPostHogFlagsClient }                                     = require('./modules/posthog-config');         // bri-s1.2
const { createTeamManagementHandlers }                               = require('./routes/team-management');       // tir-s3
const { createGithubOrgBulkAddHandlers }                             = require('./routes/github-org-bulk-add');   // tir-s5
const { setImpersonationAuditAdapter }                               = require('./adapters/impersonation-audit-adapter'); // d1
const { createImpersonationHandlers }                                = require('./routes/impersonation');         // d1

const PORT = process.env.PORT || 3000;
const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL || 'https://api.github.com';

// psh-s3: module-level pool reference for product routes (assigned inside DATABASE_URL block)
let _pshPool = null;

// tir-s2: module-level handler references for /settings/link-account (assigned
// inside the DATABASE_URL block, same pattern as _pshPool above — this route is
// real-Postgres-only, matching tir-s1's own migrateTeamSchema/getRoleForTenant
// wiring, which has no NODE_ENV=test fallback either).
let _handleGoogleLinkCallback = null;
let _handleGithubLinkCallback = null;

// c1: module-level handler reference for /settings (assigned inside the
// DATABASE_URL block, same pattern as _handleGoogleLinkCallback above --
// real-Postgres-only, no NODE_ENV=test fallback, matching tir-s2's own
// wiring precedent).
let _handleGetSettings = null;

// tir-s3: module-level handler reference for /team/members + /api/team/members
// (assigned inside the DATABASE_URL block, same pattern as
// _handleGoogleLinkCallback above — real-Postgres-only, no NODE_ENV=test
// fallback either, matching tir-s1/tir-s2's own wiring precedent).
let _teamManagementHandlers = null;
let _githubOrgBulkAddHandlers = null;

// d1: module-level handler reference for /admin/impersonate + the reason-gated
// start endpoint (assigned inside the DATABASE_URL block, same pattern as
// _teamManagementHandlers above — real-Postgres-only, no NODE_ENV=test fallback).
let _impersonationHandlers = null;

// Wire up console logger for auth events (login, logout, state_mismatch)
const _ts = () => new Date().toISOString();
setLogger({
  info: (event, data) => console.log(`[auth] ${event}`, JSON.stringify(Object.assign({ timestamp: _ts() }, data))),
  warn: (event, data) => console.warn(`[auth] ${event}`, JSON.stringify(Object.assign({ timestamp: _ts() }, data)))
});

// lab-s1.3 / D37 mandatory separate wiring task — wire real GitHub provider adapter
// routes/auth.js also wires this at module load for direct-require compat, but server.js
// must wire it explicitly so AC6 is independently verifiable.
setProviderAdapter(gitHubProviderAdapter);
console.log('[auth] provider registry initialised');

// lab-s2.1 / D37 mandatory separate wiring task — wire real Google userinfo adapter
// Only wired when GOOGLE_CLIENT_ID is set; no-op (throwing stub retained) when absent.
if (process.env.GOOGLE_CLIENT_ID) {
  setGoogleUserInfoAdapter(_realFetchGoogleUserInfo);
  console.log('[auth] google oauth registered');
}

// prc-s1.2 / D37 mandatory separate wiring task — wire the real GitHub
// repo-access-check adapter. Never wired in NODE_ENV=test (tests call
// setRepoAdapter() themselves with a mock); the throwing stub stays active
// there, matching the pattern already used by the lab-s1.3 provider
// registry and lab-s2.1 Google adapter wiring blocks above.
if (process.env.NODE_ENV !== 'test') {
  setRepoAdapter(realCheckRepoAccess);
  console.log('[products] repo adapter wired');
}

// pr-s2 / D37 mandatory separate wiring task -- wire the real GitHub
// Contents API adapter for fetching a connected repo's pipeline-state.json.
// Never wired in NODE_ENV=test (tests call setPipelineStateFetchAdapter()
// themselves with a mock); the throwing stub stays active there, matching
// the pattern already used by the prc-s1.2/prc-s2.1 adapters above.
if (process.env.NODE_ENV !== 'test') {
  setPipelineStateFetchAdapter(realFetchPipelineState);
  console.log('[pr-s2] pipeline-state fetch adapter wired');
}

// prc-s2.1 / D37 mandatory separate wiring task -- wire the real GitHub
// repo-creation adapter (a distinct adapter from prc-s1.2's repo-access-check
// adapter above -- setCreateRepoAdapter/getCreateRepoAdapter, not
// setRepoAdapter/getRepoAdapter, so the two stories' wiring calls never
// collide). Never wired in NODE_ENV=test (tests call setCreateRepoAdapter()
// themselves with a mock); the throwing stub stays active there.
if (process.env.NODE_ENV !== 'test') {
  setCreateRepoAdapter(realCreateRepo);
  console.log('[repo-adapter] createRepo wired');
}

// bri-s1.2 — wire the real PostHog flags client into the bri-s1.1 adapter contract,
// using the env-appropriate project key (staging vs production). Never active under
// NODE_ENV=test (consistent with the other adapter-wiring blocks in this file); a
// missing/misconfigured key logs a clear, key-value-free error and does not crash
// the process (AC4) — it never falls back to the other environment's key.
if (process.env.NODE_ENV !== 'test') {
  const _postHogEnvName = process.env.NODE_ENV === 'staging' ? 'staging' : 'production';
  initPostHogFlagsClient(_postHogEnvName, process.env, {
    setPostHogFlagsAdapter: setPostHogFlagsAdapter,
    logger: console
  });
} else {
  // bri-s1.5 fix-forward: no real PostHog keys exist in CI/E2E environments, so the real
  // client above is never wired under NODE_ENV=test. Once bri-s1.5 added an isEnabled()
  // check to handleGetProductKanban/handleGetOrgKanban, any E2E spec that boots this server
  // (every Playwright spec does) started hitting the D37 stub-throw default (posthog-flags.js
  // AC2) the moment it reached a flag-gated route. Wire a fake adapter that defaults flags
  // open (true) so E2E specs written before the flag existed (psh-s6, psh-s7) and specs that
  // need to reach the real downstream logic (bri-s3.4 cross-tenant isolation) all still work,
  // exactly as if the flag were fully rolled out.
  setPostHogFlagsAdapter({
    evaluateFlag: async function() { return true; },
    groupIdentify: async function() {}
  });
}

// Wire skill list + session creation — active in production AND when
// WIRE_SKILL_ADAPTERS=true (used by playwright.local.config.js to test adapter
// wiring while keeping NODE_ENV=test for session seeding).
// Both operations are filesystem-only and require no GitHub token.
if (process.env.NODE_ENV !== 'test' || process.env.WIRE_SKILL_ADAPTERS === 'true') {
  const _repoRoot = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  skillsAdapter.setListSkills(async function(_token) {
    return listAvailableSkills(_repoRoot);
  });
  skillsAdapter.setCreateSession(async function(skillName, _token) {
    const sessionPath = sessionManager.createSession('html-' + skillName);
    const id = _path.basename(sessionPath);
    registerHtmlSession(id, sessionPath, skillName);
    return { id };
  });
  skillsAdapter.setGetNextQuestion(async function(skillName, sessionId, _token) {
    return htmlGetNextQuestion(skillName, sessionId);
  });
  skillsAdapter.setGetCommitPreview(async function(skillName, sessionId, _token) {
    return htmlGetPreview(skillName, sessionId);
  });
  skillsAdapter.setCommitSession(async function(skillName, sessionId, token, login) {
    const name = login || 'web-ui';
    return htmlCommitSession(skillName, sessionId, token, { name, email: name + '@users.noreply.github.com' });
  });

  // wucp.3 — wire real fs adapter for tool execution loop (read_file / list_dir)
  const _repoRootForTools = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  setToolExecutor(function(verb, resolvedPath) {
    var _fs = require('fs');
    if (verb === 'list_dir') {
      return _fs.readdirSync(resolvedPath).join('\n');
    }
    return _fs.readFileSync(resolvedPath, 'utf8');
  });

  // mfc.1 — wire real Copilot API executor for model-first chat turns
  const { skillTurnExecutor: realSkillTurnExecutor, skillTurnExecutorStream: realSkillTurnExecutorStream } = require('../modules/skill-turn-executor');
  const { setSkillTurnExecutorAdapter, setSkillTurnExecutorStreamAdapter, setSessionStore: _setSessionStore, _setHtmlSession: _restoreHtmlSession, startSessionEviction } = require('./routes/skills');
  setSkillTurnExecutorAdapter(realSkillTurnExecutor);
  setSkillTurnExecutorStreamAdapter(realSkillTurnExecutorStream);
  // _nextQuestionExecutorAdapter and _sectionDraftExecutorAdapter are no-ops (AC9 — mfc.1);
  // no wiring required.

  // wsm.1 — wire disk session persistence adapter and restore sessions on startup
  const _diskSessionStoreAdapter = require('./adapters/session-store');
  _setSessionStore(_diskSessionStoreAdapter);
  _diskSessionStoreAdapter.loadSessions(_restoreHtmlSession);

  // wsm.2 — prune stale skill sessions from in-process _sessionStore hourly
  startSessionEviction();

  // jdsk.1 — wire journey disk adapter and reload journeys from workspace/journeys/
  const _journeyStore = require('./modules/journey-store');
  const _journeyRoot  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  if (process.env.DATABASE_URL) {
    // p3.1 — Postgres journey persistence (Neon free tier, see Decision 9)
    const _journeyPg = require('./adapters/journey-store-pg');
    _journeyStore.setPgAdapter(_journeyPg);
    // Auto-migrate schema on startup then load journeys (CREATE TABLE IF NOT EXISTS is idempotent)
    _journeyPg.migrateSchema()
      .then(function() { return _journeyStore.loadAllFromPg(); })
      .catch(function(err) {
        console.error('[server] Postgres startup failed:', err.message);
      });
  } else {
    const _journeyDisk = require('../modules/journey-disk');
    _journeyStore.setDiskAdapter(_journeyDisk);
    _journeyStore.loadAllFromDisk(_journeyRoot);
  }

  // bee.2 — Task 3: wire listJourneys adapter for GET /journeys (D37 separate wiring task)
  {
    const _journeyStoreForBee2 = require('./modules/journey-store');
    const _journeyRootForBee2  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
    setListJourneys(async function(tenantId) {
      var all = _journeyStoreForBee2.listJourneys(_journeyRootForBee2);
      return tenantId ? all.filter(function(j) { return j.tenantId === tenantId; }) : all;
    });
  }

  // lab-s3.1 — Wire credits DB adapter (D37 mandatory separate wiring task)
  // lab-s3.4 — Wire webhook DB adapter to same Postgres pool (stripe_events idempotency table)
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const _creditsPool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
    _pshPool = _creditsPool; // psh-s3: wire pool for product creation routes
    setCreditsAdapter(_creditsPool);
    console.log('Credits DB adapter wired');
    setWebhookDbAdapter(_creditsPool); // same pool — stripe_events in same DB as credits
    console.log('Webhook DB adapter wired (idempotency)');
    // Auto-migrate credits and stripe_events tables on startup (CREATE TABLE IF NOT EXISTS is idempotent)
    _creditsPool.query(`
      CREATE TABLE IF NOT EXISTS credits (
        tenant_id  VARCHAR PRIMARY KEY,
        balance    INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(function() { console.log('credits table ready'); })
      .catch(function(err) { console.error('credits table migration failed:', err.message); });
    _creditsPool.query(`
      CREATE TABLE IF NOT EXISTS stripe_events (
        stripe_event_id VARCHAR PRIMARY KEY
      )
    `).then(function() { console.log('stripe_events table ready'); })
      .catch(function(err) { console.error('stripe_events table migration failed:', err.message); });
    // jlc-s1 — Wire tenant plan-state DB adapter (D37 mandatory separate wiring task).
    // Same pool as credits/stripe_events — persists bri-s3.5's paid-plan bypass so it
    // survives a server restart instead of living only in an in-memory Map.
    setPlanStateAdapter(_creditsPool);
    console.log('Tenant plan-state DB adapter wired');
    _creditsPool.query(`
      CREATE TABLE IF NOT EXISTS tenant_plan (
        tenant_id  VARCHAR PRIMARY KEY,
        plan       VARCHAR NOT NULL DEFAULT 'trial',
        status     VARCHAR NOT NULL DEFAULT 'active',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(function() { console.log('tenant_plan table ready'); })
      .catch(function(err) { console.error('tenant_plan table migration failed:', err.message); });
    // arl-s5 — Auto-migrate credit_audit_log table (immutable audit trail for admin credit
    // adjustments). No new adapter wiring — queried through the same _creditsPool already
    // wired via setCreditsAdapter above.
    _creditsPool.query(`
      CREATE TABLE IF NOT EXISTS credit_audit_log (
        id              BIGSERIAL PRIMARY KEY,
        tenant_id       VARCHAR NOT NULL,
        admin_id        VARCHAR NOT NULL,
        delta           INTEGER NOT NULL,
        balance_before  INTEGER,
        balance_after   INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).then(function() { console.log('credit_audit_log table ready'); })
      .catch(function(err) { console.error('credit_audit_log table migration failed:', err.message); });
    // arl-s1 — Wire user_roles DB adapter (D37 mandatory separate wiring task)
    const _userRolesPool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
    setGetUserRole(async function(tenantId) {
      const result = await _userRolesPool.query(
        'SELECT role FROM user_roles WHERE tenant_id = $1',
        [tenantId]
      );
      if (!result.rows.length) return 'user';
      return result.rows[0].role;
    });
    console.log('[arl-s1] user_roles adapter wired (legacy — left in place, unused in production after tir-s1)');
    // arl-s1 — Auto-migrate user_roles table on startup
    const _userRolesMigrationPromise = _userRolesPool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        tenant_id VARCHAR PRIMARY KEY,
        role VARCHAR NOT NULL DEFAULT 'user'
      )
    `).then(function() {
      console.log('user_roles table ready');
      // arl-s4 — Seed admin role for operator accounts named in ADMIN_GITHUB_LOGINS
      // (comma-separated GitHub logins — same allowlist shape as TENANT_ORG_ALLOWLIST).
      // Runs after table creation so the upsert always has a table to target.
      const _adminLogins = (process.env.ADMIN_GITHUB_LOGINS || '')
        .split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      if (_adminLogins.length) {
        return Promise.all(_adminLogins.map(function(login) {
          return _userRolesPool.query(
            `INSERT INTO user_roles (tenant_id, role) VALUES ($1, 'admin')
             ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin'`,
            [login]
          );
        })).then(function() {
          console.log('[arl-s4] admin role seeded for', _adminLogins.length, 'login(s)');
        });
      }
    }).catch(function(err) { console.error('user_roles table migration failed:', err.message); });

    // tir-s1 — Wire the person/team-scoped role adapter (D37 mandatory separate
    // wiring task, AC6). Replaces the legacy tenant-wide user_roles query above
    // as the real production implementation — the legacy setGetUserRole wiring
    // above stays in place (Out of Scope: do not remove) but is no longer
    // called by any production code path after this story.
    //
    // tir-s7 (fix-forward, AC5) — the original tir-s1 wiring above called
    // resolveRoleForTenant(pool, tenantId) directly, which queries
    // team_memberships filtered by tenant_id ONLY (LIMIT 1): once a tenant has
    // 2+ people with different roles, login resolved an arbitrary row's role
    // for whoever logged in, not their own. Fixed by resolving the
    // authenticating identity to a personId first (tir-s2's
    // resolvePersonForIdentity, via resolveRoleForPerson in user-roles.js)
    // before scoping the team_memberships lookup by BOTH person_id AND
    // tenant_id.
    //
    // tir-s9 (fix-forward) — tir-s7's query logic above was correct, but this
    // wiring collapsed BOTH resolveRoleForPerson arguments into the SAME
    // value (tenantId, tenantId), discarding any distinct identityKey a
    // caller might supply. That is harmless for a solo tenant or an
    // email/password login (tenantId already equals that one person's own
    // identity) but reproduces tir-s7's original bug one layer removed once
    // TENANT_ORG_ALLOWLIST is configured: every teammate on a shared
    // GitHub-org tenant login then called resolveRoleForPerson with the SAME
    // shared org name as identityKey, so every teammate's login could resolve
    // an arbitrary OTHER teammate's role. Fixed by accepting the identityKey
    // argument getRoleForTenant now forwards (routes/auth.js passes each
    // person's own GitHub login / Google sub) and using it in place of
    // tenantId, falling back to tenantId only when a caller omits it
    // (auth-email.js's unmodified single-argument call sites).
    setGetRoleForTenant(function(tenantId, identityKey) {
      return resolveRoleForPerson(_userRolesPool, identityKey || tenantId, tenantId);
    });
    console.log('[tir-s1/tir-s7/tir-s9] team_memberships adapter wired (getRoleForTenant, person-scoped, per-person identityKey)');

    // sec-perf-s2 (AC5) — wire requireAdmin's live per-request role re-check to the SAME
    // getRoleForTenant adapter just wired above (not a second, parallel resolution path),
    // so a mid-session role change (e.g. an admin demoted via addOrUpdateTeammate) is
    // reflected on the very next requireAdmin-gated request instead of staying cached in
    // req.session.role until the person logs out and back in.
    setGetCurrentRole(function(tenantId) {
      return getRoleForTenant(tenantId);
    });
    console.log('[sec-perf-s2] requireAdmin live-role adapter wired (getCurrentRole -> getRoleForTenant)');

    // tir-s1 — Auto-migrate people/team_memberships schema + backfill every
    // legacy user_roles row (AC1, AC2). Chained after the user_roles table
    // creation AND the arl-s4 admin seeding settle, so the backfill picks up
    // admin-seeded rows too.
    _userRolesMigrationPromise.then(function() {
      return migrateTeamSchema(_userRolesPool);
    }).then(function() {
      // tir-s2 — Auto-migrate person_identities schema. Chained after
      // people/team_memberships exists (FK dependency: person_identities.person_id
      // references people(id)).
      return migrateIdentityLinksSchema(_userRolesPool);
    }).catch(function(err) { console.error('[tir-s1] people/team_memberships migration failed:', err.message); });

    // tir-s2 — Wire the /settings/link-account callback handlers to the same
    // Postgres pool (same reuse pattern as arl-s1/tir-s1 above). No new D37
    // adapter (H-ADAPTER): createLinkCallbackHandlers is a plain factory, not
    // a throw-on-unwired setter/getter pair.
    const _linkCallbackHandlers = createLinkCallbackHandlers(_userRolesPool);
    _handleGoogleLinkCallback = _linkCallbackHandlers.handleGoogleLinkCallback;
    _handleGithubLinkCallback = _linkCallbackHandlers.handleGithubLinkCallback;
    console.log('[tir-s2] account-linking callback handlers wired');

    // c1 — Wire the /settings page handler to the same Postgres pool (same
    // reuse pattern as tir-s2/tir-s3 above). No new D37 adapter (H-ADAPTER):
    // createSettingsHandlers is a plain factory, not a throw-on-unwired
    // setter/getter pair.
    const _settingsHandlers = createSettingsHandlers(_userRolesPool);
    _handleGetSettings = _settingsHandlers.handleGetSettings;
    console.log('[c1] settings page handler wired');

    // tir-s3 — Wire the /team/members add-teammate handlers to the same
    // Postgres pool (same reuse pattern as tir-s1/tir-s2 above). No new D37
    // adapter (H-ADAPTER): createTeamManagementHandlers is a plain factory,
    // not a throw-on-unwired setter/getter pair.
    _teamManagementHandlers = createTeamManagementHandlers(_userRolesPool);
    console.log('[tir-s3] team-management handlers wired');

    // d1 — Wire the /admin/impersonate search + start handlers to the same
    // Postgres pool as team_memberships/person_identities (tir-s1/tir-s2),
    // since listImpersonationCandidates reads from those tables. No new D37
    // adapter for the handlers themselves (H-ADAPTER): createImpersonationHandlers
    // is a plain factory, not a throw-on-unwired setter/getter pair -- the
    // D37 adapter here is setImpersonationAuditAdapter (wired below, against
    // _creditsPool, matching credit_audit_log's own precedent).
    _impersonationHandlers = createImpersonationHandlers(_userRolesPool);
    console.log('[d1] impersonation handlers wired');

    // tir-s5 — Wire the /api/team/bulk-add-github-org handler to the same
    // Postgres pool, reusing tir-s3's addOrUpdateTeammate as the write path.
    // tir-s8: the read path is now getOrgMembers (D37: setFetchOrgMembers),
    // NOT getFetchOrgs -- getFetchOrgs lists the orgs a token belongs to and
    // was never the right data source for "members of this specific org".
    _githubOrgBulkAddHandlers = createGithubOrgBulkAddHandlers(_userRolesPool, getOrgMembers);
    console.log('[tir-s5/tir-s8] github-org-bulk-add handlers wired');
    // psh-s1: products table
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS products (
      product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by VARCHAR NOT NULL DEFAULT 'system',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).then(function() {
      console.log('[psh-s1] products table ready');
      // psh-s3: add context columns if they were not present at initial table creation
      return Promise.all([
        _creditsPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS mission TEXT'),
        _creditsPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS roadmap TEXT'),
        _creditsPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS tech_stack TEXT'),
        _creditsPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS constraints TEXT'),
        _creditsPool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS architecture_guardrails TEXT')
      ]);
    }).then(function() {
      console.log('[psh-s3] products context columns ready');
    }).catch(function(err) {
      console.error('[psh-s1] products migration failed:', err.message);
    });

    // prc-s1.1: repo association columns on products (repo_provider/repo_owner/repo_name)
    migrateProductRepoColumns(_creditsPool).catch(function(err) {
      console.error('[prc-s1.1] products repo-column migration failed:', err.message);
    });

    // pr-s1: register skills-framework itself as a product row for the
    // dogfooding rollup case. Skips gracefully if PLATFORM_TENANT_ID or
    // GITHUB_REPO_OWNER/GITHUB_REPO_NAME are not configured -- optional
    // seed, not a hard startup requirement.
    registerSelfAsProduct(_creditsPool, {
      tenantId: process.env.PLATFORM_TENANT_ID,
      repoOwner: process.env.GITHUB_REPO_OWNER,
      repoName: process.env.GITHUB_REPO_NAME,
      name: 'skills-framework'
    }).catch(function(err) {
      console.error('[pr-s1] platform self-registration failed:', err.message);
    });

    // psh-s1: standards table
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS standards (
      standard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
      org_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      content TEXT NOT NULL,
      visibility VARCHAR NOT NULL DEFAULT 'product' CHECK (visibility IN ('product', 'org', 'public')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).then(function() {
      console.log('[psh-s1] standards table ready');
    }).catch(function(err) {
      console.error('[psh-s1] standards migration failed:', err.message);
    });

    // psh-s9: standard_product_optouts table
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS standard_product_optouts (
      standard_id UUID REFERENCES standards(standard_id) ON DELETE CASCADE,
      product_id  UUID REFERENCES products(product_id)   ON DELETE CASCADE,
      opted_out_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (standard_id, product_id)
    )`).then(function() {
      console.log('[psh-s9] standard_product_optouts table ready');
    }).catch(function(err) {
      console.error('[psh-s9] standard_product_optouts migration failed:', err.message);
    });

    // pr-s2: cache table for the computed product rollup (DoD-status counts
    // today; Epic 2 stories add more columns for health/test-coverage/AC-
    // coverage/taxonomy). One row per product_id -- ON CONFLICT (product_id)
    // DO UPDATE keeps a sync idempotent and always reflects the latest fetch.
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS product_rollups (
      product_id UUID PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
      dod_status_counts JSONB NOT NULL DEFAULT '{}',
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).then(function() {
      console.log('[pr-s2] product_rollups table ready');
    }).catch(function(err) {
      console.error('[pr-s2] product_rollups migration failed:', err.message);
    });

    // pr-s4: add the health-count rollup column. Idempotent — safe to run on
    // every server start, matching the products-table context-column migration
    // pattern already used elsewhere in this file.
    _creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS health_counts JSONB NOT NULL DEFAULT '{}'`).then(function() {
      console.log('[pr-s4] product_rollups.health_counts column ready');
    }).catch(function(err) {
      console.error('[pr-s4] health_counts migration failed:', err.message);
    });

    // pr-s5: add the blended test-coverage rollup column. Idempotent, same
    // pattern as the health_counts migration above.
    _creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS test_coverage JSONB NOT NULL DEFAULT '{}'`).then(function() {
      console.log('[pr-s5] product_rollups.test_coverage column ready');
    }).catch(function(err) {
      console.error('[pr-s5] test_coverage migration failed:', err.message);
    });

    // pr-s6: add the blended AC-coverage rollup column. Idempotent, same
    // pattern as the health_counts/test_coverage migrations above.
    _creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS ac_coverage JSONB NOT NULL DEFAULT '{}'`).then(function() {
      console.log('[pr-s6] product_rollups.ac_coverage column ready');
    }).catch(function(err) {
      console.error('[pr-s6] ac_coverage migration failed:', err.message);
    });

    // pr-s7: add the epic/feature taxonomy rollup column. Idempotent, same
    // pattern as the other product_rollups column migrations.
    _creditsPool.query(`ALTER TABLE product_rollups ADD COLUMN IF NOT EXISTS taxonomy JSONB NOT NULL DEFAULT '{}'`).then(function() {
      console.log('[pr-s7] product_rollups.taxonomy column ready');
    }).catch(function(err) {
      console.error('[pr-s7] taxonomy migration failed:', err.message);
    });

    // psh-s1: journeys.product_id FK column
    _creditsPool.query(`ALTER TABLE journeys ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(product_id) ON DELETE SET NULL`).then(function() {
      console.log('[psh-s1] journeys.product_id column ready');
    }).catch(function(err) {
      console.error('[psh-s1] journeys product_id migration failed:', err.message);
    });

    // a1: product_modules table -- curated, per-product Modules taxonomy
    // layered above epics. Fully operator-curated, zero defaults (see
    // decisions.md, discovery /clarify) -- every product starts with zero rows.
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS product_modules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
      tenant_id VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).then(function() {
      console.log('[a1] product_modules table ready');
    }).catch(function(err) {
      console.error('[a1] product_modules migration failed:', err.message);
    });

    // a1: journeys.module_id -- the storage layer A2 (reassign epics between
    // modules) writes to. NULL = "Unassigned". ON DELETE SET NULL is a
    // DB-level safety net; modules-adapter.js's deleteModule also issues an
    // explicit UPDATE first, so the AC3 reassignment is directly assertable
    // rather than solely reliant on cascade behaviour (see decisions.md ARCH
    // entry for why journeys, not a new epics table, is the assignment target).
    _creditsPool.query(`ALTER TABLE journeys ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES product_modules(id) ON DELETE SET NULL`).then(function() {
      console.log('[a1] journeys.module_id column ready');
    }).catch(function(err) {
      console.error('[a1] journeys.module_id migration failed:', err.message);
    });

    // a1 D37 wiring: wire the real Postgres modules adapter, reusing the same
    // _creditsPool already wired for products/credits above -- a genuinely
    // new data-access layer for a genuinely new table, not an existing
    // adapter repurposed for a new query shape.
    setModulesAdapter(_creditsPool);
    console.log('[a1] modules adapter wired');

    // d1: impersonation_audit_log table -- one immutable row per impersonation
    // session start (AC3/AC4/AC6). No FK to team_memberships/people -- admin
    // and target identities are captured as plain strings/ids at write time
    // so the audit trail survives a person/tenant being later renamed or
    // removed, matching credit_audit_log's own precedent above.
    _creditsPool.query(`CREATE TABLE IF NOT EXISTS impersonation_audit_log (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id          VARCHAR,
      admin_login       VARCHAR,
      admin_tenant_id   VARCHAR NOT NULL,
      target_id         VARCHAR,
      target_login      VARCHAR NOT NULL,
      target_tenant_id  VARCHAR NOT NULL,
      reason            TEXT NOT NULL,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).then(function() {
      console.log('[d1] impersonation_audit_log table ready');
    }).catch(function(err) {
      console.error('[d1] impersonation_audit_log migration failed:', err.message);
    });

    // d3: impersonation_audit_log has no end-timestamp column in D1's merged
    // schema -- AC1/AC2 need one to distinguish completed vs in-progress
    // sessions. Additive, idempotent, nullable -- D3 never writes to it (only
    // reads); D2's exit flow is expected to write it on session exit (see
    // decisions.md ARCH entry, "d3 implementation, Task 0 investigation").
    _creditsPool.query(`ALTER TABLE impersonation_audit_log
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`).then(function() {
      console.log('[d3] impersonation_audit_log.ended_at column ready');
    }).catch(function(err) {
      console.error('[d3] impersonation_audit_log.ended_at migration failed:', err.message);
    });

    // d1 D37 wiring: wire the real Postgres impersonation audit adapter,
    // reusing the same _creditsPool already wired for products/credits/modules
    // above -- a genuinely new data-access layer for a genuinely new table,
    // not an existing adapter repurposed for a new query shape.
    setImpersonationAuditAdapter(_creditsPool);
    console.log('[d1] impersonation audit adapter wired');

    // psh-s5 D37 wiring: wire real Postgres product context adapter
    {
      setProductContextAdapter(async function(productId) {
        var r = await _creditsPool.query(
          'SELECT name, description, mission, roadmap, tech_stack, constraints, architecture_guardrails FROM products WHERE product_id = $1',
          [productId]
        );
        if (!r.rows.length) return null;
        var row = r.rows[0];
        return {
          mission: row.mission || row.description || '',
          techStack: row.tech_stack || '',
          constraints: row.constraints || '',
          roadmap: row.roadmap || '',
          architectureGuardrails: row.architecture_guardrails || ''
        };
      });
      console.log('[psh-s5] product context adapter wired');
    }

    // psh-s10 D37 wiring: wire real Postgres active standards adapter
    {
      setStandardsAdapter(async function(productId, orgId) {
        var r = await _creditsPool.query(
          `SELECT name, content FROM standards
           WHERE (product_id = $1 OR (visibility = 'org' AND org_id = $2))
             AND standard_id NOT IN (
               SELECT standard_id FROM standard_product_optouts WHERE product_id = $1
             )
           ORDER BY created_at ASC`,
          [productId, orgId]
        );
        return r.rows;
      });
      console.log('[psh-s10] standards adapter wired');
    }
  }

  // lab-s3.2 — Wire real Stripe SDK adapter (D37 mandatory separate wiring task)
  if (process.env.STRIPE_SECRET_KEY) {
    const _stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    setStripeAdapter(_stripe);
    console.log('Stripe adapter wired');
  }

  // lab-s2.2 — Wire bcrypt adapter for email/password auth (D37 mandatory separate wiring task)
  setPasswordAdapter(require('bcrypt'));
  console.log('[auth-email] bcrypt adapter wired');

  // lab-s2.2 — Wire users DB adapter (D37 mandatory separate wiring task)
  if (process.env.DATABASE_URL) {
    const { Pool: _UsersPool } = require('pg');
    const _usersPool = new _UsersPool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
    setUserDb(_usersPool);
    console.log('[auth-email] users DB adapter wired');
    // lab-s2.2/s2.3 — Auto-migrate users table on startup (CREATE TABLE IF NOT EXISTS is idempotent).
    // Schema is derived from usage: id (RETURNING id + first_login lookups), email (UNIQUE — signup
    // relies on the 23505 duplicate-key path), password_hash, and first_login (read by user-flags adapter).
    _usersPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_login   BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).then(function() {
      // Defensive: ensure first_login exists if the table pre-dated this column.
      return _usersPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT true');
    }).then(function() { console.log('users table ready'); })
      .catch(function(err) { console.error('users table migration failed:', err.message); });
  }

  // lab-s2.3 — Wire real user-flags DB adapter (D37 mandatory separate wiring task).
  // arl-s4 fix: GitHub OAuth users are never rows in the `users` table (that table is only
  // populated by email/password signup, keyed by an unrelated SERIAL id — see auth-email.js).
  // Looking up a GitHub numeric user id there always returned zero rows, so every GitHub
  // login was treated as first-login and bounced to /welcome (plan-selection/billing) forever.
  // Fix: track GitHub OAuth first-login state in its own table, keyed by GitHub user id.
  // Falls back to a no-op adapter (everyone treated as returning user) when DATABASE_URL is absent.
  if (process.env.DATABASE_URL) {
    const { Pool: _FlagsPool } = require('pg');
    const _flagsPool = new _FlagsPool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
    _flagsPool.query(`
      CREATE TABLE IF NOT EXISTS github_first_login (
        github_user_id VARCHAR PRIMARY KEY,
        first_login    BOOLEAN NOT NULL DEFAULT true
      )
    `).then(function() { console.log('github_first_login table ready'); })
      .catch(function(err) { console.error('github_first_login table migration failed:', err.message); });
    setUserFlagsAdapter({
      getFirstLoginFlag: async function(userId) {
        const result = await _flagsPool.query(
          'SELECT first_login FROM github_first_login WHERE github_user_id = $1',
          [String(userId)]
        );
        if (!result.rows.length) return true; // never seen this GitHub user before → genuinely first login
        return result.rows[0].first_login === true;
      },
      clearFirstLoginFlag: async function(userId) {
        await _flagsPool.query(
          `INSERT INTO github_first_login (github_user_id, first_login) VALUES ($1, false)
           ON CONFLICT (github_user_id) DO UPDATE SET first_login = false`,
          [String(userId)]
        );
      }
    });
    console.log('User-flags DB adapter wired');
  } else {
    // No DATABASE_URL — wire a no-op adapter (treat everyone as returning user).
    // First-login detection is effectively disabled without a DB.
    setUserFlagsAdapter({
      getFirstLoginFlag:   async function() { return false; },
      clearFirstLoginFlag: async function() {}
    });
  }

  // psh-s3 D37 wiring: wire AI draft generator for product creation
  {
    setGenerateProductDraft(async function(fields) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const name = fields.name || 'this product';
      const description = fields.description || '';

      if (!apiKey) {
        return { mission: '', roadmap: '', techStack: '', constraints: '', architectureGuardrails: '' };
      }

      const prompt = 'Generate product context files for a software product called "' + name + '".' +
        (description ? '\n\nProduct description: ' + description : '') +
        '\n\nReturn ONLY a JSON object (no markdown, no explanation) with exactly these 5 keys:\n' +
        '- mission: 2-3 sentences on what the product does and for whom\n' +
        '- roadmap: 3-5 bullet points on near-term priorities and strategic direction\n' +
        '- techStack: current or intended technology decisions and constraints (language, frameworks, infra)\n' +
        '- constraints: hard limits — budget, regulatory, team capability, timeline\n' +
        '- architectureGuardrails: key architectural decisions that must be respected (e.g. no monolith, API-first, etc.)\n\n' +
        'Each value should be a concise markdown string (1-5 sentences or bullet points). Return only the JSON.';

      const body = JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const raw = await new Promise(function(resolve, reject) {
        const req = https.request({
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }, function(res) {
          let buf = '';
          res.on('data', function(c) { buf += c; });
          res.on('end', function() { resolve(buf); });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      try {
        const parsed = JSON.parse(raw);
        const text = parsed.content && parsed.content[0] && parsed.content[0].text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const draft = JSON.parse(jsonMatch[0]);
          return {
            mission:                draft.mission || '',
            roadmap:                draft.roadmap || '',
            techStack:              draft.techStack || '',
            constraints:            draft.constraints || '',
            architectureGuardrails: draft.architectureGuardrails || ''
          };
        }
      } catch (_e) {}

      return { mission: '', roadmap: '', techStack: '', constraints: '', architectureGuardrails: '' };
    });
    console.log('[psh-s3] generateProductDraft adapter wired');
  }

  // p3.2 — Upstash Redis session persistence (see Decision 9)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const _sessionRedis = require('./adapters/session-redis');
    const { setRedisAdapter, loadSessionsFromRedis } = require('./middleware/session');
    setRedisAdapter(_sessionRedis);
    loadSessionsFromRedis().catch(function(err) {
      console.error('[server] loadSessionsFromRedis failed:', err.message);
    });

    // wsm.2 — Skill session Redis persistence: turns survive Fly.io deploys
    const _skillSessionRedis = require('./adapters/skill-session-redis');
    const { setSkillSessionRedisAdapter, readSessionFromRedis, mergeRedisSessionData } = require('./routes/skills');
    const { setReadSessionFromRedis, setMergeRedisSessionData } = require('./routes/journey');
    setSkillSessionRedisAdapter(_skillSessionRedis);
    setReadSessionFromRedis(readSessionFromRedis);
    setMergeRedisSessionData(mergeRedisSessionData);
  }
}

// sec-perf AC1 — rate limiter for SSE turn endpoint (30 turns/min per tenant)
// Declared at module scope so it is accessible inside the request router (outside the wiring if-block).
const { createRateLimiter } = require('./middleware/rate-limiter');
const _turnStreamRateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60000 });

// Wire real GitHub pipeline-state fetcher for production (non-test) mode.
// Fetches .github/pipeline-state.json from the given owner/repo using the user's token.
if (process.env.NODE_ENV !== 'test') {
  // Wire real GitHub Contents API for listing artefacts in a feature directory.
  setFetchArtefactDirectory(async (owner, repo, featureSlug, token) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/artefacts/${featureSlug}`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'application/vnd.github.v3+json'
        }
      });
    } catch (err) {
      console.error('[artefact-list] network error fetching artefact directory', err.message);
      return null;
    }
    if (!response.ok) {
      console.warn('[artefact-list] artefact directory fetch failed', response.status, owner, repo, featureSlug);
      return null;
    }
    return response.json();
  });

  setFetchPipelineState(async (owner, repo, token) => {
    // Local-first: read from disk when running locally so in-flight branch work is visible.
    const _fs        = require('fs');
    const _repoRoot  = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
    const _localPath = _path.join(_repoRoot, '.github', 'pipeline-state.json');
    if (_fs.existsSync(_localPath)) {
      try {
        return JSON.parse(_fs.readFileSync(_localPath, 'utf8'));
      } catch (e) {
        console.warn('[feature-list] local pipeline-state parse error, falling back to GitHub API', e.message);
      }
    }

    // Remote fallback: fetch from GitHub API (used in production / remote repos)
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/.github/pipeline-state.json`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'application/vnd.github.v3+json'
        }
      });
    } catch (err) {
      console.error('[feature-list] network error fetching pipeline-state', err.message);
      return null;
    }
    if (!response.ok) {
      console.warn('[feature-list] pipeline-state fetch failed', response.status, owner, repo);
      return null;
    }
    const data = await response.json();
    const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    return JSON.parse(decoded);
  });
}

// p1.1: Wire real GitHub org-fetch for tenant resolution (D37 rule 3 — separate wiring task)
if (process.env.NODE_ENV !== 'test') {
  setFetchOrgs(async function(accessToken, page) {
    const url = GITHUB_API_BASE + '/user/orgs?per_page=100&page=' + (page || 1);
    const response = await fetch(url, {
      headers: {
        'Authorization': 'token ' + accessToken,
        'Accept':        'application/json',
        'User-Agent':    'skills-pipeline-web-ui'
      }
    });
    if (!response.ok) {
      throw new Error('GitHub orgs fetch failed: ' + response.status);
    }
    const orgs = await response.json();
    const link = response.headers.get('link') || '';
    const nextMatch = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="next"/);
    const nextPage = nextMatch ? parseInt(nextMatch[1], 10) : null;
    return { orgs: orgs, nextPage: nextPage };
  });
}

// tir-s8: Wire real GitHub org-MEMBERS fetch for bulk-add (D37 rule 3 — separate wiring
// task). Distinct from setFetchOrgs above (GET /user/orgs -- orgs a token belongs to);
// this calls GET /orgs/{org}/members -- the actual members of one specific org, given its
// name. Reuses the exact same link-header rel="next" pagination-parsing pattern as
// setFetchOrgs's own wiring, per the DoR contract (don't invent a new parser).
if (process.env.NODE_ENV !== 'test') {
  setFetchOrgMembers(async function(orgName, accessToken, page) {
    const url = GITHUB_API_BASE + '/orgs/' + encodeURIComponent(orgName) + '/members?per_page=100&page=' + (page || 1);
    const response = await fetch(url, {
      headers: {
        'Authorization': 'token ' + accessToken,
        'Accept':        'application/json',
        'User-Agent':    'skills-pipeline-web-ui'
      }
    });
    if (!response.ok) {
      throw new Error('GitHub org members fetch failed: ' + response.status);
    }
    const members = await response.json();
    const link = response.headers.get('link') || '';
    const nextMatch = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="next"/);
    const nextPage = nextMatch ? parseInt(nextMatch[1], 10) : null;
    return { members: members, nextPage: nextPage };
  });
}

// owle.6: Wire pipeline-state auto-writer (runs on every gate-confirm success)
{
  const repoRootForAdapter = process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..');
  if (process.env.NODE_ENV === 'test') {
    setPipelineStateWriter(function() {}); // no-op in test mode
  } else {
    setPipelineStateWriter(pipelineStateWriterFactory(repoRootForAdapter));
  }
}

// cdg.4: Wire validate adapter — DoR gate-confirm enforcement (D37 mandatory separate wiring)
{
  if (process.env.NODE_ENV === 'test') {
    setValidate(function() { return { exitCode: 0 }; }); // no-op in test mode
  } else {
    setValidate(require('../enforcement/cli-outer-loop').validate);
  }
}

// cdg.5: Wire writeTrace adapter -- gate-confirm chain-hash trace emission (D37 mandatory separate wiring)
{
  if (process.env.NODE_ENV === 'test') {
    setWriteTrace(function() {}); // no-op in test mode
  } else {
    setWriteTrace(require('../enforcement/governance-package').writeTrace);
  }
}

// ── Test-mode infrastructure (NODE_ENV=test only) ─────────────────────────
// Pre-seed a well-known test session and override the artefact fetcher with
// fixture files so E2E tests can authenticate and render artefacts without
// hitting the real GitHub API.
//
// E2E_SESSION_ID is a 64-char hex string that Playwright's auth fixture
// injects as the `session_id` cookie.  The session has an accessToken so
// the authGuard passes on every protected route.
//
// SECURITY: The seeded token ('e2e-test-access-token') is not a real GitHub
// credential.  The test fetcher is never active outside NODE_ENV=test.
if (process.env.NODE_ENV === 'test') {
  const { seedTestSession }          = require('./middleware/session');
  const { setFetcher }               = require('./routes/artefact');
  const { ArtefactNotFoundError }    = require('./adapters/artefact-fetcher');
  const _fs   = require('fs');
  const _path = require('path');

  // stis-s1: no-op git-commit adapter in test mode. The shared e2e webServer
  // subprocess drives handlePostTurnStreamHtml through completed mock-gateway
  // artefact turns (discovery/design/definition/etc. success fixtures all
  // contain ---ARTEFACT-START---/---ARTEFACT-END--- markers) with no way for
  // an HTTP-driven Playwright spec to call setSkillTurnGitCommitAdapter()
  // directly. Without this, every e2e run that completes a stage would fire
  // a real git commit into this checkout — reproducing the exact defect this
  // story exists to fix. See decisions.md (stis-s1 finding, beyond original
  // DoR-contract scope — found by this story's own exhaustive AC3 search).
  const { setSkillTurnGitCommitAdapter } = require('./routes/skills');
  setSkillTurnGitCommitAdapter(function stisS1NoOpGitCommitTestMode() { /* no-op in test mode */ });

  // Well-known session ID shared between server and auth fixture.
  const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';
  seedTestSession(E2E_SESSION_ID, {
    accessToken: 'e2e-test-access-token',
    userId:      9999,
    login:       'e2e-tester',
    tenantId:    'e2e-tester', // bri-s3.5: tenant-scoped billing/plan-state routes need this
  });

  // bri-s3.4: wire the GET /journeys (bee.2) aggregate-list D37 adapter in
  // test mode too. It previously only got wired inside the
  // WIRE_SKILL_ADAPTERS-gated block further up this file, so /journeys threw
  // "Adapter not wired: _listJourneys" for every NODE_ENV=test run -- a
  // pre-existing gap this story's cross-tenant-isolation E2E spec surfaced
  // (AC2 needs to confirm the aggregate journey list never leaks tenant B
  // rows). No external dependency here (same journey-store module already
  // used by the production wiring; falls back to its in-memory map when no
  // disk/pg adapter is set, which is always the case in NODE_ENV=test) --
  // safe to wire unconditionally.
  {
    const _journeyStoreForTest = require('./modules/journey-store');
    setListJourneys(async function(tenantId) {
      var all = _journeyStoreForTest.listJourneys();
      return tenantId ? all.filter(function(j) { return j.tenantId === tenantId; }) : all;
    });
  }

  // Fixture fetcher: serves <type>-sample.md for the canonical test slug;
  // throws ArtefactNotFoundError for any other slug (exercises the 404 path).
  const FIXTURE_DIR  = _path.join(__dirname, '../../tests/fixtures/markdown');
  const TEST_SLUG    = '2026-05-02-web-ui-copilot-execution-layer';
  setFetcher(function e2eTestFetcher(slug, artefactType) {
    if (slug !== TEST_SLUG) {
      return Promise.reject(new ArtefactNotFoundError(slug, artefactType));
    }
    const fixturePath = _path.join(FIXTURE_DIR, artefactType + '-sample.md');
    if (!_fs.existsSync(fixturePath)) {
      return Promise.reject(new ArtefactNotFoundError(slug, artefactType));
    }
    return Promise.resolve(_fs.readFileSync(fixturePath, 'utf8'));
  });

  // ── Stub skill turn stream adapter (NODE_ENV=test) ───────────────────────
  // Wires a canned streaming response so the definition canvas can be driven
  // from the browser without a real model API call or GitHub token.
  // Submit any turn in the chat and the stub returns a fixed definition artefact.
  const { setSkillTurnExecutorStreamAdapter } = require('./routes/skills');
  const _STUB_ARTEFACT = [
    '# Definition — Stub Feature',
    '',
    '**Slicing strategy:** vertical',
    '',
    '## Epic 1 — Platform Core',
    '',
    '### s.1 — Set up repository',
    '',
    'Complexity: 1',
    '',
    '### s.2 — Configure CI pipeline',
    '',
    'Complexity: 2',
    '',
    '## Epic 2 — Operator Tools',
    '',
    '### s.3 — Build operator dashboard',
    '',
    'Complexity: 2',
    '',
    '### s.4 — Add export feature',
    '',
    'Complexity: 1',
    '',
    '---ARTEFACT-COMPLETE---',
  ].join('\n');

  setSkillTurnExecutorStreamAdapter(function stubSkillTurnStream(_sys, _hist, _user, _token, onChunk) {
    // Stream the stub artefact in small chunks to exercise the chunked display path
    const words = _STUB_ARTEFACT.split(' ');
    let i = 0;
    return new Promise(function(resolve) {
      function next() {
        if (i >= words.length) { resolve(_STUB_ARTEFACT); return; }
        const chunk = (i === 0 ? '' : ' ') + words[i++];
        onChunk(chunk);
        setTimeout(next, 8);
      }
      next();
    });
  });

  // lab-s3.3: wire unlimited credits in test mode so existing E2E tests are not blocked by the guard
  setCreditsAdapter({ query: async () => ({ rows: [{ balance: 9999 }] }) });

  // lab-s3.4: no-op webhook DB in test mode — rowCount=1 so each event appears as new (not a duplicate)
  // The check-lab-s3.4-stripe-webhook.js unit tests inject their own mock directly via setWebhookDbAdapter().
  setWebhookDbAdapter({ query: async function() { return { rows: [], rowCount: 1 }; } });

  // jlc-s1: fake, in-process Postgres-shaped adapter for tenant_plan in test mode. Unlike the
  // credits stub above (stateless — always returns a fixed balance), this one must be stateful:
  // the @mocked/@billing E2E spec (bri-s3.5-billing-journey.spec.js) drives real upgrade →
  // payment-failure → cancellation transitions across multiple HTTP requests within the same
  // server process and asserts the plan state actually changed between them. A Map-backed fake
  // that understands the same INSERT/SELECT/DELETE shapes tenant-plan.js issues against a real
  // Postgres pool preserves that behavior without needing a real DB in this test variant.
  (function() {
    var _testPlanRows = new Map();
    setPlanStateAdapter({
      query: async function(sql, params) {
        if (sql.indexOf('INSERT INTO tenant_plan') !== -1) {
          _testPlanRows.set(params[0], { plan: params[1], status: params[2] });
          return { rows: [], rowCount: 1 };
        }
        if (sql.indexOf('SELECT plan, status FROM tenant_plan') !== -1) {
          var row = _testPlanRows.get(params[0]);
          return { rows: row ? [{ plan: row.plan, status: row.status }] : [] };
        }
        if (sql.indexOf('DELETE FROM tenant_plan') !== -1) {
          _testPlanRows.clear();
          return { rows: [], rowCount: 0 };
        }
        return { rows: [] };
      }
    });
  })();

  // bri-s3.5: fake Stripe adapter in test mode so the @mocked/@billing E2E spec can
  // drive POST /webhook/stripe with synthetic event payloads. No real Stripe secret
  // is ever available in this variant, so a real signature cannot be constructed —
  // constructEvent simply parses the raw request body as the event object, mirroring
  // the same synthetic-event pattern check-lab-s3.4-stripe-webhook.js's unit tests
  // already use via monkeypatched adapters. checkout/portal session creation still
  // throw — the E2E spec never calls /billing/checkout, so this only guards against
  // an accidental real-looking call slipping through unnoticed (AC5).
  setStripeAdapter({
    webhooks: {
      constructEvent: function(rawBody) { return JSON.parse(rawBody.toString()); }
    },
    checkout: { sessions: { create: async function() {
      throw new Error('Real Stripe Checkout must not be invoked in NODE_ENV=test');
    } } },
    billingPortal: { sessions: { create: async function() {
      throw new Error('Real Stripe Billing Portal must not be invoked in NODE_ENV=test');
    } } }
  });

  // lab-s2.3: wire user-flags adapter in test mode — per-user in-memory tracking that
  // mirrors the real github_first_login table semantics (bri-s3.6): an id never seen
  // before is first-login=true; clearFirstLoginFlag marks it false for all subsequent
  // logins. This lets the E2E auth journey spec browser-drive both the first-time
  // (/welcome) and returning (/dashboard) paths using the same synthetic identity,
  // exactly as its own verification script's Scenario 1/2 do. No existing E2E spec
  // calls getFirstLoginFlag (only reachable via the real /auth/github/callback route),
  // so this replaces the prior blanket 'always false' stub without affecting other specs.
  const _bri36FirstLoginCleared = new Set();
  setUserFlagsAdapter({
    getFirstLoginFlag:   async function(userId) { return !_bri36FirstLoginCleared.has(String(userId)); },
    clearFirstLoginFlag: async function(userId) { _bri36FirstLoginCleared.add(String(userId)); }
  });

  // bri-s3.6: deterministic GitHub OAuth exchange stub (test mode only) — lets the E2E
  // auth journey spec drive the real /auth/github -> /auth/github/callback redirect
  // chain without ever contacting github.com. The authorisation `code` value IS the
  // synthetic GitHub login name, so a spec can reuse the same code across two logins
  // (first-time, then returning) to exercise both AC1 and AC2 with one identity.
  // AC5: this is the "provider exchange stubbed" half of the @mocked contract — the
  // real gitHubProviderAdapter (which calls fetch() against github.com) is replaced,
  // so a global.fetch/network spy during the E2E run records zero real calls.
  setProviderAdapter({
    exchangeCode: async function(code) { return 'e2e-oauth-token-' + code; },
    getUserIdentity: async function(token) {
      const login = String(token).replace(/^e2e-oauth-token-/, '');
      let id = 0;
      for (let i = 0; i < login.length; i++) { id = (id * 31 + login.charCodeAt(i)) % 900000; }
      return { id: 900000000 + id, login: login };
    }
  });

  // bri-s3.3: wire org fetch for TENANT_ORG_ALLOWLIST mode in test
  // (returns the allowlist orgs as if the user is a member of all of them).
  // In production, this is wired above (NODE_ENV !== 'test').
  setFetchOrgs(async function() {
    const allowlist = process.env.TENANT_ORG_ALLOWLIST || '';
    const orgs = allowlist.split(',').map(function(s) { return s.trim(); }).filter(Boolean).map(function(name) { return { login: name }; });
    return { orgs: orgs, nextPage: null };
  });

  // bri-s3.2: wire the real bcrypt password adapter and the real (non-streaming)
  // skill-turn executor even in NODE_ENV=test. Both blocks below normally live
  // behind the `WIRE_SKILL_ADAPTERS=true` gate (see the big conditional near
  // the top of this file) because most of what that gate wires needs a real
  // DB/Stripe/GitHub token. These two do not: bcrypt is pure crypto with no
  // external dependency, and the real skillTurnExecutor's `meta.stage` routing
  // is exactly what lets it defer to S3.1's mock LLM gateway (isMockGatewayEnabled()
  // is already true in NODE_ENV=test) instead of a real provider — so wiring it
  // here does not risk a real network call. This lets the @mocked signup ->
  // onboarding -> first-feature journey spec (bri-s3.2) exercise the REAL
  // signup and chat-turn handlers without needing WIRE_SKILL_ADAPTERS at all.
  setPasswordAdapter(require('bcrypt'));
  {
    const { setSkillTurnExecutorAdapter: _setRealTurnExecutor } = require('./routes/skills');
    const { skillTurnExecutor: _realTurnExecutorForTest } = require('../modules/skill-turn-executor');
    _setRealTurnExecutor(_realTurnExecutorForTest);
  }
  // bri-s3.2: bri-s3.1 built the mock LLM gateway as its own D37 adapter
  // (mock-llm-gateway.js's _mockGatewayClient) but nothing in server.js ever
  // called wireDefaultMockGatewayClient() — so isMockGatewayEnabled() being
  // true was not sufficient on its own; getMockResponse() still threw
  // "Adapter not wired: mockGatewayClient" for every chat turn. Wiring the
  // built-in fixture-file-backed client here (test mode only) is what
  // actually makes the @mocked gateway usable end-to-end.
  {
    const _mockLlmGatewayForTest = require('./modules/mock-llm-gateway');
    if (_mockLlmGatewayForTest.isMockGatewayEnabled()) {
      _mockLlmGatewayForTest.wireDefaultMockGatewayClient();
    }
  }
  // bri-s3.2: wire the real generateProductDraft adapter too — it already
  // no-ops (returns a blank draft, zero network calls) when ANTHROPIC_API_KEY
  // is unset, which it deliberately is not set to in the shared E2E webServer
  // env. Needed so POST /products/new (the "Generate context files" step)
  // does not throw "Adapter not wired" for the bri-s3.2 product-creation spec.
  setGenerateProductDraft(async function(fields) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { mission: '', roadmap: '', techStack: '', constraints: '', architectureGuardrails: '' };
    }
    // Real-key path intentionally left unimplemented here — this test-mode
    // wiring only exists to satisfy the D37 "must be wired" adapter contract
    // when ANTHROPIC_API_KEY is absent, which is always true in E2E CI.
    return { mission: '', roadmap: '', techStack: '', constraints: '', architectureGuardrails: '' };
  });

  // bri-s3.2: in-memory fake users/products DB for NODE_ENV=test when no real
  // DATABASE_URL is configured. Lets the REAL email/password signup
  // (routes/auth-email.js) and REAL product-creation/dashboard handlers
  // (routes/products.js) run end-to-end in the @mocked Playwright suite
  // without needing a live Postgres instance. No-op when DATABASE_URL is set
  // (that branch already wires the real Pool above and takes precedence).
  if (!process.env.DATABASE_URL) {
    const { createFakeTestDb } = require('./adapters/fake-test-db');
    const _fakeTestDb = createFakeTestDb();
    setUserDb(_fakeTestDb);
    _pshPool = _fakeTestDb;
    console.log('[bri-s3.2] fake in-memory users/products DB wired (NODE_ENV=test, no DATABASE_URL)');
  }

  // bri-s3.2 AC5: real-LLM-call counter. Wraps https.request so an @mocked E2E
  // spec can assert zero real calls were made to the Anthropic or Copilot
  // Chat Completions APIs during the whole spec file's run, via
  // GET /test/real-llm-call-count. Only counts calls whose hostname matches
  // a real LLM provider — never affects the call itself (always forwards to
  // the original https.request).
  {
    let _realLlmCallCount = 0;
    const _origHttpsRequest = https.request;
    https.request = function(options) {
      const hostname = (options && (options.hostname || options.host)) || '';
      if (hostname === 'api.anthropic.com' || String(hostname).indexOf('githubcopilot.com') !== -1) {
        _realLlmCallCount++;
      }
      return _origHttpsRequest.apply(https, arguments);
    };
    global.__BRI_S3_2_REAL_LLM_CALL_COUNT__ = function() { return _realLlmCallCount; };
  }
}

/** Parse query parameters from a URL into a plain object. */
function parseQuery(searchParams) {
  const result = {};
  for (const [key, val] of searchParams.entries()) {
    result[key] = val;
  }
  return result;
}

/**
 * Route and handle an incoming request.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function router(req, res) {
  const parsed   = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  req.query = parseQuery(parsed.searchParams);

  // ── Test-mode session-seed endpoint (NODE_ENV=test only) ─────────────────
  // Must be handled BEFORE sessionMiddleware to avoid a double Set-Cookie.
  // Playwright's withAuth fixture calls this to re-seed the test session
  // (handles cases where a prior test consumed/mutated it, e.g. via logout).
  if (pathname === '/test/session' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const { seedTestSession } = require('./middleware/session');
    // bri-s3.5: optional ?sessionId=&tenantId= overrides let a spec seed an isolated
    // session (its own cookie, its own tenant) instead of the shared default — used
    // by the billing journey spec's usage-gate scenario so a per-tenant journey cap
    // doesn't collide with other spec files that share the default e2e-tester tenant.
    // Callers that omit both query params get the original, unchanged default session.
    const sessionId = (req.query && req.query.sessionId) || ('e2e' + '0'.repeat(60) + '1');
    const tenantId  = (req.query && req.query.tenantId) || 'e2e-tester';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId:      9999,
      login:       'e2e-tester',
      tenantId:    tenantId,
    });
    // Return Set-Cookie so Playwright's APIRequestContext (page.request) stores
    // the session cookie in its own cookie jar. Without this, page.request.post()
    // doesn't send the cookie because APIRequestContext has a separate cookie store
    // from the browser context that context.addCookies() fills.
    // No Secure flag — we run on HTTP in test mode; SameSite=Lax allows API calls.
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `session_id=${sessionId}; HttpOnly; SameSite=Lax; Path=/`,
    });
    res.end(JSON.stringify({ sessionId: sessionId, login: 'e2e-tester' }));
    return;
  }

  // dic-canvas E2E: seed a definition session with stub artefact content
  if (pathname === '/test/seed-definition-session' && req.method === 'POST' && process.env.NODE_ENV === 'test') {
    const { _setHtmlSession } = require('./routes/skills');
    const _uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const _sessionId = 'def-e2e-' + _uid;
    _setHtmlSession(_sessionId, {
      skillName:      'definition',
      sessionPath:    null,
      systemPrompt:   'test',
      turns:          [],
      artefactContent: [
        '# Definition — E2E Canvas Test Feature',
        '',
        '**Slicing strategy:** vertical',
        '',
        '## Epic 1 — Platform Core',
        '',
        '### s.1 — Set up repo',
        '',
        'Complexity: 1',
        '',
        '### s.2 — Configure CI',
        '',
        'Complexity: 2',
        '',
        '## Epic 2 — Operator Tools',
        '',
        '### s.3 — Build dashboard',
        '',
        'Complexity: 2',
        '',
      ].join('\n'),
      artefactPath:   null,
      done:           false,
      journeyId:      null,
      phaseModel:     [{ name: 'Phase 1 (current)', isCurrent: true }],
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessionId: _sessionId }));
    return;
  }

  // ── /test/canvas — one-shot browser shortcut (NODE_ENV=test only) ──────────
  // GET this URL in the browser to:
  //   1. authenticate as e2e-tester (no GitHub OAuth needed)
  //   2. seed a definition session with stub artefact content
  //   3. redirect straight to the canvas chat page
  // The stub skill-turn adapter (wired above) returns a canned definition
  // artefact when you submit any turn, so the full drag/add/apply flow is
  // testable without a real model API call or GitHub token.
  if (pathname === '/test/canvas' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const { seedTestSession } = require('./middleware/session');
    const { _setHtmlSession } = require('./routes/skills');
    const E2E_SESSION_ID = 'e2e' + '0'.repeat(60) + '1';
    seedTestSession(E2E_SESSION_ID, {
      accessToken: 'e2e-test-access-token',
      userId:      9999,
      login:       'e2e-tester',
      tenantId:    'e2e-tester', // bri-s3.5: tenant-scoped billing/plan-state routes need this
    });
    const _uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const _defSessionId = 'def-e2e-' + _uid;
    _setHtmlSession(_defSessionId, {
      skillName:      'definition',
      sessionPath:    null,
      systemPrompt:   'test',
      turns:          [],
      artefactContent: [
        '# Definition — Stub Canvas Feature',
        '',
        '**Slicing strategy:** vertical',
        '',
        '## Epic 1 — Platform Core',
        '',
        '### s.1 — Set up repository',
        '',
        'Complexity: 1',
        '',
        '### s.2 — Configure CI pipeline',
        '',
        'Complexity: 2',
        '',
        '## Epic 2 — Operator Tools',
        '',
        '### s.3 — Build operator dashboard',
        '',
        'Complexity: 2',
        '',
        '### s.4 — Add export feature',
        '',
        'Complexity: 1',
        '',
      ].join('\n'),
      artefactPath:   null,
      done:           false,
      journeyId:      null,
      phaseModel:     [{ name: 'Phase 1 (current)', isCurrent: true }],
    });
    res.writeHead(302, {
      'Location':   `/skills/definition/sessions/${_defSessionId}/chat`,
      'Set-Cookie': `session_id=${E2E_SESSION_ID}; HttpOnly; SameSite=Lax; Path=/`,
    });
    res.end();
    return;
  }

  // bri-s3.5 AC5 — test-only Stripe call-count spy read. Lets the @mocked/@billing
  // E2E spec assert zero real Stripe API calls happened during the billing journey
  // (NODE_ENV=test guard mirrors every other /test/* endpoint above).
  if (pathname === '/test/stripe-call-count' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const { getCheckoutCallCount } = require('./modules/stripe-client');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: getCheckoutCallCount() }));
    return;
  }

  // Attach session before routing
  sessionMiddleware(req, res);

  // bri-s3.2 AC1: test-only onboarding-gate bypass (NODE_ENV=test only).
  // The real plan-selection step at /welcome requires a live Stripe Checkout
  // round-trip — out of scope for this journey-testing spec (owned by
  // lab-s3.2's billing story) and unsafe to exercise for real in CI. This
  // lets the @mocked signup->dashboard spec simulate "plan selected" for the
  // just-created session without touching Stripe. Mirrors the existing
  // /test/session and /test/seed-definition-session test-infrastructure
  // pattern above — gated identically, never reachable outside NODE_ENV=test.
  if (pathname === '/test/complete-onboarding' && req.method === 'POST' && process.env.NODE_ENV === 'test') {
    if (req.session) { req.session.firstLogin = false; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // bri-s3.2 AC5: exposes the real-LLM-call counter (wired above) so an
  // @mocked E2E spec can assert zero real calls were made to the Anthropic or
  // Copilot Chat Completions APIs across its whole run.
  if (pathname === '/test/real-llm-call-count' && req.method === 'GET' && process.env.NODE_ENV === 'test') {
    const count = typeof global.__BRI_S3_2_REAL_LLM_CALL_COUNT__ === 'function'
      ? global.__BRI_S3_2_REAL_LLM_CALL_COUNT__()
      : 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: count }));
    return;
  }

  // bri-s3.3: Seed person_identities and team_memberships for multi-user testing
  // Allows E2E tests to set up alice/bob with different roles before they log in
  if (pathname === '/test/seed-multi-user-roles' && req.method === 'POST' && process.env.NODE_ENV === 'test') {
    try {
      var body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async function() {
        try {
          var seedData = JSON.parse(body || '{}');
          var sharedOrg = seedData.sharedOrg || 'shared-org';

          // Use _pshPool if available (both real and fake-test-db implement the same query interface)
          // _pshPool is set by both the real Pool and by fake-test-db wiring
          if (_pshPool) {
            // alice: admin role in shared org
            await _pshPool.query('INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)', ['alice', 101, 'github']).catch(function() {});
            await _pshPool.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [101, sharedOrg, 'admin']).catch(function() {});

            // bob: engineer role in shared org
            await _pshPool.query('INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)', ['bob', 102, 'github']).catch(function() {});
            await _pshPool.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [102, sharedOrg, 'engineer']).catch(function() {});

            // viewer: viewer role in shared org
            await _pshPool.query('INSERT INTO person_identities (identity_key, person_id, provider) VALUES ($1, $2, $3)', ['viewer', 103, 'github']).catch(function() {});
            await _pshPool.query('INSERT INTO team_memberships (person_id, tenant_id, role) VALUES ($1, $2, $3)', [103, sharedOrg, 'viewer']).catch(function() {});
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ seeded: true, sharedOrg: sharedOrg }));
        } catch (e) {
          console.error('[bri-s3.3] seed-multi-user-roles error:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } catch (e) {
      console.error('[bri-s3.3] seed-multi-user-roles setup error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (pathname === '/auth/github' && req.method === 'GET') {
    await handleAuthGithub(req, res);

  } else if (pathname === '/auth/github/callback' && req.method === 'GET') {
    await handleAuthCallback(req, res);

  } else if (pathname === '/auth/google' && req.method === 'GET') {
    // lab-s2.1 — Google OAuth initiation
    await handleAuthGoogle(req, res);

  } else if (pathname === '/auth/google/callback' && req.method === 'GET') {
    // lab-s2.1 — Google OAuth callback
    await handleAuthGoogleCallback(req, res);

  } else if (pathname === '/auth/logout' && req.method === 'GET') {
    await handleLogout(req, res);

  } else if (pathname === '/sign-off' && req.method === 'POST') {
    authGuard(req, res, () => handleSignOff(req, res));

  } else if (pathname === '/api/actions' && req.method === 'GET') {
    await handleGetActions(req, res);

  } else if (pathname === '/dashboard') {
    if (_pshPool) {
      authGuard(req, res, async () => { await _handleGetDashboard(req, res, null, _pshPool); });
    } else {
      handleDashboard(req, res);
    }

  } else if (pathname.match(/^\/artefact\/[^/]+\/[^/]+$/) && req.method === 'GET') {
    const parts        = pathname.split('/').filter(Boolean);
    const slug         = parts[1];
    const artefactType = parts[2];
    await handleArtefactRoute(req, res, slug, artefactType);

  } else if (pathname === '/health') {
    healthCheckHandler(req, res);

  } else if (pathname === '/api/ideas' && req.method === 'GET') {
    authGuard(req, res, () => handleGetIdeas(req, res));

  } else if (pathname === '/api/ideas' && req.method === 'POST') {
    authGuard(req, res, async () => { await handlePostIdea(req, res); });

  } else if (pathname.match(/^\/api\/ideas\/[^/]+$/) && req.method === 'DELETE') {
    const ideaId = decodeURIComponent(pathname.slice('/api/ideas/'.length));
    authGuard(req, res, () => handleDeleteIdea(req, res, ideaId));

  } else if (pathname.startsWith('/features/') && req.method === 'GET') {
    const featureSlug = pathname.slice('/features/'.length);
    authGuard(req, res, async () => {
      await handleGetFeatureArtefacts(req, res, featureSlug);
    });

  } else if (pathname.startsWith('/api/artefacts/') && pathname.endsWith('/annotations') && req.method === 'POST') {
    authGuard(req, res, async () => {
      await handlePostAnnotation(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/execute$/) && req.method === 'POST') {
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    await handleExecuteSkill(req, res);

  } else if (pathname === '/skills' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetSkillsHtml(req, res);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/commit-preview$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => { await handleGetCommitPreviewHtml(req, res); });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/complete$/) && req.method === 'GET') {
    // dsq.3 — post-session /clarify gate page
    const parts = pathname.split('/');
    const skillName = decodeURIComponent(parts[2]);
    const sessionId = decodeURIComponent(parts[4]);
    authGuard(req, res, async () => {
      const html = htmlGetCompletePage(skillName, sessionId);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/result$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => { await handleGetResultHtml(req, res); });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/chat$/) && req.method === 'GET') {
    // mfc.1 — model-first chat page (replaces /next form flow)
    const parts = pathname.split('/');
    req.params = { name: parts[2], id: parts[4] };
    authGuard(req, res, async () => {
      await handleGetChatHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/turn$/) && req.method === 'POST') {
    // mfc.1 — model turn endpoint
    // lab-s3.3: creditsGuard mounted between authGuard and handler — balance check fires before Anthropic call
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      let _cgOk = false;
      await creditsGuard(req, res, () => { _cgOk = true; });
      if (!_cgOk) return;
      await handlePostTurnHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/turn-stream$/) && req.method === 'POST') {
    // mfc.3 — streaming model turn endpoint (SSE)
    // sec-perf AC1: rate-limited to 30 turns/min per tenant to prevent Anthropic API abuse
    // lab-s3.3: creditsGuard mounted between authGuard and handler — balance check fires before Anthropic call
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      let _cgOk = false;
      await creditsGuard(req, res, () => { _cgOk = true; });
      if (!_cgOk) return;
      let _rlOk = false;
      _turnStreamRateLimiter(req, res, () => { _rlOk = true; });
      if (!_rlOk) return;
      await handlePostTurnStreamHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/canvas-edit$/) && req.method === 'POST') {
    // dic.5 — canvas-edit dispatch endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      await handlePostCanvasEditHtml(req, res);
    });

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/assumption\/[^/]+\/confirm$/) && req.method === 'POST') {
    // iwu.4 — confirm/flag assumption card endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5], cardId: parts[7] };
    authGuard(req, res, async () => {
      await handlePostAssumptionConfirm(req, res);
    });

  } else if (pathname.match(/^\/skills\/[^/]+\/sessions\/[^/]+\/next$/) && req.method === 'GET') {
    // backward-compat: redirect /next to /chat
    const parts = pathname.split('/');
    const skillNameBc = decodeURIComponent(parts[2]);
    const sessionIdBc = decodeURIComponent(parts[4]);
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillNameBc) + '/sessions/' + encodeURIComponent(sessionIdBc) + '/chat' });
    res.end();

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answer$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      await handlePostAnswerHtml(req, res);
    });

  } else if (pathname === '/api/skills' && req.method === 'GET') {
    await handleGetSkills(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions$/) && req.method === 'POST') {
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    const ct = (req.headers['content-type'] || '');
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => { await handlePostSkillSessionHtml(req, res); });
    } else {
      await handlePostSession(req, res);
    }

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answers$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handlePostAnswer(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/state$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handleGetSessionState(req, res);

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/commit$/) && req.method === 'POST') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    const ct = (req.headers['content-type'] || '');
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => { await handlePostCommitHtml(req, res); });
    } else {
      await handleCommitArtefact(req, res);
    }

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/resume$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    await handleResumeSession(req, res);

  } else if (pathname === '/journey/wizard' && req.method === 'POST') {
    // wucp.4 — wizard feature selection POST
    await handlePostWizardSelection(req, res);

  } else if (pathname === '/journey/wizard' && req.method === 'GET') {
    // bri-s1.5 — live GET route for the session-start wizard, wired to the
    // bootstrapped entry point (bri-s1.3's handleGetWizardBootstrapped) so the
    // wizard-ui flag is resolved server-side before the gated wizard-canvas
    // element is rendered. This route previously had no live GET registration
    // at all (see decisions.md, "handleGetWizard/handleGetWizardBootstrapped
    // are not currently reachable via any live HTTP route") — wiring it here is
    // this story's AC1 completion: the wizard-ui flag now gates a real,
    // reachable page, not just a directly-testable handler function.
    authGuard(req, res, async function() { await handleGetWizardBootstrapped(req, res); });

  } else if (pathname === '/journeys' && req.method === 'GET') {
    // bee.2 — first-run empty-state experience
    authGuard(req, res, async function() { await handleJourneys(req, res); });

  } else if (pathname === '/journey' && req.method === 'GET') {
    // jdsk.1 — journey home screen (replaces old wizard-first routing)
    {
      handleGetJourney(req, res);
    }

  } else if (pathname.match(/^\/journey\/[^/]+\/resume$/) && req.method === 'GET') {
    // step4 — resume journey: create new session for current stage
    req.params = { featureSlug: pathname.split('/')[2] };
    await handleGetJourneyResume(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/stage-review$/) && req.method === 'GET') {
    // step5 — artefact review panel before gate-confirm
    req.params = { journeyId: pathname.split('/')[2] };
    await handleGetStageReview(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/reference$/) && req.method === 'GET') {
    // step7 — reference docs list + upload form
    req.params = { journeyId: pathname.split('/')[2] };
    await handleGetReference(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference$/) && req.method === 'POST') {
    // step7 — save reference doc
    req.params = { journeyId: pathname.split('/')[3] };
    await handlePostReference(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/reference-modal$/) && req.method === 'GET') {
    // sdg.1 — strategy grounding modal (new-product upload gate)
    req.params = { journeyId: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetReferenceModal(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-upload$/) && req.method === 'POST') {
    // sdg.1 — reference file upload handler (JSON body: {files:[{name,size,contentBase64}]})
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handlePostReferenceUpload(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-modal\/start$/) && req.method === 'GET') {
    // sdg.1 — start first skill session after upload modal
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handleGetReferenceModalStart(req, res); });

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/reference-modal\/skip$/) && req.method === 'POST') {
    // sdg.1 — skip strategy grounding and proceed to first skill
    req.params = { journeyId: pathname.split('/')[3] };
    authGuard(req, res, async () => { await handlePostReferenceModalSkip(req, res); });

  } else if (pathname === '/api/journey' && req.method === 'POST') {
    // ougl.3 — start journey + discovery session
    await handlePostJourney(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/gate-confirm$/) && req.method === 'POST') {
    // ougl.5 — gate-confirm: save artefact and advance to next stage
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    await handlePostGateConfirm(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/stories$/) && req.method === 'GET') {
    // ougl.6 — per-story stage routing: story list entry form
    const journeyIdPart = pathname.split('/')[2];
    req.params = { journeyId: journeyIdPart };
    await handleGetStories(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/stories$/) && req.method === 'POST') {
    // ougl.6 — per-story stage routing: set story list + start test-plan
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    await handlePostStories(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/complete$/) && req.method === 'GET') {
    // ougl.7 — journey completion screen
    const journeyIdPart = pathname.split('/')[2];
    req.params = { journeyId: journeyIdPart };
    await handleGetJourneyComplete(req, res);

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/stage-controls$/) && req.method === 'GET') {
    // owle.1 — stage control flags (clarifyAvailable)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetStageControls(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip\/clarify$/) && req.method === 'POST') {
    // owle.1 — open clarify side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostSideTripClarify(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/decisions$/) && req.method === 'POST') {
    // owle.2 — append decision entry to decisions.md
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostDecisions(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/trace$/) && req.method === 'GET') {
    // owle.3 — artefact chain trace
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handleGetTrace(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/estimate$/) && req.method === 'POST') {
    // owle.4 — post estimate row to workspace/estimation-norms.md
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostEstimate(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/spikes\/[^/]+$/) && req.method === 'PATCH') {
    // owle.5 — record spike outcome
    const parts = pathname.split('/');
    req.params = { journeyId: parts[3], spikeSlug: parts[5] };
    authGuard(req, res, async () => await handlePatchSpike(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/spikes$/) && req.method === 'POST') {
    // owle.5 — create spike
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostSpike(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip$/) && req.method === 'DELETE') {
    // owle.1 — close side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handleDeleteSideTrip(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+$/) && req.method === 'GET') {
    // owle.1 — journey state (excludes sideTripSessionId)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetJourneyState(req, res));

  } else if (pathname === '/webhook/stripe' && req.method === 'POST') {
    // lab-s3.4 — Stripe webhook: credit provisioning + idempotency
    // CRITICAL: This route MUST appear BEFORE any JSON body-parsing middleware.
    // Stripe signature verification requires the raw, unparsed request body bytes.
    // No express.json() or equivalent is used in this server (native http module).
    // The handler reads raw bytes directly from the request stream via _readRawBody().
    await handlePostStripeWebhook(req, res);

  } else if (pathname === '/billing/checkout' && req.method === 'POST') {
    // lab-s3.2 — Stripe Checkout session creation
    authGuard(req, res, async () => { await handlePostCheckout(req, res); });

  } else if (pathname === '/billing/success' && req.method === 'GET') {
    // lab-s3.2 — Stripe Checkout success callback
    await handleGetBillingSuccess(req, res);

  } else if (pathname === '/settings/billing' && req.method === 'GET') {
    // lab-s3.5 — Stripe Billing Portal redirect
    await handleGetBillingPortal(req, res);

  } else if (pathname === '/billing/plan-state' && req.method === 'GET') {
    // bri-s3.5 — tenant plan-state read (paid/trial, active/past_due/canceled)
    authGuard(req, res, () => handleGetBillingPlanState(req, res));

  } else if (pathname === '/settings' && req.method === 'GET') {
    // c1 — Settings page shell + Profile tab (identity + linked sign-in methods)
    if (_handleGetSettings) {
      authGuard(req, res, () => _handleGetSettings(req, res));
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Settings unavailable');
    }

  } else if (pathname === '/settings/link-account' && req.method === 'GET') {
    // c1 — the old bare link-settings page now redirects into the unified
    // Settings shell (AC1), preserving any query string (e.g. ?linked=1
    // after a successful OAuth round-trip -- AC3). The account-linking.js
    // callback handlers below are unmodified and still redirect here.
    authGuard(req, res, () => {
      const qs = req.url.indexOf('?') !== -1 ? req.url.slice(req.url.indexOf('?')) : '';
      res.writeHead(302, { Location: '/settings' + qs });
      res.end();
    });

  } else if (pathname === '/settings/link-account/google/start' && req.method === 'GET') {
    authGuard(req, res, () => handleStartGoogleLink(req, res));

  } else if (pathname === '/settings/link-account/google/callback' && req.method === 'GET') {
    if (_handleGoogleLinkCallback) {
      authGuard(req, res, () => _handleGoogleLinkCallback(req, res));
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Account linking unavailable');
    }

  } else if (pathname === '/settings/link-account/github/start' && req.method === 'GET') {
    authGuard(req, res, () => handleStartGithubLink(req, res));

  } else if (pathname === '/settings/link-account/github/callback' && req.method === 'GET') {
    if (_handleGithubLinkCallback) {
      authGuard(req, res, () => _handleGithubLinkCallback(req, res));
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Account linking unavailable');
    }

  } else if (pathname === '/api/me' && req.method === 'GET') {
    const authenticated = !!(req.session && req.session.accessToken);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authenticated,
      login: authenticated ? (req.session.login || null) : null,
      sessionId: req.sessionId
    }));

  } else if (pathname === '/auth/email/signup' && req.method === 'POST') {
    // lab-s2.2 — email/password signup
    await handleEmailSignup(req, res);

  } else if (pathname === '/auth/email/login' && req.method === 'POST') {
    // lab-s2.2 — email/password login
    await handleEmailLogin(req, res);

  } else if (pathname === '/welcome' && req.method === 'GET') {
    // lab-s2.3 — plan selection page for first-time users (firstLogin detection)
    await handleWelcome(req, res);

  } else if (pathname === '/admin/credits' && req.method === 'GET') {
    // arl-s2/arl-s3 — admin credits view (requireAdmin gate)
    // sec-perf-s2: requireAdmin is now async (live role re-check) — must be awaited or
    // _raOk would be read before the live DB lookup resolves.
    let _raOk = false;
    await requireAdmin(req, res, () => { _raOk = true; });
    if (!_raOk) return;
    await adminCreditsGet(req, res);

  } else if (pathname === '/api/admin/credits/adjust' && req.method === 'POST') {
    // arl-s3 — admin credits adjustment (requireAdmin gate)
    let _raOk = false;
    await requireAdmin(req, res, () => { _raOk = true; });
    if (!_raOk) return;
    await adminCreditsPost(req, res);

  } else if (pathname === '/team/members' && req.method === 'GET') {
    // tir-s3 — team management page (requireAdmin gate)
    if (!_teamManagementHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Team management unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _teamManagementHandlers.handleGetTeamMembers(req, res);
    }

  } else if (pathname === '/api/team/members' && req.method === 'POST') {
    // tir-s3 — add/assign teammate role (requireAdmin gate, AC3; ADR-025:
    // handler always writes to req.session.tenantId, never a request field)
    if (!_teamManagementHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Team management unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _teamManagementHandlers.handleAddTeammate(req, res);
    }

  } else if (pathname === '/api/team/bulk-add-github-org' && req.method === 'POST') {
    // tir-s5 — bulk-add teammates from admin's connected GitHub org (requireAdmin gate)
    if (!_githubOrgBulkAddHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Team management unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _githubOrgBulkAddHandlers.handleBulkAddFromGithubOrg(req, res);
    }

  } else if (pathname === '/admin/impersonate' && req.method === 'GET') {
    // d1 — admin impersonation search page (requireAdmin gate)
    if (!_impersonationHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Impersonation unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _impersonationHandlers.handleGetImpersonatePage(req, res);
    }

  } else if (pathname === '/api/admin/impersonate/start' && req.method === 'POST') {
    // d1 — reason-gated impersonation session start (requireAdmin gate + CSRF)
    if (!_impersonationHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Impersonation unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _impersonationHandlers.handlePostImpersonateStart(req, res);
    }

  } else if (pathname === '/api/admin/impersonate/audit' && req.method === 'GET') {
    // d3 — read-only impersonation audit list (requireAdmin gate; AC3: rejected
    // at the API layer directly, not just hidden by the Settings UI tab)
    if (!_impersonationHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Impersonation unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _impersonationHandlers.handleGetImpersonationAuditList(req, res);
    }

  } else if (pathname === '/products/new' && req.method === 'GET') {
    // psh-s3 — product creation form
    authGuard(req, res, async () => { handleGetProductNew(req, res); });

  } else if (pathname === '/products/new' && req.method === 'POST') {
    // psh-s3 — product creation: generate AI draft
    authGuard(req, res, async () => { await handlePostProductNew(req, res, null, null, null); });

  } else if (pathname === '/products/confirm' && req.method === 'POST') {
    // psh-s3 — product creation: confirm and persist
    authGuard(req, res, async () => { await handlePostProductConfirm(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+$/) && req.method === 'GET') {
    // psh-s4 — product view: list features for one product with stage + health
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductView(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/products\/[^/]+\/sync$/) && req.method === 'POST') {
    // pr-s3 -- trigger a new sync of the product's connected repo
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductSync(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/repo$/) && req.method === 'POST') {
    // prc-s1.2 — connect (or re-connect) an existing GitHub repo to a product
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostConnectRepo(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+$/) && req.method === 'DELETE') {
    // prc-s4.2 — delete (detach) a product: removes product row, journeys, and
    // standards-cache rows; never touches the underlying GitHub repo
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleDeleteProduct(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+$/) && req.method === 'PUT') {
    // prc-s4.1 — edit a product's name, description, and/or repo association
    // Reuses the repo-access-verification logic from prc-s1.2 via _applyRepoChange
    // to ensure the edit flow and first-time-configuration flow never drift (AC3)
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePutProductEdit(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/features$/) && req.method === 'POST') {
    // psh-s4 — create new journey with product_id FK, emits journey_created PostHog event
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductFeature(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/repo\/create$/) && req.method === 'POST') {
    // prc-s2.1 — create a brand-new GitHub repo for a product
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductRepoCreate(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/kanban$/) && req.method === 'GET') {
    // psh-s6 — per-product kanban board with 8 stage columns and health indicators
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductKanban(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/roadmap$/) && req.method === 'GET') {
    // a5 -- Roadmap tab: discovery-only/ideate-only work with no pipeline-state.json entry
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductRoadmap(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/products\/[^/]+\/modules$/) && req.method === 'GET') {
    // a1 (AC1) — list modules curated for a product
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handleGetProductModules(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/products\/[^/]+\/modules$/) && req.method === 'POST') {
    // a1 (AC1, AC4) — create a new module for a product
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductModule(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/modules\/[^/]+$/) && req.method === 'PUT') {
    // a1 (AC2) — rename a module, preserving its id and existing references
    req.params = { id: pathname.split('/')[2], moduleId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handlePutProductModule(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/modules\/[^/]+$/) && req.method === 'DELETE') {
    // a1 (AC3) — delete a module, reassigning its journeys/epics to Unassigned
    req.params = { id: pathname.split('/')[2], moduleId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handleDeleteProductModule(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/epics\/[^/]+\/module$/) && req.method === 'PUT') {
    // a2 -- reassign an epic (journey) to a different module within the same product
    req.params = { id: pathname.split('/')[2], epicId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handlePutEpicModule(req, res, null, _pshPool, null); });

  } else if (pathname === '/org/kanban' && req.method === 'GET') {
    // psh-s7 — org-level kanban: all products and their features grouped by product
    authGuard(req, res, async () => { await handleGetOrgKanban(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/standards$/) && req.method === 'POST') {
    // psh-s8 — create standard for a product
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.standardsPost(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/products\/[^/]+\/standards$/) && req.method === 'GET') {
    // psh-s8 — list standards for a product
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.standardsList(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/standards\/[^/]+$/) && req.method === 'PUT') {
    // psh-s8 — edit a standard
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.standardsPut(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/standards\/[^/]+\/promote$/) && req.method === 'PUT') {
    // psh-s9 — promote standard to org-wide visibility
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.standardsPromote(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/standards\/[^/]+\/optout$/) && req.method === 'POST') {
    // psh-s9 — per-product opt-out from org standard
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.optoutPost(req, res, null, _pshPool, null); });

  } else if (pathname.match(/^\/standards\/[^/]+\/optout$/) && req.method === 'DELETE') {
    // psh-s9 — remove per-product opt-out (opt back in)
    req.params = { id: pathname.split('/')[2] };
    const _standardsRoutes = require('./routes/standards');
    authGuard(req, res, async () => { await _standardsRoutes.optoutDelete(req, res, null, _pshPool, null); });

  } else if (pathname === '/' && req.method === 'GET') {
    // lab-s1.2 — public landing page with PostHog event + auth redirect to /dashboard
    await handleRoot(req, res);

  } else {
    // Sign-in page (unauthenticated root)
    const { renderLoginPage } = require('./utils/html-shell');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLoginPage());
  }
}

/** Create and return the HTTP server instance. */
function createApp() {
  return http.createServer((req, res) => {
    router(req, res).catch((err) => {
      console.error('[router error]', err.message, err.stack);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });
  });
}

if (require.main === module) {
  process.on('unhandledRejection', function(reason) {
    console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
  });
  process.on('uncaughtException', function(err) {
    console.error('[uncaughtException]', err && err.stack ? err.stack : err);
  });

  try {
    validateRequiredEnvVars();
  } catch (err) {
    console.error('[startup] ' + err.message);
    process.exit(1);
  }
  const server = createApp();
  server.listen(PORT, () => {
    const gheMode = !!process.env.GITHUB_API_BASE_URL;
    const startTs = new Date().toISOString();
    console.log(`[${startTs}] Web UI server listening on port ${PORT}`);
    console.log(`[${startTs}] GitHub hostname: ${process.env.GITHUB_API_BASE_URL || 'github.com'} (Enterprise mode: ${gheMode})`);
    if (process.env.WUCE_ENABLE_THINKING === '1') {
      const budget = process.env.WUCE_THINKING_BUDGET_TOKENS || '10000';
      console.log(`[${startTs}] Extended thinking: ENABLED (budget_tokens=${budget}, WUCE_ENABLE_THINKING=1)`);
    }
  });
}

module.exports = { createApp, router };
