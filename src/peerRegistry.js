const prisma = require("./prisma").server;
const config = require("./config");

async function registerServer() {
  const wsUrl = `ws://${config.host}:${config.port}`;

  await prisma.server.upsert({
    where: {
      serverId: config.serverId
    },
    create: {
      serverId: config.serverId,
      host: config.host,
      port: config.port,
      serverType: config.serverType,
      wsUrl,
      status: "ONLINE"
    },
    update: {
      host: config.host,
      port: config.port,
      serverType: config.serverType,
      wsUrl,
      status: "ONLINE"
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