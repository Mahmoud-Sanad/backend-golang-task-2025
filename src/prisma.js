require("dotenv/config");

const { PrismaClient: ServerPrismaClient } = require("./generated/server_config");
const { PrismaClient: PaymentPrismaClient } = require("./generated/payment_db");
const { PrismaClient: StandardPrismaClient } = require("./generated/standard_db");
const { PrismaPg } = require("@prisma/adapter-pg");

const server = new ServerPrismaClient({
  adapter: new PrismaPg({ database: process.env.SERVER_CONFIG_DATABASE,user: process.env.USER_DB, password: process.env.PASSWORD_DB , host: process.env.HOST_DB || 'localhost', port: process.env.PORT_DB || 5432 })
});
const payment = new PaymentPrismaClient({
  adapter: new PrismaPg({ database: process.env.DATABASE ,user: process.env.USER_DB, password: process.env.PASSWORD_DB , host: process.env.HOST_DB || 'localhost', port: process.env.PORT_DB || 5432 })
});
const standard = new StandardPrismaClient({
  adapter: new PrismaPg({ database: process.env.STANDARD_DATABASE ,user: process.env.USER_DB, password: process.env.PASSWORD_DB , host: process.env.HOST_DB || 'localhost', port: process.env.PORT_DB || 5432 })
});

async function disconnect() {
  await Promise.all([server.$disconnect(), payment.$disconnect(), standard.$disconnect()]);
}

module.exports = {
  server,
  payment,
  standard,
  disconnect,
};