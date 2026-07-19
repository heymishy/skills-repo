'use strict';

var _posthog = require('../modules/posthog-server');
var _productDraft = require('../adapters/product-draft');
var _htmlShell = require('../utils/html-shell');
var _postHogFlags = require('../modules/posthog-flags'); // bri-s1.5 — shared isEnabled() (D37)
var _flagKeys = require('../modules/flag-keys'); // bri-s1.5
var _repoAdapter = require('../adapters/repo-adapter'); // prc-s2.1
var _productRollup = require('../modules/product-rollup'); // pr-s3
var _pipelineStateFetchAdapter = require('../adapters/pipeline-state-fetch-adapter'); // pr-s3
var _syncFreshness = require('../modules/sync-freshness'); // pr-s3
var _kanbanView = require('../views/kanban-view'); // kbc-s1 -- shared renderer for product/org/tenant boards

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// JSONB columns (health_counts, test_coverage, ac_coverage, taxonomy, dod_status_counts)
// come back from `pg` already parsed into objects -- only parse if we actually got a string.
function _parseJsonbField(value, fallback) {
  if (value == null) { return fallback; }
  return (typeof value === 'string') ? JSON.parse(value) : value;
}

function _renderProductDashboard(products, login) {
  var cardsHtml = products.length === 0
    ? '<div style="padding:48px 0;text-align:center;color:var(--muted)">' +
        '<p style="font-size:18px;margin:0 0 16px">No products yet</p>' +
        '<a href="/products/new" style="display:inline-block;padding:10px 20px;background:var(--accent);color:var(--accent-ink);border-radius:6px;text-decoration:none;font-weight:500">Create your first product →</a>' +
      '</div>'
    : products.map(function(p) {
        return '<a href="/products/' + _escapeHtml(p.product_id) + '" style="display:block;padding:20px;background:var(--surface);border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);margin-bottom:12px">' +
          '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
            '<span style="font-size:16px;font-weight:600">' + _escapeHtml(p.name) + '</span>' +
            '<span style="font-size:12px;color:var(--muted)">' + _escapeHtml(String(p.featureCount)) + ' feature' + (p.featureCount === 1 ? '' : 's') + '</span>' +
          '</div>' +
          (p.lastUpdated ? '<div style="font-size:12px;color:var(--muted);margin-top:4px">Last updated ' + _escapeHtml(new Date(p.lastUpdated).toLocaleDateString()) + '</div>' : '') +
        '</a>';
      }).join('');
  var body = '<div style="max-width:720px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<h1 style="margin:0;font-size:24px">Products</h1>' +
      (products.length > 0 ? '<a href="/products/new" style="padding:8px 16px;background:var(--accent);color:var(--accent-ink);border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">New product</a>' : '') +
    '</div>' +
    cardsHtml +
    '<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--line)">' +
      '<a href="/org/kanban" style="font-size:14px;color:var(--muted);text-decoration:none">View org kanban →</a>' +
    '</div>' +
  '</div>';
  return _htmlShell.renderShell({ title: 'Products', bodyContent: body, user: { login: login }, active: 'dashboard' });
}

function _renderProductNew(login, error) {
  var errorHtml = error ? '<div style="padding:12px;background:#fee;border:1px solid #fcc;border-radius:6px;color:#c33;margin-bottom:16px;font-size:14px">' + _escapeHtml(error) + '</div>' : '';
  var body = '<div style="max-width:560px">' +
    '<h1 style="margin:0 0 24px;font-size:24px">Create a product</h1>' +
    errorHtml +
    '<form id="psh-product-form" style="display:flex;flex-direction:column;gap:16px">' +
      '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">Product name <span style="color:var(--muted)">(required)</span>' +
        '<input id="psh-name" name="name" type="text" required autocomplete="off" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:15px;background:var(--surface);color:var(--ink)">' +
      '</label>' +
      '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">Short description <span style="color:var(--muted)">(optional — helps the AI generate better context files)</span>' +
        '<textarea id="psh-description" name="description" rows="3" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:14px;background:var(--surface);color:var(--ink);resize:vertical"></textarea>' +
      '</label>' +
      '<button id="psh-draft-btn" type="button" onclick="pshGenerateDraft()" style="align-self:flex-start;padding:10px 20px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer">Generate context files →</button>' +
    '</form>' +
    '<div id="psh-drafts" style="display:none;margin-top:32px">' +
      '<h2 style="font-size:18px;margin:0 0 16px">Review and edit your context files</h2>' +
      '<form id="psh-confirm-form" method="POST" action="/products/confirm" style="display:flex;flex-direction:column;gap:20px">' +
        '<input type="hidden" id="psh-confirm-name" name="name">' +
        '<input type="hidden" id="psh-confirm-description" name="description">' +
        ['mission','roadmap','techStack','constraints','architectureGuardrails'].map(function(field) {
          var label = { mission:'Mission', roadmap:'Roadmap', techStack:'Tech stack', constraints:'Constraints', architectureGuardrails:'Architecture guardrails' }[field];
          return '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px">' + label +
            '<textarea id="psh-draft-' + field + '" name="' + field + '" rows="5" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:13px;font-family:monospace;background:var(--surface);color:var(--ink);resize:vertical"></textarea>' +
          '</label>';
        }).join('') +
        '<div style="display:flex;gap:12px">' +
          '<button type="submit" style="padding:10px 24px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer">Confirm and create product</button>' +
          '<button type="button" onclick="document.getElementById(\'psh-drafts\').style.display=\'none\'" style="padding:10px 16px;background:none;border:1px solid var(--line);border-radius:6px;font-size:14px;cursor:pointer;color:var(--muted)">Edit name</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
    '<script>' +
    'async function pshGenerateDraft(){' +
      'var btn=document.getElementById(\'psh-draft-btn\');' +
      'var name=document.getElementById(\'psh-name\').value.trim();' +
      'var desc=document.getElementById(\'psh-description\').value.trim();' +
      'if(!name){alert(\'Product name is required\');return;}' +
      'btn.disabled=true;btn.textContent=\'Generating…\';' +
      'try{' +
        'var r=await fetch(\'/products/new\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({name:name,description:desc})});' +
        'var j=await r.json();' +
        'var d=j.draft||{};' +
        'document.getElementById(\'psh-confirm-name\').value=name;' +
        'document.getElementById(\'psh-confirm-description\').value=desc;' +
        'document.getElementById(\'psh-draft-mission\').value=d.mission||\'Mission: \'+name;' +
        'document.getElementById(\'psh-draft-roadmap\').value=d.roadmap||\'\';' +
        'document.getElementById(\'psh-draft-techStack\').value=d.techStack||\'\';' +
        'document.getElementById(\'psh-draft-constraints\').value=d.constraints||\'\';' +
        'document.getElementById(\'psh-draft-architectureGuardrails\').value=d.architectureGuardrails||\'\';' +
        'document.getElementById(\'psh-drafts\').style.display=\'block\';' +
        'document.getElementById(\'psh-drafts\').scrollIntoView({behavior:\'smooth\'});' +
      '}catch(e){alert(\'Failed to generate draft: \'+e.message);}' +
      'finally{btn.disabled=false;btn.textContent=\'Generate context files →\';}' +
    '}' +
    '<\/script>' +
  '</div>';
  return _htmlShell.renderShell({ title: 'New product', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: ['Products', 'New'] });
}

