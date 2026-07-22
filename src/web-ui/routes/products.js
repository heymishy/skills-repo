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
var _roadmapScan = require('../modules/roadmap-scan'); // a5 -- read-only artefacts/ scan for discovery-only/ideate-only work
var _repoRootAdapter = require('../adapters/repo-root'); // a5 -- reuses the existing local-disk repo-root pattern (already used by handlePostProductFeature)
var _modulesAdapter = require('../adapters/modules-adapter'); // a1 -- curated per-product Modules taxonomy CRUD
var _csrf = require('../middleware/csrf'); // fix-forward (post-a1) -- module CRUD forms need CSRF like every other mutating form in this app

function _escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// JSONB columns (health_counts, test_coverage, ac_coverage, taxonomy, dod_status_counts)
// come back from `pg` already parsed into objects -- only parse if we actually got a string.
function _parseJsonbField(value, fallback) {
  if (value == null) { return fallback; }
  return (typeof value === 'string') ? JSON.parse(value) : value;
}

// Renders a test/AC-coverage breakdown grouped by parent epic (mirroring the
// Epics/Other-features layout used for taxonomy below it), instead of one
// flat list of every story code -- found unreadable at 100+ stories during
// live staging verification (F4). Falls back to the flat perFeature list for
// any pre-existing cached rollup row synced before groups/ungrouped existed.
function _renderGroupedCoverageBreakdown(coverage) {
  if (!Array.isArray(coverage.groups) || !Array.isArray(coverage.ungrouped)) {
    return '<ul style="margin:6px 0 0;padding-left:18px">' +
      coverage.perFeature.map(function(f) {
        return '<li style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.slug) + ': ' + _escapeHtml(String(f.percentage)) + '%</li>';
      }).join('') +
    '</ul>';
  }

  var epicsSectionHtml = coverage.groups.length > 0
    ? '<h4 style="font-size:13px;margin:12px 0 4px">Epics</h4>' +
      coverage.groups.map(function(g) {
        return '<div style="margin-bottom:8px">' +
          '<div style="font-size:12px;font-weight:600;color:var(--muted)">' + _escapeHtml(g.epicName || g.epicSlug) + '</div>' +
          '<ul style="margin:2px 0 0;padding-left:18px">' +
            g.items.map(function(item) {
              return '<li style="font-size:12px;color:var(--muted)">' + _escapeHtml(item.slug) + ': ' + _escapeHtml(String(item.percentage)) + '%</li>';
            }).join('') +
          '</ul>' +
        '</div>';
      }).join('')
    : '';

  var ungroupedSectionHtml = coverage.ungrouped.length > 0
    ? '<h4 style="font-size:13px;margin:12px 0 4px">Other features</h4>' +
      '<ul style="margin:2px 0 0;padding-left:18px">' +
        coverage.ungrouped.map(function(f) {
          return '<li style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.slug) + ': ' + _escapeHtml(String(f.percentage)) + '%</li>';
        }).join('') +
      '</ul>'
    : '';

  return epicsSectionHtml + ungroupedSectionHtml;
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

// a4 -- renders one epic (journey) row with two visually distinct
// indicators: a health pill and a separate test-coverage label. Never
// combined into one value/color (AC2). Accessibility: every colour-coded
// health value carries its own text label (HEALTH_LABELS), never colour
// alone.
function _renderEpicRow(f) {
  var color = f.health === 'red' ? '#ef4444' : f.health === 'amber' ? '#f59e0b' : f.health === 'unknown' ? 'var(--muted)' : '#22c55e';
  var label = f.health === 'red' ? '✕ Blocked' : f.health === 'amber' ? '⚠ Warning' : f.health === 'unknown' ? '? Unknown' : '✓ Healthy';
  return '<li style="padding:14px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">' +
    '<div>' +
      '<div style="font-size:14px;font-weight:500">' + _escapeHtml(f.featureSlug || f.journey_id) + '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(f.stage || '') + '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:12px">' +
      '<span data-a4-health style="font-size:12px;color:' + color + '">' + label + '</span>' +
      '<span data-a4-coverage style="font-size:12px;color:var(--muted)">' + _escapeHtml(f.coverageLabel || 'No test data yet') + '</span>' +
    '</div>' +
  '</li>';
}

// a4 -- one collapsible module section (or the "Unassigned" bucket). Uses a
// real CSS grid-template-rows 0fr<->1fr transition (AC5) toggled by a class,
// not an instant show/hide -- see the .a4-module-body rules emitted once
// alongside the sections below.
function _renderModuleSection(name, id, groupFeatures) {
  var sectionId = 'a4-mod-' + _escapeHtml(String(id));
  return '<div class="a4-module-section" style="margin-bottom:10px;border:1px solid var(--line);border-radius:8px">' +
    '<button type="button" class="a4-module-header" aria-expanded="true" aria-controls="' + sectionId + '" ' +
      'onclick="a4ToggleModule(this)" ' +
      'style="width:100%;text-align:left;padding:12px 16px;background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:var(--ink);display:flex;justify-content:space-between;align-items:center">' +
      '<span>' + _escapeHtml(name) + ' <span style="color:var(--muted);font-weight:400">(' + groupFeatures.length + ')</span></span>' +
      '<span aria-hidden="true">▾</span>' +
    '</button>' +
    '<div id="' + sectionId + '" class="a4-module-body a4-module-body--expanded">' +
      '<div class="a4-module-body-inner">' +
        '<ul style="list-style:none;padding:0 16px 12px;margin:0">' +
          groupFeatures.map(_renderEpicRow).join('') +
        '</ul>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// a4 (AC3) -- scale gauge: total epic/story counts plus a distribution
// strip proportional to how many epics (journeys) fall under each module.
// Epic count = features.length (the same real, module-assignable entities
// AC1 groups); story count = taxonomy.totalCount, the one authoritative
// "how many stories does this synced product have" figure already computed
// by computeTaxonomyRollup (see decisions.md a4 Task 0 finding 5). Never
// divides by zero when there are no epics yet (AC3/AC4 overlap).
function _renderScaleGauge(features, modules, taxonomy) {
  var epicCount = features.length;
  var storyCount = (taxonomy && typeof taxonomy.totalCount === 'number') ? taxonomy.totalCount : 0;
  var summaryHtml = '<div style="font-size:13px;color:var(--ink)"><strong>' + epicCount + '</strong> epic' + (epicCount === 1 ? '' : 's') + ' &middot; <strong>' + storyCount + '</strong> stor' + (storyCount === 1 ? 'y' : 'ies') + '</div>';
  // No epics yet, or no modules curated at all -- nothing meaningful to
  // distribute across, so show the plain count summary only (no
  // "Unassigned" segment implying a module concept that doesn't apply yet).
  if (epicCount === 0 || modules.length === 0) {
    return '<div style="margin-top:16px">' + summaryHtml + '</div>';
  }
  var counts = {};
  var unassignedCount = 0;
  features.forEach(function(f) {
    if (f.moduleId) { counts[f.moduleId] = (counts[f.moduleId] || 0) + 1; }
    else { unassignedCount++; }
  });
  var segments = modules
    .filter(function(m) { return counts[m.id] > 0; })
    .map(function(m) { return { name: m.name, count: counts[m.id] }; });
  if (unassignedCount > 0) { segments.push({ name: 'Unassigned', count: unassignedCount }); }
  var stripHtml = segments.map(function(s) {
    var widthPct = (s.count / epicCount) * 100;
    return '<div data-a4-dist-segment title="' + _escapeHtml(s.name) + ': ' + s.count + '" ' +
      'style="width:' + widthPct + '%;background:var(--accent);opacity:' + (0.5 + (0.5 * widthPct / 100)) + ';height:100%"></div>';
  }).join('');
  return '<div style="margin-top:16px">' +
    summaryHtml +
    '<div style="margin-top:6px;height:10px;border-radius:5px;overflow:hidden;display:flex;background:var(--line)">' + stripHtml + '</div>' +
  '</div>';
}

/**
 * fix-forward (post-a1): a real "Add module" form plus rename/delete
 * controls for existing modules -- A1's own API (POST/PUT/DELETE
 * /products/:id/modules[/:moduleId]) shipped with no client-facing UI at
 * all to reach it, meaning the module-grouped rendering above (A4) was
 * unreachable through the browser (every product starts with zero modules,
 * per discovery's own /clarify decision, and nothing could ever create the
 * first one). Fetch-based submit, matching this app's established pattern
 * (settings.js's renderCreditsTab) -- reload on success, inline error on
 * failure. CSRF-protected, matching every other mutating form in this app.
 * @param {string} productId
 * @param {Array<{id:string, name:string}>} modules
 * @param {string} csrfToken
 * @returns {string}
 */
function _renderModulesManagement(productId, modules, csrfToken) {
  var pid = _escapeHtml(productId);
  var csrf = _escapeHtml(csrfToken);

  var rowsHtml = modules.map(function(m) {
    var mid = _escapeHtml(m.id);
    return (
      '<li class="a1-module-row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)">' +
        '<form class="a1-rename-form" data-module-id="' + mid + '" style="display:flex;gap:8px;flex:1;margin:0">' +
          '<input type="hidden" name="_csrf" value="' + csrf + '">' +
          '<input type="text" name="name" value="' + _escapeHtml(m.name) + '" required ' +
            'style="flex:1;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:13px">' +
          '<button type="submit" style="padding:6px 12px;border:1px solid var(--line);border-radius:6px;background:none;font-size:12px;cursor:pointer">Rename</button>' +
        '</form>' +
        '<button type="button" class="a1-delete-btn" data-module-id="' + mid + '" data-module-name="' + _escapeHtml(m.name) + '" ' +
          'style="padding:6px 12px;border:1px solid #ef4444;border-radius:6px;background:none;color:#ef4444;font-size:12px;cursor:pointer">Delete</button>' +
      '</li>'
    );
  }).join('');

  return (
    '<div style="margin-top:20px;border:1px solid var(--line);border-radius:8px;padding:16px">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:10px">Modules</div>' +
      '<div id="a1-modules-error" role="alert" style="display:none;color:#ef4444;font-size:13px;margin-bottom:8px"></div>' +
      '<ul style="list-style:none;padding:0;margin:0 0 12px">' + rowsHtml + '</ul>' +
      '<form id="a1-create-form" style="display:flex;gap:8px;margin:0">' +
        '<input type="hidden" name="_csrf" value="' + csrf + '">' +
        '<input type="text" name="name" placeholder="New module name" required ' +
          'style="flex:1;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:13px">' +
        '<button type="submit" style="padding:6px 14px;background:var(--accent);color:var(--accent-ink);border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer">Add module</button>' +
      '</form>' +
    '</div>' +
    '<script>(function(){' +
      'var pid=' + JSON.stringify(productId) + ';' +
      'var csrfToken=' + JSON.stringify(csrfToken) + ';' +
      'var errEl=document.getElementById("a1-modules-error");' +
      'function showErr(msg){if(errEl){errEl.textContent=msg;errEl.style.display="block";}}' +
      'function submitJson(url,method,payload){' +
        'return fetch(url,{method:method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})' +
          '.then(function(r){' +
            'if(!r.ok){return r.json().then(function(j){throw new Error((j&&j.error)||("Request failed ("+r.status+")"));});}' +
            'return r.json();' +
          '});' +
      '}' +
      'var createForm=document.getElementById("a1-create-form");' +
      'if(createForm){' +
        'createForm.addEventListener("submit",function(ev){' +
          'ev.preventDefault();' +
          'var fd=new FormData(createForm);' +
          'submitJson("/products/"+pid+"/modules","POST",{name:fd.get("name"),_csrf:fd.get("_csrf")})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(e){showErr(e.message);});' +
        '});' +
      '}' +
      'document.querySelectorAll(".a1-rename-form").forEach(function(f){' +
        'f.addEventListener("submit",function(ev){' +
          'ev.preventDefault();' +
          'var fd=new FormData(f);' +
          'var moduleId=f.getAttribute("data-module-id");' +
          'submitJson("/products/"+pid+"/modules/"+moduleId,"PUT",{name:fd.get("name"),_csrf:fd.get("_csrf")})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(e){showErr(e.message);});' +
        '});' +
      '});' +
      'document.querySelectorAll(".a1-delete-btn").forEach(function(btn){' +
        'btn.addEventListener("click",function(){' +
          'var moduleId=btn.getAttribute("data-module-id");' +
          'var name=btn.getAttribute("data-module-name");' +
          'if(!confirm("Delete module \\"" + name + "\\"? Its epics will be moved out of this module, not deleted."))return;' +
          'submitJson("/products/"+pid+"/modules/"+moduleId,"DELETE",{_csrf:csrfToken})' +
            '.then(function(){window.location.reload();})' +
            '.catch(function(e){showErr(e.message);});' +
        '});' +
      '});' +
    '})()<\/script>'
  );
}

function _renderProductView(productName, productId, features, login, rollupRow, isSyncing, repoOwner, repoName, modules, csrfToken, featureModuleAssignments) {
  modules = modules || [];
  csrfToken = csrfToken || '';
  featureModuleAssignments = featureModuleAssignments || {};
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
    coverageHtml =
      '<div style="margin-top:12px;font-size:13px">' +
        '<div>Test coverage: <strong>' + _escapeHtml(String(testCoverage.blendedPercentage)) + '%</strong></div>' +
        _renderGroupedCoverageBreakdown(testCoverage) +
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
  // tmc-s1 (AC5) -- a product with zero feature_module_assignments rows
  // renders EXACTLY the pre-existing epic-phase grouping below, byte-
  // identical to before this story, so every product that hasn't adopted
  // module classification yet sees no change at all. Module-grouped
  // rendering only activates once at least one assignment row exists.
  var hasAnyFeatureModuleAssignments = Object.keys(featureModuleAssignments).length > 0;
  if (taxonomy && hasAnyFeatureModuleAssignments) {
    var grouped = _productRollup.groupTaxonomyByModule(taxonomy, featureModuleAssignments, modules);
    function _renderTaxonomyItem(item) {
      var link = item.discoveryArtefact
        ? ' — <a href="/artefact/' + _escapeHtml(item.slug) + '/discovery" tabindex="0">' + _escapeHtml(item.discoveryArtefact) + '</a>'
        : '';
      var epicLabel = item.epicName ? ' <span style="color:var(--muted)">(' + _escapeHtml(item.epicName) + ')</span>' : '';
      return '<li tabindex="0">' + _escapeHtml(item.name || item.slug) + epicLabel + link + '</li>';
    }
    var byModuleHtml = grouped.byModule.map(function(bucket) {
      return '<div style="margin-bottom:10px">' +
        '<h4 style="font-size:13px;margin:0 0 4px">' + _escapeHtml(bucket.moduleName) + '</h4>' +
        '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--muted)">' +
          bucket.items.map(_renderTaxonomyItem).join('') +
        '</ul>' +
      '</div>';
    }).join('');
    var unclassifiedHtml = grouped.unclassified.length > 0
      ? '<div style="margin-bottom:10px">' +
          '<h4 style="font-size:13px;margin:0 0 4px">Unclassified</h4>' +
          '<ul style="margin:0;padding-left:18px;font-size:12px;color:var(--muted)">' +
            grouped.unclassified.map(_renderTaxonomyItem).join('') +
          '</ul>' +
        '</div>'
      : '';
    taxonomyHtml = '<div style="margin-top:16px"><h3 style="font-size:14px;margin:16px 0 8px">Features by module</h3>' + byModuleHtml + unclassifiedHtml + '</div>';
  } else if (taxonomy) {
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

  // a4 (AC2) -- match each epic (journey) to a real per-feature health value
  // (A3's healthCounts.perFeature, keyed by feature.slug) and a real
  // per-story test-coverage percentage (testCoverage.perFeature, keyed by
  // story slug -- see decisions.md a4 Task 0 finding 4 for why no
  // per-top-level-feature coverage aggregate exists yet). No match falls
  // back to 'unknown' health / an honest "No test data yet" label -- never
  // a fabricated value.
  var healthBySlug = {};
  if (healthCounts && Array.isArray(healthCounts.perFeature)) {
    healthCounts.perFeature.forEach(function(hf) { healthBySlug[hf.slug] = hf.health; });
  }
  var coverageBySlug = {};
  if (testCoverage && Array.isArray(testCoverage.perFeature)) {
    testCoverage.perFeature.forEach(function(cf) { coverageBySlug[cf.slug] = cf.percentage; });
  }
  var enrichedFeatures = features.map(function(f) {
    var realHealth = healthBySlug.hasOwnProperty(f.featureSlug) ? healthBySlug[f.featureSlug] : 'unknown';
    var pct = coverageBySlug.hasOwnProperty(f.featureSlug) ? coverageBySlug[f.featureSlug] : null;
    return Object.assign({}, f, {
      health: realHealth,
      coverageLabel: (pct === null || pct === undefined) ? 'No test data yet' : (pct + '%')
    });
  });

  // a4 (AC1, AC4) -- group epics under their assigned module, with an
  // Unassigned bucket for anything with no module_id. Zero modules at all
  // keeps the pre-existing flat rendering exactly as it was before this
  // story (AC4's clean fallback state) rather than a 1-bucket grouping.
  var featuresHtml;
  if (modules.length === 0) {
    featuresHtml = enrichedFeatures.length === 0
      ? '<p style="color:var(--muted);font-size:14px">No features yet.</p>'
      : '<ul style="list-style:none;padding:0;margin:0">' + enrichedFeatures.map(_renderEpicRow).join('') + '</ul>';
  } else {
    var byModule = {};
    modules.forEach(function(m) { byModule[m.id] = []; });
    var unassigned = [];
    enrichedFeatures.forEach(function(f) {
      if (f.moduleId && byModule[f.moduleId]) { byModule[f.moduleId].push(f); }
      else { unassigned.push(f); }
    });
    featuresHtml =
      '<style>' +
        '.a4-module-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.25s ease; overflow: hidden; }' +
        '.a4-module-body--collapsed { grid-template-rows: 0fr; }' +
        '.a4-module-body-inner { min-height: 0; overflow: hidden; }' +
      '</style>' +
      modules.map(function(m) { return _renderModuleSection(m.name, m.id, byModule[m.id]); }).join('') +
      (unassigned.length > 0 ? _renderModuleSection('Unassigned', 'unassigned', unassigned) : '') +
      '<script>' +
        'function a4ToggleModule(btn){' +
          'var body=document.getElementById(btn.getAttribute("aria-controls"));' +
          'var collapsed=body.classList.toggle("a4-module-body--collapsed");' +
          'btn.setAttribute("aria-expanded", collapsed ? "false" : "true");' +
        '}' +
      '<\/script>';
  }
  var scaleGaugeHtml = _renderScaleGauge(features, modules, taxonomy);

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
        '<a href="/products/' + _escapeHtml(productId) + '/roadmap" style="padding:8px 14px;border:1px solid var(--line);border-radius:6px;text-decoration:none;font-size:13px;color:var(--ink)">Roadmap</a>' +
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
    scaleGaugeHtml +
    _renderModulesManagement(productId, modules, csrfToken) +
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

/**
 * a5 -- renders the Roadmap tab: discovery-only and ideate-only feature
 * folders with no pipeline-state.json entry yet. Stage pills always carry a
 * text label alongside their colour class (NFR-Accessibility -- never
 * colour-only), reusing the existing sw-pill classes from html-shell.js.
 */
function _renderRoadmapTab(productName, productId, login, roadmapEntries) {
  var listHtml = roadmapEntries.length === 0
    ? '<p style="color:var(--muted);font-size:14px">Nothing in early-stage discovery right now</p>'
    : '<ul class="sw-list">' +
        roadmapEntries.map(function(e) {
          var pillClass = e.stage === 'Ideate only' ? 'sw-pill sw-pill--neutral' : 'sw-pill sw-pill--accent';
          return '<li>' +
            '<div style="flex:1">' +
              '<div style="font-size:14px;font-weight:500">' + _escapeHtml(e.title) + '</div>' +
              (e.date ? '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(e.date) + '</div>' : '') +
            '</div>' +
            '<span class="' + pillClass + '">' + _escapeHtml(e.stage) + '</span>' +
          '</li>';
        }).join('') +
      '</ul>';
  var body = '<div style="max-width:720px">' +
    '<div style="margin-bottom:24px">' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:4px"><a href="/products/' + _escapeHtml(productId) + '" style="color:var(--muted);text-decoration:none">' + _escapeHtml(productName) + '</a> &rsaquo;</div>' +
      '<h1 style="margin:0;font-size:24px">Roadmap</h1>' +
    '</div>' +
    listHtml +
  '</div>';
  return _htmlShell.renderShell({ title: 'Roadmap', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: [productName, 'Roadmap'] });
}

/**
 * a5 -- GET /products/:id/roadmap: read-only scan of artefacts/ for
 * discovery-only and ideate-only work with no pipeline-state.json entry
 * yet. Reads the connected repo's local disk directly at render time (same
 * local-disk pattern as handlePostProductFeature's repoRoot usage) -- this
 * does NOT build the sync/cache pipeline (a new product_rollups column via
 * an extended /product-sync), which is explicitly deferred per discovery's
 * Out of Scope and this story's Architecture Constraints. Never writes to
 * any artefact file.
 */
async function handleGetProductRoadmap(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var login = req.session && req.session.login;

  var prodRow = (await _pool.query(
    'SELECT name, tenant_id FROM products WHERE product_id = $1',
    [productId]
  )).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var repoRoot = _repoRootAdapter.getRepoRoot(req);
  var artefactsDir = require('path').join(repoRoot, 'artefacts');
  var pipelineStatePath = require('path').join(repoRoot, '.github', 'pipeline-state.json');
  var pipelineState;
  try {
    pipelineState = JSON.parse(require('fs').readFileSync(pipelineStatePath, 'utf8'));
  } catch (_) {
    pipelineState = { features: [] };
  }

  var roadmapEntries = _roadmapScan.scanRoadmapArtefacts(artefactsDir, pipelineState);

  if (res.json) {
    res.json({ roadmap: roadmapEntries });
  } else {
    var html = _renderRoadmapTab(prodRow.name, productId, login, roadmapEntries);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
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
    "SELECT journey_id, feature_slug, module_id, data->>'activeSkill' AS stage FROM journeys WHERE product_id = $1",
    [productId]
  )).rows;
  var features = rows.map(function(j) {
    return {
      journey_id: j.journey_id,
      stage: j.stage || 'discovery',
      health: 'green',
      featureSlug: j.feature_slug,
      moduleId: j.module_id || null
    };
  });
  // a4 -- fetch the product's curated modules (A1) for module-grouped
  // rendering (AC1). The adapter's stub default throws (D37) when unwired;
  // production server.js always wires it unconditionally (a1), so this only
  // ever falls back to [] in test doubles that don't exercise modules at
  // all -- matching AC4's own "zero modules" flat-fallback spirit rather
  // than masking a real production misconfiguration.
  var modules = [];
  try {
    modules = await _modulesAdapter.listModules(productId, tenantId);
  } catch (_) {
    modules = [];
  }
  // tmc-s1 (AC2) -- single query, regardless of taxonomy feature count, to
  // fetch every feature-slug -> module_id assignment for this product. This
  // is the join that lets a product's real GitHub-synced taxonomy (not just
  // placeholder journeys) be classified and rendered by module.
  var featureModuleAssignments = {};
  try {
    featureModuleAssignments = await _modulesAdapter.getFeatureModuleAssignments(productId, tenantId);
  } catch (_) {
    featureModuleAssignments = {};
  }
  if (res.json) {
    res.json({ features: features });
  } else {
    // fix-forward (post-a1): the module-management form needs a CSRF token
    // to submit create/rename/delete, matching every other mutating form in
    // this app (settings.js's Credits/Billing tabs, etc.).
    var csrfToken = _csrf.generateCsrfToken(req);
    var html = _renderProductView(productName, productId, features, login, rollupRow, isSyncing, prodRow.repo_owner, prodRow.repo_name, modules, csrfToken, featureModuleAssignments);
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

/**
 * a1 (AC5) -- GET /products/:id/modules: list every module curated for this
 * product, scoped by tenant (404 for a missing/mismatched tenant, matching
 * the FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this file). Added
 * because AC1 ("appears in the product's module list on next page load")
 * and the test plan's own AC1 integration test both require a GET endpoint,
 * even though the DoR contract's "What will be built" section named only
 * POST/PUT/DELETE (see decisions.md, /implementation-plan SCOPE entry).
 */
async function handleGetProductModules(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  var modules = await _modulesAdapter.listModules(productId, tenantId);
  if (res.status) { res.status(200).json({ modules: modules }); }
  else if (res.json) { res.json({ modules: modules }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ modules: modules })); }
}

/**
 * a1 (AC1, AC4) -- POST /products/:id/modules: create a new module for a
 * product. Tenant-scoped (404 for a missing/mismatched tenant). Rejects an
 * empty name (400) and a duplicate name within the same product (409, with
 * a clear message) -- no duplicate module record is ever created.
 */
async function handlePostProductModule(req, res, _next, pool, posthog) {
  // fix-forward (post-a1) -- this mutating form-submitted route had no CSRF
  // check at all until the operator-facing UI was added; csrfGuard reads and
  // caches the body itself, so the _readBody call below (unchanged) picks it
  // up via its own req.body !== undefined short-circuit.
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var name = ((req.body && req.body.name) || '').trim();

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'Module name is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Module name is required.' })); }
    return;
  }

  var moduleRow;
  try {
    moduleRow = await _modulesAdapter.createModule(productId, tenantId, name);
  } catch (err) {
    if (err && err.code === 'DUPLICATE_MODULE') {
      if (res.status) { res.status(409).json({ error: err.message }); }
      else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
      return;
    }
    throw err;
  }

  _ph.capture(tenantId, 'module_created', { productId: productId, tenantId: tenantId, moduleId: moduleRow.id });

  if (res.status) { res.status(201).json({ module: moduleRow }); }
  else { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ module: moduleRow })); }
}

