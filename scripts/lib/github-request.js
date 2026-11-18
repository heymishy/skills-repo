'use strict';

// github-request.js -- one small GitHub REST call using only Node built-ins, so
// the promotion scripts (spg-s1) need no npm install on the Actions runner.
// apiUrl is GITHUB_API_URL (https://api.github.com on Actions); tests point it
// at a local fake server.

const http = require('http');
const https = require('https');

function githubRequest(method, apiUrl, pathAndQuery, token) {
  return new Promise(function (resolve, reject) {
    let url;
    try { url = new URL(String(apiUrl).replace(/\/+$/, '') + pathAndQuery); } catch (e) { reject(e); return; }
    const transport = url.protocol === 'http:' ? http : https;
    const req = transport.request(url, {
      method: method,
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'skills-repo-promotion-scripts',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      timeout: 15000
    }, function (res) {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', function (d) { body += d; });
      res.on('end', function () {
        let json = null;
        try { json = body ? JSON.parse(body) : null; } catch (e) { json = null; }
        resolve({ status: res.statusCode, json: json });
      });
    });
    req.on('timeout', function () { req.destroy(new Error('request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { githubRequest };
