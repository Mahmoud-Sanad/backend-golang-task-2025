const express = require('express');
const catchAsync = require('../utils/catchAsync');
const adminHandlers = require('../handlers/adminHandler');
const productStockHandlers = require('../handlers/productStockHandler');
const { checkServer } = require('../middlewares/serverMiddleware');

function adminRoutes() {
  const router = express.Router();

  router.get('/dashboard',checkServer("PAYMENT"), catchAsync(adminHandlers.getDashboard));

  router.get('/users', catchAsync(adminHandlers.listUsers));
  router.get('/users/:id', catchAsync(adminHandlers.getUser));
  router.put('/users/:id', catchAsync(adminHandlers.updateUser));
  router.put('/users/:id/disable', catchAsync(adminHandlers.disableUser));
  router.put('/users/:id/enable', catchAsync(adminHandlers.enableUser));
  router.get('/inventory/low-stock',checkServer("PAYMENT"), catchAsync(productStockHandlers.lowStock));

  return router;
}

module.exports = adminRoutes;