/**
 * a1 (AC2) -- PUT /products/:id/modules/:moduleId: rename an existing
 * module. The module's id never changes, so every existing reference to it
 * (e.g. a journey/epic assigned to it) survives the rename. Tenant-scoped;
 * 404 for an unknown/foreign module id, 409 for a rename that collides with
 * a different existing module's name.
 */
async function handlePutProductModule(req, res, _next, pool, posthog) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
  var _pool = pool;
  var productId = req.params && req.params.id;
  var moduleId = req.params && req.params.moduleId;
  var tenantId = req.session && req.session.tenantId;
  var name = ((req.body && req.body.name) || '').trim();

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!name) {
    if (res.status) { res.status(400).json({ error: 'Module name is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Module name is required.' })); }
    return;
  }

  var moduleRow;
  try {
    moduleRow = await _modulesAdapter.renameModule(productId, tenantId, moduleId, name);
  } catch (err) {
    if (err && err.code === 'NOT_FOUND') {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    if (err && err.code === 'DUPLICATE_MODULE') {
      if (res.status) { res.status(409).json({ error: err.message }); }
      else { res.writeHead(409, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: err.message })); }
      return;
    }
    throw err;
  }

  if (res.status) { res.status(200).json({ module: moduleRow }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ module: moduleRow })); }
}