function _renderProductView(productName, productId, features, login, rollupRow, isSyncing, repoOwner, repoName) {
  var featuresHtml = features.length === 0
    ? '<p style="color:var(--muted);font-size:14px">No features yet.</p>'
    : '<ul style="list-style:none;padding:0;margin:0">' +
        features.map(function(f) {
          return '<li style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:500">' + _escapeHtml(f.featureSlug || f.journey_id) + '</div>' +
              '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(f.stage || '') + '</div>' +
            '</div>' +
            '<span style="font-size:12px;color:' + (f.health === 'red' ? '#ef4444' : f.health === 'amber' ? '#f59e0b' : '#22c55e') + '">' +
              (f.health === 'red' ? '⚠ Blocked' : f.health === 'amber' ? '⚠ Warning' : '✓ Healthy') +
            '</span>' +
          '</li>';
        }).join('') +
      '</ul>';
  var HEALTH_LABELS = { green: '✓ Healthy', amber: '⚠ Warning', red: '✕ Blocked', unknown: '? Unknown' };
  var HEALTH_COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444', unknown: 'var(--muted)' };
  var healthCounts = (rollupRow && rollupRow.health_counts) ? _parseJsonbField(rollupRow.health_counts, null) : null;
  var overallSignal = healthCounts ? _productRollup.computeOverallHealthSignal(healthCounts) : null;
  var healthHtml = healthCounts
    ? '<div style="margin-top:12px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:13px">' +
        '<span style="font-weight:600;color:' + HEALTH_COLORS[overallSignal] + '">Overall: ' + _escapeHtml(HEALTH_LABELS[overallSignal]) + '</span>' +
        ['green', 'amber', 'red', 'unknown'].map(function(status) {
          return '<span style="color:' + HEALTH_COLORS[status] + '">' + _escapeHtml(HEALTH_LABELS[status]) + ': ' + _escapeHtml(String(healthCounts[status] || 0)) + '</span>';
        }).join('') +
      '</div>'
    : '';
  var testCoverage = (rollupRow && rollupRow.test_coverage) ? _parseJsonbField(rollupRow.test_coverage, null) : null;
  var coverageHtml;
  if (!testCoverage || testCoverage.noData || !Array.isArray(testCoverage.perFeature)) {
    coverageHtml = '<div style="margin-top:12px;font-size:13px;color:var(--muted)">Test coverage: No test data yet</div>';
  } else {
    var perFeatureHtml = testCoverage.perFeature.map(function(f) {
      return '<li style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.slug) + ': ' + _escapeHtml(String(f.percentage)) + '%</li>';
    }).join('');
    coverageHtml =
      '<div style="margin-top:12px;font-size:13px">' +
        '<div>Test coverage: <strong>' + _escapeHtml(String(testCoverage.blendedPercentage)) + '%</strong></div>' +
        '<ul style="margin:6px 0 0;padding-left:18px">' + perFeatureHtml + '</ul>' +
      '</div>';
  }
  var acCoverage = (rollupRow && rollupRow.ac_coverage) ? _parseJsonbField(rollupRow.ac_coverage, null) : null;
  var acCoverageHtml;
  if (!acCoverage || acCoverage.noData) {
    acCoverageHtml = '<div style="margin-top:8px;font-size:13px;color:var(--muted)">AC coverage: No AC data yet</div>';
  } else {
    acCoverageHtml = '<div style="margin-top:8px;font-size:13px">AC coverage: <strong>' + _escapeHtml(String(acCoverage.blendedPercentage)) + '%</strong></div>';
  }
  var taxonomy = (rollupRow && rollupRow.taxonomy) ? _parseJsonbField(rollupRow.taxonomy, null) : null;
  var taxonomyHtml = '';
  if (taxonomy) {
    var epicsSectionHtml = '';
    if (taxonomy.groups && taxonomy.groups.length > 0) {
      epicsSectionHtml =
        '<h3 style="font-size:14px;margin:16px 0 8px">Epics</h3>' +
        taxonomy.groups.map(function(g) {
          return '<div style="margin-bottom:10px">' +
            '<h4 style="font-size:13px;margin:0 0 4px">' + _escapeHtml(g.epicName || g.epicSlug) + '</h4>' +
            '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--muted)">' +
              g.items.map(function(item) {
                return '<li tabindex="0">' + _escapeHtml(item.slug) + '</li>';
              }).join('') +
            '</ul>' +
          '</div>';
        }).join('');
    }
    var ungroupedSectionHtml = (taxonomy.ungrouped && taxonomy.ungrouped.length > 0)
      ? '<h3 style="font-size:14px;margin:16px 0 8px">Other features</h3>' +
        '<ul style="margin:0;padding-left:18px;font-size:12px">' +
          taxonomy.ungrouped.map(function(f) {
            var link = f.discoveryArtefact
              ? ' — <a href="/artefact/' + _escapeHtml(f.slug) + '/discovery" tabindex="0">' + _escapeHtml(f.discoveryArtefact) + '</a>'
              : '';
            return '<li tabindex="0">' + _escapeHtml(f.name || f.slug) + link + '</li>';
          }).join('') +
        '</ul>'
      : '';
    taxonomyHtml = '<div style="margin-top:16px">' + epicsSectionHtml + ungroupedSectionHtml + '</div>';
  }
  var syncedAtLabel = rollupRow ? _syncFreshness.formatSyncedAt(rollupRow.synced_at) : _syncFreshness.formatSyncedAt(null);
  var dodCountsHtml = rollupRow
    ? Object.entries(_parseJsonbField(rollupRow.dod_status_counts, {})).map(function(entry) {
        return _escapeHtml(entry[0]) + ': ' + _escapeHtml(String(entry[1]));
      }).join(' &middot; ')
    : '';
  var refreshLabel = isSyncing ? 'Syncing…' : 'Refresh';
  var refreshDisabledAttr = isSyncing ? ' disabled' : '';
  var freshnessHtml =
    '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)">' +
      '<span id="psh-sync-label">' + _escapeHtml(syncedAtLabel) + (dodCountsHtml ? ' &middot; ' + dodCountsHtml : '') + '</span>' +
      '<button type="button" id="psh-refresh-btn" onclick="pshTriggerSync(\'' + _escapeHtml(productId) + '\')"' + refreshDisabledAttr + ' style="padding:4px 10px;border:1px solid var(--line);border-radius:5px;background:none;font-size:12px;cursor:pointer;color:var(--ink)">' + _escapeHtml(refreshLabel) + '</button>' +
    '</div>';
  var repoHtml = '';
  if (!repoOwner || !repoName) {
    repoHtml =
      '<div style="margin-top:16px;padding:12px;background:var(--surface);border:1px solid var(--line);border-radius:6px">' +
        '<h3 style="margin:0 0 12px;font-size:14px">Connect GitHub repo</h3>' +
        '<form id="rpc-repo-form" style="display:flex;flex-direction:column;gap:12px">' +
          '<div style="display:flex;gap:10px">' +
            '<button type="button" id="rpc-btn-create" onclick="rpcShowCreateForm()" style="flex:1;padding:10px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer">Create new repo</button>' +
            '<button type="button" id="rpc-btn-connect" onclick="rpcShowConnectForm()" style="flex:1;padding:10px;background:none;border:1px solid var(--line);border-radius:6px;font-size:13px;cursor:pointer">Connect existing</button>' +
          '</div>' +
          '<div id="rpc-create-panel" style="display:none">' +
            '<label style="display:flex;flex-direction:column;gap:6px;font-size:13px">New repo name<input id="rpc-create-name" type="text" placeholder="my-repo" style="padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;background:var(--surface);color:var(--ink)"></label>' +
            '<button type="button" onclick="rpcSubmitCreate(\'' + _escapeHtml(productId) + '\')" style="padding:8px 12px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:4px;font-size:13px;cursor:pointer">Create</button>' +
          '</div>' +
          '<div id="rpc-connect-panel" style="display:none">' +
            '<label style="display:flex;flex-direction:column;gap:6px;font-size:13px">Repository owner<input id="rpc-connect-owner" type="text" placeholder="github-username" style="padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;background:var(--surface);color:var(--ink)"></label>' +
            '<label style="display:flex;flex-direction:column;gap:6px;font-size:13px">Repository name<input id="rpc-connect-repo" type="text" placeholder="repo-name" style="padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:13px;background:var(--surface);color:var(--ink)"></label>' +
            '<button type="button" onclick="rpcSubmitConnect(\'' + _escapeHtml(productId) + '\')" style="padding:8px 12px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:4px;font-size:13px;cursor:pointer">Connect</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  } else {
    repoHtml =
      '<div style="margin-top:16px;padding:12px;background:var(--surface);border:1px solid var(--line);border-radius:6px">' +
        '<div style="font-size:13px;color:var(--muted)">GitHub repository</div>' +
        '<div style="margin-top:4px;font-size:14px;font-weight:500">' + _escapeHtml(repoOwner) + ' / ' + _escapeHtml(repoName) + '</div>' +
      '</div>';
  }
  var body = '<div style="max-width:720px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:4px"><a href="/dashboard" style="color:var(--muted);text-decoration:none">Products</a> ›</div>' +
        '<h1 style="margin:0;font-size:24px">' + _escapeHtml(productName) + '</h1>' +
      '</div>' +
      '<div style="display:flex;gap:10px">' +
        '<button type="button" onclick="pshConfirmDeleteProduct(\'' + _escapeHtml(productId) + '\')" style="padding:8px 14px;border:1px solid #ef4444;border-radius:6px;background:none;color:#ef4444;font-size:13px;cursor:pointer">Delete product</button>' +
        '<a href="/products/' + _escapeHtml(productId) + '/kanban" style="padding:8px 14px;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">Kanban</a>' +
        '<form method="POST" action="/products/' + _escapeHtml(productId) + '/features" style="margin:0">' +
          '<button type="submit" style="padding:8px 16px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer">New feature</button>' +
        '</form>' +
      '</div>' +
    '</div>' +
    freshnessHtml +
    repoHtml +
    healthHtml +
    coverageHtml +
    acCoverageHtml +
    taxonomyHtml +
    featuresHtml +
    '<script>' +
    'function pshConfirmDeleteProduct(id){' +
      'var ok=confirm("Delete this product? This permanently removes it from wuce, including its journeys and standards cache. Your GitHub repository will NOT be deleted — this only removes the product from wuce, the repo and its history are untouched.");' +
      'if(!ok)return;' +
      'fetch(\'/products/\'+id,{method:\'DELETE\'}).then(function(r){' +
        'if(r.ok){window.location.href=\'/dashboard\';}' +
        'else{alert(\'Failed to delete product\');}' +
      '}).catch(function(e){alert(\'Failed to delete product: \'+e.message);});' +
    '}' +
    'async function pshTriggerSync(id){' +
      'var btn=document.getElementById(\'psh-refresh-btn\');' +
      'var label=document.getElementById(\'psh-sync-label\');' +
      'btn.disabled=true;btn.textContent=\'Syncing…\';' +
      'try{' +
        'var r=await fetch(\'/products/\'+id+\'/sync\',{method:\'POST\'});' +
        'if(r.ok){window.location.reload();}' +
        'else{var j=await r.json();alert(j.error||\'Sync failed\');}' +
      '}catch(e){alert(\'Sync failed: \'+e.message);}' +
      'finally{btn.disabled=false;btn.textContent=\'Refresh\';}' +
    '}' +
    'function rpcShowCreateForm(){document.getElementById("rpc-create-panel").style.display="block";document.getElementById("rpc-connect-panel").style.display="none";}' +
    'function rpcShowConnectForm(){document.getElementById("rpc-connect-panel").style.display="block";document.getElementById("rpc-create-panel").style.display="none";}' +
    'async function rpcSubmitCreate(productId){var name=document.getElementById("rpc-create-name").value.trim();if(!name){alert("Repo name required");return;}try{var r=await fetch("/products/"+productId+"/repo/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name})});if(r.ok){window.location.reload();}else{var j=await r.json();alert("Error: "+(j.error||"Failed"));}}catch(e){alert("Error: "+e.message);}}' +
    'async function rpcSubmitConnect(productId){var owner=document.getElementById("rpc-connect-owner").value.trim();var repo=document.getElementById("rpc-connect-repo").value.trim();if(!owner||!repo){alert("Owner and repo required");return;}try{var r=await fetch("/products/"+productId,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner:owner,repo:repo})});if(r.ok){window.location.reload();}else{var j=await r.json();alert("Error: "+(j.error||"Failed"));}}catch(e){alert("Error: "+e.message);}}' +
    '<\/script>' +
  '</div>';
  return _htmlShell.renderShell({ title: productName, bodyContent: body, user: { login: login }, active: 'dashboard' });
}

