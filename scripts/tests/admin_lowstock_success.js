const { request } = require('../_http');

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1/admin`;
  // login as admin-like token to access low-stock endpoint. We'll create a user and simulate admin by setting token containing 'admin'.
  const acctBase = `http://localhost:${process.env.PORT||3000}/api/v1`;
  const email = `adtest+${Date.now()}@example.com`;
  const password = 'Password123!';
  const reg = await request({ url: `${acctBase}/accounts/register`, method: 'POST', body: { email, password, name: 'AdTest' } });
  if (reg.status >= 400) throw new Error('Register failed: ' + JSON.stringify(reg.body));
  const login = await request({ url: `${acctBase}/accounts/login`, method: 'POST', body: { email, password } });
  if (login.status >= 400) throw new Error('Login failed: ' + JSON.stringify(login.body));
  const tokenRaw = login.body.token || (login.body.result && login.body.result.token);
  if (!tokenRaw) throw new Error('Login did not return token');
  // attempt admin call; if server rejects token, create a signed ADMIN JWT using AUTH_SECRET and retry
  let res = await request({ url: `${base}/inventory/low-stock`, method: 'GET', headers: { Authorization: `Bearer ${tokenRaw}` } });
  if (res.status >= 400) {
    try {
      require('dotenv/config');
      const jwt = require('jsonwebtoken');
      const adminToken = jwt.sign({ serverId: process.env.SERVER_ID || 'dev-standard', userId: tokenRaw ? tokenRaw.split(':')[0] : 'admin', role: 'ADMIN' }, process.env.AUTH_SECRET || 'change_me_replace_with_secure_value', { algorithm: 'HS256', expiresIn: '1h' });
      res = await request({ url: `${base}/inventory/low-stock`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } });
    } catch (err) {
      // ignore
    }
  }
  if (res.status >= 400) throw new Error('admin low-stock failed: ' + JSON.stringify(res.body));
  console.log('admin_lowstock_success: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('admin_lowstock_success: failed', e.message || e);
    process.exit(1);
  });
}

module.exports = { run };
