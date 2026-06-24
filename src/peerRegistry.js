const { randomUUID } = require("crypto");
const prisma = require("./prisma").server;
const config = require("./config");

async function registerServer() {
  const now = new Date();
  const wsUrl = `ws://${config.host}:${config.port}`;

  const data = {
    serverId: config.serverId,
    host: config.host,
    port: config.port,
    wsUrl,
    serverType: config.serverType,
    deviceId: config.deviceId
  };

  console.log("Registering server:", data);

  for (const field of ["serverId", "host", "port", "wsUrl", "serverType"]) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new Error(`Missing required Server field: ${field}`);
    }
  }

  await prisma.server.upsert({
    where: {
      serverId: data.serverId
    },
    update: {
      host: data.host,
      port: data.port,
      wsUrl: data.wsUrl,
      serverType: data.serverType,
      deviceId: data.deviceId,
      status: "ONLINE",
      updatedAt: now
    },
    create: {
      id: randomUUID(),
      serverId: data.serverId,
      host: data.host,
      port: data.port,
      wsUrl: data.wsUrl,
      serverType: data.serverType,
      deviceId: data.deviceId,
      status: "ONLINE",
      createdAt: now,
      updatedAt: now
    }
  });
}

async function getOnlinePeers() {
  return prisma.server.findMany({
    where: {
      status: "ONLINE",
      serverId: {
        not: config.serverId
      }
    },
    select: {
      serverId: true,
      wsUrl: true
    }
  });
}

async function markServerOffline() {
  await prisma.server.updateMany({
    where: {
      serverId: config.serverId
    },
    data: {
      status: "OFFLINE"
    }
  });
}

module.exports = {
  registerServer,
  getOnlinePeers,
  markServerOffline
};