/**
 * a1 (AC3) -- DELETE /products/:id/modules/:moduleId: delete a module.
 * Every journey/epic previously assigned to it is reassigned to Unassigned
 * (module_id = NULL) by modules-adapter.js's deleteModule -- no epic
 * silently disappears from the product view. Tenant-scoped; 404 for an
 * unknown/foreign module id, with zero rows affected.
 */
async function handleDeleteProductModule(req, res, _next, pool, posthog) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  var _pool = pool;
  var productId = req.params && req.params.id;
  var moduleId = req.params && req.params.moduleId;
  var tenantId = req.session && req.session.tenantId;

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }

  try {
    await _modulesAdapter.deleteModule(productId, tenantId, moduleId);
  } catch (err) {
    if (err && err.code === 'NOT_FOUND') {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    throw err;
  }

  if (res.status) { res.status(200).json({ deleted: true, module_id: moduleId }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ deleted: true, module_id: moduleId })); }
}

/**
 * a2 (AC1-AC4) -- PUT /products/:id/epics/:epicId/module: reassign an epic
 * (a `journeys` row) to a different module within the same product.
 * Tenant-scoped (404 for a missing/mismatched tenant, matching the
 * FORBIDDEN-vs-NOT_FOUND policy used elsewhere in this file). Rejects an
 * unknown epic or a module belonging to a different product (AC4) with 404
 * and zero rows changed. Reuses A1's modules-adapter.js -- no new adapter
 * (see DoR H-ADAPTER check, decisions.md).
 */
