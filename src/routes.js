
const express = require("express");
const { server, payment, standard } = require("./prisma");
const {
  createAccount,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount
} = require("./handlers/accountHandler");
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require("./handlers/productHandler");
const {
  createProductStock,
  listProductStocks,
  getProductStock,
  updateProductStock,
  deleteProductStock
} = require("./handlers/productStockHandler");
const {
  createOrderItem,
  listOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem
} = require("./handlers/orderItemHandler");
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
} = require("./handlers/orderHandler");
const {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
} = require("./handlers/transactionHandler");
const {
  createServer,
  listServers,
  getServer,
  updateServer,
  deleteServer
} = require("./handlers/serverHandler");
const {
  createNotificationHandlers
} = require("./handlers/notificationHandler");
const {
  createLogHandlers
} = require("./handlers/logHandler");

const serverNotifications = createNotificationHandlers(server);
const paymentNotifications = createNotificationHandlers(payment);
const standardNotifications = createNotificationHandlers(standard);
const serverLogs = createLogHandlers(server);
const paymentLogs = createLogHandlers(payment);
const standardLogs = createLogHandlers(standard);

function createRoutes(wsManager) {
  const router = express.Router();

  function handleResponse(promise, res) {
    promise
      .then((result) => res.json({ success: true, result }))
      .catch((error) => res.status(500).json({ success: false, error: error.message }));
  }

  function sendSuccess(res, result) {
    res.json({ success: true, result });
  }

  function sendError(res, error) {
    res.status(500).json({ success: false, error: error.message });
  }

  router.post("/send/:peerId", (req, res) => {
    try {
      wsManager.sendToPeer(req.params.peerId, req.body);
      sendSuccess(res, { message: "Message sent to peer" });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/peers", (req, res) => {
    const peers = Array.from(wsManager.peers.keys());
    sendSuccess(res, { peers, count: peers.length });
  });

  router.get("/health", (req, res) => {
    sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
  });

  router.post("/accounts", (req, res) => handleResponse(createAccount(req.body), res));
  router.get("/accounts", (req, res) => handleResponse(listAccounts(), res));
  router.get("/accounts/:id", (req, res) => handleResponse(getAccount(req.params.id), res));
  router.put("/accounts/:id", (req, res) => handleResponse(updateAccount(req.params.id, req.body), res));
  router.delete("/accounts/:id", (req, res) => handleResponse(deleteAccount(req.params.id), res));

  router.post("/servers", (req, res) => handleResponse(createServer(req.body), res));
  router.get("/servers", (req, res) => handleResponse(listServers(), res));
  router.get("/servers/:serverId", (req, res) => handleResponse(getServer(req.params.serverId), res));
  router.put("/servers/:serverId", (req, res) => handleResponse(updateServer(req.params.serverId, req.body), res));
  router.delete("/servers/:serverId", (req, res) => handleResponse(deleteServer(req.params.serverId), res));

  router.post("/payments/products", (req, res) => handleResponse(createProduct(req.body), res));
  router.get("/payments/products", (req, res) => handleResponse(listProducts(), res));
  router.get("/payments/products/:id", (req, res) => handleResponse(getProduct(req.params.id), res));
  router.put("/payments/products/:id", (req, res) => handleResponse(updateProduct(req.params.id, req.body), res));
  router.delete("/payments/products/:id", (req, res) => handleResponse(deleteProduct(req.params.id), res));

  router.post("/payments/product-stocks", (req, res) => handleResponse(createProductStock(req.body), res));
  router.get("/payments/product-stocks", (req, res) => handleResponse(listProductStocks(), res));
  router.get("/payments/product-stocks/:id", (req, res) => handleResponse(getProductStock(req.params.id), res));
  router.put("/payments/product-stocks/:id", (req, res) => handleResponse(updateProductStock(req.params.id, req.body), res));
  router.delete("/payments/product-stocks/:id", (req, res) => handleResponse(deleteProductStock(req.params.id), res));

  router.post("/payments/order-items", (req, res) => handleResponse(createOrderItem(req.body), res));
  router.get("/payments/order-items", (req, res) => handleResponse(listOrderItems(), res));
  router.get("/payments/order-items/:id", (req, res) => handleResponse(getOrderItem(req.params.id), res));
  router.put("/payments/order-items/:id", (req, res) => handleResponse(updateOrderItem(req.params.id, req.body), res));
  router.delete("/payments/order-items/:id", (req, res) => handleResponse(deleteOrderItem(req.params.id), res));

  router.post("/payments/orders", (req, res) => handleResponse(createOrder(req.body), res));
  router.get("/payments/orders", (req, res) => handleResponse(listOrders(), res));
  router.get("/payments/orders/:id", (req, res) => handleResponse(getOrder(req.params.id), res));
  router.put("/payments/orders/:id", (req, res) => handleResponse(updateOrder(req.params.id, req.body), res));
  router.delete("/payments/orders/:id", (req, res) => handleResponse(deleteOrder(req.params.id), res));

  router.post("/payments/transactions", (req, res) => handleResponse(createTransaction(req.body), res));
  router.get("/payments/transactions", (req, res) => handleResponse(listTransactions(), res));
  router.get("/payments/transactions/:id", (req, res) => handleResponse(getTransaction(req.params.id), res));
  router.put("/payments/transactions/:id", (req, res) => handleResponse(updateTransaction(req.params.id, req.body), res));
  router.delete("/payments/transactions/:id", (req, res) => handleResponse(deleteTransaction(req.params.id), res));

  router.post("/server/notifications", (req, res) => handleResponse(serverNotifications.createNotification(req.body), res));
  router.get("/server/notifications", (req, res) => handleResponse(serverNotifications.listNotifications(), res));
  router.get("/server/notifications/:id", (req, res) => handleResponse(serverNotifications.getNotification(req.params.id), res));
  router.put("/server/notifications/:id", (req, res) => handleResponse(serverNotifications.updateNotification(req.params.id, req.body), res));
  router.delete("/server/notifications/:id", (req, res) => handleResponse(serverNotifications.deleteNotification(req.params.id), res));

  router.post("/server/logs", (req, res) => handleResponse(serverLogs.createLog(req.body), res));
  router.get("/server/logs", (req, res) => handleResponse(serverLogs.listLogs(), res));
  router.get("/server/logs/:id", (req, res) => handleResponse(serverLogs.getLog(req.params.id), res));
  router.put("/server/logs/:id", (req, res) => handleResponse(serverLogs.updateLog(req.params.id, req.body), res));
  router.delete("/server/logs/:id", (req, res) => handleResponse(serverLogs.deleteLog(req.params.id), res));

  router.post("/payments/notifications", (req, res) => handleResponse(paymentNotifications.createNotification(req.body), res));
  router.get("/payments/notifications", (req, res) => handleResponse(paymentNotifications.listNotifications(), res));
  router.get("/payments/notifications/:id", (req, res) => handleResponse(paymentNotifications.getNotification(req.params.id), res));
  router.put("/payments/notifications/:id", (req, res) => handleResponse(paymentNotifications.updateNotification(req.params.id, req.body), res));
  router.delete("/payments/notifications/:id", (req, res) => handleResponse(paymentNotifications.deleteNotification(req.params.id), res));

  router.post("/payments/logs", (req, res) => handleResponse(paymentLogs.createLog(req.body), res));
  router.get("/payments/logs", (req, res) => handleResponse(paymentLogs.listLogs(), res));
  router.get("/payments/logs/:id", (req, res) => handleResponse(paymentLogs.getLog(req.params.id), res));
  router.put("/payments/logs/:id", (req, res) => handleResponse(paymentLogs.updateLog(req.params.id, req.body), res));
  router.delete("/payments/logs/:id", (req, res) => handleResponse(paymentLogs.deleteLog(req.params.id), res));

  router.post("/standard/notifications", (req, res) => handleResponse(standardNotifications.createNotification(req.body), res));
  router.get("/standard/notifications", (req, res) => handleResponse(standardNotifications.listNotifications(), res));
  router.get("/standard/notifications/:id", (req, res) => handleResponse(standardNotifications.getNotification(req.params.id), res));
  router.put("/standard/notifications/:id", (req, res) => handleResponse(standardNotifications.updateNotification(req.params.id, req.body), res));
  router.delete("/standard/notifications/:id", (req, res) => handleResponse(standardNotifications.deleteNotification(req.params.id), res));

  router.post("/standard/logs", (req, res) => handleResponse(standardLogs.createLog(req.body), res));
  router.get("/standard/logs", (req, res) => handleResponse(standardLogs.listLogs(), res));
  router.get("/standard/logs/:id", (req, res) => handleResponse(standardLogs.getLog(req.params.id), res));
  router.put("/standard/logs/:id", (req, res) => handleResponse(standardLogs.updateLog(req.params.id, req.body), res));
  router.delete("/standard/logs/:id", (req, res) => handleResponse(standardLogs.deleteLog(req.params.id), res));

  return router;
}

module.exports = { createRoutes };


