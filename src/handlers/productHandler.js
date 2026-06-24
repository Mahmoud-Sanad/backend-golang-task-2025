const prisma = require("../prisma").payment;
const config = require("../config");
const { generateId } = require("../utils/idGenerator");
const { sendSuccess } = require("../utils/routeUtils");

async function createProduct(req, res) {
  const data = req.body || {};
  const id = data.id || generateId(config.serverId);
  const result = await prisma.product.create({ data: { ...data, id } });
  return sendSuccess(res, result);
}

async function listProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const where = {};
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip, take: limit })
  ]);
  console.log("list products");
  
  return sendSuccess(res, { items, meta: { total, page, limit } });
}

async function getProduct(req, res) {
  const id = req.params.id;
  const result = await prisma.product.findUnique({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

async function updateProduct(req, res) {
  const id = req.params.id;
  const data = req.body || {};
  const result = await prisma.product.update({ where: { id: String(id) }, data });
  return sendSuccess(res, result);
}

async function deleteProduct(req, res) {
  const id = req.params.id;
  const result = await prisma.product.delete({ where: { id: String(id) } });
  return sendSuccess(res, result);
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct
};