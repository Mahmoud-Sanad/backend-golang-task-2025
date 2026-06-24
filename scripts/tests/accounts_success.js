const { request } = require('../_http');

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1`;
  // register
  const email = `test+${Date.now()}@example.com`;
  const password = 'Password123!';
    const reg = await request({ url: `${base}/accounts/register`, method: 'POST', body: { email, password, name: 'Test User' } });
    if (reg.status >= 400) throw new Error('Register failed: ' + JSON.stringify(reg.body));
    const login = await request({ url: `${base}/accounts/login`, method: 'POST', body: { email, password } });
    if (login.status >= 400) throw new Error('Login failed: ' + JSON.stringify(login.body));
    const token = login.body.token || (login.body.result && login.body.result.token);
    if (!token) throw new Error('Login did not return token');
  // getMe
  const me = await request({ url: `${base}/accounts/me`, method: 'GET', headers: { authorization: `Bearer ${token}` } });
  if (me.status >= 400) throw new Error('getMe failed: ' + JSON.stringify(me.body));
  // updateMe
  const up = await request({ url: `${base}/accounts/me`, method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { name: 'Updated' } });
  if (up.status >= 400) throw new Error('updateMe failed: ' + JSON.stringify(up.body));
  console.log('accounts_success: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('accounts_success: failed', e.message || e);
    process.exit(1);
  });
}

module.exports = { run };
