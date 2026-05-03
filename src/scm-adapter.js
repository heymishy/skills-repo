'use strict';
const { validateArtefactPath } = require('./artefact-path-validator');

let _adapterOverride = null;
function setAdapterForTest(mock) { _adapterOverride = mock; }

function getWuce3Adapter() {
  if (_adapterOverride) { return _adapterOverride; }
  return require('./web-ui/artefacts/artefact-adapter');
}

async function commitArtefact(options) {
  const { path, content, accessToken, userId, sessionId, skillName } = options;
  if (!validateArtefactPath(path)) {
    const err = new Error('INVALID_PATH: path must be under artefacts/');
    err.code = 'INVALID_PATH';
    throw err;
  }
  const commitMessage = 'artefact: commit /' + skillName + ' session output [' + sessionId + ']';
  const adapter = getWuce3Adapter();
  try {
    const result = await adapter.commitArtefact({
      path, content, accessToken, commitMessage,
      author:    { name: userId, email: userId + '@users.noreply.github.com' },
      committer: { name: userId, email: userId + '@users.noreply.github.com' }
    });
    return { sha: result.commit.sha, htmlUrl: result.content.html_url };
  } catch (err) {
    if (err.status === 409 || (err.message && err.message.includes('409'))) {
      const conflictErr = new Error('Artefact already exists \u2014 reload and review before committing');
      conflictErr.code = 'ARTEFACT_CONFLICT';
      conflictErr.existingArtefactUrl = err.existingArtefactUrl || null;
      throw conflictErr;
    }
    throw err;
  }
}

module.exports = { commitArtefact, setAdapterForTest };
