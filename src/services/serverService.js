const prisma = require("../prisma").server;

async function getServerConfigByServerId(serverId) {
  return prisma.server.findUnique({
    where: { serverId }
  });
}

async function saveServerDeviceId(serverId, deviceId) {
  return prisma.server.update({
    where: { serverId },
    data: { deviceId }
  });
}

module.exports = {
  getServerConfigByServerId,
  saveServerDeviceId
};
