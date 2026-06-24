const { request } = require('../_http');

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1/payments`;
  // register/login to obtain token then list products
  const acctBase = `http://localhost:${process.env.PORT||3000}/api/v1`;
  const email = `ptest+${Date.now()}@example.com`;
  const password = 'Password123!';
  const reg = await request({ url: `${acctBase}/accounts/register`, method: 'POST', body: { email, password, name: 'PTest' } });
  if (reg.status >= 400) throw new Error('Register failed: ' + JSON.stringify(reg.body));
  const login = await request({ url: `${acctBase}/accounts/login`, method: 'POST', body: { email, password } });
  if (login.status >= 400) throw new Error('Login failed: ' + JSON.stringify(login.body));
  const token = login.body.token || (login.body.result && login.body.result.token);
  if (!token) throw new Error('Login did not return token');
  const list = await request({ url: `${base}/products`, method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  if (list.status >= 400) throw new Error('listProducts failed: ' + JSON.stringify(list.body));
  console.log('products_success: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('products_success: failed', e.message || e);
    process.exit(1);
  });
}

module.exports = { run };
