const { request } = require('../_http');
const jwt = require('jsonwebtoken');

function extractId(body) {
  if (!body) return null;
  if (body.result && body.result.id) return body.result.id;
  if (body.id) return body.id;
  if (body.result && Array.isArray(body.result) && body.result[0] && body.result[0].id) return body.result[0].id;
  return null;
}

function getToken(body) {
  if (!body) return null;
  return body.token || (body.result && body.result.token) || null;
}

function ensureSuccess(response, message) {
  if (!response || response.status >= 400) {
    throw new Error(`${message} failed (${response ? response.status : 'no response'}) ${JSON.stringify(response ? response.body : {})}`);
  }
  return response;
}

async function run() {
  const base = `http://localhost:${process.env.PORT || 3000}/api/v1`;
  const authSecret = process.env.AUTH_SECRET || 'change_me_replace_with_secure_value';
  const serverId = process.env.SERVER_ID || 'dev-standard';
  const now = Date.now();

  // Register and login a user
  const email = `fulltest+${now}@example.com`;
  const password = 'Password123!';
  await ensureSuccess(await request({ url: `${base}/accounts/register`, method: 'POST', body: { email, password, name: 'Full Route Test' } }), 'register');
  const login = await ensureSuccess(await request({ url: `${base}/accounts/login`, method: 'POST', body: { email, password } }), 'login');
  const userToken = getToken(login.body);
  if (!userToken) throw new Error('User token missing');
  const decoded = jwt.verify(userToken, authSecret, { algorithms: ['HS256'] });
  const userId = decoded.userId;
  const adminToken = jwt.sign({ serverId, userId, role: 'ADMIN' }, authSecret, { algorithm: 'HS256', expiresIn: '1h' });

  // Admin account management
  const createdUserEmail = `fulluser+${now}@example.com`;
  const createAccount = await ensureSuccess(await request({
    url: `${base}/accounts`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { email: createdUserEmail, password, name: 'Created User' }
  }), 'create account');
  const createdUserId = extractId(createAccount.body);
  await ensureSuccess(await request({ url: `${base}/accounts`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list accounts');
  await ensureSuccess(await request({ url: `${base}/accounts/${createdUserId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get account by id');
  await ensureSuccess(await request({
    url: `${base}/accounts/${createdUserId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'Created User Updated' }
  }), 'update account');
 

  // Admin dashboard and user workflow
  await ensureSuccess(await request({ url: `${base}/admin/dashboard`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'admin dashboard');
  await ensureSuccess(await request({ url: `${base}/admin/users`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'admin list users');
  await ensureSuccess(await request({ url: `${base}/admin/users/${createdUserId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'admin get user');
  await ensureSuccess(await request({
    url: `${base}/admin/users/${createdUserId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'Admin Updated User' }
  }), 'admin update user');
  await ensureSuccess(await request({
    url: `${base}/admin/users/${createdUserId}/disable`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }), 'admin disable user');
  await ensureSuccess(await request({
    url: `${base}/admin/users/${createdUserId}/enable`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` }
  }), 'admin enable user');
  await ensureSuccess(await request({ url: `${base}/admin/inventory/low-stock`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'admin low stock');

  // Server management
  const serverIdValue = `test-server-${now}`;
  const serverCreate = await ensureSuccess(await request({
    url: `${base}/servers`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { serverId: serverIdValue, host: 'localhost', port: 4001, wsUrl: 'ws://localhost:4001', serverType: 'STANDARD', deviceId: `device-${now}` }
  }), 'create server');
  await ensureSuccess(await request({ url: `${base}/servers`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list servers');
  await ensureSuccess(await request({ url: `${base}/servers/${serverIdValue}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get server');
  await ensureSuccess(await request({
    url: `${base}/servers/${serverIdValue}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { host: '127.0.0.1' }
  }), 'update server');
  await ensureSuccess(await request({ url: `${base}/servers/${serverIdValue}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete server');

  // Server resource notifications and logs
  
  const serverLog = await ensureSuccess(await request({
    url: `${base}/server/logs`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'INFO', message: 'server log test' }
  }), 'create server log');
  const serverLogId = extractId(serverLog.body);
  await ensureSuccess(await request({ url: `${base}/server/logs`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list server logs');
  await ensureSuccess(await request({ url: `${base}/server/logs/${serverLogId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get server log');
  await ensureSuccess(await request({
    url: `${base}/server/logs/${serverLogId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'DEBUG' }
  }), 'update server log');
  await ensureSuccess(await request({ url: `${base}/server/logs/${serverLogId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete server log');

  // Standard notifications and logs
  const standardNotification = await ensureSuccess(await request({
    url: `${base}/standard/notifications`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Standard Notification', message: 'standard notification test', meta: {} }
  }), 'create standard notification');
  const standardNotificationId = extractId(standardNotification.body);
  await ensureSuccess(await request({ url: `${base}/standard/notifications`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list standard notifications');
  await ensureSuccess(await request({ url: `${base}/standard/notifications/${standardNotificationId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get standard notification');
  await ensureSuccess(await request({
    url: `${base}/standard/notifications/${standardNotificationId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Standard Notification Updated' }
  }), 'update standard notification');
  await ensureSuccess(await request({ url: `${base}/standard/notifications/${standardNotificationId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete standard notification');

  const standardLog = await ensureSuccess(await request({
    url: `${base}/standard/logs`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'INFO', message: 'standard log test' }
  }), 'create standard log');
  const standardLogId = extractId(standardLog.body);
  await ensureSuccess(await request({ url: `${base}/standard/logs`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list standard logs');
  await ensureSuccess(await request({ url: `${base}/standard/logs/${standardLogId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get standard log');
  await ensureSuccess(await request({
    url: `${base}/standard/logs/${standardLogId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'ERROR' }
  }), 'update standard log');
  await ensureSuccess(await request({ url: `${base}/standard/logs/${standardLogId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete standard log');

  // Payments: products and stock
  const product = await ensureSuccess(await request({
    url: `${base}/payments/products`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'Full Route Product', description: 'Unit test product', price: 15.5, trackStock: true }
  }), 'create product');
  const productId = extractId(product.body);
  await ensureSuccess(await request({ url: `${base}/payments/products`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list products');
  await ensureSuccess(await request({ url: `${base}/payments/products/${productId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get product');
  await ensureSuccess(await request({
    url: `${base}/payments/products/${productId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { price: 18.5 }
  }), 'update product');

  const productStock = await ensureSuccess(await request({
    url: `${base}/payments/product-stocks`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { productId, quantity: 20 }
  }), 'create product stock');
  const productStockId = extractId(productStock.body);
  await ensureSuccess(await request({ url: `${base}/payments/product-stocks/${productStockId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get product stock');
  await ensureSuccess(await request({
    url: `${base}/payments/product-stocks/${productStockId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { quantity: 25 }
  }), 'update product stock');

  // Orders
  const order1 = await ensureSuccess(await request({
    url: `${base}/payments/orders`,
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { items: [{ productId, quantity: 1 }] }
  }), 'create order 1');
  const order1Id = extractId(order1.body) || (order1.body.result && order1.body.result.order && order1.body.result.order.id);
  await ensureSuccess(await request({ url: `${base}/payments/orders/my`, method: 'GET', headers: { Authorization: `Bearer ${userToken}` } }), 'get my orders');
  await ensureSuccess(await request({ url: `${base}/payments/orders/${order1Id}/status`, method: 'GET', headers: { Authorization: `Bearer ${userToken}` } }), 'get order 1 status');
  await ensureSuccess(await request({ url: `${base}/payments/orders`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list orders');
  await ensureSuccess(await request({ url: `${base}/payments/orders/${order1Id}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get order 1');
  await ensureSuccess(await request({ url: `${base}/payments/orders/${order1Id}/cancel`, method: 'POST', headers: { Authorization: `Bearer ${userToken}` } }), 'cancel order 1');

  const order2 = await ensureSuccess(await request({
    url: `${base}/payments/orders`,
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { items: [{ productId, quantity: 1 }] }
  }), 'create order 2');
  const order2Id = extractId(order2.body) || (order2.body.result && order2.body.result.order && order2.body.result.order.id);
  await ensureSuccess(await request({
    url: `${base}/payments/orders/${order2Id}/status`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'COMPLETED' }
  }), 'update order 2 status');
  await ensureSuccess(await request({
    url: `${base}/payments/orders/${order2Id}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { total: 19.99 }
  }), 'update order 2');

  // Transactions
  const transaction = await ensureSuccess(await request({
    url: `${base}/payments/transactions`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { orderId: order2Id, amount: 19.99, status: 'PAID' }
  }), 'create transaction');
  const transactionId = extractId(transaction.body);
  await ensureSuccess(await request({ url: `${base}/payments/transactions`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list transactions');
  await ensureSuccess(await request({ url: `${base}/payments/transactions/${transactionId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get transaction');
  await ensureSuccess(await request({
    url: `${base}/payments/transactions/${transactionId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: 'REFUND' }
  }), 'update transaction');
  await ensureSuccess(await request({ url: `${base}/payments/transactions/${transactionId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete transaction');

  // Payments notifications and logs
  const paymentNotification = await ensureSuccess(await request({
    url: `${base}/payments/notifications`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Payment Notification', message: 'payment notification test', meta: {} }
  }), 'create payment notification');
  const paymentNotificationId = extractId(paymentNotification.body);
  await ensureSuccess(await request({ url: `${base}/payments/notifications`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list payment notifications');
  await ensureSuccess(await request({ url: `${base}/payments/notifications/${paymentNotificationId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get payment notification');
  await ensureSuccess(await request({
    url: `${base}/payments/notifications/${paymentNotificationId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { title: 'Payment Notification Updated' }
  }), 'update payment notification');
  await ensureSuccess(await request({ url: `${base}/payments/notifications/${paymentNotificationId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete payment notification');

  const paymentLog = await ensureSuccess(await request({
    url: `${base}/payments/logs`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'INFO', message: 'payment log test' }
  }), 'create payment log');
  const paymentLogId = extractId(paymentLog.body);
  await ensureSuccess(await request({ url: `${base}/payments/logs`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'list payment logs');
  await ensureSuccess(await request({ url: `${base}/payments/logs/${paymentLogId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'get payment log');
  await ensureSuccess(await request({
    url: `${base}/payments/logs/${paymentLogId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { level: 'WARN' }
  }), 'update payment log');
  await ensureSuccess(await request({ url: `${base}/payments/logs/${paymentLogId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete payment log');

  // Peer routes
  await ensureSuccess(await request({ url: `${base}/peers`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'peer list');
  await ensureSuccess(await request({ url: `${base}/health`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }), 'peer health');
  await request({ url: `${base}/send/fake-peer`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: { message: 'ping' } });
  await ensureSuccess(await request({ url: `${base}/openapi.json`, method: 'GET' }), 'get openapi spec');

  // Clean up remaining records
  await ensureSuccess(await request({ url: `${base}/payments/products/${productId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete product');
  await ensureSuccess(await request({ url: `${base}/accounts/${createdUserId}`, method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } }), 'delete created user');

  console.log('full_routes: ok');
}

if (require.main === module) {
  run().catch((e) => {
    console.error('full_routes: failed', e.message || e, e.stack || '');
    process.exit(1);
  });
}

module.exports = { run };
