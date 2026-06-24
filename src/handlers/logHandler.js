const config = require("../config");
const { generateId } = require("../utils/idGenerator");

function createLogHandlers(prismaClient) {
  const { sendSuccess } = require("../utils/routeUtils");

  async function createLog(req, res) {
    const data = req.body || {};
    const id =  generateId(config.serverId);
    const result = await prismaClient.log.create({ data: { ...data, id } });
    return sendSuccess(res, result);
  }

  async function listLogs(req, res) {
    const result = await prismaClient.log.findMany();
    return sendSuccess(res, result);
  }

  async function getLog(req, res) {
    const id = req.params.id;
    const result = await prismaClient.log.findUnique({ where: { id: String(id) } });
    return sendSuccess(res, result);
  }

  async function updateLog(req, res) {
    const id = req.params.id;
    const data = req.body || {};
    const result = await prismaClient.log.update({ where: { id: String(id) }, data });
    return sendSuccess(res, result);
  }

  async function deleteLog(req, res) {
    const id = req.params.id;
    const result = await prismaClient.log.delete({ where: { id: String(id) } });
    return sendSuccess(res, result);
  }

  return {
    createLog,
    listLogs,
    getLog,
    updateLog,
    deleteLog,
  };
}

module.exports = {
  createLogHandlers,
};