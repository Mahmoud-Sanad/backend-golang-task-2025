const { request } = require('../_http');

function extractId(body) {
  if (!body) return null;
  if (body.result && body.result.id) return body.result.id;
  if (body.id) return body.id;
  if (body.result && Array.isArray(body.result) && body.result[0] && body.result[0].id) return body.result[0].id;
  return null;
}

async function run() {
  const base = `http://localhost:${process.env.PORT||3000}/api/v1`;
  // create admin token
  const email = `artest+${Date.now()}@example.com`;
  const password = 'AdminPass123!';
  await request({ url: `${base}/accounts/register`, method: 'POST', body: { email, password, name: 'ARTest' } });
  const login = await request({ url: `${base}/accounts/login`, method: 'POST', body: { email, password } });
  const tokenRaw = login.body.token || (login.body.result && login.body.result.token);
  if (!tokenRaw) throw new Error('Could not obtain token');
  // sign admin JWT
  const jwt = require('jsonwebtoken');
  require('dotenv/config');
  const adminToken = jwt.sign({ serverId: process.env.SERVER_ID || 'dev-standard', userId: tokenRaw.split(':')[0] || 'admin', role: 'ADMIN' }, process.env.AUTH_SECRET || 'change_me_replace_with_secure_value', { algorithm: 'HS256', expiresIn: '1h' });

  // PRODUCTS (create, list, update)
  const prodCreate = await request({ url: `${base}/payments/products`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { name: 'TestProd', description: 't', price: 9.99, createdBy: 1 } });
  if (prodCreate.status >= 400) throw new Error('create product failed: ' + JSON.stringify(prodCreate.body));
  const productId = extractId(prodCreate.body);
  if (!productId) throw new Error('No product id returned');
  const prodList = await request({ url: `${base}/payments/products`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } });
  if (prodList.status >= 400) throw new Error('list products failed');
  const prodUpdate = await request({ url: `${base}/payments/products/${productId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` }, body: { price: 19.99 } });
  if (prodUpdate.status >= 400) throw new Error('update product failed');

  // PRODUCT STOCK
  const stockCreate = await request({ url: `${base}/payments/product-stocks`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { productId, quantity: 100 } });
  if (stockCreate.status >= 400) throw new Error('create product stock failed');
  const stockId = extractId(stockCreate.body) || (stockCreate.body.result && stockCreate.body.result.id);
  const stockGet = await request({ url: `${base}/payments/product-stocks/${stockId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } });
  if (stockGet.status >= 400) throw new Error('get product stock failed');
  const stockUpdate = await request({ url: `${base}/payments/product-stocks/${stockId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` }, body: { quantity: 90 } });
  if (stockUpdate.status >= 400) throw new Error('update product stock failed');

  // ORDERS (as user)
  const userToken = tokenRaw; // tokenRaw from login is acceptable for user endpoints
  const orderCreate = await request({ url: `${base}/payments/orders`, method: 'POST', headers: { Authorization: `Bearer ${userToken}` }, body: { items: [{ productId, quantity: 1 }], userId: tokenRaw.split(':')[0] } });
  if (orderCreate.status >= 400) throw new Error('create order failed: ' + JSON.stringify(orderCreate.body));
  const orderId = extractId(orderCreate.body) || (orderCreate.body.result && orderCreate.body.result.order && orderCreate.body.result.order.id);

  // TRANSACTIONS (admin)
  const txCreate = await request({ url: `${base}/payments/transactions`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { orderId, amount: 19.99, status: 'PAID' } });
  if (txCreate.status >= 400) throw new Error('create transaction failed');
  const txId = extractId(txCreate.body);
  const txUpdate = await request({ url: `${base}/payments/transactions/${txId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` }, body: { status: 'REFUND' } });
  if (txUpdate.status >= 400) throw new Error('update transaction failed');

  // NOTIFICATIONS
  const notifCreate = await request({ url: `${base}/payments/notifications`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { title: 'Hi', message: 'Test', meta: {} } });
  if (notifCreate.status >= 400) throw new Error('create notification failed');

  // LOGS
  const logCreate = await request({ url: `${base}/payments/logs`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { level: 'INFO', message: 'test log' } });
  if (logCreate.status >= 400) throw new Error('create log failed');

  console.log('all_routes: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('all_routes: failed', e.message || e, e.stack || '');
    process.exit(1);
  });
}

module.exports = { run };
