const express = require("express");
const { sendSuccess, sendError } = require("../utils/routeUtils");

function peerRoutes(wsManager) {
  const router = express.Router();

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

  return router;
}

module.exports = peerRoutes;
