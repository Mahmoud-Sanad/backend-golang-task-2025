const { PrismaClient: ServerPrismaClient } = require("./generated/server_config");
const { PrismaClient: PaymentPrismaClient } = require("./generated/payment_db");
const { PrismaClient: StandardPrismaClient } = require("./generated/standard_db");
const { PrismaPg } = require("@prisma/adapter-pg");

const server = new ServerPrismaClient({
  adapter: new PrismaPg({ url: process.env.SERVER_CONFIG_DATABASE_URL })
});
const payment = new PaymentPrismaClient({
  adapter: new PrismaPg({ url: process.env.DATABASE_URL })
});
const standard = new StandardPrismaClient({
  adapter: new PrismaPg({ url: process.env.STANDARD_DATABASE_URL })
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