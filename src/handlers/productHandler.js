const prisma = require("../prisma").payment;

async function createProduct(data) {
  return prisma.product.create({ data });
}

async function listProducts() {
  return prisma.product.findMany();
}

async function getProduct(id) {
  return prisma.product.findUnique({
    where: { id: Number(id) }
  });
}

async function updateProduct(id, data) {
  return prisma.product.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteProduct(id) {
  return prisma.product.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct
};