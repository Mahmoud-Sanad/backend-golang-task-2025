const config = {
  serverId: process.env.SERVER_ID,
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "localhost",
  deviceId: process.env.DEVICE_ID || null,
  serverType: process.env.SERVER_TYPE || "STANDARD",
  heartbeatIntervalMs: 6000,
  peerReloadIntervalMs: 15000,
  serverRegisterIntervalMs: 10000,

  db: {
    provider: "postgresql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "db",
  }
};

module.exports = config;