function _isTeamPlan(session) {
  // Only restrict when plan is explicitly 'solo'; unset/unknown defaults to unrestricted
  return !session || session.plan !== 'solo';
}

/**
 * bri-s3.2: read + parse the request body, short-circuiting when req.body is
 * already populated (existing unit tests construct req objects with body
 * pre-set, Express-mock style). Real raw-http requests (production, E2E)
 * have no body-parsing middleware ahead of these routes, so without this the
 * handlers below throw on `req.body.name` — a pre-existing gap this story's
 * E2E spec surfaced while driving the real product-creation flow.
 * Supports JSON and application/x-www-form-urlencoded, matching the pattern
 * already used by routes/journey.js's _readFormBody and routes/auth-email.js's
 * _readBody.
 * @param {object} req
 * @returns {Promise<object>}
 */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var ct = (req.headers && req.headers['content-type']) || '';
      if (ct.indexOf('application/json') !== -1) {
        try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
      } else {
        var params = new URLSearchParams(raw);
        var obj = {};
        params.forEach(function(v, k) { obj[k] = v; });
        resolve(obj);
      }
    });
    req.on('error', function() { resolve({}); });
  });
}

async function handlePostProductNew(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var draft = await _productDraft.generateProductDraft({
    name: (req.body && req.body.name) || '',
    description: (req.body && req.body.description) || ''
  });
  var body = JSON.stringify({ draft: draft });
  if (res.json) {
    res.json({ draft: draft }); // test mock path
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  }
}

