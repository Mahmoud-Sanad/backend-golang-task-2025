const express = require("express");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/routeUtils");
const { standard } = require("../prisma");
const { createNotificationHandlers } = require("../handlers/notificationHandler");
const { createLogHandlers } = require("../handlers/logHandler");

function standardRoutes() {
  const router = express.Router();
  const notifications = createNotificationHandlers(standard);
  const logs = createLogHandlers(standard);

  router.post(
    "/notifications",
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
    catchAsync(notifications.updateNotification)
  );

  router.delete(
    "/notifications/:id",
    catchAsync(notifications.deleteNotification)
  );

  router.post(
    "/logs",
    catchAsync(logs.createLog)
  );

  router.get(
    "/logs",
    catchAsync(logs.listLogs)
  );

  router.get(
    "/logs/:id",
    catchAsync(logs.getLog)
  );

  router.put(
    "/logs/:id",
    catchAsync(logs.updateLog)
  );

  router.delete(
    "/logs/:id",
    catchAsync(logs.deleteLog)
  );

  return router;
}

module.exports = standardRoutes;
