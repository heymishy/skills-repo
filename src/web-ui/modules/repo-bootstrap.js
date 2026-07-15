'use strict';

const path = require('path');
const fs = require('fs');

let _bootstrapAdapter = function() {
  throw new Error('Adapter not wired: bootstrapAdapter. Call setBootstrapAdapter() with a real implementation before use.');
};

async function bootstrapRepo(token, owner, repo, user) {
  return _bootstrapAdapter(token, owner, repo, user);
}

function setBootstrapAdapter(impl) {
  _bootstrapAdapter = impl;
}

function getBootstrapAdapter() {
  return _bootstrapAdapter;
}

async function realBootstrapRepo(token, owner, repo, user) {
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
  const platformRoot = process.env.PLATFORM_ROOT || path.join(__dirname, '../../..');

  async function ghRequest(method, endpoint, body) {
    const url = `${apiBase}${endpoint}`;
    const opts = {
      method: method || 'GET',
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'skills-pipeline-web-ui',
        'Content-Type': 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) {
      throw new Error(`GitHub API error (${method} ${endpoint}): ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  const frameworkDirs = [
    path.join(platformRoot, '.github', 'skills'),
    path.join(platformRoot, '.github', 'templates'),
    path.join(platformRoot, 'scripts')
  ];

  function collectFiles(dir, baseDir = '') {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const relative = path.join(baseDir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        files.push(...collectFiles(full, relative));
      } else {
        files.push({ path: relative.replace(/\\/g, '/'), file: full });
      }
    }
    return files;
  }

  let allFiles = [];
  for (const dir of frameworkDirs) {
    const relRoot = path.relative(platformRoot, dir).replace(/\\/g, '/');
    allFiles.push(...collectFiles(dir, relRoot));
  }

  if (allFiles.length === 0) {
    throw new Error('No framework files found to bootstrap');
  }

  const blobMap = {};
  for (const { path: filePath, file: fileAbsPath } of allFiles) {
    const content = fs.readFileSync(fileAbsPath, 'utf8');
    const blob = await ghRequest('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs`, {
      content: content,
      encoding: 'utf-8'
    });
    blobMap[filePath] = blob.sha;
  }

  const treeEntries = Object.entries(blobMap).map(([filePath, sha]) => ({
    path: filePath,
    mode: '100644',
    type: 'blob',
    sha: sha
  }));

  const tree = await ghRequest('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`, {
    tree: treeEntries,
    base_tree: null
  });

  const commit = await ghRequest('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`, {
    message: 'Bootstrap: Install skills framework',
    tree: tree.sha,
    parents: [],
    author: {
      name: user.login,
      email: `${user.login}@users.noreply.github.com`,
      date: new Date().toISOString()
    },
    committer: {
      name: user.login,
      email: `${user.login}@users.noreply.github.com`,
      date: new Date().toISOString()
    }
  });

  await ghRequest('PATCH', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/master`, {
    sha: commit.sha,
    force: false
  });

  return {
    commitSha: commit.sha,
    files: Object.keys(blobMap),
    message: 'Bootstrap: Install skills framework'
  };
}

module.exports = {
  bootstrapRepo,
  setBootstrapAdapter,
  getBootstrapAdapter,
  realBootstrapRepo
};