async function handlePostProductConfirm(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;

  // Ensure context columns exist — idempotent no-op once columns are present
  await Promise.all([
    _pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS mission TEXT'),
    _pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS roadmap TEXT'),
    _pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS tech_stack TEXT'),
    _pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS constraints TEXT'),
    _pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS architecture_guardrails TEXT')
  ]).catch(function(e) { console.error('[psh-s3] column migration error:', e.message); });
  var name = (req.body && req.body.name) || '';
  var description = (req.body && req.body.description) || '';
  var mission = (req.body && req.body.mission) || '';
  var techStack = (req.body && req.body.techStack) || '';
  var constraints = (req.body && req.body.constraints) || '';
  var roadmap = (req.body && req.body.roadmap) || '';
  var architectureGuardrails = (req.body && req.body.architectureGuardrails) || '';

  // Path traversal guard on name
  if (name.indexOf('..') !== -1 || name.indexOf('/') !== -1 || name.indexOf('\\') !== -1) {
    if (res.status) { res.status(400).json({ error: 'invalid product name' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'invalid product name' })); }
    return;
  }

  // Solo plan: max 1 product
  if (!_isTeamPlan(req.session) && _pool) {
    var existing = await _pool.query('SELECT product_id FROM products WHERE tenant_id = $1', [tenantId]);
    if (existing.rows.length >= 1) {
      if (res.status) { res.status(403).json({ reason: 'plan_limit', upgradeRequired: true }); }
      else { res.writeHead(302, { 'Location': '/products/new?error=plan_limit' }); res.end(); }
      return;
    }
  }

  var r = await _pool.query(
    `INSERT INTO products (tenant_id, name, description, mission, tech_stack, constraints, roadmap, architecture_guardrails, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING product_id`,
    [tenantId, name, description, mission, techStack, constraints, roadmap, architectureGuardrails, tenantId]
  );
  var productId = r.rows[0].product_id;

  _ph.capture(tenantId, 'product_created', {
    productId: productId,
    tenantId: tenantId,
    plan: req.session && req.session.plan
  });

  // Redirect to the product view after creation
  if (res.status) {
    res.status(201).json({ product_id: productId }); // test mock path
  } else {
    res.writeHead(302, { 'Location': '/products/' + productId });
    res.end();
  }
}

