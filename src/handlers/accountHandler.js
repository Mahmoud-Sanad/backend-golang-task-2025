const prisma = require("../prisma").standard;
const config = require("../config");
const { getServerConfigByServerId, saveServerDeviceId } = require("../services/serverService");


async function handleAuth(socket, message, ws) {
  const peerClaim = message.peer === true;
  const msisdn = message.msisdn;
  const deviceId = message.deviceId;

  if (!msisdn) {
    return ws.sendRaw(socket, {
      method: "AUTH_ERROR",
      error: "AUTH requires msisdn"
    });
  }

  if (peerClaim) {
    return authenticatePeer(socket, { msisdn, deviceId }, ws);
  }

  return authenticateUser(socket, message, ws);
}


async function authenticateUser(socket, message, ws) {
  const userId = message.userId || message.payload?.userId;

  if (!userId) {
    ws.sendRaw(socket, {
      method: "AUTH_ERROR",
      from: config.serverId,
      error: "User AUTH requires userId"
    });
    return;
  }

  ws.saveUserSocket(String(userId), socket);

  ws.sendRaw(socket, {
    method: "AUTH_OK",
    from: config.serverId,
    peer: false,
    userId: String(userId)
  });

  console.log(`✓ User authenticated: ${userId}`);
}


async function authenticatePeer(socket, { msisdn, deviceId }, ws) {
  const peerConfig = await getServerConfigByServerId(msisdn);

  if (!peerConfig) {
    ws.sendRaw(socket, {
      method: "AUTH_ERROR",
      error: "Peer is not registered"
    });
    socket.close();
    return;
  }

  if (!deviceId) {
    ws.sendRaw(socket, {
      method: "AUTH_ERROR",
      error: "Peer AUTH requires deviceId"
    });
    socket.close();
    return;
  }

  if (peerConfig.deviceId && peerConfig.deviceId !== deviceId) {
    ws.sendRaw(socket, {
      method: "AUTH_ERROR",
      error: "Invalid peer deviceId"
    });
    socket.close();
    return;
  }

  if (!peerConfig.deviceId) {
    await saveServerDeviceId(msisdn, deviceId);
  }

  ws.savePeerSocket(msisdn, socket);

  ws.sendRaw(socket, {
    method: "AUTH_OK",
    peer: true,
    from: config.serverId
  });

  console.log(`✓ Peer authenticated: ${msisdn}`);
}

async function createAccount(data) {
  return prisma.account.create({ data });
}

async function listAccounts() {
  return prisma.account.findMany();
}

async function getAccount(id) {
  return prisma.account.findUnique({
    where: { id: Number(id) }
  });
}

async function updateAccount(id, data) {
  return prisma.account.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteAccount(id) {
  return prisma.account.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  handleAuth,
  authenticateUser,
  authenticatePeer,
  createAccount,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount
};
