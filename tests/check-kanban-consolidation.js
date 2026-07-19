// check-kanban-consolidation.js — AC verification tests for kbc-s1
// Tests U1-U9 (unit), IT1-IT3 (integration), 2 NFR tests
// Story: artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
// No external dependencies — Node.js built-ins only.

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

const { renderKanban } = require('../src/web-ui/views/kanban-view');
const {
  buildProductKanbanColumns,
  buildOrgKanbanColumns,
  buildTenantKanbanColumns,
  handleGetDashboard,
  STAGE_COLUMNS
} = require('../src/web-ui/routes/products');

function makeMockRes() {
  return {
    _statusCode: null, _headers: {}, _body: '',
    writeHead(code, headers) { this._statusCode = code; this._headers = headers || {}; },
    end(body) { this._body = body || ''; }
  };
}

function makeMockPool(rowsByQuery) {
  return {
    query: async function(sql, params) {
      return { rows: rowsByQuery(sql, params) };
    }
  };
}

async function runTests() {

  console.log('\nU1 -- shared renderer accepts a generic columns/cards shape');
  {
    const fixture = {
      columns: [
        { stage: STAGE_COLUMNS[0], cards: [
          { id: 'journey-1', title: 'Build feature X', health: 'green' },
          { id: 'journey-2', title: 'Fix bug Y', health: 'amber' }
        ] },
        { stage: STAGE_COLUMNS[1], cards: [
          { id: 'journey-3', title: 'Refactor module Z', health: 'green' }
        ] }
      ]
    };
    const html = renderKanban(fixture);
    assert(typeof html === 'string', 'returns HTML string');
    assert(html.includes('<div'), 'contains div element');
    assert(html.includes(STAGE_COLUMNS[0]), 'includes stage name');
    assert(html.includes('Build feature X'), 'includes card title');
    assert(!html.includes('undefined'), 'no undefined values leak into markup');
  }

  console.log('\nU2 -- product-scope data-fetch feeds the shared renderer correctly');
  {
    const rows = [
      { journey_id: 'j1', feature_slug: 'checkout-flow', stage: 'discovery', health: 'green' },
      { journey_id: 'j2', feature_slug: 'billing-portal', stage: 'review', health: 'amber' }
    ];
    const columns = buildProductKanbanColumns(rows);
    assert(Array.isArray(columns), 'returns an array of columns');
    assert(columns.length === STAGE_COLUMNS.length, 'has one column per STAGE_COLUMNS entry');
    const discoveryCol = columns.find(c => c.stage === 'discovery');
    assert(discoveryCol.cards.length === 1, 'journey placed under its correct stage column');
    assert(discoveryCol.cards[0].title === 'checkout-flow', 'card title matches feature_slug');
    assert(discoveryCol.cards[0].healthLabel === 'Healthy', 'card carries health label');
    const html = renderKanban({ columns });
    assert(html.includes('checkout-flow'), 'renders product journey title');
    assert(html.includes('billing-portal'), 'renders second product journey title');
  }

  console.log('\nU3 -- org-scope data-fetch feeds the shared renderer correctly');
  {
    const groups = [
      { productId: 'p1', productName: 'Acme', journeys: [
        { journey_id: 'j1', feature_slug: 'checkout', stage: 'discovery' }
      ] },
      { productId: 'p2', productName: 'Widgets', journeys: [
        { journey_id: 'j2', feature_slug: 'inventory', stage: 'discovery' }
      ] }
    ];
    const columns = buildOrgKanbanColumns(groups);
    const discoveryCol = columns.find(c => c.stage === 'discovery');
    assert(discoveryCol.cards.length === 2, 'features from both products grouped correctly');
    assert(discoveryCol.cards.some(c => c.title.includes('Acme')), 'card title includes first product name');
    assert(discoveryCol.cards.some(c => c.title.includes('Widgets')), 'card title includes second product name');
    const html = renderKanban({ columns });
    assert(html.includes('Acme'), 'renders first product feature via same renderer as U2');
    assert(html.includes('Widgets'), 'renders second product feature via same renderer as U2');
  }

  console.log('\nU4 -- tenant-scope data-fetch aggregates across all of a tenant\'s products');
  {
    const pool = makeMockPool(function(sql, params) {
      if (sql.includes('FROM products')) {
        return [
          { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
          { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
        ];
      }
      if (sql.includes('FROM journeys')) {
        if (params[0] === 'p1') {
          return [
            { journey_id: 'j1', feature_slug: 'p1-feature-a', stage: 'discovery' },
            { journey_id: 'j2', feature_slug: 'p1-feature-b', stage: 'discovery' }
          ];
        }
        if (params[0] === 'p2') {
          return [
            { journey_id: 'j3', feature_slug: 'p2-feature-a', stage: 'review' }
          ];
        }
      }
      return [];
    });
    const columns = await buildTenantKanbanColumns(pool, 'tenant-1');
    const allCards = columns.reduce((acc, c) => acc.concat(c.cards), []);
    assert(allCards.length === 3, 'aggregates journeys from BOTH products (not scoped to only the first)');
    const discoveryCol = columns.find(c => c.stage === 'discovery');
    assert(discoveryCol.cards.length === 2, 'both product-1 journeys appear in discovery column');
    const reviewCol = columns.find(c => c.stage === 'review');
    assert(reviewCol.cards.length === 1, 'product-2 journey appears in review column');
    assert(reviewCol.cards[0].title.includes('Product Two'), 'product-2 card is correctly attributed');
  }

  console.log('\nU5 -- tenant-scope aggregate feeds the shared renderer correctly');
  {
    const pool = makeMockPool(function(sql, params) {
      if (sql.includes('FROM products')) {
        return [{ product_id: 'p1', name: 'Solo Product', created_at: '2026-01-01' }];
      }
      return [{ journey_id: 'j1', feature_slug: 'solo-feature', stage: 'discovery' }];
    });
    const columns = await buildTenantKanbanColumns(pool, 'tenant-2');
    const html = renderKanban({ columns });
    assert(html.includes('solo-feature'), 'tenant aggregate renders via same renderer as U2/U3');
  }

  console.log('\nU6 -- renderKanban\'s existing rendering behaviour, generalised, still passes its own prior test cases');
  {
    const legacyFixture = {
      features: [
        { slug: '2026-01-01-my-feature', title: 'My Feature', stage: 'discovery', health: 'green' }
      ],
      ideas: []
    };
    const html = renderKanban(legacyFixture);
    assert(html.includes('My Feature'), 'legacy {features, ideas} signature still renders correctly');
    assert(html.includes('kb-lane'), 'legacy lane-based structure preserved');
  }

  console.log('\nU7 -- "ideas" concept is optional in the generalised renderer');
  {
    const fixture = { columns: [{ stage: 'discovery', cards: [{ id: 'c1', title: 'Card 1', health: 'green' }] }] };
    let threw = false;
    let html = '';
    try { html = renderKanban(fixture); } catch (e) { threw = true; }
    assert(!threw, 'does not throw when ideas is absent');
    assert(html.includes('Card 1'), 'renders correctly with no ideas section');
    assert(!html.includes('undefined'), 'no broken ideas block leaks into markup');
  }

  console.log('\nU8 -- no route in server.js references the removed handlers');
  {
    const serverJs = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
    assert(!serverJs.includes('handleGetFeatures'), 'no reference to handleGetFeatures');
    assert(!/pathname === '\/features'/.test(serverJs), 'no /features route registration');
    assert(!/pathname === '\/actions'/.test(serverJs), 'no /actions route registration');
    assert(!/pathname === '\/status'/.test(serverJs), 'no bare /status route registration');
    assert(!serverJs.includes('handleGetStatus'), 'no reference to handleGetStatus');
    assert(!serverJs.includes('handleGetStatusExport'), 'no reference to handleGetStatusExport');
    assert(!serverJs.includes('handleGetActionsHtml'), 'no reference to handleGetActionsHtml');
    assert(!serverJs.includes('routes/status'), 'no require of routes/status');
  }

  console.log('\nU9 -- no remaining test file exercises the removed routes');
  {
    const testsDir = path.join(ROOT, 'tests');
    const testFiles = fs.readdirSync(testsDir).filter(f => /^check-.*\.js$/.test(f) && f !== 'check-kanban-consolidation.js');
    let dangling = [];
    testFiles.forEach(function(f) {
      const content = fs.readFileSync(path.join(testsDir, f), 'utf8');
      if (/require\(['"].*routes\/status['"]\)/.test(content)) dangling.push(f + ' (requires routes/status)');
      if (/handleGetFeatures\(/.test(content)) dangling.push(f + ' (calls handleGetFeatures)');
    });
    assert(dangling.length === 0, 'no test file requires routes/status or calls handleGetFeatures (found: ' + dangling.join(', ') + ')');
  }

  console.log('\nIT1 -- GET a product\'s kanban view returns real HTML');
  {
    const columns = buildProductKanbanColumns([{ journey_id: 'j1', feature_slug: 'my-feature', stage: 'discovery', health: 'green' }]);
    const html = renderKanban({ columns });
    assert(html.includes('<div'), 'product board renders real HTML markup');
    assert(html.includes('my-feature'), 'product board includes the journey title');
    assert(!/^\s*\{/.test(html.trim()), 'response body is not raw JSON');
  }

  console.log('\nIT2 -- GET an org\'s kanban view returns real HTML');
  {
    const groups = [{ productId: 'p1', productName: 'Acme', journeys: [{ journey_id: 'j1', feature_slug: 'checkout', stage: 'discovery' }] }];
    const columns = buildOrgKanbanColumns(groups);
    const html = renderKanban({ columns });
    assert(html.includes('<div'), 'org board renders real HTML markup');
    assert(html.includes('Acme'), 'org board includes product-attributed feature');
    assert(!/^\s*\{/.test(html.trim()), 'response body is not raw JSON');
  }

  console.log('\nIT3 -- GET /dashboard?view=board returns a real, aggregated tenant board');
  {
    const pool = makeMockPool(function(sql, params) {
      if (sql.includes('FROM products')) {
        return [
          { product_id: 'p1', name: 'Product One', created_at: '2026-01-01' },
          { product_id: 'p2', name: 'Product Two', created_at: '2026-01-02' }
        ];
      }
      if (params && params[0] === 'p1') return [{ journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery' }];
      if (params && params[0] === 'p2') return [{ journey_id: 'j2', feature_slug: 'feat-b', stage: 'review' }];
      return [];
    });
    const req = { session: { tenantId: 'tenant-1' }, query: { view: 'board' } };
    const res = makeMockRes();
    await handleGetDashboard(req, res, null, pool);
    assert(res._statusCode === 200, 'GET /dashboard?view=board -> 200');
    assert((res._headers['Content-Type'] || '').includes('text/html'), 'Content-Type is text/html');
    assert(res._body.includes('feat-a'), 'tenant board includes product-1 journey');
    assert(res._body.includes('feat-b'), 'tenant board includes product-2 journey (aggregated, not just first product)');
  }

  console.log('\nNFR Security -- Board rendering escapes all user/repo-supplied text');
  {
    const fixture = {
      columns: [
        { stage: 'discovery', cards: [
          { id: 'c1', title: '<script>alert(1)</script>', health: 'green' },
          { id: 'c2', title: '& " < > \'', health: 'amber' }
        ] }
      ]
    };
    const html = renderKanban(fixture);
    assert(!html.includes('<script>alert(1)</script>'), 'raw script tag is not present in output');
    assert(html.includes('&lt;script&gt;'), 'script tag is HTML-escaped');
    assert(html.includes('&amp;'), 'ampersand is escaped');
  }

  console.log('\nNFR Performance -- Tenant aggregate stays performant for a realistic product count');
  {
    const NUM_PRODUCTS = 10;
    const pool = makeMockPool(function(sql, params) {
      if (sql.includes('FROM products')) {
        return Array.from({ length: NUM_PRODUCTS }, (_, i) => ({ product_id: 'p' + i, name: 'Product ' + i, created_at: '2026-01-01' }));
      }
      return Array.from({ length: 5 }, (_, j) => ({ journey_id: params[0] + '-j' + j, feature_slug: 'feature-' + j, stage: STAGE_COLUMNS[j % STAGE_COLUMNS.length] }));
    });
    const start = Date.now();
    const columns = await buildTenantKanbanColumns(pool, 'tenant-perf');
    const elapsed = Date.now() - start;
    const totalCards = columns.reduce((acc, c) => acc + c.cards.length, 0);
    assert(elapsed < 2000, 'aggregation of ' + NUM_PRODUCTS + ' products completes quickly (' + elapsed + 'ms)');
    assert(totalCards === NUM_PRODUCTS * 5, 'all ' + (NUM_PRODUCTS * 5) + ' journeys aggregated across ' + NUM_PRODUCTS + ' products');
  }
}

runTests().then(function() {
  console.log('\n[kanban-consolidation] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}).catch(function(err) {
  console.error('\n[kanban-consolidation] fatal: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