async function handleGetDashboard(req, res, _next, pool) {
  var _pool = pool;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;

  // kbc-s1 (AC4): GET /dashboard?view=board -- tenant-scope kanban board,
  // aggregating every journey across every product this tenant owns onto
  // one set of stage columns, via the same shared renderer used by product
  // and org scope. Mirrors the exact ?view=board convention the removed
  // /features route used, per the story's Architecture Constraints.
  if (req.query && req.query.view === 'board') {
    var tenantColumns = await buildTenantKanbanColumns(_pool, tenantId);
    var tenantHtml = _kanbanView.renderKanban({ columns: tenantColumns });
    _sendKanbanHtml(res, tenantHtml);
    return;
  }

  var products = (await _pool.query(
    'SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  )).rows;
  var cards = await Promise.all(products.map(async function(p) {
    var journeyRows = (await _pool.query(
      'SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id = $1',
      [p.product_id]
    )).rows;
    var lastUpdated = journeyRows.reduce(function(mx, j) {
      return (!mx || j.updated_at > mx) ? j.updated_at : mx;
    }, null);
    return {
      product_id: p.product_id,
      name: _escapeHtml(p.name),
      featureCount: journeyRows.length,
      lastUpdated: lastUpdated
    };
  }));
  if (res.json) {
    res.json({ products: cards, showCta: cards.length === 0 });
  } else {
    var html = _renderProductDashboard(cards, login);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

function handleGetProductNew(req, res) {
  var login = req.session && req.session.login;
  var errorParam = req.query && req.query.error;
  var error = errorParam === 'plan_limit' ? 'Your plan allows 1 product. Upgrade to create more.' : null;
  var html = _renderProductNew(login, error);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function handleGetProductView(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;
  // bri-s3.4: this lookup previously had no tenant_id filter at all -- any
  // authenticated user of any tenant could view any other tenant's product
  // (and its feature list) by guessing/knowing the product ID. 404 (not 403)
  // for a missing/mismatched tenant, consistent with the existing
  // FORBIDDEN-vs-NOT_FOUND policy in middleware/journey-access.js.
  var prodRow = (await _pool.query(
    'SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  var productName = prodRow.name;
  var rollupRow = (await _pool.query(
    'SELECT dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at FROM product_rollups WHERE product_id = $1',
    [productId]
  )).rows[0] || null;
  var isSyncing = _productRollup.isSyncInProgress(productId);
  var rows = (await _pool.query(
    "SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1",
    [productId]
  )).rows;
  var features = rows.map(function(j) {
    return {
      journey_id: j.journey_id,
      stage: j.stage || 'discovery',
      health: 'green',
      featureSlug: j.feature_slug
    };
  });
  if (res.json) {
    res.json({ features: features });
  } else {
    var html = _renderProductView(productName, productId, features, login, rollupRow, isSyncing, prodRow.repo_owner, prodRow.repo_name);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

/**
 * pr-s3 AC2/AC4 -- POST /products/:id/sync: triggers a new sync of the
 * product's connected repo's pipeline-state.json, writing a fresh rollup to
 * the cache table. Rejects with 409 if a sync for this product is already
 * in flight (AC4) rather than starting a second concurrent fetch.
 */
async function handlePostProductSync(req, res, _next, pool, posthog) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var accessToken = req.session && req.session.accessToken;

  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  if (_productRollup.isSyncInProgress(productId)) {
    if (res.status) { res.status(409).json({ error: 'A sync for this product is already in progress' }); }
    else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'A sync for this product is already in progress' })); }
    return;
  }

  var repoRow = (await _pool.query(
    'SELECT repo_owner, repo_name FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!repoRow || !repoRow.repo_owner || !repoRow.repo_name) {
    if (res.status) { res.status(400).json({ error: 'This product has no GitHub repo configured.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'This product has no GitHub repo configured.' })); }
    return;
  }

  try {
    var rollup = await _productRollup.triggerProductSync(_pool, _pipelineStateFetchAdapter, {
      productId: productId,
      repoOwner: repoRow.repo_owner,
      repoName: repoRow.repo_name,
      accessToken: accessToken
    });
    if (res.status) { res.status(200).json({ synced: true, rollup: rollup }); }
    else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ synced: true, rollup: rollup })); }
  } catch (err) {
    if (res.status) { res.status(502).json({ error: err.message }); }
    else { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
  }
}

/**
 * prc-s4.2: DELETE /products/:id — hard-delete a product and its wuce-side
 * data (journeys, standards-cache rows). The underlying GitHub repo is NEVER
 * touched by this handler -- no fetch()/https call of any kind is made here,
 * by design (MVP scope: detach only, never delete the repo). Tenant-scoped:
 * a product not owned by the caller's tenant returns 404 (not 403), matching
 * the existing FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this file
 * (handleGetProductView, handleGetProductKanban).
 */
async function handleDeleteProduct(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  // Hard delete, wuce-side data only. Never a GitHub API call -- the repo
  // (if any is connected) is left completely untouched. Explicit DELETEs
  // (not relying on ON DELETE CASCADE/SET NULL alone) so the deletion is
  // directly assertable and journeys are actually removed, not orphaned
  // with product_id set to NULL (journeys.product_id is ON DELETE SET NULL,
  // which would leave stale rows behind -- not what AC1 requires).
  await _pool.query('DELETE FROM journeys WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM standard_product_optouts WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM standards WHERE product_id = $1', [productId]);
  await _pool.query('DELETE FROM products WHERE product_id = $1', [productId]);

  _ph.capture(tenantId, 'product_deleted', {
    productId: productId,
    tenantId: tenantId,
    deletedBy: req.session && req.session.login
  });

  if (res.status) {
    res.status(200).json({ deleted: true, product_id: productId });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ deleted: true, product_id: productId }));
  }
}

/**
 * prc-s2.1: POST /products/:id/repo/create -- create a brand-new GitHub repo
 * under the operator's own account (ADR-020: their own OAuth token, never a
 * service account) and populate the product's repo_provider/repo_owner/
 * repo_name columns. AC3: sessions with no GitHub accessToken (Google/email
 * auth) are directed to the existing GET /settings/link-account/github/start
 * flow -- no GitHub API call is attempted and no columns are written. AC4:
 * the UPDATE completes before any response is sent, so there is never a
 * window where the product looks configured but isn't.
 */
async function handlePostProductRepoCreate(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var token = req.session && req.session.accessToken;
  var name = (req.body && req.body.name) || '';

  if (!token) {
    var linkBody = { error: 'A GitHub account must be linked before creating a repo.', linkUrl: '/settings/link-account/github/start' };
    if (res.status) { res.status(403).json(linkBody); }
    else { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(linkBody)); }
    return;
  }

  var created;
  try {
    created = await _repoAdapter.createRepo(token, name);
  } catch (err) {
    var status = (err && err.name === 'RepoNameTakenError') ? 409 : 502;
    var errBody = { error: (err && err.message) || 'Failed to create repo' };
    if (res.status) { res.status(status).json(errBody); }
    else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(errBody)); }
    return;
  }

  var owner = created && created.owner && created.owner.login;
  var repoName = created && created.name;

  await _pool.query(
    'UPDATE products SET repo_provider = $1, repo_owner = $2, repo_name = $3 WHERE product_id = $4',
    ['github', owner, repoName, productId]
  );

  _ph.capture(tenantId, 'product_repo_created', {
    productId: productId,
    tenantId: tenantId,
    repoOwner: owner,
    repoName: repoName
  });

  var okBody = { repo_provider: 'github', repo_owner: owner, repo_name: repoName };
  if (res.status) { res.status(201).json(okBody); }
  else { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(okBody)); }
}

