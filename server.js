require("dotenv/config");

const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const config = require("./src/config");
const { disconnect } = require("./src/prisma");
const WebSocketService = require("./src/websocket/websocketService");
const { createRoutes } = require("./src/routes");

const {
  registerServer,
  markServerOffline
} = require("./src/peerRegistry");

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const wsManager = new WebSocketService();
app.use("/", createRoutes(wsManager));
wsManager.attachWebSocketServer(wss);


async function shutdown() {
  console.log("\nShutting down...");
  await markServerOffline();
  await disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


async function start() {
  if (!config.serverId) {
    throw new Error("SERVER_ID is required in .env");
  }

  await registerServer();

  httpServer.listen(config.port, async () => {
    console.log(
      `✅ ${config.serverId} server running on port ${config.port}`
    );
    await wsManager.loadPeers();
    wsManager.startHeartbeat();
    console.log("WebSocket service started");
  });

  setInterval(registerServer, config.serverRegisterIntervalMs);
  setInterval(() => wsManager.loadPeers(), config.peerReloadIntervalMs);
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});