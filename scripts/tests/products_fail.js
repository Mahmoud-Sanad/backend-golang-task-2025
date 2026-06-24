const { request } = require('../_http');

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1/payments`;
  // register/login to obtain non-admin token and then try to create product which should fail
  const acctBase = `http://localhost:${process.env.PORT||3000}/api/v1`;
  const email = `pfail+${Date.now()}@example.com`;
  const password = 'Password123!';
  const reg = await request({ url: `${acctBase}/accounts/register`, method: 'POST', body: { email, password, name: 'PFail' } });
  if (reg.status >= 400) throw new Error('Register failed: ' + JSON.stringify(reg.body));
  const login = await request({ url: `${acctBase}/accounts/login`, method: 'POST', body: { email, password } });
  if (login.status >= 400) throw new Error('Login failed: ' + JSON.stringify(login.body));
  const token = login.body.token || (login.body.result && login.body.result.token);
  if (!token) throw new Error('Login did not return token');
  const create = await request({ url: `${base}/products`, method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { name: 'X', price: 1.23 } });
  if (create.status < 400) throw new Error('Expected create product without admin to fail');
  console.log('products_fail: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('products_fail: failed', e.message || e);
    process.exit(1);
  });
}

module.exports = { run };