var STAGE_COLUMNS = ['discovery','benefit-metric','definition','review','test-plan','definition-of-ready','implementation','definition-of-done'];

function _healthLabel(health) {
  if (health === 'red')   return 'Blocked';
  if (health === 'amber') return 'Warning';
  return 'Healthy';
}

function _respondFlagDisabled(res) {
  // bri-s1.5 — shared not-found/disabled response shape for every flag-gated
  // board handler (AC2, AC3). Short-circuits before any DB call so an off flag
  // never even queries tenant-scoped rows.
  if (res.status) {
    res.status(404).json({ error: 'not_found' });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  }
}

function _sendKanbanHtml(res, html) {
  if (res.contentType) {
    res.contentType('text/html');
    res.send(html);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}

/**
 * kbc-s1 (AC1) -- single shared column-building function used by product,
 * org, AND tenant scope. Takes a list of "product journey groups" —
 * [{ productId, productName, journeys: [{ journey_id, feature_slug, stage, health }] }]
 * — flattens every journey across every group, and buckets them onto
 * STAGE_COLUMNS. Product scope calls this with exactly one group and no
 * productName prefix; org and tenant scope call it with N groups (one per
 * product) and prefix each card's title with its product name so cards from
 * different products remain distinguishable on one shared board.
 * @param {Array} productJourneyGroups
 * @returns {Array} STAGE_COLUMNS-shaped columns: [{ stage, cards: [{id, title, health, healthLabel}] }]
 */
function _aggregateJourneysByStage(productJourneyGroups) {
  var allCards = [];
  (productJourneyGroups || []).forEach(function(group) {
    (group.journeys || []).forEach(function(j) {
      var health = j.health || 'green';
      var title = group.productName
        ? (group.productName + ': ' + (j.feature_slug || j.journey_id))
        : (j.feature_slug || j.journey_id);
      allCards.push({
        id: j.journey_id,
        title: title,
        stage: j.stage || 'discovery',
        health: health,
        healthLabel: _healthLabel(health)
      });
    });
  });

  return STAGE_COLUMNS.map(function(stage) {
    return {
      stage: stage,
      cards: allCards
        .filter(function(c) { return c.stage === stage; })
        .map(function(c) { return { id: c.id, title: c.title, health: c.health, healthLabel: c.healthLabel }; })
    };
  });
}

/**
 * kbc-s1 (AC2) -- product-scope column builder: wraps a single product's
 * journey rows as one group (no product-name prefix, since every card on a
 * product board is already scoped to that one product) and delegates to the
 * shared _aggregateJourneysByStage function (AC1: no duplicated column-
 * building logic across scopes).
 * @param {Array} rows -- journeys rows: [{ journey_id, feature_slug, stage, health }]
 * @returns {Array} STAGE_COLUMNS-shaped columns
 */
function buildProductKanbanColumns(rows) {
  return _aggregateJourneysByStage([{ productId: null, productName: null, journeys: rows || [] }]);
}

/**
 * kbc-s1 (AC3) -- org-scope column builder: takes the per-product journey
 * groups already fetched for an org (each with its productName) and
 * delegates to the shared _aggregateJourneysByStage function.
 * @param {Array} productJourneyGroups -- [{ productId, productName, journeys }]
 * @returns {Array} STAGE_COLUMNS-shaped columns
 */
function buildOrgKanbanColumns(productJourneyGroups) {
  return _aggregateJourneysByStage(productJourneyGroups);
}

/**
 * kbc-s1 (AC4) -- tenant-scope column builder: fetches every product this
 * tenant owns, then fetches each product's journeys IN PARALLEL via
 * Promise.all (reusing the exact parallelisation pattern handleGetDashboard
 * already uses below, per the DoR assumption and the Performance NFR), then
 * delegates to the same shared _aggregateJourneysByStage function used by
 * product/org scope. This is what makes AC4 a genuine cross-product
 * aggregate rather than accidentally scoped to only the first product found
 * (U4's specific concern).
 * @param {object} pool -- pg Pool (or equivalent .query()-capable client)
 * @param {string} tenantId
 * @returns {Promise<Array>} STAGE_COLUMNS-shaped columns
 */
async function buildTenantKanbanColumns(pool, tenantId) {
  var products = (await pool.query(
    'SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  )).rows;

  var productJourneyGroups = await Promise.all(products.map(async function(p) {
    var jRows = (await pool.query(
      "SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1",
      [p.product_id]
    )).rows;
    return { productId: p.product_id, productName: p.name, journeys: jRows };
  }));

  return _aggregateJourneysByStage(productJourneyGroups);
}

async function handleGetProductKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  // bri-s1.5 AC2 — gate before the DB call; D37: only the shared isEnabled() helper,
  // no bespoke per-flag evaluation logic.
  var _productKanbanOn = await _postHogFlags.isEnabled(_flagKeys.PRODUCT_KANBAN_VIEW, { tenantId: tenantId });
  if (!_productKanbanOn) {
    _respondFlagDisabled(res);
    return;
  }

  // bri-s3.4: this handler previously returned any product's kanban board to
  // any authenticated user with no tenant ownership check at all. 404 (not
  // 403) on a missing/mismatched product, matching the FORBIDDEN-vs-NOT_FOUND
  // policy used elsewhere in this codebase (middleware/journey-access.js).
  var _ownerRow = (await _pool.query(
    'SELECT tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!_ownerRow || _ownerRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var rows = (await _pool.query(
    "SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1",
    [productId]
  )).rows;

  // kbc-s1 (AC1, AC2): shared column-builder + shared renderer, real HTML
  // response instead of raw JSON. Data-shaping logic (STAGE_COLUMNS,
  // health labels) is unchanged from before this story -- only the "return
  // raw JSON, no rendering" behaviour is replaced, per the DoR contract.
  var columns = buildProductKanbanColumns(rows);

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'product',
    productId: productId,
    tenantId: tenantId,
    featureCount: rows.length
  });

  var html = _kanbanView.renderKanban({ columns: columns });
  _sendKanbanHtml(res, html);
}

