const prisma = require("../prisma").payment;

async function createTransaction(data) {
  return prisma.transaction.create({ data });
}

async function listTransactions() {
  return prisma.transaction.findMany();
}

async function getTransaction(id) {
  return prisma.transaction.findUnique({
    where: { id: Number(id) }
  });
}

async function updateTransaction(id, data) {
  return prisma.transaction.update({
    where: { id: Number(id) },
    data
  });
}

async function deleteTransaction(id) {
  return prisma.transaction.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction
};