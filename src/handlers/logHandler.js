function createLogHandlers(prismaClient) {
  async function createLog(data) {
    return prismaClient.log.create({ data });
  }

  async function listLogs() {
    return prismaClient.log.findMany();
  }

  async function getLog(id) {
    return prismaClient.log.findUnique({
      where: { id: Number(id) }
    });
  }

  async function updateLog(id, data) {
    return prismaClient.log.update({
      where: { id: Number(id) },
      data
    });
  }

  async function deleteLog(id) {
    return prismaClient.log.delete({
      where: { id: Number(id) }
    });
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