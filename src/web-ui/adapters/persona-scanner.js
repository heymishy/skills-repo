'use strict';

const fs = require('fs');
const path = require('path');

// jcx-s4 -- extracts the raw text of discovery.md's own "## Who It Affects"
// section (prose until the next "## " heading, or end of file). Returns
// null if absent/empty -- no structured name/role/goal parsing (per
// /review finding 1-M1, AC1's own revised wording: the operator splits
// this raw text into the 3 fields manually).
function extractWhoItAffects(discoveryMdContent) {
  var match = discoveryMdContent.match(/^## Who It Affects\s*\n([\s\S]*?)(?=\n## |\s*$)/m);
  if (!match) return null;
  var text = match[1].trim();
  return text || null;
}

// jcx-s4 -- PURE file reads, zero database query calls of any kind (NFR:
// Security). Takes an already product-scoped list of feature slugs
// (resolved by the caller via SQL, in journeys.js's own
// getPersonaSuggestions) -- this function itself never queries the DB.
function scanForPersonas(featureSlugs, repoRoot) {
  var results = [];
  var resolvedRoot = path.resolve(repoRoot);
  featureSlugs.forEach(function(slug) {
    try {
      var discoveryPath = path.join(resolvedRoot, 'artefacts', slug, 'discovery.md');
      var content = fs.readFileSync(discoveryPath, 'utf8');
      var whoItAffects = extractWhoItAffects(content);
      if (whoItAffects) {
        results.push({ featureSlug: slug, personaText: whoItAffects });
      }
    } catch (_) { /* no discovery.md for this slug (or unreadable) -- skip, not an error */ }
  });
  return results;
}

module.exports = { extractWhoItAffects, scanForPersonas };
