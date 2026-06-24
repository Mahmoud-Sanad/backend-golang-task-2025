const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");
const { sendSuccess } = require("../utils/routeUtils");

async function createProductStock(req, res) {
  const data = req.body || {};
  const id = data.id || generateId(config.serverId);
  const result = await prisma.productStock.create({ data: { ...data, id } });
  return sendSuccess(res, result);
}

async function listProductStocks(req, res) {
  const result = await prisma.productStock.findMany();
  return sendSuccess(res, result);
}

async function getProductStock(req, res) {
  const id = req.params.id;
  const result = await prisma.productStock.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function updateProductStock(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const result = await prisma.productStock.update({ where: { id: String(id) }, data });
  return sendSuccess(res, result);
}

async function deleteProductStock(req, res) {
  const id = req.params.id;
  const result = await prisma.productStock.delete({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function getInventory(req, res) {
  const productId = req.params.id;
  const rows = await prisma.productStock.findMany({ where: { productId: String(productId) } });
  const total = rows.reduce((s, r) => s + Number(r.quantity), 0);
  return sendSuccess(res, { productId, total, rows });
}

async function lowStock(req, res) {
  const threshold = Number(req.query.threshold || 10);
  // group by productId and sum quantities
  const groups = await prisma.productStock.groupBy({ by: ['productId'], _sum: { quantity: true } });
  const low = groups.filter((g) => (g._sum?.quantity || 0) < threshold);
  return sendSuccess(res, { threshold, low });
}

module.exports = {
  createProductStock,
  listProductStocks,
  getProductStock,
  updateProductStock,
  deleteProductStock,
  getInventory,
  lowStock
};
