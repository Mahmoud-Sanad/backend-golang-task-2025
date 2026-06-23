const prisma = require("../prisma").payment;

async function createOrder(data) {
  return prisma.order.create({ data });
}

async function listOrders() {
  return prisma.order.findMany();
}

async function getOrder(id) {
  return prisma.order.findUnique({
    where: { id: Number(id) }
  });
}

async function updateOrder(id, data) {
  return prisma.order.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteOrder(id) {
  return prisma.order.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
};