'use strict';
const http = require('http'); const zlib = require('zlib');
async function start(opts) {
  opts = opts || {}; const events = []; const keys = []; let requests = 0;
  const srv = http.createServer((rq, rs) => {
    const ch = []; rq.on('data', c => ch.push(c));
    rq.on('end', () => {
      requests++;  // counted even when the sink hangs
      if (opts.hang) return;  // never answers
      const reply = () => { rs.writeHead(200, { 'content-type': 'application/json' }); rs.end('{"status":1}'); };
      try {
        let b = Buffer.concat(ch); if (rq.headers['content-encoding'] === 'gzip') b = zlib.gunzipSync(b);
        const j = JSON.parse(b.toString()); if (j.api_key) keys.push(j.api_key);
        (j.batch || [j]).forEach(e => { events.push(e); if (e.api_key) keys.push(e.api_key); });
      } catch (e) {}
      if (opts.delayMs) setTimeout(reply, opts.delayMs); else reply();
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { get requests() { return requests; }, url: 'http://127.0.0.1:' + srv.address().port, events, keys, stop: () => new Promise(r => { srv.closeAllConnections && srv.closeAllConnections(); srv.close(r); }) };
}
module.exports = { start };
