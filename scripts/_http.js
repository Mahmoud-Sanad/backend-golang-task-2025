const http = require('http');
const https = require('https');
const { URL } = require('url');

function request(options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(options.url || `http://localhost:${process.env.PORT||3000}${options.path||'/'}`);
      const lib = url.protocol === 'https:' ? https : http;
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + (url.search || ''),
        method: options.method || 'GET',
        headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
        timeout: options.timeout || 10000,
      };

      const req = lib.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          const location = res.headers.location;
          if ([301, 302, 307, 308].includes(res.statusCode) && location && redirectCount < 5) {
            const redirectUrl = new URL(location, url).toString();
            resolve(request(Object.assign({}, options, { url: redirectUrl }), redirectCount + 1));
            return;
          }

          let body = data;
          if (contentType.includes('application/json')) {
            try { body = JSON.parse(data); } catch (e) { /* ignore */ }
          }
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      });

      req.on('error', (err) => reject(err));
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { request };
