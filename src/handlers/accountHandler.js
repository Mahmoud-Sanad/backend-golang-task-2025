const prisma = require("../prisma").standard;
const config = require("../config");
const { getServerConfigByServerId, saveServerDeviceId } = require("../services/serverService");
const { generateId } = require("../utils/idGenerator");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/tokenService");
const { sendSuccess } = require("../utils/routeUtils");

async function loginAccount(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new Error("Missing email or password");
  }
  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) {
    throw new Error("Invalid email or password");
  }
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }
  const token = generateAccessToken({ userId: account.id, serverId: config.serverId, role: account.role });
  account.token = token;
  return sendSuccess(res, account);
}

async function registerAccount(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    throw new Error("Missing email or password");
  }
  const existingAccount = await prisma.account.findUnique({ where: { email } });
  if (existingAccount) {
    throw new Error("Account with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = generateId(config.serverId);
  const account = await prisma.account.create({ data: { email, password: hashedPassword, id, name } });
  const token = generateAccessToken({ userId: account.id, serverId: config.serverId, role: account.role });
  account.token = token;
  return sendSuccess(res, account);
}
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
  // kept for internal usage; not used by routes
  const id = data.id || generateId(config.serverId);
  return prisma.account.create({ data: { ...data, id } });
}

async function listAccounts() {
  return prisma.account.findMany();
}

async function getAccount(id) {
  return prisma.account.findUnique({
    where: { id: String(id) }
  });
}

async function updateAccount(id, data) {
  return prisma.account.update({
    where: { id: String(id) },
    data
  });
}

async function deleteAccount(id) {
  return prisma.account.delete({
    where: { id: String(id) }
  });
}

// Express handlers
async function createAccountHandler(req, res) {
  const data = req.body || {};
  const id = data.id || generateId(config.serverId);
  const result = await prisma.account.create({ data: { ...data, id } });
  return sendSuccess(res, result);
}

async function listAccountsHandler(req, res) {
  const result = await prisma.account.findMany();
  return sendSuccess(res, result);
}

async function getAccountHandler(req, res) {
  const id = req.params.id;
  const result = await prisma.account.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function updateAccountHandler(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const result = await prisma.account.update({ where: { id: String(id) }, data });
  return sendSuccess(res, result);
}

async function deleteAccountHandler(req, res) {
  const id = req.params.id;
  const result = await prisma.account.delete({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function getMe(req, res) {
  const userId = req.auth?.userId;
  console.log(userId);
  
  if (!userId) throw new Error('Not authenticated');
  const result = await prisma.account.findUnique({
    where: { id: String(userId) },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true }
  });
  return sendSuccess(res, result);
}

async function updateMe(req, res) {
  const userId = req.auth?.userId || req.body.userId;
  if (!userId) throw new Error('Not authenticated');
  const data = req.body || {};
  // only allow updating specific fields
  const allowed = {};
  if (typeof data.name !== 'undefined') allowed.name = data.name;
  if (typeof data.email !== 'undefined') allowed.email = data.email;
  if (typeof data.password !== 'undefined') {
    allowed.password = await bcrypt.hash(String(data.password), 10);
  }

  const result = await prisma.account.update({
    where: { id: String(userId) },
    data: allowed,
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true, updatedAt: true }
  });
  return sendSuccess(res, result);
}

module.exports = {
  loginAccount,
  registerAccount,
  handleAuth,
  authenticateUser,
  authenticatePeer,
  createAccount: createAccountHandler,
  listAccounts: listAccountsHandler,
  getAccount: getAccountHandler,
  updateAccount: updateAccountHandler,
  deleteAccount: deleteAccountHandler,
  getMe,
  updateMe
};