async function handlePutEpicModule(req, res, _next, pool, posthog) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var epicId = req.params && req.params.epicId;
  var tenantId = req.session && req.session.tenantId;
  var moduleId = (req.body && req.body.moduleId) || '';
  if (typeof moduleId === 'string') { moduleId = moduleId.trim(); }

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!moduleId) {
    if (res.status) { res.status(400).json({ error: 'moduleId is required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'moduleId is required.' })); }
    return;
  }

  var result;
  try {
    result = await _modulesAdapter.reassignEpic(productId, tenantId, epicId, moduleId);
  } catch (err) {
    if (err && (err.code === 'EPIC_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')) {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    throw err;
  }

  _ph.capture(tenantId, 'epic_reassigned', { productId: productId, tenantId: tenantId, epicId: epicId, moduleId: moduleId, changed: result.changed });

  if (res.status) { res.status(200).json({ reassigned: true, journey_id: result.journey_id, module_id: result.module_id, changed: result.changed }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ reassigned: true, journey_id: result.journey_id, module_id: result.module_id, changed: result.changed })); }
}

/**
 * tmc-s1 (AC3, AC4, AC7) -- POST /products/:id/modules/bulk-assign: assign a
 * batch of taxonomy feature slugs (identified by feature_slug, not
 * journey_id -- see decisions.md ARCH entry) to one target module in a
 * single round-trip, so classifying a product's real 100s-of-features
 * history doesn't require one request per feature. CSRF-guarded like every
 * other module-mutating route. Tenant-scoped; rejects a target module
 * belonging to a different product with 404 and zero rows written.
 */
async function handlePostBulkAssignFeatureModules(req, res, _next, pool, posthog) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var featureSlugs = (req.body && req.body.featureSlugs) || [];
  var moduleId = (req.body && req.body.moduleId) || '';
  if (typeof moduleId === 'string') { moduleId = moduleId.trim(); }

  var prodRow = (await _pool.query('SELECT tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    if (res.status) { res.status(404).json({ error: 'not found' }); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
    return;
  }
  if (!moduleId || !Array.isArray(featureSlugs) || featureSlugs.length === 0) {
    if (res.status) { res.status(400).json({ error: 'moduleId and a non-empty featureSlugs array are required.' }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'moduleId and a non-empty featureSlugs array are required.' })); }
    return;
  }

  var result;
  try {
    result = await _modulesAdapter.bulkAssignFeaturesToModule(productId, tenantId, featureSlugs, moduleId);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      if (res.status) { res.status(404).json({ error: 'not found' }); }
      else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
      return;
    }
    throw err;
  }

  _ph.capture(tenantId, 'features_bulk_assigned', { productId: productId, tenantId: tenantId, moduleId: moduleId, count: result.assigned });

  if (res.status) { res.status(200).json({ assigned: result.assigned, module_id: moduleId }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ assigned: result.assigned, module_id: moduleId })); }
}

module.exports = {
  _renderProductView,
  handlePostProductNew,
  handlePostProductConfirm,
  handleGetDashboard,
  handleGetProductNew,
  handleGetProductView,
  handleGetProductRoadmap,
  handlePostProductSync,
  handlePostProductFeature,
  handleGetProductKanban,
  handleGetOrgKanban,
  handleDeleteProduct,
  handlePostProductRepoCreate,
  handlePutProductEdit,
  // a1: curated per-product Modules taxonomy CRUD
  handleGetProductModules,
  handlePostProductModule,
  handlePutProductModule,
  handleDeleteProductModule,
  // a2: reassign an epic (journey) to a different module
  handlePutEpicModule,
  // tmc-s1: bulk-assign taxonomy feature slugs to a module
  handlePostBulkAssignFeatureModules,
  // kbc-s1: shared column-building functions, exported for direct unit testing (U1-U5)
  buildProductKanbanColumns,
  buildOrgKanbanColumns,
  buildTenantKanbanColumns,
  STAGE_COLUMNS
};
