'use strict';
/**
 * ci-audit-comment.js
 *
 * Logic extracted from the "Post governed artefact chain comment" github-script action
 * in .github/workflows/assurance-gate.yml.
 *
 * Exported functions are unit-testable via tests/check-ci-audit-comment.js.
 * The github-script block calls buildAuditComment() after collecting and enriching
 * all data from the filesystem and GitHub API.
 */

/**
 * Load pipeline stories for a feature from a parsed pipeline-state object.
 * Handles both flat (feat.stories[]) and epic-nested (feat.epics[].stories[]) layouts.
 *
 * @param {object|null} stateObj  Parsed pipeline-state.json object
 * @param {string}      slug      Feature slug to look up
 * @returns {Array}               Array of story objects (empty if not found)
 */
function loadPipelineStories(stateObj, slug) {
  if (!stateObj || !stateObj.features || !slug) return [];
  const feat = stateObj.features.find(f => f.slug === slug);
  if (!feat) return [];
  const flatStories = (feat.stories) || [];
  const epicStories = (feat.epics || []).flatMap(e => e.stories || []);
  return flatStories.concat(epicStories);
}

/**
 * Classify an artefact file by its path into a pipeline stage type.
 * Mirrors the classifyArtefact function formerly inline in assurance-gate.yml.
 *
 * @param {string} sourcePath  Relative path to the artefact file
 * @returns {{ type: string, typeOrder: number, displayName: string }}
 */
function classifyArtefact(sourcePath) {
  const normalized = sourcePath.replace(/\\/g, '/');
  const parts      = normalized.split('/');
  const isTopLevel = parts.length === 3;
  const subdir     = isTopLevel ? null : parts[2];
  const basename   = normalized.split('/').pop().replace(/\.md$/, '');

  const SUBDIR_TYPES = {
    'epics':                { type: 'Epic',                 order: 3  },
    'stories':              { type: 'Story',                order: 4  },
    'test-plans':           { type: 'Test Plan',            order: 5  },
    'review':               { type: 'Review',               order: 6  },
    'verification-scripts': { type: 'Verification Script',  order: 7  },
    'dor':                  { type: 'Definition of Ready',  order: 8  },
    'plans':                { type: 'Implementation Plan',  order: 9  },
    'dod':                  { type: 'Definition of Done',   order: 10 },
    'reference':            { type: 'Reference',            order: 11 },
    'trace':                { type: 'Trace',                order: 12 },
  };

  const TOPLEVEL_TYPES = {
    'discovery':      { type: 'Discovery',      order: 1  },
    'benefit-metric': { type: 'Benefit Metric', order: 2  },
    'decisions':      { type: 'Decisions',      order: 13 },
    'nfr-profile':    { type: 'NFR Profile',    order: 14 },
  };

  if (isTopLevel) {
    const m = TOPLEVEL_TYPES[basename];
    return { type: m ? m.type : 'Other', typeOrder: m ? m.order : 99, displayName: m ? m.type : basename };
  }

  const sm = SUBDIR_TYPES[subdir];
  let displayName = basename
    .replace(/-dor-contract$/, '')
    .replace(/-test-plan$/, '')
    .replace(/-dor$/, '')
    .replace(/-dod$/, '')
    .replace(/-review-\d+$/, '')
    .replace(/-verification$/, '');
  if (basename.endsWith('-dor-contract')) displayName += ' (Contract)';
  displayName = displayName.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
  return { type: sm ? sm.type : 'Other', typeOrder: sm ? sm.order : 99, displayName };
}

/**
 * Parse Acceptance Criteria from a story markdown string.
 *
 * Unlike the original inline implementation (which took a file path), this function
 * takes the markdown content as a string — making it unit-testable without filesystem access.
 *
 * @param {string|null} markdownContent  Full markdown content of the story artefact
 * @returns {Array<{ id: string, text: string }>}
 */
function parseACs(markdownContent) {
  try {
    const content = markdownContent || '';
    const idx = content.indexOf('## Acceptance Criteria');
    if (idx === -1) return [];
    const section  = content.slice(idx);
    const nextH2   = section.indexOf('\n## ', 3);
    const acBlock  = nextH2 > -1 ? section.slice(0, nextH2) : section;
    const results  = [];
    const acRegex  = /\*\*(AC\d+):\*\*\s*([\s\S]*?)(?=\*\*AC\d+:\*\*|$)/g;
    let match;
    while ((match = acRegex.exec(acBlock)) !== null) {
      results.push({ id: match[1], text: match[2].replace(/\s+/g, ' ').trim() });
    }
    return results;
  } catch (_) { return []; }
}

