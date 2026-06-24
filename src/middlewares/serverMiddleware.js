const prisma = require("../prisma").server;
const config = require("../config");

function checkServer(serverType) {
  return async (req, res, next) => {
    const serverId = config.serverId;
    const serverConfig = await prisma.server.findUnique({ where: { serverId } });

    if (!serverConfig) {
      return next(new Error(`Server configuration not found for serverId: ${serverId}`));
    }

    if (serverConfig.serverType === serverType) {
      return next();
    }

    const targetServer = await prisma.server.findFirst({ where: { serverType } });
    if (!targetServer) {
      return next(new Error(`No server configuration found for serverType: ${serverType}`));
    }

    const host = targetServer.host || "localhost";
    const port = targetServer.port ? `:${targetServer.port}` : "";
    const protocol = host.startsWith("http://") || host.startsWith("https://")
      ? ""
      : "http://";

    const redirectUrl = `${protocol}${host}${port}${req.originalUrl}`;
    return res.redirect(307, redirectUrl);
  };
}

module.exports = {
  checkServer,
};