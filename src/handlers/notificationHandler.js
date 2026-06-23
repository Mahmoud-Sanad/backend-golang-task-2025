function createNotificationHandlers(prismaClient) {
  async function createNotification(data) {
    return prismaClient.notification.create({ data });
  }

  async function listNotifications() {
    return prismaClient.notification.findMany();
  }

  async function getNotification(id) {
    return prismaClient.notification.findUnique({
      where: { id: Number(id) }
    });
  }

  async function updateNotification(id, data) {
    return prismaClient.notification.update({
      where: { id: Number(id) },
      data
    });
  }

  async function deleteNotification(id) {
    return prismaClient.notification.delete({
      where: { id: Number(id) }
    });
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