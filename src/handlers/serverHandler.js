const prisma = require("../prisma").server;
const { sendSuccess } = require("../utils/routeUtils");

async function createServer(req, res) {
  const data = req.body || {};
  const result = await prisma.server.create({ data });
  return sendSuccess(res, result);
}

async function listServers(req, res) {
  const result = await prisma.server.findMany();
  return sendSuccess(res, result);
}

async function getServer(req, res) {
  const serverId = req.params.serverId;
  const result = await prisma.server.findUnique({ where: { serverId } });
  return sendSuccess(res, result);
}

async function updateServer(req, res) {
  const serverId = req.params.serverId;
  const data = req.body || {};
  const result = await prisma.server.update({ where: { serverId }, data });
  return sendSuccess(res, result);
}

async function deleteServer(req, res) {
  const serverId = req.params.serverId;
  const result = await prisma.server.delete({ where: { serverId } });
  return sendSuccess(res, result);
}

module.exports = {
  createServer,
  listServers,
  getServer,
  updateServer,
  deleteServer
};