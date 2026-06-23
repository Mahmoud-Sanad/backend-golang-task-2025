const prisma = require("../prisma").payment;

async function createProductStock(data) {
  return prisma.productStock.create({ data });
}

async function listProductStocks() {
  return prisma.productStock.findMany();
}

async function getProductStock(id) {
  return prisma.productStock.findUnique({
    where: { id: Number(id) }
  });
}

async function updateProductStock(id, data) {
  return prisma.productStock.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteProductStock(id) {
  return prisma.productStock.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  createProductStock,
  listProductStocks,
  getProductStock,
  updateProductStock,
  deleteProductStock
};