async function handleGetOrgKanban(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productFilter = req.query && req.query.product;

  // bri-s1.5 AC3 — gate before any DB call, keyed by tenantId so PostHog's tenant-
  // group targeting (bri-s1.4) applies. Not-found/disabled for a non-targeted tenant
  // never touches the products/journeys query below, so no other tenant's board
  // data can leak even transiently (Security NFR, ADR-025).
  var _orgKanbanOn = await _postHogFlags.isEnabled(_flagKeys.ORG_KANBAN_VIEW, { tenantId: tenantId });
  if (!_orgKanbanOn) {
    _respondFlagDisabled(res);
    return;
  }

  var prodRows = (await _pool.query(
    'SELECT product_id, name FROM products WHERE tenant_id = $1',
    [tenantId]
  )).rows;

  var filteredProds = productFilter
    ? prodRows.filter(function(p) { return p.product_id === productFilter; })
    : prodRows;

  var allJourneyCount = 0;
  var productJourneyGroups = [];
  for (var i = 0; i < filteredProds.length; i++) {
    var p = filteredProds[i];
    var jRows = (await _pool.query(
      "SELECT journey_id, feature_slug, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1 AND tenant_id = $2",
      [p.product_id, tenantId]
    )).rows;
    allJourneyCount += jRows.length;
    productJourneyGroups.push({ productId: p.product_id, productName: p.name, journeys: jRows });
  }

  // kbc-s1 (AC1, AC3): same shared column-builder + shared renderer used by
  // product scope -- not a second, independently-styled implementation.
  var columns = buildOrgKanbanColumns(productJourneyGroups);

  _ph.capture(tenantId || (req.session && req.session.login), 'kanban_viewed', {
    view: 'org',
    tenantId: tenantId,
    productCount: productJourneyGroups.length,
    featureCount: allJourneyCount
  });

  var html = _kanbanView.renderKanban({ columns: columns });
  _sendKanbanHtml(res, html);
}

