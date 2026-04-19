// Helper script to update pipeline-state.json with spikes and stories
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '.github', 'pipeline-state.json');
const raw = fs.readFileSync(file, 'utf8');

// Find insertion point: just before the opus feature slug
const opusMarker = '"slug": "2026-04-19-skills-platform-phase4-opus"';
const opusIdx = raw.indexOf(opusMarker);
if (opusIdx === -1) {
  console.error('Could not find opus feature marker');
  process.exit(1);
}

// Check if already inserted
if (raw.includes('"spikes":')) {
  console.log('spikes already present — skipping insert');
  process.exit(0);
}

// Find the last }, before the opus feature (the closing of the sonnet feature)
// Walk backwards from opusIdx to find '    },'
let insertAt = raw.lastIndexOf('\n    },\n    {', opusIdx);
if (insertAt === -1) {
  // try with CRLF
  insertAt = raw.lastIndexOf('\r\n    },\r\n    {', opusIdx);
}
console.log('insertAt:', insertAt, 'context:', JSON.stringify(raw.substring(insertAt - 5, insertAt + 20)));

// Determine line ending
const le = raw.includes('\r\n') ? '\r\n' : '\n';
const i = le;

const spikesAndStories = `,${i}      "spikes": [${i}        { "id": "spike-a",  "storySlug": "p4-spike-a",  "verdict": null },${i}        { "id": "spike-b1", "storySlug": "p4-spike-b1", "verdict": null },${i}        { "id": "spike-b2", "storySlug": "p4-spike-b2", "verdict": null },${i}        { "id": "spike-c",  "storySlug": "p4-spike-c",  "verdict": null },${i}        { "id": "spike-d",  "storySlug": "p4-spike-d",  "verdict": null }${i}      ],${i}      "stories": [${i}        { "id": "p4-spike-a",              "epic": "e1", "testPlan": { "status": "written", "testFile": "tests/check-p4-spike-a.js",              "totalTests": 8,  "passing": 0 } },${i}        { "id": "p4-spike-b1",             "epic": "e1", "testPlan": { "status": "written", "testFile": "tests/check-p4-spike-b1.js",             "totalTests": 9,  "passing": 0 } },${i}        { "id": "p4-spike-b2",             "epic": "e1", "testPlan": { "status": "written", "testFile": "tests/check-p4-spike-b2.js",             "totalTests": 9,  "passing": 0 } },${i}        { "id": "p4-spike-c",              "epic": "e1", "testPlan": { "status": "written", "testFile": "tests/check-p4-spike-c.js",              "totalTests": 9,  "passing": 0 } },${i}        { "id": "p4-spike-d",              "epic": "e1", "testPlan": { "status": "written", "testFile": "tests/check-p4-spike-d.js",              "totalTests": 9,  "passing": 0 } },${i}        { "id": "p4-dist-install",         "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-install.js",         "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-no-commits",      "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-no-commits.js",      "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-commit-format",   "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-commit-format.js",   "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-lockfile",        "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-lockfile.js",        "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-upgrade",         "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-upgrade.js",         "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-upstream",        "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-upstream.js",        "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-migration",       "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-migration.js",       "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-dist-registry",        "epic": "e2", "testPlan": { "status": "written", "testFile": "tests/check-p4-dist-registry.js",        "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-enf-decision",         "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-decision.js",         "totalTests": 24, "passing": 0 } },${i}        { "id": "p4-enf-package",          "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-package.js",          "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-enf-mcp",             "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-mcp.js",             "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-enf-cli",             "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-cli.js",             "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-enf-schema",          "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-schema.js",          "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-enf-second-line",     "epic": "e3", "testPlan": { "status": "written", "testFile": "tests/check-p4-enf-second-line.js",     "totalTests": 10, "passing": 0 } },${i}        { "id": "p4-nta-surface",         "epic": "e4", "testPlan": { "status": "written", "testFile": "tests/check-p4-nta-surface.js",         "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-nta-gate-translation", "epic": "e4", "testPlan": { "status": "written", "testFile": "tests/check-p4-nta-gate-translation.js", "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-nta-artefact-parity",  "epic": "e4", "testPlan": { "status": "written", "testFile": "tests/check-p4-nta-artefact-parity.js",  "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-nta-standards-inject", "epic": "e4", "testPlan": { "status": "written", "testFile": "tests/check-p4-nta-standards-inject.js", "totalTests": 11, "passing": 0 } },${i}        { "id": "p4-nta-ci-artefact",      "epic": "e4", "testPlan": { "status": "written", "testFile": "tests/check-p4-nta-ci-artefact.js",      "totalTests": 11, "passing": 0 } }${i}      ]`;

// insertAt points to '\n    },' or '\r\n    },'
// We insert the new content just before the final closing brace of the sonnet feature
// So: content_up_to_insertAt + spikesBlock + \n    },\n    { (the opener of opus)
const sep = le + '    },' + le + '    {';
const insertPoint = raw.lastIndexOf(sep, opusIdx + opusMarker.length);
console.log('insertPoint:', insertPoint, 'context:', JSON.stringify(raw.substring(insertPoint, insertPoint + 30)));

const updated = raw.substring(0, insertPoint) + spikesAndStories + raw.substring(insertPoint);
fs.writeFileSync(file, updated, 'utf8');
console.log('Done. New length:', updated.length);
