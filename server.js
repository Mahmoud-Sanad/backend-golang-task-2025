require("dotenv/config");

const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const swaggerUiDist = require("swagger-ui-dist");

const config = require("./src/config");
const { disconnect } = require("./src/prisma");
const WebSocketService = require("./src/websocket/websocketService");
const { createRoutes } = require("./src/router");

const {
  registerServer,
  markServerOffline
} = require("./src/peerRegistry");

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const wsManager = new WebSocketService();
app.get("/api/v1/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "openapi.json"));
});

app.use("/api/v1/docs/static", express.static(swaggerUiDist.getAbsoluteFSPath()));

app.get("/api/v1/docs", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Documentation</title>
    <link rel="stylesheet" href="/api/v1/docs/static/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/v1/docs/static/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        SwaggerUIBundle({
          url: '/api/v1/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
          tryItOutEnabled: true,
          validatorUrl: null
        });
      };
    </script>
  </body>
</html>`);
});

// Mount all API routes under /api/v1
app.use("/api/v1", createRoutes(wsManager));



app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

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

  setInterval(() => wsManager.loadPeers(), config.peerReloadIntervalMs);
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});