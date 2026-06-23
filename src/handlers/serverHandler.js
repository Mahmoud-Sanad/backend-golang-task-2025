const prisma = require("../prisma").server;

async function createServer(data) {
  return prisma.server.create({ data });
}

async function listServers() {
  return prisma.server.findMany();
}

async function getServer(serverId) {
  return prisma.server.findUnique({
    where: { serverId }
  });
}

async function updateServer(serverId, data) {
  return prisma.server.update({
    where: { serverId },
    data
  });
}

async function deleteServer(serverId) {
  return prisma.server.delete({
    where: { serverId }
  });
}

module.exports = {
  createServer,
  listServers,
  getServer,
  updateServer,
  deleteServer
};