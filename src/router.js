const express = require("express");
const accountRoutes = require("./routes/accountRoutes");
const serverRoutes = require("./routes/serverRoutes");
const serverResourcesRoutes = require("./routes/serverResourcesRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const standardRoutes = require("./routes/standardRoutes");
const peerRoutes = require("./routes/peerRoutes");
const { isLoggedIn, canAccess } = require("./middlewares/authMiddleware");
const { requestLogger } = require("./middlewares/logger");
const adminRoutes = require('./routes/adminRoutes');
const { checkServer } = require("./middlewares/serverMiddleware");

function createRoutes(wsManager) {
  const router = express.Router();

  // logger should run before handlers
  router.use(requestLogger);

  router.use("/accounts",checkServer("STANDARD"), accountRoutes());
  router.use(isLoggedIn);
  router.use("/server", serverResourcesRoutes());
  
  router.use("/payments",checkServer("PAYMENT"), paymentsRoutes());
  router.use(canAccess("ADMIN"));
  router.use('/admin', adminRoutes());
  router.use("/servers", serverRoutes());

  router.use("/standard", standardRoutes());
  router.use("/", peerRoutes(wsManager));

  return router;
}

module.exports = { createRoutes };
