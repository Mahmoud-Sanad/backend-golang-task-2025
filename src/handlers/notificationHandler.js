 function createNotificationHandlers(prismaClient) {
  const { sendSuccess } = require("../utils/routeUtils");
  const { generateId } = require("../utils/idGenerator");
  const config = require("../config");

  async function createNotification(req, res) {
    const data = req.body || {};
    const id = data.id || generateId(config.serverId);
    const result = await prismaClient.notification.create({ data: { ...data, id } });
    return sendSuccess(res, result);
  }

  async function listNotifications(req, res) {
    const result = await prismaClient.notification.findMany();
    return sendSuccess(res, result);
  }

  async function getNotification(req, res) {
    const id = req.params.id;
    const result = await prismaClient.notification.findUnique({ where: { id: String(id) } });
    return sendSuccess(res, result);
  }

  async function updateNotification(req, res) {
    const id = req.params.id;
    const data = req.body || {};
    const result = await prismaClient.notification.update({ where: { id: String(id) }, data });
    return sendSuccess(res, result);
  }

  async function deleteNotification(req, res) {
    const id = req.params.id;
    const result = await prismaClient.notification.delete({ where: { id: String(id) } });
    return sendSuccess(res, result);
  }

  return {
    createNotification,
    listNotifications,
    getNotification,
    updateNotification,
    deleteNotification,
  };
}

module.exports = {
  createNotificationHandlers,
};