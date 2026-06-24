const express = require("express");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/routeUtils");
const {
  createServer,
  listServers,
  getServer,
  updateServer,
  deleteServer
} = require("../handlers/serverHandler");

function serverRoutes() {
  const router = express.Router();

  router.post(
    "/",
    catchAsync(createServer)
  );

  router.get(
    "/",
    catchAsync(listServers)
  );

  router.get(
    "/:serverId",
    catchAsync(getServer)
  );

  router.put(
    "/:serverId",
    catchAsync(updateServer)
  );

  router.delete(
    "/:serverId",
    catchAsync(deleteServer)
  );

  return router;
}

module.exports = serverRoutes;
