'use strict';

/**
 * commitArtefact(artefactPath, content, commitMessage, token, identity) → Promise<{sha, htmlUrl}>
 * Calls GitHub Contents API PUT to create/update a file.
 * identity: { name: string, email: string } — used as author and committer.
 * Throws Error with status:409 property on conflict.
 */
async function commitArtefact(artefactPath, content, commitMessage, token, identity) {
  const owner   = process.env.GITHUB_REPO_OWNER;
  const repo    = process.env.GITHUB_REPO_NAME;
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  const url     = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;

  const encoded = Buffer.from(content, 'utf8').toString('base64');

  const body = {
    message:   commitMessage,
    content:   encoded,
    committer: { name: identity.name, email: identity.email },
    author:    { name: identity.name, email: identity.email }
  };

  const response = await fetch(url, {
    method:  'PUT',
    headers: {
      Authorization:  'Bearer ' + token,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (response.status === 409) {
    const err = new Error('Conflict: artefact has been updated since loaded');
    err.status = 409;
    throw err;
  }

  if (!response.ok) {
    throw new Error('Contents API error: ' + response.status);
  }

  const data = await response.json();
  return {
    sha:     data.commit.sha,
    htmlUrl: data.content.html_url
  };
}

module.exports = { commitArtefact };
