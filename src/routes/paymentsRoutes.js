const express = require("express");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/routeUtils");
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require("../handlers/productHandler");
const {
  createProductStock,
  listProductStocks,
  getProductStock,
  updateProductStock,
  deleteProductStock
} = require("../handlers/productStockHandler");
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
} = require("../handlers/orderHandler");
const {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
} = require("../handlers/transactionHandler");
const { payment, standard } = require("../prisma");
const { createNotificationHandlers } = require("../handlers/notificationHandler");
const { createLogHandlers } = require("../handlers/logHandler");
const { canAccess } = require("../middlewares/authMiddleware");

function paymentsRoutes() {
  const router = express.Router();
  const notifications = createNotificationHandlers(standard);
  const logs = createLogHandlers(payment);

  router.post(
    "/products",
    canAccess("ADMIN"),
    catchAsync(createProduct)
  );

  router.get(
    "/products",
    catchAsync(listProducts)
  );

  router.get(
    "/products/:id",
    catchAsync(getProduct)
  );

  router.put(
    "/products/:id",
    canAccess("ADMIN"),
    catchAsync(updateProduct)
  );

  router.delete(
    "/products/:id",
    canAccess("ADMIN"),
    catchAsync(deleteProduct)
  );

  router.post(
    "/product-stocks",
    canAccess("ADMIN"),
    catchAsync(createProductStock)
  );

  router.get(
    "/product-stocks",
    canAccess("ADMIN"),
    catchAsync(listProductStocks)
  );

  router.get(
    "/product-stocks/:id",
    canAccess("ADMIN"),
    catchAsync(getProductStock)
  );

  router.put(
    "/product-stocks/:id",
    canAccess("ADMIN"),
    catchAsync(updateProductStock)
  );

  router.delete(
    "/product-stocks/:id",
    canAccess("ADMIN"),
    catchAsync(deleteProductStock)
  );

//   router.post(
//     "/order-items",
//     catchAsync(async (req, res) => {
//       sendSuccess(res, await createOrderItem(req.body));
//     })
//   );

//   router.get(
//     "/order-items",
//     catchAsync(async (req, res) => {
//       sendSuccess(res, await listOrderItems());
//     })
//   );

//   router.get(
//     "/order-items/:id",
//     catchAsync(async (req, res) => {
//       sendSuccess(res, await getOrderItem(req.params.id));
//     })
//   );

//   router.put(
//     "/order-items/:id",
//     catchAsync(async (req, res) => {
//       sendSuccess(res, await updateOrderItem(req.params.id, req.body));
//     })
//   );

//   router.delete(
//     "/order-items/:id",
//     catchAsync(async (req, res) => {
//       sendSuccess(res, await deleteOrderItem(req.params.id));
//     })
//   );

  router.post(
    "/orders",
    catchAsync(createOrder)
  );

  router.get(
    "/orders",
    catchAsync(listOrders)
  );

  router.get(
    "/orders/:id",
    catchAsync(getOrder)
  );

  router.put(
    "/orders/:id",
    canAccess("ADMIN"),
    catchAsync(updateOrder)
  );

  router.delete(
    "/orders/:id",
    canAccess("ADMIN"),
    catchAsync(deleteOrder)
  );

  router.post(
    "/transactions",
    canAccess("ADMIN"),
    catchAsync(createTransaction)
  );

  router.get(
    "/transactions",
    canAccess("ADMIN"),
    catchAsync(listTransactions)
  );

  router.get(
    "/transactions/:id",
    canAccess("ADMIN"),
    catchAsync(getTransaction)
  );

  router.put(
    "/transactions/:id",
    canAccess("ADMIN"),
    catchAsync(updateTransaction)
  );

  router.delete(
    "/transactions/:id",
    canAccess("ADMIN"),
    catchAsync(deleteTransaction)
  );

  router.post(
    "/notifications",
    canAccess("ADMIN"),
    catchAsync(notifications.createNotification)
  );

  router.get(
    "/notifications",
    catchAsync(notifications.listNotifications)
  );

  router.get(
    "/notifications/:id",
    catchAsync(notifications.getNotification)
  );

  router.put(
    "/notifications/:id",
    canAccess("ADMIN"),
    catchAsync(notifications.updateNotification)
  );

  router.delete(
    "/notifications/:id",
    canAccess("ADMIN"),
    catchAsync(notifications.deleteNotification)
  );

  router.post(
    "/logs",
    canAccess("ADMIN"),
    catchAsync(logs.createLog)
  );

  router.get(
    "/logs",
    canAccess("ADMIN"),
    catchAsync(logs.listLogs)
  );

  router.get(
    "/logs/:id",
    canAccess("ADMIN"),
    catchAsync(logs.getLog)
  );

  router.put(
    "/logs/:id",
    canAccess("ADMIN"),
    catchAsync(logs.updateLog)
  );

  router.delete(
    "/logs/:id",
    canAccess("ADMIN"),
    catchAsync(logs.deleteLog)
  );

  return router;
}

module.exports = paymentsRoutes;