async function handlePostProductFeature(req, res, _next, pool, posthog) {
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var journeyId = require('crypto').randomUUID();
  await _pool.query(
    `INSERT INTO journeys (journey_id, feature_slug, tenant_id, product_id, data) VALUES ($1, $2, $3, $4, '{}'::jsonb) ON CONFLICT DO NOTHING`,
    [journeyId, 'new-feature-' + journeyId.slice(0, 8), tenantId, productId]
  );
  _ph.capture(tenantId, 'journey_created', {
    journeyId: journeyId,
    productId: productId,
    tenantId: tenantId
  });

  // jrf-s1: FIX — Create a skill session and redirect to discovery chat (not broken /journeys/ route)
  // Following the same pattern as handlePostJourney in journey.js (which works correctly)
  var crypto = require('crypto');
  var path = require('path');
  var _skillsRoute = require('./skills');
  var _journeyDisk = require('../../modules/journey-disk');
  var _journeyStore = require('../modules/journey-store');
  var _repoRootAdapter = require('../adapters/repo-root');

  try {
    var repoRoot = _repoRootAdapter.getRepoRoot(req);

    // Create skill session (following handlePostJourney pattern at line 408-420)
    var sid = crypto.randomUUID();
    var featureSlug = 'new-feature-' + journeyId.slice(0, 8);
    var sessionPath = path.join(repoRoot, 'artefacts', featureSlug, 'sessions', sid);

    // Register the session
    _skillsRoute.registerHtmlSession(sid, sessionPath, 'discovery', {
      productProfile: 'default',
      featureSlug: featureSlug
    });

    // Link session to journey
    _skillsRoute.linkSessionToJourney(sid, journeyId);

    // Mark active session on journey (if store supports it)
    if (_journeyStore.setActiveSession) {
      _journeyStore.setActiveSession(journeyId, sid, 'discovery');
    }

    // Mark stage as active on disk
    try {
      _journeyDisk.updateStage(featureSlug, 'discovery', { status: 'active', sessionId: sid }, repoRoot);
    } catch (_) {
      // Disk update is best-effort; don't fail if it doesn't work
    }

    // Redirect to the skill chat (FIXED: /skills/ not /journeys/)
    var _target = '/skills/discovery/sessions/' + encodeURIComponent(sid) + '/chat';
    if (res.redirect) {
      res.redirect(_target); // test mock path
    } else {
      res.writeHead(303, { 'Location': _target });
      res.end();
    }
  } catch (err) {
    // Fallback: if session creation fails, still redirect but log the error
    console.error('[handlePostProductFeature] Failed to create skill session:', err);
    var _fallbackTarget = '/skills/discovery/sessions/fallback/chat';
    if (res.redirect) {
      res.redirect(_fallbackTarget); // test mock path
    } else {
      res.writeHead(303, { 'Location': _fallbackTarget });
      res.end();
    }
  }
}

/**
 * prc-s4.1 — PUT /products/:id — edit a product's name, description, and/or
 * repo association. Name/description are simple UPDATEs (AC1). Repo changes
 * reuse the repo-access-verification logic from prc-s1.2 via the shared
 * _applyRepoChange helper in product-repo.js, ensuring the edit and
 * first-time-configuration flows never drift (AC3).
 */
async function handlePutProductEdit(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.id;
  var accessToken = req.session && req.session.accessToken;
  var name = (req.body && req.body.name) || undefined;
  var description = (req.body && req.body.description) || undefined;
  var owner = (req.body && req.body.owner) || undefined;
  var repo = (req.body && req.body.repo) || undefined;

  // Tenant-ownership check first
  var prodRow = (await _pool.query(
    'SELECT product_id, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) {
      res.status(404).json({ error: 'not found' });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    }
    return;
  }

  // AC1: Update name/description if provided
  if (name !== undefined || description !== undefined) {
    var setClause = [];
    var params = [];
    var paramIndex = 1;

    if (name !== undefined) {
      setClause.push('name = $' + paramIndex);
      params.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      setClause.push('description = $' + paramIndex);
      params.push(description);
      paramIndex++;
    }

    params.push(productId);
    await _pool.query(
      'UPDATE products SET ' + setClause.join(', ') + ' WHERE product_id = $' + paramIndex,
      params
    );

    _ph.capture(tenantId, 'product_edited', {
      productId: productId,
      tenantId: tenantId,
      name: name,
      description: description,
      changedBy: req.session && req.session.login
    });
  }

  // AC2/AC3: Update repo if provided (reuse shared logic from product-repo.js)
  if (owner !== undefined && repo !== undefined) {
    if (!accessToken) {
      if (res.status) {
        res.status(200).json({
          error: 'Link your GitHub account first to connect a repo.',
          linkUrl: '/settings/link-account/github/start'
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Link your GitHub account first to connect a repo.',
          linkUrl: '/settings/link-account/github/start'
        }));
      }
      return;
    }

    var productRepoModule = require('./product-repo');
    var repoResult = await productRepoModule._applyRepoChange(_pool, productId, tenantId, owner, repo, accessToken);

    if (!repoResult.success) {
      if (res.status) {
        res.status(repoResult.statusCode).json({ error: repoResult.error });
      } else {
        res.writeHead(repoResult.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: repoResult.error }));
      }
      return;
    }

    _ph.capture(tenantId, 'product_repo_connected', {
      productId: productId,
      tenantId: tenantId,
      owner: owner,
      repo: repo,
      changedBy: req.session && req.session.login
    });
  }

  if (res.status) {
    res.status(200).json({ edited: true });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ edited: true }));
  }
}

module.exports = {
  _renderProductView,
  handlePostProductNew,
  handlePostProductConfirm,
  handleGetDashboard,
  handleGetProductNew,
  handleGetProductView,
  handlePostProductSync,
  handlePostProductFeature,
  handleGetProductKanban,
  handleGetOrgKanban,
  handleDeleteProduct,
  handlePostProductRepoCreate,
  handlePutProductEdit,
  // kbc-s1: shared column-building functions, exported for direct unit testing (U1-U5)
  buildProductKanbanColumns,
  buildOrgKanbanColumns,
  buildTenantKanbanColumns,
  STAGE_COLUMNS
};
