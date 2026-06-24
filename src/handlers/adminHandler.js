const prismaStandard = require('../prisma').standard;
const prismaPayment = require('../prisma').payment;
const { sendSuccess } = require('../utils/routeUtils');
const { generateId } = require('../utils/idGenerator');

async function getDashboard(req, res) {
  // basic aggregated stats: accounts count, orders count, total sales
  const accountsCount = await prismaStandard.account.count();
  const ordersCount = await prismaPayment.order.count();
  const orders = await prismaPayment.order.findMany({ where: {}, take: 100 });
  const totalSales = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  return sendSuccess(res, { accountsCount, ordersCount, totalSales });
}

async function listUsers(req, res) {
  const users = await prismaStandard.account.findMany();
  return sendSuccess(res, users);
}

async function getUser(req, res) {
  const id = req.params.id;
  const user = await prismaStandard.account.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, user);
}

async function updateUser(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const user = await prismaStandard.account.update({ where: { id: String(id) }, data });
  return sendSuccess(res, user);
}

async function disableUser(req, res) {
  const id = req.params.id;
  const user = await prismaStandard.account.update({ where: { id: String(id) }, data: { status: 'INACTIVE' } });
  return sendSuccess(res, user);
}

async function enableUser(req, res) {
  const id = req.params.id;
  const user = await prismaStandard.account.update({ where: { id: String(id) }, data: { status: 'ACTIVE' } });
  return sendSuccess(res, user);
}

module.exports = {
  getDashboard,
  listUsers,
  getUser,
  updateUser,
  disableUser,
  enableUser,
};
