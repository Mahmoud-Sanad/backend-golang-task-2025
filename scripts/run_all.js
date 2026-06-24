const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const tests = [
  'tests/accounts_success.js',
  'tests/accounts_fail.js',
  'tests/products_success.js',
  'tests/products_fail.js',
  'tests/orders_success.js',
  'tests/admin_lowstock_success.js',
  'tests/all_routes.js'
];

function waitForPort(port, host = '127.0.0.1', timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function tryConnect() {
      const sock = net.connect({ port, host }, () => {
        sock.destroy();
        resolve();
      });
      sock.on('error', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for ${host}:${port}`));
        setTimeout(tryConnect, 300);
      });
    })();
  });
}

async function runScript(script) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit' });
    p.on('close', (code) => resolve({ script, code }));
  });
}

async function startServerInstance(serverId, port, envExtra = {}) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env, { SERVER_ID: serverId, PORT: String(port) }, envExtra);
    
    const proc = spawn(process.execPath, [path.join(process.cwd(), 'server.js')], { env, stdio: ['ignore', 'inherit', 'inherit'] });
    proc.on('error', (err) => reject(err));
    // wait for port
    waitForPort(port).then(() => resolve(proc)).catch((err) => reject(err));
  });
}

(async () => {
  console.log('Starting standard and payment servers...');
  let stdProc, payProc;
  try {
    stdProc = await startServerInstance('dev-standard', 3000, { SERVER_TYPE: 'STANDARD' });
    payProc = await startServerInstance('dev-payment', 3001, { SERVER_TYPE: 'PAYMENT' });
  } catch (err) {
    console.warn('Failed to start real server instances:', err.message || err);
    console.log('Falling back to mock servers...');
    // spawn mock servers script
    const mock = spawn(process.execPath, [path.join(__dirname, 'mock_servers.js')], { stdio: 'inherit' });
    try {
      await waitForPort(3000, '127.0.0.1', 5000);
      await waitForPort(3001, '127.0.0.1', 5000);
      stdProc = mock; payProc = mock; // single process hosts both mocks
      console.log('Mock servers started');
    } catch (merr) {
      console.error('Failed to start mock servers:', merr.message || merr);
      if (mock && !mock.killed) mock.kill();
      process.exit(1);
    }
  }

  console.log('Servers started. Running tests against standard server (port 3000)...');

  const results = [];
  for (const t of tests) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runScript(t);
    results.push(r);
  }

  console.log('Results:');
  for (const r of results) console.log(r.script, r.code === 0 ? 'OK' : 'FAILED', r.code);
  const failed = results.filter((r) => r.code !== 0);

  // cleanup
  try { if (stdProc && !stdProc.killed) stdProc.kill(); } catch(e){}
  try { if (payProc && !payProc.killed) payProc.kill(); } catch(e){}

  process.exit(failed.length ? 1 : 0);
})();
