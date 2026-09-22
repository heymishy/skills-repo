'use strict';

/**
 * fake-test-db.js — bri-s3.2
 *
 * In-memory, Postgres-`Pool`-shaped stand-in used ONLY when NODE_ENV=test and
 * no DATABASE_URL is configured. Lets the REAL email/password signup handler
 * (routes/auth-email.js, lab-s2.2) and the REAL product-creation/dashboard
 * handlers (routes/products.js, psh-s1/s3) run end-to-end in the @mocked
 * Playwright suite (bri-s3.2) without needing a live Postgres instance.
 *
 * Scope: this fake supports exactly the query shapes those two call sites
 * issue against the `users` and `products` tables (see grep of `FROM users`,
 * `INTO users`, `FROM products`, `INTO products` across src/web-ui at the
 * time this was written). Any other statement (CREATE TABLE / ALTER TABLE
 * startup migrations) is treated as a no-op that resolves with empty rows —
 * safe because every caller of those wraps the promise in .catch().
 *
 * NOT a general SQL engine — do not extend this to arbitrary queries. If a
 * future story needs more table coverage, add a narrow, explicit branch here
 * (mirroring the ones below) rather than trying to make this "generic".
 */

function _normalise(sql) {
  return String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
}

function createFakeTestDb() {
  var users = [];        // { id, email, password_hash }
  var nextUserId = 1;
  var products = [];     // { product_id, tenant_id, name, ...}
  var nextProductSeq = 1;
  var productModules = [];          // { id, product_id, tenant_id, name, created_at } -- bmau-s1
  var nextModuleSeq = 1;
  var featureModuleAssignments = []; // { product_id, tenant_id, feature_slug, module_id } -- bmau-s1
  var people = [];       // { id, created_at } — tir-s1/bri-s3.3
  var nextPersonId = 1;
  var teamMemberships = [];    // { person_id, tenant_id, role, created_at } — tir-s1/bri-s3.3
  var personIdentities = [];   // { identity_key, person_id, provider, created_at } — tir-s2/bri-s3.3
  // s1.1: real journeys backing, so board-driven "Advance" E2E specs can seed
  // a journey that is actually visible to the kanban board's own product/org-
  // scoped queries AND to the new tenant-ownership check the board-advance
  // endpoint issues. Kept in sync with the real in-memory journey-store via a
  // saveJourney-shaped adapter wired only in NODE_ENV=test (server.js), so a
  // real gate-confirm advance updates the SAME row this fake queries against
  // -- not a second, independently-drifting copy of journey state.
  var journeys = [];     // { journey_id, tenant_id, product_id, feature_slug, stage, active_session_id }
  // dsh-s3: in-memory backing for session_turns, so writeSessionTurns/
  // getTurnsForStage (adapters/session-turns-pg.js) are wired and usable in
  // NODE_ENV=test with no DATABASE_URL -- without this, the durable-read path
  // exercised by /test/seed-durable-stage's E2E spec would throw "Adapter not
  // wired" locally. Keyed by (journey_id, skill_name), upsert on conflict,
  // mirroring the journeys/_upsertJourney pattern above rather than a generic
  // SQL engine.
  var sessionTurns = []; // { journey_id, tenant_id, skill_name, turns }
  // dsh-s6: in-memory backing for session_turns_archive, so the local
  // /test/seed-durable-stage `archived: true` seed path and getTurnsForStage's
  // archive-tier fallback (adapters/session-turns-pg.js) are both usable in
  // NODE_ENV=test with no DATABASE_URL. Kept as a separate array (not reusing
  // sessionTurns above) since the whole point of dsh-s6's E2E scenario is
  // proving the row is NOT in the hot table -- a shared array would make that
  // distinction untestable.
  var sessionTurnsArchive = []; // { id, journey_id, tenant_id, skill_name, turns, created_at }
  var pods = [];         // { pod_id, tenant_id, name, created_by, status } -- ep1-s1
  var podMembers = [];   // { id, pod_id, user_id, role_id, status } -- ep1-s1
  var nextPodMemberId = 1;
  var podAssignments = []; // { assignment_id, tenant_id, pod_id, product_id, feature_id, assignment_type, assigned_by, assigned_at } -- ep1-s2
  var featureCollaborators = []; // { collaborator_id, feature_id, user_id, role_id, pod_id, is_approver } -- ep1-s3
  var featureCollaboratorRemovals = []; // { feature_id, user_id, removed_by } -- ep4-s1
  var artefactComments = []; // { comment_id, resource_type, resource_id, user_id, body, created_at } -- dsa-s1
  var featureEdits = []; // { id, feature_id, artefact_name, user_id, timestamp, operation, edit_hash, merged_with, line_attributions, tenant_id } -- ep2-s4

  function query(sql, params) {
    var s = _normalise(sql);
    var p = params || [];

    // ── users ────────────────────────────────────────────────────────────
    if (s.indexOf('INSERT INTO USERS') === 0) {
      var email = p[0];
      var passwordHash = p[1];
      var dup = users.some(function(u) { return u.email === email; });
      if (dup) {
        var err = new Error('duplicate key value violates unique constraint "users_email_key"');
        err.code = '23505';
        return Promise.reject(err);
      }
      var user = { id: nextUserId++, email: email, password_hash: passwordHash };
      users.push(user);
      return Promise.resolve({ rows: [{ id: user.id }] });
    }
    if (s.indexOf('SELECT ID, EMAIL, PASSWORD_HASH FROM USERS') === 0) {
      var lookupEmail = p[0];
      var found = users.filter(function(u) { return u.email === lookupEmail; });
      return Promise.resolve({ rows: found });
    }

    // ── products ─────────────────────────────────────────────────────────
    if (s.indexOf('INSERT INTO PRODUCTS') === 0) {
      var productId = 'fake-product-' + (nextProductSeq++);
      var row = {
        product_id:  productId,
        tenant_id:   p[0],
        name:        p[1],
        description: p[2],
        mission:     p[3],
        tech_stack:  p[4],
        constraints: p[5],
        roadmap:     p[6],
        architecture_guardrails: p[7],
        created_by:  p[8],
        created_at:  new Date().toISOString()
      };
      products.push(row);
      return Promise.resolve({ rows: [{ product_id: productId }] });
    }
    if (s.indexOf('SELECT PRODUCT_ID FROM PRODUCTS WHERE TENANT_ID') === 0) {
      var tenantIdOnly = p[0];
      return Promise.resolve({ rows: products.filter(function(r) { return r.tenant_id === tenantIdOnly; }).map(function(r) { return { product_id: r.product_id }; }) });
    }
    if (s.indexOf('SELECT PRODUCT_ID, NAME, CREATED_AT FROM PRODUCTS WHERE TENANT_ID') === 0) {
      var tenantIdList = p[0];
      var rows = products
        .filter(function(r) { return r.tenant_id === tenantIdList; })
        .sort(function(a, b) { return b.created_at.localeCompare(a.created_at); })
        .map(function(r) { return { product_id: r.product_id, name: r.name, created_at: r.created_at }; });
      return Promise.resolve({ rows: rows });
    }
    if (s.indexOf('SELECT NAME FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid = p[0];
      var match = products.filter(function(r) { return r.product_id === pid; }).map(function(r) { return { name: r.name }; });
      return Promise.resolve({ rows: match });
    }
    // bri-s3.4: added alongside the tenant-ownership fix in routes/products.js
    // (handleGetProductView) — narrow branches, mirroring the file's existing
    // extension pattern, not a general SQL engine.
    // rpc-s1: handleGetProductView's query now also selects repo_owner/
    // repo_name (Connect-repo UI affordance) — matched here first, before the
    // older/narrower NAME, TENANT_ID-only branch below, since exact-prefix
    // matching means the longer column list must be checked first.
    if (s.indexOf('SELECT NAME, TENANT_ID, REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pidRepo = p[0];
      var matchRepo = products.filter(function(r) { return r.product_id === pidRepo; }).map(function(r) {
        return { name: r.name, tenant_id: r.tenant_id, repo_owner: r.repo_owner || null, repo_name: r.repo_name || null };
      });
      return Promise.resolve({ rows: matchRepo });
    }
    if (s.indexOf('SELECT NAME, TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid2 = p[0];
      var match2 = products.filter(function(r) { return r.product_id === pid2; }).map(function(r) { return { name: r.name, tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: match2 });
    }
    // bmau-s1: handlePostProductFeature's das-s2 repo-connection gate issues
    // this exact, separate query shape (product_id AND tenant_id, no name
    // column) -- previously unmatched here, so the gate always saw an empty
    // _repoRow and 409'd every first-feature-creation attempt in the
    // standard local/CI harness, even after a repo was seeded via
    // /test/seed-product-repo (server.js).
    if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pidRepoGate = p[0];
      var tenantIdRepoGate = p[1];
      var matchRepoGate = products
        .filter(function(r) { return r.product_id === pidRepoGate && r.tenant_id === tenantIdRepoGate; })
        .map(function(r) { return { repo_owner: r.repo_owner || null, repo_name: r.repo_name || null }; });
      return Promise.resolve({ rows: matchRepoGate });
    }
    // bri-s3.4: added alongside handleGetProductKanban / standardsPost's
    // tenant-ownership check.
    if (s.indexOf('SELECT TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var pid3 = p[0];
      var match3 = products.filter(function(r) { return r.product_id === pid3; }).map(function(r) { return { tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: match3 });
    }
    // ep1-s2: handlePostSetDefaultPod / handlePostProductSync / handlePutProductEdit's
    // shared tenant-ownership check issues this exact column-order shape
    // (product_id, tenant_id) -- distinct from the NAME, TENANT_ID and
    // TENANT_ID-only branches above, so it needs its own exact-prefix branch.
    if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM PRODUCTS WHERE PRODUCT_ID') === 0) {
      var psdpPid = p[0];
      var psdpMatch = products.filter(function(r) { return r.product_id === psdpPid; }).map(function(r) { return { product_id: r.product_id, tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: psdpMatch });
    }
    // rpc-s1: handlePostProductRepoCreate / handlePutProductEdit's shared
    // repo-association UPDATE — persists repo_provider/repo_owner/repo_name
    // onto the in-memory row so a subsequent GET (via the branch above)
    // reflects the connected repo, matching real Postgres's UPDATE semantics.
    if (s.indexOf('UPDATE PRODUCTS SET REPO_PROVIDER') === 0) {
      var updProvider = p[0];
      var updOwner = p[1];
      var updRepoName = p[2];
      var updProductId = p[3];
      var updTarget = products.find(function(r) { return r.product_id === updProductId; });
      if (updTarget) {
        updTarget.repo_provider = updProvider;
        updTarget.repo_owner = updOwner;
        updTarget.repo_name = updRepoName;
      }
      return Promise.resolve({ rows: [], rowCount: updTarget ? 1 : 0 });
    }

    // ── journeys ─────────────────────────────────────────────────────────
    // s1.1: real, narrow support for the exact query shapes the kanban board
    // (products.js) and the board-advance endpoint's tenant-ownership check
    // issue. Rows are populated via _upsertJourney (called by the
    // saveJourney-shaped adapter server.js wires journey-store.js to, in
    // NODE_ENV=test only) -- so a real gate-confirm advance is reflected here
    // too, not just at journey-creation time.
    if (s.indexOf('SELECT TENANT_ID FROM JOURNEYS WHERE JOURNEY_ID') === 0) {
      var lookupJourneyId = p[0];
      var jOwnerMatch = journeys.filter(function(r) { return r.journey_id === lookupJourneyId; }).map(function(r) { return { tenant_id: r.tenant_id }; });
      return Promise.resolve({ rows: jOwnerMatch });
    }
    // ep4-s1: the 3 multi-pod handlers (products.js) validate both tenant
    // AND product ownership of the feature (journey) in one query -- a
    // DIFFERENT column list than s1.1's own 1-column branch above, so it
    // needs its own exact-prefix branch.
    if (s.indexOf('SELECT JOURNEY_ID, TENANT_ID, PRODUCT_ID FROM JOURNEYS WHERE JOURNEY_ID') === 0) {
      var gjJourneyId = p[0];
      var gjMatch = journeys.filter(function(r) { return r.journey_id === gjJourneyId; }).map(function(r) { return { journey_id: r.journey_id, tenant_id: r.tenant_id, product_id: r.product_id }; });
      return Promise.resolve({ rows: gjMatch });
    }
    if (s.indexOf('FROM JOURNEYS WHERE PRODUCT_ID') !== -1) {
      var jProductId = p[0];
      // Org-scope's variant also filters by tenant_id ($2) -- detected via the
      // literal "AND TENANT_ID" clause rather than a second exact-prefix branch,
      // since both product- and org-scope share this same substring match.
      var jTenantFilter = (s.indexOf('AND TENANT_ID') !== -1 && p.length > 1) ? p[1] : null;
      var jRows = journeys
        .filter(function(r) { return r.product_id === jProductId; })
        .filter(function(r) { return jTenantFilter === null || r.tenant_id === jTenantFilter; })
        .map(function(r) {
          return {
            journey_id: r.journey_id,
            feature_slug: r.feature_slug,
            stage: r.stage,
            active_session_id: r.active_session_id
          };
        });
      return Promise.resolve({ rows: jRows });
    }

    // ── product_modules / feature_module_assignments (bmau-s1) ───────────
    // Narrow support for the exact query shapes routes/adapters/modules-
    // adapter.js issues, matching this file's own stated convention. Only
    // the branches this story's own E2E spec exercises are implemented
    // (list, create, bulk-assign, get-assignments) -- renameModule/
    // deleteModule/reassignEpic are NOT yet supported here and will fall
    // through to the generic "unhandled query" logged warning + empty rows
    // below if a future spec calls them; add narrow branches then, mirroring
    // these, rather than leaving them to silently return wrong results.
    if (s.indexOf('SELECT ID, NAME, CREATED_AT FROM PRODUCT_MODULES WHERE PRODUCT_ID') === 0) {
      var lmPid = p[0], lmTid = p[1];
      var lmRows = productModules
        .filter(function(m) { return m.product_id === lmPid && m.tenant_id === lmTid; })
        .sort(function(a, b) { return a.created_at.localeCompare(b.created_at); })
        .map(function(m) { return { id: m.id, name: m.name, created_at: m.created_at }; });
      return Promise.resolve({ rows: lmRows });
    }
    if (s.indexOf('SELECT ID FROM PRODUCT_MODULES WHERE PRODUCT_ID') === 0) {
      var cmPid = p[0], cmTid = p[1], cmName = p[2];
      var cmDup = productModules.filter(function(m) { return m.product_id === cmPid && m.tenant_id === cmTid && m.name === cmName; });
      return Promise.resolve({ rows: cmDup.map(function(m) { return { id: m.id }; }) });
    }
    if (s.indexOf('INSERT INTO PRODUCT_MODULES') === 0) {
      var newModuleId = 'fake-module-' + (nextModuleSeq++);
      var newModuleRow = { id: newModuleId, product_id: p[0], tenant_id: p[1], name: p[2], created_at: new Date().toISOString() };
      productModules.push(newModuleRow);
      return Promise.resolve({ rows: [{ id: newModuleId, name: newModuleRow.name, created_at: newModuleRow.created_at }] });
    }
    if (s.indexOf('SELECT FEATURE_SLUG, MODULE_ID FROM FEATURE_MODULE_ASSIGNMENTS WHERE PRODUCT_ID') === 0) {
      var gfaPid = p[0], gfaTid = p[1];
      var gfaRows = featureModuleAssignments.filter(function(r) { return r.product_id === gfaPid && r.tenant_id === gfaTid; });
      return Promise.resolve({ rows: gfaRows.map(function(r) { return { feature_slug: r.feature_slug, module_id: r.module_id }; }) });
    }
    if (s.indexOf('INSERT INTO FEATURE_MODULE_ASSIGNMENTS') === 0) {
      var baProductId = p[0], baTenantId = p[1], baModuleId = p[2], baSlugs = p[3];
      var baModuleExists = productModules.some(function(m) { return m.id === baModuleId && m.product_id === baProductId && m.tenant_id === baTenantId; });
      if (!baModuleExists) { return Promise.resolve({ rows: [] }); }
      var baReturned = [];
      (baSlugs || []).forEach(function(slug) {
        var existing = featureModuleAssignments.find(function(r) { return r.product_id === baProductId && r.feature_slug === slug; });
        if (existing) { existing.module_id = baModuleId; }
        else { featureModuleAssignments.push({ product_id: baProductId, tenant_id: baTenantId, feature_slug: slug, module_id: baModuleId }); }
        baReturned.push({ feature_slug: slug });
      });
      return Promise.resolve({ rows: baReturned });
    }

    // ── startup migrations (CREATE TABLE / ALTER TABLE / CREATE UNIQUE INDEX) —
    // idempotent no-op ──
    // NOTE: this catch-all also covers pods/pod_members's own
    // "CREATE TABLE IF NOT EXISTS PODS"/"...POD_MEMBERS" bootstrap statements
    // (migratePodsSchema, modules/pod-store.js) and pod_assignments's own
    // "CREATE TABLE IF NOT EXISTS POD_ASSIGNMENTS" bootstrap + its
    // "CREATE UNIQUE INDEX IF NOT EXISTS pod_assignments_product_default_uq"
    // partial-unique-index statement (migratePodAssignmentsSchema,
    // modules/pod-assignment-store.js, ep1-s2) since all start with one of
    // the literal prefixes checked here -- no separate branch is added for
    // them below, since one would be unreachable dead code.
    if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('ALTER TABLE') === 0 || s.indexOf('CREATE UNIQUE INDEX') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // ── pods / pod_members (ep1-s1) ─────────────────────────────────────
    // Narrow support for the exact query shapes modules/pod-store.js issues
    // (findPodByName, listPods, createPod). Real Postgres enforces
    // UNIQUE(tenant_id, name) at the DB level (pod-store.js's createPod
    // catches err.code === '23505' on that constraint) -- deliberately NOT
    // simulated here, since routes/pods.js's AC2 duplicate-name rejection is
    // checked at the application level via findPodByName BEFORE createPod is
    // ever called, and that is the path this story's own E2E spec
    // (tests/e2e/ep1-s1-pod-creation.spec.js) exercises.
    if (s.indexOf('SELECT POD_ID, NAME FROM PODS') === 0) {
      var findTenantId = p[0];
      var findName = p[1];
      var findMatch = pods.filter(function(r) { return r.tenant_id === findTenantId && r.name === findName; });
      return Promise.resolve({ rows: findMatch.map(function(r) { return { pod_id: r.pod_id, name: r.name }; }) });
    }
    if (s.indexOf('SELECT POD_ID, NAME, CREATED_AT FROM PODS') === 0) {
      var listTenantId = p[0];
      var listMatch = pods
        .filter(function(r) { return r.tenant_id === listTenantId; })
        .map(function(r) { return { pod_id: r.pod_id, name: r.name, created_at: r.created_at }; });
      return Promise.resolve({ rows: listMatch });
    }
    if (s.indexOf('INSERT INTO PODS') === 0) {
      var newPodId = p[0];
      var newPodTenantId = p[1];
      var newPodName = p[2];
      var newPodCreatedBy = p[3];
      pods.push({
        pod_id: newPodId,
        tenant_id: newPodTenantId,
        name: newPodName,
        created_by: newPodCreatedBy,
        status: 'active',
        created_at: new Date().toISOString()
      });
      return Promise.resolve({ rows: [] });
    }
    if (s.indexOf('INSERT INTO POD_MEMBERS') === 0) {
      var pmPodId = p[0];
      var pmUserId = p[1];
      var pmRoleId = p[2];
      podMembers.push({ id: nextPodMemberId++, pod_id: pmPodId, user_id: pmUserId, role_id: pmRoleId, status: 'active' });
      return Promise.resolve({ rows: [] });
    }

    // ── pod_assignments (ep1-s2) ────────────────────────────────────────
    // Narrow support for the exact query shapes modules/pod-assignment-store.js
    // issues (setProductDefaultPod, getProductDefaultPod). Mirrors this
    // file's own established convention for pods/pod_members above.

    // setProductDefaultPod's own tenant-scoped pod lookup -- deliberately a
    // DIFFERENT column order/shape than ep1-s1's existing "SELECT POD_ID,
    // NAME FROM PODS..." (findPodByName) and "SELECT POD_ID, NAME,
    // CREATED_AT FROM PODS..." (listPods) branches above, so it needs its
    // own exact-prefix branch rather than reusing either.
    if (s.indexOf('SELECT POD_ID, TENANT_ID, NAME FROM PODS WHERE POD_ID') === 0) {
      var paLookupPodId = p[0];
      var paLookupTenantId = p[1];
      var paPodMatch = pods
        .filter(function(r) { return r.pod_id === paLookupPodId && r.tenant_id === paLookupTenantId; })
        .map(function(r) { return { pod_id: r.pod_id, tenant_id: r.tenant_id, name: r.name }; });
      return Promise.resolve({ rows: paPodMatch });
    }

    // setProductDefaultPod's and getProductDefaultPod's shared member-count
    // read.
    if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_MEMBERS WHERE POD_ID') === 0) {
      var mcPodId = p[0];
      var mcCount = podMembers.filter(function(r) { return r.pod_id === mcPodId; }).length;
      return Promise.resolve({ rows: [{ count: String(mcCount) }] });
    }

    // setProductDefaultPod's upsert -- feature_id is always NULL for this
    // story's only case (product-level default), so the ON CONFLICT
    // (tenant_id, product_id) WHERE feature_id IS NULL partial-unique-index
    // semantics collapse to a simple findIndex + replace-or-push keyed on
    // (tenant_id, product_id, feature_id IS NULL), same replace-not-duplicate
    // logic pod-assignment-store.js's own test mock already implements.
    // ep1-s3 fix: this file previously had ONE branch here
    // (`s.indexOf('INSERT INTO POD_ASSIGNMENTS') === 0`) that matched BOTH
    // setProductDefaultPod's 6-param product-level upsert (ep1-s2, no
    // feature_id column) AND setFeatureDefaultPod's 7-param feature-level
    // insert (ep1-s3, WITH a feature_id column) as the same prefix -- both
    // SQL strings start with "INSERT INTO pod_assignments (". Because the
    // single branch unconditionally forced `feature_id: null` and read
    // p[4]/p[5] positionally (assignment_type/assigned_by for the 6-param
    // shape), a setFeatureDefaultPod call was silently misread as a
    // setProductDefaultPod upsert: it overwrote the SAME product-level
    // default row (matched via the feature_id===null findIndex) with
    // garbage assignment_type/assigned_by values (actually featureId/
    // assignment_type shifted one position), and NO row with the real
    // feature_id was ever written. This produced podAssignmentCount=0 for
    // every feature-level assignment -- caught empirically via the
    // /test/pod-inheritance-state E2E endpoint (Task 7 fix) after
    // confirming getProductDefaultPod correctly found the product default
    // pod, ruling out every other stage of the pod-inheritance path.
    // Column lists distinguish the two shapes unambiguously.
    if (s.indexOf('INSERT INTO POD_ASSIGNMENTS (ASSIGNMENT_ID, TENANT_ID, POD_ID, PRODUCT_ID, FEATURE_ID, ASSIGNMENT_TYPE, ASSIGNED_BY)') === 0) {
      // setFeatureDefaultPod (ep1-s3): always a new row, one per feature --
      // no upsert/conflict semantics, since a given featureId is only ever
      // created once.
      var fdpAssignmentId = p[0];
      var fdpTenantId = p[1];
      var fdpPodId = p[2];
      var fdpProductId = p[3];
      var fdpFeatureId = p[4];
      var fdpAssignmentType = p[5];
      var fdpAssignedBy = p[6];
      podAssignments.push({
        assignment_id: fdpAssignmentId,
        tenant_id: fdpTenantId,
        pod_id: fdpPodId,
        product_id: fdpProductId,
        feature_id: fdpFeatureId,
        assignment_type: fdpAssignmentType,
        assigned_by: fdpAssignedBy,
        assigned_at: new Date().toISOString()
      });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }

    if (s.indexOf('INSERT INTO POD_ASSIGNMENTS (ASSIGNMENT_ID, TENANT_ID, POD_ID, PRODUCT_ID, ASSIGNMENT_TYPE, ASSIGNED_BY)') === 0) {
      // setProductDefaultPod (ep1-s2): product-level default, feature_id
      // always NULL, upsert-by-replace on (tenant_id, product_id,
      // feature_id IS NULL) mirroring the real ON CONFLICT ... WHERE
      // feature_id IS NULL partial-unique-index semantics.
      var paAssignmentId = p[0];
      var paTenantId = p[1];
      var paPodId = p[2];
      var paProductId = p[3];
      var paAssignmentType = p[4];
      var paAssignedBy = p[5];
      var paExistingIdx = podAssignments.findIndex(function(r) {
        return r.tenant_id === paTenantId && r.product_id === paProductId && r.feature_id === null;
      });
      var paRow = {
        assignment_id: paAssignmentId,
        tenant_id: paTenantId,
        pod_id: paPodId,
        product_id: paProductId,
        feature_id: null,
        assignment_type: paAssignmentType,
        assigned_by: paAssignedBy,
        assigned_at: new Date().toISOString()
      };
      if (paExistingIdx !== -1) { podAssignments[paExistingIdx] = paRow; }
      else { podAssignments.push(paRow); }
      return Promise.resolve({ rows: [], rowCount: 1 });
    }

    // getProductDefaultPod's read (product-level default only, feature_id IS
    // NULL).
    if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) {
      var gpdTenantId = p[0];
      var gpdProductId = p[1];
      var gpdRows = podAssignments
        .filter(function(r) { return r.tenant_id === gpdTenantId && r.product_id === gpdProductId && r.feature_id === null; })
        .map(function(r) {
          var podRow = pods.find(function(pd) { return pd.pod_id === r.pod_id; });
          return { pod_id: r.pod_id, name: podRow ? podRow.name : null };
        });
      return Promise.resolve({ rows: gpdRows });
    }

    // ep4-s1: getFeaturePodAssignments's own read -- a DIFFERENT column list
    // (PA.POD_ID, PA.ASSIGNMENT_TYPE, P.NAME) than ep1-s2's existing
    // "SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS..." branch above (that
    // one is feature_id IS NULL-only; this one is feature_id = $2), so it
    // needs its own exact-prefix branch.
    if (s.indexOf('SELECT PA.POD_ID, PA.ASSIGNMENT_TYPE, P.NAME FROM POD_ASSIGNMENTS') === 0) {
      var gfpaTenantId = p[0];
      var gfpaFeatureId = p[1];
      var gfpaRows = podAssignments
        .filter(function(r) { return r.tenant_id === gfpaTenantId && r.feature_id === gfpaFeatureId; })
        .map(function(r) {
          var podRow = pods.find(function(pd) { return pd.pod_id === r.pod_id; });
          return { pod_id: r.pod_id, assignment_type: r.assignment_type, name: podRow ? podRow.name : null };
        });
      return Promise.resolve({ rows: gfpaRows });
    }

    // ── feature_collaborators (ep1-s3) ──────────────────────────────────
    // Narrow support for the exact query shapes modules/feature-collaborator-store.js
    // issues (populateFeatureCollaboratorsFromPod, getFeatureCollaborators).
    // The "CREATE TABLE IF NOT EXISTS FEATURE_COLLABORATORS" bootstrap
    // (migrateFeatureCollaboratorsSchema) is already covered by the generic
    // "CREATE TABLE" catch-all above -- no separate branch needed here.

    // populateFeatureCollaboratorsFromPod's own pod_members read -- a
    // DIFFERENT shape (SELECT user_id, role_id ...) than ep1-s2's existing
    // "SELECT COUNT(*) AS COUNT FROM POD_MEMBERS WHERE POD_ID" branch above,
    // so it needs its own exact-prefix branch rather than reusing it.
    if (s.indexOf('SELECT USER_ID, ROLE_ID FROM POD_MEMBERS WHERE POD_ID') === 0) {
      var fcPodId = p[0];
      var fcMembers = podMembers
        .filter(function(r) { return r.pod_id === fcPodId; })
        .map(function(r) { return { user_id: r.user_id, role_id: r.role_id }; });
      return Promise.resolve({ rows: fcMembers });
    }
    // ep4-s1: a narrower single-column read of pod_members, used by tests
    // to verify a per-feature removal did NOT touch global pod membership.
    // No production caller issues this exact shape today (populateFeature-
    // CollaboratorsFromPod/...Pods both use the two-column branch above) --
    // added because pod_members previously had no SELECT support at all in
    // this adapter, only INSERT.
    if (s.indexOf('SELECT USER_ID FROM POD_MEMBERS WHERE POD_ID') === 0) {
      var pmSelPodId = p[0];
      var pmSelRows = podMembers
        .filter(function(r) { return r.pod_id === pmSelPodId; })
        .map(function(r) { return { user_id: r.user_id }; });
      return Promise.resolve({ rows: pmSelRows });
    }

    if (s.indexOf('INSERT INTO FEATURE_COLLABORATORS') === 0) {
      var fcCollaboratorId = p[0];
      var fcFeatureId = p[1];
      var fcUserId = p[2];
      var fcRoleId = p[3];
      var fcSourcePodId = p[4];
      featureCollaborators.push({
        collaborator_id: fcCollaboratorId,
        feature_id: fcFeatureId,
        user_id: fcUserId,
        role_id: fcRoleId,
        pod_id: fcSourcePodId,
        is_approver: false
      });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }

    if (s.indexOf('SELECT COLLABORATOR_ID, USER_ID, ROLE_ID, POD_ID FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) {
      var gfcFeatureId = p[0];
      var gfcRows = featureCollaborators
        .filter(function(r) { return r.feature_id === gfcFeatureId; })
        .map(function(r) { return { collaborator_id: r.collaborator_id, user_id: r.user_id, role_id: r.role_id, pod_id: r.pod_id }; });
      return Promise.resolve({ rows: gfcRows });
    }

    // ── feature_collaborator_removals (ep4-s1) ──────────────────────────
    // "CREATE TABLE IF NOT EXISTS FEATURE_COLLABORATOR_REMOVALS" is already
    // covered by the generic "CREATE TABLE" catch-all near the top of this
    // function -- no separate branch needed for the migration.
    if (s.indexOf('SELECT USER_ID FROM FEATURE_COLLABORATOR_REMOVALS WHERE FEATURE_ID') === 0) {
      var gfcrFeatureId = p[0];
      var gfcrRows = featureCollaboratorRemovals
        .filter(function(r) { return r.feature_id === gfcrFeatureId; })
        .map(function(r) { return { user_id: r.user_id }; });
      return Promise.resolve({ rows: gfcrRows });
    }
    if (s.indexOf('INSERT INTO FEATURE_COLLABORATOR_REMOVALS') === 0) {
      var ifcrFeatureId = p[0];
      var ifcrUserId = p[1];
      var ifcrRemovedBy = p[2];
      var ifcrDup = featureCollaboratorRemovals.some(function(r) { return r.feature_id === ifcrFeatureId && r.user_id === ifcrUserId; });
      if (!ifcrDup) {
        featureCollaboratorRemovals.push({ feature_id: ifcrFeatureId, user_id: ifcrUserId, removed_by: ifcrRemovedBy });
      }
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
    if (s.indexOf('DELETE FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) {
      var dfcFeatureId = p[0];
      var dfcUserId = p[1];
      featureCollaborators = featureCollaborators.filter(function(r) { return !(r.feature_id === dfcFeatureId && r.user_id === dfcUserId); });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }

    // ep1-s3 Task 7: COUNT(*) shapes issued by the new
    // GET /test/pod-inheritance-state/:sessionId E2E read endpoint
    // (server.js). Different shape than the branches above (keyed by
    // feature_id, returns a single count) -- new narrow branches rather than
    // reusing either.
    if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_ASSIGNMENTS WHERE FEATURE_ID') === 0) {
      var paStateFeatureId = p[0];
      var paStateCount = podAssignments.filter(function(r) { return r.feature_id === paStateFeatureId; }).length;
      return Promise.resolve({ rows: [{ count: String(paStateCount) }] });
    }

    if (s.indexOf('SELECT COUNT(*) AS COUNT FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) {
      var fcStateFeatureId = p[0];
      var fcStateCount = featureCollaborators.filter(function(r) { return r.feature_id === fcStateFeatureId; }).length;
      return Promise.resolve({ rows: [{ count: String(fcStateCount) }] });
    }

    // ── artefact_comments (dsa-s1) ──────────────────────────────────────
    // Narrow support for the exact query shapes modules/artefact-comments.js
    // issues (createComment, listCommentsForResource). The
    // "CREATE TABLE IF NOT EXISTS artefact_comments" bootstrap
    // (migrateArtefactCommentsSchema) is already covered by the generic
    // "CREATE TABLE" catch-all above -- no separate branch needed here.
    // Without these two branches, createComment's `result.rows[0]` was
    // undefined against this fake db's catch-all empty-rows fallback,
    // throwing when the caller read `comment.comment_id` off it -- a real
    // gap that made POST /api/artefact-comments 500 in every local/CI E2E
    // run (no DATABASE_URL configured), found while writing dsa-s1's own
    // E2E spec (Task 6).
    if (s.indexOf('INSERT INTO ARTEFACT_COMMENTS') === 0) {
      var acCommentId = p[0];
      var acResourceType = p[1];
      var acResourceId = p[2];
      var acUserId = p[3];
      var acBody = p[4];
      var acRow = {
        comment_id: acCommentId,
        resource_type: acResourceType,
        resource_id: acResourceId,
        user_id: acUserId,
        body: acBody,
        created_at: new Date().toISOString()
      };
      artefactComments.push(acRow);
      return Promise.resolve({ rows: [acRow] });
    }

    if (s.indexOf('SELECT COMMENT_ID, RESOURCE_TYPE, RESOURCE_ID, USER_ID, BODY, CREATED_AT FROM ARTEFACT_COMMENTS') === 0) {
      var lcResourceType = p[0];
      var lcResourceId = p[1];
      var lcRows = artefactComments.filter(function(r) {
        return r.resource_type === lcResourceType && r.resource_id === lcResourceId;
      });
      // Insertion order already matches created_at-ascending (oldest first)
      // since this array is only ever appended to, single-threaded.
      return Promise.resolve({ rows: lcRows });
    }

    // ── feature_edits (ep2-s4) ──────────────────────────────────────────
    // Narrow support for the exact query shapes modules/feature-edits.js
    // issues (recordEdit, listEditsForFeature). Same companion-fix
    // requirement dsa-s1 already established for artefact_comments -- the
    // generic CREATE TABLE catch-all covers the bootstrap; these two
    // branches cover the INSERT/SELECT the generic empty-rows fallback
    // cannot satisfy (result.rows[0] would be undefined otherwise).
    if (s.indexOf('INSERT INTO FEATURE_EDITS') === 0) {
      var feRow = {
        id: featureEdits.length + 1,
        feature_id: p[0],
        artefact_name: p[1],
        user_id: p[2],
        timestamp: new Date().toISOString(),
        operation: p[3],
        edit_hash: p[4],
        merged_with: p[5],
        line_attributions: p[6],
        tenant_id: p[7]
      };
      featureEdits.push(feRow);
      return Promise.resolve({ rows: [feRow] });
    }

    if (s.indexOf('SELECT ID, FEATURE_ID, ARTEFACT_NAME, USER_ID, TIMESTAMP, OPERATION, EDIT_HASH, MERGED_WITH, LINE_ATTRIBUTIONS, TENANT_ID FROM FEATURE_EDITS') === 0) {
      var feFeatureId = p[0];
      var feTenantId  = p[1];
      var feRows = featureEdits.filter(function(r) {
        return r.feature_id === feFeatureId && r.tenant_id === feTenantId;
      });
      return Promise.resolve({ rows: feRows });
    }

    // ── people, team_memberships, person_identities (tir-s1/tir-s2/bri-s3.3) ─
    // tir-s1: people table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS PEOPLE') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s1: team_memberships table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS TEAM_MEMBERSHIPS') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: person_identities table bootstrap (idempotent)
    if (s.indexOf('CREATE TABLE IF NOT EXISTS PERSON_IDENTITIES') === 0) {
      return Promise.resolve({ rows: [] });
    }

    // tir-s1: INSERT INTO people (used by migrateTeamSchema backfill)
    if (s.indexOf('INSERT INTO PEOPLE DEFAULT VALUES') === 0) {
      var person = { id: nextPersonId++, created_at: new Date().toISOString() };
      people.push(person);
      return Promise.resolve({ rows: [{ id: person.id }] });
    }

    // tir-s1: INSERT INTO team_memberships (used by migrateTeamSchema backfill)
    if (s.indexOf('INSERT INTO TEAM_MEMBERSHIPS') === 0) {
      var personId = p[0];
      var tenantId = p[1];
      var role = p[2];
      var tm = { person_id: personId, tenant_id: tenantId, role: role, created_at: new Date().toISOString() };
      teamMemberships.push(tm);
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: INSERT INTO person_identities (used by account-linking routes)
    if (s.indexOf('INSERT INTO PERSON_IDENTITIES') === 0) {
      var identityKey = p[0];
      var personIdForLink = p[1];
      var provider = p[2];
      var pi = { identity_key: identityKey, person_id: personIdForLink, provider: provider, created_at: new Date().toISOString() };
      personIdentities.push(pi);
      return Promise.resolve({ rows: [] });
    }

    // tir-s2: SELECT PERSON_ID FROM person_identities (resolvePersonForIdentity lookup)
    if (s.indexOf('SELECT PERSON_ID FROM PERSON_IDENTITIES WHERE IDENTITY_KEY') === 0) {
      var lookupIdentityKey = p[0];
      var piMatch = personIdentities.filter(function(r) { return r.identity_key === lookupIdentityKey; });
      return Promise.resolve({ rows: piMatch.length ? [{ person_id: piMatch[0].person_id }] : [] });
    }

    // tir-s1 / tir-s2: SELECT PERSON_ID FROM team_memberships (resolvePersonForIdentity fallback)
    if (s.indexOf('SELECT PERSON_ID FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1 && s.indexOf('AND TENANT_ID') === -1) {
      var fallbackTenantId = p[0];
      var tmFallback = teamMemberships.filter(function(r) { return r.tenant_id === fallbackTenantId; });
      return Promise.resolve({ rows: tmFallback.length ? [{ person_id: tmFallback[0].person_id }] : [] });
    }

    // tir-s7: SELECT ROLE FROM team_memberships (resolveRoleForPerson, person-scoped)
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE PERSON_ID') === 0 && s.indexOf('AND TENANT_ID') !== -1) {
      var scopedPersonId = p[0];
      var scopedTenantId = p[1];
      var tmScoped = teamMemberships.filter(function(r) { return r.person_id === scopedPersonId && r.tenant_id === scopedTenantId; });
      return Promise.resolve({ rows: tmScoped.length ? [{ role: tmScoped[0].role }] : [] });
    }

    // tir-s1: SELECT ROLE FROM team_memberships (resolveRoleForTenant, legacy tenant-only lookup)
    if (s.indexOf('SELECT ROLE FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0 && s.indexOf('AND PERSON_ID') === -1) {
      var legacyTenantId = p[0];
      var tmLegacy = teamMemberships.filter(function(r) { return r.tenant_id === legacyTenantId; });
      return Promise.resolve({ rows: tmLegacy.length ? [{ role: tmLegacy[0].role }] : [] });
    }

    // tir-s1: SELECT 1 FROM team_memberships (migration check in migrateTeamSchema)
    if (s.indexOf('SELECT 1 FROM TEAM_MEMBERSHIPS WHERE TENANT_ID') === 0) {
      var checkTenantId = p[0];
      var tmExists = teamMemberships.some(function(r) { return r.tenant_id === checkTenantId; });
      return Promise.resolve({ rows: tmExists ? [{ '?column?': 1 }] : [] });
    }

    // ── session_turns_archive (dsh-s6) ──────────────────────────────────
    // Checked BEFORE the session_turns branches below: "INSERT INTO
    // SESSION_TURNS_ARCHIVE ..." / "SELECT TURNS FROM SESSION_TURNS_ARCHIVE
    // ..." both have "...SESSION_TURNS..." as a literal prefix, so the
    // shorter session_turns checks would otherwise match first and
    // mis-route archive rows into the hot-table array. Same exact-prefix
    // ordering concern already documented above for the products table.
    if (s.indexOf('INSERT INTO SESSION_TURNS_ARCHIVE') === 0) {
      var staId = p[0];
      var staJourneyId = p[1];
      var staTenantId = p[2];
      var staSkillName = p[3];
      var staTurns = JSON.parse(p[4]);
      var staCreatedAt = p[5];
      sessionTurnsArchive.push({
        id: staId, journey_id: staJourneyId, tenant_id: staTenantId,
        skill_name: staSkillName, turns: staTurns, created_at: staCreatedAt
      });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
    if (s.indexOf('SELECT TURNS FROM SESSION_TURNS_ARCHIVE') === 0) {
      var lookupStaJourneyId = p[0];
      var lookupStaSkillName = p[1];
      var staMatch = sessionTurnsArchive.find(function(r) { return r.journey_id === lookupStaJourneyId && r.skill_name === lookupStaSkillName; });
      return Promise.resolve({ rows: staMatch ? [{ turns: staMatch.turns }] : [] });
    }

    // ── session_turns (dsh-s3) ───────────────────────────────────────────
    // Upsert on (journey_id, skill_name). turns arrives as a JSON STRING
    // (matching the real INSERT session-turns-pg.js issues); stored and
    // returned already-parsed, matching how the real `pg` driver auto-parses
    // a jsonb column on read.
    if (s.indexOf('INSERT INTO SESSION_TURNS') === 0) {
      var stJourneyId = p[0];
      var stTenantId = p[1];
      var stSkillName = p[2];
      var stTurns = JSON.parse(p[3]);
      var stExisting = sessionTurns.find(function(r) { return r.journey_id === stJourneyId && r.skill_name === stSkillName; });
      if (stExisting) {
        stExisting.turns = stTurns;
        stExisting.tenant_id = stTenantId;
      } else {
        sessionTurns.push({ journey_id: stJourneyId, tenant_id: stTenantId, skill_name: stSkillName, turns: stTurns });
      }
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
    if (s.indexOf('SELECT TURNS FROM SESSION_TURNS') === 0) {
      var lookupStJourneyId = p[0];
      var lookupStSkillName = p[1];
      var stMatch = sessionTurns.find(function(r) { return r.journey_id === lookupStJourneyId && r.skill_name === lookupStSkillName; });
      return Promise.resolve({ rows: stMatch ? [{ turns: stMatch.turns }] : [] });
    }

    // Unknown statement — resolve empty rather than throw, so an unanticipated
    // startup-time query never crashes the test server. Logged for visibility.
    console.warn('[fake-test-db] unhandled query (returning empty rows): ' + s.slice(0, 120));
    return Promise.resolve({ rows: [] });
  }

  /**
   * s1.1 -- upsert a journey row (by journey_id), used by the saveJourney-shaped
   * adapter server.js wires journey-store.js to in NODE_ENV=test. Not a SQL
   * statement -- a direct method call, mirroring the same "narrow, explicit
   * support" philosophy as the SQL branches above, without needing to emulate
   * journey-store-pg.js's real INSERT/JSONB shape here.
   * @param {{journey_id:string, tenant_id:?string, product_id:?string, feature_slug:?string, stage:?string, active_session_id:?string}} row
   */
  function _upsertJourney(row) {
    var existing = journeys.find(function(j) { return j.journey_id === row.journey_id; });
    if (existing) { Object.assign(existing, row); } else { journeys.push(Object.assign({}, row)); }
    return Promise.resolve();
  }

  return {
    query: query,
    _upsertJourney: _upsertJourney,
    _reset: function() {
      users = []; nextUserId = 1;
      products = []; nextProductSeq = 1;
      people = []; nextPersonId = 1;
      teamMemberships = [];
      personIdentities = [];
      journeys = [];
      sessionTurns = [];
      sessionTurnsArchive = [];
      pods = [];
      podMembers = []; nextPodMemberId = 1;
      podAssignments = [];
      featureCollaborators = [];
      featureCollaboratorRemovals = [];
    }
  };
}

module.exports = { createFakeTestDb };
