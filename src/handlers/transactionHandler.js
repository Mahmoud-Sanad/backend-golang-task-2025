const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");
const { sendSuccess } = require("../utils/routeUtils");

async function createTransaction(req, res) {
  const data = req.body || {};
  const id = data.id || generateId(config.serverId);
  const result = await prisma.transaction.create({ data: { ...data, id } });
  return sendSuccess(res, result);
}

async function listTransactions(req, res) {
  const result = await prisma.transaction.findMany();
  return sendSuccess(res, result);
}

async function getTransaction(req, res) {
  const id = req.params.id;
  const result = await prisma.transaction.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function updateTransaction(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const result = await prisma.transaction.update({ where: { id: String(id) }, data });
  return sendSuccess(res, result);
}

async function deleteTransaction(req, res) {
  const id = req.params.id;
  const result = await prisma.transaction.delete({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
};