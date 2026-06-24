// Lightweight mock servers for test runs when real DB-backed servers cannot start.
const express = require('express');
const bodyParser = require('body-parser');

function makeStandardServer(port = 3000) {
  const app = express();
  app.use(bodyParser.json());

  // account register/login/me
  const users = {};

  app.post('/api/v1/accounts/register', (req, res) => {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Missing' });
    const id = `mock_${Date.now()}`;
    const token = `tok_${id}`;
    users[email] = { id, email, name, password, token };
    return res.json({ id, email, name, token });
  });

  app.post('/api/v1/accounts/login', (req, res) => {
    const { email, password } = req.body || {};
    const u = users[email];
    if (!u || u.password !== password) return res.status(401).json({ success: false, error: 'Invalid' });
    return res.json({ ...u });
  });

  app.get('/api/v1/accounts/me', (req, res) => {
    const auth = (req.headers.authorization || '').replace('Bearer ', '');
    const user = Object.values(users).find((u) => u.token === auth);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    return res.json({ id: user.id, email: user.email, name: user.name });
  });

  app.post('/api/v1/accounts/me', (req, res) => {
    const auth = (req.headers.authorization || '').replace('Bearer ', '');
    const user = Object.values(users).find((u) => u.token === auth);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.body.name) user.name = req.body.name;
    if (req.body.password) user.password = req.body.password;
    return res.json({ id: user.id, email: user.email, name: user.name });
  });

  // payments endpoints
  app.get('/api/v1/payments/products', (req, res) => res.json([]));
  app.get('/api/v1/payments/orders', (req, res) => res.json([]));

  // admin low-stock: requires Authorization header with 'admin' token
  app.get('/api/v1/admin/inventory/low-stock', (req, res) => {
    const auth = (req.headers.authorization || '').replace('Bearer ', '');
    if (!auth || !auth.includes('admin')) return res.status(401).json({ success: false, error: 'Unauthorized' });
    return res.json({ threshold: 10, low: [] });
  });

  return app.listen(port, () => console.log(`Mock standard server listening ${port}`));
}

function makePaymentServer(port = 3001) {
  const app = express();
  app.use(bodyParser.json());

  app.get('/api/v1/payments/products', (req, res) => res.json([]));
  app.post('/api/v1/payments/orders', (req, res) => res.json({ success: true, order: null }));

  return app.listen(port, () => console.log(`Mock payment server listening ${port}`));
}

if (require.main === module) {
  const std = makeStandardServer(3000);
  const pay = makePaymentServer(3001);
  process.on('SIGINT', () => {
    std.close(); pay.close(); process.exit(0);
  });
}

module.exports = { makeStandardServer, makePaymentServer };