/**
 * Build the full governed delivery audit comment body (markdown string).
 *
 * All data must be pre-collected and pre-enriched by the caller.
 * This function is pure string manipulation — no filesystem or API calls.
 *
 * @param {object}      data
 * @param {string}      data.verdict
 * @param {string}      data.traceHash
 * @param {string}      data.shortSha
 * @param {string}      data.headSha
 * @param {string}      data.repoUrl
 * @param {string}      data.runUrl
 * @param {string}      data.artifactName
 * @param {string}      data.slug
 * @param {string}      data.sourceNote
 * @param {Array}       data.checks              [{name, passed, reason?}]
 * @param {Array}       data.artefactFiles       pre-enriched: {sourcePath, sha256, type, typeOrder, displayName, integrityStatus}
 * @param {Array}       data.governanceInputs    pre-enriched: {sourcePath, sha256, fileUrl}
 * @param {Array}       data.pipelineStories     pre-enriched: {id, slug?, title, acs, issueUrl, issueAcCheck, acVerified, acTotal, testPlan, suiteResult}
 * @param {string}      data.crossCheckStoryId
 * @param {string}      data.crossCheckDispatchNote
 * @param {object|null} data.crossCheckStoryFound
 * @returns {string}  Markdown comment body
 */
function buildAuditComment(data) {
  const {
    verdict              = 'unknown',
    traceHash            = 'not available',
    shortSha             = '',
    headSha              = '',
    repoUrl              = '',
    runUrl               = '',
    artifactName         = '',
    slug                 = '',
    sourceNote           = '',
    checks               = [],
    artefactFiles        = [],
    governanceInputs     = [],
    pipelineStories      = [],
    crossCheckStoryId    = '',
    crossCheckDispatchNote = '',
    crossCheckStoryFound = null,
  } = data;

  const verdictIcon = verdict === 'pass' ? '\u2705' : verdict === 'unknown' ? '\u23F3' : '\u274c';

  // ── Sort artefacts by typeOrder then displayName ──
  const sorted = [...artefactFiles].sort((a, b) => {
    const oa = a.typeOrder != null ? a.typeOrder : 99;
    const ob = b.typeOrder != null ? b.typeOrder : 99;
    if (oa !== ob) return oa - ob;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  // ── Build artefact table rows ──
  const artefactRows = [];
  let lastType = null;
  for (const f of sorted) {
    const typeName = f.type || '\u2014';
    if (typeName !== lastType) {
      if (lastType !== null) artefactRows.push(`| | | | |`);
      artefactRows.push(`| **${typeName}** | | | |`);
      lastType = typeName;
    }
    const fileUrl     = `${repoUrl}/blob/${headSha}/${f.sourcePath}`;
    const displayName = f.displayName || f.sourcePath.split('/').pop().replace('.md', '');
    const hash        = f.sha256 ? `\`${f.sha256.slice(0, 12)}\u2026\`` : '\u2014';
    const integ       = f.integrityStatus || '\u2014';
    artefactRows.push(`| | [${displayName}](${fileUrl}) | ${hash} | ${integ} |`);
  }

  // ── Build governance check rows ──
  const checkRows = checks.map(c => {
    const icon = c.passed ? '\u2705' : '\u274c';
    const note = (!c.passed && c.reason) ? c.reason : '';
    return `| ${icon} | \`${c.name}\` | ${note} |`;
  }).join('\n');

  // ── Build governance input rows ──
  const govRows = governanceInputs.map(g => {
    const name = g.sourcePath.replace('.github/', '');
    const hash = g.sha256 ? `\`${g.sha256.slice(0, 12)}\u2026\`` : '\u2014';
    return `| [${name}](${g.fileUrl}) | ${hash} |`;
  }).join('\n');

  // ── Build AC verification section ──
  let acSection = '';
  if (pipelineStories.length > 0) {
    const acBlocks = [];
    for (const story of pipelineStories) {
      const acs        = story.acs || [];
      const suiteResult = story.suiteResult;
      const allVerified = story.acVerified != null && story.acTotal != null && story.acVerified === story.acTotal;
      const allPassingFallback = !suiteResult && story.testPlan &&
        story.testPlan.totalTests > 0 &&
        story.testPlan.passing === story.testPlan.totalTests;
      const statusIcon  = (() => {
        if (allVerified) return '\u2705';
        if (suiteResult && suiteResult.failed === 0) return '\u2705';
        if (suiteResult && suiteResult.failed > 0)  return '\u26a0\ufe0f';
        if (allPassingFallback) return '\u2705';
        return '\u2014';
      })();
      const storyId     = story.id || story.slug || '';
      const issueLink   = story.issueUrl
        ? ` \u00b7 [Issue #${story.issueUrl.split('/').pop()}](${story.issueUrl})`
        : '';
      const issueAcCheck = story.issueAcCheck || '';
      const testLine     = suiteResult
        ? `Tests (this run): **${suiteResult.passed} passed, ${suiteResult.failed} failed**`
        : (story.testPlan && story.testPlan.passing != null && story.testPlan.passing > 0)
          ? `Tests (pipeline-state): **${story.testPlan.passing}/${story.testPlan.totalTests} passing**`
          : '';
      const acRows = acs.map(ac => {
        const short = ac.text.length > 90 ? ac.text.slice(0, 90) + '\u2026' : ac.text;
        return `| \`${ac.id}\` | ${short} | ${statusIcon} |`;
      }).join('\n');
      const parts = [
        ...(crossCheckDispatchNote && storyId === crossCheckStoryId
          ? [`_${crossCheckDispatchNote}_`, ``]
          : []),
        `**\`${storyId}\` \u2014 ${story.title || storyId}**${issueLink}${issueAcCheck}`,
        ``,
        `| AC | Description | Status |`,
        `|----|-------------|--------|`,
        acRows || `| _(no ACs extracted)_ | | \u2014 |`,
      ];
      if (testLine) parts.push(``, testLine);
      acBlocks.push(parts.join('\n'));
    }
    acSection = [
      `### \u2705 Acceptance Criteria`,
      ``,
      ...(crossCheckDispatchNote && !crossCheckStoryFound
        ? [`> ${crossCheckDispatchNote}`, ``]
        : []),
      `> ACs extracted from story artefacts. Status: \u2705 = all verified at DoD or all tests passed this run. Issue links confirm ACs were published in the dispatch record.`,
      ``,
      acBlocks.join('\n\n---\n\n'),
      ``,
    ].join('\n');
  }

  // ── Assemble full body ──
  return [
    `## \uD83D\uDD10 Governed Delivery Audit Record`,
    ``,
    `> This record is auto-generated by the pipeline assurance gate. It ties together what was delivered, what rules governed it, and the independent verification result \u2014 in one tamper-evident snapshot.`,
    ``,
    `---`,
    ``,
    `### ${verdictIcon} Verification result: ${verdict.toUpperCase()}`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Gate verdict** | ${verdict} |`,
    `| **Trace hash** | \`${traceHash}\` |`,
    `| **Commit** | [\`${shortSha}\`](${repoUrl}/commit/${headSha}) |`,
    `| **Run** | [${artifactName}](${runUrl}) |`,
    ``,
    checks.length > 0 ? `**Checks run (${checks.filter(c => c.passed).length}/${checks.length} passed):**` : '',
    checks.length > 0 ? `| | Check | Notes |` : '',
    checks.length > 0 ? `|-|-------|-------|` : '',
    checks.length > 0 ? checkRows : '',
    ``,
    `> **What is the trace hash?** It is a fingerprint of the full pipeline chain \u2014 every artefact, every gate check, and every governance input \u2014 at this exact commit. If any linked document had been different, the hash would be different. It cannot be forged after the fact.`,
    ``,
    `---`,
    ``,
    `### \uD83D\uDCCB What was delivered (${artefactFiles.length} artefacts)${sourceNote ? ` \u2014 ${sourceNote}` : ''}`,
    ``,
    `> These are the specification and verification documents for this feature, grouped by pipeline stage. Each link opens the **exact version of the document at commit \`${shortSha}\`**. Reading top-to-bottom traces the full delivery chain: from the original problem statement (Discovery) through to final verification (Definition of Done).`,
    ``,
    `| Stage | Document | SHA-256 (first 12) | Source |`,
    `|-------|----------|--------------------|----|`,
    artefactRows.length > 0 ? artefactRows.join('\n') : `| _(none collected)_ | | \u2014 |`,
    ``,
    `---`,
    ``,
    `### \uD83D\uDCDA What governed it (${governanceInputs.length} governance inputs)`,
    ``,
    `> These are the AI instruction sets, guardrails, and skill definitions that were **active and version-pinned during delivery**. They encode the quality standards, process rules, and architectural constraints the agent was required to follow. If these files had been different, the delivery would have been governed differently.`,
    ``,
    `| Governance input | SHA-256 (first 12 chars) |`,
    `|------------------|--------------------------|`,
    govRows || `| _(not captured \u2014 rerun with ci_attachment: true)_ | \u2014 |`,
    ``,
    `---`,
    ``,
    ...(acSection ? [acSection, `---`, ``] : []),
    `### \uD83D\uDD0D How to verify this independently`,
    ``,
    `1. **Click any artefact link** \u2014 it opens the exact file version used, pinned to commit \`${shortSha}\``,
    `2. **Verify a file hash**: \`sha256sum <file>\` or \`certutil -hashfile <file> SHA256\` \u2014 compare the first 12 characters to the table above`,
    `3. **Verify the full chain**: \`node scripts/trace-report.js --feature ${slug || '<slug>'}\` \u2014 regenerates the trace from the same state`,
    `4. **Download the full bundle** (includes \`manifest.json\` with complete hashes): [${artifactName}](${runUrl})`,
    `5. **Cross-check with the gate verdict** above \u2014 the trace hash must match what appears in the Assurance Gate comment on this PR`,
    ``,
    `_Posted by the ci-artefact-attachment pipeline adapter (github-actions) \u00b7 [View run](${runUrl})_`,
  ].join('\n');
}

module.exports = { loadPipelineStories, classifyArtefact, parseACs, buildAuditComment };
