const prisma = require("../prisma").payment;

async function createOrderItem(data) {
  return prisma.orderItem.create({ data });
}

async function listOrderItems() {
  return prisma.orderItem.findMany();
}

async function getOrderItem(id) {
  return prisma.orderItem.findUnique({
    where: { id: Number(id) }
  });
}

async function updateOrderItem(id, data) {
  return prisma.orderItem.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteOrderItem(id) {
  return prisma.orderItem.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  createOrderItem,
  listOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem
};