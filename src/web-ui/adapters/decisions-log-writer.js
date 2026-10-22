'use strict';
// decisions-log-writer.js (ppc-s2, AC4) -- appends a SCOPE note to a
// tenant's own decisions.md when a capture-all run exceeds discovery.md's
// named 60s synchronous-capture threshold. Reuses the existing
// fetchArtefact/commitArtefact adapters (the same tenant-scoped GitHub
// Contents API mechanism already used for DoD screenshot evidence) rather
// than a local filesystem write, which would target the WRONG repo
// entirely on this multi-tenant surface -- decisions.md for a given
// tenant's feature lives in THAT tenant's connected repo
// (artefacts/<slug>/decisions.md), not this skills-repo's own.
//
// Plain function + setter DI (matches setJourneyStoreModule's convention),
// not a D37 throwing-stub adapter -- this has a safe, self-contained real
// default and no DoR AC requires separate production wiring (ppc-s2-dor
// H-ADAPTER: N/A).

var { fetchRepoPath, ArtefactNotFoundError } = require('./artefact-fetcher');
// realCommitArtefact (not the D37-wrapped commitArtefact/getArtefactCommitAdapter)
// is called directly here -- this module's own injectable DI boundary is at
// the appendScopeNote/setDecisionsLogWriter level, one layer up, so a test
// of realAppendScopeNote supplies a mocked global.fetch rather than also
// having to wire artefact-commit-writer's separate D37 adapter.
var { realCommitArtefact } = require('./artefact-commit-writer');

function _buildScopeNoteEntry(payload) {
  var dateStr = new Date().toISOString().slice(0, 10);
  var seconds = (payload.durationMs / 1000).toFixed(1);
  return '\n**' + dateStr + ' | SCOPE | Capture-all run for `' + payload.featureSlug + '` exceeded the 60s synchronous-capture threshold**\n' +
    '**Finding:** A capture-all run measured ' + seconds + 's of real elapsed wall-clock time, exceeding `discovery.md`\'s own 60-second named trigger condition for revisiting the synchronous-capture decision.\n' +
    '**Decision:** Not made here -- this is an automatically-logged SCOPE note, not a decision. Capture remains synchronous per `ppc-s2`\'s own Architecture Constraints until a human revisits this.\n' +
    '**Rationale:** `discovery.md`\'s own trigger-mechanics decision named this exact condition as the point to re-open the async-vs-sync question, rather than silently absorbing a slow run as "done."\n' +
    '**Made by:** Automated (ppc-s2 capture-all route), logged for human follow-up.\n' +
    '**Revisit trigger:** A human should review whether async capture is now warranted for this feature.\n' +
    '\n---\n';
}

/**
 * @param {{featureSlug:string}} journey
 * @param {{owner:string, repo:string}} ownerRepo
 * @param {string} token - req.session.accessToken
 * @param {{featureSlug:string, durationMs:number}} payload
 */
async function realAppendScopeNote(journey, ownerRepo, token, payload) {
  var decisionsPath = 'artefacts/' + journey.featureSlug + '/decisions.md';
  var existingContent;
  try {
    // ppc-s2 code-quality fix: read via fetchRepoPath at this EXACT literal
    // path, not fetchArtefact's multi-prefix (archived-fallback) resolution.
    // fetchArtefact can resolve via 'artefacts/archived/<slug>/decisions.md'
    // while the write below always targets the non-archived path, so a read
    // that silently followed the archived prefix would commit the appended
    // content to a different, brand-new file and leave the real archived
    // decisions.md stale. Using the same literal path for both read and
    // write eliminates that mismatch by construction. No archived-prefix
    // fallback is needed here: capture-all is only ever invoked against a
    // feature currently passing DoD (definition-of-done) review (see
    // _resolveJourney's isDodComplete check in playback-evidence.js), never
    // a cold-archived one.
    existingContent = await fetchRepoPath(ownerRepo.owner, ownerRepo.repo, decisionsPath, token);
  } catch (err) {
    if (!(err instanceof ArtefactNotFoundError)) throw err;
    existingContent = '# Decisions: ' + journey.featureSlug + '\n\n---\n';
  }
  var newContent = existingContent + _buildScopeNoteEntry(payload);
  await realCommitArtefact(decisionsPath, newContent, token, ownerRepo.owner, ownerRepo.repo);
}

var _writer = realAppendScopeNote;
function setDecisionsLogWriter(fn) { _writer = fn; }
function appendScopeNote(journey, ownerRepo, token, payload) { return _writer(journey, ownerRepo, token, payload); }
function _resetDecisionsLogWriter() { _writer = realAppendScopeNote; }

module.exports = { appendScopeNote, setDecisionsLogWriter, realAppendScopeNote, _resetDecisionsLogWriter, _buildScopeNoteEntry };
