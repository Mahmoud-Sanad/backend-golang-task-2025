const { request } = require('../_http');

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1`;
  // try login with invalid creds
  const login = await request({ url: `${base}/accounts/login`, method: 'POST', body: { email: 'noone@example.com', password: 'bad' } });
  if (login.status < 400) throw new Error('Expected login to fail but it succeeded');
  // now register a valid user and login to obtain token, then call getMe
  const email = `tfail+${Date.now()}@example.com`;
  const password = 'Pass123!';
  const reg = await request({ url: `${base}/accounts/register`, method: 'POST', body: { email, password, name: 'Fail Test' } });
  if (reg.status >= 400) throw new Error('Register in fail test failed: ' + JSON.stringify(reg.body));
  const login2 = await request({ url: `${base}/accounts/login`, method: 'POST', body: { email, password } });
  if (login2.status >= 400) throw new Error('Login (after register) failed: ' + JSON.stringify(login2.body));
  const token = login2.body.token || (login2.body.result && login2.body.result.token);
  if (!token) throw new Error('Login did not return token');
  const me = await request({ url: `${base}/accounts/me`, method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  if (me.status >= 400) throw new Error('getMe failed even with token');
  console.log('accounts_fail: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('accounts_fail: failed', e.message || e);
    process.exit(1);
  });
}

module.exports = { run };
